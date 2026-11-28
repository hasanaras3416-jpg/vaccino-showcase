/* Çift salıncak + coilover ADAYI, revizyon 2 (layout-1900-r2.js). Kinematik önden görünüşte çözülür (cornerSolver,
   suspension-1900.js; değişmedi). Bu sürümde A-kol bacakları köşe başına ayrı x'te (asimetrik) ve coilover kendi
   düzleminde durur (ön x=600, arka x=2360). Coilover alt ucu alt kolun %75'indedir; bacak rotile doğru eğik gittiği
   için o noktada bacak başka x'tedir → alt uçtan bacağa kısa bir braket çizilir (boyu kartta). ADAY – doğrulanmadı. */
import {layout1900r2} from './layout-1900-r2.js';
import {cornerSolver, toGlb} from './suspension-1900.js';

/* Coilover alt ucunun bacak üzerindeki karşılığı (aynı z, y): bacak (legX, iç z) → (dingil x, dış z) doğrusu */
export function legPointAtMount(corner, axleX, mount) {
  const back = corner.legs.reduce((a, b) => (Math.abs(b - corner.coilover.plane) < Math.abs(a - corner.coilover.plane) ? b : a));
  const k = (mount[0] - corner.lower.inner[0]) / (corner.lower.outer[0] - corner.lower.inner[0]);
  return {x: back + (axleX - back) * k, legX: back};
}

export function buildSuspension1900r2(T, layout = layout1900r2) {
  const mat = (color, metalness = .3, roughness = .45) => new T.MeshStandardMaterial({color, metalness, roughness});
  const arm = mat(0x56606a, .58), machined = mat(0xbec7ce, .64, .3), damper = mat(0x2b3238, .4, .5), spring = mat(0xcbb98b, .5, .4), bracket = mat(0xe9a85b, .45, .4);
  const unitCyl = new T.CylinderGeometry(1, 1, 1, 18), ball = new T.SphereGeometry(1, 12, 8);
  const helix = []; for (let i = 0; i <= 160; i++) { const t = i / 160, a = t * 9 * 2 * Math.PI; helix.push(new T.Vector3(Math.cos(a), t, Math.sin(a))); }
  const springGeo = new T.TubeGeometry(new T.CatmullRomCurve3(helix), 160, .09, 6, false);
  const group = new T.Group(); group.name = 'Suspension1900r2';
  const up = new T.Vector3(0, 1, 0);
  const rod = (r, material) => { const m = new T.Mesh(unitCyl, material); m.userData.r = r; group.add(m); return m; };
  const joint = (r, material = arm) => { const m = new T.Mesh(ball, material); m.scale.setScalar(r); group.add(m); return m; };
  function place(m, a, b) {
    const v = new T.Vector3(...a), w = new T.Vector3(...b), d = w.clone().sub(v), len = Math.max(d.length(), 1e-6);
    m.position.copy(v.add(w).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(up, d.normalize()); m.scale.set(m.userData.r, len, m.userData.r);
  }
  const corners = [];
  for (const key of ['front', 'rear']) for (const s of [-1, 1]) {
    const c = layout.corners[key], x = layout.axles[key], half = layout.track[key] / 2;
    corners.push({key, s, c, x, half, solve: cornerSolver(c, half, layout.wheelY),
      P: ([z, y], px = x) => toGlb([px, y, s * z]),
      m: {lowLegs: c.legs.map(() => rod(.011, arm)), upLegs: c.legs.map(() => rod(.011, arm)), upright: rod(.02, machined), spindle: rod(.018, machined),
          damperBody: rod(layout.coilover.damperD / 2000, damper), shaft: rod(.008, machined), spring: (() => { const m = new T.Mesh(springGeo, spring); group.add(m); return m; })(),
          bracket: rod(.008, bracket), pivots: [...c.legs, ...c.legs].map(() => joint(.015)), ballLow: joint(.017), ballUp: joint(.017), mountLow: joint(.014), mountTop: joint(.014)}});
  }
  const springR = layout.coilover.springD / 2000;
  function setTravel(travel = 0) {
    const out = {};
    for (const k of corners) {
      const {c, P, m, s, x, half} = k, p = k.solve(travel), plane = c.coilover.plane;
      c.legs.forEach((lx, i) => {
        place(m.lowLegs[i], P(c.lower.inner, lx), P(p.lower)); place(m.upLegs[i], P(c.upper.inner, lx), P(p.upper));
        m.pivots[i].position.set(...P(c.lower.inner, lx)); m.pivots[i + c.legs.length].position.set(...P(c.upper.inner, lx));
      });
      place(m.upright, P(p.lower), P(p.upper));
      place(m.spindle, P([(p.lower[0] + p.upper[0]) / 2, p.wheel[1]]), P(p.wheel));
      m.ballLow.position.set(...P(p.lower)); m.ballUp.position.set(...P(p.upper));
      // Coilover: kendi düzleminde, alt ucu alt kolun %75'i (önden görünüşte), üst ucu çember enine borusunda
      const a = P(p.mount, plane), b = P(c.coilover.top, plane), A = new T.Vector3(...a), B = new T.Vector3(...b), axis = B.clone().sub(A), len = axis.length();
      place(m.damperBody, B.clone().addScaledVector(axis, -.58).toArray(), b);
      place(m.shaft, a, B.clone().addScaledVector(axis, -.5).toArray());
      m.spring.position.copy(A.clone().addScaledVector(axis, .12)); m.spring.quaternion.setFromUnitVectors(up, axis.clone().normalize()); m.spring.scale.set(springR, len * .8, springR);
      m.mountLow.position.copy(A); m.mountTop.position.copy(B);
      const leg = legPointAtMount({...c, lower: {inner: c.lower.inner, outer: p.lower}}, x, p.mount);
      place(m.bracket, a, P(p.mount, leg.x));
      if (s === 1) out[k.key] = {camberDeg: p.camberDeg, coilover: p.coilover, wheelDz: p.wheel[0] - half, wheelDy: p.wheel[1] - layout.wheelY,
        mount: p.mount, wheel: p.wheel, lower: p.lower, upper: p.upper, bracket: Math.abs(leg.x - plane)};
    }
    return out;
  }
  const rest = setTravel(0);
  return {group, setTravel, rest};
}
