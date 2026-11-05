# BowserBOY ADVANCED: progress, backups and recovery

[Player guide](GUIDE.md) | [Book chapter: saves and recovery](../book/chapters/03-saves-and-recovery/README.md)

This guide covers the current GBA console on the **BowserBOY** website.
The chrome website rebrand does not change saves, ROM identity, backup format,
storage keys or the purple console artwork. No additional console save model
is implemented.

## Three different things

**In-game save:** use the game's save menu. Its battery-memory bytes are included
when the player captures a checkpoint or switches the power off, if the cartridge provides them. A
cartridge's own save point is not necessarily the exact current frame.

**Checkpoint:** the instant emulator state plus available battery-save bytes.
Auto-save updates one rolling slot every 15 seconds; Save checkpoint updates the
selected one of three independent manual slots. The original manual checkpoint
remains Slot 1; Slots 2 and 3 do not replace it. The dock's slot icon opens the
selector; its save/load icons use that selection. Selecting the same ROM normally
loads the newest checkpoint across all four slots. Restore
returns to the selected manual slot and, with auto-save enabled, updates the rolling slot
to the exact restored checkpoint bytes. Import likewise keeps its validated
source checkpoint as the new resume point; neither immediately recaptures a
possibly stale native frame. Subsequent normal timer captures can advance it.

**Backup:** Export captures the current running session directly to a downloaded
`.bba-save` file, independently of whether a browser checkpoint write succeeds.
It is a portable copy of one session, not the entire slot collection, a raw
`.sav` file or a cloud upload. Export separate restored sessions if multiple
checkpoints need external copies.

The auto-save toggle affects capture, not whether an existing checkpoint resumes
when a cartridge is selected. Its on/off choice persists across refreshes, just
like sound and keys. Failed preference writes explicitly apply only to this session.
Use manual save/export before leaving; no asynchronous final write is guaranteed
after a tab or browser shuts down.

## Remembered console and physical power switch

A first visit starts off. The switch works with or without a cartridge.
Inserting a ROM while off does not turn it on. Actual off-to-on plays the
original LCD startup and chime; refreshing or changing cartridges does not.

The last cartridge and power intent are stored locally in a separate console
record. Refresh while on automatically reloads that ROM and follows its checked
checkpoint/battery resume policy, without another startup sequence. Refresh
while off retains the inserted cartridge but does not create an emulator.
This remembers a virtual switch, not a continuously running CPU across browser
navigation. Save first: the most recent unsaved frames are not guaranteed.

Power off flushes the cartridge's in-game battery save, commits it separately
from instant checkpoints, removes the emulator iframe and darkens the LCD/LED.
The last ROM remains in this browser's console record. Power on creates a fresh
runtime and boots that ROM from its beginning with only the battery save.
Use the game's own Continue/Load menu to continue an in-game save. Unsaved
gameplay since that save is intentionally lost, just as on a physical handheld.

Existing manual/automatic checkpoints are not erased or overwritten by the
switch. After power off and reload the console stays off; switching on
boots from its battery save rather than reviving a pre-power-off checkpoint.
A subsequently captured checkpoint becomes eligible for normal ROM-selection
resume again. The physical switch always cold-boots, regardless.

If the battery or console-state write fails, power stays on so a backup can still be exported.
If application save storage was unavailable from startup but the emulator
still runs, a power cycle retains the battery save only in memory for this
page session; an explicit warning is shown. Globally denying IndexedDB may
also prevent the pinned emulator itself from starting.
The separate Pause action in Cartridges preserves the current running session.
The dock's restart icon uses this same checked off/on path, including a visible
off interval. It does not use native reset or checkpoint restore. If either
required persistent write fails, the action stops without discarding the live game.

## Continue tomorrow

Open the same site in the same browser profile. The last inserted ROM and switch
position return automatically. If it is off, turn it on; if it is on, it reloads
without another startup animation. You can also choose a different ROM.
SHA-256 identity ignores the filename, so a renamed copy still works.
Patches, translations or other byte changes create a different cartridge ID;
the application does not guess whether another ROM's save might be compatible.

Only the last inserted ROM is cached, not a ROM collection. Other cartridges'
metadata, battery saves and checkpoints remain content-keyed independently.
Clearing/evicting browser storage removes this local cartridge and power intent
along with its saves; it is not a backup or cloud synchronization.

## Move to another browser or device

1. Export backup while the session is running and keep the downloaded file.
2. Open BowserBOY on the other device, choose the exact same GBA ROM and turn the console on.
3. Import that `.bba-save` file and confirm replacement of the current session.

Imports check application format/version, runtime identity, ROM digest, size,
binary encoding and state/SRAM checksums before replacing progress. Import
overwrites only the selected manual slot if storage is available, preserving
the other manual slots. If storage is unavailable,
the session can be restored without promising persistent browser storage.

These are EmulatorJS 4.2.3 / mGBA checkpoints. Other emulators and future core
versions may use different state formats. Keep originals when migrating.
Checksums are not signatures: only import backups from a trusted source.

## Before the repository or website address changes

The owner will rename the GitHub repository separately; this documentation
does not perform that move. Export a `.bba-save` backup first and retain the
exact ROM. The present website name alone does not migrate or erase storage.
Browser storage is origin-scoped, but a future hosting move still needs
verification of the actual origin, browser profile and emulator behavior.
Do not assume a repository redirect proves that progress has migrated.

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
