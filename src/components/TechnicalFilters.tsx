import type { Requirements } from '../lib/types';
import { catalog } from '../lib/catalog';
export function TechnicalFilters({
  value,
  onChange,
}: {
  value: Requirements;
  onChange: (r: Requirements) => void;
}) {
  const number = (
    key:
      | 'physicalPorts'
      | 'portsAtSpeed'
      | 'requiredPortSpeedMbps'
      | 'endpointCount',
    label: string,
  ) => (
    <label className="field">
      {label}
      <input
        type="number"
        min={0}
        max={100000}
        step={1}
        value={value[key] || ''}
        placeholder="Any"
        onChange={(e) =>
          onChange({ ...value, [key]: Math.max(0, Number(e.target.value)) })
        }
      />
    </label>
  );
  const toggle = (key: 'sea' | 'cellular' | 'wireless', label: string) => (
    <label className="check-field">
      <input
        type="checkbox"
        checked={value[key]}
        onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
      />
      {label}
    </label>
  );
  return (
    <details className="advanced-filters">
      <summary>Technical & licensing requirements</summary>
      <fieldset>
        <legend>Physical interfaces</legend>
        {number('physicalPorts', 'Min. physical Ethernet ports')}
        {number('portsAtSpeed', 'Min. ports at required speed')}
        {number('requiredPortSpeedMbps', 'Required port speed (Mbps)')}
        <p className="hint">
          Combo media count once. SFP slots require suitable transceivers.
          Console ports are excluded. Expansion ports count only when explicitly
          selected and supported in the requested deployment context.
        </p>
        <label className="field">
          Required PoE output standard
          <select
            value={value.poeStandard}
            onChange={(e) =>
              onChange({ ...value, poeStandard: e.target.value })
            }
          >
            <option value="">Any / unselected</option>
            {['802.3af', '802.3at', '802.3bt'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Environment & radios</legend>
        {(['operatingMinC', 'operatingMaxC'] as const).map((key, i) => (
          <label className="field" key={key}>
            {i === 0
              ? 'Lowest required temperature (°C)'
              : 'Highest required temperature (°C)'}
            <input
              type="number"
              min={-100}
              max={150}
              step={1}
              value={value[key] ?? ''}
              placeholder="Any"
              onChange={(e) =>
                onChange({
                  ...value,
                  [key]: e.target.value === '' ? null : Number(e.target.value),
                })
              }
            />
          </label>
        ))}
        {toggle('cellular', 'Cellular connectivity')}
        {toggle('wireless', 'Wi-Fi / industrial wireless')}
        <p className="hint">
          Optional radios stay conditional. Temperature results retain airflow,
          enclosure and module restrictions.
        </p>
      </fieldset>
      <fieldset>
        <legend>Protocols & standards</legend>
        <label className="field">
          Industrial protocol
          <select
            value={value.protocolIds[0] ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                protocolIds: e.target.value ? [e.target.value] : [],
              })
            }
          >
            <option value="">Any / unselected</option>
            {[
              'PTP',
              'PRP',
              'HSR',
              'REP',
              'MRP',
              'PROFINET',
              'EtherNet/IP (CIP)',
            ].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Cited standard / rating
          <select
            value={value.certificationIds[0] ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                certificationIds: e.target.value ? [e.target.value] : [],
              })
            }
          >
            <option value="">Any / unselected</option>
            {[
              'IEC 61850-3',
              'IEEE 1613',
              'IEC 62443-4-1',
              'IEC 62443-4-2',
              'IP67',
            ].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
      </fieldset>
      <fieldset>
        <legend>Security & entitlements</legend>
        {toggle('sea', 'SEA / Cyber Vision SRA support')}
        <label className="field">
          Security deployment architecture
          <select
            value={value.architecture}
            onChange={(e) =>
              onChange({ ...value, architecture: e.target.value })
            }
          >
            <option value="">Unselected / unknown</option>
            <option value="separate-cv-sea-agents">
              Separate CV sensor + SEA agent
            </option>
            <option value="current-sra">
              Current SRA deployment (needs verification)
            </option>
          </select>
        </label>
        <label className="field">
          Cyber Vision release
          <select
            value={value.softwareVersionId}
            onChange={(e) =>
              onChange({ ...value, softwareVersionId: e.target.value })
            }
          >
            <option value="">Unselected / unknown</option>
            {catalog.versions
              .filter((v) => v.softwareId === 'cyber-vision')
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
          </select>
        </label>
        <label className="field">
          Confirmed license
          <select
            value={value.licenseIds[0] ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                licenseIds: e.target.value ? [e.target.value] : [],
              })
            }
          >
            <option value="">Unselected / unknown</option>
            {catalog.licenses.map((l) => (
              <option key={l.id} value={l.id}>
                {l.offer}
              </option>
            ))}
          </select>
        </label>
        {number('endpointCount', 'Required secured endpoints')}
        <label className="field">
          Original order date
          <input
            type="date"
            value={value.orderDate}
            onChange={(e) => onChange({ ...value, orderDate: e.target.value })}
          />
        </label>
        <label className="field">
          Network Advantage upgrade date
          <input
            type="date"
            value={value.upgradeDate}
            onChange={(e) =>
              onChange({ ...value, upgradeDate: e.target.value })
            }
          />
        </label>
        <p className="hint">
          These dates check commercial eligibility only. Activation, remaining
          term and technical compatibility still need review.
        </p>
      </fieldset>
    </details>
  );
}
