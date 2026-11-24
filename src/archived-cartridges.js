import { createCartridge } from './handheld.js';

// Recoverable former decorative layout; intentionally not attached or cleared.
export function createArchivedCartridges() {
  return [
    ['#648579', 'DAYDREAM', 'EMPTY CARTRIDGE', 4.3, -1.9, .42],
    ['#b2a7b5', 'LITTLE WORLDS', 'EMPTY CARTRIDGE', 5.6, -.2, -.16],
    ['#aaa48b', 'BBA', 'HOME BREW', -3.8, 4, -.43],
  ].map(([color, title, subtitle, x, z, angle]) => {
    const cartridge = createCartridge(color, title, subtitle);
    cartridge.position.set(x, .18, z);
    cartridge.rotation.set(-Math.PI / 2, 0, angle);
    return cartridge;
  });
}
