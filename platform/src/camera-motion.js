// Render-only camera interpolation. Does not integrate any vehicle physics.
export function createCameraMotion({read, write, invalidate}) {
  let motion=null;
  const copy=pose=>({...pose,target:[...pose.target]});
  return {
    moveTo(pose, duration=1000, onComplete) {
      const from=copy(read()),to=copy(pose);
      const delta=((to.az-from.az+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
      to.az=from.az+delta;
      if(matchMedia('(prefers-reduced-motion: reduce)').matches||duration<=0){write(to);motion=null;invalidate();onComplete?.();return;}
      motion={from,to,start:performance.now(),duration,onComplete};invalidate();
    },
    tick(now) {
      if(!motion)return false;
      const t=Math.min(1,Math.max(0,(now-motion.start)/motion.duration));
      const s=t*t*(3-2*t),lerp=(a,b)=>a+(b-a)*s;
      write({az:lerp(motion.from.az,motion.to.az),el:lerp(motion.from.el,motion.to.el),rad:lerp(motion.from.rad,motion.to.rad),target:motion.from.target.map((v,i)=>lerp(v,motion.to.target[i]))});
      if(t===1){const {onComplete}=motion;motion=null;onComplete?.();}
      return true;
    },
    cancel(){motion=null;},
    get active(){return !!motion;}
  };
}
