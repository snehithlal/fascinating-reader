"""Checks for resource locations and the portable root entry point."""
import io
import json
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from reader import server
from reader.paths import ROOT, SCHEMAS, STARTERS, WEB


class LayoutTests(unittest.TestCase):
    def test_static_browser_urls_serve_moved_assets(self):
        for route, filename in [('/', 'index.html'), ('/app.js', 'app.js'),
                                ('/explore.js', 'explore.js'), ('/style.css', 'style.css')]:
            with self.subTest(route=route):
                handler = server.Handler.__new__(server.Handler)
                handler.path = route
                handler.headers = {'Host': f'127.0.0.1:{server.PORT}'}
                handler.send = lambda status, body, mime: (status, body, mime)
                status, body, _ = handler.do_GET()
                self.assertEqual(status, 200)
                self.assertEqual(body, (WEB / filename).read_bytes())

    def test_moved_prompt_and_schema_resources(self):
        body = json.dumps({'topic': 'Ada Lovelace'}).encode()
        handler = server.Handler.__new__(server.Handler)
        handler.path = '/api/story-prompt'
        handler.headers = {'Host': f'127.0.0.1:{server.PORT}',
                           'X-Reader-Token': server.TOKEN, 'Content-Length': str(len(body))}
        handler.rfile = io.BytesIO(body)
        handler.send = lambda status, data: (status, data)
        with patch.object(server, 'run_json') as model:
            status, data = handler.do_POST()
        self.assertEqual(status, 200)
        self.assertIn('Ada Lovelace', data['prompt'])
        self.assertNotIn('{{TOPIC}}', data['prompt'])
        model.assert_not_called()
        for name in ['lesson', 'story', 'explore', 'translation']:
            self.assertEqual(json.loads((SCHEMAS / f'{name}-schema.json').read_text())['type'], 'object')
        self.assertEqual(len(json.loads((STARTERS / 'solar-starter.json').read_text())), 3)

    def test_start_command_works_outside_project_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, str(ROOT / 'server.py'), '--help'],
                                    cwd=directory, capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('--open-browser', result.stdout)


if __name__ == '__main__':
    unittest.main()
