/* Interactive Driver concept exhibit — deliberately illustrative, not PPE CAD. */
export function initializeDriver() {
 const canvas=document.getElementById('driver-canvas');
 const stage=document.getElementById('driver-stage');
 const dots=document.getElementById('driver-hotspots');
 if(!canvas||!stage||!window.THREE)return;
 const T=window.THREE;
 let renderer;
 try {renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});}
 catch(error){stage.insertAdjacentHTML('beforeend','<p class="driver-render-fallback">3B görünüm açılamadı. WebGL desteğini kontrol edin.</p>');return;}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
 renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;
 renderer.toneMappingExposure=1.45;
 const scene=new T.Scene();
 const camera=new T.PerspectiveCamera(34,1,.1,80);
 scene.add(new T.HemisphereLight(0xeff3f9,0x534a40,2.2));
 const key=new T.DirectionalLight(0xffffff,3.1);key.position.set(-3,8,6);scene.add(key);
 const rim=new T.DirectionalLight(0xc2a979,2);rim.position.set(3,6,-4);scene.add(rim);
 const pilot=new T.Group();scene.add(pilot);
 const mat=(color,roughness=.7,metalness=.05)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const suit=mat(0x161b1e,.83),suitEdge=mat(0x303436,.89),gold=mat(0xcaa365,.28,.55),
       helmet=mat(0x171b1e,.22,.44),visor=mat(0x101d25,.07,.25),gloves=mat(0x25292b,.85),
       boots=mat(0x101213,.86),stand=mat(0x1a1d1f,.43,.55);
 const orb=(parent,x,y,z,sx,sy,sz,material)=>{
   const m=new T.Mesh(new T.SphereGeometry(1,24,16),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
 };
 const cyl=(parent,a,b,r1,r2,material)=>{
   const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);
   const m=new T.Mesh(new T.CylinderGeometry(r2,r1,v.length(),20,1),material);
   m.position.copy(p.add(q).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());parent.add(m);return m;
 };
 const box=(parent,x,y,z,w,h,d,material)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material);m.position.set(x,y,z);parent.add(m);return m};
 // Stand and full-body race mannequin.
 const disk=new T.Mesh(new T.CylinderGeometry(.78,.83,.13,64),stand);
 disk.position.y=.065;pilot.add(disk);
 const inlay=new T.Mesh(new T.TorusGeometry(.70,.012,10,60),gold);inlay.rotation.x=Math.PI/2;inlay.position.y=.139;pilot.add(inlay);
 const plinth=new T.Mesh(new T.CylinderGeometry(.16,.20,.27,40),stand);plinth.position.y=.26;pilot.add(plinth);
 // Silhouette is intentionally simplified for concept visualization.
 orb(pilot,0,2.28,0,.38,.50,.25,suit);
 orb(pilot,0,1.86,0,.30,.25,.24,suit);
 orb(pilot,0,1.62,0,.30,.22,.24,suitEdge);
 cyl(pilot,[-.19,1.64,0],[-.19,.75,0],.145,.117,suit);
 cyl(pilot,[.19,1.64,0],[.19,.75,0],.145,.117,suit);
 orb(pilot,-.19,.73,.012,.122,.12,.13,suit);
 orb(pilot,.19,.73,.012,.122,.12,.13,suit);
 box(pilot,-.19,.39,.09,.23,.45,.40,boots);
 box(pilot,.19,.39,.09,.23,.45,.40,boots);
 orb(pilot,0,2.79,0,.14,.18,.15,suit);
 // Arms, gloves, shoulder patches.
 for(const s of [-1,1]){
  orb(pilot,s*.40,2.57,0,.18,.16,.21,suit);
  cyl(pilot,[s*.42,2.48,0],[s*.48,2.04,.015],.142,.113,suit);
  orb(pilot,s*.48,2.02,.017,.124,.11,.125,suitEdge);
  cyl(pilot,[s*.48,2.01,.017],[s*.46,1.65,.17],.115,.09,suit);
  orb(pilot,s*.46,1.58,.17,.10,.13,.10,gloves);
  box(pilot,s*.425,2.49,.173,.11,.035,.038,gold);
  cyl(pilot,[s*.19,.9,.12],[s*.19,.63,.13],.03,.03,suitEdge);
 }
 // Waist detail, zip and chest insignia.
 box(pilot,0,1.81,.241,.56,.075,.025,suitEdge);
 box(pilot,0,2.32,.255,.018,.62,.026,suitEdge);
 const drawLabel=(paint,w=512,h=512)=>{
  const el=document.createElement('canvas');el.width=w;el.height=h;
  paint(el.getContext('2d'),w,h);
  const tx=new T.CanvasTexture(el);tx.colorSpace=T.SRGBColorSpace;
  return new T.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,side:T.DoubleSide});
 };
 const vMaterial=drawLabel((ctx,w,h)=>{
   ctx.clearRect(0,0,w,h);ctx.textAlign='center';ctx.font='bold 330px Arial';ctx.fillStyle='#cda768';ctx.fillText('V',w/2,355);
 });
 const vMark=new T.Mesh(new T.PlaneGeometry(.24,.27),vMaterial);vMark.position.set(0,2.50,.265);pilot.add(vMark);
 const shellMaterial=drawLabel((ctx,w,h)=>{
   ctx.clearRect(0,0,w,h);ctx.fillStyle='#f3d169';ctx.font='bold 112px Arial';ctx.textAlign='center';ctx.fillText('SHELL',w/2,270);
 });
 const shellMark=new T.Mesh(new T.PlaneGeometry(.18,.16),shellMaterial);shellMark.position.set(.20,2.32,.258);pilot.add(shellMark);
 // Replace text placeholder with the existing supplied Shell emblem when the asset is available.
 new T.TextureLoader().load('assets/branding/shell-logo.png',texture=>{
   texture.colorSpace=T.SRGBColorSpace;
   shellMark.material=new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide});
   paint=true;
 },undefined,()=>{ /* Keep the visible wordmark fallback. */ });
 // Helmet shell, dark shield and gold piping.
 orb(pilot,0,3.02,0,.26,.33,.285,helmet);
 orb(pilot,0,3.09,.224,.233,.156,.069,visor);
 orb(pilot,0,2.92,.265,.235,.092,.066,visor);
 const trim=new T.Mesh(new T.TorusGeometry(.208,.011,8,40,Math.PI),gold);
 trim.rotation.z=Math.PI;trim.position.set(0,2.955,.280);pilot.add(trim);
 box(pilot,0,2.77,.226,.24,.05,.085,helmet);
 const anchors={
  helmet:new T.Vector3(.19,3.17,.24),
  gloves:new T.Vector3(-.46,1.61,.17),
  suit:new T.Vector3(.18,2.49,.27)
 };
 const descriptions={
  helmet:['Kask','Tam yüz korumalı yarış kaskı konsepti. Gerçek kabuk, vizör, sertifikasyon, uygun beden ve yarışma koşulları ürün seçimi sırasında doğrulanacak.'],
  gloves:['Eldiven','Siyah yarış eldiveni konsepti. Kavrama hissi, hareket serbestliği, dayanım ve istenen standartlar gerçek ürün üzerinde incelenecek.'],
  suit:['Tulum','Siyah pilot tulumu; göğüste altın V, küçük Shell işareti ve sade yarış çizgileri. Alev geciktiricilik ve uygunluk bu görselden çıkarılamaz.']
 };
 const buttons={};
 for(const [id,label] of [['helmet','Kask'],['gloves','Eldiven'],['suit','Tulum']]){
   const button=document.createElement('button');button.className='driver-dot';button.type='button';button.textContent='+';button.title=label;button.setAttribute('aria-label',label+' detaylarını aç');dots.append(button);buttons[id]=button;
   button.addEventListener('click',()=>select(id));
 }
 function select(id){
  document.getElementById('driver-item-title').textContent=descriptions[id][0];
  document.getElementById('driver-item-text').textContent=descriptions[id][1];
  for(const [key,b] of Object.entries(buttons))b.setAttribute('aria-pressed',String(key===id));
 }
 select('suit');
 let az=-.16,el=.05,dist=6.9,drag=null,paint=true;
 const mouse=(e)=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};az+=dx*.008;el=Math.max(-.35,Math.min(.4,el+dy*.003));paint=true};
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',mouse);
 canvas.addEventListener('pointerup',()=>drag=null);
 canvas.addEventListener('pointercancel',()=>drag=null);
 canvas.addEventListener('wheel',e=>{e.preventDefault();dist=Math.max(4.7,Math.min(10,dist+e.deltaY*.006));paint=true},{passive:false});
 canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){az+=(e.key==='ArrowLeft'?-1:1)*.17;paint=true;e.preventDefault()}});
 document.getElementById('driver-reset').onclick=()=>{az=-.16;el=.05;dist=6.9;paint=true};
 const resize=new ResizeObserver(()=>{const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();paint=true});
 resize.observe(stage);
 const v=new T.Vector3();
 function frame(){
   requestAnimationFrame(frame);
   if(document.body.dataset.route!=='driver')return;
   if(!paint)return;
   paint=false;
   pilot.rotation.y=az;
   camera.position.set(0,2.02+el*3,dist);camera.lookAt(0,1.76,0);
   renderer.render(scene,camera);
   for(const [id,anchor] of Object.entries(anchors)){
     v.copy(anchor).applyMatrix4(pilot.matrixWorld).project(camera);
     const b=buttons[id];
     const isVisible=v.z<1&&v.z>-1;
     b.hidden=!isVisible;
     b.style.left=((v.x+1)*.5*stage.clientWidth)+'px';
     b.style.top=((1-v.y)*.5*stage.clientHeight)+'px';
   }
 }
 frame();
}
