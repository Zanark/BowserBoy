# Architecture

## One static site, one active cartridge

The application is vanilla HTML, CSS and JavaScript modules. There is no
application backend or framework dependency. Node is used for serving,
allowlisted static packaging, the original test ROM generator and tests.

The runtime boundary is:

```text
Local .gba File
      |
      v
Header/size validation -> SHA-256 game identity
      |
      v
Host UI + checked IndexedDB checkpoint store
      |
      v
Same-origin player iframe + message session ID
      |
      v
Pinned EmulatorJS 4.2.3 -> single-threaded mGBA WebAssembly
```

`src/app.js` owns UI state and serializes user actions. File validation happens
before the running cartridge is replaced. Switching cartridges checkpoints the
old game if auto-save is enabled; otherwise it asks before discarding progress.
A new iframe removes the previous emulator's globals, listeners and DOM.

The file is structured-cloned to `player.html`. Only that child creates a
temporary ROM blob URL; the URL is revoked after loading. Both sides check
message origin, source window and session identity. Commands have timeouts;
late messages cannot resolve a different cartridge's requests.

**This is lifecycle isolation, not a security sandbox.** The third-party
emulator script runs with the website's origin privileges. The application does
not send ROM bytes to a backend, but loading CDN code remains a trust boundary.
The CDN receives ordinary request/network metadata. A future self-hosted runtime
would reduce that dependency and needs a deliberate license/provenance review.

## Pinned compatibility adapter

All version-sensitive engine access is in `src/player.js`. The runtime URL is
`https://cdn.emulatorjs.org/4.2.3/data/`; this pins the release path, not the
CDN operator's bytes with an integrity guarantee. GBA uses the `mgba` core and
the `gba` control scheme. Threads are explicitly off.

The documented loader globals configure ROM/name, controls, buttons, readiness
and start callbacks. The pinned source also supplies the internal operations
used by the adapter:

- `gameManager.getState()` and `getSaveFile()` capture a copied binary state
  and flushed cartridge save, respectively.
- `gameManager.FS`, `getSaveFilePath()`, `mkdir()` and `loadSaveFiles()` restore
  the cartridge save, then `loadState()` restores the instant checkpoint.
- `togglePlaying()`, `play()` and `pause()` preserve pause behavior. Documented
  `EJS_defaultOptions` enables virtual controls when touch is available.
- A wrapped `startGameError()` reports startup failures to the host.

The adapter allows two animation frames after restoring before acknowledging
the operation, so a following capture does not race the restored display.
When restoring while paused it temporarily runs the core and restores pause.
The upstream child `beforeunload` handler is suppressed: it otherwise resets
the core even when navigation is cancelled. Only the host prompts for leaving.
That reset also caused a real reload regression by contaminating the final
checkpoint; the browser suite covers restoration across navigation.

EmulatorJS expects all four controller-map objects, even for one-player GBA.
Omitting the unused player maps throws during construction. These assumptions
are version-specific: do not upgrade the URL without running the live-core tests.

Current online options describe `EJS_onSaveUpdate` and
`EJS_fixedSaveInterval`, but the 4.2.3 loader does not wire them. The application
therefore owns its timer and checked checkpoint persistence.

## Persistent data

`src/save-store.js` opens database `bowser-boy-advance`, version 1, store `games`.
The primary key is the ROM's SHA-256 digest. A record contains public file
metadata, runtime identity and independent `automatic` / `manual` slots.
Each slot has binary `state`, optional binary `sram` and an ISO timestamp.
ROM bytes are not stored.

Writes read/update a record in one read-write transaction. Success is reported
only on transaction completion, not the individual request. This prevents
concurrent slots from erasing one another and treats aborted/quota-failed writes
as failures. The rolling slot never replaces the manual slot.

The engine also maintains its own Emscripten save filesystem. It is not the
application's checkpoint-success authority. Runtime ROM/core caches and settings
storage are disabled; the website's checked IndexedDB records and exported
backups define resume behavior.

`src/cartridge.js` validates ROM shape, identifies content, selects the newest
slot, and encodes/decodes versioned backups. Base64 is transport, not encryption.
Checksums detect accidental corruption, not authenticity. A backup should come
from a trusted copy of this application.

## Source and packaging map

| Path | Responsibility |
|---|---|
| `index.html`, `styles.css`, `assets/cartridge.svg` | Responsive original player shell |
| `src/app.js` | File selection, host lifecycle, UI and user save actions |
| `src/player.js`, `player.html` | Pinned runtime adapter and child document |
| `src/cartridge.js`, `src/save-store.js` | Identity, backups and checked storage |
| `scripts/demo-rom.mjs` | Original ARM7TDMI cartridge generator |
| `scripts/site-files.mjs`, `build.mjs`, `serve.mjs` | Explicit public-file allowlist, clean build, loopback serving |
| `tests` | Focused unit and real-browser checks |
| `.github/workflows/pages.yml` | Check/build/browser-test gates and Pages deployment |

The server is loopback-only and serves only public allowlisted files. The
build replaces only the generated `dist` directory and adds `.nojekyll`.
Documentation/private context cannot enter the deployed artifact through a
recursive repository copy.

## Upstream receipts

- [4.2.3 loader](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/loader.js)
- [4.2.3 emulator source](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/src/emulator.js)
- [4.2.3 game manager](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/src/GameManager.js)
- [Current option documentation](https://emulatorjs.org/docs/options/)
- [Control identifiers](https://emulatorjs.org/docs4devs/control-mapping/)

## Deliberately not in this prototype

No cloud accounts/sync, server ROM library, offline/PWA guarantee, raw `.sav`
interchange, multiple manual slots, GB/GBC support or complete game compatibility
matrix. Those are future product decisions, not hidden capabilities.
