# Setup and moving laptops

[← Back to README](../README.md)

## Requirements

- Python 3.9 or newer. The app uses Python's standard library; there are no Python packages to install.
- Codex CLI installed and signed in on this laptop.
- A browser and an internet connection for new research and remotely hosted story images.

## Install and sign in to Codex

On macOS, the [official Codex CLI guide](https://developers.openai.com/codex/cli) provides this installer:

```sh
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Run `codex` in Terminal and sign in with your ChatGPT account. Close Codex after signing in. The reader uses that CLI sign-in and your account's usage allowance; no API key is embedded or required.

## Start the reader

Open Terminal in the project folder:

```sh
cd /path/to/fascination-reader
python3 server.py --open-browser
```

The reader opens at [http://127.0.0.1:8765](http://127.0.0.1:8765). Keep the terminal running. Stop with **Control-C**.

You can choose another port with `python3 server.py --port 8766 --open-browser`.

## Move your reading to another laptop

1. Save any temporary Ask anything lessons or Storyteller stories you want to keep.
2. Stop the reader before copying its files.
3. Copy the entire `fascination-reader/` folder, including `data/` and `resources/`.
4. Install Python and Codex CLI on the new laptop, then sign in to Codex there.
5. Start the reader with the command above.

Sign in fresh on the new machine; CLI sign-in tokens are not part of this project. Saved lessons, stories, paths, translations, and bookmarks are all under [`data/`](../data/). Logs and older development backups live under `var/` and are optional when transferring.

## Existing Mac tmux shortcuts

On the original laptop, these aliases are already configured:

| Command | Action |
| --- | --- |
| `muxread` | Start or reuse the reader session, open the browser, and attach |
| `muxreada` | Attach to the existing `fascination` session |
| `muxreadstop` | Stop the session |

In an existing terminal, `source ~/.zsh_aliases` reloads those aliases. Double-clicking `start.command` uses the same tmux launcher. Detaching from tmux leaves the reader running.

These shortcuts require tmux, tmuxinator, and the local `~/.tmuxinator/fascination.yml` configuration. They are optional; the direct Python command works on a fresh setup. If configuring tmuxinator elsewhere, set its project root to this folder, run `python3 server.py` in its reader window, and use `cd data/lessons` for a library shell.
