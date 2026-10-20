import { sourceById, specRows } from './catalog';
import { resolveFact } from './rules';
import type { Assertion, Product, Requirements } from './types';
const cell = (value: unknown) =>
  '"' +
  String(value)
    .replace(/"/g, '""')
    .replace(/^[=+@\-\t\r]/, "'$&") +
  '"';
export function comparisonCsv(
  products: Product[],
  assertions: Assertion[],
  requirements: Requirements,
): string {
  const rows: unknown[][] = [
    ['PID', 'Feature', 'Value', 'Status', 'Restrictions', 'Official sources'],
  ];
  for (const p of products)
    for (const [key, label] of specRows) {
      const fact = resolveFact(p, assertions, key, requirements);
      rows.push([
        p.pid,
        label,
        fact.state === 'unknown' ? 'Unknown' : JSON.stringify(fact.value),
        fact.state,
        fact.detail,
        fact.assertionIds
          .map(
            (id) =>
              sourceById[assertions.find((a) => a.id === id)?.sourceId ?? '']
                ?.url ?? '',
          )
          .filter(Boolean)
          .join(' | '),
      ]);
    }
  return '\ufeff' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}
