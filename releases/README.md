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

After `.github/workflows/release.yml` is pushed to the default branch, open
**Actions > Create GitHub Release > Run workflow**. Enter a version tag such
as `v1.0.1`, optionally select a source commit/branch/tag, and choose whether
to leave a draft or mark a prerelease. A blank source uses the revision
selected in the workflow's branch dropdown.

The workflow runs **only on manual dispatch**, never on a push or tag. It:

1. Resolves the exact source commit and requires its latest existing
   **Check and publish GitHub Pages** run to have succeeded, including its
   build/browser gates. Pending or failed verification blocks the release;
   it does not substitute an older passing revision.
2. Restores locked dependencies, checks JavaScript, runs unit tests and builds
   the allowlisted static site.
3. Creates `BowserBOYADVANCED-<tag>-static.zip`, including release notes and
   third-party notices, plus an external `SHA256SUMS.txt`.
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

See the [documentation hub](../docs/README.md) for the repository map and the
[verification record](../docs/VERIFICATION.md) for actual release evidence.
