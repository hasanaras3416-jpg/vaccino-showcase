# Üçüncü taraf varlıkları ve lisanslar

Bu dosya, sitede kullanılan ya da site varlıklarını üretmek için kullanılan üçüncü taraf yazılım ve 3B varlıkların kaydıdır.
Her yeni varlık eklendiğinde buraya yazılır: ad, yazar, lisans, bağlantı ve yapılan değişiklikler.

## Driver Studio — referans sürücü (174 cm)

Durum: onaylandı ve Driver Studio'ya bağlandı (`platform/assets/driver/driver.glb`). Son malzemeler sitede katman bazında verilir (`platform/src/driver.js`). Yedek görsel `driver-fallback.jpg` sitenin kendi 3B görünümünden alınmıştır.

### Kullanılan araçlar
| Araç | Sürüm | Lisans | Kaynak | Not |
|---|---|---|---|---|
| Blender | 4.2.2 LTS | GPL-3.0-or-later | https://www.blender.org | Modelleme, poz, dışa aktarım, inceleme renderı |
| MPFB (MakeHuman Plugin For Blender) | 2.0.18 | GPL-3.0-or-later (eklenti kodu) | https://extensions.blender.org/add-ons/mpfb/ | Blender Extensions'tan indirildi. Arşiv SHA-256: `c075b3e9b94b8e5556a5f03f4653602d02ea306de08126e8f55ed6dee28a2dad` |

Eklenti kodu (GPL) sitenin parçası değildir; yalnızca gövdeyi üretmek için çalıştırıldı.

### Kullanılan varlıklar
| Varlık | Yazar | Lisans | Kaynak | Değişiklik |
|---|---|---|---|---|
| MakeHuman temel gövde (basemesh, hedefler) | MakeHuman topluluğu | CC0 1.0 | MPFB 2.0.18 içinde; lisans: https://static.makehumancommunity.org/about/license.html | 174 cm'ye ölçeklendi, varsayılan iskeletle oturuş pozu verildi, iskelet kaldırıldı. Yüz bölgesi düzleştirildi (kimseye benzemeyen manken başı). |
| MakeHuman varsayılan iskelet (`rig.default`) ve ağırlıkları | MakeHuman topluluğu | CC0 1.0 (çekirdek varlık) | MPFB 2.0.18 içinde | Yalnız poz vermek için kullanıldı; GLB'de iskelet yok. |
| `shoes06` (system assets) | makehuman_system | CC0 (paket meta verisi: `"license": "CC0"`) | https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html — `makehuman_system_assets_cc0.zip`, SHA-256 `b542127a8e25547c7c29c19f2d1d2adb9a664c80396ecd694095dbc8028a0107` | Pozlandı, antrasit malzeme verildi; orijinal doku kullanılmadı. |

Kullanıcı (topluluk) varlıkları kullanılmadı. Paketin geri kalanı (saç, göz, deri, diğer giysiler) kullanılmadı.

### Varlıktan türetilen teçhizat (yeni çizim yok)
| Katman | Nasıl üretildi |
|---|---|
| Tulum | Temel gövdenin kopyası; baş, el ve ayak çıkarıldı, gövdeden en az 6 mm dışarı itildi, anatomik ayrıntı yumuşatıldı. Logo yok; yalnız göğüste VACCİNO "V". |
| Eldiven | Temel gövdenin el ve bilek bölgesi, 3–4 mm dışarı. |
| Kask kabuğu (`Helmet`) | Pozlanmış başın ölçülerinden elipsoit; öne çıkan çene ve arkaya uzanan kabuk biçimi, baştan en az 20 mm uzakta. Boyun hizasında açık, 6 mm kabuk, 7 mm pah. Çenede 3 hava deliği, arkada küçük kuyruk çıkıntısı. |
| Vizör (`Visor`) | Kabuğun geniş, yumuşak köşeli açıklık bölgesi; ayrı, kavisli, 3 mm, pahlı kenar. |
| Conta (`HelmetSeal`) | Vizör açıklığının çevresinde 9 mm çaplı kauçuk halka. |
| Kask şeridi (`HelmetStripe`) | Tepe orta hattında 16 mm ince bant (site tarafında şampanya renk). |
| Tulum panelleri (`SuitPanels`) | Yaka (tulumun boyun kenarı), omuz panelleri ve kol/gövde/bacak dış yan şeritleri; eklem çizgileri boyunca yüzeye yatan ince bantlar. |
| 5 noktalı emniyet kemeri (`Harness`) | Gövde ekseninden yüzeye ışın atılarak bulunan noktalardan geçen, yüzeye düz yatan 48 mm şeritler ve döner kilit. Temsili; ürün değil. |
| VACCİNO "V" | Takımın kendi işareti; basit V profili, 1,5 mm kabartma. |

Hiçbir sponsor, organizatör ya da üçüncü taraf logosu yok.

### Üretim
Betik: `tools/driver/build_driver.py`. Çıktı: iskeletsiz, sabit pozlu `driver.glb` (≈ 1,3 MB, sıkıştırmasız). Her katman ayrı mesh ve ayrı malzeme yuvası taşır; GLB'deki malzemeler nötrdür, son renkler site tarafında katman bazında verilir.

### Önceki model
`pilot.glb` (tevy — Pit Crew Member v1, CC0 1.0, https://tevy.dev/models/pit-crew) kaldırıldı. Lisans CC0 olduğundan atıf zorunlu değildir; alt bilgide ayrıca atıf gerekmez.

## Ø30 boru şasi — STEP'ten GLB (Faz 4)

Durum: önizleme (`platform/preview/frame-compare.html`, menüye bağlı değil). Araç sahnesindeki eski V2 şasi onay gelene kadar yerinde duruyor.

| Öğe | Ayrıntı |
|---|---|
| Kaynak | Takımın kendi STEP çizimi `shell eco çizim 30luk boru.step` (27 Kasım 2026 21:33, SHA-256 `79cc49e4…`). STEP dosyası depoya **eklenmez** (`.gitignore`: `inputs/`, `*.step`). |
| Dönüştürücü | `cascadio` 0.1.1 (MIT, Michael Dawson-Haggerty, https://github.com/trimesh/cascadio), scratchpad'de ayrı bir venv'de. Yalnız derlenmiş çekirdek (`_core`) kullanıldı; numpy gerektiren yardımcı modüller yüklenmedi. Tolerans 0,5 mm / 0,35 rad. |
| İşleme | Blender 4.2: parçalara ayırma (iskelet, akü kutusu, iki belirsiz parça), metreye çevirme, merkezleme (zemin y = 0), Y-yukarı GLB. Betikler: `tools/frame/step2glb.py`, `tools/frame/build_frame.py`. |
| Çıktı | `platform/assets/vehicle/frame-step.glb` (≈ 1,3 MB). Ölçüler: `tools/frame/frame-measure.json`. |
| Temsili katmanlar | Tekerlek 16″, çift salıncak, motor + diferansiyel ve akslar, koltuk, kabuk: çizimde yok, basit geometri. Konumlar devir kaydındaki aday değerlerden (ön dingil x≈550, arka x≈2825, iz 1010 / 875, teker merkezi Y=115 mm). |

Borular STEP'te dolu çubuk olarak çizildiğinden bu model kütle hesabında kullanılmaz (iskelet ≈ 17 kg, Tahmin).
