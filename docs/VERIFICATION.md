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

## Not verified here

This revamp's suite uses the original demo, not commercial ROM data. Physical
gamepads, real iOS/Android devices, human hearing of audio output, exhaustive
browser/game compatibility, storage-eviction recovery without a backup, and
cloud synchronization are not verified by it. Sound tests check runtime volume
configuration, not whether audio sounded correct. The Windows run uses Edge.
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
