# Progress, backups and recovery

## Three different things

**In-game save:** use the game's save menu. Its battery-memory bytes are included
when the player captures a checkpoint or switches the power off, if the cartridge provides them. A
cartridge's own save point is not necessarily the exact current frame.

**Checkpoint:** the instant emulator state plus available battery-save bytes.
Auto-save updates one rolling slot every 15 seconds; Save checkpoint updates a
separate manual slot. Selecting the same ROM normally loads the newest slot. Restore
returns to the manual slot and, with auto-save enabled, updates the rolling slot
to the exact restored checkpoint bytes. Import likewise keeps its validated
source checkpoint as the new resume point; neither immediately recaptures a
possibly stale native frame. Subsequent normal timer captures can advance it.

**Backup:** Export captures the current running session directly to a downloaded
`.bba-save` file, independently of whether a browser checkpoint write succeeds.
It is a portable copy, not a raw `.sav` file or a cloud upload.

The auto-save toggle affects capture, not whether an existing checkpoint resumes
when a cartridge is selected. Turning it off lasts for the current page session.
Use manual save/export before leaving; no asynchronous final write is guaranteed
after a tab or browser shuts down.

## Physical power switch

Power off flushes the cartridge's in-game battery save, commits it separately
from instant checkpoints, removes the emulator iframe and darkens the LCD/LED.
The ROM remains in memory for this page session. Power on creates a fresh
runtime and boots that ROM from its beginning with only the battery save.
Use the game's own Continue/Load menu to continue an in-game save. Unsaved
gameplay since that save is intentionally lost, just as on a physical handheld.

Existing manual/automatic checkpoints are not erased or overwritten by the
switch. After power off, reselecting the same ROM following a page reload
also boots from its battery save rather than reviving a pre-power-off checkpoint.
A subsequently captured checkpoint becomes eligible for normal ROM-selection
resume again. The physical switch always cold-boots, regardless.

If the battery write fails, power stays on so a backup can still be exported.
If application save storage was unavailable from startup but the emulator
still runs, a power cycle retains the battery save only in memory for this
page session; an explicit warning is shown. Globally denying IndexedDB may
also prevent the pinned emulator itself from starting.
The separate Pause action in Cartridges preserves the current running session.

## Continue tomorrow

Open the same site in the same browser profile and select the ROM again.
SHA-256 identity ignores the filename, so a renamed copy still works.
Patches, translations or other byte changes create a different cartridge ID;
the application does not guess whether another ROM's save might be compatible.

Only game metadata, battery saves and checkpoints are retained, not a ROM collection. Selecting a
ROM remains necessary after reopening the page.

## Move to another browser or device

1. Export backup while the session is running and keep the downloaded file.
2. Open BowserBoyAdvance on the other device and choose the exact same ROM.
3. Import that `.bba-save` file and confirm replacement of the current session.

Imports check application format/version, runtime identity, ROM digest, size,
binary encoding and state/SRAM checksums before replacing progress. Import
overwrites the manual slot if storage is available. If storage is unavailable,
the session can be restored without promising persistent browser storage.

These are EmulatorJS 4.2.3 / mGBA checkpoints. Other emulators and future core
versions may use different state formats. Keep originals when migrating.
Checksums are not signatures: only import backups from a trusted source.

## If something goes wrong

| Situation | What to do |
|---|---|
| SAVE ERROR / quota failure | Export immediately. Automatic captures stop; a failed write does not replace the previous completed checkpoint. |
| Storage blocked | Allow site storage where appropriate, close conflicting tabs and reload; do not assume private-mode data is durable. |
| Missing progress | Check browser profile and exact origin, then select the same ROM bytes. Import an external backup if browser data was cleared. |
| Wrong-ROM backup | Load its exact matching ROM; do not rename a backup to force compatibility. |
| Checksum/format failure | Preserve the damaged file and use another backup; no partial import is performed. |
| Emulator startup timeout | Check internet/CDN access, cancel if necessary, then choose the ROM again. Previously completed checkpoints are retained. |

An origin consists of scheme, hostname and port. Different localhost ports,
HTTP versus HTTPS, and custom domains do not share storage. A path-only move on
the same origin is not an independent storage partition. Other trusted code on
the same origin can access its storage.

Keep more than one exported copy for important progress. Cloud sync would need
an explicit account, consent, authentication and conflict-resolution design;
it is not implemented here.
