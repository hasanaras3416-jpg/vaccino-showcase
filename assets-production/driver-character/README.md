# Vaccino 2027 · Driver Studio 3.1A

Blender 4.3.2 ile üretilen özgün yarış pilotu prototipi. Sahne statik bir stüdyo pozu ve görsel ekipman konsepti içerir. Ekipman için sertifikasyon veya yarışma uygunluğu değerlendirilmedi.

## Önizlemeler

| Görünüm | Dosya |
| --- | --- |
| Önden, tam boy | [01-front.png](01-front.png) |
| Yandan, tam boy | [02-side.png](02-side.png) |
| Arkadan, tam boy | [03-rear.png](03-rear.png) |
| Kask yakın planı | [04-helmet.png](04-helmet.png) |
| Tulum yakın planı | [05-suit.png](05-suit.png) |

Tam boy çekimler aynı 2,03 m ortografik ölçeği, kamera yüksekliğini ve stüdyo ışıklarını kullanır. Beş PNG 840 × 1050 pikseldir. Antrasit zemin üzerinde geniş, sıcak ana ışık, soğuk kenar ışığı ve düşük dolgular kullanıldı.

## Model ve üretim

- Boy yaklaşık **1,761 m**, toplam genişlik **0,556 m**, derinlik **0,300 m**. Görünür modelde **77.630 üçgen**, **54 mesh nesnesi** ve **7 malzeme** var. Ölçüler poz verilmiş görsel modelin sınırlarıdır.
- Önce düzenlenebilir bir anatomik hacim referansı oluşturuldu. Tulumun gövde, kollar ve paçaları değişken kesitlerden oluşturuldu, voxel remesh ile birleştirildi, yumuşatıldı ve üçgen sayısı düşürüldü. Grafik yan paneller ve dikişler gövde yüzeyine izdüşürülüyor. Fermuar şeridi, yaka, bel, manşetler ve diz biçimi ayrı okunuyor.
- Kaskta çene ve arka kabuk derinlikleri kesitlerle kontrol ediliyor. Koyu kavisli vizör, conta ve menteşeler ayrı geometri. Eldivenlerde dört parmak ve başparmak, botlarda taban ve bilek üstü ayrı biçimlendirildi.
- Tulumda prosedürel, düşük genlikli kumaş pürüzü ve mat malzeme kullanıldı. Göğüsteki Vaccino V, deponun marka çizgisindeki iki yolu kumaşa oturtan ayrı geometridir. Shell varlığı kullanılmadı.
- Blender koleksiyonları **Driver → Body, RacingSuit, Helmet, Visor, Gloves, Boots, Branding**. Stüdyo ayrı koleksiyonda. Gizli Body koleksiyonu bir oran referansı ve dışa aktarım seçiminden çıkarılıyor. Odak nesneleri Driver koleksiyonunun kökünde.

[Blender sahnesi](vaccino-driver-3-1a.blend) · [Tekrarlanabilir üretim betiği](build_driver.py) · [Geometri ölçümleri](geometry.json)

```sh
blender -b -t 4 --python-exit-code 1 -P build_driver.py -- --output ./driver-output
```

`--draft` parametresi daha küçük ve az örnekli renderlar üretir. Üretim betiği Cycles kullanır. Bu ortamın Blender derlemesinde OpenImageDenoise bulunmadığı için denoising kapalı çalıştırıldı.

## Render değerlendirmesi

| Ölçüt | Gözlem |
| --- | --- |
| İnsan silueti | Önden omuz, bel ve kalça birbirinden okunuyor. Yandan göğüs, kalça ve diz hacimleri ayrılıyor. Poz simetrik ve durağan. |
| Kask ölçeği | Omuzlara göre ölçülü. Yan görünüşte çene koruması seçiliyor. Tepe formu yakın planda hâlâ yuvarlak ve siluette küçük kesit izleri seçiliyor. |
| Kollar | Omuz ve kol kesintisiz birleşiyor. Dirsek bükümü yandan hafif görünüyor. |
| Eller | Eldivenler bileğe orantılı. Parmak uçları ayrılıyor, parmak araları ve eklem kırışıklıkları yakın planda geliştirilebilir. |
| Tulum | Kask ve vizöre göre düşük parlaklıkta. Yan panel ve dikişler yakın planda okunuyor. Kıvrım ve kumaş tensiyonu simülasyonu yok. Göğüs ve bel dikişleri panel geçişlerinde yer yer kesik görünüyor. |
| Oyuncak hissi | Mat yüzey, ince taban ve ölçülü el/kask hacimleri oyuncak hissini azaltıyor. Simetri ve sade kabuk prototip karakterini koruyor. |
| Marka | Küçük göğüs V’si ve kısa şampanya renkli çizgiler ekipman parçalarını gölgelemiyor. |
| Tam boy sunum | Üç görünümde kıyafet ve kask silueti okunuyor. Arka görünümde koltuk altına yakın birleşim çizgisinde hafif yüzey dalgalanması görülüyor. |
| Yakın plan | Vizör ve çene koruması okunuyor. Havalandırmalar sığ yüzey detayları, vizör kapalı bir kabuk üzerinde, alt kask şeridinin ucu yakın planda yüzeyden hafif ayrılıyor. Cycles örnek gürültüsü koyu bölgelerde görülebilir. |
| Web potansiyeli | Geçici glTF 2.0 dışa aktarımı yaklaşık 1,44 MB ve üç odak nesnesini içeriyor. Mobil performansı ve stüdyo ışığında materyal görünümü henüz ölçülmedi. |

## GLB hazırlığı ve sonraki adım

Blender'da yükseklik `+Z`, ön `−Y` ve taban `Z=0`. Blender glTF dışa aktarımında **Y Up** etkinse web modelinin yüksekliği `+Y`, önü `+Z` olur. Driver'ın görünür mesh nesnelerini ve `FocusHelmet`, `FocusSuit`, `FocusGlove` boş nesnelerini seçerek dışa aktar. Body ve Studio koleksiyonlarını seçim dışında bırak. Geçici GLB’nin düğüm adları ve üçgen sayısı doğrulandı.

Web aşamasında kumaş pürüzü normal haritasına alınabilir, dikiş ve panel mesh'leri malzeme bazında birleştirilebilir ve mobil cihazlarda kare süresi ölçülebilir. Bir sonraki görsel revizyonda kaskın havalandırmaları, eldiven eklemleri, koltuk altındaki yüzey geçişi ve dirsek/diz kırışıklıkları öncelikli. Karakter statik pozlu ve rigsizdir. Mevcut web uygulamasına entegrasyon yapılmadı.

## Dosya boyutları

Blender sahnesi 2.34 MiB. Render dosyaları 01-front 915 KiB · 02-side 885 KiB · 03-rear 944 KiB · 04-helmet 1003 KiB · 05-suit 1119 KiB.
