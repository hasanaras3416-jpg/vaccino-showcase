// Additional concept geometry. Dimensions are visual reserves, not manufacturing CAD.
export function addMechanicalDetails(T,{chassis,suspension,brakes,motorGroup,diffGroup,axleGroup,wheels,studio}) {
  const metal=studio.apply(new T.MeshStandardMaterial({color:0xb5bdc0}),'metal');
  const dark=studio.apply(new T.MeshStandardMaterial({color:0x49515a}),'cast');
  const rubber=studio.apply(new T.MeshStandardMaterial({color:0x252929}),'rubber');
  const weld=studio.apply(new T.MeshStandardMaterial({color:0x8e999e}),'cast');
  const brass=new T.MeshStandardMaterial({color:0xb69b59,metalness:.78,roughness:.43});
  const primary=new Map(),micro=new Map();
  function group(parent,level='structure'){
    const map=level==='micro'?micro:primary;if(map.has(parent))return map.get(parent);
    const g=new T.Group();g.name=`concept-${level}-details`;parent.add(g);studio.registerDetail(g,level);map.set(parent,g);return g;
  }
  const matrix=new T.Matrix4(),q=new T.Quaternion(),p=new T.Vector3(),scale=new T.Vector3();
  function batch(parent,geometry,material,items,level='structure'){
    const mesh=new T.InstancedMesh(geometry,material,items.length);items.forEach((item,i)=>{
      p.fromArray(item.p);scale.fromArray(item.s||[1,1,1]);q.setFromEuler(new T.Euler(...(item.r||[0,0,0])));matrix.compose(p,q,scale);mesh.setMatrixAt(i,matrix);
    });mesh.instanceMatrix.needsUpdate=true;group(parent,level).add(mesh);return mesh;
  }
  const cylinder=new T.CylinderGeometry(1,1,1,16),hex=new T.CylinderGeometry(1,1,1,6),box=new T.BoxGeometry(1,1,1);
  const bushings=[],caps=[],bolts=[],seams=[],plates=[],plateBolts=[];
  for(const x of [-.20,.35])for(const z of [-.54,.54]){
    plates.push({p:[x,.205,z],s:[.092,.007,.064]});seams.push({p:[x,.182,z],s:[.0205,.0205,.0205]});
    for(const dx of [-.029,.029])plateBolts.push({p:[x+dx,.216,z],s:[.006,.009,.006]});
  }
  batch(chassis,box,metal,plates);batch(chassis,hex,dark,plateBolts);
  batch(chassis,new T.TorusGeometry(1,.12,6,28),weld,seams,'micro');
  for(const axle of [-.96,.87])for(const side of [-1,1]){
    const width=axle<0?.185:.254;
    for(const [y,inner] of [[.195,width],[.365,width+.016]])for(const x of [axle-.168,axle+.154]){
      bushings.push({p:[x,y,side*inner],s:[.019,.039,.019],r:[0,0,Math.PI/2]});
      for(const dx of [-.024,.024])caps.push({p:[x+dx,y,side*inner],s:[.023,.004,.023],r:[0,0,Math.PI/2]});
      bolts.push({p:[x+.030,y,side*inner],s:[.0075,.008,.0075],r:[0,0,Math.PI/2]});
    }
  }
  batch(suspension,cylinder,rubber,bushings);batch(suspension,cylinder,metal,caps);batch(suspension,hex,dark,bolts);
  // Caliper fasteners stay on the upright, not the rotating wheel.
  const caliperBolts=[];for(const x of [-.96,.87])for(const z of [-.66,.66])for(const dx of [-.024,.024])caliperBolts.push({p:[x+.071+dx,.405,z-Math.sign(z)*.057],s:[.0045,.006,.0045]});
  batch(brakes,hex,metal,caliperBolts,'micro');
  // Motor cradle plate and captive hardware, below the casing envelope.
  batch(motorGroup,box,metal,[{p:[.49,.160,-.054],s:[.25,.011,.25]}]);
  const motorBolts=[];for(const x of [.395,.585])for(const z of [-.15,.04])motorBolts.push({p:[x,.175,z],s:[.007,.012,.007]});batch(motorGroup,hex,dark,motorBolts);
  const flange=new T.Mesh(new T.TorusGeometry(.109,.006,10,56),metal);flange.scale.set(1.075,.975,1);flange.position.set(.87,.269,0);group(diffGroup).add(flange);
  const differentialBolts=[];
  for(let i=0;i<10;i++){const a=i*Math.PI/5;differentialBolts.push({p:[.87+.113*Math.cos(a),.269+.103*Math.sin(a),.012],s:[.005,.012,.005],r:[Math.PI/2,0,0]});}
  batch(diffGroup,hex,dark,differentialBolts,'micro');
  const bearingCollars=[];for(const z of [-.169,.183])bearingCollars.push({p:[.87,.269,z],s:[1,1,1]});batch(diffGroup,new T.TorusGeometry(.045,.006,10,40),metal,bearingCollars);
  // Raised sidewall typography and bead lines move with each wheel.
  for(const wheel of wheels.children){
    const side=Math.sign(wheel.position.z);const g=group(wheel,'micro');
    for(const z of [-.062,.062]){
      const bead=new T.Mesh(new T.TorusGeometry(.245,.0018,6,64),rubber);bead.position.z=z;g.add(bead);
    }
    const label=new T.Mesh(new T.RingGeometry(.214,.267,64),new T.MeshStandardMaterial({map:studio.textures.lettering,transparent:true,depthWrite:false,roughness:.95,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}));label.position.z=side*.0685;if(side<0)label.rotation.y=Math.PI;g.add(label);
    const cap=new T.Mesh(new T.CylinderGeometry(.029,.032,.013,32),dark);cap.rotation.x=Math.PI/2;cap.position.z=side*.054;g.add(cap);
  }
  return {concept:true,primaryGroups:[...primary.values()],microGroups:[...micro.values()]};
}
