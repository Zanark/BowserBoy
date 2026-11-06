# BowserBOY media and capture provenance

[Visual showcase](../README.md) | [Player and developer guide](GUIDE.md) | [Engineering book](book/README.md)

The README is a visual front page: animation, images and short captions.
Setup, controls, limitations and release history belong in the linked guides.
This is the user's explicit policy for this repository, not a portfolio-wide rule.

## Sources and boundaries

### Brighter blue-cyan DS and lighter NDS base, 2026-11-07

The current `ds-prototype-table.png` and `ds-prototype-playing.png` come from
the actual native DS browser case after the color correction and base-only
follow-up. `ds-blue-cyan-warm.png` comes from the focused shell-color case
with Room lighting off and the displays dark. The final warm and native
runtime captures were visually reviewed. No game screens are composited.

The earlier teal specification below is superseded by #0077FF lid paint,
#40A0FF lower-base paint and paint-only reflection strength 20. Both retain
.80 metalness/.35 roughness, grain and clearcoat. Global lighting/exposure,
GBA materials, controls, geometry and artwork are unchanged. The movement
figure remains explicitly historical. No owner approval or deployment.

### Orientation-locked console movement, 2026-11-07

`docs/images/console-movement.png` is an actual Edge/Playwright capture from
`tests/browser/console-movement.spec.mjs`: the DS after pointer translation,
wheel depth and a completed drop, before its play/Inspect/table round trip.
Its quaternion matches the original desk orientation. No synthetic gameplay,
lighting changes or image compositing are added. The moved GBA, DS and phone
captures were visually reviewed; the README embeds and captions the DS.
This is unpublished local evidence, not owner approval or physical-phone
qualification. Existing historical media and the frozen book are unchanged.

### pear-boy local companion

`docs/images/pear-boy-table.png` and `docs/images/pear-boy-scared.png` are
actual Edge/Playwright captures from the local eight-case pear/lighting gate.
The longer rope limbs, pear silhouette, face, leaf and light are procedural
project geometry based on the owner's supplied character references; no
reference screenshot is pasted into the scene. The table capture shows both
separate consoles and the broader warm pool. The lifted capture shows the
actual scared face and hanging limbs.

These are unpublished local captures, not owner approval or physical-device
qualification. Historical GBA media and the frozen 96-page book remain
unchanged; earlier lamp-only figures do not include pear-boy.

### New local DS prototype, 2026-11-06

The README's `docs/images/ds-prototype-table.png` and
`docs/images/ds-prototype-playing.png` are actual Edge/Playwright captures of
the local separate-console scene and real Twin Lab emulation. They are not
renders composited with invented game screens. Optional Room lighting reveals
the original metallic teal/lime materials; the existing warm lamp naturally changes
their appearance. Those captures replaced the rejected first model with
the owner's #2A9D98/.80-metalness/.35-roughness specification, 110-degree hinge,
blue D-pad, lime controls and clipped stylus. That desktop table/runtime,
front/rear and 390px captures were reviewed together; this is not owner approval
or physical-phone qualification. No studio lighting or white backdrop was added.

`assets/ds-logo.png` is the latest owner-supplied BowserBOY DS Chrome Neon
Emblem, converted from its 2149x732 RGB black matte to transparent RGBA without
resizing, cropping or redrawing. Near-black noise is removed; glow colors are
unpremultiplied into partial alpha. Compositing over black reconstructs the
source within 6/255 per channel, and all four corners are fully transparent.
Dark/light composite previews were visually reviewed. It supersedes the
2151x731 Neon Orbital Logo, earlier Glowing BowserBOY DS logo and opaque emblem
for this prototype and appears on the tools/loading views and rear lid only.
The model follows the supplied DS concept references; Twin Lab's code/art are
original project fixtures. See [third-party notices](../THIRD_PARTY_NOTICES.md)
for provenance, emulator licensing and trademark boundaries.

These are unpublished working-tree captures. Historical GBA media and the
frozen book retain their earlier evidence epoch; older GBA-only images do not
show the new two-console scene.

Current publication: implementation `1b0385b384a1329fe643607c4874af88e5259001`,
successful Pages run42135170801. Actual GitHub homepage and immutable README
serve all20matching images, including all11GIFs. Independent public checks
match all30application assets; four live lamp/LED/native/fullscreen cases pass.
The following captures retain their original local-checkout provenance.

### Smaller green indicator and LCD-only reflections, 2026-11-06

This final edition supersedes both takes below. All **eleven interaction GIFs
and nine stills** were recorded again after the smaller LED, warmer fabric
and dark-adaptation correction. Capture: `2026-11-06T00:08:27.765Z`, parent
checkout `aa3be83512b01874ba2f706022e768dc63842c0e`; eleven complete clips,
zero page errors. The parent identifies the checkout, not the uncommitted
changes or a successful deployment.

The new `lcd-reflections.gif` uses real Inspect dragging with the lamp and
room lights off and the native LCD on. Its changing picture casts faint
moving light onto the controls, desk and cartridges. No synthetic framebuffer,
extra light, increased LCD intensity or capture-only exposure is used.
The first LED take exposed a real defect: existing night adaptation raises
exposure from .018 to .45 and bleached the indicator white. Compensating only
its emissive intensity preserves green without changing the room's exposure.
That rejected take remains private evidence, not the current README edition.

| GIF | Frames | Bytes |
|---|---:|---:|
| `pickup-inspect.gif` | 107 | 6,670,195 |
| `power-on.gif` | 46 | 1,283,752 |
| `cartridge.gif` | 27 | 1,953,355 |
| `cozy-lights.gif` | 103 | 4,534,543 |
| `lcd-reflections.gif` | 105 | 4,064,761 |
| `button-feedback.gif` | 33 | 1,690,351 |
| `play-zoom.gif` | 47 | 3,938,934 |
| `hold-space.gif` | 38 | 1,080,342 |
| `screen-fullscreen.gif` | 30 | 2,057,883 |
| `settings-backdrop.gif` | 17 | 681,077 |
| `movable-dock.gif` | 59 | 2,074,255 |

Encoding retains 800x618, 10 fps, 128-color Bayer, infinite looping and the
existing half-second trim. Every GIF animates and stays below 10 MiB.
Bounded contact sheets, all stills and two full-size dark-room poses were
reviewed; the night LED is visibly green and the surface illumination moves.
This is not exhaustive playback or user aesthetic approval. Original WebM,
timing, source hashes and final media hashes are retained privately.
The supplied ROM remains GIF-only; static game/settings stills use original
Pixel Lab. Both approved APNG logos and frozen v1.0.0 files are unchanged.

### Warm woven shade refresh, 2026-11-06

This edition supersedes the earlier plain-shade capture below. All ten
interaction GIFs and nine stills are captured again from the warm woven-shade
working tree, checkout baseline `aa3be83512b01874ba2f706022e768dc63842c0e`.
That identifies the parent checkout, not the uncommitted material changes
or a successful deployment. Receipt: `2026-11-05T23:52:39.478Z`, ten complete
clips and zero page errors. The procedural fabric is neutral white with
fine threads; the shade/bulb glow is warmer, without brown stains.

| GIF | Frames | Bytes |
|---|---:|---:|
| `pickup-inspect.gif` | 109 | 6,825,951 |
| `power-on.gif` | 44 | 1,326,241 |
| `cartridge.gif` | 27 | 2,014,591 |
| `cozy-lights.gif` | 125 | 4,789,224 |
| `button-feedback.gif` | 33 | 1,105,735 |
| `play-zoom.gif` | 48 | 2,772,116 |
| `hold-space.gif` | 38 | 1,244,723 |
| `screen-fullscreen.gif` | 30 | 1,272,262 |
| `settings-backdrop.gif` | 18 | 703,503 |
| `movable-dock.gif` | 68 | 2,600,479 |

Encoding retains800x618/10fps/128-color Bayer/infinite looping and the existing
half-second trim. All ten GIFs change and have differing decoded samples;
all stay below10MiB. Full-size rendered table and bounded middle-frame GIF/
still sheets are reviewed, not exhaustive playback or user acceptance.
The approved chrome/purple APNG logos are byte-identical. Original WebM,
timing, source hashes and per-media hashes are retained privately.
The same supplied-ROM GIF-only authorization and original Pixel Lab/no-ROM
static-capture boundaries remain. The frozen v1.0.0 package is not regenerated.

### Clean STORSEGEL-style lamp and complete refresh, 2026-11-06

All **ten interaction GIFs and nine companion stills** are freshly captured
from the local working tree based on `c3d9dbdcc41341d126720ee6a26db5b824c90b24`.
That commit identifies the checkout baseline, **not the uncommitted lamp
implementation or a new deployment**. The receipt is timestamped
`2026-11-05T22:54:01.973Z` (November 6, Asia/Kolkata); preview URL is
`http://127.0.0.1:5175/BowserBoyAdvance/`. Ten complete timing ranges and zero
page errors are recorded. Original WebM, timing/source-hash receipt and
encoded-media hashes are retained in session evidence, not the static site.

The new procedural lamp follows the IKEA STORSEGEL ash/white reference:
18 cm white open drum shade, approximately 30 cm overall height and three
splayed wooden legs. The fabric has no brown noise texture or hard diagonal
lighting seam. Soft light beneath the shade reveals the ash; no cable is
modeled. Manufacturer images are reference-only and are not redistributed.
The lighting clip now puts the handheld down, demonstrates the actual lamp
and independent room lighting, then picks it up again. Every capture includes
the current header without the removed top-right edition/battery label.

| GIF | Frames | Seconds | Bytes |
|---|---:|---:|---:|
| `pickup-inspect.gif` | 109 | 10.9 | 6,566,916 |
| `power-on.gif` | 44 | 4.4 | 1,367,678 |
| `cartridge.gif` | 28 | 2.8 | 2,039,745 |
| `cozy-lights.gif` | 117 | 11.7 | 4,421,475 |
| `button-feedback.gif` | 33 | 3.3 | 1,089,597 |
| `play-zoom.gif` | 47 | 4.7 | 2,745,352 |
| `hold-space.gif` | 38 | 3.8 | 1,345,106 |
| `screen-fullscreen.gif` | 30 | 3.0 | 1,173,067 |
| `settings-backdrop.gif` | 18 | 1.8 | 675,130 |
| `movable-dock.gif` | 66 | 6.6 | 2,420,112 |

Encoding calls only the existing `clips()` helper: 800x618, 10 fps,
128-color Bayer palette, infinite loop and the existing half-second end trim.
All ten files differ from their predecessors, have changing decoded samples,
and remain below 10 MiB. Middle-frame contact sheets and all nine stills are
visually reviewed, plus the full-size final table image. This is bounded
visual review, not exhaustive playback or user aesthetic approval.
Approved chrome shimmer and purple orbital **APNG logos stay byte-identical**;
they are not regenerated with the interaction GIFs.

The explicitly authorized supplied ROM remains **GIF footage only**, never a
correctness/performance/audio test fixture. Static game/settings captures
use original Pixel Lab; hardware-only stills use no cartridge. Capture,
encoding and silent GIFs are not new native-game or audio qualification.
README captions/cache keys, the guide and living architecture describe this
local edition. Older capture sections below remain historical.

The first public milestone remains **November 6, 2026 (Asia/Kolkata),
v1.0.0**. Its frozen ZIP/manifest/checksums are unchanged. No commit, push,
tag, GitHub Release or new deployment is performed for this lamp update.

### Movable dock and inspection branding, 2026-11-06

Source `6fb18906811c2a73301badf8e666061f9304d211` is filmed locally at
`http://127.0.0.1:5175/BowserBoyAdvance/`; receipt timestamp
`2026-11-05T18:51:21.318Z` (November 6 locally). No ROM is loaded or executed.
This supplements, rather than relabels, the preceding complete-refresh edition.

`movable-dock.gif` shows actual pointer dragging, collapse, dragging the small
pill elsewhere, expansion with boundary fitting, and keyboard Home reset.
It is 71 frames/7.1 seconds/1,770,317 bytes. The replaced `pickup-inspect.gif`
now shows the purple animated inspection header: 124 frames/12.4 seconds/
7,045,470 bytes. Both retain 800x618, 10 fps and infinite loops; decoded
sampled frames change and both remain below 10 MiB. First/middle/end encoded
frames and the actual centered-settings image are reviewed.

Five affected stills are refreshed: table, front, rear, underside and dock.
Other clips/stills retain their individually documented earlier source edition.
The approved 1080x420, 72-frame, 8,969,021-byte purple APNG is **not regenerated**:
the static build explicitly copies its exact existing README bytes to
`assets/inspection-logo.png`. Only Inspect shows it; table chrome and hidden
play branding remain distinct. Reduced motion uses original static purple
artwork. Native browser animation requires no additional scene/render loop.

The existing full capture script now includes a `movable-dock` shot. This
bounded two-clip take uses the same actual controls and unchanged `clips()`
encoder, with its source WebM/timing receipt retained in session evidence.
It is not supplied-game testing, new audio/performance qualification or
human visual approval. The user explicitly requests monitored deployment for
this release, superseding the earlier temporary no-monitoring handoff.

### Complete README refresh, 2026-11-05

All five existing interaction GIFs are freshly recorded, with four new clips
for ordinary play zoom, hold-Space fast-forward, screen-only fullscreen zoom
and clicking outside settings. Every embedded non-logo still is refreshed;
the companion front/fullscreen stills are refreshed too. Approved three-second
umbrella shimmer and purple console animation remain byte-identical.

These are **local build captures**, not a claim about the deployed site.
The application source is `82834df242aa7f0cec6cfa634e0966e7a3a500ec`,
served at `http://127.0.0.1:5175/BowserBoyAdvance/`; the final recording receipt
is timestamped `2026-11-05T18:21:46.643Z`. The revised existing capture script
records real pickup, inspection, physical power, insertion, lighting, keyboard,
zoom, fullscreen, settings and save actions. The receipt has nine complete
timing ranges and zero page errors. Insertion holds the real loader download
for the seating shot; this is not a loading-performance measurement.

The explicitly authorized supplied ROM is used **only for GIF footage**.
It is not a test fixture, and no game correctness, audio or speed measurement
is performed with it. Static settings/game stills use original Pixel Lab;
hardware-only stills use no cartridge. The main README names neither the game
nor its box art and does not embed the box art. The game's own title screen
may appear naturally inside recorded GIF footage. Test fixtures remain unchanged.
The final button clip shows A/B and D-pad presses; the supplied game's shoulder
actions open an in-game help screen, so that unrelated screen is not carried
into the zoom/fullscreen showcase.

The encoder reuses `clips()` in `scripts/render-readme.py`, without regenerating
either approved logo. All nine GIFs are 800x618, 10 fps and infinite loops.
Frame counts are 105/44/27/58/33/47/37/30/18 for pickup/startup/insertion/lights/
buttons/play zoom/hold Space/fullscreen/settings, respectively. Their largest
file is 6,844,427 bytes; all are below 10 MiB. Sampled decoded frames change.
Bounded first/middle/end sheets, all refreshed stills and an LCD-only interval
are reviewed. GIF palette/video compression can obscure very faint dark detail;
silent recordings are not new audio-quality or human-acceptance evidence.

Reproduce with a built current checkout and an already-running local preview:

```powershell
$env:BBA_CAPTURE_URL = 'http://127.0.0.1:5175/BowserBoyAdvance/'
# Optional, explicitly authorized media-only ROM; never a test-suite input.
$env:BBA_CAPTURE_ROM = (Resolve-Path '.\assets\demos\celias-game\celias-game.gba').Path
node .\scripts\capture-readme.mjs <capture-output-directory>
```

Omit `BBA_CAPTURE_ROM` to use only original Pixel Lab. The original WebM and
timing/encoding receipts stay in session evidence, not the public static build.
README URLs are versioned for the new captures. Historical source editions
below remain history; shared `readme-*` figures belonged to this edition at
that milestone. Later replacements are identified above.
Per user instruction, publication is triggered by the genuine media push
without watching/querying pipelines or performing public qualification.

### Three-second README shimmer, 2026-11-05

The README umbrella shimmer now repeats every three seconds instead of six.
Only the initial resting interval changes, from 3900 ms to 900 ms. The same
1.8-second left-to-right sweep, final 300 ms rest, supplied updated artwork,
white highlight, transparency and individual frame pixels remain unchanged.
The website's separate CSS shimmer is not changed by this README-only request.
The README image URL has a new version query to avoid retaining an older cached
animation. Generate only this asset with
`python scripts\render-readme.py --shimmer-logo`.

Published source `24910fda7543124a44515e4e6c5bd468f3eec7c5`: the
1168x456 APNG retains all 29 encoded frames and 4,745,072 bytes. Decoded
pixel hashes of every frame equal the earlier animation; the total duration
is exactly 3000 ms, looping indefinitely. The actual public asset matches
SHA-256 `5a9d4dbca772e0867a612c5ce8ea424ff389558df7d0d6357baa1057237604c6`,
animates natively in Edge, and is referenced by the versioned public README.

### Supplied Celia demo and box art, 2026-11-05

The user authorized publishing the supplied ROM and box art and confirmed the
ROM is fully original or licensed for public redistribution. Exact originals,
credits, byte counts and SHA-256 identities are recorded in the
[demo directory](../assets/demos/celias-game/README.md). The supplied PNG is not a generated or recolored derivative. The initial main
README feature was subsequently removed at the user's request; assets and
credits remain in the demo directory, not as a named front-page showcase.

The ROM is authorized for demo GIFs, README media and showcases only, not tests
unless explicitly requested. It is not executed during this upload, not a
replacement for Pixel Lab fixtures, and not automatically loaded by the player.
At upload time, no existing gameplay GIF was replaced. The complete README
refresh above subsequently uses it only for authorized GIF footage.
Publication permission is the user's confirmation, not an independent rights audit.

### Updated-logo README shimmer, 2026-11-05

The umbrella README image now uses `bowserboy-logo-shimmer.png`, replacing the
static glow. Its source is the **new** 2148x732 chrome orbit/sparkle artwork
whose SHA-256 is recorded below, not the previous logo or white-glow derivative.
The source is resized once to1080pxwide; its supplied shapes/colors are retained.

Run `python scripts\render-readme.py --shimmer-logo` to generate only this APNG.
It mirrors the website's six-second cycle and1.8-second left-to-right sweep:
1.7xbrightening, neutral white localized halo and the300%-wide feathered mask.
Resting frames are exactly the padded, resized source, with no permanent halo.
GitHub READMEs cannot run the website CSS, so the effect is baked into the image.

The transparent1168x456APNG is4,745,072bytes,29encoded frames/6000mstotal/loop0.
Identical rest frames are combined without changing timing; active samples
remain50ms. All27changed-frame bounds advance left to right; original rest
pixels and transparent corners pass exact checks. A bounded resting/left/right
light/dark sheet is reviewed, not every animation frame. Original website/CSS,
purple console PNG/GIF/APNG and all gameplay captures remain unchanged.

Published source `f966ff7944e2c6827224aee553250e7325091e63`: all8changed public
files match their exact committed blobs. The actual GitHub README preserves all
15visible image references and console navigation, decodes the updated1168x456
umbrella and shows native APNG motion. Actual public logo samples are reviewed;
the exact published raw asset also animates in native Edge. Initial gateway/
incomplete-image observations are not substituted for the final successful check.

### White umbrella README glow, 2026-11-05

The intermediate BowserBOY README halo used neutral white (RGB255,255,255), superseding
the silver-blue halo below. Only the umbrella color in `glowing_logos()` and
its PNG derivative change: 2320x904 RGBA, 1,452,868 bytes. All264,139visible
halo-only pixels are white; opaque supplied foreground pixels remain exact.
Transparent corners are retained. The bounded light/dark sheet is reviewed.
Website PNG/CSS, purple console PNG/APNG and gameplay media remain unchanged.

### Updated chrome orbit and sparkle logo, 2026-11-05

The user's replacement BowserBOY artwork is copied byte-for-byte to
`assets/website-logo.png`: 2148x732 RGBA, 1,566,452 bytes, SHA-256
`5e8ed0b2a4edb5f4bf43dc28b4757fc8206df395385e16af4235467998a31300`.
It supersedes the earlier chrome source documented below, not the purple GBA
console artwork. Website header and both panels use the new source with matching
intrinsic dimensions; existing CSS glow/shimmer follows its alpha unchanged.

Only the umbrella README glow is regenerated through the existing `logo_glow`
helper: 2320x904 RGBA, 1,491,439 bytes, unchanged opaque foreground pixels,
transparent corners and a silver-blue halo. The light/dark contact sheet and
actual browser header crops are reviewed separately from older gameplay media.
The purple animated README banner and all existing recordings remain unchanged.
Historical capture/source receipts below retain their original identities.

### README logo glows, 2026-11-05

The two standalone README logos now use transparent, padded derivatives:
`bowserboy-logo-glow.png` adds a silver-blue halo to the original chrome asset;
`bowserboyadvanced-logo-glow.png` adds violet glow to the existing orbital banner.
Original source artwork and the historical `orbital-logo.gif` remain unchanged.
The website's own logos and every gameplay recording remain unchanged.

Run `python scripts\render-readme.py --glow-logos` to generate only these files.
Two Gaussian-blurred alpha masks sit behind the original foreground, retaining
opaque ink colors. The console derivative is a full-alpha animated PNG: GIF
cannot represent the partial opacity needed for a smooth halo on both themes.
It retains all 72 original frames, 70ms timing, 5.04s cycle and infinite loop.
The two files are 1,391,871 and 8,969,021 bytes, each below 10MiB.

All-frame numeric ink/timing/transparency checks pass. Only a bounded first-frame
light/dark sheet is visually reviewed locally; this is not a full-animation
review or fresh application/audio qualification.

Published source `cb9ed05903472a83957e6df374bc622fc067473f`: actual GitHub
rendering retains all 15 visible image references, console navigation and
showcase hierarchy. Both new logos decode; two actual console-logo captures
210ms apart differ, confirming native APNG animation. Actual public chrome and
console crops are reviewed. Original artwork and gameplay captures stay exact.

### Console-scoped README, 2026-11-05

The front page now separates the chrome BowserBOY umbrella project from its
supported consoles. BowserBOYADVANCED is the only implemented console; its own
section reuses the original purple `orbital-logo.gif` banner and retains all
14 earlier image embeds, including the five actual interaction GIFs.
The existing 72-frame banner is not regenerated or re-recorded; source review
uses only its first frame. Actual GitHub umbrella and console-banner crops are
also reviewed. Gameplay captures below it keep the source and timestamps recorded
below. Additional consoles remain future direction.

Published source `cfd7e1fa713a2ee9d2e13abe75573ac13146e976`: actual GitHub
rendering has the supported-console jump,13nested feature sections and15visible
image embeds, including every earlier reference in order. GitHub's six hidden
GIF copies are not extra showcase media. Only the two logo images are decoded
for this layout change; the unchanged gameplay media is not re-reviewed.

### BowserBOY public refresh, 2026-11-05

The current README's five interaction GIFs and dedicated table, front, rear,
notice, underside, fullscreen, dock and save-panel stills are actual captures
from **https://zanark.github.io/BowserBoyAdvance/** at
2026-11-05T12:09:57.438Z. All 29 independently fetched public application assets
match qualified source `f5bc63933a88040c46879645e91a107fbe930df5`.
The local capture checkout is documentation-only `9140b53`; it is not used as
a substitute for that public-source comparison.

The footage now includes the chrome BowserBOY website header, unchanged purple
GBA startup/rear artwork, original soft A/B contours, metallic-chroma bezel and
larger etched rear logo. More consoles are not shown or implemented. The main
README remains image/GIF-led with short captions; detailed naming and save
boundaries belong in the guide, architecture and saving reference.

The [later deeper rear engraving](VERIFICATION.md#deeper-rear-engraving-2026-11-05)
postdates these captures. Its actual matched straight/angled comparisons and
tilted public rear were separately reviewed; existing images retain their
original size/depth and provenance, with captions identifying the earlier view.

The unchanged `capture-readme.mjs` uses a fresh browser context, the original
Pixel Lab demo and actual input/pickup/Inspect/light/power/fullscreen/save
actions. The receipt contains five complete timing ranges and zero page errors.
Insertion deliberately holds the real loader download during its seating
animation, so it is not a performance measurement. No private ROM, recording
or unsupplied artwork is used. Silent GIFs are not new audio-quality evidence.

Only the existing `clips()` encoder is called: 1100x850 original recording,
800x618 GIFs at 10 fps. The `banner()` generator is not called; the supplied chrome lead logo stays
byte-identical and the old purple orbital banner remains a historical asset.
Current dedicated stills use `readme-*` names; historical `3d-*`, original book
figures and older qualification images are not overwritten or relabeled.
The previous local media edition and release records below remain history.
Encoded loops contain 107/44/29/52/51 frames (pickup/startup/insertion/lights/
button feedback), respectively; the largest is 6,663,993 bytes. All loop at the
intended size with changing sampled frames. Bounded first/middle/end and
eight-still contact sheets are reviewed, plus an actual LCD-only dark interval.
The 14 README embeds decode and all local Markdown links/anchors across the
19 public Markdown documents resolve. These checks do not imply human approval.

Published as `c7fb6828262f176ca61eebfae18be81453cdb25e`: all 25 changed
documents/media/tracking files independently match their committed Git blobs.
GitHub's actual rendered README includes all 14 expected image embeds and the
updated navigation. The first receipt attempt compared CRLF working-tree text
with LF publication bytes; comparing exact committed blobs corrected that
verification input without normalizing or relaxing the public-byte check.

### Current refresh - recessed controls and smaller bezel

**Previous local media edition.** These origins describe the earlier images
at their historical revision, not the current public captures above.

The five interaction GIFs and new `readme-notice`, `readme-underside`,
`readme-fullscreen`, `readme-dock` and `readme-saves` PNGs are actual **local
build captures** of application source
`8a1d6a340f6f14aaac6530a1bc0d9ab9d8706995`, served at
`http://127.0.0.1:5175/BowserBoyAdvance/`. They show the softer actual recessed
A/B letters, stronger physical presses, further-reduced shared bezel artwork,
hidden play header, unchanged close framing with overlay notices, and current
progress/export UI. Local capture does not establish a deployed release;
[verification](VERIFICATION.md) owns hosted and independent public status.

The existing capture/encoder is reused. Actual keyboard input drives A, B,
diagonal D-pad and both shoulders; no fabricated button pose or frame
interpolation is used. Underside inspection uses Home and seven ArrowUp presses.
The dock and progress stills crop real UI; the progress view follows an actual
Pixel Lab checkpoint save. Fullscreen shows the native original demo, complete
3:2 picture and shared smaller wordmark. Only original Pixel Lab is recorded.
Insertion deliberately holds its real loader download during seating, so the
clip is not a loading-performance measurement. Silent GIFs do not demonstrate
audio quality; the reserve improvement has separate runtime evidence.

The receipt identifies source checkout, exact local URL, timestamps, clip
boundaries and zero page errors. A checkout ID alone is not remote identity.
Edge records 1100x850; the unchanged clip encoder outputs 800x618 at 10 fps.
The transparent banner and supplied logo are unchanged. Historical technical
stills used by the guide/book remain intact; the new README-specific stills
do not overwrite those evidence images. The unchanged nine-CRT-menu figure
retains its earlier provenance below.

Encoded loops contain 101/44/27/62/51 frames (pickup/startup/insertion/lights/
button feedback), respectively; the largest is 6,030,797 bytes. Bounded
beginning/middle/end contact sheets and the five new stills are reviewed,
with an additional actual LCD-only frame confirming the dark-room interval.
GIF dimensions, looping, non-static sampled pixels, receipt and README local
targets pass. This is technical/visual review, not user aesthetic approval.

**Publication and release:** the README and all 12 referenced image blobs
exactly match published `f00f529`; the actual GitHub README render retains all
12 described embeds and the new controls/progress sections. Fresh normal
`41984863317` passes build, 11 units, all 39 browser cases and deployment.
All 28 actual public app assets independently match; three complete public
branding/response/native-input cases pass 52.2s. This establishes application
delivery, not a different origin for the locally captured media above.

The subsequent runtime-only borderless-bezel refinement `5b53c88` passes fresh
normal `41992917534` (build, 11 units, all 39 browser cases, deployment), exact
28-public-asset matching and the complete actual public branding/fullscreen
identity case (16.4s). It removes the remaining exterior light contour, not
the letters or other logos. These README recordings remain the earlier
`8a1d6a3` media edition; do not relabel them as borderless-release footage.

The subsequent rounded/heavier A/B contour refinement also postdates these
recordings. Existing GIFs/stills retain their source edition; current shape
qualification belongs to the [verification record](VERIFICATION.md#rounded-heavier-ab-grooves-2026-11-05).

The later [original A/B typography](VERIFICATION.md#original-soft-ab-typography-2026-11-05)
also postdates these recordings. The user's supplied reference and private
comparison sheets are not project-authored public media and are not published.

The later [metallic chroma lettering](VERIFICATION.md#metallic-chroma-lettering-2026-11-05)
also postdates these recordings and the historical monochrome guide/book figures.
Bounded actual rendering comparisons qualify that text-only finish; existing
GIFs and images retain their original capture identities. Source `ad259c3` /
Pages `42013383789` passes the full gate;28actual public assets match and two
public cases pass62.2s. Its actual public lamp-lit text crop is separately
inspected, not substituted into earlier GIFs or figures.

### Website identity - chrome BowserBOY

The supplied2151x731chrome sparkle PNG is preserved byte-for-byte as
`assets/website-logo.png` and becomes the website/README identity. Its SHA-256
is`804b1a96494dbecc9fa732e2772e8f2d23c9eb21bcd8286d9dc00b1fbf46c808`.
The original purple2170x725`assets/logo.png` stays with the GBA console, now
named BowserBOY ADVANCED by the user; no existing console artwork is regenerated.
Older captures and the preserved orbital banner GIF show the previous website
identity. They are historical footage, not chrome-header captures.
Actual local desktop/mobile header crops are reviewed separately; that is not
a recapture of existing GIFs or proof of public deployment.
Subsequent source`f5bc639` / Pages`42022953048`passes the full41-case gate,
with29exact public assets and three actual public branding/header cases42.1s.
Separate actual public desktop/320px header crops are inspected. Older footage
is still not relabeled as this later website identity.

### Current refresh - manufactured controls and glass

The later [larger etched rear logo](VERIFICATION.md#larger-etched-rear-logo-2026-11-05)
also postdates the existing rear-view images. Its actual old/new comparison uses
the same pickup/Inspect/drag gesture, with no fabricated pose or private ROM.
The supplied art is unchanged; historical figures are not overwritten or
relabeled as this new geometry.
Source `a7a07fc` / Pages `42018059319` passes the full40-case gate.
All28public assets match; the actual public branding case passes16.0s.
A separate actual public rear crop is reviewed with the same inspection
gesture, preserving the original purple/white artwork and bright material.

**Previous edition:** retained for its historical evidence and existing links.
The current README media bytes are identified in the newer section above.

The four interaction GIFs and the underside, fullscreen, dock and
3D-pose figures now show qualified application source
`ab912d51ecc615f7aa55a4d27f6a876673739cdf`. They are **actual local-build
captures**, not captures of a newly deployed public release. The browser served
the same built application under `http://127.0.0.1:5175/BowserBoyAdvance/`.
At capture, normal Pages run `41875740589` had passed build, 11 units and all
39 browser cases, but deployment remained pending. The separate
[verification record](VERIFICATION.md#frosted-notifications-and-clear-handheld)
owns production status. Do not infer publication from these figures.

**Subsequent production qualification:** Pages `41875740589` succeeds.
Independent verification matches all 28 public assets to `ab912d5`; five
actual public cases pass in 2.0m, including native clock/speed, slots/autosave/
restart/fullscreen, notice clearance, mapped input/LCD light and real pinch.
The notice figure is then replaced with an actual public capture; desktop
and phone public notices are reviewed with zero page errors. The LCD-light
and power-off figures also come from the new public native-input regression.
The interaction GIFs and other local captures retain their original local
provenance; release success does not retroactively change capture location.

The existing capture/encoder is reused, calling only its clip encoder to
preserve the transparent banner byte-for-byte. Edge records at 1100x850;
GIFs are 800x618 at 10 fps. The four outputs contain 109/44/27/51 frames
(pickup/startup/insertion/lights), respectively; the largest is 6,378,084 bytes.
Capture receipts report no page errors. Reviewed beginning/middle/end encoded
frames, the actual back capture and an additional lights-off frame establish
the demonstrated actions. Fullscreen, underside and actual desktop/phone notice
captures are also visually inspected.

The notice is the real no-cartridge power-on message, not synthetic product UI.
The underside detail sets the actual model's inspection rotation to reveal the
switch; it does not fabricate geometry or change application source. Fullscreen
uses the native original Pixel Lab output and the shared star-free bezel.
Insertion still deliberately holds the real loader download during its actual
animation; these timings are not performance measurements.

This refresh replaces the previously historical interaction/fullscreen figures.
The historical provenance below remains a record of earlier media editions,
not the source identity of today's replacement bytes. The unchanged nine-CRT
menu figure retains its earlier cited origin; its options remain current.

### Retained public and historical evidence

`images/molded-controls.png` remains an actual public room-lit, slightly
tilted capture from `7843db880a52539d6e2050f79070f5829947a393`, after normal
Pages `41867840972`, the full 39-case gate, independent 28-asset match and four
actual public cases pass. The LCD-light/power-off figures are also refreshed
by the actual public mapped-input regression. Desktop, phone and relief
captures are reviewed; zero page errors. This is browser evidence, not a mockup
or human aesthetic approval. The older plain-font fullscreen edition has now
been replaced by the locally captured shared stylized texture described above.

- `images/orbital-logo.gif` animates the supplied transparent purple logo and the
  supplied sparkle, glow and orbit effects on a transparent background, without
  a purple rectangular backdrop or background starfield. GIF supports binary transparency, so soft
  alpha edges are thresholded for encoding; the supplied source remains unchanged.
  Its elliptical star motion is an original README presentation, not a recording
  of the LCD boot. The separate power-on GIF retains the actual purple LCD scene.
- The other GIFs are actual recordings of the application, captured
  with Playwright/Edge at 1100 by 850 and encoded at 800 by 618, 10 fps.
  Pickup/inspection, power-on, physical insertion and lighting use actual UI
  actions, not rendered mockups or artificial interpolation. Trailing idle holds
  are trimmed; clip timings are not performance metrics.
- Insertion deliberately holds the native loader download until the cartridge
  seats, making the real download-phase motion visible. It is not a measurement
  of normal network loading time.
- Only the original Pixel Lab cartridge is used. No commercial ROMs, gameplay,
  private browser state or recordings are included.
- GIFs are silent and loop. Their captions and alt text describe the motion.
  GitHub's image player and animation preferences control presentation;
  static alternatives are available in the [player guide](GUIDE.md).
- Documentation images are not part of the static application's build allowlist.

Earlier versions of all four interaction GIFs, and the startup/pose/dock figures, were
refreshed from deployed source `807da8ef42594d3e0b2f8b788f66bed894483d21`,
after independently matching all 28 public assets and passing five actual
production cases. The new footage shows monochrome bezel print, raised ZANARK
lettering, header notices, distinct icons and the sharp waving startup.
Sampled encoded beginning/middle/end frames were reviewed: pickup reaches the
back and returns, boot ends on the idle LCD rather than the next drawer action,
the original cartridge visibly seats, and independent lights actually change.
No retiming or commercial game footage is used. The existing transparent logo
banner is unchanged.
The updated README banner and power-on embeds use media-revision query
parameters so replacements have distinct image URLs without duplicating assets.

The fullscreen figure was subsequently refreshed from actual deployed source
`faece42da7563a74d39e1513ebeb7be543300ec0`, after the complete 38-case release
gate, independent 28-asset match and four real public-browser cases passed.
It shows the complete native framebuffer, proportional CSS bezel and bottom-right
50-100% zoom. Actual pixels are checked before/after real input; this is not
a second emulator or another rendering of the 3D room. The capture was reviewed.
Only this affected figure changed; the interaction GIFs above remain unchanged.

The underside detail and affected desktop/mobile, native-settings and
LCD-light/power-off figures were subsequently refreshed from actual public
source `ba49d559688713d485d2c27b593faed9692913ae`, after fresh Pages
`41853556614` passed build, 11 units, all 39 browser cases and deployment,
and all 28 exact public assets independently matched. Seven public cases
passed in the first batch; its lighting fixture clicked before scene readiness.
After correcting that setup, the actual public lighting case passed in 29.0s.
The underside detail uses actual Inspect/keyboard tilt and Room lights to
show the complete physical assembly on the lower shell edge. It and the five
refreshed figures were reviewed. Both actual native insertion cases also
verify that the newly protruding cap clears the tabletop while lowered.
At that milestone the interaction GIFs still predated the relocation. The
explicit README refresh below subsequently replaces all four and the dock;
earlier static startup/pose figures retain their original provenance.

## Current README refresh

The four interaction GIFs now show the actual current public application,
including the underside power assembly, rather than the earlier front switch.
The original recording and timing receipt were captured on 2026-11-04 at
15:26:45 UTC from the public URL. Application bytes correspond to the verified
`ba49d559688713d485d2c27b593faed9692913ae` release above; subsequent
documentation/test-fixture-only source `6580a34` leaves those bytes unchanged.
The original Pixel Lab is the only cartridge, and the capture reports zero
page errors.

The new encoded clips contain 109 pickup/inspection frames, 44 power-on frames,
27 insertion frames and 54 lighting frames at 10 fps. Largest output is
5.19 MiB; every GIF remains below 10 MiB. Sampled beginning/middle/end frames
were reviewed, with additional rear-hold and lights-off samples where the
midpoint alone was ambiguous. Inspection visibly reaches the battery cover
and returns; boot ends at the idle LCD, insertion seats, and lights switch
independently. Clip timings are still not performance measurements.

The new `crt-presets.png` captures the actual open host selector: all nine
native presets, Unfiltered and selected CRT Geom. `quick-controls.png` is a
fresh actual live dock capture. The README also reuses the already-reviewed
actual underside detail and complete fullscreen/zoom figure described above.
The transparent animated banner is deliberately unchanged. Media-revision
URLs refresh the replaced embeds; detailed prose stays in linked guides.

## Complete effects, not logo fragments

The earlier moving star was cropped from the logo, leaving neighboring orbit
segments and hard-cut arms. Its replacement comes from the user's **Purple Neon
Sparkle and Orbital Sprite Sheet**, supplied on 2026-11-04: 2172x724 RGBA,
SHA-256 `1233f8ee8981b4e85869f672e2361b9c80f39b34762d70730174a11da4c67542`.

| Output | Source rectangle, exclusive right/bottom | Transparent output |
|---|---|---|
| `assets/star.png` | `(690,100)-(875,302)` | 256x256 |
| `assets/glow.png` | `(1640,138)-(1768,267)` | 160x160 |
| `assets/orbit.png` | `(0,512)-(640,724)` | 660x240 |

`scripts/extract-orbital-sprites.py` removes only near-invisible alpha<=1 noise,
rejects crops touching visible content, preserves the remaining colors/alpha,
and centers each complete effect with transparent padding. The supplied source
and logo stay unchanged. Natural passing behind the wordmark is intentional
occlusion, not a crop cutoff.

The LCD orbit is inset far enough to contain every rotated sparkle throughout
the reveal. Browser checks cover the full 3200ms animation at 100ms steps,
transparent sprite margins and the unchanged static reduced-motion presentation.
Every encoded README banner frame also clears an 8px outer canvas margin.
The centered banner artwork is 620px wide inside a 960px outer orbit on the
1000x340 canvas. The LCD uses 160px artwork inside a 226px ring. This leaves
clear breathing room instead of stretching the wordmark against the orbit.
Browser checks also retain centered placement and logo width below 75% of the
ring throughout the startup reveal.

## Reproduce

The existing Node dependencies provide Playwright. Install Edge, Python with
Pillow, and FFmpeg for this optional documentation workflow; these are not
requirements for playing or building the website.

From the repository root, provide your own scratch output directory:

```powershell
python scripts\extract-orbital-sprites.py "C:\art\Purple Neon Sparkle and Orbital Sprite Sheet.png"
node scripts\capture-readme.mjs C:\scratch\bba-readme
python scripts\render-readme.py --capture C:\scratch\bba-readme\capture.json --ffmpeg C:\tools\ffmpeg.exe
```

Use the actual supplied sheet and FFmpeg executable paths on your machine.
Set `BBA_CAPTURE_URL` to record a different running build, or `BROWSER_CHANNEL` to select an installed
Playwright browser channel. The default capture URL is the public website.
The capture writes an original WebM and a receipt of clip timings; the encoder
writes the five GIFs to `docs\images`. The capture also saves table/play/rear
pose PNGs in the scratch output directory. Running only
`python scripts\render-readme.py` regenerates the logo banner without FFmpeg.

Review the encoded motion before replacing public assets. A successful encoder
or a single thumbnail alone does not establish that the action is visible.
Original capture videos and timing receipts remain local working artifacts;
only the reviewed GIFs are published.
