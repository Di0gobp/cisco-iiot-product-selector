# Cisco IIoT Product Selector

An evidence-led, static React/TypeScript application for shortlisting exact Cisco industrial networking PIDs. Independent research tool; not affiliated with or endorsed by Cisco. Public MVP: no login, analytics, price estimates, or private-system integration.

## Run locally

Use Node **24.19.0** (`.node-version`) and npm. Python 3 is needed only for source audits; no Python packages or API credentials are required.

```sh
npm ci --cache /workspace/.cache/npm
npm run dev -- --port 5173 --strictPort
```

In other environments, use any writable npm cache path or omit `--cache`. A restored cloud task already has an isolated checkout: use it directly; do not create another worktree. The dev server must restart after restoring a cloud snapshot. This is a static application; no database, backend service, `.env` file, or production key is required.

```sh
npm run validate:data
npm run lint
npm test
npm run build
# Cloud machine includes Chromium:
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
# Else install Playwright's matching browser first:
npx playwright install chromium
npm run test:e2e
```

`npm run preview -- --port 4173 --strictPort` serves `dist/`. Hash routes preserve exact-PID deep links on GitHub Pages without a rewrite server. `npm run build` validates source data and types before Vite emits the site. Production contains no synthetic test records. Test fixtures are explicitly named `TEST-*` and browser fixtures are injected only by test request interception.

## Initial coverage (20 October 2026)

Ten exact PIDs checked against official Cisco ordering tables:

- `IR1001-G2`, `IR1005-G2`.
- `IE-3500-8T3S-E`, `IE-3500-8T3S-A`, `IE-3500-8P3S-E`, `IE-3500-8P3S-A`.
- `IE-3500-8T3X-E`, `IE-3500-8T3X-A`, `IE-3500-8U3X-E`, `IE-3500-8U3X-A`.

There are 108 scoped assertions, not 108 independent source documents. Four documents have reviewed excerpts; all five starting Cisco links returned content over HTTPS. IE3500 Heavy Duty is fingerprinted only and has no approved product records. Initial source review was performed by Codex; **publisher review remains required**. No claim of exhaustive research, Cisco certification, current stock, purchasability, or completed human sign-off is made.

Features implemented: PID/family search, card/table catalog, basic requirements with explainable four-state matching, exact-PID detail and typed port inventory, 2–4 product comparison with CSV/source export, integrated Cyber Vision/SEA research and bundle evidence, audit coverage and open issues, and an explicitly planned competitive area. Keyboard navigation, skip link, mobile navigation, hash deep links, and visible uncertainty are supported.

Important boundaries:

- **Lifecycle is unknown** for every starter PID. An ordering-table entry is evidence of documented identity, not current orderability. New-deployment suitability remains unverified; known EoS/EoL evidence will exclude products by default once supplied.
- IR1000 Table 2 marks Cyber Vision/ThousandEyes with a check for IR1005-G2 and a dash for IR1001-G2. The former remains conditional pending a detailed support matrix; the latter remains unknown. A dash is not an explicit unsupported statement.
- IR1005's ordering description repeats IR1001 in the source; identity follows the explicit SKU column and platform comparison, with the discrepancy recorded.
- IE3500 Table 21 repeats `IE-3505-8P3S-A` against both license descriptions. Those IE3505 PoE variants are withheld, rather than guessing a corrected suffix.
- Eight copper downlinks plus three SFP uplink slots are built in on the selected IE3500s. Optional expansion capacity is never counted as built-in. SFP/SFP+ slots are not installed fiber transceivers; fixed-fiber counts stay unknown.
- PoE values are maximum **base-switch** budgets: 240 W on 8P3S and 480 W on 8U3X, conditional on adequate external power, chassis overhead, and voltage. Expanded-system budgets are separate.
- IE3500 Network Advantage bundles have 24-endpoint, 36-month CV and SEA Advantage entitlements for orders on/after **2025-08-23**, or upgrades on/after **2025-10-20**. Actual activation/remaining term must be checked. An Essentials PID does not inherit an Advantage entitlement.
- IE3500 Meraki management is a conditional family-level statement with **IOS XE 26.1.1** minimum for the base switch and licensing requirements. No Meraki + Cyber Vision/SEA coexistence is established.
- Hardware capability, commercial inclusion, technical support, and deployable combinations are separate facts. Version suffixes that cannot be compared safely remain unknown.

## Data and evidence

See [data model](docs/data-model.md), [source/review policy](docs/source-policy.md), [architecture](docs/architecture.md), [deployment](docs/deployment.md), and [roadmap](docs/roadmap.md).

- `data/products/catalog.json`: normalized manufacturers, families, models, exact PIDs, revisions, modules, software, versions, offers, features, management modes, lifecycle, assertions and withheld research candidates.
- `data/sources/sources.json`: official URL, document title/date, separate check/verification/material-change times, fingerprint, supersession and review state.
- `data/sources/review-issues.json`: visible conflicts, typography problems and coverage gaps.
- `schemas/`: versioned catalog, source and future battlecard JSON Schemas.
- `src/lib/rules.ts`: pure deterministic matching; `scripts/validate-data.mjs`: schema and relational integrity gate.

Every material assertion points to its source and includes an excerpt/section, applicability, UTC verification date, interpretation, confidence and reviewer state. Excerpts and hashes are stored instead of complete copyrighted vendor documents. Source evidence is viewable next to specs. Unknown is neither passed nor failed; unsupported requires actual evidence. Scores mean the percentage of selected checks verified, not recommendation confidence. Unresolved requirements always prevent a verified fit, even with a high score or family preference.

### Contribute a source-backed record

1. Read the source policy. Find the actual orderable identifier in an official ordering table; do not infer suffixes.
2. Add the source and lawful excerpt/hash metadata. Keep vendor dates distinct from your check time.
3. Add entities and scoped assertions. Use conditional or unknown for missing firmware, licensing, mode coexistence or technical-matrix information. Family-to-PID inferences must be marked `derived`.
4. Link conflicting/superseded assertions; flag unresolved conflicts. Do not overwrite an inconvenient source silently.
5. Run data validation, unit tests, lint, build and relevant browser tests. Have the publisher review the evidence before deployment.

Do not put credentials in data, URLs, `.env` commits, tests, bundles, source excerpts or logs. Public Cisco documents retain their owners' copyright; this repository grants no rights to redistribute full vendor documents, logos or product images. Device drawings are generic category illustrations, explicitly labeled as such. No license for Cisco documentation is inferred from public access.

## Source audits

```sh
npm run audit:sources
# JSON report defaults to /tmp/iiot-source-audit.json
python3 scripts/audit_sources.py --output /tmp/my-audit.json
```

The read-only audit honors robots.txt, allows only public `https://www.cisco.com` sources/redirects, limits response size, keeps TLS verification on, waits between requests, and fails on unavailable/disallowed sources. It records text fingerprints and `unchanged`, `changed`, `baseline-needed`, `unreachable`, or `robots-disallowed`; changed content is not a changed compatibility claim. Hashes do not update the approved baseline automatically. Claims and lifecycle are not inferred by this Phase A audit.

The monthly workflow runs at **07:17 UTC on day 1**, with manual dispatch. GitHub schedules can be delayed and run only from the default branch. Reports are retained as artifacts for 60 days, including failed checks. Changes require review; no meaningful claims auto-publish and no public price/API keys are used. Cisco EoX API integration, parsed claim diffs and citation-bearing update PRs are future work; a monthly green check does not establish exhaustive coverage.

## Deployment

No public deployment is implied by local validation. The Pages workflow is manual and runs validation/tests before publishing. Follow [the deployment guide](docs/deployment.md) to enable Pages, protect the publishing environment and run it. CI and deployment Actions are pinned to exact upstream tag SHAs resolved during setup. Update deliberately.
