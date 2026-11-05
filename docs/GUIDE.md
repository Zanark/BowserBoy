# Player and developer guide

[Visual showcase](../README.md) | [Play online](https://zanark.github.io/BowserBoyAdvance/) | [Engineering book](../book/README.md)

## Website and console names

**BowserBOY** is the website/table, using the supplied chrome sparkle logo
in its header and tools/settings panels. **BowserBOY ADVANCED** is the first
console: the current GBA handheld. Its original purple artwork still reads
BowserBOY ADVANCE and stays unchanged on its rear and idle/loading/startup LCD.
The physical bezel lettering also stays unchanged. Additional consoles on the
table are planned, not implemented or selectable.

The owner will rename the GitHub repository separately. Until then the existing
repository and Pages URLs remain valid; this branding change does not rename
storage, modify saves, or move the local checkout.

**Current release and pictures:** source `a7a07fc` is independently verified
live after the full 40-case hosted gate and exact 28-public-asset match.
It recovers the original soft Arial A/B shapes, size and placement with shallow
genuine inward engraving, replacing the rejected custom rounded shapes.
It retains deeper presses, stronger
D-pad/shoulder movement and snappier returns; the centered bezel wordmark is
another 20% smaller in both views, now without the exterior light contour.
Frosted overlays do not move the camera;
sustained audio buffering, darker D-pad arrows and play-only header hiding remain.
README footage/stills retain their local `8a1d6a3` capture origin; the later
borderless-bezel, later A/B refinements, metallic finish and enlarged rear
engraving and chrome website header postdate those recordings.
Most inherited guide motion/pose/detail figures belong
to the earlier `ab912d5` edition and were captured locally before its deployment;
the notice and lighting/power-off figures were captured on that public edition.
See [current release evidence](VERIFICATION.md#larger-etched-rear-logo-2026-11-05)
and [capture origins](MEDIA.md#current-refresh---recessed-controls-and-smaller-bezel).

Normal playback now defaults to audio-paced timing to address reproduced
intermittent dropouts; bounded measurements are not a guarantee for every device.

The bezel letters now have a metallic chroma finish: light/dark chrome bands
with restrained iridescent color, not an animated RGB glow. Their original
shape, smaller size and borderless silhouette stay unchanged; the bezel and
other logos are untouched. Fullscreen shares the exact lettering canvas.
Current [qualification](VERIFICATION.md#metallic-chroma-lettering-2026-11-05)
is separate from the older pictures below.

![BowserBOY chrome website wordmark](../assets/website-logo.png)

*The supplied transparent chrome website logo, preserved byte-for-byte.
A restrained neutral shadow separates it from the warm room without tinting
the silver artwork purple. It is hidden in play view and returns on the desk
or in Inspect; notifications retain their existing header position.*

**A little escape, on your desk.** A local-first browser GBA player inside an
actual 3D indigo handheld, built for static hosting on GitHub Pages.

![The 3D indigo handheld on its wooden table](images/3d-table.png)

*A full-width warm plaster wall and thick wooden tabletop, with open room
below its front edge. The closer resting view keeps the handheld's physical
size unchanged; the large paper lantern can extend beyond the frame.*

## Lights out

The room starts with a warm paper lantern on and **Room** lights off. Click the
modeled lamp or use **Lamp** to switch it independently of the game. **Room**
adds optional ceiling/reflected illumination without changing console power.
The original paper-and-wood lantern is roughly four handheld widths tall.
Its downward light casts shadows;
the LCD casts one-sided, screen-colored light as you lift or rotate the handheld.
Turning the power off extinguishes its screen light. These are real-time lighting
approximations, not a full global-illumination simulation.

![Deployed lantern, enlarged handheld screen and optional room illumination](images/cozy-room.png)

*Left: the large clipped lantern and actual thick tabletop. Center: lantern-only
play view, with the larger LCD and enlarged dark power slider. Right: lamp off,
room lights on. The console remains off in all three views.*

![The original demo with only the LCD lighting the room](images/lcd-light.png)

*Lamp off: the original Pixel Lab framebuffer is mostly dark, so its tiny
colored square contributes little light. The screen glow follows its actual
orientation and colors, rather than a fixed room-wide fill.*

## Infinite battery

The first visit starts **powered off**, with a dark LCD. Pick up the handheld
and use its enlarged dark power slider on the **lower underside edge**, not the
front face. Its projected touch target follows the cap and is at least 44 by 44
pixels, clear of the LCD and bottom dock. Inspect and tilt the console to see
the ribbed cap, track and label on that edge.

![Actual underside power slider, with the console tilted and room lights enabled](images/underside-power.png)

*The actual public handheld in Inspect mode: the dark ribbed slider is on the
lower shell edge, with no switch on the front face. Room lights reveal its
physical cap, track and label; this is not a mockup.*

A short orbital-logo reveal, revolving stars and synthesized chime play on the actual LCD only when switching
from off to on. The chime follows volume/mute; reduced motion uses a static reveal.
The supplied transparent wordmark also appears on the rear shell, idle/loading
LCD and settings panels. The front bezel uses the supplied logo's distinctive
lettering with a metallic chroma finish, without stars; screen-only fullscreen shares that artwork.
The rear logo is about40%larger and inset into the battery-cover plastic with
shallow engraved edges. Its original purple color and bright lettering are
preserved, not darkened to imply engraving. Existing rear-view pictures predate
this refinement; see [current qualification](VERIFICATION.md#larger-etched-rear-logo-2026-11-05).
A/B letters are softer gray grooves cut into the unchanged cap faces, with inset floors and
sidewalls rather than raised or printed lettering. D-pad arrows retain their
raised rubber geometry and darker tones. Shoulder letters retain their cap material;
START/SELECT and the geometric **ZANARK** badge are molded in the shell's plastic.
There is no front POWER or BBA-001 print; the power light remains.
Normal play is slightly closer while retaining the whole handheld and clear UI;
inspection and cartridge insertion retain their separate framing.
Notifications use translucent frosted glass in the header area and may overlap
the console. Showing, changing or dismissing a notice does not shift or shrink
the handheld; its ordinary close view stays in place.
Long messages scroll inside the card; errors keep a distinct warm tint.
The active favicon is an original indigo handheld whose
stepped shoulders and bowed lower edge match the actual 3D shell.

![Actual public handheld with molded control lettering and stylized monochrome bezel](images/molded-controls.png)

*Room lights and a slight inspection tilt reveal the earlier same-material raised letters
and their edges. The star-free bezel uses the original logo's typography;
the front has no POWER or BBA-001 print. This capture precedes the darker
A/B and D-pad marking refinement.*

![The original power-on sequence on the handheld LCD](images/startup.png)

*The supplied purple wordmark with a gentle wave, original star-orbit motion
and a subtle starfield, not a Nintendo BIOS or recording. The startup renders
at 960x640 without the earlier added logo blur; game pixels are unchanged.
Reduced motion keeps a static
presentation. Infinite battery; no automatic power-off timer.*

Refresh remembers the switch position and the last inserted cartridge locally.
If it was on, the cartridge reloads using its latest committed resume point,
**without replaying startup**. If it was off, it stays off. Inserting a cartridge
does not turn it on. The physical switch and the explicit dock restart action
are the only ways to cycle power.
Browser refresh still creates a new emulator process; unsaved frames are not
continuous across navigation. Save a checkpoint before refreshing.

## Slot it in

A 3D cartridge slides into the top slot while the emulator loads, then stays
seated during play and inspection. The loading view briefly widens and lowers
the handheld into the lamp's light before returning to its normal position.

![An original cartridge entering the handheld during loading](images/cartridge-inserting.png)

*The original BBA cartridge is part of the 3D scene, not an LCD overlay.
Reduced motion seats it immediately. Power cycling an already-loaded cartridge
does not replay insertion, and the animation never delays the emulator.*

## Play locally

Node.js 22+ is required for the development commands, not for visitors to the
published website.

```powershell
cd C:\devdesk\homedesk\BowserBoyAdvance
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Click the handheld to pick it up, then open
**Cartridges** or press **Escape** for the tools drawer. Choose an uncompressed **`.gba`**
ROM you have the right to use, or select **Try the original demo**. If the
handheld is off, use its physical power switch to start.
Pixel Lab is an original input-test cartridge: arrows move the square, holding
**Z** changes its color, and **X** stores its horizontal position in cartridge SRAM.

ROM bytes are read locally, not uploaded. No account, server-side library,
commercial ROM or BIOS is included. Only the last inserted ROM is retained in
this browser's local storage so the console can survive refresh; it is not
uploaded or added to a server-side collection. Clearing site data removes it.
Internet is required for the versioned EmulatorJS/mGBA runtime.
The 3D scene requires WebGL 2. Its decorative cartridges are not supplied games.

## Pick it up

**Inspect** lets you drag the model to see its sides, ports and battery cover.
Scroll or pinch to zoom; keyboard inspection supports arrows, plus/minus and
Home to reset. **Back to play** restores the playable angle; **Put down** returns
the handheld to the table. Reduced-motion mode skips the pickup animation.

![The raised handheld in play view](images/3d-handheld.png)

*The LCD and bezel lettering are surfaces on the mesh, not a floating iframe
or a flat photograph. The inner screen border follows CRT Geom's bowed sides
and corners; unfiltered mode restores a complete rectangular screen.
The larger screen keeps its native 3:2 proportions while approximately halving
the previous bezel gaps. Controls sit on the physical shell.*

![Pressed action button and D-pad on the deployed handheld](images/pressed-controls.png)

*A pressed and D-pad up pressed: the caps move inside beveled shell openings.
Recessed floors replace raised socket discs that previously intersected the
caps and produced broken dark patches. Materials and lamp lighting stay intact.*

The revised shell uses stepped shoulders, straighter sides, a bowed lower edge,
low-profile buttons and recessed speaker slots. Its shape was informed by the
[user-supplied Sketchfab reference](https://sketchfab.com/3d-models/nintendo-gameboy-advance-gba-a0b6d1eb5ccb4c72a6944d77b3ac7c05);
that model was not imported. See [asset provenance](../THIRD_PARTY_NOTICES.md).

<details>
<summary>Turn it over</summary>

![The back of the inspected handheld](images/3d-back.png)

*The rear shell, battery cover, grip and recessed screws have their own geometry.
Rotating the model naturally hides its front-facing game display.*

</details>

## Controls

![The themed icon quick-access dock on the deployed website](images/quick-controls.png)

*Named, keyboard-accessible 44px icon controls, with hover/focus labels. On
narrow phones the same actions fit two rows without covering the LCD.*

The dock exposes inspection, put-down, lamp/room lighting and Cartridges, plus
whole-desk fullscreen, separate **Screen fullscreen**, **1x/2x/3x/4x native speed**,
keybindings, a persistent autosave toggle,
save/load for the selected checkpoint slot, slot selection and **safe off/on
restart**. Restart commits in-game battery data and creates a fresh runtime;
it never restores an instant checkpoint. Actual fast-forward throughput depends
on the browser/device. Fast-forward temporarily releases native VSync's timing
cap; returning to 1x restores your selected VSync preference.
The drawer and real EmulatorJS panel share the purple theme.

**Screen fullscreen** fits the complete game picture and black bezel, including
the printed wordmark, without cropping or stretching. Unused space stays black.
Use **Zoom** at the bottom right to shrink the whole screen to 50-100%;
100% is the largest fit that keeps everything visible. Keyboard users can focus
the slider and use arrow keys, Home (50%) or End (100%). Click the picture to
resume keyboard gameplay; Escape or the top-right close button returns to the desk.

| Action | Keyboard |
|---|---|
| Move | Arrow keys |
| A / B | Z / X |
| L / R | A / S |
| Start / Select | Enter / Left Shift |
| Cartridge and settings / exit screen fullscreen | Escape |

Click the game for keyboard focus. The console's D-pad, A/B, L/R and Start/Select
buttons work with mouse, touch and keyboard activation. Their meshes visibly
depress with deeper travel and a snappy return: the D-pad rocks more strongly
and the shoulder buttons visibly hinge. Recessed A/B letters move with their
caps; the animation does not delay game input. The lower-edge power
slider turns the emulator off: the LCD goes dark and the runtime is removed.
Turn it back on to boot the loaded ROM from the beginning with its in-game
save data, **not an instant checkpoint**. Pause/resume remains in Cartridges.
Rotate a phone for a
larger handheld. Keyboard and mouse/touch gameplay controls are active in play
view, not while inspecting or resting on the table. Screen fullscreen is the
exception: existing keyboard controls work there even from table view.
The game itself continues
until paused.

**Screen fullscreen** fits the complete live game picture and its black bezel,
preserving the 3:2 picture and current filter. The surrounding space stays dark;
use the bottom-right **Zoom** slider to shrink the whole frame without cropping.
It hides the shell's touch controls; use your keyboard.
Escape or the top-right close button returns to the same desk view and running
cartridge, without a reset. Browser fullscreen support is required; unavailable
or refused requests display an explicit notice.
Scene notices appear directly below the website logo; open tools retain notices
inside their own panel.

![Complete native Pixel Lab picture and shared stylized bezel fitted in fullscreen with a bottom-right zoom slider](images/screen-fullscreen.png?v=molded-glass-book-20261104)

*The original demo on the actual native CRT output, surrounded by the matching
black bezel and monochrome print. No second emulator or reset; zoom only changes
the presentation. Escape or the top-right close button returns.*

The hidden drawer contains ROM loading, every save/backup action, pause,
fullscreen, key remapping, volume, mute and screen filtering. **CRT Geom** is
the default, using the actual shader bundled with the pinned emulator, not a
CSS imitation. **Screen shader** offers all nine native CRT presets:
Geom (default), Aperture, Beam, Caligari, Easymode, Lottes, Mattias, Yeetron
and ZFast, plus **Unfiltered**. Choices apply without restarting the game and
are remembered; an explicit saved choice is not overwritten by the default.
Click a key binding and press its
replacement; duplicate assignments and reserved browser keys are rejected.
Keys, sound and filter settings persist in checked local browser storage; failed writes
explicitly apply only to the current session. Escape remains reserved for tools
or exiting screen fullscreen.
Opening the drawer does not automatically pause gameplay.

Audio automatically uses a larger native playback reserve, a short startup
cushion, smooth volume/mute changes and peak compression to reduce dropouts and
overload distortion. More buffering trades additional audio latency for stability;
the 256 ms native budget is not a measured end-to-end delay. This cannot guarantee glitch-free sound
under sustained system overload or fix an operating-system/audio-device problem.
Native **VSync defaults off** so audio synchronization can pace normal gameplay.
Explicit saved VSync preferences are preserved. If you previously enabled it in
Advanced settings and still get interruptions, switch it off; the measured enabled
configuration can drain the playback queue despite its allocated capacity.

**Advanced EmulatorJS settings**, at the top of the sidebar, opens the actual native graphics, speed,
screen-capture settings and backend core options in a separate panel. It keeps
the current game and pause state intact; Escape or Close returns to Cartridges.
Selections are remembered when the panel closes, including other native shaders.
Options marked **Requires restart** apply on the next power on. Keys, sound,
save handling and the uncluttered LCD remain owned by this application.

![Native EmulatorJS options in a separate panel](images/native-settings.png)

*The original native menu is accessible without showing a toolbar on the LCD
or replacing the running cartridge.*

Controller support remains provided by EmulatorJS; physical controller
compatibility has not been tested.

<details>
<summary>Inside the cartridge slot</summary>

![Cartridge and settings drawer](images/cartridge-drawer.png)

*The drawer keeps ROMs, checkpoints, backups and controls out of the playing
view. Scroll within it for sound settings and help.*

</details>

## Keep your progress

- **Auto-save:** one rolling checkpoint every 15 seconds while enabled;
  its on/off choice is remembered across refreshes.
  The newest stored checkpoint resumes when the same ROM is selected again.
- **Save checkpoint:** three independent manual slots, unaffected by rolling
  auto-saves. Original quick saves remain in **Slot 1**. Choose a slot in
  Cartridges or through the dock's slot icon; save/load uses that selection.
- **Export / Import backup:** carry the current session in a `.bba-save` file.
  The exact ROM content and runtime version must match; checksums detect damaged
  backup data. Export works even if browser checkpoint writes fail. Each backup
  contains one session, not every slot; import replaces only the selected manual slot.

Checkpoints include an instant emulator state and cartridge battery-save bytes
when the game provides them. Use the game's own save menu as usual.
This prototype does **not** import/export raw `.sav` files or sync to the cloud.

**Save manually before closing and export regularly.** Browser data can be
cleared or evicted, and private browsing may discard it. Saves belong to the
same browser profile and origin (scheme, hostname and port), not your account.
Changing to a new device, localhost port or custom domain requires a backup.
Renaming the ROM does not lose progress because identity is based on SHA-256.

See [the saving guide](SAVING.md) for recovery and limitations.

## Learning the implementation

The [first chaptered engineering book](../book/README.md) explains the static
runtime boundary, cartridge/power lifecycle, save transactions, original 3D
geometry, native pixels and lighting, input ownership, actual algorithms/data
structures, design trade-offs and delivery evidence. Its ten numbered chapters
include diagrams, source references and worked exercises. This is a Markdown
edition, not a separately built PDF or Pages reader.

## GitHub Pages

The repository is configured to publish through **GitHub Actions**. The workflow
in [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) checks, builds and
tests the site, then publishes **only `dist`** on a push to `main` or a manual
workflow dispatch. Pull requests run checks without deploying.
If a deployment run fails, start a **fresh workflow run**, not a retry of the
failed run: `gh workflow run pages.yml --ref main`. Keep the full build/browser
gate intact; report permission failures rather than bypassing them. This is the
user's recovery policy for this repository only.

Pages address: **https://zanark.github.io/BowserBoyAdvance/**.
Latest independently verified application: notification source
`ab912d51ecc615f7aa55a4d27f6a876673739cdf`, fresh normal Pages `41875740589`.
Build, 11 units, all 39 browser cases and deployment succeed. Independent
verification matches 28 public assets; five actual public native/notice/pinch/
fullscreen/save/input cases pass in 2.0m. Desktop/phone public notice captures
are reviewed. The healthy deployment was allowed to finish without duplicate
dispatches or retrying the earlier failed run.

The following paragraphs retain historical release evidence. The
icon-dock/orbital-startup release was
`1785a15936b9bb7328a415bdb6fae12204c6bcdc`, Pages run `41803699865`:
build, 11 units, both complete browser shards (35 cases) and deployment succeeded.
Independent production checks matched all 26 public assets and passed eight
real dock/slot/speed/autosave/restart/native/startup/power cases before these
documentation updates. This is technical release evidence, not user visual approval.

The dark-room, 3D, native-settings and real-power redesign was deployed from
`d551f4269b58fc31e496c4d1bc8d9d6110817f79` on 2026-11-04, following successful
build and both browser shards (Pages run `41746728238`). A fresh live-browser
check verified all 19 public assets and the lamp, native demo, CRT, settings,
button travel and power lifecycle before this documentation was finalized.
The original branding/startup and remembered-power follow-up was deployed from
`ab4fc8850d0b67870dd431d4a398c5a3e98ac47d` in Pages run `41753762933`.
Both complete browser shards (22 cases), build and deployment passed. A fresh
live browser verified all 22 public asset hashes and the actual startup,
cartridge/power refresh behavior and prominent native-settings entry before
this follow-up documentation.
Final startup-notice cleanup `78887d7` also passed the complete gate, deployed
in Pages run `41755029718` and passed fresh live verification.

All application paths are relative. The browser suite serves the build under
`/BowserBoyAdvance/`, rather than merely testing a domain-root development page.
The core runs single-threaded; no custom COOP/COEP headers are required.

```powershell
npm run build
npm run preview
```

`dist` is generated and replaced on each build. It contains the static
application, the two pinned Three.js build modules, two rectangular-light
lookup helpers and their MIT license,
and the generated original Pixel Lab cartridge. The complete dependency tree,
project documentation and private session context are not deployed.

## Development and evidence

```powershell
npm run check
npm test
npm run build
npm run test:browser
```

The browser suite uses installed Microsoft Edge by default. To use Playwright's
Chromium instead:

```powershell
npx playwright install chromium
$env:BROWSER_CHANNEL = 'chromium'
npm run test:browser
```

Real-core integration tests require internet. They use the original generated
cartridge, not commercial game data. See [architecture](ARCHITECTURE.md),
[verification scope](VERIFICATION.md) and the numbered [TODO index](../TODO/00_INDEX.todo).

<details>
<summary>Mobile layout</summary>

<img src="images/pixel-lab-mobile.png" width="320" alt="The indigo handheld on a narrow viewport, running the original Pixel Lab cartridge without LCD overlays">

*The same handheld fits a narrow viewport without horizontal overflow. Touch
controls are its physical shell buttons, not overlays on the game.*

</details>

Independent prototype; not affiliated with Nintendo. See
[third-party notices](../THIRD_PARTY_NOTICES.md) for runtime sources and licenses.