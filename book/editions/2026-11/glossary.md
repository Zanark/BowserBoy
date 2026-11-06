# Glossary and concept index

| Term | Working meaning in this book | Read with |
|---|---|---|
| Adapter | Checked boundary around version-sensitive native integration; it contains assumptions, not all dependency risk | Chapters 02, 08 |
| Aggregate input | An action is pressed while at least one source owns a hold | Chapter 06 |
| Alpha contour | A boundary recovered from an image's opacity; nested loops distinguish cavities and islands | Chapters 04, 07 |
| Battery data | The game's native save medium, used by a fresh boot | Chapters 02, 03 |
| Checkpoint | An instant native state, separately restored rather than automatically substituted for physical power-on | Chapters 02, 03 |
| Cold boot | Fresh native execution with available battery data, not a loaded checkpoint | Chapter 02 |
| Commit boundary | The point at which the relevant system reports completion, such as an IndexedDB transaction completing | Chapter 03 |
| Content address | A key derived from complete bytes; renaming does not change it, patching bytes does | Chapter 03 |
| CRT preset | An upstream native shader choice, not a CSS approximation of its output | Chapter 05 |
| CSS pixel | A layout unit; not necessarily one renderer or physical screen pixel | Chapters 04, 07, 11 |
| Drawing buffer | The native canvas's retained rendered output, read later for presentation | Chapter 05 |
| Emission | A material's luminous contribution; it is not by itself a complete room-light transport simulation | Chapter 12 |
| Evidence epoch | The source/environment/cutoff to which a recorded observation belongs | Chapters 09, 13 |
| Exact-source guard | A release check requiring qualification for the selected SHA rather than a nearby revision | Chapter 13 |
| Exposure | A scene-wide brightness control whose interaction with tone mapping affects final color | Chapter 12 |
| Folio | Printed page number in the rendered edition; it is not a stable chapter identifier | Maintenance reference |
| Framebuffer | The rendered native picture consumed by the LCD and fullscreen presentations | Chapter 05 |
| Header validation | Bounded format checks; not proof that arbitrary ROM content is correct or harmless | Chapter 03 |
| Integrity checksum | Detection of changed bytes; not an authenticated signature or encryption | Chapters 03, 13 |
| Lifecycle isolation | Ability to replace/destroy a native instance independently; not hostile-code isolation | Chapters 01, 02 |
| Linear light | Channel values suitable for energy-like averaging before display encoding | Chapters 05, 07 |
| Native reserve | Scheduled sound ahead of playback; different from allocated buffer capacity | Chapter 09 |
| Origin | Browser storage/security identity determined by scheme, host and port | Chapters 01, 03 |
| Paint cadence | How often the expensive room image is drawn; not inherently the native simulation rate | Chapter 11 |
| Pixel ratio | Renderer resolution scale relative to CSS pixels; this project retains its stated cap | Chapter 11 |
| Projection | Conversion from world geometry through the camera to screen coordinates | Chapters 04, 07 |
| Public byte match | Comparison identifying served payload bytes; it does not establish user approval | Chapters 09, 13 |
| Recovery route | A remaining way to export or resume after failure; preserve it before destructive change | Chapters 02, 08 |
| Runtime identifier | A save compatibility fence; not a universal promise for future native versions | Chapter 03 |
| Session identity | Binding that prevents stale messages from one child/cartridge satisfying another | Chapter 02 |
| Source allowlist | Deliberate list of permitted inputs; not a recursive import of the workspace | Chapters 10, 13 |
| Static host | Server delivering files while the browser executes the application | Chapter 01 |
| Tone mapping | Conversion of scene brightness/color toward display output; final pixels need inspection | Chapter 12 |
| Workstream | Bounded task with purpose, acceptance, evidence and causal completion history | Chapter 10 |

## Common distinctions worth keeping

**Pause versus power.** Pause retains the machine; power off is destructive
after required recovery work. **Checkpoint versus battery.** Instant state and
the game's own save data support different meanings of restart.
**Allocated versus populated versus scheduled audio.** Capacity, filled buffers
and live playback headroom answer different questions.

**Implemented versus qualified.** A code path can exist while its current
hosted gate fails. **Qualified versus deployed.** A passed suite does not prove
the site has those bytes. **Deployed versus accepted.** Technical publication
does not manufacture human aesthetic approval.

**Living versus frozen.** A guide follows current behavior; a frozen book or
release follows its own manifest. A newer result can supersede a present-state
claim without making an earlier observation false.
