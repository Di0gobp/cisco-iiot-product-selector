import { sourceById } from '../lib/catalog';
import type { Assertion, Compatibility } from '../lib/types';
import { Icon } from './Icons';
export function Badge({
  state,
  children,
}: {
  state: Compatibility | 'pending';
  children?: React.ReactNode;
}) {
  return (
    <span className={`badge ${state}`}>
      <span className="status-dot" />
      {children ?? state.charAt(0).toUpperCase() + state.slice(1)}
    </span>
  );
}
export function SourceLink({
  id,
  label = 'View official source',
}: {
  id: string;
  label?: string;
}) {
  const source = sourceById[id];
  return source ? (
    <a
      className="source-link"
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
      <Icon name="external" size={13} />
    </a>
  ) : null;
}
export function AssertionEvidence({
  ids,
  assertions,
}: {
  ids: string[];
  assertions: Assertion[];
}) {
  if (!ids.length)
    return <span className="muted small">No reviewed evidence</span>;
  return (
    <div className="assertion-evidence">
      {ids.map((id) => {
        const a = assertions.find((a) => a.id === id);
        const s = a ? sourceById[a.sourceId] : undefined;
        return a ? (
          <div key={id}>
            <SourceLink id={a.sourceId} />
            <details>
              <summary>Evidence · {a.interpretation}</summary>
              <p>“{a.evidence.excerpt}”</p>
              <p className="small">{a.evidence.section}</p>
              <p className="small">
                {s?.title} · Document date: {s?.documentDate ?? 'Unknown'} ·
                Checked {a.verifiedAt.slice(0, 10)} · {a.confidence} confidence
                · {a.reviewStatus} by {a.reviewer ?? 'unassigned'}
              </p>
            </details>
          </div>
        ) : null;
      })}
    </div>
  );
}
