import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright-core';
import { confined, escape, sha256 } from './lib.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const nds = process.argv.includes('--nds');
const candidate = path.join(here, nds ? '.nds-candidate' : '.candidate');
const output = nds ? path.join(root, 'docs', 'nds-book', 'output', '2026-11') :
  path.join(root, 'docs', 'book', 'output', '2026-11');
const stem = nds ? 'Two-Screens-One-Little-Escape' : 'Building-a-Little-Escape';
const input = JSON.parse(await fs.readFile(path.join(candidate, 'source-manifest.json'), 'utf8'));
for (const source of input.sources) {
  const bytes = await fs.readFile(await confined(root, source.path));
  if (sha256(bytes) !== source.sha256) throw new Error(`Input changed after assembly: ${source.path}`);
}
await fs.rm(path.join(candidate, 'READY.json'), { force: true });
let browserPath = process.env.BOOK_BROWSER;
if (!browserPath) {
  const choices = [
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe')
  ].filter(Boolean);
  for (const choice of choices) {
    try { await fs.access(choice); browserPath = choice; break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}
if (!browserPath) throw new Error('Set BOOK_BROWSER to an installed supported Chromium browser.');
const css = await fs.readFile(path.join(here, 'print.css'), 'utf8') +
  (nds ? '\n' + await fs.readFile(path.join(here, 'nds.css'), 'utf8') : '');
const errors = [];
const routes = new Map([
  ['/', [candidate, 'manuscript.html', 'text/html']],
  ['/print.css', [here, 'print.css', 'text/css']],
  ['/bootstrap.mjs', [here, 'bootstrap.mjs', 'text/javascript']],
  ['/paged.js', [path.join(here, 'node_modules', 'pagedjs', 'dist'), 'paged.esm.js', 'text/javascript']]
]);
const server = http.createServer(async (request, response) => {
  try {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (name === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    let route = routes.get(name);
    if (!route && name.startsWith('/mermaid/')) {
      route = [path.join(here, 'node_modules', 'mermaid', 'dist'), name.slice('/mermaid/'.length), 'text/javascript'];
    }
    if (!route) { response.writeHead(404); response.end('Not an approved book resource'); return; }
    const bytes = name === '/print.css' ? css : await fs.readFile(await confined(route[0], route[1]));
    response.writeHead(200, { 'Content-Type': route[2], 'Cache-Control': 'no-store' });
    response.end(bytes);
  } catch (error) {
    errors.push(`Local resource error: ${error.message}`);
    response.writeHead(500); response.end('Book resource failed; see production diagnostics');
  }
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', resolve);
});
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ executablePath: browserPath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 1600 } });
  const blocked = [];
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(`${origin}/`) || /^(data:|blob:|about:)/.test(url)) return route.continue();
    blocked.push(url);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin, { waitUntil: 'load', timeout: 60000 });
  console.log('Rendering local diagrams and paginating the complete edition...');
  await page.waitForFunction(() => window.__BOOK_READY__ || window.__BOOK_ERROR__, null, { timeout: 240000 });
  const state = await page.evaluate(() => ({ ready: window.__BOOK_READY__, error: window.__BOOK_ERROR__ }));
  if (state.error) throw new Error(state.error);
  if (blocked.length || errors.length) throw new Error(`Resource gate: ${JSON.stringify({ blocked, errors })}`);
  const layout = await page.evaluate(() => {
    const pages = document.querySelector('#pages');
    const missingLinks = [];
    for (const link of pages.querySelectorAll('a[href^="#"]')) {
      const id = decodeURIComponent(link.getAttribute('href').slice(1));
      if (!pages.querySelector(`[id="${CSS.escape(id)}"]`)) missingLinks.push(id);
    }
    const missingImages = [...pages.querySelectorAll('img')].filter(image => !image.complete || !image.naturalWidth).map(image => image.alt);
    const overflow = [];
    const blankPages = [];
    const textBlocks = [];
    const contentBounds = [];
    const pageMap = {};
    for (const item of pages.querySelectorAll('[id]')) {
      const number = Number(item.closest('.pagedjs_page')?.dataset.pageNumber);
      if (number && !pageMap[item.id]) pageMap[item.id] = number;
    }
    for (const printed of pages.querySelectorAll('.pagedjs_page')) {
      const number = Number(printed.dataset.pageNumber);
      const area = printed.querySelector('.pagedjs_area').getBoundingClientRect();
      const sheet = printed.getBoundingClientRect();
      contentBounds.push({ page: number, rect: [area.left - sheet.left, area.top - sheet.top,
        area.right - sheet.left, area.bottom - sheet.top].map(value => value * 72 / 96) });
      const content = printed.querySelector('.pagedjs_page_content');
      if (!content.textContent.trim() && !(number === 1 && content.querySelector('.cover img.cover-page'))) blankPages.push(number);
      const check = (rect, label) => {
        if (rect.width < .1 || rect.height < .1) return;
        if (rect.left < area.left - 1.5 || rect.right > area.right + 1.5 ||
            rect.top < area.top - 1.5 || rect.bottom > area.bottom + 1.5) {
          overflow.push({ page: number, label, excess: {
            left: area.left - rect.left, right: rect.right - area.right,
            top: area.top - rect.top, bottom: rect.bottom - area.bottom
          } });
        }
      };
      for (const atomic of content.querySelectorAll('svg,img,pre,figcaption,h1,h2,h3,h4')) {
        check(atomic.getBoundingClientRect(), `${atomic.tagName}: ${atomic.textContent.slice(0, 70)}`);
      }
      const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim() || node.parentElement.closest('svg,style,script')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rectangle of range.getClientRects()) check(rectangle, node.textContent.slice(0, 70));
      }
      for (const block of content.querySelectorAll('p,li,td,th,h1,h2,h3,figcaption,pre')) {
        if (block.closest('svg') || (block.tagName === 'LI' && block.querySelector('ul,ol'))) continue;
        const text = block.innerText.trim();
        if (text.length > 12) textBlocks.push({ page: number, text });
      }
    }
    const diagramScales = [...pages.querySelectorAll('.diagram svg')].map(svg => {
      const box = svg.getBoundingClientRect();
      const scale = Math.min(box.width / svg.viewBox.baseVal.width, box.height / svg.viewBox.baseVal.height);
      const label = svg.querySelector('.nodeLabel') || svg.querySelector('text');
      return { id: svg.id, points: parseFloat(getComputedStyle(label).fontSize) * scale * 72 / 96,
        width: box.width, height: box.height };
    });
    const minimumDiagramPoints = Math.min(...diagramScales.map(item => item.points));
    return {
      pages: pages.querySelectorAll('.pagedjs_page').length,
      diagrams: pages.querySelectorAll('.diagram svg').length,
      images: pages.querySelectorAll('.image-frame img').length,
      learningMarkers: [...pages.querySelectorAll('h2[id],h3[id]')].map(node => node.id).filter(id => /^(?:CH|ND)\d{2}-[WRQA]\d{2}$/.test(id)),
      pageMap, missingLinks: [...new Set(missingLinks)], missingImages, overflow, blankPages,
      minimumDiagramPoints, diagramScales, textBlocks, contentBounds
    };
  });
  const report = { ...layout, blockedRequests: blocked.length, browser: browser.version(),
    sourceTextBlocks: state.ready.sourceTextBlocks, diagramText: state.ready.diagramText,
    fonts: 'Georgia / Arial / Consolas, installed local families; no font files shipped' };
  const normalize = text => text.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
  const paginatedText = normalize(await page.locator('.pagedjs_page_content').allInnerTexts().then(texts => texts.join('')));
  report.missingSourceBlocks = report.sourceTextBlocks.filter(text => !paginatedText.includes(normalize(text)));
  await fs.writeFile(path.join(candidate, 'layout-report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ pages: report.pages, diagrams: report.diagrams,
    overflow: report.overflow.length, missingLinks: report.missingLinks,
    smallestDiagramPoints: report.minimumDiagramPoints }));
  if (report.overflow.length || report.blankPages.length || report.missingLinks.length ||
      report.missingImages.length || report.missingSourceBlocks.length) {
    throw new Error('Page-layout/navigation gate failed; inspect .candidate/layout-report.json.');
  }
  if (report.diagrams !== input.expectedDiagrams ||
      input.learningMarkers.some(marker => !report.learningMarkers.includes(marker)) ||
      report.minimumDiagramPoints < 8) throw new Error('Diagram/learning/readable-scale gate failed.');
  for (const chapter of input.chapters) {
    if (!report.pageMap[chapter.id] || !report.pageMap[`opening-${chapter.id}`]) throw new Error(`Missing chapter: ${chapter.id}`);
  }
  const reader = await page.evaluate(({ printCss, title }) => {
    const styles = [...document.querySelectorAll('head style')].map(element => element.outerHTML).join('\n');
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} - reading edition</title><style>${printCss}</style>${styles}</head><body>${document.querySelector('#pages').outerHTML}</body></html>`;
  }, { printCss: css, title: escape(input.title) });
  if (/<script\b/i.test(reader) || /\b(?:src|href)="(?:https?:)?\/\//i.test(reader.replace(/<a\b[^>]*>/gi, ''))) {
    throw new Error('Instant reader contains a script or external resource.');
  }
  await fs.writeFile(path.join(candidate, 'Reading-Edition.html'), reader);
  await page.pdf({ path: path.join(candidate, `${stem}.pdf`), format: 'A4', printBackground: true,
    margin: { top: 0, bottom: 0, left: 0, right: 0 }, tagged: true, timeout: 120000 });
  const offline = await browser.newContext({ offline: true });
  const offlinePage = await offline.newPage();
  const offlineRequests = [];
  await offline.route('**/*', route => {
    offlineRequests.push(route.request().url()); return route.abort();
  });
  await offlinePage.setContent(reader, { waitUntil: 'load' });
  const offlineResult = await offlinePage.evaluate(() => ({
    pages: document.querySelectorAll('.pagedjs_page').length,
    images: [...document.images].every(image => image.complete && image.naturalWidth > 0),
    scripts: document.scripts.length,
    missing: [...document.querySelectorAll('a[href^="#"]')].filter(link =>
      !document.getElementById(decodeURIComponent(link.getAttribute('href').slice(1)))).length
  }));
  await offline.close();
  if (offlineRequests.length || offlineResult.pages !== report.pages || !offlineResult.images ||
      offlineResult.scripts || offlineResult.missing) throw new Error('Standalone offline-reader gate failed.');
  const boundaries = [
    ...input.chapters.map(item => report.pageMap[`opening-${item.id}`]),
    ...input.parts.map(item => report.pageMap[`part-${item.number}`]),
    ...input.sections.map(item => report.pageMap[item.id]), report.pages + 1
  ].sort((a, b) => a - b);
  const chapterPages = input.chapters.map(item => ({
    id: item.id, title: item.title, part: item.part,
    openingPage: report.pageMap[`opening-${item.id}`], startPage: report.pageMap[item.id],
    endPage: boundaries.find(number => number > report.pageMap[item.id]) - 1
  }));
  await fs.writeFile(path.join(candidate, 'chapter-pages.json'), JSON.stringify(chapterPages, null, 2));
  const review = process.env.BOOK_REVIEW_DIR;
  const arguments_ = [path.join(here, nds ? 'review-nds.py' : 'review.py'), candidate];
  if (review) arguments_.push(review);
  console.log(execFileSync('python', arguments_, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }).trim());
  const pdfReview = JSON.parse(await fs.readFile(path.join(candidate, 'pdf-review.json'), 'utf8'));
  const pdfBytes = await fs.readFile(path.join(candidate, `${stem}.pdf`));
  const readerBytes = await fs.readFile(path.join(candidate, 'Reading-Edition.html'));
  const tools = Object.fromEntries(await Promise.all(
    ['markdown-it', 'mermaid', 'pagedjs', 'playwright-core'].map(async name => [name,
      JSON.parse(await fs.readFile(path.join(here, 'node_modules', name, 'package.json'), 'utf8')).version])));
  const manifest = {
    title: input.title, edition: input.edition, generatedAt: new Date().toISOString(),
    sourceBase: input.sourceBase, sourceManifestSha256: sha256(await fs.readFile(path.join(candidate, 'source-manifest.json'))),
    pdf: { file: `${stem}.pdf`, sha256: sha256(pdfBytes), pages: report.pages },
    reader: { file: 'Reading-Edition.html', sha256: sha256(readerBytes), ...offlineResult, externalRequests: offlineRequests.length },
    chapters: chapterPages, diagrams: report.diagrams, learningMarkers: input.learningMarkers.length,
    tools: { node: process.version, browser: report.browser, ...tools, ...pdfReview.tools },
    review: { mechanical: 'passed', visual: 'See REVIEW.md; selected native pages only.',
      humanAcceptance: 'not requested or claimed', publication: 'local only; not published',
      limitations: ['not a fresh-machine rebuild', 'not byte-for-byte reproducibility',
        'not PDF/UA or printer prepress', 'not an independent rights audit'] }
  };
  await fs.writeFile(path.join(candidate, 'edition-manifest.json'), JSON.stringify(manifest, null, 2));
  await fs.writeFile(path.join(candidate, 'REVIEW.md'), `# Edition review\n\nPDF SHA-256: \`${manifest.pdf.sha256}\`\n\nMechanical checks passed for ${report.pages} native A4 pages, ${pdfReview.bookmarks} bookmarks and ${report.diagrams} diagrams. Visual review is **pending** for this exact PDF. Rendering or generating review images does not constitute visual inspection, human acceptance or publication clearance.\n\nA rebuild replaces this note so that an earlier review cannot silently qualify different bytes.\n`);
  await fs.writeFile(path.join(candidate, 'chapter-concordance.html'), `<!doctype html><meta charset="utf-8"><title>Chapter page map</title><h1>${escape(input.title)} - chapter page map</h1><p>The Markdown edition has no printed page numbers. Stable IDs map to this PDF only.</p><table><tr><th>ID</th><th>Title</th><th>Opening</th><th>Content pages</th></tr>${chapterPages.map(item => `<tr><td>${item.id}</td><td>${escape(item.title)}</td><td>${item.openingPage}</td><td>${item.startPage}-${item.endPage}</td></tr>`).join('')}</table>`);
  await fs.writeFile(path.join(candidate, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(input.title)}</title><style>body{max-width:48rem;margin:10vh auto;padding:2rem;color:#302a3b;background:#faf7f0;font:1.15rem/1.6 Georgia,serif}h1{font-size:3rem;color:#51416a}a{color:#51416a}li{margin:1rem 0}</style><h1>${escape(input.title)}</h1><p>${escape(nds ? 'The separate BowserBOY DS development-journey and engineering book. First NDS edition, November 2026.' : 'The BowserBOY engineering book. Second edition, November 2026.')}</p><ul><li><a href="${stem}.pdf">Read the PDF - ${report.pages} pages</a></li><li><a href="Reading-Edition.html">Open the instant offline reader</a></li><li><a href="chapter-concordance.html">Chapter page map</a></li><li><a href="edition-manifest.json">Exact edition and checks</a></li><li><a href="REVIEW.md">Review scope and limits</a></li><li><a href="THIRD_PARTY_NOTICES.md">Project artwork and dependency provenance</a></li></ul><p>${input.chapters.length} chapters, ${report.diagrams} rendered diagrams, worked examples, changed-condition retries and explained exercises. Fixed A4 reading view; no commercial ROM or firmware included. Local delivery, not a hosted publication.</p></html>`);
  await fs.copyFile(path.join(root, 'THIRD_PARTY_NOTICES.md'), path.join(candidate, 'THIRD_PARTY_NOTICES.md'));
  const selection = [
    'index.html', `${stem}.pdf`, 'Reading-Edition.html', 'chapter-concordance.html',
    'edition-manifest.json', 'source-manifest.json', 'chapter-pages.json',
    'layout-report.json', 'pdf-review.json', 'THIRD_PARTY_NOTICES.md', 'REVIEW.md'
  ];
  await fs.writeFile(path.join(candidate, 'SHA256SUMS.txt'), (await Promise.all(selection.map(async file =>
    `${sha256(await fs.readFile(path.join(candidate, file)))}  ${file}`))).join('\n') + '\n');
  await fs.writeFile(path.join(candidate, 'READY.json'), JSON.stringify({ pdfSha256: manifest.pdf.sha256 }));
  await fs.mkdir(output, { recursive: true });
  for (const file of [...selection, 'SHA256SUMS.txt']) {
    await fs.copyFile(path.join(candidate, file), path.join(output, file));
  }
  console.log(`Qualified and promoted local edition: ${report.pages} pages, ${pdfReview.bookmarks} bookmarks.\n${path.join(output, `${stem}.pdf`)}`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
