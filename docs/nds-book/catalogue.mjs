export const title = 'Two Screens, One Little Escape';
export const stem = 'Two-Screens-One-Little-Escape';
export const sourceBase = '61845372142b41992916f3732ea102cc0f4c8edf';
export const parts = [
  { number: 1, title: 'Becoming a console' },
  { number: 2, title: 'Making it run' },
  { number: 3, title: 'Making it feel physical' },
  { number: 4, title: 'Evidence and maintenance' },
];
export const chapters = [
  ['a-second-console', 'A second console', 1],
  ['development-journey', 'The development journey', 1],
  ['runtime-boundary', 'Static host, native core', 2],
  ['cartridge-and-power', 'Cartridge, loading and power', 2],
  ['two-live-screens', 'One framebuffer, two live screens', 2],
  ['touch-and-controls', 'Touch, controls and the stylus', 2],
  ['saves-and-recovery', 'Saves, identity and recovery', 2],
  ['physical-ds', 'The DS on the desk', 3],
  ['algorithms', 'Algorithms and data structures', 3],
  ['design-principles', 'Design principles and failure boundaries', 3],
  ['tests-and-releases', 'Tests, releases and honest evidence', 4],
  ['visual-documentation', 'Visual documentation', 4],
  ['maintainer-field-guide', 'The maintainer field guide', 4],
].map(([directory, title, part], index) => {
  const number = String(index + 1).padStart(2, '0');
  return { id: `ND${number}`, title, part,
    source: `docs\\nds-book\\chapters\\${number}-${directory}\\README.md` };
});
export const sections = [
  { id: 'orientation', title: 'Before opening the DS', source: 'docs\\nds-book\\orientation.md' },
  { id: 'sources', title: 'Source register and limits', source: 'docs\\nds-book\\SOURCES.md' },
];
export const assets = [
  'assets\\ds-logo.png',
  ...['ds-gameplay', 'ds-cartridge', 'ds-controls', 'ds-stylus', 'ds-inspect', 'ds-play-zoom',
    'ds-lighting', 'ds-lcd-reflections', 'lighting-overview', 'console-movement',
    'pear-lighting', 'pear-movement', 'axolotl-lighting', 'axolotl-movement']
    .map(name => `docs\\images\\${name}.gif`),
];
