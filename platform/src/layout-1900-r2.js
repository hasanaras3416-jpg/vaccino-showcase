/* VACCİNO 3B yerleşim ADAYI, revizyon 2: dingil mesafesi 1900 mm, çift salıncak + coilover.
   Kaynak: mekanik ekip revizyonu (28 Kasım 2026; Vaccino_Suspansiyon_Bolum19.md bölüm 19.7). Önceki Bölüm A'nın
   3. ve 4. maddelerinin yerine geçer. ADAY – doğrulanmadı: CAD'de doğrulanmadı. Sayılar kaynaktaki gibidir.
   Eksenler STEP ile aynı (mm): X boyuna (0 burun), Y düşey (zemin boru y=0), Z yanal. Önceki 1900 sürümü: layout-1900.js.
   Direksiyon: mekanik ekip yanıtı (kremayer x≈430, y=100; rot kolu çember dikmesi ekseninin ≥ 40 mm önünde;
   direksiyon kolu 100–110 mm öne bakar, rotil x ≈ dingil x − 105). */

export const layout1900r2 = Object.freeze({
  status: 'ADAY – doğrulanmadı',
  revision: 'r2 · bölüm 19.7',
  axles: {front: 550, rear: 2450}, track: {front: 1010, rear: 875}, wheelY: 115, wheelR: 250, wheelW: 90,
  // Çift salıncak: (z, y) mm. A-kol bacakları (iç pivot x'leri) köşe başına; rotil x = dingil.
  corners: {
    front: {legs: [470, 600],                           // ön çemberler x=470/600; bacaklar asimetrik olabilir
            lower: {inner: [270, 15], outer: [477, 15]},   // 207 mm; alt pivot z=270, boru z=250 → küçük braket
            upper: {inner: [250, 246], outer: [445, 270]},
            coilover: {lowerAt: .75, top: [230, 246], plane: 600}},   // arka bacak düzlemi (x=600)
    rear:  {legs: [2360, 2540],
            lower: {inner: [250, 15], outer: [415, 15]},   // 165 mm; alt pivot rayın üstünde
            upper: {inner: [250, 246], outer: [415, 270]},   // iç pivot çemberin köşe düğümü
            coilover: {lowerAt: .75, top: [230, 246], plane: 2360}}   // aksın 90 mm önü, alt kolun ön bacağı
  },
  coilover: {damperD: 36, springD: 60, minStroke: 35, nominal: {front: '≈302 mm, 40°', rear: '≈272 mm, 32°'}},
  travel: 25, bumpStop: 20, droop: -25, requiredStroke: {front: 25, rear: 28},
  frame: {
    tailCutX: 2175,
    lowRails: {y: 15, z: 275, x: [2300, 2800]},
    // Dördü de kapalı çember: z=±250 dikmeler (taban/ray y=0/15'ten y=246'ya) ve y=246'da enine boru
    hoops: [{x: 470, base: 0}, {x: 600, base: 0}, {x: 2360, base: 15}, {x: 2540, base: 15}], hoopZ: 250, hoopY: 246
  },
  steering: {rackX: 430, rackY: 100, rackHalf: 220, tieRodR: 7, armAheadOfAxle: 105, tieRodOuterZ: 440, ruleAheadOfHoop: 40},
  wheelClearanceMin: 25,                                  // arka: ±25 mm hareket sonunda ≥ 25 mm
  ackermann: {inner: 22.1, outer: 18.5},                  // tam kilit (doğrulanmadı)
  battery: {x: [2600, 2820]}, luggage: {size: [500, 400, 200]}, driverX: 1500
});
