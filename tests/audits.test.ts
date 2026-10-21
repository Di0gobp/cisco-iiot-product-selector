import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateAuditHistory } from '../scripts/validate-audits.mjs';
import history from '../data/audits/index.json';
import sources from '../data/sources/sources.json';
import catalog from '../data/products/catalog.json';

const readReport = (file: string) =>
  JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));
const validate = (entry: (typeof history)[number], report: unknown) =>
  validateAuditHistory([entry], () => report, sources, catalog.assertions);

describe('audit history observations', () => {
  it('accepts historical source coverage without rewriting it to the current registry size', () => {
    expect(
      validateAuditHistory(history, readReport, sources, catalog.assertions),
    ).toEqual([]);
    const historical = history.find((entry) => entry.sourcesChecked === 35)!;
    expect(readReport(historical.path).sources).toHaveLength(35);
    expect(sources).toHaveLength(39);
  });
  it('rejects repeated source observations that can hide missing coverage', () => {
    const report = readReport(history[0].path);
    report.sources[1] = structuredClone(report.sources[0]);
    expect(validate(history[0], report).join(' ')).toContain(
      'Duplicate audit source',
    );
  });
  it('retains a failed source observation and rejects a falsified success counter', () => {
    const report = readReport(history[0].path);
    report.sources[0].status = 'unreachable';
    report.sources[0].requiresHumanReview = true;
    report.sources[0].error = 'Response read timed out';
    report.summary.unreachableSources = 1;
    report.requiresHumanReview = true;
    const entry = { ...history[0], unreachableSources: 1 };
    expect(validate(entry, report)).toEqual([]);
    report.summary.unreachableSources = 0;
    expect(
      validate({ ...entry, unreachableSources: 0 }, report).join(' '),
    ).toContain('Audit summary/count mismatch: unreachableSources');
  });
  it('rejects unavailable sources whose human-review requirement was cleared', () => {
    const report = readReport(history[0].path);
    report.sources[0].status = 'unreachable';
    report.sources[0].requiresHumanReview = false;
    report.summary.unreachableSources = 1;
    expect(
      validate({ ...history[0], unreachableSources: 1 }, report).join(' '),
    ).toContain('Audit source requires human review');
  });
  it('rejects unrecognized source states', () => {
    const report = readReport(history[0].path);
    report.sources[0].status = 'approved';
    expect(validate(history[0], report).join(' ')).toContain(
      'Invalid audit source status',
    );
  });
  it('requires an explicit empty technical-change list for observation reports', () => {
    const report = readReport(history[0].path);
    delete report.claimsChanged;
    expect(validate(history[0], report).join(' ')).toContain(
      'Invalid audit report contract',
    );
  });
});
