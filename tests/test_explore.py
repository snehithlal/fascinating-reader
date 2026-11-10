"""Offline checks: no Codex calls, no changes to the reader's library."""
import json
import tempfile
import threading
import time
import unittest
from pathlib import Path
from reader.explore import Explorer, validate_step


def sample():
    return {'title':'A small idea','markdown':'A clear explanation. '*235,'takeaway':'A useful idea.',
            'next':'The next idea','summary':'A compact summary.',
            'sources':[{'title':'NASA','url':'https://science.nasa.gov/'},
                       {'title':'ESA','url':'https://www.esa.int/'}],
            'diagram':{'layout':'sequence','caption':'A simplified view.',
                       'nodes':[{'icon':'sun','label':'Start','detail':'First part'},
                                {'icon':'planet','label':'Then','detail':'Second part'}]}}


class ExplorerTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory()
        self.calls=[]
        def runner(prompt,*args,**kwargs):
            self.calls.append(prompt)
            return sample(),0.1
        self.app=Explorer(self.temp.name,runner)

    def tearDown(self):
        self.temp.cleanup()

    def complete(self,result):
        for _ in range(100):
            if result['status']!='researching':return result
            time.sleep(.01)
            result=self.app.job(result['id'])
        self.fail('Worker did not finish')

    def test_starter_reopen_continue_and_restart_reuse_without_calls(self):
        first=self.app.start(topic='Solar system')
        self.assertEqual(len(first['path']['steps']),1)
        path_id=first['path']['id']
        self.assertEqual(self.app.start(topic='the solar system')['path']['id'],path_id)
        second=self.app.start(path_id=path_id,expected=1)
        self.assertEqual(len(second['path']['steps']),2)
        duplicate=self.app.start(path_id=path_id,expected=1)
        self.assertEqual(len(duplicate['path']['steps']),2)
        restored=Explorer(self.temp.name,self.app.runner).read(path_id)
        self.assertEqual(restored,second['path'])
        self.assertEqual(self.calls,[])

    def test_new_topic_generates_one_step_then_continues_with_compact_context(self):
        first=self.complete(self.app.start(topic='Ice floating'))
        self.assertEqual(first['status'],'complete')
        self.assertEqual(len(self.calls),1)
        second=self.complete(self.app.start(path_id=first['path']['id'],expected=1))
        self.assertEqual(len(second['path']['steps']),2)
        self.assertEqual(len(self.calls),2)
        self.assertIn('A compact summary.',self.calls[1])
        self.assertNotIn(sample()['markdown'],self.calls[1])
        self.app.start(topic='ICE FLOATING')
        self.assertEqual(len(self.calls),2)

    def test_duplicate_click_joins_existing_job(self):
        gate=threading.Event()
        self.app.runner=lambda *a,**kw: (gate.wait(2) and sample(),0.1)
        first=self.app.start(topic='A pending topic')
        again=self.app.start(topic='a pending topic')
        self.assertEqual(first['id'],again['id'])
        gate.set()
        self.assertEqual(self.complete(first)['status'],'complete')

    def test_invalid_output_does_not_overwrite_earlier_steps(self):
        first=self.app.start(topic='Solar system')
        self.app.start(path_id=first['path']['id'],expected=1)
        self.app.start(path_id=first['path']['id'],expected=2)
        self.app.runner=lambda *a,**kw: ({},0)
        result=self.complete(self.app.start(path_id=first['path']['id'],expected=3))
        self.assertEqual(result['status'],'failed')
        self.assertEqual(len(self.app.read(first['path']['id'])['steps']),3)
        self.assertFalse(self.app.active)

    def test_source_and_diagram_validation(self):
        for bad in ['javascript:alert(1)','https://user:secret@example.com','file:///etc/passwd']:
            data=sample();data['sources'][0]['url']=bad
            with self.assertRaises(ValueError):validate_step(data)
        data=sample();data['diagram']['nodes'][0]['icon']='<script>'
        with self.assertRaises(ValueError):validate_step(data)

    def test_invalid_path_or_step_rejected(self):
        with self.assertRaises(ValueError):self.app.read('../../other')
        first=self.app.start(topic='Solar system')
        for value in [True,-1,10,'1']:
            with self.assertRaises(ValueError):self.app.start(path_id=first['path']['id'],expected=value)

    def test_no_automatic_retry_on_provider_failure(self):
        def fail(*a,**kw):
            self.calls.append('failed')
            raise ValueError('Usage unavailable')
        self.app.runner=fail
        result=self.complete(self.app.start(topic='Another topic'))
        self.assertEqual(result['error'],'Usage unavailable')
        self.assertEqual(self.calls,['failed'])

if __name__=='__main__':unittest.main()
