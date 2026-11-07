[![BowserBOY - updated chrome orbit and sparkle logo shimmering left to right every three seconds](docs/images/bowserboy-logo-shimmer.png?v=shimmer-3s-20261105)](https://zanark.github.io/BowserBoy/)

<p align="center">
  <strong>A little escape, on your desk.</strong><br>
  <a href="https://zanark.github.io/BowserBoy/"><strong>Play in your browser</strong></a>
  &nbsp;&middot;&nbsp; <a href="docs/GUIDE.md">Player guide &amp; local setup</a>
  &nbsp;&middot;&nbsp; <a href="docs/book/README.md">Engineering book</a>
</p>

**BowserBOY** is the umbrella project for browser-playable consoles, each with its own identity and showcase.

**First public release: [v1.0.0](docs/releases/v1.0.0/README.md)** - November 6, 2026 (Asia/Kolkata).
[Release archive and evidence](docs/releases/README.md) &middot;
[Documentation and repository map](docs/README.md) &middot;
[Workstream board](https://github.com/users/Zanark/projects/1).

**Desk update, November 7:** BowserBOY DS is a supported console, with
movable companions, slower Pear expressions and collapsed console tools.
[Monitored lighting deployment](https://github.com/Zanark/BowserBoy/actions/runs/42380481108):
98 browser cases passed; 21 exact scenarios remain explicitly parked
for later repair. Physical-phone performance and commercial-game compatibility
remain unqualified.

## Read the engineering book

<a href="docs/book/published/Building-a-Little-Escape.pdf"><img src="docs/book/editions/2026-11/cover.png" alt="Building a Little Escape - the BowserBOY engineering book, with the supplied purple handheld cover" width="360"></a>

*Want to explore the documentation? [Read the 96-page engineering book](docs/book/published/Building-a-Little-Escape.pdf): architecture, saves, geometry, lighting, testing and releases. [Chapter sources and build instructions](docs/book/editions/2026-11/README.md). The PDF is also included as a separate companion asset by the manual release workflow.*

## Supported consoles

- [**BowserBOYADVANCED**](#bowserboyadvanced) - Game Boy Advance.
- [**BowserBOY DS**](#bowserboy-ds) - Nintendo DS.

*Both consoles share the BowserBOY desk. Showcase captions retain each
capture's original provenance; they do not define the current release status.*

<a id="bowserboy-ds-local-prototype"></a>

## BowserBOY DS

<picture>
  <source media="(prefers-reduced-motion: reduce)" srcset="assets/ds-logo.png">
  <img src="assets/ds-logo-shimmer.png" alt="BowserBOY DS neon chrome logo with a shimmering reflection across its two screen rectangles">
</picture>

*A moving reflection shimmers across the two DS screen rectangles here and in the
Inspect heading; the lettering, orbit and chrome borders stay still. Reduced motion
uses the original static artwork. The lower-body underside, loading LCD and DS tools
retain that static artwork. The inner lid has no emblem.*

![Current separate GBA and DS consoles together with all three desk lamps](docs/images/desk-fresh-table.png?v=dual-console-20261107)

*Two separate consoles on the same table. The blue-cyan DS faces the lamp,
clears the loose cartridges and keeps its lime stylus clipped to its side.
Fresh local-source capture: tripod, Pear and axolotl on; Room off.*

![HeartGold running on both real DS displays in the current upright play view](docs/images/ds-gameplay.gif?v=dual-console-20261107)

*Fresh recording with the owner's local Pokemon HeartGold cartridge.
Both LCDs show actual DeSmuME output, not pasted-in video. The blue-cyan shell
sits in the existing table lamp's light; no extra camera light.*

### A cartridge, not a frozen sidebar.

![Selecting an NDS file immediately enters DS play view while the cartridge and loading LCD animate](docs/images/ds-cartridge.gif?v=dual-console-20261107)

*Choose a cartridge and return to the DS immediately. The card enters from
below; the lower LCD animates while reading and native startup continue.
This short clip shows loading, not the complete startup time.*

### Buttons and a touchscreen.

![Real DS button presses and pointer input on the lower physical touchscreen](docs/images/ds-controls.gif?v=dual-console-20261107)

*Keyboard controls travel with the physical buttons. Click or drag the lower
screen for touch input; what the game does depends on its current screen.*

![Hover the side stylus, pick it up, use it on the lower DS display and return it](docs/images/ds-stylus.gif?v=dual-console-20261107)

*The lime stylus is a real movable scene object. Its tip follows the pointer;
Escape puts it back into the side clip.*

### Open it your way.

![Rotate the DS body, adjust its hinge and retain the pose for native gameplay](docs/images/ds-inspect.gif?v=dual-console-20261107)

*Choose Rotate body or Move hinge, adjust the opening, then Lock pose and
Back to play. Both angles stay fixed for gameplay. Without a lock, gameplay
returns to a flat, camera-facing DS. Fresh recording with HeartGold still running.*

![Adjust the live DS play-view zoom without cropping the two LCDs](docs/images/ds-play-zoom.gif?v=dual-console-20261107)

*Both screens, one fitted view. Move between 50% and 100% zoom.*

### The same desk, a different light.

![The upright DS under the table lamp, room lighting and their independent combinations](docs/images/ds-lighting.gif?v=dual-console-20261107)

*Lamp only, lamp + room, room only, and back. The companion lamps remain
independently controlled; the console's paint and screen brightness do not change.*

![Tilt the running DS with the tripod, room, Pear and axolotl lights all switched off](docs/images/ds-lcd-reflections.gif?v=dual-console-20261107)

*Every room and desk lamp off. The two native LCDs cast their own colored light
while the console tilts in Inspect.*

![Centered rear-lid recesses and the DS logo on the lower-body underside](docs/images/ds-rear-markings.png)

*The two recessed squares are centered on the upper lid. The unchanged supplied
logo sits on the lower half's underside, beside rather than over the battery
cover. Actual local Inspect capture with Room lighting on; not a deployed build.*

![Blue-cyan DS shell with its lighter base under the existing warm lamps](docs/images/ds-blue-cyan-warm.png)

*The shell in its earlier fixed lighting-reference pose, with Room lighting off and the displays dark. Warm lamps,
exposure and GBA materials are unchanged; the lower base alone uses a lighter
blue pigment than the lid. Actual local capture, not a published build.*

Open [BowserBOY online](https://zanark.github.io/BowserBoy/), or run
`npm run dev` from the repository and open **http://127.0.0.1:5173**.
Select **DS**, open **DS cartridges** and choose
**Try Twin Lab** or an authorized uncompressed `.nds` file. The game card
slides into the separate DS, and both LCDs display live output.

Use arrows for the D-pad; **Z/X = A/B**, **A/S = Y/X**, **Q/W = L/R**,
**Enter = Start**, **left Shift = Select**. Press the physical controls or
click/drag the lower LCD for touchscreen input at its current orientation
and zoom. Hover the side **stylus** to make it glow, then click to pick it up:
its tip follows the pointer while its back points toward you. **Escape**,
right-click or **Put back** docks it; otherwise Escape opens DS tools.
Gameplay hints stay on one bottom-left line instead of across the LCD.
Both DS screens cast soft, screen-colored light onto their surroundings.

![DS face-button sockets clear the touchscreen bezel and stay inside the shell](docs/images/ds-control-clearance.png)

*The entire button diamond sits clear of the actual touchscreen bezel, including
the recessed Y socket. D-pad clearance is preserved. Actual local Inspect capture;
DS A/S now send Y/X, Q/W retain the shoulders, and GBA bindings are unchanged.*
Switching GBA/DS pauses the inactive core rather than running both games.
The visible front-left **Power** button saves before powering off; press
it again to cold-boot the retained cartridge. Power-on plays an original
soft-glass chime, distinct from the GBA's chip arpeggio; DS mute silences it.
Power also works with an empty slot. The orientation lock survives
console switching and put-down/pickup, but resets on page reload.

DS checkpoints use a separate browser database and `.bbds-save` backups;
GBA saves and `.bba-save` files remain separate. Reselect the exact same
ROM after reload to resume its stored checkpoint. Power off saves a
checkpoint; **Power on** cold-boots from in-game save data rather than
resuming that checkpoint. Export before clearing browser data or changing
origins.

First launch needs internet for pinned EmulatorJS 4.2.3/DeSmuME. Original
DS direct boot is supported; DSi, BIOS-menu boot, networking and universal
game compatibility are not claimed. No ROM collection, BIOS or firmware
is included. Desktop Edge and a 390px responsive browser viewport are
tested; real-phone performance and complete commercial-game compatibility remain
unqualified. These recordings establish only the shown screens and interactions.
The GBA's native shader/settings/fullscreen features are not all DS features.
[Full instructions and limits](docs/GUIDE.md#nintendo-ds).

## Rearrange the desk

![Lift, move and drop the current blue DS and purple GBA with the console placement controls](docs/images/console-movement.gif?v=dual-console-20261107)

*Move each console independently. This recording uses the dock's keyboard
placement controls; each console keeps its desk orientation and session position.*

Drag either console to lift and move it in 3D; scroll for depth and release
to drop. Both keep their original desk orientation. **Move consoles** in
the dock also provides keyboard placement and reset. Click without dragging
to play; **Put down** returns to the moved position. **Inspect** still rotates
normally. Positions last until reload. [Movement controls and limits](docs/GUIDE.md#move-the-consoles).

Console tools start collapsed as a small grip at the bottom-left. Click either
console to reveal its actions, or use the grip's expand arrow. Lighting remains
in its separate dock.

## pear-boy - desk companion

![Adjust Pear's warm light through 10, 40, 70 and 100 percent, then switch it off and on](docs/images/pear-lighting.gif?v=dual-console-20261107)

*Pear alone: 10%, 40%, 70%, 100%, off, and back on. His real light pool
responds; the other lamps are switched off for this demonstration.*

![Lift pear-boy, move him in depth and drop him through his scream, bounce and landing recovery](docs/images/pear-movement.gif?v=dual-console-20261107)

*Lift, hold, scroll for depth, then let go. His light moves with him.
Scream, small angry eyes, squeezed-eye pout, normal smile; always three dots per cheek.*

Drag him upward or sideways, scroll for depth, then release to drop and bounce.
His whole face follows the cursor. While held or falling, his cute squeezed eyes
and rosy cheeks accompany closed/open scream mouths, each held for almost a
second. A hard landing brings small round angry eyes, then a squeezed-eye
pout, then his normal smile. All expressions
retain the signature three dots on each cheek. Reduced motion keeps the scream
mouth still.
Move him farther back to rest his feet on the table.
The pear dock button controls power, brightness, movement and reset.
[Controls and physics limits](docs/GUIDE.md#pear-boy).

## A smaller axolotl night-light

![Switch the axolotl between Sleep 50 percent, Bright 100 percent and off](docs/images/axolotl-lighting.gif?v=dual-console-20261107)

*Axolotl alone: Sleep 50%, Bright 100%, off and back on. Cream body,
pink gills, tiny feet, raised tail and a real warm glow.*

![Lift and move the axolotl lamp, adjust its depth, then release it to fall and bounce](docs/images/axolotl-movement.gif?v=dual-console-20261107)

*A smaller movable light. Drag, lift, scroll for depth, drop; its light
follows its actual position rather than staying painted on the desk.*

Click it for power, or use its **Lighting** dock button for **Sleep 50%**
and **Bright 100%**. Drag, lift and drop it like pear-boy; the other lights remain
independent. [Controls and limits](docs/GUIDE.md#small-axolotl-night-light).

## Every light, independently

![Switch the fixed woven tripod and room lights independently, including complete lamp darkness](docs/images/lighting-overview.gif?v=dual-console-20261107)

*Tripod only, tripod + room, room only, all lamps off, tripod again.
Pear and axolotl are off here. The woven tripod stays fixed; the two companion
lamps are movable. Each console's live LCDs are another real light source.*

## BowserBOYADVANCED

[![BowserBOYADVANCED - purple animated console logo with glow](docs/images/bowserboyadvanced-logo-glow.png)](assets/logo.png)

*Your Game Boy Advance, on the BowserBOY tabletop. [Play BowserBOYADVANCED](https://zanark.github.io/BowserBoy/).*

*Fresh November 7 recordings use the owner's local Celia's GAME cartridge.
The animated branding and explicitly historical still references are preserved.
[Recording coverage and provenance](docs/MEDIA.md#fresh-gba-ds-and-all-lights-2026-11-07).*

### One table. Two consoles.

![Current BowserBOY table with the woven tripod, Pear, axolotl and both separate consoles](docs/images/desk-fresh-table.png?v=dual-console-20261107)

*The current BowserBOY tabletop. Purple GBA, blue DS, and three independent desk lamps.*

### Pick it up. Turn it over.

![Pick up the handheld, inspect it with the animated purple console logo, and return to the chrome-branded table](docs/images/pickup-inspect.gif?v=dual-console-20261107)

*Soft engraved A/B letters. Metallic-chroma bezel. Purple console branding with orbiting stars while you inspect.*

### Purple belongs to the console.

![Rear inspection with deeper purple console engraving and its animated purple inspection header](docs/images/readme-back.png?v=woven-20261106)

*Purple console identity. Larger lettering. Deeper engraving.*

### Press. Rock. Release.

![Actual keyboard presses move A and B and rock the diagonal D-pad during play](docs/images/button-feedback.gif?v=dual-console-20261107)

*Softer recessed A/B letters. Deeper presses. Rocking D-pad. Snappier return.*

### A closer look.

![Ordinary play zoom moves from the fitted 50 percent view into 100 percent and back without fullscreen](docs/images/play-zoom.gif?v=dual-console-20261107)

*Same comfortable view at 50%. Move closer up to 100%. No fullscreen needed.*

### A little faster. Just while you hold.

![Hold Space for native fast-forward, then release it to return to normal speed](docs/images/hold-space.gif?v=dual-console-20261107)

*Hold **Space** for 2x. Let go for 1x.*

### A clearer little message.

![Current frosted power-on notice overlays the fitted handheld, with the play-mode header logo hidden](docs/images/readme-notice.png?v=woven-20261106)

*Frosted overlays. No shrinking or shifting the handheld. No header logo during play.*

### Power where it belongs.

![The handheld tilted through Inspect controls to reveal its ribbed underside power slider](docs/images/readme-underside.png?v=woven-20261106)

*Underside slider. Clear front face. Real power-off and cold boot.*

### Power on. Make some waves.

![Current LCD startup with the purple console wordmark, complete sparkles and a spacious glowing orbit](docs/images/power-on.gif?v=dual-console-20261107)

*Purple console startup. Waving lettering. An 8-bit-style chime. Power remembered between visits.*

### Slot it in.

![A selected local cartridge physically slides into the handheld during loading](docs/images/cartridge.gif?v=dual-console-20261107)

*Bring your own local ROMs. Game files stay on your device.*

### Your room, your light.

![The warm STORSEGEL-style woven white shade and ash tripod with independently switched room lights](docs/images/cozy-lights.gif?v=dual-console-20261107)

*A clean STORSEGEL-style shade. Warm ash legs. No visible cable.
Switch the tripod and room lights without changing the companion lamps.*

### Wave the light.

![Tilt the powered console in complete room darkness and watch the actual LCD's colored light move across the desk](docs/images/lcd-reflections.gif?v=dual-console-20261107)

*Tripod, room, Pear and axolotl all off. Just the green power LED,
Celia's GAME, and the screen's moving pool of light.*

*Audio-paced timing and a larger native reserve for steadier playback. [Audio notes and limits](docs/GUIDE.md).*

### Nine ways to glow.

![Current sound and Screen shader settings with CRT Geom selected](docs/images/crt-presets.png?v=woven-20261106)

*Nine native CRT presets. CRT Geom by default. Unfiltered, too.*

### Just the game.

![Actual game-screen fullscreen with the metallic-chroma bezel wordmark, dark margins and independent zoom](docs/images/screen-fullscreen.gif?v=dual-console-20261107)

*Full 3:2 picture. Dark margins. Adjustable 50-100% zoom.*

### Everything within reach.

![Purple icon dock with its drag grip, collapse arrow and separate desk and LCD fullscreen controls](docs/images/readme-dock.png?v=woven-20261106)

*Desk or LCD fullscreen. 1x-4x speed. Sound, lighting and settings within reach.*

### Make a little room.

![Drag the tools dock, collapse it into a small movable pill, move it again, expand and reset its position](docs/images/movable-dock.gif?v=dual-console-20261107)

*Drag the grip. Collapse with the arrow. Move it where it suits you. Focus the grip and press Home to reset.*

### Keep your progress.

![Current Progress and backups panel with an original-demo checkpoint saved](docs/images/readme-saves.png?v=woven-20261106)

*Local in-game saves. Autosave + three checkpoint slots. Download a `.bba-save` backup. [Saving explained](docs/SAVING.md).*

### Back to your game.

![Click the blurred area outside settings to close the drawer and return to the console](docs/images/settings-backdrop.gif?v=dual-console-20261107)

*Click outside to close. Or use Escape. Your game keeps running.*

---

[Playing & setup](docs/GUIDE.md) &middot;
[Saving & backups](docs/SAVING.md) &middot;
[Architecture](docs/ARCHITECTURE.md) &middot;
[Engineering book](docs/book/README.md) &middot;
[Verification](docs/VERIFICATION.md) &middot;
[Media & motion](docs/MEDIA.md) &middot;
[Development journal](TODO/04_DEVELOPMENT_LEDGER.todo)

*Independent project; not affiliated with Nintendo. [Credits & licenses](THIRD_PARTY_NOTICES.md).*
