const chapter = (number, folder, title, outcome, prerequisites, part) => ({
  id: `CH${String(number).padStart(2, '0')}`, number, title, outcome, prerequisites, part,
  source: ['docs', 'book', 'chapters', folder, 'README.md'].join('\\')
});
export const chapters = [
  chapter(1, '01-static-console', 'A console on a static website',
    'Place execution, storage and trust at their real boundaries.', 'Browser files and basic JavaScript.', 1),
  chapter(2, '02-runtime-and-power', 'Runtime, cartridge and power',
    'Predict cold boot, pause, restore and failed teardown.', 'Chapter 01.', 1),
  chapter(3, '03-saves-and-recovery', 'Saves and recovery',
    'Defend identity, integrity and the durable commit boundary.', 'Chapter 02 and promises.', 1),
  chapter(4, '04-handheld-geometry', 'Geometry and manufactured controls',
    'Distinguish shape, material and projected interaction.', 'Chapter 01; basic coordinates.', 2),
  chapter(5, '05-pixels-and-light', 'Pixels, lighting and fullscreen',
    'Trace one native picture through presentation and light.', 'Chapters 02 and 04.', 2),
  chapter(6, '06-input-and-interaction', 'Input and interaction',
    'Release only the source ownership that actually ended.', 'Chapter 02; browser input events.', 2),
  chapter(7, '07-algorithms-and-data-structures', 'Algorithms and data structures',
    'Reason about invariants, units and the actual bounded workload.', 'Chapters 03-06.', 3),
  chapter(8, '08-design-principles', 'Design principles and trade-offs',
    'Choose boundaries by their recovery benefit and real cost.', 'Chapters 01-07.', 3),
  chapter(9, '09-testing-and-delivery', 'Testing and delivery',
    'Separate implementation, qualification, deployment and acceptance.', 'Chapters 01-08.', 3),
  chapter(10, '10-documentation-and-development', 'Visual documentation and the development loop',
    'Keep living guidance, frozen editions and causal history coherent.', 'Chapter 09.', 3),
  ...[
    [11, '11-sharpness.md', 'Sharpness without confusing the clocks',
      'Explain paint scheduling without claiming a timing diagnosis.', 'Chapters 05 and 07.'],
    [12, '12-warmth.md', 'Warm fabric and a genuinely green indicator',
      'Choose the responsible layer for texture, seams and exposure.', 'Chapters 04, 05 and 11.'],
    [13, '13-releases.md', 'Parallel tests and an exact-source release',
      'Bind selected bytes to qualification, naming and publication.', 'Chapters 09 and 10.'],
    [14, '14-capstone.md', 'Change one appliance without losing its promises',
      'Design a safe presentation change and defend its evidence.', 'Chapters 01-13.']
  ].map(([number, file, title, outcome, prerequisites]) => ({
    id: `CH${number}`, number, title, outcome, prerequisites, part: 4,
    source: ['docs', 'book', 'editions', '2026-11', file].join('\\')
  }))
];
export const parts = [
  { number: 1, title: 'The recoverable machine', aim: 'Begin with ownership, lifecycle and durable state.' },
  { number: 2, title: 'The physical illusion', aim: 'Connect real geometry, one picture and overlapping input.' },
  { number: 3, title: 'Engineering the evidence', aim: 'Turn algorithms and failures into defensible decisions.' },
  { number: 4, title: 'Current lessons and transfer', aim: 'Preserve sharpness, material intent and exact-source delivery.' }
];
export const edition = String.raw`docs\book\editions\2026-11`;
export const sections = [
  { id: 'orientation', source: `${edition}\\orientation.md`, title: 'Before you pick up the console' },
  { id: 'glossary', source: `${edition}\\glossary.md`, title: 'Glossary and concept index' },
  { id: 'maintenance', source: `${edition}\\maintenance.md`, title: "A maintainer's field guide" },
  { id: 'claims', source: `${edition}\\claims.md`, title: 'Source and claim register' },
  { id: 'original-sources', source: String.raw`docs\book\SOURCES.md`, title: 'Original chapter source register' }
];
export const assets = [
  String.raw`docs\images\molded-controls.png`,
  String.raw`docs\images\power-on.gif`,
  String.raw`docs\images\readme-table.png`
];
export const evidence = [
  String.raw`docs\ARCHITECTURE.md`, String.raw`docs\SAVING.md`,
  String.raw`docs\MEDIA.md`, String.raw`docs\VERIFICATION.md`,
  String.raw`docs\releases\README.md`, String.raw`THIRD_PARTY_NOTICES.md`,
  String.raw`src\scene.js`, String.raw`src\lighting.js`,
  String.raw`.github\workflows\release.yml`, String.raw`.github\workflows\pages.yml`
];
