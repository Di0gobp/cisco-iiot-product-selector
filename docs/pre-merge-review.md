# Phase B pre-merge review — 21 October 2026

Historical review of pre-expansion commit `d36cf89`. The counts and validation below describe that checkpoint. The subsequent module extension adds 19 component PIDs and brings the registry to 39 sources / 964 assertions; see the current [module coverage and limitations](expansion-modules.md). Earlier audit reports are preserved.

This is a Codex quality review, not independent human approval. PR #1 remains open on `codex/phase-b-technical-intelligence` against `main`. No merge, deployment, repository-permission change or environment-approval action was performed.

## Repository and publication evidence

| Dataset                     | Exact PIDs | Families with PIDs | Family entries | Official sources | Assertions | Open issues |
| --------------------------- | ---------: | -----------------: | -------------: | ---------------: | ---------: | ----------: |
| Phase B PR                  |         53 |                 20 |             23 |               36 |        720 |           9 |
| `main` (`e14db1c`, Phase A) |         10 |                  2 |              2 |                5 |        108 |           5 |

The only Pages workflow run returned by GitHub was [39465932631](https://github.com/Di0gobp/cisco-iiot-product-selector/actions/runs/39465932631), targeting Phase A commit `e14db1ce6148d6e218722dc091f6e4b6d3fb95b1`. The build succeeded; the deployment job and statuses for deployment `7206528612` remained `waiting`. No successful deployment status was recorded. `github-pages` still requires reviewer `Di0gobp`. Publication is pending; the configured URL and a successful build do not confirm a release.

## Findings and corrections

- Corrected the deployment document's unsupported claim that Phase A was published, and made the pending state explicit in the README.
- Added `npm run format:check` to regular CI. Existing `npm test` runs both TypeScript and Python tests; build includes data validation and TypeScript checking, followed by Playwright in CI.
- Reproduced response-read timeouts and truncated HTTP responses that could abort the source audit before a report was written. The auditor now records these transport failures, continues to remaining sources, queues affected assertions and preserves its nonzero CLI outcome when any source is unavailable.
- Strengthened audit validation to reject duplicated source entries, unknown source states, cleared review flags on failed observations, and missing technical-change arrays. Historical reports retain their original coverage, independent of today's registry size.
- Corrected open-issue descriptions: lifecycle evidence exists for 12 PIDs, with 41 still unknown; the flagged IR8300 ambiguity is shown as **Not yet verified**, matching the rules. Added the configuration guide and lifecycle notices to the relevant issue references.

## Fresh source audit and history

The requested command, `python3 scripts/audit_sources.py --output /tmp/phase-b-current-audit.json`, exited 0. Its report was validated against the current registry before recording [the new immutable snapshot](../data/audits/2026-10-21T06-50-53Z.json), generated at **2026-10-21 06:50:53 UTC**.

- 36 source IDs checked, exactly covering the current registry; 0 changed fingerprints, 0 unavailable sources and 0 overdue assertions.
- One existing assertion remains flagged: the IR8300 CV 5.6 firmware ambiguity. Nine review issues remain open.
- `claimsChanged` and `newLifecycleEvents` remain empty. Passing URL/fingerprint observations do not establish new technical facts.
- Both earlier snapshots retain their original 35-source coverage and bytes. Only the history index is updated to include the new report.

The observation workflow retains reports even on failed checks and preserves failure status. Its separate writer validates/builds a history-only proposal and opens a PR; it does not edit technical claims, source baselines or publish a release. No live scheduled/writer workflow was dispatched in this review.

## Catalog and rules review

All 53 production PID records point to an approved exact-identity assertion whose excerpt includes the exact PID and whose reviewed source is an official Cisco document. This records published identity, not current sale availability. Public ordering and technical excerpts, source references, schema constraints and selection rules were inspected; no new PID or unsupported compatibility claim was added.

Conditional firmware, revision, software, license and deployment statements remain conditional. Missing support stays unknown; explicit separate-agent negatives retain their architecture/feature scope. Meraki coexistence cannot inherit a generic IOx hosting statement. CV sensor support, SEA/SRA terminology and commercial bundle eligibility remain distinct. Bundle checks never establish activation or remaining term.

Built-in port inventory distinguishes fixed ports, combo media, SFP cages, M12 connectors and optional modules. Scalar counts are cross-checked against inventory; combo media count once and module capacity is excluded. Unknown lifecycle is not treated as active. Source review labels retain Codex/publisher-review provenance.

## Individual open-issue review

No issue was resolved: the checked public evidence does not close the remaining question.

| Issue                         | Status retained    | Evidence and remaining requirement                                                                                                                                                                    |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IR1005 description typo       | Open               | IR1000 Table 11 SKU and Table 2 distinguish the model; the ordering description still repeats IR1001. Corrected vendor description is missing.                                                        |
| IE3505 PoE ordering conflict  | Partially resolved | Non-PoE -E/-A rows are unambiguous. PoE Table 21 repeats -A against both license descriptions; those PIDs remain withheld.                                                                            |
| Meraki + CV/SEA/SRA           | Open               | IE3500 data sheet, CV 5.6 notes and sensor guides do not explicitly support the exact simultaneous management/security combination. Exact PID, release, license and architecture evidence is missing. |
| Lifecycle coverage            | Partially resolved | Exact affected-PID notices cover 12 legacy PIDs. Current sale/support status for the other 41 remains unverified; no active-sales inference from absent notices.                                      |
| Exact-version software matrix | Partially resolved | CV 5.6 firmware trains and IE3300 revision requirements are recorded. Complete exact deployment, license, revision and management validation remains missing.                                         |
| IR8300 CV 5.6 firmware        | Open               | The same row says IOS XE 17.15.x/3 GB IOx and minimum 17.9.x. The assertion remains flagged and resolves to unknown pending Cisco clarification.                                                      |
| IW9165/IW9167 identity        | Open               | Ordering rows contain mode/domain templates. ROW names elsewhere do not establish complete mode-specific orderable PIDs. No template was promoted.                                                    |
| IE9300 Heavy Duty identity    | Open               | The checked portfolio establishes IE9300 Rugged, without a separate Heavy Duty ordering identity. An authoritative exact-PID source is still needed; nonexistence is not asserted.                    |
| SEA-to-SRA scope              | Open               | CV 5.6 explicitly renames SEA in the UI; it does not establish changed licenses or exact current agent coexistence. Legacy separate-agent limits remain scoped to that architecture.                  |

Official references and exact family counts are in [coverage](phase-b-coverage.md); detailed interpretation and remaining limits are in [evidence findings](phase-b-evidence.md).

## Complete local validation

All requested commands exited **0** after the fixes:

| Command                 | Result                                                                                                                                                                                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run validate:data` | 53 PIDs, 720 assertions, 36 sources, four separate research candidates; three valid immutable audit reports.                                                                                                                                                  |
| `npm run lint`          | Passed with zero ESLint warnings.                                                                                                                                                                                                                             |
| `npm test`              | 56 TypeScript tests across five files and eight Python audit/history tests passed.                                                                                                                                                                            |
| `npm run format:check`  | All matched files passed Prettier.                                                                                                                                                                                                                            |
| `npm run build`         | Data/audit validation, TypeScript checking and Vite production build passed.                                                                                                                                                                                  |
| `npm run test:e2e`      | 14 Playwright tests passed, including three automated accessibility checks and downloads of both the current 36-source report and a historical 35-source report. Local Chromium was selected through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`. |

Vite retains its existing chunk-size advisory (approximately 130 kB gzip for the JavaScript bundle); no warning limit or validation was suppressed. Transport-failure and report-integrity regression tests first reproduced the defects and passed after the fixes.

The latest commit's hosted CI result is available in [PR #1 checks](https://github.com/Di0gobp/cisco-iiot-product-selector/pull/1/checks). Human review remains required before merge, followed by a new Pages workflow on the merged `main`, the existing environment approval, and verification of successful deployment and the actual published site.
