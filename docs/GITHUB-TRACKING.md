# TODOs, GitHub issues and the Project board

[TODO index](../TODO/00_INDEX.todo) |
[Project board](https://github.com/users/Zanark/projects/1) |
[Verified mappings](github-sync.json)

Each actual numbered workstream maps to one repository issue and one item on
the BowserBOY Project. Index 00 and the perpetual ledger 04 are excluded.
The source description is copied verbatim into a managed text block; the
verified issue URL is written back into the `.todo` file.

## Run from the repository root

Supply `TODO_SYNC_GITHUB_TOKEN` through a hidden local prompt/approved secret
store. Never put its value in commands, source, chat or receipts.

```powershell
node .\scripts\sync-todos.mjs
node .\scripts\sync-todos.mjs --apply --only=78
node .\scripts\sync-todos.mjs --apply
```

Default mode previews without writes. The middle command is a bounded pilot;
the last applies the repository inventory. Configuration lives in
`.github/todo-sync.json`. This tool reads only this repository's TODO directory;
it does not import private context or activate other repositories.

Local TODOs own managed descriptions and completion. Remote body edits fail
with a conflict instead of being overwritten; comments remain untouched.
Project status is aligned to the configured mapping on apply, not read back
into TODOs. There is no two-way sync, scheduler or Actions trigger.

Primary DONE means closed/completed; SUPERSEDED means closed/not planned;
unfinished work stays open. NOT_STARTED goes to Backlog, active work to
In progress, and completed/superseded work to Done. A superseded issue's
not-planned reason and source status distinguish it from completed delivery.
BLOCKED remains open in In progress with its blocker in the copied description.
Historical "DONE locally; publication BLOCKED" retains primary completion and
its explicit separate follow-through rather than guessing from substrings.

Stable markers prevent duplicate creation on reruns. After a successful issue
write, its backlink is persisted before Project operations. A partial failure
stops explicitly; rerun to recover the existing issue rather than recreate it.
Final read-back checks verify body/state, Project membership/status and local
backlinks before replacing `github-sync.json`. A previous report is not evidence
that a later interrupted run completed.

The credential requires issue write access and Project edit access. For the
current user-owned Project, use classic `project` plus `public_repo` or `repo`
as required. Classic scopes are broad; an allowlist is not a token permission
boundary. The script sends the dedicated token only to GitHub API requests and
does not replace Copilot authentication. Do not execute it against unreviewed
TODO content, or expose the token to untrusted pull-request code.

Creating issues for deferred workstreams 78-80 does not start their features.
Sync writes local backlinks and the public receipt; committing/pushing them
remains a separate authorized operation.

After a repository rename, retain the configured repository identity/issue
markers. Bounded API redirects are followed only within `https://api.github.com`;
credentials never follow another origin. Existing verified old-name backlinks
are accepted for the same issue number and refreshed to GitHub's canonical URL.
This does not migrate website URLs or recreate historical issues.
