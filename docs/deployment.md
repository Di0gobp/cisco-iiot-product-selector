# GitHub Pages deployment and review

Publication is pending. On 21 October 2026, the only recorded Pages deployment was [run 39465932631](https://github.com/Di0gobp/cisco-iiot-product-selector/actions/runs/39465932631), for Phase A commit `e14db1ce6148d6e218722dc091f6e4b6d3fb95b1` on `main`. Its build succeeded, but its deployment job and deployment-status records were still `waiting`; no completed successful Pages deployment was recorded. The configured Pages URL alone does not establish publication.

Phase B remains in PR #1 on `codex/phase-b-technical-intelligence`, separate from `main`. The repository uses `build_type: workflow`, and `github-pages` requires review by `Di0gobp`. Confirm a completed deployment and smoke-test the published site before describing either phase as published.

Approving the existing Phase A run would deploy its older commit. Releasing Phase B requires a new workflow run on `main` after its PR is reviewed and merged.

Public Pages hosting is not a restricted Cisco-only service. The application has no login, private data, analytics or embedded secrets.

## Review and release

These are owner actions after this readiness review. This task does not merge, dispatch, approve or publish anything.

1. Open [PR #1](https://github.com/Di0gobp/cisco-iiot-product-selector/pull/1). Review the [beta-readiness report](beta-release-readiness.md), Cisco excerpts and nine unresolved issues. Confirm the latest PR head has a successful **CI / check**, then merge into `main` using the repository's permitted merge method. Record the resulting `main` commit; a squash merge can have a different SHA from the PR head. Wait for any CI on that commit to pass.
2. Open old [Phase A run 39465932631](https://github.com/Di0gobp/cisco-iiot-product-selector/actions/runs/39465932631), confirm it targets `e14db1c`, and **cancel that obsolete run**. Do not approve its deployment. The workflow uses a shared `pages` concurrency group with `cancel-in-progress: false`; leaving the old approval-waiting run active can keep a new release queued. If GitHub does not expose cancellation, resolve that obsolete run with repository administration before dispatching the new release; keep the required-reviewer protection enabled.
3. Open **Actions → Deploy GitHub Pages → Run workflow**. Select branch **main** explicitly and dispatch a new run. Confirm its `head_sha` is the reviewed merged `main` commit. The build installs dependencies, runs lint/unit/Python checks, type-checks/builds, runs Playwright and uploads `dist`. Wait for its build job to succeed. Do not rerun the old Phase A workflow as a shortcut.
4. In that **new run**, use **Review deployments → github-pages**. Required reviewer **Di0gobp** should verify the run/commit and choose **Approve and deploy**. Preserve the environment's branch policy and reviewer gate. Wait for both the deploy job and deployment status to report success; a build artifact or queued/waiting status is insufficient.
5. Open the URL returned by the successful deploy job. Verify the homepage and `/cisco-iiot-product-selector/#/product/IE-9320-24T4X-E`, then refresh the deep link. Check asset requests for HTTP 200 and the browser console for errors. Test search, sources, a two-PID comparison, module add/remove, BOM CSV and configuration JSON. Reload a saved configuration; test desktop 1440×900 and mobile 390×844. For the mandatory 16-port/Gigabit + Meraki + CV 5.6.x scenario with no firmware/license selected, expect IE9300 candidates with 28 interfaces, conditional firmware/licensing prerequisites and **unknown simultaneous CV operation**—never a verified complete fit. IE3500 Meraki expansion must not contribute a positive capacity match. Confirm the audit page downloads the current 42-source report. If live smoke checks fail, keep publication described as unverified and address the failure through a reviewed change; do not bypass the gate.

As rechecked on 21 October 2026, the only Pages run is still the waiting Phase A run, and `github-pages` still requires Di0gobp. The workflow file is unchanged by the beta-readiness task. No live release validation is claimed; production-subpath preview evidence is documented separately.

Vite uses `GITHUB_REPOSITORY` for the repository base when `GITHUB_ACTIONS=true`. To validate that path locally, use the same two variables for both build and preview:

```sh
GITHUB_ACTIONS=true GITHUB_REPOSITORY=Di0gobp/cisco-iiot-product-selector npm run build
GITHUB_ACTIONS=true GITHUB_REPOSITORY=Di0gobp/cisco-iiot-product-selector npm run preview -- --port 4174 --strictPort
```

Use the repository subpath and hash routes for internal validation. Normal dev/root preview uses `npm run dev` or `npm run preview` without those variables.

## Monthly history proposals

The observation job reads public Cisco documents and uploads its report even when a source fails. It preserves the underlying failed outcome. A separate writer job proposes only `data/audits` history with citations and validation context. No claim, license, lifecycle baseline or deployment is updated automatically.

The writer validates catalog/audit integrity, TypeScript and the production build before opening its PR. PRs opened with `GITHUB_TOKEN` do not trigger ordinary follow-on CI workflows; review that proposal job's checks. Changes to technical code or claims require the regular validation suite before merging.

If GitHub denies automatic PR creation, enable **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests** if your repository/organization policy allows it. No token needs to be placed in the frontend. The writer declares only `contents:write` and `pull-requests:write`; the observation and ordinary CI jobs remain read-only. Human review remains required even if this setting permits creation.
