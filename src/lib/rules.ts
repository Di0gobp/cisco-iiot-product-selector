import type {
  Assertion,
  Finding,
  MatchResult,
  Predicate,
  Product,
  Requirements,
} from './types';
import { countBuiltInPorts } from './ports';

export function compareVersions(a: string, b: string): number | null {
  // Deliberately supports only plain numeric versions. IOS XE suffixes require a reviewed rule.
  if (!/^\d+(\.\d+)*$/.test(a) || !/^\d+(\.\d+)*$/.test(b)) return null;
  const x = a.split('.').map(Number),
    y = b.split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const delta = (x[i] ?? 0) - (y[i] ?? 0);
    if (delta) return Math.sign(delta);
  }
  return 0;
}
export function reviewedAssertions(
  product: Product,
  assertions: Assertion[],
  predicate: Predicate,
): Assertion[] {
  const superseded = new Set(
    assertions
      .filter((a) => a.reviewStatus === 'approved' && !a.requiresHumanReview)
      .flatMap((a) => a.supersedes),
  );
  return assertions.filter(
    (a) =>
      a.subjectId === product.id &&
      a.predicate === predicate &&
      a.reviewStatus === 'approved' &&
      !superseded.has(a.id),
  );
}
export function resolveFact(
  product: Product,
  assertions: Assertion[],
  predicate: Predicate,
  requirements: Requirements,
): Finding & { value?: Assertion['value'] } {
  const requestedFeatures = [
    requirements.cyberVision ? 'cv-visibility' : '',
    requirements.sea ? 'sea-remote-access' : '',
  ].filter(Boolean);
  const facts = reviewedAssertions(product, assertions, predicate).filter(
    (a) =>
      predicate !== 'coexistence' ||
      ((!requestedFeatures.length ||
        (requestedFeatures.every((id) =>
          a.applicability.featureIds?.includes(id),
        ) &&
          (a.status !== 'unsupported' ||
            a.applicability.featureIds?.every((id) =>
              requestedFeatures.includes(id),
            )))) &&
        (!requirements.managementModeId ||
          a.status === 'unsupported' ||
          a.applicability.managementModeIds.includes(
            requirements.managementModeId,
          ))),
  );
  if (!facts.length)
    return {
      requirement: predicate,
      state: 'unknown',
      detail: 'No reviewed evidence for this exact PID.',
      assertionIds: [],
    };
  if (facts.some((a) => a.conflictsWith.length > 0 || a.requiresHumanReview))
    return {
      requirement: predicate,
      state: 'unknown',
      detail: 'Conflicting or flagged evidence needs human review.',
      assertionIds: facts.map((a) => a.id),
    };
  const applicable = facts.filter((a) => {
    const p = a.applicability;
    return (
      (!p.pidIds.length || p.pidIds.includes(product.id)) &&
      (!requirements.managementModeId ||
        !p.managementModeIds.length ||
        p.managementModeIds.includes(requirements.managementModeId)) &&
      (!requirements.architecture ||
        !p.architecture ||
        p.architecture === requirements.architecture) &&
      (!requirements.softwareVersionId ||
        !p.softwareVersionIds.length ||
        p.softwareVersionIds.includes(requirements.softwareVersionId)) &&
      (!requirements.firmware ||
        !p.firmwareMin ||
        compareVersions(requirements.firmware, p.firmwareMin) !== -1) &&
      (!requirements.firmware ||
        !p.firmwareMax ||
        compareVersions(requirements.firmware, p.firmwareMax) !== 1)
    );
  });
  if (!applicable.length)
    return {
      requirement: predicate,
      state: 'unknown',
      detail:
        'Evidence does not cover the requested firmware, software release or management mode.',
      assertionIds: facts.map((a) => a.id),
    };
  const values = new Set(
    applicable.map((a) => JSON.stringify([a.status, a.value, a.applicability])),
  );
  if (values.size > 1)
    return {
      requirement: predicate,
      state: 'unknown',
      detail: 'Multiple applicable assertions need a scoped review.',
      assertionIds: applicable.map((a) => a.id),
    };
  const a = applicable[0],
    p = a.applicability;
  const conditions: string[] = [];
  if (p.firmwareMin) conditions.push(`Minimum firmware ${p.firmwareMin}`);
  if (p.firmwareMax) conditions.push(`Maximum firmware ${p.firmwareMax}`);
  if (p.licenseIds.length)
    conditions.push(`License: ${p.licenseIds.join(', ')}`);
  if (p.licenseAnyOfIds?.length)
    conditions.push(`One of these licenses: ${p.licenseAnyOfIds.join(', ')}`);
  if (p.softwareVersionIds.length)
    conditions.push(`Software versions: ${p.softwareVersionIds.join(', ')}`);
  if (p.managementModeIds.length)
    conditions.push(`Management: ${p.managementModeIds.join(', ')}`);
  if (p.architecture) conditions.push(`Architecture: ${p.architecture}`);
  if (p.configuration) conditions.push(p.configuration);
  if (p.effectiveFrom)
    conditions.push(`Entitlement effective from ${p.effectiveFrom}`);
  if (p.assetLimit !== null) conditions.push(`Asset limit: ${p.assetLimit}`);
  const unknownVersion =
    !!requirements.firmware &&
    [p.firmwareMin, p.firmwareMax].some(
      (v) => v && compareVersions(requirements.firmware, v) === null,
    );
  if (unknownVersion)
    return {
      requirement: predicate,
      state: 'unknown',
      detail:
        'Version format requires manual review. ' + conditions.join(' · '),
      assertionIds: [a.id],
    };
  const unresolved =
    (p.firmwareMin && !requirements.firmware) ||
    (p.firmwareMax && !requirements.firmware) ||
    p.licenseIds.some((id) => !requirements.licenseIds.includes(id)) ||
    (p.licenseAnyOfIds?.length &&
      !p.licenseAnyOfIds.some((id) => requirements.licenseIds.includes(id))) ||
    (p.softwareVersionIds.length && !requirements.softwareVersionId) ||
    (p.managementModeIds.length && !requirements.managementModeId) ||
    (p.architecture && p.architecture !== requirements.architecture) ||
    p.configuration ||
    p.effectiveFrom ||
    p.assetLimit !== null;
  return {
    requirement: predicate,
    state:
      (a.status === 'supported' || a.status === 'unsupported') && unresolved
        ? 'conditional'
        : a.status,
    value: a.value,
    detail:
      conditions.join(' · ') ||
      (a.status === 'unknown'
        ? 'Official evidence does not establish support.'
        : 'Reviewed evidence for this exact PID.'),
    assertionIds: [a.id],
  };
}
export function evaluateProduct(
  product: Product,
  assertions: Assertion[],
  requirements: Requirements,
): MatchResult {
  const findings: Finding[] = [];
  const check = (
    predicate: Predicate,
    label: string,
    target: number | boolean | string,
  ) => {
    const fact = resolveFact(product, assertions, predicate, requirements);
    let state = fact.state;
    if (state === 'supported') {
      if (typeof target === 'number')
        state =
          typeof fact.value !== 'number'
            ? 'unknown'
            : fact.value >= target
              ? 'supported'
              : 'unsupported';
      else state = fact.value === target ? 'supported' : 'unsupported';
    }
    findings.push({ ...fact, requirement: label, state });
  };
  if (requirements.physicalPorts)
    check(
      'physicalEthernetPorts',
      `${requirements.physicalPorts}+ physical Ethernet ports`,
      requirements.physicalPorts,
    );
  if (requirements.copperPorts)
    check(
      'builtInCopperPorts',
      `${requirements.copperPorts}+ built-in copper ports`,
      requirements.copperPorts,
    );
  if (requirements.fiberPorts)
    check(
      'builtInFiberPorts',
      `${requirements.fiberPorts}+ built-in fiber ports`,
      requirements.fiberPorts,
    );
  if (requirements.sfpSlots)
    check(
      'builtInSfpSlots',
      `${requirements.sfpSlots}+ built-in SFP/SFP+ slots`,
      requirements.sfpSlots,
    );
  if (requirements.uplinks)
    check(
      'uplinkPorts',
      `${requirements.uplinks}+ built-in uplinks`,
      requirements.uplinks,
    );
  if (requirements.poeWatts)
    check(
      'poeBudgetWatts',
      `${requirements.poeWatts}+ W PoE`,
      requirements.poeWatts,
    );
  if (requirements.minSpeedMbps)
    check(
      'maxPortSpeedMbps',
      `${requirements.minSpeedMbps}+ Mbps on at least one port`,
      requirements.minSpeedMbps,
    );
  if (requirements.dinRail) check('dinRail', 'DIN rail mounting', true);
  if (requirements.cyberVision)
    check('cyberVision', 'Cyber Vision support', true);
  if (requirements.managementModeId)
    check(
      'management',
      'Requested management mode',
      requirements.managementModeId,
    );
  if (requirements.cyberVision && requirements.managementModeId)
    check('coexistence', 'Cyber Vision in the requested management mode', true);
  if (requirements.sea) check('sea', 'Secure Equipment Access support', true);
  if (requirements.cellular) check('cellular', 'Cellular connectivity', true);
  if (requirements.wireless) check('wireless', 'Wireless connectivity', true);
  if (requirements.poeStandard)
    findings.push(
      matchList(
        product,
        assertions,
        'poeStandards',
        requirements.poeStandard,
        requirements,
      ),
    );
  for (const protocol of requirements.protocolIds)
    findings.push(
      matchList(
        product,
        assertions,
        'industrialProtocols',
        protocol,
        requirements,
      ),
    );
  for (const certification of requirements.certificationIds)
    findings.push(
      matchList(
        product,
        assertions,
        'certifications',
        certification,
        requirements,
      ),
    );
  if (requirements.portsAtSpeed) {
    const fact = resolveFact(
      product,
      assertions,
      'portInventory',
      requirements,
    );
    const inventory = Array.isArray(fact.value) ? fact.value : null;
    const count = inventory
      ? countBuiltInPorts(inventory, requirements.requiredPortSpeedMbps)
      : null;
    findings.push({
      ...fact,
      requirement: `${requirements.portsAtSpeed}+ built-in ports at ${requirements.requiredPortSpeedMbps} Mbps or faster`,
      state:
        fact.state === 'supported' && count !== null
          ? count >= requirements.portsAtSpeed
            ? 'supported'
            : 'unsupported'
          : fact.state,
      detail:
        count === null
          ? fact.detail
          : `${count} physical interfaces meet the rate. SFP media needs a suitable transceiver. ` +
            fact.detail,
    });
  }
  if (
    requirements.operatingMinC !== null ||
    requirements.operatingMaxC !== null
  ) {
    const fact = resolveFact(
      product,
      assertions,
      'operatingTemperature',
      requirements,
    );
    const value = fact.value as
      | {
          ranges?: { minC: number; maxC: number; conditions: string }[];
          complete?: boolean;
        }
      | undefined;
    const covering = value?.ranges?.filter(
      (r) =>
        (requirements.operatingMinC === null ||
          r.minC <= requirements.operatingMinC) &&
        (requirements.operatingMaxC === null ||
          r.maxC >= requirements.operatingMaxC),
    );
    findings.push({
      ...fact,
      requirement: 'Industrial operating temperature',
      state:
        fact.state === 'supported'
          ? covering?.length
            ? 'conditional'
            : value?.complete
              ? 'unsupported'
              : 'unknown'
          : fact.state,
      detail: covering?.length
        ? covering
            .map((r) => `${r.minC} to ${r.maxC} °C: ${r.conditions}`)
            .join(' · ')
        : fact.detail,
    });
  }
  if (
    requirements.sea &&
    requirements.managementModeId &&
    !requirements.cyberVision
  )
    check('coexistence', 'SEA in the requested management mode', true);
  if (requirements.cyberVision && requirements.sea) {
    const fact = resolveFact(product, assertions, 'coexistence', requirements);
    findings.push({
      ...fact,
      requirement: 'Cyber Vision + SEA simultaneous deployment',
    });
  }
  if (
    requirements.endpointCount &&
    (requirements.cyberVision || requirements.sea)
  ) {
    const requiredFeatures = [
      requirements.cyberVision ? 'cv-visibility' : '',
      requirements.sea ? 'sea-remote-access' : '',
    ].filter(Boolean);
    for (const feature of requiredFeatures) {
      const entitlements = reviewedAssertions(
        product,
        assertions,
        'entitlement',
      ).filter(
        (a) => (a.value as { featureId?: string }).featureId === feature,
      );
      if (!entitlements.length)
        findings.push({
          requirement: `${requirements.endpointCount} endpoints · ${feature}`,
          state: 'unknown',
          detail:
            'No reviewed endpoint entitlement/capacity rule for this PID. Additional licenses may be needed; coverage is not assumed.',
          assertionIds: [],
        });
      else
        for (const a of entitlements) {
          const fact = evaluateEntitlement(a, requirements);
          findings.push({
            ...fact,
            requirement: `${requirements.endpointCount} endpoints · ${feature}`,
            state: fact.state === 'unsupported' ? 'conditional' : fact.state,
            detail:
              fact.state === 'unsupported'
                ? 'Included entitlement is insufficient; additional licensing must be verified. ' +
                  fact.detail
                : fact.detail,
          });
        }
    }
  }
  if (requirements.newDeployment) {
    const fact = resolveFact(product, assertions, 'lifecycle', requirements);
    findings.push({
      ...fact,
      requirement: 'Suitable lifecycle for new deployment',
      state:
        fact.state === 'supported'
          ? fact.value === 'active'
            ? 'supported'
            : ['end-of-sale', 'end-of-support'].includes(String(fact.value))
              ? 'unsupported'
              : 'unknown'
          : fact.state,
    });
  }
  if (product.reviewStatus !== 'approved')
    findings.push({
      requirement: 'Exact PID review',
      state: 'unknown',
      detail: 'Orderability and product identity are not yet approved.',
      assertionIds: [],
    });
  const preferenceMatches =
    requirements.preferredFamilyId === product.familyId
      ? ['Preferred family']
      : [];
  const failed = findings.some((f) => f.state === 'unsupported'),
    unknown = findings.some((f) => f.state === 'unknown');
  const conditional = findings.some((f) => f.state === 'conditional');
  return {
    product,
    findings,
    preferenceMatches,
    decision: failed
      ? 'excluded'
      : unknown || !findings.length
        ? 'unverified'
        : conditional
          ? 'conditional'
          : 'match',
    score: findings.length
      ? Math.round(
          (100 * findings.filter((f) => f.state === 'supported').length) /
            findings.length,
        )
      : null,
  };
}
export function rankProducts(
  products: Product[],
  assertions: Assertion[],
  requirements: Requirements,
): MatchResult[] {
  const order = { match: 0, conditional: 1, unverified: 2, excluded: 3 };
  return products
    .map((p) => evaluateProduct(p, assertions, requirements))
    .sort(
      (a, b) =>
        order[a.decision] - order[b.decision] ||
        b.preferenceMatches.length - a.preferenceMatches.length ||
        (b.score ?? -1) - (a.score ?? -1) ||
        a.product.pid.localeCompare(b.product.pid),
    );
}
export function searchProducts<
  T extends {
    pid: string;
    familyId: string;
    description?: string;
    modelName?: string;
  },
>(products: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  return products
    .filter((p) =>
      `${p.pid} ${p.familyId} ${p.description ?? ''} ${p.modelName ?? ''}`
        .toLowerCase()
        .includes(q),
    )
    .sort(
      (a, b) =>
        Number(b.pid.toLowerCase() === q) - Number(a.pid.toLowerCase() === q) ||
        a.pid.localeCompare(b.pid),
    );
}

export function matchList(
  product: Product,
  assertions: Assertion[],
  predicate: Predicate,
  required: string,
  requirements: Requirements,
): Finding {
  const fact = resolveFact(product, assertions, predicate, requirements);
  const value = fact.value as
    { items?: string[]; complete?: boolean } | undefined;
  const included = value?.items?.includes(required);
  return {
    ...fact,
    requirement: required,
    state:
      !included && value?.items && !value.complete
        ? 'unknown'
        : fact.state === 'supported'
          ? included
            ? 'supported'
            : value?.complete
              ? 'unsupported'
              : 'unknown'
          : fact.state,
    detail: included
      ? fact.detail
      : value?.complete
        ? `Official inventory does not include ${required}.`
        : `${required} is not established by the reviewed evidence. ` +
          fact.detail,
  };
}
export function evaluateEntitlement(
  assertion: Assertion,
  requirements: Requirements,
): Finding {
  const p = assertion.applicability,
    v = assertion.value as { quantity?: number; durationMonths?: number };
  const result = (state: Finding['state'], detail: string): Finding => ({
    requirement: 'Commercial entitlement eligibility',
    state,
    detail,
    assertionIds: [assertion.id],
  });
  if (
    assertion.predicate !== 'entitlement' ||
    assertion.reviewStatus !== 'approved' ||
    assertion.requiresHumanReview ||
    assertion.conflictsWith.length
  )
    return result('unknown', 'No unflagged, reviewed commercial entitlement.');
  if (p.licenseIds.some((id) => !requirements.licenseIds.includes(id)))
    return result(
      'conditional',
      `Requires ${p.licenseIds.join(', ')}. Actual license activation must be checked.`,
    );
  const validDate = (date: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(new Date(date).valueOf()) &&
    new Date(date).toISOString().slice(0, 10) === date;
  const qualifyingOrder =
    validDate(requirements.orderDate) &&
    !!p.qualifyingOrderFrom &&
    requirements.orderDate >= p.qualifyingOrderFrom;
  const qualifyingUpgrade =
    validDate(requirements.upgradeDate) &&
    !!p.qualifyingUpgradeFrom &&
    requirements.upgradeDate >= p.qualifyingUpgradeFrom;
  if (!qualifyingOrder && !qualifyingUpgrade)
    return result(
      'unknown',
      'No qualifying order or upgrade date established; do not infer an entitlement from a PID suffix.',
    );
  if (
    requirements.endpointCount &&
    v.quantity !== undefined &&
    requirements.endpointCount > v.quantity
  )
    return result(
      'unsupported',
      `Requested ${requirements.endpointCount} endpoints exceeds the documented ${v.quantity}-endpoint included quantity. Additional licensing is required.`,
    );
  return result(
    'conditional',
    `Commercial order-date and quantity checks satisfied. Included term: ${v.durationMonths ?? 'unknown'} months. Actual activation date, remaining term and technical support still require verification.`,
  );
}
export function formatFact(value: Assertion['value'] | undefined): string {
  if (value === undefined) return 'Unknown';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value !== 'object') return String(value);
  if (Array.isArray(value))
    return value
      .map((p) => `${p.count} × ${p.medium} (${p.role}, ${p.origin})`)
      .join('; ');
  if (Array.isArray(value.items)) return value.items.join(', ');
  if (Array.isArray(value.ranges))
    return (
      value.ranges as { minC: number; maxC: number; conditions: string }[]
    )
      .map((r) => `${r.minC} to ${r.maxC} °C (${r.conditions})`)
      .join('; ');
  if (typeof value.summary === 'string') return value.summary;
  if (typeof value.note === 'string') return value.note;
  return JSON.stringify(value);
}
