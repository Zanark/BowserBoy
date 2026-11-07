export const title = 'From Shapes to a Living Desk';
export const subtitle = 'Procedural 3D modeling: the complete BowserBOY agent handbook';
export const stem = 'From-Shapes-to-a-Living-Desk';
export const sourceBase = '1e4ef518d6943ab1af39cef3b4d558f209a17891';
export const parts = [
  { number: 1, title: 'Foundations and the Game Boy Advance' },
  { number: 2, title: 'The articulated Nintendo DS' },
  { number: 3, title: 'Characters, softness and movement' },
  { number: 4, title: 'A complete, verifiable 3D world' },
];
export const chapters = [
  ['evidence-and-toolchain', 'Evidence, libraries and the actual toolchain', 1],
  ['modeling-contract-and-references', 'The modeling contract and visual references', 1],
  ['coordinate-systems-and-transforms', 'Coordinate systems and transform ownership', 1],
  ['procedural-geometry-toolkit', 'The procedural geometry toolkit', 1],
  ['gba-shell-and-silhouette', 'GBA shell, silhouette and layered construction', 1],
  ['gba-lcd-glass-and-frame', 'GBA LCD, curved glass and frame', 1],
  ['gba-controls-and-grips', 'GBA controls, grips and tactile details', 1],
  ['cartridges-details-and-markings', 'Cartridges, small details and markings', 1],
  ['procedural-textures-and-asset-boundaries', 'Procedural textures and asset boundaries', 1],
  ['ds-assembly-and-parameter-map', 'DS assembly and the parameter map', 2],
  ['hinges-lids-and-articulation', 'Hinges, lids and articulation', 2],
  ['ds-shells-recesses-and-hardware', 'DS shells, recesses and hardware', 2],
  ['ds-controls-and-readable-markings', 'DS controls and readable markings', 2],
  ['dual-lcds-and-curved-glass', 'Dual LCDs and curved glass', 2],
  ['stylus-and-touch-geometry', 'Stylus construction and touch geometry', 2],
  ['cartridge-insertion-and-loading', 'Cartridge insertion and loading choreography', 2],
  ['inspection-camera-and-manipulation', 'Inspection, camera and manipulation', 2],
  ['ds-model-regression-atlas', 'The DS model regression atlas', 2],
  ['pear-body-parametric-surface', 'Pear Boy: the parametric body', 3],
  ['pear-face-and-curved-projection', 'Projecting a face onto a curved shell', 3],
  ['expressions-gaze-and-freckles', 'Expressions, gaze and six visible freckles', 3],
  ['limbs-rope-and-soft-motion', 'Limbs, rope and soft motion', 3],
  ['axolotl-silicone-body', 'Axolotl: the silicone body', 3],
  ['gills-tail-and-cute-features', 'Gills, tail and cute features', 3],
  ['companion-light-emission', 'Companion light emission and material tuning', 3],
  ['drag-gravity-and-drop', 'Dragging, gravity and dropping', 3],
  ['clearance-and-home-poses', 'Clearance, collision envelopes and home poses', 3],
  ['desk-room-and-tripod-lamp', 'The desk, room and tripod lamp', 4],
  ['light-units-exposure-and-color', 'Light units, exposure and color', 4],
  ['shadows-reflections-and-shaders', 'Shadows, reflections and shaders', 4],
  ['screen-materials-and-pixel-preservation', 'Screen materials and pixel preservation', 4],
  ['picking-occlusion-and-input-ownership', 'Picking, occlusion and input ownership', 4],
  ['render-loop-gpu-budgets-and-lifecycle', 'Render loops, GPU budgets and lifecycle', 4],
  ['algorithms', 'Algorithms and data structures', 4],
  ['design-principles', 'Design principles and failure boundaries', 4],
  ['validation-recovery-and-history', 'Validation and bounded recovery', 4],
  ['causal-modeling-history', 'The causal modeling history', 4],
  ['agent-reconstruction-and-extension', 'Agent reconstruction and extension', 4],
].map(([directory, title, part], index) => {
  const number = String(index + 1).padStart(2, '0');
  return { id: `MD${number}`, title, part,
    source: `docs\\modeling-book\\chapters\\${number}-${directory}\\README.md` };
});
export const sections = [
  { id: 'orientation', title: 'How to use this reconstruction manual', source: 'docs\\modeling-book\\orientation.md' },
  { id: 'agent-handoff', title: 'The standalone agent handoff', source: 'docs\\modeling-book\\AGENT-HANDOFF.md' },
  { id: 'sources', title: 'Sources, model coverage and research limits', source: 'docs\\modeling-book\\SOURCES.md' },
];
export const assets = [
  'docs\\modeling-book\\assets\\model-atlas.png',
  ...['gba-gameplay', 'ds-inspect', 'ds-controls', 'ds-cartridge', 'ds-stylus',
    'ds-lighting', 'ds-lcd-reflections', 'pear-movement', 'pear-lighting',
    'axolotl-movement', 'axolotl-lighting', 'lighting-overview', 'console-movement',
    'pickup-inspect', 'lcd-reflections', 'button-feedback']
    .map(name => `docs\\images\\${name}.gif`),
  ...['gba', 'ds', 'pear', 'axolotl', 'lamp', 'cartridge'].flatMap(model =>
    ['front', 'back', 'three-quarter'].map(view =>
      `docs\\modeling-book\\assets\\atlas\\${model}-${view}.png`)),
];
