/* Ø30 STEP şasisine 1900 ADAYI revizyon 2 değişiklikleri ve denetimleri (layout-1900-r2.js). frame-step.glb değişmez.
   Kuyruk köşegeni kesimi, ağ ölçüm modeli, tahrik birimi ve bagaj önceki sürümle aynıdır (frame-1900.js'ten alınır).
   Yeni: dört kapalı çember (ön x 470/600, arka x 2360/2540), öne alınmış direksiyon (kremayer x≈430, y=100) ve
   bilgi kartındaki çakışma/boşluk denetimleri. Ölçüler 3B ağ yüzeyinden; CAD ölçümü değildir. ADAY – doğrulanmadı. */
import {layout1900r2} from './layout-1900-r2.js';
import {toGlb} from './suspension-1900.js';
import {TUBE_R, frameModel as frameModelBase, pointSegment, segmentSegment} from './frame-1900.js';
export {cutTailDiagonals, clearance, subModel, buildLuggage} from './frame-1900.js';
import {buildDrivetrain1900} from './frame-1900.js';

/* Aday borular (STEP mm) */
export function newTubesR2(layout = layout1900r2) {
  const f = layout.frame, tubes = [];
  for (const s of [-1, 1]) tubes.push({ad: 'Arka alçak ray', a: [f.lowRails.x[0], f.lowRails.y, s * f.lowRails.z], b: [f.lowRails.x[1], f.lowRails.y, s * f.lowRails.z]});
  for (const h of f.hoops) {
    for (const s of [-1, 1]) tubes.push({ad: `Çember x ${h.x} dikme`, a: [h.x, h.base, s * f.hoopZ], b: [h.x, f.hoopY, s * f.hoopZ], hoop: h.x, kind: 'dikme'});
    tubes.push({ad: `Çember x ${h.x} enine boru`, a: [h.x, f.hoopY, -f.hoopZ], b: [h.x, f.hoopY, f.hoopZ], hoop: h.x, kind: 'enine'});
  }
  return tubes;
}
/* Direksiyon parçaları (STEP mm, r = yarıçap). Simit rep-parts.js'ten gelir; kolon simit merkezinden kremayere. */
export function steeringR2(layout = layout1900r2, wheelCenter = [1250, 540, 0]) {
  const st = layout.steering, c = layout.corners.front, x = layout.axles.front;
  const uprightZ = y => c.lower.outer[0] + (c.upper.outer[0] - c.lower.outer[0]) * (y - c.lower.outer[1]) / (c.upper.outer[1] - c.lower.outer[1]);
  const parts = [{ad: 'Kremayer', a: [st.rackX, st.rackY, -st.rackHalf], b: [st.rackX, st.rackY, st.rackHalf], r: 20},
                 {ad: 'Direksiyon kolonu', a: wheelCenter, b: [st.rackX, st.rackY, 0], r: 13}];
  for (const s of [-1, 1]) {
    const outer = [x - st.armAheadOfAxle, st.rackY, s * st.tieRodOuterZ];
    parts.push({ad: 'Rot kolu', a: [st.rackX, st.rackY, s * st.rackHalf], b: outer, r: st.tieRodR, s});
    parts.push({ad: 'Direksiyon kolu', a: outer, b: [x, st.rackY, s * uprightZ(st.rackY)], r: 8, s});
  }
  return parts;
}

function tubeMesh(T, a, b, r, material) {
  const A = new T.Vector3(...toGlb(a)), B = new T.Vector3(...toGlb(b)), d = B.clone().sub(A);
  const m = new T.Mesh(new T.CylinderGeometry(r / 1000, r / 1000, d.length(), 16), material);
  m.position.copy(A.add(B).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
}
export function buildFrameAdditionsR2(T, material, layout = layout1900r2) {
  const g = new T.Group(); g.name = 'FrameAdditions1900r2';
  for (const t of newTubesR2(layout)) g.add(tubeMesh(T, t.a, t.b, TUBE_R, material));
  return g;
}
export function buildSteeringR2(T, materials, layout = layout1900r2) {
  const g = new T.Group(); g.name = 'Steering1900r2';
  for (const p of steeringR2(layout)) g.add(tubeMesh(T, p.a, p.b, p.r, p.ad === 'Kremayer' ? materials.rack : materials.rod));
  return g;
}
export const buildDrivetrainR2 = (T, material, layout = layout1900r2) => buildDrivetrain1900(T, material, layout);
export const driveUnitBox = (layout = layout1900r2) => ({min: [layout.axles.rear - 110, layout.wheelY + 20 - 100, -130], max: [layout.axles.rear + 110, layout.wheelY + 20 + 100, 130]});

/* Ölçüm modeli: kesilmiş STEP ağı + r2 aday boruları */
export function frameModelR2(mesh, layout = layout1900r2) { return {...frameModelBase(mesh), tubes: newTubesR2(layout)}; }

/* Konumlandırılmış teker (merkez c, aks yönü u) ile boru yüzeyi arasındaki en küçük boşluk (mm). */
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export function wheelGap(model, c, u, layout = layout1900r2) {
  const R = layout.wheelR, W = layout.wheelW;
  const gapOf = p => { const v = sub(p, c), a = dot(v, u), rad = Math.hypot(v[0] - a * u[0], v[1] - a * u[1], v[2] - a * u[2]), dz = Math.abs(a) - W / 2;
    return dz <= 0 ? rad - R : rad <= R ? dz : Math.hypot(rad - R, dz); };
  let best = {mm: Infinity, at: null, ad: 'STEP şasi borusu'};
  for (let t = 0; t < model.n; t++) {
    const b = model.box, o = t * 6;
    if (b[o + 3] < c[0] - R - 150 || b[o] > c[0] + R + 150 || b[o + 4] < c[1] - R - 150 || b[o + 1] > c[1] + R + 150 ||
        Math.max(Math.abs(b[o + 2]), Math.abs(b[o + 5])) < Math.abs(c[2]) - R - 150) continue;
    const T3 = [0, 3, 6].map(k => [model.tris[t * 9 + k], model.tris[t * 9 + k + 1], model.tris[t * 9 + k + 2]]);
    const len = Math.max(Math.hypot(...sub(T3[1], T3[0])), Math.hypot(...sub(T3[2], T3[0])), Math.hypot(...sub(T3[2], T3[1])));
    const k = Math.min(60, Math.max(2, Math.ceil(len / 5)));
    for (let i = 0; i <= k; i++) for (let j = 0; j <= k - i; j++) {
      const s = i / k, w = j / k, p = [0, 1, 2].map(q => T3[0][q] + (T3[1][q] - T3[0][q]) * s + (T3[2][q] - T3[0][q]) * w);
      const g = gapOf(p); if (g < best.mm) best = {mm: g, at: p, ad: 'STEP şasi borusu'};
    }
  }
  for (const tube of model.tubes) for (let i = 0; i <= 80; i++) {
    const p = [0, 1, 2].map(q => tube.a[q] + (tube.b[q] - tube.a[q]) * i / 80), g = gapOf(p) - TUBE_R;
    if (g < best.mm) best = {mm: g, at: p, ad: tube.ad};
  }
  return best;
}
function rotateAbout(p, a, axis, deg) {        // Rodrigues: p'yi a noktasından geçen eksen etrafında döndür
  const n = Math.hypot(...axis), k = axis.map(v => v / n), th = deg * Math.PI / 180, v = sub(p, a);
  const c = Math.cos(th), s = Math.sin(th), kv = dot(k, v), cr = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]];
  return [0, 1, 2].map(i => a[i] + v[i] * c + cr[i] * s + k[i] * kv * (1 - c));
}

/* Bilgi kartı denetimleri. solve(key, travel) → cornerSolver çıktısı (s=+1 tarafı). Dönüş: [{grup, ad, mm, sinir, fail, not}] */
export function runChecksR2(model, solve, layout = layout1900r2) {
  const out = [], L = layout, st = steeringR2(L), tubes = newTubesR2(L), springR = L.coilover.springD / 2, damperR = L.coilover.damperD / 2;
  const add = (grup, ad, mm, opts = {}) => out.push({grup, ad, mm, ...opts, fail: opts.fail ?? (opts.sinir != null ? mm < opts.sinir : mm <= 0)});
  // Ön teker: statik ve tam kilit (king-pin = rotillerden geçen eksen)
  const fc = L.corners.front, fx = L.axles.front, fw = [fx, L.wheelY, L.track.front / 2];
  add('Teker', 'Ön teker – en yakın boru (statik)', wheelGap(model, fw, [0, 0, 1], L).mm);
  const kpA = [fx, fc.lower.outer[1], fc.lower.outer[0]], kpB = [fx, fc.upper.outer[1], fc.upper.outer[0]], kp = sub(kpB, kpA);
  for (const [deg, ad] of [[L.ackermann.inner, `iç ${L.ackermann.inner}°`], [-L.ackermann.outer, `dış ${L.ackermann.outer}°`]]) {
    const c = rotateAbout(fw, kpA, kp, deg), u = sub(rotateAbout([fw[0], fw[1], fw[2] + 1], kpA, kp, deg), c);
    add('Teker', `Ön teker – tam kilit, ${ad}`, wheelGap(model, c, u, L).mm, {not: 'Ackermann doğrulanmadı'});
  }
  // Arka teker: −25 / 0 / +25 mm, kamber dahil; şart ≥ 25 mm
  for (const t of [L.droop, 0, L.travel]) {
    const p = solve('rear', t), th = p.camberDeg * Math.PI / 180;
    add('Teker', `Arka teker – en yakın boru (${t > 0 ? '+' : ''}${t} mm)`, wheelGap(model, [L.axles.rear, p.wheel[1], p.wheel[0]], [0, -Math.sin(th), Math.cos(th)], L).mm, {sinir: L.wheelClearanceMin});
  }
  // Arka coilover – tahrik aksı (aks ekseninden coilover yüzeyine); körük çapı bilinmiyor
  const rc = L.corners.rear;
  for (const t of [L.droop, 0, L.travel]) {
    const p = solve('rear', t), coil = [[rc.coilover.plane, p.mount[1], p.mount[0]], [rc.coilover.plane, rc.coilover.top[1], rc.coilover.top[0]]];
    const shaft = [[L.axles.rear, L.wheelY, 120], [L.axles.rear, p.wheel[1], p.wheel[0] - 60]];
    const d = segmentSegment(...coil, ...shaft).d - springR;
    add('Coilover', `Arka coilover – tahrik aksı ekseni (${t > 0 ? '+' : ''}${t} mm)`, d, {not: 'Körük yarıçapı bu değerden küçük olmalı (körük çapı verilmedi)'});
  }
  // Ön coilover – rot kolu
  const fp = solve('front', 0), fcoil = [[fc.coilover.plane, fp.mount[1], fp.mount[0]], [fc.coilover.plane, fc.coilover.top[1], fc.coilover.top[0]]];
  const tie = st.find(p => p.ad === 'Rot kolu' && p.s === 1);
  add('Coilover', 'Ön coilover – rot kolu', segmentSegment(...fcoil, tie.a, tie.b).d - springR - tie.r);
  // Coilover – çember dikmesi (aynı düzlem): damper gövdesi üstte, yay altta
  for (const [key, ad] of [['front', 'Ön'], ['rear', 'Arka']]) {
    const c = L.corners[key], p = solve(key, 0), A = [c.coilover.plane, p.mount[1], p.mount[0]], B = [c.coilover.plane, c.coilover.top[1], c.coilover.top[0]];
    const mid = [0, 1, 2].map(i => B[i] + (A[i] - B[i]) * .58);
    const post = tubes.find(t => t.hoop === c.coilover.plane && t.kind === 'dikme' && t.a[2] > 0);
    const gap = Math.min(segmentSegment(B, mid, post.a, post.b).d - damperR - TUBE_R, segmentSegment(mid, A, post.a, post.b).d - springR - TUBE_R);
    add('Coilover', `${ad} coilover – x ${c.coilover.plane} çember dikmesi`, gap);
  }
  // Rot kolu – x=470 dikmesi: eksene ≥ 40 mm ön (kural), boşluk = mesafe − boru − rot yarıçapı
  const post470 = tubes.find(t => t.hoop === 470 && t.kind === 'dikme' && t.a[2] > 0), dAxis = segmentSegment(tie.a, tie.b, post470.a, post470.b).d;
  add('Direksiyon', 'Rot kolu – x 470 dikme ekseni (kural ≥ 40 mm)', dAxis, {sinir: L.steering.ruleAheadOfHoop});
  add('Direksiyon', 'Rot kolu – x 470 dikme yüzeyi (boşluk)', dAxis - TUBE_R - tie.r);
  const rack = st.find(p => p.ad === 'Kremayer'), col = st.find(p => p.ad === 'Direksiyon kolonu');
  add('Direksiyon', 'Kremayer – x 470 dikme', segmentSegment(rack.a, rack.b, post470.a, post470.b).d - rack.r - TUBE_R);
  for (const h of [470, 600]) { const cross = tubes.find(t => t.hoop === h && t.kind === 'enine'); add('Direksiyon', `Kolon – x ${h} enine boru`, segmentSegment(col.a, col.b, cross.a, cross.b).d - col.r - TUBE_R); }
  // Arka çember enine boruları – tahrik birimi (temsili kutu)
  const box = driveUnitBox(L);
  for (const h of L.frame.hoops.filter(h => h.x >= box.min[0] - TUBE_R && h.x <= box.max[0] + TUBE_R))
    add('Şasi', `x ${h.x} enine boru – tahrik birimi (temsili kutu)`, (L.frame.hoopY - TUBE_R) - box.max[1]);
  return out;
}
/* Bağlantı noktaları – en yakın boru (6 nokta, bacak başına en kötüsü) + braket boyları */
export function mountPointsR2(model, clearanceFn, layout = layout1900r2) {
  const rows = [];
  for (const [key, ad] of [['front', 'Ön'], ['rear', 'Arka']]) {
    const c = layout.corners[key];
    const row = (label, r) => ({ad: label, boru: r.ad, mm: r.mm});
    const worst = pts => pts.map(p => clearanceFn(p, model)).reduce((a, b) => (b.mm > a.mm ? b : a));
    rows.push(row(`${ad} alt kol iç pivot`, worst(c.legs.map(x => [x, c.lower.inner[1], c.lower.inner[0]]))));
    rows.push(row(`${ad} üst kol iç pivot`, worst(c.legs.map(x => [x, c.upper.inner[1], c.upper.inner[0]]))));
    rows.push(row(`${ad} coilover üst bağlantı`, clearanceFn([c.coilover.plane, c.coilover.top[1], c.coilover.top[0]], model)));
    const leg = c.legs.reduce((a, b) => (Math.abs(b - c.coilover.plane) < Math.abs(a - c.coilover.plane) ? b : a));
    rows.push({ad: `${ad} coilover alt braket (düzlem x ${c.coilover.plane} → bacak)`, mm: Math.abs(leg + (layout.axles[key] - leg) * c.coilover.lowerAt - c.coilover.plane), braket: true});
  }
  return rows;
}
export {pointSegment};
