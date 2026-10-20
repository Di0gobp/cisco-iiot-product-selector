import { useEffect, useState } from 'react';
import {
  catalog,
  sources,
  familyName,
  defaultRequirements,
  specRows,
  auditReportUrls,
} from './lib/catalog';
import {
  rankProducts,
  resolveFact,
  searchProducts,
  formatFact,
} from './lib/rules';
import { comparisonCsv } from './lib/export';
import { en } from './lib/i18n';
import reviewIssues from '../data/sources/review-issues.json';
import type { Candidate, Product, Requirements } from './lib/types';
import { compatibilityLabels } from './lib/compatibility';
import auditHistoryData from '../data/audits/index.json';
import type { AuditSummary } from './lib/types';
import { PortfolioCoverage } from './components/PortfolioCoverage';
import { TechnicalFilters } from './components/TechnicalFilters';
import {
  TechnicalReference,
  FamilyReference,
} from './components/TechnicalReference';
import { Icon, DeviceArt } from './components/Icons';
import { AssertionEvidence, Badge, SourceLink } from './components/Evidence';

const auditHistory = auditHistoryData as AuditSummary[];
type Page = keyof typeof en.nav;
const navEntries = Object.entries(en.nav) as [Page, string][];
function useRoute() {
  const [route, setRoute] = useState(
    () => location.hash.slice(1) || '/selector',
  );
  useEffect(() => {
    const fn = () => setRoute(location.hash.slice(1) || '/selector');
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  useEffect(() => {
    document.getElementById('main')?.focus();
    window.scrollTo({ top: 0 });
  }, [route]);
  return route;
}
function readCompared(): string[] {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem('iiot-comparison') ?? '[]',
    );
    return Array.isArray(value)
      ? value
          .filter(
            (id): id is string =>
              typeof id === 'string' && catalog.pids.some((p) => p.id === id),
          )
          .slice(0, 4)
      : [];
  } catch {
    return [];
  }
}
function Notice() {
  if (catalog.pids.length)
    return (
      <div className="notice" role="status">
        <Icon name="shield" />
        <div>
          <strong>
            Source-reviewed starter catalog · deployment checks remain open
          </strong>
          <span>
            {catalog.pids.length} exact PIDs checked against official documents.
            Lifecycle milestones, conditional software support and remaining
            gaps are shown separately.{' '}
            <a href="#/audit">Review coverage & gaps ↗</a>
          </span>
        </div>
      </div>
    );
  return (
    <div className="notice" role="status">
      <Icon name="shield" />
      <div>
        <strong>{en.noVerified}</strong>
        <span>
          {en.noVerifiedDetail}{' '}
          <a href="#/audit">
            See research status <span aria-hidden="true">↗</span>
          </a>
        </span>
      </div>
    </div>
  );
}
function Hero({ catalogPage }: { catalogPage: boolean }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="live-dot" />
          CISCO INDUSTRIAL IoT <span className="line" /> RESEARCH PREVIEW
        </div>
        <h1>
          {catalogPage ? (
            <>
              Explore the
              <br />
              <em>industrial portfolio.</em>
            </>
          ) : (
            <>
              Industrial networks.
              <br />
              <em>{en.title}</em>
            </>
          )}
        </h1>
        <p>{en.subtitle}</p>
        <div className="hero-foot">
          <Icon name="shield" size={17} />
          <span>Source-backed decisions. Visible uncertainty.</span>
        </div>
      </div>
      <div className="hero-graphic" aria-hidden="true">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="diagram-chip top-chip">
          <span className="mini-square" /> FIELD NETWORK
        </div>
        <div className="diagram-core">
          <svg viewBox="0 0 80 80" width="75" height="75" fill="none">
            <path
              d="M40 11 65 25v30L40 69 15 55V25L40 11Z"
              stroke="#76cbb7"
              strokeWidth="1.4"
            />
            <path
              d="m15 25 25 15 25-15M40 40v29M27 18l26 15v14L27 61"
              stroke="#76cbb7"
              strokeWidth="1.4"
            />
          </svg>
        </div>
        <div className="network-point point-one" />
        <div className="network-point point-two" />
        <div className="network-point point-three" />
        <div className="diagram-chip bottom-chip">
          <span className="mini-square" /> EVIDENCE CONNECTED
        </div>
        <span className="graphic-coordinates">
          01 / CONNECT WITH CONFIDENCE
        </span>
      </div>
    </section>
  );
}
function RequirementsPanel({
  value,
  onChange,
}: {
  value: Requirements;
  onChange: (r: Requirements) => void;
}) {
  const numberField = (
    key:
      | 'copperPorts'
      | 'fiberPorts'
      | 'sfpSlots'
      | 'uplinks'
      | 'poeWatts'
      | 'minSpeedMbps',
    label: string,
  ) => (
    <label className="field" key={key}>
      {label}
      <input
        type="number"
        min="0"
        max="100000"
        step="1"
        value={value[key] || ''}
        placeholder="Any"
        onChange={(e) =>
          onChange({ ...value, [key]: Math.max(0, Number(e.target.value)) })
        }
      />
    </label>
  );
  return (
    <aside className="filters" aria-label="Requirements">
      <div className="filter-heading">
        <h2>
          <Icon name="sliders" size={18} />
          Requirements
        </h2>
        <button
          className="text-button"
          onClick={() => onChange({ ...defaultRequirements })}
        >
          Reset
        </button>
      </div>
      <p className="small muted">Only reviewed facts can confirm a fit.</p>
      <fieldset>
        <legend>Port inventory</legend>
        {numberField('copperPorts', 'Min. built-in copper ports')}
        {numberField('fiberPorts', 'Min. fixed fiber ports')}
        {numberField('sfpSlots', 'Min. SFP / SFP+ slots')}
        {numberField('uplinks', 'Min. built-in uplinks')}
        {numberField('minSpeedMbps', 'Fastest port, min. Mbps')}
        {numberField('poeWatts', 'Min. PoE budget (W)')}
        <p className="hint">
          SFP slots require separate transceivers. Expansion ports are not built
          in. Flexible LAN/WAN ports cannot be counted twice.
        </p>
      </fieldset>
      <fieldset>
        <legend>Capabilities</legend>
        <label className="check-field">
          <input
            type="checkbox"
            checked={value.dinRail}
            onChange={(e) => onChange({ ...value, dinRail: e.target.checked })}
          />
          DIN rail mounting
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={value.cyberVision}
            onChange={(e) =>
              onChange({ ...value, cyberVision: e.target.checked })
            }
          />
          Cyber Vision support
        </label>
        <label className="field">
          Firmware version
          <input
            placeholder="e.g. 17.18.1"
            value={value.firmware}
            onChange={(e) => onChange({ ...value, firmware: e.target.value })}
          />
        </label>
        <label className="field">
          Desired management
          <select
            value={value.managementModeId}
            onChange={(e) =>
              onChange({ ...value, managementModeId: e.target.value })
            }
          >
            <option value="">Any / unselected</option>
            {catalog.managementModes.map((m) => (
              <option value={m.id} key={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Deployment</legend>
        <label className="check-field">
          <input
            type="checkbox"
            checked={value.newDeployment}
            onChange={(e) =>
              onChange({ ...value, newDeployment: e.target.checked })
            }
          />
          New deployment
        </label>
        <p className="hint">
          Excludes reviewed end-of-sale products. Unknown lifecycle stays
          unverified.
        </p>
        <label className="field">
          Preferred family <span className="optional">Optional</span>
          <select
            value={value.preferredFamilyId}
            onChange={(e) =>
              onChange({ ...value, preferredFamilyId: e.target.value })
            }
          >
            <option value="">No preference</option>
            {catalog.families.map((f) => (
              <option value={f.id} key={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </fieldset>
      <TechnicalFilters value={value} onChange={onChange} />
      <div className="filter-note">
        <Icon name="shield" size={16} />
        <p>Unknown does not mean unsupported. We show the gaps.</p>
      </div>
    </aside>
  );
}
function ResearchCard({ candidate }: { candidate: Candidate }) {
  const family = catalog.families.find((f) => f.id === candidate.familyId)!;
  return (
    <article className="product-card research-card">
      <div className="card-top">
        <span className="category">
          {family.category === 'router'
            ? 'INDUSTRIAL ROUTING'
            : 'INDUSTRIAL ETHERNET'}
        </span>
        <span className="outline-tag">Research</span>
      </div>
      <div className="device-wrap">
        <DeviceArt type={family.category} />
      </div>
      <div className="card-body">
        <div className="family-label">Cisco · {family.name} family</div>
        <h3>
          <a href={`#/research/${candidate.id}`}>{candidate.label}</a>
        </h3>
        <p className="card-description">
          {candidate.kind === 'family'
            ? 'Family target · exact PIDs pending'
            : 'PID candidate · orderability unverified'}
        </p>
        <dl className="card-specs">
          <div>
            <dt>Built-in ports</dt>
            <dd>Unknown</dd>
          </div>
          <div>
            <dt>Cyber Vision</dt>
            <dd>Unknown</dd>
          </div>
        </dl>
        <div className="research-status">
          <span className="status-dot" />
          Official evidence pending
        </div>
        <div className="card-actions">
          <SourceLink id={candidate.sourceId} label="Source to review" />
          <a
            className="round-link"
            href={`#/research/${candidate.id}`}
            aria-label={`Research details for ${candidate.label}`}
          >
            <Icon name="arrow" size={18} />
          </a>
        </div>
      </div>
    </article>
  );
}
function ProductCard({
  product,
  requirements,
  compared,
  onCompare,
}: {
  product: Product;
  requirements: Requirements;
  compared: string[];
  onCompare: (id: string) => void;
}) {
  const result = rankProducts([product], catalog.assertions, requirements)[0];
  const basicRows = [
    ['builtInCopperPorts', 'Built-in copper'],
    ['uplinkPorts', 'Dedicated uplinks'],
    ['cyberVision', 'Cyber Vision'],
  ] as const;
  const sourceId = catalog.assertions.find(
    (a) => a.id === product.orderabilityAssertionId,
  )?.sourceId;
  return (
    <article className="product-card">
      <div className="card-top">
        <span className="category">
          {familyName(product.familyId)} · EXACT PID
        </span>
        <span className="outline-tag reviewed-tag">Source reviewed</span>
      </div>
      <div className="device-wrap">
        <DeviceArt
          type={
            catalog.families.find((f) => f.id === product.familyId)?.category ??
            'router'
          }
        />
      </div>
      <div className="card-body">
        <div className="family-label">
          Cisco · {familyName(product.familyId)}
        </div>
        <h3>
          <a href={`#/product/${encodeURIComponent(product.pid)}`}>
            {product.pid}
          </a>
        </h3>
        <dl className="card-specs">
          {basicRows.map(([key, label]) => {
            const fact = resolveFact(
              product,
              catalog.assertions,
              key,
              requirements,
            );
            return (
              <div key={key}>
                <dt>{label}</dt>
                <dd>
                  {fact.state === 'supported'
                    ? typeof fact.value === 'boolean'
                      ? fact.value
                        ? 'Yes'
                        : 'No'
                      : String(fact.value)
                    : fact.state === 'conditional'
                      ? 'Conditional'
                      : fact.state === 'unsupported'
                        ? 'Unsupported'
                        : 'Unknown'}
                </dd>
              </div>
            );
          })}
        </dl>
        <div className="fit-summary">
          <Badge
            state={
              result.decision === 'match'
                ? 'supported'
                : result.decision === 'excluded'
                  ? 'unsupported'
                  : result.decision === 'conditional'
                    ? 'conditional'
                    : 'unknown'
            }
          >
            {result.decision === 'match'
              ? 'Verified fit'
              : result.decision === 'excluded'
                ? 'Excluded'
                : result.decision === 'conditional'
                  ? 'Conditional fit'
                  : 'Fit unverified'}
          </Badge>
          <span>
            {result.score === null
              ? 'No checks selected'
              : `${result.score}% of checks verified`}
          </span>
        </div>
        <details className="fit-details">
          <summary>Why this result?</summary>
          {result.findings.length === 0 && (
            <p className="small muted">
              Select requirements to evaluate a fit.
            </p>
          )}
          {result.findings.map((f) => (
            <div className="finding" key={f.requirement}>
              <strong>{f.requirement}</strong>
              <Badge state={f.state}>{compatibilityLabels[f.state]}</Badge>
              <p className="small">{f.detail}</p>
              <AssertionEvidence
                ids={f.assertionIds}
                assertions={catalog.assertions}
              />
            </div>
          ))}
        </details>
        <div className="card-actions">
          {sourceId && <SourceLink id={sourceId} />}
          <a
            className="round-link"
            href={`#/product/${encodeURIComponent(product.pid)}`}
            aria-label={`Details for ${product.pid}`}
          >
            <Icon name="arrow" size={18} />
          </a>
        </div>
        <button
          className="button secondary"
          aria-pressed={compared.includes(product.id)}
          disabled={compared.length >= 4 && !compared.includes(product.id)}
          onClick={() => onCompare(product.id)}
        >
          {compared.includes(product.id)
            ? 'Remove from comparison'
            : 'Add to comparison'}
        </button>
      </div>
    </article>
  );
}
function Browse({
  selector,
  requirements,
  setRequirements,
  compared,
  onCompare,
}: {
  selector: boolean;
  requirements: Requirements;
  setRequirements: (r: Requirements) => void;
  compared: string[];
  onCompare: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [familyFilter, setFamilyFilter] = useState('');
  const [showExcluded, setShowExcluded] = useState(!selector);
  const [visibleCount, setVisibleCount] = useState(24);
  const [layout, setLayout] = useState<'grid' | 'table'>('grid');
  const approved = searchProducts(
    catalog.pids.filter((p) => p.reviewStatus === 'approved'),
    query,
  ).filter(
    (p) =>
      (!familyFilter || p.familyId === familyFilter) &&
      (category === 'all' ||
        catalog.families.find((f) => f.id === p.familyId)?.category ===
          category),
  );
  const allRanked = rankProducts(approved, catalog.assertions, requirements);
  const ranked = allRanked.filter(
    (r) => showExcluded || r.decision !== 'excluded',
  );
  const visibleResults = ranked.slice(0, visibleCount);
  const excludedCount = allRanked.filter(
    (r) => r.decision === 'excluded',
  ).length;
  const candidates = catalog.candidates.filter(
    (c) =>
      (!familyFilter || c.familyId === familyFilter) &&
      `${c.label} ${familyName(c.familyId)}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()) &&
      (category === 'all' ||
        catalog.families.find((f) => f.id === c.familyId)?.category ===
          category),
  );
  return (
    <>
      <Hero catalogPage={!selector} />
      <Notice />
      <section className="browse-section">
        <div className="section-intro">
          <div>
            <div className="eyebrow muted">THE RIGHT HARDWARE STARTS HERE</div>
            <h2>{selector ? 'Build your shortlist' : 'Browse the catalog'}</h2>
          </div>
          <a className="quiet-link" href="#/audit">
            How we verify <Icon name="arrow" size={16} />
          </a>
        </div>
        <div
          className={
            selector ? 'browse-layout' : 'browse-layout catalog-layout'
          }
        >
          {selector && (
            <RequirementsPanel
              value={requirements}
              onChange={setRequirements}
            />
          )}
          <div className="results">
            <div className="search-toolbar">
              <label className="search-box">
                <Icon name="search" />
                <span className="sr-only">Search by PID, model or family</span>
                <input
                  type="search"
                  placeholder="Search by PID, model or family…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setVisibleCount(24);
                  }}
                />
                <kbd>/</kbd>
              </label>
              <div
                className="view-toggle"
                role="group"
                aria-label="Catalog view"
              >
                <button
                  aria-label="Card view"
                  aria-pressed={layout === 'grid'}
                  onClick={() => setLayout('grid')}
                >
                  <Icon name="grid" size={18} />
                </button>
                <button
                  aria-label="Table view"
                  aria-pressed={layout === 'table'}
                  onClick={() => setLayout('table')}
                >
                  <Icon name="list" size={18} />
                </button>
              </div>
            </div>
            <div
              className="category-tabs"
              role="group"
              aria-label="Product category"
            >
              {[
                ['all', 'All products'],
                ['switch', 'Switching'],
                ['router', 'Routing'],
                ['wireless', 'Wireless'],
              ].map(([id, label]) => (
                <button
                  key={id}
                  aria-pressed={category === id}
                  onClick={() => setCategory(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="family-toolbar">
              <label className="field">
                Product family
                <select
                  value={familyFilter}
                  onChange={(e) => {
                    setFamilyFilter(e.target.value);
                    setVisibleCount(24);
                  }}
                >
                  <option value="">All families</option>
                  {catalog.families.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={showExcluded}
                  onChange={(e) => setShowExcluded(e.target.checked)}
                />
                Show excluded products ({excludedCount})
              </label>
            </div>
            <div className="results-summary" aria-live="polite">
              <span>
                <strong>{ranked.length}</strong> reviewed PIDs{' '}
                <span className="separator">/</span>{' '}
                <strong>{candidates.length}</strong> research{' '}
                {candidates.length === 1 ? 'candidate' : 'candidates'}
              </span>
              <span className="muted small">
                Source reviewed ≠ deployment approved
              </span>
            </div>
            {ranked.length > 0 &&
              (layout === 'grid' ? (
                <div className="product-grid">
                  {visibleResults.map((r) => (
                    <ProductCard
                      key={r.product.id}
                      product={r.product}
                      requirements={requirements}
                      compared={compared}
                      onCompare={onCompare}
                    />
                  ))}
                </div>
              ) : (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Exact PID</th>
                        <th>Family</th>
                        <th>Fit</th>
                        <th>Why?</th>
                        <th>Compare</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleResults.map((r) => (
                        <tr key={r.product.id}>
                          <td>
                            <a
                              href={`#/product/${encodeURIComponent(r.product.pid)}`}
                            >
                              {r.product.pid}
                            </a>
                          </td>
                          <td>{familyName(r.product.familyId)}</td>
                          <td>{r.decision}</td>
                          <td>
                            {r.findings.map((f) => (
                              <div
                                className="table-finding"
                                key={f.requirement}
                              >
                                <strong>{f.requirement}</strong> · {f.state}
                                <p>{f.detail}</p>
                                <AssertionEvidence
                                  ids={f.assertionIds}
                                  assertions={catalog.assertions}
                                />
                              </div>
                            ))}
                          </td>
                          <td>
                            <button
                              className="button secondary"
                              disabled={
                                compared.length >= 4 &&
                                !compared.includes(r.product.id)
                              }
                              onClick={() => onCompare(r.product.id)}
                            >
                              {compared.includes(r.product.id)
                                ? 'Remove'
                                : 'Add'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            {ranked.length > visibleCount && (
              <button
                className="button secondary"
                onClick={() => setVisibleCount(visibleCount + 24)}
              >
                Show more PIDs ({ranked.length - visibleCount} remaining)
              </button>
            )}
            {candidates.length > 0 ? (
              <>
                <div className="research-heading">
                  <h3>On the research bench</h3>
                  <span>Not included in matches or comparison</span>
                </div>
                {layout === 'grid' ? (
                  <div className="product-grid">
                    {candidates.map((c) => (
                      <ResearchCard candidate={c} key={c.id} />
                    ))}
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Research target</th>
                          <th>Family</th>
                          <th>Record type</th>
                          <th>Evidence</th>
                          <th>Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {candidates.map((c) => (
                          <tr key={c.id}>
                            <td>
                              <a href={`#/research/${c.id}`}>{c.label}</a>
                            </td>
                            <td>{familyName(c.familyId)}</td>
                            <td>
                              {c.kind === 'pid'
                                ? 'PID candidate'
                                : 'Family only'}
                            </td>
                            <td>
                              <Badge state="unknown">Unverified</Badge>
                            </td>
                            <td>
                              <SourceLink
                                id={c.sourceId}
                                label="Source to review"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              ranked.length === 0 && (
                <div className="empty-state">
                  <Icon name="search" size={30} />
                  <h3>
                    {excludedCount
                      ? 'No eligible products found'
                      : 'No records found'}
                  </h3>
                  <p>
                    {excludedCount
                      ? `${excludedCount} sourced products were excluded. Enable Show excluded products to inspect their evidence.`
                      : 'Try a different search or family. Coverage remains explicitly incomplete.'}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() => {
                      setQuery('');
                      setCategory('all');
                      setFamilyFilter('');
                    }}
                  >
                    Clear search
                  </button>
                </div>
              )
            )}
            <div className="coverage-note">
              <Icon name="shield" size={18} />
              <div>
                <strong>
                  A trustworthy shortlist, not an exhaustive catalog.
                </strong>
                <p>
                  Each published specification needs scoped evidence and
                  editorial review. Initial source review by Codex; publisher
                  review remains required. Portfolio coverage will grow as
                  sources are checked.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function ResearchDetail({ id }: { id: string }) {
  const c = catalog.candidates.find((c) => c.id === id);
  if (!c) return <NotFound />;
  return (
    <>
      <a className="back-link" href="#/catalog">
        ← Back to catalog
      </a>
      <PageHeading
        eyebrow="RESEARCH RECORD · NOT A VALIDATED PRODUCT"
        title={c.label}
        description={c.note}
      />
      <div className="detail-grid">
        <section className="panel">
          <h2>Evidence review pending</h2>
          <Badge state="unknown">
            Unverified {c.kind === 'pid' ? 'PID candidate' : 'family'}
          </Badge>
          <p>
            {c.note} This record is withheld from verified PID results and
            cannot be used in a comparison.
          </p>
          <SourceLink
            id={c.sourceId}
            label="Open official reference to review"
          />
          <dl className="detail-specs">
            {specRows.map(([, label]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>Unknown · no reviewed evidence</dd>
              </div>
            ))}
          </dl>
        </section>
        <aside className="panel review-checklist">
          <h2>Before publication</h2>
          <ol>
            <li>
              Check the exact orderable PID in the official ordering table.
            </li>
            <li>
              Capture built-in port roles, media, and speeds separately from
              modules.
            </li>
            <li>Review firmware, management and license prerequisites.</li>
            <li>Check lifecycle and coexistence restrictions.</li>
            <li>
              Attach excerpts, dates, and reviewer approval to each claim.
            </li>
          </ol>
          <p className="small muted">
            This record cannot enter a recommendation or comparison until
            reviewed. Unknown compatibility does not imply unsupported.
          </p>
        </aside>
      </div>
    </>
  );
}
function ProductDetail({
  pid,
  requirements,
  compared,
  onCompare,
}: {
  pid: string;
  requirements: Requirements;
  compared: string[];
  onCompare: (id: string) => void;
}) {
  const p = catalog.pids.find(
    (p) => p.pid === pid && p.reviewStatus === 'approved',
  );
  if (!p) return <NotFound />;
  return (
    <>
      <a className="back-link" href="#/catalog">
        ← Back to catalog
      </a>
      <PageHeading
        eyebrow={`EXACT PID · ${familyName(p.familyId)}`}
        title={p.pid}
        description="Specifications, constraints and evidence for this exact product identifier."
      />
      <button
        className="button"
        disabled={compared.length >= 4 && !compared.includes(p.id)}
        onClick={() => onCompare(p.id)}
      >
        {compared.includes(p.id)
          ? 'Remove from comparison'
          : 'Add to comparison'}
      </button>
      <section className="panel detail-panel">
        <h2>Specifications & compatibility</h2>
        <p>
          Source-reviewed identity does not guarantee current availability.
          Lifecycle and deployment gaps remain explicit.
        </p>
        <dl className="detail-specs">
          {specRows.map(([key, label]) => {
            const fact = resolveFact(p, catalog.assertions, key, requirements);
            return (
              <div key={key}>
                <dt>{label}</dt>
                <dd>
                  <Badge state={fact.state}>
                    {compatibilityLabels[fact.state]}
                  </Badge>
                  {fact.state !== 'unknown' && (
                    <strong>{formatFact(fact.value)}</strong>
                  )}
                  <p className="small">{fact.detail}</p>
                  <AssertionEvidence
                    ids={fact.assertionIds}
                    assertions={catalog.assertions}
                  />
                </dd>
              </div>
            );
          })}
        </dl>
        <h2>Built-in port inventory</h2>
        {catalog.assertions
          .filter(
            (a) => a.subjectId === p.id && a.predicate === 'portInventory',
          )
          .map((a) => (
            <div key={a.id}>
              {Array.isArray(a.value) && (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Count</th>
                        <th>Role</th>
                        <th>Interface</th>
                        <th>Speeds (Mbps)</th>
                        <th>Origin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.value.map((g, i) => (
                        <tr key={i}>
                          <td>{g.count}</td>
                          <td>{g.role}</td>
                          <td>{g.medium}</td>
                          <td>{g.speedsMbps.join(' / ')}</td>
                          <td>{g.origin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="small muted">
                SFP/SFP+ slots require separate transceivers. A flexible LAN/WAN
                port can fill only one role at a time. Expansion ports are never
                counted as built in.
              </p>
              <AssertionEvidence ids={[a.id]} assertions={catalog.assertions} />
            </div>
          ))}
        {catalog.assertions.some(
          (a) => a.subjectId === p.id && a.predicate === 'entitlement',
        ) && (
          <>
            <h2>Commercial entitlements</h2>
            {catalog.assertions
              .filter(
                (a) => a.subjectId === p.id && a.predicate === 'entitlement',
              )
              .map((a) => (
                <div className="finding" key={a.id}>
                  <Badge state={a.status} />
                  <p>{a.applicability.configuration}</p>
                  <AssertionEvidence
                    ids={[a.id]}
                    assertions={catalog.assertions}
                  />
                </div>
              ))}
          </>
        )}
      </section>
      <TechnicalReference product={p} requirements={requirements} />
    </>
  );
}
function Compare({
  compared,
  requirements,
  onCompare,
}: {
  compared: string[];
  requirements: Requirements;
  onCompare: (id: string) => void;
}) {
  const products = compared
    .map((id) => catalog.pids.find((p) => p.id === id)!)
    .filter(Boolean);
  function download() {
    const url = URL.createObjectURL(
      new Blob([comparisonCsv(products, catalog.assertions, requirements)], {
        type: 'text/csv;charset=utf-8',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'iiot-comparison.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <PageHeading
        eyebrow="SIDE BY SIDE"
        title="Compare with context."
        description="Choose 2–4 reviewed PIDs. Specifications, unknowns and restrictions travel with their evidence."
      />
      {products.length < 2 ? (
        <div className="empty-state panel">
          <Icon name="grid" size={36} />
          <h2>
            {products.length
              ? 'Add one more reviewed PID'
              : 'Your comparison starts with evidence'}
          </h2>
          <p>
            {catalog.pids.length
              ? 'Add products from the catalog to build a side-by-side view.'
              : 'No verified PIDs have been published. Research candidates are kept out of comparisons to avoid implying verified specifications.'}
          </p>
          <a className="button" href="#/catalog">
            Explore the catalog <Icon name="arrow" size={16} />
          </a>
        </div>
      ) : (
        <>
          <button className="button secondary" onClick={download}>
            Export CSV with sources
          </button>
          <div className="table-scroll compare-table">
            <table>
              <thead>
                <tr>
                  <th>Specification</th>
                  {products.map((p) => (
                    <th key={p.id}>
                      <a href={`#/product/${encodeURIComponent(p.pid)}`}>
                        {p.pid}
                      </a>
                      <button
                        className="icon-button"
                        aria-label={`Remove ${p.pid}`}
                        onClick={() => onCompare(p.id)}
                      >
                        <Icon name="close" size={16} />
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specRows.map(([key, label]) => (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    {products.map((p) => {
                      const f = resolveFact(
                        p,
                        catalog.assertions,
                        key,
                        requirements,
                      );
                      return (
                        <td key={p.id}>
                          <Badge state={f.state}>
                            {compatibilityLabels[f.state]}
                          </Badge>
                          {f.state !== 'unknown' && (
                            <p>
                              <strong>{formatFact(f.value)}</strong>
                            </p>
                          )}
                          <p className="small">{f.detail}</p>
                          <AssertionEvidence
                            ids={f.assertionIds}
                            assertions={catalog.assertions}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <p className="page-note">
        Individual support statements do not establish simultaneous feature
        coexistence. Review mode-specific restrictions before selection.
      </p>
    </>
  );
}
function Software() {
  const entitlements = catalog.assertions.filter(
    (a) => a.predicate === 'entitlement' && a.reviewStatus === 'approved',
  );
  return (
    <>
      <PageHeading
        eyebrow="SOFTWARE & LICENSING"
        title="One security story. Precise prerequisites."
        description="Cyber Vision and Secure Equipment Access share an OT security workflow. Commercial inclusion, technical compatibility and actual activation are separate questions."
      />
      <div className="software-banner">
        <Icon name="shield" size={42} />
        <div>
          <h2>OT visibility + secure equipment access</h2>
          <p>Keep entitlement evidence separate from deployment support.</p>
        </div>
        <Badge state="conditional">Conditions apply</Badge>
      </div>
      <section className="panel">
        <h2>Cyber Vision 5.6.x technical evidence</h2>
        <p>
          Checked release notes list 5.6.0 and 5.6.1. Their compatibility matrix
          scopes firmware trains, IE3300 memory/revision and IR8300 IOx memory
          conditions. No later release is inferred from a knowledge-database
          update.
        </p>
        <SourceLink id="cisco-cv56-rn" label="Open 5.6.x release notes" />
        <div className="software-evidence">
          {catalog.assertions
            .filter(
              (a) =>
                a.predicate === 'licensingRule' &&
                a.reviewStatus === 'approved',
            )
            .map((a) => (
              <article className="finding" key={a.id}>
                <h3>
                  {a.subjectId === 'sea'
                    ? 'Secure Equipment Access'
                    : 'Cyber Vision'}{' '}
                  · {(a.value as { rule: string }).rule}
                </h3>
                <p>{formatFact(a.value)}</p>
                <AssertionEvidence
                  ids={[a.id]}
                  assertions={catalog.assertions}
                />
              </article>
            ))}
        </div>
      </section>
      <div className="two-columns">
        {[
          ['Cyber Vision', 'cisco-cybervision-ds', 'cv-visibility'],
          ['Secure Equipment Access', 'cisco-sea-ds', 'sea-remote-access'],
        ].map(([title, id, feature]) => {
          const bundled = entitlements.filter(
            (a) => (a.value as { featureId?: string }).featureId === feature,
          );
          return (
            <section className="panel" key={id}>
              <div className="eyebrow">CISCO INDUSTRIAL SECURITY</div>
              <h2>{title}</h2>
              <p>
                Selected IE3500 Network Advantage orders include a limited
                entitlement. This does not establish software support for a
                specific firmware or management mode.
              </p>
              <dl className="detail-specs">
                <div>
                  <dt>Selected IE3500 bundle</dt>
                  <dd>Advantage · 24 endpoints · 36 months</dd>
                </div>
                <div>
                  <dt>PID records with a conditional offer rule</dt>
                  <dd>{bundled.length}</dd>
                </div>
                <div>
                  <dt>Firmware / software minimum</dt>
                  <dd>
                    <Badge state="unknown" />
                  </dd>
                </div>
                <div>
                  <dt>Meraki coexistence</dt>
                  <dd>
                    <Badge state="unknown" />
                  </dd>
                </div>
              </dl>
              {bundled[0] && (
                <AssertionEvidence
                  ids={[bundled[0].id]}
                  assertions={catalog.assertions}
                />
              )}
              <SourceLink id={id} label="Software data sheet" />
            </section>
          );
        })}
      </div>
      <section className="panel">
        <h2>Included entitlement evidence</h2>
        <p>
          Original Network Advantage orders and later upgrades have distinct
          eligibility. An Essentials (-E) PID does not inherit an entitlement:
          its listed rule requires an actual qualifying Network Advantage
          upgrade. No activation or remaining term is assumed.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Exact PID</th>
                <th>Included offer</th>
                <th>Scope</th>
                <th>Eligibility & evidence</th>
              </tr>
            </thead>
            <tbody>
              {entitlements.map((a) => {
                const value = a.value as {
                  licenseId: string;
                  quantity: number;
                  durationMonths: number;
                };
                const p = catalog.pids.find((p) => p.id === a.subjectId);
                return (
                  <tr key={a.id}>
                    <td>
                      <a href={`#/product/${encodeURIComponent(p?.pid ?? '')}`}>
                        {p?.pid}
                      </a>
                    </td>
                    <td>
                      {
                        catalog.licenses.find((l) => l.id === value.licenseId)
                          ?.offer
                      }
                    </td>
                    <td>
                      {value.quantity} endpoints · {value.durationMonths} months
                      <br />
                      <Badge state="conditional" />
                    </td>
                    <td>
                      <p>{a.applicability.configuration}</p>
                      <AssertionEvidence
                        ids={[a.id]}
                        assertions={catalog.assertions}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
      <div className="coverage-note">
        <Icon name="shield" />
        <p>
          No universal inclusion is asserted. Detailed feature tiers and
          exact-PID firmware, licensing and architecture review remains
          incomplete. Do not infer that a commercial entitlement enables
          simultaneous Cyber Vision and SEA use in every management mode.
        </p>
      </div>
    </>
  );
}
function Audit() {
  const reviewed = sources.filter((s) => s.status === 'reviewed').length,
    blocked = sources.filter((s) => s.status === 'blocked').length;
  return (
    <>
      <PageHeading
        eyebrow="TRANSPARENCY BY DESIGN"
        title="Follow the evidence."
        description="Source coverage, review gaps and audit dates. A successful URL check is not an approval of a product claim."
      />
      <div className="metrics">
        {[
          [
            String(
              catalog.pids.filter((p) => p.reviewStatus === 'approved').length,
            ),
            'Reviewed exact PIDs',
          ],
          [`${reviewed} / ${sources.length}`, 'Sources reviewed'],
          [String(blocked), 'Access blockers'],
          [String(reviewIssues.length), 'Open review issues'],
        ].map(([n, label]) => (
          <div className="metric" key={label}>
            <strong>{n}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="panel audit-explainer">
        <div>
          <h2>Official sources · scoped technical review</h2>
          <p>
            {sources.length} public Cisco documents are tracked with dates and
            scoped reviewed excerpts. Family mappings, release restrictions and
            unresolved questions are preserved; this is not an exhaustive
            support audit.
          </p>
          <p className="small muted">
            Automated rechecks produce proposed audit reports. Changes require
            editorial approval before publication. A monthly URL/fingerprint
            audit runs at 07:17 UTC on day 1. It flags overdue claims and
            proposes cited audit-history PRs. Technical corrections still
            require manual source review.
          </p>
        </div>
        <Badge state="conditional">Publisher review required</Badge>
      </section>
      <PortfolioCoverage />
      <section className="panel">
        <h2>Technical audit history</h2>
        <p>
          Monthly observations are proposed through review PRs. Neither
          fingerprint changes nor a passing audit overwrite technical
          assertions.
        </p>
        {auditHistory.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Audit (UTC)</th>
                  <th>Sources</th>
                  <th>Changed</th>
                  <th>Unavailable</th>
                  <th>Overdue claims</th>
                  <th>Review queue</th>
                </tr>
              </thead>
              <tbody>
                {auditHistory.map((run) => (
                  <tr key={run.id}>
                    <th scope="row">
                      <a
                        href={auditReportUrls['../../' + run.path]}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {run.generatedAt} ↗
                      </a>
                    </th>
                    <td>{run.sourcesChecked}</td>
                    <td>{run.changedSources}</td>
                    <td>{run.unreachableSources}</td>
                    <td>{run.staleClaims}</td>
                    <td>
                      {run.potentiallyOutdatedClaims} assertions ·{' '}
                      {run.requiresHumanReview
                        ? 'Human review required'
                        : 'No queued changes'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            No reviewed audit history has been committed yet. Workflow artifacts
            remain available for each run.
          </p>
        )}
      </section>
      <div className="source-list">
        {sources.map((s) => (
          <article className="source-row" key={s.id}>
            <div className="source-file">
              <Icon name="external" size={21} />
            </div>
            <div className="source-main">
              <h2>{s.title}</h2>
              <p>{s.note}</p>
              <div className="source-dates">
                <span>
                  Last checked:{' '}
                  {s.lastCheckedAt ? s.lastCheckedAt.slice(0, 10) : 'Never'}
                </span>
                <span>Verified: {s.verifiedAt?.slice(0, 10) ?? 'Not yet'}</span>
                <span>Document date: {s.documentDate ?? 'Unknown'}</span>
                <span>
                  Last material change:{' '}
                  {s.lastMaterialChangeAt?.slice(0, 10) ?? 'Unknown'}
                </span>
              </div>
              <SourceLink id={s.id} label="Open reference" />
            </div>
            <Badge state={s.status === 'reviewed' ? 'supported' : 'unknown'}>
              {s.status === 'reviewed'
                ? 'Source reviewed'
                : s.status === 'blocked'
                  ? 'Access blocked'
                  : 'Fetched only'}
            </Badge>
          </article>
        ))}
      </div>
      <section className="panel">
        <h2>Open review issues</h2>
        {reviewIssues
          .filter((issue) => issue.status !== 'resolved')
          .map((issue) => (
            <article className="review-issue" key={issue.id}>
              <Badge
                state={issue.kind === 'conflict' ? 'conditional' : 'unknown'}
              >
                {issue.kind}
              </Badge>
              <h3>{issue.title}</h3>
              <p>{issue.detail}</p>
              {issue.resolution && (
                <p>
                  <strong>Progress:</strong> {issue.resolution}
                </p>
              )}
              {issue.sourceIds.map((id) => (
                <SourceLink key={id} id={id} />
              ))}
            </article>
          ))}
      </section>
      <section className="panel">
        <h2>How evidence becomes a published claim</h2>
        <div className="review-steps">
          {[
            [
              '01',
              'Find the primary document',
              'Exact URL, publication date and lawful excerpt.',
            ],
            [
              '02',
              'Scope the assertion',
              'Exact PID, version, license and deployment mode.',
            ],
            [
              '03',
              'Review conflicts',
              'Preserve superseded evidence and flag uncertainty.',
            ],
            [
              '04',
              'Approve the change',
              'Human review and validation before publication.',
            ],
          ].map(([n, title, desc]) => (
            <div key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
function Competitive() {
  return (
    <>
      <PageHeading
        eyebrow="PLANNED · NO COMPARATIVE CLAIMS"
        title="Competitive intelligence."
        description="Future research will compare products and complete solutions using balanced, condition-specific evidence."
      />
      <section className="panel empty-state">
        <Icon name="shield" size={42} />
        <h2>Evidence first. Battlecards later.</h2>
        <p>
          The schema is reserved for exact competitor SKUs, vendor sources,
          strengths and weaknesses on both sides, license terms and deployment
          context. No equivalences or rankings have been asserted.
        </p>
        <a className="button secondary" href="#/audit">
          Read the source policy <Icon name="arrow" size={16} />
        </a>
      </section>
    </>
  );
}
function NotFound() {
  return (
    <section className="empty-state panel">
      <h1>Record not found</h1>
      <p>This link does not identify a published product or research record.</p>
      <a className="button" href="#/catalog">
        Back to catalog
      </a>
    </section>
  );
}
export default function App() {
  const route = useRoute();
  const page = route.split('/')[1];
  const detail = route.split('/').slice(2).join('/');
  const [requirements, setRequirements] = useState<Requirements>({
    ...defaultRequirements,
  });
  const [compared, setCompared] = useState<string[]>(readCompared);
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  function onCompare(id: string) {
    const next = compared.includes(id)
      ? compared.filter((x) => x !== id)
      : compared.length < 4
        ? [...compared, id]
        : compared;
    setCompared(next);
    try {
      localStorage.setItem('iiot-comparison', JSON.stringify(next));
    } catch {
      /* Comparison still works without storage. */
    }
    setAnnouncement(`${next.length} products selected for comparison`);
  }
  useEffect(() => {
    function shortcut(e: KeyboardEvent) {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (e.target as HTMLElement)?.tagName,
        )
      ) {
        const search = document.querySelector<HTMLInputElement>(
          'input[type="search"]',
        );
        if (search) {
          e.preventDefault();
          search.focus();
        }
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);
  let content;
  switch (page) {
    case 'selector':
    case 'catalog':
      content = (
        <Browse
          selector={page === 'selector'}
          requirements={requirements}
          setRequirements={setRequirements}
          compared={compared}
          onCompare={onCompare}
        />
      );
      break;
    case 'family':
      content = <FamilyReference familyId={detail} />;
      break;
    case 'research':
      content = <ResearchDetail id={detail} />;
      break;
    case 'product': {
      let pid = '';
      try {
        pid = decodeURIComponent(detail);
      } catch {
        /* Invalid route becomes a not-found state. */
      }
      content = (
        <ProductDetail
          pid={pid}
          requirements={requirements}
          compared={compared}
          onCompare={onCompare}
        />
      );
      break;
    }
    case 'compare':
      content = (
        <Compare
          compared={compared}
          requirements={requirements}
          onCompare={onCompare}
        />
      );
      break;
    case 'software':
      content = <Software />;
      break;
    case 'audit':
      content = <Audit />;
      break;
    case 'competitive':
      content = <Competitive />;
      break;
    default:
      content = <NotFound />;
  }
  return (
    <>
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Skip to content
      </a>
      <header className="site-header">
        <a className="brand" href="#/selector" aria-label="IIoT Selector home">
          <span className="brand-symbol" aria-hidden="true">
            {[12, 20, 29, 36, 29, 20, 12].map((h, i) => (
              <i key={i} style={{ height: h }} />
            ))}
          </span>
          <span>
            IIoT<span className="brand-light"> selector</span>
            <small>{en.brand}</small>
          </span>
        </a>
        <button
          className="menu-toggle button secondary"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-controls="site-nav"
        >
          Menu
        </button>
        <nav
          id="site-nav"
          className={menuOpen ? 'open' : ''}
          aria-label="Main navigation"
        >
          {navEntries
            .filter(([id]) => id !== 'competitive')
            .map(([id, label]) => (
              <a
                key={id}
                href={`#/${id}`}
                onClick={() => setMenuOpen(false)}
                aria-current={
                  page === id ||
                  ((page === 'research' || page === 'product') &&
                    id === 'catalog')
                    ? 'page'
                    : undefined
                }
              >
                {label}
                {id === 'compare' && compared.length > 0 && (
                  <span className="count">{compared.length}</span>
                )}
              </a>
            ))}
        </nav>
        <a className="header-tag" href="#/audit">
          <span className="status-dot" />
          Public research preview
        </a>
      </header>
      <main
        id="main"
        tabIndex={-1}
        className={
          page === 'selector' || page === 'catalog'
            ? 'main browse-main'
            : 'main inner-main'
        }
      >
        {content}
      </main>
      <footer className="site-footer">
        <div>
          <span className="footer-brand">IIoT selector</span>
          <p>{en.evidencePolicy}</p>
        </div>
        <div>
          <a href="#/audit">Sources & review policy</a>
          <a href="#/competitive">
            Competitive intelligence <span className="planned">Planned</span>
          </a>
          <span className="footer-disclaimer">
            Independent research tool. No Cisco affiliation or endorsement. No
            pricing or orderability guarantees.
          </span>
        </div>
      </footer>
      <div className="sr-only" aria-live="polite">
        {announcement}
      </div>
    </>
  );
}
