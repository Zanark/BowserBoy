# Third-party notices and provenance

This independent prototype is not affiliated with Nintendo. Game Boy Advance
is a Nintendo trademark. No commercial games, firmware/BIOS images, franchise
characters, box art or manufacturer logo bytes are included.

## Runtime dependencies

- **EmulatorJS 4.2.3**: fetched at runtime from
  `https://cdn.emulatorjs.org/4.2.3/data/`.
  [Release source](https://github.com/EmulatorJS/EmulatorJS/tree/v4.2.3),
  [GNU GPL v3 license](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/LICENSE).
- **mGBA**: the GBA emulation core selected by EmulatorJS.
  [Project/source](https://github.com/mgba-emu/mgba),
  [Mozilla Public License 2.0](https://github.com/mgba-emu/mgba/blob/master/LICENSE).
- **RetroArch and other bundled runtime components**: delivered by the upstream
  EmulatorJS distribution, with their own notices and licenses. See
  [EmulatorJS core documentation](https://github.com/EmulatorJS/EmulatorJS/blob/v4.2.3/data/cores/README.md)
  and [the upstream RetroArch fork](https://github.com/EmulatorJS/RetroArch).

The prototype does not vendor or modify these third-party runtime files. A
versioned CDN URL is not an integrity hash or a full native-core reproducibility
record. Before mirroring, modifying or redistributing a bundled emulator build,
preserve its notices and provide corresponding source as its licenses require;
do not assume this page replaces those obligations.

## Original prototype assets

The cartridge icon, CSS cartridge illustration, UI composition, and Pixel Lab
test program were created for this project. The generated test program omits
the Nintendo boot-logo array and is intended for emulator testing, not as a
claim of booting on physical retail hardware.

Playwright is a development/test dependency, not part of the deployed app.
Its package and transitive packages retain their upstream license notices in
the dependency installation.
