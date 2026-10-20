import type {
  Assertion,
  Finding,
  MatchResult,
  Predicate,
  Product,
  Requirements,
} from './types';

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
  return assertions.filter(
    (a) =>
      a.subjectId === product.id &&
      a.predicate === predicate &&
      a.reviewStatus === 'approved',
  );
}
export function resolveFact(
  product: Product,
  assertions: Assertion[],
  predicate: Predicate,
  requirements: Requirements,
): Finding & { value?: Assertion['value'] } {
  const facts = reviewedAssertions(product, assertions, predicate);
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
        'Evidence does not cover the requested firmware or management mode.',
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
    p.softwareVersionIds.length ||
    (p.managementModeIds.length && !requirements.managementModeId) ||
    p.architecture ||
    p.configuration ||
    p.effectiveFrom ||
    p.assetLimit !== null;
  return {
    requirement: predicate,
    state: a.status === 'supported' && unresolved ? 'conditional' : a.status,
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
export function searchProducts<T extends { pid: string; familyId: string }>(
  products: T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  return products
    .filter((p) => `${p.pid} ${p.familyId}`.toLowerCase().includes(q))
    .sort(
      (a, b) =>
        Number(b.pid.toLowerCase() === q) - Number(a.pid.toLowerCase() === q) ||
        a.pid.localeCompare(b.pid),
    );
}
