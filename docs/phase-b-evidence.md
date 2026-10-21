# Phase B evidence review and limits

This branch expands the existing static application; it does not replace the architecture or deploy automatically. Exact-PID identity, current sale status, hardware capability, technical software compatibility and commercial entitlement remain separate. Initial source review is by Codex; the PR and existing GitHub Pages environment retain human approval.

## Scope and identity

The subsequent [industrial expansion module extension](expansion-modules.md) adds 19 separately reviewed component PIDs, 150 exact positive hardware-fit mappings and three official hardware-guide references. Current totals are 53 base PIDs, 39 sources and 964 assertions. Local module deployment remains conditional; Meraki 26.1.1 expansion is explicitly unsupported and newer releases remain unverified. Existing citations and all nine review issues are preserved.

53 exact PIDs are documented across 20 hardware families. 23 family entries include three explicit identity/research gaps: IW9165, IW9167, and a distinct IE9300 Heavy Duty family. Coverage is representative, not exhaustive. `data/products/catalog.json` contains all exact identifiers and scoped assertions; the Audit & Sources page groups the same counts by family. An ordering-table identity assertion is not a real-time orderability check.

Wireless data sheets list regulatory-domain placeholders and AP/WGB/URWB mode templates, with some ROW hardware names elsewhere. Neither x-domain templates nor concatenated mode/domain strings have been promoted to exact orderable PIDs. Family reference pages preserve wireless modes and mode-specific software evidence. The checked industrial-switch portfolio does not establish a distinct IE9300 Heavy Duty ordering family; it remains a research target, not a declaration of nonexistence.

IE3505 non-PoE `IE-3505-8T3S-E` and `IE-3505-8T3S-A` have unambiguous ordering rows. The separate duplicated IE3505 PoE -A row remains unresolved; PoE variants are withheld. IE3500 Heavy Duty 16T variants explicitly use X-code M12 copper Ethernet connectors, not RJ45. IR8140 chassis identity is documented, but supervisor/module inclusion was not assumed to create built-in base-port counts.

## Cyber Vision 5.6.x, SEA and SRA

The checked public support index lists 5.6.0 and 5.6.1; 5.6.1 is dated 8 October 2026 in the release history. Knowledge DB release numbers are not new software releases. No 5.7 or later software support is invented.

Table 8 of the [5.6.x release notes](https://www.cisco.com/c/en/us/td/docs/security/cyber_vision/Release-Notes/Cisco-cyber-vision-release-notes-5-6-0.html) is the scoped firmware reference. Matrix train labels such as `17.18.x` are stored as numeric train prefixes (`17.18`) for comparisons; no patch level is invented. Vendor suffix versions that cannot be ordered safely stay unknown.

- IE3300 10G has a different row from non-10G variants. The latter require 4 GB DRAM and VID -06 or later; an exact PID does not prove the installed revision.
- IR1835 has its own minimum 17.15.x row. The more general IR1800 17.9.x row is not substituted for it.
- The IR8300 product cell says IOS XE 17.15.x with at least 3 GB assigned to IOx, while its supported-release cell says minimum 17.9.x. This ambiguity is flagged on the assertion and in the review queue. It does not become a clean compatibility result.
- Installation prerequisites include supported storage/filesystem, IOx service, clock synchronization and appropriate licenses. Family/model mappings remain conditional pending exact deployment validation.
- Cisco's [sensor deployment configuration examples](https://www.cisco.com/c/en/us/td/docs/security/cyber_vision/deploy-cisco-cyber-vision-sensor-on-switches-and-routers/configure-sensor-deployment/c-sensor-deployment-configuration-examples.html) show IE3x00 and IE9x00 collection/mirroring and routing topologies. For IE3x00, separating the platform and sensor networks uses L3NAT-IOx. These are deployment examples, not evidence of Meraki coexistence; the guide is linked on applicable exact-PID pages.

Table 3 of the same 5.6.x release notes explicitly **renames the SEA service to Cyber Vision Secure Remote Access (SRA) in the UI**. This naming change does not prove a change to licensing, agents, hardware or deployment limits. The older SEA data sheet's separate-agent restriction for IR1101/IR1800 is scoped to a separate Cyber Vision sensor plus SEA agent architecture. It does not silently become an incompatible result for an unverified current SRA architecture. Selecting the documented separate-agent architecture surfaces the explicit restriction; selecting a different unverified architecture produces unknown.

Current SEA endpoint subscriptions, Essentials/Advantage features, CV Advantage inclusion date and limited IE3500 bundled entitlements retain their own citations. Order and upgrade dates are checked separately. An eligible date and quantity never establish actual activation, remaining term, or technical support. Exceeding a bundled endpoint quantity means additional licensing is needed; it does not mean the hardware cannot support the requirement.

## Management and coexistence

The matrix includes local CLI/WebUI, Catalyst Center, Meraki, IoT Operations Dashboard, SD-WAN and IoT FND. Only sourced positives are populated. No source for a mode is displayed as not yet verified, not incompatible. Firmware, software release, selected license, architecture and feature conjunction are part of deterministic evaluation. Scoped negatives cannot apply before their context is selected; a restriction on CV + SEA is not a restriction on CV alone.

IE3500 Meraki base management retains the documented IOS XE 26.1.1 minimum, licensing and future expansion-module caveat. The checked data sheet, current CV support/preparation guides and 5.6.x notes do not explicitly establish exact-PID CV/SEA/SRA coexistence in Meraki mode. It remains unknown. No private Cisco system or confidential matrix was consulted.

## Lifecycle and replacements

Exact affected-PID rows and milestone tables are cited for selected IE2000, IE3000, IE4000, IE4010, IE5000 and IR829 models. The selected IE3000s reached last support in June 2025; the other selected legacy records are past end of sale but have future last-support milestones. Announced future milestone dates are legitimate data; future verification dates are rejected.

Replacement links are official migration suggestions, not drop-in equivalence. Port/media differences, modules, regional Wi-Fi options, software and licenses remain constraints. Relevant replacement alternatives outside the reviewed catalog stay named in cited notes rather than being fabricated as fully validated records. Remaining lifecycle gaps stay unknown; absence of a public bulletin is not an active-sales assertion.

No Cisco/EoX credential binding names were present in the machine. The public EoX documentation request to developer.cisco.com was blocked by the environment egress proxy (CONNECT 403), so authenticated API setup was not claimed as tested. No credentials are needed by the static app or public-document audit. No credential requirement, fake token or client-side integration was added. Automating exact-PID EoX checks is optional Phase C work after server-side CI credentials and scope are established.

## Audit maintenance

The monthly observation job still runs at 07:17 UTC on day 1 and can be delayed by GitHub. It now associates changed/unavailable sources with their exact assertions, extracts explicitly labeled vendor dates, flags overdue verification, retains open review flags, and proposes immutable history in a PR. Reports contain `claimsChanged: []` and `newLifecycleEvents: []` because a page hash does not establish either. Technical claims and source baselines are never changed by this automation.

The first Phase B audit reached all 35 references, with no changed fingerprints or unreachable pages; it still reports the IR8300 assertion flag and nine open issues. History includes dates, counters and downloadable structured reports. Reports persist after human review/merge and are also retained as workflow artifacts. The writer job has only repository-content and pull-request write permissions; observation runs read-only. GitHub's repository setting must permit Actions to create PRs for automatic history proposals.

## Remaining priorities

1. Obtain explicit Meraki + on-device security coexistence statements for exact PID, firmware, license and architecture combinations.
2. Resolve wireless fully specified ordering identities and the separate IE9300 Heavy Duty research target using public primary documents.
3. Clarify the IR8300 5.6 firmware row and validate newer SRA deployment architecture separately from legacy SEA agents.
4. Expand exact release/configuration and certification coverage; partial protocol or standards lists never imply an omitted feature is unsupported.
5. Extend lifecycle coverage and authenticated EoX only where useful; maintain reviewed snapshots and regression tests.

The app remains static and uses a build-time data index. The expanded evidence increases the raw JS bundle to about 1 MB (about 130 kB gzip estimate); Vite reports its normal chunk-size advisory. Pagination limits initial cards to 24. Evidence/index separation is a useful future optimization if measurements justify it; no backend or runtime API key is introduced.
