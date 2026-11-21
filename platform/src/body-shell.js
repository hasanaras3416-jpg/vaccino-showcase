// Symmetric parametric body concept fitted around the inherited V2 wheel locations.
// Not manufacturer CAD, CFD or a verified steering/suspension envelope.
export function createBodyShell(T,parent){
 const paint=new T.MeshPhysicalMaterial({color:0xf1f0e9,metalness:.12,roughness:.28,clearcoat:.8,clearcoatRoughness:.22,side:T.DoubleSide});
 const graphite=new T.MeshStandardMaterial({color:0x242c2f,metalness:.35,roughness:.43,side:T.DoubleSide});
 const gold=new T.MeshStandardMaterial({color:0xbc934b,metalness:.7,roughness:.32,side:T.DoubleSide});
 const glass=new T.MeshPhysicalMaterial({color:0x8babb1,metalness:.05,roughness:.12,transparent:true,opacity:.40,depthWrite:false,clearcoat:1,side:T.DoubleSide});
 const gasket=new T.MeshStandardMaterial({color:0x222c2e,roughness:.8});
 const stations=[[-1.49,.025,.22,.30],[-1.36,.30,.14,.46],[-1.16,.68,.11,.58],[-.96,.79,.11,.625],[-.69,.73,.11,.60],[-.38,.62,.12,.565],[.10,.635,.12,.58],[.54,.73,.12,.62],[.87,.79,.11,.80],[1.13,.68,.12,.76],[1.38,.36,.17,.61],[1.50,.025,.24,.45]];
 const profile=[[-.81,0],[-1,.18],[-1,.68],[-.94,.93],[-.7,1],[0,1],[.7,1],[.94,.93],[1,.68],[1,.18],[.81,0]];
 const cross=new T.CatmullRomCurve3(profile.map(([z,y])=>new T.Vector3(z,y,0)),false,'centripetal');
 const curve=new T.CatmullRomCurve3(stations.map(([x,w,b,t])=>new T.Vector3(x,w,t)),false,'centripetal');
 function section(u){const p=curve.getPoint(u);const x=p.x;let i=0;while(i<stations.length-2&&stations[i+1][0]<x)i++;const a=stations[i],b=stations[i+1],f=Math.max(0,Math.min(1,(x-a[0])/(b[0]-a[0])));return {x,w:p.y,base:a[2]+(b[2]-a[2])*f,top:p.z};}
 function surface(u,v){const s=section(u),c=cross.getPoint(v);let y=s.base+(s.top-s.base)*c.y;const z=s.w*c.x;
  if(Math.abs(z)>.50)for(const axle of [-.96,.87]){const dx=s.x-axle;if(Math.abs(dx)<.315)y=Math.max(y,.269+Math.sqrt(.315*.315-dx*dx));}
  return [s.x,y,z];}
 function grid(parent,material,nu,nv,point,skip=()=>false){const vertices=[],indices=[];for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++)vertices.push(...point(i/nu,j/nv));for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;const center=[0,1,2].map(k=>(vertices[a*3+k]+vertices[(a+1)*3+k]+vertices[b*3+k]+vertices[(b+1)*3+k])/4);if(!skip(center)){indices.push(a,b,a+1,b,b+1,a+1);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const mesh=new T.Mesh(g,material);mesh.userData.shellBaseOpacity=material.opacity;parent.add(mesh);return mesh;}
 const hatchVoid=([x,y,z])=>x>.71&&x<1.255&&Math.abs(z)<.275&&y>.53;
 const wheelVoid=([x,y,z])=>Math.abs(z)>.52&&[-.96,.87].some(cx=>(x-cx)**2+(y-.269)**2<.305**2);
 grid(parent,paint,180,48,(u,v)=>surface(u,.1+.8*v),hatchVoid);
 // Graphite lower sills follow the same sampled body, with no coplanar overlay.
 for(const side of [0,1])grid(parent,graphite,100,8,(u,v)=>surface(u,side?v*.10+.90:v*.10),wheelVoid);
 for(const x of [-.96,.87])for(const sign of [-1,1]){
  const outer=x<0?.85:.82;
  grid(parent,paint,60,10,(u,v)=>{const a=u*Math.PI,r=.306+.044*v;return [x+r*Math.cos(a),.269+r*Math.sin(a),sign*outer];});
  grid(parent,paint,60,10,(u,v)=>{const a=u*Math.PI,r=.35;return [x+r*Math.cos(a),.269+r*Math.sin(a),sign*(.50+(outer-.50)*v)];});
  // Upper wheel spat: closed outside, with a visual recess behind it.
  grid(parent,paint,60,10,(u,v)=>{const a=u*Math.PI,r=.306*v;return [x+r*Math.cos(a),.283+r*Math.sin(a),sign*(outer+.008*Math.sin(a)*(1-v))];});
 }
 // One-seat canopy, shaped from longitudinal and transverse curved sections.
 grid(parent,glass,80,40,(u,v)=>{const x=-.85+1.78*u,a=v*Math.PI,bulge=Math.sin(Math.PI*u),w=.65*Math.pow(Math.max(0,bulge),.20);return [x,.565+.58*Math.pow(Math.max(0,bulge),.65)*Math.pow(Math.max(0,Math.sin(a)),.40),w*Math.cos(a)];});
 function tube(points,r,mat){const m=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),80,r,6,false),mat);m.userData.shellBaseOpacity=mat.opacity;parent.add(m);return m;}
 for(const side of [-1,1]){
  const shoulder=[],window=[];for(let i=0;i<=50;i++){const u=i/50,s=section(u);if(s.x>-1.32&&s.x<1.36)shoulder.push([s.x,s.base+(s.top-s.base)*.93,side*s.w*.941]);const t=i/50;window.push([-.85+1.78*t,.566,side*.65*Math.pow(Math.max(0,Math.sin(Math.PI*t)),.20)]);}
  tube(shoulder,.006,gold);tube(window,.006,gasket);
 }
 // Curved service panel replaces a real hole in the upper rear body.
 function topAt(x){let nearest=section(0);for(let i=0;i<=200;i++){const s=section(i/200);if(Math.abs(s.x-x)<Math.abs(nearest.x-x))nearest=s;}return nearest.top;}
 const hinge=new T.Group();hinge.position.set(1.25,topAt(1.25),0);parent.add(hinge);
 grid(hinge,paint,32,12,(u,v)=>{const x=.71+.545*u,z=(v-.5)*.55;return [x-1.25,topAt(x)-hinge.position.y+.004,z];});
 const handle=new T.Mesh(new T.BoxGeometry(.035,.008,.09),graphite);handle.position.set(-.47,.065,0);handle.userData.shellBaseOpacity=1;hinge.add(handle);
 const lamp=new T.MeshStandardMaterial({color:0xe3eee8,emissive:0xb3d4d3,emissiveIntensity:.7,roughness:.2});
 for(const side of [-1,1])tube([[-1.405,.35,side*.13],[-1.37,.40,side*.21],[-1.29,.43,side*.28]],.010,lamp);
 let controlled=false,mode='hidden',fade=0,hatch=0;
 const targetOpacity=()=>mode==='hidden'?0:mode==='transparent'?.22:1;
 function applyOpacity(){
  let changed=false;
  parent.visible=fade>.003;
  parent.traverse(m=>{
   if(!m.isMesh)return;
   const opacity=(m.userData.shellBaseOpacity??1)*fade;
   if(Math.abs(m.material.opacity-opacity)<=.001)return;
   m.material.opacity=opacity;
   m.material.transparent=opacity<.999;
   m.material.depthWrite=opacity>.85;
   m.material.needsUpdate=true;
   changed=true;
  });
  return changed;
 }
 function style(next,{immediate=false}={}){
  if(!['solid','transparent','hidden'].includes(next))throw Error('Geçersiz kabuk görünümü');
  controlled=true;mode=next;
  if(next!=='hidden')parent.visible=true;
  if(immediate){fade=targetOpacity();applyOpacity();}
 }
 function tick(dt,hatchOpen=false){
  let changed=false;
  const end=hatchOpen?-1.05:0;
  if(Math.abs(hatch-end)>.001){hatch+=(end-hatch)*(1-Math.exp(-6*dt));hinge.rotation.z=hatch;changed=true;}
  if(controlled){
   const goal=targetOpacity();
   if(Math.abs(fade-goal)>.001){fade+=(goal-fade)*(1-Math.exp(-7*dt));changed=true;}
   else fade=goal;
   if(applyOpacity())changed=true;
  }
  return changed;
 }
 return {style,tick,release(){controlled=false;parent.traverse(m=>{if(m.isMesh){const opacity=m.userData.shellBaseOpacity??1;m.material.opacity=opacity;m.material.transparent=opacity<1;m.material.depthWrite=opacity>.85;}});},state:()=>({mode,controlled,opacity:fade,hatchAngle:hinge.rotation.z,vertices:parent.children.filter(m=>m.isMesh).reduce((n,m)=>n+(m.geometry?.attributes.position.count||0),0)})};
}
