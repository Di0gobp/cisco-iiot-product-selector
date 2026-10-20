import { catalog } from '../lib/catalog';
import { reviewedAssertions } from '../lib/rules';
import { Badge } from './Evidence';
export function PortfolioCoverage() {
  return (
    <section className="panel">
      <h2>Portfolio coverage by family</h2>
      <p>
        Counts describe the reviewed subset, not the complete Cisco portfolio.
        Software counts indicate scoped assertions; they are not counts of fully
        compatible deployments.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Family</th>
              <th>Exact PIDs</th>
              <th>Lifecycle evidenced</th>
              <th>CV 5.6.x assertions</th>
              <th>SEA assertions</th>
              <th>Coverage</th>
            </tr>
          </thead>
          <tbody>
            {catalog.families.map((f) => {
              const pids = catalog.pids.filter(
                (p) => p.familyId === f.id && p.reviewStatus === 'approved',
              );
              const count = (
                predicate: 'lifecycle' | 'cyberVision' | 'sea',
                cv = false,
              ) =>
                pids.filter((p) =>
                  reviewedAssertions(p, catalog.assertions, predicate).some(
                    (a) => !cv || a.sourceId === 'cisco-cv56-rn',
                  ),
                ).length;
              return (
                <tr key={f.id}>
                  <th scope="row">
                    <a href={`#/family/${f.id}`}>{f.name} →</a>
                  </th>
                  <td>{pids.length}</td>
                  <td>
                    {count('lifecycle')} / {pids.length}
                  </td>
                  <td>{count('cyberVision', true)}</td>
                  <td>{count('sea')}</td>
                  <td>
                    <Badge state={pids.length ? 'conditional' : 'unknown'}>
                      {pids.length
                        ? 'Partial, source reviewed'
                        : 'Research / identity unresolved'}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
