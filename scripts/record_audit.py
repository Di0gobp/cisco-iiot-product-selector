"""Propose immutable audit history only. Never change sources or technical claims."""
import argparse
import datetime as dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def record(report, directory):
    timestamp = dt.datetime.fromisoformat(report['generatedAt'].replace('Z', '+00:00'))
    if timestamp.tzinfo is None:
        raise ValueError('Audit timestamp must include a timezone')
    name = timestamp.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H-%M-%SZ')
    target = directory / (name + '.json')
    directory.mkdir(parents=True, exist_ok=True)
    contents = json.dumps(report, indent=2) + '\n'
    exists = target.exists()
    if exists and json.loads(target.read_text()) != report:
        raise ValueError('Refusing to overwrite different audit history with the same timestamp')
    index_path = directory / 'index.json'
    index = json.loads(index_path.read_text()) if index_path.exists() else []
    summary = report['summary']
    entry = {'id': name, 'generatedAt': report['generatedAt'], 'path': 'data/audits/' + name + '.json',
             'sourcesChecked': summary['sourcesChecked'], 'changedSources': summary['changedSources'],
             'unreachableSources': summary['unreachableSources'], 'staleClaims': summary['staleClaims'],
             'potentiallyOutdatedClaims': summary['potentiallyOutdatedClaims'], 'requiresHumanReview': report['requiresHumanReview']}
    if not exists:
        target.write_text(contents)
    index = sorted([item for item in index if item['id'] != name] + [entry], key=lambda item: item['generatedAt'], reverse=True)
    index_path.write_text(json.dumps(index, indent=2) + '\n')
    return entry


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('report')
    parser.add_argument('--body-file')
    args = parser.parse_args()
    report = json.loads(Path(args.report).read_text())
    entry = record(report, ROOT / 'data/audits')
    if args.body_file:
        summary = report['summary']
        citations = '\n'.join('- ' + item['url'] for item in report['sources'] if item['requiresHumanReview'])
        if not citations:
            citations = '\n'.join('- ' + item['url'] for item in report['sources'])
        body = ('Public Cisco source recheck and immutable audit-history proposal. No technical claims or source baselines are changed.\n\n'
                + f"Checked {summary['sourcesChecked']} sources; {summary['changedSources']} changed, {summary['unreachableSources']} unreachable; "
                + f"{summary['staleClaims']} overdue claims and {summary['potentiallyOutdatedClaims']} queued assertions.\n\n"
                + 'Review the JSON report and cited sections before proposing any compatibility, licensing or lifecycle edit.\n\n'
                + 'Validation: the proposal workflow validates catalog/audit integrity, TypeScript and the production build before opening this PR. GitHub may suppress follow-on CI for PRs created using GITHUB_TOKEN; review the proposal job result and run additional checks if technical code is added.\n\n'
                + 'Official references:\n' + citations + '\n')
        Path(args.body_file).write_text(body)
    print(json.dumps(entry))
