# Next phases

Phase B expands the existing application to 53 exact base-PID identities across 20 hardware families, 19 selectable switch-module PIDs, 42 official source references, advanced technical requirements, contextual compatibility, lifecycle/replacement evidence and immutable audit-history proposals. Three family identity gaps remain visible rather than guessed. The deployment workflow and human reviewer are preserved. See the [expansion matrix](expansion-modules.md).

## Phase C priority

1. **Close support gaps first.** Obtain explicit exact-PID Meraki/CV/SEA/SRA coexistence evidence, resolve the IR8300 5.6 firmware ambiguity, check current SRA agent/deployment architecture, and resolve concrete wireless mode/domain ordering identities and the IE9300 Heavy Duty research target.
2. **Improve release/configuration coverage.** Validate exact controller/firmware/license/revision combinations, protocol profiles, redundancy coexistence, power/PoE design and certificate/evaluated-configuration scope. Close switch-module runtime/coexistence and absolute slot/chaining limits, establish actual Meraki expansion releases, then implement the researched IR1101/IR1800/IR8300/IR8340 module follow-up. Extend partial assertions only with primary evidence. Source-backed component dimensions prepare for a later cabinet simulator; assembled geometry and the simulator remain future work.
3. **Expand lifecycle.** Keep exact-PID public milestone/migration checks; add authenticated Cisco EoX only with validated server-side CI credentials and useful coverage. No absence-of-bulletin active-sales inference.
4. **Maintain trustworthy audits.** The current monthly job observes source/date changes, overdue claims and review queues, and proposes history PRs. Add narrowly tested parsers that propose cited technical edits only when exact meaning and applicability can be established; never automatically overwrite approved claims based on page hashes.
5. **Measure performance and usability.** The expanded static evidence index is about 1.4 MB raw JS, about 154 kB gzip. Initial cards are paginated. Separate detailed provenance from the fast index if browser measurements justify it. Finish string extraction/PT-PT translation and improve multi-license entry and evidence navigation. Module selection and PID-based saved configurations are implemented.

## Beta UX quick win — Port-count selectors (planned)

Track this usability improvement in [GitHub issue #4](https://github.com/Di0gobp/cisco-iiot-product-selector/issues/4). Replace freeform numeric inputs for minimum physical Ethernet ports and minimum ports at a selected link speed with integrated, responsive dropdowns or compact quick selectors: Any, 4, 8, 12, 16, 24, 32, 48 and **Other value** (custom integer). Preserve the existing **at least N** meaning, exact speed-per-port validation, separately selected expansion capacity, combo deduplication and the ability to restore uncommon values from saved configurations. Optionally provide common rate presets without changing the matching algorithm. Validate desktop/mobile, keyboard accessibility, reset behavior and persistence. This is a small post-beta UX change suitable for an independently reviewed PR before broader Phase C work; it is not yet implemented.

## Phase C enhancement — Product imagery and verified mounting options (planned)

Track this work in [GitHub issue #3](https://github.com/Di0gobp/cisco-iiot-product-selector/issues/3). The current selector filters for DIN-rail support, but users also need **19-inch rack mounting / rack rails (rack mount)**, wall mounting, panel mounting, shelf/tray installation and any Cisco-documented adapter/rail mounting options. Rack rails and DIN rails must be modeled as distinct mounting standards. Capture support by exact PID and revision, installation orientation, mounting constraints, required/optional brackets and **exact accessory PIDs** with official Cisco installation/ordering citations. Surface this in filters, product details, comparisons and the exported BOM; distinguish direct support from conditional support requiring a mounting kit, and leave unverified options unknown.

Add **real equipment photographs** to product cards and detail pages, with an image gallery where suitable (front/rear/side, clear model labeling, alt text and mobile optimization). Prioritize official Cisco product media and retain source attribution, verified PID/family applicability and image-use rights. Do not assume a publicly available Cisco image may be redistributed, hotlinked or bundled. Clearly mark representative family images and use schematic placeholders when licensed media or exact-PID imagery is unavailable. Start with a small rights-reviewed pilot before expanding coverage.

Both additions are post-beta Phase C UX/data work and should feed [Phase E's cabinet/DIN-rail 3D simulator](https://github.com/Di0gobp/cisco-iiot-product-selector/issues/2): mounting-kit geometry, supported orientations and approved product visuals must not substitute for source-backed physical dimensions, clearances or installation approval. These items are **planned**, not implemented or required to keep the existing beta available.

## Competitive intelligence

The future schema retains exact competitor SKU/category, vendor sources, condition-specific parity, balanced strengths and weaknesses on both sides, operating model, licenses, independent user-evidence credibility, discovery questions and objections. Manufacturer/domain declarations now allow future public official vendor evidence without weakening Cisco provenance checks. No competitor claims are populated in Phase B.

## Phase E — Interactive 3D cabinet layout (planned)

Track implementation in [GitHub issue #2](https://github.com/Di0gobp/cisco-iiot-product-selector/issues/2). Let users compare the real physical size of selected exact PIDs in a simulated 19-inch network rack or DIN-rail industrial enclosure. The initial 3D viewer should support scale-accurate simplified models, cabinet dimensions, positioning, rotation, occupied rack units, available space, collision checks, and an exportable equipment list. React Three Fiber / Three.js can run entirely in the existing browser-based architecture.

Before claiming physical fit, enrich the evidence model with Cisco-sourced chassis dimensions (W/H/D), mounting options, mounting accessories, module/PSU protrusions, orientation, and any documented cable/ventilation/service clearances. Missing measurements remain unknown, and a simulated geometric fit must not imply thermal, electrical, or installation compliance. Add detailed clearances and higher-fidelity licensed 3D models later; preserve a 2D/table fallback for accessibility and low-power devices.

This is a future user-facing visualization feature, not a blocker for Phase B release. It follows Phase C technical data readiness and does not replace the existing competitive-intelligence workstream.
