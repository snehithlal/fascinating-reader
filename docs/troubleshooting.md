# Troubleshooting

[← Back to README](../README.md)

## The app will not start

From the project root, use `python3 server.py --open-browser`. Check that Python is installed and that port 8765 is available. Use `--port 8766` to choose another port.

If the Mac tmux shortcuts are unavailable on a new laptop, use the direct Python command. Those shortcuts depend on local shell aliases and tmuxinator settings.

## Research fails

Confirm that `codex` is available in the terminal that starts the reader and that you have signed in on this laptop. Account usage limits and internet availability can affect research.

From the project root, inspect:

```sh
tail -n 40 var/generation-debug.log
```

The log contains operation names, durations, exit status, and redacted CLI errors. It excludes prompts and generated content, uses owner-only permissions, and rotates at about 1 MB. Older logs are preserved as `generation-debug.log.1`.

## Research feels slow

Each new item starts a Codex CLI process and researches sources. Stories also check image links and produce a longer response. The reader waits for the full structured response before displaying it. Creating a reusable prompt skips Codex and research.

You can continue reading saved content while research runs. If another operation is running, wait for it to finish before starting another. A failed call is not retried automatically.

## Content seems missing

Saved content lives under `data/`. Verify that you copied that folder to the new laptop. Clear search and category filters, and check All lessons as well as Read later.

Ask anything and Storyteller previews must be saved explicitly before refreshing or restarting. Explore progress saves automatically.

## Audio or images are unavailable

Read aloud depends on installed browser voices; try Chrome or Safari if speech is unavailable. Malayalam voice support varies by system.

Story photographs load from Wikimedia's image servers and need an internet connection. Unavailable images are omitted by the reader. Explore's bundled vector diagrams do not need remote image downloads.
