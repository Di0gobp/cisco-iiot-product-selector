import { sourceById, specRows } from './catalog';
import { resolveFact, formatFact } from './rules';
import type { Assertion, Catalog, Product, Requirements } from './types';
import {
  buildConfiguration,
  evaluateConfiguredProduct,
  selectionFor,
} from './configurations';
import {
  savedConfigurationPayload,
  selectedModulePid,
} from './saved-configurations';
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
  hardwareCatalog?: Catalog,
): string {
  const rows: unknown[][] = [
    ['PID', 'Feature', 'Value', 'Status', 'Restrictions', 'Official sources'],
  ];
  for (const p of products) {
    if (hardwareCatalog && selectionFor(p, requirements).moduleIds.length) {
      const config = buildConfiguration(p, hardwareCatalog, requirements);
      const complete = completeState(p, hardwareCatalog, requirements);
      rows.push([
        p.pid,
        'Selected module PIDs',
        config.selection.moduleIds
          .map((id) => selectedModulePid(hardwareCatalog, id))
          .join(' + '),
        complete.state,
        'Expansion is separate from the base specifications below. Complete configuration restrictions apply.',
        configurationSources(p, hardwareCatalog),
      ]);
      rows.push([
        p.pid,
        'Configured physical ports (base + selected modules)',
        config.proposedTotals?.physicalPorts ?? 'Unknown',
        complete.state,
        'Proposed physical capacity; planned/unverified runtime support is not a verified deployable solution.',
        configurationSources(p, hardwareCatalog),
      ]);
    }
    for (const [key, label] of specRows) {
      const fact = resolveFact(p, assertions, key, requirements);
      rows.push([
        p.pid,
        label,
        fact.state === 'unknown' ? 'Unknown' : formatFact(fact.value),
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
  }
  return '\ufeff' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}

function configurationSources(product: Product, catalog: Catalog): string {
  const subjects = new Set([
    product.id,
    ...catalog.modules
      .filter((m) => m.familyIds.includes(product.familyId))
      .map((m) => m.id),
  ]);
  return [
    ...new Set(
      catalog.assertions
        .filter((a) => subjects.has(a.subjectId))
        .map((a) => sourceById[a.sourceId]?.url)
        .filter(Boolean),
    ),
  ].join(' | ');
}
function completeState(
  product: Product,
  catalog: Catalog,
  requirements: Requirements,
) {
  const result = evaluateConfiguredProduct(product, catalog, requirements);
  return {
    result,
    state:
      result.decision === 'match'
        ? 'supported'
        : result.decision === 'excluded'
          ? 'unsupported'
          : result.decision === 'conditional'
            ? 'conditional'
            : 'unknown',
  };
}
export function configurationBomCsv(
  product: Product | Product[],
  catalog: Catalog,
  requirements: Requirements,
): string {
  const rows: unknown[][] = [
    [
      'Component',
      'Exact PID',
      'Quantity',
      'Configuration status',
      'Restrictions',
      'Official sources',
    ],
  ];
  for (const base of Array.isArray(product) ? product : [product]) {
    const config = buildConfiguration(base, catalog, requirements);
    const complete = completeState(base, catalog, requirements);
    rows.push([
      'Base switch',
      base.pid,
      1,
      complete.state,
      'Base chassis; installed transceivers and power supplies are not assumed.',
      configurationSources(base, catalog),
    ]);
    for (const id of new Set(config.selection.moduleIds)) {
      const module = catalog.modules.find((m) => m.id === id);
      const item = config.components.find((c) => c.id === id);
      const sourceIds = module
        ? [
            ...module.assertionIds,
            ...(item?.hardware.assertionIds ?? []),
            ...(item?.runtime.assertionIds ?? []),
          ]
        : [];
      const urls = [
        ...new Set(
          sourceIds
            .map(
              (id) =>
                sourceById[
                  catalog.assertions.find((a) => a.id === id)?.sourceId ?? ''
                ]?.url,
            )
            .filter(Boolean),
        ),
      ];
      rows.push([
        'Expansion module',
        selectedModulePid(catalog, id),
        config.selection.moduleIds.filter((selected) => selected === id).length,
        complete.state,
        [
          item?.hardware.detail,
          item?.runtime.detail,
          ...complete.result.findings
            .filter((f) => !f.requirement.includes(module?.pid ?? id))
            .map((f) => f.detail),
        ]
          .filter(Boolean)
          .join(' | '),
        urls.join(' | '),
      ]);
    }
  }
  return '\ufeff' + rows.map((row) => row.map(cell).join(',')).join('\r\n');
}
export function configurationJson(
  product: Product,
  catalog: Catalog,
  requirements: Requirements,
): string {
  const config = buildConfiguration(product, catalog, requirements);
  const complete = completeState(product, catalog, requirements);
  const payload = savedConfigurationPayload(catalog, {
    ...requirements,
    configurations: { [product.id]: config.selection },
  });
  return JSON.stringify(
    {
      ...payload,
      evaluation: {
        state: complete.state,
        proposedPhysicalPorts: config.proposedTotals?.physicalPorts ?? null,
        countablePhysicalPorts: config.usableTotals?.physicalPorts ?? null,
        slotsUsed: config.selection.moduleIds.length,
        documentedPositions: config.capacity?.slotIds ?? [],
        maximumModules: config.capacity?.maximumModules ?? null,
        assembledDimensionsMm: null,
        findings: complete.result.findings,
        officialSources: configurationSources(product, catalog),
      },
    },
    null,
    2,
  );
}
export function downloadText(contents: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
