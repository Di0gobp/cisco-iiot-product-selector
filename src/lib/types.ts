export type Compatibility =
  'supported' | 'unsupported' | 'conditional' | 'unknown';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type Predicate =
  | 'orderability'
  | 'builtInCopperPorts'
  | 'builtInFiberPorts'
  | 'builtInSfpSlots'
  | 'uplinkPorts'
  | 'poeBudgetWatts'
  | 'maxPortSpeedMbps'
  | 'dinRail'
  | 'cyberVision'
  | 'sea'
  | 'management'
  | 'lifecycle'
  | 'portInventory'
  | 'moduleSupport'
  | 'expansionCapacity'
  | 'configurationPower'
  | 'physicalDimensions'
  | 'moduleRestrictions'
  | 'entitlement'
  | 'coexistence'
  | 'physicalEthernetPorts'
  | 'cellular'
  | 'wireless'
  | 'operatingTemperature'
  | 'powerRequirements'
  | 'industrialProtocols'
  | 'certifications'
  | 'operatingSystems'
  | 'securityFeatures'
  | 'poeStandards'
  | 'replacement'
  | 'licensingRule';
export interface Source {
  manufacturerId?: string;
  id: string;
  title: string;
  url: string;
  type:
    | 'official-datasheet'
    | 'official-support'
    | 'official-lifecycle'
    | 'community';
  kind?:
    | 'datasheet'
    | 'ordering-guide'
    | 'configuration-guide'
    | 'installation-guide'
    | 'licensing'
    | 'release-notes'
    | 'compatibility'
    | 'lifecycle'
    | 'support-index';
  status: 'pending' | 'blocked' | 'checked' | 'reviewed';
  documentDate: string | null;
  lastCheckedAt: string | null;
  verifiedAt: string | null;
  lastMaterialChangeAt: string | null;
  contentHash: string | null;
  supersedes: string[];
  note: string;
}
export interface Applicability {
  pidIds: string[];
  firmwareMin: string | null;
  firmwareMax: string | null;
  licenseIds: string[];
  softwareVersionIds: string[];
  managementModeIds: string[];
  architecture: string | null;
  configuration: string | null;
  effectiveFrom: string | null;
  assetLimit: number | null;
  featureIds?: string[];
  licenseAnyOfIds?: string[];
  qualifyingOrderFrom?: string | null;
  qualifyingUpgradeFrom?: string | null;
}
export interface PortGroup {
  connector?: 'rj45' | 'm12-x' | 'm12-d' | 'sfp' | 'sfp-plus';
  role: 'access' | 'uplink' | 'flexible';
  medium: 'copper' | 'fiber' | 'combo' | 'sfp' | 'sfp-plus';
  count: number;
  speedsMbps: number[];
  origin: 'built-in' | 'expansion';
  moduleId: string | null;
  poeStandards: string[];
  comboGroup: string | null;
}
export interface Assertion {
  id: string;
  subjectId: string;
  predicate: Predicate;
  value: string | number | boolean | PortGroup[] | Record<string, unknown>;
  status: Compatibility;
  sourceId: string;
  evidence: { excerpt: string; section: string };
  applicability: Applicability;
  confidence: 'high' | 'medium' | 'low';
  reviewStatus: ReviewStatus;
  reviewer: string | null;
  verifiedAt: string;
  interpretation: 'published' | 'derived' | 'community' | 'editorial';
  supersedes: string[];
  conflictsWith: string[];
  requiresHumanReview: boolean;
}
export interface Product {
  description?: string;
  documentationIds?: string[];
  id: string;
  pid: string;
  modelId: string;
  familyId: string;
  orderabilityAssertionId: string;
  reviewStatus: ReviewStatus;
}
export interface Family {
  id: string;
  manufacturerId: string;
  name: string;
  category: 'router' | 'switch' | 'wireless';
}
export interface Candidate {
  id: string;
  label: string;
  familyId: string;
  sourceId: string;
  kind: 'pid' | 'family';
  note: string;
}
export interface Catalog {
  schemaVersion: string;
  manufacturers: { id: string; name: string; officialDomains?: string[] }[];
  families: Family[];
  models: { id: string; familyId: string; name: string }[];
  pids: Product[];
  modules: HardwareModule[];
  versions: { id: string; softwareId: string; name: string }[];
  software: { id: string; manufacturerId: string; name: string }[];
  managementModes: { id: string; name: string }[];
  licenses: {
    id: string;
    softwareId: string;
    offer: string;
    level: string;
    termMonths: number | null;
    assertionIds: string[];
  }[];
  assertions: Assertion[];
  candidates: Candidate[];
}
export interface HardwareModule {
  id: string;
  pid: string;
  name: string;
  moduleType: 'ethernet-expansion';
  familyIds: string[];
  reviewStatus: ReviewStatus;
  identityAssertionId: string;
  portInventoryAssertionId: string;
  assertionIds: string[];
}
export interface HardwareSelection {
  moduleIds: string[];
  supplyWatts: number | null;
  installationConfirmed: boolean;
}
export interface ComponentDimensions {
  heightMm: number;
  widthMm: number;
  depthMm: number;
  weightKg: number | null;
  mounting: string;
  scope: 'component';
  assembledWidthIncrementMm: number | null;
}
export interface ConfigurationPower {
  consumptionWatts: number | null;
  systemPoeBudgetWatts: number | null;
  basePoePorts: number | null;
  maxPoePerPortWatts: number | null;
  summary: string;
}
export interface Requirements {
  configurations: Record<string, HardwareSelection>;
  physicalPorts: number;
  portsAtSpeed: number;
  requiredPortSpeedMbps: number;
  operatingMinC: number | null;
  operatingMaxC: number | null;
  cellular: boolean;
  wireless: boolean;
  sea: boolean;
  poeStandard: string;
  protocolIds: string[];
  certificationIds: string[];
  softwareVersionId: string;
  architecture: string;
  endpointCount: number;
  orderDate: string;
  upgradeDate: string;
  asOfDate: string;
  copperPorts: number;
  fiberPorts: number;
  sfpSlots: number;
  uplinks: number;
  poeWatts: number;
  minSpeedMbps: number;
  dinRail: boolean;
  cyberVision: boolean;
  newDeployment: boolean;
  firmware: string;
  licenseIds: string[];
  managementModeId: string;
  preferredFamilyId: string;
}
export interface Finding {
  requirement: string;
  state: Compatibility;
  detail: string;
  assertionIds: string[];
}
export interface MatchResult {
  product: Product;
  decision: 'match' | 'conditional' | 'unverified' | 'excluded';
  score: number | null;
  findings: Finding[];
  preferenceMatches: string[];
}

export interface AuditSummary {
  id: string;
  generatedAt: string;
  path: string;
  sourcesChecked: number;
  changedSources: number;
  unreachableSources: number;
  staleClaims: number;
  potentiallyOutdatedClaims: number;
  requiresHumanReview: boolean;
}
