# BowserBOY verification scope

The prototype has separate evidence layers. Test coverage alone is neither
human acceptance nor deployment; the actual release evidence is recorded below.

The [engineering book](book/README.md) explains the mechanisms and failure
lessons. Its source edition and local preview media do not replace this release
record or constitute fresh execution of historical tests.

## Current follow-up and manual-release status, 2026-11-07

### Published recovery: 92 passed, 17 explicitly parked

Exact source `71545469be6956687dc2166a33e30ba48bd346a1`,
[Pages42363020619](https://github.com/Zanark/BowserBoy/actions/runs/42363020619),
completes **92 passed /17 skipped /0 failed /0 did not run** across all19
actual shard summaries. Build and deployment succeed with their original
prerequisites. Both formerly suite-aborted isolation/resize cases pass.
The site is live at **https://zanark.github.io/BowserBoy/**.

All **46 public runtime-file and directory-entry byte comparisons match**
committed source/build inputs, including original deterministic demo ROMs.
The verifier also checks `.nojekyll`; that additional check returns404, and
the downloaded Pages artifact omits this build-only marker. The complete
47-check verifier therefore has one explicit exception, not47passes.
Both original startup-cover cases pass against actual Pages: held branding
and GPU completion, desktop shimmer, reduced-motion phone, complete scene
readiness and pickup.

The17parked cases remain open under
[issue104](https://github.com/Zanark/BowserBoy/issues/104); deployment does
not restore those scenarios or establish owner visual acceptance. There is
no all-local-tests-passing claim. The following pending-publication and
qualification descriptions are historical and superseded by this result.

### Deployment recovery: one attempt, then explicitly park recurring failures

The owner's latest instruction supersedes the earlier requirement for every
local case to pass before deployment. Attempt a repair once; if the same case
fails again, explicitly skip and track it for later. Skipped coverage is not
fixed coverage. Keep the build and remaining browser verification as deployment
prerequisites, with unchanged assertions, rendering resolution and deadlines.

The nine failures from Pages42354807179 have been inspected through their
actual trace artifacts. The first bounded CI repair selected ANGLE SwiftShader
explicitly instead of relying on Chromium's automatic software fallback.
This is the same full-resolution backend used for local software qualification;
it is not a proven root-cause correction. Existing startup/GPU-readiness and
lighting-scheduling changes accompanied that run. Its actual failure and the
subsequent exact-SHA qualification are recorded below.

### First bounded attempt regressed; recovery remains in progress

Exact source `18ecdc0291a37267164efeaddc8775ed5b4834ae`,
[Pages42360102291](https://github.com/Zanark/BowserBoy/actions/runs/42360102291):
**52 passed /55 failed /2 did not run**, all19shards inspected. Build passed;
deployment was skipped. Explicit SwiftShader did not qualify and is reverted
to the preceding launch settings; this does not prove which changes caused
every failure.

Normal browser setup now waits for the real startup cover to finish within
the unchanged120s case budget. All15s assertions, full rendering quality and
deliberate startup-failure scenarios remain. The nine historical cases that
failed again are visibly skipped in CI, with individual reasons and
[parked follow-up105](../TODO/105_PARKED_BROWSER_CASES.todo). Local execution
remains enabled for eight; side-stylus also failed its local repair and is
parked there. The46newly failed cases receive one bounded qualification of
loader-aware setup, restored launch settings and the coupled DS fill repair;
they are not blanket-skipped.

The local109-case run completes **104 passed /5 failed**. The correction
removes artificial DS fill when room lights are off and compensates exposure
when on. Focused DS qualification gives **3 passed /1 failed**: LCD spill,
placement and reference lighting pass; side-stylus remains parked. Focused
startup/setup/scene qualification gives **11 passed /1 failed**: the physical-cap
fixture still fails complete-frame submission and is parked too, without
changing its assertions. **Ten CI skips; two local skips.** A passing complete
current-source local suite is not claimed. The next hosted attempt is recorded
below; these local results are historical qualification, not a final-source gate.

### Second hosted attempt: 90 passed, seven failures explicitly parked

Exact source `19f499643c9d02a0be219713ae0059d9fd531309`,
[Pages42361581620](https://github.com/Zanark/BowserBoy/actions/runs/42361581620):
**90 passed /7 failed /10 skipped /2 did not run** across all19shards.
Build passed; deployment was skipped. Loader-aware setup and restored launch
settings reduced55failures to7; this does not prove a single cause for them.

The remaining failures are native DS shoulder motion; flat-corner, rolled and
upside-down desktop stylus pixels; independent DS LCD spill; the original1000ms
light-response bound; and GBA LCD/control spill. These exact seven cases are
explicitly CI-parked under [issue104](https://github.com/Zanark/BowserBoy/issues/104),
without deleting or weakening their assertions. The key case previously did
not run; rolled/upside-down passed that preceding attempt. Do not describe every
failure as a second consecutive failure.

DS/GBA core isolation and deferred-paint resize did not run after the600s suite
limit; **neither is skipped**. Three existing native save/restart declarations
move after lighter DS cases to rebalance the same19test-level shards. Every
original case body, assertion, deadline, resolution and deployment prerequisite
is retained. The high-DPI phone stylus scenario also remains enabled.

Current declared coverage: **109 cases,17 CI skips,92 retained; two skips also
apply locally**. Fifteen parked cases remain locally runnable. This is coverage
debt, not a claim that those cases are fixed. The next exact-source retained
gate and actual deployment remain pending.
Local syntax, all59units and a fresh production build pass. Inventory comparison
retains all109original titles, and a line-multiset comparison preserves every
original nonblank test line. The exact CI exclusion selection executes
**17 skipped /0 failed**, with no extra selected cases; this verifies the
parking boundaries, not those scenarios' behavior.
The three moved save/restart cases and the retained deferred-paint resize
case also pass locally: **four passed /zero skipped,69.1seconds**. Both
previously suite-aborted scenarios remain executable. This does not substitute
for their hosted qualification.

### Earlier focused local qualification

The preceding unmodified103-case baseline passed locally. It does not qualify
later edits. The rebuilt final source adds six browser cases, retaining the
original quality, deadlines, retries0 and19hosted shards. Its historical local
outcome is104PASS/5FAIL, as recorded above; it is no longer running.
**Publication remains unestablished until an actual successful deployment.**

Focused startup checks pass for real delayed assets/GPU completion, desktop
shimmer, reduced-motion phone, module/branding failures and reload recovery.
Existing unavailable-WebGL recovery also passes. Real light switching paints
before reflection refresh, bypasses artificial recovery without weakening
GPU/native/modal gates, handles rapid input and introduces no switch-time
shader variant. The original strict GPU scheduling case passes.

A50%room-light increase washed out the DS lid; a20%increase also failed the
original cyan requirement. Final ceiling/fill132/22 is10%above original120/20.
Actual tabletop brightness and the unchanged warm/room DS color case pass.
No shell-material, exposure or existing color-assertion change masks this.

The three final affected DS cases pass in1.1minutes. Coverage includes actual
pale-green pixel saturation/brightness against prior variants, dark printed
legend pixels, metallic trim sharing real room reflections, square matte rear
pads and native Q/W from both scene/runtime focus. Rotated shoulder assemblies
press into the top edge and release correctly. Actual underside capture
reviewed: four green squares and a clear enlarged rear emblem; L/R no longer
form broad green rectangles on the underside. Owner acceptance remains open.

### DS header glow and larger rear emblem: focused qualification passes

The selected DS header gains a static dark-blue edge and blue halo; original
artwork, GBA/website styling and play hiding remain unchanged. The existing
underside plane increases from3.2 to4.5units with the original aspect,
center, orientation and material. Actual warm-background halo pixels and
emblem bounds/battery/edge clearance now pass; the rear capture is reviewed.

The owner's earlier local-first requirement is superseded by the bounded
repair/explicit-parking instruction above. The source
preview is available while work continues. The103-case baseline completed
before the newer edits; the final-source run is separate. Check/all59units/
fresh build pass. No local browser suite is currently active.

### Separate lighting dock: locally qualified, publication pending

Lamp, Room and Pear Boy now belong to their own warm, named Lighting dock.
The movable/collapsible console dock keeps GBA/DS-specific tools and palettes.
Existing handlers, light state, native input and rendering are unchanged.
Focused browser coverage checks actual lighting and brightness, both consoles,
play/Inspect/table, fullscreen, dock independence and responsive geometry.
Resize captures wait for the real scene to paint at its new dimensions, not
only for HTML control targets to fit. Four dock regressions pass Edge51.8s
and explicit full-size SwiftShader1.3m. After the final phone-play placement
change, rebuild the static site and repeat the two affected responsive/light-state
cases: **Edge38.4s / SwiftShader46.5s**. The final actual DS320px capture was
reviewed: the room and console are painted, and lighting clears the upper screen.
Syntax, all59units, build, browser syntax and whitespace pass. The inventory is
103browser cases in8files; original19shards, deadlines, retries0 and full rendering
quality are retained. The published PDF is unchanged. Exact-source publication
and owner acceptance remain separate and unestablished.

Exact source **e042d1793365cfd2591f078e72a6f1d74bf4cedb** was pushed as Zanark.
[Automatic Pages42354807179](https://github.com/Zanark/BowserBoy/actions/runs/42354807179)
completed with build success and all19browser summaries totaling
**94passed /9failed; deployment SKIPPED**. The new lighting and responsive
dock cases pass hosted. The [actual issue97 final receipt](https://github.com/Zanark/BowserBoy/issues/97#issuecomment-6704481532)
records all nine observed failures; their root causes remain unestablished.

### DS directional D-pad: all four corrected scenarios pass hosted

The shared physical cross now rocks once per paint toward native held
directions rather than depressing flat four times. Diagonal tilt is bounded;
opposite inputs cancel their axis. Reduced center compression keeps the
visible cap above the deck, and elapsed-time damping returns it to exact rest.
The existing held-direction marks turn lime for dark-room readability, with
no added geometry, lights, render passes or animation loop. Native input and
GBA motion remain unchanged.

The complete native case forwards original `simulateInput` calls and checks
exact native4/5/6/7press/release from both scene and runtime keyboard focus.
Actual root-local edge heights prove which side lowers. Diagonal/opposite
holds, individual mark states, mixed pointer/keyboard ownership, release and
blur pass. Two focused units also cover deck clearance, ordinary caps,
elapsed-time motion and exact neutral/idle settling. Actual held/rest
screenshots were reviewed; the final held capture shows the readable mark.

Final source passes syntax/all59units/build/browser syntax/whitespace.
The new D-pad case, original complete DS placement/branding case and existing
native GBA remapping/sound/release case pass **Edge together1.2m**. Both DS
cases pass **explicit full-size SwiftShader together2.6m**, original
deadlines/retries0/quality. An earlier version passed the same coverage
before the actual visual review motivated the dark-room cue; final-source
qualification was repeated after that change, not a failed-case retry.
There are99browser cases using the unchanged19shards. The frozen published
PDF is unchanged. Actual issue96/Project1 membership/status/body/backlink
are verified OPEN/In progress. Exact-source deployment and owner acceptance
are not established by this local evidence.

Zanark source `c59de69`, automatic Pages **42350879338**, subsequently finishes
**92 passed / 7 failed; deployment skipped**. The new D-pad case fails too.
Its exact shard7 trace shows correct physical direction, marks and neutral
release for all scene arrows and runtime Up. Runtime Down reaches the original
native input just as the overall120s case budget expires. Boot takes about44s;
successive physical-pose evaluations repeatedly take6.5-6.8s. This establishes
an overpacked scenario's cumulative budget exhaustion, not a demonstrated
direction or rendering-performance fix. The other six DS/scene failures remain.

The correction independently boots four scenarios: scene cardinal keys,
runtime cardinal keys, diagonal/opposite holds, and mixed-source release/blur.
It preserves every original native transition/physical edge/mark assertion,
120s case and15s expectation deadlines, retries0, full viewport/rendering
quality and19shards. All four pass **Edge55.5s** and **explicit full-size
SwiftShader2.8m**. The inventory is now102cases. Production source is unchanged;
the corrected exact-source hosted gate was then monitored to completion.
Exact `5b250f2222d059828e3ee953d581550afe8098b3`,
[Pages42352239845](https://github.com/Zanark/BowserBoy/actions/runs/42352239845),
finishes **95 passed / 7 failed; deployment skipped**. **All four corrected
D-pad cases pass hosted.** The seven remaining failures concern audio reserve,
DS isolation, flat/upside-down stylus pixels, DS shell lighting, Pear edge feet
and final scene CRT reload readiness; this run establishes no remedy for them.
Actual issue96's [outcome receipt](https://github.com/Zanark/BowserBoy/issues/96#issuecomment-6704140938)
was verified. Full release qualification, publication and owner acceptance remain open.

### DS button clearance and A/S face keys: local qualification

Shift the complete ABXY diamond outward by0.2model units, retaining the cap
size, diamond spacing, screen dimensions and projected physical anchors.
The expanded complete placement/branding case now checks actual geometry
bounds, including bevels: every cap and socket clears the touchscreen border
by more than0.05units and the shell edge by more than0.1units; the D-pad
also clears the border. The actual front capture was visually reviewed.
No new render work, material change or per-frame correction is introduced.

DS A/S now mean Y/X; Q/W retain L/R without collisions. A new complete native
keyboard case focuses both the real scene canvas and the real runtime canvas.
It observes forwarded original `simulateInput` calls, checking distinct native
button1/9/10/11 down/up transitions, not a stubbed success. The iframe no longer
overlays GBA preferences onto fixed DS bindings. GBA defaults/remapping remain.

Both expanded geometry and new native-key cases pass Edge together40.6s and
explicit full-size SwiftShader together1.2m, original deadlines and retries0.
The existing real GBA remapping/sound/pointer-release case passes Edge22.3s.
Syntax,57unit tests, build, browser syntax and whitespace pass. The source revision's suite
contains98cases; existing19shards and release gates are retained. The frozen
published PDF is unchanged. Exact `89d905fd0a31de6f7364e75a73e0c607885497f9`
[Pages42348904006](https://github.com/Zanark/BowserBoy/actions/runs/42348904006)
finishes **89passed/9failed, deployment skipped**. Both directly affected
native-key and expanded-clearance cases pass hosted. Seven DS cases, scene
CRT final reload-readiness and Pear Boy's edge-foot sleeping/dangling predicate
fail; the latter is newly observed relative to the preceding run. GBA cold-boot
passes this time. No cause is established by these failures. Actual issue95's
[outcome receipt](https://github.com/Zanark/BowserBoy/issues/95#issuecomment-6703695208)
was independently verified. Publication and owner acceptance remain open.

### DS rear markings: local qualification, publication pending

The two actual outer-lid cutouts and inset floors are centered together.
The unchanged supplied transparent DS emblem now belongs to the lower-body
underside, facing outward in the clear area beside the battery cover rather
than following the upper hinge. Shell colors, materials, lights, screens,
controls and runtime paths are unchanged.

The expanded complete DS placement/branding case passes **Edge24.5s** and
**explicit SwiftShader48.1s**, full size/quality, original deadlines and
retries0. Actual rays hit both inset floors on the centerline, plain lid
between them, and the underside emblem. Base parenting and positive
battery-cover clearance pass. Existing pickup/return clearance, held-pointer
Inspect repaint, stylus geometry, material pixels, image alpha and console
palette assertions remain. The actual rear capture was visually reviewed
and added to the README. An initial anchored grep selected no cases; the
corrected selector executed once per backend, not a failed-case retry.

Syntax,56units, build, browser syntax and whitespace pass. Existing97cases/
19shards remain unchanged. The frozen published PDF is unchanged. Current
source publication and owner acceptance remain open.

Exact `6f5083a56a55d9ba526f8952811d4cfc8b44d7d7`
[Pages42346966278](https://github.com/Zanark/BowserBoy/actions/runs/42346966278)
finishes **failure:88passed/9failed**, deploy skipped. The expanded rear
placement/branding case passes hosted. Seven DS cases, the GBA cold-boot
case's final native upload readiness, and the scene CRT case's final reload
readiness fail. The complete unchanged GBA case subsequently passes locally
once on explicit SwiftShader1.1m; hosted cause/remedy remains unproved.
Actual issue94's [outcome receipt](https://github.com/Zanark/BowserBoy/issues/94#issuecomment-6703473580)
was independently verified. This is not a successful publication.

### Pre-cartridge CRT: local qualification, publication pending

The built-in startup and GBA/DS status canvases now bake a cached RGB
phosphor/scanline mask and soft vignette into existing drawing. Two bounded
fills add placeholder drawing cost; there is no additional animation,
room render pass, pixel readback or per-game-frame processing. Native
framebuffer replacement removes the complete baked placeholder.

The existing startup and native CRT cases pass Edge33.1s and explicitly
verified ANGLE SwiftShader71.441s at1440x1100, original deadlines/retries0.
Expanded startup assertions pass Edge18.6s/software32.990s: actual startup
scanline contrast5.306, idle3.667, exactly one pattern per canvas, and idle
texture version1 unchanged. Neutral-gray pixels verify separate RGB columns
and shaded corners; caller alpha/composite restoration and one cache
replacement after resizing also pass. Calling the actual DS status method
on a disposable two-screen fixture gives contrast5.444each at192logical
rows. This fixture is not a native DS gameplay qualification.

All nine actual native presets retain direct native-canvas texture identity.
Unfiltered produces a flat native background, without a second host effect.
The final generated startup capture was visually reviewed. Syntax,56units,
build and whitespace pass;97cases/19shards and all release gates remain.
The frozen published PDF remains unchanged.

The preceding `6b5d2c552e6b3206bfb3ae36d845896773147a1c` run,
[Pages42342237115](https://github.com/Zanark/BowserBoy/actions/runs/42342237115),
finishes **failure:87passed/10failed**, deployment skipped. Nine DS cases
and one Pear case remain unresolved; CRT styling does not claim to fix them.
Current-source hosted qualification and owner visual acceptance remain open.

Subsequent exact `06e9c8240b6f3a8c5e2c91a408db0be61ccdfef2`
[Pages42345206094](https://github.com/Zanark/BowserBoy/actions/runs/42345206094)
completes **failure:87passed/10failed**, build and14verification shards
passing, deployment skipped. Both expanded CRT cases pass hosted. Nine
DS cases and the existing scene CRT case's final reload-readiness assertion
at line1341 fail. Its earlier native framebuffer, border, shader-switching
and Unfiltered checks reach the final reload; the full original case then
passes locally once38.3s using the explicit SwiftShader configuration and
unchanged full-quality assertions/deadlines/retries0. The hosted failure is
not reproduced or causally resolved. Actual issue93
[outcome receipt](https://github.com/Zanark/BowserBoy/issues/93#issuecomment-6703244856)
is independently verified; local success does not replace this failed gate.

### Exact boundary restoration; DS software latency remains open

Corrective `120d9bd5a3e785d24a9bdc5e96d6e9b332613510`,
[Pages42340494361](https://github.com/Zanark/BowserBoy/actions/runs/42340494361),
finishes **failure:88passed/9failed**: build and14of19verification shards
pass; deployment is skipped. All three clearance cases and the actual-paint
Pear regression pass hosted. There is no new qualified publication.

The GBA movement failure is its *inactive DS* exact return: X changes from
`11.314174109565958` to `11.31417410956596`, one ULP. Moved GBA restoration
passes. A focused negative control reproduces an old legal edge becoming
strict obstacle interior after reconstructed bounds move one ULP. Production
boundary classification now allows only scale-relative `8*Number.EPSILON`
roundoff, not a smaller geometric gap or weaker pose assertions. Genuine
`.01`-unit penetration still displaces the model clear. Syntax,56units, build
and whitespace pass; full-size verified-software actual GBA move/exact return
passes26.9s and all three actual clearance cases pass44.5s.

DS traces still expose6-8s input/evaluate operations and12-15s mode changes.
The quick probe takes3265ms against its original1500ms deadline. Disabling
trace screencasts also fails that unchanged case; the experiment is rejected.
Full-resolution software profiling measures2139.8-2206.7ms actual room
completion using `readPixels`. Earlier1-5ms `gl.finish`-only timings did not
drain that workload and do not establish fast rendering. Native readback can
drain queued room work in2963.8ms, versus3.8ms after the queue is drained.
Excluding only zero-intensity emitters reaches1825.1-1905.5ms steady but costs
4669.1ms on the first new shader variant, still insufficient for the quick
gate; no production lighting change is retained. Copies, light sampling and
clearance are not measured CPU hotspots. These are bounded observations,
not a completed general performance diagnosis or correction.

All97cases/19shards, original native/physical assertions, deadlines, retries0,
fullDPR, materials, lighting and public trace settings remain unchanged.

### Clearance recovery: local results are not publication

Exact clearance source `85c0cc9ed8f9083868df77b01adb5e80c49435df`,
[Pages42338001528](https://github.com/Zanark/BowserBoy/actions/runs/42338001528),
finishes **failure:85passed/11failed**, build and12browser shards passing,
seven failing; deployment skipped. All three new geometry cases pass hosted3.

Instrumentation finds48physics steps complete an entire fall/rebound without
one main-room render. Physical drops now retain their actual descending and
first rising poses until the main renderer submits them, keeping unconsumed
fixed-step time. This does not fabricate poses, change gravity or lower quality.
Two regressions fail without the source fix and pass afterward;55units pass.
Four affected verified-SwiftShader cases pass68.304s, including actual submitted
Pear falling/rising/grounded poses, DS drop/exact return and phone movement.

Per-page/per-mount native Frame reuse replaces detached power-cycle frames.
Actual DS boot/buttons/physical stylus passes78.309s. A broader seven-case
software gate passes six: GBA movement, isolated DS/GBA power cycling,
held stylus, hinge, branding and controlled photometry. Quick taps fail the
unchanged1500ms bound: the first predicate returns all correct native/copied
marks after2696ms. Real homebrew-readiness and batched-readback experiments
also fail and are rejected; the original quick-tap test remains unchanged.
Neither timeout nor varying passes establishes wrong coordinates or a
production responsiveness improvement. Software quick latency remains open.

Reference shell lighting previously fixes DS/camera poses but leaves the
movable Pear emitter dependent on clearance. Its root movesX15.3to18.810796.
Actual deck blue mean30becomes37.75when only historical emitter world positions
are restored; restoring the full historical Pear gives42.5. Every sample hits
the real metallic deck. The controlled fixture now fixes original emitter
positions while retaining legal body clearance, original RGB/luminance
thresholds and unchanged production lights/materials. Its software case passes;
this is reference isolation, not a production brightness improvement.

The hosted dark-room monolith spends64.098s in synthetic GPU-budget checks
after physical/UI work, leaving~15s for its next independent phase.
Separate physical lamp/UI and GPU-fence/recovery/native-operation contracts;
both pass verified SwiftShader80.393s total. Every original assertion and each
120s deadline/retries0/full-resolution setting remains. Exact list audit finds
**97unique cases assigned once across19unchanged shards**, no missing,
duplicate or extra assignments. No current-source deployment is yet qualified.

### Mode-based model clearance

Workstream93adds physical horizontal clearance before actual room paints.
Both consoles take precedence over pear-boy in play/Inspect; on the stable
table the order is pear-boy, loose props, then consoles. The active focus
pose is not moved, and temporary focus displacement does not overwrite
saved console table positions. This is geometry-based separation, not a
depth-test, render-order, visibility or resolution workaround.

Three new actual-paint geometry regressions pass Edge, including sleeping
Pear, body/hinge rotation, table precedence, saved poses and explicit Pear
reset/movement superseding a focus snapshot. They also pass on an explicitly
verified ANGLE SwiftShader backend at1440x1100,46.2s. Seven new unit cases
cover multi-obstacle corners, empty/full workspaces, unchanged height/inputs
and a floating-point tie that previously flipped a prop11.2277units.

The affected17case Edge gate initially passes13and fails4. Two old assertions
contradict the requested priority: Pear now displaces consoles on the table,
and inactive consoles may yield temporarily while retaining their exact
saved table pose. Corresponding assertions now check real separation and
exact saved/restored poses. Phone and edge fixtures retain their lift/clamp
requirements while using an unobstructed gesture and enough keyboard steps.
The original phone gesture intersects the fixed lamp (X overlap0.27450,
Z overlap2.63984) from the unchanged GBA home; mirroring its horizontal
delta preserves the actual lift assertion without moving through the lamp.
Ten0.65-unit Pear steps from7.3and back return7.3, not7.5; the eleventh
downward step now genuinely exercises the unchanged7.5workspace clamp.
The four corrected interaction cases pass45.8s; failures are retained as development
evidence, not silently counted as an original17/17run. The original thirteen
passes include all four native/physical DS orientation probes, deferred touch
mapping, hinge, branding, sparse transition, keyboard movement and Pear descent.
The existing DS placement/branding/lift/inspection case also passes27.9s.

Syntax,51unit cases, build and whitespace pass. All93original browser cases
remain alongside3new ones:96cases, each assigned exactly once across the
unchanged19shards. Deadlines, retries0, full-resolution rendering and native
pixel assertions remain unchanged. No publication or owner visual acceptance
is inferred; historical native/performance failures below remain separate.

### Console selector logo palettes

The GBA/DS picker now follows the supplied BowserBOY artwork: purple/magenta/
lavender for GBA, electric blue/cyan/white for DS. Only the selected button
glows; hover and keyboard focus use that button's accent. The artwork,
physical console materials, layout and PROTOTYPE label are unchanged.

Syntax,44unit tests, build, browser-file syntax and whitespace pass. The
existing real placement/branding case passes Edge24.4s, including each
button's hue relationships, selected-only glows and exact GBA restoration.
A separate actual-markup/stylesheet fixture passes1440/390px containment,
at-least44px targets, both selections, hover, visible3px keyboard focus and
disabled state. A crop from the actual full-app screenshot is visually
reviewed. Styling-fixture results do not establish native input performance,
owner aesthetic acceptance or publication. Workstream92retains that boundary;
the existing recovery failures below remain open.

Exact committed/pushed palette source
`617e8d22a5bd2eb8f34eed97f76c97aa2f73eb48` is monitored through normal
[Pages42334881724](https://github.com/Zanark/BowserBoy/actions/runs/42334881724).
The complete actual placement/branding/palette case **passes hosted shard9**.
The overall gate nevertheless fails and deployment is skipped; these colors
are not qualified as newly published.

### Hosted recovery remains blocked

Previous palette source `617e8d2`, Pages42334881724, finishes **failure**:
build and15browser shards pass, four fail6/8/11/16;88cases pass/5fail.
DS Inspect remains `moving` after15s; upside-down physical-pixel probing,
complete quick taps and dark-room insertion exhaust120s. Pear descent lacks
the required visible falling sample. All corrected cap cases pass17.
Flat/rolled/high-DPI precision, pen, hinge and other variable successes in
this run do not establish a performance correction from selector CSS.
Deployment is skipped; preserve all93cases/19shards, retries0, deadlines
and full-resolution/native/physical assertions. No new public smoke can
qualify this source until genuine publication succeeds.

Exact cap-fixture source `7bc93c56fc63efd647a7ee6f4115011542e14fa4`,
[Pages42333210355](https://github.com/Zanark/BowserBoy/actions/runs/42333210355),
finishes **failure**: build and11browser shards pass, eight fail;
81cases pass/12fail and deployment is skipped. All three corrected cap cases
now pass hosted shard17. Shell/fullscreen pause also passes this run and
passes unchanged local Edge20.4s/SwiftShader33.4s; its previous hosted
failure is not reproduced or diagnosed by those local successes.

DS Inspect/pose/placement transitions still exceed15s in `moving`.
Flat/rolled/upside-down physical precision, quick taps, held-pen lifecycle,
shell lighting and dark-room work exhaust120s; pear visible descent and GBA
CRT reload readiness also fail. The earlier hosted quick pass is not
reproducible across these runs. No new wrong-coordinate diagnosis follows
from timeout alone. Preserve the failures and all original deadlines,
93cases,19shards, retries0 and full-resolution rendering.
No successful current-source deployment or public touchscreen qualification.

Exact guarded source `836fc093bc4e72b06898e983cdf524c8fe772047`,
[Pages42331132482](https://github.com/Zanark/BowserBoy/actions/runs/42331132482),
finishes **failure**: build and11browser shards pass, eight fail, with
81passed/12failed cases overall; deployment is skipped. Complete quick taps,
upside-down/high-DPI precision, pen, hinge and independent LCD spill pass in
this run. Flat/rolled precision and other DS lifecycle/shell cases still
exhaust deadlines; GBA pause/reload and pear bounce also fail. Changing
hosted outcomes do not establish that the remaining performance problem is fixed.

Three cap-lighting cases fail a distinct fixture precondition on their first
rest sample: real recovery waiting does not advance `lastRender`, so a
timestamp based on `lastRender + 250` can precede `nextPaint`.
The follow-up establishes that first interval from actual `performance.now()`
after recovery; subsequent intervals and strict supplied-time validation remain.
No synthetic future timestamp, extra render, relaxed assertion or deadline
is introduced. All three affected cases pass serially on Edge26.384s and
SwiftShader84.202s, retries0. Syntax,44unit tests, build and whitespace pass;
the inventory stays93cases/19shards. This qualifies the bounded fixture
correction, not the remaining software latency or hosted failures.
Full hosted recovery and new publication remain unqualified.

Exact source `046defd56b42eb57de2941a01a49d39a1e5ea627`,
[Pages42327809794](https://github.com/Zanark/BowserBoy/actions/runs/42327809794),
regresses to **failure**: build and browser shard1 pass,18browser shards fail,
deployment is skipped. Readiness traces spend their15s budgets resolving the
native iframe; they do not establish native `ready:false` or core starvation.
Unconditional immediate post-fence painting is therefore not qualified.

A bounded follow-up retains immediate eligibility for completed-fence
observations up to100ms and restores original severe-stall headroom above
that boundary (twice elapsed, capped1000ms stationary/200ms moving).
Actual full-DPR2 hardware observations before this guard are median56.7ms,
p9579.7ms,max95.1ms; the same SwiftShader workload observes6.778/14.210s
completion gaps and only287native frames in12.129s. These include callback
scheduling, not pure GPU timers or hosted measurements.
The guard retains20.580roomFPS and598native frames in10.107s on AMD780M.
The guarded SwiftShader gate passes11of12cases in7.1m: four real
native/physical precision poses, four scheduling/motion cases and three
native GBA lighting/readiness cases. Quick taps still fail the unchanged
1500ms deadline: the first predicate returns all four native/copied marks
yellow only after2309ms. This is late correct output, not a passed latency gate.
Caching the controller instead of importing it inside the predicate also
fails; that experiment is rejected and leaves no test change.
The first guarded Edge gate passes21of23cases in5.7m, including every DS
case and native GBA CRT. Two manual-paint fixtures initially fail their actual
submission checks: an unnecessary completion observation can submit an extra
frame, and a fixed insertion loop requests mandatory paints after seating.
Observe only a pending fence and stop insertion work when motion ends.
All four affected scheduling/motion cases then pass Edge39.7s and
SwiftShader1.7m, retaining actual fences, DPR1/2, deadlines and one submission
per explicit fixture paint. The current inventory remains93distinct cases.
Its actual failed hosted outcome is recorded above.

Exact source `8b46c2c8eccf72331aef8b8fb221cf33d30385df`,
[Pages42324913149](https://github.com/Zanark/BowserBoy/actions/runs/42324913149),
finishes **failure**: build and12browser shards pass, seven fail, deployment
is skipped. Eight failed cases cover DS lifecycle, flat/upside-down physical
probes, held pen, hinge, cyan-shell screenshot, pear bounce and CRT reload.
The final flat physical probe actually returns true after11307.7ms; earlier
probes return true after5689.2/5747.2ms. Late correct pixels do not pass deadlines.

The owner's DS-lag report prompted isolated full-resolution profiling on Edge,
AMD Radeon780M,1440x1100CSS,DPR2. With every original light/material retained,
an original/bypass/restored experiment measures4.381/12.368/4.298actual roomFPS;
native frame advances remain612/605/607over roughly10seconds each. The bypass
changes only redundant recovery scheduling, retaining actual GPU fences.
The earlier unguarded experiment removes extra twice-elapsed idle after every
successfully completed fence and measures20.902FPS, with612native frames in10.047s;
two further phases measure22.660/20.319roomFPS and597/607native frames.
These are local hardware observations, not a60FPS or all-device guarantee.
No resolution, lighting, material, native-copy or input-queue change is made.
The no-fence fallback retains its previous recovery.

That earlier revision's browser regressions require immediate successful-fence eligibility,
including successive stationary draws and real DPR1/2fences. Manual-paint
fixtures no longer retry at a future recovery timestamp. Syntax,44units and
build pass. A nine-case full-resolution SwiftShader gate passes all four
native/physical precision poses and all four recovery/motion cases, but
**fails quick taps at the unchanged1500ms deadline**. Its first batch passes
in500.2ms; the second predicate takes1162.3ms with only the first native mark
yellow and the copied marks still green. The phone batch is not reached.
Do not report software/native responsiveness or deployment as qualified.
The subsequent Edge gate passes23cases in5.4m: full DS lifecycle, saves and
reload, all four precise poses, deferred-camera mapping, twelve quick contacts,
pen, spill, hinge/pose lock, phone framing, shell/branding, failure handling,
console movement, recovery regressions and actual native GBA CRT/reload.
The inventory audit still assigns93distinct file/title/project identities
exactly once to19shards (17x5+2x4). No deadline or retry changed.

Exact event-time-fixture source `5b34678bd7174feb16dc1d42818a5ffd8acc2391`,
[Pages42323482361](https://github.com/Zanark/BowserBoy/actions/runs/42323482361),
finishes **failure**: build and13browser shards pass, six fail; deployment
is skipped. Eight cases fail: DS lifecycle, upside-down precision, quick taps,
held pen, hinge transition, cyan-shell readiness, pear intermediate descent
and animated inspection branding. Flat/rolled precision, native reload,
fast-forward and CRT reload pass in this run; do not infer a production fix
for their earlier failures merely from this different hosted outcome.
The pear event-time recorder still fails its real descent assertion hosted.

A bounded fixture follow-up reuses the already booted native iframe within
each precision case, rather than repeatedly resolving its unchanged element.
The failed hosted trace spends about5.8s on individual `contentFrame` calls;
native screenshot work itself is not that stall. Every target still requires
a fresh native snapshot and actual physical-LCD readback. All four poses pass
SwiftShader2.7m; traces show one iframe resolution per case. Edge passes all
four plus reload1.4m. This does not qualify hosted120s performance.

The inspection-logo trace captures equal images about5.015s apart; its actual
72-frame APNG loops every5.04s. A fixed two-snapshot comparison can alias that
loop. Poll for a genuinely different rendered image under the existing15s
expectation deadline; retain the reduced-motion equality and280ms waits.
The unchanged full case passes SwiftShader15.8s and Edge13.0s.
No application rendering, case identity, configured deadline or retry changed.

Exact source `76ae3f8e3e7b887064923e79c89fd780e190ae92`,
[Pages42322152049](https://github.com/Zanark/BowserBoy/actions/runs/42322152049),
finishes **failure**: build and ten browser shards pass, nine fail;
deployment is skipped. Shard8 now passes the complete quick-tap case,
high-DPI phone precision, deferred-paint phone/stylus regression and independent
LCD spill. Its upside-down case verifies all three native marks and the first
two physical LCD pixels, but exhausts120s before the third physical probe.
Trace evaluations and even iframe retrieval repeatedly take about5.8-6seconds.
Other failures include flat/rolled precision, DS transitions/held pen/shell,
pear intermediate motion, GBA Inspect branding/fast-forward and CRT reload.
This is neither full hosted recovery nor a public release.

Two remaining fixtures now observe actual browser events before the next
automation round trip. The pear fall recorder is armed before pointer release
and starts from that real `pointerup`, preserving the descending/scared,
bounce and no-penetration assertions. It passes independently in Edge9.6s
and SwiftShader10.1s. The DS reload case records emitted status-node text
before boot, so a later autosave cannot erase the resume notification before
the automation poll. It still requires the exact resume notice and the saved,
nondefault native framebuffer marker; Edge26.7s and SwiftShader33.5s pass.
Neither correction changes application behavior, coverage, retries or deadlines.

Exact source `8f7f665c8a9afeae53d6b60446ea68f47409f5db`,
[Pages42319766498](https://github.com/Zanark/BowserBoy/actions/runs/42319766498),
finishes **failure**: build and twelve browser shards pass, seven fail;
deployment is skipped. Its phone quick-tap projections are identical to the
previous failure. The matrix correction fixes a real defect, not this entire
failure. The remaining stale desktop stylus hotspot is only reprojected after
a room paint. Picking it up after resizing can move the LCD outside the visible
viewport. Extend the deferred-paint regression with real stylus pickup and DPR2,
and compare targets with the visible viewport, not just the canvas bounds.
This strengthened case fails before the hotspot correction (two probes are
offscreen), then passes when matrix synchronization also reprojects DS controls.
Six Edge precision/mapping/quick-tap cases pass in1.6m; syntax,44units/build pass.
The software mapping regression passes, but quick taps still exceed1500ms:
all second-batch native/copied marks are yellow after1604.5ms. The third phone
batch is not reached in that failed software case. Preserve this failure.
No new deployment or public qualification is claimed.

Exact source `34484498de6be19a48c5191c4d717035bf84a320`,
[Pages42317015074](https://github.com/Zanark/BowserBoy/actions/runs/42317015074),
also finishes **failure**: build and eleven browser shards pass, eight fail,
and deployment is skipped. The exact quick-tap trace now passes both desktop
batches in145.8ms/169.7ms. Its upside-down phone batch projects three targets
outside the canvas (clientX about-1,-43,-79); those contacts never reach native
input. This is distinct from the earlier successful-but-late pixel reads.

Resize and zoom move the camera immediately, but its world/inverse matrices
and model descendants previously waited for rendering. Synchronize those
matrices at camera changes, even while the GPU paint gate is closed.
A new no-paint, upside-down phone regression fails before the correction:
the intended(32,80) ray maps to(65,56), and the other two probes also shift.
After correction, that case and the complete native quick-tap case pass
together on Edge in34s; syntax,44units and build pass. The software regression
also passes, but quick taps still miss1500ms: second-batch native/copied marks
are correct after2200.5ms. This is not a software responsiveness pass.
Final Edge gate passes9cases/2.5m: all four native precision poses, deferred
camera mapping, quick taps, hinge locking, placement/branding and shell lighting.
GPU-aware fixtures now wait for actual completed room frames and recover
through production timing rather than clearing fences or fake submissions.
Synthetic request time must not lag behind actual transition creation; the
stationary1000ms recovery contract does not apply to an unfinished transition.
The software sparse-console fixture passes, then the complete dark-room
recovery case passes43.8s after baselining its outstanding insertion recovery.
The original six other passing software cases include both cap-light groups
and physical compression. Quick-tap latency is still not qualified.
Stable file/title/project inventory assigns all93cases exactly once across
19shards (17x5+2x4), with no missing, extra or duplicate identities.
Hosted recovery remains required; no new publication is claimed.

Exact source `728739eac4a168095ba095a6fbcab02d826bbadd`,
[Pages42306381192](https://github.com/Zanark/BowserBoy/actions/runs/42306381192),
finishes **failure**: build succeeds, eight browser shards pass, eleven fail,
and deployment is skipped. Local qualification below is not hosted success.

The quick-tap trace's first native/copied check returns false in117ms;
the next returns **true after3160.8ms**, exceeding the1500ms deadline.
The precision case passes native yellow-pixel and64-pixel brush assertions
at(120,90); its physical-render polls take2558.3ms/false and5099.9ms/true.
This evidence establishes delayed host evaluation, not a new UV-mapping or
native-contact-loss defect. Preserve input mapping and responsiveness gates.
New diagnostic output distinguishes each target's native and copied RGB.
Other failures include view transitions remaining `moving`, pear settling,
paint barriers and full-resolution readbacks. Investigation remains active.
Job19's CRT case fails its final post-reload scene-ready15s assertion;
the preceding native framebuffer, curved-border and flat-mode checks complete.
Do not conflate this failure with the separate all-preset menu case.

The original compound GBA lifecycle reaches its120s deadline at the final
post-reload boot. Isolate manual restore, portable backup and renamed reload
as independent native cases, retaining every original assertion and deadline.
The inventory audit finds **92 cases exactly once across19shards**
(16x5+3x4), without duplicates, omissions or extra selections.

The local correction counts ordinary play/Inspect transitions from their
request time, including a stalled first paint; only actual desk lifts require
a painted midpoint. Completion still follows the actual final render.
The stationary-recovery failure was reproduced before this correction.
Body/rope catch-up now accepts at most5seconds/600fixed120Hzsteps, with
multi-second trajectory-equivalence units. The pear-light fixture waits for
`lastPaint` advancement, not a global dirty flag that motion can renew.
Compound cap/LED checks are split into five independent cases, retaining all
original assertions and deadlines. Integrated syntax, **44 units** and build
pass. Five targeted SwiftShader motion cases and15related units pass, as does
the actual pear warm-light/pickup case in1.2m. The five split cap/LED/LCD
software cases pass separately in3.9m, full resolution, retries0.

The next five-case native software gate fails all five on **Wake Lock permission
request denied**. Transparent call-stack instrumentation identifies
`PlatformEmscriptenDoSetWakeLock` in the distributed `mgba-legacy-wasm.data`,
not the frontend loader or touchscreen projection. The adapter now disables
optional native screensaver inhibition with
`suspend_screensaver_enable = false`; OS screen-sleep permission must not be a
gameplay prerequisite. Global errors stay visible, and no permission is granted
or Wake Lock API replaced. Existing GBA manual-restore and DS quick-tap cases
explicitly deny that permission and assert denial before native boot.
The first corrected gate passes native GBA portable backup and renamed reload.
Its denial fixture incorrectly detaches its CDP session, clearing the override;
an isolated attached/denied versus detached/prompt probe proves the fixture
error. Retaining the session for the test context corrects it, and actual GBA
manual restore passes with denial explicitly asserted. The DS core also boots
with denial asserted; its remaining quick-tap failure has yellow at all four
native targets but stale green in every copied LCD target. Native sampling is
not the remaining fault: LCD copying was gated by expensive room paints.
Copy DS framebuffer halves independently of that room-paint recovery gate.
The subsequent full-resolution software quick-tap/corner gate still fails.
All four native and copied quick-tap targets are now yellow, but that
evaluation takes5093ms, exceeding1500ms. The flat precision case passes
its first two native/physical targets and the third native target, then
exhausts120s in a pointer-state evaluation. Trivial evaluations take4-10s.
This extraction corrects observed stale copies but does not yet qualify
responsiveness; investigate actual rendering stalls before publication.
The next targeted GPU-backpressure correction passes the full flat-corner
precision case. Quick taps still fail: all native/copied marks are yellow,
but their evaluation takes1977ms, beyond1500ms. Profiling identifies LCD
readback stalls around1.5s and boot GPU backlog up to32s.
The final bounded rendering handback again passes flat precision but fails
quick taps at3618ms despite correct pixels. A separate profile measures the
first native readback at2492ms versus3-5ms when idle; native drawImage costs
only0.1-0.3ms and copied-output readback about7ms. This supports GPU waiting,
not another coordinate correction.
Reject the unqualified tiled/snapshot presentation experiment: it still misses
the deadline and commits transition state before its complete frame finishes.
Remove its overlay, retained parent buffer and new helper. Keep only the
nonblocking single-full-frame fence scheduling and independent LCD copies.
The fresh minimal-fence Edge gate passes **all nine cases in2.8m**: four
locked precision poses, quick mouse/touch taps, held pen, independent LCD
spill, genuine denied-wake-lock GBA manual restore and native CRT Geom.
Fresh syntax, all44units and build also pass.
The subsequent two-case SwiftShader gate passes CRT Geom, including its
previously failing post-reload readiness check, but fails quick taps. Its
first four native/copied targets are all yellow; the predicate returns in
**1518.7ms**, still beyond1500ms. Keep this failure rather than rounding it
into success. Local Edge qualification is not software or hosted qualification.
The existing automatic nineteen-shard gate remains the publication barrier.

The original twelve-target precision case exhausts its120s total deadline
during its second corner, after the first native/physical target passes.
Split the four locked poses into independent cases and reuse each successful
native snapshot for its brush assertions. Retain all twelve targets, real held
mouse/touch drags, physical probes, dimensions and assertion deadlines.
Hosted/public qualification remains pending.

### Pickable DS pen, screen spill and original startup sound

The docked stylus has isolated hover glow and a camera-facing held visual;
its tip remains on the pointer ray without changing physical LCD coordinates.
Escape returns it before opening tools. The first combined regression exposed
the shared GBA menu listener taking Escape before the DS listener; retain
shared move/popover handling, then let the DS controller own its menu key.
Black emissive material has a default intensity of one, so the isolation
fixture checks its black emissive color instead of assuming zero intensity.
Gameplay hints use a single bottom-left line with responsive ellipsis.

Each DS LCD reuses the GBA's framebuffer-driven light sampler independently.
Construct emitters after the DS model, and hide off emitters rather than
leaving zero-intensity lights in the renderer's shader workload. Native
framebuffers, independent red/blue halves, white/black rendered control pixels,
hinge/body attachment and power-off cleanup have a passing browser case.
Dark-room captures distinguish native content from controlled paused fills.
No global exposure, room lighting or paint changes are part of this feature.

The new DS sound is an original overlapping sine-partial arpeggio, not a
manufacturer recording or the GBA's square-wave tune. Offline rendering
exposed a fixed exponential decay floor that made half volume nonlinear;
the floor now scales with volume. Audio fixtures wait for initial scene
readiness before rendering. Empty-slot power-on is a real powered-idle state,
not a firmware boot. Mute must remain editable without a running cartridge;
only configure a native core when one exists. Permission failures are visible.

The owner authorizes commit/push and monitored deployment. Existing Pages
Actions already discover the new cases and require all 19 browser shards
plus syntax/unit/build before deployment. No test exclusion, gate bypass or
manual tagged release is authorized. Final qualification/publication receipts
are recorded separately; automated sound checks are not listening approval.

Final syntax, **35 unit tests** and build pass. The final **five-case Edge
feature gate passes in 1.6m**: unchanged GBA startup14.2s, DS startup6.0s,
independent screen spill45.0s, hint layout3.6s and native held pen22.8s.
The pen case includes exact native yellow pixels, <.25CSSpx tip error,
camera-facing shaft, all return/cleanup paths and upside-down390x844DPR2touch.
Hints are checked at1440/390/320px. Actual desktop/phone pen and native/
controlled-fill dark-room captures were reviewed.

The preceding eight-case run passed native DS lifecycle, precise touch,
lighting, hints and hinge lock, but failed both audio fixtures and Escape
return. Those failures led to the corrections above, not relaxed assertions.
A later run passed GBA audio; it was stopped after discovering that the old
idle mute control remained disabled, before rebuilding the final five cases.
There is no claim of an all-eight pass, full local suite, physical-device
qualification, commercial compatibility or owner acceptance.

### Precise DS touchscreen input

**Quick-tap follow-up:** the owner rejects localhost Twin Lab responsiveness.
Eight ordinary clicks produce no yellow in native screenshots or copied LCDs,
despite correct coordinates and current served ROM bytes. Native down/up pairs
arrive0-0.3ms apart; the earlier held-pointer regression misses this sampling
failure. A new real quick-click case fails on the synchronous bridge. A queue
paced by two browser RAFs also fails: browser paints are not native core frames.
Use the pinned manager's `getFrameNum()` changes to separate queued samples.
Preserve separate contact edges/start/endpoints, coalesce only pending moves,
and immediately cancel pending contacts on input/lifecycle cancellation.

Four focused queue units pass, bringing the unit inventory to39. The expanded
native quick-tap case passes17.5s: twelve ordinary mouse/touch taps with/without
the picked-up pen, including upside-down390x844DPR2, reach native and naturally
copied lower LCD pixels. Each native down/up spans a core-frame change.
Existing four-pose held precision and pen lifecycle also pass in that gate.
The compound native lifecycle case hits its unchanged120s total deadline while
loading its final post-reload core; split physical input, backup restore,
retained-core/cold-power and checkpoint reload into independent cases while
retaining all behavior assertions. The final integrated Edge gate passes
10cases/4.5m, including all four split lifecycle scenarios, four-pose
precision, quick taps, hinge controls, actual DS branding and two existing
GBA quick-action lifecycle cases. Current43units/syntax/build pass.
Parallel investigation qualifies7motion Edge cases/2.0m, software-rendered
transition and edge-return/rope cases, and2software-rendered lighting
cases/47.2s. Lighting fixtures sample completed paints and isolate the pear
ambient contribution; production illumination is unchanged.
No hosted deployment or physical-phone acceptance is implied by local passes.

The new native regression first fails at requested pixel (200,150), even in
flat gameplay: the clicked pixel retains its green background. The old test
only required yellow pixels somewhere in a limited Y band. Twin Lab incorrectly
divided raw Y by 24, added 11 and clamped drawing into a smaller rectangle.
Correct both axes to the pinned generated-firmware calibration, center the
8x8 brush and bound only its origin to the actual framebuffer.

The stricter corner/drag checks expose two additional native-bridge defects.
The runtime's synthetic mouse-down takes focus and triggers immediate host
blur/release; captured message events and the release stack establish the cause.
Disable DS autofocus through the supported pinned-loader option, not by ignoring
real host blur. A held bottom-right touch still leaves native pen sampling off:
the browser input driver treats its inclusive viewport endpoints as offscreen.
Sample `width - 1`/`height - 1` away from those endpoints, retaining physical UVs.

An initial fixture used `.5`/`.65` instead of the zoom range's 50/65 units;
correcting those values let the native assertion reproduce the real fault.

Final syntax, **35 units** and build pass. Both affected native Edge cases
pass together in **1.6m** (50.7s lifecycle, 41.7s precision). The new case
requires fresh yellow output at 12 requested native pixels across four locked
body/hinge poses, including upside-down and the exact LCD corners. It checks
64px brush bounds within one native pixel of pointer quantization, retained
focus/capture and real held mouse/touch drags. A resized 390x844 viewport uses
DPR2 and browser-dispatched touch events at 65% zoom; desktop uses 50%.
The physical rendered LCD must also show yellow at the projected pointer,
with a 3x3 drawing-buffer footprint for antialiased subpixel corners.
An initial single-pixel/full-yellow physical sampler failed at a correctly
drawn antialiased corner; retain strict native assertions and account for the
real drawing-buffer footprint rather than changing the console geometry.
Earlier brush probes also counted neighboring old marks; separate the sample
locations instead of weakening the 64px native-brush requirement.

The companion case retains native buttons, both physical LCDs, folded-lid
rejection, save/export/restore, cold boot, reload and inactive-GBA isolation.
Actual upside-down desktop and high-DPI phone-sized captures were reviewed.
Twin Lab's content hash changes; old demo checkpoints remain isolated.
No commercial-game, physical-phone, exhaustive-orientation, full-suite, owner
approval or deployment claim. Lights/materials and the frozen book are unchanged.

### DS hinge, locked gameplay pose and visible power

All **35 units**, application syntax and build pass. The final bounded
**12-case Edge gate passes in 2.4m**: all six DS cases, all four console
movement cases and both GBA Inspect/reduced-motion regressions.
Native Twin Lab runs in a nondefault locked body/145-degree hinge pose:
both physical LCD pixels match the native frame, D-pad and real lower-screen
stylus input work, backup/restore and inactive-core pause survive, and the new
physical power button saves/removes/cold-boots the retained cartridge.
A 30-degree folded pose hides covered controls and rejects actual touchscreen
raycasts while the runtime input gate remains open.
Final review caught the lock blocking two-finger zoom as well as rotation.
Track pinch pointers without starting a locked rotation drag. The expanded
independent-pose case passes separately in 24.5s, including actual two-touch
zoom with an unchanged locked quaternion; syntax, all 35 units and build
also pass again after that correction.

The independent pose case covers real body and hinge drags, keyboard/range
limits, disabled locked edits, exact quaternion retention, table's 110-degree
hinge restoration, system switching, 390px resizing, power-target alignment
and minimum 44px sizing, unlock-to-flat and lock reset on reload. LCD sample
rays check both viewport fit and actual visibility against the DS and pear.
Actual flat/native, desktop Inspect and phone-panel captures were reviewed.

Intermediate qualification caught pear occlusion and DS/GBA lift intersections;
move the held DS left/above and delay sideways pickup until lifted. The old
color fixture incorrectly assumed a fixed gameplay angle/position. It now
explicitly recreates the original reference pose, position and camera without
changing any material, global lighting, hue/brightness or lighter-base assertion.
The reference checks pass under both warm and Room lighting. Metallic brightness
is angle-dependent: those thresholds are not a promise for every gameplay pose.

An initially overbroad gate also selected the unrelated GBA pressed-cap test.
Its lamp-off darkness assertion fails at 17.533 rather than below 5. Replaying
that exact test against committed HEAD source, HTML and CSS through browser
interception reproduces exactly 17.533. Leave it unchanged and record the
pre-existing failure; it is not part of the final 12-case result.
The first standalone baseline attempt used a 5s rather than configured 15s
expect timeout and stopped at startup; only the corrected replay reaches the
same darkness failure. No full-suite, real-phone, owner approval or deployment
claim. The frozen book and global lights/materials remain unchanged.

### Blue-cyan shell and lighter NDS-only base

The owner rejects the rendered green appearance, requests bright blue-cyan,
then asks to lighten only the NDS lower base. Lid #0077FF and lower-base
#40A0FF use paint-only reflection strength 20; .80 metalness/.35 roughness,
grain and clearcoat remain. GBA, global lights/exposure, LCDs, controls,
geometry and logos are unchanged.

The initial hex-only trials stayed dark or green. Reflection trials at 12
and 28 failed provisional brightness/hue checks; the latter also approached
neutral highlights. Actual shell-only measurements selected 20 and a bluer
pigment. Separate lid/deck bounds accommodate their different illumination,
not an average including brown scenery, green LCDs or lime controls.

The uniform blue-cyan material passed all five DS cases in 1.5m. After the
lighter-base follow-up, four DS cases pass in a 1.4m run; the new comparison
fixture fails because its return was accidentally nested in the sampler.
Correct that fixture, without changing production material or assertions:
the focused case then passes separately in 20.2s. It ray-checks eight visible
shell probes under warm and Room lighting, requires blue-dominant cyan and
separate lid/deck brightness, then renders the base in the lid's pigment
under identical lighting. The lighter base must improve weighted RGB
brightness by more than 15%; its real paint is restored in `finally`.

All 35 units, application syntax and build pass. Native DS pixels,
button/stylus/save/lifecycle/retry and 390px framing pass on the final
production material. Actual warm and native runtime captures were reviewed
and captioned in README. This is not a full-suite result, physical-phone
qualification, aesthetic approval or publication.

### Orientation-locked console movement

The requested commit/context checkpoint is `c996f7d`, made as Zanark before
this implementation. Both consoles now support independent pointer/touch
relocation, wheel depth, keyboard height/translation, gravity/drop, collision
rejection, cancellation and reset. Their desk quaternions remain fixed;
ordinary Inspect rotation and exact moved-position restoration are retained.

All **35 unit tests**, application syntax and build pass. A bounded **26-case
Edge gate** completed in **4.5m**: **25 passed**, with one outdated phone-dock
height expectation failing. The four new console cases all passed, including
wheel-only movement, real phone touch and the next dock tap, both exact
play/Inspect/table round trips, cancellation and occupied-position rejection.
The same gate passed all four DS and six pear cases, native mGBA input/saves,
cartridge/sparse-paint and desktop/mobile inspection regressions.

The 390px dock now has independent companion controls: seventeen 44px
buttons require three rows rather than the old two. The revised dock case
retains 44px targets, viewport bounds and physical-power clearance, and adds
320px table movement-popover reachability. It **passes separately in 14.3s**.
This is not a claim that the original 26-case run was entirely green or that
the full browser suite ran. A further DS movement pass regenerated its lost
capture for actual visual review; the captioned README image is that render.

Intermediate console qualification exposed interpolation residue in exact
saved poses, a projection fixture running before the first paint, and a
keyboard fixture crossing the actual lamp collider. Copy final transition
targets exactly, initialize camera orientation, wait for a real paint and use
an unobstructed route while retaining explicit collision checks. Accepted
wheel-only movement must mark the gesture as moved or release becomes a
click-to-play; the focused regression now covers that path.

Positions are session-only. Upright AABB contact is not angular rigid-body
physics, stable stacking, moving-support tracking or dynamic prop pushing.
Physical phones, owner aesthetic acceptance and public deployment remain
unqualified. Historical captures and the frozen book are unchanged.

### Whole-face tracking, seated edge and transparent DS emblem

Final `npx playwright test ds.spec.mjs pear-boy.spec.mjs`: **10 passed in 1.9m**,
all four DS cases and all six pear cases. This requalifies actual Twin Lab
pixels, buttons/stylus, saves/lifecycle/retry and 390px framing after the DS
pickup adjustment. Pear checks include the whole eye/mouth/freckle group,
default dangling feet, tabletop placement, return to the edge, reduced-motion
reset, real touch, diffuse warm wood pixels and visible free-3D falling.
All **34 working-tree unit tests**, application syntax and build pass.
The three original lamp/dark-room/LCD-spill cases passed in the preceding
combined gate; this is not a full-suite result.

The exact staged feature was then extracted without unrelated sparse-clock
or tracking edits. Its **30 unit tests**, syntax and build pass; a single
**13-case Edge gate passes in 2.6m**, combining all six pear, four DS and
three original lighting cases. This independently qualifies the committed
subset rather than relying on uncommitted changes elsewhere.

An intermediate rounded-edge fixture exposed feet asleep on an invisible
square-expanded ledge. Elliptical top/front contact lets overhanging feet
slide down instead. Keyboard steps now clear pointer-style throw momentum.
Light probes were moved from behind the new pear silhouette onto visible
wood; actual warmth/falloff requirements remain. Longer pointer travel
qualifies the same world-space lift thresholds in the closer framing.

The new foreground pear initially obscured DS inspection. A distant forward
trial made the shell too dark; a lateral camera trial still left occlusion.
Both were discarded. A modest forward held-DS placement preserves the
original front-facing camera, actual teal pixels and existing light rig.
The supplied Chrome Neon emblem has transparent browser-loaded corners,
2149x732 intrinsic dimensions and retained bright lettering/glow.

Actual final edge, interior, DS front and phone renders were reviewed.
Body physics remains upright/box-based, not a full rigid-body or cloth engine;
rope contacts cover the pear and desk, not arbitrary moving props.
Owner aesthetic acceptance, physical phones, push and deployment are not
qualified. Earlier results below retain their original scope and date.

### Earlier pear-boy local companion gate, 2026-11-06

One focused Edge gate passes **8 cases in 1.4m**: five pear cases plus original
lamp/dark-room/LCD-spill regressions. Real near/far desk pixels verify broader
warm illumination and brightness changes. Held-pointer pixels verify live
movement; real touch drag followed by a first dock tap works at 390px.
Checks cover longer thick ropes, anchors/endpoints, finite geometry, length
constraints, swing/sleep/reduced motion, cursor-following pixels, frightened
pickup/cancellation, depth movement, sampled falling/bounce frames and landing.
All **32 unit tests** pass; build and application syntax checks pass.
This is not a full browser-suite run or fresh DS-native qualification.

An intermediate gate found occasional stretched segments during pickup.
Constrain moved anchors even between fixed physics steps and allow bounded
iterations to converge after a large displacement. Add a rapid-pointer unit
regression. The earlier instantaneous pickup fixture exceeded the entire rope
length in one tick; use a within-reach pickup for the inertia assertion and
retain large teleports in the separate constrained-motion regression.
The original lamp's fabric probes needed a wider explicit desktop viewport
after adding the second console/pear; retain actual color and seam bounds.
Pear-off fixtures preserve the meaning of historical LCD-only darkness.

The actual table, scared and airborne renders are locally reviewed.
Body collisions are upright/box-based, not a full rigid-body simulation;
ropes do not collide with arbitrary prop surfaces or simulate moving supports.
Physical phones, owner aesthetic acceptance and public deployment are not
qualified. Historical captures and the frozen book keep their earlier epoch.

### Current local DS reference remodel

The rejected first model is superseded by the owner's later teal material
specification: #2A9D98, .80 metalness, .35 roughness, fine-grain clearcoat;
blue D-pad, lime controls, white labels, deep-blue slot trim and a clipped
stylus. The opening is approximately 110 degrees. The existing desk lighting,
background, GBA materials and full renderer resolution remain unchanged.
Warm lighting still affects perceived color and shadow brightness; this is
not a claim of a white-studio-render match or owner aesthetic approval.

One focused Edge gate passes **9 cases in 1.8m**: all four DS cases plus GBA
dock mouse/touch movement, animated/reduced-motion Inspect branding, separate
website/static-settings/DS branding and real mobile GBA inspection/input.
The DS cases retain real native/physical LCD pixels, touchscreen/buttons,
checkpoints/backups, both cores, pause isolation, cold boot, reload and CDN retry.
The added regression samples actual pickup/return renders for GBA clearance,
checks table cartridge separation and contact height, proves visible repaint
while the inspection pointer remains held down, and checks rear-only branding,
clipped stylus, teal physical pixels and dock theme restoration.
The 390px check projects all eight corners of the actual stylus bounds,
not endpoints from the superseded loose pen.

`npm test` passes **25 cases**; syntax, build and whitespace checks pass.
The nine-case browser gate is not a fresh full-suite result. Current table,
front/rear, real-runtime and mobile captures were visually reviewed together.
README screenshots now show this model. Historical GBA media and the frozen
96-page book were not regenerated.

An intermediate run exposed first-paint shader compilation starving IndexedDB
events beyond the existing 5s open deadline. Start rendering after DS storage
initialization instead of extending the timeout. The earlier blue-dominance
pixel assertion was replaced with teal-channel checks when the owner supplied
the new teal specification; real emulator and rendering assertions remain.
Physical phones, commercial games, timed DS autosave and owner approval remain
unqualified. No push or deployment is claimed.

### First DS prototype evidence (superseded visual model)

This working-tree milestone supersedes earlier DS-deferral statements, not the
published GBA evidence below. These observations preceded local commits; they
do not establish publication. The original BIOS-free **Twin Lab** ROM runs in the actual pinned
EmulatorJS 4.2.3/DeSmuME core; frames and input are not mocked.

- Final `npx playwright test ds.spec.mjs`: **3 passed in 57.2s**. Desktop checks
  actual native and physical LCD colors, buttons, touchscreen coordinates,
  checkpoint/export/import, both databases, GBA coexistence, pause isolation,
  power-off/cold boot and checkpoint recovery after a real page reload.
- The 390px case checks both separate models, both DS displays, controls and
  stylus endpoints without reducing renderer resolution. This is a desktop
  browser viewport, not qualification of physical-phone speed or touch hardware.
- The failure case aborts the runtime CDN, checks a visible retryable error,
  then boots successfully after retry. Reduced motion skips the insertion
  animation without skipping real loading.
- Six affected GBA cases passed in a separate broader gate: animated Inspect
  logo; quick actions/slots/restart; responsive shell/errors/private boundaries;
  native mGBA input/resume/export; physical/mixed input/fullscreen; and physical
  power/cold boot/reload. Both 1440px and 390px cartridge insertion cases also
  passed in focused gates. These are **11 distinct affected cases across runs**,
  not one complete eleven-case run or a fresh full-suite result.
- Final `npm test`: **25 passed**. `npm run check`, `npm run build` and
  `git diff --check` pass. The frozen 96-page book remains unchanged at SHA-256
  `25875beab7d925f9d014de89842b560216729c799e673f5a7218291aa75db1ad`.

Actual failures determined the fixes: the runtime start callback precedes its
first frame; the native 256x384 layout differs from the scaled WebGL canvas;
subscreen BG3 needs direct-color mode; and beveled recess geometry initially
occluded the physical LCD planes. Visual checks also exposed clipped stylus
framing. No render-resolution reduction or relaxed deadline was used.

An expanded lifecycle fixture initially expected an old checkpoint after
selecting the already-running cold-booted ROM. That contradicted intentional
save-before-replacement behavior. The corrected test proves actual reload
recovery instead. Its manual-save sequence disables DS background autosave to
avoid a separate 30-second overwrite race; this does not independently qualify
the DS automatic interval. Commercial games, gamepads and physical phones have
not been independently qualified. Owner aesthetic approval remains separate.

### Earlier hosted observations

Documentation audit, final hosted observation at 12:45 Asia/Kolkata:

- The owner has committed/pushed the manual release workflow as
  `9ff921be5d1b1d4a6657a181fc3ac84ea72373e7`; GitHub reports it active.
  Earlier "local only/not pushed" statements describe its implementation stage.
- Manual `v1.0.0` [run42179152331](https://github.com/Zanark/BowserBoyAdvance/actions/runs/42179152331)
  fails at **Require successful Pages verification for this exact source**.
  Checkout and identity validation pass; build/package/upload/publish do not run.
  The selected source's Pages run was not yet successful. The guard correctly
  refuses to package an unqualified revision. No GitHub Release is listed.
- Current [Pages run42179075618](https://github.com/Zanark/BowserBoyAdvance/actions/runs/42179075618)
  for `9ff921b` completes with **failure**; build passes and browser shard 15
  fails. Its log shows the 1440px cartridge/reload case expecting `"seated"`
  but receiving `"inserting"`. Deployment skips. The exact timing root cause
  is not established by that assertion. All eighteen other browser shards,
  including the prior CRT failure's shard 18, pass. No current-head deployment
  is claimed.
- Prior `55a5867` [run42139790805](https://github.com/Zanark/BowserBoyAdvance/actions/runs/42139790805)
  fails the desktop reload-seating expectation at 15s and the existing CRT
  native-framebuffer case at its 120s deadline. Deployment skips.
  The 56-case inventory is distributed exactly once across nineteen runners
  (18x3+1x2), with one worker, zero retries and unchanged deadlines.

The last independently qualified visual application below remains `1b0385b`.
Current source is not fully green merely because the same application/media
bytes previously passed. No retry, new release, deployment or CI workaround is
performed as part of this documentation audit.

## Current published warm-lamp/green-LED edition, 2026-11-06

Implementation `1b0385b384a1329fe643607c4874af88e5259001` is published through
[run42135170801](https://github.com/Zanark/BowserBoyAdvance/actions/runs/42135170801):
build, all nineteen browser shards and deployment succeed. Its 53-case
inventory is unchanged, with one worker per runner and no retries or relaxed
deadlines. The complete run takes **4m33s** (00:12:53-00:17:26 UTC);
individual browser steps take 28s-3m27s. This is one observed run, not a
controlled speedup over earlier failed ten-shard attempts.

Independent public verification matches all **30 deployed assets** to that
implementation. Four actual live Edge cases pass in **52.1s**: warm woven
lamp/independent room lighting, pressed-cap visibility, native mapped
input/LCD spill/green dark-Inspect LED/power off, and both fullscreen-return
paths. Actual GitHub homepage and immutable README inspection match all
**20 served image bodies**, including all eleven refreshed GIFs and the
unchanged approved logos. The new LCD-only GIF uses genuine native light.
The frozen v1.0.0 package and November 6 milestone date are unchanged.
Technical/public qualification does not imply user aesthetic approval.

The evidence-only follow-up `e5e14fc` subsequently fails run42136082685 in
the existing native export test; deployment correctly skips. The trace shows
the export control enabled just before clicking and disabled immediately
after, no download/export notice, and continuing automatic checkpoints.
The fixture now disables background autosaving during manual backup checks,
then explicitly reenables it before verifying the real automatic interval.
Export/import/ROM isolation/storage-failure assertions, resolution, retries
and deadlines are retained. The successful visual release above remains live.
The corrected real-native case passes locally in33.8s, including actual
export/import, reload/resume, automatic saving, ROM isolation and quota failure.

Follow-up `53a3a0e` still reaches120s during the compound native scenario
and final lighting screenshot. Two compound cases are therefore split into
four independent native scenarios: backup/resume/automatic save, cross-ROM/
quota/emergency export, mapped physical input, and green LED/native lighting.
All original behavior assertions remain; no application/media change,
resolution reduction or longer deadline is used. Current discovery audits
**55 cases exactly once** at that intermediate stage across the same nineteen
jobs (17x3+2x2).
The upload fixture also waits for actual scene startup readiness, rather
than an upload control briefly enabled before persisted-cartridge restoration.
Four focused local cases pass in31.3s/11.4s/14.9s/17.5s.
Run42138825789 subsequently reaches120s awaiting that backup case's final
automatic checkpoint; a reload-insertion case separately reaches its15s
seating assertion. The actual automatic interval is now its own native case,
retaining its20s expectation and the120s case deadline. Current inventory is
56 cases in nineteen jobs (18x3+1x2). Insertion checks/deadlines are unchanged.

The local/pending statements in earlier attempt records below describe their
original stage; this publication record supersedes them.

## Smaller green LED and current eleven-GIF showcase, 2026-11-06

The indicator radius is reduced from .09 to .055, with deeper green albedo
and a less glossy lens. A real dark-room recording revealed the initial
material change was insufficient: night adaptation increases exposure
from .018 to .45 and bleached the green emission white. Its emissive intensity
now compensates for that existing exposure; room exposure, LCD illumination,
render resolution and power-off behavior are unchanged.

Rendered green-dominance checks cover room-plus-lamp, lamp-only and fully
dark-adapted Inspect, alongside the retained real native-input, LCD-spill,
light direction and power-off checks. The lamp/native pair passes locally
in 35.9 seconds; the final actual dark-Inspect/native case passes in 24.3
seconds, with all twelve unit tests also passing.
All eleven GIFs and nine stills are freshly captured after the correction;
the new LCD-only clip uses actual room/lamp-off state and genuine dragging.
Bounded media review confirms a green night indicator and moving faint
surface light. See [media provenance](MEDIA.md) for the final receipt.
Hosted and public qualification remain separate.

## Warmer woven shade and nineteen-way CI, 2026-11-06

The shade now has a neutral white procedural fabric weave in both its color
and emission maps, with warmer cream shade/bulb emission. The texture is
periodic, low-contrast and grayscale, not the rejected brown mottling.
Actual full-size table capture is reviewed: the threads remain visible while
lit and the ash tripod stays visible. Existing bright-ivory/no-diagonal-seam
bounds remain; additional checks cover clean weave contrast and rendered warmth.
The lamp case passes in16.2s; the other four affected physical-lamp,
full-resolution, pressed-cap and native/LCD cases pass in57.5s.

The preceding corrected-header run42130747520 passes nine of ten browser
shards, but the fullscreen-return case reaches its unchanged120s deadline.
Its trace shows repeated6-8s full-resolution frame reads. Reuse the already
verified returned-LCD sample and let that image read also witness the second
advancing room paint. Both Escape/button paths, native-runtime identity,
actual LCD changes and left/right input checks remain. The corrected case
passes locally in16.8s. No low-resolution fallback or longer deadline is used.

The matrix increases from ten to nineteen independent one-worker jobs,
leaving one slot for build within the documented20-job Free-plan baseline.
CLI discovery proves all53 cases occur exactly once: fifteen three-case
shards and four two-case shards. YAML semantic comparison confirms the
matrix is the only workflow change; all deployment dependencies, retries,
deadlines and failure artifacts remain. This is increased parallelism,
not a measured hosted speedup. Actual pushed-run/public qualification is pending.

## Published README and header-check recovery, 2026-11-06

The owner pushes commit `64497155124b8ebb9a51651a9d1a9c1b1633f235`.
Fresh browser checks of the actual GitHub homepage and exact-commit README
confirm all 19 served image bodies match the committed assets, including
all ten refreshed GIFs. The rendered table shows the clean tripod lamp without
the removed header label. An older screenshot is not the current served media;
its exact client-side cache or tab mechanism has not been established.

[Run42129264382](https://github.com/Zanark/BowserBoyAdvance/actions/runs/42129264382)
passes build and eight of ten verification shards. Both failures are stale
tests of the deliberately removed `.desk-heading > span`: play-zoom geometry
dereferences a missing element, and responsive artwork waits for its bounds.
Deployment is correctly skipped. The repair removes the nonexistent zoom
obstacle, retains viewport/artwork/visibility coverage, and explicitly checks
that the removed label stays absent. Both affected Edge cases pass in
40.7 seconds; syntax and production build also pass.

This correction changes tests only, not the application, assets, renderer,
deadlines or deployment gates. A subsequent successful pushed workflow and
exact public application identity are still required. README publication
does not mean the updated application has deployed; the last qualified
application remains `c3d9dbdcc41341d126720ee6a26db5b824c90b24`.

## Clean STORSEGEL-style lamp and local showcase, 2026-11-06

The STORSEGEL update replaces the old tall lantern with a clean white
open drum shade, thin rims and three flat-footed ash legs. The diameter/height
follow the 18 cm/30 cm manufacturer reference. No wire geometry or mottled
shade map/emission map remains. Physical shade clicking and the toolbar
toggle all lamp sources independently of room lights, native power and saves.

Actual rendering found two issues that material inspection alone missed:
the smaller lamp initially dimmed an A-cap probe to 52.15 against the existing
60 minimum, corrected by transmitted-area intensity 180 -> 300; the emitter
plane intersected the fabric and caused a hard diagonal seam. Bounded
spot/shadow/sidedness/source-isolation probes identify the area source as the
cause. Moving that plane outside the shade removes the seam without changing
the camera or handheld. A separate downward, non-shadowing area source below
the open shade makes the wooden tripod visible instead of a black silhouette.

The final five affected Edge cases pass in approximately one minute:
physical lamp/light falloff/full-resolution recovery, clean tripod/independent
room lights, pressed controls, LCD-only spill and mapped inputs/native light.
The clean-lamp case is then extended with an actual visible ash-leg pixel
regression and passes again (13.7 seconds including runner startup).
Rendered fabric samples must stay bright ivory with per-channel spread <15;
the visible leg must exceed red=40 and retain its warm color. Geometry checks
retain three tabletop feet, an open shade and unchanged handheld scale.

Adding the under-shade source exposed an existing LCD-test synchronization
race: color within .001 could pass before the light's actual .00001 settling
condition, leaving a sampled black-transition channel at 1. The fixture now
also awaits `screenIllumination.settled`. Its black/off <1 assertion, other
light thresholds, deadlines and production LCD behavior are unchanged.
Syntax/build, all 12 units and capture-script syntax pass. No automatic
pixel-ratio reduction, new shadow pass, native/audio change or CI-gate
relaxation is introduced. An additional rectangular light has per-pixel cost;
this is not a new controlled performance or broad-device benchmark.

All ten README GIFs and nine stills are recaptured and encoded; exact scope,
source boundaries, sizes and bounded visual review are in
[media provenance](MEDIA.md#clean-storsegel-style-lamp-and-complete-refresh-2026-11-06).
Approved logo animations and the frozen v1.0.0 package are unchanged.
This records the original **local qualification, not human acceptance**.
The later README publication and pending application gate are recorded above.
The earlier qualified public deployment below remains the application baseline.

## First public release milestone, 2026-11-06

The owner designates the qualified application below as **v1.0.0**, the first
publicly available release. Version metadata and repository packaging follow
that designation; they are not a claim that the earlier deployment had a
v1.0.0 tag. [Release notes and package identity](releases/v1.0.0/README.md)
separate the live site, local archive and any future GitHub Release.
Conservative cleanup preserves source/assets/entry paths and existing media.

Package and lockfile metadata are synchronized at1.0.0; syntax, build and all
12 units pass. The local `releases/v1.0.0/BowserBOYADVANCED-v1.0.0-static.zip`
has33 entries and11807047bytes. All30 application assets match the previous
public qualification receipt. Windows checkout CRLF initially changes local
build bytes (`index.html`:17812 vs17660bytes,152CRLF pairs); comparison proves
LF normalization is the only difference. Packaging reads exact qualified Git
blobs instead, while retaining generated Pixel Lab and unmodified vendor bytes.
No application source or build behavior is changed to manufacture a match.

Every ZIP entry is round-trip checked; `manifest.json` records per-file hashes,
and `SHA256SUMS.txt` covers the ZIP and manifest. Two actual browser cases run
against the extracted archive over a local HTTP server pass in52.5seconds:
original native save/import/autosave/ROM-isolation and the actual-render
sharpness/recovery/light regression. This is new package qualification, not a
repeat of all53 hosted checks. The temporary server is stopped after the run.
Old generated test failure output is archived outside the repository without
deleting evidence. The docs hub maps source, documentation and generated paths.
No new tag, GitHub Release, push or deployment is performed.

## Full-resolution handheld rendering, 2026-11-06

**Released and public-qualified:** commit
`c3d9dbdcc41341d126720ee6a26db5b824c90b24`,
[run42115330741](https://github.com/Zanark/BowserBoyAdvance/actions/runs/42115330741).
All53 browser cases pass across ten isolated verification jobs; build and
deployment succeed. Queue-to-deployment takes6m18s
(21:44:18-21:50:36UTC). This is an observed release duration, not a controlled
measurement of shard-count speedup: rendering quality and workload changed.

All30 deployed assets match this exact revision, as do the published README
and two showcase GIFs. The actual public inspection retains pixel ratio2 and
a2880x2200 backing buffer for1440x1100CSS after forced severe/sustained stalls.
Full and lettering-detail captures were visually reviewed with no ROM loaded.
Five affected public browser cases pass in1.5minutes: original native
save/import/autosave/ROM-isolation, mapped controls/native lighting, both
insertion viewports including desktop reload, and the actual-render regression.
All release deadlines remain unchanged. This establishes technical/public
qualification, not human visual acceptance. The attempts below are historical.

The user explicitly rejects the blurred handheld. Automatic pixel-ratio
reduction is removed entirely: the renderer retains its initial
`min(devicePixelRatio, 2)` backing resolution in every mode. This supersedes
the adaptive-resolution mitigation recorded in the historical recovery below.
Idle-paint suppression, cached shadows and slow-frame recovery scheduling
remain; performance must not be purchased by degrading handheld sharpness.
No model, texture, material, logo or native-core resolution changes.

The existing actual-render regression now checks both 1x and 2x backing
resolution through isolated, severe and sustained scheduling stalls, alongside
the retained recovery, idle and physical-button assertions. It fails the old
source at 0.75 instead of 1, then passes the corrected source. Five actual
SwiftShader cases pass in 4.4 minutes: sharp rendering, both cartridge-insertion
viewports and both native quick-action flows. Build, syntax and all 12 units
pass. A separate actual 2x inspection retains a 2880x2200 buffer for its
1440x1100 CSS viewport after severe/sustained gaps; full/detail screenshots are
reviewed with no ROM loaded. This is local evidence, not deployed-site proof.

The ten-way run `42104749490` completes quickly but does not deploy: its VSync
test rejects a legitimate "Welcome back" checkpoint-restore notice as if every
ordinary notice must be hidden. The actual failure artifact contains that
non-error message, not a VSync warning. The test now specifically prohibits
VSync/error notices in ordinary settings while retaining all actual native
warning, persistence and user-choice checks. This case passes locally in
46.5 seconds; no application notice behavior is changed. The new normal gate
and subsequent public sharpness proof remain pending.

### Full-resolution gate recovery

Run `42107437027` executes all 53 browser cases: 50 pass and three fail, so
deployment is skipped. The failures are the native fast-forward/VSync clock
(3x measures 1.99894 times baseline), original save/import/ROM-isolation flow
(power is still disabled during the second upload), and mapped-controls/LCD
flow (120-second budget expires at the later Pause click). Logs and all three
failed shards' trace artifacts are retained; these are not public-site fixes.

Give settled playing-mode paints up to 1000 ms of recovery after expensive
draws instead of the former 200 ms ceiling. Transitions and cartridge animation
retain 200 ms, normal fast frames add no delay, and pixel density never changes.
The actual-render regression now checks this playing-mode branch at 2x:
it fails the old build because an extra paint occurs during the reserved
interval, then passes the correction. The corrected renderer, original
save/import/isolation flow, and mapped-controls/native-lighting flow pass
together under explicit SwiftShader; the four-case run takes 4.8 minutes but
still fails the separate native speed case on its final 1x sample (0.55338).

That native pacing fixture reopened the 3D loop between speed-menu clicks:
opening the drawer only suppresses paints while it remains open. Match the
existing hold-Space pacing fixture by stopping only the decorative scene loop
after native startup. Keep the actual cartridge frame clock, real controls,
native VSync setting, runtime identity and every multiplier bound unchanged.
The corrected native speed case passes in 34.0 seconds. Other scene/native
integration cases continue to run the full-resolution 3D renderer. Build,
syntax and all 12 units pass. Normal hosted gate and public proof are pending.

Run `42110569140` passes 51/53: all three previous native failures pass, but
desktop reload insertion and the new playing-recovery fixture fail. The
fixture had retained synthetic time across expensive 2x draws while `setView`
starts its transition from `performance.now()`. Rebase the synthetic render
timestamp when starting that transition; keep its recovery and density bounds.

Insertion exposed a real one-presented-frame lag. The clock advanced after a
draw, but the pose consumed that progress only on the following callback; a
skipped callback could even report seating before painting the final pose.
A new actual-render regression observes the last drawn cartridge at 1.63472
instead of seated Y=1.52 under capped, stalled frames. Compute the next eligible
paint's pose/camera from its next capped step, then commit the clock only after
drawing. Keep the 500ms cap, initial visible pose, intermediate slide stages,
850/1350ms choreography and full backing density. Recovery/modal callbacks
never advance the clock.

The corrected regression, both actual insertion viewports including desktop
reload, and original native save/import/ROM-isolation flow pass together:
four explicit SwiftShader cases in 2.9 minutes. Build, syntax and all 12 units
pass. No deadline, multiplier bound, feature, geometry or artwork is removed.
The follow-up normal hosted gate and public sharpness proof remain pending.

Run `42113008812` passes 52/53, including insertion and renderer regressions.
The remaining original native flow times out waiting for an automatic
checkpoint timestamp to change within its existing 20-second poll. Its
snapshot has autosave enabled, controls enabled and no storage error; trace
database evaluations take 6.0-6.8 seconds. Their serialized result is only
961 bytes, disproving the investigated large-checkpoint-transfer explanation.

Room paints now yield while the existing operation lifecycle is busy on an
already-running native core. The core/input continue; startup without a live
core still animates insertion. An actual 2x renderer regression fails the old
source's extra paint while busy, then verifies suppressed draws, resumed
painting and unchanged density. Five corrected SwiftShader cases pass in
4.4 minutes: the renderer, original native autosave/import/isolation flow,
both insertion viewports and native speed/fullscreen retained-LCD flow.
Build, syntax and all 12 units pass. All polling, capture and release deadlines
remain unchanged. Hosted gate and public qualification are still pending.

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
source push triggered the full gate; live qualification is pending.

### Monitored gate recovery

Run `42088695154` did not deploy. The dock-fit assertion read the previous
viewport's projected power target before the resized WebGL frame. It now polls
the same physical-clearance condition, rather than treating stale coordinates
as settled layout. The cartridge reload case now awaits its existing visible
early pose before checking seating, matching the first-load sequence. The
presented-frame animation and its 500ms maximum steps are unchanged.

The cancelled second job's log also records the combined native quick-action
case exhausting its 120-second test budget near the final reload. Speed/LCD
fullscreen and checkpoint/autosave/restart are now independent cases with the
same real-core, pixel, persistence and lifecycle assertions. The shader,
application behavior, ROM fixture and all deadlines remain unchanged.

The former third shard reached its 600-second suite deadline with five cases
unrun. Five test-level shards replace three; CLI discovery accounts for all
53 current cases exactly once, distributed 11/11/11/10/10. Each still uses one
worker, no retries, 15-second expectations, 120-second tests, a 600-second
suite deadline and a 15-minute job deadline. Deployment still requires build
and every verification job. This scheduling check is not a successful hosted
gate or deployed-site claim.

The six affected cases pass locally with explicit SwiftShader WebGL in 4.1
minutes, including both split real-native flows, both insertion viewports,
responsive dock clearance and the existing adaptive-rendering check. Syntax,
all 12 unit tests and whitespace checks pass. These local results do not
replace the next normal hosted gate or subsequent public-site qualification.

Run `42093791775` completes all 53 cases: 51 pass, including the corrected dock
clearance and both split quick-action flows. Deployment still skips: reload
insertion again exceeds its seating expectation, and the original combined
native save/import/isolation case exceeds 120 seconds. Awaiting the early
pose alone did not resolve the slow renderer.

The retained traces show repeated multi-second main-thread stalls. Adaptive
quality previously waited for six slow painted frames, so it could wait through
many seconds of blocking before reducing resolution. A post-paint gap above
500ms now reaches that existing threshold immediately. The same 0.75 reduction,
0.5 floor, recovery scheduling, insertion clock and native resolution remain.
The existing actual-render budget regression now checks this severe-stall case
in addition to isolated 100ms and sustained moderate stalls; its new assertion
fails against the previous source (`1` rather than a reduced ratio).

The corrected source passes nine focused cases with actual SwiftShader WebGL
in 5.4 minutes: the complete native save/import/isolation flow, both insertion
viewports, both native quick-action flows, dock clearance, adaptive rendering,
pressed-control visibility and LCD control-spill lighting. Build, syntax and all
12 units pass. Hosted and public qualification remain pending.

Run `42096896534` fixes the prior insertion/native-integration blockers but
still does not deploy. Three different checks fail: expansion briefly leaves
the moved dock outside the viewport, severe-stall adaptation wakes an idle
scene, and the global storage fault is consumed by automatic checkpointing
instead of the explicit power-off operation. The last trace's console stack
identifies `automaticCheckpoint`; it does not establish a power-off error
being overwritten.

Expansion now invokes the existing clamp synchronously, rather than awaiting
ResizeObserver. The real-click regression captures bounds inside its click
event, before observer delivery. Quality reduction moves after the existing
idle early return and still applies to necessary paints. The render-budget
regression also checks a severe scheduling gap without marking the scene
dirty. Both dock and idle cases fail locally against `cbc61c0`, then pass with
these corrections. The power-off fault case disables autosave through its
actual UI before injecting the global write fault; all retained-runtime,
backup, SAVE ERROR and successful-retry assertions remain. These three actual
SwiftShader cases pass in 1.1 minutes; build, syntax and all 12 units pass.

A broader 13-case SwiftShader follow-up passes 11 in 8.4 minutes, including
mouse/touch dock behavior, both native quick-action flows, both insertion
viewports, remembered power, pressed caps and LCD spill. Two timing checks
fail locally: audio records a 1.2405-second gap, and native VSync-speed return
measures 0.3275 of its baseline (required above 0.7). These are unresolved local
performance findings, not passing results or grounds to weaken assertions.
The unchanged full hosted gate remains required before deployment.

Run `42100513643` reports all 53 browser cases passing across its five shards,
including the local audio/native-speed timing checks. This still does not
deploy: shard 3 is cancelled at the unchanged 15-minute job deadline. Its
browser installation consumes 11 minutes 16 seconds; the suite then reports
11 passes in 3.7 minutes immediately before cancellation. Actual APT logs show
multi-minute font downloads from the Ubuntu mirror, not a failing application
assertion.

Browser jobs now provision the matching official Playwright 1.64.1 Noble image,
verified through its published OCI manifest and pinned by digest. This replaces
the repeated APT/browser-install step, not any tests or deployment dependency.
One worker, all 53 cases and every assertion/test/suite/job deadline remain.
The YAML parses; a semantic comparison confirms the only workflow changes are
the container and replaced installer. Actual Linux-container qualification
still requires the next normal gate; no local Docker execution is claimed.

At the user's earlier request for faster parallel CI, ten isolated browser jobs
replace five. Each still runs one worker: native audio/frame-clock assertions
must not compete with another WebGL/emulator test on the same runner. CLI
discovery verifies all 53 cases exactly once, distributed
6/6/6/5/5/5/5/5/5/5. The denominator derives from the matrix job count instead
of a separately maintained literal. YAML semantic comparison confirms no
other workflow changes; all gates, timeouts, retries and tests remain intact.
This reduces cases per runner from ten/eleven to five/six, at the cost of more
concurrent runner provisioning. Actual elapsed-time improvement still needs
the normal hosted run; runner queues, image pulls and external CDN timing
remain outside this local scheduling proof.

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
