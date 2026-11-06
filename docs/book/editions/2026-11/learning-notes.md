# CH01

## Second-edition practice: place the work

### CH01-W01 - Trace one selected file

Suppose the browser receives three categories of bytes: the static shell from
Pages, native runtime code from its pinned CDN path and a `.gba` file chosen
locally. Draw three separate arrows. Only the first two are downloads in this
model. The host checks the local file and gives it to a same-origin player;
the browser executes the core. There is no application ROM-upload endpoint.
This statement does not promise that arbitrary third-party code cannot make
network requests.

### CH01-R01 - Remove the network

Change one condition: the shell is already open, but required core files have
not been fetched and the network disappears. Does static hosting make startup
offline? No. A cached shell is not a cached native runtime. A sound offline
design would need an explicitly licensed, complete, versioned cache strategy
and failure UX; this application does not acquire that capability by its name.

### CH01-Q01 - Is the iframe a trust boundary?

A same-origin runtime can be destroyed independently. Does that also prevent
its scripts from accessing the host origin's storage?

### CH01-A01 - Containment has a scope

No. The iframe is a lifecycle boundary: teardown removes its native instance.
Same-origin privileges remain. Hostile-code containment would require a
different trust and resource-access design. Calling a frame a sandbox without
that design confuses a useful integration technique with a security guarantee.

# CH02

## Second-edition practice: preserve the escape route

### CH02-W01 - A failed power-off write

Start with a running game and a newer in-game save still in native memory.
The host captures the battery bytes, requests storage and receives a failed
commit. The correct result is an explicit error with the runtime retained,
not a black screen followed by a claim of success. The retained machine is the
remaining route to export. The ordering is capture, required commit, then
teardown; a successful capture alone cannot satisfy the commit step.

### CH02-R01 - A late acknowledgement

Now replace the cartridge while an old child response is delayed. Request
numbers alone are insufficient if they can repeat between sessions. Check the
origin, sending window and session as well as request identity. The old
response must not complete the new cartridge's command. A timeout ends waiting;
it does not retroactively revoke a response already in transit.

### CH02-Q01 - Which data belongs to cold boot?

A manual checkpoint is newer than battery data. Should physical power-on
automatically choose the newer checkpoint?

### CH02-A01 - Preserve operation meaning

No. Physical power-on deliberately starts a fresh core with available battery
data. Checkpoint restore is a separate operation. Choosing by recency here
would erase the difference the interface promises, even though the result
might initially look convenient.

# CH03

## Second-edition practice: distinguish integrity and identity

### CH03-W01 - Budget the portable backup

For a synthetic state of 12 MiB and battery data of 0.5 MiB, Base64 needs about
four thirds of the binary size: approximately 16.67 MiB before JSON metadata.
That is below the 24 MiB file limit, while each decoded component also fits
its own limit. These are three checks, not a promise that every JSON overhead
fits an arbitrarily tight remainder. The actual decoder enforces exact limits.

### CH03-R01 - Corruption with an intact title

Change a state byte but preserve the game's displayed title. The checksum must
fail. If the ROM itself changes, content identity must fail independently.
Titles are for people, checksums detect changed data and the ROM digest
selects the game record. None substitutes for the others.

### CH03-Q01 - Is request success transaction success?

An IndexedDB `put` request succeeds, then the containing transaction aborts.
Can the interface announce that progress is durably saved?

### CH03-A01 - Observe the commit boundary

No. Wait for transaction completion. The request event describes one operation
inside a transaction, not the final durable outcome. A synthetic test that
emits request success followed by abort is valuable precisely because it
distinguishes these two events.

# CH04

## Second-edition practice: measure a manufactured feature

### CH04-W01 - A letter with a counter

Imagine an A-shaped opaque mask with a triangular transparent counter.
Its outer contour defines a cavity; the counter remains a solid plastic
island. A floor below the cap and walls joining the lip make the letter an
inward groove. A ray through the stroke must encounter the lower floor before
an uncut cap; a ray through the counter must encounter cap height.

### CH04-R01 - Change color, retain geometry

The user asks for softer gray lettering. Changing floor material can satisfy
that request without altering contours or depth. If the request instead says
rounder letterforms, material changes cannot satisfy it. Identify whether the
controlled quantity is color, contour, depth or illumination before choosing
the implementation and assertion.

### CH04-Q01 - Why can a box test mislead?

An axis-aligned bounding box overlaps the toolbar, but the visible shell does
not. What should the regression measure?

### CH04-A01 - Match the requirement's geometry

Use the relevant projected visible surfaces for the visual-clearance claim,
and independently retain accessible hit-target bounds. The box is useful
for broad-phase rejection, not conclusive visible collision. Replacing it
requires evidence of the actual geometry, not simply weakening the threshold.

# CH05

## Second-edition practice: separate a frame and its light

### CH05-W01 - Average in the right space

Take two synthetic grayscale pixels, one black and one white. Their mean
linear intensity is 0.5. Encoding that mean to sRGB gives approximately
0.735, not 0.5. Averaging already encoded channels would produce a darker
energy estimate. The sampler converts channels to linear light before
averaging; its 384-pixel reduction is a whole-screen approximation.

### CH05-R01 - Keep the source, change the view

Enter screen fullscreen without changing the game. The same retained native
canvas supplies the new presentation. A new ROM load would change lifecycle
and risk progress for a display operation. A stretched 16:9 canvas would
change aspect, not improve access to the original 3:2 picture.

### CH05-Q01 - Can black emit a fixed fill?

Would adding a constant minimum LCD light improve dark-room usability without
changing the light model?

### CH05-A01 - Black is an invariant

No. A constant fill would make a black screen illuminate its surroundings.
The existing peak-dependent spill converges to zero at black. Improve controls
through a deliberately separate interaction design if needed; do not silently
change a content-driven emitter into an always-on lamp.

# CH06

## Second-edition practice: release only your ownership

### CH06-W01 - Two sources hold one action

Start with `A -> {}`. Keyboard down gives `{keyboard:KeyX}` and one native
press. Pointer down gives `{keyboard:KeyX, pointer:7}` without a second native
press. Keyboard up leaves `{pointer:7}` without release. Pointer up leaves
the empty set and produces one native release. This is a union of holds,
not a counter blindly incremented on repeated browser keydown events.

### CH06-R01 - Change mapping during the hold

Now rebind the physical key while it is held. Release prior ownership before
applying the new mapping. If keyup were translated using only the new mapping,
it could release a different action while stranding the old one. The held-key
map remembers the action originally pressed.

### CH06-Q01 - Where should a repeat go?

An operating system repeats keydown for a held key. Should every event create
a new held source that needs another keyup?

### CH06-A01 - Identity beats counting

No. The physical source already exists in the set. Repeated down is idempotent
for that hold. Counting repeated notifications would require releases that the
operating system never sends. Set membership models the actual ownership
invariant more directly than an event count.

# CH07

## Second-edition practice: reason with units and bounds

### CH07-W01 - A narrower available region

Use the chapter's perspective approximation with envelope width 6 world units,
viewport height 800 CSS pixels, `tan(fov/2) = 0.5`, and available width 600 CSS
pixels. Required distance is `6 * 800 / (2 * 0.5 * 600) = 8` world units.
The units cancel correctly. The height constraint and ordinary minimum still
need separate evaluation; this single term is not the final camera.

### CH07-R01 - Halve only the width

At 300 available CSS pixels the width distance becomes 16 world units.
The console must be farther away unless another layout candidate offers
more usable width. Do not halve its mesh dimensions: that would also change
the physical relationships with the rest of the scene.

### CH07-Q01 - Does a heap improve four slots?

The newest-save selector sorts four candidates. Should it become a persistent
priority queue to improve asymptotic complexity?

### CH07-A01 - Optimize the real workload

Not for this bounded use case. Sorting four items is simple and cheap, while
a heap adds mutation and ordering invariants. `O(k log k)` describes growth;
it does not by itself establish a performance problem at `k <= 4`.
Reconsider only if the product changes the actual workload.

# CH08

## Second-edition practice: expose the failed alternative

### CH08-W01 - Restore without recapturing stale state

A validated checkpoint represents the exact intended instant. Persisting a
fresh capture immediately after an asynchronous restore may instead observe
an older or unsettled frame. Preserve the exact validated checkpoint as the
autoslot when that is the required recovery behavior. This is an ownership
decision about which bytes are authoritative, not a preference for fewer calls.

### CH08-R01 - Make the native interface stable

Suppose an upstream public API eventually provides the same capability.
The adapter still owns translation and error handling, but fewer internal
assumptions may be necessary. Replace an integration mechanism because the
contract changed, not because a design-pattern name requires an adapter forever.

### CH08-Q01 - Why not one giant transaction?

Can the host promise atomicity across native execution, DOM state and
IndexedDB merely by placing their promises in one async function?

### CH08-A01 - Ordering is not distributed atomicity

No. Those systems have different commit and rollback behavior. The application
can validate first, persist before destructive action and retain recovery
routes. An async function sequences work but does not create shared rollback.
Document the actual failure states rather than naming the whole operation ACID.

# CH09

## Second-edition practice: identify what passed

### CH09-W01 - A green earlier source

Commit A passes all hosted gates. Commit B changes rendering and its current
reload-seating case fails. A remains evidence for A. B does not inherit that
qualification because most files are unchanged. Keep implementation identity,
test environment and release identity together in the receipt.

### CH09-R01 - More shards, same failing condition

Split 56 cases across nineteen isolated runners. If one unchanged acceptance
condition fails, deployment must still stop. Isolation can reduce contention;
it does not prove a timing cause or justify ignoring the remaining failure.
Chapter 13 describes the current exact-source release guard.

### CH09-Q01 - What does matching a hash prove?

Every public application asset matches the intended build. Does that establish
native audio quality, phone ergonomics and human aesthetic acceptance?

### CH09-A01 - Identity is one layer

No. It establishes byte identity for the compared payload. Live behavior,
environment-specific qualification and human judgment answer different
questions. Combine those records when the acceptance criteria require them;
do not make a checksum carry claims it cannot support.

# CH10

## Second-edition practice: keep several kinds of truth

### CH10-W01 - A historical rejection remains useful

A first camera fit clears a notice but makes landscape play too small.
The final implementation changes the baseline rule. The living guide should
teach the final interaction; the ledger should preserve the rejected attempt
and why it failed. A frozen book should retain its source identity and mark
later changes rather than silently pretending it always described the new rule.

### CH10-R01 - Change only the lamp

A lamp replacement invalidates captures containing the old lamp, not every
unchanged logo asset or frozen milestone package. Inventory affected media,
recapture actual interactions and bind the new bytes to their origin.
Cache-busting a URL without replacing old pixels cannot satisfy the request.

### CH10-Q01 - Can continuity be pasted into a public book?

Private session notes provide convenient chronological detail. Should a build
recursively import them to make the development story more complete?

### CH10-A01 - Audience is a boundary

No. Public documentation needs deliberate, independently suitable source
selection and authored explanation. Private continuity contains a different
audience and potentially unrelated material. A reviewed source allowlist is
both more reproducible and safer than importing everything a process can read.
