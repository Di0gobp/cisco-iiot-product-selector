import type { Catalog, HardwareSelection, Requirements } from './types';

export const configurationStorageKey = 'iiot-hardware-configurations-v1';
export function selectedModulePid(catalog: Catalog, id: string): string {
  return (
    catalog.modules.find((m) => m.id === id)?.pid ??
    id.replace(/^unverified:/, '')
  );
}
export function savedConfigurationPayload(
  catalog: Catalog,
  requirements: Requirements,
) {
  const { configurations, ...context } = requirements;
  return {
    schemaVersion: '1.0.0',
    context,
    configurations: Object.entries(configurations).flatMap(
      ([id, selection]) => {
        const base = catalog.pids.find((p) => p.id === id);
        return base
          ? [
              {
                basePid: base.pid,
                modulePids: selection.moduleIds.map((id) =>
                  selectedModulePid(catalog, id),
                ),
                supplyWatts: selection.supplyWatts,
                installationConfirmed: selection.installationConfirmed,
              },
            ]
          : [];
      },
    ),
  };
}
export function readSavedRequirements(
  text: string | null,
  catalog: Catalog,
  defaults: Requirements,
): Requirements {
  const result = {
    ...defaults,
    configurations: {} as Record<string, HardwareSelection>,
  };
  if (!text) return result;
  try {
    const value = JSON.parse(text);
    if (
      value?.schemaVersion !== '1.0.0' ||
      !Array.isArray(value.configurations)
    )
      return result;
    // Only known requirement keys and primitive values are accepted; saved compatibility states are never trusted.
    const context: Record<string, unknown> = {};
    for (const [key, fallback] of Object.entries(defaults)) {
      if (key === 'configurations') continue;
      const candidate = value.context?.[key];
      if (
        Array.isArray(fallback) &&
        Array.isArray(candidate) &&
        candidate.length <= 64 &&
        candidate.every((item) => typeof item === 'string')
      )
        context[key] = candidate;
      else if (
        typeof fallback === 'number' &&
        typeof candidate === 'number' &&
        Number.isFinite(candidate) &&
        candidate >= 0
      )
        context[key] = candidate;
      else if (
        fallback === null &&
        (candidate === null ||
          (typeof candidate === 'number' && Number.isFinite(candidate)))
      )
        context[key] = candidate;
      else if (
        (typeof fallback === 'boolean' && typeof candidate === 'boolean') ||
        (typeof fallback === 'string' &&
          typeof candidate === 'string' &&
          candidate.length <= 256)
      )
        context[key] = candidate;
    }
    Object.assign(result, context);
    for (const item of value.configurations.slice(0, 100)) {
      const base = catalog.pids.find(
        (p) => p.pid === item?.basePid && p.reviewStatus === 'approved',
      );
      if (
        !base ||
        !Array.isArray(item.modulePids) ||
        item.modulePids.length > 32 ||
        !item.modulePids.every(
          (pid: unknown) => typeof pid === 'string' && pid.length <= 128,
        )
      )
        continue;
      result.configurations[base.id] = {
        moduleIds: item.modulePids.map(
          (pid: string) =>
            catalog.modules.find((m) => m.pid === pid)?.id ??
            `unverified:${pid}`,
        ),
        supplyWatts:
          typeof item.supplyWatts === 'number' &&
          Number.isFinite(item.supplyWatts) &&
          item.supplyWatts >= 0
            ? item.supplyWatts
            : null,
        installationConfirmed: item.installationConfirmed === true,
      };
    }
  } catch {
    /* Invalid or unavailable local storage keeps the base-only defaults. */
  }
  return result;
}
