# Vaccino 2027 · Driver Studio 3.1B

3.1A'daki özgün yarış pilotunun görsel revizyonu. Model statik bir stüdyo pozu ve görsel ekipman konseptidir. Güvenlik sertifikasyonu veya yarışma uygunluğu değerlendirilmedi.

[Blender sahnesi](vaccino-driver-3-1b.blend) · [Üretim betiği](build_driver.py) · [Geometri ölçümleri](geometry.json) · [Aynı açılardan 3.1A / 3.1B karşılaştırması](comparison-3-1a-3-1b.jpg)

| Render | Görünüm |
| --- | --- |
| [01-front.png](01-front.png) | Önden, tam boy |
| [02-side.png](02-side.png) | Yandan, tam boy |
| [03-rear.png](03-rear.png) | Arkadan, tam boy |
| [04-helmet.png](04-helmet.png) | Kask yakın planı |
| [05-suit.png](05-suit.png) | Tulum yakın planı |
| [06-three-quarter.png](06-three-quarter.png) | Ön-yan, tam boy |

Altı render da 840 × 1050 pikseldir. İlk beş çekim 3.1A ile aynı kamera konumlarını, dönüşlerini ve ortografik ölçekleri kullanıyor. Stüdyo ışığı revizyonun parçası.

## 3.1A ile görsel karşılaştırma

| Alan | 3.1A | 3.1B |
| --- | --- | --- |
| Kask | Yuvarlak profil ve geniş, metalik yansımalı vizör. Alt süslemenin ucu yakın planda kabuktan ayrılıyor. | Yandan öne uzayan çene ve daha dik kaş geçişi. Kabuğa açılan vizör yuvası, çevre contası ve alçak yan menteşeler. Daha ince, metalik olmayan füme vizör. Çene havalandırmaları sığ biçim detayları. |
| Tulum | Griye yaklaşan siyah, ince yan paneller ve kesik görünen dikişler. | Daha koyu mat siyah gövde, antrasit omuz ve yan katmanları. Dikiş eğrilerinin ara noktaları kumaşa izdüşürülüyor. İnceltilen fermuar şeridi, bel, dirsek ve dizde kontrollü hacim değişimi. |
| Omuz ve kol | Oranlar dengeli. Yan görünümde kol oldukça düz, arka birleşimde yüzey dalgası görülüyor. | Aynı yetişkin boyu ve temel poz. Dirsek hafifçe geriye alındı, omuz-kol birleşimi daha ince voxel örneklemesi ve yüzey yumuşatmasıyla düzenlendi. |
| Eldiven ve ayakkabı | Parmak silueti var. Mafsal ve bağlama detayları sınırlı. | Parmak eklemlerinde düşük profilli dikişler ve daha ince voxel örneklemesi. Ayakkabıda bombe yüzeyine oturan antrasit kapama şeritleri ve alçak yarış tabanı. |
| Genel görünüm | Sade stüdyo prototipi. | Kaskın çene ve vizör çizgisi ile tulum panelleri birlikte daha belirgin bir yarış ekipmanı silueti veriyor. Ön-yan görsel bu ayrımı en açık gösteren açı. Küçük şampanya Vaccino V korundu. |

Kask görsel kontrolünde kapalı kokpit kasklarının vizör yuvası, çene profili ve yan mekanizma düzeni incelendi. Modelde üreticiye özgü logo veya kabuk tasarımı kullanılmadı. [Bell GT6 Pro](https://www.bellracing.com/p/gt6-pro/) · [Arai GP-7](https://www.araiamericas.com/gp-7-technology)

## Teknik doğrulama

| Ölçüm | 3.1A | 3.1B |
| --- | ---: | ---: |
| Yükseklik | 1,761 m | 1,760 m |
| Görünür üçgen | 77.630 | 101.542 |
| Görünür mesh nesnesi | 54 | 87 |
| Görünür malzeme | 7 | 7 |
| Geçici GLB | 1,44 MB | 1,95 MB |

Üçgen sayısı yaklaşık %31 arttı. Artış ağırlıklı olarak çift yüzeyli kask kabuğu, bağlantı elemanları ve ekipman detaylarından geliyor. Kumaşa izdüşürülen ince hatlar tek örnekli eğri parçaları olarak dışa aktarılıyor. Geçici GLB, Driver Studio ile aynı GLTFLoader kullanılarak izole Chromium sayfasında açıldı. Modelin zemin konumu ve odak düğümleri doğrulandı. GLB seçimi görünür Driver nesneleriyle sınırlı. Blender'da ön yön `−Y`, taban `Z=0`. Y Up glTF dışa aktarımıyla web önü `+Z` ve yükseklik `+Y` oluyor. `FocusHelmet`, `FocusSuit` ve `FocusGlove` konumları 3.1A ile aynı. Body, RacingSuit, Helmet, Visor, Gloves, Boots ve Branding koleksiyonları ayrı.

```sh
blender -b -t 4 --python-exit-code 1 -P build_driver.py -- --output ./driver-output
```

Blender 4.3.2 ve Cycles kullanıldı. `--draft` ile küçük önizlemeler alınabilir. 3.1A dosyaları ve üretim betiği [kaynak commit’te](https://github.com/hasanaras3416-jpg/vaccino-showcase/tree/daa885c4a0040d3c7e04a0b99c2212b7c27125f0/assets-production/driver-character) geri alınabilir.

## Açık noktalar

Kumaş kıvrımları elle biçimlendirilmiş yüzey değişimleridir. Eldiven mafsal ayrıntıları tam boyda ince kalıyor. Kask havalandırmaları yakın planda sığ, kapalı yüzey detayları olarak okunuyor. Kask tepesinin siluetinde küçük kesit izleri kalıyor. Model rigsiz ve statik. Koyu yakın planlarda az miktarda Cycles örnek gürültüsü görülebilir. Kumaşın prosedürel pürüzü Blender sahnesinde çalışıyor. Web aşamasında bunu normal haritasına almak, küçük ekipman mesh'lerini malzemeye göre birleştirmek ve mobil kare süresini ölçmek uygun olur. Mevcut web pilotu bu görevde değiştirilmedi.

## Dosya boyutları

Blender sahnesi 2.64 MiB. Render dosyaları 01-front 925 KiB · 02-side 893 KiB · 03-rear 941 KiB · 04-helmet 1005 KiB · 05-suit 1076 KiB · 06-three-quarter 958 KiB.
