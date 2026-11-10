/* Small SVG illustrations are drawn locally; the model returns only labels and structure. */
window.createExplorer = ({request, getToken, renderMarkdown, readAloud, stopSpeech}) => {
  const $ = id => document.getElementById(id);
  const el = (tag, text, cls) => { const node = document.createElement(tag); if (text) node.textContent = text; if (cls) node.className = cls; return node; };
  let current = null, running = false;
  const ns = 'http://www.w3.org/2000/svg';
  function svgNode(tag, attrs = {}, text = '') {
    const node = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
    if (text) node.textContent = text;
    return node;
  }
  function icon(kind) {
    const svg = svgNode('svg', {viewBox:'0 0 64 64', 'aria-hidden':'true', class:'concept-icon'});
    const path = d => svg.append(svgNode('path', {d, fill:'none', stroke:'currentColor', 'stroke-width':3, 'stroke-linecap':'round', 'stroke-linejoin':'round'}));
    const circle = (cx,cy,r) => svg.append(svgNode('circle',{cx,cy,r, fill:'none',stroke:'currentColor','stroke-width':3}));
    if (kind === 'sun') { circle(32,32,13); for(let i=0;i<8;i++){const a=i*Math.PI/4;path(`M ${32+20*Math.cos(a)} ${32+20*Math.sin(a)} L ${32+26*Math.cos(a)} ${32+26*Math.sin(a)}`);} }
    else if(kind === 'planet'){circle(32,32,17);svg.append(svgNode('ellipse',{cx:32,cy:32,rx:29,ry:8,transform:'rotate(-25 32 32)',fill:'none',stroke:'currentColor','stroke-width':3}));}
    else if(kind === 'water') path('M32 7 C25 20 13 31 13 41 A19 19 0 0 0 51 41 C51 31 39 20 32 7 Z M23 43 Q24 50 32 51');
    else if(kind === 'leaf') path('M13 51 C0 17 35 9 54 10 C57 47 36 58 13 51 Z M10 56 L43 24 M27 39 L26 27 M27 39 L40 40');
    else if(kind === 'code') path('M22 15 L6 32 L22 49 M42 15 L58 32 L42 49 M37 10 L27 54');
    else if(kind === 'cloud') path('M16 49 A12 12 0 0 1 14 25 A18 18 0 0 1 48 24 A13 13 0 0 1 49 49 Z');
    else if(kind === 'light') {path('M23 44 C23 37 15 35 15 23 A17 17 0 0 1 49 23 C49 35 41 37 41 44 Z M24 51 L40 51 M27 57 L37 57');}
    else if(kind === 'atom') {circle(32,32,4); for(const a of [0,60,120])svg.append(svgNode('ellipse',{cx:32,cy:32,rx:26,ry:10,transform:`rotate(${a} 32 32)`,fill:'none',stroke:'currentColor','stroke-width':2}));}
    else if(kind === 'brain') path('M31 13 C20 1 12 14 16 20 C4 22 5 36 13 39 C8 51 20 58 31 50 Z M34 13 C45 1 53 14 49 20 C61 22 60 36 52 39 C57 51 45 58 34 50 Z M17 24 Q27 23 26 32 M14 40 Q25 36 25 45 M48 24 Q38 23 39 32 M51 40 Q40 36 40 45');
    else path('M10 19 L32 7 L54 19 L54 45 L32 57 L10 45 Z M10 19 L32 32 L54 19 M32 32 L32 57');
    return svg;
  }
  function astronomy(kind, caption) {
    const svg = svgNode('svg',{viewBox:kind==='solar'?'0 0 720 240':'0 0 720 280',role:'img','aria-label':caption,class:'space-picture'});
    svg.append(svgNode('rect',{width:720,height:280,rx:18,fill:'#111e32'}));
    for(let i=0;i<38;i++)svg.append(svgNode('circle',{cx:(i*137+19)%720,cy:(i*67+11)%240,r:i%3===0?1.5:0.7,fill:'#b6cae5',opacity:0.55}));
    if(kind==='solar'){
      const names=['Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'];
      const colors=['#ffc45b','#b1aaa2','#dbbd7b','#6aabe6','#cf775a','#d1aa88','#dece9d','#82c9d8','#6996e8'];
      const sizes=[34,5,10,11,8,25,22,16,16];
      names.forEach((name,i)=>{
        const x=46+i*78;
        svg.append(svgNode('circle',{cx:x,cy:110,r:sizes[i],fill:colors[i]}));
        if(i===6) svg.append(svgNode('ellipse',{cx:x,cy:110,rx:34,ry:9,fill:'none',stroke:'#d9c795','stroke-width':5,transform:`rotate(-20 ${x} 110)`}));
        svg.append(svgNode('text',{x,y:174,fill:'#e5edf8','text-anchor':'middle','font-size':13,'font-family':'system-ui'},name));
      });
      svg.append(svgNode('text',{x:360,y:212,fill:'#9dacc1','text-anchor':'middle','font-size':12,'font-family':'system-ui'},'ONE STAR · EIGHT PLANETS · COUNTLESS SMALLER WORLDS'));
    }else{
      svg.append(svgNode('ellipse',{cx:340,cy:145,rx:190,ry:90,fill:'none',stroke:'#537090','stroke-width':2,'stroke-dasharray':'5 6'}));
      svg.append(svgNode('circle',{cx:340,cy:145,r:29,fill:'#ffc45b'}));
      svg.append(svgNode('circle',{cx:530,cy:145,r:16,fill:'#74b5ed'}));
      svg.append(svgNode('path',{d:'M507 145 L383 145 M395 137 L383 145 L395 153',fill:'none',stroke:'#ffc45b','stroke-width':3}));
      svg.append(svgNode('path',{d:'M530 122 L530 32 M522 44 L530 32 L538 44',fill:'none',stroke:'#74b5ed','stroke-width':3}));
      [['Sun',340,195],['Planet',579,166],['Gravity',444,176],['Motion',580,52]].forEach(([text,x,y])=>svg.append(svgNode('text',{x,y,fill:'#e5edf8','text-anchor':'middle','font-size':15,'font-family':'system-ui'},text)));
    }
    return svg;
  }
  function draw(diagram) {
    const figure = el('figure', '', 'explore-figure');
    if(['solar','orbit'].includes(diagram.layout)) {
      const scroll = el('div','','space-scroll'); scroll.tabIndex=0; scroll.setAttribute('aria-label','Illustration; scroll horizontally on small screens'); scroll.append(astronomy(diagram.layout,diagram.caption)); figure.append(scroll);
    } else {
      const nodes = el('div','',`concept-map ${diagram.layout}`);
      diagram.nodes.forEach((part,i)=>{
        const node=el('div','','concept-node');
        node.append(icon(part.icon),el('strong',part.label),el('span',part.detail)); nodes.append(node);
        if(i < diagram.nodes.length-1 && diagram.layout !== 'compare') { const arrow=el('span','→','concept-arrow'); arrow.setAttribute('aria-hidden','true'); nodes.append(arrow); }
      });
      figure.append(nodes);
      if(diagram.layout==='cycle')figure.append(el('p','↶ The sequence repeats','cycle-note'));
    }
    figure.append(el('figcaption',diagram.caption)); return figure;
  }
  function busy(value) {
    running=value;
    ['explore-start','explore-topic','explore-continue','explore-paths'].forEach(id=>$(id).disabled=value);
    document.querySelectorAll('[data-explore-topic]').forEach(button=>button.disabled=value);
    $('explore-start').textContent=value?'Preparing a step…':'Start exploring';
    $('explore-continue').textContent=value?'Preparing a step…':'Continue →';
    $('explore-status').classList.toggle('working',value);
  }
  async function refreshPaths() {
    const {paths}=await request('/api/explore');
    $('explore-paths').replaceChildren(new Option('Choose a saved path…',''));
    for(const path of paths)$('explore-paths').append(new Option(`${path.topic} · ${path.steps} ${path.steps===1?'chapter':'chapters'}`,path.id));
    if(current)$('explore-paths').value=current.id;
    $('explore-resume').hidden=!paths.length;
  }
  function render(path, scroll=false) {
    stopSpeech(); current=path; $('explore-reader').hidden=false; $('explore-path-title').textContent=path.topic;
    $('explore-chapters').replaceChildren(); $('explore-progress').replaceChildren();
    path.steps.forEach((step,i)=>{
      const article=el('article','','explore-chapter'); article.id=`explore-step-${i}`;
      const meta=el('p',`CHAPTER ${String(i+1).padStart(2,'0')} · MEDIUM · 5 MIN READ`,'eyebrow');
      const heading=el('h3',step.title); heading.tabIndex=-1;
      const prose=el('div','','prose'); renderMarkdown(step.markdown,prose);
      const takeaway=el('div','','takeaway'); takeaway.append(el('strong','Keep this idea'),el('p',step.takeaway));
      const sources=el('div','','sources'); sources.append(el('strong','Read the sources'));
      for(const source of step.sources){const link=el('a',source.title);link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';sources.append(link);}
      const read=el('button','Read aloud','secondary');read.type='button';read.disabled=!('speechSynthesis' in window);
      read.onclick=()=>readAloud(step.title,[heading,...prose.querySelectorAll('h2,h3,p'),takeaway]);
      article.append(meta,heading,draw(step.diagram),prose,takeaway,sources,read);$('explore-chapters').append(article);
      const jump=el('button',String(i+1),'step-jump');jump.type='button';jump.setAttribute('aria-label',`Go to step ${i+1}: ${step.title}`);jump.onclick=()=>{heading.focus({preventScroll:true});article.scrollIntoView({behavior:'smooth',block:'start'});};$('explore-progress').append(jump);
    });
    $('explore-next').textContent=path.steps.length?`Up next: ${path.steps.at(-1).next}`:'Ready for your first step.';
    $('explore-continue').textContent=path.steps.length?'Continue →':'Retry first step';
    $('explore-reuse-note').textContent=path.topic==='Solar system' && path.steps.length<3?'The next starter step opens instantly. No generation needed.':'Continue adds one five-minute chapter. Saved chapters reopen instantly.';
    $('explore-export').disabled=!path.steps.length;
    if(scroll && !$('explore-panel').hidden && path.steps.length)$('explore-chapters').lastElementChild.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  async function finish(result) {
    render(result.path,true);
    $('explore-status').textContent=result.cached?'Opened instantly from your local collection.':'Your new step is ready and saved locally.';
    if($('explore-panel').hidden)$('view-explore').textContent='Explore · ready';
    await refreshPaths();
  }
  async function generate(endpoint,payload) {
    if(running)return;
    busy(true);$('explore-status').textContent='Checking sources and preparing one small, illustrated step. You can browse your library while it works.';
    let begun=Date.now();
    const timer=setInterval(()=>{$('explore-status').textContent=`Preparing one step · ${Math.floor((Date.now()-begun)/1000)}s. You can keep browsing.`;},1000);
    try {
      let result=await request(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Reader-Token':getToken()},body:JSON.stringify(payload)});
      while(result.status==='researching'){
        await new Promise(resolve=>setTimeout(resolve,2000));
        result=await request(`/api/explore/jobs/${result.id}`);
      }
      clearInterval(timer);
      if(result.status==='failed')throw new Error(result.error);
      await finish(result);
    }catch(error){clearInterval(timer);$('explore-status').textContent=error.message;}
    finally{clearInterval(timer);busy(false);if(current&&!current.steps.length)$('explore-continue').textContent='Retry first step';}
  }
  $('explore-form').onsubmit=event=>{event.preventDefault();generate('/api/explore',{topic:$('explore-topic').value.trim()});};
  $('explore-continue').onclick=()=>{if(current)generate('/api/explore/continue',{path_id:current.id,step:current.steps.length});};
  document.querySelectorAll('[data-explore-topic]').forEach(button=>button.onclick=()=>{$('explore-topic').value=button.dataset.exploreTopic;generate('/api/explore',{topic:button.dataset.exploreTopic});});
  $('explore-paths').onchange=async()=>{
    if(!$('explore-paths').value)return;
    try{const data=await request(`/api/explore/path/${$('explore-paths').value}`);render(data.path);$('explore-status').textContent='Saved steps loaded. No generation needed.';}
    catch(error){$('explore-status').textContent=error.message;}
  };
  $('explore-export').onclick=()=>{
    if(!current)return;
    const text=`# ${current.topic}\n\n`+current.steps.map((s,i)=>`## ${i+1}. ${s.title}\n\n${s.markdown}\n\n**Keep this idea:** ${s.takeaway}\n\n**Illustration:** ${s.diagram.caption}\n\n`+s.sources.map(x=>`- [${x.title}](${x.url})`).join('\n')).join('\n\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/markdown'}));const a=el('a');a.href=url;a.download=`learning-path-${current.id}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return {open:()=>{ $('view-explore').textContent='Explore'; refreshPaths().catch(error=>$('explore-status').textContent=error.message); }};
};
