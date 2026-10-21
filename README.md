# Cisco IIoT Product Selector

An evidence-led, static React/TypeScript application for Cisco industrial networking selection and technical reference. Independent research tool; no Cisco affiliation or endorsement. Public content only: no login, analytics, pricing, stock checks, private systems or production API keys.

## Develop and validate

Use Node **24.19.0**, pinned in `.node-version`, npm and Python 3 (standard-library audit tests). Use the existing isolated cloud checkout; do not create another worktree unless explicitly requested.

```sh
npm ci --cache /workspace/.cache/npm
npm run dev -- --port 5173 --strictPort
```

Outside the cloud, use any writable npm cache path or omit `--cache`. No backend, database or `.env` is required. Restart the dev server after a cloud snapshot restores; live processes do not survive publication.

```sh
npm run validate:data
npm run lint
npm test
npm run format:check
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
# Else install the matching Playwright browser first:
npx playwright install chromium
npm run test:e2e
```

`npm test` runs TypeScript unit/schema/rules tests and Python source-audit/history tests. `npm run build` validates data and immutable audit history, type-checks, then builds. Synthetic `TEST-*` records are test-only and never enter production data. `npm run format:check` checks repository formatting.

## Phase B coverage

**53 source-reviewed exact base PIDs across 20 hardware families**, plus three explicit family research gaps and **19 separately selectable expansion-module PIDs**. The registry contains **39 public official Cisco sources and 964 scoped assertions**. Exact identities, historical sales lifecycle, hardware capability, technical support and commercial entitlement are separate. Initial source review is by Codex; **human PR and deployment approval are required**. A data-sheet entry is not proof of current orderability.

| Families                                         | Reviewed exact PIDs                                     |
| ------------------------------------------------ | ------------------------------------------------------- |
| IR1000                                           | IR1001-G2; IR1005-G2                                    |
| IE3500                                           | Eight original 8T3S / 8P3S / 8T3X / 8U3X -E/-A variants |
| IE1000 / IE2000 / IE3000                         | Two per family                                          |
| IE3100 / IE3200 / IE3300 / IE3400                | 1 / 2 / 8 / 4                                           |
| IE3505 / IE3500 Heavy Duty                       | Two per family                                          |
| IE4000 / IE4010 / IE5000 / IE9300                | 2 / 2 / 2 / 4                                           |
| IR1101 / IR1800 / IR8140 / IR8340 / legacy IR800 | 1 / 2 / 2 / 1 / 2                                       |

See [full grouped coverage and all official references](docs/phase-b-coverage.md), [technical evidence and limitations](docs/phase-b-evidence.md), and the actual exact-PID records in `data/products/catalog.json`. The portfolio dashboard derives its counts from the data.

IW9165/IW9167 ordering tables use domain and operating-mode templates. Family references preserve technical evidence, but no concatenated or placeholder SKU is treated as a verified orderable PID. A separate IE9300 Heavy Duty ordering identity was not located; it remains unresolved. Unambiguous IE3505 non-PoE records are included; the duplicated PoE ordering row remains withheld.

## Selection and technical intelligence

- Fast PID/model/description/family search, family navigation, card/table views and a 24-card initial page with Show more.
- Requirements for physical Ethernet count, dedicated copper/fixed fiber/SFP slots, uplinks, port rates, PoE output standard/budget, operating temperature, cellular/Wi-Fi, management, CV/SEA, industrial protocols/standards and lifecycle context.
- Deterministic explanations with **Verified compatible**, **Conditionally compatible**, **Verified incompatible** and **Not yet verified** states. Unknown is not passed or failed; partial feature lists do not establish unsupported omissions. Scoped negatives require their actual context.
- Exact-PID deep links; 2–4 product comparisons; CSV with restrictions and official source URLs. Formula-like CSV cells are neutralized.
- Source-backed IE3300/3400/3500/3505 module selection, separate built-in/expansion port totals, shared PoE and slot checks, saved exact-PID configurations, BOM CSV and configuration JSON. See the [module coverage matrix and deployment restrictions](docs/expansion-modules.md). Meraki expansion is not verified; local firmware/license and installation conditions remain visible. Router modules are researched as a follow-up.
- Direct documentation libraries, scoped evidence, provenance dates and review issues. Combo media count once; console, PoE input and optional module capacity are not silently counted as base Ethernet/PSE capabilities.
- Selected official legacy lifecycle notices and conditional replacement suggestions. Verified EoS/EoL equipment is excluded from new-deployment results unless explicitly inspected; unknown lifecycle is never inferred active.

Cyber Vision **5.6.x** has release-specific firmware, hardware revision and IOx prerequisites. The notes rename SEA to **Cyber Vision Secure Remote Access (SRA)** in the UI; no entitlement or technical-support change is inferred from that rename. IE3300 4 GB/VID requirements, IR1835-specific firmware and the ambiguous IR8300 row remain visible. Meraki + on-device CV/SEA/SRA coexistence is still unknown for the checked exact combinations. Selecting a legacy separate-agent architecture is distinct from an unverified current SRA deployment.

Commercial bundle checks keep new-order and upgrade thresholds separate, enforce included endpoint quantity, and retain activation/remaining-term uncertainty. A 24-endpoint, 36-month bundle is not perpetual or proof of a deployable software combination. Additional endpoint licensing is a constraint, not a blanket hardware exclusion.

## Data, source policy and contributions

- `schemas/catalog.schema.json`: normalized catalog **v1.2.0**; typed assertions, separate base/module inventories, component dimensions and power, revisions, software/versions, offers, entitlements, management and lifecycle events.
- `data/sources/`: URLs, titles, vendor/check/material-change dates, hashes, supersession and unresolved/partially resolved issue history.
- `data/audits/`: immutable observation reports and a validated downloadable history index.
- `src/lib/rules.ts`: pure matching and commercial-eligibility rules; `src/lib/ports.ts`: physical-port counting.
- `src/lib/configurations.ts`: exact base/module and complete-configuration evaluation; `src/lib/saved-configurations.ts`: PID-based local persistence with fresh validation on load.
- `data/competitors/`: empty future battlecard data. Future official vendor sources require an explicit manufacturer/domain declaration; no speculative competitor equivalence is populated.

Read [data model](docs/data-model.md), [source/review policy](docs/source-policy.md) and [architecture](docs/architecture.md). Every material assertion needs source, excerpt/section, applicability, UTC verification date, confidence, interpretation and reviewer state. Prefer technical matrices and release notes for support claims. Preserve conflicts and superseded assertions. Family-to-PID mappings are marked derived/conditional when exact scope is incomplete.

For a contribution, identify a concrete PID in official ordering/affected-product tables, capture a lawful short excerpt and hash, add scoped assertions, run all checks and submit a review PR. Never infer current orderability from an old data sheet. Vendor documents retain their copyright; no redistribution right for full documents, product imagery or logos is implied. Generic device illustrations are labeled category schematics. Credentials never belong in source files, URLs, excerpts, browser bundles or logs.

## Monthly audits

```sh
npm run audit:sources
# /tmp/iiot-source-audit.json; never edits approved claims/baselines
python3 scripts/record_audit.py /tmp/iiot-source-audit.json
# Proposes immutable data/audits history; review before merge/publication
```

The audit honors robots.txt, HTTPS verification, host/redirect allowlisting, rate limits and response-size limits. It observes fingerprints and explicit vendor dates, associates changed/unavailable sources with exact assertions, flags verification older than 180 days and retains existing conflicts. Reports include dataset hashes and counters; they do not invent parsed technical changes.

The GitHub workflow runs at **07:17 UTC on day 1** (may be delayed) and supports manual dispatch. Observation runs read-only; a separate writer job can propose only history files through a source-cited PR. Reports are retained as artifacts for 90 days and as reviewed Git history. GitHub repository settings must permit Actions to create PRs for automated proposals. Neither job deploys or overwrites verified technical information.

No EoX/API credential is needed by the current app or public-document audit. Authenticated EoX automation is optional future work; any credentials must remain server-side CI secrets. A monthly green job is not proof of exhaustive vendor coverage.

## Deployment and next work

Publication is pending: at the 21 October 2026 review, the only recorded Pages deployment (Phase A run `39465932631`) still awaited approval despite a successful build. Phase B remains in PR #1, separate from `main`. The existing manual deployment workflow and `github-pages` human-review gate are preserved. See the [pre-merge quality review](docs/pre-merge-review.md), [deployment evidence and release steps](docs/deployment.md) and [prioritized roadmap](docs/roadmap.md).
