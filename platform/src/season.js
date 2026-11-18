const homePose = {az:-.88,el:.38,rad:3.65,target:[0,.36,0]};

export async function loadBrandLogo() {
  const image=new Image();
  image.src='assets/branding/vaccino-logo.png';
  try { await image.decode(); } catch { return null; }
  for(const link of document.querySelectorAll('.studio-brand,.sidebar .brand')){
    const mark=image.cloneNode();
    mark.alt='';
    link.replaceChildren(mark);
  }
  const icon=document.createElement('link');
  icon.rel='icon';
  icon.href=image.src;
  document.head.append(icon);
  image.alt='';
  return image;
}

export function initializeSeason(logo,openMenu=()=>{}) {
  const intro=document.getElementById('season-intro');
  const start=document.getElementById('season-start');
  const skip=document.getElementById('season-skip');

  const onHome=()=>['','#','#/overview','#overview'].includes(location.hash);
  if (!onHome()) return async ()=>{};
  const error=document.getElementById('season-error');
  let timeout;

  function finish({focus=true,showMenu=false}={}) {
    clearTimeout(timeout);
    intro.close();
    if(onHome()) window.vaccino?.setStudioPose(homePose,0);
    const tour=document.getElementById('presentation-enter');
    if(showMenu) openMenu();
    else if(focus) (tour.disabled?document.getElementById('menu-toggle'):tour).focus({preventScroll:true});
  }
  start.onclick=()=>{
    const api=window.vaccino;
    if(!api || matchMedia('(prefers-reduced-motion: reduce)').matches) return finish({showMenu:true});
    api.setStudioPose({az:-1.48,el:.17,rad:9,target:[0,.36,0]},0);
    intro.classList.add('season-revealing');
    start.disabled=true;
    skip.focus();
    api.setStudioPose(homePose,3600);
    timeout=setTimeout(()=>finish({showMenu:true}),3650);
  };
  skip.onclick=()=>finish();
  intro.addEventListener('cancel',event=>{
    event.preventDefault();
    finish();
  });
  window.addEventListener('hashchange',()=>{
    if(intro.open&&!onHome()) finish({focus:false});
  });
  start.disabled=true;
  skip.hidden=true;
  intro.showModal();
  return async ()=>{
    const mark=await logo;
    if(!intro.open) return;
    skip.hidden=false;
    if(!mark){
      start.hidden=true;
      error.hidden=false;
      intro.classList.add('season-unavailable');
      skip.textContent='Stüdyoya geç';
      skip.focus();
      return;
    }
    start.replaceChildren(mark);
    start.disabled=false;
    start.focus();
  };
}
