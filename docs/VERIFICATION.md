# BowserBOY verification scope

The prototype has separate evidence layers. Test coverage alone is neither
human acceptance nor deployment; the actual release evidence is recorded below.

The [engineering book](../book/README.md) explains the mechanisms and failure
lessons. Its source edition and local preview media do not replace this release
record or constitute fresh execution of historical tests.

## Movable dock and inspection branding, 2026-11-06

The dock has a dedicated pointer/touch grip, collapse/expand, keyboard arrows
(Shift for larger steps), Home reset, and Escape drag cancellation ahead of the
existing capture-phase menu handler. Expansion/resize/fullscreen changes keep
it in bounds; actions and the skip link retain access. State is page-local.
Phone controls remain 44px, with two rows at390px and three at320px; settled
physical-power targets remain above the default dock.

Inspect uses the unchanged approved purple 72-frame APNG with orbiting stars.
Actual browser screenshots change across280ms; reduced-motion static-purple
screenshots remain identical. Table chrome, hidden play branding and phone fit
are checked. The settings logo is centered within one physical pixel, allowing
the asymmetric drawer border. Seven affected browser cases pass across focused
runs; the drag/reset case repeats twice after synchronizing the drawer-close
focus lifecycle. Syntax/build/all12units pass.

Actual local source `6fb1890` is filmed with no ROM loaded. Two encoded GIFs and
five affected stills are refreshed; bounded encoded frames and the centered
drawer are reviewed. This is not an audio/performance or human-approval claim.
The user explicitly resumes monitoring/fixing this deployment. The normal
source push will trigger its unchanged full gate; live qualification is pending.

## Complete README refresh, 2026-11-05

Nine interaction GIFs and nine stills are refreshed from local application
`82834df`, including new ordinary zoom, hold-Space, fullscreen zoom and
settings-backdrop footage. All nine GIFs decode, loop indefinitely, have
changing sampled frames and are below 10 MiB. Bounded first/middle/end sheets,
all refreshed stills and an LCD-only interval are reviewed. Existing approved
logo animations remain byte-identical.

A local Edge preview of GFM-rendered current Markdown decodes all 18 embeds,
checks 30 relative references/anchors and verifies console navigation and
390px responsive width. This preview supplies normal heading IDs and basic
styling; it is not the actual GitHub webpage. All 28 standard build assets
match working source bytes and source `82834df` (normalizing only Windows text
newlines for the committed-source comparison). Capture-script syntax and
whitespace checks pass. No application behavior changes in this workstream.

The supplied ROM is executed only for authorized GIF filming, not correctness,
audio or speed tests. Static game/settings captures use original Pixel Lab.
GIF/video compression may hide extremely faint light spill; silent GIFs are
not audio-quality evidence. Provenance and reproduction are in
[Media](MEDIA.md#complete-readme-refresh-2026-11-05).

The genuine source push is the normal publication trigger. At the user's
request, no pipeline is queried/watched and no public qualification is run.
This local refresh does not establish a successful deployment or human approval.

## Ordinary play zoom baseline, 2026-11-05

Ordinary play now starts at 50% with the previous fitted camera position.
Increasing to 100% halves that camera distance rather than stopping at the
previous framing. Inspection and screen-only fullscreen keep their independent
settings; higher ordinary zoom may intentionally crop the handheld.

The revised existing regression rejects the original 100% default. Desktop,
landscape and phone cases verify the 50% fit, larger 100% picture, keyboard
steps, session retention through inspection/table/fullscreen, native runtime
identity and continued input. It and backdrop dismissal pass 2/2 in 24.8s;
syntax/build/all 12 units pass. Actual desktop/phone 100% captures are reviewed.
Only original Pixel Lab is used. Deployment monitoring and public qualification
are delegated to the user until explicitly requested again.

## Settings drawer backdrop dismissal, 2026-11-05

The blurred backdrop now closes the cartridge/settings drawer only when the
same pointer starts and clicks outside its bounds. Inside padding, settings
interactions and drags starting inside do not close it. Existing close handling
still clears remapping, relocates notices and returns focus to the console.

The regression fails on the original outside-click behavior. Final desktop and
landscape checks pass in 6.9s, covering inside clicks, volume interaction, drag
protection, backdrop dismissal, focus and unchanged X/Escape paths. Syntax,
build and all 12 units pass. No ROM or native advanced-settings change.
Normal publication is pending; local verification is not a live-site claim.

## LCD light balance correction, 2026-11-05

The public lighting source still used the old 120-intensity forward light
without experimental control spill when the user reported black controls and
an overbright desk. Workstream 65 reduces forward gain to 12 and makes the
isolated control fill sublinear (`peak ** .25 * .1`), with no black-level
floor or full-white increase. Materials, room lights and framebuffer sampling
remain unchanged. This supersedes workstream 60's unchanged-table balance.

The darker-picture baseline fails with a black D-pad. An initial square-root
fill at .16 fails the full-white control ceiling; the final .1 maximum retains
that ceiling. Actual full-white control maxima are about 5.5-25/255; a
25%-gray picture gives about 2-11/255. The white-picture desk probe falls from
215.4 to 73.67/255, with no measurable contribution from the control fill.
Red/blue transfer and black/power-off darkness remain covered.

The old native lifecycle case expected the mostly-black Pixel Lab picture
to visibly light the desk and fails at the new gain. It now checks that this
picture stays dark, then retains the real GPU table-light and rotated-away
directionality checks using the same brighter paused-native framebuffer.
The first revision incorrectly compared rotated brightness against the earlier
black-picture reading; comparison now uses the matching bright-frame reading.
No light/directionality assertion is removed.

Syntax/build/all 12 units and the spill, pressed-cap and native-lifecycle
browser cases pass 3/3 in 48.4s. Actual controlled dim-play and white-Inspect
captures are reviewed; canonical public figures are restored afterward.
The supplied ROM is not executed. Human aesthetic approval and publication
remain separate.

Source `09d84136ff4a1ff204ca37e5cfdb086dceb8d33e` is pushed. Normal Pages
run `42077309344` passes build/units and shards 1/2. Shard 3's existing
desktop cartridge-insertion case still reports `inserting` rather than
`seated` after its 15-second assertion wait. The new lighting and pressed-cap
cases pass. The 600-second suite limit then leaves five cases not run,
including the interrupted native lifecycle case: 10 pass, 1 fails, 5 not run.
The insertion delay's root cause is not established. Deployment is skipped,
so no independent public asset/browser qualification runs. No retries,
dummy triggers, denied dispatches or gate changes follow.

## Chip-style startup sound, 2026-11-05

The original rising melody and startup cue now use square waves, short
separated opening notes and an eight-level decay. Actual rendered PCM verifies
the pulse-wave third harmonic, note separation, bounded peak, half-volume
amplitude, zero/mute short-circuit, silent tail and audio-context cleanup.
The original sine source fails the new regression. Actual physical pickup/
power-on reaches the new sound and finishes startup without a cartridge.

Syntax/build/all 12 units and the new chime plus existing audio protection/
startup-artwork cases pass 3/3 in 13.2s. An initial missing-pickup fixture
timeout is corrected through the real UI, not forced clicks or product changes.
No supplied ROM is executed. These checks are numerical/behavioral evidence,
not direct listening or human approval. Public startup qualification is pending.
Feature `e1f61ab` is pushed with source
`24910fda7543124a44515e4e6c5bd468f3eec7c5`; normal Pages run `42074785914`
is cancelled with no jobs in the saved run response. Its cancellation cause
is not established; no public startup qualification ran and no helper remains.
Only a subsequent complete unchanged gate permits exact public-source and
actual startup qualification. The separate README shimmer is already public.

## Experimental LCD control spill, 2026-11-05

The reversible experiment adds one faint reflected-light patch sharing the
existing native framebuffer sample, not ambient room fill or emissive controls.
The unchanged forward emitter continues lighting the table. The baseline
regression reads a black D-pad with a full-white native framebuffer and fails.
Final actual GPU control probes have maximum channels around 5.4-24/255 at
full-white brightness; all remain below 35/255. Red/blue color transfer, black/
power-off darkness below 1/255 and table-pool preservation within 1/255 pass.
Syntax/build/12 units and the new experiment plus existing pressed-cap/native
LCD-lighting cases pass 3/3 in 46.7s. Actual worst-case white play/Inspect
captures are reviewed; these are controlled paused-native fixtures, not the
user's private ROM. Existing published figures are restored after the older
test's generated captures. No new README media, private-ROM/audio testing,
human approval or physical global-illumination claim is made.

Source `c8c0e51917e545f0ada7c50df45ebd9a953cffc7` is pushed. Normal Pages
run `42063183081` passes build/12 units and all 15 shard-3 cases, including
this lighting regression. Shard 1 passes 15 but its existing quick-actions
case exceeds 120 seconds. Shard 2 passes 12 but the existing real-mGBA
restore case exceeds 120 seconds; the 600-second suite budget leaves three
cases not run. The precise timeout causes are unestablished. Deployment is
skipped, so independent public asset/browser qualification does not run.
Publication remains blocked, including the previously pending branding,
ordinary zoom, hold-Space and fullscreen-resume changes. No failed-job retry,
denied-dispatch repeat, dummy push, permission change or relaxed gate follows.
Blocker-only records are held locally.

## Main-view LCD after screen fullscreen, 2026-11-05

The room renderer now explicitly stops on screen fullscreen entry and restarts
with reset frame timing on exit. The fullscreen mirror and native emulator
continue independently; no cartridge, runtime, texture or save reload is used.

The reported spontaneous freeze did not reproduce in local headless/headed Edge
or with ordinary browser background throttling. A deterministic suspended-room-
loop fixture fails old source with fixed `lastPaint`, then passes the explicit
resume lifecycle. This is fault injection, not proof of the user's exact cause.
The regression reads actual automatically rendered GPU LCD pixels after both
Escape and close-button exits and after subsequent main-view input. It does not
manually render the room or call native screenshots after fullscreen entry,
which could mask a stale presentation. The native runtime identity is retained.
Syntax/build/12 units and the new resume, ordinary zoom, held-Space and full
quick-actions cases pass 4/4 in 1.6m.

Fix `52d024bbf241f6bbeb5c5e14e21033e1f30ce230` is pushed and independently
confirmed at origin/main. The first push returned GitHub HTTP 500; one retry of
the same commit succeeded. Bounded run discovery and the exact head-SHA Actions
API show zero workflow runs at 21:35 Asia/Kolkata. A later check-runs request
also returns HTTP 500; no underlying service-incident cause is established.
This fix has no completed normal gate or deployment, distinct from the earlier
hold-Space release failure below. Public qualification did not run. No dummy
push, denied-dispatch repeat, failed-job retry, permission switch or relaxed gate
is used; blocker-only records are held locally. Publication remains blocked.
No new private-ROM/audio test or human acceptance is claimed.

## Default hold-Space fast-forward, 2026-11-05

The exact pinned EmulatorJS 4.2.3 source provides native fast-forward ratio/
toggle functions and momentary input 27. Because raw input 27 inverts an
already latched state, the adapter reuses native setting functions to guarantee
2x while Space is held and 1x on release, including after a previous 3x choice.
The action shares normal input cleanup, source counting and VSync coordination.
It is enabled by default; an explicit GBA Space remap retains priority.

Syntax/build/all 12 units pass, including the repeat-after-blur regression.
An original Pixel Lab SRAM frame clock measures actual native pacing, not just
speed flags. The bounded clock fixture excludes software-rendered room/CRT
cost without opening a modal that would correctly disable gameplay keys.
The final expanded native test also checks unchanged held-speed storage,
restored normal pacing, menu/form behavior, simulated blur, Inspect, fullscreen,
actual child keyboard focus and explicit GBA Space remap priority. It and the
existing native speed-clock/complete quick-actions cases pass 3/3 in 1.4m.
The actual cartridge clock measures 59.956fps baseline, 119.379fps while held,
and 59.638fps after release. The final static build passes.

Source `411583cdc10697807a2dd1902408bf860bbc89e6` is pushed. Normal release
`42056550639` passes build/12 units and all 15 shard-1 browser cases, including
the new hold-Space case. Shard 2 passes 14 but the existing VSync test fails at
`player.spec.mjs:186`: it expects a hidden notice while the artifact shows
"Welcome back. Your latest checkpoint has been restored." The unchanged local
VSync case passes in 14.7s; that does not resolve or invalidate the hosted failure.
Shard 3 passes 14 before the 600-second suite budget expires, leaving one not run.
Deployment is skipped. Unlike the preceding releases, this is an actual notice
assertion plus a separate suite timeout, not a browser-install/job cancellation.
No failed-run retry, denied dispatch repeat, dummy push, gate relaxation or
public qualification follows. Blocker-only records are held locally; the
requested feature is pushed but not live. No new private-ROM/audio test is claimed.

## Ordinary play zoom, 2026-11-05

Local implementation adds the fullscreen-style 50-100% widget to normal play.
The existing 100% camera envelope remains exact; lower percentages change
camera distance only. The original Pixel Lab browser regression checks actual
LCD projection, doubled camera distance at 50%, keyboard range changes, retained
native runtime/input, independent inspection/fullscreen settings and mode
visibility. At 1440x1100, 844x390, 390x844 and 320x568, the widget stays within
the viewport and clear of the LCD, hardware targets, status and dock.
Actual desktop/320px local captures are reviewed.

Syntax/build/all 11 units pass. The new zoom case and existing complete native
quick-actions/fullscreen and physical-branding/ordinary-framing cases pass in
1.2m, without retries or skips. Initial test-fixture drawer/geometry assumptions
are recorded in workstream 57; the final lifecycle explicitly hides the widget
during LCD fullscreen. This is local evidence, not a deployed-site claim.
Source `c00d3233c3df802228e57e0ac580c0cf65e645c7` is pushed, but normal Pages
`42050815740` is cancelled: build and browser shards 1/3 and 3/3 succeed,
shard 2/3 cancels and deployment is skipped. Its exact annotation states
**"The job has exceeded the maximum execution time of 15m0s"**. Chromium
installation consumed 14m49s before browser tests began, leaving almost no
job budget. No product assertion failure is established by that cancellation.
Public-asset/browser qualification was not run after the failed gate.

Publication remains blocked. The existing ordinary workflow-dispatch attempt
requires repository-admin rights (HTTP 403); an authorized operator must start
a fresh normal run. No failed-job retry, workaround, timeout/check relaxation
or new commit solely to trigger CI is used. The blocker-only commit was held
locally rather than pushed to manufacture another run; subsequent real
requested features may use the ordinary push gate. No new private-ROM/audio replay or human aesthetic
acceptance is inferred.

## Deeper rear engraving, 2026-11-05

The rear artwork frame increases from 2.95 to 3.45 units, another 17% wider,
and colored floors move from .006 to .024 units below the surrounding plastic.
The existing cutout topology, nested plastic islands, original cover perimeter/
thickness/grips and exact bright purple texture/material remain unchanged.
Only the two geometry parameters change; no fake dark overlay or new bevel
algorithm is introduced.

The tightened integrated regression fails the old 2.8686635-unit ink width.
The new measured ink spans 3.3548777 units. Eight opaque floor rays and groove
walls pass .02-.028-unit depth bounds; a blank ray at x1.75 stays outside the
enlarged ink. Original RGBA, unattenuated material and all unrelated control,
bezel, fullscreen, notification and framing assertions remain in place.
Syntax/build/all 11 units and the affected actual browser case pass (17.1s).
Matched straight/angled public-baseline/local-candidate inspection crops are
reviewed; cover bounds/color and 141424 render triangles remain unchanged.
The static triangle observation is not a performance benchmark.

Qualified source `cf53ecc05ea27a9c26e60a87d0306de1bce78bc5`, normal workflow
`42035592990`: build, 11 units, all 43 hosted browser cases (15+14+14) and
deployment pass. Independently fetched all 29 public application assets match.
The actual public integrated branding case passes in 19.0s without failures,
retries or skips, including eight inset floor hits, new dimensions/depth and
exact bright artwork. The actual tilted public rear is reviewed.
No private-ROM/audio/video replay or human aesthetic acceptance is claimed.
Earlier public rear figures retain their original capture provenance.

## Website header shimmer, 2026-11-05

The public header already serves the supplied chrome BowserBOY asset, not the
older purple header in the reference screenshot. Add a CSS-only neutral glow
and alpha-shaped highlight sweeping left to right for 1.8 seconds per six-second
cycle. Hidden play view pauses it; reduced motion retains the static chrome
image and original shadow. Original artwork, console branding, responsive
header geometry, notifications and application/runtime behavior are unchanged.

The new browser regression fails without the animation. Local branding/
shimmer cases pass in 11.7s and the existing exact-artwork/responsive header case
passes in 23.6s. Syntax/build and all 11 units pass. Actual rest/left/right samples
are reviewed; repeat phase, pause and reduced-motion behavior are checked.
Qualified source `b27bb9152996b87522a97a634d88f26627b2f2d9`, normal workflow
`42031870644`: build,11units,all43hosted browser cases (15+14+14) and deployment
pass. Independently match all29actual public application assets; the two actual
public website-identity/shimmer cases pass in12.0s without failures, retries or
skips. Actual public rest/left/right phases are reviewed. Supplied chrome and
purple PNGs stay exact; this is technical delivery, not aesthetic acceptance.

## Native VSync audio warning, 2026-11-05

Enabling native VSync now immediately displays a warning in the existing
settings-panel notification host. It explains possible audio crackling,
stutter/dropouts and disabling VSync to restore audio-paced playback. Opening
settings with a saved enabled choice repeats the warning without overriding
that choice. Default-off, persistence and existing speed coordination remain.

The actual native-menu regression fails the old implementation's hidden notice.
An initial hook at `EJS_ready` fails because the native setting method is not
installed yet; install it at `EJS_onGameStart`, alongside existing adapter
setup. Test persistence must await asynchronous settings close; after reload
the notification is correctly hidden until opening enabled settings.
One local speed sample reads 3.84x at selected 2x; preserve all clock bounds
and record that failure rather than changing timing or relaxing the gate.
The final three focused warning/native-settings/speed cases pass in 59.1s.
Syntax/build and all 11 unit cases pass, and the actual warning crop is reviewed.
No new private-ROM/audio qualification or human acceptance is claimed.
Qualified source `b4be9946a42c630a3be902ccb671c5c44598e367`, normal workflow
`42028435186`: build, 11 units, all 42 hosted browser cases (14+14+14) and
deployment pass. Independently fetched all 29 actual public application assets
match that source. The actual public native-menu regression passes in22.7s,
without failures, retries or skips, including immediate warning, persisted
enabled choice after reload, reopening, disabling and re-enabling. The public
warning crop is inspected; this is technical delivery, not human acceptance.

## Documentation and public-media refresh, 2026-11-05

README, guide, saving reference, architecture and book entry now distinguish
the chrome BowserBOY website from its first purple GBA console, BowserBOY
ADVANCED. Additional consoles remain future direction; the owner still manages
the repository rename. This corrects the stale guide claim that settings panels use
the purple console PNG: those panels use the chrome website PNG.

The README interactions and dedicated stills were re-recorded on the actual public
site, with the original Pixel Lab demo and zero page errors. All 29 independently
fetched public app assets match qualified `f5bc639`; the local checkout is the
later documentation-only `9140b53`. Capture/encoding and historical-image
boundaries are recorded in [Media](MEDIA.md#bowserboy-public-refresh-2026-11-05).
No application behavior changes, extra console implementation, fresh
audio/private-ROM test or new human acceptance is implied by this refresh.
The five encoded loops have 107/44/29/52/51 frames at 800x618/10 fps. Bounded
contact/still review includes a separate LCD-only sample; current media is not
validated by file existence alone. All local links/anchors in 19 Markdown
documents and all 14 README image embeds resolve/decode; supplied chrome-logo
bytes stay exact.

Documentation/media publication `c7fb6828262f176ca61eebfae18be81453cdb25e`
is independently verified: all 25 changed public files match exact committed
blobs; the actual GitHub-rendered README includes 14 image embeds and current
navigation. The final local navigation count is 152 paths/anchors. Initial
working-tree byte comparison encountered CRLF versus committed LF; the receipt
uses canonical Git blobs, not newline-normalized network output. Application
bytes remain unchanged from the previously qualified public source.

## Updated chrome orbit and sparkle logo, 2026-11-05

The replacement supplied PNG is byte-identical at `assets/website-logo.png`
(2148x732 RGBA; SHA-256
`5e8ed0b2a4edb5f4bf43dc28b4757fc8206df395385e16af4235467998a31300`).
All three intrinsic HTML dimensions and the source identity regression are
updated together. The original purple console PNG and animated README banner
remain unchanged. Only the umbrella README glow is regenerated with the
existing helper; opaque ink and transparent corners are preserved.

The new source has 589,657 fully transparent pixels out of 1,572,336 (37.502%).
The older test's more-than-half-transparent assumption belongs to the previous
artwork and correctly fails on this replacement. Compare the exact new
transparent fraction instead; retain exact source hashes, corner transparency,
white-ink, aspect, viewport bounds, play/Inspect and shimmer assertions.

Syntax/build, all11unit tests and three focused actual-browser cases pass30.3s:
website/console separation, exact artwork/responsive layout/play/Inspect and
periodic shimmer/reduced motion. Actual desktop/320px header crops and the
light/dark README glow sheet are reviewed. Purple console PNG/GIF/APNG match
prior committed bytes. Publication results are recorded in workstream54.

## BowserBOY website brand separation, 2026-11-05

The supplied chrome website logo is copied unchanged to`assets/website-logo.png`
(2151x731RGBA; SHA256
`804b1a96494dbecc9fa732e2772e8f2d23c9eb21bcd8286d9dc00b1fbf46c808`).
Website title, description, accessible table name and three header/panel images
now identify BowserBOY. Neutral header shadows do not recolor the artwork purple.
The original2170x725purple console PNG remains unchanged, as do the console
brand loader, startup/effects, rear engraving, bezel, saves and native runtime.

The new regression fails the old website title. Syntax/build/all11units and
four actual browser cases pass32.9s: website identity and responsive fit,
orbital startup drawing, complete physical branding/recess/framing/fullscreen
and first-visit/startup/persistent-power lifecycle. Actual desktop and320px
header crops are reviewed. Keep the existing play-only header hiding and
Inspect restoration; tools/settings images share the chrome website asset.
These local checks alone do not establish hosted/public delivery.

The first normal run`42020805164`blocks deployment on two fixtures: a shell
selector still expects the old website name, and a power-clearance mask paints
the CSS-hidden play header into its overlap image. Correct the dependent
selector and rasterize only actually visible header artwork. The viewport/
physical-clearance assertions and all bounds/timeouts remain unchanged.
The existing header-artwork case now checks both exact source PNG hashes.
Four affected local browser cases pass57.0s; no runtime change or job retry.

Qualified source`f5bc63933a88040c46879645e91a107fbe930df5`, fresh normal
Pages run`42022953048`, passes build, all11units, all41browser cases
(actual14+14+13) and deployment. Independently match all29actual public
assets to that source. Three actual public website/console-branding, header
visibility/responsiveness and complete physical-branding/recess/framing/
fullscreen cases pass42.1s without failures or retries. Actual public desktop/
320px chrome header crops are reviewed. Both supplied PNG hashes stay exact.
The private byte verifier initially exceeds its1MiBchild-process output buffer
on the1.3MBchromePNG; enlarge that helper buffer, not its equality assertion.

The owner explicitly elects to rename the GitHub repository themselves.
This update leaves repository/Pages paths unchanged. Future consoles are a
recorded product direction, not implemented functionality or an acceptance claim.

## Larger etched rear logo, 2026-11-05

The user requests a larger rear logo etched into the plastic, retaining its
color and brightness. Enlarge the artwork frame from2.1to2.95units (about40%)
without changing its center or the outer battery cover/grips. Reuse the alpha
contour extractor with unchanged A/B projection/threshold. Trace a512x171mask
at alpha16, classify nested loops and replace only the rear cover cap. Retain
plastic counter islands, actual .006deep colored floors and matching plastic
walls. This is actual recessed geometry, not an image buried under an uncut face.

The floor keeps the exact previous1024x342RGBA texture, white tint, full opacity
and untone-mapped basic material. Bright artwork remains independent of room
light attenuation as before; the surrounding plastic and walls remain lit.
No global light, front lettering, original A/B appearance, power, audio or native
timing change is made. Geometry is built once, not repainted each frame.

Actual old width2.0999999fails the new>2.5gate. The new actual ink width is
2.8686635, within the unchanged cover. Inspect actual original/candidate rear
renders from the same pickup/Inspect/drag gesture. Source RGBA is independently
compared against the supplied image;8actual ray first hits reach inset floors,
with .004-.01depth bounds, matching wall depth and cover ownership.
The first fixture reads .01259after an awaited import splits a moving-pose
matrix snapshot. Move imports before the synchronous probe; keep production
depth and assertions unchanged.

Syntax/build/all11units and the complete branding/control/recess/notice/framing/
fullscreen regression pass (17.5s). All original Arial A/B and front metallic
requirements stay.

Source `a7a07fc0b143d531a662e8ecc7c7b5dce68c07b6`, normal Pages run
`42018059319`, passes build, all11units, all40browser cases (actual14+13+13)
and deployment. Independently match all28actual public assets to that source.
The complete actual public branding/recess/framing/fullscreen case passes16.0s
without failures or retries, retaining8floor first hits, source RGBA equality
and the original bright material. Inspect an actual public rear crop captured
through real pickup/Inspect/drag gestures: ink width2.8686635, artwork owned by
the cover, original purple/white coloring and unchanged cover/framing.
No private-ROM/audio/video replay is needed. Aesthetic approval remains separate.

## Metallic chroma lettering, 2026-11-05

The user clarifies **metallic chroma**, applied to the bezel text only.
Keep the outline-free source mask, original glyph edges/counters, centered 60%
size and physical placement. Bake vertical chrome reflection bands and a subtle
horizontal iridescent tint once, clipped to that alpha. Use a lit standard
material with roughness .4 and metalness .1; the warm lamp still warms the finish.
This is stylized static chrome, not animated RGB, emission or a thin-film simulation.
No global lighting, environment map, A/B, bezel material, audio or native timing
change is introduced.

Actual old texture fails the new chromaticity gate with zero colored pixels.
Replace only that superseded monochrome expectation and add chrome contrast;
retain all existing inset, fullscreen equality, original Arial groove, other
control, framing and notice requirements. Original/candidate alpha comparison
has zero mismatches across 25,931 ink pixels; bezel color and projected bounds
stay unchanged. Actual old/new lamp-lit crops are inspected. The first metallic
material is too dark, so the final material reduces metalness and lifts its dark
band rather than changing the lamp.

An extra canvas copy produces16 antialiased pixels differing by at most1RGB,
with identical alpha. Explicit getImageData/putImageData transfer still differs.
Attach the actual texture canvas as the decorative fullscreen element instead,
preserving exact RGBA identity without a tolerance or extra copy.
Syntax/build/all11units pass; the complete actual branding/control/recess/
framing/overlay/fullscreen case passes21.2s. Hosted/public qualification is
pending; technical evidence is not user aesthetic approval.

**Complete, independently live:** source
`ad259c3263dc36b668036425c45b5b8cb8910d1e` / Pages `42013383789` passes
build, all11units, all40browser cases (actual logs14+13+13) and deployment.
Independently match all28public application assets. Two complete actual public
branding/control/recess/framing/overlay/fullscreen and quick-action/native
lifecycle cases pass62.2s, with no failures or retries. Inspect the actual public
lamp-lit lettering crop; source/fullscreen RGBA differences are zero. No private
media is published. A local observer network disconnect does not fail the remote
workflow; resume only observation of that same run, not its jobs.
Workstream45isDONE; user aesthetic acceptance remains separate.

## Audio-paced default, 2026-11-05

The user supplies a recording and authorizes private-ROM audio testing. Extract
only the recording's audio; no video frames are decoded. Numerical measurements
are not direct listening. The 58.944s recording contains repeated short near-silent
intervals and no samples at or above .99 full scale. Quiet musical transitions
alone are not proof of a defect, and the recording alone does not identify a cause.

A fresh actual-ROM 90s baseline reproduces 18 scheduling gaps above 1ms and
13 native stop/restart pairs, with a largest gap of 108.5ms. The existing 256ms
allocation does not maintain equivalent live headroom. Many restarts add the
adapter's 96ms pre-roll. Removing that delay after the first start is rejected:
its 90s comparison produces 139 gaps and 92 restarts, trading longer interruptions
for more frequent starvation.

An isolated native VSync-off control instead has zero gaps or restarts over 90s,
161-206ms of live queued headroom and 90.47s of scheduled PCM. Native audio
synchronization remains enabled. The correction defaults native VSync off before
applying saved options; explicit user VSync choices remain effective. No game-speed,
buffer-budget, pre-roll, mute-envelope, limiter or visual geometry change is made.

The new original-ROM regression measures native scheduled gaps, actual steady
reserve, a 40ms mid-game hitch and the cartridge's SRAM VBlank clock. Actual old
source fails with four gaps including 103.3ms. Its initial scene-ready setup race
is fixed before establishing that failure. Corrected syntax/build/all11units and
four audio cases plus the existing clock/fast-forward case pass in 1.1m. Audio
readiness now observes native audio queues instead of screenshotting game frames.
Actual corrected-source 180s playback schedules 31,042 buffers with zero gaps
above 1ms, zero restarts, no clipped source samples and no page errors.
Live headroom is 141-206ms; a 40ms mid-game hitch leaves 163.2ms queued.
Post-limiter peak is .6843. Auto-save stays on; measured capture calls take
at most 2ms. Normal/public delivery remains pending.
Physical audio devices, subjective quality and arbitrary host overload are not
qualified by these measurements.

First normal `71123d4` / `42006670563` passes build/11units and 38 of 40
browser cases; deployment is correctly blocked. The new bounded-stall fixture
instead encounters multi-second software-GPU draws. Like the existing native
speed regression, open tools and select an unfiltered native display to isolate
the requested 40ms audio hitch. Keep every gap/reserve/hitch/clock bound.
The isolated VSync-on control still fails actual minimum reserve at 54.7ms
against the unchanged >80ms requirement; corrected playback passes.

The separate remembered-power fixture also misses its final physical gesture.
Its trace shows a 2.3s click window; isolate the separately tested autosave lock,
matching the adjacent existing power fixture, without removing lifecycle assertions.
These two corrected cases pass locally in 34.3s. No application bytes, workflow,
timeouts or assertion bounds change; fresh normal/public qualification follows.

**Complete, independently live:** fresh `b223a425c66d574d36917d9f4ff2d850c5675df0`
/ Pages `42008857811` passes build, all11units, all40browser cases (actual logs
14+13+13) and deployment. Independently match all28public assets. All four actual
public audio cases pass in45.2s without screenshot/video captures. Steady queued
reserve is at least189.9ms; the40ms hitch leaves154.2ms. The original cartridge's
SRAM clock measures60.05frames/s, with zero measured scheduling gaps.
Five generated private PCM captures are removed after numerical comparisons are
retained; the user's original recording and ROM remain untouched.
Workstream44isDONE on this bounded technical evidence, not direct listening,
human approval or a guarantee against arbitrary overload. Explicitly enabled
native VSync remains a user override and can reintroduce the measured starvation.

## Original soft A/B typography, 2026-11-05

The user rejects the custom rounded shapes from workstream 42 and explicitly
chooses original soft A/B text **with inward grooves**. Historical `807da8e`
uses `bold 95px Arial`, a .25x.28 label plane and y=-.005. The current browser's
same text renderer supplies the glyph mask. Interpolate half-alpha contours
into actual cap cuts, floors/walls and solid counter islands. No font file is
bundled; system font selection has the same platform dependency as the original.

Rasterize the actual triangulated floors back into the original label frame
and compare alpha intersection/union against an independently rendered original
glyph. The rejected custom font scores 0.603481 (required >0.94); recovered A/B
floor silhouettes initially score 0.985935/0.991902. This deliberately replaces
42's custom width/corner assertions with source-reference typography fidelity.
The narrower original B stem needs its floor probe at x=-.045 rather than -.06;
floor-first-hit and solid counter semantics remain.

Actual reference/deep/shallow render comparisons show that the old deep walls
still make the font look harsh. Only A/B floors move from local z=.028 to .047.
Require genuine inward depth and wall height between .004 and .012, replacing
the earlier deep-engraving bounds for these letters only. Preserve cap shapes,
materials, groove shade, counters, shadows, other markings, bezel and motion.
Syntax/build/all11units pass. Final complete branding/recess/framing/fullscreen
and pressed-cap lighting cases pass20.5s locally. Normal/public delivery and
human aesthetic acceptance remain pending at this stage. Audio stays open.

**Complete, independently live:** `e8e51c6845740da4a37ac4b60c066a88ec1fcb86`
passes fresh normal Pages `42002030860`: build, all 11 units, all 39 browser
cases (actual logs13 per shard) and deployment. Independently match all28
actual public assets. Complete actual public branding/reference-font/shallow-
recess/framing/fullscreen and pressed-cap lighting cases pass25.6s, including
the >94% original-font floor overlap and genuine .004-.012 inward depths.
Other controls, cap material/shape, shade, bezel, motion and native behavior
remain unchanged. This is technical delivery, not new human aesthetic approval.

## Rounded, heavier A/B grooves, 2026-11-05

**Superseded visually:** technically delivered, but the user rejects these
custom shapes and requests the original soft typography in workstream 43.

The user requests softer letter edges and thicker A strokes, not another cap
or color change. Dedicated action-button outlines and counters use quadratic/
cubic curves and broader .18x.19 proportions. Shared molded typography, cap
silhouettes, dome/rim normals, .028 floor, groove shade and motion stay intact.

The old actual A floor width .033 fails the new >.039 requirement. The existing
real branding case now also checks that B's rounded top-left corner stays at
cap height while the adjacent stem reaches the floor. All earlier floor-depth,
counter-island, wall, shadow, contrast, other-marking, wordmark and viewport
assertions remain. Syntax/build/all11units and complete branding plus actual
pressed-cap lighting cases pass locally (22.2s). Bounded actual old/new
warm-lamp crops are reviewed: heavier A strokes and smoothly curved B bowls.
Hosted and independent public delivery remain pending at this local stage.

**Complete, independently live:** `350cdc694699b3a1623ece9dada428fcef4e7472`
passes fresh normal Pages `41996723564`: build, all 11 units, all 39 browser
cases (13 per shard) and deployment. Independently match all 28 actual public
assets. The complete actual public branding/recess/framing/fullscreen and
pressed-cap lighting cases pass 24.8s, including the new width/corner/stem
probes and all retained requirements. No cap material, groove shade, motion,
other molded font, bezel, native timing or delivery gate changes.

**Audio remains open:** the user reports continued intermittent distortion and
is preparing a recording. This geometry revision makes no audio changes and
does not establish a new diagnosis or a universal fix from the earlier reserve.

## Outline-free bezel lettering, 2026-11-05

Remove only the exterior light contour from the shared monochrome bezel art.
Color-only filters visibly damage letter fills and leave contour fragments.
Instead, solid 7x7 alpha cores seed reconstruction of their original connected
pixels; reject detached thin contours without eroding the selected glyphs.
Keep the 60% source draw, neutral shade, original supplied PNG and all other logos.

Tighter real-ink bounds fail the old contour at left inset
0.20182291666666666 (required >=0.21). Syntax/build/all11units and the complete
actual branding/recess/framing/overlay/fullscreen-identity case pass locally
(18.3s). All four bounds are tighter, while width/ink/monochrome/shared-pixel
and physical-control assertions remain. At this local stage, hosted/public
qualification had not occurred.
Actual local warm-lamp rendering is reviewed: clean letters, no exterior frame.

**Complete, independently live:** `5b53c887c04ba9ba381ba86b04f0f4640a78ef9a`
passes fresh normal Pages `41992917534`, including build, all 11 units, all
39 browser cases and deployment. Independently match all 28 actual public
assets. The complete actual public branding/recess/framing/overlay/fullscreen
identity case passes 16.4s, with all four clean-letter bounds and existing
shared-pixel, color, size, control and viewport requirements intact.
No supplied image, other logo, cap, camera, native input or timing changed.

## Smaller bezel wordmark again, 2026-11-05

The user's new crop requests another reduction of the bezel lettering. Reduce
only the centered source draw from 75% to 60% of the unchanged texture canvas:
20% less width and height than the preceding edition. Physical planes, LCD,
camera, aspect and all other logos remain unchanged. Actual fullscreen pixels
must still match the normal handheld texture.

Tighter real-ink inset bounds fail the old implementation at
0.13020833333333334 (required >=0.195). Syntax/build/all11units and the
complete real branding/recess/framing/overlay/fullscreen-identity case pass
locally (15.5s). At this initial local stage, hosted and independent public
qualification had not occurred.

First normal `8a1d6a3` / `41982704247` passes build, all 11 units and 38 of
39 browser cases, including the actual smaller-wordmark/branding case. The
unchanged complete native save/export/import case fails waiting 15s for
"Backup imported and stored"; it retains "Backup download requested".
The actual trace confirms the export and file-input actions, with no recorded
pageError; a cause is not established. The entire unchanged local case passes
40.8s. That does not erase the hosted failure or establish production delivery.
No failed jobs, assertions or timeouts are retried/changed. The separately
requested substantive README/media publication receives its own normal gate.

**Complete, independently live:** the substantive README publication
`f00f529b2693fe449287bab7b0b76162d9bfb7cd` receives fresh normal Pages
`41984863317`, passing build, all 11 units, all 39 browser cases (including
the unchanged complete backup/import case) and deployment. Independently
match all 28 actual public assets. Three complete actual public branding/
recess/framing/overlay/fullscreen-identity, pressed-light/response and mapped
native-input cases pass 52.2s. The current public desktop rendering is reviewed.
This qualifies both the further-smaller shared wordmark and softer A/B grooves,
without changing cap colors, other logos, geometry, native timing or any gate.
The earlier hosted failure remains historical evidence, not an inferred cause.

## Softer A/B lettering, 2026-11-05

The user finds the letters too dark and explicitly confirms **only the A/B
letters**, not the cap color. Change only the shared groove material from
`#454c40` to `#999d98`. Cap materials, illumination, genuine cutouts, counter
islands, stronger press motion and all other markings remain unchanged.

The revised requirement deliberately supersedes workstream 36's >3 material
contrast: retain legible but moderate contrast between 1.5 and 2.5. Actual
source contrast changes from 6.22965 to 1.92740. All first-hit depth, counters,
wall/shadow, viewport and other-marking assertions remain. Syntax/build,
all 11 units and the three complete branding, pressed-light/response and
mapped-native-input cases pass locally (40.5s). Actual warm-lamp rendering
is reviewed; no historical image or private ROM changed. At this initial
stage, hosted and independent production qualification had not occurred.

Normal `3a9ed72` / `41982271371` subsequently passes build, all 11 units,
all 39 browser cases and deployment. The combined independent public
qualification above now covers the exact softer floor/wall material.
No user aesthetic acceptance is inferred from technical qualification.

## Stronger button feedback, 2026-11-05

Workstream 37 increases actual A/B travel to .075 units, Start/Select to .04,
shoulder travel to .12 with .075-radian hinging, and shared D-pad travel to
.016 with .1-radian rocking. Compression/release use elapsed-time damping
50/80 instead of symmetric 55. Native events, rest bounds, cap/recess geometry,
lighting, camera and emulator/render scheduling are unchanged.

The existing real mapped-input case now requires the larger actual mesh
displacement, preserving held-key/mixed-pointer/remapping/blur/release and
opposing-D-pad assertions. Old source fails at .045 travel against >.065.
Extend the actual pressed-cap case with equal 32ms compression/release samples:
compression is visible but incomplete, release progresses farther, and the cap
returns within its original rest/pressed bounds. Retain every existing real
aperture, pressed-light, unlit-cap, recess and branding assertion.

Syntax/build, all 11 units and the three complete local motion/lighting/
branding cases pass (39.4s). Actual deeper A/D-pad captures are reviewed.
Generated native-light captures remain private; historical documentation
images are preserved.

Initial `1864547` / normal `41928667648` passes build, all 11 units and 38 of
39 browser cases, including the stronger-input, pressed-light and transient
response cases. Its initial 40/70 damping fails the unchanged adaptive-GPU
budget case: a 100ms update reaches .981684 press, below the existing >.99
requirement. This is a directly coupled timing regression, not an unexplained
runner failure. Change only compression/release to 50/80, preserving both the
100ms/>.99 contract and the new equal-time release contrast assertions.
Corrected syntax/build, all 11 units and all four complete local branding,
original GPU-budget, pressed-light/response and mapped-native-input cases
pass (47.4s). Normal deployment and independent public qualification remain
pending; no retry or weakened assertion.

Corrected `48b11b7` / normal `41930463880` passes build, all 11 units and
38 of 39 browser cases, including the original 100ms budget and every new
motion/lighting assertion. The unchanged native CRT case fails startup:
Pause stays disabled for 90s. Its actual retained trace shows
`https://cdn.emulatorjs.org/4.2.3/data/loader.js` failing with
`net::ERR_BLOCKED_BY_ORB`; the player explicitly reports that the CDN cannot
be reached. Do not attribute this request failure to cap motion or change
loader, CRT, timeout or test gates to conceal it. The entire unchanged local
CRT case separately passes (15.7s), without erasing the hosted failure.
Publish this first corrected qualification record through a fresh normal
workflow; independent production delivery remains pending at this point.

Fresh normal `2cc1a58` / workflow `41932265544` subsequently passes build,
all 11 units, all 39 browser cases and deployment. Independently match all
28 actual public assets and run all four complete production branding,
original GPU-budget, pressed-light/response and mapped-native-input cases
(53.3s). Actual A travel is .05985776 after 32ms and .075 settled; 32ms of
release leaves .00579786, then returns exactly to rest. Workstream 37 is DONE.
Preserve native timing, every release bound, recessed lettering and historical
documentation images. No failed-job retry or new human aesthetic acceptance
is implied; the earlier timing regression and CDN observation remain recorded.

## Recessed A/B lettering, 2026-11-05

The user corrects the A/B markings: they must be inward and dark, not raised.
Reuse the original glyph contours to perforate the cap faces. Keep enclosed
counters at cap height, with dark floors and sidewalls below the dome. Remove
only the old closing triangles, preserving the rim's original normals; match
the replacement face shading so the cap does not acquire a separate center
disk. Button silhouettes, press travel and all other markings are unchanged.

The existing branding case now casts real rays through both letters. Require
the first hit to be the groove floor, .018-.035 units below adjacent cap
material; counters stay at cap height, walls have depth, contrast exceeds 3:1
and no printed map is used. Retain the eight other raised markings and every
viewport/glass/wordmark assertion. Old raised letters fail the new contract.
Syntax/build and all 11 units pass; final complete branding/native-input cases
pass locally (27.5s). The existing real pressed-cap aperture/lighting case
passes (7.9s). Actual local rendering is reviewed without changing historical
documentation images or using a private ROM.

Source `27932fd` / normal workflow `41923251679` passes build, all 11 units
and 38 of 39 browser cases, including the recessed geometry, native input and
pressed-lighting checks. The unchanged native cartridge-clock case measures
2.041516x at 3x, below its unchanged 2.10x minimum; deployment is skipped.
That case excludes room rendering and disables the CRT shader. No cause is
established and no pacing code, bound or timeout is changed. The same complete
clock case subsequently passes locally (24.0s); this does not erase the hosted
failure. Publish this first qualification record through the normal workflow;
independent public proof and workstream completion remain pending at that point.

Fresh normal qualification `4b99550` / workflow `41925345571` subsequently
passes build, all 11 units, all 39 browser cases and deployment. Independently
match all 28 actual public assets and run the complete branding/recess-depth,
native-input and pressed-cap lighting cases against production (35.2s).
Workstream 36 is DONE. The native pacing code and every original release bound
remain unchanged; no failed-job retry or new human visual acceptance is claimed.

## Smaller bezel wordmark, 2026-11-05

The user requests smaller lettering beneath the LCD. Draw the shared
monochrome artwork at 75% width and height with equal 12.5% padding. Both the
physical and fullscreen bezel use that exact texture; no mesh, fullscreen CSS,
LCD area, camera, proportions or other logo is changed.

Extend the existing branding case to measure actual nontransparent pixel
bounds, not the unchanged canvas rectangle: at least 12% padding on each edge,
with sufficient visible lettering retained. The old artwork fails with left
ink at .00651 instead of at least .12. Syntax/build, all 11 units and the full
branding case pass (15.2s). The complete existing quick-action/fullscreen/zoom
case passes (41.1s), preserving four-size fit and live LCD identity. Review the
actual local fullscreen capture using original Pixel Lab, not a private ROM.
Fresh normal source `f2d85d3` / workflow `41919474092` passes build, all 11
units, all 39 browser cases and deployment. Independently match all 28 actual
public application assets, then run both complete branding and quick-action/
fullscreen cases against production (55.7s). Workstream 35 is DONE. No
failed-job retry, gate change or new human visual acceptance is claimed.

## Notification overlays, 2026-11-05

The user explicitly permits notifications to overlap the console, superseding
workstream 29's separate-message clearance requirement. Remove the notice-host
resize observer and notice-dependent camera fit. Frosted styling, scroll bounds,
44px dismissal, error tint and drawer/native-panel placement are unchanged.

The existing branding/notice regression now requires the ordinary camera
position and look target with visible normal/error/long notices, all five
viewport sizes, drawer reparenting, inspection and dismissal. Whole-handheld
viewport fit, toolbar clearance and physical power-target bounds remain checked;
only separation from the overlapping notice is intentionally removed.
The old avoidance implementation fails the new framing assertion. Syntax/build,
all 11 units and the corrected focused case pass locally (15.0s).

Source `3668bb0` starts normal workflow `41915188399`: build and two browser
shards pass, but the physical-input case times out because the intentionally
overlapping power-on notice intercepts its L-shoulder click. Deployment is
skipped. Update that dependent case to visibly dismiss the notice through its
real close button before exercising every shell control. Keep every native
press/release, mixed-input, pause and fullscreen assertion; do not force clicks
or change timeouts. Both the overlay and physical-input cases then pass locally
together (27.4s).

Fresh normal source `c981388` / workflow `41916735296` passes build, all 11
units, all 39 browser cases and deployment. Independently match all 28 actual
public application assets to that source, then run both complete overlay and
physical-input cases against the real public site (28.7s). Workstream 34 is
DONE. No failed-job retry, forced click, timeout increase or unrelated
application change is needed; no new human visual acceptance is claimed.

## Sustained audio reserve, 2026-11-05

The user reports recurring distortion and explicitly authorizes a local ROM
for diagnosis. A bounded private Edge probe advances with A while measuring
native deadlines, source stop/restart transitions, real post-limiter output,
and state/battery capture timing. ROM bytes, PCM and private paths stay outside
the repository and deployed payload. This is signal analysis, not a claim to
have heard the user's speakers.

The old 128 ms native budget produces one 100.5 ms scheduling gap in 90s,
then five 98.1-112.6 ms gaps in a repeated 70s run. Source samples do not clip;
the gaps coincide with native underrun/restart transitions. The 96 ms startup
cushion drains during normal playback. Capture calls take roughly 1-3 ms;
these observations do not establish that auto-save caused the gaps.

The correction requests 256 ms of native buffer capacity, retaining the
existing startup pre-roll, lookahead, limiter, volume/mute ramps and game speed.
Two candidate runs of 90s/70s have zero scheduling gaps above 1 ms. The two
70s control/candidate runs include the same 40 ms mid-game hitch with auto-save
enabled. A final run of the actual corrected source covers 180s and 31,048
scheduled buffers: zero gaps above 1 ms, zero native restarts, no clipped source
samples, and no page errors. Recorded post-limiter peak is 0.870; authored
musical silence is not counted as an underrun.

The actual native regression fails the old source at 121.9 ms of allocated
PCM budget. It requires at least 240 ms, allowing native block rounding,
as well as checking the requested setting. Syntax/build, all 11 units and the
three audio cases plus actual cartridge-clock/fast-forward case pass in 45.5s.
Existing 80 ms startup-stall, deliberate 250 ms starvation/recovery, peak/mute,
pause/save/restore and unchanged-speed assertions remain intact.

The trade-off is additional audio latency; the configured budget is not an
end-to-end latency measurement. This does not qualify every ROM, physical audio
device, browser, fast-forward sound quality or arbitrary sustained host overload.
Normal source run `41892670295` / `ca2ad94` passes build, all 11 units and
all 39 browser cases. Its deployment then remains `updating_pages` until the
Pages action times out and cancels that deployment. This is a publication
failure after successful verification, not an audio-test failure.

The requested fresh `workflow_dispatch` is rejected with HTTP 403 requiring
repository admin rights. No failed attempt is retried and no permissions,
workflow, deadline or gate are changed. An independent public-asset check
still finds the previous `src/audio.js` at that stage. Evidence-only `995d2fa`
starts a normal push workflow `41895909034`; its full gate also passes, but
Pages rejects deployment because the previous build is still in progress.
The exact previous deployment's status subsequently says `deployment_cancelled`.
No backend cause or cleared lock is inferred from that conflicting evidence.

The user starts a fresh normal workflow `41907629546` at
`995d2fa66bfc29bce51705fcc8c548e9a0d45599`. Build, all 11 units, all 39 browser
cases and deployment succeed. Independently match all 28 actual public assets.
The corrected application is now live, not merely present on the main branch.

The first public native case exposes a measurement error: summing only slots
already populated with PCM reports 191.6 ms even though the native pool has
allocated 43 slots. A bounded diagnostic observes 43 allocated slots with only
23 populated initially, then all 43 populated. A trial bounded poll is also
insufficient: some slots can remain unused during steady playback. Filled data
is not the pool's reserved capacity.

The regression now verifies uniform positive native block durations and
multiplies that observed size by the actual allocated slot count. This gives
249.6 ms for the 43-slot corrected pool; the 21-slot old source still fails at
121.9 ms. The 240 ms requirement, configured 256 ms check and all existing
stall/recovery, peak/mute, lifecycle and clock assertions are unchanged.
Local native case passes in 16.3s; all four actual public audio/clock cases
pass in 53.9s. The test/record follow-up does not alter any application asset.
All five temporary private PCM captures are removed; timing metadata and the
user's original ROM are retained. Technical evidence is not human listening
approval or a guarantee about every device.

## Darker raised control markings

The actual pre-relief source palette is restored on A/B (`#a2aa99`) and the
four D-pad arrows (`#a5ad9b`). Tinted rubber-material clones preserve roughness,
clearcoat, raised/beveled geometry and shadows; the caps and other labels do
not change. The existing manufactured-control case checks relative luminance
contrast above 1.5 for those six marks and retains the same-material requirement
for L/R and START/SELECT, plus its no-texture and real-depth assertions.

Syntax/build, all 11 units and the three branding/notice/framing cases pass
in 1.3m. This also rechecks the preceding play-only header fix. The actual
1920px warm-lamp capture is reviewed: markings are visibly darker without
flattening the geometry.

Normal logo-only `73a7579` / Pages `41884678705` succeeds. Combined release
`464f034e76d92cc15f14bae69688c3b0cc4ffd1b` / Pages `41886136203` then passes
build, all 11 units, all 39 browser cases and deployment. Independently match
all 28 public assets to that exact source and pass both actual public
branding/notice and responsive logo-transition cases in 41.5s. Review the
public 1920px desktop and 390px phone captures. Both refinements are verified
live; this is technical evidence, not human aesthetic acceptance.

## Play-view header logo

The top-left website wordmark is hidden only when the existing scene view is
`playing`. Its layout box remains reserved, so the frosted notice host and
camera clearance do not move. Desk/Inspect and startup/bezel logos are unchanged.

Syntax/build, all 11 units and three focused Edge cases pass (1.0m). The existing
responsive artwork case now checks pickup, Inspect, back-to-play and put-down
at 1440/390/320px. The actual notice remains visible with the header logo hidden;
five-size notice and underside-power/whole-handheld coverage still pass.
The actual 1920px play/notice capture is reviewed. The combined live release
recorded above includes this fix.

## Frosted notifications and clear handheld

The expanded existing branding/notice regression checks actual translucent
computed styling, 44px dismissal, five viewport sizes, normal notices,
a real invalid-file error, an explicitly synthetic long-text fixture,
inspection, drawer reparenting and return to the ordinary camera on dismissal.
Projected actual visible vertices prove whole-handheld separation; the power
target separately retains full containment and dock/message clearance.

Syntax/build and 11 units pass. The final adaptive-lane branding/framing pair
passes in 42.0s; the expanded branding case also passes explicit
Chromium/SwiftShader in 22.5s. Actual desktop, short landscape and long-error
phone captures are reviewed. An initial camera translation has the wrong sign;
the real clearance test catches it. The first corrected below-only layout
passes, but visual review finds unnecessary landscape shrinkage, so two
safe-region candidates retain the larger fit. A software run also exposes a
stale immediate camera read after notice reparenting; the test now polls
against the unchanged ordinary-fit formula rather than that stale sample.
No clearance assertions or timeouts are relaxed. Publication and independent
production verification remain pending. A final five-case Edge batch including
the expanded power-target assertions, both actual insertions, native input/
lighting and quick-actions/fullscreen/save/restart passes in 1.7m.

First hosted run `41873558242` correctly blocks deployment: 37/39 cases pass.
The fit minimum incorrectly clamps explicit inspection pinch zoom. Apply user
zoom to the selected safe-region baseline instead; default whole-console
clearance remains, while intentional inspection zoom retains its existing
ability to crop. The unchanged native speed case separately reports 4.5609x
for its 2x sample (upper bound 2.6x); no cause is inferred or threshold changed.
Both failed cases and the expanded notice case pass explicit SwiftShader
in 1.4m after the zoom fix. A fresh normal run follows, never a failed-run retry.

**Qualified source:** `ab912d51ecc615f7aa55a4d27f6a876673739cdf`.
Fresh normal run `41875740589` passes build, all 11 units and all 39 browser
cases (13+13+13). Its deployment remains pending at the documentation refresh
(23:14 IST; status moves from queued to waiting). No completed deployment steps
or new public-asset match are claimed. The last independently verified public
application is the manufactured-control source `7843db8`; the actual public CSS
still identifies the older build at the earlier independent check.

The README's refreshed interactions and notice/fullscreen/underside figures
are actual local captures of this qualified source, not a purported public
capture. Both capture sessions report zero page errors. Recorded UI actions,
encoded temporal samples and actual desktop/phone notice/fullscreen/underside
figures are reviewed. See [Media](MEDIA.md#current-refresh---manufactured-controls-and-glass).
No app source, thresholds or release gates change in this documentation task.

**Final release outcome, 23:25 IST:** normal run `41875740589` completes
successfully, including deployment. Independent verification matches all
28 exact public assets to `ab912d51ecc615f7aa55a4d27f6a876673739cdf`.
Five actual public Edge cases pass in 2.0m: native clock/fast-forward/VSync;
quick actions with slots/autosave/restart/fullscreen; molded branding and
frosted notice clearance; mapped input/native LCD illumination; actual
touch inspection/pinch without game input. Actual public desktop/phone notice
captures are reviewed; zero capture page errors. Workstream 29 is complete.
The pending observations above remain historical, not current release status.

## Engineering book and documentation edition

The first book has ten numbered chapter folders and a revision-bound source
register, with dedicated algorithms/data-structures and design-principle
chapters, vertical Mermaid diagrams, captioned figures and exercises/answers.
It is a Markdown edition, not a claimed PDF or separately built reader.

Documentation check covers 18 Markdown files and 130 local file/anchor links
with zero errors. Transparent-banner bytes are unchanged. GitHub independently
reports matching identities for all 34 changed blobs in documentation commit
`67e883db7e5ef49a8f770568222abec18a2ed6ca`. Actual GitHub rendering decodes all
ten README image embeds, exposes all ten chapter links and renders the book
index and algorithm diagrams as SVG. Those two book pages are visually reviewed.
An initial capture probe incorrectly selects GitHub's hidden animated-image
fallbacks; the probe is corrected to await hydration and inspect displayed
images. This is a capture-tool correction, not an application change.
No blanket claim that every chapter was visually rendered or that a human
approved the new edition is made.

## Main-page logo contrast

The header alone adds a static alpha-shaped violet glow and tight dark
separation shadow. The supplied PNG bytes, intrinsic aspect ratio, transparent
corners, startup, physical branding and panel logos remain unchanged.
Syntax, build and all 11 units pass. Existing artwork/responsive-header and
branding/notice browser cases pass in 13.7s, including 1440/390/320px fit.
Actual warm, lights-off, room-lit and phone captures are reviewed against an
unfiltered baseline with zero browser page errors. This is local browser
qualification. Release `59fd5628e3ada8f48660e252e6186812e4d7d936` /
Pages `41860686680` subsequently reports success. Independent verification
matches all 28 exact public assets, including the header glow CSS.

## Molded markings and closer play framing

Real beveled same-material relief replaces control printing; raycasts reject
the removed front POWER/BBA-001 planes. The bezel's star-free monochrome
lettering and fullscreen decorative canvas are pixel-identical. The original
supplied PNG and native framebuffer remain unchanged.

Syntax/build and all 11 units pass. Six focused Edge cases pass in 1.2m:
branding, responsive artwork, both real cartridge insertions, pressed-cap
lighting and mapped-input/native illumination. The final five-size framing/
underside case passes in 28.8s. Explicit Chromium/SwiftShader passes branding,
five-size framing and pressed-cap lighting in 1.7m. The actual native
quick-actions/fullscreen/save/restart case also passes after the shared canvas
change. Reviewed actual local captures cover 1920x1080, 1440x1100, 844x390,
390x844, 320x568, room lighting and oblique relief; zero browser page errors.

Initial framing assertions fail: projected axis-aligned bounding-box corners
include empty/hidden space, and the transparent header's rectangle is not its
visible ink. The final test projects actual visible vertices and rasterizes
shell/shoulder triangles against actual logo alpha. It preserves all existing
44px power-target, LCD/dock clearance, raycast, travel and input assertions.
The initial camera is also made slightly less aggressive after visual review.
Current fit uses 9.8/5.35 and -0.12 Y for normal play only; original insertion
and inspection framing remain. These are local browser qualifications, not
physical-device testing or user aesthetic approval. Normal release and
independent production verification subsequently succeed:
`7843db880a52539d6e2050f79070f5829947a393` / Pages `41867840972` passes
build, all 11 units, all 39 browser cases (13+13+13) and deployment.
All 28 exact public assets independently match. Four actual public Edge cases
pass in 1.7m, covering relief/artwork parity, five-size framing/power,
native input/lighting and quick-actions/fullscreen/save/restart. Actual public
five-size, room-lit and oblique captures have zero page errors; reviewed desktop,
phone and relief surfaces agree with the locally qualified result.

## Deployed underside power and all CRT presets

Corrected release `ba49d559688713d485d2c27b593faed9692913ae` / fresh Pages
`41853556614` passes build, all 11 units, all 39 browser cases (13+13+13)
and actual deployment. All 28 exact public assets independently match.
Seven actual public Edge cases pass in the initial batch, covering all nine
native presets, native settings/persistence, responsive shell/invalid files,
cold-power saves, both physical insertions and the underside target. The last
lighting fixture clicks Demo before scene readiness and leaves the console in
table view; it times out on the correctly hidden power target. Adding the same
scene-ready setup precondition makes that actual public case pass in 29.0s.
Thus all eight public behaviors are verified, not an eight-pass initial run.
No production behavior or timeout is changed for that fixture correction.

The actual public tilted underside detail and five directly affected guide
figures are reviewed and refreshed, with source provenance in [MEDIA.md](MEDIA.md).
These remain browser evidence, not physical-device qualification or aesthetic
acceptance. Earlier README interaction GIFs predate the hardware relocation.

### Diagnosis and local qualification

The underside-location regression rejects the old front-mounted slider.
The complete lower-edge assembly now faces outward within the shell thickness,
and its projected target follows the cap. Checks at 1440x1100, 844x390,
390x844 and 320x568 verify real cap visibility, full 44px target containment,
dock/LCD clearance, on/off travel and actual button clicks. An initial
landscape run finds toolbar interception; retaining 180px rather than 110px
of short-height framing reserve fixes the actual overlap without forced clicks
or changing console geometry/scale. The tilted underside capture was reviewed.

The shader regression compares menu values against the real pinned runtime's
complete `crt-` catalog: nine presets, not guessed filename variants. It fails
before the change, then verifies each actual native preset file, rendered
original-cartridge pixels and unchanged runtime. Aperture survives reload;
default/legacy Geom, native-settings synchronization and Geom-only curved
geometry remain. Unfiltered and unsupported-preference checks are retained.

Syntax, build and 11 units pass. Four focused Edge cases pass in 1.5m;
the all-preset case takes 12.6s and underside case 21.0s. Explicit Chromium/
SwiftShader passes both in 1.2m (36.2s and 31.2s). Separate actual cold-power
lifecycle and mapped-input/lighting checks also pass. These are local browser
results, not physical-device qualification or human aesthetic approval.
First hosted run `41850906571` correctly blocks deployment. Its actual insertion
samples expose the newly protruding underside cap crossing the tabletop in the
lowered loading pose. Raising that hold by 0.09 world units retains visible
lowering and restores physical clearance. The 320px layout snapshot also reads
an old projected target during resize; the regression now polls the same full
placement/visibility/clearance/following criteria until the actual frame is
updated. An existing invalid-file fixture now waits for scene readiness before
dispatching its file event. The unchanged cartridge-clock check separately
reports a 5.2706x ratio above its 5.2x upper bound. No timing, throughput,
clearance or release assertion is relaxed. Corrected source starts a fresh
normal release run, not a retry of the failed run; its success is recorded above.
The corrected insertion/layout/invalid-file fixtures pass all four cases with
explicit Chromium/SwiftShader in 1.9m; syntax, build and all 11 units pass again.

## Deployed fast-forward and fullscreen-fit correction

Release `faece42da7563a74d39e1513ebeb7be543300ec0` / Pages `41841433989`
passes build, 11 units, all 38 browser cases (13+13+12) and actual deployment.
Independent production verification matches all 28 exact public assets.
Four actual public Edge cases pass in 1.6m: cartridge-clock acceleration and
VSync recovery, native audio buffering/volume, offline peak/mute rendering and
the expanded real quick-action/fullscreen/save/restart case. The latter checks
the complete bezel/picture, all four viewport sizes, 50-100% keyboard zoom,
actual pixels/input, refusal recovery, both exits and retained runtime.
The guide figure is refreshed from this actual public fullscreen capture;
unrelated README GIFs are unchanged.

### Diagnosis and local qualification

The original cartridge's own SRAM VBlank clock reproduces the VSync conflict:
the dock says 4x but the clock advances at only 1.016x baseline before the fix.
With explicit native VSync coordination, final Edge measurements are 59.81
cartridge frames/s at 1x, 119.49 at 2x, 179.89 at 3x and 243.12 at 4x,
returning to 60.33 at 1x. The same runtime and saved enabled/disabled VSync
preferences are retained. The test-only clock leaves default/tone-only ROM
bytes unchanged. Native-loop counters and UI flags are not clock evidence.

Four focused Edge cases pass in 1.4m: native audio buffering/volume, actual
offline peak/mute rendering, cartridge-clock acceleration and expanded real
quick actions/fullscreen/save/restart. Final clock isolation passes Edge in
27.0s and explicit Chromium/SwiftShader in 58.6s. The software run also passes
the other three cases, including fullscreen in 1.4m and native audio in 28.3s.
The speed fixture explicitly selects the unfiltered native display and suppresses
the 3D backdrop to isolate core pacing from software CRT rendering cost;
gameplay's default shader is unchanged and remains exercised by quick actions.
The initial CRT/software baseline was only 31.68 frames/s, not a timing failure
or evidence of full-speed hardware qualification. No throughput assertions,
timeouts or release gates were relaxed.

Fullscreen checks preserve exact native framebuffer pixels before/after real
input, all exits/refused-request recovery and runtime identity. At 1920x1080,
844x390, 390x844 and 320x568 the complete bezel fits above the bottom-right
controls, the LCD stays 3:2 and both dimensions halve at 50% zoom. Actual
desktop/phone/50% captures were reviewed. These are browser checks, not physical
phone or user aesthetic acceptance. An existing audio fixture initially selected
its ROM before scene readiness; an explicit scene-ready precondition fixes that
setup race without changing audio assertions.

Source `21835788bf29c97e4050a6d0e34bb7c7824fc4c3` is pushed.
Pages `41830585258` attempt 1 passes build and all 19 first-shard cases.
Shard 2 passes 18/19 but reaches the unchanged 600-second global limit during
the final existing mobile-inspection case; no assertion fails, deploy skips.
That exact case independently passes local SwiftShader in 26.4s, not a hosted
gate substitute. The user manually reruns failed jobs; API confirms actual
attempt 2 on unchanged source. It also passes build/19+18 cases but reaches
the same deadline during the last mobile case; that attempt does not deploy.
The user explicitly authorizes three browser shards instead of two. This
changes scheduling only: all 38 tests, assertions, the 600-second per-shard
deadline, 15-minute job deadline and required build/verify deployment
dependencies are retained. CLI discovery proves all 38 tests assigned exactly
once, 13+13+12. The next normal gated release succeeds as recorded above.

## Previous hardware branding and screen-focus release

Source `807da8ef42594d3e0b2f8b788f66bed894483d21` passes syntax, build and
11 units. Five focused actual Edge cases pass in 1.1m and the same five pass
with explicit Chromium/SwiftShader in 2.2m. Expanded fullscreen refusal,
continuously updated native pixels, real input and both exit paths pass in
46.3s, retaining all original autosave/slots/restart checks.

Checks cover true monochrome bezel pixels, raised matching-plastic maker
geometry, distinct named icons, 44px two-row phone layout, header-aligned
notices, 960x640 startup sampling, centered/contained orbits and a real wordmark
wave with a static reduced-motion alternative. Actual captures were reviewed.
These are technical checks, not user aesthetic approval or physical-device tests.

The first Pages `41819504285` attempt passes build and the complete 19-case
first shard. The second passes 17/18 but hits its unchanged 600-second global
limit before the final mobile-inspection case completes; deployment is skipped.
That exact remaining case independently passes local explicit SwiftShader in
29.5s, not a hosted-gate substitute. GitHub refuses the credential's normal retry
because administrator rights are required. The user manually reran it.
Authorized attempt 2 succeeds: build, both complete browser shards (19+18)
and actual deployment, with unchanged coverage, gates, limits and source.

Independent production verification matches all 28 exact public assets against
that source. Five actual Edge cases pass in 1.2m, including live fullscreen
pixels before/after real native input, both exits, refused-request recovery,
unchanged runtime, slots/autosave/restart, physical branding, header notices,
responsive controls, sharp waving startup and remembered power. Actual public
pickup/inspection, startup, insertion and lighting footage is refreshed with
only the original Pixel Lab cartridge. The unchanged transparent banner remains.
Two additional production lighting/pressed-cap cases pass in 16.3s, providing
current comparison figures without changing the existing physical assertions.

## Previous command-dock release

Application `1785a15936b9bb7328a415bdb6fae12204c6bcdc` is deployed by
Pages `41803699865`: build, 11 units, both complete browser shards (18+17) and deploy
PASS. Before publication the full Edge suite passed 35/35 in 6.6m; final focused
Chromium/SwiftShader checks passed 9/9 in 5.2m.

Independent production verification matched all 26 exact public asset hashes
against that source and passed eight real Edge cases in 2.0m: icon accessibility/
44px targets/two-row 320px layout/fullscreen/section shortcuts, checked independent
slots, actual core ratio/toggle calls at 1x/2x/3x/4x, 16 seconds with autosave disabled,
exact retained paused-LCD restoration, fresh physical restart identity, persistent
autosave and slot data after reload, native settings, actual logo/star rendering,
static reduced motion, supplied image identity and startup/power geometry.
The storage-only case uses synthetic bytes; real save/restore/restart cases use
the original Pixel Lab core. Native `screenshot()` can wait indefinitely while
paused, so the new paused restore check reads the already retained actual LCD.

`quick-controls.png` and `quick-controls-mobile.png` show the deployed icon dock;
startup/native figures were refreshed from actual production-browser captures.
Other refreshed geometry/lighting figures come from the complete local browser
run against the verified source implementation. Technical/visual review is not
human aesthetic acceptance or physical-phone qualification.

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
- Exact supplied purple orbital PNG identity, actual alpha/transparent corners,
  retained opaque white lettering and natural aspect ratio, plus no header/status
  overlap at 1440/390/320px.
- Actual raycast depth at control gaps, rendered resting/pressed cap illumination
  for A/B/Start/Select and four D-pad directions, and lamp-off cap darkness.
- Paper/wood lantern geometry and roughly four-handheld-width height, unchanged
  shell scale, warm rendered wood, independent default-off room lights and no
  console power/runtime changes when switching either light.
- Desktop/phone viewport rays hitting actual room surfaces, closer projected
  handheld, solid thick slab and a lower-right ray entering open room below it.
- Half-sized bezel gaps, native 3:2 display/emitter dimensions and actual larger
  front power control with minimum 44px targets at four viewport sizes.

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

## Cozy paper lantern, full-width room and visible power, 2026-11-04

The user rejected the initial lighting, toy-sized lamp and then distant camera.
The final lamp is roughly four handheld widths tall; the handheld geometry,
scale and normal play camera remain unchanged. The closer resting view can
clip the lantern. A full-width warm wall and actual 2.4-unit wooden slab leave
visible open space below the front edge, with the floor at Y=-35.
The cream power slider faces forward, and the 4.05-by-2.7 LCD retains native
mapping while approximately halving bezel gaps. Live captures were reviewed;
technical verification does not imply the user likes the new appearance.

Earlier normal release gates failed without deployment: `41787023852`,
`41788355821`, `41789943580`, `41791995049`, `41793811180`.
Actual traces exposed a 2.36-2.5s draw stall skipping insertion, transient
startup-canvas reads and an idle-settling race. Corrections retain the original
early-pose, ink, brightness and native/save assertions. Storage opens before
expensive graphics construction, preserving the existing timeout/error path.
Startup evidence samples real pixels inside original `fillText`; idle checks
wait for pending redraw/shadow work. One shadow map replaces six cubemap passes.
Insertion/framing share presented-frame time with 500ms maximum advances.
The initial 250ms bound required too many slow paints on cold refresh; the
final bound retains the early visible pose and existing seating deadline.
An added assertion verifies the same early pose after actual refresh.

Syntax/build, all ten units and focused Edge/explicit-software cases pass.
Source `4c98bc2335ab602e9c853ca31e281a06cec0d1d7` passes build, both full
browser shards (31 cases) and deployment in Pages `41795216070`.
Independent live verification matches all 23 exact public assets. Six live
room/power/LCD/pressed/native/CRT/startup cases pass in 1.4m; three additional
desktop/phone insertion and picking/inspection cases pass in 45.0s.
The live table/play/room contact sheet and refreshed public images were reviewed
without storage warnings. Public docs/TODO/ledger follow that verified deployment.
See `TODO/17_COZY_ROOM_AND_VISIBLE_POWER.todo`.

## Supplied purple orbital wordmark, 2026-11-04

The later supplied transparent logo replaces the first extracted wordmark.
Its exact 2170x725 RGBA file is retained byte-for-byte, SHA-256
`de93ade069a3f7f949497f057e48892aaceb9e9ff38b35026c4bebe017cef1a1`.
HTML intrinsic dimensions change; responsive CSS and all scene/runtime/startup
sources remain unchanged. The earlier two-disconnected-components assertion
does not describe the new intentionally connected orbit. The replacement check
verifies exact supplied file identity, real alpha, four transparent corners,
white glyph pixels, natural aspect and the same three actual header widths.
Future color variants are not enabled or included in the static build.

Syntax/build pass; two focused Edge logo/startup cases pass in 17.1s, and two
explicit-software cases in 45.9s. Source
`9ccc3a6dcb603c52c5d7fefe201aa5546ebafbe0` passes build, all ten units, both
complete browser shards (31 cases) and deployment in Pages `41798303662`.
Independent live verification matches all 23 exact public assets and passes
both actual logo/startup cases in 26.6s. Deployed desktop/320px headers were
visually reviewed. Final provenance/TODO/ledger and refreshed startup figure
follow that deployment, without claiming new user visual acceptance.
See `TODO/18_ORBITAL_WORDMARK.todo`.

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
