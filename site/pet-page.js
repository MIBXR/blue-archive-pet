import {PetPlayer,loadInstallMetadata,createInstallInstruction,copyInstallInstruction} from './pet-runtime.js';

const pet=document.body.dataset.pet;
const states=['idle','running-right','running-left','waving','jumping','failed','waiting','running','review'];
const directionNames=['正上方','右上偏上','右上方','右上偏右','正右方','右下偏右','右下方','右下偏下','正下方','左下偏下','左下方','左下偏左','正左方','左上偏左','左上方','左上偏上'];
const players=new Map();
const stage=document.querySelector('[data-stage]');
const errorElement=document.querySelector('[data-motion-error]');
const pauseButton=document.querySelector('[data-pause]');
const directionSelect=document.querySelector('#look-direction');
const followInput=document.querySelector('[data-follow]');
let mode='actions',state='idle',direction=0;
let content;
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let pauseOverridden=false;
let disposed=false;
const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');

function showError(text){errorElement.hidden=false;errorElement.textContent=text;}
function updatePause(){pauseButton.textContent=paused?'播放动画':'暂停动画';pauseButton.setAttribute('aria-pressed',String(paused));}
function applyPause(value){paused=value;for(const player of players.values())player.setPaused(value);updatePause();}
updatePause();
motionQuery.addEventListener('change',event=>{if(!pauseOverridden)applyPause(event.matches);});
for(const canvas of document.querySelectorAll('.pet-player')){
  const role=canvas.dataset.role;
  const player=new PetPlayer(canvas,{pet,state:'idle'});
  players.set(role,player);
  if(role==='theater'){
    canvas.addEventListener('pet-player-change',updateStageNote);
    canvas.addEventListener('pet-player-ready',()=>{stage.classList.add('ready');updateStageNote();});
  }
  player.ready.catch(()=>{
    if(role==='theater')document.querySelector('[data-loading]').textContent='动作暂时无法加载';
    showError('动作图片加载失败。请刷新后重试；你仍可以下载完整便携包。');
  });
}
const theater=players.get('theater');
const hero=players.get('hero');
const install=players.get('install');
pauseButton.addEventListener('click',()=>{pauseOverridden=true;applyPause(!paused);});

const contentReady=fetch(new URL('./pet-content.json',import.meta.url)).then(r=>{if(!r.ok)throw Error();return r.json();}).then(all=>{content=all[pet];updateContent();}).catch(()=>showError('动作说明暂时无法加载，请刷新后重试。'));
function updateStageNote(){
  const source=theater.canvas.dataset.petSource;
  const note=document.querySelector('[data-stage-note]');
  if(mode==='directions'){
    note.textContent=pet==='toki'?'转椅方向取自正式图集，以原始大小展示。':'移动指针或选择方向，看看她的注视。';
  }else{
    note.textContent=source==='original-hd'?'高清原稿中的动作 · 保留原有画风与节奏。':'正式桌宠图集中的动作 · 按原始大小展示。';
  }
}
function updateContent(){
  if(!content)return;
  const index=states.indexOf(state);
  document.querySelector('[data-action-description]').textContent=content.descriptions[index];
  document.querySelector('[data-stage-state]').textContent=mode==='directions'?directionNames[direction]:content.labels[index];
  theater.canvas.setAttribute('aria-label',mode==='directions'?`${pet==='hibiki'?'响':'时'}：看向${directionNames[direction]}`:`${pet==='hibiki'?'响':'时'}：${content.labels[index]}`);
}
function setState(next){
  state=next;setMode('actions');theater.setState(next);
  for(const button of document.querySelectorAll('[data-state]'))button.setAttribute('aria-pressed',String(button.dataset.state===next));
  updateContent();updateStageNote();
}
function setMode(next){
  mode=next;
  document.querySelector('[data-actions]').hidden=mode!=='actions';
  document.querySelector('[data-action-description]').hidden=mode!=='actions';
  document.querySelector('[data-directions]').hidden=mode!=='directions';
  for(const button of document.querySelectorAll('[data-mode]'))button.setAttribute('aria-pressed',String(button.dataset.mode===mode));
  if(mode==='directions')theater.setDirection(direction);else theater.setState(state);
  updateContent();updateStageNote();
}
function setDirection(index){direction=(index+16)%16;directionSelect.value=String(direction);theater.setDirection(direction);updateContent();updateStageNote();}
for(const button of document.querySelectorAll('[data-state]'))button.addEventListener('click',()=>setState(button.dataset.state));
for(const button of document.querySelectorAll('[data-mode]'))button.addEventListener('click',()=>setMode(button.dataset.mode));
document.querySelectorAll('[data-play-state]').forEach(link=>link.addEventListener('click',()=>setState(link.dataset.playState)));
document.querySelector('[data-greet]').addEventListener('click',()=>{if(!paused)void hero.respond('waving');});
directionSelect.addEventListener('change',()=>{followInput.checked=false;setDirection(Number(directionSelect.value));});
for(const button of document.querySelectorAll('[data-direction-step]'))button.addEventListener('click',()=>{followInput.checked=false;setDirection(direction+Number(button.dataset.directionStep));});
function followPointer(event){
  if(mode!=='directions'||!followInput.checked||paused)return;
  const rect=stage.getBoundingClientRect();
  const dx=event.clientX-(rect.left+rect.width/2),dy=event.clientY-(rect.top+rect.height/2);
  if(Math.hypot(dx,dy)<18)return;
  const angle=(Math.atan2(dx,-dy)+Math.PI*2)%(Math.PI*2);
  const next=Math.round(angle/(Math.PI*2)*16)%16;
  if(next!==direction)setDirection(next);
}
stage.addEventListener('pointermove',followPointer);
stage.addEventListener('pointerdown',followPointer);
stage.addEventListener('keydown',event=>{if(mode!=='directions')return;const offset=event.key==='ArrowLeft'?-1:event.key==='ArrowRight'?1:0;if(!offset)return;event.preventDefault();followInput.checked=false;setDirection(direction+offset);});
document.querySelector('[data-actions]').addEventListener('keydown',event=>{
  const buttons=[...document.querySelectorAll('[data-state]')];const index=buttons.indexOf(document.activeElement);
  if(index<0)return;const shift={ArrowRight:1,ArrowLeft:-1,ArrowDown:3,ArrowUp:-3}[event.key];
  if(shift===undefined)return;event.preventDefault();buttons[(index+shift+buttons.length)%buttons.length].focus();
});

const image=new Image();image.src=new URL(`./assets/${pet}-spritesheet.png`,import.meta.url).href;
image.onload=()=>{for(const canvas of document.querySelectorAll('[data-still-row]')){const context=canvas.getContext('2d');context.drawImage(image,Number(canvas.dataset.stillFrame)*192,Number(canvas.dataset.stillRow)*208,192,208,0,0,192,208);}};
image.onerror=()=>showError('静帧图片暂时无法加载，请刷新后重试。');

const copyButton=document.querySelector('[data-copy]');
const feedback=document.querySelector('[data-install-feedback]');
const activate=document.querySelector('[data-activate]');
const textarea=document.querySelector('[data-instruction]');
const details=document.querySelector('.install-details');
let copyRequest=0;
let metadata;
const metadataReady=loadInstallMetadata({baseUrl:document.baseURI}).then(value=>{metadata=value;updateInstruction();return value;}).catch(error=>{textarea.value='安装信息暂时无法加载。你仍可以直接下载 ZIP，解压后阅读包内 README.md。';return null;});
function updateInstruction(){if(metadata)textarea.value=createInstallInstruction(metadata,pet,{activate:activate.checked,baseUrl:document.baseURI});}
activate.addEventListener('change',()=>{++copyRequest;updateInstruction();feedback.textContent=activate.checked?'安装指令将请求导入后启用这只桌宠。':'安装指令将保留当前启用的桌宠。';});
details.addEventListener('toggle',()=>{if(details.open)updateInstruction();});
copyButton.addEventListener('click',async()=>{
  const request=++copyRequest;const shouldActivate=activate.checked;
  copyButton.disabled=true;feedback.textContent='正在准备安装指令…';
  try{
    const result=await copyInstallInstruction(pet,{activate:shouldActivate,baseUrl:document.baseURI});
    if(request!==copyRequest){feedback.textContent='安装选项已改变，请重新复制。';return;}
    if(!result.text)throw result.error??new Error('安装信息无法加载');
    textarea.value=result.text;
    if(result.copied){feedback.textContent='已复制，交给 Agent 完成导入。';if(!paused)void install.respond('waving');}
    else{feedback.textContent='浏览器未能复制。请从下方选中指令，手动复制。';details.open=true;textarea.focus();textarea.select();}
  }catch(error){
    if(request===copyRequest){feedback.textContent='安装指令暂时无法准备。你仍可以直接下载 ZIP。';details.open=true;}
  }finally{copyButton.disabled=false;}
});

const sections=[...document.querySelectorAll('main>section[id]')];
const navLinks=[...document.querySelectorAll('.nav a[href^="#"]')];
function updateNav(){const current=sections.filter(section=>section.getBoundingClientRect().top<160).at(-1);for(const link of navLinks){if(current&&link.hash===`#${current.id}`)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}}
window.addEventListener('scroll',updateNav,{passive:true});updateNav();
document.addEventListener('visibilitychange',()=>{if(disposed)return;if(document.hidden){for(const player of players.values())player.setPaused(true);}else for(const player of players.values())player.setPaused(paused);});
window.addEventListener('pagehide',event=>{if(!event.persisted){disposed=true;for(const player of players.values())player.destroy();}});
window.addEventListener('pageshow',event=>{if(event.persisted&&!disposed)for(const player of players.values())player.setPaused(paused);});
