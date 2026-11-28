/* Çift salıncak + coilover ADAYI (layout-1900.js). Her tekerlek bir dört-çubuk mekanizmasıdır (önden görünüş, z–y):
   alt kol iç pivot etrafında döner, üst rotil = üst kol çemberi ∩ dikme boyu çemberi. Tekerlek hareketi (mm) verilince
   alt kol açısı ikiye bölme ile bulunur; rotiller, teker merkezi, kamber ve coilover boyu buna göre hesaplanır.
   ADAY – doğrulanmadı. Koordinatlar STEP mm; sahneye toGlb ile taşınır (bkz. rep-parts.js). */
import {layout1900} from './layout-1900.js';

export const toGlb = ([x, y, z]) => [(x - 1400) / 1000, (y + 135) / 1000, z / 1000];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/* Bir köşe için çözücü. Dönüş: {wheel:[z,y], camberDeg, coilover, lower:[z,y], upper:[z,y], mount:[z,y]} */
export function cornerSolver(corner, wheelZ, wheelY) {
  const Li = corner.lower.inner, Lo = corner.lower.outer, Ui = corner.upper.inner, Uo = corner.upper.outer, top = corner.coilover.top;
  const lL = dist(Li, Lo), lU = dist(Ui, Uo), lUp = dist(Lo, Uo), at = corner.coilover.lowerAt;
  const up0 = Math.atan2(Uo[1] - Lo[1], Uo[0] - Lo[0]);
  const ux0 = (Uo[0] - Lo[0]) / lUp, uy0 = (Uo[1] - Lo[1]) / lUp;
  const wl = [(wheelZ - Lo[0]) * ux0 + (wheelY - Lo[1]) * uy0, -(wheelZ - Lo[0]) * uy0 + (wheelY - Lo[1]) * ux0];   // teker merkezi dikme ekseninde
  const phi0 = Math.atan2(Lo[1] - Li[1], Lo[0] - Li[0]);
  function pose(phi) {
    const L = [Li[0] + lL * Math.cos(phi), Li[1] + lL * Math.sin(phi)];
    const d = dist(L, Ui), a = (lU * lU - lUp * lUp + d * d) / (2 * d), h = Math.sqrt(Math.max(0, lU * lU - a * a));
    const ex = [(L[0] - Ui[0]) / d, (L[1] - Ui[1]) / d], P = [Ui[0] + a * ex[0], Ui[1] + a * ex[1]];
    const c1 = [P[0] + h * ex[1], P[1] - h * ex[0]], c2 = [P[0] - h * ex[1], P[1] + h * ex[0]];
    const U = dist(c1, Uo) < dist(c2, Uo) ? c1 : c2;
    const ux = (U[0] - L[0]) / lUp, uy = (U[1] - L[1]) / lUp;
    const wheel = [L[0] + wl[0] * ux - wl[1] * uy, L[1] + wl[0] * uy + wl[1] * ux];
    const mount = [Li[0] + at * (L[0] - Li[0]), Li[1] + at * (L[1] - Li[1])];
    // Dikme açısı artınca üst uç içeri yatar → negatif kamber
    const camberDeg = -(Math.atan2(U[1] - L[1], U[0] - L[0]) - up0) * 180 / Math.PI;
    return {wheel, camberDeg, coilover: dist(mount, top), lower: L, upper: U, mount};
  }
  return travel => {
    let lo = phi0 - .5, hi = phi0 + .5;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (pose(mid).wheel[1] - wheelY < travel) lo = mid; else hi = mid; }
    return pose((lo + hi) / 2);
  };
}

export function buildSuspension1900(T, layout = layout1900) {
  const mat = (color, metalness = .3, roughness = .45) => new T.MeshStandardMaterial({color, metalness, roughness});
  const arm = mat(0x56606a, .58), machined = mat(0xbec7ce, .64, .3), damper = mat(0x2b3238, .4, .5), spring = mat(0xcbb98b, .5, .4);
  const unitCyl = new T.CylinderGeometry(1, 1, 1, 18), ball = new T.SphereGeometry(1, 12, 8);
  // Yay: birim boyda sarmal (Y ekseni), boyu değiştikçe Y'de ölçeklenir
  const helix = []; for (let i = 0; i <= 160; i++) { const t = i / 160, a = t * 9 * 2 * Math.PI; helix.push(new T.Vector3(Math.cos(a), t, Math.sin(a))); }
  const springGeo = new T.TubeGeometry(new T.CatmullRomCurve3(helix), 160, .09, 6, false);
  const group = new T.Group(); group.name = 'Suspension1900';
  const up = new T.Vector3(0, 1, 0);
  const rod = (r, material) => { const m = new T.Mesh(unitCyl, material); m.userData.r = r; group.add(m); return m; };
  const joint = (r, material = arm) => { const m = new T.Mesh(ball, material); m.scale.setScalar(r); group.add(m); return m; };
  function place(m, a, b) {
    const v = new T.Vector3(...a), w = new T.Vector3(...b), d = w.clone().sub(v), len = d.length();
    m.position.copy(v.add(w).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(up, d.normalize()); m.scale.set(m.userData.r, len, m.userData.r);
  }
  const corners = [];
  for (const key of ['front', 'rear']) for (const s of [-1, 1]) {
    const c = layout.corners[key], x = layout.axles[key], half = layout.track[key] / 2;
    const solve = cornerSolver(c, half, layout.wheelY);
    const P = ([z, y], dx = 0) => toGlb([x + dx, y, s * z]);
    const m = {
      lowLegs: [rod(.011, arm), rod(.011, arm)], upLegs: [rod(.011, arm), rod(.011, arm)],
      upright: rod(.02, machined), spindle: rod(.018, machined),
      damperBody: rod(layout.coilover.damperD / 2000, damper), shaft: rod(.008, machined), spring: new T.Mesh(springGeo, spring),
      pivots: [joint(.015), joint(.015), joint(.015), joint(.015)], ballLow: joint(.017), ballUp: joint(.017), mountLow: joint(.014), mountTop: joint(.014)
    };
    group.add(m.spring);
    corners.push({key, s, c, x, half, solve, P, m});
  }
  const springR = layout.coilover.springD / 2000;
  function setTravel(travel = 0) {
    const out = {};
    for (const k of corners) {
      const {c, P, m, s, half} = k, p = k.solve(travel), off = layout.legOffset;
      const Li = c.lower.inner, Ui = c.upper.inner, top = c.coilover.top;
      [-off, off].forEach((dx, i) => { place(m.lowLegs[i], P(Li, dx), P(p.lower)); place(m.upLegs[i], P(Ui, dx), P(p.upper)); m.pivots[i].position.set(...P(Li, dx)); m.pivots[i + 2].position.set(...P(Ui, dx)); });
      place(m.upright, P(p.lower), P(p.upper));
      place(m.spindle, P([(p.lower[0] + p.upper[0]) / 2, p.wheel[1]]), P(p.wheel));
      m.ballLow.position.set(...P(p.lower)); m.ballUp.position.set(...P(p.upper));
      const a = P(p.mount), b = P(top), A = new T.Vector3(...a), B = new T.Vector3(...b), axis = B.clone().sub(A), len = axis.length();
      place(m.damperBody, B.clone().addScaledVector(axis, -.58).toArray(), b);          // gövde üstte
      place(m.shaft, a, B.clone().addScaledVector(axis, -.5).toArray());               // mil altta
      m.spring.position.copy(A.clone().addScaledVector(axis, .12)); m.spring.quaternion.setFromUnitVectors(up, axis.clone().normalize());
      m.spring.scale.set(springR, len * .8, springR);
      m.mountLow.position.copy(A); m.mountTop.position.copy(B);
      if (s === 1) out[k.key] = {camberDeg: p.camberDeg, coilover: p.coilover, wheelDz: p.wheel[0] - half, wheelDy: p.wheel[1] - layout.wheelY};
    }
    return out;
  }
  const rest = setTravel(0);
  return {group, setTravel, rest};
}
