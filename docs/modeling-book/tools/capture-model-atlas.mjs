import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { confined, sha256 } from '../../book/production/lib.mjs';
import { sourceBase } from '../catalogue.mjs';
import { siteSource } from '../../../scripts/site-files.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..', '..');
const require = createRequire(new URL('../../book/production/package.json', import.meta.url));
const { chromium } = require('playwright-core');
const output = path.join(root, 'docs', 'modeling-book', 'assets', 'atlas');
const modules = ['handheld', 'ds-handheld', 'pear-boy', 'axolotl-lamp', 'lighting', 'brand', 'pear-rope'];
const scriptSha256 = sha256(await fs.readFile(fileURLToPath(import.meta.url)));
const supportInputs = [];
for (const relative of ['docs/book/production/lib.mjs', 'docs/modeling-book/catalogue.mjs',
  'node_modules/three/package.json', 'docs/book/production/package-lock.json']) {
  const bytes = await fs.readFile(await confined(root, relative));
  supportInputs.push({ path: relative, sha256: sha256(bytes) });
}
const sourceInputs = [];
for (const relative of [...modules.map(name => `src/${name}.js`), 'scripts/site-files.mjs']) {
  const bytes = await fs.readFile(await confined(root, relative));
  const pinned = execFileSync('git', ['show', `${sourceBase}:${relative}`], { cwd: root });
  const canonical = Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'));
  if (!canonical.equals(Buffer.from(pinned.toString('utf8').replaceAll('\r\n', '\n')))) {
    throw new Error(`Atlas source differs from pinned implementation beyond line endings: ${relative}`);
  }
  sourceInputs.push({ path: relative, sha256: sha256(bytes), pinnedSha256: sha256(pinned),
    identity: 'Committed source matches after explicit CRLF-to-LF normalization; raw capture input separately hashed.' });
}
const resourceMap = new Map(modules.map(name =>
  [`/src/${name}.js`, { base: root, relative: `src/${name}.js`, type: 'text/javascript' }]));
for (const name of ['RectAreaLightUniformsLib.js', 'RectAreaLightTexturesLib.js']) {
  const file = path.join('vendor', name);
  resourceMap.set(`/vendor/${name}`, { base: root, relative: siteSource(file), type: 'text/javascript' });
}
resourceMap.set('/assets/inspection-logo.png', {
  base: root, relative: siteSource(path.join('assets', 'inspection-logo.png')), type: 'image/png',
});
const trackedAssets = execFileSync('git', ['ls-files', '-z', '--', 'assets'], { cwd: root, encoding: 'utf8' })
  .split('\0').filter(name => /\.(png|svg|jpe?g|webp)$/.test(name));
for (const relative of trackedAssets) resourceMap.set(`/${relative}`, {
  base: root, relative, type: relative.endsWith('.svg') ? 'image/svg+xml' : `image/${path.extname(relative).slice(1)}`,
});
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Original factory diagnostics</title>
<style>html,body{margin:0;width:100%;height:100%;overflow:hidden}canvas{display:block}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';
import {createHandheld,createCartridge} from '/src/handheld.js';
import {createDsHandheld} from '/src/ds-handheld.js';
import {createPearBoy} from '/src/pear-boy.js';
import {createAxolotlLamp} from '/src/axolotl-lamp.js';
import {createDeskLamp} from '/src/lighting.js';
import {loadBrand} from '/src/brand.js';
await loadBrand();
const factories={gba:createHandheld,ds:createDsHandheld,pear:createPearBoy,
  axolotl:createAxolotlLamp,lamp:createDeskLamp,
  cartridge:()=>({root:createCartridge('#648579','DAYDREAM','EMPTY CARTRIDGE')})};
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(1000,800);
renderer.setPixelRatio(1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1;
document.body.append(renderer.domElement);
let previous;
window.captureFactory=async (name,view)=>{
  if(previous)previous.traverse(object=>{
    object.geometry?.dispose();
    for(const material of [object.material].flat().filter(Boolean))material.dispose();
  });
  const model=factories[name]();
  if(!model.root?.isObject3D)throw new Error('Factory did not return a model root: '+name);
  const root=model.root;
  const api=Object.keys(model).filter(key=>typeof model[key]==='function');
  if(name==='ds'){
    if(!model.lid?.isGroup)throw new Error('Missing returned DS lid group');
    model.lid.rotation.x=THREE.MathUtils.degToRad(15);
  }
  root.updateMatrixWorld(true);
  const images=[];
  root.traverse(object=>{
    if(object.isLight)object.visible=false;
    for(const material of [object.material].flat().filter(Boolean)){
      if('emissiveIntensity' in material)material.emissiveIntensity=0;
      for(const value of Object.values(material)){
        if(value?.isTexture&&value.image instanceof HTMLImageElement)images.push(value.image);
      }
    }
  });
  await Promise.all([...new Set(images)].map(image=>image.decode()));
  await document.fonts.ready;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#eeeade');
  scene.add(root);
  scene.add(new THREE.HemisphereLight('#fff8ea','#68786d',2.4));
  const key=new THREE.DirectionalLight('#fff1dc',3.3);
  key.position.set(-5,9,10);scene.add(key);
  const fill=new THREE.DirectionalLight('#d2e8ff',1.25);
  fill.position.set(7,3,-8);scene.add(fill);
  const bounds=new THREE.Box3().setFromObject(root);
  if(bounds.isEmpty())throw new Error('Empty model bounds: '+name);
  const center=bounds.getCenter(new THREE.Vector3());
  const diagonal=bounds.getSize(new THREE.Vector3()).length();
  const direction=({
    front:new THREE.Vector3(0,0,1),
    back:new THREE.Vector3(0,0,-1),
    'three-quarter':new THREE.Vector3(1,.65,1.3).normalize()
  })[view];
  if(!direction)throw new Error('Unsupported atlas view: '+view);
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,diagonal*12+100);
  camera.position.copy(center).addScaledVector(direction,diagonal*3+1);
  camera.lookAt(center);camera.updateMatrixWorld(true);
  let maxX=0,maxY=0;
  for(const x of [bounds.min.x,bounds.max.x])
    for(const y of [bounds.min.y,bounds.max.y])
      for(const z of [bounds.min.z,bounds.max.z]){
        const corner=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);
        maxX=Math.max(maxX,Math.abs(corner.x));maxY=Math.max(maxY,Math.abs(corner.y));
      }
  const halfHeight=Math.max(maxY,maxX/1.25)*1.13;
  camera.left=-halfHeight*1.25;camera.right=halfHeight*1.25;
  camera.top=halfHeight;camera.bottom=-halfHeight;camera.updateProjectionMatrix();
  renderer.render(scene,camera);
  const gl=renderer.getContext();
  gl.finish();
  const pixels=new Uint8Array(4*1000*800);gl.readPixels(0,0,1000,800,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
  const rgb=[...pixels.slice(0,3)];
  let differing=0;
  for(let offset=0;offset<pixels.length;offset+=4)
    if(Math.max(...rgb.map((value,index)=>Math.abs(pixels[offset+index]-value)))>15)differing++;
  if(differing<1000)throw new Error('Diagnostic render is empty: '+name+'/'+view);
  previous=root;
  return {name,view,api,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},
    projection:'orthographic',dsLidRotationXRadians:name==='ds'?THREE.MathUtils.degToRad(15):null,
    submittedPixelsDifferingFromBackground:differing,
    geometryMeshes:root.getObjectsByProperty('isMesh',true).length};
};
window.atlasReady=true;
</script></html>`;
const failures = [];
const servedResources = new Map();
const server = http.createServer(async (request, response) => {
  try {
    const name = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (name === '/') { response.writeHead(200, { 'Content-Type': 'text/html' }); response.end(html); return; }
    if (name === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    let resource = resourceMap.get(name);
    if (!resource && name.startsWith('/three/') && name.endsWith('.js')) resource = {
      base: path.join(root, 'node_modules', 'three'), relative: name.slice('/three/'.length), type: 'text/javascript',
    };
    if (!resource) throw new Error(`Unapproved atlas resource: ${name}`);
    const bytes = await fs.readFile(await confined(resource.base, resource.relative));
    servedResources.set(name, { url: name, sha256: sha256(bytes), bytes: bytes.length });
    response.writeHead(200, { 'Content-Type': resource.type, 'Cache-Control': 'no-store' });
    response.end(bytes);
  } catch (error) {
    failures.push(error.message); response.writeHead(500); response.end('Atlas resource failed');
  }
});
await new Promise((resolve, reject) => {
  server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
});
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  const executablePath = process.env.BOOK_BROWSER ||
    path.join(process.env['ProgramFiles(x86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe');
  browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1000, height: 800 } });
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.startsWith(`${origin}/`) || /^(data:|blob:|about:)/.test(url)) return route.continue();
    failures.push(`External atlas request blocked: ${new URL(url).origin}`);
    return route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => failures.push(error.message));
  await page.goto(origin, { waitUntil: 'load' });
  await page.waitForFunction(() => window.atlasReady, null, { timeout: 30000 });
  await fs.mkdir(output, { recursive: true });
  const captures = [];
  for (const name of ['gba', 'ds', 'pear', 'axolotl', 'lamp', 'cartridge']) {
    for (const view of ['front', 'back', 'three-quarter']) {
      const evidence = await page.evaluate(({ name, view }) => window.captureFactory(name, view), { name, view });
      if (failures.length) throw new Error(failures.join('\n'));
      const file = `${name}-${view}.png`;
      const bytes = await page.locator('canvas').screenshot({ path: path.join(output, file) });
      captures.push({ file, sha256: sha256(bytes), bytes: bytes.length, ...evidence });
      console.log(`${file}: ${evidence.geometryMeshes} actual meshes, captured`);
    }
  }
  for (const source of sourceInputs) {
    if (sha256(await fs.readFile(await confined(root, source.path))) !== source.sha256) {
      throw new Error(`Model changed during atlas capture: ${source.path}`);
    }
    for (const input of supportInputs) {
      if (sha256(await fs.readFile(await confined(root, input.path))) !== input.sha256) {
        throw new Error(`Atlas helper changed during capture: ${input.path}`);
      }
    }
    if (sha256(await fs.readFile(fileURLToPath(import.meta.url))) !== scriptSha256) {
      throw new Error('Atlas generator changed during capture.');
    }
  }
  await fs.writeFile(path.join(output, 'capture-manifest.json'), JSON.stringify({
    sourceBase, generatedAt: new Date().toISOString(), browser: browser.version(),
    three: JSON.parse(await fs.readFile(path.join(root, 'node_modules', 'three', 'package.json'), 'utf8')).version,
    conditions: 'Original procedural factory geometry; neutral studio lighting; model lights hidden and material emission disabled to inspect base surfaces; ACES exposure 1; orthographic views; DS returned lid group rotated 15 degrees around local X. Not application-room photometry, lamp-power appearance, animation, historical artwork or gameplay evidence.',
    generator: { path: 'docs/modeling-book/tools/capture-model-atlas.mjs', sha256: scriptSha256 },
    sourceInputs, supportInputs, servedResources: [...servedResources.values()], captures, externalRequests: 0,
  }, null, 2));
  console.log(`Captured ${captures.length} original-factory diagnostics; no ROM or application initialization.`);
} catch (error) {
  throw new Error([error.message, ...failures].join('\n'), { cause: error });
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
