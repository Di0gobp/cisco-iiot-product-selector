# GitHub Pages deployment and review

Publication is pending. On 21 October 2026, the only recorded Pages deployment was [run 39465932631](https://github.com/Di0gobp/cisco-iiot-product-selector/actions/runs/39465932631), for Phase A commit `e14db1ce6148d6e218722dc091f6e4b6d3fb95b1` on `main`. Its build succeeded, but its deployment job and deployment-status records were still `waiting`; no completed successful Pages deployment was recorded. The configured Pages URL alone does not establish publication.

Phase B remains in PR #1 on `codex/phase-b-technical-intelligence`, separate from `main`. The repository uses `build_type: workflow`, and `github-pages` requires review by `Di0gobp`. Confirm a completed deployment and smoke-test the published site before describing either phase as published.

Approving the existing Phase A run would deploy its older commit. Releasing Phase B requires a new workflow run on `main` after its PR is reviewed and merged.

Public Pages hosting is not a restricted Cisco-only service. The application has no login, private data, analytics or embedded secrets.

## Review and release

1. Review and merge the Phase B development PR after checking the cited source excerpts, exact PID identities, lifecycle milestones, conditional software mappings and open issues. Source review by Codex is not independent human sign-off.
2. Confirm CI is green. It validates catalog/audit integrity, types, lint, TypeScript and Python tests, production build and Playwright flows/accessibility.
3. Run **Actions → Deploy GitHub Pages → Run workflow → main** after review. It rebuilds and tests before uploading the artifact.
4. Review and approve the pending `github-pages` deployment through the existing required-reviewer gate. Do not remove or bypass that protection.
5. After deployment succeeds, smoke-test the actual published site, an exact-PID deep link, official source actions and a 2-PID comparison. A local build or waiting deployment is not a production release.

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
