export function selectEdition(arguments_) {
  const nds = arguments_.includes('--nds');
  const models = arguments_.includes('--models');
  if (nds && models) throw new Error('Select one book edition, not both --nds and --models.');
  if (models) return {
    candidate: '.models-candidate', output: ['modeling-book', 'output', '2026-11'],
    stem: 'From-Shapes-to-a-Living-Desk', stylesheet: 'models.css', reviewer: 'review-native.py',
    description: 'The independent procedural 3D modeling and agent reconstruction handbook. First modeling edition, November 2026.',
  };
  if (nds) return {
    candidate: '.nds-candidate', output: ['nds-book', 'output', '2026-11'],
    stem: 'Two-Screens-One-Little-Escape', stylesheet: 'nds.css', reviewer: 'review-nds.py',
    description: 'The separate BowserBOY DS development-journey and engineering book. First NDS edition, November 2026.',
  };
  return {
    candidate: '.candidate', output: ['book', 'output', '2026-11'],
    stem: 'Building-a-Little-Escape', stylesheet: null, reviewer: 'review.py',
    description: 'The BowserBOY engineering book. Second edition, November 2026.',
  };
}

export function assertEditionDepth(input, pages, chapters) {
  if (!Number.isInteger(pages) || pages < (input.minimumPages || 1)) {
    throw new Error(`Edition has ${pages} actual pages; requires ${input.minimumPages || 1}.`);
  }
  const bodyPages = new Set();
  for (const chapter of chapters) {
    if (!Number.isInteger(chapter.startPage) || !Number.isInteger(chapter.endPage) ||
        chapter.startPage <= chapter.openingPage || chapter.endPage < chapter.startPage ||
        chapter.endPage > pages) throw new Error(`Invalid chapter page range: ${chapter.id}`);
    for (let number = chapter.startPage; number <= chapter.endPage; number++) bodyPages.add(number);
  }
  if (bodyPages.size < (input.minimumBodyPages || 0)) {
    throw new Error(`Only ${bodyPages.size} actual chapter-content pages; requires ${input.minimumBodyPages}.`);
  }
  return bodyPages.size;
}

export function proseWordCount(text) {
  let fence = null;
  const prose = [];
  for (const line of stripFrontMatter(text, 'prose counter').split(/\r?\n/)) {
    const match = /^\s*(`{3,}|~{3,})(.*)$/.exec(line);
    if (match) {
      if (!fence) fence = match[1];
      else if (match[1][0] === fence[0] && match[1].length >= fence.length && !match[2].trim()) fence = null;
      continue;
    }
    if (!fence && !/^\s*(?:#{1,6}\s|\|)/.test(line)) prose.push(line);
  }
  return (prose.join('\n')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/https?:\/\/\S+/g, '')
    .match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g) || []).length;
}
import { stripFrontMatter } from './lib.mjs';
