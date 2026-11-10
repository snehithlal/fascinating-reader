# Development

[← Back to README](../README.md)

The app uses Python's standard library and plain HTML, CSS, and JavaScript. There is no build step or package installation for the application itself. Codex CLI is needed for fresh research.

## Run locally

From the project root:

```sh
python3 server.py --open-browser
```

The root entry point delegates to `reader.server.main()`. You can also use `python3 -m reader.server`. Paths are defined in `reader/paths.py`, so launching the entry point by absolute path works from another working directory.

Refresh the browser after interface changes. Restart the server after Python changes, saving any temporary stories or answers first.

## Run offline checks

```sh
python3 -m unittest discover -s tests -v
node --check web/app.js
node --check web/explore.js
```

The Python checks use temporary data or mocked generation. JavaScript syntax checks require Node.js; running the reader itself does not.

## Where to make changes

Edit browser behavior in `web/`, server behavior in `reader/`, and response shapes in `resources/schemas/`. The storytelling prompt is shared by story generation and reusable prompt export; edit `resources/prompts/storyteller-prompt.txt` to update both.

Keep generated personal content under `data/` and disposable logs or scratch output under `var/`. Both folders are excluded from Git by default. Back them up separately or copy the full project when moving machines.

Codex calls use a temporary working directory, a read-only sandbox, automatic command approvals disabled, and live web search for research. Translation disables web search. One generation call runs at a time; no automatic retries consume additional allowance after a failed request.
