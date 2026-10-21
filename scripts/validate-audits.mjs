import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
export function validateAuditHistory(index, readReport, sources, assertions) {
  const errors = [];
  const seen = new Set();
  for (const item of index) {
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z$/.test(item.id) ||
      item.path !== `data/audits/${item.id}.json`
    ) {
      errors.push('Unsafe or inconsistent audit history path');
      continue;
    }
    if (seen.has(item.id)) errors.push('Duplicate audit history ID');
    seen.add(item.id);
    let report;
    try {
      report = readReport(item.path);
    } catch {
      errors.push(`Missing/unreadable audit report: ${item.path}`);
      continue;
    }
    if (
      report.schemaVersion !== '1.1.0' ||
      report.generatedAt !== item.generatedAt ||
      !Array.isArray(report.sources) ||
      !Array.isArray(report.staleAssertions) ||
      !Array.isArray(report.potentiallyOutdatedAssertions) ||
      !Array.isArray(report.openReviewIssueIds) ||
      !Array.isArray(report.claimsChanged) ||
      !Array.isArray(report.newLifecycleEvents) ||
      typeof report.requiresHumanReview !== 'boolean' ||
      !report.summary
    ) {
      errors.push('Invalid audit report contract');
      continue;
    }
    const generated = new Date(item.generatedAt);
    if (
      !Number.isFinite(generated.valueOf()) ||
      generated.toISOString().replace('.000Z', 'Z') !== item.generatedAt ||
      item.id !== item.generatedAt.replaceAll(':', '-') ||
      generated.valueOf() > Date.now() + 86400000
    )
      errors.push('Invalid audit generation date');
    const counts = {
      sourcesChecked: report.sources.length,
      changedSources: report.sources.filter((s) => s.status === 'changed')
        .length,
      unreachableSources: report.sources.filter((s) =>
        ['unreachable', 'robots-disallowed'].includes(s.status),
      ).length,
      staleClaims: report.staleAssertions?.length,
      potentiallyOutdatedClaims: report.potentiallyOutdatedAssertions?.length,
    };
    for (const [key, value] of Object.entries(counts))
      if (
        value === undefined ||
        report.summary[key] !== value ||
        item[key] !== value
      )
        errors.push(`Audit summary/count mismatch: ${key}`);
    if (item.requiresHumanReview !== report.requiresHumanReview)
      errors.push('Audit review flag mismatch');
    if (
      report.summary.openReviewIssues !== report.openReviewIssueIds.length ||
      new Set(report.openReviewIssueIds).size !==
        report.openReviewIssueIds.length
    )
      errors.push('Audit open-issue summary mismatch');
    const sourceIds = new Set(sources.map((s) => s.id)),
      claimIds = new Set(assertions.map((a) => a.id));
    const observed = new Set();
    for (const s of report.sources) {
      if (observed.has(s.sourceId))
        errors.push(`Duplicate audit source: ${s.sourceId}`);
      observed.add(s.sourceId);
      if (
        ![
          'unchanged',
          'changed',
          'baseline-needed',
          'unreachable',
          'robots-disallowed',
        ].includes(s.status)
      )
        errors.push(`Invalid audit source status: ${s.sourceId}`);
      if (
        typeof s.requiresHumanReview !== 'boolean' ||
        ((s.status !== 'unchanged' || s.documentDateChanged) &&
          !s.requiresHumanReview)
      )
        errors.push(`Audit source requires human review: ${s.sourceId}`);
      if (
        !sourceIds.has(s.sourceId) ||
        sources.find((r) => r.id === s.sourceId)?.url !== s.url
      )
        errors.push(`Orphaned or changed audit source: ${s.sourceId}`);
    }
    if (
      !report.requiresHumanReview &&
      (report.sources.some((s) => s.requiresHumanReview) ||
        report.potentiallyOutdatedAssertions.length ||
        report.staleAssertions.length ||
        report.openReviewIssueIds.length)
    )
      errors.push('Audit observations require human review');
    for (const a of [
      ...(report.staleAssertions ?? []),
      ...(report.potentiallyOutdatedAssertions ?? []),
    ])
      if (!claimIds.has(a.assertionId) || !sourceIds.has(a.sourceId))
        errors.push('Orphaned audit assertion');
    if (report.claimsChanged?.length || report.newLifecycleEvents?.length)
      errors.push(
        'Observation report must not claim unparsed technical changes',
      );
  }
  return [...new Set(errors)];
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const index = read('data/audits/index.json');
  const errors = validateAuditHistory(
    index,
    read,
    read('data/sources/sources.json'),
    read('data/products/catalog.json').assertions,
  );
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exitCode = 1;
  } else
    console.log(`Audit history valid: ${index.length} immutable report(s).`);
}
