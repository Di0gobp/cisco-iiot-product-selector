import raw from '../../data/products/catalog.json';
import sourceData from '../../data/sources/sources.json';
import type { Catalog, Source, Requirements } from './types';
export const catalog = raw as Catalog;
export const sources = sourceData as Source[];
export const sourceById = Object.fromEntries(sources.map((s) => [s.id, s]));
export const familyName = (id: string) =>
  catalog.families.find((f) => f.id === id)?.name ?? id;
export const defaultRequirements: Requirements = {
  physicalPorts: 0,
  portsAtSpeed: 0,
  requiredPortSpeedMbps: 1000,
  operatingMinC: null,
  operatingMaxC: null,
  cellular: false,
  wireless: false,
  sea: false,
  poeStandard: '',
  protocolIds: [],
  certificationIds: [],
  softwareVersionId: '',
  architecture: '',
  endpointCount: 0,
  orderDate: '',
  upgradeDate: '',
  asOfDate: new Date().toISOString().slice(0, 10),
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
  ['physicalEthernetPorts', 'Built-in physical Ethernet ports'],
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
  ['cellular', 'Cellular connectivity'],
  ['wireless', 'Wireless connectivity'],
  ['operatingTemperature', 'Operating temperature'],
  ['powerRequirements', 'Power requirements'],
  ['poeStandards', 'PoE standards'],
  ['industrialProtocols', 'Industrial protocols'],
  ['certifications', 'Industrial certifications'],
  ['operatingSystems', 'Operating systems'],
  ['securityFeatures', 'Security capabilities'],
  ['replacement', 'Documented replacement'],
] as const;

export const auditReportUrls = import.meta.glob('../../data/audits/*.json', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;
