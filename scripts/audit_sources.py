"""Read-only, allowlisted source recheck. Never approves or modifies catalog claims."""
import argparse
import datetime as dt
import hashlib
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

def audit(sources):
    robots = {}
    results = []
    for source in sources:
        now = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
        item = {'sourceId': source['id'], 'url': source['url'], 'lastCheckedAt': now, 'status': 'unreachable', 'requiresHumanReview': True}
        host = urllib.parse.urlsplit(source['url']).hostname
        try:
            if host not in robots:
                time.sleep(1)
                try:
                    data, _, _ = fetch(f'https://{host}/robots.txt')
                    parser = urllib.robotparser.RobotFileParser(); parser.parse(data.decode('utf-8', errors='replace').splitlines()); robots[host] = parser
                except urllib.error.HTTPError as error:
                    if error.code == 404:
                        parser = urllib.robotparser.RobotFileParser(); parser.parse([]); robots[host] = parser
                    else: robots[host] = f'robots.txt unavailable (HTTP {error.code}); source not fetched'
                except Exception:
                    robots[host] = 'robots.txt unreachable through environment network; source not fetched'
            policy = robots[host]
            if isinstance(policy, str): raise ValueError(policy)
            if not policy.can_fetch(AGENT, source['url']):
                item['status'] = 'robots-disallowed'; item['error'] = 'Automated fetching disallowed; manual review required'
            else:
                delay = max(1, policy.crawl_delay(AGENT) or 1)
                if delay > 30: raise ValueError('Requested crawl delay exceeds supported audit budget; manual review required')
                time.sleep(delay)
                data, final, content_type = fetch(source['url'])
                if 'html' not in content_type: raise ValueError('Expected HTML document; manual review required')
                text = Text(); text.feed(data.decode('utf-8', errors='replace'))
                content = '\n'.join(text.parts)
                if len(content) < 300 or any(marker in content.lower() for marker in ['access denied', 'verify you are human', 'request rejected']):
                    raise ValueError('Response is too short or appears to be an access challenge')
                digest = 'sha256:' + hashlib.sha256(content.encode()).hexdigest()
                item.update({'status': 'changed' if source['contentHash'] and source['contentHash'] != digest else 'baseline-needed' if not source['contentHash'] else 'unchanged', 'contentHash': digest, 'finalUrl': final, 'documentDate': None, 'note': 'Content fingerprint only; no changed claims or lifecycle events inferred. Vendor dates require manual review.'})
        except (urllib.error.URLError, ValueError) as error:
            # Error text is controlled; never log request headers, proxies or credentials.
            item['error'] = str(error) if isinstance(error, ValueError) else 'Source network request failed; check proxy/network permissions'
        results.append(item)
    return {'schemaVersion': '1.0.0', 'generatedAt': dt.datetime.now(dt.timezone.utc).isoformat(), 'sources': results, 'claimsChanged': [], 'newLifecycleEvents': [], 'conflicts': [], 'limits': ['Does not discover all vendor changes or interpret claim changes.', 'No EoX API integration in Phase A.', 'No automatic approval, source baseline update, catalog edit or publication.']}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--output', default=os.environ.get('SOURCE_AUDIT_OUTPUT', '/tmp/iiot-source-audit.json')); args = parser.parse_args()
    sources = json.loads((ROOT / 'data/sources/sources.json').read_text())
    report = audit(sources)
    target = Path(args.output); target.parent.mkdir(parents=True, exist_ok=True); target.write_text(json.dumps(report, indent=2) + '\n')
    counts = {status: sum(s['status'] == status for s in report['sources']) for status in sorted({s['status'] for s in report['sources']})}
    print(json.dumps({'report': str(target), 'sources': len(sources), 'outcomes': counts}))
    raise SystemExit(1 if any(s['status'] in ('unreachable', 'robots-disallowed') for s in report['sources']) else 0)
