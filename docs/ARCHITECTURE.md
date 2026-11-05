# BowserBOY architecture

[Engineering book](../book/README.md) | [Player guide](GUIDE.md) | [Verification](VERIFICATION.md)

This is the concise implementation reference. The first
[chaptered book](../book/README.md) adds diagram-first explanations, worked
examples, dedicated algorithms/data-structures and design-principle chapters,
and revision-bound source references. It describes qualified source; release
status remains a separate verification claim.

## Website identity, console identity and future direction

BowserBOY is the website and shared tabletop. BowserBOY ADVANCED is its one
implemented console: the current GBA handheld. Its supplied purple artwork
still reads ADVANCE. That artwork is not the website's chrome logo.

| Surface | Asset or implementation | Current ownership |
|---|---|---|
| Website header, tools/settings panels, README lead | `assets/website-logo.png` | BowserBOY chrome identity |
| GBA rear shell and idle/loading/startup LCD | `assets/logo.png` through `src/brand.js` | Original purple console identity |
| GBA bezel and LCD-fullscreen bezel | Letter-only metallic texture | Console presentation, not website branding |

More consoles on the table are planned. There is no console picker, second
emulator core or multi-console save model today. Do not interpret decorative
cartridges as implemented consoles. The current single-console lifecycle below
is intentionally unchanged; future support needs its own requirements and
qualification rather than speculative abstractions in this branding update.

The GitHub repository remains `Zanark/BowserBoyAdvance` at this documentation
refresh. The owner will rename it to BowserBOY; current links and the local
checkout retain their real paths until that separate action is performed.

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
`src/audio.js` configures a 256 ms native buffer budget and a 200 ms OpenAL scheduling lookahead,
then adds 96 ms of pre-roll when a native playing source initializes/restarts.
The original 128 ms budget's startup cushion drained during sustained play:
instrumented local playback exposed repeated roughly 100 ms underrun/restart
gaps. Larger allocation alone still does not guarantee live queued sound:
subsequent private playback reproduces starvation with 256 ms allocated.
Normal playback now defaults native VSync off, allowing the existing native
audio synchronization to pace the core instead of relying on animation-frame
deadlines. An isolated 90s comparison retains 161-206 ms of live headroom without
the baseline's repeated gaps. Explicit saved VSync settings override this default;
fast-forward still releases VSync and 1x restores the selected preference.
The reserve trades additional audio latency for
tolerance of brief stalls; configured capacity is not measured end-to-end delay.
It is not a permanent guarantee of queued sound on a host slower than real time.

The pre-roll is applied after OpenAL initializes `bufStartTime`, not before its
time update. Pre-roll offsets are clamped to zero so future playback cannot
produce a negative native buffer offset. The configuration hook is installed
before the core starts; it validates the pinned configuration/API rather than
silently ignoring an incompatible runtime.

Do not remove recovery pre-roll as an isolated shortcut: a measured startup-only
variant increases starvation from 18 gaps/13 restarts to 139 gaps/92 restarts
over comparable 90s windows. Keep the buffering and correct the default clock.

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

Action-button letters recover the original `bold 95px Arial` raster, .25x.28
label footprint and -.005 vertical placement. Half-alpha marching contours
convert that antialiased boundary into actual cap cuts, floors/walls and solid
counter islands, rather than approximating the font with bespoke polygons.
The original browser/system font selection remains; no font binary is bundled.
Only A/B use shallow floors at local z=.047 to avoid harsh deep-wall occlusion.
Other molded labels keep their polygon font. Groove material, cap silhouette/
rim normals and shared press motion stay intact.

`src/handheld.js` constructs original beveled front/rear shells, a volumetric
bezel, buttons, speaker, ports, battery cover and screws. Wood grain and
decorative cartridge labels are locally drawn canvas textures, not reference
photographs or copied manufacturer logos. Shared original polygon glyphs with
proper counters and beveled extrusion form L/R, START/SELECT and ZANARK;
D-pad arrows also retain raised depth and darker rubber. A/B glyphs instead
cut the cap faces: solid counter islands follow the original dome, while softer gray
floors and sidewalls sit below it. Original lathe rim normals are retained and
the face normals meet them continuously. All cap markings move with their
parent; START/SELECT and their outline share the shell plastic.
The cream rubber caps retain their color with rougher, less glossy surfaces.
Only A/B floor/wall tint changes to `#999d98`; the cap and lighting stay unchanged.
The front POWER/BBA-001 decals are removed, not the LED or underside label.

The front bezel derives a 1536x174 letter mask from the supplied image's
lettering band (25,250,2115,240). Neutral-highlight alpha masking removes
saturated orbital accents. This keeps distinctive
letterforms without stars or modifying the source PNG. The physical label uses
a lit transparent material; warm room illumination can tint its appearance.
Solid 7x7 alpha cores seed an eight-neighbor reconstruction of the original
connected letter pixels. Detached thin contours are discarded, not recolored;
the original glyph edges and counters are not eroded. This removes the exterior
light frame/underline while leaving every other use of the source PNG unchanged.
The lettering is centered at 60% of the existing canvas width and height:
another 20% reduction from the preceding 75% edition, not a smaller LCD or plane.
Static vertical chrome bands and a subtle horizontal iridescent tint are clipped
to that unchanged alpha. Only this label uses the metallic finish; its lit
standard material has roughness .4 and metalness .1, so warm illumination still
warms it. No animation, emission, environment map or per-frame update is added.
Fullscreen uses the same canvas object, not another rasterization or copy.
The top ZANARK maker mark retains a chamfered matching-plastic frame.
The rear battery cover retains the unchanged supplied purple artwork on a
3.45-unit-wide frame, about 17% wider than the previous 2.95-unit engraving.
`engraveRearLogo` traces a512x171alpha mask at16 using the shared `alphaContours`
extractor. Nested loops alternate artwork cavities and solid plastic islands.
Only the old rear cap triangles are removed; the original outer bevel, cover
thickness, grips and side normals remain. Colored floors now sit .024units
below the cover face, with matching-plastic walls, all parented to the cover.
This is four times the earlier .006-unit cut, not a dark overlay or raised logo.
UVs continue to sample the exact original1024x342texture. The existing white,
untone-mapped basic material preserves bright artwork; the walls/cover remain
lit plastic. The cavity mask is not the color texture. Geometry is constructed
once, with no recurring texture work or new scene lighting. A/B retains its
original half-alpha threshold and projection through the same extractor.
`src/scene.js` owns the WebGL 2 renderer, lights/shadows, raycast picking and
animated table/play/inspection poses. Inspection supports dragging, touch
rotation/pinch, wheel zoom and keyboard rotation/reset. Reduced motion skips
the tween; unavailable/lost graphics contexts are reported explicitly.

The resting camera is closer without changing handheld geometry/root scale.
Normal play has its separately fitted closer framing described below.
A 1000-by-26-unit solid wooden slab is 2.4 units
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
`EJS_defaultOptions.shader` selects it at startup. A shared `CRT_SHADERS` catalog
drives the host dropdown and preference validation: all nine CRT presets supplied
by pinned 4.2.3, plus `disabled` for unfiltered output. Native IDs are preserved
exactly; five do not have a `.glslp` suffix. Selection uses `changeSettingOption`
without restarting the core. Explicit saved choices remain; Geom is the fresh
and legacy default. Advanced native selections synchronize with existing options,
while non-CRT native selections retain the separate read-only indicator.
Missing shader resources
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
The dark ribbed power cap, track and label share a tangent-aligned mount facing
out of the lower underside edge, within the shell thickness, not the front face.
The cap moves locally along that mount; its registered anchor still drives the
minimum 44-by-44-pixel target. Short-height play framing retains the same 180px
reserve as desktop, keeping the complete lower-edge target above the icon dock.
Shell scale and actual power lifecycle are unchanged. Normal play alone uses
9.8/5.35 horizontal/vertical fit envelopes instead of 10.2/5.55, with a -0.12
world-Y camera/look offset: about four percent closer, not a model stretch.
Inspection retains 10.2/5.55 and cartridge insertion 10.2/8.3. The 180px reserve
remains, preserving landscape target/dock clearance.

### Physical cartridge insertion

The original cartridge builder also creates one retained loaded-cartridge group
under the handheld root. `insertCartridge` uses the validated content identity:
a different cartridge starts a one-shot insertion; an already-seated identity
does not reinsert on power cycling or retry. It moves along local Y from 3.8
to 1.52, with an 850 ms framing interval and a 1350 ms smooth downward slide.
Reduced motion seats immediately. Restoring an off console also seats without
animation; selecting a cartridge while off still does not switch power on.

Playing-view insertion briefly widens the camera and lowers the shell .86 units
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

Buttons use dielectric clearcoat materials. A/B move 0.075 units inward;
Start/Select move 0.04. The shared D-pad depresses 0.016 units and rocks
0.1 radians per axis, with opposing directions cancelling tilt. Shoulders
move 0.12 units downward and hinge 0.075 radians. Elapsed-time damping uses
50 on compression and 80 on release: more visible travel and a snappier return,
without overshoot or scaling. These real mesh transforms follow the same input
state as the actual core; the animation does not delay native key events.

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
normal flow directly below the header logo or inside an open drawer. Opening tools releases held
keys but does not pause the core. Fullscreen retains the entire scene and its
tools, rather than only the source iframe.

Notices share translucent violet glass, an 18px backdrop blur, a subtle
highlight/border and a 44px dismiss target. Error glass has a warmer tint.
Long text scrolls within a viewport-bounded card. At the user's request,
header notices may overlap the console: showing, changing, moving or dismissing
a notice does not shrink or shift the handheld. The scene ResizeObserver watches
only the scene host, not the notice host; ordinary viewport fitting still
preserves the complete default handheld and toolbar clearance.
Explicit inspection zoom multiplies that ordinary baseline, rather than being
silently clamped away; intentional zoom-in can crop the console as before.
No new per-frame DOM measurement loop or emulator restart is introduced.

The separate screen-only fullscreen target copies the same retained post-shader
framebuffer already feeding the LCD. A lightweight CSS bezel matches the physical
4.47-by-3.39 surround, complete 4.05-by-2.7 LCD and metallic chroma wordmark.
At initialization the physical texture's canvas replaces the decorative
fullscreen placeholder, retaining its ID, class and accessibility attributes.
Sharing the bitmap avoids divergent fonts and antialiased-edge rounding from
an additional canvas copy. Only the decorative artwork is shared this way;
the live game retains its existing framebuffer presentation.
The picture remains 3:2: a definite viewport-sized, min-size-zero flex container
fits the bezel to both available dimensions, leaving black margins. This avoids
the previous grid track's intrinsic canvas sizing overflowing the viewport.
Safe-area padding reserves space for exit and bottom-right zoom controls.
The accessible 50-100% slider scales the complete centered bezel/picture together;
100% is the largest uncropped fit, not a crop-to-fill mode. Container-relative
sizing follows orientation changes without restarting or resizing the native core.
It never reparents the live iframe, starts a second runtime or changes saved power
intent. Its animation loop continues while the unseen room renderer skips work.
Mapped host input is enabled independently of table/inspection mode, with held
input released on entry/exit. Fullscreen changes restore the original mode's
input gating and dock focus; Escape or the named exit button closes the mirror.
Unsupported/refused requests and copy/exit failures report explicit errors.

The responsive quick dock reuses those same handlers for fullscreen, keybindings,
checked save/load, autosave and restart. `src/icons.js` supplies consistent SVGs,
accessible names and tooltip labels. Each button retains a 44px target; the 320px
layout wraps into two rows. Manual slot selection opens/focuses the existing
drawer selector rather than introducing a second save implementation.

Speed choices update validated native `ff-ratio`, `fastForward` and `slowMotion`
options through the same preference pipeline. The adapter's `changeSettingOption`
calls reach pinned `setFastForwardRatio` and `toggleFastForward` core methods.
After applying speed options, the adapter explicitly disables native VSync while
fast-forward is active and restores the selected native VSync preference at 1x.
This does not rewrite that preference: the native menu can re-enable rAF pacing
without clearing its fast-forward flag, and reselecting an unchanged ratio used
to skip all native calls, leaving a 4x label with normal-speed emulation.
The regression uses an optional original Pixel Lab VBlank counter in SRAM
bytes 4-5, measuring actual cartridge frames against wall time. It does not infer
acceleration from the dock, API arguments or native-loop iteration counts.
They do not change Three.js timing or pretend the host can guarantee 4x throughput.
Native-menu changes remain compatible and round-trip back into the dock.

Accessible, transparent DOM hit targets are projected onto the actual physical
mesh buttons each frame. They supply pointer capture, touch and keyboard
activation, not the artwork. Their positions track the real camera/model;
they are hidden during transitions, table view and inspection. The child
`setInputEnabled` command releases held sources and gates keyboard/host input
outside play view, except while the screen-only fullscreen target is active.
The game continues and native gamepad mappings remain.

`src/preferences.js` defines the ten GBA controls, libretro button identifiers,
default physical key codes (Z=A, X=B), validation and versioned preference
storage. Duplicate keys, Escape/Tab and browser shortcut modifiers are not valid
bindings. Volume is an integer 0-100 and mute is independent of the chosen level.
The simple shader selector offers CRT Geom or unfiltered. Older version-1 preferences
without a shader field gain CRT Geom without losing sound/remapping.
Preferences use localStorage key `bowser-boy-advance-preferences`. Missing data
uses defaults; corrupt/denied reads and failed writes are reported explicitly.
Failed writes retain active session settings without claiming persistence.
The optional boolean `autoSave` defaults true for older preference records;
explicit false survives refresh. Save-storage failures turn automatic captures
off for recovery and cannot be undone accidentally by a sound preference update.

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

`src/brand.js` decodes the supplied transparent logo and complete padded
sparkle/glow/orbit sprites before constructing the scene. The same artwork is used on the rear battery cover,
idle/loading status LCD, header and dialogs. Decode failures are explicit.
`src/startup.js` draws the wordmark over a purple starfield, with three supplied
star sprites crossing behind/in front of it along elliptical orbits, with the
supplied ring and pulsing glow, into a 960x640 canvas using the same logical
240x160 composition and LCD texture/light path for 3.2 seconds. High-quality
source scaling and removal of the earlier extra logo shadow address startup
blur without changing native game resolution or its shader. Narrow source
strips displace the central wordmark by a gentle two-cycle sine wave; the outer
orbit and composition remain centered. Reduced motion draws the whole image
without displacement in a static
500 ms presentation. An original three-note sine-wave chime follows mute/volume;
audio permission failures are reported without blocking gameplay indefinitely.
No Nintendo recording, boot ROM or video is loaded. Animation/chime are original;
the wordmark/star artwork is supplied, not independently authored. The active
SVG favicon uses the original 3D shell's exact outline with simplified LCD,
D-pad, diagonal A/B buttons and speaker slots. Its transparent square canvas
retains the landscape silhouette at16/32/64px; the supplied star remains an
animation sprite, not the browser-tab icon.
The effects come from isolated regions of the supplied sprite sheet, not logo
fragments. Transparent margins and a 98px horizontal orbit radius keep rotated
stars inside the LCD for the full reveal; tests sample all corners every100ms.
The centered wordmark is 160px wide inside the 226px supplied ring, leaving
substantial clearance without enlarging the framebuffer or clipping the orbit.

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
metadata, runtime identity and independent `automatic`, `manual`, `manual2` and
`manual3` slots. `manual` remains the old quick save, so no destructive schema
migration or reinterpretation of existing binary data is needed.
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
as failures. The rolling slot never replaces a manual slot. Selected-slot imports
and saves preserve the other manual checkpoints. Backup format/runtime identity
stay unchanged: each external file contains one captured session, not all slots.

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
| `assets/website-logo.png` | Supplied chrome BowserBOY website header/dialog identity; separate from console art |
| `assets/logo.png`, `assets/star.png`, `assets/orbit.png`, `assets/glow.png`, `src/brand.js` | Purple GBA console branding/effects, padded sprites and checked decoding |
| `assets/brand-mark.svg` | Original transparent handheld favicon, matching the actual shell outline |
| `src/icons.js` | Quick-dock SVGs, names, tooltip labels and speed badge |
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
The website's BowserBOY header and both panel logos use the supplied2148x732
RGBA chrome orbit and sparkle artwork in `assets/website-logo.png`; intrinsic HTML dimensions
match it. A neutral header shadow replaces the previous violet glow.
The header adds a CSS-only left-to-right shimmer every six seconds: a duplicate
of that same transparent PNG, neutral brightening/glow and a feathered moving
mask. The 1.8-second sweep changes neither layout nor supplied artwork and adds
no JavaScript/scene update loop. It pauses in hidden play view; reduced motion
removes the shimmer while retaining the static image and its base shadow.
Tools/settings panel logos do not animate.
The2170x725purple `assets/logo.png` remains exclusively console artwork.
`src/brand.js` still loads it for the existing GBA handheld's rear and LCD
idle/loading/startup; the bezel retains its metallic lettering. There is no
new shared branding abstraction, console selector or second emulator.
BowserBOY ADVANCED is the user's name for that first console; its supplied
artwork still reads ADVANCE. Future consoles on the table are product direction,
not runtime support. Repository rename is owner-managed; storage keys, saves,
relative URLs and current Pages prefix remain unchanged by this update.
The public allowlist includes PNG and the development
server supplies image/png MIME. Responsive dimensions preserve the raster's
aspect ratio. The supplied rear-shell/startup image is not recreated or recolored;
the front bezel deliberately derives star-free metallic chroma lettering from it.
See supplied-artwork provenance
in THIRD_PARTY_NOTICES.md. The active SVG favicon replaces the earlier generic
rounded/infinity icon and subsequent star icon; relative HTML/SVG paths preserve
GitHub Pages subpath hosting.
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
interchange, GB/GBC support or complete game compatibility
matrix. Those are future product decisions, not hidden capabilities.
