# GitHub Pages deployment and review

Phase A is published through GitHub Pages. At Phase B inspection, the repository used `build_type: workflow`, and `github-pages` required review by `Di0gobp`. This branch preserves the existing deployment workflow and does not change environment protections or dispatch a deployment.

Public Pages hosting is not a restricted Cisco-only service. The public MVP has no login, private data, analytics or embedded secrets.

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
