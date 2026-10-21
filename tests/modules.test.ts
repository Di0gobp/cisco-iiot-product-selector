import { describe, expect, it } from 'vitest';
import { catalog, defaultRequirements, sources } from '../src/lib/catalog';
import {
  buildConfiguration,
  canAddModule,
  evaluateConfiguredProduct,
  moduleHardwareCompatibility,
  totalPorts,
} from '../src/lib/configurations';
import {
  comparisonCsv,
  configurationBomCsv,
  configurationJson,
} from '../src/lib/export';
import {
  readSavedRequirements,
  savedConfigurationPayload,
} from '../src/lib/saved-configurations';
import { validateData } from '../scripts/validate-data.mjs';
import { assertion, applicability, fixtureCatalog, product } from './fixtures';
import type {
  Catalog,
  ConfigurationPower,
  HardwareModule,
  PortGroup,
  Requirements,
} from '../src/lib/types';

const group = (
  origin: 'built-in' | 'expansion',
  moduleId: string | null,
): PortGroup => ({
  role: 'access',
  medium: 'copper',
  connector: 'rj45',
  count: 8,
  speedsMbps: [1000],
  origin,
  moduleId,
  poeStandards: [],
  comboGroup: null,
});
const power = (
  consumptionWatts: number,
  systemPoeBudgetWatts: number | null,
  basePoePorts: number | null,
  maxPoePerPortWatts: number,
): ConfigurationPower => ({
  consumptionWatts,
  systemPoeBudgetWatts,
  basePoePorts,
  maxPoePerPortWatts,
  summary: 'Synthetic power design fixture.',
});
function fixture() {
  const data = fixtureCatalog();
  const module: HardwareModule = {
    id: 'test-expansion',
    pid: 'TEST-EXPANSION-8=',
    name: 'Synthetic eight-port module',
    moduleType: 'ethernet-expansion',
    familyIds: ['test-family'],
    reviewStatus: 'approved',
    identityAssertionId: 'module-identity',
    portInventoryAssertionId: 'module-ports',
    assertionIds: [
      'module-identity',
      'module-ports',
      'module-power',
      'module-fit',
      'module-runtime',
    ],
  };
  data.modules = [module];
  data.assertions.push(
    assertion({
      id: 'base-ports',
      predicate: 'portInventory',
      value: [group('built-in', null)],
    }),
    assertion({
      id: 'base-count',
      predicate: 'physicalEthernetPorts',
      value: 8,
    }),
    assertion({ id: 'base-copper', predicate: 'builtInCopperPorts', value: 8 }),
    assertion({ id: 'base-poe', predicate: 'poeBudgetWatts', value: 0 }),
    assertion({
      id: 'base-power',
      predicate: 'configurationPower',
      value: power(20, 120, 0, 0) as unknown as Record<string, unknown>,
    }),
    assertion({
      id: 'base-management',
      predicate: 'management',
      value: 'local',
      applicability: { ...applicability, managementModeIds: ['local'] },
    }),
    assertion({
      id: 'slots',
      predicate: 'expansionCapacity',
      value: {
        maximumModules: 1,
        slotIds: ['expansion'],
        summary: 'Synthetic verified one-slot chassis.',
      },
    }),
    assertion({
      id: 'module-identity',
      subjectId: module.id,
      predicate: 'orderability',
      value: true,
      evidence: { excerpt: module.pid, section: 'Synthetic ordering fixture' },
    }),
    assertion({
      id: 'module-ports',
      subjectId: module.id,
      predicate: 'portInventory',
      value: [group('expansion', module.id)],
    }),
    assertion({
      id: 'module-power',
      subjectId: module.id,
      predicate: 'configurationPower',
      value: power(5, null, null, 30) as unknown as Record<string, unknown>,
    }),
    assertion({
      id: 'module-fit',
      subjectId: module.id,
      predicate: 'moduleSupport',
      value: { moduleId: module.id, scope: 'hardware', maxQuantity: 1 },
      applicability: { ...applicability, pidIds: [product.id] },
    }),
    assertion({
      id: 'module-runtime',
      subjectId: module.id,
      predicate: 'moduleSupport',
      value: { moduleId: module.id, scope: 'runtime', maxQuantity: 1 },
      applicability: {
        ...applicability,
        pidIds: [product.id],
        managementModeIds: ['local'],
        firmwareMin: '17.18',
        licenseIds: ['network-essentials'],
      },
    }),
  );
  const requirements: Requirements = {
    ...defaultRequirements,
    newDeployment: false,
    firmware: '17.18.3',
    managementModeId: 'local',
    licenseIds: ['network-essentials'],
    physicalPorts: 16,
    copperPorts: 16,
    portsAtSpeed: 16,
    requiredPortSpeedMbps: 1000,
    configurations: {
      [product.id]: {
        moduleIds: [module.id],
        supplyWatts: 200,
        installationConfirmed: true,
      },
    },
  };
  return { data, module, requirements };
}
const pid = (value: string) => catalog.pids.find((p) => p.pid === value)!;
const mod = (value: string) => catalog.modules.find((m) => m.pid === value)!;
function actual(
  base: string,
  modulePid: string,
  context: Partial<Requirements> = {},
) {
  const product = pid(base),
    module = mod(modulePid);
  const requirements = {
    ...defaultRequirements,
    newDeployment: false,
    managementModeId: 'local',
    firmware: '17.18.3',
    licenseIds: ['network-essentials'],
    ...context,
    configurations: {
      [product.id]: {
        moduleIds: [module.id],
        supplyWatts: 600,
        installationConfirmed: true,
      },
    },
  };
  return { product, module, requirements };
}

describe('expansion configuration acceptance', () => {
  it('counts eight built-in Gigabit ports plus eight verified module ports as sixteen', () => {
    const { data, requirements } = fixture();
    const config = buildConfiguration(product, data, requirements);
    expect(config.baseTotals?.physicalPorts).toBe(8);
    expect(config.expansionTotals.physicalPorts).toBe(8);
    expect(config.proposedTotals?.physicalPorts).toBe(16);
    expect(config.usableTotals?.portsAtSpeed).toBe(16);
    expect(
      evaluateConfiguredProduct(product, data, requirements).decision,
    ).toBe('match');
    expect(data.assertions.find((a) => a.id === 'module-ports')?.value).toEqual(
      [group('expansion', 'test-expansion')],
    );
  });
  it('does not allow a PoE module on an explicitly incompatible non-PoE chassis', () => {
    const base = pid('IE-3300-8T2S-E'),
      module = mod('IEM-3300-8P=');
    const result = canAddModule(base, module, catalog, {
      moduleIds: [],
      supplyWatts: null,
      installationConfirmed: false,
    });
    expect(result.state).toBe('unsupported');
    expect(result.detail).toContain('PoE-capable base');
  });
  it('excludes Meraki 26.1.1 expansion and keeps newer unverified releases unknown', () => {
    const c = actual('IE-3500-8T3S-E', 'IEM-3500-8T=', {
      managementModeId: 'meraki',
      firmware: '26.1.1',
      physicalPorts: 16,
      licenseIds: ['meraki-enterprise'],
    });
    const config = buildConfiguration(c.product, catalog, c.requirements);
    expect(config.proposedTotals?.physicalPorts).toBe(19);
    expect(config.usableTotals?.physicalPorts).toBe(11);
    expect(
      evaluateConfiguredProduct(c.product, catalog, c.requirements).decision,
    ).toBe('excluded');
    expect(
      evaluateConfiguredProduct(c.product, catalog, {
        ...c.requirements,
        firmware: '26.2.1',
      }).decision,
    ).toBe('unverified');
    expect(
      buildConfiguration(c.product, catalog, {
        ...c.requirements,
        firmware: '26.2.1',
      }).components[0].runtime.state,
    ).toBe('unknown');
  });
  it('enforces a verified slot limit and rejects repeated modules above the documented quantity', () => {
    const { data, module, requirements } = fixture();
    expect(
      canAddModule(
        product,
        module,
        data,
        requirements.configurations[product.id],
      ).state,
    ).toBe('unsupported');
    const invalid = {
      ...requirements,
      configurations: {
        [product.id]: {
          ...requirements.configurations[product.id],
          moduleIds: [module.id, module.id],
        },
      },
    };
    expect(evaluateConfiguredProduct(product, data, invalid).decision).toBe(
      'excluded',
    );
    expect(
      buildConfiguration(product, data, invalid).findings.find(
        (f) => f.requirement === 'Module slots',
      )?.state,
    ).toBe('unsupported');
  });
  it('enforces a verified system PoE ceiling and sufficient supply capacity', () => {
    const { data, requirements } = fixture();
    const inventory = data.assertions.find((a) => a.id === 'module-ports')!
      .value as PortGroup[];
    inventory[0].poeStandards = ['802.3af', '802.3at'];
    expect(buildConfiguration(product, data, requirements).poeBudgetWatts).toBe(
      120,
    );
    expect(
      evaluateConfiguredProduct(product, data, {
        ...requirements,
        poeWatts: 121,
      }).decision,
    ).toBe('excluded');
    const underpowered = {
      ...requirements,
      poeWatts: 100,
      configurations: {
        [product.id]: {
          ...requirements.configurations[product.id],
          supplyWatts: 100,
        },
      },
    };
    expect(
      buildConfiguration(product, data, underpowered).findings.find(
        (f) => f.requirement === 'Supply capacity',
      )?.state,
    ).toBe('unsupported');
  });
  it('never promotes unknown compatibility into a positive match or counted module capacity', () => {
    const { data, module, requirements } = fixture();
    data.assertions = data.assertions.filter((a) => a.id !== 'module-fit');
    expect(moduleHardwareCompatibility(product, module, data).state).toBe(
      'unknown',
    );
    expect(
      canAddModule(product, module, data, {
        moduleIds: [],
        supplyWatts: null,
        installationConfirmed: false,
      }).state,
    ).toBe('unknown');
    expect(
      buildConfiguration(product, data, requirements).usableTotals
        ?.physicalPorts,
    ).toBe(8);
    expect(
      evaluateConfiguredProduct(product, data, requirements).decision,
    ).toBe('unverified');
  });
  it('includes exact base and module PIDs in BOM, comparison CSV and saved JSON', () => {
    const c = actual('IE-3300-8T2S-E', 'IEM-3300-8T=');
    const bom = configurationBomCsv(c.product, catalog, c.requirements);
    expect(bom).toContain('"IE-3300-8T2S-E","1"');
    expect(bom).toContain('"IEM-3300-8T=","1"');
    expect(bom).toContain('https://www.cisco.com/');
    expect(
      comparisonCsv([c.product], catalog.assertions, c.requirements, catalog),
    ).toContain('IEM-3300-8T=');
    const saved = JSON.parse(
      configurationJson(c.product, catalog, c.requirements),
    );
    expect(saved.configurations[0].basePid).toBe('IE-3300-8T2S-E');
    expect(saved.configurations[0].modulePids).toEqual(['IEM-3300-8T=']);
    expect(saved.evaluation.assembledDimensionsMm).toBeNull();
  });
  it('removing a module recalculates ports, rate counts, PoE, power, slots and match state', () => {
    const { data, requirements } = fixture();
    (
      data.assertions.find((a) => a.id === 'module-ports')!.value as PortGroup[]
    )[0].poeStandards = ['802.3at'];
    const before = buildConfiguration(product, data, requirements);
    const removed = {
      ...requirements,
      configurations: {
        [product.id]: {
          ...requirements.configurations[product.id],
          moduleIds: [],
        },
      },
    };
    const after = buildConfiguration(product, data, removed);
    expect([
      before.proposedTotals?.physicalPorts,
      before.proposedTotals?.copperPorts,
      before.proposedTotals?.portsAtSpeed,
      before.proposedTotals?.poePorts,
      before.equipmentWatts,
      before.selection.moduleIds.length,
    ]).toEqual([16, 16, 16, 8, 25, 1]);
    expect([
      after.proposedTotals?.physicalPorts,
      after.proposedTotals?.copperPorts,
      after.proposedTotals?.portsAtSpeed,
      after.proposedTotals?.poePorts,
      after.equipmentWatts,
      after.selection.moduleIds.length,
    ]).toEqual([8, 8, 8, 0, 20, 0]);
    expect(after.poeBudgetWatts).toBe(0);
    expect(evaluateConfiguredProduct(product, data, removed).decision).toBe(
      'excluded',
    );
    expect(configurationBomCsv(product, data, removed)).not.toContain(
      'TEST-EXPANSION-8=',
    );
  });
});

describe('module evidence and deployment boundaries', () => {
  it('requires missing firmware/license context and never inherits base-only CV coexistence', () => {
    const { data, requirements } = fixture();
    expect(
      evaluateConfiguredProduct(product, data, {
        ...requirements,
        firmware: '',
      }).decision,
    ).toBe('conditional');
    expect(
      evaluateConfiguredProduct(product, data, {
        ...requirements,
        licenseIds: [],
      }).decision,
    ).toBe('conditional');
    const c = actual('IE-3500-8T3S-A', 'IEM-3500-8T=', { cyberVision: true });
    expect(
      buildConfiguration(c.product, catalog, c.requirements).findings.find(
        (f) => f.requirement === 'Security on the expanded configuration',
      )?.state,
    ).toBe('unknown');
    expect(
      evaluateConfiguredProduct(c.product, catalog, c.requirements).decision,
    ).toBe('unverified');
  });
  it('keeps IE3400 mixed-module security and IEM-3500-4MU protocol restrictions visible', () => {
    const mixed = actual('IE-3400-8T2S-E', 'IEM-3300-8T=');
    expect(
      buildConfiguration(
        mixed.product,
        catalog,
        mixed.requirements,
      ).findings.some((f) => f.detail.includes('SGT/SGACL')),
    ).toBe(true);
    const multi = actual('IE-3500-8U3X-E', 'IEM-3500-4MU=', {
      protocolIds: ['PTP'],
    });
    expect(
      evaluateConfiguredProduct(multi.product, catalog, multi.requirements)
        .decision,
    ).toBe('excluded');
  });
  it('de-duplicates combo media and never changes stored port origins', () => {
    const ports = [
      {
        ...group('built-in', null),
        count: 1,
        medium: 'combo' as const,
        comboGroup: 'wan',
      },
      {
        ...group('built-in', null),
        count: 1,
        medium: 'combo' as const,
        comboGroup: 'wan',
      },
    ];
    expect(totalPorts(ports, 1000).physicalPorts).toBe(1);
    expect(totalPorts(ports, 10000).portsAtSpeed).toBe(0);
    expect(ports[0].origin).toBe('built-in');
  });
  it('loads saved exact PIDs but reevaluates unrecognized or stale module identities as unknown', () => {
    const c = actual('IE-3300-8T2S-E', 'IEM-3300-8T=');
    const payload = savedConfigurationPayload(catalog, c.requirements);
    const restored = readSavedRequirements(
      JSON.stringify(payload),
      catalog,
      defaultRequirements,
    );
    expect(restored.configurations[c.product.id].moduleIds).toEqual([
      c.module.id,
    ]);
    payload.configurations[0].modulePids = ['NO-LONGER-VERIFIED='];
    const changed = readSavedRequirements(
      JSON.stringify(payload),
      catalog,
      defaultRequirements,
    );
    expect(
      evaluateConfiguredProduct(c.product, catalog, changed).decision,
    ).toBe('unverified');
    expect(configurationBomCsv(c.product, catalog, changed)).toContain(
      'NO-LONGER-VERIFIED=',
    );
  });
  it('validates source-backed identities and rejects expansion ports published as built in', () => {
    expect(validateData(catalog, sources)).toEqual([]);
    const invalid: Catalog = structuredClone(catalog);
    const inventory = invalid.assertions.find(
      (a) => a.id === invalid.modules[0].portInventoryAssertionId,
    )!.value as PortGroup[];
    inventory[0].origin = 'built-in';
    expect(validateData(invalid, sources).join(' ')).toContain(
      'Invalid module port inventory',
    );
    const identity = invalid.assertions.find(
      (a) => a.id === invalid.modules[0].identityAssertionId,
    )!;
    identity.evidence.excerpt = 'Not an exact identity';
    expect(validateData(invalid, sources).join(' ')).toContain(
      'Unverified module identity',
    );
  });
});
