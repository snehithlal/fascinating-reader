# Setup and installation

This guide covers a fresh setup on macOS and the optional shortcuts configured
for one existing machine.

## Requirements

- macOS
- Python 3
- Codex CLI, signed in with your ChatGPT account, for generating and
  translating content

The reader uses only Python's standard library; no Python packages or virtual
environment are required. Reading saved content and the bundled Solar system
Explore starter do not require a Codex call.

## First-time setup

1. Place the complete `fascination-reader` folder somewhere convenient. Keep
   the application files and data folders together.
2. Install Codex CLI using its official installer:

   ```sh
   curl -fsSL https://chatgpt.com/codex/install.sh | sh
   ```

   See the [Codex CLI documentation](https://developers.openai.com/codex/cli)
   for installation options and updates.
3. Open Terminal and run `codex`. Sign in with your ChatGPT account, then exit
   the CLI.
4. In Terminal, change to the application folder and start the reader:

   ```sh
   cd /path/to/fascination-reader
   python3 server.py --open-browser
   ```

   The reader opens at <http://127.0.0.1:8765>. If it does not, open that
   address in a browser. Keep the Terminal window open while using the reader;
   press Control-C to stop the server.

## Starting it again

Each time you want to use the reader, open Terminal in the application folder
and run:

```sh
python3 server.py --open-browser
```

You can omit `--open-browser` and open the local address yourself. To choose a
different port, use `python3 server.py --port 8766 --open-browser` and visit
<http://127.0.0.1:8766>.

The included `start.command` is a shortcut for a machine that already has the
`fascination` tmuxinator project configured. It is not required for a fresh
setup. Its shell aliases (`muxread`, `muxreada`, and `muxreadstop`) and the
configuration at `~/.tmuxinator/fascination.yml` are local to that machine.

## Moving the reader and saved library

Copy the whole application folder to the new Mac. Keep `lessons/`,
`learning-paths/`, `translations/`, and `read-later.json` with it to preserve
your saved content and bookmarks. Install Python 3 and Codex CLI on the new Mac,
then sign in there. Do not copy CLI sign-in tokens from the old machine.

## How content generation works

The local reader calls the Codex CLI on your machine for fresh research and
translation. It uses the signed-in account's available usage and runs Codex in
a read-only sandbox with automatic command approvals disabled. No API key is
embedded or required. The reader itself binds to `127.0.0.1`, so it is available
only on your Mac by default.

New lessons are saved in `lessons/`; translations are stored separately in
`translations/`; Explore paths are stored in `learning-paths/`; bookmarks are
stored in `read-later.json`. Back up those items along with the application
folder if you want to preserve your reading history.

## Troubleshooting

If a research or translation request fails, check `work/generation-debug.log`
in the application folder. The log contains operation timing, CLI exit status,
and a redacted error excerpt. It does not contain prompts or generated lesson
text. In Terminal, from the application folder, run:

```sh
tail -n 40 work/generation-debug.log
```

If the CLI is not found, make sure its installation directory is on your
Terminal `PATH`, then open a new Terminal window. If the browser cannot connect,
confirm that the server is still running and use the port printed in Terminal.
