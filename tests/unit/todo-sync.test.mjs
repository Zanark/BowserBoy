import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parseWorkstream, issueBody, assertManagedBody, verificationProblems, githubRedirect, matchesIssueBacklink } from '../../scripts/sync-todos.mjs';

const source = status => `Status: ${status}
Milestone: Preserve local and remote identity.
Dependencies: None
Purpose: A bounded example.
Tasks:
- [ ] Pending human follow-through is not primary completion.
Acceptance criteria:
Stable identity.
Completion evidence:
Local result only.
Completion log:
Dated result.
`;

test('primary statuses do not confuse completion with separate blocked follow-through', () => {
  const done = parseWorkstream('77_EXAMPLE.todo', source('DONE locally; remote publication BLOCKED'));
  assert.equal(done.state, 'closed');
  assert.equal(done.status, 'DONE');
  assert.equal(done.reason, 'completed');
  assert.equal(parseWorkstream('55_EXAMPLE.todo', source('SUPERSEDED')).reason, 'not_planned');
  assert.equal(parseWorkstream('74_EXAMPLE.todo', source('BLOCKED (initial release DONE)')).state, 'open');
  assert.throws(() => parseWorkstream('04_LEDGER.todo', source('ACTIVE')), /Unknown primary status/);
});

test('backlinks do not change managed bodies and human remote edits fail safely', () => {
  const plain = source('NOT_STARTED');
  const linked = plain.replace('\n', '\nGitHub issue: https://github.com/Zanark/BowserBoyAdvance/issues/123\n');
  const stream = parseWorkstream('78_EXAMPLE.todo', plain);
  const body = issueBody(stream, 'Zanark/BowserBoyAdvance', 'TODO');
  assert.equal(issueBody(parseWorkstream('78_EXAMPLE.todo', linked), 'Zanark/BowserBoyAdvance', 'TODO'), body);
  assertManagedBody(body, stream.file);
  assert.throws(() => assertManagedBody(body.replace('bounded example', 'human edit'), stream.file), /conflict/);
  assert.throws(() => assertManagedBody(`${body}\nHuman note`, stream.file), /conflict/);
  assert.throws(() => parseWorkstream('78_EXAMPLE.todo', plain.replace('Purpose:', 'Missing:')), /Missing Purpose/);
});

test('nested code fences stay inside the verbatim workstream projection', () => {
  const stream = parseWorkstream('78_EXAMPLE.todo', `${source('NOT_STARTED')}\n\`\`\`js\nexample\n\`\`\`\n`);
  assert.ok(issueBody(stream, 'Zanark/BowserBoyAdvance', 'TODO').includes('````text\n'));
});

test('historical underlined field headings retain their established schema', () => {
  const historical = source('DONE').replace(/^(Purpose|Tasks|Acceptance criteria|Completion evidence|Completion log):/gm, '$1\n-------\n');
  assert.equal(parseWorkstream('19_EXAMPLE.todo', historical).state, 'closed');
});

test('verification rejects partially visible Project updates and requires all mapped outcomes', () => {
  const row = { bodySha256: createHash('sha256').update('body\n').digest('hex'),
    state: 'closed', reason: 'not_planned', nodeId: 'issue-id', issue: 'issue-url', projectStatus: 'Done' };
  const issue = { body: 'body\r\n', state: 'closed', state_reason: 'not_planned' };
  const item = { content: { id: 'issue-id' }, fieldValueByName: { name: 'Done' } };
  assert.deepEqual(verificationProblems(row, issue, item, 'issue-url'), []);
  assert.deepEqual(verificationProblems(row, issue, { content: item.content }, 'issue-url'), ['Project Status']);
  assert.ok(verificationProblems(row, undefined, undefined, undefined).length >= 4);
});

test('repository rename redirects retain identity without forwarding credentials off-origin', () => {
  assert.equal(githubRedirect('/repositories/123/issues', 'https://api.github.com/repos/old/name/issues'),
    'https://api.github.com/repositories/123/issues');
  for (const target of ['https://example.com/issues', 'http://api.github.com/issues', 'https://user@api.github.com/issues']) {
    assert.throws(() => githubRedirect(target, 'https://api.github.com/'), /Refusing/);
  }
  const issue = { number: 74, html_url: 'https://github.com/owner/renamed/issues/74' };
  assert.equal(matchesIssueBacklink('https://github.com/owner/original/issues/74', issue, 'owner/original'), true);
  assert.equal(matchesIssueBacklink('https://github.com/owner/original/issues/75', issue, 'owner/original'), false);
  assert.equal(Boolean(matchesIssueBacklink('https://github.com/owner/original/issues/74', undefined, 'owner/original')), false);
});
