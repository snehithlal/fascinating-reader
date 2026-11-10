(() => {
  const $ = id => document.getElementById(id);
  let token = '', activeJob = null, askJob = null, storyJob = null, speechRun = 0, paragraphs = [], paragraphIndex = 0, paused = false, speechLanguage = 'en-US', speechLessonId = null;
  const seen = new Set();
  const entries = new Map();
  let readLater = new Set(), libraryView = 'all', shownLimit = 12;
  const pageSize = 12;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const status = message => { $('status').textContent = message; };
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  function updateCategories() {
    const select = $('library-category'), selected = select.value;
    select.replaceChildren();
    const all = document.createElement('option'); all.value = ''; all.textContent = 'All categories'; select.append(all);
    const categories = [...new Set([...entries.values()].map(entry => entry.lesson.category))].sort();
    for (const category of categories) {
      const option = document.createElement('option'); option.value = category; option.textContent = category; select.append(option);
    }
    select.value = categories.includes(selected) ? selected : '';
  }
  function applyFilters() {
    const query = $('lesson-search').value.trim().toLocaleLowerCase(), category = $('library-category').value;
    const matching = [];
    for (const [id, entry] of entries) {
      const saved = readLater.has(id);
      const matches = (!category || entry.lesson.category === category) && (!query || entry.search.includes(query)) && (libraryView !== 'later' || saved);
      if (matches) matching.push([id, entry]);
      if (entry.bookmark) {
        entry.bookmark.textContent = saved ? 'Saved for later ✓' : 'Read later';
        entry.bookmark.setAttribute('aria-pressed', String(saved));
      }
    }
    const showing = Math.min(shownLimit, matching.length);
    matching.forEach(([, entry], index) => {
      if (index < showing) { renderLesson(entry); entry.article.hidden = false; }
      else if (entry.article) entry.article.hidden = true;
    });
    const matchSet = new Set(matching.map(([, entry]) => entry));
    for (const entry of entries.values()) if (!matchSet.has(entry) && entry.article) entry.article.hidden = true;
    $('lesson-count').textContent = matching.length > showing
      ? `Showing ${showing} of ${matching.length} matching · ${entries.size} total`
      : `${matching.length} ${matching.length === 1 ? 'lesson' : 'lessons'}`;
    $('load-more').hidden = showing >= matching.length;
    $('load-more').textContent = `Load ${Math.min(pageSize, matching.length - showing)} more lessons`;
    $('later-count').textContent = [...entries.keys()].filter(id => readLater.has(id)).length;
    $('library-empty').hidden = matching.length > 0;
    $('library-empty').textContent = libraryView === 'later' && ![...entries.keys()].some(id => readLater.has(id))
      ? 'Your read-later list is empty. Save a lesson from All lessons to come back to it.'
      : 'No lessons match. Try another search or category.';
    $('view-all').setAttribute('aria-pressed', String(libraryView === 'all'));
    $('view-later').setAttribute('aria-pressed', String(libraryView === 'later'));
  }


  function appendInline(parent, text) {
    const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
    let match, start = 0;
    while ((match = pattern.exec(text))) {
      parent.append(document.createTextNode(text.slice(start, match.index)));
      if (match[1]) {
        const link = document.createElement('a');
        link.textContent = match[1]; link.href = match[2]; link.target = '_blank'; link.rel = 'noopener noreferrer'; parent.append(link);
      } else if (match[3]) {
        const strong = document.createElement('strong'); strong.textContent = match[3]; parent.append(strong);
      } else {
        const inline = document.createElement(match[4] ? 'em' : 'code'); inline.textContent = match[4] || match[5]; parent.append(inline);
      }
      start = pattern.lastIndex;
    }
    parent.append(document.createTextNode(text.slice(start)));
  }

  function renderMarkdown(markdown, parent) {
    const lines = markdown.split('\n'); let buffer = [], list = null, code = null;
    function flush() {
      if (!buffer.length) return;
      const paragraph = document.createElement('p'); appendInline(paragraph, buffer.join(' ')); parent.append(paragraph); buffer = [];
    }
    for (const line of lines) {
      if (/^\s*```/.test(line)) {
        flush(); list = null;
        if (code === null) code = [];
        else {
          const block = document.createElement('pre'), content = document.createElement('code');
          content.textContent = code.join('\n'); block.append(content); parent.append(block); code = null;
        }
        continue;
      }
      if (code !== null) { code.push(line); continue; }
      if (/^# /.test(line)) continue;
      if (!line.trim()) { flush(); list = null; continue; }
      const image = /^!\[([^\]]+)\]\((https:\/\/upload\.wikimedia\.org\/[^\s)]+)\)$/.exec(line.trim());
      if (image) {
        flush(); list = null;
        const figure = document.createElement('figure'); figure.className = 'story-figure';
        const picture = document.createElement('img'); picture.src = image[2]; picture.alt = image[1]; picture.loading = 'lazy'; picture.decoding = 'async'; picture.referrerPolicy = 'no-referrer';
        picture.onerror = () => figure.remove();
        const caption = document.createElement('figcaption'); caption.textContent = image[1];
        figure.append(picture, caption); parent.append(figure);
      } else if (/^#{2,3} /.test(line)) {
        flush(); list = null; const heading = document.createElement(line.startsWith('###') ? 'h3' : 'h2');
        appendInline(heading, line.replace(/^#+ /, '')); parent.append(heading);
      } else if (/^> /.test(line)) {
        flush(); list = null; const quote = document.createElement('blockquote'); appendInline(quote, line.slice(2)); parent.append(quote);
      } else if (/^\s*[-*] /.test(line) || /^\d+\. /.test(line)) {
        flush(); const ordered = /^\d+\. /.test(line);
        if (!list || list.tagName !== (ordered ? 'OL' : 'UL')) { list = document.createElement(ordered ? 'ol' : 'ul'); parent.append(list); }
        const item = document.createElement('li'); appendInline(item, line.replace(/^\s*(?:[-*]|\d+\.) /, '')); list.append(item);
      } else { buffer.push(line.trim()); }
    }
    flush();
    if (code !== null) {
      const block = document.createElement('pre'), content = document.createElement('code');
      content.textContent = code.join('\n'); block.append(content); parent.append(block);
    }
  }

  function stopSpeech() {
    speechRun++; if (canSpeak) speechSynthesis.cancel(); paused = false; speechLessonId = null;
    document.querySelectorAll('.spoken').forEach(el => el.classList.remove('spoken'));
    $('audio-bar').hidden = true; $('pause').textContent = 'Pause'; paragraphs = [];
  }
  function speakNext(run) {
    if (run !== speechRun) return;
    document.querySelectorAll('.spoken').forEach(el => el.classList.remove('spoken'));
    if (paragraphIndex >= paragraphs.length) { stopSpeech(); return; }
    const element = paragraphs[paragraphIndex]; element.classList.add('spoken');
    element.scrollIntoView({block: 'center', behavior: reducedMotion ? 'auto' : 'smooth'});
    const utterance = new SpeechSynthesisUtterance(element.textContent);
    utterance.lang = speechLanguage; utterance.rate = Number($('rate').value);
    utterance.onend = () => { if (run === speechRun) { paragraphIndex++; speakNext(run); } };
    utterance.onerror = event => {
      if (run === speechRun && !['interrupted', 'canceled'].includes(event.error)) {
        stopSpeech(); status('Read aloud is unavailable in this browser. Try opening this page in Chrome or Safari.');
      }
    };
    speechSynthesis.speak(utterance);
  }

  function addLesson(lesson, newest = false, refresh = true) {
    if (seen.has(lesson.id)) return null;
    seen.add(lesson.id);
    const entry = {lesson, newest, article: null, bookmark: null, search: `${lesson.title} ${lesson.category} ${lesson.markdown}`.toLocaleLowerCase()};
    entries.set(lesson.id, entry);
    if (refresh) { updateCategories(); applyFilters(); }
    return entry;
  }

  function renderLesson(entry) {
    if (entry.article) return;
    const {lesson, newest} = entry;
    const article = document.createElement('article'); article.className = 'lesson';
    const meta = document.createElement('div'); meta.className = 'lesson-meta';
    meta.textContent = `${lesson.pick_label ? `${lesson.pick_label} · ` : ''}${lesson.date} · ${lesson.category} · ${lesson.reading_minutes || 5} min · Intermediate`;
    const title = document.createElement('h2'); title.className = 'lesson-title'; title.textContent = lesson.title;
    const actions = document.createElement('div'); actions.className = 'lesson-actions';
    const read = document.createElement('button'); read.type = 'button'; read.className = 'secondary'; read.textContent = 'Read aloud';
    if (!canSpeak) { read.disabled = true; read.textContent = 'Read aloud unavailable'; }
    const translate = document.createElement('button'); translate.type = 'button'; translate.className = 'secondary'; translate.textContent = 'Translate';
    translate.setAttribute('aria-label', `Translate to Malayalam: ${lesson.title}`);
    const download = document.createElement('button'); download.type = 'button'; download.className = 'secondary'; download.textContent = 'Save Markdown';
    const bookmark = document.createElement('button'); bookmark.type = 'button'; bookmark.className = 'secondary bookmark';
    bookmark.setAttribute('aria-label', `Read later: ${lesson.title}`);
    const details = document.createElement('details'); details.open = newest || entries.size === 1;
    const summary = document.createElement('summary'); summary.textContent = 'Read the lesson';
    const prose = document.createElement('div'); prose.className = 'prose';
    let currentContent = lesson, translation = null, showingTranslation = false;
    function displayContent(content, translated) {
      if (speechLessonId === lesson.id) stopSpeech();
      currentContent = content; showingTranslation = translated;
      title.textContent = content.title; title.lang = translated ? 'ml' : 'en'; prose.lang = translated ? 'ml' : 'en';
      prose.replaceChildren(); renderMarkdown(content.markdown, prose);
      const sourcesToShow = content.sources || lesson.sources || [];
      if (sourcesToShow.length && !/^## Sources/m.test(content.markdown)) {
        const heading = document.createElement('h2'); heading.className = 'sources-heading'; heading.textContent = translated ? 'ഉറവിടങ്ങൾ' : 'Sources'; prose.append(heading);
        const sources = document.createElement('ul'); sources.className = 'sources';
        for (const source of sourcesToShow) {
          const item = document.createElement('li'); const link = document.createElement('a');
          link.textContent = source.title; link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; item.append(link); sources.append(item);
        }
        prose.append(sources);
      }
      translate.textContent = translated ? 'Show original' : 'Translate';
      translate.setAttribute('aria-label', translated ? `Show original: ${lesson.title}` : `Translate to Malayalam: ${lesson.title}`);
    }
    displayContent(lesson, false);
    details.append(summary, prose); actions.append(read, translate, bookmark, download); article.append(meta, title, actions, details);
    if (newest) $('library').prepend(article); else $('library').append(article);
    entry.article = article; entry.bookmark = bookmark;
    const saved = readLater.has(lesson.id);
    bookmark.textContent = saved ? 'Saved for later ✓' : 'Read later';
    bookmark.setAttribute('aria-pressed', String(saved));
    bookmark.onclick = async () => {
      bookmark.disabled = true;
      try {
        const data = await request('/api/read-later', {method:'POST', headers:{'Content-Type':'application/json','X-Reader-Token':token}, body:JSON.stringify({id:lesson.id, saved:!readLater.has(lesson.id)})});
        readLater = new Set(data.read_later); applyFilters();
        $('library-status').textContent = readLater.has(lesson.id) ? `Saved for later: ${lesson.title}` : `Removed from read later: ${lesson.title}`;
      } catch (error) { $('library-status').textContent = error.message; }
      finally { bookmark.disabled = false; }
    };
    translate.onclick = async () => {
      if (translation) { displayContent(showingTranslation ? lesson : translation, !showingTranslation); return; }
      translate.disabled = true; translate.textContent = 'Translating…';
      $('library-status').textContent = `Translating “${lesson.title}” into Malayalam. You can keep reading while it works.`;
      try {
        let job = await request('/api/translate', {method:'POST', headers:{'Content-Type':'application/json','X-Reader-Token':token}, body:JSON.stringify({id:lesson.id})});
        while (job.status !== 'complete') {
          if (job.status === 'failed') throw new Error(job.error || 'The translation could not be completed.');
          await new Promise(resolve => setTimeout(resolve, 1800));
          job = await request(`/api/translation-jobs/${job.id}`);
        }
        translation = job.translation; displayContent(translation, true);
        $('library-status').textContent = `Malayalam translation ready: ${lesson.title}. Choose Show original any time to switch back.`;
      } catch (error) {
        $('library-status').textContent = error.message; translate.textContent = 'Translate';
      } finally { translate.disabled = false; }
    };
    read.onclick = () => {
      speechLanguage = showingTranslation ? 'ml-IN' : 'en-US';
      stopSpeech(); speechLessonId = lesson.id; details.open = true;
      paragraphs = [title, ...prose.querySelectorAll('h2,h3,p')].filter(el => el.textContent.trim());
      const sourcesHeading = paragraphs.findIndex(el => el.classList.contains('sources-heading'));
      if (sourcesHeading >= 0) paragraphs = paragraphs.slice(0, sourcesHeading);
      paragraphIndex = 0; $('audio-title').textContent = lesson.title; $('audio-bar').hidden = false; speakNext(speechRun);
    };
    download.onclick = () => {
      let content = currentContent.markdown;
      const sourceLabel = showingTranslation ? 'ഉറവിടങ്ങൾ' : 'Sources';
      if (!/^## Sources/m.test(content)) content += `\n\n## ${sourceLabel}\n\n` + (currentContent.sources || lesson.sources || []).map(source => `- [${source.title}](${source.url})`).join('\n');
      const url = URL.createObjectURL(new Blob([content], {type:'text/markdown'}));
      const link = document.createElement('a'); link.href = url; link.download = `${lesson.date}-${lesson.id}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }


  async function request(path, options = {}) {
    const response = await fetch(path, options); const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'The reader could not complete that request.');
    return data;
  }
  function busy(value) { $('generate').disabled = value; $('category').disabled = value; $('generate').textContent = value ? 'Researching…' : 'Research a new lesson ↗'; }
  async function poll(id) {
    try {
      const job = await request(`/api/jobs/${id}`);
      if (job.status === 'researching') { setTimeout(() => poll(id), 2000); return; }
      activeJob = null; busy(false);
      if (job.status === 'failed') { status(job.error); return; }
      addLesson(job.lesson, true);
      status(job.lesson.pick_label
        ? `${job.lesson.pick_label} is ready and saved at the top of All lessons: ${job.lesson.title}.`
        : 'Research complete. Your new lesson is saved at the top of All lessons. Your current search and reading position are unchanged.');
    } catch (error) { activeJob = null; busy(false); status(error.message + ' Reload to reconnect to any research still running.'); }
  }
  $('generate-form').onsubmit = async event => {
    event.preventDefault(); if (activeJob) return; busy(true);
    status('Researching sources and writing your lesson. You can read previous lessons while you wait.');
    try {
      const job = await request('/api/generate', {method:'POST', headers:{'Content-Type':'application/json','X-Reader-Token':token}, body:JSON.stringify({category:$('category').value})});
      activeJob = job.id; poll(job.id);
    } catch (error) { busy(false); status(error.message); }
  };

  function showLibraryView(view) {
    stopSpeech();
    libraryView = view;
    $('ask-panel').hidden = view !== 'ask';
    $('story-panel').hidden = view !== 'storyteller';
    $('library-content').hidden = ['ask','explore','storyteller'].includes(view);
    $('explore-panel').hidden = view !== 'explore';
    document.querySelector('.intro').hidden = ['explore','storyteller'].includes(view);
    $('lesson-count').hidden = ['ask','explore','storyteller'].includes(view);
    $('view-explore').setAttribute('aria-pressed', String(view === 'explore'));
    if (view === 'explore') explorer.open();
    $('view-all').setAttribute('aria-pressed', String(view === 'all'));
    $('view-later').setAttribute('aria-pressed', String(view === 'later'));
    $('view-ask').setAttribute('aria-pressed', String(view === 'ask'));
    $('view-storyteller').setAttribute('aria-pressed', String(view === 'storyteller'));
    if (['all','later'].includes(view)) { shownLimit = pageSize; applyFilters(); }
  }

  function renderTemporaryLesson(lesson, jobId, story = false) {
    const prefix = story ? 'story' : 'ask';
    const preview = $(`${prefix}-preview`); preview.replaceChildren();
    const article = document.createElement('article'); article.className = 'lesson ask-lesson';
    const meta = document.createElement('div'); meta.className = 'lesson-meta'; meta.textContent = `${lesson.date} · ${story ? 'Storyteller' : 'Ask anything'} · ${lesson.reading_minutes || 5} min`;
    const title = document.createElement('h2'); title.className = 'lesson-title'; title.textContent = lesson.title;
    const actions = document.createElement('div'); actions.className = 'lesson-actions';
    const read = document.createElement('button'); read.type = 'button'; read.className = 'secondary'; read.textContent = canSpeak ? 'Read aloud' : 'Read aloud unavailable'; read.disabled = !canSpeak;
    const save = document.createElement('button'); save.type = 'button'; save.className = 'secondary save-ask'; save.textContent = 'Save to library';
    const discard = document.createElement('button'); discard.type = 'button'; discard.className = 'secondary'; discard.textContent = 'Discard';
    const details = document.createElement('details'); details.open = true;
    const summary = document.createElement('summary'); summary.textContent = story ? 'Read the story' : 'Read the lesson';
    const prose = document.createElement('div'); prose.className = 'prose'; renderMarkdown(lesson.markdown, prose);
    if (lesson.sources?.length && !/^## Sources/m.test(lesson.markdown)) {
      const heading = document.createElement('h2'); heading.className = 'sources-heading'; heading.textContent = 'Sources'; prose.append(heading);
      const sources = document.createElement('ul'); sources.className = 'sources';
      for (const source of lesson.sources) {
        const item = document.createElement('li'), link = document.createElement('a');
        link.textContent = source.title; link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; item.append(link); sources.append(item);
      }
      prose.append(sources);
    }
    details.append(summary, prose); actions.append(read, save, discard); article.append(meta, title, actions, details); preview.append(article);
    read.onclick = () => {
      stopSpeech(); speechLessonId = jobId; speechLanguage = 'en-US';
      paragraphs = [title, ...prose.querySelectorAll('h2,h3,p')].filter(el => el.textContent.trim());
      const sourceHeading = paragraphs.findIndex(el => el.classList.contains('sources-heading'));
      if (sourceHeading >= 0) paragraphs = paragraphs.slice(0, sourceHeading);
      paragraphIndex = 0; $('audio-title').textContent = lesson.title; $('audio-bar').hidden = false; speakNext(speechRun);
    };
    save.onclick = async () => {
      save.disabled = true; save.textContent = 'Saving…';
      try {
        const result = await request(story ? '/api/save-story' : '/api/save-ask', {method:'POST', headers:{'Content-Type':'application/json','X-Reader-Token':token}, body:JSON.stringify({job_id:jobId})});
        addLesson(result.lesson, true, false); updateCategories();
        if (['all','later'].includes(libraryView)) applyFilters();
        save.textContent = 'Saved to library ✓'; discard.textContent = 'Close preview';
        $(`${prefix}-status`).textContent = story ? 'Story saved. It will stay in your reading trail after refresh.' : 'Saved. This lesson will stay in your library after refresh.';
      } catch (error) { save.disabled = false; save.textContent = 'Save to library'; $(`${prefix}-status`).textContent = error.message; }
    };
    discard.onclick = () => { stopSpeech(); preview.replaceChildren(); $(`${prefix}-status`).textContent = story ? 'Story preview closed.' : 'Temporary lesson discarded.'; };
  }

  function renderAskLesson(lesson, jobId) { renderTemporaryLesson(lesson, jobId, false); }

  async function pollAsk(id) {
    try {
      const job = await request(`/api/ask-jobs/${id}`);
      if (job.status === 'researching') { setTimeout(() => pollAsk(id), 2000); return; }
      askJob = null; $('ask-submit').disabled = false; $('ask-prompt').disabled = false; $('ask-submit').textContent = 'Create temporary lesson';
      if (job.status === 'failed') { $('ask-status').textContent = job.error; return; }
      renderAskLesson(job.lesson, id);
      $('ask-status').textContent = 'Temporary lesson ready. Save it to your library if you want to keep it after refresh.';
      if (libraryView !== 'ask') $('library-status').textContent = 'Your temporary lesson is ready in Ask anything. Save it there if you want to keep it.';
    } catch (error) {
      askJob = null; $('ask-submit').disabled = false; $('ask-prompt').disabled = false; $('ask-submit').textContent = 'Create temporary lesson';
      $('ask-status').textContent = error.message;
    }
  }

  $('ask-form').onsubmit = async event => {
    event.preventDefault(); if (askJob) return;
    const prompt = $('ask-prompt').value.trim();
    if (prompt.length < 5 || prompt.length > 500) { $('ask-status').textContent = 'Enter a question or topic between 5 and 500 characters.'; $('ask-prompt').focus(); return; }
    $('ask-submit').disabled = true; $('ask-prompt').disabled = true; $('ask-submit').textContent = 'Researching…';
    $('ask-preview').replaceChildren(); $('ask-status').textContent = 'Researching your question and writing a temporary lesson. You can browse saved lessons while it works.';
    try {
      const job = await request('/api/ask', {method:'POST', headers:{'Content-Type':'application/json','X-Reader-Token':token}, body:JSON.stringify({prompt})});
      askJob = job.id; pollAsk(job.id);
    } catch (error) {
      $('ask-submit').disabled = false; $('ask-prompt').disabled = false; $('ask-submit').textContent = 'Create temporary lesson'; $('ask-status').textContent = error.message;
    }
  };

  const explorer = window.createExplorer({request, getToken:()=>token, renderMarkdown, stopSpeech,
    readAloud:(title, elements)=>{
      stopSpeech(); speechLanguage='en-US'; paragraphs=elements;
      paragraphIndex=0; $('audio-title').textContent=title; $('audio-bar').hidden=false; speakNext(speechRun);
    }});
  $('view-explore').onclick=()=>showLibraryView('explore');
  $('view-storyteller').onclick=()=>showLibraryView('storyteller');

  $('story-create-prompt').onclick = async () => {
    if (!$('story-form').reportValidity()) return;
    const topic = $('story-topic').value.trim();
    $('story-create-prompt').disabled = true;
    $('story-prompt-status').textContent = 'Preparing your reusable prompt…';
    try {
      const data = await request('/api/story-prompt', {method:'POST', headers:{'Content-Type':'application/json','X-Reader-Token':token}, body:JSON.stringify({topic})});
      if (topic !== $('story-topic').value.trim()) return;
      $('story-prompt-output').value = data.prompt;
      $('story-prompt-panel').hidden = false; $('story-prompt-panel').open = true;
      $('story-prompt-status').textContent = `Prompt ready for “${topic}”. Copy it to use elsewhere.`;
    } catch (error) { $('story-prompt-status').textContent = error.message; }
    finally { $('story-create-prompt').disabled = false; }
  };

  $('story-copy-prompt').onclick = async () => {
    const output = $('story-prompt-output');
    try {
      await navigator.clipboard.writeText(output.value);
      $('story-prompt-status').textContent = 'Prompt copied. Paste it into your preferred AI app.';
    } catch {
      output.focus(); output.select();
      $('story-prompt-status').textContent = 'Select Copy from your browser menu, or press Ctrl+C (Command+C on Mac), to copy the selected prompt.';
    }
  };

  $('story-topic').addEventListener('input', () => {
    $('story-prompt-panel').hidden = true;
    $('story-prompt-output').value = '';
    $('story-prompt-status').textContent = '';
  });

  async function pollStory(id) {
    try {
      const job = await request(`/api/story-jobs/${id}`);
      if (job.status === 'researching') { setTimeout(() => pollStory(id), 2500); return; }
      storyJob = null; $('story-submit').disabled = false; $('story-topic').disabled = false; $('story-submit').textContent = 'Write my story';
      if (job.status === 'failed') { $('story-status').textContent = job.error; return; }
      renderTemporaryLesson(job.lesson, id, true);
      $('story-status').textContent = 'Your story is ready. Save it to your reading trail to keep it after refresh.';
    } catch (error) {
      storyJob = null; $('story-submit').disabled = false; $('story-topic').disabled = false; $('story-submit').textContent = 'Write my story';
      $('story-status').textContent = error.message;
    }
  }

  $('story-form').onsubmit = async event => {
    event.preventDefault(); if (storyJob) return;
    const topic = $('story-topic').value.trim();
    if (topic.length < 2 || topic.length > 240) { $('story-status').textContent = 'Enter a topic between 2 and 240 characters.'; $('story-topic').focus(); return; }
    $('story-submit').disabled = true; $('story-topic').disabled = true; $('story-submit').textContent = 'Researching…';
    $('story-preview').replaceChildren(); $('story-status').textContent = 'Researching the story and checking sources and image links. This detailed reading journey may take a few minutes.';
    try {
      const job = await request('/api/story', {method:'POST', headers:{'Content-Type':'application/json','X-Reader-Token':token}, body:JSON.stringify({topic})});
      storyJob = job.id; pollStory(job.id);
    } catch (error) {
      $('story-submit').disabled = false; $('story-topic').disabled = false; $('story-submit').textContent = 'Write my story'; $('story-status').textContent = error.message;
    }
  };

  $('pause').onclick = () => {
    if (!canSpeak) return;
    paused = !paused; if (paused) speechSynthesis.pause(); else speechSynthesis.resume();
    $('pause').textContent = paused ? 'Resume' : 'Pause';
  };
  $('stop').onclick = stopSpeech;
  $('rate').onchange = () => {
    if (!paragraphs.length) return;
    speechRun++; speechSynthesis.cancel(); paused = false; $('pause').textContent = 'Pause'; speakNext(speechRun);
  };
  window.addEventListener('pagehide', stopSpeech);
  $('lesson-search').oninput = () => { stopSpeech(); shownLimit = pageSize; applyFilters(); };
  $('library-category').onchange = () => { stopSpeech(); shownLimit = pageSize; applyFilters(); };
  $('view-all').onclick = () => showLibraryView('all');
  $('view-later').onclick = () => showLibraryView('later');
  $('view-ask').onclick = () => showLibraryView('ask');
  $('load-more').onclick = () => { shownLimit += pageSize; applyFilters(); };
  request('/api/library').then(data => {
    token = data.token; readLater = new Set(data.read_later || []); $('category').replaceChildren();
    const orderedCategories = data.categories.filter(category => category !== 'Surprise me').sort((a, b) => a.localeCompare(b));
    if (data.categories.includes('Surprise me')) orderedCategories.unshift('Surprise me');
    for (const category of orderedCategories) { const option = document.createElement('option'); option.value = category; option.textContent = category; $('category').append(option); }
    data.lessons.sort((a, b) => (b.created_at || b.date).localeCompare(a.created_at || a.date)).forEach(lesson => addLesson(lesson, false, false));
    updateCategories(); applyFilters();
    busy(false); status('Choose a category for your next discovery.');
    const pick = data.featured_pick;
    if (pick?.status === 'researching' && pick.job_id) {
      activeJob = pick.job_id; busy(true); status(`Creating your ${pick.pick_label.toLocaleLowerCase()}. You can browse your library while it works.`); poll(activeJob);
    } else if (pick?.status === 'ready') {
      const pickedLesson = data.lessons.find(lesson => lesson.id === pick.lesson_id);
      status(`${pick.pick_label} is ready${pickedLesson ? `: ${pickedLesson.title}` : ''}. It is saved in your reading trail.`);
    } else if (pick?.status === 'failed') {
      status(`${pick.pick_label} could not be created: ${pick.error}`);
    } else if (data.active_job) {
      activeJob = data.active_job; busy(true); status('Research is still running. Your lesson will appear here when ready.'); poll(activeJob);
    }
  }).catch(error => { status(error.message + ' Start the local reader server, then reload.'); });
})();
