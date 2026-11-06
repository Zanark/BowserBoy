import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const digest = text => createHash('sha256').update(text).digest('hex');
const normalize = text => text.replaceAll('\r\n', '\n');

export function parseWorkstream(file, text) {
  const id = /^(\d+)_.*\.todo$/.exec(file)?.[1];
  if (!id) throw new Error(`Not a numbered workstream: ${file}`);
  const content = normalize(text).replace(/^GitHub issue:.*\n?/gm, '').trimEnd();
  const status = /^Status:\s*(NOT_STARTED|READY|IN_PROGRESS|IN_REVIEW|BLOCKED|DONE|SUPERSEDED)\b/m.exec(content)?.[1];
  if (!status) throw new Error(`Unknown primary status in ${file}; map it explicitly before import.`);
  for (const field of ['Milestone', 'Dependencies', 'Purpose', 'Tasks', 'Acceptance criteria', 'Completion evidence', 'Completion log']) {
    if (!new RegExp(`^${field}(?::|\\n[-=]+\\n)`, 'm').test(content)) throw new Error(`Missing ${field} in ${file}`);
  }
  if (/(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(content)) {
    throw new Error(`Possible credential in ${file}; refusing to mirror.`);
  }
  const milestone = /^Milestone:\s*(.*)/m.exec(content)[1];
  return {
    id, file, content, status,
    title: `[TODO ${id}] ${milestone}`.slice(0, 256),
    state: ['DONE', 'SUPERSEDED'].includes(status) ? 'closed' : 'open',
    reason: status === 'SUPERSEDED' ? 'not_planned' : 'completed',
    backlink: /^GitHub issue:\s*(.+)$/m.exec(normalize(text))?.[1],
  };
}

export function issueBody(workstream, repository, directory) {
  const marker = `<!-- todo-sync: ${repository}:${workstream.id} -->`;
  const source = `${directory}/${workstream.file}`.split('/').map(encodeURIComponent).join('/');
  const fence = '`'.repeat(Math.max(3, ...[...workstream.content.matchAll(/`+/g)].map(match => match[0].length + 1)));
  const body = `${marker}\nSource: [${directory}/${workstream.file}](https://github.com/${repository}/blob/main/${source})\n\n` +
    `Mirrored workstream; historical results and limitations are retained verbatim. ` +
    `Project status is a tracking stage, not additional verification or human approval.\n\n${fence}text\n${workstream.content}\n${fence}`;
  const result = `${body}\n\n<!-- todo-sync-body-sha256: ${digest(body)} -->`;
  if (result.length > 65000) throw new Error(`Issue body too long: ${workstream.file}`);
  return result;
}

export function assertManagedBody(body, file) {
  const match = /^(.*)\n\n<!-- todo-sync-body-sha256: ([a-f0-9]{64}) -->$/s.exec(normalize(body ?? ''));
  if (!match || digest(match[1]) !== match[2]) {
    throw new Error(`Remote body conflict for ${file}; preserve human edits and reconcile before retrying.`);
  }
}

export function verificationProblems(row, issue, item, backlink) {
  const problems = [];
  if (!issue || digest(normalize(issue.body ?? '')) !== row.bodySha256) problems.push('issue body');
  if (issue?.state !== row.state || (row.reason && issue?.state_reason !== row.reason)) problems.push('issue state/reason');
  if (item?.content?.id !== row.nodeId) problems.push('Project membership');
  if (item?.fieldValueByName?.name !== row.projectStatus) problems.push('Project Status');
  if (backlink !== row.issue) problems.push('local backlink');
  return problems;
}

export function githubRedirect(location, current) {
  const target = new URL(location, current);
  if (target.origin !== 'https://api.github.com' || target.username || target.password) {
    throw new Error('Refusing to forward GitHub credentials outside the GitHub API origin.');
  }
  return target.href;
}

export function matchesIssueBacklink(backlink, issue, repository) {
  return !backlink || backlink === issue?.html_url ||
    (issue && backlink === `https://github.com/${repository}/issues/${issue.number}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--apply' && !/^--only=\d+$/.test(arg))) {
    throw new Error('Usage: node scripts/sync-todos.mjs [--apply] [--only=78]');
  }
  const apply = args.includes('--apply');
  const only = args.find(arg => arg.startsWith('--only='))?.split('=')[1];
  const config = JSON.parse(await fs.readFile(path.join(root, '.github', 'todo-sync.json'), 'utf8'));
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.repository) || !/^[\w-]+$/.test(config.projectOwner)) {
    throw new Error('Invalid configured repository or Project owner.');
  }
  const token = process.env.TODO_SYNC_GITHUB_TOKEN;
  if (!token) throw new Error('TODO_SYNC_GITHUB_TOKEN is unavailable. Supply it locally; never paste it into chat.');
  const directory = path.resolve(root, config.todoDirectory);
  if (path.relative(root, directory).startsWith('..') || directory === root) throw new Error('TODO directory must be inside the repository.');
  const workstreams = [];
  for (const file of (await fs.readdir(directory)).filter(file => /^\d+_.*\.todo$/.test(file)).sort()) {
    if (config.exclude.includes(file)) continue;
    const stream = parseWorkstream(file, await fs.readFile(path.join(directory, file), 'utf8'));
    if (!only || Number(stream.id) === Number(only)) workstreams.push(stream);
  }
  if (!workstreams.length) throw new Error('No matching workstreams.');
  if (new Set(workstreams.map(item => item.id)).size !== workstreams.length) throw new Error('Duplicate workstream identity.');

  async function api(endpoint, method = 'GET', body) {
    let url = `https://api.github.com/${endpoint}`;
    for (let redirects = 0; ; redirects++) {
      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'BowserBOY-TODO-sync',
          ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(60000),
        redirect: 'manual',
      });
      if ([301, 302, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location || redirects === 3) throw new Error(`Missing or excessive GitHub redirects for ${endpoint}.`);
        url = githubRedirect(location, url);
        continue;
      }
      if (!response.ok) throw new Error(`GitHub ${method} ${endpoint}: HTTP ${response.status}; stop and inspect permissions/rate limits before retrying.`);
      return response.status === 204 ? undefined : response.json();
    }
  }
  async function graphql(query, variables) {
    const result = await api('graphql', 'POST', { query, variables });
    if (result.errors?.length) throw new Error(`GitHub GraphQL: ${result.errors.map(error => error.message).join('; ')}`);
    return result.data;
  }
  async function listIssues() {
    const result = [];
    for (let page = 1; ; page++) {
      const batch = await api(`repos/${config.repository}/issues?state=all&per_page=100&page=${page}`);
      result.push(...batch.filter(item => !item.pull_request));
      if (batch.length < 100) return result;
    }
  }
  const repo = await api(`repos/${config.repository}`);
  if (!repo.has_issues || !repo.permissions?.push) throw new Error('Repository issues and write access are required.');
  const projectData = await graphql(`query($owner:String!,$number:Int!) {
    user(login:$owner) { projectV2(number:$number) { id url viewerCanUpdate
      fields(first:100) { pageInfo { hasNextPage } nodes {
        ... on ProjectV2SingleSelectField { id name options { id name } }
      } }
    } }
  }`, { owner: config.projectOwner, number: config.projectNumber });
  const project = projectData.user?.projectV2;
  if (!project?.viewerCanUpdate) throw new Error('Configured Project is missing or not editable.');
  if (project.fields.pageInfo.hasNextPage) throw new Error('Project field inventory exceeded its explicit bound.');
  const field = project.fields.nodes.find(item => item.name === 'Status');
  if (!field) throw new Error('Project Status field is missing.');
  const options = new Map(field.options.map(option => [option.name, option.id]));
  const issues = await listIssues();
  const byMarker = new Map();
  const pattern = /<!-- todo-sync: ([\w./-]+):(\d+) -->/;
  for (const issue of issues) {
    const marker = pattern.exec(issue.body ?? '');
    if (!marker || marker[1] !== config.repository) continue;
    if (byMarker.has(marker[2])) throw new Error(`Duplicate remote identity ${marker[2]}; reconcile before applying.`);
    byMarker.set(marker[2], issue);
  }
  async function listItems() {
    const result = [];
    let cursor = null;
    do {
      const data = await graphql(`query($id:ID!,$cursor:String) {
        node(id:$id) { ... on ProjectV2 { items(first:100,after:$cursor) {
          nodes { id content { ... on Issue { id number } }
            fieldValueByName(name:"Status") { ... on ProjectV2ItemFieldSingleSelectValue { name } }
          } pageInfo { hasNextPage endCursor }
        } } }
      }`, { id: project.id, cursor });
      const page = data.node.items;
      result.push(...page.nodes);
      cursor = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
    } while (cursor);
    return result;
  }
  const items = new Map((await listItems()).filter(item => item.content?.id).map(item => [item.content.id, item]));
  const plans = workstreams.map(stream => {
    const option = config.statusOptions[stream.status];
    if (!options.has(option)) throw new Error(`Missing Project option ${option} for ${stream.file}`);
    const existing = byMarker.get(stream.id);
    if (existing) assertManagedBody(existing.body, stream.file);
    if (!matchesIssueBacklink(stream.backlink, existing, config.repository)) {
      throw new Error(`Unresolved or conflicting backlink in ${stream.file}; do not create a duplicate.`);
    }
    return { stream, existing, body: issueBody(stream, config.repository, config.todoDirectory), option };
  });
  const reportPath = path.resolve(root, config.report);
  if (!path.relative(root, reportPath) || path.relative(root, reportPath).startsWith('..')) throw new Error('Report path must be inside the repository.');
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'preview', repository: config.repository,
    project: project.url, workstreams: plans.length,
    create: plans.filter(plan => !plan.existing).length,
    open: plans.filter(plan => plan.stream.state === 'open').length,
    closed: plans.filter(plan => plan.stream.state === 'closed').length,
    excluded: config.exclude,
    plans: plans.map(plan => ({ id: plan.stream.id, issue: plan.existing?.number ?? null,
      state: plan.stream.state, projectStatus: plan.option })) }, null, 2));
  if (!apply) return;

  let created = 0;
  let updated = 0;
  let lastCreate = 0;
  const completed = [];
  for (const plan of plans) {
    const { stream, body, option } = plan;
    let issue = plan.existing;
    if (!issue) {
      await sleep(Math.max(0, 2000 - (Date.now() - lastCreate)));
      lastCreate = Date.now();
      issue = await api(`repos/${config.repository}/issues`, 'POST', { title: stream.title, body });
      created++;
    }
    const patch = {};
    if (issue.title !== stream.title) patch.title = stream.title;
    if (normalize(issue.body ?? '') !== body) patch.body = body;
    if (issue.state !== stream.state || (stream.state === 'closed' && issue.state_reason !== stream.reason)) {
      patch.state = stream.state;
      patch.state_reason = stream.state === 'closed' ? stream.reason : 'reopened';
    }
    if (Object.keys(patch).length) {
      issue = await api(`repos/${config.repository}/issues/${issue.number}`, 'PATCH', patch);
      updated++;
    }
    // Persist identity before Project operations so a partial run is recoverable.
    const localPath = path.join(directory, stream.file);
    const local = await fs.readFile(localPath, 'utf8');
    const current = parseWorkstream(stream.file, local);
    if (current.content !== stream.content) throw new Error(`Local workstream changed during sync: ${stream.file}`);
    if (current.backlink !== issue.html_url) {
      const eol = local.includes('\r\n') ? '\r\n' : '\n';
      const clean = normalize(local).replace(/^GitHub issue:.*\n?/gm, '');
      const linked = clean.replace(/^(Status:[^\n]*\n)/, `$1GitHub issue: ${issue.html_url}\n`);
      await fs.writeFile(localPath, linked.replaceAll('\n', eol));
    }
    let item = items.get(issue.node_id);
    if (!item) {
      const data = await graphql(`mutation($project:ID!,$issue:ID!) {
        addProjectV2ItemById(input:{projectId:$project,contentId:$issue}) { item { id } }
      }`, { project: project.id, issue: issue.node_id });
      item = data.addProjectV2ItemById.item;
    }
    if (item.fieldValueByName?.name !== option) {
      await graphql(`mutation($project:ID!,$item:ID!,$field:ID!,$option:String!) {
        updateProjectV2ItemFieldValue(input:{projectId:$project,itemId:$item,fieldId:$field,
          value:{singleSelectOptionId:$option}}) { projectV2Item { id } }
      }`, { project: project.id, item: item.id, field: field.id, option: options.get(option) });
    }
    completed.push({ id: stream.id, file: `${config.todoDirectory}/${stream.file}`,
      issue: issue.html_url, number: issue.number, nodeId: issue.node_id, itemId: item.id,
      state: stream.state, reason: stream.state === 'closed' ? stream.reason : null,
      projectStatus: option, bodySha256: digest(body) });
    console.log(`Linked TODO ${stream.id} -> #${issue.number} (${stream.state}, ${option})`);
  }
  for (let attempt = 0; ; attempt++) {
    const verifiedIssues = new Map((await listIssues()).map(issue => [issue.number, issue]));
    const verifiedItems = new Map((await listItems()).map(item => [item.id, item]));
    const failures = [];
    for (const row of completed) {
      const backlink = parseWorkstream(path.basename(row.file), await fs.readFile(path.join(root, row.file), 'utf8')).backlink;
      const problems = verificationProblems(row, verifiedIssues.get(row.number), verifiedItems.get(row.itemId), backlink);
      if (problems.length) failures.push(`TODO ${row.id}: ${problems.join(', ')}`);
    }
    if (!failures.length) break;
    if (attempt === 4) throw new Error(`Read-back verification failed (${failures.join('; ')}). Inspect partial state before retrying.`);
    console.log(`Waiting for GitHub read-back consistency: ${failures.join('; ')}`);
    await sleep(1000 * 2 ** attempt);
  }
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify({ repository: config.repository, project: project.url,
    direction: 'TODO-owned descriptions and completion; remote body edits require reconciliation',
    excluded: config.exclude, verified: completed }, null, 2)}\n`);
  console.log(`Verified ${completed.length} issue/body/state/Project/backlink mappings; created=${created}, updated=${updated}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(`TODO sync failed: ${error.message}`); process.exitCode = 1; });
}
