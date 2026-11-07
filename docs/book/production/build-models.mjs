import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import MarkdownIt from 'markdown-it';
import { title, subtitle, stem, sourceBase, parts, chapters, sections, assets } from '../../modeling-book/catalogue.mjs';
import { confined, escape, sha256, slug, urlPath, checkFences, checkLearning, stripFrontMatter } from './lib.mjs';
import { proseWordCount } from './edition.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const candidate = path.join(here, '.models-candidate');
const preservedBooks = [
  { path: 'docs/book/published/Building-a-Little-Escape.pdf',
    sha256: '25875beab7d925f9d014de89842b560216729c799e673f5a7218291aa75db1ad' },
  { path: 'docs/nds-book/published/Two-Screens-One-Little-Escape.pdf',
    sha256: '3bc15e839769c786de2d123e8a733bcda9a1a9a9ba560cc86f8e3162a8e825bf' },
  { path: 'docs/nds-book/published/Reading-Edition.html',
    sha256: '629a5ec40d54d642087caa30dd2d0bfcae134bcee4eb8b4c2813abb644f91d39' },
];
for (const item of preservedBooks) {
  if (sha256(await fs.readFile(await confined(root, item.path))) !== item.sha256) {
    throw new Error(`Preserved edition changed: ${item.path}`);
  }
}
await fs.mkdir(candidate, { recursive: true });
await fs.rm(path.join(candidate, 'READY.json'), { force: true });
const receipt = new Map();
async function read(relative) {
  const bytes = await fs.readFile(await confined(root, relative));
  receipt.set(urlPath(relative), { path: urlPath(relative), sha256: sha256(bytes), bytes: bytes.length });
  return bytes;
}
const pinnedPaths = new Set(execFileSync('git', ['ls-tree', '-r', '--name-only', sourceBase],
  { cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim().split('\n'));
const pinnedFiles = new Map();
function pinned(relative) {
  const file = urlPath(relative);
  if (!pinnedPaths.has(file)) throw new Error(`Reference absent from implementation cutoff: ${file}`);
  if (!pinnedFiles.has(file)) pinnedFiles.set(file,
    execFileSync('git', ['show', `${sourceBase}:${file}`], { cwd: root, maxBuffer: 32 * 1024 * 1024 }));
  return pinnedFiles.get(file);
}
const sourceReferences = new Map();
function verifyReference(relative, start, end) {
  const file = urlPath(relative);
  if (!/^(src|tests|scripts|TODO|docs|web|\.github)\//.test(file) &&
      !['package.json', 'package-lock.json', 'README.md', 'THIRD_PARTY_NOTICES.md', 'playwright.config.mjs'].includes(file)) {
    throw new Error(`Unapproved implementation reference: ${file}`);
  }
  const bytes = pinned(file);
  const lines = bytes.toString('utf8').split('\n').length;
  if (start && (+start < 1 || +(end || start) < +start || +(end || start) > lines)) {
    throw new Error(`Source span outside ${file}: ${start}-${end}`);
  }
  sourceReferences.set(file, { path: file, revision: sourceBase, sha256: sha256(bytes), lines });
}
const coverage = [];
const nonCutoffInputs = [];
for (const part of parts) {
  const report = JSON.parse((await read(`docs\\modeling-book\\coverage\\part-${part.number}.json`)).toString('utf8'));
  const expected = chapters.filter(item => item.part === part.number).map(item => item.id);
  if (report.part !== part.number || JSON.stringify(report.chapters) !== JSON.stringify(expected) ||
      !report.models?.length || !report.sources?.length || !report.research?.length) {
    throw new Error(`Incomplete model/source/research inventory: part ${part.number}`);
  }
  for (const file of report.sources) {
    if (pinnedPaths.has(urlPath(file))) verifyReference(file);
    else if (/^(docs[\\/]modeling-book|node_modules[\\/](?:three|@playwright[\\/]test))[\\/]/.test(file)) {
      const bytes = await read(file);
      nonCutoffInputs.push({ path: urlPath(file), sha256: sha256(bytes),
        policy: 'Actual later manuscript or installed dependency read; not an implementation-cutoff file.' });
    } else throw new Error(`Unclassified source inventory input: ${file}`);
  }
  for (const model of report.models) {
    if (!model.model || !model.source || !model.symbol || !model.components?.length || !model.chapters?.length ||
        !Array.isArray(model.tests) || !model.limits) throw new Error(`Incomplete model contract in part ${part.number}`);
    for (const id of model.chapters) {
      if (!expected.includes(id)) throw new Error(`Model assigned outside its authoring part: ${id}`);
    }
  }
  for (const source of report.research) {
    if (!/^https:\/\//.test(source.url) || !source.consulted || !source.supports || !source.scope) {
      throw new Error(`Incomplete research boundary in part ${part.number}`);
    }
  }
  coverage.push(report);
}
const coverageText = JSON.stringify(coverage.map(part => part.models));
for (const [family, expression] of [
  ['GBA', /gba|game boy advance/i], ['DS', /ds-handheld|nintendo ds/i],
  ['Pear Boy', /pear/i], ['axolotl', /axolotl/i], ['tripod lamp', /lamp/i],
  ['cartridges', /cartridge/i], ['stylus', /stylus/i], ['desk and room', /desk|room/i],
]) if (!expression.test(coverageText)) throw new Error(`Model inventory lacks ${family}`);
const atlas = JSON.parse((await read('docs\\modeling-book\\assets\\atlas\\capture-manifest.json')).toString('utf8'));
if (atlas.sourceBase !== sourceBase || atlas.externalRequests !== 0 || atlas.captures.length !== 18 ||
    new Set(atlas.captures.map(item => item.file)).size !== 18) throw new Error('Unqualified model atlas inventory');
for (const image of atlas.captures) {
  const file = `docs\\modeling-book\\assets\\atlas\\${image.file}`;
  if (!assets.includes(file) || sha256(await read(file)) !== image.sha256 ||
      image.geometryMeshes < 1 || image.submittedPixelsDifferingFromBackground < 1000) {
    throw new Error(`Atlas capture identity/content failed: ${image.file}`);
  }
}
if (sha256(await read(atlas.generator.path)) !== atlas.generator.sha256) {
  throw new Error('Atlas generator differs from capture receipt.');
}
if (!atlas.supportInputs?.length) throw new Error('Atlas helper provenance is missing.');
for (const input of atlas.supportInputs) {
  if (sha256(await read(input.path)) !== input.sha256) throw new Error(`Atlas helper changed: ${input.path}`);
}
const catalogue = [...chapters, ...sections];
const included = new Map(catalogue.map(item => [path.normalize(item.source), item.id]));
const globalAnchors = new Set(['cover', 'contents', ...catalogue.map(item => item.id),
  ...parts.map(part => `part-${part.number}`)]);
function anchor(namespace, fragment) {
  return globalAnchors.has(fragment) || /^MD\d{2}(?:-|$)/.test(fragment) ||
    fragment.startsWith(`${namespace}-`) ? fragment : `${namespace}-${fragment}`;
}
const markdown = new MarkdownIt({ html: false, linkify: false });
const images = [];
const derivatives = new Map();
const markers = [];
const supplementalReferences = new Map();
const chapterDepth = [];
const longParagraphs = new Map();
let diagrams = 0;
async function cleanImage(file) {
  if (!derivatives.has(file)) {
    const bytes = await read(file);
    derivatives.set(file, execFileSync('python', ['-c',
      'import sys,io; from PIL import Image; im=Image.open(io.BytesIO(sys.stdin.buffer.read())); im.seek(0); im.convert("RGBA").save(sys.stdout.buffer,format="PNG")'],
    { input: bytes, maxBuffer: 20 * 1024 * 1024 }));
  }
  return derivatives.get(file);
}
async function render(text, source, namespace) {
  checkFences(text, source);
  const tokens = markdown.parse(text, {});
  const counts = new Map();
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'heading_open') {
      const label = tokens[index + 1].content;
      const marker = /^(MD\d{2}-[WRQA]\d{2})\b/.exec(label)?.[1];
      const base = marker || `${namespace}-${slug(label)}`;
      const count = (counts.get(base) || 0) + 1;
      counts.set(base, count);
      token.attrSet('id', count === 1 ? base : `${base}-${count}`);
    }
    if (token.type === 'fence' && token.info.trim() === 'mermaid') {
      diagrams++;
      token.type = 'html_block';
      token.content = `<figure class="diagram-frame"><div class="diagram" data-source="${escape(token.content)}"></div></figure>`;
    }
    for (const child of token.children || []) {
      if (!['link_open', 'image'].includes(child.type)) continue;
      const attribute = child.type === 'image' ? 'src' : 'href';
      const original = child.attrGet(attribute);
      if (/^https:\/\//i.test(original)) {
        if (child.type === 'image') throw new Error(`Remote illustration disallowed: ${source}`);
        const match = /^https:\/\/github\.com\/Zanark\/BowserBoy(?:Advance)?\/blob\/([^/]+)\/([^#?]+)(?:#L(\d+)(?:-L(\d+))?)?$/.exec(original);
        if (match) {
          if (match[1] !== sourceBase) throw new Error(`Unpinned implementation link: ${original}`);
          verifyReference(decodeURIComponent(match[2]), match[3], match[4]);
        }
        continue;
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(original)) throw new Error(`Unsupported resource: ${original}`);
      if (original.startsWith('#')) {
        child.attrSet(attribute, `#${anchor(namespace, original.slice(1))}`);
        continue;
      }
      const [relative, fragment] = original.split('#');
      const target = path.normalize(path.join(path.dirname(source),
        decodeURIComponent(relative.split('?')[0]).replaceAll('/', path.sep)));
      await confined(root, target);
      if (child.type === 'image') {
        if (!assets.includes(target)) throw new Error(`Unapproved modeling illustration: ${target}`);
        const derivative = await cleanImage(target);
        child.attrSet('src', `data:image/png;base64,${derivative.toString('base64')}`);
        const still = path.extname(target).toLowerCase() === '.gif';
        child.attrSet('data-print-still', String(still));
        images.push({ source: urlPath(target), transform: still ? 'frame zero only, PNG' : 'metadata-clean PNG', sha256: sha256(derivative) });
      } else {
        const id = included.get(target);
        if (id) child.attrSet(attribute, `#${fragment ? anchor(id, fragment) : id}`);
        else {
          const file = urlPath(target);
          if (pinnedPaths.has(file)) {
            verifyReference(file);
            child.attrSet(attribute, `https://github.com/Zanark/BowserBoy/blob/${sourceBase}/${file}${fragment ? `#${fragment}` : ''}`);
          } else if (file.startsWith('docs/modeling-book/')) {
            const bytes = await read(file);
            supplementalReferences.set(file, { path: file, sha256: sha256(bytes), policy: 'Living supplementary file on main; not implementation-cutoff evidence.' });
            child.attrSet(attribute, `https://github.com/Zanark/BowserBoy/blob/main/${file}${fragment ? `#${fragment}` : ''}`);
          } else throw new Error(`New local reference outside this edition: ${file}`);
        }
      }
    }
  }
  return markdown.renderer.render(tokens, markdown.options, {});
}
const blocks = [];
for (const section of sections.slice(0, 1)) {
  blocks.push(`<article id="${section.id}" class="reference">${await render((await read(section.source)).toString('utf8'), section.source, section.id)}</article>`);
}
for (const part of parts) {
  const members = chapters.filter(item => item.part === part.number);
  blocks.push(`<section class="part-opening" id="part-${part.number}"><p class="eyebrow">Part ${part.number}</p><h1>${escape(part.title)}</h1><ol>${members.map(item => `<li>${escape(item.title)}</li>`).join('')}</ol></section>`);
  for (const chapter of members) {
    const text = stripFrontMatter((await read(chapter.source)).toString('utf8'), chapter.source);
    const words = proseWordCount(text);
    const minimum = chapter.part <= 3 ? 1300 : 1250;
    if (words < minimum) throw new Error(`${chapter.id}: ${words} prose words; requires ${minimum} meaningful words excluding code/URLs/images.`);
    chapterDepth.push({ id: chapter.id, proseWords: words });
    for (const paragraph of text.split(/\r?\n\s*\r?\n/)) {
      if (proseWordCount(paragraph) < 80 || /```|~~~/.test(paragraph)) continue;
      const normalized = paragraph.replace(/\s+/g, ' ').trim();
      if (longParagraphs.has(normalized)) throw new Error(`Repeated long paragraph: ${chapter.id} and ${longParagraphs.get(normalized)}`);
      longParagraphs.set(normalized, chapter.id);
    }
    markers.push(...checkLearning(text, chapter.id));
    if (!/```mermaid\b/.test(text)) throw new Error(`Missing model construction diagram: ${chapter.id}`);
    blocks.push(`<section class="chapter-opening" id="opening-${chapter.id}"><p class="eyebrow">Part ${part.number} / ${escape(part.title)}</p><p class="opening-number">${chapter.id}</p><h1>${escape(chapter.title)}</h1><p class="opening-outcome">Inspect the shape. Reconstruct the mechanism. Verify the visible result.</p></section>`);
    const body = text.replace(/^# [^\r\n]+\r?\n/, '');
    blocks.push(`<article id="${chapter.id}" data-chapter="${chapter.id}"><p class="chapter-kicker">${chapter.id} / ${escape(chapter.title)}</p><a class="home" href="#contents">Contents</a><h1>${escape(chapter.title)}</h1>${await render(body, chapter.source, chapter.id)}</article>`);
  }
}
const proseWords = chapterDepth.reduce((sum, chapter) => sum + chapter.proseWords, 0);
if (proseWords < 52000) throw new Error(`Manuscript has ${proseWords} chapter prose words; minimum 52000.`);
for (const section of sections.slice(1)) {
  blocks.push(`<article id="${section.id}" class="reference">${await render((await read(section.source)).toString('utf8'), section.source, section.id)}</article>`);
}
const coverPath = 'docs\\modeling-book\\assets\\cover.png';
const cover = await read(coverPath);
for (const file of ['build-models.mjs', 'render.mjs', 'bootstrap.mjs', 'lib.mjs', 'edition.mjs',
  'print.css', 'models.css', 'review-native.py', 'native_rules.py', 'package.json', 'package-lock.json', 'requirements.txt']) {
  await read(`docs\\book\\production\\${file}`);
}
for (const file of ['catalogue.mjs', 'tools\\make-atlas-plates.py']) await read(`docs\\modeling-book\\${file}`);
await read('THIRD_PARTY_NOTICES.md');
const tocItems = [{ id: sections[0].id, title: sections[0].title },
  ...parts.flatMap(part => [{ id: `part-${part.number}`, title: `Part ${part.number} - ${part.title}`, part: true },
    ...chapters.filter(item => item.part === part.number).map(item => ({ id: `opening-${item.id}`, title: `${item.id} - ${item.title}` }))]),
  ...sections.slice(1)];
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(title)}</title><link rel="stylesheet" href="/print.css"></head><body><main id="manuscript">
<section class="cover models-cover" id="cover" aria-label="From Shapes to a Living Desk - supplied illustrated cover"><img class="cover-page" src="data:image/png;base64,${cover.toString('base64')}" alt="From Shapes to a Living Desk. The Complete BowserBOY Procedural Modeling Handbook. Supplied engraved desk cover by Zanark."></section>
<section class="contents" id="contents"><h1>Contents</h1><p>Thirty-eight source-pinned chapters. Detailed mechanisms, construction recipes, worked examples and explained exercises.</p><ol>${tocItems.map(item => `<li class="${item.part ? 'toc-part' : ''}"><a href="#${item.id}"><span>${escape(item.title)}</span><b data-page-for="${item.id}">000</b></a></li>`).join('')}</ol></section>
${blocks.join('\n')}</main><div id="pages"></div><script type="module" src="/bootstrap.mjs"></script></body></html>`;
await fs.writeFile(path.join(candidate, 'manuscript.html'), html);
await fs.writeFile(path.join(candidate, 'source-manifest.json'), JSON.stringify({
  title, subtitle, stem, edition: 'Supplied-cover revision / 2026-11-08', sourceBase,
  cover: { path: urlPath(coverPath), sha256: sha256(cover),
    provenance: 'Owner-supplied artwork, used unchanged. Cover lettering is raster artwork; interior remains searchable.',
    scope: 'Cover revision only; the supplied Second Edition label does not imply rewritten chapters.' },
  subject: 'Independent procedural 3D modeling, construction workflow and agent reconstruction handbook',
  identityNote: 'Runtime cutoff is pinned; exact manuscript, atlas and production hashes identify this later book. Supplemental main-branch links are explicitly living, not cutoff evidence.',
  chapters, parts, sections, tocItems, expectedDiagrams: diagrams, learningMarkers: markers,
  minimumPages: 200, minimumBodyPages: 200, minimumProseWords: 52000, proseWords, chapterDepth,
  sources: [...receipt.values()], images, sourceReferences: [...sourceReferences.values()],
  supplementalReferences: [...supplementalReferences.values()], nonCutoffInputs, coverage,
  preservedBooks, atlasPolicy: atlas.conditions,
  exclusions: ['private ROMs and firmware', 'raw recordings', 'private context and raw chats',
    'unrelated dirty artwork', 'claims of perfect agent-memory replication'],
}, null, 2));
console.log(`Assembled modeling book: ${chapters.length} chapters, ${proseWords} prose words, ${diagrams} diagrams, ${markers.length} learning markers; ${sourceReferences.size} pinned source files checked.`);
