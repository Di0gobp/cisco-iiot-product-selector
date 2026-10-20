# GitHub Pages deployment and review

The application can run entirely on GitHub Pages, which is public hosting for this MVP. A public repository or Pages site is not a restricted Cisco-only service. No login or confidential data is included.

Do not dispatch a deployment until the required reviewer is configured.

The `Deploy GitHub Pages` workflow is manual (`workflow_dispatch`). It installs the frozen lockfile, validates data, lints, runs unit tests, builds and runs browser tests before uploading a Pages artifact. The build uses `GITHUB_REPOSITORY` to set Vite's repository base path. Hash links preserve deep links under that base. Workflow Actions use pinned upstream commit SHAs. Deployment grants only `pages:write` and `id-token:write` to its deploy job; normal jobs use `contents:read`.

## Publish after reviewing the evidence

1. Review the exact-PID claims, source excerpts, conditional software/management statements and open issues. The source review is by Codex, not a completed independent human review. Do not treat documented ordering-table identity as a live sales/lifecycle guarantee.
2. In repository **Settings → Pages → Build and deployment**, choose **GitHub Actions** if it is not already selected. The setup integration was denied permission to enable Pages (HTTP 403); a repository administrator must do this in the UI.
3. In **Settings → Environments → github-pages**, add or retain `Di0gobp` as a required reviewer for deployments. The integration used during setup was denied permission to create this protection rule (HTTP 403); a repository administrator must apply it in the UI. This implements the brief's human-review requirement. Do not remove the gate to bypass review.
4. Open **Actions → Deploy GitHub Pages → Run workflow**, select `main` and run it if a run is not already pending.
5. When the build passes, review the pending `github-pages` deployment and approve it only after completing the claim review. The generated deployment URL is reported by GitHub after the deploy job succeeds. A queued/waiting deployment is not a live site.
6. Smoke-test the actual published URL, a product deep link, source actions and a 2-PID comparison after deployment. Current-machine/browser validation is not proof of public deployment.

No API or source-audit credential is required. The monthly source audit writes artifacts and never deploys. Reviewed data changes should go through CI and a pull request; the Pages deployment remains explicit and reviewer gated. Future EoX credentials belong in server-side GitHub Actions secrets only.

For a custom domain or a user/organization root Pages site, adjust the Vite base deliberately and rerun production-path checks. Do not point at an assumed URL or report a public site as deployed before the Pages job succeeds.
