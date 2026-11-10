# Fascination Reader

A local reading room for researched lessons, illustrated learning paths, and immersive stories. Fresh research uses your signed-in Codex CLI. Your saved reading stays on your laptop.

## Start reading

From this project folder, run:

```sh
python3 server.py --open-browser
```

The reader opens at [localhost:8765](http://127.0.0.1:8765). Keep the terminal open while using it. Stop with **Control-C**.

For a new laptop, follow the [setup guide](docs/setup.md) to install Python and sign in to Codex.

## Documentation

- [Setup and moving to another laptop](docs/setup.md)
- [Reading, exploring, and storytelling](docs/usage.md)
- [Project structure and file locations](docs/project-structure.md)
- [Development and checks](docs/development.md)
- [Troubleshooting](docs/troubleshooting.md)

## Project at a glance

```text
fascination-reader/
├── README.md          Overview and documentation links
├── server.py          Start the app
├── start.command      Existing Mac launcher
├── launch-tmux.command
├── reader/            Python server and research logic
├── web/               HTML, JavaScript, and styles
├── resources/         Prompts, response schemas, and starter lessons
├── data/              Your saved reading, translations, and bookmarks
├── docs/              Guides and reference material
├── tests/             Offline checks
└── var/               Runtime logs, temporary files, and older backups
```

Back up **`data/`** to preserve your reading trail. Copy the entire project when moving laptops so the app, bundled resources, and saved reading travel together.
