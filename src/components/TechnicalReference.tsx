import { catalog, sources, sourceById } from '../lib/catalog';
import { evaluateEntitlement, formatFact, resolveFact } from '../lib/rules';
import type { Product, Requirements } from '../lib/types';
import { AssertionEvidence, Badge, SourceLink } from './Evidence';
import { compatibilityLabels } from '../lib/compatibility';
export function TechnicalReference({
  product,
  requirements,
}: {
  product: Product;
  requirements: Requirements;
}) {
  const related = catalog.assertions.filter(
    (a) => a.subjectId === product.id && a.reviewStatus === 'approved',
  );
  const lifecycle = related.find((a) => a.predicate === 'lifecycle');
  const replacement = related.find((a) => a.predicate === 'replacement');
  const replacements = replacement?.value as
    { pidIds?: string[]; note?: string } | undefined;
  const documents = [
    ...new Set([
      ...(product.documentationIds ?? []),
      ...related.map((a) => a.sourceId),
    ]),
  ]
    .map((id) => sourceById[id])
    .filter(Boolean);
  return (
    <>
      <section className="panel">
        <h2>Lifecycle & replacement guidance</h2>
        {lifecycle ? (
          <>
            <Badge
              state={lifecycle.value === 'active' ? 'supported' : 'unsupported'}
            >
              {formatFact(lifecycle.value)}
            </Badge>
            <p>
              Historical identity is documented separately from current sale
              status. End-of-sale/support equipment is excluded from
              new-deployment matches.
            </p>
            <AssertionEvidence
              ids={[lifecycle.id]}
              assertions={catalog.assertions}
            />
          </>
        ) : (
          <>
            <Badge state="unknown">Lifecycle not yet verified</Badge>
            <p>
              A data sheet is not current orderability evidence. No active-sales
              state is inferred from the absence of an EoL notice.
            </p>
          </>
        )}
        {replacement && (
          <>
            <p>{replacements?.note}</p>
            <div className="related-pids">
              {replacements?.pidIds?.map((id) => {
                const p = catalog.pids.find((p) => p.id === id);
                return p ? (
                  <a key={id} href={`#/product/${encodeURIComponent(p.pid)}`}>
                    {p.pid} →
                  </a>
                ) : null;
              })}
            </div>
            <AssertionEvidence
              ids={[replacement.id]}
              assertions={catalog.assertions}
            />
          </>
        )}
      </section>
      <section className="panel">
        <h2>Management & security compatibility</h2>
        <p>
          Results use the selected firmware, software release and licenses.
          General hosting support does not establish coexistence in a management
          mode.
        </p>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Management mode</th>
                <th>Management support</th>
                <th>Cyber Vision + SEA together</th>
                <th>Explanation & official evidence</th>
              </tr>
            </thead>
            <tbody>
              {catalog.managementModes.map((mode) => {
                const context = { ...requirements, managementModeId: mode.id };
                const management = resolveFact(
                  product,
                  catalog.assertions,
                  'management',
                  context,
                );
                const coexist = resolveFact(
                  product,
                  catalog.assertions,
                  'coexistence',
                  { ...context, cyberVision: true, sea: true },
                );
                return (
                  <tr key={mode.id}>
                    <th scope="row">{mode.name}</th>
                    <td>
                      <Badge state={management.state}>
                        {compatibilityLabels[management.state]}
                      </Badge>
                    </td>
                    <td>
                      <Badge state={coexist.state}>
                        {compatibilityLabels[coexist.state]}
                      </Badge>
                    </td>
                    <td>
                      <p>{management.detail}</p>
                      <AssertionEvidence
                        ids={management.assertionIds}
                        assertions={catalog.assertions}
                      />
                      <p>{coexist.detail}</p>
                      <AssertionEvidence
                        ids={coexist.assertionIds}
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
      {related.some((a) => a.predicate === 'entitlement') && (
        <section className="panel">
          <h2>Commercial eligibility checks</h2>
          <p>
            Select confirmed license, order/upgrade dates and endpoint count in
            the selector. These checks never assert that a license is activated
            or still in term.
          </p>
          {related
            .filter((a) => a.predicate === 'entitlement')
            .map((a) => {
              const result = evaluateEntitlement(a, requirements);
              return (
                <div className="finding" key={a.id}>
                  <Badge state={result.state}>
                    {compatibilityLabels[result.state]}
                  </Badge>
                  <p>{result.detail}</p>
                  <AssertionEvidence
                    ids={[a.id]}
                    assertions={catalog.assertions}
                  />
                </div>
              );
            })}
        </section>
      )}
      <section className="panel">
        <h2>Official documentation library</h2>
        <p>
          Only relevant, tracked public references are listed. A document link
          is not a claim that every feature in it applies to this PID.
        </p>
        <div className="documentation-grid">
          {documents.map((s) => (
            <article key={s.id}>
              <span className="eyebrow">
                {s.kind ?? s.type.replace('official-', '')}
              </span>
              <h3>{s.title}</h3>
              <p>
                Vendor date: {s.documentDate ?? 'Unknown'} · Checked:{' '}
                {s.lastCheckedAt?.slice(0, 10) ?? 'Not yet'} · {s.status}
              </p>
              <SourceLink id={s.id} />
            </article>
          ))}
        </div>
        {!documents.some((s) => s.kind === 'configuration-guide') && (
          <p className="small muted">
            Exact configuration-guide coverage is still incomplete. Unlisted
            licensing, release or compatibility references are not assumed to be
            verified.
          </p>
        )}
      </section>
    </>
  );
}
export function FamilyReference({ familyId }: { familyId: string }) {
  const family = catalog.families.find((f) => f.id === familyId);
  if (!family)
    return (
      <section className="panel">
        <h1>Family not found</h1>
      </section>
    );
  const assertions = catalog.assertions.filter(
    (a) => a.subjectId === familyId && a.reviewStatus === 'approved',
  );
  const candidates = catalog.candidates.filter((c) => c.familyId === familyId);
  const pids = catalog.pids.filter((p) => p.familyId === familyId);
  return (
    <>
      <a className="back-link" href="#/audit">
        ← Portfolio coverage
      </a>
      <div className="page-heading">
        <div className="eyebrow">FAMILY REFERENCE · SCOPE IS EXPLICIT</div>
        <h1>{family.name}</h1>
        <p>
          {pids.length} source-reviewed exact PIDs. Family-level evidence below
          does not establish support or orderability for an unlisted PID.
        </p>
      </div>
      {candidates.map((c) => (
        <section className="panel" key={c.id}>
          <Badge state="unknown">Exact identity / ordering unresolved</Badge>
          <p>{c.note}</p>
          <SourceLink id={c.sourceId} />
        </section>
      ))}
      {assertions.map((a) => (
        <section className="panel" key={a.id}>
          <h2>
            {a.predicate === 'wireless'
              ? 'Industrial wireless modes'
              : 'Mode-specific software'}
          </h2>
          <Badge state={a.status}>{compatibilityLabels[a.status]}</Badge>
          <p>{formatFact(a.value)}</p>
          <p>{a.applicability.configuration}</p>
          <AssertionEvidence ids={[a.id]} assertions={catalog.assertions} />
        </section>
      ))}
      <section className="panel">
        <h2>Exact-PID coverage</h2>
        {pids.length ? (
          <div className="related-pids">
            {pids.map((p) => (
              <a key={p.id} href={`#/product/${encodeURIComponent(p.pid)}`}>
                {p.pid} →
              </a>
            ))}
          </div>
        ) : (
          <p>
            No concrete PID has been approved. No placeholder domain or
            operating-mode suffix is treated as an orderable product.
          </p>
        )}
      </section>
      <p className="page-note">
        {
          sources.filter((s) => assertions.some((a) => a.sourceId === s.id))
            .length
        }{' '}
        source documents support this family-level reference.
      </p>
    </>
  );
}
