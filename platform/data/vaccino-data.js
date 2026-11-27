/*
 * VACCİNO — uygulama arayüzünün tek veri kaynağı.
 * Kaynaklar: ekip kararları (27 Kasım 2026, mekanik devir kaydı bölüm 10–16), platform/data/project.json (R01),
 * Ø30 boru STEP çizimi (27 Kasım 2026) ve 2027 Official Rules Chapter I / Chapter IV (ADC).
 * Kurallar:
 *  - Hiçbir değer uydurulmaz. Bilinmeyen alan "Seçilmedi" ya da "model bilinmiyor" yazar.
 *  - Her sayı bir doğruluk rozeti taşır: `rozet` (aşağıdaki anahtarlar). Eski `dogrula: true` → "Doğrulanacak".
 *  - "Ekip beyanı" hem ekip kararlarını hem ekibin ölçüm/tartı bildirimlerini kapsar.
 *  - Kuraldan gelen sayılar "Doğrulanacak": 2027 Chapter I/IV esas; Chapter II yalnız 2026 referansı.
 *  - Bırakılan planlar yalnızca `eskiPlan` arşivinde ve "Eski plan" rozetiyle durur.
 */

export const rozetler = {beyan: 'Ekip beyanı', aday: 'Aday', tahmin: 'Tahmin', dogrula: 'Doğrulanacak', eski: 'Eski plan'};
/* Rozetli satır: metin + rozet. */
const r = (metin, rozet) => ({metin, rozet});

export const site = {
  ad: 'VACCİNO',
  tanim: 'Lise öğrencilerinin geliştirdiği otonom elektrikli yarış aracı',
  okul: 'OİB Lisesi',
  sehir: 'Bursa',
  sezon: '2026/27',
  durum: {etiket: 'Tasarım ve prototip aşaması', not: 'Yarış başvuruları ve teknik uygunluk henüz doğrulanmadı.'},
  meta: {
    baslik: 'VACCİNO — Otonom elektrikli yarış aracı',
    aciklama: 'OİB Lisesi öğrencilerinin geliştirdiği otonom elektrikli yarış aracı VACCİNO: 3B araç, sistemler, yarışlar ve destek.'
  }
};

/* Genel ekranındaki 4 büyük sayı. */
export const stats = [
  {deger: 'Mart 2026', etiket: 'Kuruluş', kaynak: 'Takım kaydı', rozet: 'beyan'},
  {deger: '2.830 × 1.230', birim: 'mm', etiket: 'Şasi çizimi (Ø30 boru)', kaynak: 'Tekerlek ve kabuk hariç', rozet: 'aday'},
  {deger: '48 V · 864', birim: 'Wh', etiket: 'Akü adayı', kaynak: '15S3P LiFePO₄', rozet: 'aday'},
  {deger: '60 V · 1.000', birim: 'Wh', etiket: 'Shell üst sınırı', kaynak: '2027 Chapter I', rozet: 'dogrula'}
];

/* Araç ekranı parça listesi. `id` 3B sahnedeki parça kimliğiyle aynıdır. */
export const parts = [
  {id: 'frame', ad: 'Şasi', grup: 'Mekanik', durum: 'Ø30 boru çizimi', rozet: 'aday',
    gorev: 'Tüm parçaları bir arada tutan alüminyum boru iskelet (space frame).',
    olcu: [r('2.830 × 1.230 × 980 mm (boy × genişlik × yükseklik; tekerlek ve kabuk hariç)', 'aday'), r('Ø30 × 2 mm alüminyum 6061-T6 boru', 'beyan'), r('İskelet ≈ 17 kg (plaka ve kaynak hariç)', 'tahmin'), r('Tekerleklerle toplam boy ≈ 3,1–3,2 m', 'tahmin')],
    ayrinti: ['Ön ve arka çift salıncak. Koltuk ve direksiyon kutusunun mil çıkışı araç ortasında.', 'İmalatçı Şahinler Metal; imalat tarihi belli değil.', 'Bağlantı noktaları kilitlenmeden imalata verilmeyecek.', 'Çizimde olmayan tekerlek, süspansiyon, tahrik, koltuk, direksiyon ve kabuk 3B’de temsilidir.', r('Ön cam direkleri şasi gövdesinden ayrı çizilmiş; kaynakla bağlanıp bağlanmayacağı ve yük taşıyıp taşımadığı doğrulanacak.', 'beyan')]},
  {id: 'suspension', ad: 'Süspansiyon', grup: 'Mekanik', durum: 'Çift salıncak · ön ve arka', rozet: 'beyan',
    gorev: 'Tekerlekleri şasiye bağlar, yol hareketini karşılar.',
    olcu: [r('Göbek rulmanı adayı DAC35680037 (35 × 68 × 37 mm)', 'aday')],
    ayrinti: ['Bağlantı noktaları, kinematik ve taşıma kapasitesi açık.', 'Tahrikli arka tekerlekte kanallı göbek veya aks ucu gerekir.']},
  {id: 'steering', ad: 'Direksiyon', grup: 'Mekanik', durum: 'Kremayer · merkez girişli', rozet: 'beyan',
    gorev: 'Tekerlekleri yönlendirir; elle ve otonom kullanılacak.',
    olcu: [r('Step motor NEMA 43 olarak anılıyor (eski raporda NEMA 34)', 'dogrula')],
    ayrinti: ['Direksiyon mili araç ortasında.', 'Elle ve otonom kullanım için step motorlu dişli kutusu yapılacak.', 'Direksiyon kutusu: Seçilmedi.', 'Açı geri bildirimi için AS5048A adayı.']},
  {id: 'brake', ad: 'Fren', grup: 'Mekanik', durum: 'Dört disk · çift hidrolik devre', rozet: 'beyan',
    gorev: 'Aracı yavaşlatır ve durdurur.',
    olcu: ['Disk çapı ve kaliper: Seçilmedi', 'Ticari parça kullanılacak'],
    ayrinti: [r('Madde 51: dört diskli hidrolik, çift devre, disk en az 3 mm', 'dogrula'), 'Motor birimindeki mekanik kaliper sökülecek, kullanılmayacak.', '3B görseldeki disk ve kaliperler temsilidir.']},
  {id: 'motor', ad: 'Motor ve aktarma', grup: 'Mekanik', durum: 'Orta motor · yarım diferansiyel', rozet: 'beyan',
    gorev: 'Tek orta motor, yarım diferansiyel ve mafsallı akslarla arka tekerleklere güç gönderir.',
    olcu: [r('Etiket: 48 V · 1000 W · 450 dev/dk · 20 A', 'dogrula'), r('3 fazlı, hall sensörlü', 'beyan')],
    ayrinti: ['Marka ve model: Seçilmedi / model bilinmiyor; numune test edilecek.', r('450 dev/dk etiket değeri; motor milinde mi çıkışta mı olduğu doğrulanacak. 48 V × 20 A = 960 W, etiketteki 1000 W’tan düşük.', 'dogrula'), 'Dişli oranı, aks mili ve flanş henüz bilinmiyor.', 'Zincir ve hub motor planı bırakıldı (bkz. eski plan arşivi).', '3B görseldeki motor ve dişli kutusu temsilidir.']},
  {id: 'clutch', ad: 'Ayırıcı', grup: 'Mekanik', durum: 'İsteğe bağlı konsept', rozet: 'dogrula',
    gorev: 'Motor ile tekerlek arasındaki bağı açmayı amaçlar.',
    olcu: [],
    ayrinti: ['Yeni tahrik biriminde kullanılıp kullanılmayacağı açık.', 'Kavrama tipi, aktüatör ve konum geri bildirimi seçilmedi.']},
  {id: 'diff', ad: 'Diferansiyel ve akslar', grup: 'Mekanik', durum: 'Yarım diferansiyel · mafsallı aks', rozet: 'beyan',
    gorev: 'Gücü iki arka tekerleğe dağıtır.',
    olcu: [],
    ayrinti: ['Diferansiyel dişlilerine uyan aks mili aranıyor.', 'Aks boyu ve mafsal açıları doğrulanmadı.']},
  {id: 'seat', ad: 'Sürücü koltuğu', grup: 'Mekanik', durum: 'Araç ortasında', rozet: 'beyan',
    gorev: 'Sürücünün oturma alanı.',
    olcu: [],
    ayrinti: ['Koltuk araç ortasında; direksiyon mili de ortada.', 'Koltuk modeli ve konumu açık soru.', 'Kemer bağlantısı ve pedal erişimi belirlenecek.']},
  {id: 'battery', ad: 'Batarya', grup: 'Elektrik', durum: 'Aday', rozet: 'aday',
    gorev: 'Motoru ve elektroniği besleyen enerji paketi.',
    olcu: [r('15S3P LiFePO₄ · 48 V · 18 Ah · 864 Wh', 'aday'), r('Tam dolu 54,75 V (3,65 V/hücre)', 'aday'), r('Şimdilik 9×5 kutu ≈ 316 × 220 × 90 mm', 'tahmin')],
    ayrinti: [r('Çakışma: çizimdeki kutu arka halkaya (x = 2150) 50 mm biniyor. Madde 66e gereği kutu ön yüzü x ≥ 2190’a (en az 90 mm arkaya) alınacak.', 'dogrula'), 'Hücre adayı IFR32700 3,2 V 6 Ah.', 'Kutu seçimi değişebilir; sürücü bölmesinin arkasında kalmalı.', 'Hücre, BMS, şarj cihazı ve güvenlik tasarımı seçilmedi.', r('Shell sınırı: 60 V ve 1.000 Wh', 'dogrula')]},
  {id: 'drive', ad: 'Motor sürücüsü', grup: 'Elektrik', durum: 'Seçilmedi', rozet: 'dogrula',
    gorev: 'Motora ne zaman, ne kadar güç gideceğini yönetir.',
    olcu: ['Yeni araç için sürücü seçilmedi'],
    ayrinti: [r('Mileage’da ticari sürücü kabul edilmez; amaca özel sürücü gerekir (Madde 66a).', 'dogrula'), r('ADC’de bu şart yok (Madde 402b).', 'dogrula'), 'PC-2’nin Curtis 1232SE sürücüsü arızalı; yeni araç için aday değil.']},
  {id: 'pc', ad: 'Araç bilgisayarı', grup: 'Elektrik', durum: 'Tercih adayı', dogrula: true,
    gorev: 'Kamera verisini işler, sürüş kararını hazırlar.',
    olcu: ['Seeed reComputer Super J401', 'Jetson Orin NX 16 GB'],
    ayrinti: ['3B konumu temsili (koltuk yanı); kesin yer belirlenmedi.', 'JetPack, ZED SDK ve ROS 2 sürümleri birlikte doğrulanacak.', 'Takıma ait yarış bilgisayarı kesinleşmedi.']},
  {id: 'camera', ad: 'Kamera ve sensörler', grup: 'Elektrik', durum: 'Tedarik önceliği', dogrula: true,
    gorev: 'Aracın önünü ve çevresini görmesini sağlar.',
    olcu: ['Stereolabs ZED 2i · 2,1 mm polarizeli', 'SKU ZED-221120'],
    ayrinti: ['Önde orta hatta, rijit ve açısı ayarlanabilir montaj.', '3B LiDAR adayları: Livox Mid-360S ve Hesai JT128.']},
  {id: 'hmi', ad: 'Nextion ekranı', grup: 'Elektrik', durum: 'Ekran adayı', dogrula: true,
    gorev: 'Sürücüye aracın durumunu gösterir.',
    olcu: ['Nextion NX4827T043 adayı'],
    ayrinti: ['Bağlantılar ve konum görüşle birlikte kontrol edilecek.']},
  {id: 'power', ad: 'Besleme ve koruma', grup: 'Elektrik', durum: 'Örnek adaylar', dogrula: true,
    gorev: 'Yardımcı sistemleri besler, devreyi korur.',
    olcu: ['Mean Well RSD-100C-12 (12 V DC-DC)', 'TE EV200A1ANA kontaktör', 'Eaton JJN Class T sigorta'],
    ayrinti: ['Değerler akım ve kalkış ölçümüyle seçilecek.', 'Güvenli duruş zinciri ayrı teknik tasarım gerektirir.']},
  {id: 'software', ad: 'Otonom yazılım', grup: 'Yazılım', durum: 'Geliştirme mimarisi', dogrula: true,
    gorev: 'Görüntüyü anlar, yolu belirler, komut üretir.',
    olcu: ['CARLA 0.9.15 · Town10HD_Opt'],
    ayrinti: ['Önce simülasyonda, sonra kontrollü araç testinde doğrulanacak.']}
];

/* Sistemler ekranı. Her sekme kısa kartlardan oluşur; `ayrinti` çekmecede açılır. */
export const systems = {
  mekanik: {
    ad: 'Mekanik', ozet: 'Şasi, süspansiyon, direksiyon, fren ve aktarma.',
    derin: {etiket: 'Mekanik 3B sergisi', href: '#/mechanical'},
    kartlar: [
      {baslik: 'Şasi çizimi', deger: '2.830 × 1.230 mm', not: 'Yükseklik 980 mm · tekerlek ve kabuk hariç', rozet: 'aday',
        ayrinti: [r('Tekerleklerle toplam boy ≈ 3,1–3,2 m.', 'tahmin'), 'İmalatçı Şahinler Metal; tarih belli değil.', 'Bağlantı noktaları kilitlenmeden imalata verilmeyecek.', 'Çizimde olmayan parçalar 3B’de temsilidir.'], href: '#/mechanical/chassis'},
      {baslik: 'Şasi borusu', deger: 'Ø30 × 2 mm', not: 'Alüminyum 6061-T6', rozet: 'beyan',
        ayrinti: [r('İskelet ≈ 17 kg; plaka, kaynak ve bağlantılar hariç.', 'tahmin'), 'Kaynak bölgesi dayanımı ve yuvarlanma koruması ayrıca doğrulanacak.']},
      {baslik: 'Tahrik', deger: 'Orta motor + yarım diferansiyel', not: 'Mafsallı aks · zincir ve hub motor bırakıldı', rozet: 'beyan',
        ayrinti: ['Dişli oranı, aks mili ve flanş henüz bilinmiyor.', 'Birimin üstündeki disk fren sökülecek.'], href: '#/mechanical/transmission'},
      {baslik: 'Motor etiketi', deger: '48 V · 1000 W', not: 'Etiket değeri, anlamı doğrulanacak · 450 dev/dk', rozet: 'dogrula',
        ayrinti: ['Marka ve model: Seçilmedi / model bilinmiyor; numune test edilecek.', r('450 dev/dk etiket değeri; motor milinde mi çıkışta mı olduğu doğrulanacak.', 'dogrula'), r('48 V × 20 A = 960 W; etiketteki 1000 W ile uyuşmuyor. Etiket yaklaşık kabul edilir.', 'dogrula')]},
      {baslik: 'Süspansiyon', deger: 'Çift salıncak', not: 'Ön ve arka', rozet: 'beyan',
        ayrinti: ['Bağlantı noktaları ve kinematik açık.', r('Göbek rulmanı adayı DAC35680037.', 'aday')], href: '#/mechanical/suspension'},
      {baslik: 'Fren', deger: '4 disk · çift hidrolik devre', not: 'Ticari parça · disk ve kaliper seçilmedi', rozet: 'beyan',
        ayrinti: [r('Madde 51: tek pedal, çift devre, disk en az 3 mm.', 'dogrula'), 'Disk çapı ve kaliper: Seçilmedi.'], href: '#/mechanical/braking'},
      {baslik: 'Direksiyon', deger: 'Kremayer · merkez girişli', not: 'Mil çıkışı araç ortasında', rozet: 'beyan',
        ayrinti: [r('Step motor NEMA 43 olarak anılıyor; etiket teyidi bekliyor.', 'dogrula'), 'Elle ve otonom kullanım için dişli kutusu yapılacak.', 'Direksiyon kutusu: Seçilmedi.']},
      {baslik: 'Tekerlek ve jant', deger: '16 inç', not: 'Jant ve lastik alınmadı', rozet: 'beyan',
        ayrinti: [r('Kural: 14–18 inç jant, lastik en az 80 mm.', 'dogrula'), r('Lastik dış çapı ≈ 500 mm varsayımı.', 'tahmin')]},
      {baslik: 'Seyir hedefi', deger: '30–35 km/sa', not: 'Hesap · Mileage ortalaması ≥ 25 km/sa', rozet: 'tahmin',
        ayrinti: [r('Mileage’ı bitirmek için gereken ortalama hız ≥ 25 km/sa (2026 Chapter II referansı).', 'dogrula'), r('Basit tur modeliyle gereken seyir hızı ≈ 27,4 km/sa.', 'tahmin'), '25 km/sa seyir hızı değil, gereken ortalamadır.']}
    ]
  },
  elektrik: {
    ad: 'Elektrik', ozet: 'Batarya, sürücü, kontrol ve besleme.',
    derin: {etiket: 'Elektrik 3B sergisi', href: '#/electrical'},
    kartlar: [
      {baslik: 'Akü adayı', deger: '48 V · 864 Wh', not: '15S3P LiFePO₄ · şimdilik 9×5 kutu', rozet: 'aday',
        ayrinti: [r('Kutu ≈ 316 × 220 × 90 mm.', 'tahmin'), r('Tam dolu 54,75 V.', 'aday'), r('Shell sınırı: 60 V ve 1.000 Wh.', 'dogrula'), 'Hücre, BMS ve şarj cihazı seçilmedi.'], href: '#/electrical/battery'},
      {baslik: 'Motor sürücüsü', deger: 'Seçilmedi', not: 'Mileage’da amaca özel sürücü şart', rozet: 'dogrula',
        ayrinti: [r('Madde 66a: Mileage’da ticari sürücü kabul edilmez.', 'dogrula'), r('ADC’de bu şart yok (Madde 402b).', 'dogrula'), 'Tartılan 0,9 kg’lık birimin modeli bilinmiyor.'], href: '#/electrical/control'},
      {baslik: 'Araç kontrolü', deger: 'NUCLEO-G474RE', not: 'TCAN1042HGV ile tezgâh adayı', dogrula: true,
        ayrinti: ['Mevcut ESP32 erken prototipte kullanılabilir.', 'CAN altyapısı henüz doğrulanmadı.']},
      {baslik: 'Besleme ve koruma', deger: '12 V DC-DC', not: 'Mean Well RSD-100C-12 adayı', dogrula: true,
        ayrinti: ['TE EV200A1ANA kontaktör ve Eaton JJN Class T sigorta örnek adaylar.', 'Ön şarj ve koruma ölçümle seçilecek.'], href: '#/electrical/auxiliary'},
      {baslik: 'PC-2 test platformu', deger: '48 V · 4 kW', not: 'Önceki sezon aracı, 3300 dev/dk', dogrula: true,
        ayrinti: ['Curtis 1232SE sürücü, kısa devreden sonra çalışmadı; yeni araç için aday değil.', 'MOSFET arızası bir tahmin; ölçüm kaydı bekleniyor.', 'Uzaktan kumandalı sürüş yeniden test edilmeli.']},
      {baslik: 'Eski batarya', deger: '48 V · 100 Ah', not: 'LiFePO₄, JK BMS, ~50–52 kg', dogrula: true,
        ayrinti: ['Yaklaşık 4,8 kWh; incelenen yarış sınırının üzerinde.', 'Yalnızca tezgâh ve platform envanteri.']}
    ]
  },
  yazilim: {
    ad: 'Yazılım', ozet: 'Simülasyon, algılama ve araç kontrolü.',
    derin: {etiket: 'Yazılım sergisi', href: '#/autonomy'},
    kartlar: [
      {baslik: 'CARLA simülasyonu', deger: '0.9.15', not: 'Town10HD_Opt, RGB ve semantic kamera', dogrula: true,
        ayrinti: ['OpenCV Canny/Hough ile şerit çizgisi tespiti çalıştı.', 'PID direksiyon fazla hassastı.'], href: '#/autonomy/simulation'},
      {baslik: 'Segmentasyon denemesi', deger: 'mIoU 0,7135', not: 'Yol IoU 0,8594 · çizgi 0,3147', dogrula: true,
        ayrinti: ['Değerler eğitim kaydından doğrulanacak.', 'Pist veya fiziksel araç başarısı değildir.'], href: '#/autonomy/vision'},
      {baslik: 'Geçen sezon çalışmaları', deger: 'Gazebo · CARLA', not: 'Park, şerit takibi, tabela', dogrula: true,
        ayrinti: ['SegNet ve CLRNet denendi; YOLO incelendi.', 'ESP32 kontrol altyapısı ve RViz görselleştirme çalışıldı.', 'Komutlar, sürümler ve test kayıtları teyit bekliyor.']},
      {baslik: 'Araçta veri akışı', deger: 'Kamera → CAN', not: 'Algılama, planlama, komut', dogrula: true,
        ayrinti: ['Kamera/LiDAR → araç bilgisayarı → CAN → kontrol MCU’su.', 'Direksiyon, çekiş ve fren; hız/açı geri bildirimi.', 'Güvenlik ve acil kesme ayrıca tasarlanacak.']}
    ],
    hat: ['CARLA bağlantısı', 'RGB kamera ve OpenCV', 'Şerit / hedef noktası', 'PID direksiyon', 'Hız ve fren', 'Dur çizgisi', 'Engel', 'Shell pist senaryosu', 'ROS 2 / gerçek araç']
  },
  surucu: {
    ad: 'Sürücü', ozet: 'Referans sürücü 174 cm ve teçhizat (görsel kontrol).',
    derin: {etiket: 'Sürücü Stüdyosu', href: '#/driver'},
    kartlar: [
      {baslik: 'Referans sürücü', deger: '174 cm', not: 'Yatık oturuş ≈ 34°', rozet: 'tahmin', ayrinti: ['Oturuş açısı ve göz noktası şasi ve koltuk seçilince doğrulanacak.']},
      {baslik: 'Kask', deger: 'Seçilmedi', not: 'Kapalı yüzlü yarış kaskı (3B temsili)', rozet: 'dogrula', ayrinti: ['Ürün ve güvenlik standardı kural kitabından belirlenecek.']},
      {baslik: 'Tulum', deger: 'Seçilmedi', not: 'Tek parça sürücü tulumu (3B temsili)', rozet: 'dogrula', ayrinti: ['Yalnız VACCİNO “V” işareti; sponsor logosu yok.']},
      {baslik: 'Eldiven', deger: 'Seçilmedi', not: 'Sürüş eldiveni (3B temsili)', rozet: 'dogrula', ayrinti: ['Ürün seçimi doğrulanmadı.']},
      {baslik: 'Ayakkabı', deger: 'Seçilmedi', not: 'Kapalı sürüş ayakkabısı (3B temsili)', rozet: 'dogrula', ayrinti: ['Ürün seçimi doğrulanmadı.']},
      {baslik: 'Emniyet kemeri', deger: '5 noktalı', not: 'Madde 29 · bağlantı ≥ 200 N', rozet: 'dogrula', ayrinti: ['Ürün seçilmedi. Bağlantı noktaları şasi ana yapısına.']}
    ],
    not: 'Temel model MakeHuman (CC0). Ayrıntı: docs/ASSETS.md.'
  },
  nextion: {
    ad: 'Nextion', ozet: 'Kokpit ekranı arayüz taslağı.',
    kartlar: [
      {baslik: 'Ekran adayı', deger: 'NX4827T043', not: 'Nextion kokpit ekranı', dogrula: true, ayrinti: ['Panel çözünürlüğü ve seri komutlar ayrıca belirlenecek.']},
      {baslik: 'Sürüş ekranı', deger: 'Hız · mod', not: 'Örnek değerler', dogrula: false, ayrinti: ['Tarayıcıda çalışan prototip; donanıma bağlı değil.']},
      {baslik: 'Enerji ekranı', deger: 'Gerilim · akım', not: 'Örnek değerler', dogrula: false, ayrinti: ['Gerçek telemetri bağlı değil.']},
      {baslik: 'Sistem ekranı', deger: 'Durum', not: 'Örnek değerler', dogrula: false, ayrinti: ['Güvenlik göstergeleri ayrıca tasarlanacak.']}
    ]
  }
};

/* Planlanan testler (project.json · tests). Sonuç verisi yok. */
export const tests = [
  {sistem: 'mekanik', baslik: 'Tam süspansiyon hareketi', durum: 'Planlandı', yontem: 'Aks boy değişimi, mafsal açısı ve kaliper boşluğu ölçülecek.'},
  {sistem: 'mekanik', baslik: 'Motor + diferansiyel karakterizasyonu', durum: 'Planlandı', yontem: 'Boşta çıkış devri, toplam oran ve tork sabiti ölçülecek.'},
  {sistem: 'elektrik', baslik: 'Akım sınırlı tezgâh', durum: 'Planlandı', yontem: 'Faz akımı, bara gerilimi, PWM kesme ve sıcaklık kaydı.'},
  {sistem: 'yazilim', baslik: 'Algılama ve tam duruş', durum: 'Planlandı', yontem: 'Şerit takibi, çizgiden önce duruş, koyu engel mesafesi.'}
];

/* Yarışlar. Logo kullanılmaz; yalnızca metin. */
export const races = [
  {
    id: 'shell', ad: 'Shell Eco-marathon', alt: 'Polonya 2027 · Urban Concept / Battery Electric',
    genel: [
      {baslik: 'Hedef kategori', deger: 'Urban Concept', not: 'Battery Electric', rozet: 'beyan'},
      {baslik: 'Yarışlar', deger: 'ADC · Mileage', not: 'Öncelik ADC; Mileage kuralları da gözetiliyor', rozet: 'beyan'},
      {baslik: 'Portal durumu', deger: 'Takım oluşturuldu', not: 'Ekip beyanı', dogrula: true},
      {baslik: 'Teknik paket', deger: 'Gönderilmedi', not: 'Gönderim ve kabul teyit edilmedi', dogrula: true}
    ],
    gorevler: [
      {ad: 'Autonomous Driving Competition', ozet: 'Araç pistte kendi gider, dur çizgisinde durur, engelden kaçar. Güvenlik sürücüsü araçta oturur (Madde 405).', dogrula: true},
      {ad: 'Mileage Challenge', ozet: 'Sürücü kullanır; geçerli sürüş km/kWh ile değerlendirilir. Amaca özel motor sürücüsü ve bagaj alanı gerekir.', dogrula: true}
    ],
    basvuru: ['Team Manager ve Faculty Advisor profilleri', 'Ön / arka 3/4 açı araç görselleri', 'Bir dakikadan kısa video', 'Enerji ve çekiş blok şemaları', 'En fazla üç sayfa otonom teknoloji PDF’i', 'Belgeleme ve motivasyon metni'],
    kurallar: [
      {baslik: 'Azami gerilim', deger: '60 V', not: 'Araç üzerinde, tasarım gereği'},
      {baslik: 'Lityum batarya', deger: '1.000 Wh', not: 'Azami enerji'},
      {baslik: 'Toplam genişlik', deger: '1.200–1.300 mm', not: 'Aynalar hariç, Urban Concept'},
      {baslik: 'Araç kütlesi', deger: '225 kg', not: 'Sürücü hariç üst sınır'},
      {baslik: 'Jant çapı', deger: '14–18 inç', not: 'Gerçek jant çapı'},
      {baslik: 'Lastik genişliği', deger: '≥ 80 mm', not: 'Takılı lastikte'},
      {baslik: 'Fren · Madde 51', deger: '4 disk · çift devre', not: 'Hidrolik, ticari parça, disk ≥ 3 mm'},
      {baslik: 'Sürücü ağırlığı · Madde 20', deger: '≥ 70 kg', not: 'Tam teçhizatla; hafif sürücüde balast'},
      {baslik: 'Kask çevresi · Madde 26', deger: '≥ 50 mm', not: 'Yuvarlanma koruması ile kask arası'},
      {baslik: 'Motor sürücüsü · Madde 66a', deger: 'Amaca özel', not: 'Mileage için; ADC’de 402b kaldırır'},
      {baslik: 'İki yarış · Madde 403', deger: '2 başvuru', not: '2027’de aynı araçla; ayrı teknik kontrol'},
      {baslik: 'ADC sürücüsü · Madde 405', deger: 'Araçta', not: 'Güvenlik sürücüsü her zaman araçta'}
    ],
    kuralNotu: '2027 Official Rules Chapter I ve Chapter IV (ADC) esas alındı. Chapter II yalnız 2026 referansı; 2027 Chapter II yayımlanınca yeniden kontrol edilecek.',
    acikKontrol: ['Turuncu durum lambası', 'Organizatör durum rölesi', 'Bağımsız güvenlik işlevleri'],
    takvim: [
      {tarih: '13 Kasım 2026', baslik: 'Sezon planı başlangıcı', tur: 'İç plan', dogrula: true},
      {tarih: 'Ocak 2027 ortası', baslik: 'Araç tekerlekleri üzerinde', tur: 'İç hedef', dogrula: true},
      {tarih: '22 Şubat 2027', baslik: 'İç başvuru hazırlığı', tur: 'İç öneri', dogrula: true},
      {tarih: '1 Mart 2027', baslik: 'Teknik başvuru kapanışı', tur: 'Resmî takvim', dogrula: true},
      {tarih: '8 Mart – 10 Mayıs 2027', baslik: 'Lojistik dönemi', tur: 'Resmî takvim', dogrula: true},
      {tarih: '15 Nisan 2027', baslik: 'Araç ve test hedefi', tur: 'İç hedef', dogrula: true},
      {tarih: '8–12 Haziran 2027', baslik: 'Yarış', tur: 'Resmî takvim', dogrula: true}
    ],
    baglantilar: [
      {etiket: 'Resmî kurallar', href: 'https://www.shellecomarathon.com/about/global-rules.html'},
      {etiket: 'Katılımcı merkezi', href: 'https://www.shellecomarathon.com/about/participant-hub.html'}
    ]
  },
  {
    id: 'teknofest', ad: 'TEKNOFEST Robotaksi', alt: 'Özgün Araç kategorisi',
    genel: [
      {baslik: 'Kategori', deger: 'Özgün Araç', not: 'İlk sezon hedefi', dogrula: false},
      {baslik: 'İlk sezon', deger: 'KTR geçildi', not: 'Ekip beyanı', dogrula: true},
      {baslik: 'Elenme aşaması', deger: 'Test ve simülasyon videosu', not: 'Resmî aşama adı kontrol edilecek', dogrula: true},
      {baslik: '2027 başvurusu', deger: 'Hedef', not: 'Başvuru durumu bilinmiyor', dogrula: true}
    ],
    gorevler: [],
    basvuru: [],
    kurallar: [
      {baslik: '2027 şartnamesi', deger: 'Kontrol edilecek', not: 'Robotaksi 2026 belgeleri geçmiş referans'}
    ],
    kuralNotu: 'KTR’de geçen ZED 2 ve VLP-16 adları takılı donanım kanıtı sayılmaz.',
    acikKontrol: [],
    takvim: [],
    baglantilar: [
      {etiket: 'Resmî yarışma sayfası', href: 'https://www.teknofest.org/tr/yarismalar/robotaksi-binek-otonom-arac-yarismasi/'}
    ]
  }
];

/* Envanter: sensör envanteri R01 + ATLAS donanım listesi. Fiyatlar teklif değildir. */
export const inventoryCategories = ['Sensör', 'Hesaplama', 'Tahrik', 'Kontrol', 'Enerji', 'Mekanik', 'Atölye'];
export const inventoryStatuses = ['Elde', 'Tedarik önceliği', 'Aday', 'Karara bağlı', 'Arızalı', 'Model bilinmiyor', 'Eski plan'];
export const inventory = [
  {id: 'S01', ad: 'Ön stereo kamera', model: 'ZED 2i · 2,1 mm polarizeli (ZED-221120)', kategori: 'Sensör', durum: 'Tedarik önceliği', adet: '1', ekip: 'Yazılım + donanım',
    not: 'USB 3; RGB ve derinlik, 30 Hz başlangıç hedefi.', fiyat: '12 Kasım aramasında ~92,6–145,5 bin TL (liste fiyatı, teklif değil)', kaynak: 'Sensör envanteri R01'},
  {id: 'S02', ad: 'IMU', model: 'ZED 2i dahili IMU', kategori: 'Sensör', durum: 'Aday', adet: 'S01 içinde', ekip: 'Yazılım', not: 'İvme ve açısal hız; dururken sapma doğrulanacak.', kaynak: 'Sensör envanteri R01'},
  {id: 'S03', ad: 'Direksiyon açısı', model: 'Infineon AS5048A', kategori: 'Sensör', durum: 'Aday', adet: '1', ekip: 'Elektrik + mekanik', not: 'SPI → MCU → CAN, 50 Hz hedef.', kaynak: 'Sensör envanteri R01'},
  {id: 'S04', ad: 'Arka teker hızları', model: 'Honeywell 1GT101DC + dişli hedef', kategori: 'Sensör', durum: 'Aday', adet: '2', ekip: 'Elektrik + mekanik', not: 'Darbe → MCU timer → CAN, 50 Hz hedef.', kaynak: 'Sensör envanteri R01'},
  {id: 'S05', ad: 'Fren hareketi ve pedal', model: 'Aktüatör konumu + pedal anahtarı', kategori: 'Sensör', durum: 'Model bilinmiyor', adet: '1 + 1', ekip: 'Elektrik + mekanik', not: 'Komut ve gerçek hareket karşılaştırılacak.', kaynak: 'Sensör envanteri R01'},
  {id: 'S06', ad: 'Motor rotor konumu', model: 'Hall sensörleri veya enkoder', kategori: 'Sensör', durum: 'Karara bağlı', adet: '1 set', ekip: 'Elektrik', not: 'Motorla birlikte seçilecek.', kaynak: 'Sensör envanteri R01'},
  {id: 'S07', ad: 'Güç katı ölçümleri', model: 'Faz şöntleri + Vbus + sıcaklık', kategori: 'Sensör', durum: 'Karara bağlı', adet: '1 set', ekip: 'Elektrik', not: 'Kartla birlikte seçilecek.', kaynak: 'Sensör envanteri R01'},
  {id: 'S08', ad: 'Batarya ölçümleri', model: '15S LiFePO₄ uyumlu BMS', kategori: 'Sensör', durum: 'Model bilinmiyor', adet: '1', ekip: 'Elektrik', not: 'Paket V/A, SoC, hücre sıcaklığı.', kaynak: 'Sensör envanteri R01'},
  {id: 'S09', ad: 'Ayırıcı konumu', model: 'Konum anahtarları + çıkış mili enkoderi', kategori: 'Sensör', durum: 'Karara bağlı', adet: '1 set', ekip: 'Mekanik + elektrik', not: 'Kavrama kararı açık.', kaynak: 'Sensör envanteri R01'},
  {id: 'S10', ad: '3B LiDAR · aday A', model: 'Livox Mid-360S', kategori: 'Sensör', durum: 'Aday', adet: '1 (S11 alternatifi)', ekip: 'Yazılım', not: '−7°…+52°, yaklaşık 200 bin nokta/sn.', fiyat: '~118,7 bin TL (liste fiyatı, teklif değil)', kaynak: 'Sensör envanteri R01 · ATLAS'},
  {id: 'S11', ad: '3B LiDAR · aday B', model: 'Hesai JT128', kategori: 'Sensör', durum: 'Aday', adet: '1 (S10 alternatifi)', ekip: 'Yazılım', not: '−4,4°…+90,5°; dikey açının çoğu yukarı.', kaynak: 'Sensör envanteri R01 · ATLAS'},
  {id: 'S12', ad: 'Aşağı bakan kamera', model: 'USB UVC kamera', kategori: 'Sensör', durum: 'Karara bağlı', adet: '0–1', ekip: 'Yazılım', not: 'ZED ile çizgi erken kaybolursa değerlendirilecek.', kaynak: 'Sensör envanteri R01'},
  {id: 'S13', ad: 'Kısa mesafe', model: 'Benewake TFmini Plus', kategori: 'Sensör', durum: 'Aday', adet: 'İlk deneme 2', ekip: 'Elektrik + yazılım', not: 'İki ön köşede deneme.', kaynak: 'Sensör envanteri R01'},
  {id: 'S14', ad: 'GNSS', model: 'Okuldaki mevcut modül', kategori: 'Sensör', durum: 'Model bilinmiyor', adet: '1', ekip: 'Yazılım + elektrik', not: 'Model ve port saptanacak.', kaynak: 'Sensör envanteri R01'},
  {id: 'L01', ad: 'LiDAR kıyas referansı', model: 'Hesai PandarXT32', kategori: 'Sensör', durum: 'Aday', adet: '—', ekip: 'Yazılım', not: '−16°…+15° görüş; karşılaştırma için.', kaynak: 'ATLAS'},
  {id: 'L02', ad: 'Eski LiDAR adayı', model: 'Velodyne VLP-16', kategori: 'Sensör', durum: 'Aday', adet: '—', ekip: 'Yazılım', not: 'İkinci el ise arayüz kutusu ve kayıt aranacak.', kaynak: 'ATLAS'},
  {id: 'H01', ad: 'Araç bilgisayarı', model: 'Seeed reComputer Super J401 / Jetson Orin NX 16 GB', kategori: 'Hesaplama', durum: 'Aday', adet: '1', ekip: 'Yazılım', not: 'Tercih adayı.', fiyat: 'Kit ~86,2–90,7 bin TL (liste fiyatı, teklif değil)', kaynak: 'ATLAS'},
  {id: 'H02', ad: 'Yükseltme seçeneği', model: 'Jetson AGX Orin 64 GB', kategori: 'Hesaplama', durum: 'Karara bağlı', adet: '—', ekip: 'Yazılım', not: 'Test sonuçları yükseltme gereksinimini belirleyecek.', fiyat: '~250,9 bin TL (önceki liste, teklif değil)', kaynak: 'ATLAS'},
  {id: 'H03', ad: 'Ekip geliştirme bilgisayarı', model: 'i7 · 32 GB RAM · RTX 5050', kategori: 'Hesaplama', durum: 'Elde', adet: '1', ekip: 'Yazılım', not: 'Proje kaydındaki en güçlü ekip bilgisayarı.', kaynak: 'ATLAS'},
  {id: 'T07', ad: 'Motor + diferansiyel birimi', model: 'Model bilinmiyor · etiket 48 V, 1000 W, 450 dev/dk, 20 A', kategori: 'Tahrik', durum: 'Elde', adet: '1', ekip: 'Elektrik + mekanik', not: '3 fazlı, hall sensörlü; dişli/diferansiyel gövdeli. Tartı 7,5 kg (aks milleri hariç). Numune test edilecek.', kaynak: 'Ekip kaydı · 27 Kasım 2026'},
  {id: 'T08', ad: 'Motor sürücüsü (tartılan birim)', model: 'Model bilinmiyor', kategori: 'Tahrik', durum: 'Model bilinmiyor', adet: '1', ekip: 'Elektrik', not: 'Tartı 0,9 kg. Yeni araç için sürücü seçilmedi.', kaynak: 'Ekip kaydı · 27 Kasım 2026'},
  {id: 'T06', ad: 'PC-2 tahrik sürücüsü', model: 'Curtis 1232SE', kategori: 'Tahrik', durum: 'Arızalı', adet: '1', ekip: 'Elektrik', not: 'Kısa devreden sonra çalışmadı. Yeni araç için aday değil.', kaynak: 'ATLAS'},
  {id: 'T01', ad: 'Motor numunesi', model: 'Arora 48 V 500 W', kategori: 'Tahrik', durum: 'Eski plan', adet: '1', ekip: 'Elektrik + mekanik', not: 'Hub motor planı bırakıldı (27 Kasım 2026).', kaynak: 'ATLAS'},
  {id: 'T02', ad: 'Motor tedarik adayı', model: 'UUMotor U48500S 48 V 500 W', kategori: 'Tahrik', durum: 'Eski plan', adet: '—', ekip: 'Elektrik + mekanik', not: 'Hub motor planı bırakıldı (27 Kasım 2026).', kaynak: 'ATLAS'},
  {id: 'T03', ad: 'Yüksek tork adayı', model: 'QS260 14″ 27H V1 48 V 1.000 W', kategori: 'Tahrik', durum: 'Eski plan', adet: '—', ekip: 'Elektrik + mekanik', not: 'Hub motor planı bırakıldı (27 Kasım 2026).', kaynak: 'ATLAS'},
  {id: 'T04', ad: 'Okuldaki hub motor', model: '52 V · 1200 W olarak anıldı', kategori: 'Tahrik', durum: 'Eski plan', adet: '1', ekip: 'Mekanik', not: 'Hub motor planı bırakıldı (27 Kasım 2026).', kaynak: 'ATLAS'},
  {id: 'T05', ad: 'Tezgâh / ADC sürücüsü', model: 'Flipsky 75100 Pro V2.0', kategori: 'Tahrik', durum: 'Eski plan', adet: '—', ekip: 'Elektrik', not: 'Eski adaydı. Yeni araç için sürücü seçilmedi.', kaynak: 'ATLAS'},
  {id: 'C01', ad: 'Kontrol tezgâh kartı', model: 'NUCLEO-G474RE + TI TCAN1042HGV', kategori: 'Kontrol', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'CAN ile araç kontrolü.', kaynak: 'ATLAS'},
  {id: 'C02', ad: 'Erken prototip kartı', model: 'ESP32', kategori: 'Kontrol', durum: 'Elde', adet: '—', ekip: 'Elektrik', not: 'Geçmiş ESP-NOW çalışması.', kaynak: 'ATLAS'},
  {id: 'C03', ad: 'Direksiyon step motoru', model: 'NEMA 43 olarak anılan motor + DM860H benzeri sürücü', kategori: 'Kontrol', durum: 'Elde', adet: '1', ekip: 'Mekanik + elektrik', not: 'PC-2’de. Eski raporda NEMA 34 yazıyor; etiket ve yük testi bekliyor.', kaynak: 'ATLAS'},
  {id: 'C04', ad: 'Lineer aktüatör', model: 'BTS7960 sürücülü', kategori: 'Kontrol', durum: 'Elde', adet: '2', ekip: 'Mekanik + elektrik', not: 'PC-2’de; hareket aralığı ölçülecek.', kaynak: 'ATLAS'},
  {id: 'C05', ad: 'Kokpit ekranı', model: 'Nextion NX4827T043', kategori: 'Kontrol', durum: 'Aday', adet: '1', ekip: 'Elektrik + yazılım', not: 'Arayüz taslağı tarayıcıda.', kaynak: 'ATLAS'},
  {id: 'E01', ad: 'Eski batarya', model: '48 V 100 Ah LiFePO₄ · JK BMS', kategori: 'Enerji', durum: 'Elde', adet: '1', ekip: 'Elektrik', not: '~50–52 kg; yarış sınırının üzerinde.', kaynak: 'ATLAS'},
  {id: 'E02', ad: 'Yeni batarya paketi', model: '15S3P LiFePO₄ · 48 V 18 Ah', kategori: 'Enerji', durum: 'Karara bağlı', adet: '1', ekip: 'Elektrik', not: '864 Wh nominal hedef.', kaynak: 'ATLAS · project.json'},
  {id: 'E03', ad: 'Hücre adayı', model: 'Atakale/SoliCELL IFR32700 3,2 V 6 Ah', kategori: 'Enerji', durum: 'Aday', adet: '45', ekip: 'Elektrik', not: '15S3P için 45 hücre.', kaynak: 'ATLAS'},
  {id: 'E04', ad: '12 V DC-DC', model: 'Mean Well RSD-100C-12', kategori: 'Enerji', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'Örnek aday.', kaynak: 'ATLAS'},
  {id: 'E05', ad: 'Ana kontaktör', model: 'TE EV200A1ANA', kategori: 'Enerji', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'Örnek aday.', kaynak: 'ATLAS'},
  {id: 'E06', ad: 'Ana sigorta', model: 'Eaton JJN Class T ailesi', kategori: 'Enerji', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'Değer akım ölçümüyle seçilecek.', kaynak: 'ATLAS'},
  {id: 'M01', ad: 'Göbek rulmanı', model: 'DAC35680037 (35 × 68 × 37 mm)', kategori: 'Mekanik', durum: 'Aday', adet: '—', ekip: 'Mekanik', not: 'Dört bijon göbekle değerlendirildi; tahriksiz ön teker için uygun olabilir.', kaynak: 'ATLAS'},
  {id: 'M02', ad: 'Sürücü koltuğu', model: 'Otomobil koltuğu (elde)', kategori: 'Mekanik', durum: 'Elde', adet: '—', ekip: 'Mekanik', not: 'Tartı 14,7 kg. Gerekirse yeni yarış koltuğu alınacak.', kaynak: 'Ekip kaydı · 27 Kasım 2026'},
  {id: 'M03', ad: 'Direksiyon kutusu', model: 'Model belirtilmedi', kategori: 'Mekanik', durum: 'Karara bağlı', adet: '1', ekip: 'Mekanik', not: 'Tartı 6,1 kg; daha hafifi seçilebilir. Merkez girişli kremayer gerekiyor.', kaynak: 'Ekip kaydı · 27 Kasım 2026'},
  {id: 'A01', ad: 'Ölçüm aletleri', model: 'Multimetre ve osiloskop', kategori: 'Atölye', durum: 'Elde', adet: '—', ekip: 'Elektrik', not: 'Atölyede mevcut.', kaynak: 'ATLAS'},
  {id: 'A02', ad: 'Ayarlı güç kaynağı', model: 'Model belirtilmedi', kategori: 'Atölye', durum: 'Elde', adet: '—', ekip: 'Elektrik', not: 'Atölyede mevcut.', kaynak: 'ATLAS'},
  {id: 'A03', ad: 'Lehimleme ekipmanı', model: 'Model belirtilmedi', kategori: 'Atölye', durum: 'Elde', adet: '—', ekip: 'Elektrik', not: 'Atölyede mevcut.', kaynak: 'ATLAS'}
];

/* Driver Studio ürün kartları. Marka/model uydurulmaz: seçilmemişse "Seçilmedi". */
export const driverGear = {
  helmet: {ad: 'Kask', tur: 'Kapalı yüzlü yarış kaskı, ayrı vizör', urun: 'Seçilmedi', standart: r('Kural kitabındaki sürücü teçhizatı maddesine göre belirlenecek', 'dogrula'), kaynak: '3B temsili · MakeHuman CC0 türevi'},
  suit: {ad: 'Tulum', tur: 'Tek parça sürücü tulumu', urun: 'Seçilmedi', standart: r('Kural kitabındaki sürücü teçhizatı maddesine göre belirlenecek', 'dogrula'), kaynak: '3B temsili · yalnız VACCİNO “V”, sponsor logosu yok'},
  glove: {ad: 'Eldiven', tur: 'Sürüş eldiveni', urun: 'Seçilmedi', standart: r('Belirlenecek', 'dogrula'), kaynak: '3B temsili · MakeHuman CC0 türevi'},
  shoes: {ad: 'Ayakkabı', tur: 'Kapalı sürüş ayakkabısı', urun: 'Seçilmedi', standart: r('Belirlenecek', 'dogrula'), kaynak: '3B temsili · MakeHuman CC0 shoes06 türevi'},
  harness: {ad: 'Emniyet kemeri', tur: '5 noktalı emniyet kemeri', urun: 'Seçilmedi', standart: r('Madde 29: 5 nokta, bağlantı ≥ 200 N, ana yapıya bağlı', 'dogrula'), kaynak: '3B temsili şerit ve döner kilit'}
};
export const driverInfo = {
  referans: r('Referans sürücü 174 cm', 'beyan'),
  balast: r('Urban Concept’te en az sürücü ağırlığı 70 kg (tam teçhizatla); hafif sürücüde balast gerekir.', 'dogrula')
};

/* Araç ekranı: Şasi durumu kartı */
export const chassisStatus = {
  baslik: 'Şasi durumu',
  satirlar: [
    r('Çizim 2.830 × 1.230 × 980 mm (tekerlek ve kabuk hariç)', 'beyan'),
    r('İmalata serbest bırakma bekliyor; bağlantı noktaları kilitlenmeden imalat yok', 'beyan'),
    r('Yer yüksekliği ≈ 120 mm (en alçak boru dış yüzü – zemin)', 'tahmin'),
    r('Kural: yer yüksekliği ≥ 100 mm, sürücü ve balast ile', 'dogrula'),
    r('Dingil x ≈ 550 / 2.825 mm (ön / arka)', 'aday'),
    r('İz ≈ 1.010 / 875 mm (ön / arka)', 'aday'),
    r('Çakışma: akü kutusu arka halkaya (x = 2150) 50 mm biniyor; Madde 66e gereği ön yüz x ≥ 2190 (en az 90 mm arkaya)', 'dogrula')
  ],
  eklenecek: {baslik: 'Şasiye eklenecekler', rozet: 'beyan',
    maddeler: ['Omuz hizası enine boru', 'Çatı orta enine boru', 'Taban paneli', 'Sürücü–enerji bölmesi paneli', 'Balast ve çekme kancası noktaları', 'Çelik akü tepsisi']},
  not: 'Tekerlek, süspansiyon, tahrik, koltuk, direksiyon ve kabuk 3B’de temsilidir. Ön cam direkleri şasi gövdesinden ayrı çizilmiştir.'
};

/* Belirsiz konular: Sistemler › Mekanik ekranındaki "Açık sorular" kartı. */
export const acikSorular = [
  {soru: 'Koltuk konumu ve modeli', not: 'Elde bir otomobil koltuğu var; gerekirse yarış koltuğu alınacak.'},
  {soru: 'Motor dişli oranı', not: 'Aks mili ve flanş da bilinmiyor; numune testiyle ölçülecek.'},
  {soru: 'Şasi imalat tarihi', not: 'İmalatçı Şahinler Metal; bağlantı noktaları kilitlenmeden imalat yok.'},
  {soru: 'Jant ve lastik', not: '16 inç hedef; henüz alınmadı.'},
  {soru: 'Fren diski ve kaliper', not: 'Seçilmedi.'},
  {soru: 'Motor sürücüsü', not: 'Seçilmedi; Mileage için amaca özel sürücü gerekir.'},
  {soru: 'Ön cam direkleri', not: 'Ön cam direklerinin görüş (Madde 28) ve roll-bar hesabına etkisi doğrulanacak.'}
];

/* Bırakılan planlar. Arayüzde yalnızca "Eski plan arşivi" içinde ve "Eski plan" rozetiyle görünür. */
export const eskiPlan = {
  tarih: '27 Kasım 2026',
  gorsel: {src: 'assets/archive/v2-sasi.jpg', alt: 'Eski V2 şasi yerleşiminin sitedeki 3B görünümü (Eski plan)', baslik: 'V2 şasi 3B görünümü'},
  not: 'Yeni tahrik: tek orta motor + yarım diferansiyel + mafsallı aks.',
  maddeler: [
    {baslik: 'İki arka hub motor', not: 'V2 eskiz yerleşimi.'},
    {baslik: 'Tek hub motor · sağ arka tekerlek', not: 'Sitedeki aktarma karşılaştırma konsepti.'},
    {baslik: 'Zincir / kayış-kasnak aktarma', not: 'Merkezi motorun ilk aktarma taslağı.'},
    {baslik: 'Arora 48 V 500 W', not: 'Eldeki hub motor numunesi.'},
    {baslik: 'UUMotor U48500S 48 V 500 W', not: 'Dış tedarik adayı.'},
    {baslik: 'QS260 14″ 48 V 1.000 W', not: 'Yüksek tork hub motor adayı.'},
    {baslik: 'Okuldaki hub motorlar', not: '52 V 1200 W ve 48 V 800 W olarak anıldı.'},
    {baslik: 'Flipsky 75100 Pro V2.0', not: 'Tezgâh / ADC sürücü adayı.'},
    {baslik: 'V2 şasi ≈ 2.675 × 1.183 mm', not: 'Ø40 × 2 boru CAD varsayımıyla. 3B görünümü 28 Kasım 2026’da Ø30 çizimiyle değiştirildi.'},
    {baslik: 'Golf tipi direksiyon kutusu', not: 'Yerini merkez girişli kremayer aldı.'}
  ]
};

/* Takım ve Destek */
export const team = {
  okul: {ad: 'OİB Lisesi', sehir: 'Bursa', alan: 'Elektrik-Elektronik alanı öğrencileri'},
  bilgiler: [
    {baslik: 'Kuruluş', deger: 'Mart 2026', not: 'OİB Lisesi çatısında', dogrula: false},
    {baslik: 'Çekirdek kadro', deger: '7 kişi', not: 'Eski materyallerde 9 kişi yazıyor', dogrula: true},
    {baslik: 'İlk sezon', deger: '~17 kişi', not: 'Elektrik, mekanik, yazılım, PR', dogrula: true},
    {baslik: 'Yazılım desteği', deger: '3 tecrübeli üye', not: 'Katılımı düşünülüyor', dogrula: true}
  ],
  ihtiyaclar: [
    {baslik: 'Şasi imalatı', not: 'Alüminyum şasi imalatı ve mühendislik desteği.',
      ayrinti: ['İmalatçı Şahinler Metal; imalat tarihi belli değil.', 'Öğrenciler gereksinim, CAD, montaj ve entegrasyonda sorumlu.', 'CAD ve araç tesisatında destek açığı var.']},
    {baslik: 'Sensör ve hesaplama', not: 'ZED 2i, 3B LiDAR ve Jetson Orin NX.',
      ayrinti: ['Birinci öncelik ZED 2i 2,1 mm polarizeli (ZED-221120).', 'LiDAR adayları: Livox Mid-360S, Hesai JT128.', 'Araç bilgisayarı adayı: reComputer Super J401.']},
    {baslik: 'Mentorluk', not: 'CAD, güvenlik ve yarış kuralları.',
      ayrinti: ['Fiziksel güvenlik ve acil kesme danışmanla tasarlanacak.', 'Şasi taşıyıcı hesabı için mühendislik desteği.']}
  ],
  /* Görüşme düzeyindeki kurumlar. Hiçbiri onaylı sponsor değildir. */
  gorusmeler: [
    {ad: 'Mahatron', durum: 'Görüşüldü', not: 'Motor/tahrik verisi ve numune; imzalı destek yok'},
    {ad: 'Ficosa', durum: 'Aday', not: 'ADAS, ödünç sensör, mentorluk'},
    {ad: 'Monster', durum: 'Aday', not: 'Bilgisayar desteği'},
    {ad: 'Yeşilova, T-Kare, Ford Otosan, Mercedes Hasmer, Akıltar, Merksen, Köritsan, Camsan Alüminyum, Beyçelik', durum: 'Konuşulan bağlantı', not: 'Teyit düzeyi belirsiz'}
  ],
  iletisim: [
    {etiket: 'Takım kaptanı', deger: '[ad soyad]'},
    {etiket: 'E-posta', deger: '[takım e-postası]'},
    {etiket: 'Sosyal medya', deger: '[hesap adı]'}
  ]
};

/* ROS 2 / CAN prototip veri arayüzleri (Sensör envanteri R01 · Veri arayüzleri). Kimlik, hız ve zaman aşımı entegrasyonda belirlenecek. */
export const interfaces = [
  {id: 'I01', sinyal: 'RGB, derinlik, IMU', yol: 'Kamera sürücüsü → ROS 2', birim: 'Görüntü, m, m/s², rad/s'},
  {id: 'I02', sinyal: 'Arka teker hızları', yol: 'MCU → CAN → ROS 2', birim: 'rad/s, sol ve sağ ayrı'},
  {id: 'I03', sinyal: 'Direksiyon açısı', yol: 'MCU → CAN → ROS 2', birim: 'rad; öneri sol pozitif'},
  {id: 'I04', sinyal: 'Fren durumu', yol: 'MCU → CAN → ROS 2', birim: 'Konum %, pedal, hata bitleri'},
  {id: 'I05', sinyal: 'Sürücü ve batarya', yol: 'Sürücü/BMS → CAN → ROS 2', birim: 'V, A, °C, arıza, SoC %'},
  {id: 'I06', sinyal: 'Ayırıcı durumu', yol: 'MCU → CAN → ROS 2', birim: 'Bağlı / ayrık / belirsiz'},
  {id: 'I07', sinyal: '3B nokta bulutu', yol: 'LiDAR Ethernet → ROS 2', birim: 'PointCloud2, metre'},
  {id: 'I08', sinyal: 'Araç modu ve emniyet', yol: 'Araç MCU → CAN → ROS 2', birim: 'Sürüş modu, izin, arıza'}
];
