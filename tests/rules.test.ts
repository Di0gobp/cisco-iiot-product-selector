import { describe, expect, it } from 'vitest';
import {
  compareVersions,
  evaluateProduct,
  rankProducts,
  resolveFact,
  searchProducts,
} from '../src/lib/rules';
import { defaultRequirements } from '../src/lib/catalog';
import { assertion, product, applicability } from './fixtures';
const req = { ...defaultRequirements, newDeployment: false };
describe('deterministic selection', () => {
  it('prioritizes exact PID search without mixing similar PIDs', () => {
    const list = [{ ...product, pid: 'TEST-ROUTER-2-EXTRA' }, product];
    expect(searchProducts(list, ' test-router-2 ')[0].pid).toBe(product.pid);
    expect(searchProducts(list, 'missing')).toHaveLength(0);
  });
  it('excludes a two-port router from a sixteen-port requirement', () => {
    const result = evaluateProduct(product, [assertion()], {
      ...req,
      copperPorts: 16,
    });
    expect(result.decision).toBe('excluded');
    expect(result.findings[0].state).toBe('unsupported');
  });
  it('does not count expansion or combo ports toward built-in dedicated copper', () => {
    const inventory = assertion({
      predicate: 'portInventory',
      value: [
        {
          role: 'access',
          medium: 'copper',
          count: 16,
          speedsMbps: [1000],
          origin: 'expansion',
          moduleId: 'test-module',
          poeStandards: [],
          comboGroup: null,
        },
      ],
    });
    expect(
      evaluateProduct(product, [inventory], { ...req, copperPorts: 16 })
        .decision,
    ).toBe('unverified');
  });
  it('keeps a minimum-firmware assertion conditional without a selected version', () => {
    const a = assertion({
      predicate: 'cyberVision',
      value: true,
      applicability: { ...applicability, firmwareMin: '17.18.1' },
    });
    expect(resolveFact(product, [a], 'cyberVision', req).state).toBe(
      'conditional',
    );
    expect(
      resolveFact(product, [a], 'cyberVision', { ...req, firmware: '17.18.1' })
        .state,
    ).toBe('supported');
    expect(
      resolveFact(product, [a], 'cyberVision', { ...req, firmware: '17.17.1' })
        .state,
    ).toBe('unknown');
  });
  it('does not guess ordering for vendor version suffixes', () => {
    expect(compareVersions('17.18.1a', '17.18.1')).toBeNull();
    expect(compareVersions('17.10', '17.9')).toBe(1);
    expect(
      resolveFact(
        product,
        [
          assertion({
            applicability: { ...applicability, firmwareMin: '17.18.1' },
          }),
        ],
        'builtInCopperPorts',
        { ...req, firmware: '17.18.1a' },
      ).state,
    ).toBe('unknown');
  });
  it('shows unknown Cyber Vision compatibility as unverified, not unsupported', () => {
    const result = evaluateProduct(product, [], { ...req, cyberVision: true });
    expect(result.decision).toBe('unverified');
    expect(result.findings[0].state).toBe('unknown');
    expect(result.score).toBe(0);
  });
  it('excludes known end-of-sale products by default but allows legacy research', () => {
    const a = assertion({ predicate: 'lifecycle', value: 'end-of-sale' });
    expect(evaluateProduct(product, [a], defaultRequirements).decision).toBe(
      'excluded',
    );
    expect(evaluateProduct(product, [a], req).findings).toHaveLength(0);
  });
  it('does not give an unreviewed exact PID a match', () => {
    expect(
      evaluateProduct({ ...product, reviewStatus: 'pending' }, [assertion()], {
        ...req,
        copperPorts: 2,
      }).decision,
    ).toBe('unverified');
  });
  it('requires license and architecture restrictions to remain visible', () => {
    const a = assertion({
      predicate: 'cyberVision',
      value: true,
      applicability: {
        ...applicability,
        licenseIds: ['test-license'],
        architecture: 'test-architecture',
      },
    });
    const fact = resolveFact(product, [a], 'cyberVision', req);
    expect(fact.state).toBe('conditional');
    expect(fact.detail).toContain('test-license');
    expect(fact.detail).toContain('test-architecture');
  });
  it('never assumes feature coexistence from isolated claims', () => {
    const claims = [
      assertion({ id: 'cv', predicate: 'cyberVision', value: true }),
      assertion({
        id: 'mgmt',
        predicate: 'management',
        value: 'test-dashboard',
      }),
    ];
    expect(
      evaluateProduct(product, claims, {
        ...req,
        cyberVision: true,
        managementModeId: 'test-dashboard',
      }).decision,
    ).toBe('unverified');
  });
  it('marks conflicting evidence unknown', () => {
    const a = assertion({
      conflictsWith: ['other'],
      requiresHumanReview: true,
    });
    expect(resolveFact(product, [a], 'builtInCopperPorts', req).state).toBe(
      'unknown',
    );
  });
  it('keeps unsatisfied hard requirements excluded even with a family preference', () => {
    expect(
      rankProducts([product], [assertion()], {
        ...req,
        copperPorts: 16,
        preferredFamilyId: product.familyId,
      })[0].decision,
    ).toBe('excluded');
  });
  it('does not let rejected evidence establish a fact', () => {
    expect(
      resolveFact(
        product,
        [assertion({ reviewStatus: 'rejected' })],
        'builtInCopperPorts',
        req,
      ).state,
    ).toBe('unknown');
  });
});
