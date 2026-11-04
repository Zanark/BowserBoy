# Verification scope

The prototype has separate evidence layers. Test coverage alone is neither
human acceptance nor deployment; the actual release evidence is recorded below.

## Automated coverage

`npm run check` checks application JavaScript syntax. `npm test` covers ROM
validation/content identity, versioned binary backup round trips, mismatched
ROM/runtime and corrupt input rejection, newest-slot selection, preference
validation/persistence errors and held-key release after a remap or blur.
It also verifies older preferences acquire CRT Geom without losing remapping
or sound, invalid shader names fail and an unfiltered preference round-trips.
Native-option tests cover persistence across remapping and rejection of managed
controls, malformed values and configuration-string injection.

`npm run test:browser` serves the actual clean static build under
`/BowserBoyAdvance/`. It exercises:

- Desktop and narrow layouts, file validation, help keyboard dismissal and
  denial of private/development file paths by the local server.
- The real remote EmulatorJS 4.2.3 / mGBA runtime, rendering and directional input.
- Actual SRAM capture, manual checkpoint restore, exported/imported progress,
  renamed-ROM resume after reload, the real 15-second timer and ROM isolation.
- Aborted/quota-failed storage writes without a false success state, retaining
  previous committed data; export remains usable after a failed write.
- Explicit blocked-storage and unreachable-CDN states.
- Touch operation through the physical shell without native toolbar, virtual
  gamepad or the engine's separate mobile menu opener covering the LCD.
- Default Z=A / X=B behavior, live remapping, duplicate rejection, reset, and
  remembered settings after reload. The old A key no longer triggers A.
- Sound preference application to the real runtime, including muted startup
  after reload, and explicit session-only behavior after failed preference writes.
- All ten shell controls reaching the real core; pointer capture/release outside
  the button, combined keyboard/pointer input, and release when tools opens.
- Actual fullscreen entry/exit retaining the console within the viewport and
  the drawer's separate pause/resume action.
- Actual 3D triangle rendering, raycast pickup, front/back orientation, battery
  cover geometry, inspection/reset and return to the table. Projected mesh
  bounds, not merely the full-window host, fit desktop/landscape/phone sizes.
- Native CRT Geom's actual preset and retained WebGL framebuffer, the LCD's
  texture referencing that same canvas, nonblack live pixels and texture
  updates during real game input. Disabling the shader changes rendered pixels.
- Mobile touch rotation/pinch without accidental native game input; keyboard
  input is gated on the table and resumes after picking up the handheld.
- Reduced-motion pickup and explicit WebGL-unavailable failure.
- Front-surface raycasts proving the LCD is not hidden behind its bezel,
  speaker slots are genuinely recessed and the D-pad center is a shallow well.
- Physical power off destroys the old iframe, clears the live display texture
  and extinguishes LED emission. Power on creates a fresh runtime, boots from
  original-demo battery data rather than a deliberately different checkpoint,
  and does not create a native checkpoint-load file.
- Powered-off ROM reselection after reload preserves that battery-only boot
  policy; existing checkpoints remain unchanged. Aborted battery/checkpoint
  writes retain prior data. A failed power-off write leaves the game on for
  export/recovery; denial of only the app save store is explicitly session-only.
- Actual native settings navigation and shader/speed changes, keyboard category
  activation without gameplay input, child Escape and host Close, unchanged
  runtime identity/pause state, narrow-panel fit and restored hidden-frame size.
  Settings survive sound changes, power cycling and reload. A native rewind
  option marked Requires restart remains inactive until a fresh power on.
- Dark-default scheme, independently switched physical lamp, actual inverse-square
  falloff and shadow sources, one-sided LCD orientation, linear framebuffer-color
  transfer, zero screen emission on power off and working mapped mesh travel.
- Static idle drawing and modal-backdrop suppression, transient versus sustained
  render stalls, adaptive backing dimensions and recovery frames without stopping
  inexpensive button/pose motion.
- First use starts off; inserting a cartridge leaves it off. Actual physical
  power-on displays the original LCD artwork and enables the same lighting path.
- Idle power and a loaded cartridge survive refresh without another startup
  animation. An on refresh restores its checked native checkpoint; explicit off
  persists across refresh without creating an iframe.
- Database v1-to-v2 upgrade preserves old game records; interrupted device writes
  retain the previously committed power state.
- An original optional PSG tone produces actual native PCM. A controlled 80 ms
  stall in the first scheduling callback retains a future playback deadline
  with protection; an unprotected pinned-runtime control misses that deadline.
- Actual native PCM recovers after forced 250 ms starvation. Mute/unmute, pause
  and checkpoint restore retain the same runtime and valid native offsets.
- Real OfflineAudioContext rendering reduces a deliberately overloaded tone
  below full scale after settling, and rapid mute changes do not create a hard
  sample step. This measures output samples, not human hearing.
- Desktop/phone physical cartridge travel, viewport fit, positive tabletop
  clearance, retained attachment and return to the normal camera/held pose.
  A held genuine CDN loader keeps actual loading pending during animation;
  releasing it starts the real native demo. Desktop refresh repeats this path.
- Reduced-motion immediate seating, retained cartridge on a CDN failure and
  zero reinsertion events across actual battery-only power cycles.
- Actual supplied-logo PNG alpha, retained opaque white lettering and two
  separated word components, plus no header/status overlap at 1440/390/320px.
- Actual raycast depth at control gaps, rendered resting/pressed cap illumination
  for A/B/Start/Select and four D-pad directions, and lamp-off cap darkness.

The original input-test ROM is generated from readable ARM instructions in
`scripts/demo-rom.mjs`; it contains no copied Nintendo logo, BIOS or commercial
game bytes. Runtime tests compare native framebuffer screenshots to establish
actual input/restore behavior, not a mocked loader's successful callback.
The shared `tests/browser/pixel-lab.mjs` fixture waits for its real completed
240x160 frame containing the 8x8 square. Movement/B/touch holds wait for actual
framebuffer/SRAM responses; pause waits for its host acknowledgement. Exact
restore/reload hashes remain required with bounded eventual-frame polling.

Storage/CDN failure injections are fixtures; they are not claims of a particular
real user's browser quota or network condition. The mobile browser viewport is
emulated on desktop, not a test of a physical phone.

## Evidence artifacts

`docs/images/prototype-desktop.png` and `prototype-mobile.png` show the shell.
`docs/images/pixel-lab-mobile.png` shows the original cartridge with shell controls.
`docs/images/cartridge-drawer.png` shows the hidden tools drawer.
`docs/images/3d-table.png`, `3d-handheld.png` and `3d-back.png` show actual
rendered mesh poses, including the rear battery cover.
`docs/images/native-settings.png` shows the actual advanced native menu.
`docs/images/lcd-light.png` shows the mostly dark original demo with the lamp off;
`dark-power-off.png` shows the unlit room after screen power is removed.
`docs/images/startup.png` shows the original power-on presentation and new logo.
`docs/images/cartridge-inserting.png` shows an original cartridge entering the
top slot on the live deployed site while the real runtime download is held.
These are public-safe UI screenshots generated by browser tests, not artwork
from a commercial ROM. Failure traces/screenshots stay in ignored `test-results`.

The original prototype outcomes are recorded in
`TODO/03_VERIFICATION_AND_DELIVERY.todo`. The UI revamp outcomes are in
`TODO/05_HARDWARE_UI.todo`; actual 3D/CRT outcomes are in
`TODO/06_3D_TABLETOP.todo`; reference-based geometry correction is recorded in
`TODO/07_REFERENCE_SHAPE.todo`; actual power semantics are in
`TODO/08_POWER_LIFECYCLE.todo`. `TODO/04_DEVELOPMENT_LEDGER.todo` retains all phases.
Native settings restoration is recorded in `TODO/09_NATIVE_SETTINGS.todo`.
Dark-room lighting, render scheduling and the deployed release are recorded in
`TODO/10_DARK_ROOM.todo`.
Remembered power, startup and refreshed branding are in
`TODO/11_STARTUP_AND_PERSISTENT_POWER.todo`.
Do not treat this coverage description alone as a fresh passing test run.

The reference-correction run finished with 9 unit and 13 Edge browser cases
passing. Earlier runs twice failed the native PNG equality check on reload;
a direct original-demo pixel probe, three isolated follow-up runs and the
final complete suite passed. No root cause or production save fix was
established. Treat that assertion as an unresolved intermittent investigation,
not proof that timing can never affect restore verification.

The subsequent power-lifecycle release passed syntax/build, 9 unit cases and
all 16 Edge browser cases. A global IndexedDB-denial fixture also blocks native
startup; that existing error-reporting case is distinct from the new fixture
denying only the application's save database. These fixtures do not establish
universal private-mode/browser behavior.

The native-settings revision passed syntax/build, all 10 unit cases and all
17 real-core Edge browser cases. Its native-menu screenshot was visually
reviewed. That historical local milestone preceded the later renewed release
authorization; native settings are included in the deployed revision below.

## Dark-room release, 2026-11-04

Local Chromium passed all 19 cases. The complete explicit-software-renderer
suite passed 19/19 in 4.9 minutes; after fixture-only timer isolation, its two
affected save/remapping cases passed again. Syntax, 10 units and build passed.
Five focused final Edge capture cases passed in 48.7 seconds.

Hosted attempts are not silently relabeled as passing:

| Pages run | Actual result |
|---|---|
| `41730645605`, `41733262120` | Failed browser deadlines/readback stalls; deployment skipped |
| `41737201141` | Both browser shards failed; no deployment |
| `41738820308` | Windows-hosted browser shards failed; Linux build passed |
| `41744005854` | 18/19 browser cases passed; exact reload position differed |
| `41745709236` | 17/19 passed; new mutable-slot comparison and remapping/timer assumptions failed |
| `41746728238` | Both browser shards, build and actual Pages deployment passed |

The successful source revision is
`d551f4269b58fc31e496c4d1bc8d9d6110817f79`. A fresh Edge process against
`https://zanark.github.io/BowserBoyAdvance/` verified all 19 public assets,
default dark scheme, actual original demo/CRT, lamp independence, mapped mesh
travel, framebuffer emission, native-settings runtime identity and real power
off/on. No page errors were reported. Source hashes use exact Git blobs because
the Windows worktree uses CRLF while Pages checks out LF; generated demo/vendor
bytes are compared directly. This checks exact expected bytes, not only HTTP 200.

Restore/import now preserve the exact validated checkpoint as the newest resume
slot, avoiding an immediate stale-frame recapture. This addresses the observed
release path; it does not retroactively establish the cause of every historical
intermittent mismatch. Real timer captures may subsequently replace that rolling
slot. No assertion is skipped or satisfied through a mocked native core.

## Startup and remembered-power release, 2026-11-04

Source `ab4fc8850d0b67870dd431d4a398c5a3e98ac47d` passed build, both complete
browser shards (22 cases) and actual Pages deployment in run `41753762933`.
Fresh live Edge checked exact hashes of all 22 public assets, the original
startup, first-visit off, last-cartridge reload with checked native resume,
no startup replay on refresh, persistent explicit off, native settings at the
top of the sidebar and unchanged CRT/lamp/input/power behavior. No page errors
were reported. Original startup and refreshed UI screenshots were reviewed.
This publication preceded final public documentation.

Local syntax, build and all 10 unit cases passed. Expanded Edge coverage
initially passed 21/22; the renamed-ROM fixture set a disabled file input while
automatic restore was still busy. Waiting for input enablement fixed that
actual-core case, which then passed in 34.4 seconds.
Hosted run `41752150621` failed fixture races: closing a drawer that insertion
was already closing, and refreshing before off intent had committed.
Awaiting enabled physical power and the actual off acknowledgement preserved
every assertion; all seven affected explicit-software cases passed in 2.6
minutes before the successful complete hosted gate. These failures are not
reclassified as passing runs.

Final visual review caught an obsolete cartridge-insertion notice during boot.
Source `78887d7007e8e6b78552811a00bd1d313769575d` hides it before startup,
with a focused browser assertion. Pages `41755029718` passed build, both
complete browser shards and deployment. Fresh live Edge repeated all 22 exact
asset checks and the startup/refresh/native behavior checks with zero page
errors. The final startup screenshot shows the original reveal without the notice.

The preceding sidebar-only push `d222dc6` did not deploy: `41749371182` failed
an existing mobile native-PNG equality assertion. GitHub denied rerun/dispatch
permission. The subsequent genuine startup revision adapted the mobile fixture
to the new power lifecycle and waits for its real completed demo frame; exact
native pixel assertions remain intact. No empty commit, weaker gate or removed
assertion forced either publication.

## Audio reliability follow-up, 2026-11-04

The user reported intermittent distortion/buzzing. No recording was supplied
and the particular audible symptom was not independently reproduced.
Controlled tests instead establish scheduling protection, real native signal
and peak/volume behavior. No commercial-ROM test was restarted.

An intermediate complete Edge suite passed 25/25, with syntax/build and all
10 unit cases passing. Software graphics then exposed fixture assumptions:
an observed source can be replaced during starvation, and outside UI sampling
cannot assume a slow host maintains steady audio headroom. The fixture observes
the stable master and compares the same 80 ms stall inside the real scheduling
callback. It retains actual PCM, starvation recovery and continuity assertions.
These changes do not prove all real-time stalls are prevented.

Final three explicit-software audio cases passed in 35.8 seconds. Six directly
affected Edge audio/settings/sound/power cases passed in 1.3 minutes.
Source `7cc095ff7242dc9d7af47f7c040e5a63783d92bf` passed build, both complete
browser shards (25 cases) and actual Pages deployment in run `41759530406`.
Fresh live verification checked all 23 exact public assets and passed all three
audio cases against the deployed site in 22.3 seconds. Public documentation
followed that successful deployment. Default Pixel Lab ROM bytes are unchanged.

The final compatibility correction replaces `cancelAndHoldAtTime`, which Firefox
does not implement according to MDN browser-compat-data, with
`cancelScheduledValues` and the explicitly tracked envelope. The real offline
rendering fixture removes the optional method and still passes. This is not an
actual Firefox-browser qualification.
Source `f003c03e1f0f8c643a1e82a4973d6ebb515effce` passed build, both complete
browser shards and actual deployment in Pages run `41760601267`. Fresh live
verification matched all 23 exact public assets and passed all three audio
cases in 23.5 seconds before this documentation update.

Initial failed experiments are retained in the development ledger: configured
latency alone did not create real headroom, setting a future source start before
the native time update caused invalid offsets, -1 dB compression still overshot,
and naive overlapping gain updates produced discontinuities.

## Curved LCD border follow-up, 2026-11-04

The original-demo fixture samples actual native CRT image edges and raycasts
the 3D display. Sampled visible edge pixels remain inside the curved mesh, with
less than nine native pixels of shortest-distance clearance. Interpolated UVs
retain the original framebuffer coordinates. A corner ray verifies the raised
border also curves; disabling CRT restores the rectangular surround and complete
unfiltered corner. Switching back restores the curve without another runtime.
This fit targets the pinned CRT Geom defaults, not arbitrary shader parameters.

Syntax/build passed. Four affected Edge settings/startup/3D/CRT cases passed
in 47.9s; the explicit software-graphics CRT case passed in 30.3s.
Source `72da407f03ddf872bdd7b3c19e4a9bba92445998` passed build, both complete
browser shards (25 cases) and actual deployment in Pages run `41763054197`.
Fresh live verification matched all 23 exact public assets and passed the
native edge/UV/filter-switching case in 14.1s. Original-demo output and updated
table/play/startup captures were visually inspected. Public documentation
follows deployment; no commercial-ROM retest or new user approval is claimed.
See `TODO/13_CURVED_LCD_BORDER.todo`.

## Physical cartridge loading follow-up, 2026-11-04

The insertion fixtures sample actual attached mesh positions each animation
frame, not only a status attribute. They check downward travel, projected fit,
positive tabletop clearance, persistent attachment and ordinary camera/pose
restoration. A real loader request is held, not replaced with a successful mock;
loading remains pending after seating and the real Pixel Lab frame appears
only after the genuine request is continued. The desktop case also checks
refresh without a repeated startup. Reduced motion seats immediately on the
explicit failed-CDN path; a real power-cycle observer records no reinsertion.

The first elevated pose was too dark outside the useful lamp beam. Lowering
too far intersected the tabletop; the final lit pose clears it. Desktop/phone
captures were reviewed. Syntax/build and all ten units pass; four final
explicit-software CDN, cold-boot and insertion cases pass in 1.5 minutes.

Pages `41765659405` passed 26/27 cases but correctly skipped deployment after
a power-off fixture failure. Its trace shows the periodic checkpoint disabling
the switch after actionability checking, before the click. That independently
tested timer is now switched off through normal UI in the cold-boot fixture;
all exact battery/checkpoint/iframe assertions remain, with an additional
zero-reinsertion observer. Application power/save behavior is unchanged.

Source `6f8d2652e6fee36d316f585f1baf242394540227` passed build, both complete
browser shards (27 cases) and actual deployment in Pages `41766869711`.
Fresh live verification matched all 23 exact public assets and passed both
desktop/phone insertion cases in 30.6s, including desktop refresh and real native
demo output. Public documentation follows deployment and live verification.
See `TODO/14_CARTRIDGE_INSERTION.todo`. No new user approval or commercial-ROM
test is inferred.

## Supplied website wordmark, 2026-11-04

The supplied raster was edited locally, not regenerated: its exterior was
removed, its lettering retained, and its safely separated word groups given
52 source pixels of added spacing. A clean antialiased white outline replaces
the initial noisy extraction fringe. The final asset is 991x124 RGBA.
Dark/light artwork previews and actual desktop/320px header captures were
visually reviewed. A browser canvas checks real PNG alpha, preserved opaque
white pixels and two separate substantial connected components. Actual header
bounds establish no collision with the status label at 1440/390/320px.
PNG packaging and image/png MIME are tested through the real static server.

Syntax/build and all ten units pass. Four focused Edge logo/startup/insertion
cases pass in 39.6s; two explicit-software logo/startup cases pass in 24.7s.
Source `5e8788931bc7417c11187eb5d5c28443d849edcc` passed build, both complete
browser shards (28 cases) and actual deployment in Pages `41768657819`.
Fresh live checks matched all 23 exact assets and passed both real logo/startup
cases in 24.4s. The original LCD startup/chime, favicon and shell lettering are
unchanged. This is technical verification, not new user visual acceptance or
an independent authorship/license claim for the supplied artwork.
Final provenance/docs and refreshed startup capture follow deployment.
See `TODO/15_SUPPLIED_WORDMARK.todo`.

## Pressed-control lighting, 2026-11-04

Raised socket solids intersected moving caps, and the face had no button
apertures. The fix cuts beveled openings and puts receiving floors below the
face while preserving materials, travel, tilt and lights. The original D-pad
fails the actual-render regression: one pressed arm probe reads 123.63 versus
245.4 resting. The first fixture attempt accidentally triggered render recovery
throttling; correcting its deterministic tick establishes the real baseline
without changing production throttling.

The regression raycasts the actual gaps to prove recessed surfaces, then reads
rendered cap pixels at rest/press for all front buttons and all D-pad directions.
It also verifies that lamp/LCD-off caps do not gain artificial press illumination.
The existing mapped-input case retains real native input, LCD orientation/color
transfer and power-off checks. Syntax/build and all ten units pass; focused Edge
pairs pass in 24.4s and 15.1s. Four explicit-software scene cases, including
inspection/responsive geometry and lamp falloff, pass in 1.4m.

Source `706563fe0355d6455a3c1ba1ff8fd9bafd3fa2a4` passes build, both complete
browser shards (29 cases) and actual deployment in Pages `41770495917`.
Independent live verification matches all 23 exact assets and passes both
pressed-control and native input/LCD/power cases in 26.0s. The reviewed figure
in the README crops actual deployed A/up captures. Final docs follow deployment.
These checks do not establish photometric calibration or new human acceptance.
See `TODO/16_PRESSED_CONTROL_LIGHTING.todo`.

## Not verified here

This revamp's suite uses the original demo, not commercial ROM data. Physical
gamepads, real iOS/Android devices, human hearing of audio output, exhaustive
browser/game compatibility, storage-eviction recovery without a backup, and
cloud synchronization are not verified by it. Sound tests check runtime volume,
scheduling and rendered samples, not whether audio sounded correct. Severe
sustained system overload and audio-device/driver faults are not solved by
these checks. The Windows run uses Edge.
Lighting is not photometrically calibrated. Rectangle lights do not cast
occlusion shadows, and authored wood bounce/exposure are not full GI.

GitHub Pages settings were verified as workflow-based. The user authorized
committing and pushing the prototype on 2026-11-04. A push triggers the Pages
workflow. That original prototype's run 41700230948 succeeded, both build and
deployment. The user subsequently authorized deploying the complete UI/3D/power
revision. That authorization and the local passing suite do not themselves
establish hosted CI/deployment. The later redesign's successful release and
live verification are separately recorded above. Final documentation was
authored only after that deployment succeeded.
