import { expect, it } from 'vitest';
import { comparisonCsv } from '../src/lib/export';
import { defaultRequirements } from '../src/lib/catalog';
import { product, assertion } from './fixtures';
it('exports unknowns and constraints without silently inventing source URLs', () => {
  const csv = comparisonCsv([product], [assertion()], defaultRequirements);
  expect(csv).toContain('TEST-ROUTER-2');
  expect(csv).toContain('"Unknown","unknown"');
  expect(csv).toContain('Official sources');
});
it('neutralizes spreadsheet formula injection in PID strings', () => {
  expect(
    comparisonCsv(
      [{ ...product, pid: '=DANGEROUS()' }],
      [],
      defaultRequirements,
    ),
  ).toContain('"\'=DANGEROUS()"');
});

it('exports real catalog source URLs and keeps commercial constraints', async () => {
  const { catalog } = await import('../src/lib/catalog');
  const csv = comparisonCsv(
    catalog.pids.slice(0, 2),
    catalog.assertions,
    defaultRequirements,
  );
  expect(csv).toContain(
    'https://www.cisco.com/site/us/en/products/collateral/networking/industrial-routers-gateways/ir1000-rugged-series-secure-routers-ds.html',
  );
  expect(csv).toContain('support-matrix review');
});
