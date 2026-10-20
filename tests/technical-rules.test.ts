import { describe, expect, it } from 'vitest';
import { countBuiltInPorts } from '../src/lib/ports';
import {
  evaluateEntitlement,
  evaluateProduct,
  matchList,
  resolveFact,
} from '../src/lib/rules';
import { defaultRequirements, catalog } from '../src/lib/catalog';
import { assertion, applicability, product } from './fixtures';
import type { PortGroup } from '../src/lib/types';
const req = { ...defaultRequirements, newDeployment: false };
const port = (overrides: Partial<PortGroup> = {}): PortGroup => ({
  count: 1,
  medium: 'copper',
  role: 'access',
  origin: 'built-in',
  speedsMbps: [1000],
  moduleId: null,
  poeStandards: [],
  comboGroup: null,
  ...overrides,
});
describe('Phase B technical requirements', () => {
  it('counts combo media once and excludes module ports at a requested rate', () => {
    const inventory = [
      port({ count: 4 }),
      port({ medium: 'combo', comboGroup: 'shared' }),
      port({ medium: 'combo', comboGroup: 'shared' }),
      port({ count: 8, origin: 'expansion', moduleId: 'module' }),
    ];
    expect(countBuiltInPorts(inventory)).toBe(5);
    expect(countBuiltInPorts(inventory, 10000)).toBe(0);
  });
  it('does not count a console, duplicate combo media, or expansion as high-speed base capacity', () => {
    const inventory = assertion({
      predicate: 'portInventory',
      value: [
        port({ count: 4, speedsMbps: [100] }),
        port({ medium: 'combo', comboGroup: 'wan' }),
        port({ medium: 'combo', comboGroup: 'wan' }),
      ],
    });
    expect(
      evaluateProduct(product, [inventory], {
        ...req,
        portsAtSpeed: 2,
        requiredPortSpeedMbps: 1000,
      }).decision,
    ).toBe('excluded');
  });
  it('requires review of temperature conditions and does not count a storage rating as operation', () => {
    const a = assertion({
      predicate: 'operatingTemperature',
      value: {
        ranges: [{ minC: -40, maxC: 60, conditions: 'Sealed cabinet' }],
        complete: false,
      },
    });
    expect(
      evaluateProduct(product, [a], {
        ...req,
        operatingMinC: -30,
        operatingMaxC: 50,
      }).decision,
    ).toBe('conditional');
    expect(
      evaluateProduct(product, [a], { ...req, operatingMaxC: 85 }).decision,
    ).toBe('unverified');
  });
  it('does not treat an absent item in a partial protocol list as unsupported or conditionally supported', () => {
    const a = assertion({
      predicate: 'industrialProtocols',
      value: { items: ['PTP'], complete: false },
      status: 'conditional',
      applicability: { ...applicability, configuration: 'Firmware review' },
    });
    expect(
      matchList(product, [a], 'industrialProtocols', 'PRP', req).state,
    ).toBe('unknown');
  });
  it('does not apply a software-specific capability to another release', () => {
    const a = assertion({
      predicate: 'cyberVision',
      value: true,
      applicability: { ...applicability, softwareVersionIds: ['cv-5.6.1'] },
    });
    expect(
      resolveFact(product, [a], 'cyberVision', {
        ...req,
        softwareVersionId: 'cv-unreviewed',
      }).state,
    ).toBe('unknown');
    expect(resolveFact(product, [a], 'cyberVision', req).state).toBe(
      'conditional',
    );
  });
  it('keeps a scoped negative conditional until its management mode is selected', () => {
    const a = assertion({
      predicate: 'cyberVision',
      value: false,
      status: 'unsupported',
      applicability: { ...applicability, managementModeIds: ['test-mode'] },
    });
    expect(resolveFact(product, [a], 'cyberVision', req).state).toBe(
      'conditional',
    );
    expect(
      resolveFact(product, [a], 'cyberVision', {
        ...req,
        managementModeId: 'test-mode',
      }).state,
    ).toBe('unsupported');
    expect(
      resolveFact(product, [a], 'cyberVision', {
        ...req,
        managementModeId: 'other',
      }).state,
    ).toBe('unknown');
  });
  it('never treats a CV + SEA restriction as a restriction on CV alone', () => {
    const a = assertion({
      predicate: 'coexistence',
      value: false,
      status: 'unsupported',
      applicability: {
        ...applicability,
        featureIds: ['cv-visibility', 'sea-remote-access'],
      },
    });
    expect(
      resolveFact(product, [a], 'coexistence', {
        ...req,
        cyberVision: true,
        managementModeId: 'local',
      }).state,
    ).toBe('unknown');
    expect(
      resolveFact(product, [a], 'coexistence', {
        ...req,
        cyberVision: true,
        sea: true,
      }).state,
    ).toBe('unsupported');
  });
  it('does not inherit separate-agent restrictions into an unverified current SRA architecture', () => {
    const a = assertion({
      predicate: 'coexistence',
      value: false,
      status: 'unsupported',
      applicability: {
        ...applicability,
        architecture: 'separate-cv-sea-agents',
        featureIds: ['cv-visibility', 'sea-remote-access'],
      },
    });
    expect(
      resolveFact(product, [a], 'coexistence', {
        ...req,
        cyberVision: true,
        sea: true,
        architecture: 'current-sra',
      }).state,
    ).toBe('unknown');
    expect(
      resolveFact(product, [a], 'coexistence', {
        ...req,
        cyberVision: true,
        sea: true,
        architecture: 'separate-cv-sea-agents',
      }).state,
    ).toBe('unsupported');
  });
  it('does not infer Meraki coexistence from generic IOS XE hosting evidence', () => {
    const a = assertion({
      predicate: 'coexistence',
      value: true,
      applicability: {
        ...applicability,
        featureIds: ['cv-visibility', 'sea-remote-access'],
      },
    });
    expect(
      resolveFact(product, [a], 'coexistence', {
        ...req,
        cyberVision: true,
        sea: true,
        managementModeId: 'meraki',
      }).state,
    ).toBe('unknown');
  });
  it('uses supersession while preserving the old record in the data', () => {
    const old = assertion({ id: 'old', value: 2 });
    const updated = assertion({ id: 'updated', value: 4, supersedes: ['old'] });
    expect(
      resolveFact(product, [old, updated], 'builtInCopperPorts', req).value,
    ).toBe(4);
  });
  it('excludes an actual EoS PID from new deployment without claiming a replacement is equivalent', () => {
    const legacy = catalog.pids.find((p) => p.pid === 'IE-4010-4S24P')!;
    expect(
      evaluateProduct(legacy, catalog.assertions, defaultRequirements).decision,
    ).toBe('excluded');
    expect(
      catalog.assertions.find(
        (a) => a.subjectId === legacy.id && a.predicate === 'replacement',
      )?.status,
    ).toBe('conditional');
  });
  it('preserves the IR1835-specific CV 5.6 firmware minimum and IE3300 VID caveat', () => {
    const ir = catalog.assertions.find(
      (a) => a.subjectId === 'pid-ir1835-k9' && a.predicate === 'cyberVision',
    )!;
    expect(ir.applicability.firmwareMin).toBe('17.15');
    const ie = catalog.assertions.find(
      (a) =>
        a.subjectId === 'pid-ie-3300-8t2s-e' && a.predicate === 'cyberVision',
    )!;
    expect(ie.applicability.configuration).toContain('VID -06');
  });
});
describe('commercial eligibility is separate from technical support', () => {
  const a = assertion({
    predicate: 'entitlement',
    value: {
      quantity: 24,
      durationMonths: 36,
      licenseId: 'bundle',
      featureId: 'cv-visibility',
    },
    applicability: {
      ...applicability,
      licenseIds: ['network-advantage'],
      qualifyingOrderFrom: '2025-08-23',
      qualifyingUpgradeFrom: '2025-10-20',
    },
  });
  it('keeps a missing confirmed license conditional', () =>
    expect(
      evaluateEntitlement(a, { ...req, orderDate: '2026-01-01' }).state,
    ).toBe('conditional'));
  it('does not substitute the order threshold for the later upgrade threshold', () =>
    expect(
      evaluateEntitlement(a, {
        ...req,
        licenseIds: ['network-advantage'],
        upgradeDate: '2025-09-01',
      }).state,
    ).toBe('unknown'));
  it('rejects endpoints above the included quantity', () =>
    expect(
      evaluateEntitlement(a, {
        ...req,
        licenseIds: ['network-advantage'],
        orderDate: '2026-01-01',
        endpointCount: 25,
      }).state,
    ).toBe('unsupported'));
  it('does not treat eligible dates as proof of activation or remaining term', () => {
    const result = evaluateEntitlement(a, {
      ...req,
      licenseIds: ['network-advantage'],
      upgradeDate: '2025-10-20',
      endpointCount: 24,
    });
    expect(result.state).toBe('conditional');
    expect(result.detail).toContain('Actual activation date');
  });
});

it('keeps additional endpoint licensing visible in the selector without declaring the hardware incapable', () => {
  const p = catalog.pids.find((p) => p.pid === 'IE-3500-8T3S-A')!;
  const result = evaluateProduct(p, catalog.assertions, {
    ...req,
    cyberVision: true,
    endpointCount: 25,
    licenseIds: ['network-advantage'],
    orderDate: '2026-01-01',
  });
  const finding = result.findings.find((f) =>
    f.requirement.includes('25 endpoints'),
  );
  expect(finding?.state).toBe('conditional');
  expect(finding?.detail).toContain('additional licensing');
});

it('accepts one of the documented alternative licenses without requiring every offer', () => {
  const a = assertion({
    predicate: 'management',
    value: 'meraki',
    applicability: {
      ...applicability,
      managementModeIds: ['meraki'],
      licenseAnyOfIds: ['offer-a', 'offer-b'],
    },
  });
  expect(
    resolveFact(product, [a], 'management', {
      ...req,
      managementModeId: 'meraki',
      licenseIds: ['offer-b'],
    }).state,
  ).toBe('supported');
  expect(
    resolveFact(product, [a], 'management', {
      ...req,
      managementModeId: 'meraki',
      licenseIds: ['unrelated'],
    }).state,
  ).toBe('conditional');
});
it('does not grant an original Essentials PID a bundle based on the original order date', () => {
  const a = catalog.assertions.find(
    (a) =>
      a.subjectId === 'pid-ie-3500-8t3s-e' && a.predicate === 'entitlement',
  )!;
  expect(
    evaluateEntitlement(a, {
      ...req,
      licenseIds: ['network-advantage'],
      orderDate: '2026-01-01',
    }).state,
  ).toBe('unknown');
  expect(
    evaluateEntitlement(a, {
      ...req,
      licenseIds: ['network-advantage'],
      upgradeDate: '2026-01-01',
    }).state,
  ).toBe('conditional');
});
