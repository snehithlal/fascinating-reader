"""Offline checks for private generation diagnostics."""
import json
import stat
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import generation


class GenerationLogTests(unittest.TestCase):
    def test_log_is_private_and_redacts_common_credentials(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'generation-debug.log'
            with patch.object(generation, 'DEBUG_LOG', path):
                generation.log_debug(
                    'cli_failed',
                    stderr='Authorization: Bearer super-secret-value api_key=AIzaSyA12345678901234567890',
                )

            entry = json.loads(path.read_text())
            self.assertIn('[redacted]', entry['stderr'])
            self.assertNotIn('super-secret-value', path.read_text())
            self.assertNotIn('AIzaSyA12345678901234567890', path.read_text())
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)


if __name__ == '__main__':
    unittest.main()
