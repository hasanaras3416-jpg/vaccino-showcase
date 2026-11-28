/* Ø30 STEP şasisine 1900 ADAYI değişiklikleri (layout-1900.js · "2) Şasi değişiklikleri"). frame-step.glb dosyası
   değişmez; ağ yüklendikten sonra çalışma anında düzenlenir. ADAY – doğrulanmadı; eklenen borular temsilidir.
   - Kuyruk köşegenleri (yeni arka tekerleğe çarpanlar) x > tailCutX kısmında silinir; baş kısmı kısa bağlantı borusu
     olarak kalır. Eksen frame-step.glb dilimlenerek ölçüldü (28 Kasım 2026).
   - Arka alçak raylar ve x 470 / 640'taki kapalı ön çemberler (dikme + y=246 enine boru) eklenir.
   - Uzaklık ölçümü: kesilmiş şasi ağının üçgenlerine ve aday boruların yüzeyine en kısa mesafe. CAD ölçümü değildir. */
import {layout1900} from './layout-1900.js';
import {toGlb} from './suspension-1900.js';

export const TUBE_R = 15;
export const tailDiagonals = Object.freeze([          // merkez hattı noktalarına doğru oturtulmuş eksen (artık sapma ≈ 10 mm)
  {a: [2138, 399, 599], b: [2816, 307, 240]},
  {a: [2138, 400, -600], b: [2810, 307, -245]}
]);

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export function pointSegment(p, a, b) {
  const ab = sub(b, a), t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / dot(ab, ab)));
  const q = lerp(a, b, t), d = sub(p, q); return {d: Math.hypot(...d), q, t};
}
export function segmentSegment(a, b, c, d, steps = 64) {   // örnekleyerek en kısa mesafe (görsel kontrol için yeterli)
  let best = {d: Infinity};
  for (let i = 0; i <= steps; i++) { const p = lerp(a, b, i / steps), r = pointSegment(p, c, d); if (r.d < best.d) best = {d: r.d, p, q: r.q}; }
  return best;
}
/* Kuyruk köşegeninin silinen kısmı mı? (x > tailCutX ve kuyruk düğümünden önce) */
function onCutDiagonal(p, radius, cutX) {
  for (const {a, b} of tailDiagonals) {
    const r = pointSegment(p, a, b);
    if (r.d < radius && r.q[0] > cutX && r.q[0] < b[0] - 30) return true;
  }
  return false;
}

/* Yeni borular (STEP mm): ad, a, b */
export function newTubes(layout = layout1900) {
  const f = layout.frame, tubes = [];
  for (const s of [-1, 1]) tubes.push({ad: 'Arka alçak ray', a: [f.lowRails.x[0], f.lowRails.y, s * f.lowRails.z], b: [f.lowRails.x[1], f.lowRails.y, s * f.lowRails.z]});
  for (const x of f.frontHoops.x) {
    for (const s of [-1, 1]) tubes.push({ad: `Ön çember x ${x} dikme`, a: [x, 0, s * f.frontHoops.z], b: [x, f.frontHoops.y, s * f.frontHoops.z]});
    tubes.push({ad: `Ön çember x ${x} enine boru`, a: [x, f.frontHoops.y, -f.frontHoops.z], b: [x, f.frontHoops.y, f.frontHoops.z]});
  }
  return tubes;
}

/* Frame ağından kuyruk köşegeninin silinen kısmındaki üçgenleri çıkarır (geometri kopyalanır). Dönüş: silinen üçgen sayısı. */
export function cutTailDiagonals(mesh, layout = layout1900) {
  const g = mesh.geometry.clone(), pos = g.attributes.position, idx = g.index;
  const P = i => [pos.getX(i) * 1000 + 1400, pos.getY(i) * 1000 - 135, pos.getZ(i) * 1000];
  const keep = []; let removed = 0;
  for (let i = 0; i < idx.count; i += 3) {
    const a = P(idx.getX(i)), b = P(idx.getX(i + 1)), c = P(idx.getX(i + 2));
    const m = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
    if (onCutDiagonal(m, TUBE_R + 8, layout.frame.tailCutX)) { removed++; continue; }
    keep.push(idx.getX(i), idx.getX(i + 1), idx.getX(i + 2));
  }
  g.setIndex(keep); g.computeBoundingBox(); g.computeBoundingSphere();
  mesh.geometry = g; return removed;
}

function tubeMesh(T, a, b, r, material) {
  const A = new T.Vector3(...toGlb(a)), B = new T.Vector3(...toGlb(b)), d = B.clone().sub(A);
  const m = new T.Mesh(new T.CylinderGeometry(r / 1000, r / 1000, d.length(), 16), material);
  m.position.copy(A.add(B).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
}
export function buildFrameAdditions(T, material, layout = layout1900) {
  const g = new T.Group(); g.name = 'FrameAdditions1900';
  for (const t of newTubes(layout)) g.add(tubeMesh(T, t.a, t.b, TUBE_R, material));
  return g;
}
/* Orta motor + yarım diferansiyel birimi arka dingilde (x 2450), akslar teker göbeklerine. Temsili kutu; boyut önceki temsili birimle aynı. */
export function buildDrivetrain1900(T, material, layout = layout1900) {
  const g = new T.Group(); g.name = 'Drivetrain1900';
  const x = layout.axles.rear, y = layout.wheelY, hub = layout.track.rear / 2 - 60;
  const box = new T.Mesh(new T.BoxGeometry(.22, .2, .26), material); box.position.set(...toGlb([x, y + 20, 0])); g.add(box);
  for (const s of [-1, 1]) g.add(tubeMesh(T, [x, y, s * 120], [x, y, s * hub], 13, material));
  return g;
}
export const driveShafts = (layout = layout1900) => [-1, 1].map(s => ({a: [layout.axles.rear, layout.wheelY, s * 120], b: [layout.axles.rear, layout.wheelY, s * (layout.track.rear / 2 - 60)], r: 13}));
/* Bagaj 500 × 400 × 200 koltuk arkasında; konum temsili (arka halkanın önünde biter). */
export function luggageBox(layout = layout1900) {
  const [lx, lz, ly] = layout.luggage.size, x1 = 2120;
  return {min: [x1 - lx, 15, -lz / 2], max: [x1, 15 + ly, lz / 2]};
}
export function buildLuggage(T, material, layout = layout1900) {
  const b = luggageBox(layout), size = [0, 1, 2].map(i => (b.max[i] - b.min[i]) / 1000), c = toGlb([0, 1, 2].map(i => (b.max[i] + b.min[i]) / 2));
  const m = new T.Mesh(new T.BoxGeometry(...size), material); m.position.set(...c); m.name = 'Luggage1900'; return m;
}

/* Ölçüm modeli: kesilmiş Frame ağının üçgenleri (STEP mm) + aday borular (analitik, Ø30). Uzaklıklar gerçek boru
   yüzeyine en kısa mesafedir; ≤ 0 temas/çakışma demektir. Yalnız görsel kontrol; CAD ölçümü değildir. */
export function frameModel(mesh, layout = layout1900) {
  const g = mesh.geometry, pos = g.attributes.position, idx = g.index, n = idx.count / 3;
  const tris = new Float64Array(n * 9), box = new Float64Array(n * 6);
  for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) {
    const i = idx.getX(t * 3 + k), o = t * 9 + k * 3;
    tris[o] = pos.getX(i) * 1000 + 1400; tris[o + 1] = pos.getY(i) * 1000 - 135; tris[o + 2] = pos.getZ(i) * 1000;
  }
  for (let t = 0; t < n; t++) for (let a = 0; a < 3; a++) {
    const v = [tris[t * 9 + a], tris[t * 9 + 3 + a], tris[t * 9 + 6 + a]];
    box[t * 6 + a] = Math.min(...v); box[t * 6 + 3 + a] = Math.max(...v);
  }
  return {tris, box, n, tubes: newTubes(layout)};
}
function closestOnTriangle(p, a, b, c) {      // Ericson, Real-Time Collision Detection 5.1.5
  const ab = sub(b, a), ac = sub(c, a), ap = sub(p, a), d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a;
  const bp = sub(p, b), d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b;
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) return lerp(a, b, d1 / (d1 - d3));
  const cp = sub(p, c), d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c;
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) return lerp(a, c, d2 / (d2 - d6));
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) return lerp(b, c, (d4 - d3) / ((d4 - d3) + (d5 - d6)));
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return [a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w];
}
const triAt = (m, t) => [0, 3, 6].map(o => [m.tris[t * 9 + o], m.tris[t * 9 + o + 1], m.tris[t * 9 + o + 2]]);
/* Noktanın en yakın boru yüzeyine uzaklığı (mm). Ağ içindeki nokta için değer 0 ya da küçük çıkar (yüzeye uzaklık). */
export function clearance(p, model, limit = 400) {
  let best = {mm: Infinity, ad: 'STEP şasi borusu', at: null};
  for (let t = 0; t < model.n; t++) {
    const b = model.box, o = t * 6;
    const dx = Math.max(b[o] - p[0], 0, p[0] - b[o + 3]), dy = Math.max(b[o + 1] - p[1], 0, p[1] - b[o + 4]), dz = Math.max(b[o + 2] - p[2], 0, p[2] - b[o + 5]);
    if (Math.hypot(dx, dy, dz) > Math.min(limit, best.mm)) continue;
    const q = closestOnTriangle(p, ...triAt(model, t)), d = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
    if (d < best.mm) best = {mm: d, ad: 'STEP şasi borusu', at: q};
  }
  for (const tube of model.tubes) { const r = pointSegment(p, tube.a, tube.b), d = r.d - TUBE_R; if (d < best.mm) best = {mm: d, ad: tube.ad, at: r.q}; }
  return best;
}
/* Teker (silindir R × W) ile boru yüzeyi arasındaki en küçük boşluk (mm); ≤ 0 çakışma. Üçgenler örneklenir (≈ 5 mm). */
export function wheelClearance(model, x0, zc, layout = layout1900) {
  const R = layout.wheelR, W = layout.wheelW, y0 = layout.wheelY;
  const gapOf = p => {
    const rad = Math.hypot(p[0] - x0, p[1] - y0), dz = Math.abs(Math.abs(p[2]) - zc) - W / 2;
    if (dz <= 0) return rad - R;
    if (rad <= R) return dz;
    return Math.hypot(rad - R, dz);
  };
  let best = {mm: Infinity, at: null, ad: 'STEP şasi borusu'};
  for (let t = 0; t < model.n; t++) {
    const b = model.box, o = t * 6;
    if (b[o + 3] < x0 - R - 300 || b[o] > x0 + R + 300 || Math.max(Math.abs(b[o + 2]), Math.abs(b[o + 5])) < zc - W / 2 - 300) continue;
    const [A, B, C] = triAt(model, t), len = Math.max(Math.hypot(...sub(B, A)), Math.hypot(...sub(C, A)), Math.hypot(...sub(C, B)));
    const k = Math.min(60, Math.max(2, Math.ceil(len / 5)));
    for (let i = 0; i <= k; i++) for (let j = 0; j <= k - i; j++) {
      const u = i / k, v = j / k, p = [A[0] + (B[0] - A[0]) * u + (C[0] - A[0]) * v, A[1] + (B[1] - A[1]) * u + (C[1] - A[1]) * v, A[2] + (B[2] - A[2]) * u + (C[2] - A[2]) * v];
      const g = gapOf(p); if (g < best.mm) best = {mm: g, at: p, ad: 'STEP şasi borusu'};
    }
  }
  for (const tube of model.tubes) for (let i = 0; i <= 80; i++) {
    const p = lerp(tube.a, tube.b, i / 80), g = gapOf(p) - TUBE_R;
    if (g < best.mm) best = {mm: g, at: p, ad: tube.ad};
  }
  return best;
}
/* Ölçüm modelini bir bölgeye indirger (çok noktalı ölçümlerde hız için). min/max STEP mm, pad mm. */
export function subModel(model, min, max, pad = 200) {
  const keep = [];
  for (let t = 0; t < model.n; t++) {
    const o = t * 6, b = model.box;
    if (b[o + 3] < min[0] - pad || b[o] > max[0] + pad || b[o + 4] < min[1] - pad || b[o + 1] > max[1] + pad || b[o + 5] < min[2] - pad || b[o + 2] > max[2] + pad) continue;
    keep.push(t);
  }
  const tris = new Float64Array(keep.length * 9), box = new Float64Array(keep.length * 6);
  keep.forEach((t, i) => { tris.set(model.tris.subarray(t * 9, t * 9 + 9), i * 9); box.set(model.box.subarray(t * 6, t * 6 + 6), i * 6); });
  return {tris, box, n: keep.length, tubes: model.tubes};
}
