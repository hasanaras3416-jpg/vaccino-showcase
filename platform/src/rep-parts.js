/* Ø30 şasi için temsili parçalar — V2 sahnesindeki (vehicle.js) koltuk, direksiyon, jantlı lastik ve
   çift salıncak geometrisinin yeni yerleşime taşınmış hâli. Hepsi "Temsili": ürün veya CAD değil.
   Hub motor, zincir/kayış ve eski tahrik parçaları burada YOK.
   Koordinatlar STEP çizimiyle aynı eksenlerdedir (mm): X boyuna (0 = burun), Y düşey, Z yanal.
   frame-step.glb ile eşleme: GLB = ((X − 1400), (Y + 135), Z) / 1000 (bkz. tools/frame/build_frame.py). */

export const repLayout = Object.freeze({
  // Aday değerler (devir kaydı 15.3): dingil x, iz, teker merkezi; teker 16″ Ø500 × 90 mm
  axles: {front: 550, rear: 2825}, track: {front: 1010, rear: 875}, wheelY: 115, wheelR: 250, wheelW: 90,
  hipX: 1450, hipY: 150, reclineDeg: 40,   // onaylı poz (Tahmin/Varsayım): kalça x 1450, y 150, sırt ≈ 40°
  steeringWheel: [1250, 540, 0], rack: [565, 150, 0],   // simit kalçanın 200 mm önünde (Temsili)
  /* Salıncak iç bağlantıları ve amortisör üst noktaları: STEP borularının merkez hattında (z > 0 tarafı; diğer taraf aynası).
     tools/frame çıktısındaki frame-step.glb dilimlenerek ölçüldü (28 Kasım 2026). STEP'te bağlantı tablası yok;
     noktalar yalnız boru üstündeki yerdir, tabla konumu değildir. Dış mafsallar teker merkezine göre V2 ofsetleridir (Temsili). */
  pivots: {
    front: {lower: [[400, 0, 250], [700, 0, 250]],      // burun taban borusu
            upper: [[420, 338, 327], [680, 393, 374]],  // burun üst rayı (eski: 17 / 35 mm havada)
            damperTop: [590, 374, 358]},                // burun üst rayı (eski: 54 mm havada)
    rear:  {lower: [[2640, 0, 250], [2790, -5, 257]],   // arka taban borusu
            upper: [[2640, 300, 250], [2790, 308, 252]],// arka üst boru
            damperTop: [2700, 325, 306]}                // arka çapraz boru (eski: 62 mm havada)
  }
});
const toGlb = ([x, y, z]) => [(x - 1400) / 1000, (y + 135) / 1000, z / 1000];

export function buildRepresentativeParts(T, layout = repLayout) {
  const mat = (color, metalness = .12, roughness = .45) => new T.MeshStandardMaterial({color, metalness, roughness});
  const dark = mat(0x252d35), anodized = mat(0x56606a, .58), machined = mat(0xbec7ce, .64, .3), steel = mat(0x9aa2a8, .6, .35);
  const cloth = mat(0x262c36, 0, .94), upholstery = mat(0x3d4955, 0, .9), rubber = mat(0x1b1e21, 0, .86), gold = mat(0xcbb98b, .5, .4);
  const hubmat = new T.MeshStandardMaterial({color: 0x8b9295, metalness: .55, roughness: .32});
  const unitCylinder = new T.CylinderGeometry(1, 1, 1, 20), unitBox = new T.BoxGeometry(1, 1, 1);
  const group = name => { const g = new T.Group(); g.name = name; return g; };
  const mesh = (geometry, material, parent, x = 0, y = 0, z = 0) => { const m = new T.Mesh(geometry, material); m.position.set(x, y, z); parent.add(m); return m; };
  const P = p => toGlb(p);
  function rod(a, b, r, material, parent) {
    const v = new T.Vector3(...a), w = new T.Vector3(...b), d = w.clone().sub(v);
    const m = mesh(unitCylinder, material, parent); m.scale.set(r, d.length(), r);
    m.position.copy(v.add(w).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m;
  }
  const joint = (p, r, parent) => mesh(new T.SphereGeometry(r, 12, 8), anodized, parent, ...p);
  function rounded(L, H, W, r, material, parent, x = 0, y = 0, z = 0) {
    const l = -L / 2, rt = L / 2, b = -H / 2, t = H / 2; r = Math.min(r, L / 2, H / 2);
    const s = new T.Shape();
    s.moveTo(l + r, b); s.lineTo(rt - r, b); s.quadraticCurveTo(rt, b, rt, b + r); s.lineTo(rt, t - r); s.quadraticCurveTo(rt, t, rt - r, t);
    s.lineTo(l + r, t); s.quadraticCurveTo(l, t, l, t - r); s.lineTo(l, b + r); s.quadraticCurveTo(l, b, l + r, b);
    const g = new T.ExtrudeGeometry(s, {depth: W, bevelEnabled: false, curveSegments: 6}); g.translate(0, 0, -W / 2);
    return mesh(g, material, parent, x, y, z);
  }

  /* Tekerlekler: V2 lastik profili (lathe) 16″ Ø500 × 90 mm'ye ölçeklendi; jant, kollar, disk */
  const wheels = group('RepWheels');
  const R = layout.wheelR / 1000, W = layout.wheelW / 1000, kr = R / .269, kw = W / .134;
  const tire = new T.LatheGeometry([[.200, -.055], [.215, -.067], [.251, -.067], [.269, -.047], [.269, .047], [.251, .067], [.215, .067], [.200, .055], [.200, -.055]]
    .map(([r, y]) => new T.Vector2(r * kr, y * kw)), 64);
  for (const [x, track] of [[layout.axles.front, layout.track.front], [layout.axles.rear, layout.track.rear]]) for (const s of [-1, 1]) {
    const wheel = group('wheel'); wheel.position.set(...P([x, layout.wheelY, s * track / 2])); wheels.add(wheel);
    mesh(tire, rubber, wheel).rotation.x = Math.PI / 2;
    mesh(new T.TorusGeometry(.198 * kr, .012, 12, 48), hubmat, wheel, 0, 0, s * .051 * kw);
    mesh(new T.TorusGeometry(.198 * kr, .009, 12, 48), hubmat, wheel, 0, 0, -s * .046 * kw);
    const disk = (r, len, depth, m) => { const d = mesh(new T.CylinderGeometry(r, r, len, 40), m, wheel); d.rotation.x = Math.PI / 2; d.position.z = depth; };
    disk(.062, W * .95, 0, hubmat);
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3, spoke = mesh(unitBox, hubmat, wheel, .124 * kr * Math.cos(a), .124 * kr * Math.sin(a), s * .024 * kw);
      spoke.scale.set(.135 * kr, .019, .035 * kw); spoke.rotation.z = a;
      mesh(new T.CylinderGeometry(.008, .008, .01, 6), machined, wheel, .041 * Math.cos(a), .041 * Math.sin(a), s * .047 * kw).rotation.x = Math.PI / 2;
    }
    mesh(new T.RingGeometry(.083, .134, 48), new T.MeshStandardMaterial({color: 0xb4bdc2, metalness: .7, roughness: .35, side: T.DoubleSide}), wheel, 0, 0, -s * .054 * kw);
  }

  /* Çift salıncak: V2 salıncak/porya/amortisör düzeni, Ø30 çizimin boru hatlarına bağlı */
  const suspension = group('RepSuspension');
  function coilover(a, b) {
    const v = new T.Vector3(...a), w = new T.Vector3(...b), axis = w.clone().sub(v);
    rod(a, b, .015, machined, suspension);
    rod(a, v.clone().addScaledVector(axis, .44).toArray(), .023, anodized, suspension);
    const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), axis.clone().normalize()), pts = [];
    for (let i = 0; i <= 96; i++) { const t = i / 96, ang = t * 10 * Math.PI; pts.push(new T.Vector3(.03 * Math.cos(ang), axis.length() * (.13 + .74 * t), .03 * Math.sin(ang)).applyQuaternion(q).add(v)); }
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 96, .0045, 7, false), gold, suspension);
    joint(a, .017, suspension); joint(b, .017, suspension);
  }
  for (const front of [true, false]) for (const s of [-1, 1]) {
    const x = front ? layout.axles.front : layout.axles.rear, half = (front ? layout.track.front : layout.track.rear) / 2, y0 = layout.wheelY;
    const lower = [x, y0 - 75, s * (half - 62)], upper = [x - 15, y0 + 100, s * (half - 78)];
    // iç bağlantılar STEP boru merkez hattında (layout.pivots); dış uçlar teker merkezine göre (Temsili)
    const pv = front ? layout.pivots.front : layout.pivots.rear, mirror = ([px, py, pz]) => [px, py, s * pz];
    const inner = {lo: pv.lower.map(mirror), up: pv.upper.map(mirror)};
    for (const [end, pair] of [[lower, inner.lo], [upper, inner.up]]) {
      const [A, B] = pair.map(P), E = P(end);
      rod(A, E, .012, anodized, suspension); rod(B, E, .012, anodized, suspension); rod(A, B, .011, steel, suspension);
      joint(A, .015, suspension); joint(B, .015, suspension);
    }
    rod(P(lower), P(upper), .022, machined, suspension); joint(P(lower), .017, suspension); joint(P(upper), .017, suspension);
    rod(P([x, y0, s * (half - 70)]), P([x, y0, s * (half - 30)]), .022, machined, suspension);
    coilover(P([x + 30, y0 - 55, s * (half - 150)]), P(mirror(pv.damperTop)));
  }

  /* Koltuk: V2 kabuk, dolgu, yanaklar ve başlık; sırt ≈ 40° geriye (Tahmin), kalça noktası layout.hipX */
  const seat = group('RepSeat');
  const seatNode = new T.Group(); seatNode.position.set(...P([layout.hipX - 110, 70, 0])); seat.add(seatNode);
  rounded(.44, .07, .38, .035, cloth, seatNode, -.078, 0, 0);
  rounded(.36, .045, .252, .022, upholstery, seatNode, -.092, .047, 0);
  for (const side of [-1, 1]) {
    const b = rounded(.375, .084, .056, .026, cloth, seatNode, -.09, .053, side * .158); b.rotation.y = side * .075;
    rod([-.27, -.05, side * .14], [.19, -.05, side * .14], .013, machined, seatNode);
  }
  const back = new T.Group(); back.position.set(.13, .22, 0); back.rotation.z = -(layout.reclineDeg - 6) * Math.PI / 180; seatNode.add(back);   // sırt yüzeyi ≈ sürücü sırt açısı
  rounded(.072, .5, .357, .031, cloth, back);
  rounded(.037, .36, .245, .016, upholstery, back, -.045, -.043, 0);
  for (const side of [-1, 1]) rounded(.058, .34, .057, .025, cloth, back, -.038, -.06, side * .147);
  rounded(.088, .113, .245, .032, upholstery, back, -.018, .215, 0);

  /* Direksiyon: V2 simit, kollar ve mil; merkez girişli kremayer araç ortasında */
  const steering = group('RepSteering');
  const rack = P(layout.rack), wheelC = P(layout.steeringWheel);
  rod([rack[0], rack[1], -.22], [rack[0], rack[1], .22], .024, machined, steering);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 6; i++) { const z = s * (.13 + i * .016); rod([rack[0], rack[1], z - .004], [rack[0], rack[1], z + .004], .03 - i * .0016, rubber, steering); }
    const knuckle = P([layout.axles.front - 40, layout.wheelY + 20, s * (layout.track.front / 2 - 70)]);
    rod([rack[0], rack[1], s * .22], knuckle, .008, machined, steering); joint(knuckle, .014, steering);
  }
  rounded(.11, .09, .15, .022, anodized, steering, rack[0], rack[1] + .02, 0);
  rod(rack, wheelC, .013, machined, steering); joint(rack, .022, steering);
  const steeringWheel = group('RepSteeringWheel');
  const sw = new T.Group(); sw.position.set(...wheelC); steeringWheel.add(sw);
  sw.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), new T.Vector3(...wheelC).sub(new T.Vector3(...rack)).normalize());
  steering.add(steeringWheel);
  mesh(new T.TorusGeometry(.137, .015, 13, 42), rubber, sw).rotation.y = Math.PI / 2;
  rod([-.006, 0, -.133], [-.006, 0, .133], .010, anodized, sw);
  rod([-.006, 0, 0], [-.006, -.132, 0], .010, anodized, sw);
  rod([-.021, 0, 0], [.025, 0, 0], .042, dark, sw);

  return {wheels, suspension, seat, steering, steeringWheel};
}
