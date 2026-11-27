// Procedural PBR assets and quality policy. All textures are generated locally.
export function createStudio(T,renderer,scene,vehicleRoot,invalidate) {
  const textures=[];
  function texture(size,paint){const c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);const t=new T.CanvasTexture(c);textures.push(t);return t;}
  let seed=27427;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const metal=texture(256,(ctx,n)=>{
    ctx.fillStyle='#bdbdbd';ctx.fillRect(0,0,n,n);
    for(let i=0;i<1400;i++){const v=140+Math.floor(random()*95);ctx.strokeStyle=`rgba(${v},${v},${v},.24)`;const y=random()*n;ctx.beginPath();ctx.moveTo(random()*n,y);ctx.lineTo(random()*n,y+.15);ctx.stroke();}
  });
  metal.wrapS=metal.wrapT=T.RepeatWrapping;metal.repeat.set(2,3);
  const rubber=texture(256,(ctx,n)=>{
    const image=ctx.createImageData(n,n);for(let i=0;i<image.data.length;i+=4){const v=165+random()*65;image.data[i]=image.data[i+1]=image.data[i+2]=v;image.data[i+3]=255;}ctx.putImageData(image,0,0);
  });
  rubber.wrapS=rubber.wrapT=T.RepeatWrapping;rubber.repeat.set(8,3);
  const brake=texture(256,(ctx,n)=>{
    ctx.fillStyle='#a9a9a9';ctx.fillRect(0,0,n,n);
    for(let r=1;r<n*.7;r+=.8){const v=125+random()*75;ctx.strokeStyle=`rgba(${v},${v},${v},.35)`;ctx.beginPath();ctx.arc(n/2,n/2,r,0,Math.PI*2);ctx.stroke();}
  });
  const lettering=texture(512,(ctx,n)=>{
    ctx.clearRect(0,0,n,n);ctx.fillStyle='#9b9f94';ctx.font='bold 22px sans-serif';ctx.textAlign='center';
    const text='VACCİNO  /  TASARIM ÇALIŞMASI  /  ';
    for(let i=0;i<text.length;i++){ctx.save();ctx.translate(n/2,n/2);ctx.rotate(i/text.length*Math.PI*2);ctx.translate(0,-n*.445);ctx.fillText(text[i],0,0);ctx.restore();}
  });lettering.colorSpace=T.SRGBColorSpace;
  const studio=new T.Scene();studio.background=new T.Color(0x858b83);
  for(const [x,y,z,w,h,color] of [[-1,4,0,6,5,0xfff5e6],[-4,1.5,1,4,3,0xffffff],[3,1,-3,4,2,0xdde6ed],[0,.5,5,5,2,0x9caaa4]]){
    const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color,side:T.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);studio.add(p);
  }
  const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(studio,.05);scene.environment=environment.texture;pmrem.dispose();
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;
  const shadowTexture=texture(128,(ctx,n)=>{const g=ctx.createRadialGradient(n/2,n/2,2,n/2,n/2,n/2);g.addColorStop(0,'rgba(29,34,28,.44)');g.addColorStop(.38,'rgba(29,34,28,.23)');g.addColorStop(1,'rgba(29,34,28,0)');ctx.fillStyle=g;ctx.fillRect(0,0,n,n);});
  const shadows=new T.Group();shadows.name='approximate-contact-shadows';vehicleRoot.add(shadows);
  const shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,toneMapped:false});
  function shadow(w,h,x,z,y){const m=new T.Mesh(new T.PlaneGeometry(w,h),shadowMaterial);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);shadows.add(m);}
  shadow(3.6,1.9,0,0,.001);
  for(const x of [-.96,.87])for(const z of [-.66,.66])shadow(.47,.28,x,z,.002);
  const detailLevels=[];let requested='auto',resolved='',shadowEnabled=true,ratio=1;
  const presets={low:{ratio:1,micro:false,structure:false},balanced:{ratio:1.35,micro:false,structure:true},high:{ratio:2,micro:true,structure:true}};
  function quality(value=requested){
    requested=Object.hasOwn(presets,value)||value==='auto'?value:'auto';
    resolved=requested==='auto'?(matchMedia('(max-width:700px)').matches?'low':'balanced'):requested;
    const preset=presets[resolved];ratio=Math.min(devicePixelRatio||1,preset.ratio);renderer.setPixelRatio(ratio);
    detailLevels.forEach(({group,level})=>{group.visible=preset[level]!==false;});
    shadows.visible=shadowEnabled;invalidate();
    document.dispatchEvent(new CustomEvent('vaccino:graphics',{detail:status()}));
  }
  function status(){const size=renderer.getDrawingBufferSize(new T.Vector2());return {requested,resolved,pixelRatio:ratio,width:size.x,height:size.y,shadows:shadows.visible,detailLevels:detailLevels.map(d=>({level:d.level,visible:d.group.visible})),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,antialias:renderer.getContext().getContextAttributes()?.antialias===true};}
  function setShadows(enabled){shadowEnabled=!!enabled;shadows.visible=shadowEnabled;invalidate();document.dispatchEvent(new CustomEvent('vaccino:graphics',{detail:status()}));}
  const mobile=matchMedia('(max-width:700px)');mobile.addEventListener('change',()=>{if(requested==='auto')quality();});
  return {textures:{metal,rubber,brake,lettering},shadows,quality,setShadows,status,
    registerDetail(group,level='micro'){detailLevels.push({group,level});},
    apply(material,kind){
      if(kind==='rubber'){material.roughnessMap=rubber;material.bumpMap=rubber;material.bumpScale=.00018;material.roughness=.93;material.metalness=0;}
      else if(kind==='brake'){material.roughnessMap=brake;material.metalness=.86;material.roughness=.36;}
      else {material.roughnessMap=metal;material.bumpMap=metal;material.bumpScale=.000055;material.metalness=.82;material.roughness=kind==='cast'?.57:.33;}
      material.envMapIntensity=kind==='rubber'?.35:.85;
      return material;
    }
  };
}
