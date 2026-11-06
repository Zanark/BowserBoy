# Public releases

| Version | Milestone date | Status |
|---|---|---|
| [v1.0.0](v1.0.0/README.md) | 2026-11-06 | First public release, designated by the owner |

The first milestone date is **November 6, 2026 (Asia/Kolkata)**. Later local
lamp/showcase changes do not alter this date or rewrite the frozen package.

BowserBOY is the website; BowserBOY ADVANCED is its first available console.
The first release freezes the already deployed and independently qualified
application at `c3d9dbdcc41341d126720ee6a26db5b824c90b24`. Version metadata
and release documentation are a later administrative change, not a new
application deployment.

Each version directory holds release notes, a generated file/hash manifest
and an archive checksum. ZIPs are generated local delivery artifacts, ignored
by Git rather than duplicated in source history. There is no GitHub Release
or version tag merely because this directory exists.

## Manual GitHub Releases

The workflow is registered on `main` at `9ff921b`. Open
**Actions > Create GitHub Release > Run workflow**. Enter a version tag such
as `v1.0.1`, optionally select a source commit/branch/tag, and choose whether
to leave a draft or mark a prerelease. A blank source uses the revision
selected in the workflow's branch dropdown.

**Latest observed attempt, November 6:** manual `v1.0.0`
[run42179152331](https://github.com/Zanark/BowserBoyAdvance/actions/runs/42179152331)
stops at the exact-source Pages-verification guard for `9ff921b`.
Packaging and publication are skipped; no GitHub Release is created.
The source's Pages run was still running when the release was requested.
This is the intended safety gate, not evidence that ZIP creation failed.
That Pages run subsequently fails its cartridge/reload seating check and
skips deployment; the current source remains unqualified.
Wait for successful verification of the chosen source before a new manual
release request; it does not automatically resume when Pages finishes.
See [current qualification](../VERIFICATION.md#current-follow-up-and-manual-release-status-2026-11-06).

The workflow runs **only on manual dispatch**, never on a push or tag. It:

1. Resolves the exact source commit and requires its latest existing
   **Check and publish GitHub Pages** run to have succeeded, including its
   build/browser gates. Pending or failed verification blocks the release;
   it does not substitute an older passing revision.
2. Restores locked dependencies, checks JavaScript, runs unit tests and builds
   the allowlisted static site.
3. Creates `BowserBOYADVANCED-<tag>-static.zip`, including release notes and
   third-party notices, and copies the checksum-verified
   [engineering-book PDF](../book/published/Building-a-Little-Escape.pdf)
   as a separate companion asset. The external `SHA256SUMS.txt` covers
   both files. The book is a dated documentation edition, not evidence
   of new application qualification.
4. Creates a draft, uploads the completed assets, and publishes it unless
   **draft** was selected. A failed upload cannot publish an incomplete
   release. The notes identify the exact source and successful verification.

Only the publishing job has repository-write permission; no additional
secret is needed beyond the workflow's `GITHUB_TOKEN`. Existing releases
are not overwritten, and an existing tag pointing elsewhere is rejected.
If an upload/publication fails, inspect the retained draft before retrying;
the workflow does not delete or silently replace it.

This does not deploy Pages, change the package version, rewrite this local
release archive, or regenerate the frozen v1.0.0 package. Use a fresh release
tag for a later edition. The static ZIP still requires internet for the
upstream emulator runtime; it is not an offline emulator bundle.
In particular, selecting the default current source with tag `v1.0.0` would
package that current source, not retrieve the frozen local first-milestone ZIP.
The workflow never automatically substitutes the historical package.

The supplied-cover second-edition PDF is prepared for this release flow.
The selected source must contain `docs/book/published/Building-a-Little-Escape.pdf`
and its matching `SHA256SUMS.txt`; older revisions without the book fail
explicitly rather than silently fetching a different revision's documentation.
There was no existing GitHub Release when this companion was added; the
manual source-qualification guard still applies. Adding the book does not
create a tag, upload assets or retry the failed application release.

See the [documentation hub](../README.md) for the repository map and the
[verification record](../VERIFICATION.md) for actual release evidence.
