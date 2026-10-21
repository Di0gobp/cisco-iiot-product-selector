import { describe, expect, it } from 'vitest';
import { catalog, defaultRequirements } from '../src/lib/catalog';
import {
  buildConfiguration,
  canAddModule,
  evaluateConfiguredProduct,
  rankConfiguredProducts,
} from '../src/lib/configurations';
import { resolveFact } from '../src/lib/rules';
import { configurationBomCsv, configurationJson } from '../src/lib/export';
import {
  readSavedRequirements,
  savedConfigurationPayload,
} from '../src/lib/saved-configurations';
import type { Requirements } from '../src/lib/types';

const scenario: Requirements = {
  ...defaultRequirements,
  physicalPorts: 16,
  portsAtSpeed: 16,
  requiredPortSpeedMbps: 1000,
  managementModeId: 'meraki',
  cyberVision: true,
  softwareVersionId: 'cv-5.6.1',
};
const ie9300 = [
  'IE-9320-24T4X-E',
  'IE-9320-24T4X-A',
  'IE-9320-24P4S-E',
  'IE-9320-24P4S-A',
];
const product = (pid: string) => catalog.pids.find((p) => p.pid === pid)!;

describe('beta IE9300 management and mandatory selection scenario', () => {
  it.each(ie9300)(
    '%s gains scoped Meraki prerequisites without claiming security coexistence',
    (pid) => {
      const p = product(pid);
      const before = catalog.assertions.filter((a) => !a.id.includes('-beta-'));
      expect(resolveFact(p, before, 'management', scenario).state).toBe(
        'unknown',
      );
      const management = resolveFact(
        p,
        catalog.assertions,
        'management',
        scenario,
      );
      expect(management.state).toBe('conditional');
      expect(management.value).toBe('meraki');
      expect(management.detail).toContain('Minimum firmware 26.2.1');
      expect(management.detail).toContain('INSTALL');
      expect(management.detail).toContain('reformats flash/USB/SD');
      expect(management.detail).toContain(
        'subscription/license offer and activation remain unverified',
      );
      expect(
        resolveFact(p, catalog.assertions, 'management', {
          ...scenario,
          firmware: '26.1.1',
        }).state,
      ).toBe('unknown');
      // Selecting another platform's Meraki offer cannot close the IE9300 licensing gap.
      expect(
        resolveFact(p, catalog.assertions, 'management', {
          ...scenario,
          firmware: '26.2.1',
          licenseIds: ['meraki-enterprise'],
        }).state,
      ).toBe('conditional');
      const result = evaluateConfiguredProduct(p, catalog, scenario);
      expect(result.decision).toBe('unverified');
      expect(
        result.findings.find(
          (f) => f.requirement === '16+ physical Ethernet ports',
        )?.state,
      ).toBe('supported');
      expect(
        result.findings.find((f) =>
          f.requirement.startsWith('16+ built-in ports at'),
        )?.detail,
      ).toContain('28 physical interfaces');
      expect(
        result.findings.find((f) => f.requirement === 'Cyber Vision support')
          ?.state,
      ).toBe('conditional');
      const coexistence = result.findings.find(
        (f) =>
          f.requirement === 'Cyber Vision in the requested management mode',
      );
      expect(coexistence?.state).toBe('unknown');
      expect(coexistence?.detail).toContain(
        'Neither document explicitly confirms coexistence or proves incompatibility',
      );
    },
  );
  it('retains relevant IE9300 candidates and does not turn independent features into a verified recommendation', () => {
    const results = rankConfiguredProducts(catalog.pids, catalog, scenario);
    expect(
      results
        .slice(0, 4)
        .map((r) => r.product.pid)
        .sort(),
    ).toEqual([...ie9300].sort());
    expect(results.filter((r) => ie9300.includes(r.product.pid))).toHaveLength(
      4,
    );
    expect(results.filter((r) => r.decision === 'match')).toEqual([]);
    expect(
      results
        .filter((r) => ie9300.includes(r.product.pid))
        .every((r) => r.decision === 'unverified'),
    ).toBe(true);
    const p = product('IE-3500-8T3S-E');
    for (const pid of ['IEM-3500-8T=', 'IEM-3500-16T=']) {
      const m = catalog.modules.find((m) => m.pid === pid)!;
      const request = {
        ...scenario,
        configurations: {
          [p.id]: {
            moduleIds: [m.id],
            supplyWatts: 200,
            installationConfirmed: true,
          },
        },
      };
      expect(
        buildConfiguration(p, catalog, request).usableTotals?.physicalPorts,
      ).toBe(11);
      expect(evaluateConfiguredProduct(p, catalog, request).decision).not.toBe(
        'match',
      );
      expect(
        evaluateConfiguredProduct(p, catalog, {
          ...request,
          firmware: '26.1.1',
        }).decision,
      ).toBe('excluded');
    }
  });
});

describe('documented complete-configuration regressions', () => {
  it.each([
    ['IE-3300-8P2S-E', 'IEM-3300-16P=', 360],
    ['IE-3400-8P2S-E', 'IEM-3400-8P=', 480],
    ['IE-3500-8P3S-E', 'IEM-3500-16P=', 360],
  ] as const)(
    '%s + %s enforces the documented shared %i W PoE limit',
    (base, modulePid, budget) => {
      const p = product(base),
        m = catalog.modules.find((m) => m.pid === modulePid)!;
      const requirements = {
        ...defaultRequirements,
        newDeployment: false,
        managementModeId: 'local',
        firmware: '17.18.3',
        poeWatts: budget + 1,
        configurations: {
          [p.id]: {
            moduleIds: [m.id],
            supplyWatts: 1000,
            installationConfirmed: true,
          },
        },
      };
      const config = buildConfiguration(p, catalog, requirements);
      expect(config.poeBudgetWatts).toBe(budget);
      expect(evaluateConfiguredProduct(p, catalog, requirements).decision).toBe(
        'excluded',
      );
      expect(
        canAddModule(p, m, catalog, requirements.configurations[p.id]).state,
      ).toBe('unknown');
      expect(config.capacity?.maximumModules).toBeNull();
    },
  );
  it.each([
    ['IE-3300-8T2S-E', 'IEM-3300-8T=', 18, 16, 2, 0],
    ['IE-3400-8T2S-E', 'IEM-3400-8T=', 18, 16, 2, 0],
    ['IE-3500-8T3S-E', 'IEM-3500-8T=', 19, 16, 3, 0],
    ['IE-3500-8T3S-E', 'IEM-3500-16T=', 27, 24, 3, 0],
    ['IE-9320-24T4X-E', '', 28, 24, 0, 4],
  ] as const)(
    '%s + %s preserves sourced capacity through export, restoration and removal',
    (base, modulePid, physical, copper, sfp, sfpPlus) => {
      const p = product(base),
        m = catalog.modules.find((m) => m.pid === modulePid);
      const requirements = {
        ...defaultRequirements,
        newDeployment: false,
        managementModeId: 'local',
        firmware: '17.18.3',
        configurations: {
          [p.id]: {
            moduleIds: m ? [m.id] : [],
            supplyWatts: 200,
            installationConfirmed: true,
          },
        },
      };
      const config = buildConfiguration(p, catalog, requirements);
      expect(config.proposedTotals).toMatchObject({
        physicalPorts: physical,
        portsAtSpeed: physical,
        copperPorts: copper,
        sfpSlots: sfp,
        sfpPlusSlots: sfpPlus,
      });
      expect(config.usableTotals?.physicalPorts).toBe(physical);
      expect(config.selection.moduleIds.length).toBe(m ? 1 : 0);
      expect(config.poeBudgetWatts).toBe(base === 'IE-9320-24T4X-E' ? null : 0);
      if (m) {
        expect(config.components[0].hardware.state).toBe('supported');
        expect(config.components[0].runtime.state).toBe('conditional');
        expect(config.capacity?.maximumModules).toBeNull();
      }
      const csv = configurationBomCsv(p, catalog, requirements);
      expect(csv).toContain(`"${base}","1"`);
      if (m) expect(csv).toContain(`"${modulePid}","1"`);
      expect(
        JSON.parse(configurationJson(p, catalog, requirements))
          .configurations[0].modulePids,
      ).toEqual(m ? [modulePid] : []);
      const restored = readSavedRequirements(
        JSON.stringify(savedConfigurationPayload(catalog, requirements)),
        catalog,
        defaultRequirements,
      );
      expect(buildConfiguration(p, catalog, restored).proposedTotals).toEqual(
        config.proposedTotals,
      );
      const removed = {
        ...requirements,
        configurations: {
          [p.id]: { ...requirements.configurations[p.id], moduleIds: [] },
        },
      };
      const after = buildConfiguration(p, catalog, removed);
      expect(after.proposedTotals).toEqual(after.baseTotals);
      expect(after.selection.moduleIds).toHaveLength(0);
      if (m) expect(after.equipmentWatts!).toBeLessThan(config.equipmentWatts!);
    },
  );
  it('retains combo counting and the IR8300 firmware review boundary in representative router records', () => {
    const ir1101 = buildConfiguration(
      product('IR1101-K9'),
      catalog,
      defaultRequirements,
    );
    expect(ir1101.baseTotals).toMatchObject({
      physicalPorts: 5,
      portsAtSpeed: 1,
      comboPorts: 1,
    });
    const ir8340 = buildConfiguration(
      product('IR8340-K9'),
      catalog,
      defaultRequirements,
    );
    expect(ir8340.baseTotals).toMatchObject({
      physicalPorts: 14,
      portsAtSpeed: 14,
      comboPorts: 6,
    });
    expect(
      resolveFact(product('IR8340-K9'), catalog.assertions, 'cyberVision', {
        ...defaultRequirements,
        cyberVision: true,
        softwareVersionId: 'cv-5.6.1',
        firmware: '17.18.3',
      }).state,
    ).toBe('unknown');
  });
});
