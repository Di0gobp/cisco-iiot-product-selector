import raw from '../../data/products/catalog.json';
import sourceData from '../../data/sources/sources.json';
import type { Catalog, Source } from './types';
export const catalog = raw as Catalog;
export const sources = sourceData as Source[];
export const sourceById = Object.fromEntries(sources.map((s) => [s.id, s]));
export const familyName = (id: string) =>
  catalog.families.find((f) => f.id === id)?.name ?? id;
export const defaultRequirements = {
  copperPorts: 0,
  fiberPorts: 0,
  sfpSlots: 0,
  uplinks: 0,
  poeWatts: 0,
  minSpeedMbps: 0,
  dinRail: false,
  cyberVision: false,
  newDeployment: true,
  firmware: '',
  licenseIds: [],
  managementModeId: '',
  preferredFamilyId: '',
};
export const specRows = [
  ['builtInCopperPorts', 'Built-in dedicated copper ports'],
  ['builtInFiberPorts', 'Built-in fixed fiber ports'],
  ['builtInSfpSlots', 'Built-in SFP / SFP+ slots'],
  ['uplinkPorts', 'Built-in uplinks'],
  ['poeBudgetWatts', 'PoE budget (W)'],
  ['maxPortSpeedMbps', 'Fastest port (Mbps)'],
  ['dinRail', 'DIN rail mounting'],
  ['cyberVision', 'Cyber Vision'],
  ['sea', 'Secure Equipment Access'],
  ['management', 'Management mode'],
  ['lifecycle', 'Lifecycle'],
] as const;
