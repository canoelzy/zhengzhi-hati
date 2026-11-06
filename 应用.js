'use strict';
const BANK = window.QUESTION_BANK;
const KEY = 'politics-693-progress-v1';
const SUBJECTS = ['马原', '毛中特', '新思想', '史纲', '思修'];
const NAMES = {马原:'马克思主义基本原理',毛中特:'毛泽东思想和中国特色社会主义理论体系概论',新思想:'习近平新时代中国特色社会主义思想概论',史纲:'中国近现代史纲要',思修:'思想道德与法治'};
const MODES = {sequential:'顺序练习',random:'随机练习',wrong:'错题重练',star:'我的收藏',pending:'答案待核对'};
const ICONS = {book:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4V4Zm9 3a3 3 0 0 1 3-3h5v15h-5a4 4 0 0 0-3 2',list:'M8 5h12M8 12h12M8 19h12M3 5h.01M3 12h.01M3 19h.01',shuffle:'m17 3 4 4-4 4M3 7h4c5 0 5 10 10 10h4m-4-4 4 4-4 4M3 17h4c2 0 3-2 5-5m3-4 2-1h4',wrong:'M9 9l6 6m0-6-6 6M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z',grid:'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',arrow:'m9 5 7 7-7 7',check:'m5 12 4 4L19 6',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6',cloud:'M5 17a5 5 0 0 1 0-10 7 7 0 0 1 13-1 5 5 0 0 1 0 11M9 13l3 3 5-5',settings:'M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',close:'m6 6 12 12M6 18 18 6'};
function icon(name) {return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ? `<path d="${ICONS[name]}"/>` : ''}</svg>`;}
function esc(value) {return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
let saved = {};
let storageAvailable = true;
try {saved = JSON.parse(localStorage.getItem(KEY) || '{}');} catch {storageAvailable = false;}
let {records, favorites} = Quiz.cleanProgress(saved);
let filters = {subject:'', chapter:'', type:'', query:'', mode:'sequential', ...(saved.filters || {})};
if (!MODES[filters.mode]) filters.mode = 'sequential';
if (filters.subject && !SUBJECTS.includes(filters.subject)) filters.subject = '';
let queue = [], position = 0, chosen = [], submitted = false, revealed = false;
let dialog = '', toastTimer, searchTimer;
const pendingCount = BANK.filter(q => !q.answer.length).length;
const app = document.getElementById('app');
function current() {return queue[position];}
function save() {
  try {localStorage.setItem(KEY, JSON.stringify({version:1, records, favorites, filters, lastId:current()?.id}));storageAvailable=true;}
  catch {storageAvailable=false;}
}
function toast(message) {
  const el = document.getElementById('toast'); el.textContent = message; el.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('visible'), 2800);
}
function makeQueue(restoreId) {
  queue = Quiz.selectQuestions(filters, records, favorites);
  if (filters.mode === 'random') queue = Quiz.shuffle(queue);
  position = Math.max(0, queue.findIndex(q => q.id === restoreId));
  resetAttempt();save();render();
}
function resetAttempt() {chosen=[];submitted=false;revealed=false;}
function navigate(index) {
  if (index < 0 || index >= queue.length) return;
  position=index;resetAttempt();save();render();
  document.getElementById('question-title')?.focus({preventScroll:true});
  if (window.innerWidth < 800) document.getElementById('question-panel')?.scrollIntoView({behavior:'smooth',block:'start'});
}
function choose(letter) {
  if (submitted || revealed || !current()) return;
  if (current().type === '单选') {chosen=[letter];submit();}
  else {chosen=chosen.includes(letter) ? chosen.filter(k => k !== letter) : [...chosen,letter].sort();renderQuestion();}
}
function submit() {
  const q=current();if (!q || submitted || revealed || !chosen.length) return;
  if (q.type==='多选' && chosen.length < 2) {toast('多选题请至少选择两个选项');return;}
  submitted=true;
  records[q.id]={chosen:[...chosen], correct:Quiz.grade(q,chosen), attempts:(records[q.id]?.attempts || 0)+1, at:new Date().toISOString()};
  save();render();
}
function toggleStar() {
  const q=current();if (!q) return;
  favorites=favorites.includes(q.id) ? favorites.filter(id => id!==q.id) : [...favorites,q.id];
  save();render();toast(favorites.includes(q.id)?'已加入收藏':'已取消收藏');
}
function setMode(mode) {filters.mode=mode;filters.query='';makeQueue();}
function render() {
  const stats=Quiz.statistics(records);
  const activeCount=Quiz.selectQuestions({...filters,mode:'sequential'},records,favorites).length;
  app.innerHTML=`
  <aside class="sidebar">
    <a class="brand" href="#" aria-label="帽子题刷题室首页"><span class="brand-mark">${icon('book')}</span><span>帽子题<span class="brand-sub">政治刷题室</span></span></a>
    <div class="nav-label">我的练习</div>
    <nav class="main-nav" aria-label="练习模式">${['sequential','random','wrong','star'].map((m,i)=>`<button data-mode="${m}" class="nav-item ${filters.mode===m?'active':''}">${icon(['list','shuffle','wrong','star'][i])}<span>${MODES[m]}</span>${i>1?`<span class="nav-count">${i===2?stats.wrong:favorites.length}</span>`:''}</button>`).join('')}</nav>
    <div class="nav-label subject-label">科目题库 <span>693 题</span></div>
    <nav class="subject-nav" aria-label="科目筛选"><button data-subject="" class="subject-item ${!filters.subject?'active':''}"><span class="subject-dot all"></span>全部科目<span>693</span></button>${SUBJECTS.map((s,i)=>`<button data-subject="${s}" class="subject-item ${filters.subject===s?'active':''}"><span class="subject-dot color-${i}"></span>${s}<span>${BANK.filter(q=>q.subject===s).length}</span></button>`).join('')}</nav>
    <div class="side-note"><span class="small-caps">一点一滴，稳步向前</span><p>今天多掌握一道，<br>考场上就多一分底气。</p><div class="tiny-track"><i style="width:${stats.done/BANK.length*100}%"></i></div><span>已练 ${stats.done} / 693 题</span></div>
    <button class="sidebar-bottom" data-action="settings">${icon('settings')} 数据与题库说明</button>
  </aside>
  <main>
    <header class="topbar"><div class="crumb"><span>2027 考研政治</span><span class="slash">/</span><strong>帽子题专项练习</strong></div><span class="save-status">${icon('cloud')}${storageAvailable?'进度已在本机保存':'当前浏览器无法保存'}</span></header>
    <div class="page">
      <section class="page-heading"><div><div class="eyebrow">每天一点，把知识变成底气</div><h1>${MODES[filters.mode]}</h1><p>${filters.subject?NAMES[filters.subject]:'从 693 道精选原题开始，保持自己的复习节奏。'}</p></div><button class="outline map-trigger" data-action="map">${icon('grid')} 答题卡</button></section>
      <section class="stats" aria-label="全部题库练习统计"><div><span>已练习</span><strong>${stats.done}<small> / 693</small></strong><div class="stat-line"><i style="width:${stats.done/693*100}%"></i></div></div><div><span>当前正确率</span><strong>${stats.accuracy===null?'—':stats.accuracy+'%'}<small>按最近作答</small></strong></div><div><span>待巩固错题</span><strong class="warm">${stats.wrong}<small>题</small></strong></div><div><span>我的收藏</span><strong>${favorites.length}<small>题</small></strong></div></section>
      <section class="workspace">
        <div class="practice-area"><div class="filter-bar"><div class="filters"><label class="sr-only" for="subject-select">科目</label><select id="subject-select"><option value="">全部科目</option>${SUBJECTS.map(s=>`<option ${filters.subject===s?'selected':''}>${s}</option>`).join('')}</select><label class="sr-only" for="chapter-select">章节</label><select id="chapter-select" ${!filters.subject?'disabled':''}><option value="">全部章节</option>${chapterOptions()}</select><label class="sr-only" for="type-select">题型</label><select id="type-select"><option value="">全部题型</option>${['单选','多选'].map(t=>`<option ${filters.type===t?'selected':''}>${t}</option>`).join('')}</select></div><div class="search">${icon('search')}<input id="search-input" aria-label="搜索题干、选项或原题号" placeholder="搜索题干 / 题号" value="${esc(filters.query)}"></div></div>
        <div id="question-panel"></div>
        <div class="under-card"><span>${icon('cloud')} 练习记录保存在当前浏览器，可在“数据与题库说明”中备份。</span><span class="keyboard">快捷键 <kbd>1</kbd>–<kbd>4</kbd> 选项 · <kbd>Enter</kbd> 提交 / 下一题</span></div>
        </div>
        <aside class="right-rail"><section class="overview"><div class="rail-title"><h2>本轮进度</h2><span>${queue.length} 题</span></div><div class="ring" style="--progress:${queue.length?queue.filter(q=>records[q.id]).length/queue.length*100:0}%"><div><strong>${queue.filter(q=>records[q.id]).length}</strong><span>已练习</span></div></div><div class="legend"><span><i class="green"></i>正确 ${queue.filter(q=>records[q.id]?.correct===true).length}</span><span><i class="red"></i>待巩固 ${queue.filter(q=>records[q.id]?.correct===false).length}</span></div><button class="outline full" data-action="map">展开答题卡 ${icon('arrow')}</button></section>
        <section class="tip"><span class="tip-tag">练习小贴士</span><h3>多选题，选全才算对。</h3><p>先判断每个选项，再核对关键词。答错的题会自动进入错题本，答对后移出。</p><div>原题号与章节均已保留</div></section>
        <button class="pending-link" data-mode="pending">${icon('settings')} ${pendingCount} 题答案待核对 ${icon('arrow')}</button></aside>
      </section>
      <footer><span>帽子题 · 政治刷题室 <button data-action="settings">数据与题库说明</button></span><span>366 道单选 · 327 道多选 · 5 门科目</span></footer>
    </div>
  </main><div id="dialog-root"></div>`;
  renderQuestion();bind();if(dialog) renderDialog();
}
function chapterOptions() {
  const chapters=[...new Set(BANK.filter(q=>q.subject===filters.subject).map(q=>q.chapter))];
  return chapters.map(c=>{const q=BANK.find(q=>q.subject===filters.subject&&q.chapter===c);return `<option value="${c}" ${String(filters.chapter)===String(c)?'selected':''}>${esc(q.chapterTitle)}</option>`;}).join('');
}
function renderQuestion() {
  const el=document.getElementById('question-panel');const q=current();
  if (!q) {
    const empty=filters.mode==='wrong'?'这里还没有待巩固的错题':filters.mode==='star'?'把值得再看的题收藏起来':'没有符合筛选条件的题目';
    el.innerHTML=`<section class="question-card empty"><span class="empty-icon">${icon(filters.mode==='wrong'?'check':filters.mode==='star'?'star':'search')}</span><h2>${empty}</h2><p>${filters.mode==='wrong'?'答错的题会自动收录在这里。':filters.mode==='star'?'点击题目右上方的星标，即可加入收藏。':'试试其他科目、章节或关键词。'}</p><button class="primary" data-action="reset-filters">开始全部题库练习</button></section>`;
    el.querySelector('[data-action]').onclick=()=>{filters={subject:'',chapter:'',type:'',query:'',mode:'sequential'};makeQueue();};return;
  }
  const show=submitted||revealed, result=submitted?Quiz.grade(q,chosen):undefined;
  el.innerHTML=`<article class="question-card"><div class="question-top"><div class="badges"><span class="type-badge ${q.type==='多选'?'multi':''}">${q.type}题</span><span class="question-source">${q.subject} · ${esc(q.chapterTitle.split(' ')[0])}</span>${!q.answer.length?'<span class="pending-badge">答案待核对</span>':''}</div><button class="bookmark ${favorites.includes(q.id)?'is-starred':''}" aria-label="${favorites.includes(q.id)?'取消收藏':'收藏本题'}" aria-pressed="${favorites.includes(q.id)}" data-action="star">${icon('star')}</button></div>
    <div class="question-number"><span>第 <b>${position+1}</b> / ${queue.length} 题</span><span>原题 ${q.number} · 试题分册 P${q.sourcePages.join('、')}</span></div>
    <h2 id="question-title" tabindex="-1">${esc(q.stem)}</h2><p class="question-help">${q.type==='单选'?'选择一个正确答案，点击后立即判定。':'选择所有正确答案，选完后点击“确认答案”。'}</p>
    <div class="options" role="group" aria-label="答案选项">${Object.entries(q.options).map(([key,text])=>{
      const picked=chosen.includes(key);let status='';let mark='';
      if (show&&q.answer.length&&q.answer.includes(key)) {status='correct';mark='正确选项';}
      else if (submitted&&picked&&q.answer.length) {status='incorrect';mark='你的选择';}
      else if(picked) status='selected';
      return `<button class="option ${status}" data-option="${key}" aria-pressed="${picked}" ${show?'disabled':''}><span class="option-letter">${key}</span><span class="option-text">${esc(text)}</span>${mark?`<span class="option-mark">${status==='correct'?icon('check'):icon('close')}<span>${mark}</span></span>`:''}</button>`;
    }).join('')}</div>
    ${show?`<section class="answer-panel ${result===false?'answer-wrong':q.answer.length?'answer-right':'answer-pending'}" role="status"><div class="answer-head">${icon(result===false?'wrong':q.answer.length?'check':'settings')}<strong>${!q.answer.length?'已记录自测，暂不判分':revealed?'答案速记':result?'回答正确，继续保持！':'这道题还需要巩固'}</strong>${q.answer.length?`<span>参考答案 <b>${q.answer.join(' ')}</b>${submitted?`<span class="your-answer">你的答案 ${chosen.join(' ')}</span>`:''}</span>`:''}</div><p>${esc(q.note)}</p><small>${q.answer.length?'根据帽子题配套资料整理 · OCR 内容供复习使用':'未计入正确率和错题本；可收藏本题，待补齐答案后复习。'}</small></section>`:''}
    <div class="question-actions"><button class="outline prev" data-action="prev" ${position===0?'disabled':''}>${icon('arrow')} 上一题</button><div class="action-right">${show?`<button class="text-button" data-action="retry">重做本题</button>`:`<button class="text-button" data-action="reveal">查看答案</button>`}${!show&&q.type==='多选'?`<button class="primary" data-action="submit" ${chosen.length<2?'disabled':''}>确认答案 ${chosen.length?`(${chosen.length})`:''}</button>`:`<button class="primary" data-action="next">${position===queue.length-1?'完成本轮':'下一题'} ${icon('arrow')}</button>`}</div></div></article>`;
  el.querySelectorAll('[data-option]').forEach(b=>b.onclick=()=>choose(b.dataset.option));
  el.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
}
function action(name) {
  if(name==='reset-filters'){filters={subject:'',chapter:'',type:'',query:'',mode:'sequential'};makeQueue();}
  if(name==='star')toggleStar();
  if(name==='submit')submit();
  if(name==='prev')navigate(position-1);
  if(name==='next') {if(position===queue.length-1){dialog='finish';renderDialog();}else navigate(position+1);}
  if(name==='retry'){resetAttempt();renderQuestion();}
  if(name==='reveal'){revealed=true;renderQuestion();}
  if(name==='map'||name==='settings'){dialog=name;renderDialog();}
}
function bind() {
  document.querySelector('.brand').onclick=e=>{e.preventDefault();filters={subject:'',chapter:'',type:'',query:'',mode:'sequential'};makeQueue();};
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  document.querySelectorAll('[data-subject]').forEach(b=>b.onclick=()=>{filters.subject=b.dataset.subject;filters.chapter='';makeQueue();});
  document.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action));
  for (const field of ['subject','chapter','type']) document.getElementById(field+'-select').onchange=e=>{filters[field]=e.target.value;if(field==='subject')filters.chapter='';makeQueue();};
  document.getElementById('search-input').oninput=e=>{
    const query=e.target.value;clearTimeout(searchTimer);searchTimer=setTimeout(()=>{filters.query=query;makeQueue();const input=document.getElementById('search-input');input.focus();input.setSelectionRange(query.length,query.length);},250);
  };
}
function closeDialog() {dialog='';document.getElementById('dialog-root').innerHTML='';document.body.classList.remove('modal-open');}
function renderDialog() {
  const stats=Quiz.statistics(records);
  let title='',body='';
  if(dialog==='map') {
    title='答题卡';body=`<p class="modal-sub">当前筛选共 ${queue.length} 题，数字为本轮顺序。点击跳转到题目。</p><div class="map-legend"><span><i class="green"></i>正确</span><span><i class="red"></i>待巩固</span><span><i class="amber"></i>自测</span><span><i></i>未练</span></div><div class="question-grid">${queue.map((q,i)=>`<button data-jump="${i}" class="${records[q.id]?(records[q.id].correct===true?'done-right':records[q.id].correct===false?'done-wrong':'done-pending'):''} ${i===position?'current':''}" aria-label="第${i+1}题，${q.subject}${q.type}原题${q.number}${records[q.id]?'，已练习':''}">${i+1}${favorites.includes(q.id)?'<sup>★</sup>':''}</button>`).join('')}</div>`;
  } else if(dialog==='settings') {
    title='数据与题库说明';body=`<div class="settings-content"><h3>693 道题，来自你的资料</h3><p>题目取自《1000题·试题分册》，按帽子题题号筛选并 OCR 转为文字，保留科目、章节和原题号。配套帽子题要点用于整理参考答案。</p><div class="info-strip"><b>${BANK.length-pendingCount}</b> 题可自动判分 <span>·</span> <b>${pendingCount}</b> 题答案待核对</div><p>部分配套资料的题号、内容与试题分册不完全对应，未能确认完整答案的题保留为自测题，不计入正确率。参考答案并非官方答案册，若有疑义请对照原书。</p><h3>进度只保存在当前浏览器</h3><p>更换设备、无痕浏览或清理浏览器数据可能丢失记录。你可以导出备份，再在另一设备导入。正确率按每题最近一次正式作答统计，查看答案不计分。</p><div class="data-actions"><button class="outline" id="export">导出练习进度</button><label class="outline import-label" tabindex="0">导入进度<input id="import" type="file" accept="application/json,.json" class="sr-only"></label></div><hr><div class="reset-row"><div><b>重新开始</b><p>清空所有答题记录与收藏。</p></div><button class="danger" id="reset">清空记录</button></div></div>`;
  } else {
    title='本轮浏览完成';const done=queue.filter(q=>records[q.id]);const graded=done.filter(q=>typeof records[q.id].correct==='boolean');const correct=graded.filter(q=>records[q.id].correct).length;
    body=`<div class="finish-content"><span class="empty-icon">${icon('check')}</span><h3>每一次练习，都在积累。</h3><p>本轮共 ${queue.length} 题，已作答 ${done.length} 题。${queue.length>done.length?`还有 ${queue.length-done.length} 题未作答。`:''}</p><div class="finish-stats"><div><strong>${correct}</strong><span>正确</span></div><div><strong>${graded.length-correct}</strong><span>待巩固</span></div><div><strong>${graded.length?Math.round(correct/graded.length*100)+'%':'—'}</strong><span>正确率</span></div></div><div class="data-actions"><button class="outline" id="again">重新练习本轮</button><button class="primary" id="review-wrong">去错题本</button></div></div>`;
  }
  const root=document.getElementById('dialog-root');root.innerHTML=`<div class="modal-backdrop"><section class="modal ${dialog==='map'?'map-modal':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">${title}</h2><button id="close-modal" aria-label="关闭">${icon('close')}</button></header>${body}</section></div>`;
  document.body.classList.add('modal-open');document.getElementById('close-modal').onclick=closeDialog;document.getElementById('close-modal').focus();
  root.querySelector('.modal-backdrop').onclick=e=>{if(e.target.classList.contains('modal-backdrop'))closeDialog();};
  root.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{closeDialog();navigate(Number(b.dataset.jump));});
  if(dialog==='settings') {
    document.getElementById('export').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,records,favorites},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='帽子题练习进度-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
    document.querySelector('.import-label').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();document.getElementById('import').click();}};
    document.getElementById('import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5e6)throw Error();const data=JSON.parse(await file.text());if(data.version!==1||typeof data.records!=='object'||!Array.isArray(data.favorites))throw Error();if(!confirm('导入将覆盖当前答题记录和收藏，是否继续？'))return;({records,favorites}=Quiz.cleanProgress(data));closeDialog();makeQueue();toast('练习进度已导入');}catch{toast('文件格式不正确，请选择导出的练习进度文件');}};
    document.getElementById('reset').onclick=()=>{if(confirm('确定清空所有答题记录和收藏？此操作不可撤销。')){records={};favorites=[];closeDialog();filters.mode='sequential';makeQueue();toast('练习记录已清空');}};
  }
  if(dialog==='finish') {
    document.getElementById('again').onclick=()=>{closeDialog();navigate(0);};
    document.getElementById('review-wrong').onclick=()=>{closeDialog();setMode('wrong');};
  }
}
document.addEventListener('keydown',e=>{
  if(dialog){
    if(e.key==='Escape')closeDialog();
    if(e.key==='Tab'){const nodes=[...document.querySelectorAll('.modal button,.modal input,.modal [tabindex="0"]')].filter(n=>!n.disabled);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
    return;
  }
  if(e.ctrlKey||e.metaKey||e.altKey||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
  if(/^[1-4]$/.test(e.key)){e.preventDefault();choose('ABCD'[Number(e.key)-1]);}
  if(e.key==='ArrowRight'){e.preventDefault();action('next');}
  if(e.key==='ArrowLeft'){e.preventDefault();action('prev');}
  if(e.key==='Enter' && e.target.tagName!=='BUTTON'){e.preventDefault();if(submitted||revealed)action('next');else submit();}
});
makeQueue(saved.lastId);
