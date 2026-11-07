import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { confined, checkLearning, checkFences, stripFrontMatter } from './lib.mjs';
import { selectEdition, assertEditionDepth, proseWordCount } from './edition.mjs';

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

test('independent NDS learning IDs retain pairing checks and reject cross-book markers', () => {
  const valid = ['W01', 'R01', 'Q01', 'A01'].map(suffix => `## ND06-${suffix} - Example`).join('\n');
  assert.equal(checkLearning(valid, 'ND06').length, 4);
  assert.throws(() => checkLearning(`${valid}\n## CH06-Q02 - Other book`, 'ND06'), /Wrong chapter/);
  assert.throws(() => checkLearning(`${valid}\n## ND06-Q02 - Unanswered`, 'ND06'), /Unanswered/);
  assert.throws(() => checkLearning(`${valid}\n## ND06-A02 - Orphan`, 'ND06'), /Orphan/);
});

test('modeling learning IDs retain pairing and reject other edition markers', () => {
  const valid = ['W01', 'R01', 'Q01', 'A01'].map(suffix => `## MD19-${suffix} Example`).join('\n');
  assert.equal(checkLearning(valid, 'MD19').length, 4);
  assert.throws(() => checkLearning(`${valid}\n## ND19-Q02 Wrong book`, 'MD19'), /Wrong chapter/);
  assert.throws(() => checkLearning(`${valid}\n## MD19-Q02 Missing answer`, 'MD19'), /Unanswered/);
});

test('edition routes isolate outputs and reject ambiguous selection', () => {
  assert.equal(selectEdition([]).stem, 'Building-a-Little-Escape');
  assert.equal(selectEdition(['--nds']).candidate, '.nds-candidate');
  assert.equal(selectEdition(['--models']).candidate, '.models-candidate');
  assert.equal(selectEdition(['--models']).output[0], 'modeling-book');
  assert.throws(() => selectEdition(['--models', '--nds']), /one book/);
});

test('modeling depth counts actual chapter pages, not openers or repeated ranges', () => {
  const policy = { minimumPages: 200, minimumBodyPages: 200 };
  const chapter = { id: 'MD01', openingPage: 3, startPage: 4, endPage: 203 };
  assert.equal(assertEditionDepth(policy, 203, [chapter]), 200);
  assert.throws(() => assertEditionDepth(policy, 199, []), /actual pages/);
  assert.throws(() => assertEditionDepth(policy, 203, [{ ...chapter, startPage: 5 }]), /chapter-content/);
  assert.throws(() => assertEditionDepth(policy, 203, [{ ...chapter, startPage: 3 }]), /Invalid chapter/);
  assert.throws(() => assertEditionDepth(policy, 203, [{ ...chapter, endPage: 204 }]), /Invalid chapter/);
  assert.throws(() => assertEditionDepth(policy, 203, [
    { ...chapter, endPage: 103 }, { ...chapter, id: 'MD02', endPage: 103 }
  ]), /chapter-content/);
});

test('manuscript depth excludes code, image markup and source URLs', () => {
  const text = 'Real explanatory prose.\n\n```js\nmany fake words in code\n```\n\n' +
    '![Decorative caption words](atlas.png)\n[Actual label](https://example.com/long/path)\n';
  assert.equal(proseWordCount(text), 5);
});

test('modeling metadata and scaffolding do not inflate prose or print as chapter text', () => {
  const text = '---\ntitle: Not explanatory words\n---\n\n# A heading\n\nActual explanation.\n\n' +
    '| Table | Values |\n| --- | --- |\n| repeated | filler |\n\n````js\nfake prose here\n````\n';
  assert.equal(proseWordCount(text), 2);
  assert.ok(stripFrontMatter(text, 'chapter').startsWith('# A heading'));
  assert.throws(() => stripFrontMatter('---\ntitle: swallowed body\n', 'broken'), /Unclosed front matter.*broken/);
});
