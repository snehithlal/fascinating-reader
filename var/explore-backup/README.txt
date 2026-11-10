FASCINATION READER

App location: /Users/snps/Documents/workspace/fascination-reader

In a new terminal, run muxread. In an existing terminal, first run
source ~/.zsh_aliases to load the new aliases. The command starts or reuses the
fascination tmux session, waits until the reader is ready, opens the browser,
and attaches to tmux (or switches to it if you are already inside tmux).

Commands: muxread = start and open; muxreada = attach; muxreadstop = stop.
Double-click start.command as an alternative to the shell alias.
Detach using your usual tmux binding; the server keeps running when detached.
There are two windows: reader (the server) and library (a shell in lessons/).
The tmuxinator configuration is ~/.tmuxinator/fascination.yml.

Choose a category and click Research a new lesson. Fresh research uses your
existing signed-in Codex CLI, live web search and your Codex usage allowance.
It can take a few minutes. One lesson is researched at a time. This is a local
application on your Mac, not a hosted service; keep your Mac and server running.

Every generated lesson is saved in /Users/snps/Documents/workspace/fascination-reader/lessons/
with a unique filename. Your existing lessons were preserved during the move.
It does not automatically update the Meraki daily collection. The reader stores
its own on-demand library so multiple lessons in one day do not replace one another.

Choose Ask anything in the library navigation to enter any question or topic. Its
result is temporary until you choose Save to library; an unsaved result disappears
after refresh. Preset category lessons are saved automatically.
Use Translate on any saved lesson for a reversible Malayalam version. The original
remains unchanged; the translation is stored separately. Read aloud uses English or
Malayalam browser voices. Pause, resume, stop and speed controls are included. If your browser does not support speech, open the page in Chrome
or Safari. Paragraphs highlight and scroll into view during playback.

Generated factual claims depend on model research; source links remain visible
so you can check them. No API key is embedded or required. Generation runs in
Codex's read-only sandbox with automatic command approvals disabled.

LIBRARY NAVIGATION
Search saved lessons by title or content and browse by category. The list shows up to 12 lessons at a time; choose Load more to reveal the next batch. Search and category filters cover the full library.
Use a lesson's Read later button to bookmark it, then open the Read later view.
Bookmarks persist in read-later.json beside the app; removing a bookmark does
not delete the lesson. Search and category filters work together in both views.

ADDED CATEGORIES
Ruby, React, Python, Fun Facts, History, Psychology, Science, Mythology, Coding, Anatomy, Animals, Philosophy. Existing categories are also available.
Coding lessons can include readable code blocks. Mythology distinguishes traditional
stories from historical evidence; philosophy distinguishes arguments from empirical facts.
