import * as THREE from 'three';
import { canvasTexture, createCartridge, createWood, roundedBox } from './handheld.js';
import { GAME_SLOTS, gameSlot } from './game-library-catalog.js';
import { nextGameBoxElapsed } from './game-box-motion.js';

function part(parent, name, width, height, depth, material, x = 0, y = 0, z = 0, radius = .02) {
  const mesh = new THREE.Mesh(roundedBox(width, height, depth, radius, .008), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function print(parent, name, width, height, map, position, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map, toneMapped: false, side: THREE.DoubleSide }));
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function textMap(text, color, subtitle = '') {
  return canvasTexture(1024, 160, (ctx, w, h) => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fff6dc'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 62px Arial'; ctx.fillText(text, 30, subtitle ? 61 : 80, w - 60);
    if (subtitle) { ctx.font = '24px Arial'; ctx.fillText(subtitle, 32, 125, w - 60); }
  });
}

function coverMap(slot, title, image) {
  return canvasTexture(768, 896, (ctx, w, h) => {
    ctx.fillStyle = '#faf1dc'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = slot.color; ctx.fillRect(24, 104, w - 48, h - 220);
    if (image) {
      const scale = Math.min((w - 48) / image.width, (h - 220) / image.height);
      ctx.drawImage(image, (w - image.width * scale) / 2, 104 + (h - 220 - image.height * scale) / 2,
        image.width * scale, image.height * scale);
    } else {
      ctx.save(); ctx.translate(w / 2, h * .48); ctx.rotate(Math.PI / 4);
      ctx.strokeStyle = '#fff3d1'; ctx.lineWidth = 12;
      for (const size of [110, 230, 350]) ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.restore();
      ctx.fillStyle = '#fff8e8'; ctx.textAlign = 'center';
      ctx.font = 'bold 180px Arial'; ctx.fillText(String(slot.number), w / 2, h * .57);
      ctx.font = '28px Arial'; ctx.fillText('YOUR NEXT LITTLE ESCAPE', w / 2, h * .72);
    }

    ctx.textAlign = 'left'; ctx.fillStyle = '#202d38';
    ctx.font = 'bold 42px Arial'; ctx.fillText(slot.system === 'gba' ? 'GAME BOY ADVANCE' : 'NINTENDO DS', 30, 69);
    ctx.font = 'bold 45px Arial'; ctx.fillText(title, 30, h - 66, w - 60);
    ctx.font = '22px Arial'; ctx.fillText(image ? 'LOCAL COVER / YOUR LIBRARY' : 'ORIGINAL DUMMY COVER / NO ROM INCLUDED', 30, h - 27, w - 60);
  });
}

function cardMap(slot, title) {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#f5efdf'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#25313a'; ctx.font = 'bold 45px Arial';
    ctx.fillText('NINTENDO DS', 24, 61, w - 48);
    ctx.fillStyle = slot.color; ctx.fillRect(24, 90, w - 48, 285);
    ctx.fillStyle = '#fff7df'; ctx.textAlign = 'center'; ctx.font = 'bold 170px Arial';
    ctx.fillText(String(slot.number), w / 2, 301);
    ctx.fillStyle = '#25313a'; ctx.font = 'bold 40px Arial';
    ctx.fillText(title, w / 2, h - 70, w - 48);
    ctx.font = '24px Arial'; ctx.fillText('LOCAL GAME CARD', w / 2, h - 28);
  });
}

export function createLibraryCartridge(slot, title = slot.title) {
  if (slot.system === 'gba') {
    const card = createCartridge('#595763', title, 'GBA / LOCAL GAME');
    card.name = `${slot.id} library GBA cartridge`;
    card.scale.setScalar(1.45);
    card.children.find(object => object.material?.map).userData.libraryTitle = true;
    return card;
  }
  const card = new THREE.Group();
  card.name = `${slot.id} library DS game card`;
  const plastic = new THREE.MeshStandardMaterial({ color: '#202126', roughness: .54 });
  part(card, 'DS game card shell', 1.46, 1.56, .13, plastic, 0, 0, 0, .045);
  print(card, 'DS game card title', 1.19, 1, cardMap(slot, title), [0, .1, .077]).userData.libraryTitle = true;
  const gold = new THREE.MeshStandardMaterial({ color: '#caac52', metalness: .65, roughness: .44 });
  for (let i = 0; i < 8; i++) part(card, 'DS exposed contact', .11, .21, .018, gold, -.57 + i * .16, -.58, -.077);
  return card;
}

function updateCartridgeTitle(card, slot, title) {
  card.traverse(object => {
    if (!object.userData.libraryTitle) return;
    object.material.map.dispose();
    object.material.map = slot.system === 'ds' ? cardMap(slot, title) :
      canvasTexture(1024, 180, (ctx, w, h) => {
        ctx.fillStyle = '#43494b'; ctx.font = 'italic bold 100px Arial';
        ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
        ctx.fillText(title, w / 2, h / 2, w - 30);
      });
    object.material.needsUpdate = true;
  });
}

export function createGameBox(slot) {
  const root = new THREE.Group();
  root.name = `${slot.id} ${slot.system === 'gba' ? 'cardboard game box' : 'plastic clamshell case'}`;
  root.userData.gameSlot = slot.id;
  const gba = slot.system === 'gba';
  const width = gba ? 4.05 : 3.85, height = gba ? 4.6 : 3.65, depth = gba ? .85 : .54;
  const paper = new THREE.MeshStandardMaterial({ color: gba ? '#dfd2b6' : '#e1e3dc',
    emissive: gba ? '#dfd2b6' : '#e1e3dc', emissiveIntensity: 12, roughness: gba ? .93 : .38 });
  const inner = new THREE.MeshStandardMaterial({ color: gba ? '#b9a88c' : '#929c98',
    emissive: gba ? '#b9a88c' : '#929c98', emissiveIntensity: 1.5, roughness: .85 });
  part(root, 'Back panel', width, height, .045, paper, 0, 0, -depth / 2);
  for (const x of [-width / 2, width / 2]) part(root, 'Side wall', .045, height, depth, paper, x);
  part(root, 'Bottom wall', width, .045, depth, paper, 0, -height / 2);
  const hinge = new THREE.Group();
  root.add(hinge);
  let cover;
  if (gba) {
    part(root, 'Printed front cardboard panel', width, height, .045, paper, 0, 0, depth / 2);
    cover = print(root, 'Original front cover', width - .03, height - .03, coverMap(slot, slot.title), [0, 0, depth / 2 + .055]);
    hinge.name = 'GBA creased top flap hinge';
    hinge.position.set(0, height / 2, -depth / 2);
    part(hinge, 'Foldable cardboard top flap', width - .04, .045, depth, paper, 0, 0, depth / 2);
    part(hinge, 'Cardboard tuck tongue', width - .2, .31, .025, paper, 0, -.15, depth);
    for (const x of [-width / 2 + .09, width / 2 - .09]) {
      part(root, 'Folded dust flap', .13, .035, depth - .08, inner, x, height / 2 - .06);
    }
  } else {
    hinge.name = 'DS spine clamshell hinge';
    hinge.position.x = -width / 2;
    part(hinge, 'Hinged front case panel', width, height, .07, paper, width / 2, 0, depth / 2);
    cover = print(hinge, 'Original front cover', width - .10, height - .10, coverMap(slot, slot.title), [width / 2, 0, depth / 2 + .065]);
    part(root, 'DS card retention bay', 1.75, 1.85, .06, inner, .45, -.12, -.13, .09);
    for (const x of [-1.15, 1.15]) part(hinge, 'Booklet retention clip', .13, .45, .09, inner, width / 2 + x, .65, depth / 2 - .10);
    for (const y of [-1.45, 1.45]) part(root, 'Case clasp', .16, .20, .09, inner, width / 2 - .05, y, .03);
  }
  const spine = print(root, 'Readable game title spine', width - .03, depth - .04,
    textMap(slot.title, slot.color, gba ? 'GAME BOY ADVANCE' : 'NINTENDO DS'),
    [0, -height / 2 - .055, 0], [Math.PI / 2, 0, 0]);
  const tray = new THREE.Group();
  tray.name = gba ? 'Sliding cardboard cartridge tray' : 'DS retained cartridge';
  root.add(tray);
  if (gba) part(tray, 'Inner cardboard insert', 2.5, 2.0, .08, inner, 0, -.30, -.17);
  const cartridge = createLibraryCartridge(slot);
  cartridge.position.set(gba ? 0 : .45, gba ? -.1 : -.12, gba ? .13 : -.04);
  tray.add(cartridge);
  return { root, hinge, tray, cartridge, slot, width, height, depth, cover, spine,
    setArtwork(title, image) {
      for (const [mesh, map] of [[cover, coverMap(slot, title, image)], [spine, textMap(title, slot.color, gba ? 'GAME BOY ADVANCE' : 'NINTENDO DS')]]) {
        mesh.material.map.dispose();
        mesh.material.map = map;
        mesh.material.needsUpdate = true;
      }
    },
    open(fraction) {
      if (gba) { hinge.rotation.x = -fraction * Math.PI * .75; tray.position.y = fraction * 1.15; }
      else hinge.rotation.y = -fraction * Math.PI * .86;
    },
  };
}

export class GameShelves {
  constructor(view) {
    this.view = view;
    this.root = new THREE.Group();
    this.root.name = 'GBA and DS game library shelves';
    this.boxes = new Map();
    this.lastCards = new Map();
    const wood = new THREE.MeshStandardMaterial({ map: createWood(), color: '#8a593c',
      emissive: '#8a593c', emissiveIntensity: 2.5, roughness: .87 });
    const metal = new THREE.MeshStandardMaterial({ color: '#3c4249', metalness: .6, roughness: .58 });
    for (const [system, x, y] of [['gba', -4.8, 7.8], ['ds', 11.3, 11.0]]) {
      part(this.root, `${system} floating wall shelf`, 7.8, .23, 5.3, wood, x, y, -13.22);
      for (const offset of [-2.7, 2.7]) {
        part(this.root, `${system} wall bracket`, .17, 1.25, .20, metal, x + offset, y - .7, -15.65);
        part(this.root, `${system} bracket arm`, .17, .15, 3.1, metal, x + offset, y - .23, -14.1);
      }
      print(this.root, `${system} shelf label`, 5.6, .65,
        textMap(system === 'gba' ? 'GAME BOY ADVANCE' : 'NINTENDO DS', '#2e383d'),
        [x, y - .75, -10.55]);
      for (const slot of GAME_SLOTS.filter(slot => slot.system === system)) {
        const box = createGameBox(slot);
        box.root.position.set(x + (slot.number - 2) * .13, y + .18 + box.depth / 2 + (slot.number - 1) * (box.depth + .065), -13.12);
        box.root.rotation.set(-Math.PI / 2, 0, 0);
        box.home = { position: box.root.position.clone(), rotation: box.root.quaternion.clone() };
        this.root.add(box.root);
        this.boxes.set(slot.id, box);
      }
    }
    this.root.traverse(object => {
      if (object.material?.emissiveIntensity) {
        object.material.userData.shelfEmissiveIntensity = object.material.emissiveIntensity;
      }
    });
    view.scene.add(this.root);
  }

  setArtwork(id, title, image) {
    const slot = gameSlot(id), box = this.boxes.get(slot.id);
    box.setArtwork(title, image);
    updateCartridgeTitle(box.cartridge, slot, title);
    const last = this.lastCards.get(slot.system);
    if (last?.userData.gameSlot === id) {
      updateCartridgeTitle(last, slot, title);
    }
    this.view.changed = true;
  }

  setLastPlayed(id, title) {
    const slot = gameSlot(id), previous = this.lastCards.get(slot.system);
    if (previous?.userData.gameSlot === id) return;
    if (previous) {
      this.view.scene.remove(previous);
      this.view.deskObjects.splice(this.view.deskObjects.indexOf(previous), 1);
      this.view.deskPropHomes.delete(previous);
      previous.traverse(object => {
        object.geometry?.dispose();
        if (object.material) { object.material.map?.dispose(); object.material.dispose(); }
      });
    }
    const card = createLibraryCartridge(slot, title);
    card.userData.gameSlot = id;
    // Stable slot-derived scatter; clearance moves the desired pose if occupied.
    const x = slot.system === 'gba' ? -7.4 + slot.number * .73 : 8.8 + slot.number * .53;
    card.position.set(x, slot.system === 'gba' ? .34 : .12, 3.6 + slot.number * .46);
    card.rotation.set(-Math.PI / 2, 0, (slot.number - 2) * .29 + (slot.system === 'gba' ? -.26 : .31));
    this.view.scene.add(card);
    this.lastCards.set(slot.system, card);
    this.view.deskObjects.push(card);
    this.view.deskPropHomes.set(card, card.position.clone());
    this.view.clearanceSignature = null;
    this.view.changed = true;
  }

  preview(id, { dummy = false } = {}) {
    if (this.motion) throw new Error('Wait for the current box animation to finish.');
    const box = this.boxes.get(gameSlot(id).id);
    box.root.updateWorldMatrix(true, true);
    return new Promise(resolve => {
      this.motion = { box, elapsed: 0, lastPaint: null, dummy, phase: null, resolve,
        start: box.root.getWorldPosition(new THREE.Vector3()), rotation: box.root.getWorldQuaternion(new THREE.Quaternion()) };
      this.view.host.dataset.gameBox = id;
      this.view.host.dispatchEvent(new Event('game-box-motion'));
      this.view.changed = true;
    });
  }

  cancel() {
    if (!this.motion) return;
    const { box } = this.motion;
    box.root.position.copy(box.home.position);
    box.root.quaternion.copy(box.home.rotation);
    box.open(0);
    box.cartridge.position.set(box.slot.system === 'gba' ? 0 : .45, box.slot.system === 'gba' ? -.1 : -.12, box.slot.system === 'gba' ? .13 : -.04);
    box.cartridge.quaternion.identity();
    box.cartridge.visible = true;
    const model = box.slot.system === 'gba' ? this.view.model : this.view.ds;
    if (this.motion.nativeVisible !== undefined) model.cartridge.visible = this.motion.nativeVisible;
    this.motion.resolve?.(false);
    this.motion = null;
    this.view.host.dataset.gameBoxPhase = 'idle';
    this.view.host.dispatchEvent(new Event('game-box-motion'));
    this.view.changed = true;
  }

  paint(time) {
    for (const parent of [this.root, ...this.lastCards.values()]) parent.traverse(object => {
      const material = object.material;
      if (material?.emissiveMap) material.emissiveIntensity = 18 * .018 / this.view.renderer.toneMappingExposure;
      else if (material?.userData.shelfEmissiveIntensity) {
        material.emissiveIntensity = material.userData.shelfEmissiveIntensity * .018 / this.view.renderer.toneMappingExposure;
      }
    });
    if (!this.motion) return;
    const motion = this.motion, { box } = motion;
    const elapsed = nextGameBoxElapsed(motion, time, this.view.reducedMotion.matches);
    motion.nextElapsed = elapsed;
    const ease = (start, duration) => {
      const f = THREE.MathUtils.clamp((elapsed - start) / duration, 0, 1);
      return f * f * (3 - 2 * f);
    };
    const camera = this.view.camera, root = box.root;
    const tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(15, 7 / (2 * tangent * Math.min(1, camera.aspect)));
    const center = new THREE.Vector3(0, -.12, -distance).applyMatrix4(camera.matrixWorld);
    const presented = ease(0, 650), returned = ease(4250, 650);
    root.position.lerpVectors(motion.start, center, presented).lerp(box.home.position, returned);
    root.quaternion.slerpQuaternions(motion.rotation, camera.quaternion, presented).slerp(box.home.rotation, returned);
    box.open(ease(1350, 950) * (1 - returned));
    const extracted = ease(2300, 750), inserted = ease(3050, 1200);
    const system = box.slot.system, model = system === 'gba' ? this.view.model : this.view.ds;
    if (!motion.dummy) {
      motion.nativeVisible ||= model.cartridge.visible;
      model.cartridge.visible = elapsed >= 4150 && !!motion.nativeVisible;
    }
    root.updateWorldMatrix(true, true);
    const slotPosition = model.cartridge.getWorldPosition(new THREE.Vector3());
    const escape = new THREE.Vector3(0, box.height / 2 + 1.3, box.depth + .7).applyMatrix4(root.matrixWorld);
    const target = escape.clone().lerp(slotPosition, inserted);
    const local = box.tray.worldToLocal(target);
    const rest = new THREE.Vector3(system === 'gba' ? 0 : .45, system === 'gba' ? -.1 : -.12, system === 'gba' ? .13 : -.04);
    box.cartridge.position.lerpVectors(rest, local, extracted);
    const targetRotation = model.root.getWorldQuaternion(new THREE.Quaternion());
    const parentRotation = box.tray.getWorldQuaternion(new THREE.Quaternion());
    box.cartridge.quaternion.slerpQuaternions(new THREE.Quaternion(),
      parentRotation.invert().multiply(targetRotation), inserted);
    box.cartridge.visible = elapsed < 4150;
    const phase = elapsed < 650 ? 'presenting' : elapsed < 1350 ? 'cover' :
      elapsed < 2300 ? 'opening' : elapsed < 3050 ? 'extracting' : elapsed < 4250 ? 'inserting' : 'returning';
    this.view.host.dataset.gameBoxPhase = phase;
    this.view.changed = true;
  }

  acknowledgePaint(time) {
    if (!this.motion) return;
    this.motion.elapsed = this.motion.nextElapsed;
    this.motion.lastPaint = time;
    if (this.motion.elapsed >= 4250) {
      this.motion.resolve?.(true);
      this.motion.resolve = null;
    }
    if (this.motion.elapsed === 4900) this.cancel();
  }
}
