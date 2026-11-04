# Third-party notices and provenance

This independent prototype is not affiliated with Nintendo. Game Boy Advance
is a Nintendo trademark. No commercial games, firmware/BIOS images, franchise
characters, box art or manufacturer logo bytes are included.

## Runtime dependencies

- **EmulatorJS 4.2.3**: fetched at runtime from
  `https://cdn.emulatorjs.org/4.2.3/data/`.
  [Release source](https://github.com/EmulatorJS/EmulatorJS/tree/v4.2.3),
  [GNU GPL v3 license](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/LICENSE).
- **mGBA**: the GBA emulation core selected by EmulatorJS.
  [Project/source](https://github.com/mgba-emu/mgba),
  [Mozilla Public License 2.0](https://github.com/mgba-emu/mgba/blob/master/LICENSE).
- **RetroArch and other bundled runtime components**: delivered by the upstream
  EmulatorJS distribution, with their own notices and licenses. See
  [EmulatorJS core documentation](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/cores/README.md)
  and [the upstream RetroArch fork](https://github.com/EmulatorJS/RetroArch).
- **CRT Geom**: selected from the native shader collection distributed with
  EmulatorJS 4.2.3. [Pinned shader collection](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/src/shaders.js).
  Shader code/resources remain supplied by that runtime, with their upstream
  notices; this application does not vendor, modify or rename the shader.

The prototype does not vendor or modify those emulator runtime files. A
versioned CDN URL is not an integrity hash or a full native-core reproducibility
record. Before mirroring, modifying or redistributing a bundled emulator build,
preserve its notices and provide corresponding source as its licenses require;
do not assume this page replaces those obligations.

## Bundled 3D library

**Three.js 0.186.1**, Copyright 2010-2026 Three.js Authors, is MIT licensed.
[Source](https://github.com/mrdoob/three.js),
[pinned npm package](https://www.npmjs.com/package/three/v/0.186.1).
The static build copies the unmodified `three.module.js`, `three.core.js`,
`RectAreaLightUniformsLib.js` and `RectAreaLightTexturesLib.js` from that pinned
package. The latter two supply the rectangular-light LTC lookup resources.
It also copies the full package license to `dist/vendor/THREE-LICENSE.txt`. That notice is
included in the deployed artifact. No other dependency files are exposed.

## Original prototype assets

The cartridge icon, procedural handheld/table/cartridge/lamp geometry, canvas
textures and project lettering, UI composition, and Pixel Lab
test program were created for this project. The generated test program omits
the Nintendo boot-logo array and is intended for emulator testing, not as a
claim of booting on physical retail hardware.

The refreshed handheld/infinity logo, SVG favicon, LCD startup animation and
three-note synthesized chime are independently authored assets. The user's
[Game Boy Advance startup reference](https://www.youtube.com/watch?v=AyP1Nj9zU3k)
informed the white-screen/colored-letter presentation, not an imported video,
Nintendo logo, BIOS or audio recording. None of those reference bytes is bundled.

Playwright is a development/test dependency, not part of the deployed app.
Its package and transitive packages retain their upstream license notices in
the dependency installation.

## Visual shape reference

The user supplied [Nintendo Gameboy Advance (GBA), by Andy Dream on Sketchfab](https://sketchfab.com/3d-models/nintendo-gameboy-advance-gba-a0b6d1eb5ccb4c72a6944d77b3ac7c05)
as a shape reference. On 2026-11-04 its public model API reported
`isDownloadable: false` and an empty license object. No permission to reuse its
mesh or textures was established. The application instead uses independently
authored procedural geometry informed by its visible silhouette and proportions.
No viewer assets were extracted; the reference thumbnail, logo textures and
boot image are not bundled or deployed.
