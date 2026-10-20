# Architecture decision: static first

React + TypeScript + Vite render an entirely client-side interface. JSON is the version-controlled source of truth and is imported into the production bundle as a build-time search index. The reviewed static portfolio does not require a search service or a generated duplicate index. Search is deterministic and case-insensitive; exact matches sort first. Family preferences rank only within the same decision class and cannot rescue failed hard requirements.

The app uses hash routes (`#/product/<encoded PID>`), which survive GitHub Pages deep links without a 404 rewrite. Requirements are transient state. Comparison IDs persist locally when browser storage is available; malformed/obsolete IDs are discarded. CSV uses UTF-8, quoted cells and formula neutralization. There are no trackers, third-party fonts, login, cookies or mandatory runtime network calls. Official references open in a new tab with `noopener noreferrer`.

The root English dictionary is in `src/lib/i18n.ts`; navigation and shared strings are separated. Full PT-PT translation and extraction of remaining component copy are future work. Device art is an original schematic representing a category; it is not evidence of chassis construction or a port layout.

Supported matching inputs are dedicated built-in copper counts, fixed fiber counts, SFP slots, dedicated uplinks, highest port speed, maximum PoE budget, DIN rail, Cyber Vision, firmware, management mode, lifecycle context and a family preference. This is deliberately not a complete network design/BOM tool. Unknown evidence, unsupported version formats and unverified coexistence stop a verified fit. No inferred port expansion, price, availability or license activation is claimed.

Tests exercise deterministic rules, provenance failures, dates, IDs, search, contradictions, export and browser interactions. Browser tests use actual committed records for browse flows and intercepted synthetic fixtures to isolate comparison plumbing. A valid schema does not establish that a vendor statement is true. Review has to inspect the original source and applicability.

Phase B retains this architecture. Family filtering and a 24-card initial page keep the larger portfolio usable. Product pages add a documentation library, a mode/context compatibility matrix, lifecycle warnings and commercial checks. Family references expose explicitly scoped evidence even when exact ordering identity is unresolved, without adding those research candidates to recommendations.

The optional audit is now a two-job GitHub workflow: public observations run read-only; a separate writer proposes only immutable history in a PR. The existing Pages workflow and required reviewer are unchanged. See `docs/phase-b-evidence.md` for release-specific findings and unresolved boundaries.
