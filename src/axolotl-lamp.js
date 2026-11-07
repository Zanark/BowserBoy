import * as THREE from 'three';

export function createAxolotlLamp() {
  const root = new THREE.Group();
  root.name = 'Small axolotl night-light';
  const silicone = new THREE.MeshStandardMaterial({
    color: '#fff0dd', roughness: .72, emissive: '#ffdcab', emissiveIntensity: 45,
  });
  const pink = new THREE.MeshStandardMaterial({
    color: '#ffa3bb', roughness: .72, emissive: '#ffc1cd', emissiveIntensity: 24,
  });
  const ink = new THREE.MeshBasicMaterial({ color: '#26120e', toneMapped: false });
  const blush = new THREE.MeshBasicMaterial({ color: '#f399aa', toneMapped: false });
  const sphere = new THREE.SphereGeometry(1, 32, 24);
  function mesh(name, geometry, material, position) {
    const object = new THREE.Mesh(geometry, material);
    object.name = `axolotl ${name}`;
    object.position.set(...position);
    object.userData.axolotlLamp = true;
    object.receiveShadow = true;
    root.add(object);
    return object;
  }
  function oval(name, material, position, scale) {
    const object = mesh(name, sphere, material, position);
    object.scale.set(...scale);
    return object;
  }
  oval('soft rounded body', silicone, [0, 1.12, -1.35], [1.22, .97, 1.98]);
  const head = oval('rounded glowing head', silicone, [0, 1.45, .2], [1.65, 1.3, 1.32]);
  function front(x, y, inset = .035) {
    return new THREE.Vector3(x, y,
      .2 + 1.32 * Math.sqrt(1 - (x / 1.65) ** 2 - ((y - 1.45) / 1.3) ** 2) + inset);
  }
  const petal = new THREE.Shape();
  petal.moveTo(0, 0);
  petal.bezierCurveTo(.28, .34, .86, .53, 1.02, .19);
  petal.bezierCurveTo(1.14, -.19, .45, -.34, 0, 0);
  const gillGeometry = new THREE.ExtrudeGeometry(petal, {
    depth: .12, bevelEnabled: true, bevelSize: .09, bevelThickness: .09, bevelSegments: 3, steps: 1,
  });
  for (const side of [-1, 1]) {
    for (const angle of [-.8, 0, .8]) {
      const gill = mesh('pink gill petal', gillGeometry, pink, [side * 1.43, 1.48, .24]);
      gill.rotation.z = side * angle;
      gill.scale.x = side;
    }
    const eye = oval('black bead eye', ink, front(side * .79, 1.55).toArray(), [.115, .145, .07]);
    const cheek = oval('rosy cheek', blush, front(side * 1.05, 1.24).toArray(), [.19, .085, .045]);
    for (const feature of [eye, cheek]) {
      const { x, y, z } = feature.position;
      feature.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(x / 1.65 ** 2, (y - 1.45) / 1.3 ** 2, (z - .2) / 1.32 ** 2).normalize());
    }
    for (const z of [-.65, -2.45]) {
      const foot = oval('tiny pink foot', pink, [side * 1.08, .3, z], [.34, .3, .46]);
      foot.rotation.y = side * -.2;
      for (const toe of [-1, 0, 1]) {
        oval('little rounded toe', pink, [side * 1.08 + toe * .17, .12, z + .37], [.105, .12, .17]);
      }
    }
  }
  const smile = new THREE.CatmullRomCurve3([
    [-.59, 1.31], [-.36, 1.2], [-.08, 1.23], [.2, 1.2], [.42, 1.23], [.6, 1.34],
  ].map(([x, y]) => front(x, y, .045)));
  mesh('gentle wavy smile', new THREE.TubeGeometry(smile, 32, .024, 6, false), ink, [0, 0, 0]);
  const fin = new THREE.Shape();
  fin.moveTo(0, 0);
  fin.bezierCurveTo(.65, -.18, 1.42, .12, 1.55, 1.65);
  fin.bezierCurveTo(.98, 1.23, .95, .29, 0, .83);
  fin.closePath();
  const tail = mesh('upturned cream tail', new THREE.ExtrudeGeometry(fin, {
    depth: .12, bevelEnabled: true, bevelSize: .09, bevelThickness: .09, bevelSegments: 3, steps: 1,
  }), silicone, [0, .55, -2.72]);
  tail.rotation.y = Math.PI / 2;
  const tip = new THREE.Shape();
  tip.moveTo(1.01, .58);
  tip.bezierCurveTo(1.3, .84, 1.48, 1.24, 1.55, 1.65);
  tip.bezierCurveTo(1.15, 1.35, 1.11, .96, 1.01, .58);
  tip.closePath();
  const tailTip = mesh('pink tail tip', new THREE.ExtrudeGeometry(tip, {
    depth: .4, bevelEnabled: true, bevelSize: .035, bevelThickness: .035, bevelSegments: 3, steps: 1,
  }), pink, [0, .55, -2.72]);
  tailTip.rotation.y = Math.PI / 2;
  tailTip.translateZ(-.14);
  const light = new THREE.PointLight('#ffd29e', 130, 24, 2);
  light.name = 'axolotl soft warm pool';
  light.position.set(0, .65, -.5);
  root.add(light);
  return { root, head, silicone, pink, light };
}
