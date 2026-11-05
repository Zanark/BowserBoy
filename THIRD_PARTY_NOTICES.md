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
Its optional audio-test variant emits an original PSG test tone, not music or
samples taken from a game. The ordinary bundled demo remains byte-identical.

The original handheld SVG favicon, original LCD animation code and
three-note synthesized chime are independently authored assets. The user's
[Game Boy Advance startup reference](https://www.youtube.com/watch?v=AyP1Nj9zU3k)
informed the white-screen/colored-letter presentation, not an imported video,
Nintendo logo, BIOS or audio recording. None of those reference bytes is bundled.

The first supplied website wordmark was derived from raster artwork supplied
by the user on 2026-11-04 for this purpose. Its exterior background/shadow was
removed, BowserBOY and ADVANCE were separated, and the white outline was rebuilt
with antialiased edges while retaining the supplied lettering. The original full
background image is not bundled. This wordmark is not independently authored
application artwork; no separate upstream license or authorship claim is made.

The console's `assets/logo.png` supersedes that first edition with the user's
later transparent purple orbital wordmark. The supplied 2170x725 RGBA PNG is
used byte-for-byte, including its white lettering, purple rim and orbit/star
accents; no background extraction, regeneration or recoloring was applied.
The opaque-background reference and future color-variant sheet are not included
in the static release. No alternate colors are enabled. Supplied-artwork
provenance and the absence of an independent authorship/license claim remain.
The same supplied PNG is used on the rear shell, idle/loading LCD, orbital
startup. The front bezel derives metallic chroma lettering from the supplied
wordmark; the top ZANARK maker badge uses original geometric glyphs,
extrusion and a chamfered frame, not a manufacturer logo or imported font asset.
The startup's gentle wordmark wave is original animation code and does not
modify the supplied PNG. The earlier `assets/star.png` was a crop from
pixel rectangle(1650,90)-(1835,280) of that supplied logo; it included unwanted
orbit fragments and hard cutoffs, and has been superseded.

The website's `assets/website-logo.png` is the separately supplied **BOWSERBOY
Chrome Sparkle Logo**, received2026-11-05. Its2151x731transparent RGBA PNG is
copied byte-for-byte, with SHA-256
`804b1a96494dbecc9fa732e2772e8f2d23c9eb21bcd8286d9dc00b1fbf46c808`.
It appears in the website header, tools/settings panels and README lead image,
not on the GBA console. No regeneration, background removal, recoloring,
independent authorship or separate upstream license claim is made.

The current `assets/star.png`, `assets/glow.png` and `assets/orbit.png` derive
from the user's separately supplied **Purple Neon Sparkle and Orbital Sprite
Sheet**, a 2172x724 transparent RGBA PNG. Complete isolated effects are trimmed
only of alpha<=1 noise and centered on transparent padded canvases. No
independent authorship or separate upstream license is claimed for this supplied
artwork. Exact source identity, crop rectangles and reproduction appear in
[media provenance](docs/MEDIA.md). The orbit motion and starfield are original code.

The active `assets/brand-mark.svg` favicon is original vector artwork using
the procedural 3D handheld's shell outline and simplified physical controls.
It replaces the earlier generic rounded/infinity artwork and supplied-star
tab icon, without importing a manufacturer's logo or reference image.

The README's transparent animated orbital banner derives from that same supplied
logo and the separately supplied effect sprites, with original animation code.
Its interaction GIFs record this application and the original Pixel Lab demo,
not commercial game footage.
See [media provenance and reproduction](docs/MEDIA.md).

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

The user also supplied a cylindrical paper-shade/wooden-base lamp image on
2026-11-04 as a visual reference. The application uses original procedural
geometry and deterministic paper/wood textures; neither that image nor an
external lamp model/texture is bundled. No reuse license or independent
authorship of the reference image is claimed.
