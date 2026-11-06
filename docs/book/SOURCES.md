# Source register and edition boundary

This edition explains application commit
[`ab912d51ecc615f7aa55a4d27f6a876673739cdf`](https://github.com/Zanark/BowserBoyAdvance/tree/ab912d51ecc615f7aa55a4d27f6a876673739cdf).
The table identifies actual mechanisms, not just filenames. Links are pinned
so later documentation-only commits do not silently change the cited source.

| ID | Source and symbols | What this supports |
|---|---|---|
| S-01 | [`src/app.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/app.js): `launch`, `loadRom`, `togglePower`, `rememberDevice`, fullscreen handlers | Host ownership, cartridge switching, distinct power/checkpoint behavior, same-session presentation |
| S-02 | [`src/player.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/player.js): `initialize`, `configure`, `input`, `restore`, message listener | Pinned adapter, loader configuration, input sources, native VSync, preserved framebuffer and command protocol |
| S-03 | [`src/cartridge.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/cartridge.js): `identifyRom`, `latestSlot`, `encodeBackup`, `decodeBackup` | Content identity, size/header limits, runtime compatibility, bounded binary encoding and corruption detection |
| S-04 | [`src/save-store.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/save-store.js): `SaveStore`, `putSlot`, `putBattery`, `#transaction` | Database stores, atomic updates, commit acknowledgement and explicit storage errors |
| S-05 | [`src/handheld.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/handheld.js): `createHandheld`, extruded shapes and bezel texture | Original meshes, apertures, control relief and shared monochrome wordmark |
| S-06 | [`src/scene.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/scene.js): `updateCameraTargets`, `project`, `render`, `insertCartridge` | Projection, safe regions, animation, adaptive scene painting and view changes |
| S-07 | [`src/lighting.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/lighting.js): `ScreenIllumination`, `createDeskLamp`, `createRoomLighting` | Linear-light averaging, sampling cadence, independent lights and approximated bounce |
| S-08 | [`src/keyboard.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/keyboard.js): `bindKeyboard`; [`src/preferences.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/preferences.js): `CONTROLS`, validators | Held-key cleanup, duplicate binding rejection, nine CRT choices and managed options |
| S-09 | [`src/startup.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/src/startup.js): `drawStartup`, `playStartup`, `playStartupSound` | High-resolution original boot art, sliced wave, reduced-motion behavior and synthesized chime |
| S-10 | [`scripts/site-files.mjs`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/scripts/site-files.mjs), [`scripts/build.mjs`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/scripts/build.mjs) | Static output allowlist, local vendor mapping and original demo generation |
| S-11 | [`tests/browser/dock.spec.mjs`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/tests/browser/dock.spec.mjs), [`tests/browser/scene.spec.mjs`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/tests/browser/scene.spec.mjs) | Native clock evidence, fullscreen, physical geometry, notice clearance and actual pinch regression |
| S-12 | [`.github/workflows/pages.yml`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/.github/workflows/pages.yml) | Full build/browser gates before Pages deployment |
| S-13 | [`scripts/capture-readme.mjs`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/scripts/capture-readme.mjs), [`scripts/render-readme.py`](https://github.com/Zanark/BowserBoyAdvance/blob/ab912d51ecc615f7aa55a4d27f6a876673739cdf/scripts/render-readme.py) | Actual browser recording, timing receipts, GIF encoding and separate banner generation |

## Later lettering delta

Workstream45's metallic chroma follow-up is a deliberate update beyond the
pinned first edition above. Qualified [`createHandheld`](https://github.com/Zanark/BowserBoyAdvance/blob/ad259c3263dc36b668036425c45b5b8cb8910d1e/src/handheld.js)
paints static chrome bands/tint inside the retained letter alpha;
[`app.js`](https://github.com/Zanark/BowserBoyAdvance/blob/ad259c3263dc36b668036425c45b5b8cb8910d1e/src/app.js) shares that exact canvas with the fullscreen DOM.
The [verification record](../VERIFICATION.md#metallic-chroma-lettering-2026-11-05)
identifies qualification and delivery. The original source links and historical
monochrome screenshots are not silently relabeled as this later edition.

## Later rear-logo delta

Workstream46adds a larger colored engraving beyond the pinned first edition.
Qualified [`alphaContours` and `engraveRearLogo`](https://github.com/Zanark/BowserBoyAdvance/blob/a7a07fc0b143d531a662e8ecc7c7b5dce68c07b6/src/handheld.js) reuse contour
extraction, classify nested plastic islands and retain the original bright
artwork on real inset floors. The
[verification record](../VERIFICATION.md#larger-etched-rear-logo-2026-11-05)
separates local qualification, actual delivery and aesthetic acceptance.
Historical rear-view figures keep their original provenance.

Workstream 51 further enlarges the frame to 3.45 units and deepens the same
colored cavities to .024 units without changing the artwork or cover.
Qualified [`engraveRearLogo`](https://github.com/Zanark/BowserBoyAdvance/blob/cf53ecc05ea27a9c26e60a87d0306de1bce78bc5/src/handheld.js)
retains the same contour/floor/wall mechanism. Its
[separate verification record](../VERIFICATION.md#deeper-rear-engraving-2026-11-05)
tracks this later parameter change; the original edition and 46 source stay pinned.

## Later website identity delta

Workstream47separates chrome website identity
([`index.html`](https://github.com/Zanark/BowserBoyAdvance/blob/f5bc63933a88040c46879645e91a107fbe930df5/index.html),
`assets/website-logo.png`, header shadows in`styles.css`) from the unchanged
purple console loader in
[`src/brand.js`](https://github.com/Zanark/BowserBoyAdvance/blob/f5bc63933a88040c46879645e91a107fbe930df5/src/brand.js). Its
[verification record](../VERIFICATION.md#bowserboy-website-brand-separation-2026-11-05)
tracks local checks and public delivery separately. Additional consoles and
the owner's repository rename are not implemented by that branding change.

## Current documentation and media

The earlier workstream 48 refreshes README media on the actual public application, whose
29 assets independently match the qualified `f5bc639` source above.
The recording checkout `9140b53` is documentation-only. That edition's `readme-*`
figures and GIFs show the later chrome website, purple console, metallic bezel
and etched rear; the first-edition source pins and historical geometry figures
remain intact. See [Media](../MEDIA.md#bowserboy-public-refresh-2026-11-05)
for actual origin, timestamps, review scope and the previous local media edition.

Workstream 68 replaces shared README captures with the current local application
source `82834df242aa7f0cec6cfa634e0966e7a3a500ec`. Figure B-01 and the shared
startup GIF now use that capture edition; the book's pinned implementation
sources and historical geometry figures remain unchanged. The
[new media receipt](../MEDIA.md#complete-readme-refresh-2026-11-05)
separates local footage, authorized GIF-only game content and publication.

Workstreams 69/70 subsequently refresh Figure B-01, five shared stills and
pickup/inspection footage from local application `6fb1890`, and add an actual
movable-dock GIF. No ROM is loaded in that take. See the
[dock/inspection receipt](../MEDIA.md#movable-dock-and-inspection-branding-2026-11-06).
The pinned book implementation edition remains unchanged.

## Evidence is narrower than explanation

Current release records live in [Verification](../VERIFICATION.md);
capture origins and historical figures live in [Media](../MEDIA.md).
Those records distinguish local, software-rendered, hosted and actual public
observations. The chapters explain why the mechanisms matter; they do not
reclassify historical tests as fresh executions.

The original Pixel Lab program is the public demonstration cartridge. No
commercial ROM, private continuity store or raw conversation is included.
Third-party runtime and artwork obligations remain in
[Credits and licenses](../../THIRD_PARTY_NOTICES.md).
