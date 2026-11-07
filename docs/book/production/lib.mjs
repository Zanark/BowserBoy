import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
export const escape = value => String(value).replace(/[&<>"']/g, ch =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
export const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const urlPath = value => value.replaceAll('\\', '/');

export async function confined(root, relative) {
  const resolvedRoot = await fs.realpath(root);
  if (path.isAbsolute(relative) || /^[a-z]:/i.test(relative)) throw new Error(`Absolute input: ${relative}`);
  const target = path.resolve(resolvedRoot, relative.replaceAll('/', path.sep));
  const within = path.relative(resolvedRoot, target);
  if (within === '..' || within.startsWith(`..${path.sep}`) || path.isAbsolute(within)) {
    throw new Error(`Input escapes approved root: ${relative}`);
  }
  let current = resolvedRoot;
  for (const piece of within.split(path.sep).filter(Boolean)) {
    current = path.join(current, piece);
    if ((await fs.lstat(current)).isSymbolicLink()) throw new Error(`Linked input rejected: ${relative}`);
  }
  const real = await fs.realpath(target);
  if (real !== target) throw new Error(`Reparse input rejected: ${relative}`);
  return real;
}

export function checkLearning(text, id) {
  const markers = [...text.matchAll(/^#{2,3} ((?:CH|ND)\d{2}-[WRQA]\d{2})\b/gm)].map(match => match[1]);
  if (new Set(markers).size !== markers.length) throw new Error(`Duplicate learning marker in ${id}`);
  for (const role of ['W', 'R', 'Q', 'A']) {
    if (!markers.includes(`${id}-${role}01`)) throw new Error(`Missing ${id}-${role}01`);
  }
  for (const marker of markers) {
    if (!marker.startsWith(`${id}-`)) throw new Error(`Wrong chapter marker: ${marker}`);
    if (marker.includes('-Q') && !markers.includes(marker.replace('-Q', '-A'))) {
      throw new Error(`Unanswered question: ${marker}`);
    }
    if (marker.includes('-A') && !markers.includes(marker.replace('-A', '-Q'))) {
      throw new Error(`Orphan answer: ${marker}`);
    }
  }
  return markers;
}

export function checkFences(text, location) {
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const match = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (!match) continue;
    if (!fence) fence = match[1];
    else if (match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) fence = null;
  }
  if (fence) throw new Error(`Unclosed Markdown fence: ${location}`);
}
