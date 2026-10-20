import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv from 'ajv';
const root = fileURLToPath(new URL('../', import.meta.url));
export const readJson = (p) =>
  JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const catalogSchema = ajv.compile(readJson('schemas/catalog.schema.json'));
const sourcesSchema = ajv.compile(readJson('schemas/sources.schema.json'));
const battlecardsSchema = ajv.compile(
  readJson('schemas/battlecards.schema.json'),
);
const issuesSchema = ajv.compile(readJson('schemas/review-issues.schema.json'));
const canonical = (value) => JSON.stringify(stable(value));
function stable(value) {
  if (Array.isArray(value))
    return value
      .map(stable)
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, stable(value[k])]),
    );
  return value;
}
export function validateData(catalog, sources, battlecards = [], issues = []) {
  const errors = [];
  for (const [name, validate, data] of [
    ['catalog', catalogSchema, catalog],
    ['sources', sourcesSchema, sources],
    ['battlecards', battlecardsSchema, battlecards],
    ['review-issues', issuesSchema, issues],
  ]) {
    if (!validate(data))
      errors.push(
        ...validate.errors.map((e) => `${name}${e.instancePath}: ${e.message}`),
      );
  }
  if (errors.length) return errors;
  const entities = [
    ...Object.entries(catalog)
      .filter(([, v]) => Array.isArray(v))
      .flatMap(([, v]) => v),
    ...sources,
    ...battlecards,
    ...issues,
  ];
  const all = new Map();
  for (const e of entities) {
    if (all.has(e.id)) errors.push(`Duplicate ID: ${e.id}`);
    all.set(e.id, e);
  }
  const ids = (group) => new Set(group.map((x) => x.id));
  const check = (id, group, label) => {
    if (!ids(group).has(id)) errors.push(`Orphaned ${label}: ${id}`);
  };
  for (const f of catalog.families)
    check(f.manufacturerId, catalog.manufacturers, 'manufacturer');
  for (const m of catalog.models)
    check(m.familyId, catalog.families, 'model family');
  const pidNames = new Set();
  for (const p of catalog.pids) {
    if (pidNames.has(p.pid.toUpperCase()))
      errors.push(`Duplicate PID: ${p.pid}`);
    pidNames.add(p.pid.toUpperCase());
    check(p.modelId, catalog.models, 'model');
    check(p.familyId, catalog.families, 'PID family');
    if (catalog.models.find((m) => m.id === p.modelId)?.familyId !== p.familyId)
      errors.push(`Model/family mismatch: ${p.id}`);
    check(
      p.orderabilityAssertionId,
      catalog.assertions,
      'orderability assertion',
    );
    const a = catalog.assertions.find(
      (a) => a.id === p.orderabilityAssertionId,
    );
    if (
      p.reviewStatus === 'approved' &&
      (!a ||
        a.subjectId !== p.id ||
        a.predicate !== 'orderability' ||
        a.value !== true ||
        a.status !== 'supported' ||
        a.reviewStatus !== 'approved' ||
        a.requiresHumanReview ||
        a.conflictsWith.length)
    )
      errors.push(`Unverified orderability: ${p.id}`);
  }
  for (const c of catalog.candidates) {
    check(c.familyId, catalog.families, 'candidate family');
    check(c.sourceId, sources, 'candidate source');
  }
  for (const e of [
    ...catalog.revisions,
    ...catalog.modules,
    ...catalog.lifecycleEvents,
  ])
    check(e.pidId, catalog.pids, 'PID');
  for (const e of catalog.software)
    check(e.manufacturerId, catalog.manufacturers, 'software manufacturer');
  for (const e of [...catalog.versions, ...catalog.licenses])
    check(e.softwareId, catalog.software, 'software');
  for (const e of [
    ...catalog.revisions,
    ...catalog.modules,
    ...catalog.licenses,
  ])
    for (const id of e.assertionIds) check(id, catalog.assertions, 'assertion');
  for (const e of catalog.lifecycleEvents)
    check(e.assertionId, catalog.assertions, 'lifecycle evidence');
  for (const source of sources) {
    const url = new URL(source.url);
    if (url.username || url.password || url.protocol !== 'https:')
      errors.push(`Unsafe source URL: ${source.id}`);
    if (
      source.type.startsWith('official-') &&
      url.hostname !== 'cisco.com' &&
      !url.hostname.endsWith('.cisco.com')
    )
      errors.push(`Non-Cisco official source: ${source.id}`);
    if (
      source.status === 'reviewed' &&
      (!source.verifiedAt || !source.contentHash)
    )
      errors.push(`Reviewed source lacks verification/hash: ${source.id}`);
    for (const id of source.supersedes) check(id, sources, 'superseded source');
  }
  for (const a of catalog.assertions) {
    if (!all.has(a.subjectId)) errors.push(`Orphaned subject: ${a.id}`);
    check(a.sourceId, sources, 'assertion source');
    for (const [key, group] of [
      ['pidIds', catalog.pids],
      ['licenseIds', catalog.licenses],
      ['softwareVersionIds', catalog.versions],
      ['managementModeIds', catalog.managementModes],
    ])
      for (const id of a.applicability[key]) check(id, group, key);
    for (const id of [...a.supersedes, ...a.conflictsWith]) {
      check(id, catalog.assertions, 'related assertion');
      if (id === a.id) errors.push(`Self-referencing assertion: ${a.id}`);
    }
    const source = sources.find((s) => s.id === a.sourceId);
    if (
      a.reviewStatus === 'approved' &&
      (!a.reviewer?.trim() ||
        source?.status !== 'reviewed' ||
        !source.verifiedAt ||
        (source.type === 'community' && a.interpretation !== 'community'))
    )
      errors.push(`Approval lacks reviewed provenance: ${a.id}`);
    if (
      a.status === 'conditional' &&
      !Object.entries(a.applicability)
        .filter(([key]) => key !== 'pidIds')
        .map(([, value]) => value)
        .some((v) => (Array.isArray(v) ? v.length : v !== null))
    )
      errors.push(`Conditional claim has no restrictions: ${a.id}`);
    if (a.predicate === 'portInventory')
      for (const port of a.value) {
        if (
          (port.origin === 'expansion' && !port.moduleId) ||
          (port.origin === 'built-in' && port.moduleId)
        )
          errors.push(`Invalid port origin/module: ${a.id}`);
        if (port.moduleId) check(port.moduleId, catalog.modules, 'port module');
        if (port.medium === 'combo' && !port.comboGroup)
          errors.push(`Combo port lacks shared group: ${a.id}`);
      }
    if (a.predicate === 'moduleSupport')
      check(a.value.moduleId, catalog.modules, 'supported module');
    if (a.predicate === 'entitlement') {
      check(a.value.licenseId, catalog.licenses, 'entitlement license');
      check(a.value.featureId, catalog.features, 'entitlement feature');
    }
    const contradictory = catalog.assertions.filter(
      (b) =>
        b.id !== a.id &&
        b.reviewStatus === 'approved' &&
        a.reviewStatus === 'approved' &&
        b.subjectId === a.subjectId &&
        b.predicate === a.predicate &&
        (a.predicate !== 'entitlement' ||
          (b.value.featureId === a.value.featureId &&
            b.value.licenseId === a.value.licenseId)) &&
        canonical(b.applicability) === canonical(a.applicability) &&
        (b.status !== a.status ||
          JSON.stringify(b.value) !== JSON.stringify(a.value)),
    );
    if (
      contradictory.some(
        (b) => !a.conflictsWith.includes(b.id) || !a.requiresHumanReview,
      )
    )
      errors.push(`Unflagged contradictory assertions: ${a.id}`);
  }
  function dates(value, key = '') {
    if (Array.isArray(value)) {
      value.forEach((v) => dates(v, key));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) dates(v, k);
      return;
    }
    if (
      typeof value === 'string' &&
      (/(At|Date|From)$/.test(key) || key === 'date')
    ) {
      const day = value.slice(0, 10);
      const parsed = new Date(
        value.length === 10 ? value + 'T00:00:00Z' : value,
      );
      if (
        !Number.isFinite(parsed.valueOf()) ||
        parsed.toISOString().slice(0, 10) !== day ||
        parsed.valueOf() > Date.now() + 86400000
      )
        errors.push(`Invalid or future date: ${key}=${value}`);
    }
  }
  for (const issue of issues) {
    for (const id of issue.sourceIds) check(id, sources, 'review issue source');
    for (const id of issue.subjectIds)
      if (!all.has(id)) errors.push(`Orphaned review issue subject: ${id}`);
  }
  // Independent inventory gate catches expansion capacity accidentally published as built in.
  for (const a of catalog.assertions.filter(
    (a) =>
      a.reviewStatus === 'approved' &&
      [
        'builtInCopperPorts',
        'builtInFiberPorts',
        'builtInSfpSlots',
        'uplinkPorts',
        'maxPortSpeedMbps',
      ].includes(a.predicate),
  )) {
    const inventory = catalog.assertions.find(
      (b) =>
        b.subjectId === a.subjectId &&
        b.predicate === 'portInventory' &&
        b.reviewStatus === 'approved' &&
        canonical(b.applicability) === canonical(a.applicability),
    );
    if (!inventory) {
      errors.push(`Missing scoped port inventory: ${a.id}`);
      continue;
    }
    const built = inventory.value.filter((p) => p.origin === 'built-in');
    const expected =
      a.predicate === 'maxPortSpeedMbps'
        ? Math.max(0, ...built.flatMap((p) => p.speedsMbps))
        : built
            .filter((p) =>
              a.predicate === 'builtInCopperPorts'
                ? p.medium === 'copper'
                : a.predicate === 'builtInFiberPorts'
                  ? p.medium === 'fiber'
                  : a.predicate === 'builtInSfpSlots'
                    ? ['sfp', 'sfp-plus'].includes(p.medium)
                    : p.role === 'uplink',
            )
            .reduce((n, p) => n + p.count, 0);
    if (a.value !== expected)
      errors.push(
        `Port inventory/count mismatch: ${a.id}; expected ${expected}, got ${a.value}`,
      );
  }
  dates(catalog);
  dates(sources);
  dates(battlecards);
  for (const b of battlecards) {
    for (const id of b.ciscoSubjectIds)
      if (!all.has(id)) errors.push(`Orphaned battlecard subject: ${id}`);
    check(b.competitor.datasheetSourceId, sources, 'competitor source');
    const refs = [
      ...b.assertionIds,
      ...b.ciscoStrengths,
      ...b.ciscoWeaknesses,
      ...b.competitorStrengths,
      ...b.competitorWeaknesses,
      ...b.conditionSpecificParity.flatMap((p) => p.assertionIds),
      ...b.deploymentModel.assertionIds,
      ...b.licenseTerms.assertionIds,
      ...b.objections.flatMap((o) => o.assertionIds),
    ];
    for (const id of refs)
      check(id, catalog.assertions, 'battlecard assertion');
    for (const e of b.userEvidence) check(e.sourceId, sources, 'user evidence');
  }
  return [...new Set(errors)];
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const catalog = readJson('data/products/catalog.json'),
    sources = readJson('data/sources/sources.json');
  const errors = validateData(
    catalog,
    sources,
    readJson('data/competitors/battlecards.json'),
    readJson('data/sources/review-issues.json'),
  );
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(
      `Data valid: ${catalog.pids.length} PIDs, ${catalog.assertions.length} assertions, ${catalog.candidates.length} unverified research candidates, ${sources.length} source references. Schema success does not verify vendor facts.`,
    );
}
