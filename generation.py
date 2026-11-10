"""One bounded model call; no retries or speculative generation."""
import json
import os
import re
import shutil
import subprocess
import tempfile
import threading
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RUN_LOCK = threading.Lock()
LOG_LOCK = threading.Lock()
DEBUG_LOG = ROOT / 'work' / 'generation-debug.log'
MAX_LOG_BYTES = 1_000_000
MAX_DETAIL_CHARS = 6000


def _redact(text):
    """Keep useful CLI diagnostics while removing common credential formats."""
    text = str(text or '')[-MAX_DETAIL_CHARS:]
    patterns = (
        (r'(?i)(authorization\s*[:=]\s*bearer\s+)\S+', r'\1[redacted]'),
        (r'(?i)(api[_ -]?key\s*[:=]\s*)[^\s,;]+', r'\1[redacted]'),
        (r'\bsk-[A-Za-z0-9_-]{12,}\b', '[redacted-key]'),
        (r'\bgh[pousr]_[A-Za-z0-9]{20,}\b', '[redacted-token]'),
    )
    for pattern, replacement in patterns:
        text = re.sub(pattern, replacement, text)
    return text


def log_debug(event, **details):
    """Append bounded, prompt-free diagnostics for local troubleshooting."""
    try:
        DEBUG_LOG.parent.mkdir(exist_ok=True)
        entry = {'time': datetime.now(timezone.utc).isoformat(), 'event': event}
        entry.update({key: _redact(value) if isinstance(value, str) else value
                      for key, value in details.items()})
        line = json.dumps(entry, ensure_ascii=False, default=str) + '\n'
        with LOG_LOCK:
            if DEBUG_LOG.exists() and DEBUG_LOG.stat().st_size + len(line.encode('utf-8')) > MAX_LOG_BYTES:
                rotated = DEBUG_LOG.with_suffix('.log.1')
                rotated.unlink(missing_ok=True)
                DEBUG_LOG.replace(rotated)
            descriptor = os.open(DEBUG_LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
            try:
                os.fchmod(descriptor, 0o600)
                with os.fdopen(descriptor, 'a', encoding='utf-8') as file:
                    file.write(line)
            except Exception:
                os.close(descriptor)
                raise
    except Exception:
        # Diagnostics must never prevent a lesson from being generated.
        pass


def run_json(prompt, schema, *, timeout=300, search=True):
    codex = shutil.which('codex')
    if not codex:
        log_debug('cli_missing', operation=Path(schema).stem)
        raise ValueError('Codex CLI is not installed. Sign in to Codex before generating.')
    if not RUN_LOCK.acquire(blocking=False):
        raise ValueError('Another lesson or translation is running. Please wait for it to finish.')
    started = time.monotonic()
    operation = Path(schema).stem.removesuffix('-schema')
    log_debug('started', operation=operation, timeout_seconds=timeout, web_search=search,
              cli=Path(codex).name, model='Codex CLI default')
    try:
        (ROOT / 'work').mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(prefix='generate-', dir=ROOT / 'work') as temp:
            result = Path(temp) / 'result.json'
            command = [codex, '-a', 'never', 'exec', '--ephemeral', '--ignore-user-config',
                       '--skip-git-repo-check', '--sandbox', 'read-only', '--cd', temp,
                       '-c', 'web_search="live"' if search else 'web_search="disabled"',
                       '--output-schema', str(ROOT / schema), '--output-last-message', str(result), '-']
            completed = subprocess.run(command, input=prompt, text=True, capture_output=True, timeout=timeout)
            if completed.returncode or not result.exists():
                stderr = _redact(completed.stderr)
                log_debug('cli_failed', operation=operation, duration_seconds=round(time.monotonic() - started, 1),
                          return_code=completed.returncode, result_file_exists=result.exists(),
                          stdout_chars=len(completed.stdout or ''), stderr=stderr or '(empty)')
                reason = f'exit {completed.returncode}' if completed.returncode else 'no result file was returned'
                raise ValueError(f'Codex CLI failed ({reason}). See work/generation-debug.log for details.')
            raw = result.read_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError as error:
                log_debug('invalid_json', operation=operation, duration_seconds=round(time.monotonic() - started, 1),
                          result_chars=len(raw), error=f'{error.msg} at line {error.lineno}, column {error.colno}')
                raise ValueError('Codex returned malformed JSON. See work/generation-debug.log for details.') from None
        log_debug('succeeded', operation=operation, duration_seconds=round(time.monotonic() - started, 1),
                  result_chars=len(raw))
        return data, round(time.monotonic() - started, 1)
    except subprocess.TimeoutExpired as error:
        log_debug('timed_out', operation=operation, timeout_seconds=timeout,
                  stderr=_redact(error.stderr) or '(empty)', stdout_chars=len(error.stdout or ''))
        raise ValueError(f'Codex CLI timed out after {timeout} seconds. See work/generation-debug.log for details.') from None
    except ValueError:
        raise
    except Exception as error:
        log_debug('runner_error', operation=operation, error_type=type(error).__name__,
                  error=_redact(error), duration_seconds=round(time.monotonic() - started, 1))
        raise
    finally:
        RUN_LOCK.release()
