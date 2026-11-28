/* VACCİNO 3B yerleşim ADAYI: dingil mesafesi 1900 mm, çift salıncak + coilover.
   Kaynak: mekanik ekip, "Claude Code Prompt — Vaccino 3D model v2" (28 Kasım 2026; hesap: Vaccino_Suspansiyon bölüm 19).
   ADAY – doğrulanmadı: CAD/FEM ile doğrulanmadı. Sayılar kaynaktaki gibidir; burada yorumlanmaz.
   Eksenler STEP ile aynı (mm): X boyuna (0 burun), Y düşey (zemin boru y=0, zemin çizgisi y=−135), Z yanal (orta hat 0).
   Önceki yerleşim (dingil x 550 / 2825) rep-parts.js içindeki repLayout'tadır ve silinmedi. */

export const layout1900 = Object.freeze({
  status: 'ADAY – doğrulanmadı',
  // 1) Tekerlek yerleşimi
  axles: {front: 550, rear: 2450}, track: {front: 1010, rear: 875}, wheelY: 115, wheelR: 250, wheelW: 90,
  // 3) Çift salıncak: (z, y) mm, şasi içi → teker tarafı. A-kol bacakları x = aks ± 90 mm (VARSAYIM).
  legOffset: 90,
  corners: {
    front: {lower: {inner: [270, 15], outer: [477, 15]}, upper: {inner: [250, 246], outer: [445, 270]},
            coilover: {lowerAt: .75, lower: [425, 15], top: [200, 340]}},
    rear:  {lower: {inner: [285, 15], outer: [415, 15]}, upper: {inner: [250, 246], outer: [415, 270]},
            coilover: {lowerAt: .75, lower: [382, 15], top: [200, 340]}}
  },
  // 4) Coilover görseli: damper gövdesi Ø36, yay Ø60; strok ±15 mm
  coilover: {damperD: 36, springD: 60, stroke: 15},
  // 6) Animasyon: tekerlek hareketi −25…+25 mm
  travel: 25,
  // 2) Şasi değişiklikleri
  frame: {
    tailCutX: 2175,                                      // kuyruk köşegenleri x ≤ 2175'te biter
    lowRails: {y: 15, z: 275, x: [2300, 2800]},          // arka alçak raylar
    frontHoops: {x: [470, 640], z: 250, y: 246},         // iki ön süspansiyon çemberi (üst pivot z≈250, y≈246)
    noseHalfWidth: 250
  },
  battery: {x: [2600, 2820]},                            // diferansiyel arkasında
  luggage: {size: [500, 400, 200]},                      // koltuk arkasında (konum temsili)
  driverX: 1500
});
