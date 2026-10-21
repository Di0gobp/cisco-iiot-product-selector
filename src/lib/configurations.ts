import type {
  Assertion,
  Catalog,
  Compatibility,
  ConfigurationPower,
  Finding,
  HardwareModule,
  HardwareSelection,
  MatchResult,
  PortGroup,
  Product,
  Requirements,
} from './types';
import {
  compareVersions,
  compareMatchResults,
  evaluateProduct,
  resolveFact,
} from './rules';
import { countBuiltInPorts } from './ports';

export const emptySelection = (): HardwareSelection => ({
  moduleIds: [],
  supplyWatts: null,
  installationConfirmed: false,
});
export const selectionFor = (product: Product, requirements: Requirements) =>
  requirements.configurations[product.id] ?? emptySelection();

function reviewed(catalog: Catalog, subjectId: string, predicate?: string) {
  const superseded = new Set(
    catalog.assertions
      .filter((a) => a.reviewStatus === 'approved' && !a.requiresHumanReview)
      .flatMap((a) => a.supersedes),
  );
  return catalog.assertions.filter(
    (a) =>
      a.subjectId === subjectId &&
      (!predicate || a.predicate === predicate) &&
      a.reviewStatus === 'approved' &&
      !superseded.has(a.id),
  );
}
function usable(assertion: Assertion | undefined): assertion is Assertion {
  return (
    !!assertion &&
    assertion.reviewStatus === 'approved' &&
    !assertion.requiresHumanReview &&
    !assertion.conflictsWith.length &&
    assertion.status !== 'unknown'
  );
}
export function moduleInventory(
  module: HardwareModule,
  catalog: Catalog,
): PortGroup[] | null {
  const fact = catalog.assertions.find(
    (a) => a.id === module.portInventoryAssertionId,
  );
  return module.reviewStatus === 'approved' &&
    usable(fact) &&
    fact.status === 'supported' &&
    Array.isArray(fact.value)
    ? fact.value
    : null;
}
export function componentFact(
  catalog: Catalog,
  subjectId: string,
  predicate: string,
) {
  const facts = reviewed(catalog, subjectId, predicate);
  return facts.length === 1 && usable(facts[0]) ? facts[0] : undefined;
}
const finding = (
  requirement: string,
  state: Compatibility,
  detail: string,
  facts: Assertion[] = [],
): Finding => ({
  requirement,
  state,
  detail,
  assertionIds: facts.map((a) => a.id),
});

export function moduleHardwareCompatibility(
  product: Product,
  module: HardwareModule,
  catalog: Catalog,
): Finding {
  const facts = reviewed(catalog, module.id, 'moduleSupport').filter(
    (a) =>
      a.value &&
      (a.value as { scope?: string }).scope === 'hardware' &&
      a.applicability.pidIds.includes(product.id),
  );
  if (
    module.reviewStatus !== 'approved' ||
    facts.length !== 1 ||
    !usable(facts[0])
  )
    return finding(
      module.pid,
      'unknown',
      'Exact base/module compatibility is not verified. Module capacity cannot establish a positive match.',
      facts,
    );
  const a = facts[0];
  return finding(
    module.pid,
    a.status,
    a.applicability.configuration ??
      'Documented exact base/module hardware combination.',
    [a],
  );
}

export function moduleRuntimeCompatibility(
  product: Product,
  module: HardwareModule,
  catalog: Catalog,
  requirements: Requirements,
): Finding {
  const facts = reviewed(catalog, module.id, 'moduleSupport').filter(
    (a) =>
      (a.value as { scope?: string }).scope === 'runtime' &&
      a.applicability.pidIds.includes(product.id),
  );
  if (!requirements.managementModeId)
    return finding(
      `${module.pid} deployment`,
      'conditional',
      'Select the management mode. Module-specific firmware and license requirements must be verified.',
      facts,
    );
  const scoped = facts.filter((a) =>
    a.applicability.managementModeIds.includes(requirements.managementModeId),
  );
  const applicable = scoped.filter((a) => {
    const p = a.applicability;
    return (
      (!requirements.firmware ||
        ((!p.firmwareMin ||
          compareVersions(requirements.firmware, p.firmwareMin) !== -1) &&
          (!p.firmwareMax ||
            compareVersions(requirements.firmware, p.firmwareMax) !== 1))) &&
      (!requirements.softwareVersionId ||
        !p.softwareVersionIds.length ||
        p.softwareVersionIds.includes(requirements.softwareVersionId))
    );
  });
  if (applicable.length !== 1 || !usable(applicable[0]))
    return finding(
      `${module.pid} deployment`,
      'unknown',
      'No explicit module support for the requested management mode and release. Planned support is not verified support.',
      scoped,
    );
  const a = applicable[0],
    p = a.applicability;
  if (
    [p.firmwareMin, p.firmwareMax].some(
      (v) =>
        v &&
        requirements.firmware &&
        compareVersions(requirements.firmware, v) === null,
    )
  )
    return finding(
      `${module.pid} deployment`,
      'unknown',
      'Firmware format requires manual review. ' + (p.configuration ?? ''),
      [a],
    );
  const missingContext =
    ((!!p.firmwareMin || !!p.firmwareMax) && !requirements.firmware) ||
    p.licenseIds.some((id) => !requirements.licenseIds.includes(id)) ||
    (!!p.licenseAnyOfIds?.length &&
      !p.licenseAnyOfIds.some((id) => requirements.licenseIds.includes(id))) ||
    (!!p.softwareVersionIds.length && !requirements.softwareVersionId);
  if (a.status === 'unsupported' && missingContext)
    return finding(
      `${module.pid} deployment`,
      'unknown',
      'A documented restriction exists, but its release/license context is not fully selected. ' +
        (p.configuration ?? ''),
      [a],
    );
  return finding(
    `${module.pid} deployment`,
    a.status === 'supported' && (missingContext || p.configuration)
      ? 'conditional'
      : a.status,
    p.configuration ??
      'Reviewed module firmware, license and management context.',
    [a],
  );
}

export function expansionCapacity(product: Product, catalog: Catalog) {
  const a = componentFact(catalog, product.id, 'expansionCapacity');
  return a
    ? {
        assertion: a,
        ...(a.value as {
          maximumModules: number | null;
          slotIds: string[];
          summary: string;
        }),
      }
    : null;
}
export function canAddModule(
  product: Product,
  module: HardwareModule,
  catalog: Catalog,
  selection: HardwareSelection,
): Finding {
  const fit = moduleHardwareCompatibility(product, module, catalog);
  if (fit.state !== 'supported') return fit;
  const capacity = expansionCapacity(product, catalog);
  if (!capacity)
    return finding(
      'Module slots',
      'unknown',
      'No verified expansion position for this exact base PID.',
    );
  if (
    selection.moduleIds.length >=
    (capacity.maximumModules ?? capacity.slotIds.length)
  )
    return finding(
      'Module slots',
      capacity.maximumModules === null ? 'unknown' : 'unsupported',
      `All ${capacity.slotIds.length} documented expansion positions are occupied. Remove a module before adding another. Additional chaining is not verified.`,
      [capacity.assertion],
    );
  const fact = catalog.assertions.find((a) => a.id === fit.assertionIds[0]);
  const limit = (fact?.value as { maxQuantity?: number })?.maxQuantity;
  if (
    limit &&
    selection.moduleIds.filter((id) => id === module.id).length >= limit
  )
    return finding(
      module.pid,
      'unsupported',
      `Maximum documented quantity for this module: ${limit}.`,
      fact ? [fact] : [],
    );
  return fit;
}

export interface PortTotals {
  physicalPorts: number;
  copperPorts: number;
  fixedFiberPorts: number;
  sfpSlots: number;
  sfpPlusSlots: number;
  comboPorts: number;
  uplinks: number;
  portsAtSpeed: number;
  maxSpeedMbps: number;
  poePorts: number;
  poeStandards: string[];
}
// Reuse the physical-interface rule on copies. Stored expansion groups remain expansion-origin.
export function totalPorts(
  groups: PortGroup[],
  minimumSpeedMbps: number,
): PortTotals {
  const count = (selected: PortGroup[], speed = 0) =>
    countBuiltInPorts(
      selected.map((g) => ({ ...g, origin: 'built-in' })),
      speed,
    );
  return {
    physicalPorts: count(groups),
    copperPorts: count(groups.filter((g) => g.medium === 'copper')),
    fixedFiberPorts: count(groups.filter((g) => g.medium === 'fiber')),
    sfpSlots: count(groups.filter((g) => g.medium === 'sfp')),
    sfpPlusSlots: count(groups.filter((g) => g.medium === 'sfp-plus')),
    comboPorts: count(groups.filter((g) => g.medium === 'combo')),
    uplinks: count(groups.filter((g) => g.role === 'uplink')),
    portsAtSpeed: count(groups, minimumSpeedMbps),
    maxSpeedMbps: Math.max(0, ...groups.flatMap((g) => g.speedsMbps)),
    poePorts: count(groups.filter((g) => g.poeStandards.length > 0)),
    poeStandards: [...new Set(groups.flatMap((g) => g.poeStandards))],
  };
}
function configurationState(findings: Finding[]): Compatibility {
  return findings.some((f) => f.state === 'unsupported')
    ? 'unsupported'
    : findings.some((f) => f.state === 'unknown')
      ? 'unknown'
      : findings.some((f) => f.state === 'conditional')
        ? 'conditional'
        : 'supported';
}
export function buildConfiguration(
  product: Product,
  catalog: Catalog,
  requirements: Requirements,
) {
  const selection = selectionFor(product, requirements);
  const baseFact = resolveFact(
    product,
    catalog.assertions,
    'portInventory',
    requirements,
  );
  const base =
    baseFact.state === 'supported' && Array.isArray(baseFact.value)
      ? baseFact.value
      : null;
  const findings: Finding[] = [];
  const capacity = expansionCapacity(product, catalog);
  const proposedGroups: PortGroup[] = [],
    countedGroups: PortGroup[] = [];
  const components = selection.moduleIds.map((id, index) => {
    const module = catalog.modules.find((m) => m.id === id);
    if (!module) {
      findings.push(
        finding(
          'Selected module',
          'unknown',
          `Unknown saved module ID: ${id}. It contributes no verified capacity.`,
        ),
      );
      return {
        id,
        module,
        hardware: finding(id, 'unknown', 'Module identity is not verified.'),
        runtime: finding(id, 'unknown', 'Deployment is not verified.'),
        inventory: null,
      };
    }
    const hardware = moduleHardwareCompatibility(product, module, catalog);
    const runtime = moduleRuntimeCompatibility(
      product,
      module,
      catalog,
      requirements,
    );
    const inventory = moduleInventory(module, catalog);
    findings.push(hardware, runtime);
    if (!inventory)
      findings.push(
        finding(
          `${module.pid} ports`,
          'unknown',
          'No unflagged reviewed module port inventory.',
        ),
      );
    if (hardware.state === 'supported' && inventory) {
      const groups = inventory.map((g) => ({
        ...g,
        comboGroup: g.comboGroup ? `${index}:${g.comboGroup}` : null,
      }));
      proposedGroups.push(...groups);
      if (runtime.state === 'supported' || runtime.state === 'conditional')
        countedGroups.push(...groups);
    }
    const pair = catalog.assertions.find(
      (a) => a.id === hardware.assertionIds[0],
    );
    const limit = (pair?.value as { maxQuantity?: number })?.maxQuantity;
    if (limit && selection.moduleIds.filter((m) => m === id).length > limit)
      findings.push(
        finding(
          `${module.pid} quantity`,
          'unsupported',
          `Quantity exceeds the documented maximum of ${limit}.`,
          pair ? [pair] : [],
        ),
      );
    for (const restriction of reviewed(
      catalog,
      module.id,
      'moduleRestrictions',
    ).filter(
      (a) =>
        !a.applicability.pidIds.length ||
        a.applicability.pidIds.includes(product.id),
    )) {
      if (!usable(restriction)) {
        findings.push(
          finding(
            `${module.pid} restrictions`,
            'unknown',
            'Module restriction needs review.',
            [restriction],
          ),
        );
        continue;
      }
      const value = restriction.value as {
        blockedProtocols: string[];
        blockedSecurityFeatures: string[];
        summary: string;
      };
      findings.push(
        finding(
          `${module.pid} feature restrictions`,
          value.blockedProtocols.some((p) =>
            requirements.protocolIds.includes(p),
          )
            ? 'unsupported'
            : 'conditional',
          value.summary,
          [restriction],
        ),
      );
    }
    return { id, module, hardware, runtime, inventory };
  });
  const basePower = componentFact(catalog, product.id, 'configurationPower');
  const power = basePower?.value as ConfigurationPower | undefined;
  const baseTotals = base
    ? totalPorts(base, requirements.requiredPortSpeedMbps)
    : null;
  if (
    baseTotals &&
    power?.basePoePorts !== null &&
    power?.basePoePorts !== undefined
  )
    baseTotals.poePorts = power.basePoePorts;
  const expansionTotals = totalPorts(
    proposedGroups,
    requirements.requiredPortSpeedMbps,
  );
  const proposedTotals = base
    ? totalPorts(
        [...base, ...proposedGroups],
        requirements.requiredPortSpeedMbps,
      )
    : null;
  const usableTotals = base
    ? totalPorts(
        [...base, ...countedGroups],
        requirements.requiredPortSpeedMbps,
      )
    : null;
  for (const totals of [proposedTotals, usableTotals])
    if (
      totals &&
      power?.basePoePorts !== null &&
      power?.basePoePorts !== undefined
    )
      totals.poePorts =
        power.basePoePorts +
        totalPorts(
          totals === proposedTotals ? proposedGroups : countedGroups,
          0,
        ).poePorts;
  let poeBudgetWatts: number | null = null;
  const baseBudget = resolveFact(
    product,
    catalog.assertions,
    'poeBudgetWatts',
    requirements,
  );
  if (
    proposedGroups.some((g) => g.poeStandards.length) &&
    power?.systemPoeBudgetWatts !== null &&
    power?.systemPoeBudgetWatts !== undefined
  )
    poeBudgetWatts = power.systemPoeBudgetWatts;
  else if (typeof baseBudget.value === 'number')
    poeBudgetWatts = baseBudget.value;
  let equipmentWatts: number | null = power?.consumptionWatts ?? null;
  const powerFacts = basePower ? [basePower] : [];
  for (const component of components) {
    const a = component.module
      ? componentFact(catalog, component.module.id, 'configurationPower')
      : undefined;
    const watts = (a?.value as ConfigurationPower | undefined)
      ?.consumptionWatts;
    if (equipmentWatts === null || watts === null || watts === undefined)
      equipmentWatts = null;
    else equipmentWatts += watts;
    if (a) powerFacts.push(a);
  }
  if (
    poeBudgetWatts !== null &&
    power?.basePoePorts !== null &&
    power?.basePoePorts !== undefined &&
    power.maxPoePerPortWatts !== null
  ) {
    let portCeiling: number | null =
      power.basePoePorts * power.maxPoePerPortWatts;
    for (const component of components) {
      const a = component.module
        ? componentFact(catalog, component.module.id, 'configurationPower')
        : undefined;
      const perPort = (a?.value as ConfigurationPower | undefined)
        ?.maxPoePerPortWatts;
      if (!component.inventory || perPort === undefined || perPort === null) {
        portCeiling = null;
        break;
      }
      portCeiling += totalPorts(component.inventory, 0).poePorts * perPort;
    }
    if (portCeiling !== null)
      poeBudgetWatts = Math.min(poeBudgetWatts, portCeiling);
  }
  if (selection.moduleIds.length) {
    if (!base)
      findings.push(finding('Base port inventory', 'unknown', baseFact.detail));
    findings.push(
      capacity
        ? finding(
            'Module slots',
            selection.moduleIds.length >
              (capacity.maximumModules ?? capacity.slotIds.length)
              ? capacity.maximumModules === null
                ? 'unknown'
                : 'unsupported'
              : capacity.assertion.status,
            `${selection.moduleIds.length}/${capacity.slotIds.length} documented expansion positions used. ${capacity.summary}`,
            [capacity.assertion],
          )
        : finding(
            'Module slots',
            'unknown',
            'Exact chassis capacity is not verified.',
          ),
    );
    if (!selection.installationConfirmed || selection.supplyWatts === null)
      findings.push(
        finding(
          'Power and installation design',
          'conditional',
          'Enter the usable supply wattage and verify input voltage, supply derating, equipment consumption plus PoE load, grounding, clearances and powered-off module attachment against the cited guides.',
          powerFacts,
        ),
      );
    if (
      selection.supplyWatts !== null &&
      equipmentWatts !== null &&
      selection.supplyWatts < equipmentWatts + requirements.poeWatts
    )
      findings.push(
        finding(
          'Supply capacity',
          'unsupported',
          `Entered supply ${selection.supplyWatts} W is below the documented equipment draw (${equipmentWatts} W, excluding PoE) plus requested PoE (${requirements.poeWatts} W).`,
          powerFacts,
        ),
      );
    else if (equipmentWatts === null)
      findings.push(
        finding(
          'Equipment power',
          'unknown',
          'Complete base/module consumption is not verified.',
          powerFacts,
        ),
      );
    if (requirements.poeWatts)
      findings.push(
        finding(
          'Configured PoE budget',
          poeBudgetWatts === null
            ? 'unknown'
            : requirements.poeWatts > poeBudgetWatts
              ? 'unsupported'
              : selection.installationConfirmed &&
                  selection.supplyWatts !== null
                ? 'supported'
                : 'conditional',
          poeBudgetWatts === null
            ? 'No verified complete-system PoE ceiling.'
            : `Requested ${requirements.poeWatts} W; documented system ceiling ${poeBudgetWatts} W. This is shared across base and module, not an additive module budget. Actual available power depends on the supply and installation.`,
          [
            ...powerFacts,
            ...catalog.assertions.filter((a) =>
              baseBudget.assertionIds.includes(a.id),
            ),
          ],
        ),
      );
    if (requirements.cyberVision || requirements.sea)
      findings.push(
        finding(
          'Security on the expanded configuration',
          'unknown',
          'Base-switch CV/SEA/SRA support does not verify coexistence with the selected expansion modules, release and management mode. No exact combined deployment evidence is recorded.',
        ),
      );
  }
  return {
    selection,
    components,
    findings,
    state: configurationState(findings),
    capacity,
    baseTotals,
    expansionTotals,
    proposedTotals,
    usableTotals,
    equipmentWatts,
    poeBudgetWatts,
    powerAssertionIds: powerFacts.map((a) => a.id),
  };
}

export function evaluateConfiguredProduct(
  product: Product,
  catalog: Catalog,
  requirements: Requirements,
): MatchResult {
  if (!selectionFor(product, requirements).moduleIds.length)
    return evaluateProduct(product, catalog.assertions, requirements);
  const hardware = buildConfiguration(product, catalog, requirements);
  const base = evaluateProduct(product, catalog.assertions, {
    ...requirements,
    physicalPorts: 0,
    copperPorts: 0,
    fiberPorts: 0,
    sfpSlots: 0,
    uplinks: 0,
    portsAtSpeed: 0,
    minSpeedMbps: 0,
    poeWatts: 0,
    poeStandard: '',
  });
  const findings = [...base.findings, ...hardware.findings];
  const uncertainCapacity = hardware.components.some(
    (c) =>
      c.hardware.state !== 'supported' ||
      !c.inventory ||
      c.runtime.state === 'unknown',
  );
  const metrics: [keyof PortTotals, number, string][] = [
    [
      'physicalPorts',
      requirements.physicalPorts,
      'Configured physical Ethernet ports',
    ],
    [
      'copperPorts',
      requirements.copperPorts,
      'Configured dedicated copper ports',
    ],
    [
      'fixedFiberPorts',
      requirements.fiberPorts,
      'Configured fixed fiber ports',
    ],
    ['sfpSlots', requirements.sfpSlots, 'Configured SFP / SFP+ slots'],
    ['uplinks', requirements.uplinks, 'Configured dedicated uplinks'],
    [
      'portsAtSpeed',
      requirements.portsAtSpeed,
      `Configured ports at ${requirements.requiredPortSpeedMbps} Mbps or faster`,
    ],
    ['maxSpeedMbps', requirements.minSpeedMbps, 'Configured fastest port Mbps'],
  ];
  for (const [key, target, label] of metrics)
    if (target) {
      const totals = hardware.usableTotals;
      const count = totals
        ? key === 'sfpSlots'
          ? totals.sfpSlots + totals.sfpPlusSlots
          : Number(totals[key])
        : null;
      findings.push(
        finding(
          label,
          count === null || uncertainCapacity
            ? 'unknown'
            : count >= target
              ? 'supported'
              : 'unsupported',
          `${count ?? 'Unknown'} verified-countable ports/capacity; requested ${target}. Planned or unverified runtime support contributes no positive match.`,
          [
            ...catalog.assertions.filter(
              (a) =>
                a.subjectId === product.id && a.predicate === 'portInventory',
            ),
            ...hardware.components.flatMap((c) =>
              c.module
                ? catalog.assertions.filter(
                    (a) => a.id === c.module!.portInventoryAssertionId,
                  )
                : [],
            ),
          ],
        ),
      );
    }
  if (requirements.poeStandard) {
    const moduleSupports = hardware.components.some(
      (c) =>
        c.hardware.state === 'supported' &&
        c.runtime.state !== 'unknown' &&
        c.runtime.state !== 'unsupported' &&
        c.inventory?.some((g) =>
          g.poeStandards.includes(requirements.poeStandard),
        ),
    );
    const fact = resolveFact(
      product,
      catalog.assertions,
      'poeStandards',
      requirements,
    );
    const baseSupports = (
      fact.value as { items?: string[] } | undefined
    )?.items?.includes(requirements.poeStandard);
    findings.push(
      finding(
        'Configured PoE standard',
        moduleSupports ? 'supported' : baseSupports ? fact.state : 'unknown',
        moduleSupports || baseSupports
          ? `${requirements.poeStandard} is documented on selected hardware; system power limits still apply. ${baseSupports ? fact.detail : ''}`
          : 'The requested PoE standard is not verified for this configuration.',
      ),
    );
  }
  const state = configurationState(findings);
  return {
    ...base,
    findings,
    decision:
      state === 'supported'
        ? 'match'
        : state === 'unsupported'
          ? 'excluded'
          : state === 'conditional'
            ? 'conditional'
            : 'unverified',
    score: findings.length
      ? Math.round(
          (100 * findings.filter((f) => f.state === 'supported').length) /
            findings.length,
        )
      : null,
  };
}
export function rankConfiguredProducts(
  products: Product[],
  catalog: Catalog,
  requirements: Requirements,
) {
  return products
    .map((p) => evaluateConfiguredProduct(p, catalog, requirements))
    .sort(compareMatchResults);
}
