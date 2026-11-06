import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import MarkdownIt from 'markdown-it';
import { chapters, parts, sections, edition, assets, evidence } from '../editions/2026-11/catalogue.mjs';
import { confined, escape, sha256, slug, urlPath, checkLearning, checkFences } from './lib.mjs';

export const here = path.dirname(fileURLToPath(import.meta.url));
export const root = path.resolve(here, '..', '..');
export const candidate = path.join(here, '.candidate');
export const title = 'Building a Little Escape';
const notesPath = `${edition}\\learning-notes.md`;
const receipt = new Map();
const imageReceipts = [];
const included = new Map([...chapters, ...sections].map(item => [path.normalize(item.source), item.id]));
const coverPath = `${edition}\\cover.png`;
const inputs = new Set([...included.keys(), notesPath, coverPath, ...assets, ...evidence,
  `${edition}\\catalogue.mjs`, `${edition}\\README.md`,
  ...['build.mjs', 'render.mjs', 'bootstrap.mjs', 'lib.mjs', 'print.css', 'review.py', 'production.test.mjs',
    'package.json', 'package-lock.json', 'requirements.txt'].map(name => `book\\production\\${name}`)]);
await fs.mkdir(candidate, { recursive: true });
await fs.rm(path.join(candidate, 'READY.json'), { force: true });

async function read(relative) {
  if (!inputs.has(relative)) throw new Error(`Unreviewed source input: ${relative}`);
  const bytes = await fs.readFile(await confined(root, relative));
  receipt.set(relative, { path: urlPath(relative), sha256: sha256(bytes), bytes: bytes.length,
    role: assets.includes(relative) ? 'image' : evidence.includes(relative) ? 'evidence-reference' : 'manuscript-or-production' });
  return bytes;
}
for (const input of inputs) await read(input);
const notes = (await read(notesPath)).toString('utf8');
const supplements = new Map([...notes.matchAll(/^# (CH\d{2})\r?\n([\s\S]*?)(?=^# CH\d{2}\r?$|(?![\s\S]))/gm)]
  .map(match => [match[1], match[2]]));
if (supplements.size !== 10) throw new Error('Exactly ten adopted-chapter supplements are required.');
const markdown = new MarkdownIt({ html: false, linkify: false, typographer: false });
let figureCount = 0;
const allMarkers = [];
const blocks = [];

async function render(text, source, namespace) {
  checkFences(text, source);
  const tokens = markdown.parse(text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, ''), {});
  const counts = new Map();
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'heading_open') {
      const label = tokens[index + 1].content;
      const marker = /^(CH\d{2}-[WRQA]\d{2})\b/.exec(label)?.[1];
      const base = marker || `${namespace}-${slug(label)}`;
      const occurrence = (counts.get(base) || 0) + 1;
      counts.set(base, occurrence);
      token.attrSet('id', occurrence === 1 ? base : `${base}-${occurrence}`);
    }
    if (token.type === 'fence' && token.info.trim() === 'mermaid') {
      figureCount++;
      token.type = 'html_block';
      token.content = `<figure class="diagram-frame" id="diagram-${figureCount}"><div class="diagram" data-source="${escape(token.content)}"></div></figure>`;
    }
    if (!token.children) continue;
    for (const child of token.children) {
      if (child.type !== 'link_open' && child.type !== 'image') continue;
      const attribute = child.type === 'image' ? 'src' : 'href';
      const original = child.attrGet(attribute);
      if (/^(https?:|mailto:)/i.test(original)) continue;
      if (original.startsWith('#')) {
        child.attrSet(attribute, `#${namespace}-${original.slice(1)}`);
        continue;
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(original)) throw new Error(`Unsupported resource in ${source}: ${original}`);
      const [relative, fragment] = original.split('#');
      const decoded = decodeURIComponent(relative.split('?')[0]).replaceAll('/', path.sep);
      const target = path.normalize(path.join(path.dirname(source), decoded));
      await confined(root, target);
      if (child.type === 'image') {
        if (!assets.includes(target)) throw new Error(`Image is not allowlisted: ${target}`);
        let bytes = await read(target);
        let mime = 'image/png';
        let transform = 'metadata-clean PNG';
        const isGif = path.extname(target).toLowerCase() === '.gif';
        bytes = execFileSync('python', ['-c',
          'import sys,io; from PIL import Image; im=Image.open(io.BytesIO(sys.stdin.buffer.read())); im.seek(0); im.convert("RGB").save(sys.stdout.buffer,format="PNG")'],
        { input: bytes, maxBuffer: 20 * 1024 * 1024 });
        if (isGif) transform = 'frame zero, RGB PNG; no animation in print';
        child.attrSet('src', `data:${mime};base64,${bytes.toString('base64')}`);
        child.attrSet('data-print-still', isGif ? 'true' : 'false');
        imageReceipts.push({ source: urlPath(target), transform, derivativeSha256: sha256(bytes) });
      } else {
        const targetId = included.get(target);
        child.attrSet('href', targetId ? `#${targetId}${fragment ? `-${fragment}` : ''}` :
          `https://github.com/Zanark/BowserBoyAdvance/blob/main/${urlPath(target)}${fragment ? `#${fragment}` : ''}`);
      }
    }
  }
  return markdown.renderer.render(tokens, markdown.options, {});
}

for (const section of sections.slice(0, 1)) {
  blocks.push(`<article id="${section.id}" class="reference">${await render((await read(section.source)).toString('utf8'), section.source, section.id)}</article>`);
}
for (const part of parts) {
  const members = chapters.filter(item => item.part === part.number);
  blocks.push(`<section class="part-opening" id="part-${part.number}"><p class="eyebrow">Part ${part.number}</p><h1>${escape(part.title)}</h1><p>${escape(part.aim)}</p><ol>${members.map(item => `<li>${escape(item.title)}</li>`).join('')}</ol><p class="part-end">Picture the boundary. Explain the mechanism. Test the promise.</p></section>`);
  for (const chapter of members) {
    const original = (await read(chapter.source)).toString('utf8');
    const supplement = supplements.get(chapter.id) || '';
    allMarkers.push(...checkLearning(original + '\n' + supplement, chapter.id));
    const body = original.replace(/^# [^\r\n]+\r?\n/, '')
      .replace(/^\[(?:Previous|Book index)\][^\r\n]*\r?\n/gm, '');
    const epoch = chapter.number <= 10
      ? 'Adopted first-edition teaching text; dated later notes remain historical. New practice follows. Current status: orientation and Chapter 13.'
      : chapter.number === 14 ? 'Hypothetical capstone; not an implemented feature.' :
        'Second-edition explanation of current source. No new runtime qualification is implied.';
    blocks.push(`<section class="chapter-opening" id="opening-${chapter.id}"><p class="eyebrow">Part ${part.number} / ${escape(part.title)}</p><p class="opening-number">${chapter.id}</p><h1>${escape(chapter.title)}</h1><p class="opening-outcome">${escape(chapter.outcome)}</p><p class="prerequisites"><strong>Before reading</strong><br>${escape(chapter.prerequisites)}</p></section>`);
    const supplementHtml = supplement ? await render(supplement, notesPath, chapter.id) : '';
    blocks.push(`<article id="${chapter.id}" data-chapter="${chapter.id}"><p class="chapter-kicker">${chapter.id} / ${escape(chapter.title)}</p><a class="home" href="#contents">Contents</a><h1>${escape(chapter.title)}</h1><p class="epoch">${escape(epoch)}</p>${await render(body, chapter.source, chapter.id)}${supplementHtml}</article>`);
  }
}
for (const section of sections.slice(1)) {
  blocks.push(`<article id="${section.id}" class="reference">${await render((await read(section.source)).toString('utf8'), section.source, section.id)}</article>`);
}
const coverBytes = await read(coverPath);
const cover = coverBytes.toString('base64');
const tocItems = [
  { id: 'orientation', title: 'Before you pick up the console' },
  ...parts.flatMap(part => [{ id: `part-${part.number}`, title: `Part ${part.number} - ${part.title}`, part: true },
    ...chapters.filter(item => item.part === part.number).map(item => ({ id: `opening-${item.id}`, title: `${item.id} - ${item.title}` }))]),
  ...sections.slice(1)
];
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title><link rel="stylesheet" href="/print.css"></head><body>
<main id="manuscript"><section class="cover" id="cover" aria-label="Building a Little Escape - supplied illustrated cover"><img class="cover-page" src="data:image/png;base64,${cover}" alt="Building a Little Escape. The BowserBOY engineering book. Second edition, November 2026. A browser console, from pixels to publication. Supplied purple handheld illustration."></section>
<section class="contents" id="contents"><h1>Contents</h1><p>Chapter links enter their opening pages. Stable IDs remain independent of pagination.</p><ol>${tocItems.map(item => `<li class="${item.part ? 'toc-part' : ''}"><a href="#${item.id}"><span>${escape(item.title)}</span><b data-page-for="${item.id}">000</b></a></li>`).join('')}</ol></section>
${blocks.join('\n')}</main><div id="pages"></div>
<script type="module" src="/bootstrap.mjs"></script></body></html>`;
await fs.writeFile(path.join(candidate, 'manuscript.html'), html);
await fs.writeFile(path.join(candidate, 'source-manifest.json'), JSON.stringify({
  title, edition: 'BookMaker / 2026-11', sourceBase: sourceSha,
  identityNote: 'Exact input hashes include dirty working-tree documentation; the base commit alone does not identify this edition.',
  originalImplementation: 'ab912d51ecc615f7aa55a4d27f6a876673739cdf',
  chapters, parts, sections, tocItems, expectedDiagrams: figureCount, learningMarkers: allMarkers,
  sources: [...receipt.values()], images: imageReceipts,
  cover: { path: urlPath(coverPath), sha256: sha256(coverBytes),
    provenance: 'Owner-supplied Blueprint BowserBoy Advance Cover.png, adopted November 6, 2026; complete image, not regenerated or cropped.' },
  exclusions: ['private continuity', 'raw chats and MeshBoard bodies', 'ROMs and firmware', 'private recordings', 'sibling manuscripts', 'dependency caches']
}, null, 2));
console.log(`Assembled ${chapters.length} chapters, ${figureCount} diagrams and ${allMarkers.length} stable learning markers from ${receipt.size} allowlisted inputs.`);
