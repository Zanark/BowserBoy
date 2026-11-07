import mermaid from '/mermaid/mermaid.esm.min.mjs';
import { Previewer } from '/paged.js';

window.__BOOK_ERROR__ = null;
try {
  const source = document.querySelector('#manuscript');
  mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'base',
    themeVariables: { fontFamily: 'Arial', fontSize: '22px', primaryColor: '#f1ecf5',
      primaryTextColor: '#252231', primaryBorderColor: '#625574', lineColor: '#665f70' },
    flowchart: { htmlLabels: true, padding: 9, nodeSpacing: 14, rankSpacing: 20,
      wrappingWidth: 140, useMaxWidth: true } });
  let count = 0;
  for (const diagram of source.querySelectorAll('.diagram')) {
    const { svg } = await mermaid.render(`mermaid-${++count}`, diagram.dataset.source);
    diagram.innerHTML = svg;
    delete diagram.dataset.source;
    const figure = diagram.closest('figure');
    const next = figure.nextElementSibling;
    if (next?.tagName === 'P' && /^Figure /.test(next.textContent.trim())) {
      const caption = document.createElement('figcaption');
      caption.innerHTML = next.innerHTML;
      figure.append(caption);
      next.remove();
    } else throw new Error(`Missing caption for diagram ${count}`);
  }
  for (const paragraph of source.querySelectorAll('p')) {
    if (paragraph.children.length !== 1 || paragraph.firstElementChild.tagName !== 'IMG') continue;
    const figure = document.createElement('figure');
    figure.className = 'image-frame';
    const image = paragraph.firstElementChild;
    const next = paragraph.nextElementSibling;
    figure.append(image);
    if (next?.tagName === 'P' && /^Figure /.test(next.textContent.trim())) {
      const caption = document.createElement('figcaption');
      caption.innerHTML = next.innerHTML;
      if (image.dataset.printStill === 'true') caption.append(' Print still: frame zero of the animated source; not motion evidence.');
      figure.append(caption);
      next.remove();
    } else throw new Error(`Missing image caption: ${image.alt}`);
    paragraph.replaceWith(figure);
  }
  for (const heading of source.querySelectorAll('h2[id],h3[id]')) {
    const id = heading.id;
    if (!/(?:CH|ND|MD)\d{2}-[QA]\d{2}/.test(id)) continue;
    const target = id.includes('-Q') ? id.replace('-Q', '-A') : id.replace('-A', '-Q');
    const anchor = document.createElement('a');
    anchor.className = 'answer-jump';
    anchor.href = `#${target}`;
    anchor.textContent = id.includes('-Q') ? 'Explained answer' : 'Back to question';
    heading.after(anchor);
  }
  await document.fonts.ready;
  await Promise.all([...source.querySelectorAll('img')].map(image => image.decode()));
  const sourceTextBlocks = [...source.querySelectorAll('p,li,td,th,h1,h2,h3,figcaption,pre')]
    .filter(block => !block.closest('svg') && !(block.tagName === 'LI' && block.querySelector('ul,ol')))
    .map(block => (block.querySelector('[data-page-for]') ? block.querySelector('a span').innerText :
      block.innerText).trim()).filter(text => text.length > 12);
  const diagramText = [...source.querySelectorAll('.diagram .nodeLabel,.diagram .edgeLabel')]
    .map(label => label.textContent.trim()).filter(Boolean);
  const prepared = source.innerHTML;
  source.remove();
  const pages = document.querySelector('#pages');
  const previewer = new Previewer();
  await previewer.preview(prepared, ['/print.css'], pages);
  const firstMap = {};
  for (const element of pages.querySelectorAll('[id]')) {
    const number = Number(element.closest('.pagedjs_page')?.dataset.pageNumber);
    if (number && !firstMap[element.id]) firstMap[element.id] = number;
  }
  for (const pageLabel of pages.querySelectorAll('[data-page-for]')) {
    const number = firstMap[pageLabel.dataset.pageFor];
    if (!number) throw new Error(`Contents destination missing: ${pageLabel.dataset.pageFor}`);
    pageLabel.textContent = number;
  }
  window.__BOOK_READY__ = { diagrams: count, pages: pages.querySelectorAll('.pagedjs_page').length,
    pageMap: firstMap, sourceTextBlocks, diagramText };
} catch (error) {
  window.__BOOK_ERROR__ = error.stack || error.message;
}
