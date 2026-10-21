# Cisco industrial expansion modules — Phase B

The catalog contains **53 base PIDs and 19 separately reviewed expansion-module PIDs**, with 964 scoped assertions and 39 official references. Module ordering identities retain the published trailing `=`. No module is installed by default. The existing nine review issues and prior audit snapshots are retained.

## Coverage and exact base compatibility

These are hardware-fit mappings from the official supported-module tables and their listed base variants. They do not establish a complete release/license/management deployment. The application evaluates the exact base ID; family membership alone never grants compatibility.

| Base family and retained exact base variants                                                             | Module PIDs added / applicable                                                                                                         | Hardware mapping and remaining restrictions                                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IE3300: `IE-3300-8T2S-E/-A`, `IE-3300-8P2S-E/-A`, `IE-3300-8T2X-E/-A`, `IE-3300-8U2X-E/-A` (8 base PIDs) | `IEM-3300-8T=`, `IEM-3300-16T=`, `IEM-3300-8S=`, `IEM-3300-6T2S=`, `IEM-3300-14T2S=`, `IEM-3300-8P=`, `IEM-3300-16P=`, `IEM-3300-4MU=` | Five non-PoE modules map to all eight bases. The three PoE modules map only to the four 8P/8U bases; non-PoE hosts are explicitly rejected. Shared system PoE ceiling: 360 W for 8P2S, 480 W for 8U2X, subject to supply conditions.                     |
| IE3400: `IE-3400-8T2S-E/-A`, `IE-3400-8P2S-E/-A` (4 base PIDs)                                           | All eight IEM-3300 PIDs above, plus `IEM-3400-8T=`, `IEM-3400-8S=`, `IEM-3400-8P=`                                                     | Seven non-PoE modules map to all four bases; four PoE modules map only to the two 8P2S bases. Any IEM-3300 combination prevents SGT/SGACL on the IE3400 base. Shared PoE ceiling with expansion: 480 W.                                                  |
| IE3500: `IE-3500-8T3S-E/-A`, `IE-3500-8P3S-E/-A`, `IE-3500-8T3X-E/-A`, `IE-3500-8U3X-E/-A` (8 base PIDs) | `IEM-3500-8T=`, `IEM-3500-16T=`, `IEM-3500-8S=`, `IEM-3500-6T2S=`, `IEM-3500-14T2S=`, `IEM-3500-8P=`, `IEM-3500-16P=`, `IEM-3500-4MU=` | Five non-PoE modules map to all eight bases. Three PoE modules map only to four 8P/8U bases. Shared PoE ceiling: 360 W on 8P3S, 480 W on 8U3X. IEM-3500-4MU= does not support PTP, HSR, PRP or DLR on module ports.                                      |
| IE3505: `IE-3505-8T3S-E/-A` (2 base PIDs)                                                                | The five non-PoE IEM-3500 PIDs above                                                                                                   | The three PoE IEM-3500 modules are blocked on these non-PoE hosts. IE3505 PoE base PIDs remain withheld because the data-sheet ordering conflict is still open; their appearance in a hardware-guide model table does not silently close that conflict.  |
| IE9300: `IE-9320-24T4X-E/-A`, `IE-9320-24P4S-E/-A` (4 base PIDs)                                         | None verified                                                                                                                          | No port-expansion module ordering/support evidence was found in the checked IE9300 data sheet. The UI states this gap; it does not declare a separate module nonexistent or count transceivers, stacking links or redundant PSUs as extra chassis ports. |

The 19 distinct modules produce 150 positive hardware-fit base/module pairs across the 22 retained IE3300/3400/3500/3505 base PIDs. PoE-host negatives are also recorded explicitly. Unknown pairings cannot be added through the UI and never become a positive match if encountered in an old saved configuration.

## Module specifications

Copper connectors are RJ45; SFP figures count cages requiring separate compatible transceivers. No fixed-fiber interface or SFP+ expansion is inferred. Port rates describe link capabilities, not aggregate nonblocking forwarding guarantees.

| Exact module PID | Additional interfaces | Documented rates (Mbps)                | PoE classification          | Equipment consumption, excluding PoE |
| ---------------- | --------------------- | -------------------------------------- | --------------------------- | -----------------------------------: |
| IEM-3300-8T=     | 8 copper              | 100 / 1000                             | None                        |                                  6 W |
| IEM-3300-16T=    | 16 copper             | 100 / 1000                             | None                        |                                 12 W |
| IEM-3300-8S=     | 8 SFP                 | 100 / 1000                             | None                        |                                 19 W |
| IEM-3300-6T2S=   | 6 copper + 2 SFP      | 100 / 1000                             | None                        |                                  9 W |
| IEM-3300-14T2S=  | 14 copper + 2 SFP     | 100 / 1000                             | None                        |                                 16 W |
| IEM-3300-8P=     | 8 copper              | 100 / 1000                             | 802.3af / 802.3at           |                                 14 W |
| IEM-3300-16P=    | 16 copper             | 100 / 1000                             | 802.3af / 802.3at           |                                 21 W |
| IEM-3300-4MU=    | 4 copper              | 1000 / 2500                            | PoE / PoE+ / 802.3bt Type 4 |                                 20 W |
| IEM-3400-8T=     | 8 copper              | 100 / 1000                             | None                        |                                 12 W |
| IEM-3400-8S=     | 8 SFP                 | 100 / 1000                             | None                        |                                 27 W |
| IEM-3400-8P=     | 8 copper              | 100 / 1000                             | 802.3af / 802.3at           |                                 20 W |
| IEM-3500-8T=     | 8 copper              | 10 / 100 / 1000                        | None                        |                                  6 W |
| IEM-3500-16T=    | 16 copper             | 10 / 100 / 1000                        | None                        |                                 11 W |
| IEM-3500-8S=     | 8 SFP                 | 100 / 1000                             | None                        |                                  9 W |
| IEM-3500-6T2S=   | 6 copper + 2 SFP      | Copper 10 / 100 / 1000; SFP 100 / 1000 | None                        |                                 10 W |
| IEM-3500-14T2S=  | 14 copper + 2 SFP     | Copper 10 / 100 / 1000; SFP 100 / 1000 | None                        |                                 16 W |
| IEM-3500-8P=     | 8 copper              | 10 / 100 / 1000                        | 802.3af / 802.3at           |                                 12 W |
| IEM-3500-16P=    | 16 copper             | 10 / 100 / 1000                        | 802.3af / 802.3at           |                                 22 W |
| IEM-3500-4MU=    | 4 copper              | 100 / 1000 / 2500                      | PoE / PoE+ / 802.3bt Type 4 |                                 20 W |

Dimensions and weight are stored per component in source-backed `physicalDimensions` assertions, in mm/kg with an explicit `scope: component`. IE3300/3400 data-sheet columns use **H × W × D**; IE3500 uses **W × H × D**, which is normalized before storage. Every retained expandable base also has a separate chassis-dimensions assertion. Final assembled dimensions remain null/unverified: connector overlap, mounting clearances and module-width conventions prevent summing component widths into an assumed envelope. No 3D simulator is implemented.

## Deployment, slots and power limits

- **Firmware and licenses:** the checked supported-hardware tables establish hardware fit, but do not close a complete exact module/firmware/license matrix. Local IOS XE module deployment remains conditional even when a user enters firmware and confirms a Network Essentials/Advantage license. Other management modes require explicit evidence.
- **Meraki:** the IE3500 data sheet states “Base switch supported on IOS XE 26.1.1 and above, expansion module support with future IOS XE release.” The negative is scoped to Meraki 26.1.1. A newer requested firmware remains unknown until a source explicitly establishes expansion support. Proposed module ports remain visible but contribute no positive deployable match in those modes.
- **Slots:** the installation guides document a right-side attachment position. That one-position build is modeled. The checked excerpts do not explicitly state a numeric absolute chassis maximum or approve module chaining, so `maximumModules` remains null. The UI blocks additions beyond the documented position; the evaluator enforces a hard slot maximum only when it is explicitly verified. No maximum was invented from a marketing port total.
- **Power:** base and module share one system PoE ceiling; module PoE capacity is never added as a second independent budget. Known per-port ceilings can further limit the configuration. The supply must cover documented equipment consumption plus requested PoE; input voltage, thermal derating and the configured power budget still need a checked design. The supply input and installation checkbox record user context, not Cisco approval or license activation.
- **Installation:** attach/remove with switch power off, ground the expansion module separately and attach it before DIN-rail mounting. The cited installation guides and their evidence remain available in the product section.
- **CV/SEA/SRA:** base-only support, included endpoint licenses and the SEA-to-SRA name change do not establish coexistence for an expanded configuration. Requiring either security service adds an unknown combined-deployment result until exact evidence exists.

For example, IE-3300-8T2S-E + IEM-3300-8T= provides **16 dedicated Gigabit copper ports and 18 physical Ethernet interfaces including the two base SFP cages**. The generic eight-base-port + eight-module-port acceptance fixture counts exactly 16. Both cases retain built-in/expansion origin and de-duplicate combo media.

## UI, sharing and saved configurations

Relevant product pages expose exact module choices, hardware/runtime states, source excerpts, dimensions, power and restriction details. Adding/removing a module recalculates the selector, rate counts, media totals, PoE ceiling, equipment power and documented positions. Optional modules are never auto-selected to satisfy a filter.

Comparisons show the base PID and selected module PIDs alongside the base specifications. CSV comparisons include configuration rows; BOM CSV exports every base/module PID and quantity with constraints and official references. Configuration JSON contains explicit base/module PIDs, context and evaluation. Browser storage uses the same PID-based format; loaded combinations are evaluated again, and obsolete/unrecognized modules remain unknown instead of gaining capacity. Downloads work when browser storage is unavailable.

## Official evidence

- [IE3300 data sheet](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-ie3300-rugged-series/catalyst-ie3300-rugged-series-ds.html): ordering information; Tables 3/5 hardware and supported modules; Table 6 dimensions; Tables 8/9 power; PoE-host and IE3400 security footnotes.
- [IE3400 data sheet](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-ie3400-rugged-series/cat-ie3400-rugged-series-ds.html): corresponding module tables, cross-family support, security restriction, physical and power rows.
- [IE3500/IE3505 data sheet](https://www.cisco.com/c/en/us/products/collateral/networking/industrial-switches/ie3500-rugged-series/ie3500-rugged-series-ds.html): Tables 3/5/6/8/9 and ordering Table 21; Meraki future-support footnotes; IEM-3500-4MU protocol restrictions.
- [IE3x00 installation chapter](https://www.cisco.com/c/en/us/td/docs/switches/lan/cisco_ie3X00/Hardware/installation/guide/b_ie3x00_hig/b_ie2k-ip67-hig_chapter_010.html): attachment, power-off, grounding and rail-installation procedure. The IE3400 official support index links to this same guide; exact full installation validation remains conditional.
- [IE3500/IE3505 installation chapter](https://www.cisco.com/c/en/us/td/docs/IIOT/switches/ie35xx/hw-install-guide/b-ie35xx-hig/m_switch-install.html): attachment, grounding and power-design instructions.
- [IE3500/IE3505 hardware overview](https://www.cisco.com/c/en/us/td/docs/IIOT/switches/ie35xx/hw-install-guide/b-ie35xx-hig/m_overview.html): base models and shared power-rating/budget explanation.
- [IE9300 data sheet](https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-ie9300-rugged-series/catalyst-ie9300-rugged-series-ds.html): retained base hardware and accessories; no verified port-expansion module was added.

All were fetched through the public HTTPS/robots-respecting audit path. Existing data-sheet fingerprints matched the reviewed baselines. The three new hardware-guide references bring the registry to 39. Historical 35- and 36-source reports retain their original coverage and bytes; new reports include the module count in `datasetSummary`.

## Router follow-up — researched, not selectable in this increment

| Platform        | Public capability and candidate identities                                                                                                                                                                                                                                                           | Follow-up needed                                                                                                                                                               |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| IR1101          | [Data sheet](https://www.cisco.com/c/en/us/products/collateral/routers/1101-industrial-integrated-services-router/datasheet-c78-741709.html) lists `IRM-1100-SP`, `IRM-1100-SPMI`, `IRM-1100-4A2T` and `IRM-1100-4S8I`, covering SFP/cellular/storage, serial + two GE, and four SFP/GPIO functions. | Exact module release, stacking/position, power, controller and security matrices require a separate router configuration model.                                                |
| IR1800          | [Data sheet](https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-ir1800-rugged-series-routers/nb-06-cat-ir1800-rugged-ser-rout-ds-cte-en.html) documents two cellular PIM positions, one Wi-Fi wide-pluggable position, GNSS and SSD options.                                         | `WP-WIFI6-x(=)` is a region template, not a verified exact module PID. Validate each concrete cellular/Wi-Fi domain/controller and environmental combination before selection. |
| IR8300 / IR8340 | [Data sheet](https://www.cisco.com/c/en/us/products/collateral/routers/catalyst-ir8300-rugged-series-router/nb-06-cat-ir8340-rugged-ser-rout-ds-cte-en.html) documents two NIM and two PIM positions; lists `IRM-NIM-2T1E1`, `IRM-NIM-RS232` and `IRM-TIMING-MOD`.                                   | Telecom/serial/timing functions are not Ethernet port expansion. Exact SKU, slot, software and combined CV/SRA support remain follow-up work.                                  |

These candidates do not enter switch configuration matches, BOM component choices or the 19 verified switch-module total.

## Acceptance coverage

Automated tests cover all seven requested acceptance behaviors: 8+8 counting, chassis rejection, Meraki exclusion/unknown future release, verified power/slot limits, unknown compatibility, exact-PID BOM/JSON/comparison export and recalculation after removal. Additional cases cover firmware/license conditions, combined security uncertainty, mixed-module feature restrictions, combo counting, stale saved PIDs and schema/provenance failures. Browser tests exercise add/remove, reload persistence, exports, comparison, mobile layout and accessibility.

Validation on 21 October 2026: catalog/history validation, ESLint, formatting, 69 TypeScript tests, eight Python tests, production type-check/build and all 18 Playwright tests passed. A production preview under `/cisco-iiot-product-selector/` also verified selection/reload persistence, exact-PID BOM download, Meraki capacity exclusion, mobile overflow and the downloadable current audit asset. Desktop/mobile screenshots were inspected. The production JS bundle is 1,386.09 kB raw / 151.12 kB gzip; Vite retains its size advisory.

The latest immutable audit, `2026-10-21T08-21-23Z.json`, checked all 39 sources: zero changed, unreachable or stale observations, one pre-existing flagged IR8300 assertion and nine open/partially resolved review issues. The original 720 assertions, 36 source records, review-issue file, three prior report files and Pages workflow were checked against the pre-extension commit and preserved. Two new module-review snapshots record the evidence checkpoints. PR #1 remains the review boundary; this task does not merge or deploy.
