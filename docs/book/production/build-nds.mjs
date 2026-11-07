import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import MarkdownIt from 'markdown-it';
import { title, stem, sourceBase, parts, chapters, sections, assets } from '../../nds-book/catalogue.mjs';
import { confined, escape, sha256, slug, urlPath, checkFences, checkLearning } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const candidate = path.join(here, '.nds-candidate');
const frozen = path.join(root, 'docs', 'book', 'published', 'Building-a-Little-Escape.pdf');
const frozenSha = '25875beab7d925f9d014de89842b560216729c799e673f5a7218291aa75db1ad';
if (sha256(await fs.readFile(frozen)) !== frozenSha) throw new Error('Preserved GBA PDF identity changed.');
await fs.mkdir(candidate, { recursive: true });
await fs.rm(path.join(candidate, 'READY.json'), { force: true });
const receipt = new Map();
async function read(relative) {
  const bytes = await fs.readFile(await confined(root, relative));
  receipt.set(relative, { path: urlPath(relative), sha256: sha256(bytes), bytes: bytes.length });
  return bytes;
}
const catalogue = [...chapters, ...sections];
const included = new Map(catalogue.map(item => [path.normalize(item.source), item.id]));
const markdown = new MarkdownIt({ html: false, linkify: false });
const images = [];
const markers = [];
let diagrams = 0;
const sourceReferences = new Map();
async function render(text, source, namespace) {
  checkFences(text, source);
  const tokens = markdown.parse(text, {});
  const counts = new Map();
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];
    if (token.type === 'heading_open') {
      const label = tokens[index + 1].content;
      const marker = /^(ND\d{2}-[WRQA]\d{2})\b/.exec(label)?.[1];
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
        const match = new RegExp(`^https://github.com/Zanark/BowserBoy/blob/${sourceBase}/([^#?]+)(?:#L(\\d+)(?:-L(\\d+))?)?$`).exec(original);
        if (match) {
          const target = decodeURIComponent(match[1]).replaceAll('/', path.sep);
          if (!/^(src|tests|scripts|TODO|docs|web|\.github)[\\/]/.test(target) &&
              !['package.json', 'README.md', 'THIRD_PARTY_NOTICES.md', 'playwright.config.mjs'].includes(target)) {
            throw new Error(`Unapproved source reference: ${target}`);
          }
          const committed = execFileSync('git', ['show', `${sourceBase}:${urlPath(target)}`], { cwd: root, maxBuffer: 8 * 1024 * 1024 });
          const lines = committed.toString('utf8').split('\n').length;
          if (match[2] && (+match[2] < 1 || +(match[3] || match[2]) < +match[2] || +(match[3] || match[2]) > lines)) {
            throw new Error(`Source span outside pinned file: ${original}`);
          }
          sourceReferences.set(target, { path: urlPath(target), revision: sourceBase, sha256: sha256(committed), lines });
        }
        continue;
      }
      if (/^[a-z][a-z0-9+.-]*:/i.test(original)) throw new Error(`Unsupported resource: ${original}`);
      if (original.startsWith('#')) {
        child.attrSet(attribute, `#${namespace}-${original.slice(1)}`);
        continue;
      }
      const [relative, fragment] = original.split('#');
      const target = path.normalize(path.join(path.dirname(source), decodeURIComponent(relative.split('?')[0]).replaceAll('/', path.sep)));
      await confined(root, target);
      if (child.type === 'image') {
        if (!assets.includes(target)) throw new Error(`Unapproved NDS illustration: ${target}`);
        const bytes = await read(target);
        const derivative = execFileSync('python', ['-c',
          'import sys,io; from PIL import Image; im=Image.open(io.BytesIO(sys.stdin.buffer.read())); im.seek(0); im.convert("RGBA").save(sys.stdout.buffer,format="PNG")'],
        { input: bytes, maxBuffer: 20 * 1024 * 1024 });
        child.attrSet('src', `data:image/png;base64,${derivative.toString('base64')}`);
        const still = path.extname(target).toLowerCase() === '.gif';
        child.attrSet('data-print-still', String(still));
        images.push({ source: urlPath(target), transform: still ? 'frame zero only, PNG' : 'metadata-clean PNG', sha256: sha256(derivative) });
      } else {
        const id = included.get(target);
        child.attrSet(attribute, id ? `#${id}${fragment ? `-${fragment}` : ''}` :
          `https://github.com/Zanark/BowserBoy/blob/${sourceBase}/${urlPath(target)}${fragment ? `#${fragment}` : ''}`);
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
    const text = (await read(chapter.source)).toString('utf8');
    const found = checkLearning(text, chapter.id);
    markers.push(...found);
    if (!/```mermaid\b/.test(text)) throw new Error(`Missing diagram: ${chapter.id}`);
    blocks.push(`<section class="chapter-opening" id="opening-${chapter.id}"><p class="eyebrow">Part ${part.number} / ${escape(part.title)}</p><p class="opening-number">${chapter.id}</p><h1>${escape(chapter.title)}</h1><p class="opening-outcome">Locate the boundary. Follow the mechanism. Inspect the evidence.</p></section>`);
    const body = text.replace(/^# [^\r\n]+\r?\n/, '');
    blocks.push(`<article id="${chapter.id}" data-chapter="${chapter.id}"><p class="chapter-kicker">${chapter.id} / ${escape(chapter.title)}</p><a class="home" href="#contents">Contents</a><h1>${escape(chapter.title)}</h1>${await render(body, chapter.source, chapter.id)}</article>`);
  }
}
for (const section of sections.slice(1)) {
  blocks.push(`<article id="${section.id}" class="reference">${await render((await read(section.source)).toString('utf8'), section.source, section.id)}</article>`);
}
const coverPath = 'docs\\nds-book\\assets\\cover.png';
const cover = await read(coverPath);
for (const file of ['build-nds.mjs', 'render.mjs', 'bootstrap.mjs', 'lib.mjs', 'edition.mjs', 'print.css', 'nds.css',
  'review-nds.py', 'review-native.py', 'native_rules.py', 'package.json', 'package-lock.json', 'requirements.txt']) await read(`docs\\book\\production\\${file}`);
await read('docs\\nds-book\\catalogue.mjs');
const tocItems = [{ id: 'orientation', title: 'Before opening the DS' },
  ...parts.flatMap(part => [{ id: `part-${part.number}`, title: `Part ${part.number} - ${part.title}`, part: true },
    ...chapters.filter(item => item.part === part.number).map(item => ({ id: `opening-${item.id}`, title: `${item.id} - ${item.title}` }))]),
  ...sections.slice(1)];
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escape(title)}</title><link rel="stylesheet" href="/print.css"></head><body><main id="manuscript">
<section class="cover nds-cover" id="cover" aria-label="Two Screens, One Little Escape - supplied illustrated cover"><img class="cover-page" src="data:image/png;base64,${cover.toString('base64')}" alt="Two Screens, One Little Escape. BowserBOY DS: Development Journey and Engineering. Supplied engraved blue DS cover by Zanark."></section>
<section class="contents" id="contents"><h1>Contents</h1><p>A separate NDS book. Source-pinned chapters, worked examples and explained exercises.</p><ol>${tocItems.map(item => `<li class="${item.part ? 'toc-part' : ''}"><a href="#${item.id}"><span>${escape(item.title)}</span><b data-page-for="${item.id}">000</b></a></li>`).join('')}</ol></section>
${blocks.join('\n')}</main><div id="pages"></div><script type="module" src="/bootstrap.mjs"></script></body></html>`;
await fs.writeFile(path.join(candidate, 'manuscript.html'), html);
await fs.writeFile(path.join(candidate, 'source-manifest.json'), JSON.stringify({
  title, stem, edition: 'Supplied-cover revision / 2026-11-08', sourceBase,
  cover: { path: urlPath(coverPath), sha256: sha256(cover),
    provenance: 'Owner-supplied artwork, used unchanged. Cover lettering is raster artwork; interior remains searchable.',
    scope: 'Cover revision only; the supplied Second Edition label does not imply rewritten chapters.' },
  identityNote: 'Runtime cutoff is pinned; exact manuscript and production hashes identify this later book.',
  chapters, parts, sections, tocItems, expectedDiagrams: diagrams, learningMarkers: markers,
  sources: [...receipt.values()], images, sourceReferences: [...sourceReferences.values()],
  preservedBook: { path: 'docs/book/published/Building-a-Little-Escape.pdf', sha256: frozenSha },
  exclusions: ['GBA-specific chapters', 'private context', 'raw chats', 'ROMs and firmware', 'raw recordings', 'unrelated dirty images']
}, null, 2));
console.log(`Assembled NDS book: ${chapters.length} chapters, ${diagrams} diagrams, ${markers.length} learning markers; ${sourceReferences.size} pinned source files checked.`);
