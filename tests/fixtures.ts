import type { Assertion, Catalog, Product, Source } from '../src/lib/types';
// Entirely synthetic, test-only identifiers. Never bundled into the application catalog.
export const applicability = {
  pidIds: [],
  firmwareMin: null,
  firmwareMax: null,
  licenseIds: [],
  softwareVersionIds: [],
  managementModeIds: [],
  architecture: null,
  configuration: null,
  effectiveFrom: null,
  assetLimit: null,
};
export const product: Product = {
  id: 'test-router',
  pid: 'TEST-ROUTER-2',
  modelId: 'test-model',
  familyId: 'test-family',
  orderabilityAssertionId: 'orderability',
  reviewStatus: 'approved',
};
export const source: Source = {
  id: 'test-source',
  title: 'Synthetic fixture document',
  url: 'https://www.cisco.com/example-test-fixture',
  type: 'official-datasheet',
  status: 'reviewed',
  documentDate: null,
  lastCheckedAt: '2026-01-01T00:00:00Z',
  verifiedAt: '2026-01-01T00:00:00Z',
  lastMaterialChangeAt: null,
  contentHash: 'sha256:' + 'a'.repeat(64),
  supersedes: [],
  note: 'Synthetic fixture, not vendor evidence.',
};
export function assertion(overrides: Partial<Assertion> = {}): Assertion {
  return {
    id: 'test-assertion',
    subjectId: product.id,
    predicate: 'builtInCopperPorts',
    value: 2,
    status: 'supported',
    sourceId: source.id,
    evidence: {
      excerpt: 'Synthetic fixture for a two-port device.',
      section: 'Test fixture',
    },
    applicability: { ...applicability },
    confidence: 'high',
    reviewStatus: 'approved',
    reviewer: 'test-reviewer',
    verifiedAt: '2026-01-01T00:00:00Z',
    interpretation: 'published',
    supersedes: [],
    conflictsWith: [],
    requiresHumanReview: false,
    ...overrides,
  };
}
export function fixtureCatalog(): Catalog & Record<string, unknown> {
  return {
    schemaVersion: '1.0.0',
    manufacturers: [{ id: 'test-manufacturer', name: 'Test manufacturer' }],
    families: [
      {
        id: 'test-family',
        manufacturerId: 'test-manufacturer',
        name: 'Test family',
        category: 'router',
      },
    ],
    models: [{ id: 'test-model', name: 'Test model', familyId: 'test-family' }],
    pids: [{ ...product }],
    revisions: [],
    modules: [],
    software: [],
    versions: [],
    licenses: [],
    features: [],
    managementModes: [],
    lifecycleEvents: [],
    assertions: [
      assertion({ id: 'orderability', predicate: 'orderability', value: true }),
    ],
    candidates: [],
  };
}
