# Project structure

[← Back to README](../README.md)

## Code and bundled content

| Location | Purpose |
| --- | --- |
| `server.py` | Small entry point, preserving the existing start command |
| `reader/server.py` | Local HTTP routes, library storage, and background jobs |
| `reader/generation.py` | Bounded Codex calls and private diagnostics |
| `reader/explore.py` | Explore paths and illustrated steps |
| `reader/paths.py` | Central paths resolved from the project location |
| `web/` | Browser interface: HTML, JavaScript, and CSS |
| `resources/schemas/` | JSON response schemas passed to Codex |
| `resources/prompts/` | Shared reusable storytelling instructions |
| `resources/starters/` | Bundled solar-system and photosynthesis content |
| `tests/` | Offline checks |
| `docs/` | Setup, usage, development, and troubleshooting guides |

## Personal reading and runtime files

| Location | Purpose |
| --- | --- |
| `data/lessons/` | Saved category lessons, questions, and stories |
| `data/learning-paths/` | Saved Explore progress |
| `data/translations/` | Malayalam translations |
| `data/read-later.json` | Bookmarks |
| `var/generation-debug.log` | Private, rotated generation diagnostics |
| `var/generate-*/` | Temporary Codex working directories, removed after the call |
| `var/` backup directories | Preserved older development snapshots and files |

The reorganization moved the former root-level `lessons/`, `learning-paths/`, `translations/`, and `read-later.json` into `data/`. Former `work/` contents are now in `var/`. Saved data files were moved without rewriting their contents.

The root start commands and browser URLs stay the same. The web server serves only explicitly listed interface files, not arbitrary project or personal data files.
