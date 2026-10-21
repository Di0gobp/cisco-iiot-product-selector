import { catalog } from '../lib/catalog';
import { compatibilityLabels } from '../lib/compatibility';
import {
  buildConfiguration,
  canAddModule,
  componentFact,
  evaluateConfiguredProduct,
  moduleHardwareCompatibility,
  moduleInventory,
  moduleRuntimeCompatibility,
  selectionFor,
} from '../lib/configurations';
import {
  configurationBomCsv,
  configurationJson,
  downloadText,
} from '../lib/export';
import { selectedModulePid } from '../lib/saved-configurations';
import type {
  ComponentDimensions,
  ConfigurationPower,
  HardwareSelection,
  Product,
  Requirements,
} from '../lib/types';
import { AssertionEvidence, Badge, SourceLink } from './Evidence';

function dimensionsText(dimensions: ComponentDimensions) {
  return `${dimensions.heightMm} H × ${dimensions.widthMm} W × ${dimensions.depthMm} D mm${dimensions.weightKg === null ? '' : ` · ${dimensions.weightKg} kg`}`;
}
export function ConfigurationSummary({
  product,
  requirements,
}: {
  product: Product;
  requirements: Requirements;
}) {
  const config = buildConfiguration(product, catalog, requirements);
  const evaluation = evaluateConfiguredProduct(product, catalog, requirements);
  const state =
    evaluation.decision === 'match'
      ? 'supported'
      : evaluation.decision === 'excluded'
        ? 'unsupported'
        : evaluation.decision === 'conditional'
          ? 'conditional'
          : 'unknown';
  if (!config.selection.moduleIds.length)
    return (
      <p className="small muted">Base switch only · no expansion installed</p>
    );
  return (
    <div className="configuration-summary">
      <Badge state={state}>{compatibilityLabels[state]}</Badge>
      <p>
        {config.selection.moduleIds
          .map((id) => selectedModulePid(catalog, id))
          .join(' + ')}
      </p>
      <p>
        {config.proposedTotals?.physicalPorts ?? 'Unknown'} proposed physical
        ports · {config.usableTotals?.physicalPorts ?? 'Unknown'} countable in
        requested mode
      </p>
      <p className="small">
        {config.selection.moduleIds.length}/
        {config.capacity?.slotIds.length ?? '?'} documented positions · PoE
        ceiling {config.poeBudgetWatts ?? 'unknown'} W
      </p>
      {evaluation.findings
        .filter((f) => f.state !== 'supported')
        .map((f, i) => (
          <p className="small" key={i}>
            {f.detail}
          </p>
        ))}
    </div>
  );
}
export function ExpansionModules({
  product,
  requirements,
  onChange,
}: {
  product: Product;
  requirements: Requirements;
  onChange: (value: Requirements) => void;
}) {
  const available = catalog.modules.filter(
    (m) =>
      m.reviewStatus === 'approved' && m.familyIds.includes(product.familyId),
  );
  if (!available.length && product.familyId !== 'ie9300') return null;
  const config = buildConfiguration(product, catalog, requirements);
  const result = evaluateConfiguredProduct(product, catalog, requirements);
  const selection = selectionFor(product, requirements);
  const setSelection = (next: HardwareSelection) =>
    onChange({
      ...requirements,
      configurations: { ...requirements.configurations, [product.id]: next },
    });
  const numeric = (
    key:
      'physicalPorts' | 'portsAtSpeed' | 'requiredPortSpeedMbps' | 'poeWatts',
    value: string,
  ) => onChange({ ...requirements, [key]: Math.max(0, Number(value) || 0) });
  const baseDimensions = componentFact(
    catalog,
    product.id,
    'physicalDimensions',
  );
  const rows = [
    ['Physical Ethernet ports', 'physicalPorts'],
    ['Dedicated copper', 'copperPorts'],
    ['Fixed fiber', 'fixedFiberPorts'],
    ['SFP cages', 'sfpSlots'],
    ['SFP+ cages', 'sfpPlusSlots'],
    ['Combo interfaces (shared media)', 'comboPorts'],
    [`Ports at ≥${requirements.requiredPortSpeedMbps} Mbps`, 'portsAtSpeed'],
    ['PoE-capable ports', 'poePorts'],
  ] as const;
  const state =
    result.decision === 'match'
      ? 'supported'
      : result.decision === 'excluded'
        ? 'unsupported'
        : result.decision === 'conditional'
          ? 'conditional'
          : 'unknown';
  return (
    <section
      className="panel expansion-panel"
      aria-labelledby="expansion-title"
    >
      <div className="section-heading">
        <div>
          <div className="eyebrow">CONFIGURE HARDWARE</div>
          <h2 id="expansion-title">Expansion Modules</h2>
        </div>
        <span className="outline-tag">Base + selected components</span>
      </div>
      {!available.length ? (
        <>
          <p>
            No official port-expansion module has been verified for the retained
            IE9300 PIDs. SFP transceivers, stacking links and redundant power
            supplies do not automatically add chassis Ethernet ports.
          </p>
          <SourceLink id="cisco-ie9300-ds" />
        </>
      ) : (
        <>
          <p>
            Select exact module PIDs below. Base ports stay separate from
            expansion ports. Additional SFP cages require suitable transceivers,
            and the full firmware, management, power and security combination
            must be checked.
          </p>
          <details className="configuration-context" open>
            <summary>Configuration requirements & deployment context</summary>
            <div className="technical-filter-grid">
              <label>
                Required physical ports
                <input
                  type="number"
                  min="0"
                  value={requirements.physicalPorts || ''}
                  onChange={(e) => numeric('physicalPorts', e.target.value)}
                />
              </label>
              <label>
                Minimum port speed (Mbps)
                <input
                  type="number"
                  min="1"
                  value={requirements.requiredPortSpeedMbps}
                  onChange={(e) =>
                    numeric('requiredPortSpeedMbps', e.target.value)
                  }
                />
              </label>
              <label>
                Ports required at this speed
                <input
                  type="number"
                  min="0"
                  value={requirements.portsAtSpeed || ''}
                  onChange={(e) => numeric('portsAtSpeed', e.target.value)}
                />
              </label>
              <label>
                Required PoE load (W)
                <input
                  type="number"
                  min="0"
                  value={requirements.poeWatts || ''}
                  onChange={(e) => numeric('poeWatts', e.target.value)}
                />
              </label>
              <label>
                Configuration firmware
                <input
                  value={requirements.firmware}
                  placeholder="e.g. 17.18.3"
                  onChange={(e) =>
                    onChange({ ...requirements, firmware: e.target.value })
                  }
                />
              </label>
              <label>
                Configuration management mode
                <select
                  value={requirements.managementModeId}
                  onChange={(e) =>
                    onChange({
                      ...requirements,
                      managementModeId: e.target.value,
                    })
                  }
                >
                  <option value="">Not selected</option>
                  {catalog.managementModes.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Usable power supply capacity (W)
                <input
                  type="number"
                  min="0"
                  value={selection.supplyWatts ?? ''}
                  onChange={(e) =>
                    setSelection({
                      ...selection,
                      supplyWatts:
                        e.target.value === ''
                          ? null
                          : Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
              </label>
              <label>
                Confirmed base/runtime licenses
                <select
                  multiple
                  value={requirements.licenseIds}
                  onChange={(e) =>
                    onChange({
                      ...requirements,
                      licenseIds: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value,
                      ),
                    })
                  }
                >
                  {catalog.licenses
                    .filter((l) =>
                      [
                        'network-essentials',
                        'network-advantage',
                        'meraki-enterprise',
                        'meraki-advantage',
                      ].includes(l.id),
                    )
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.offer}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="configuration-checks">
              <label>
                <input
                  type="checkbox"
                  checked={requirements.cyberVision}
                  onChange={(e) =>
                    onChange({ ...requirements, cyberVision: e.target.checked })
                  }
                />
                Require Cyber Vision on complete configuration
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={requirements.sea}
                  onChange={(e) =>
                    onChange({ ...requirements, sea: e.target.checked })
                  }
                />
                Require SEA/SRA on complete configuration
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selection.installationConfirmed}
                  onChange={(e) =>
                    setSelection({
                      ...selection,
                      installationConfirmed: e.target.checked,
                    })
                  }
                />
                Power and installation conditions checked against Cisco guides
              </label>
            </div>
          </details>
          <div
            className="configuration-result"
            aria-live="polite"
            aria-atomic="true"
          >
            <h3>Configured hardware totals</h3>
            {selection.moduleIds.length ? (
              <Badge state={state}>{compatibilityLabels[state]}</Badge>
            ) : (
              <span className="small muted">
                Base switch only · choose a module to build a configuration
              </span>
            )}
            <p className="small">
              {selection.moduleIds.length}/
              {config.capacity?.slotIds.length ?? '?'} documented positions
              used. Vendor maximum:{' '}
              {config.capacity?.maximumModules ?? 'not yet verified'}.
              Additional chaining is not assumed.
            </p>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Configured port totals"
            >
              <table className="configuration-totals">
                <thead>
                  <tr>
                    <th>Capacity</th>
                    <th>Base</th>
                    <th>Expansion</th>
                    <th>Proposed total</th>
                    <th>Counted in requested mode</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, key]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      <td>{config.baseTotals?.[key] ?? 'Unknown'}</td>
                      <td>{config.expansionTotals[key]}</td>
                      <td>{config.proposedTotals?.[key] ?? 'Unknown'}</td>
                      <td>{config.usableTotals?.[key] ?? 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Equipment consumption: {config.equipmentWatts ?? 'Unknown'} W
              excluding PoE · shared PoE ceiling:{' '}
              {config.poeBudgetWatts ?? 'Unknown'} W.
            </p>
            <p className="small muted">
              Proposed physical capacity does not establish deployable support.
              Modules with unsupported or unverified runtime support contribute
              no positive match in the requested mode. A system PoE ceiling is
              shared and depends on the actual supply.
            </p>
          </div>
          <div className="selected-modules">
            <h3>Selected BOM</h3>
            <p>
              <strong>Base switch:</strong> {product.pid} × 1
            </p>
            {!selection.moduleIds.length && (
              <p>No expansion module selected.</p>
            )}
            {selection.moduleIds.map((id, index) => (
              <div className="selected-module" key={`${id}-${index}`}>
                <strong>{selectedModulePid(catalog, id)}</strong>
                <button
                  type="button"
                  className="button secondary"
                  aria-label={`Remove ${selectedModulePid(catalog, id)}`}
                  onClick={() =>
                    setSelection({
                      ...selection,
                      moduleIds: selection.moduleIds.filter(
                        (_, i) => i !== index,
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="configuration-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                downloadText(
                  configurationBomCsv(product, catalog, requirements),
                  `${product.pid}-bom.csv`,
                  'text/csv;charset=utf-8',
                )
              }
            >
              Export BOM CSV
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() =>
                downloadText(
                  configurationJson(product, catalog, requirements),
                  `${product.pid}-configuration.json`,
                  'application/json',
                )
              }
            >
              Download configuration JSON
            </button>
          </div>
          <p className="small muted">
            Changes are saved in this browser when storage is available.
            Downloads include the exact base and every selected module PID, plus
            the current constraints. Compatibility is evaluated again against
            the current catalog.
          </p>
          {selection.moduleIds.length > 0 && (
            <details open>
              <summary>Why this configuration result?</summary>
              {result.findings.map((f, index) => (
                <div className="finding" key={index}>
                  <strong>{f.requirement}</strong>
                  <Badge state={f.state}>{compatibilityLabels[f.state]}</Badge>
                  <p>{f.detail}</p>
                  <AssertionEvidence
                    ids={f.assertionIds}
                    assertions={catalog.assertions}
                  />
                </div>
              ))}
            </details>
          )}
          <div className="module-grid">
            {available.map((module) => {
              const hardware = moduleHardwareCompatibility(
                product,
                module,
                catalog,
              );
              const runtime = moduleRuntimeCompatibility(
                product,
                module,
                catalog,
                requirements,
              );
              const admission = canAddModule(
                product,
                module,
                catalog,
                selection,
              );
              const inventory = moduleInventory(module, catalog);
              const dims = componentFact(
                catalog,
                module.id,
                'physicalDimensions',
              );
              const power = componentFact(
                catalog,
                module.id,
                'configurationPower',
              );
              const identity = catalog.assertions.find(
                (a) => a.id === module.identityAssertionId,
              );
              const selected = selection.moduleIds.includes(module.id);
              return (
                <article className="module-card" key={module.id}>
                  <div className="eyebrow">ETHERNET EXPANSION</div>
                  <h3>{module.pid}</h3>
                  <p>{module.name}</p>
                  <p>
                    <Badge state={hardware.state}>
                      {compatibilityLabels[hardware.state]}
                    </Badge>
                    <span className="small">
                      {' '}
                      Hardware fit for {product.pid}
                    </span>
                  </p>
                  <p>
                    <Badge state={runtime.state}>
                      {compatibilityLabels[runtime.state]}
                    </Badge>
                    <span className="small"> Requested deployment mode</span>
                  </p>
                  <ul className="module-specs">
                    {inventory?.map((g, i) => (
                      <li key={i}>
                        {g.count} × {g.connector ?? g.medium} ·{' '}
                        {g.speedsMbps.join('/')} Mbps
                        {g.poeStandards.length
                          ? ` · ${g.poeStandards.join('/')}`
                          : ''}
                      </li>
                    ))}
                  </ul>
                  <p className="small">
                    {(power?.value as ConfigurationPower | undefined)
                      ?.consumptionWatts ?? 'Unknown'}{' '}
                    W excluding PoE.
                  </p>
                  {dims && (
                    <p className="small">
                      Component:{' '}
                      {dimensionsText(
                        dims.value as unknown as ComponentDimensions,
                      )}
                    </p>
                  )}
                  <p className="small">
                    {selected ? 'Selected in the BOM.' : admission.detail}
                  </p>
                  <button
                    type="button"
                    className="button secondary"
                    disabled={admission.state !== 'supported' || selected}
                    aria-label={`Add ${module.pid}`}
                    onClick={() => {
                      if (
                        canAddModule(product, module, catalog, selection)
                          .state === 'supported'
                      )
                        setSelection({
                          ...selection,
                          moduleIds: [...selection.moduleIds, module.id],
                        });
                    }}
                  >
                    {selected ? 'Selected' : 'Add module'}
                  </button>
                  {identity && <SourceLink id={identity.sourceId} />}
                  <details>
                    <summary>Sources, restrictions & review</summary>
                    <p>{hardware.detail}</p>
                    <p>{runtime.detail}</p>
                    <AssertionEvidence
                      ids={[
                        ...new Set([
                          ...module.assertionIds,
                          ...hardware.assertionIds,
                          ...runtime.assertionIds,
                        ]),
                      ]}
                      assertions={catalog.assertions}
                    />
                  </details>
                </article>
              );
            })}
          </div>
          <details>
            <summary>Chassis, installation & mechanical evidence</summary>
            {baseDimensions && (
              <p>
                Base chassis only:{' '}
                {dimensionsText(
                  baseDimensions.value as unknown as ComponentDimensions,
                )}
              </p>
            )}
            <p>
              Final assembled dimensions and clearances are not verified.
              Component widths are not automatically added to produce an
              assembled envelope.
            </p>
            <AssertionEvidence
              ids={[
                ...(config.capacity ? [config.capacity.assertion.id] : []),
                ...(baseDimensions ? [baseDimensions.id] : []),
                ...config.powerAssertionIds,
              ]}
              assertions={catalog.assertions}
            />
          </details>
        </>
      )}
    </section>
  );
}
