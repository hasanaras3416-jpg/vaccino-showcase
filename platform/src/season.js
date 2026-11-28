export async function loadBrandLogo() {
  const image=new Image();
  image.src='assets/branding/vaccino-logo.png';
  try { await image.decode(); } catch { return null; }
  for(const link of document.querySelectorAll('.studio-brand,.sidebar .brand')){
    const mark=image.cloneNode();
    mark.alt='';
    link.replaceChildren(mark);
  }
  image.alt='';
  return image;
}

export function initializeSeason(logo) {
  const intro=document.getElementById('season-intro');
  const start=document.getElementById('season-start');
  const skip=document.getElementById('season-skip');

  const onHome=()=>['','#','#/overview','#overview'].includes(location.hash);
  if (!onHome()) return async ()=>{};
  const error=document.getElementById('season-error');
  function finish({focus=true,reset=true}={}) {
    if(!intro.open)return;
    if(reset&&onHome())window.vaccino?.resetHomeView();
    intro.close();
    if(focus)(document.querySelector('.primary-nav a[aria-current]')||document.querySelector('.primary-nav a'))?.focus({preventScroll:true});
  }
  start.onclick=()=>{
    const api=window.vaccino;
    if(!api || matchMedia('(prefers-reduced-motion: reduce)').matches)return finish();
    api.setStudioPose({az:-1.32,el:.16,rad:8.5,target:[0,.36,0]},0);
    intro.classList.add('season-revealing');
    start.disabled=true;
    skip.focus();
    // Close the dialog after the final camera frame has been rendered.
    api.resetHomeView(2700,()=>requestAnimationFrame(()=>finish({reset:false})));
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
      skip.textContent='Siteye geç';
      skip.focus();
      return;
    }
    start.replaceChildren(mark);
    start.disabled=false;
    start.focus();
  };
}
