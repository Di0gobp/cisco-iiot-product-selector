import copy
import datetime as dt
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
A = load('audit_sources')
H = load('record_audit')
NOW = dt.datetime(2026, 10, 20, tzinfo=dt.timezone.utc)
HTML = '<html><body><p>Updated: October 8, 2026</p><p>' + 'Official source content. ' * 25 + '</p></body></html>'

def fetch(url):
    if url.endswith('robots.txt'):
        return b'User-agent: *\nAllow: /\n', url, 'text/plain'
    return HTML.encode(), url, 'text/html'

def source():
    text = A.Text(); text.feed(HTML)
    return {'id':'test-source','url':'https://www.cisco.com/test-public-doc','contentHash':'sha256:'+hashlib.sha256('\n'.join(text.parts).encode()).hexdigest(),'documentDate':'2026-10-08'}

class AuditTests(unittest.TestCase):
    def run_audit(self, sources=None, catalog=None, fn=fetch):
        return A.audit(sources or [source()], catalog, now=NOW, fetch_fn=fn, sleep_fn=lambda _:None)
    def test_unchanged_does_not_approve_or_modify_data(self):
        data = [source()]; before = copy.deepcopy(data)
        report = self.run_audit(data)
        self.assertEqual(report['sources'][0]['status'],'unchanged')
        self.assertFalse(report['requiresHumanReview'])
        self.assertEqual(data,before)
        self.assertEqual(report['claimsChanged'],[])
    def test_changed_fingerprint_queues_exact_claim_and_citation(self):
        s=source();s['contentHash']='sha256:'+'0'*64
        report=self.run_audit([s],{'pids':[],'assertions':[{'id':'test-claim','sourceId':s['id'],'reviewStatus':'approved','verifiedAt':'2026-10-01T00:00:00Z'}]})
        self.assertEqual(report['summary']['changedSources'],1)
        self.assertEqual(report['potentiallyOutdatedAssertions'][0]['assertionId'],'test-claim')
        self.assertEqual(report['potentiallyOutdatedAssertions'][0]['sourceUrl'],s['url'])
        self.assertEqual(report['claimsChanged'],[])
    def test_overdue_verification_is_reported_even_if_page_unchanged(self):
        report=self.run_audit(catalog={'pids':[],'assertions':[{'id':'old','sourceId':'test-source','reviewStatus':'approved','verifiedAt':'2025-01-01T00:00:00Z'}]})
        self.assertEqual(report['summary']['staleClaims'],1)
        self.assertIn('verification-overdue',report['potentiallyOutdatedAssertions'][0]['reasons'])
    def test_robots_denial_prevents_source_fetch(self):
        calls=[]
        def denied(url):
            calls.append(url)
            return b'User-agent: *\nDisallow: /\n',url,'text/plain'
        report=self.run_audit(fn=denied)
        self.assertEqual(report['sources'][0]['status'],'robots-disallowed')
        self.assertEqual(len(calls),1)
    def test_unapproved_destination_is_not_fetched(self):
        s=source();s['url']='https://example.com/private'
        report=self.run_audit([s],fn=lambda _:self.fail('must not fetch'))
        self.assertEqual(report['summary']['unreachableSources'],1)
    def test_only_explicit_valid_vendor_date_is_parsed(self):
        self.assertIsNone(A.document_date('Published elsewhere on October 9, 2026'))
        self.assertIsNone(A.document_date('Updated: February 30, 2026'))
        self.assertEqual(A.document_date('Updated\n: October 8, 2026'),'2026-10-08')
    def test_history_is_repeatable_and_cannot_overwrite_a_different_report(self):
        report=self.run_audit()
        with tempfile.TemporaryDirectory() as tmp:
            directory=Path(tmp)
            H.record(report,directory);H.record(report,directory)
            self.assertEqual(len(json.loads((directory/'index.json').read_text())),1)
            saved = next(directory.glob('2026-*.json'))
            saved.write_text(json.dumps(report, separators=(',', ':')))
            before = saved.read_bytes()
            H.record(report,directory)
            self.assertEqual(saved.read_bytes(),before)
            changed=copy.deepcopy(report);changed['claimsChanged']=['unreviewed']
            with self.assertRaises(ValueError):H.record(changed,directory)

if __name__=='__main__':unittest.main()
