# Fascination Reader

A local reading room for curious learning. Browse a saved library of short,
sourced lessons, research a new topic, translate a lesson into Malayalam, listen
with browser speech, or build a step-by-step Explore path.

## Start here

See **[Setup and installation](SETUP.md)** for requirements, first-time setup,
starting the reader, and moving your library to another Mac.

For a quick start on a Mac that already has Python 3 and the Codex CLI installed
and signed in, open Terminal in this folder and run:

```sh
python3 server.py --open-browser
```

Then visit <http://127.0.0.1:8765> if the browser does not open automatically.
Keep the terminal open while using the reader; press Control-C to stop it.

## What it does

- **Read and search:** Browse lessons by category, search titles and content,
  and bookmark items in the Read later view.
- **Research:** Generate a five-minute lesson, ask a custom question, or create
  a long-form Storyteller journey with sources and chapter navigation.
- **Explore:** Learn a topic through short illustrated steps and save paths to
  continue later.
- **Listen and translate:** Use browser speech controls or create a reversible
  Malayalam translation while keeping the original lesson intact.
- **Keep your work:** Lessons, translations, Explore paths, and bookmarks are
  stored in this folder and persist across restarts.

## Requirements and privacy

The app runs on your Mac and listens only on `127.0.0.1`; it is not a hosted
service. Python 3 is required, and no Python packages need to be installed.
Generating or translating content uses the Codex CLI signed in on your machine
and its associated usage allowance. No API key is embedded or required.

## Project files

- `server.py`, `generation.py`, `explore.py`: local server and research logic
- `index.html`, `app.js`, `explore.js`, `style.css`: reader interface
- `lessons/`, `translations/`, `learning-paths/`: saved reading content
- `read-later.json`: bookmarks
- `storyteller-prompt.txt`: reusable Storyteller instructions for other AI apps

## Troubleshooting

If generation fails, check `work/generation-debug.log`. It records operation
timing, CLI exit status, and a redacted error excerpt, but not prompts or lesson
text. To inspect recent entries:

```sh
tail -n 40 work/generation-debug.log
```
