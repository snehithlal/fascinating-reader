FASCINATION READER

PORTABLE SETUP ON A NEW MAC

Copy the entire fascination-reader folder to the new laptop. Keep lessons/,
learning-paths/, translations/, and read-later.json with it to bring your saved
reading trail and preferences. Do not copy CLI sign-in tokens; sign in to the
Codex CLI on the new laptop.

Requirements: Python 3. No Python packages are needed.

1. Install Codex CLI using its official installer:

   `curl -fsSL https://chatgpt.com/codex/install.sh | sh`

   Full options and updates: https://developers.openai.com/codex/cli.

2. Run `codex` once in Terminal and sign in with your ChatGPT account. Close
   Codex after sign-in.

3. Start the app with `python3 server.py --open-browser`. The reader opens at
   http://127.0.0.1:8765. Keep that terminal open while reading. Stop the app
   with Control-C. The optional tmux commands below require tmux and tmuxinator
   plus a local tmuxinator configuration; they are not needed for a fresh setup.

The reader uses your signed-in Codex CLI, its live web search and the usage
allowance attached to your account. It runs Codex in a read-only sandbox. No API
key is embedded or required.

STARTING THIS COPY

On this laptop, the `muxread` shell alias starts or reuses the local tmux
session, opens the reader, and attaches to tmux. In a new terminal, run muxread.
In an existing terminal, first run `source ~/.zsh_aliases` to load the aliases.
The command starts or reuses the fascination tmux session, waits until the
reader is ready, opens the browser, and attaches to tmux (or switches to it if
you are already inside tmux).

Commands: muxread = start and open; muxreada = attach; muxreadstop = stop.
Double-click start.command as an alternative to the shell alias.
Detach using your usual tmux binding; the server keeps running when detached.
There are two windows: reader (the server) and library (a shell in lessons/).
The tmuxinator configuration is ~/.tmuxinator/fascination.yml.

Choose a category and click Research a new lesson. Fresh research may take a few
minutes. One lesson is researched at a time. This is a local application on your
Mac, not a hosted service; keep your Mac and server running.

FEATURED PICKS
When the reader starts or its library opens, it checks the current period and
creates one saved featured lesson if needed: a daily pick on ordinary days, a
weekly pick on Fridays, or a monthly pick on the final day of the month. The
month-end pick takes precedence if it falls on Friday. Each pick is keyed to its
date, ISO week, or month, so restarting or reopening the app reuses an existing
pick instead of generating another lesson for that period. It does not retry a
failed pick on every browser refresh; the app reports the error and a later
server restart can retry it.

Every generated lesson is saved in this folder's lessons/ directory with a
unique filename. Your existing lessons were preserved during the move.
It does not automatically update the Meraki daily collection. The reader stores
its own on-demand library so multiple lessons in one day do not replace one another.

Choose Ask anything in the library navigation to enter any question or topic. Its
result is temporary until you choose Save to library; an unsaved result disappears
after refresh. Preset category lessons are saved automatically.
Choose Storyteller for long, chapter-by-chapter learning journeys with research,
timelines, review questions, related topics, reliable sources and captioned
Wikimedia Commons images. Stories stay temporary until you choose Save to library;
saved stories join the reading trail and can be searched like other lessons.
Enter a topic and choose Create reusable prompt to preview and copy the complete
storytelling instructions for use in another AI app. This step uses no Codex call
or usage allowance. Research and image support depend on the destination app.
The shared instructions live in storyteller-prompt.txt; keep this file with the
app when moving to another laptop.
Use Translate on any saved lesson for a reversible Malayalam version. The original
remains unchanged; the translation is stored separately. Read aloud uses English or
Malayalam browser voices. Pause, resume, stop and speed controls are included. If your browser does not support speech, open the page in Chrome
or Safari. Paragraphs highlight and scroll into view during playback.

Generated factual claims depend on model research; source links remain visible
so you can check them. No API key is embedded or required. Codex runs in a
read-only sandbox with automatic command approvals disabled.

GENERATION TROUBLESHOOTING
If a request fails, check work/generation-debug.log in this folder. It records
the operation, duration, CLI exit status and a redacted stderr excerpt; it does
not record prompts or generated lesson text. The log is private to your Mac
(owner-only permissions), rotates at about 1 MB, and the UI points to it when a
CLI call fails. In Terminal, change to this folder and run:
tail -n 40 work/generation-debug.log

LIBRARY NAVIGATION
Search saved lessons by title or content and browse by category. The list shows up to 12 lessons at a time; choose Load more to reveal the next batch. Search and category filters cover the full library.
Use a lesson's Read later button to bookmark it, then open the Read later view.
Bookmarks persist in read-later.json beside the app; removing a bookmark does
not delete the lesson. Search and category filters work together in both views.

ADDED CATEGORIES
Ruby, React, Python, Fun Facts, History, Psychology, Science, Mythology, Coding, Anatomy, Animals, Philosophy. Existing categories are also available.
Coding lessons can include readable code blocks. Mythology distinguishes traditional
stories from historical evidence; philosophy distinguishes arguments from empirical facts.

EXPLORE
Explore teaches a topic from the basics with short, illustrated steps. Enter a topic
or open the Solar system instant starter, then choose Continue for the next idea.
The solar-system starter includes three bundled, sourced steps and uses no model
calls. Other topics and later steps use a single short research call per click.
Pictures are local vector illustrations and concept diagrams, not AI-generated photos.

Explore paths save automatically in learning-paths/. Reopening a path, scrolling,
listening or jumping between completed steps uses no generation. Continue appends
one step; duplicate requests reuse the existing job or completed step. The saved-path
selector restores work after a refresh or server restart. Save Markdown exports text,
source links and diagram captions (the app retains the illustrations).
Ask anything remains temporary unless explicitly saved to the lesson library.

FIVE-MINUTE LESSONS
Category lessons, Ask anything responses and each Explore chapter take about five minutes to read. Explore keeps one consistent Medium level and teaches one clear idea at a time.
