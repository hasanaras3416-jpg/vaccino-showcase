import {record,state,setMode} from './store.js';

export function initializePresentation(){
  const enter=document.getElementById('presentation-enter'),viewer=document.getElementById('viewer');
  if(!window.vaccino){enter.disabled=true;enter.title='Sunum için WebGL destekli 3B görünüm gerekir.';return;}
  const api=window.vaccino,slides=record.presentation.slides;
  const root=document.createElement('section');root.id='presentation';root.className='presentation-root';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Vaccino sunumu');
  root.innerHTML=`<header class="presentation-header"><div class="presentation-brand"><b>V</b><span>VACCINO <small>26 / 27</small></span><em>SUNUM MODU</em></div><div class="presentation-actions"><div class="narration-switch" role="group" aria-label="Sunum anlatımı"><button data-mode="simple">Basit <span>anlatım</span></button><button data-mode="technical">Teknik <span>anlatım</span></button></div><button id="presentation-fullscreen" title="Tam ekranı aç">Tam ekran ⛶</button><button id="presentation-exit">Çık <kbd>ESC</kbd></button></div></header><div class="presentation-main"><div class="presentation-copy"><p id="presentation-number" class="eyebrow"></p><h1 id="presentation-title"></h1><h2 id="presentation-subtitle"></h2><p id="presentation-description"></p><div class="presentation-rule"></div><p class="presentation-caveat">Tasarım çalışması <br> Temsili geometri · Doğrulama bekliyor</p><output id="presentation-announcement" class="presentation-announcement" aria-live="polite"></output></div><div id="presentation-stage"></div></div><footer class="presentation-footer"><button id="presentation-prev" aria-label="Önceki sunum sahnesi">←</button><nav id="presentation-scenes" aria-label="Sunum sahneleri"></nav><button id="presentation-next" aria-label="Sonraki sunum sahnesi">→</button><div id="presentation-drive"><button id="presentation-play" aria-pressed="false">Canlandır</button><button id="presentation-engage" aria-pressed="true">Bağlı</button><button id="presentation-explode" aria-pressed="false">Patlat</button></div><label class="presentation-quality">Grafik <select id="presentation-quality"><option value="auto">Otomatik</option><option value="low">Düşük</option><option value="balanced">Dengeli</option><option value="high">Yüksek</option></select></label></footer>`;
  document.body.append(root);
  const $=id=>document.getElementById(id);
  let active=false,index=0,snapshot=null,home=null,homeHidden=false,returnFocus=null,wasFullscreen=false;
  const inertState=new Map();
  slides.forEach((slide,i)=>{const b=document.createElement('button');b.textContent=String(i+1).padStart(2,'0');b.title=slide.title;b.setAttribute('aria-label',`${i+1}. ${slide.title}`);b.onclick=()=>show(i);$('presentation-scenes').append(b);});
  function syncDrive(){const s=api.state();$('presentation-play').textContent=s.playing?'Duraklat':'Canlandır';$('presentation-play').setAttribute('aria-pressed',String(s.playing));$('presentation-engage').textContent=s.engaged?'Bağlı':'Ayrık / süzülme';$('presentation-engage').setAttribute('aria-pressed',String(s.engaged));$('presentation-explode').setAttribute('aria-pressed',String(s.exploded));}
  function copy(){
    const slide=slides[index];$('presentation-title').textContent=slide.title;$('presentation-subtitle').textContent=slide.subtitle;$('presentation-description').textContent=slide[state.mode];$('presentation-number').textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')} · VACCINO 26/27`;
    root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===state.mode)));
  }
  function show(next){
    if(!active)return;index=Math.max(0,Math.min(slides.length-1,next));copy();
    api.presentScene(slides[index]);
    root.querySelectorAll('#presentation-scenes button').forEach((b,i)=>{if(i===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
    $('presentation-prev').disabled=index===0;$('presentation-next').disabled=index===slides.length-1;
    $('presentation-drive').hidden=slides[index].id!=='transmission';syncDrive();root.dataset.slide=slides[index].id;
    $('presentation-announcement').textContent=`Sahne ${index+1}: ${slides[index].title}`;
  }
  function start(){
    if(active)return;active=true;snapshot=api.captureView();home=viewer.parentElement;homeHidden=viewer.hidden;returnFocus=document.activeElement;
    document.body.classList.add('presentation-active');root.hidden=false;viewer.hidden=false;viewer.dataset.presentation='true';$('presentation-stage').append(viewer);
    for(const node of [document.querySelector('.app-shell'),document.getElementById('sidebar')]){inertState.set(node,node.inert);node.inert=true;}
    $('presentation-quality').value=api.state().graphics.requested;show(0);$('presentation-exit').focus();document.dispatchEvent(new Event('vaccino:resize'));
  }
  function exit(){
    if(!active)return;active=false;root.hidden=true;delete viewer.dataset.presentation;home.append(viewer);viewer.hidden=homeHidden;
    inertState.forEach((value,node)=>{node.inert=value;});inertState.clear();api.restoreView(snapshot);document.body.classList.remove('presentation-active');
    if(document.fullscreenElement===root)document.exitFullscreen().catch(()=>{});wasFullscreen=false;
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});document.dispatchEvent(new Event('vaccino:resize'));
  }
  enter.onclick=start;$('presentation-exit').onclick=exit;$('presentation-prev').onclick=()=>show(index-1);$('presentation-next').onclick=()=>show(index+1);
  root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  document.addEventListener('vaccino:mode',()=>{if(active)copy();});
  document.addEventListener('vaccino:presentation-exit',exit);
  document.addEventListener('vaccino:graphics',event=>{$('presentation-quality').value=event.detail.requested;});
  $('presentation-quality').onchange=event=>api.setQuality(event.target.value);
  $('presentation-play').onclick=()=>{api.setAnimating(!api.state().playing);syncDrive();};
  $('presentation-engage').onclick=()=>{api.setEngaged(!api.state().engaged);syncDrive();};
  $('presentation-explode').onclick=()=>{document.getElementById('explode').click();syncDrive();};
  $('presentation-fullscreen').onclick=async()=>{
    if(!root.requestFullscreen){$('presentation-announcement').textContent='Bu tarayıcı tam ekranı desteklemiyor; sunum pencereyi doldurur.';return;}
    try{await root.requestFullscreen();wasFullscreen=true;}catch{$('presentation-announcement').textContent='Tam ekran açılamadı. Sunum pencere içinde kullanılabilir.';}
  };
  document.addEventListener('fullscreenchange',()=>{if(active&&wasFullscreen&&document.fullscreenElement!==root)exit();});
  document.addEventListener('keydown',event=>{
    if(!active)return;
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();exit();return;}
    if(['SELECT','INPUT','TEXTAREA'].includes(event.target.tagName))return;
    if(['ArrowRight','PageDown','ArrowLeft','PageUp','Home','End'].includes(event.key)){
      event.preventDefault();event.stopImmediatePropagation();show(event.key==='Home'?0:event.key==='End'?slides.length-1:index+(['ArrowRight','PageDown'].includes(event.key)?1:-1));
    }
    if(event.key==='Tab'){
      const nodes=[...root.querySelectorAll('button:not(:disabled),select,canvas')].filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  },true);
  window.vaccinoPresentation={start,exit,show,state:()=>({active,index,total:slides.length,id:slides[index].id,mode:state.mode,fullscreen:document.fullscreenElement===root})};
}
