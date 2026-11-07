import * as THREE from 'three';
import { canvasTexture, roundedBox as beveledBox, roundedShape } from './handheld.js';

const roundedBox = (width, height, depth, radius = .08) =>
  beveledBox(width, height, depth, radius, Math.min(.02, depth / 3, radius / 3));

export function createDsHandheld() {
  const root = new THREE.Group();
  root.name = 'BowserBoy DS - bright blue-cyan DS Lite clamshell';
  root.userData.console = 'ds';
  const metal = (color, roughness = .36, metalness = .32) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const grain = canvasTexture(256, 256, (ctx, width, height) => {
    const image = ctx.createImageData(width, height);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const hash = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
      const value = 170 + ((hash ^ hash >>> 13) >>> 0) % 70;
      image.data[offset] = image.data[offset + 1] = image.data[offset + 2] = value;
      image.data[offset + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  });
  grain.colorSpace = THREE.NoColorSpace;
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(3, 3);
  const paint = color => new THREE.MeshPhysicalMaterial({
    color, metalness: .80, roughness: .35, envMapIntensity: 20, roughnessMap: grain,
    bumpMap: grain, bumpScale: .003, clearcoat: .55, clearcoatRoughness: .19,
  });
  const shell = paint('#0077FF');
  const baseShell = paint('#40A0FF');
  const rim = shell;
  const edge = metal('#171A70', .42, .25);
  const lime = metal('#8BFF78', .40, 0);
  const buttonPlastic = metal('#8BFF78', .45, 0);
  const dpadPlastic = metal('#245BFF', .45, 0);
  const lavender = metal('#B9B8E8', .4, .08);
  const dark = metal('#080B35', .64, .04);
  const navy = metal('#171A70', .25, .50);
  const slot = metal('#080B35', .25, .50);
  function mesh(parent, name, geometry, material, x = 0, y = 0, z = 0) {
    const object = new THREE.Mesh(geometry, material);
    object.name = name;
    object.position.set(x, y, z);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function text(parent, title, width, x, y, z, color = '#EAF5FF', height = .16) {
    const map = canvasTexture(title.length === 1 ? 96 : 512, 96, (ctx, w, h) => {
      ctx.font = 'bold 72px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = color;
      ctx.fillText(title, w / 2, h / 2, w - 24);
    });
    return mesh(parent, title, new THREE.PlaneGeometry(width, height),
      new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: .7 }), x, y, z);
  }
  function circle(parent, name, radius, depth, material, x, y, z) {
    const geometry = new THREE.CylinderGeometry(radius, radius, depth, 24);
    geometry.rotateX(Math.PI / 2);
    return mesh(parent, name, geometry, material, x, y, z);
  }
  mesh(root, 'Lower shell parting line', roundedBox(8.5, 4.75, .025, .14), edge, 0, -2.43, -.025);
  mesh(root, 'Metallic blue lower rear shell', roundedBox(8.5, 4.75, .19, .14), baseShell, 0, -2.43, -.135);
  mesh(root, 'Metallic blue control deck', roundedBox(8.5, 4.75, .22, .14), baseShell, 0, -2.43, .105);
  const lid = new THREE.Group();
  lid.name = 'Open hinged upper shell';
  lid.rotation.x = THREE.MathUtils.degToRad(70);
  lid.position.z = .07;
  root.add(lid);
  mesh(lid, 'Upper shell parting line', roundedBox(8.5, 4.65, .02, .14), edge, 0, 2.43, -.015);
  const lidOutline = roundedShape(8.5, 4.65, .14);
  for (const y of [-.38, .38]) {
    const points = roundedShape(.54, .54, .055).getPoints(8)
      .map(point => point.add(new THREE.Vector2(0, y)));
    lidOutline.holes.push(new THREE.Path(points));
    mesh(lid, 'Debossed double-square inset floor', roundedBox(.56, .56, .008, .055),
      shell, 0, 2.43 + y, -.14);
  }
  const lidGeometry = new THREE.ExtrudeGeometry(lidOutline, {
    depth: .12, steps: 1, bevelEnabled: true, bevelSize: .02,
    bevelThickness: .02, bevelSegments: 3, curveSegments: 18,
  });
  lidGeometry.translate(0, 0, -.06);
  mesh(lid, 'Metallic blue outer lid', lidGeometry, shell, 0, 2.43, -.10);
  mesh(lid, 'Cyan lid perimeter lip', roundedBox(8.48, 4.63, .065, .13), rim, 0, 2.43, .065);
  mesh(lid, 'Metallic blue recessed inner lid', roundedBox(8.30, 4.45, .06, .105), shell, 0, 2.43, .105);
  const screens = [];
  for (const [parent, y, z, name] of [[lid, 2.43, .18, 'Upper'], [root, -2.43, .265, 'Touch']]) {
    mesh(parent, `${name} fine cyan bezel edge`, roundedBox(4.88, 3.77, .035, .06), rim, 0, y, z);
    mesh(parent, `${name} metallic blue screen surround`, roundedBox(4.80, 3.69, .03, .04), parent === root ? baseShell : shell, 0, y, z + .018);
    mesh(parent, `${name} black screen recess`, roundedBox(4.60, 3.475, .008, .015), dark, 0, y, z + .048);
    const screen = mesh(parent, `${name} live 256x192 LCD`, new THREE.PlaneGeometry(4.5, 3.375),
      new THREE.MeshBasicMaterial({ color: '#101d23', toneMapped: false }), 0, y, z + .085);
    screen.castShadow = false;
    screen.geometry.userData.viewport = { width: 4.5, height: 3.375 };
    screens.push(screen);
  }
  screens[1].userData.touchscreen = true;
  for (const x of [-3.32, 3.32]) {
    for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
      circle(lid, 'Recessed speaker opening', .040, .008, dark, x + (col - 1) * .23, 2.23 + row * .26, .157);
    }
    for (const y of [.55, 4.32]) mesh(lid, 'Flush lid rubber bumper', roundedBox(.18, .18, .012, .025), rim, x, y, .167);
  }
  const hinge = new THREE.Group();
  hinge.name = 'Continuous segmented DS Lite hinge';
  hinge.position.set(0, 0, .07);
  root.add(hinge);
  for (const [x, width, material, name] of [
    [0, 6.90, shell, 'Continuous metallic blue hinge barrel'],
    [3.80, .72, lime, 'Right lime hinge end cap'],
  ]) {
    const barrel = mesh(hinge, name, new THREE.CylinderGeometry(.255, .255, width, 48), material, x);
    barrel.rotation.z = Math.PI / 2;
  }
  for (const [start, material, name] of [
    [-Math.PI / 2, lime, 'Left lime front hinge end cap'],
    [Math.PI / 2, lime, 'Left lime rear hinge end cap'],
  ]) {
    const cap = mesh(hinge, name, new THREE.CylinderGeometry(.255, .255, .72, 24, 1, false, start, Math.PI), material, -3.80);
    cap.rotation.z = Math.PI / 2;
  }
  for (const x of [-3.43, 3.43]) {
    const collar = mesh(hinge, 'Narrow hinge collar seam', new THREE.CylinderGeometry(.258, .258, .035, 48), edge, x);
    collar.rotation.z = Math.PI / 2;
    mesh(lid, 'Lid-to-barrel hinge leaf', roundedBox(.28, .34, .10, .035), shell, x, .22, -.04);
  }
  const microphone = circle(hinge, 'Recessed center microphone pinhole', .026, .008, dark, 0, .01, .258);
  microphone.castShadow = false;
  text(hinge, 'MIC', .24, 0, .12, .247, '#EAF5FF', .07);
  for (const x of [3.72, 3.85]) mesh(hinge, 'Hinge indicator recess', roundedBox(.037, .14, .012, .01), dark, x, .035, .25);
  const branding = [
    mesh(root, 'Supplied transparent DS underside emblem', new THREE.PlaneGeometry(3.2, 3.2 * 732 / 2149),
      new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false }), -1.65, -2.43, -.265),
  ];
  branding[0].rotation.y = Math.PI;
  for (const emblem of branding) { emblem.visible = false; emblem.castShadow = false; }
  const controls = new Map();
  const cap = (id, x, y, radius, material, title = id.toUpperCase()) => {
    circle(root, `${title} recessed socket`, radius + .025, .012, edge, x, y, .25);
    const profile = [[0, -.0425], [radius - .018, -.0425], [radius, -.025],
      [radius, .018], [radius - .015, .035], [radius * .65, .044], [0, .047]];
    const geometry = new THREE.LatheGeometry(profile.map(point => new THREE.Vector2(...point)), 32);
    geometry.rotateX(Math.PI / 2);
    const button = mesh(root, `${title} button`, geometry, material, x, y, .29);
    button.userData.restZ = button.position.z;
    controls.set(id, { mesh: button, anchor: button, width: radius * 2.25, height: radius * 2.25 });
    if (title) text(button, title, radius * 1.22, 0, 0, .052, '#EAF5FF', radius * 1.06);
    return button;
  };
  for (const [id, x, y] of [['x', 3.3, -1.32], ['a', 3.84, -1.87], ['b', 3.3, -2.41], ['y', 2.75, -1.87]]) {
    cap(id, x, y, .195, buttonPlastic);
  }
  const dpad = new THREE.Group();
  dpad.name = 'Electric blue cross D-pad';
  dpad.position.set(-3.17, -1.83, .285);
  dpad.userData.restZ = .285;
  root.add(dpad);
  const cross = new THREE.Shape();
  for (const [index, [x, y]] of [
    [-.17, .54], [.17, .54], [.17, .17], [.54, .17], [.54, -.17], [.17, -.17],
    [.17, -.54], [-.17, -.54], [-.17, -.17], [-.54, -.17], [-.54, .17], [-.17, .17],
  ].entries()) {
    if (index === 0) cross.moveTo(x, y); else cross.lineTo(x, y);
  }
  cross.closePath();
  const crossGeometry = new THREE.ExtrudeGeometry(cross, { depth: .085, bevelEnabled: true, bevelSize: .018, bevelThickness: .018, bevelSegments: 3, steps: 1 });
  crossGeometry.translate(0, 0, -.035);
  mesh(dpad, 'Single molded cross D-pad', crossGeometry, dpadPlastic);
  const directionMarks = new Map();
  const pressedDirection = new THREE.MeshBasicMaterial({ color: '#8BFF78', toneMapped: false });
  for (const [id, x, y, vertical] of [['up', 0, .36, true], ['down', 0, -.36, true], ['left', -.36, 0, false], ['right', .36, 0, false]]) {
    directionMarks.set(id, mesh(dpad, 'D-pad direction engraving',
      new THREE.BoxGeometry(vertical ? .022 : .12, vertical ? .12 : .022, .003), rim, x, y, .071));
  }
  for (const [id, x, y] of [['up', 0, .4], ['down', 0, -.4], ['left', -.4, 0], ['right', .4, 0]]) {
    const anchor = new THREE.Object3D();
    anchor.position.set(x, y, .1); dpad.add(anchor);
    controls.set(id, { mesh: dpad, anchor, width: .43, height: .43,
      indicator: directionMarks.get(id), restMaterial: rim, pressedMaterial: pressedDirection });
  }
  for (const [id, y] of [['start', -3.4], ['select', -3.9]]) {
    cap(id, 2.83, y, .095, buttonPlastic, '');
    text(root, id.toUpperCase(), .52, 3.43, y, .255, '#EAF5FF', .12);
  }
  for (const [id, x] of [['l', -3.4], ['r', 3.4]]) {
    const button = mesh(root, `${id.toUpperCase()} rear shoulder`, roundedBox(1.05, .40, .20, .075), lime, x, -.25, -.18);
    button.userData.restZ = -.18;
    const anchor = new THREE.Object3D();
    anchor.position.set(x, -.38, .28);
    root.add(anchor);
    controls.set(id, { mesh: button, anchor, width: 1.05, height: .40 });
    const mark = text(button, id.toUpperCase(), .23, 0, 0, -.14);
    mark.rotation.y = Math.PI;
  }
  const power = cap('power', -3.3, -4.22, .20, buttonPlastic, '');
  power.name = 'Front DS power button';
  const powerMark = new THREE.MeshBasicMaterial({ color: '#EAF5FF', toneMapped: false });
  const powerIcon = mesh(power, 'Power button icon ring', new THREE.TorusGeometry(.075, .012, 8, 24, Math.PI * 1.65),
    powerMark, 0, 0, .066);
  powerIcon.rotation.z = Math.PI * .675;
  mesh(power, 'Power button icon stem', roundedBox(.018, .09, .012, .006), powerMark, 0, .065, .066);
  text(root, 'POWER', .5, -3.3, -4.60, .255, '#EAF5FF', .09);
  const led = mesh(hinge, 'DS green hinge power indicator', roundedBox(.025, .10, .004, .008),
    new THREE.MeshStandardMaterial({ color: '#8BFF78', emissive: '#00c82d', emissiveIntensity: 0 }), 3.72, .035, .263);
  const expansion = mesh(root, 'Front navy expansion slot', roundedBox(3.9, .30, .025, .025), slot, -.12, -4.842, -.015);
  expansion.rotation.x = Math.PI / 2;
  const headphones = new THREE.Group();
  headphones.name = 'Front keyed headphone socket';
  headphones.position.set(3.26, -4.845, -.025);
  headphones.rotation.x = Math.PI / 2;
  root.add(headphones);
  mesh(headphones, 'Headphone keyed recess', roundedBox(.52, .12, .012, .04), dark);
  circle(headphones, 'Headphone round recess', .09, .014, dark, .17, .015, 0);
  mesh(root, 'Rear DS game-card slot', roundedBox(1.68, .18, .24, .02), dark, 1.4, .1, -.02);
  mesh(root, 'Underside right battery cover seam', roundedBox(2.81, 3.51, .008, .10), edge, 2.35, -2.43, -.27);
  mesh(root, 'Underside right battery cover', roundedBox(2.79, 3.49, .008, .09), baseShell, 2.35, -2.43, -.278);
  for (const [x, y] of [[-3.8, -.6], [3.8, -.6], [-3.8, -4.4], [3.8, -4.4], [2.35, -3.95]]) {
    const z = x === 2.35 ? -.292 : -.257;
    circle(root, 'Underside screw recess', .07, .012, dark, x, y, z);
    mesh(root, 'Screw head slot', new THREE.BoxGeometry(.06, .015, .006), lavender, x, y, z - .008);
  }
  for (const x of [-3.65, 3.65]) for (const y of [-.70, -4.30]) {
    mesh(root, 'Underside rubber table foot', roundedBox(.30, .22, .024, .05), dark, x, y, -.30);
  }
  const cartridge = new THREE.Group();
  cartridge.name = 'Insertable DS game card';
  cartridge.position.set(1.4, .44, -.02);
  cartridge.visible = false;
  root.add(cartridge);
  mesh(cartridge, 'Black DS card shell', roundedBox(1.46, 1.56, .13, .04), dark);
  mesh(cartridge, 'DS card label', roundedBox(1.19, 1.0, .015, .03), navy, 0, .1, .08);
  text(cartridge, 'BOWSERBOY', 1.03, 0, .25, .1, '#eaf2ff', .16);
  text(cartridge, 'DS / LOCAL', 1.0, 0, -.05, .1, '#c7ed64', .12);
  const stylus = new THREE.Group();
  stylus.name = 'Docked molded DS stylus with short rounded nib';
  stylus.position.set(4.39, -2.43, -.025);
  root.add(stylus);
  const stylusPlastic = lime.clone();
  mesh(root, 'Stylus side docking channel', roundedBox(.24, 4.22, .075, .05), edge, 4.27, -2.43, -.075);
  mesh(stylus, 'Molded lime stylus shaft', new THREE.CylinderGeometry(.073, .065, 3.64, 24), stylusPlastic, 0, -.03);
  mesh(stylus, 'Flat stylus pull tab', roundedBox(.24, .38, .13, .06), stylusPlastic, 0, 1.86, .015);
  mesh(stylus, 'Short molded retention hook', roundedBox(.075, .22, .08, .025), stylusPlastic, -.115, 1.89, .04);
  mesh(stylus, 'Pull tab release groove', roundedBox(.025, .19, .008, .008), dark.clone(), -.04, 1.88, .119);
  mesh(stylus, 'Tapered plastic stylus nose', new THREE.CylinderGeometry(.065, .028, .20, 24), stylusPlastic, 0, -1.95);
  const nib = mesh(stylus, 'Short rounded polymer touch nib', new THREE.SphereGeometry(.032, 16, 12), lavender.clone(), 0, -2.07);
  nib.scale.set(1, 1.8, 1);
  const stylusTip = new THREE.Object3D();
  stylusTip.name = 'Stylus contact tip';
  stylusTip.position.set(0, -2.07 - .032 * 1.8, 0);
  stylus.add(stylusTip);
  const stylusGlow = mesh(stylus, 'Stylus hover halo', new THREE.CylinderGeometry(.12, .105, 4.18, 24),
    new THREE.MeshBasicMaterial({ color: '#b8ff8a', transparent: true, opacity: .3,
      side: THREE.BackSide, depthWrite: false, toneMapped: false }), 0, -.04);
  stylusGlow.visible = stylusGlow.castShadow = stylusGlow.receiveShadow = false;
  stylus.traverse(object => { object.userData.dsStylus = true; });
  for (const y of [-.90, -4.02]) {
    mesh(root, 'Shell-integrated stylus retaining clip', roundedBox(.35, .16, .10, .035), baseShell, 4.30, y, .055);
  }
  return { root, lid, hinge, screens, screen: screens[1], controls, led, power, cartridge,
    stylus, stylusTip, stylusGlow, stylusPlastic, branding };
}
