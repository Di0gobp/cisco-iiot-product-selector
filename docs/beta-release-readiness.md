# Phase B final validation and beta readiness — 21 October 2026

Verdict: **READY WITH DOCUMENTED LIMITATIONS**, subject to the final validation evidence below and the owner's human review. This is readiness for an independent research beta, not approval of a Meraki + Cyber Vision deployment. No merge, release dispatch, deployment approval or live-publication claim is part of this task. Continue in [PR #1](https://github.com/Di0gobp/cisco-iiot-product-selector/pull/1) on `codex/phase-b-technical-intelligence`.

Current coverage is **53 exact base PIDs, 19 module PIDs, 150 positive hardware-fit pairs, 42 official sources and 976 scoped assertions**. No base/module identity was added in this pass. The original 964 assertions and all five prior immutable reports are retained.

## A. Technical corrections and primary evidence

The critical IE9300 Meraki gap is corrected for exactly these retained PIDs:

- `IE-9320-24T4X-E`
- `IE-9320-24T4X-A`
- `IE-9320-24P4S-E`
- `IE-9320-24P4S-A`

The [IOS XE 26.2.x release notes](https://www.cisco.com/c/en/us/td/docs/switches/lan/cisco_ie9300/software/26-x/release-notes/26-2-1-rn-ie93xx.html), dated 27 September 2026, introduce **“Support for Meraki cloud management”** under **IOS XE 26.2.1**. The Supported hardware section lists all four exact E/A PIDs. The [migration guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/cisco_ie9300/software/17_7/system-mgt-config-ie93xx/m-migration-to-meraki-managed-dashboard.html), dated 28 September 2026, explicitly lists the 24T4X and 24P4S models and states **“Starting from release 26.2.1”**. Its legacy `17_7` URL path is not the feature's minimum version.

Migration prerequisites are IOS XE 26.2.1 or later in INSTALL mode, Dashboard access/claim, a trunk uplink and trunk peer, DHCP/DNS/routable connectivity and the correct clock. The guide says flash, USB drives and SD are formatted; existing configuration must be backed up. Migration performs a factory reset, restricts console access and disables removable USB/SD storage. Returning to IOS XE requires Meraki support. These conditions remain visible in the management assertion and product evidence.

The [IE9300 licensing guide](https://www.cisco.com/c/en/us/td/docs/switches/lan/iiot/licensing/ie9300/ie9300-licensing.html), dated 2 June 2025 and linked from the release notes, documents IOS XE Network Essentials/Advantage and Catalyst Center DNA add-ons. It does **not** establish an exact IE9300 Meraki offer. The public Meraki licensing URL `https://documentation.meraki.com/General_Administration/Licensing/Meraki_Licensing` could not be fetched: the environment's egress proxy rejected the connection with CONNECT 403. It was not registered as a reviewed source. Exact Meraki offer, subscription term and activation therefore remain **unverified**; neither an IOS XE base license nor an IE3500 Meraki offer closes that gap.

The [Cyber Vision 5.6.x release notes](https://www.cisco.com/c/en/us/td/docs/security/cyber_vision/Release-Notes/Cisco-cyber-vision-release-notes-5-6-0.html), Table 8, list IE9300 sensor hardware with minimum IOS XE 17.12.x and recommended 17.12.7a / 17.15.4 / 17.18.3 and above. That platform row does not establish simultaneous Meraki operation or a validated sensor deployment on 26.2.1. Storage changes warrant checking a supported deployment matrix, but do not by themselves prove incompatibility. Coexistence is explicitly **unknown**, never inferred unsupported or supported.

Changes are twelve new scoped assertions: one conditional Meraki management assertion, one unknown Meraki/CV 5.6.x coexistence assertion and one unknown licensing rule per exact PID. Three new official Cisco references are registered. No historical assertion is replaced or deleted; source URLs, short excerpts, sections, dates and review provenance are retained.

Material files changed:

| Area       | Files and purpose                                                                                                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Evidence   | `data/products/catalog.json`, `data/sources/sources.json`, `data/sources/review-issues.json`: exact IE9300 scope and the existing coexistence issue expanded with the remaining licensing/storage questions.                                                          |
| Matching   | `src/lib/rules.ts`, `src/lib/configurations.ts`: shared deterministic ranking; equally verified results with fewer unknown findings rank first. Decision classes, hard exclusions and the verified-check percentage are unchanged.                                    |
| UX         | `src/App.tsx`, `src/styles.css`, `src/components/TechnicalFilters.tsx`, `TechnicalReference.tsx`, `ExpansionModules.tsx`: status guide, separate CV-in-mode evidence, licensing warning, corrected hint, accessible tables/brand and compact comparison restrictions. |
| Regression | `tests/beta-readiness.test.ts`, `tests/e2e/app.spec.ts`, `tests/audits.test.ts`: mandatory scenario, actual module/power cases, storage failure and mobile accessibility; current source coverage updated without rewriting history.                                  |
| Review     | README, coverage/evidence/module/source-policy/roadmap/deployment documents, this report, seven browser screenshots and one new immutable 42-source audit.                                                                                                            |

### Mandatory scenario: observed before and after

Inputs are 16 physical Ethernet interfaces, 16 interfaces capable of at least 1000 Mbps, Meraki management, CV 5.6.x (5.6.1 selected), one chassis preferred, and no firmware or license selected. One base switch is evaluated at a time; modules are never auto-installed. Default new-deployment lifecycle checking remains enabled.

| Check                              | Before (`d42e755`)                                                                | After this pass                                                                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IE9300 physical/rate capacity      | All four have 28 physical and 28 Gigabit-capable interfaces.                      | Unchanged and confirmed against the exact release-note hardware rows and data sheet.                                                                                                         |
| Meraki management                  | Unknown; only local/Catalyst Center evidence existed.                             | Documented from 26.2.1, conditional on migration and unresolved licensing prerequisites.                                                                                                     |
| CV hardware support                | Conditional 5.6.x platform evidence.                                              | Preserved independently; IOx/storage/network/license requirements remain.                                                                                                                    |
| Meraki + CV simultaneously         | Unknown due to missing evidence.                                                  | Explicit scoped unknown, with the reviewed storage/service caveat and no unsupported inference.                                                                                              |
| Overall recommendation             | Unverified.                                                                       | Still unverified; none becomes a verified complete fit.                                                                                                                                      |
| Ordering of equal-score candidates | Two IE3500 Heavy Duty PIDs with unknown Meraki support preceded the four IE9300s. | The four IE9300s appear first because they have documented Meraki prerequisites rather than missing mode evidence; they retain the same 33% verified-check score and unknown overall result. |

IE3500 with IEM-3500-8T= proposes 19 physical interfaces; IEM-3500-16T= proposes 27. In an unverified Meraki release context, only the 11 base interfaces are countable and the modules do not establish the requested match. For explicitly requested 26.1.1, the documented expansion restriction yields an excluded result. Newer unverified releases remain unknown. There is **no verified complete solution** for this mandatory conjunction in the reviewed evidence.

### Five representative identities checked

All corresponding data-sheet fingerprints matched their existing source baselines when fetched during this pass. These checks do not establish exhaustive family or lifecycle coverage.

| Exact record                      | Official evidence and catalog check                                                                                                                                                                                                                                                                       | Outcome / remaining conditions                                                                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `IE-3500-8T3S-E`                  | [Data sheet](https://www.cisco.com/c/en/us/products/collateral/networking/industrial-switches/ie3500-rugged-series/ie3500-rugged-series-ds.html), model/ordering/module tables: 8 copper GE + 3 SFP, exact E ordering identity; Meraki 26.1.1 base-only/future module note; CV 5.6.x minimum 17.18 train. | Eleven built-in interfaces; 19 or 27 with the tested non-PoE modules. Shared power and deployment context remain separate. Lifecycle is unknown.                                                                                           |
| `IE-9320-24T4X-E`                 | [Data sheet](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-ie9300-rugged-series/catalyst-ie9300-rugged-series-ds.html), ordering/hardware rows and new 26.2.1 release notes: 24 GE copper + 4 1/10G SFP+ cages, exact PID and default Network Essentials level.                     | 28 interfaces meet a Gigabit minimum; Meraki prerequisites corrected as above. An absent reviewed PoE-budget fact stays null rather than manufacturing a power guarantee. Lifecycle remains unknown.                                       |
| `IE-3300-8T2S-E` + `IEM-3300-8T=` | [Data sheet](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-ie3300-rugged-series/catalyst-ie3300-rugged-series-ds.html), ordering and supported-module tables: base 8 copper GE + 2 SFP; module adds 8 copper GE.                                                                    | 18 physical/Gigabit-capable interfaces, including 16 dedicated copper. Non-10G CV hosting still requires 4 GB DRAM and VID -06 or later; exact module runtime and combined security support remain conditional/unknown. Lifecycle unknown. |
| `IR1101-K9`                       | [Data sheet](https://www.cisco.com/c/en/us/products/collateral/routers/1101-industrial-integrated-services-router/datasheet-c78-741709.html), ordering and WAN/LAN specifications: 4 Fast Ethernet LAN + one GE RJ45/SFP combo WAN; optional module SFP is separate.                                      | Five physical interfaces, one Gigabit-capable; combo media count once. SD-WAN prerequisites and CV 5.6.x minimum 17.9 train stay conditional. Lifecycle unknown.                                                                           |
| `IR8340-K9`                       | [Data sheet](https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-ir8300-rugged-series-router/nb-06-cat-ir8340-rugged-ser-rout-ds-cte-en.html), ordering/platform tables: 4 RJ45 + 4 LAN combo + 4 SFP + 2 WAN combo, all GE.                                                               | Fourteen interfaces, not twenty; optional NIM/PIM capacity is not assumed. SD-WAN remains conditional. CV's 17.15.x/3 GB versus minimum-17.9.x ambiguity remains flagged; lifecycle unknown.                                               |

## B. Module validation

| Tested exact combination          | Physical / Gigabit-capable total | Dedicated copper | SFP / SFP+ |
| --------------------------------- | -------------------------------: | ---------------: | ---------: |
| IE-3300-8T2S-E + IEM-3300-8T=     |                          18 / 18 |               16 |      2 / 0 |
| IE-3400-8T2S-E + IEM-3400-8T=     |                          18 / 18 |               16 |      2 / 0 |
| IE-3500-8T3S-E + IEM-3500-8T=     |                          19 / 19 |               16 |      3 / 0 |
| IE-3500-8T3S-E + IEM-3500-16T=    |                          27 / 27 |               24 |      3 / 0 |
| IE-9320-24T4X-E without expansion |                          28 / 28 |               24 |      0 / 4 |

Actual PoE regression cases enforce the shared 360 W ceiling for IE-3300-8P2S-E + IEM-3300-16P=, 480 W for IE-3400-8P2S-E + IEM-3400-8P=, and 360 W for IE-3500-8P3S-E + IEM-3500-16P=. Requesting one watt above each excludes the configuration even with a large supply. Existing tests additionally enforce insufficient supply, verified numeric slot limits, chassis incompatibility, combo deduplication, unknown compatibility and Meraki restrictions.

One documented right-side attachment position is modeled; absolute maximum/chaining remains null, and adding beyond the documented position is blocked as unverified. Hardware fit never grants runtime or CV coexistence. Regression cases round-trip exact PIDs through BOM CSV, configuration JSON and local restoration, then remove the module and recalculate media/rates/power/slot use. The full [19-module coverage matrix](expansion-modules.md) and future router follow-up remain unchanged.

## C. Browser and UX review

Reviewed actual browser rendering at **1440×900** and **390×844**: discovery, search, technical filters, result ordering, exact-PID detail, modules, compatibility explanations, comparison, public documentation links, exports, wrapping, overflow and keyboard/accessibility.

Meaningful fixes preserve the design language:

- A four-state text legend explains verified, conditional, unknown and unsupported without depending on color.
- The technical filter hint now acknowledges explicitly selected expansion capacity.
- The management table separates CV in the chosen mode from CV + SEA together; IE9300 licensing uncertainty is explicit.
- Scrollable evidence/comparison tables accept keyboard focus. The brand link's accessible name comes from its visible content, fixing an automated label/content mismatch.
- Long comparison deployment conditions are expandable instead of forcing a very tall mostly empty row on mobile. Overall state remains visible for both base-only and expanded configurations; horizontal scroll guidance is explicit.

Browser evidence (seven committed viewport screenshots):

| Desktop 1440×900                                                  | Mobile 390×844                                  |
| ----------------------------------------------------------------- | ----------------------------------------------- |
| [Scenario results](beta-review/desktop-selector.png)              | [Filters](beta-review/mobile-filters.png)       |
| [IE9300 Meraki evidence](beta-review/desktop-ie9300-evidence.png) | [Module totals](beta-review/mobile-module.png)  |
| [Module totals](beta-review/desktop-module.png)                   | [Comparison](beta-review/mobile-comparison.png) |
| [Comparison](beta-review/desktop-comparison.png)                  |                                                 |

These screenshots show local browser review, not a live published release. Wide engineering tables scroll within their regions rather than forcing page-wide mobile overflow.

## D. Validation and beta safeguards

Final local validation passed on 21 October 2026:

| Check                   | Actual result                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run validate:data` | 53 bases, 19 modules, 976 assertions, 42 sources; six immutable reports valid.                                                                                                                                                                                                                                                  |
| `npm run format:check`  | Passed.                                                                                                                                                                                                                                                                                                                         |
| `npm run lint`          | Passed with zero warnings.                                                                                                                                                                                                                                                                                                      |
| `npm test`              | 83 TypeScript tests and eight Python tests passed.                                                                                                                                                                                                                                                                              |
| `npm run build`         | Production type-check/build passed with GitHub Pages base variables. JS: 1,410.51 kB raw / 153.94 kB gzip; the existing Vite size advisory remains.                                                                                                                                                                             |
| `npm run test:e2e`      | All 21 Playwright tests passed with system Chromium, including mobile, accessibility, storage failures and the mandatory scenario.                                                                                                                                                                                              |
| Production preview      | Actual browser check under `/cisco-iiot-product-selector/`: first four scenario results are unverified IE9300s; deep-link refresh, Meraki prerequisites, module persistence/removal, BOM/JSON downloads, comparison, mobile overflow and current 42-source audit asset passed. Zero page errors or failed local asset requests. |
| GitHub CI               | The same suite runs on the final PR head. Review its exact commit's `CI / check` through [PR #1](https://github.com/Di0gobp/cisco-iiot-product-selector/pull/1); a previous commit's green run is insufficient.                                                                                                                 |

A schema check validates consistency, not the truth of a vendor statement or independent human approval. Only final-commit GitHub CI success completes the readiness check; live Pages behavior remains unverified until the owner's later deployment and smoke test.

The 42-source audit `2026-10-21T08-52-48Z.json` has zero changed fingerprints, unreachable sources or stale claims, one existing flagged IR8300 assertion and nine pending review issues. Its semantic catalog/registry hashes were checked before recording. All five earlier report files remain byte-identical.

Focused safeguards review found no credential-pattern matches in tracked text, no private API integration or internal Cisco source records, no mandatory runtime network requests, no third-party tracking or fonts, and no bundled proprietary Cisco image assets. Device illustrations are original labeled category schematics; review PNGs are screenshots of this application. All 42 registered references use public HTTPS www.cisco.com URLs. The footer identifies the independent research tool and disclaims Cisco endorsement. Browser tests block storage reads/writes and still exercise discovery, configuration, comparison and JSON download; export needs no backend.

The Pages workflow remains manual and byte-identical to its prior version; the `github-pages` environment still requires reviewer Di0gobp. Only old Phase A run 39465932631 was returned, still waiting at commit e14db1c. The configured Pages URL is not evidence of a successful release. No workflow dispatch, obsolete-run cancellation, approval or deployment was performed by this task.

## E. Nine unresolved issues and beta limits

Six issues remain open and three partially resolved; none was silently closed.

| Issue                                             | Current boundary                                                                                           |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| IR1005 description typo                           | Use the SKU column and distinct comparison table; vendor description repeats IR1001.                       |
| IE3505 PoE ordering conflict — partially resolved | Non-PoE identities are retained; ambiguous PoE E/A identities are withheld.                                |
| Meraki/security coexistence                       | Expanded with IE9300 evidence; CV coexistence and exact IE9300 Dashboard entitlement remain unknown.       |
| Lifecycle coverage — partially resolved           | Milestones cover 12/53 base PIDs; 41 retain unknown lifecycle. No missing-bulletin active-sales inference. |
| Exact software matrices — partially resolved      | CV 5.6.x rows constrain firmware/revisions; module runtime, license and combined-deployment gaps remain.   |
| IR8300 CV firmware ambiguity                      | The 17.15.x/3 GB and minimum-17.9.x statements remain preserved and flagged.                               |
| Wireless exact identities                         | Regulatory-domain/mode templates are not orderable PID recommendations.                                    |
| Separate IE9300 Heavy Duty identity               | Research target remains unresolved; no identity is fabricated.                                             |
| SEA/SRA release scope                             | A UI rename does not revise licensing or establish a current combined agent architecture.                  |

The beta is a research aid, not a complete network, thermal, power or compliance design. SFP cages need selected compatible transceivers; PSUs and radios are not assumed installed. Component dimensions do not establish assembled geometry or cabinet fit. No Phase C, competitor content or 3D simulator is implemented.

## F. Release readiness

**READY WITH DOCUMENTED LIMITATIONS** for human review and a controlled public beta once the final PR CI succeeds. The unresolved mandatory Meraki + CV conjunction is clearly labeled and does not become a verified solution. A deployable design still requires exact Dashboard licensing and explicit simultaneous sensor support from Cisco.

No application blocker was identified by the focused review. Owner release actions remain: inspect the cited evidence and limitations, merge the reviewed PR, clear the obsolete Phase A run, dispatch a new `main` release, approve its protected environment and smoke-test the actual live site. Live behavior remains unverified until that succeeds.

## G. Exact publication instructions

Follow [the owner release procedure](deployment.md#review-and-release). In particular, cancel the obsolete Phase A run instead of approving it; otherwise its shared concurrency group can hold the new release. Select `main` for a fresh workflow, verify the merged commit SHA, approve only that new `github-pages` deployment and require successful deployment status before claiming publication. The procedure includes deep-link refresh, assets, 16-port/Meraki/CV results, module changes, exports, saved configurations, mobile layout and downloadable audit smoke checks.
