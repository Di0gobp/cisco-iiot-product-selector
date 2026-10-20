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
  | 'entitlement'
  | 'coexistence';
export interface Source {
  id: string;
  title: string;
  url: string;
  type:
    | 'official-datasheet'
    | 'official-support'
    | 'official-lifecycle'
    | 'community';
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
}
export interface PortGroup {
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
  manufacturers: { id: string; name: string }[];
  families: Family[];
  models: { id: string; familyId: string; name: string }[];
  pids: Product[];
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
export interface Requirements {
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
