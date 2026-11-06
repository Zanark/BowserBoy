# Before you pick up the console

The opening question is deceptively small: can a Game Boy Advance emulator
run on a GitHub static website? Yes, because a static host can deliver a program
that executes in the reader's browser. The difficult work begins after that
answer. A useful appliance must preserve progress, distinguish pause from
power, deliver native input, recover from failed writes and show one coherent
picture in several views. A convincing desk adds another system: geometry,
lighting, camera fitting and performance all have their own clocks.

This book teaches that integration. It does not teach a new ARM CPU emulator
implementation, include a commercial game collection or claim hardware-level
compatibility for every cartridge. EmulatorJS and mGBA provide the native
emulation. The independently authored shell makes those capabilities behave
like a small physical object.

## What this edition contains

Part I establishes ownership and durable state. Part II builds the visible and
interactive appliance. Part III turns algorithms, design decisions, tests and
documentation into a reasoning discipline. Part IV studies current sharpness,
material, exposure and release problems, then asks you to design a safe change.

The first ten chapters preserve the existing Markdown teaching text, including
its explicitly dated later notes. Their original implementation pin is
`ab912d51ecc615f7aa55a4d27f6a876673739cdf`. Their account of former test counts,
notice behavior, audio investigations and queued deployments is historical,
not the current status. Each receives new second-edition practice. Chapters
11-14 and the references supply the current interpretation.

This is a new presentation and teaching extension, not a retroactive claim
that the first edition had a PDF. The original source files and frozen public
release package remain unchanged. The manifest hashes the exact working-tree
inputs: a Git commit by itself cannot identify uncommitted documentation.

## Three identities, three questions

| Identity | What it establishes | What it does not establish |
|---|---|---|
| First public milestone, v1.0.0, November 6, 2026, Asia/Kolkata | Owner-designated first public availability; frozen package is based on qualified `c3d9dbd` | A later visual revision or a newly published GitHub Release |
| Qualified visual application `1b0385b` | Recorded successful Pages run `42135170801`, thirty matched public assets and four actual public cases | Qualification of every subsequent commit |
| Current source base `9ff921b` | Manual release workflow implemented and registered | A green current Pages run or an existing GitHub Release |

At this edition's evidence cutoff, Pages run `42179075618` for `9ff921b`
fails the 1440px reload-seating expectation: expected `seated`, observed
`inserting`. Deployment is skipped. The first manual release attempt
`42179152331` refuses to package that unqualified source. The timing cause is
not established. This book does not repair it or convert its safety block into
a successful release.

The startup-chime workstream also retains a narrower evidence gap: independent
live proof of the specific chip-startup change was not located. That is not a
proven audio defect, nor a listening-quality approval. Knowing the exact scope
of a missing check is more useful than declaring everything broken or complete.

## Reading routes

A newcomer should read in numbered order. A maintainer can begin with the
glossary, revisit the relevant ownership chapter, then use the maintenance
reference and current engineering chapters. Do not start a state-migration
change with only the visual chapters, or a release decision with only a green
local build.

Each chapter opener names its outcome and prerequisites. The teaching rhythm
is picture, mechanism, failure, worked example, changed-condition retry and
explained exercise. IDs such as `CH03-W01`, `CH03-R01`, `CH03-Q01` and
`CH03-A01` survive pagination. Question and answer links go both ways.
Original small exercises remain in the adopted chapters; these stable-ID
exercises are the new second-edition learning layer.

Figures use labeled arrows. An arrow means the specific operation on its
label, not implied trust or ownership of every downstream object. Most
box-and-arrow figures run top to bottom. Images are evidence of an identified
capture, not proof that the current checkout was deployed. The print version
uses stills for animated sources; understanding a temporal claim still requires
the relevant motion evidence.

## Prerequisites and experiment boundaries

You need basic JavaScript functions, arrays, promises and browser events.
Chapter 07 introduces the cost notation and projection units it needs.
You do not need to know native emulator internals before reading Chapter 01.
When the book reaches an upstream internal API, it names that boundary rather
than pretending the API is stable.

Worked calculations use explicitly stated synthetic conditions. Unless a
chapter cites a recorded execution, the calculation is a reasoning exercise,
not a new benchmark. Browser experiments use the project's original Pixel Lab
fixture, not the separately supplied game. No cartridge or firmware is included
in the book package.

Public source links identify implementation and provenance. The source
manifest identifies the bytes selected for this local edition. Neither is
an exhaustive code-coverage guarantee or an independent rights audit.
The appendix separates current guidance from frozen history and explains how
to rebuild this reader without importing private context.

## The promise to the reader

By the end, you should be able to predict what happens if two input sources
overlap, a save transaction aborts, an acknowledgement arrives late, a paint is
skipped, exposure changes or a release source has never passed its exact gate.
You should also know which measurement would test your prediction. That is the
book's purpose; its page count is not a measure of mastery.
