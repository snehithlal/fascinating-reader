# Reading, exploring, and storytelling

[← Back to README](../README.md)

## Lessons and your reading trail

Choose a category and select **Research a new lesson**. The app researches a five-minute lesson with Codex and saves it automatically. You can read saved content while research runs. Categories cover history, science, technology, coding, psychology, mythology, and more.

Search by title or content, filter by category, and choose **Load more** to reveal more than the first 12 lessons. **Read later** bookmarks a lesson; removing a bookmark keeps the lesson in your library. Bookmarks persist in `data/read-later.json`.

Saved lessons have unique JSON and Markdown files in `data/lessons/`. Generating multiple lessons in a day preserves earlier ones. This library is independent of the Meraki daily collection.

## Featured picks

At startup or when the library opens, the app checks whether a pick exists for the current period:

- An ordinary day gets a daily pick.
- Friday gets a weekly pick.
- The final day of a month gets a monthly pick, including when that day is Friday.

Saved period keys prevent duplicate picks across restarts. A failed pick does not retry on every refresh; a later server restart can retry it.

## Ask anything

Enter a question or topic to create a temporary five-minute lesson. Select **Save to library** to keep it. Unsaved results disappear from the page when you refresh and are unavailable after a server restart.

## Explore

Explore teaches a topic through short illustrated steps at a consistent Medium level. Start from the basics, then select **Continue** to learn the next idea. Each step includes a diagram and sources.

The solar-system starter has three bundled steps that use no model calls. Other topics and later steps use a research call per click. The illustrations are local vector drawings and concept diagrams.

Paths save automatically in `data/learning-paths/`. Reopen them using the saved-path selector. Revisiting completed steps uses no generation. Duplicate Continue requests reuse existing work. **Save Markdown** exports text, source links, and diagram captions; the app retains the illustrations.

## Storyteller

Name a person, event, discovery, or subject to create an immersive learning journey. Stories cover background, chronological chapters, consequences, a timeline, key lessons, five review questions, sources, and three related topics. Captioned Wikimedia images distinguish evidence from later depictions and reconstructions.

Stories typically take 10–15 minutes to read. Select **Save to library** to keep a story in the reading trail; previews are temporary.

To reuse the learning style elsewhere, enter a topic and select **Create reusable prompt**, then **Copy prompt**. This creates the prompt without calling Codex or using its allowance. Research and image support depend on the AI app you paste it into. The shared master instructions are in [`resources/prompts/storyteller-prompt.txt`](../resources/prompts/storyteller-prompt.txt).

## Translation, audio, and export

**Translate** creates a separate Malayalam version of a saved lesson. **Show original** switches back. Translations are stored in `data/translations/`.

**Read aloud** uses browser voices, with pause, resume, stop, and speed controls. Paragraphs highlight as they are read. Voice availability depends on the browser and operating system.

**Save Markdown** downloads a saved lesson with its sources. Check source links when you want to verify generated factual claims; mythology and disputed subjects should distinguish tradition, interpretation, and evidence.
