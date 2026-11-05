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
pinned first edition above. Current [`createHandheld`](../src/handheld.js)
paints static chrome bands/tint inside the retained letter alpha;
[`app.js`](../src/app.js) shares that exact canvas with the fullscreen DOM.
The [verification record](../docs/VERIFICATION.md#metallic-chroma-lettering-2026-11-05)
identifies qualification and delivery. The original source links and historical
monochrome screenshots are not silently relabeled as this later edition.

## Evidence is narrower than explanation

Current release records live in [Verification](../docs/VERIFICATION.md);
capture origins and historical figures live in [Media](../docs/MEDIA.md).
Those records distinguish local, software-rendered, hosted and actual public
observations. The chapters explain why the mechanisms matter; they do not
reclassify historical tests as fresh executions.

The original Pixel Lab program is the public demonstration cartridge. No
commercial ROM, private continuity store or raw conversation is included.
Third-party runtime and artwork obligations remain in
[Credits and licenses](../THIRD_PARTY_NOTICES.md).
