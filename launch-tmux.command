#!/bin/zsh
set -e

tmuxinator start fascination --no-attach

# Wait for the local reader before opening its URL, including on the first start.
python3 - <<'PY'
import json
import time
import urllib.request
for _ in range(100):
    try:
        with urllib.request.urlopen('http://127.0.0.1:8765/api/library', timeout=1) as response:
            data = json.load(response)
        if 'lessons' in data and 'categories' in data:
            break
    except (OSError, ValueError):
        pass
    time.sleep(0.2)
else:
    raise SystemExit('Reader did not start. Inspect: tmux attach -t fascination')
PY

# Reuse an existing reader tab in a running Safari or Chromium browser. If no
# reader tab is open, let macOS open the URL in the default browser.
python3 - <<'PYOPEN'
import subprocess

url = 'http://127.0.0.1:8765'
applescript = r'''on run argv
  set appName to item 1 of argv
  set targetURL to item 2 of argv
  tell application appName
    repeat with windowIndex from 1 to (count of windows)
      set theWindow to window windowIndex
      repeat with tabIndex from 1 to (count of tabs of theWindow)
        set theTab to tab tabIndex of theWindow
        if (URL of theTab starts with targetURL) then
          set active tab index of theWindow to tabIndex
          set index of theWindow to 1
          activate
          return "reused"
        end if
      end repeat
    end repeat
  end tell
  return "missing"
end run'''

for app, process in [('Safari', 'Safari'), ('Google Chrome', 'Google Chrome'),
                     ('Microsoft Edge', 'Microsoft Edge'), ('Brave Browser', 'Brave Browser'),
                     ('Vivaldi', 'Vivaldi')]:
    if subprocess.run(['pgrep', '-x', process], stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL).returncode != 0:
        continue
    result = subprocess.run(['osascript', '-e', applescript, app, url],
                            capture_output=True, text=True)
    if result.returncode == 0 and result.stdout.strip() == 'reused':
        break
else:
    subprocess.run(['open', url], check=True)
PYOPEN
if [[ -n "${TMUX:-}" ]]; then
  exec tmux switch-client -t fascination
else
  exec tmux attach -t fascination
fi
