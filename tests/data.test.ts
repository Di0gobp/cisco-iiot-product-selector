import { describe, expect, it } from 'vitest';
import { validateData } from '../scripts/validate-data.mjs';
import raw from '../data/products/catalog.json';
import issues from '../data/sources/review-issues.json';
import sources from '../data/sources/sources.json';
import { assertion, fixtureCatalog, source } from './fixtures';
describe('schema and provenance gate', () => {
  it('validates the committed catalog without promoting research candidates', () => {
    expect(validateData(raw, sources, [], issues)).toEqual([]);
    expect(raw.pids.map((p) => p.pid)).toEqual(
      expect.arrayContaining([
        'IR1001-G2',
        'IR1005-G2',
        'IR1101-K9',
        'IR1835-K9',
        'IE-3500-8T3S-A',
        'IE-3000-8TC',
      ]),
    );
    expect(raw.pids.some((p) => /[x*]/.test(p.pid))).toBe(false);
    expect(
      raw.candidates.every((c) => !raw.pids.some((p) => p.id === c.id)),
    ).toBe(true);
  });
  it('accepts a fully sourced synthetic test fixture', () =>
    expect(validateData(fixtureCatalog(), [source])).toEqual([]));
  it('rejects missing evidence', () => {
    const c = fixtureCatalog();
    c.assertions.push(assertion({ evidence: { excerpt: '', section: '' } }));
    expect(validateData(c, [source]).join(' ')).toContain('fewer than 1');
  });
  it('rejects duplicate PIDs', () => {
    const c = fixtureCatalog();
    c.pids.push({ ...c.pids[0], id: 'second-test-pid' });
    expect(validateData(c, [source]).join(' ')).toContain('Duplicate PID');
  });
  it('rejects orphaned source references', () => {
    const c = fixtureCatalog();
    c.assertions[0].sourceId = 'missing';
    expect(validateData(c, [source]).join(' ')).toContain(
      'Orphaned assertion source',
    );
  });
  it('rejects impossible dates', () => {
    const s = { ...source, documentDate: '2026-02-30' };
    expect(validateData(fixtureCatalog(), [s]).join(' ')).toContain(
      'Invalid or future date',
    );
  });
  it('rejects a source URL mislabeled as official', () => {
    expect(
      validateData(fixtureCatalog(), [
        { ...source, url: 'https://example.com/datasheet' },
      ]).join(' '),
    ).toContain('Official source host outside declared manufacturer domains');
  });
  it('rejects approval without reviewed source content', () => {
    expect(
      validateData(fixtureCatalog(), [{ ...source, status: 'blocked' }]).join(
        ' ',
      ),
    ).toContain('Approval lacks reviewed provenance');
  });
  it('rejects incompatible unflagged claims for the same scope', () => {
    const c = fixtureCatalog();
    c.assertions.push(
      assertion({ id: 'support', predicate: 'cyberVision', value: true }),
      assertion({
        id: 'nosupport',
        predicate: 'cyberVision',
        value: false,
        status: 'unsupported',
      }),
    );
    expect(validateData(c, [source]).join(' ')).toContain(
      'Unflagged contradictory',
    );
  });
  it('rejects string port counts', () => {
    const c = fixtureCatalog();
    c.assertions.push(assertion({ value: 'sixteen' }));
    expect(validateData(c, [source]).join(' ')).toContain('must be integer');
  });
  it('rejects conditional assertions without applicability', () => {
    const c = fixtureCatalog();
    c.assertions.push(assertion({ status: 'conditional' }));
    expect(validateData(c, [source]).join(' ')).toContain('no restrictions');
  });
});

it('rejects built-in counts inflated by optional expansion ports', () => {
  const c = fixtureCatalog();
  c.assertions.push(
    assertion({
      id: 'ports',
      predicate: 'portInventory',
      value: [
        {
          role: 'access',
          medium: 'copper',
          count: 2,
          speedsMbps: [1000],
          origin: 'built-in',
          moduleId: null,
          poeStandards: [],
          comboGroup: null,
        },
      ],
    }),
    assertion({ id: 'count', value: 16 }),
  );
  expect(validateData(c, [source]).join(' ')).toContain(
    'Port inventory/count mismatch',
  );
});
it('rejects orphaned open-review issue references', () => {
  expect(
    validateData(
      raw,
      sources,
      [],
      [
        {
          id: 'issue-test',
          sourceIds: ['missing'],
          subjectIds: [],
          kind: 'gap',
          title: 'Test gap',
          detail: 'Test detail',
          requiresHumanReview: true,
        },
      ],
    ).join(' '),
  ).toContain('Orphaned review issue source');
});

it('accepts announced future lifecycle milestones without accepting future verification', () => {
  const c = fixtureCatalog();
  const data = {
    ...c,
    lifecycleEvents: [
      {
        id: 'future-eol',
        pidId: c.pids[0].id,
        kind: 'end-of-support',
        date: '2031-07-31',
        assertionId: 'orderability',
      },
    ],
  };
  expect(validateData(data, [source])).toEqual([]);
  c.assertions[0].verifiedAt = '2031-07-31T00:00:00Z';
  expect(validateData(c, [source]).join(' ')).toContain('future date');
});

it('allows future vendor evidence only with an explicit reviewed manufacturer-domain declaration', () => {
  const c = fixtureCatalog();
  c.manufacturers[0].officialDomains = ['vendor.example'];
  expect(
    validateData(c, [
      {
        ...source,
        manufacturerId: 'test-manufacturer',
        url: 'https://docs.vendor.example/public-sheet',
      },
    ]),
  ).toEqual([]);
  expect(
    validateData(c, [
      {
        ...source,
        manufacturerId: 'test-manufacturer',
        url: 'https://unrelated.example/public-sheet',
      },
    ]).join(' '),
  ).toContain('outside declared manufacturer domains');
});
