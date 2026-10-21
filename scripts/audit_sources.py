"""Read-only, allowlisted source recheck. Never approves or modifies catalog claims."""
import argparse
import datetime as dt
import hashlib
import http.client
import json
import os
from pathlib import Path
import time
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
AGENT = 'IIoTSelector-SourceAudit/0.1'
ALLOWED = {'www.cisco.com'}
MAX_BYTES = 4 * 1024 * 1024

class SafeRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        parsed = urllib.parse.urlsplit(newurl)
        if parsed.scheme != 'https' or parsed.hostname not in ALLOWED or parsed.username or parsed.password:
            raise ValueError('Redirect outside approved public source hosts')
        return super().redirect_request(req, fp, code, msg, headers, newurl)

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []; self.ignore = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style', 'noscript'): self.ignore += 1
    def handle_endtag(self, tag):
        if tag in ('script', 'style', 'noscript'): self.ignore = max(0, self.ignore - 1)
    def handle_data(self, data):
        if not self.ignore and data.strip(): self.parts.append(' '.join(data.split()))

opener = urllib.request.build_opener(SafeRedirect())
def fetch(url):
    p = urllib.parse.urlsplit(url)
    if p.scheme != 'https' or p.hostname not in ALLOWED or p.username or p.password or p.port not in (None, 443):
        raise ValueError('URL outside approved public source hosts')
    req = urllib.request.Request(url, headers={'User-Agent': AGENT, 'Accept': 'text/html,text/plain'})
    with opener.open(req, timeout=25) as response:
        data = response.read(MAX_BYTES + 1)
        if len(data) > MAX_BYTES: raise ValueError('Source exceeds 4 MiB limit')
        return data, response.geturl(), response.headers.get('Content-Type', '')

def document_date(content):
    """Only an explicitly labeled vendor update date, never an unrelated body date."""
    import re
    match = re.search(r'(?:Last updated\s*:|Updated\s*:?)\s*([A-Z][a-z]+ \d{1,2},\s*\d{4})', content)
    if not match:
        return None
    try:
        return dt.datetime.strptime(match.group(1), '%B %d, %Y').date().isoformat()
    except ValueError:
        return None


def audit(sources, catalog=None, issues=None, *, now=None, fetch_fn=fetch, sleep_fn=time.sleep, stale_days=180):
    now = now or dt.datetime.now(dt.timezone.utc)
    stamp = now.isoformat(timespec='seconds').replace('+00:00', 'Z')
    catalog = catalog or {'assertions': [], 'pids': []}
    issues = issues or []
    robots, results = {}, []
    for source in sources:
        item = {'sourceId': source['id'], 'url': source['url'], 'lastCheckedAt': stamp,
                'status': 'unreachable', 'requiresHumanReview': True,
                'previousContentHash': source.get('contentHash'), 'previousDocumentDate': source.get('documentDate')}
        host = urllib.parse.urlsplit(source['url']).hostname
        try:
            if host not in ALLOWED:
                raise ValueError('Source host is outside the approved public allowlist')
            if host not in robots:
                sleep_fn(1)
                try:
                    data, _, _ = fetch_fn(f'https://{host}/robots.txt')
                    parser = urllib.robotparser.RobotFileParser()
                    parser.parse(data.decode('utf-8', errors='replace').splitlines())
                    robots[host] = parser
                except urllib.error.HTTPError as error:
                    if error.code == 404:
                        parser = urllib.robotparser.RobotFileParser()
                        parser.parse([])
                        robots[host] = parser
                    else:
                        robots[host] = f'robots.txt unavailable (HTTP {error.code}); source not fetched'
                except Exception:
                    robots[host] = 'robots.txt unreachable through environment network; source not fetched'
            policy = robots[host]
            if isinstance(policy, str):
                raise ValueError(policy)
            if not policy.can_fetch(AGENT, source['url']):
                item.update(status='robots-disallowed', error='Automated fetching disallowed; manual review required')
            else:
                delay = max(1, policy.crawl_delay(AGENT) or 1)
                if delay > 30:
                    raise ValueError('Requested crawl delay exceeds supported audit budget; manual review required')
                sleep_fn(delay)
                data, final, content_type = fetch_fn(source['url'])
                if 'html' not in content_type:
                    raise ValueError('Expected HTML document; manual review required')
                text = Text()
                text.feed(data.decode('utf-8', errors='replace'))
                content = '\n'.join(text.parts)
                if len(content) < 300 or any(marker in content.lower() for marker in ['access denied', 'verify you are human', 'request rejected']):
                    raise ValueError('Response is too short or appears to be an access challenge')
                digest = 'sha256:' + hashlib.sha256(content.encode()).hexdigest()
                vendor_date = document_date(content)
                status = 'changed' if source.get('contentHash') and source['contentHash'] != digest else 'baseline-needed' if not source.get('contentHash') else 'unchanged'
                date_changed = vendor_date is not None and vendor_date != source.get('documentDate')
                item.update(status=status, contentHash=digest, finalUrl=final, documentDate=vendor_date,
                            documentDateChanged=date_changed, requiresHumanReview=status != 'unchanged' or date_changed,
                            note='Fingerprint/date observation only; no technical claim or lifecycle change inferred.')
        except (OSError, http.client.HTTPException, ValueError) as error:
            item['error'] = str(error) if isinstance(error, ValueError) else 'Source network request failed; check proxy/network permissions'
        results.append(item)
    stale, outdated = [], []
    by_source = {item['sourceId']: item for item in results}
    for assertion in catalog.get('assertions', []):
        if assertion.get('reviewStatus') != 'approved':
            continue
        try:
            checked = dt.datetime.fromisoformat(assertion['verifiedAt'].replace('Z', '+00:00'))
            age = (now - checked).days
        except (ValueError, KeyError):
            age = None
        reason = []
        if age is None or age > stale_days:
            entry = {'assertionId': assertion['id'], 'sourceId': assertion['sourceId'],
                     'verifiedAt': assertion.get('verifiedAt'), 'ageDays': age, 'requiresHumanReview': True}
            stale.append(entry)
            reason.append('verification-overdue' if age is not None else 'invalid-verification-date')
        item = by_source.get(assertion['sourceId'])
        if item and (item['status'] != 'unchanged' or item.get('documentDateChanged')):
            reason.append('source-' + item['status'] if item['status'] != 'unchanged' else 'vendor-date-changed')
        if assertion.get('requiresHumanReview') or assertion.get('conflictsWith'):
            reason.append('existing-review-flag')
        if reason:
            outdated.append({'assertionId': assertion['id'], 'sourceId': assertion['sourceId'],
                             'sourceUrl': item['url'] if item else None, 'reasons': reason,
                             'applicability': assertion.get('applicability'), 'requiresHumanReview': True})
    open_issues = [issue['id'] for issue in issues if issue.get('status', 'open') != 'resolved']
    requires_review = bool(outdated or open_issues or any(item['requiresHumanReview'] for item in results))
    canonical = lambda data: json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode()
    return {'schemaVersion': '1.1.0', 'generatedAt': stamp, 'catalogHash': 'sha256:' + hashlib.sha256(canonical(catalog)).hexdigest(), 'sourceRegistryHash': 'sha256:' + hashlib.sha256(canonical(sources)).hexdigest(), 'datasetSummary': {'pids': len(catalog.get('pids', [])), 'assertions': len(catalog.get('assertions', []))}, 'sources': results,
            'summary': {'sourcesChecked': len(results), 'changedSources': sum(s['status'] == 'changed' for s in results),
                        'unreachableSources': sum(s['status'] in ('unreachable', 'robots-disallowed') for s in results),
                        'staleClaims': len(stale), 'potentiallyOutdatedClaims': len(outdated), 'openReviewIssues': len(open_issues)},
            'staleAssertions': stale, 'potentiallyOutdatedAssertions': outdated, 'openReviewIssueIds': open_issues,
            'requiresHumanReview': requires_review, 'claimsChanged': [], 'newLifecycleEvents': [],
            'recommendedActions': ['Review cited source sections for every queued assertion.',
                                   'Validate any proposed technical correction and obtain human approval.',
                                   'Keep existing source baselines and claims unchanged until review.'],
            'limits': ['A changed page/date is not proof that a technical claim changed.',
                       'No inferred or automatically approved technical, licensing or lifecycle edits.',
                       'No Cisco EoX credential is required; OAuth-backed API integration remains optional.',
                       'Public URL coverage is not an exhaustive portfolio or lifecycle audit.']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default=os.environ.get('SOURCE_AUDIT_OUTPUT', '/tmp/iiot-source-audit.json'))
    parser.add_argument('--stale-days', type=int, default=180)
    args = parser.parse_args()
    if args.stale_days < 1:
        parser.error('--stale-days must be positive')
    sources = json.loads((ROOT / 'data/sources/sources.json').read_text())
    catalog = json.loads((ROOT / 'data/products/catalog.json').read_text())
    issues = json.loads((ROOT / 'data/sources/review-issues.json').read_text())
    report = audit(sources, catalog, issues, stale_days=args.stale_days)
    target = Path(args.output)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'report': str(target), **report['summary'], 'requiresHumanReview': report['requiresHumanReview']}))
    raise SystemExit(1 if report['summary']['unreachableSources'] else 0)
