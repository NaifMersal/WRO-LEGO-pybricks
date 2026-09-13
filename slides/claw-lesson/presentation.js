/* One persistent mechanism view, driven by Quarto slide cues. */
(function () {
'use strict';
const E = window.ClawEngine, P = window.ClawPresentation;
const $ = id => document.getElementById(id);
const esc = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state, cue, currentId, playing = false, pausedByUser = false, lastFrame = 0, accumulator = 0;
let codeRows = [], frame, nav, notes, pageList = [], activeSlide, mounted = false;
let steps = [], stepIndex = 0, lastSlideIndex = -1;
function highlight(line) {
  const tokens = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|#[^\n]*|\b(?:while|not|and|def|True|False)\b|\b\d+\b)/g;
  let result = '', pos = 0, match;
  while ((match = tokens.exec(line))) {
    result += esc(line.slice(pos, match.index));
    const t = match[0], cls = /^["']/.test(t) ? 'string' : /^#/.test(t) ? 'comment' : /^\d/.test(t) ? 'number' : 'keyword';
    result += '<span class="tok-' + cls + '">' + esc(t) + '</span>'; pos = tokens.lastIndex;
  }
  return result + esc(line.slice(pos));
}
/* Interactive teaching controls, included inside the existing presentation controller. */
const A=window.ClawEarly;
let earlyControls,homeDialog,stepMarks,onPlaybackEnd=null;
function element(tag,props={},text){const el=document.createElement(tag);Object.assign(el,props);if(text!==undefined)el.textContent=text;return el;}
function button(text,action){const b=element('button',{type:'button'},text);b.onclick=action;return b;}
function downloadText(name,text,type='text/plain'){const a=element('a',{href:URL.createObjectURL(new Blob([text],{type})),download:name});a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function stopPlayback(){playing=false;pausedByUser=false;lastFrame=0;accumulator=0;onPlaybackEnd=null;}
function finishPlayback(){playing=false;pausedByUser=false;accumulator=0;const done=onPlaybackEnd;onPlaybackEnd=null;if(done)done();}
function runEarly(s,stop='complete',more={}){stopPlayback();state=s;cue={...cue,...more,stop};createCode();playing=true;render();}
function controlSelect(label,values,selected){const wrap=element('label',{},label+' '),select=element('select');for(const [v,t] of values)select.append(element('option',{value:String(v)},t));select.value=String(selected);wrap.append(select);earlyControls.append(wrap);return select;}
function controlNumber(label,value,min,max){const wrap=element('label',{},label+' '),input=element('input',{type:'number',value:String(value),min:String(min),max:String(max),step:'10'});wrap.append(input);earlyControls.append(wrap);return input;}
function num(input){return Math.min(Number(input.max),Math.max(Number(input.min),Number(input.value)||0));}
function earlyCode(){
 if(!cue?.early)return false;
 const code=$('program-code');
 if(cue.prompt||cue.panel){code.innerHTML=cue.panel||'<p class="early-message">'+esc(cue.prompt)+'</p>';codeRows=[];return true;}
 if(cue.displayCode){code.innerHTML=cue.displayCode.split('\n').map(t=>'<div class="code-line"><code>'+highlight(t)+'</code></div>').join('');codeRows=[];return true;}
 if(cue.foldHome){
  const homeIndices=state.program.map((p,i)=>p.home?i:-1).filter(i=>i>=0);
  const inHome=homeIndices.includes(state.active);
  code.innerHTML='<div class="code-row folded-home"><div class="code-line"><code>home()</code></div></div>';
  code.querySelector('.folded-home')?.classList.toggle('active-line',inHome&&!state.finished);
  codeRows=[...code.querySelectorAll('[data-op]')];return true;
 }
 return false;
}
/* Each slide shows only the panels its question needs. Parts follow from the cue,
   and a cue can force one on with add: or off with hide:. */
function visibleParts(){
 const parts=new Set();
 const on=(name,value)=>{if(value)parts.add(name);};
 if(!cue||!state)return parts;
 const early=!!cue.early,status=cue.status||0,scene=!!cue.scene;
 const message=!!(cue.prompt||cue.panel);
 const inert=!cue.stop&&state.active<0&&!state.motor;
 on('scene',scene);
 on('mechanism',!scene);
 on('contact',!scene&&(!!state.object||status>=1));
 on('task',!scene&&!inert);
 on('angle',!scene&&!(early&&cue.stage===1));
 on('target',!scene&&(early?!!cue.targetVisible:true));
 on('torque',!scene&&!!cue.showTorque);
 on('stalled',!scene&&status>=1&&!(early&&cue.stage<5));
 on('done',!scene&&status>=2&&!(early&&cue.stage<5));
 on('code',!scene||message);
 on('heading',!scene&&!message);
 on('context',!scene&&!message&&!inert);
 on('console',cue.console!=='none');
 on('controls',!!cue.controls);
 for(const name of cue.hide||[])parts.delete(name);
 for(const name of cue.add||[])parts.add(name);
 return parts;
}
/* SVG elements have no hidden property, so always toggle the attribute. */
function show(el,visible){if(visible)el.removeAttribute('hidden');else el.setAttribute('hidden','');}
function applyVisibility(){
 const parts=visibleParts(),has=name=>parts.has(name);
 const el=sel=>frame.querySelector(sel);
 show($('scene-figure'),has('scene'));
 $('scene-figure').classList.toggle('scene-grip',cue?.scene==='bottle-grip');
 $('scene-caption').textContent=cue?.sceneCaption||'';
 show($('claw-svg'),has('mechanism'));
 show(el('.mechanism-heading'),has('mechanism'));
 show($('contact-description'),has('contact'));
 show(el('.task-block'),has('task'));
 const angle=$('actual-angle').closest('.reading'),target=$('target-reading'),torque=el('.reading.torque');
 show(angle,has('angle'));show(target,has('target'));show(torque,has('torque'));
 const columns=[has('angle')&&'1fr',has('target')&&'1fr',has('torque')&&'1.05fr'].filter(Boolean);
 show(el('.readings'),columns.length>0);
 el('.readings').style.gridTemplateColumns=columns.join(' ');
 show($('stalled-row'),has('stalled'));show($('done-row'),has('done'));
 show(el('.status-flags'),has('stalled')||has('done'));
 show(el('.program-heading'),has('heading'));
 show($('program-context'),has('context'));
 show($('program-code'),has('code'));
 show($('console-box'),has('console'));
 show(earlyControls,has('controls'));
 frame.classList.toggle('message',!!(cue?.prompt||cue?.panel));
 frame.classList.toggle('scene',has('scene'));
}
/* Progressive reveal. Any .step element in the slide waits for the next press;
   cues opt their own panels in with stepCode, stepControls, stepTarget, stepFlags. */
function tagSteps(){
 for(const el of frame.querySelectorAll('.step-auto')){el.classList.remove('step','step-auto','step-hidden');delete el.dataset.step;}
 const tag=(el,order)=>{if(el&&!el.hasAttribute('hidden')){el.classList.add('step','step-auto');el.dataset.step=String(order);}};
 if(cue?.stepCode)tag($('program-code'),5);
 if(cue?.stepControls)tag(earlyControls,7);
 if(cue?.stepTarget)tag($('target-reading'),9);
 /* The flags are read before any phase message replaces the code panel. */
 if(cue?.stepFlags){tag($('stalled-row'),6);tag($('done-row'),6);}
 stepMarks.replaceChildren();
 (cue?.phases||[]).forEach((phase,i)=>{const mark=element('span');mark.dataset.phaseIndex=String(i);stepMarks.append(mark);tag(mark,8+i/100);});
}
function collectSteps(){
 tagSteps();
 steps=[...activeSlide.querySelectorAll('.step')]
  .sort((a,b)=>Number(a.dataset.step||0)-Number(b.dataset.step||0));
}
function applySteps(){
 stepIndex=Math.max(0,Math.min(stepIndex,steps.length));
 steps.forEach((el,i)=>el.classList.toggle('step-hidden',i>=stepIndex));
 const status=$('step-status');
 status.hidden=!steps.length;
 status.textContent=steps.length?'Reveal '+stepIndex+' / '+steps.length:'';
}
/* A merged slide keeps the frames of the separate predict, observe and explain
   slides it replaces. Each phase is one press: it can re-seed the scene, run to
   the next stop, and take over the heading and the phase label. */
function revealedPhases(){let n=0;for(let i=0;i<stepIndex&&i<steps.length;i++){const p=steps[i].dataset.phaseIndex;if(p!==undefined)n=Number(p)+1;}return n;}
function applyPhase(phase){for(const [key,value] of Object.entries(phase)){if(key==='title'||key==='label'||key==='state')continue;if(value===null)delete cue[key];else cue[key]=value;}}
function setHeadline(phase){
 const heading=activeSlide.querySelector('h2'),label=activeSlide.querySelector('.slide-meta .phase');
 if(phase?.title&&heading)heading.textContent=phase.title;
 if(phase?.label&&label)label.textContent=phase.label;
}
function resetHeadline(){
 const heading=activeSlide.querySelector('h2'),label=activeSlide.querySelector('.slide-meta .phase');
 if(heading&&activeSlide.dataset.title)heading.textContent=activeSlide.dataset.title;
 if(label)label.textContent=activeSlide.dataset.phase;
}
function startPhase(index){
 const phase=cue.phases[index];
 stopPlayback();
 if(phase.state)state=P.get(phase.state);
 applyPhase(phase);createCode();
 if(phase.stop){playing=true;lastFrame=0;onPlaybackEnd=()=>setHeadline(phase);}
 else setHeadline(phase);
 render();
}
/* Show an already revealed sequence without replaying it: entering the slide
   backwards, replaying, or jumping straight to the end. Always rebuilt from the
   slide's own starting scene, so settling twice lands in the same place. */
function settlePhases(count){
 if(!cue?.phases||!count)return;
 cue={...P.cues[currentId]};state=P.get(cue.state);
 for(let i=0;i<count;i++){
  const phase=cue.phases[i];
  if(phase.state)state=P.get(phase.state);
  applyPhase(phase);
  if(phase.stop)P.until(state,phase.stop);
  setHeadline(phase);
 }
 stopPlayback();createCode();render();
}
function rewindPhases(){
 cue={...P.cues[currentId]};state=P.get(cue.state);
 stopPlayback();resetHeadline();
 const shown=revealedPhases();
 if(shown)settlePhases(shown);else{createCode();render();}
}
function nextStep(){
 if(stepIndex>=steps.length)return false;
 const el=steps[stepIndex];stepIndex++;applySteps();
 if(el.dataset.phaseIndex!==undefined)startPhase(Number(el.dataset.phaseIndex));
 return true;
}
function prevStep(){
 if(stepIndex<=0)return false;
 stepIndex--;applySteps();
 if(steps[stepIndex].dataset.phaseIndex!==undefined)rewindPhases();
 return true;
}
function goNext(){if(!nextStep())Reveal.next();}
function goBack(){if(!prevStep())Reveal.prev();}
function revealAll(){stepIndex=steps.length;applySteps();settlePhases(revealedPhases());}
function mountEarly(){
 earlyControls=element('div',{id:'early-controls',className:'early-controls'});frame.querySelector('.program-side').append(earlyControls);
 stepMarks=element('div',{id:'step-marks'});frame.append(stepMarks);
 const speed=element('span',{id:'approach-speed'});frame.querySelector('.mechanism-heading').append(speed);
 const homeButton=button('Home code',()=>homeDialog.showModal());homeButton.id='home-code-button';nav.insertBefore(homeButton,$('notes-button'));
 const stage=element('select',{id:'stage-picker'});stage.setAttribute('aria-label','Lesson topic');
 /* Only the lesson stages this deck contains, so no entry leads nowhere. */
 const chapters=[...new Set([...document.querySelectorAll('.reveal .slides > section[data-chapter]')].map(x=>Number(x.dataset.chapter.split(' /')[0])))].sort((a,b)=>a-b);
 for(const [i,n] of chapters.entries()){
  const label=document.querySelector('.reveal .slides > section[data-chapter^="'+n+' /"]').dataset.chapter.split(' / ')[1];
  stage.append(element('option',{value:String(n),title:label},'Topic '+(i+1)));
 }stage.onchange=()=>{const target=pageList.find(x=>x.dataset.chapter.startsWith(stage.value+' /'));if(target)Reveal.slide(pageList.indexOf(target));};nav.insertBefore(stage,homeButton);
 homeDialog=element('dialog',{id:'home-code-dialog',className:'lesson-dialog'});
 homeDialog.innerHTML='<div class="dialog-heading"><h2>home()</h2><button class="close-dialog" aria-label="Close home code">×</button></div><p>Copy and use now. We will explain the internal steps after the experiment.</p><pre><code>'+esc(A.copyCode)+'</code></pre><div class="dialog-actions"></div><p class="copy-status" aria-live="polite"></p>';
 document.body.append(homeDialog);homeDialog.querySelector('.close-dialog').onclick=()=>homeDialog.close();
 homeDialog.querySelector('.dialog-actions').append(button('Copy function',async()=>{
  let success=false;try{await navigator.clipboard.writeText(A.copyCode);success=true;}catch{const ta=element('textarea',{value:A.copyCode});homeDialog.append(ta);ta.select();success=document.execCommand('copy');ta.remove();}
  homeDialog.querySelector('.copy-status').textContent=success?'Copied. Paste into your supplied starter file.':'Select the code above to copy, or download the starter.';
 }),button('Download starter',()=>downloadText('claw_starter.py',A.starter)));
}
function setupEarly(){
 earlyControls.replaceChildren();earlyControls.hidden=!cue?.controls;
 frame.classList.toggle('early',!!cue?.early);frame.classList.toggle('has-controls',!!cue?.controls);frame.classList.toggle('mechanism-only',cue?.stage===1);
 frame.classList.toggle('show-torque',!!cue?.showTorque);
 const chapter=Number(activeSlide.dataset.chapter.split(' /')[0]);$('home-code-button').hidden=chapter<3;$('stage-picker').value=String(chapter);
 if(!cue?.controls)return;
 const kind=cue.controls;
 if(kind==='direction'){
  const d=controlSelect('Direction',[['open','Open'],['close','Close']],'close');
  earlyControls.append(button('Run',()=>runEarly(A.direction(state.physical,d.value==='close'),'complete')),button('Stop motor',()=>{stopPlayback();E.coast(state);state.running=false;state.finished=true;render();}),button('Reset scene',()=>changeSlide({currentSlide:activeSlide,keepSteps:true})));
 }else if(kind==='relative'){
  const start=controlSelect('Starting pose',[[20,'First start'],[80,'Second start']],80),amount=controlNumber('Movement (°)',-20,-130,130);
  const prepare=()=>{stopPlayback();state=A.relative(Number(start.value),num(amount));createCode();render();};start.onchange=prepare;amount.onchange=prepare;
  earlyControls.append(button('Run',()=>runEarly(A.relative(Number(start.value),num(amount)))),button('Reset scene',()=>changeSlide({currentSlide:activeSlide,keepSteps:true})));
 }else if(kind==='zero'){
  earlyControls.append(button('Reset angle to 0',()=>runEarly(A.get('arbitrary-start'))),button('Restore with home()',()=>{const s=P.copy(state);s.object=null;E.start(s,A.homeProgram());runEarly(s,'complete',{foldHome:true});}),button('Reset scene',()=>changeSlide({currentSlide:activeSlide,keepSteps:true})));
 }else if(kind==='copy'){
  earlyControls.append(button('View and copy function',()=>homeDialog.showModal()),button('Download starter',()=>downloadText('claw_starter.py',A.starter)));
 }else if(kind==='vote'){
  const feedback=element('p',{className:'control-feedback','ariaLive':'polite'});
  for(const answer of ['Yes','I would need to see it','Not sure'])earlyControls.append(button(answer,()=>feedback.textContent='Your prediction: '+answer+'. What would tell your fingers they reached the bottle?'));
  earlyControls.append(feedback);
 }else if(kind==='grip'){
  /* The stage 4 experiment runs as one scripted comparison: a fixed trial order,
     and every completed trial stays in the table beside the claw. */
  const script=[
   {label:'Target 60° on the wide object',cell:'60° · wide',run:()=>A.grip('wide',60),outlineAngle:60,
    after:'The jaws reached the requested 60° and stopped short of the object.'},
   {label:'Target 80° on the wide object',cell:'80° · wide',run:()=>A.grip('wide',80),outlineAngle:80,
    after:'The object stopped the jaws near 70°, before the requested 80°.'},
   {label:'Target 80° on the narrower object',cell:'80° · narrow',run:()=>A.grip('narrow',80),outlineAngle:80,
    after:'The same request reached 80° and left a gap. Each object has its own contact angle.'}
  ];
  const columns=['Trial','Stopped at','Contact'];
  const intro='Three trials, each homed at the zero reference. Only the requested target and the object change.';
  const done='Contact depends on the object, not on the requested angle alone.';
  const table=element('table',{className:'trial-log'});
  table.innerHTML='<thead><tr>'+columns.map(c=>'<th>'+esc(c)+'</th>').join('')+'</tr></thead><tbody></tbody>';
  const body=table.querySelector('tbody');
  const note=element('p',{className:'control-feedback'},intro);
  const run=button('',()=>advanceTrial());
  const restart=button('Start over',()=>changeSlide({currentSlide:activeSlide,keepSteps:true}));
  let trial=0;
  const label=()=>trial<script.length?'Trial '+(trial+1)+' of '+script.length+' · '+script[trial].label:'All trials complete';
  function record(t){
   const s=state,outcome=s.contact.every(Boolean)?'Both jaws':'Gap remains';
   const at=E.angle(s).toFixed(0)+'°';
   const row=element('tr');
   row.innerHTML='<td>'+esc(t.cell)+'</td><td>'+at+'</td><td>'+esc(outcome)+'</td>';
   body.append(row);note.textContent=t.after;run.textContent=label();
   if(trial>=script.length){note.textContent=done;run.disabled=true;}
  }
  function advanceTrial(){
   if(trial>=script.length)return;
   const t=script[trial++];
   note.textContent='Running…';run.textContent='Running…';run.disabled=true;
   /* Each trial outlines its own requested angle beside the reached one. */
   runEarly(t.run(),'outcome',{targetVisible:true,outline:true,outlineAngle:t.outlineAngle});
   onPlaybackEnd=()=>{run.disabled=false;record(t);};
  }
  run.textContent=label();
  earlyControls.append(run,restart,note,table);
 }
}
function renderEarly(){
 const chapter=Number(activeSlide.dataset.chapter.split(' /')[0]);
 const early=!!cue?.early;
 if(!state)return;
 const unknown=state.reference==='unknown',arbitrary=state.reference==='arbitrary';
 const actual=$('actual-angle'),label=actual.closest('.reading').querySelector('.reading-label');
 label.textContent=unknown?'Reference not established':arbitrary?'Angle (arbitrary zero)':'Actual motor angle';
 actual.textContent=unknown?'—':E.angle(state).toFixed(0);actual.nextElementSibling.hidden=unknown;
 $('approach-speed').textContent=cue.showTorque?'Speed: '+(state.motor?.speed||state.program.find(p=>p.speed)?.speed||E.FACTS.closeSpeed)+'°/s':'';
 $('ready-outline').style.display=cue.outline?'':'none';
 if(cue.outline)E.jaws(cue.outlineAngle ?? E.FACTS.openTarget).forEach((j,i)=>$(i?'ready-right':'ready-left').setAttribute('d',`M${j.x1} ${j.y1}L${j.x2} ${j.y2}`));
 if(early){
  if(state.motor?.kind==='home'){$('task-description').textContent=cue.stage<5?'Opening toward the open stop':state.stalled?'Stall detected at the open stop':'Opening until stalled';$('target-angle').textContent='—';}
    if(cue.foldHome){const el=$('program-code').querySelector('.folded-home');el?.classList.toggle('active-line',!state.finished&&state.active>=0);$('program-context').textContent=state.finished?'home() returned':state.active<0?'Ready to call home()':'home() running';}
  else if(state.waiting?.kind==='sleep'&&state.program[state.active]?.ms===200)$('program-context').textContent='Settling pause';
  if(state.stalled&&cue.stage>=5&&state.motor?.kind==='home')$('program-context').textContent='Stall detected before COAST';
 }
}

function createCode() {
  let lineNo = 1;
  $('program-code').classList.toggle('compact', state.program.some(p => p.type === 'check'));
  $('program-code').innerHTML = state.program.map((op, i) => {
    if (!op.text) return '';
    const part = op.part || (op.type === 'move' ? 'move' : op.type === 'check' ? 'check' :
      op.type === 'sleep' ? (op.ms === 5000 ? 'observe' : op.ms === 100 ? 'startup' : 'poll') :
      op.type === 'print' ? (op.message === '2: Continue' ? 'continue' : 'start') : op.type);
    if (cue.show && !cue.show.includes(part)) return '';
    let txt = op.text.replace(/  # Observation time$/, '');
    /* The condition grows one check at a time, so it is written from the checks
       the op actually makes. */
    if (op.type === 'check') {
      const conds = op.conds || ['stalled', 'done'];
      txt = conds.length > 1
        ? 'while (\n' + conds.map((c, n) => '    ' + (n ? 'and ' : '') + 'not claw.' + c + '()').join('\n') + '\n):'
        : 'while not claw.' + conds[0] + '():';
    }
    if (cue.explicitWait && op.type === 'move') txt = txt.replace('then=Stop.HOLD', 'then=Stop.HOLD, wait=True');
    const lines = txt.split('\n').map(line => {
      let h = highlight(line);
      if (cue.focus === 'argument') h = h.replace(/wait=(<span class="tok-keyword">(?:True|False)<\/span>)/g, '<mark>wait=$1</mark>');
      return '<div class="code-line"><span class="ln">' + lineNo++ + '</span><code>' + h + '</code></div>';
    }).join('');
    const gap = part === 'observe' && cue.show?.includes('move') && state.program.some(p => p.type === 'check')
      ? '<div class="code-gap" aria-label="Checking loop omitted from this excerpt">…</div>' : '';
    /* A note names a value beside the line that sets it, in the space left of the panel edge. */
    const note = cue.annotate?.[part] ? '<span class="code-note">' + esc(cue.annotate[part]) + '</span>' :
      cue.waitTimer && part === 'observe' ? '<span class="code-note wait-timer"></span>' : '';
    return gap + '<div class="code-row" data-op="' + i + '" data-part="' + part + '">' + lines + note + '</div>';
  }).join('');
  frame.classList.toggle('excerpt', !!cue.show);
  $('code-caption').textContent = cue.caption || '';
  $('code-caption').hidden = !cue.caption;
  $('program-label').textContent = cue.show ? 'Code excerpt' : 'Program';
  earlyCode();
  /* The whole home() function is taller than the standard panel, so it takes the
     room the hidden console leaves rather than shrinking to an unreadable size. */
  const tallCode = $('program-code').querySelectorAll('.code-line').length > 9;
  $('program-code').classList.toggle('tall', tallCode && cue.console === 'none' && !cue.controls && !cue.caption);
  codeRows = Array.from($('program-code').querySelectorAll('[data-op]'));
}
function render() {
  if (!state) return;
  const a = E.angle(state), m = state.motor;
  $('actual-angle').textContent = a.toFixed(0);
  const upcoming = state.program.find(p => p.type === 'move');
  /* Ending the program releases the motor, but the angle it asked for is still
     what the run has to be judged against. */
  $('target-angle').textContent = m?.target != null ? m.target.toFixed(0) :
    state.cutOff && state.lastTarget != null ? state.lastTarget.toFixed(0) :
    state.active < 0 ? upcoming?.target ?? '—' : '—';
  /* No pending target reads as a dash, which must not carry a degree sign. */
  $('target-reading').querySelector('small').hidden = $('target-angle').textContent === '—';
  $('torque-value').textContent = state.torque;
  $('task-description').textContent = !m ? (state.cutOff ? 'Program ended · motor released' : state.active < 0 ? 'Ready to start' : 'Drive effort released · COAST') :
    m.reached ? (m.settleOffset ? 'Holding near the target · within tolerance' : 'Holding the reached target') :
    m.blockedBy ? 'Blocked · still trying toward target' :
    m.settleOffset && Math.abs(m.target + state.offset - state.physical) <= m.positionTolerance ? 'Settling near the target' :
    m.target + state.offset > state.physical ? 'Closing toward the target' : 'Opening toward the target';
  $('task-description').classList.toggle('blocked', !!m?.blockedBy);
  const rotations = E.gearAngles(state.physical);
  for (const [name, gear] of Object.entries(E.GEARS)) {
    const transform = `rotate(${rotations[name]} ${gear.x} ${gear.y})`;
    $(name + '-gear').setAttribute('transform', transform);
    if (name === 'left' || name === 'right') $(name + '-arm').setAttribute('transform', transform);
  }
  $('motor-rotor').setAttribute('transform', `rotate(${rotations.motor} 320 147)`);
  $('object-shape').style.display = state.object ? '' : 'none';
  if (state.object) {
    const b = state.object;
    for (const [key, value] of Object.entries({x:b.x-b.w/2,y:b.y-b.h/2,width:b.w,height:b.h})) $('object-rect').setAttribute(key,value);
    $('object-rect').setAttribute('fill', state.contact.every(Boolean) ? '#f0bb50' : '#ead1a1');
    $('object-stripe').setAttribute('d','M'+(b.x-b.w/2+10)+' '+(b.y-10)+'h'+(b.w-20));
    $('object-label').setAttribute('x',b.x); $('object-label').setAttribute('y',b.y+6);
    $('object-label').textContent = b.size === 'narrow' ? 'NARROW OBJECT' : 'WIDE OBJECT';
  }
  const tips = E.jaws(state.physical);
  ['left-contact','right-contact'].forEach((id,i) => {
    $(id).setAttribute('cx',tips[i].x2); $(id).setAttribute('cy',tips[i].y2); $(id).style.display=state.contact[i]?'':'none';
  });
  $('contact-description').textContent = !state.object ? 'Empty claw' :
    state.contact.every(Boolean) ? 'Both jaws in contact' : 'A gap remains';
  const notStarted = state.active < 0;
  for (const name of ['stalled','done']) {
    $(name+'-value').textContent = notStarted ? '—' : state[name] ? 'True' : 'False';
    $(name+'-value').classList.toggle('is-true', !notStarted && state[name]);
    $(name+'-row').classList.toggle('focused', cue.focus === name);
  }
  $('target-reading').classList.toggle('focused', cue.focus === 'target');
  let index = state.active;
  if (state.program[index]?.type === 'jump') index = state.program[index].to;
  /* A walkthrough marks the line it has just revealed, not the line being executed. */
  const marked = cue.mark;
  codeRows.forEach(el => {
    const opIndex = Number(el.dataset.op), op = state.program[opIndex];
    el.classList.toggle('active-line', marked ? marked.includes(el.dataset.part) : opIndex === index && state.active >= 0);
    el.classList.toggle('pending-line', !marked && opIndex === index && state.waiting?.kind === 'motor');
    el.classList.toggle('motor-source', !!cue.source && op.type === 'move');
    el.classList.toggle('focus-line', cue.focus === 'check' && op.type === 'check');
  });
  /* While the loop is running, the count is the evidence that it is still waiting. */
  const activeOp = state.program[state.active];
  const polling = !state.loopExit && (activeOp?.type === 'check' || (activeOp?.type === 'sleep' && activeOp.ms === 10));
  $('program-context').textContent = state.waiting?.kind === 'motor' ? 'Target call pending' :
    state.loopExit ? 'Loop ended: '+state.loopExit :
    polling ? 'Checking · '+state.checkCount+(state.checkCount === 1 ? ' check' : ' checks') :
    state.waiting?.kind === 'sleep' ? 'Observation wait' :
    state.active < 0 ? 'Ready to run' : state.program[state.active]?.type === 'print' ? 'Printed message' :
    state.finished ? 'Program finished' : 'Executing';
  /* Where the wait itself is the lesson, it counts down beside the line that set it. */
  const timer = $('program-code').querySelector('.wait-timer');
  if (timer) {
    const sleeping = state.waiting?.kind === 'sleep' && state.program[state.active]?.part === 'observe';
    timer.textContent = sleeping ? state.waiting.remaining.toFixed(1) + ' s left' : state.finished ? '0.0 s left' : '';
  }
  $('source-legend').hidden = !cue.source;
  const visibleLog = cue.console === 'last' ? state.log.filter(x=>x.text==='2: Continue') : state.log;
  $('console-lines').innerHTML = visibleLog.length ? visibleLog.map(x=>'<div>'+esc(x.text)+'</div>').join('') : '<div class="console-placeholder">No messages yet</div>';
  $('play-status').textContent = playing ? 'Running · slowed for observation' : pausedByUser ? 'Paused · P to resume' : cue.stop ? 'Paused for discussion' : '';
  $('replay-button').hidden = !cue.stop;
  $('pause-button').hidden = !cue.stop;
  $('pause-button').textContent = playing ? 'Pause' : pausedByUser ? 'Resume' : 'Replay';
  renderEarly();
  applyVisibility();
}
function changeSlide(event) {
  activeSlide = event?.currentSlide || Reveal.getCurrentSlide();
  currentId = activeSlide.dataset.cue;
  if (nav) activeSlide.append(nav);
  cue = P.cues[currentId] ? {...P.cues[currentId]} : null;
  playing = false; pausedByUser = false; lastFrame = 0; accumulator = 0;
  frame.style.display = cue ? '' : 'none';
  if (cue) {
    activeSlide.querySelector('.lab-slot').append(frame);
    state = P.get(cue.state);
    setupEarly();
    createCode(); playing = !!cue.stop;
    render();
  } else {
    state = null;
    setupEarly();
    $('play-status').textContent = '';
    $('replay-button').hidden = true; $('pause-button').hidden = true;
  }
  const i = pageList.indexOf(activeSlide);
  collectSteps();
  stepIndex = event?.keepSteps ? stepIndex : i < lastSlideIndex ? steps.length : 0;
  lastSlideIndex = i;
  applySteps();
  resetHeadline();
  settlePhases(revealedPhases());
  $('slide-count').textContent = String(i+1).padStart(2,'0')+' / '+pageList.length;
  $('back-button').disabled = i === 0;
  $('next-button').disabled = i === pageList.length-1;
  $('progress-fill').style.width = ((i+1)/pageList.length*100)+'%';
  updateNotes();
}
/* Highlight code text without discarding markup such as reveal steps. */
function highlightInPlace(root) {
  for (const node of [...root.childNodes]) {
    if (node.nodeType === 3) {
      const span = document.createElement('span');
      span.innerHTML = node.textContent.split('\n').map(highlight).join('\n');
      node.replaceWith(span);
    } else highlightInPlace(node);
  }
}
function updateNotes() {
  $('notes-title').textContent = activeSlide.querySelector('h2')?.textContent || '';
  $('notes-content').innerHTML = activeSlide.querySelector('aside.notes')?.innerHTML || 'No notes for this slide.';
}
function replay() { if (cue?.stop) changeSlide({currentSlide:activeSlide,keepSteps:true}); }
function pause() {
  if (!cue?.stop) return;
  if (playing) { playing=false; pausedByUser=true; }
  else if (pausedByUser) { playing=true; pausedByUser=false; lastFrame=0; }
  else replay();
  render();
}
function toggleNotes() {
  const open = !notes.open;
  if (open) notes.showModal(); else notes.close();
}
function animate(now) {
  if (playing && state) {
    const elapsed = lastFrame ? Math.min(.05,(now-lastFrame)/1000) : 0;
    accumulator += elapsed * (cue.rate || .18);
    let advanced = false;
    while (accumulator >= E.DT && playing) {
      E.tick(state); accumulator -= E.DT; advanced = true;
      if (P.stops[cue.stop](state)) { finishPlayback(); }
      else if (state.paused) {
        playing=false; $('play-status').textContent='Scene paused before checkpoint';
        console.error('Unexpected engine pause',currentId);
      }
    }
    if (advanced) render();
  }
  lastFrame = now;
  requestAnimationFrame(animate);
}
function boot() {
  if (mounted) return;
  mounted = true;
  document.body.classList.add('claw-presentation');
  frame = $('lab-template').content.firstElementChild.cloneNode(true);
  document.body.append(frame);
  // Mechanism geometry and rendering are reused from the supplied Claw Lab.
  buildMechanism();
  nav = $('nav-template').content.firstElementChild.cloneNode(true);
  document.querySelector('.reveal .slides').append(nav);
  notes = $('notes-dialog');
  mountEarly();
  pageList = Array.from(document.querySelectorAll('.reveal .slides > section[data-cue]'));
  pageList.forEach((slide,i) => {
    const meta = document.createElement('div');
    meta.className='slide-meta';
    meta.innerHTML='<span class="brand">PROGRAMMING THE CLAW</span><span class="chapter">'+esc(slide.dataset.chapter.split(' / ')[1])+'</span><span class="phase">'+esc(slide.dataset.phase)+'</span>';
    slide.dataset.title=slide.querySelector('h2')?.textContent||'';
    slide.prepend(meta);
    slide.querySelectorAll('.function-trio code').forEach(highlightInPlace);
  });
  document.querySelectorAll('[data-claw-download]').forEach(el=>{
    el.onclick=()=>{const kind=el.dataset.clawDownload;downloadText(kind==='starter'?'claw_starter.py':'claw_gripper.py',window.ClawDownloads[kind],'text/x-python');};
  });
  $('back-button').onclick=goBack;
  $('next-button').onclick=goNext;
  $('replay-button').onclick=replay;
  $('pause-button').onclick=pause;
  $('notes-button').onclick=toggleNotes;
  $('notes-close').onclick=()=>notes.close();
  $('fullscreen-button').onclick=()=> document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
  Reveal.configure({
    keyboard: {80: pause, 78: toggleNotes, 82: replay,
      39: goNext, 32: goNext, 34: goNext, 40: goNext,
      37: goBack, 33: goBack, 38: goBack},
    keyboardCondition: () => !notes.open && !homeDialog.open && !['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)
  });
  document.addEventListener('visibilitychange',()=>{ lastFrame=0; if (document.hidden && playing) { playing=false; pausedByUser=true; render(); } });
  Reveal.on('slidechanged',changeSlide);
  changeSlide();
  requestAnimationFrame(animate);
  window.clawDeck = {
    go(id) { const i=pageList.findIndex(s=>s.dataset.cue===id); if(i<0)throw new Error(id); Reveal.slide(i); },
    inspect() { return {id:currentId, playing, pausedByUser, state:state?P.copy(state):null, cue}; },
    finish() { revealAll(); if(state && cue?.stop && playing) { P.until(state,cue.stop); finishPlayback(); render(); } },
    steps() { return {index:stepIndex, total:steps.length}; },
    next:goNext, back:goBack, revealAll,
    replay, pause, slideIds:pageList.map(s=>s.dataset.cue)
  };
}
function buildMechanism() {
  function gear({ x: cx, y: cy, radius: r, teeth, phase }, motor = false) {
    const points = [];
    for (let tooth = 0; tooth < teeth; tooth++) {
      for (const [fraction, radius] of [[-.5,r-3.5],[-.35,r-3.5],[-.15,r+3],[.15,r+3],[.35,r-3.5]]) {
        const a = (phase + (tooth + fraction) * 360 / teeth) * Math.PI / 180;
        points.push(`${cx + Math.cos(a) * radius},${cy + Math.sin(a) * radius}`);
      }
    }
    return `<title>${motor ? 'Motor pinion' : 'Driven gear'}: ${teeth} teeth</title><polygon points="${points.join(' ')}" fill="${motor ? '#3ed9e4' : '#e9c95c'}" stroke="${motor ? '#128f9e' : '#bca042'}" stroke-width="1"/><circle cx="${cx}" cy="${cy}" r="${motor ? 18 : 12}" fill="${motor ? '#143c4e' : '#b29a47'}"/>` +
      (motor ? '' : `<path d="M${cx - 7} ${cy}h14m-7-7v14" stroke="#1d394c" stroke-width="4"/>`);
  }
  for (const [name, spec] of Object.entries(E.GEARS)) $(name + '-gear').innerHTML = gear(spec, name === 'motor');
  function arm(cx, sign) {
    let h = `<path d="M${cx} 215h${sign * 88}" stroke="#9e176d" stroke-width="24" stroke-linecap="round"/><path d="M${cx} 212h${sign * 88}" stroke="#d932a0" stroke-width="19" stroke-linecap="round"/><path d="M${cx + sign * 85} 215h${sign * 55}" stroke="#079fb6" stroke-width="26" stroke-linecap="round"/><path d="M${cx + sign * 87} 212h${sign * 51}" stroke="#21c6d7" stroke-width="20" stroke-linecap="round"/>`;
    for (let n = 18; n <= 126; n += 18) h += `<circle cx="${cx + sign * n}" cy="214" r="5.5" fill="${n < 86 ? '#8e1464' : '#03778f'}" stroke="${n < 86 ? '#eb79c2' : '#83e4e8'}" stroke-width="1.4"/>`;
    return h + `<circle cx="${cx + sign * 140}" cy="215" r="8" fill="#193c4c"/><circle cx="${cx}" cy="215" r="7" fill="#243c4f"/>`;
  }
  $('left-arm').innerHTML = arm(285, -1); $('right-arm').innerHTML = arm(355, 1);

  $('ready-outline').style.display='none';
  $('prop-shape').style.display='none';
}
if (document.readyState==='complete') boot();
else window.addEventListener('load',boot,{once:true});
})();
