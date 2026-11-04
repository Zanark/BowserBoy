# Architecture

## One static site, one active cartridge

The application is vanilla HTML, CSS and JavaScript modules, with pinned
Three.js 0.186.1 for real-time 3D graphics. There is no
application backend or UI framework. Node is used for serving,
allowlisted static packaging, the original test ROM generator and tests.

The runtime boundary is:

```text
Local .gba File
      |
      v
Header/size validation -> SHA-256 game identity
      |
      v
Host UI + checked IndexedDB checkpoint store
      |
      v
Same-origin player iframe + message session ID
      |
      v
Pinned EmulatorJS 4.2.3 -> single-threaded mGBA WebAssembly
      |
      v
Native CRT Geom -> retained core WebGL canvas
      |
      v
Three.js CanvasTexture -> LCD mesh in the tabletop scene
```

`src/app.js` owns UI state and serializes user actions. File validation happens
before the running cartridge is replaced. Switching cartridges checkpoints the
old game if auto-save is enabled; otherwise it asks before discarding progress.
A new iframe removes the previous emulator's globals, listeners and DOM.

The file is structured-cloned to `player.html`. Only that child creates a
temporary ROM blob URL; the URL is revoked after loading. Both sides check
message origin, source window and session identity. Commands have timeouts;
late messages cannot resolve a different cartridge's requests.

**This is lifecycle isolation, not a security sandbox.** The third-party
emulator script runs with the website's origin privileges. The application does
not send ROM bytes to a backend, but loading CDN code remains a trust boundary.
The CDN receives ordinary request/network metadata. A future self-hosted runtime
would reduce that dependency and needs a deliberate license/provenance review.

## Pinned compatibility adapter

Version-sensitive engine access is in `src/player.js` and `src/audio.js`. The runtime URL is
`https://cdn.emulatorjs.org/4.2.3/data/`; this pins the release path, not the
CDN operator's bytes with an integrity guarantee. GBA uses the `mgba` core and
the `gba` control scheme. Threads are explicitly off.

The documented loader globals configure ROM/name, controls, buttons, readiness
and start callbacks. The pinned source also supplies the internal operations
used by the adapter:

- `gameManager.getState()` and `getSaveFile()` capture a copied binary state
  and flushed cartridge save, respectively.
- `gameManager.FS`, `getSaveFilePath()`, `mkdir()` and `loadSaveFiles()` restore
  the cartridge save, then `loadState()` restores the instant checkpoint.
- A battery-only boot loads that cartridge save into a fresh runtime and calls
  `gameManager.restart()` to start the ROM with it; it never calls `loadState()`.
- `togglePlaying()`, `play()` and `pause()` preserve pause behavior.
- `simulateInput(0, button, value)` receives the shell's physical and keyboard
  input. Native virtual controls are disabled on all devices.
- `volume` and `setVolume()` apply sound preferences both to new playback and
  the current OpenAL sources. Runtime settings persistence remains disabled.
- A wrapped `startGameError()` reports startup failures to the host.

The adapter allows two animation frames after restoring before acknowledging
the operation. Browser animation frames are not proof that the emulated game
has finished displaying a state, especially with software graphics.
Restore/import therefore copy the exact validated source checkpoint into the
newest automatic slot instead of immediately recapturing a potentially stale
core state. Normal periodic captures continue afterward. When restoring while
paused the adapter temporarily runs the core and restores pause.
The upstream child `beforeunload` handler is suppressed: it otherwise resets
the core even when navigation is cancelled. Only the host prompts for leaving.
That reset also caused a real reload regression by contaminating the final
checkpoint; the browser suite covers restoration across navigation.

EmulatorJS expects all four controller-map objects, even for one-player GBA.
Omitting the unused player maps throws during construction. These assumptions
are version-specific: do not upgrade the URL without running the live-core tests.

Current online options describe `EJS_onSaveUpdate` and
`EJS_fixedSaveInterval`, but the 4.2.3 loader does not wire them. The application
therefore owns its timer and checked checkpoint persistence.

### Audio continuity and peak protection

The pinned native runtime uses Emscripten OpenAL. Its original configuration
requests 64 ms of audio buffering, but playback begins immediately. Increasing
that configuration alone did not establish the measured scheduling cushion.
`src/audio.js` configures 128 ms and a 200 ms OpenAL scheduling lookahead,
then adds 96 ms of pre-roll when a native playing source initializes/restarts.
This trades about 0.1 seconds of audio latency for tolerance of brief stalls.
It is not a permanent guarantee of queued sound on a host slower than real time.

The pre-roll is applied after OpenAL initializes `bufStartTime`, not before its
time update. Pre-roll offsets are clamped to zero so future playback cannot
produce a negative native buffer offset. The configuration hook is installed
before the core starts; it validates the pinned configuration/API rather than
silently ignoring an incompatible runtime.

Source gains use continuous 15 ms ramps for volume/mute. An explicit envelope
tracks overlapping changes because native AudioParam assignments do not provide
a reliable starting point for the next ramp. Newly scheduled replacement sources
inherit the current target volume/mute before playback instead of reverting
to their native default gain. Native settings/UI state remain intact.

The stable OpenAL master feeds a Web Audio dynamics compressor before the
destination: -3 dB threshold, zero knee, 20:1 ratio, 3 ms attack and 80 ms release.
This reduces overloaded peaks; it is not an absolute brick-wall ceiling or a
classifier that can distinguish unwanted buzz from valid game audio.

```mermaid
flowchart TD
    A[Native mGBA audio buffers] --> B[OpenAL scheduling with 96 ms pre-roll]
    B --> C[Source volume and mute with 15 ms ramps]
    C --> D[Stable context master]
    D --> E[Peak compressor]
    E --> F[Browser audio destination]
```

These are pinned-runtime hooks, not browser-wide AudioContext patches. Save
formats, default demo bytes, game speed, pause, power and CRT selection are
unchanged. Sustained CPU/GPU starvation, device/driver faults and subjective
audio quality remain separate qualification boundaries.

## Actual 3D handheld and native CRT screen

`src/handheld.js` constructs original beveled front/rear shells, a volumetric
bezel, buttons, speaker, ports, battery cover and screws. Lettering, the wood
grain and decorative cartridge labels are locally drawn canvas textures, not
reference photographs, commercial artwork or copied manufacturer logos.
`src/scene.js` owns the WebGL 2 renderer, lights/shadows, raycast picking and
animated table/play/inspection poses. Inspection supports dragging, touch
rotation/pinch, wheel zoom and keyboard rotation/reset. Reduced motion skips
the tween; unavailable/lost graphics contexts are reported explicitly.

The resting camera is closer, without changing handheld geometry/root scale or
the normal play-view framing. A 1000-by-26-unit solid wooden slab is 2.4 units
thick: top Y=0, front Z=10, darker wood on its edges. Repeated grain avoids
stretching the texture across its width. The plaster wall spans the viewport;
the room floor sits at Y=-35, leaving visible open space below the front edge.
The approximately 34.8-unit-tall lantern may be clipped by the resting frame,
as explicitly requested; the camera no longer tries to fit its whole height.

The LCD is a front-facing plane on that model, textured directly from the
same-origin emulator canvas. It is not a CSS-transformed iframe, screenshot
loop or simulated game image. The source iframe normally has a nonzero 720x480
layout and opacity zero; it remains active behind the scene. The parent canvas
owns keyboard focus. Replacing a cartridge disposes its old screen texture
before removing the iframe.

Native CRT Geom is `crt-geom.glslp` in the pinned distribution's `shaders.js`.
`EJS_defaultOptions.shader` selects it at startup; validated preferences can
switch to `disabled` through `changeSettingOption`. Missing shader resources
fail explicitly rather than quietly substituting another CRT effect.
The core canvas normally uses `preserveDrawingBuffer: false`; an actual probe
produced all-black texture copies despite a working on-screen core. The adapter
therefore disables native auto-start, waits for `EJS_ready`, wraps only that
canvas instance's `getContext` to retain its WebGL framebuffer, then clicks the
native start control. This guarantees configuration before context creation;
it does not patch browser prototypes or the parent Three.js context.
The core can use WebGL 1 even though Three.js requires WebGL 2.

After startup the adapter marks its canvas with `data-bba-display`; the host
uses this owned DOM contract rather than reaching into engine globals.
The screen's `CanvasTexture` uploads the retained, post-shader framebuffer
each render frame, so curvature/scanlines follow the LCD around the 3D model
and are naturally occluded when its back faces the camera.

The inner LCD/recess outlines use original quadratic curves fitted around the
pinned CRT Geom image boundary. Both are actual mesh geometry; the outer charcoal
bezel stays unchanged. `createLcdGeometries` keeps the original rectangular
framebuffer UV coordinates, so the border does not warp the already-filtered
image again. `setScreenCurve` disposes/replaces geometry only when the effective
shader changes, retaining the mesh, material, texture and native runtime.
Unfiltered and other native presets restore the rectangular display/surround
rather than cropping their corners or assuming CRT Geom's fit applies to them.
Revalidate the outline against actual native output on an engine/shader upgrade.

The LCD is now 4.05 by 2.7 units, retaining native 3:2 mapping. The surrounding
bezel gaps are approximately half the previous side/top/bottom gaps. Both
curved and rectangular geometries carry explicit `userData.viewport` dimensions:
`ShapeGeometry.parameters` does not expose width/height. Screen illumination
uses that metadata rather than falling back to an incorrect 10-by-10 emitter.
The cream power cap faces forward on the lower lip with a larger dark track,
tactile ridges and a projected minimum 44-by-44-pixel input target.

### Physical cartridge insertion

The original cartridge builder also creates one retained loaded-cartridge group
under the handheld root. `insertCartridge` uses the validated content identity:
a different cartridge starts a one-shot insertion; an already-seated identity
does not reinsert on power cycling or retry. It moves along local Y from 3.8
to 1.52, with an 850 ms framing interval and a 1350 ms smooth downward slide.
Reduced motion seats immediately. Restoring an off console also seats without
animation; selecting a cartridge while off still does not switch power on.

Playing-view insertion briefly widens the camera and lowers the shell .95 units
into the actual desk lamp's beam, retaining positive tabletop clearance.
After seating, the camera and shell return over 850 ms. No ambient/fake fill
light is added specifically for loading. The cartridge follows inspection/table
transforms as a child;
errors retain it seated. A new ROM reuses its geometry instead of allocating
another prop on every selection.

Framing and insertion share a timeline advanced only after actual scene draws.
Each step is bounded to 500 ms, smaller than the overlapping lowered/visible
early-cartridge window. A multi-second graphics stall therefore cannot skip
the whole slide. Fast rendering retains the 850/1350 ms choreography; slow
rendering can lengthen the visual animation, never native loading.
Completed motions clear their state so an idle console can stop drawing.
Framing does not trigger a view-mode callback, pause the core or reset input.
Native loading proceeds independently: there is no animation-based startup
delay, invented percentage or looping reinsertion during a long download.

### Dark room and screen-colored illumination

`src/lighting.js` models an original cylindrical paper shade, end diffusers,
wooden stem/base and physical switch. Its body scale is seven, making the lamp
roughly four handheld widths tall; the handheld itself is not scaled down.
One scene unit represents 0.017 meters. A broad warm downward spotlight uses
inverse-square falloff, no arbitrary distance cutoff and one 1024-square
shadow map. This replaces the six expensive cubemap passes of the intermediate
point-light implementation.

A finite 14.7-by-22.4-unit rectangle approximates light transmitted through the
paper. Three.js rectangular-light dimensions do not inherit parent scaling, so
these dimensions explicitly match the enlarged shade. An upward 6-by-6-unit
rectangle approximates the first wood bounce. Paper/bulb surfaces use authored
emission. The lamp starts on each visit; switching it does not pause, power off
or replace the cartridge.

Optional room lights start off on every visit. Their explicit toolbar toggle
controls a ceiling rectangle and reflected hemisphere independently of the
lamp, LCD, pause and console power. With room lights off there is no ambient
or hemisphere fill; with both lamp and room off the LCD is the sole source.

The LCD has an attached rectangular area light matching its physical plane.
Three.js emits along local negative Z, so the light is rotated toward the LCD's
front. At most every 125 ms, a 24-by-16 CPU canvas samples the actual retained
post-shader framebuffer. Each sRGB channel is converted to linear light before
averaging; smoothed color and intensity then drive that one-sided source.
White is modeled at 120 cd/m², not calibrated against a physical GBA display.
The source follows pickup/inspection transforms and clears immediately on
power off. Static status textures are sampled once rather than every frame.

```mermaid
flowchart TD
    A[Retained native post-shader framebuffer]
    B[24 x 16 sampling, at most 8 Hz]
    C[sRGB to linear RGB and average]
    D[Elapsed-time smoothing]
    E[One-sided area light attached to LCD]
    A --> B --> C --> D --> E
    F[Physical power off] --> G[Clear source and intensity]
    G --> E
```

Scene exposure gradually adapts from 0.018 with either lamp or room lights on
to 0.45 with both off;
the visible LCD remains unlit and is not tone-mapped. This is an authored
real-time approximation, not path tracing or full global illumination.
The spotlight casts shadows; rectangular paper/ceiling/LCD/bounce and hemisphere
sources do **not** implement occlusion or cast shadows.
Do not interpret orientation/falloff checks as proof
that light can never leak through geometry.

Buttons use dielectric clearcoat materials. A/B move 0.045 units inward;
Start/Select move 0.025. The shared D-pad depresses and tilts, with opposing
directions cancelling tilt; shoulders move and hinge. Elapsed-time damping
drives real mesh transforms from the same input state as the actual core.

The face has actual beveled openings around A/B, Start/Select and the D-pad,
with clearance for their motion. Shared round-control dimensions define both
each opening and its cap. Dark receiving floors sit below the face rather than
forming raised socket lids. The earlier solid sockets intersected moving caps,
creating unnatural dark/covered regions during presses. No press-only emission,
material color replacement or disabled cap/shell shadows conceals the problem.
The existing lamp, screen-light and shadow invalidation paths are unchanged.

### Rendering without starving the core

Unchanged shadows are cached and idle static scenes stop painting once motion
and illumination settle. Model, lamp, power, resize and button changes invalidate
the relevant state. Modal tools suspend 3D uploads/readbacks and painting behind
their blurred backdrop, **not** the native game.

After six sustained painted frames slower than 50 ms, the renderer reduces only
its backing pixel ratio by a factor of 0.75, down to 0.5. CSS controls and native
core resolution do not change. A slow paint also leaves up to 200 ms of recovery
before the next 3D paint, giving native emulation scheduling headroom. Cheap
pose/button calculations still advance and retain dirty shadows across skipped
paints. Light damping uses elapsed time since the actual previous paint.

`player.html` hides the engine toolbar, context menu, virtual
gamepad and its separate mobile menu opener. The latter is not a child of the
gamepad wrapper, so hiding that wrapper alone leaves an unwanted LCD overlay.

Cartridges, the modeled top slot and Escape open a modal tools drawer. ROMs,
saves, backups, pause/fullscreen, key bindings, sound and shader choice live
there; the playing LCD contains no application buttons. Notices appear in
the scene's lower UI area or inside an open drawer. Opening tools releases held
keys but does not pause the core. Fullscreen retains the entire scene and its
tools, rather than only the source iframe.

Accessible, transparent DOM hit targets are projected onto the actual physical
mesh buttons each frame. They supply pointer capture, touch and keyboard
activation, not the artwork. Their positions track the real camera/model;
they are hidden during transitions, table view and inspection. The child
`setInputEnabled` command releases held sources and gates keyboard/host input
outside play view. The game continues and native gamepad mappings remain.

`src/preferences.js` defines the ten GBA controls, libretro button identifiers,
default physical key codes (Z=A, X=B), validation and versioned preference
storage. Duplicate keys, Escape/Tab and browser shortcut modifiers are not valid
bindings. Volume is an integer 0-100 and mute is independent of the chosen level.
The simple shader selector offers CRT Geom or unfiltered. Older version-1 preferences
without a shader field gain CRT Geom without losing sound/remapping.
Preferences use localStorage key `bowser-boy-advance-preferences`. Missing data
uses defaults; corrupt/denied reads and failed writes are reported explicitly.
Failed writes retain active session settings without claiming persistence.

`src/keyboard.js` is shared by the host and player iframe. It tracks the action
originally pressed, ignores repeated keydowns, and releases on keyup/blur even
if bindings change. The child intercepts native keyboard handling so old keys
cannot bypass a remap through upstream controls. Existing gamepad mappings remain.

Physical buttons use pointer capture and release on pointerup, cancellation or
lost capture. Very short taps are held for at least 40 ms to cross a core input
poll; each press has a unique source. The child combines held sources per action,
so releasing a touch/mouse press cannot cancel a still-held keyboard key.
Continuous game input is not disabled by a background checkpoint transaction.
Input messages and settings RPCs retain the existing origin/source/session checks.

### Native advanced settings

The existing runtime host is a native HTML dialog. An explicit `display:block`
keeps it and its iframe nonzero-sized even when closed; opacity, pointer gating
and `aria-hidden` keep the source out of the playing UI. `showModal()` exposes
that same element in the browser's top layer. The iframe is never moved,
recreated or detached to open settings, so its native game and canvas survive.
While open it fills the responsive panel; closing restores the source layout.

The child's `settings` command moves only the existing `settingsMenu` DOM
subtree from the hidden toolbar into its native game parent. Native event
handlers remain attached; bounded CSS overrides turn its floating menu into
a scrollable panel and leave the canvas rendering underneath. The adapter
adds keyboard button semantics to the native menu's clickable category rows.
Host and child gameplay-key paths are gated while settings are open. Escape
from either document returns to Cartridges; native modal focus/inertness handles
the rest of the scene. Opening/closing does not change the core's pause state.

Optional version-1 `emulatorOptions` preferences store validated native string
options on close, reporting failed writes as session-only. They feed the pinned
`EJS_defaultOptions` at the next launch, including restart-required choices.
The host's shader selector shows an advanced native shader when selected;
sound/remapping changes preserve it, and choosing a simple filter clears that
override. Native storage remains disabled. Host-owned save, keyboard, virtual
gamepad, core identity and thread controls are excluded from the native menu
through `EJS_hideSettings`; empty input/save/gamepad categories are removed.
This restores native settings, not the entire native toolbar or a second
unchecked save system. Runtime, save and backup identities remain unchanged.

The physical power switch is independent of pause. Power off flushes only
battery memory, commits it, removes the iframe and clears the live LCD texture.
The host retains the selected ROM File and battery bytes in memory and stores
the last local cartridge plus power intent in a separate device record. Power on
creates a new iframe, installs only battery memory and restarts the ROM. A
failed persistent write leaves the old runtime on for recovery/export. If
application save storage was unavailable initially but emulation remains
available, explicit session-only power cycling does not claim persistence.
Globally denied IndexedDB can also prevent the pinned native runtime starting;
the browser fixtures distinguish that boundary from denial of our save store.

### Startup and remembered power

Logical `powered` state is independent of native `running`: an empty cartridge
slot or a failed CDN load does not silently flip the physical switch off.
Only the power handler changes this intent after its checked device write.
On first use the missing console record means off; inserting a cartridge leaves
it off. Hydration serializes tools until the remembered console is restored.

`src/startup.js` draws an original 240x160 white/indigo logo reveal into the
same LCD texture/light path for 2.4 seconds. Reduced motion uses a static
500 ms presentation. An original three-note sine-wave chime follows mute/volume;
audio permission failures are reported without blocking gameplay indefinitely.
No Nintendo recording, boot ROM or video is loaded. SVG header and favicon
assets are original project artwork.

Only a genuine off-to-on switch action calls that presentation, then cold-boots
the cartridge with battery save data. Refresh while already on restores the
stored ROM using normal checked resume selection, without calling startup.
A refresh recreates the native process; it cannot promise every unsaved frame.
An off console can retain its cartridge without creating an iframe.

```mermaid
flowchart TD
    A[Read local console record] --> B{Remembered power?}
    B -->|Missing or off| C[Dark LCD, retain inserted cartridge]
    B -->|On| D[Reload cached cartridge and checked resume point]
    C --> E[Physical power on]
    E --> F[Commit on intent]
    F --> G[Original LCD reveal and chime]
    G --> H[Cold ROM boot with battery save]
    D --> I[No startup replay]
    H --> J[Physical power off]
    I --> J
    J --> K[Commit battery and off intent, then remove runtime]
    K --> C
```

## Persistent data

`src/save-store.js` opens database `bowser-boy-advance`, version 2. Upgrade
adds a separate `device` store without deleting/replacing the existing `games`
store or its records.
The primary key is the ROM's SHA-256 digest. A record contains public file
metadata, runtime identity and independent `automatic` / `manual` slots.
Each slot has binary `state`, optional binary `sram` and an ISO timestamp.
Optional `battery` contains nullable `sram` and its capture timestamp. A
`bootMode` of `battery` suppresses automatic checkpoint restoration after a
deliberate power off; checkpoint writes set it back to `checkpoint` and update
the battery copy atomically. Older records without these fields retain normal
checkpoint-selection behavior. The original game-record shape and backup/runtime
identities are unchanged.

The `device` store holds one `console` key: schema version 1, boolean `powered`
and a nullable cartridge containing its name and Blob bytes. Reads validate
shape/size; cached ROMs go through normal header validation and content hashing
before launch. This is one locally cached active cartridge, not a ROM library
or an upload. Device writes report success only after transaction completion.
Aborted writes do not replace the previous switch state. Physical off flushes
the battery first and retains the live runtime if either write fails.

Writes read/update a record in one read-write transaction. Success is reported
only on transaction completion, not the individual request. This prevents
concurrent slots from erasing one another and treats aborted/quota-failed writes
as failures. The rolling slot never replaces the manual slot.

The engine also maintains its own Emscripten save filesystem. It is not the
application's checkpoint-success authority. Runtime ROM/core caches and settings
storage are disabled; the website's checked IndexedDB records and exported
backups define resume behavior.

`src/cartridge.js` validates ROM shape, identifies content, selects the newest
slot, and encodes/decodes versioned backups. Base64 is transport, not encryption.
Checksums detect accidental corruption, not authenticity. A backup should come
from a trusted copy of this application.

## Source and packaging map

| Path | Responsibility |
|---|---|
| `index.html`, `styles.css`, `assets/cartridge.svg` | Scene host, projected controls and hidden tools drawer |
| `assets/logo.png`, `assets/brand-mark.svg` | Supplied transparent header wordmark and original favicon |
| `src/handheld.js`, `src/scene.js` | Original 3D geometry/textures, live LCD, picking and inspection |
| `src/lighting.js` | Paper lantern, one-map shadow source, finite paper/wood light, optional room lights and sampled LCD |
| `src/app.js` | File selection, host lifecycle, UI and user save actions |
| `src/player.js`, `player.html` | Pinned runtime adapter and child document |
| `src/cartridge.js`, `src/save-store.js` | Identity, backups and checked storage |
| `src/preferences.js`, `src/keyboard.js` | Shared controls, persistent sound/remapping/shader and held-key lifecycle |
| `scripts/demo-rom.mjs` | Original ARM7TDMI cartridge generator |
| `scripts/site-files.mjs`, `build.mjs`, `serve.mjs` | Explicit public-file allowlist, clean build, loopback serving |
| `tests` | Focused unit and real-browser checks |
| `.github/workflows/pages.yml` | Check/build/browser-test gates and Pages deployment |

The server is loopback-only and serves only public allowlisted files. The
build replaces only the generated `dist` directory and adds `.nojekyll`.
Documentation/private context cannot enter the deployed artifact through a
recursive repository copy.
The supplied header wordmark is the unchanged 2170x725 RGBA purple orbital PNG
with transparent exterior. Its HTML intrinsic dimensions match that supplied
asset; no alternate-color assets or switcher are shipped.
The public allowlist includes PNG and the development
server supplies image/png MIME. Responsive dimensions preserve the raster's
aspect ratio; original favicon, LCD startup artwork and shell lettering remain
separate assets. See the supplied-artwork provenance in THIRD_PARTY_NOTICES.md.
Only `three.module.js`, its relative `three.core.js` dependency, the unmodified
`RectAreaLightUniformsLib.js` / `RectAreaLightTexturesLib.js` lookup helpers and
the exact MIT license are mapped from the pinned package to public `vendor` paths.
An import map resolves `three` relative to the document, preserving nested
GitHub Pages hosting. No `node_modules` directory is publicly served.
Pages deployment requires the separate syntax/unit/build job and both complete
test-level browser shards on Ubuntu 24.04, with one worker per runner.

## Upstream receipts

- [4.2.3 loader](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/loader.js)
- [4.2.3 emulator source](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/src/emulator.js)
- [4.2.3 game manager](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/src/GameManager.js)
- [4.2.3 bundled shaders](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/src/shaders.js)
- [Current option documentation](https://emulatorjs.org/docs/options/)
- [Control identifiers](https://emulatorjs.org/docs4devs/control-mapping/)

## Deliberately not in this prototype

No cloud accounts/sync, server ROM library, offline/PWA guarantee, raw `.sav`
interchange, multiple manual slots, GB/GBC support or complete game compatibility
matrix. Those are future product decisions, not hidden capabilities.
