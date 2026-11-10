(() => {
  const $ = id => document.getElementById(id);
  let token = '', activeJob = null, speechRun = 0, paragraphs = [], paragraphIndex = 0, paused = false;
  const seen = new Set();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const status = message => { $('status').textContent = message; };
  const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

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
    const lines = markdown.split('\n'); let buffer = [], list = null;
    function flush() {
      if (!buffer.length) return;
      const paragraph = document.createElement('p'); appendInline(paragraph, buffer.join(' ')); parent.append(paragraph); buffer = [];
    }
    for (const line of lines) {
      if (/^# /.test(line)) continue;
      if (!line.trim()) { flush(); list = null; continue; }
      if (/^#{2,3} /.test(line)) {
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
  }

  function stopSpeech() {
    speechRun++; if (canSpeak) speechSynthesis.cancel(); paused = false;
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
    utterance.lang = 'en-US'; utterance.rate = Number($('rate').value);
    utterance.onend = () => { if (run === speechRun) { paragraphIndex++; speakNext(run); } };
    utterance.onerror = event => {
      if (run === speechRun && !['interrupted', 'canceled'].includes(event.error)) {
        stopSpeech(); status('Read aloud is unavailable in this browser. Try opening this page in Chrome or Safari.');
      }
    };
    speechSynthesis.speak(utterance);
  }

  function addLesson(lesson, newest = false) {
    if (seen.has(lesson.id)) return;
    seen.add(lesson.id);
    const article = document.createElement('article'); article.className = 'lesson';
    const meta = document.createElement('div'); meta.className = 'lesson-meta';
    meta.textContent = `${lesson.date} · ${lesson.category} · 5 min · Intermediate`;
    const title = document.createElement('h2'); title.className = 'lesson-title'; title.textContent = lesson.title;
    const actions = document.createElement('div'); actions.className = 'lesson-actions';
    const read = document.createElement('button'); read.type = 'button'; read.className = 'secondary'; read.textContent = 'Read aloud';
    if (!canSpeak) { read.disabled = true; read.textContent = 'Read aloud unavailable'; }
    const download = document.createElement('button'); download.type = 'button'; download.className = 'secondary'; download.textContent = 'Save Markdown';
    const details = document.createElement('details'); details.open = newest || seen.size === 1;
    const summary = document.createElement('summary'); summary.textContent = 'Read the lesson';
    const prose = document.createElement('div'); prose.className = 'prose'; renderMarkdown(lesson.markdown, prose);
    if (lesson.sources?.length && !/^## Sources/m.test(lesson.markdown)) {
      const heading = document.createElement('h2'); heading.textContent = 'Sources'; prose.append(heading);
      const sources = document.createElement('ul'); sources.className = 'sources';
      for (const source of lesson.sources) {
        const item = document.createElement('li'); const link = document.createElement('a');
        link.textContent = source.title; link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; item.append(link); sources.append(item);
      }
      prose.append(sources);
    }
    details.append(summary, prose); actions.append(read, download); article.append(meta, title, actions, details);
    if (newest) $('library').prepend(article); else $('library').append(article);
    $('lesson-count').textContent = `${seen.size} ${seen.size === 1 ? 'lesson' : 'lessons'}`;
    read.onclick = () => {
      stopSpeech(); details.open = true;
      paragraphs = [title, ...prose.querySelectorAll('h2,h3,p')].filter(el => el.textContent.trim());
      // The source list is visible but is not part of the narration.
      const sourcesHeading = paragraphs.findIndex(el => el.textContent === 'Sources');
      if (sourcesHeading >= 0) paragraphs = paragraphs.slice(0, sourcesHeading);
      paragraphIndex = 0; $('audio-title').textContent = lesson.title; $('audio-bar').hidden = false; speakNext(speechRun);
    };
    download.onclick = () => {
      let content = lesson.markdown;
      if (!/^## Sources/m.test(content)) content += '\n\n## Sources\n\n' + (lesson.sources || []).map(source => `- [${source.title}](${source.url})`).join('\n');
      const url = URL.createObjectURL(new Blob([content], {type:'text/markdown'}));
      const link = document.createElement('a'); link.href = url; link.download = `${lesson.date}-${lesson.id}.md`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    return article;
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
      const article = addLesson(job.lesson, true);
      status('Your new lesson is saved. Pick another category whenever curiosity strikes.');
      if (article) article.scrollIntoView({block:'start', behavior: reducedMotion ? 'auto' : 'smooth'});
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
  request('/api/library').then(data => {
    token = data.token; $('category').replaceChildren();
    for (const category of data.categories) { const option = document.createElement('option'); option.value = category; option.textContent = category; $('category').append(option); }
    data.lessons.sort((a, b) => (b.created_at || b.date).localeCompare(a.created_at || a.date)).forEach(lesson => addLesson(lesson));
    if (!data.lessons.length) { $('lesson-count').textContent = 'No lessons yet'; }
    busy(false); status('Choose a category for your next discovery.');
    if (data.active_job) { activeJob = data.active_job; busy(true); status('Research is still running. Your lesson will appear here when ready.'); poll(activeJob); }
  }).catch(error => { status(error.message + ' Start the local reader server, then reload.'); });
})();
