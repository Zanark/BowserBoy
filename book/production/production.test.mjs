import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { confined, checkLearning, checkFences } from './lib.mjs';

test('reviewed source confinement rejects traversal and linked files', async () => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'bowser-book-test-'));
  try {
    await fs.writeFile(path.join(temporary, 'source.md'), 'approved');
    assert.equal(await confined(temporary, 'source.md'), await fs.realpath(path.join(temporary, 'source.md')));
    await assert.rejects(confined(temporary, '..\\outside.md'), /escapes/);
    await assert.rejects(confined(temporary, 'C:\\private.md'), /Absolute/);
    await fs.mkdir(path.join(temporary, 'approved'));
    await fs.symlink(path.join(temporary, 'approved'), path.join(temporary, 'link'), 'junction');
    await assert.rejects(confined(temporary, 'link'), /Linked/);
  } finally {
    await fs.rm(path.join(temporary, 'link'), { force: true });
    await fs.rm(path.join(temporary, 'source.md'), { force: true });
    await fs.rmdir(path.join(temporary, 'approved'));
    await fs.rmdir(temporary);
  }
});

test('learning inventory rejects wrong pairs even when counts match', () => {
  const valid = ['W01', 'R01', 'Q01', 'A01'].map(suffix => `### CH01-${suffix} - Example`).join('\n');
  assert.equal(checkLearning(valid, 'CH01').length, 4);
  assert.equal(checkLearning(valid.replaceAll('### ', '## '), 'CH01').length, 4);
  assert.throws(() => checkLearning(valid.replace('A01', 'A02'), 'CH01'), /Missing/);
  assert.throws(() => checkLearning(`${valid}\n### CH01-Q02 - Unanswered`, 'CH01'), /Unanswered/);
  assert.throws(() => checkLearning(`${valid}\n### CH01-A02 - Orphan`, 'CH01'), /Orphan/);
  assert.throws(() => checkLearning(`${valid}\n### CH01-Q01 - Duplicate`, 'CH01'), /Duplicate/);
});

test('fence checks catch swallowed chapter content without rejecting nested shorter fences', () => {
  checkFences('````js\n```\n````', 'valid');
  assert.throws(() => checkFences('```mermaid\nA --> B\n', 'broken'), /Unclosed.*broken/);
});
