/*
 * VACCİNO — uygulama arayüzünün tek veri kaynağı.
 * Kaynaklar: platform/data/project.json (R01, 17 Kasım 2026) ve ATLAS devir özeti (16 Kasım 2026).
 * Kurallar:
 *  - Hiçbir değer uydurulmaz. Kaynakta olmayan alan eklenmez.
 *  - `dogrula: true` → arayüzde "Doğrulanacak" rozeti gösterilir.
 *  - `kaynak` kısa kaynak etiketidir; ayrıntı çekmecesinde görünür.
 *  - Boş dizi / alan → ilgili bölüm arayüzde gizlenir.
 */

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

/* Genel ekranındaki 4 büyük sayı. Kullanıcı onayıyla seçildi (26 Kasım 2026). */
export const stats = [
  {deger: 'Mart 2026', etiket: 'Kuruluş', kaynak: 'Takım kaydı'},
  {deger: '2.675 × 1.183', birim: 'mm', etiket: 'V2 taban ölçüsü', kaynak: 'CAD referansı'},
  {deger: '48 V · 864', birim: 'Wh', etiket: 'Batarya hedefi', kaynak: 'Tasarım hedefi'},
  {deger: '60 V · 1.000', birim: 'Wh', etiket: 'Shell üst sınırı', kaynak: 'İncelenen kural sürümü'}
];

/* Araç ekranı parça listesi. `id` 3B sahnedeki parça kimliğiyle aynıdır. */
export const parts = [
  {id: 'frame', ad: 'Şasi', grup: 'Mekanik', durum: 'V2 geometrisi', dogrula: true,
    gorev: 'Tüm parçaları bir arada tutan hafif taşıyıcı yapı.',
    olcu: ['Taban yaklaşık 2.675 × 1.183 × 694 mm', 'Ø40 × 2 mm boru, R50/R60 büküm (CAD varsayımı)'],
    ayrinti: ['Hedef alüminyum şasi ve cam elyaf kabuk.', 'Ayrı STEP sağlanmadığı için ölçüler bağımsız doğrulanmadı.', 'Kabuk dahil toplam genişlik ayrıca ölçülecek.', 'Taşıyıcı hesap ve imalat için ayrı doğrulama gerekli.']},
  {id: 'suspension', ad: 'Süspansiyon', grup: 'Mekanik', durum: 'Görsel konsept', dogrula: true,
    gorev: 'Tekerlekleri şasiye bağlar, yol hareketini karşılar.',
    olcu: ['30 × 30 × 3 mm çelikle puntalı deneme', 'Göbek rulmanı adayı DAC35680037 (35 × 68 × 37 mm)'],
    ayrinti: ['Ön tarafta çift salıncak taslağı var. Arka geometri açık.', 'Kinematik, taşıma kapasitesi ve bağlantı testleri açık.']},
  {id: 'steering', ad: 'Direksiyon', grup: 'Mekanik', durum: 'Yerleşim taslağı', dogrula: true,
    gorev: 'Tekerlekleri yönlendirir; motorlu kumanda düşünülüyor.',
    olcu: ['PC-2’den NEMA43 olarak anılan step motor', 'DM860H benzeri sürücü'],
    ayrinti: ['Golf tipi direksiyon kutusu ve rot değerlendirildi.', 'Etiket, mil bağlantısı ve hareket aralığı doğrulanacak.', 'Açı geri bildirimi için AS5048A adayı.']},
  {id: 'brake', ad: 'Fren', grup: 'Mekanik', durum: 'Temsili hidrolik yerleşim', dogrula: true,
    gorev: 'Aracı yavaşlatır ve durdurur.',
    olcu: ['Dört disk, dört sabit kaliper (görsel model)', 'Ön ve arka devre ayrı'],
    ayrinti: ['Shell Madde 51: ticari bileşen, en az 3 mm disk, çift hidrolik devre okunacak.', 'PC-2’de BTS7960 sürücülü iki lineer aktüatör var.', 'Gerçek fren hareketi kontrollü testle doğrulanacak.']},
  {id: 'motor', ad: 'Motor ve aktarma', grup: 'Mekanik', durum: 'Aday', dogrula: true,
    gorev: 'Arka tekerleklere güç gönderir.',
    olcu: ['Elde numune: Arora 48 V 500 W', 'Kasnak modeli 24 / 54 diş (görsel)'],
    ayrinti: ['Dış tedarik adayı UUMotor U48500S 48 V 500 W.', 'Yüksek tork gerekirse QS260 14″ 48 V 1.000 W.', '500 mm lastik varsayımıyla 25 km/sa ≈ 265 dev/dk.', 'Hub motor ve merkezi aktarma karşılaştırılıyor.']},
  {id: 'clutch', ad: 'Ayırıcı', grup: 'Mekanik', durum: 'İsteğe bağlı konsept', dogrula: true,
    gorev: 'Motor ile tekerlek arasındaki bağı açmayı amaçlar.',
    olcu: [],
    ayrinti: ['Kavrama tipi, aktüatör ve konum geri bildirimi seçilmedi.', 'Ayrık durumda motor freni ve rejenerasyon yok.']},
  {id: 'diff', ad: 'Diferansiyel ve akslar', grup: 'Mekanik', durum: 'CAD adayı', dogrula: true,
    gorev: 'Gücü iki arka tekerleğe dağıtır.',
    olcu: [],
    ayrinti: ['Aks boyu, mafsal açıları ve kaliper boşluğu doğrulanmadı.']},
  {id: 'seat', ad: 'Sürücü koltuğu', grup: 'Mekanik', durum: 'Kokpit konsepti', dogrula: true,
    gorev: 'Sürücünün oturma alanı.',
    olcu: [],
    ayrinti: ['Oturma noktası, pedal erişimi ve kemer bağlantısı belirlenecek.']},
  {id: 'battery', ad: 'Batarya', grup: 'Elektrik', durum: 'Tasarım hedefi', dogrula: true,
    gorev: 'Motoru ve elektroniği besleyen enerji paketi.',
    olcu: ['15S3P LiFePO₄ · 48 V · 18 Ah · 864 Wh', 'Tam dolu 54,75 V (3,65 V/hücre)', 'V2 kutu rezervi 316 × 220 × 90 mm'],
    ayrinti: ['Hücre adayı Atakale/SoliCELL IFR32700 3,2 V 6 Ah.', 'Hücre, BMS, şarj cihazı ve güvenlik tasarımı seçilmedi.', 'Diğer kutu rezervleri: 520 × 152 × 90 ve 180 × 152 × 235 mm.']},
  {id: 'drive', ad: 'Motor sürücüsü', grup: 'Elektrik', durum: 'Aday', dogrula: true,
    gorev: 'Motora ne zaman, ne kadar güç gideceğini yönetir.',
    olcu: ['İlk taslak toplam ~1,5 kW, 48 V', '≈ 31 A ideal DC akım varsayımı'],
    ayrinti: ['Tezgâh ve ADC için Flipsky 75100 Pro V2.0 adayı.', 'Mileage için Shell’e özel STM32G4 tabanlı FOC sürücü önerildi.', 'Faz akımı, verim ve ısı ayrıca boyutlandırılacak.']},
  {id: 'pc', ad: 'Araç bilgisayarı', grup: 'Elektrik', durum: 'Tercih adayı', dogrula: true,
    gorev: 'Kamera verisini işler, sürüş kararını hazırlar.',
    olcu: ['Seeed reComputer Super J401', 'Jetson Orin NX 16 GB'],
    ayrinti: ['V2’de koltuk yanında; koltuk arkası alternatif.', 'JetPack, ZED SDK ve ROS 2 sürümleri birlikte doğrulanacak.', 'Takıma ait yarış bilgisayarı kesinleşmedi.']},
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
      {baslik: 'V2 şasi', deger: '2.675 × 1.183 mm', not: 'Çıplak referans geometrisi', dogrula: true,
        ayrinti: ['Erken kaba ölçü yaklaşık 1,10 × 2,68 m.', 'Ø40 × 2 boru ve R50/R60 CAD modelleme varsayımı.', 'Profesyonel şasi imalat desteği hedefleniyor; firma açık.'], href: '#/mechanical/chassis'},
      {baslik: 'Aktarma: iki konsept', deger: 'Hub motor · Merkezi', not: 'Mimari seçimi açık', dogrula: true,
        ayrinti: ['A: sağ arka tekerlekte tek hub motor, sol teker serbest.', 'B: merkezi BLDC, kayış-kasnak, diferansiyel ve akslar.', 'Verim ve dinamik farkları ölçümle doğrulanacak.'], href: '#/mechanical/transmission'},
      {baslik: 'Süspansiyon', deger: 'Çift salıncak', not: 'Taslak; arka geometri açık', dogrula: true,
        ayrinti: ['30 × 30 × 3 mm çelikle puntalı deneme bildirildi.', 'DAC35680037 ve dört bijon göbek adayları.'], href: '#/mechanical/suspension'},
      {baslik: 'Fren', deger: '4 disk · çift devre', not: 'Temsili hidrolik yerleşim', dogrula: true,
        ayrinti: ['Shell Madde 51 fren şartları satın alma öncesi okunacak.', 'Sabit mil / dönen göbek ve disk yerleşimi değerlendirildi.'], href: '#/mechanical/braking'},
      {baslik: 'Direksiyon', deger: 'Golf tipi kutu', not: 'Motorlu kumanda adayı', dogrula: true,
        ayrinti: ['NEMA43 olarak anılan step motor ve DM860H benzeri sürücü.', 'Etiket, hareket aralığı ve yük testi bekliyor.']},
      {baslik: 'Tekerlek ve jant', deger: '16 inç hedef', not: 'Önceki tasarım hedefi', dogrula: true,
        ayrinti: ['Shell sınırı 14–18 inç gerçek jant çapı, lastik en az 80 mm.', 'Okuldaki hub motorda “21 inç” ifadesi jant mı lastik mi belirsiz.']}
    ]
  },
  elektrik: {
    ad: 'Elektrik', ozet: 'Batarya, sürücü, kontrol ve besleme.',
    derin: {etiket: 'Elektrik 3B sergisi', href: '#/electrical'},
    kartlar: [
      {baslik: 'Batarya hedefi', deger: '48 V · 864 Wh', not: '15S3P LiFePO₄, 18 Ah', dogrula: true,
        ayrinti: ['Tam dolu 54,75 V; 4,20 V/hücre kimyada 63 V olurdu.', 'Shell sınırı: 60 V ve 1.000 Wh (incelenen sürüm).', 'Hücre, BMS ve şarj cihazı seçilmedi.'], href: '#/electrical/battery'},
      {baslik: 'Motor sürücüsü', deger: '~1,5 kW · 48 V', not: 'İlk taslak toplam güç', dogrula: true,
        ayrinti: ['Tezgâh/ADC: Flipsky 75100 Pro V2.0 adayı.', 'Mileage: Shell’e özel STM32G4 çift üç faz FOC önerisi.', 'Ticari sürücüyü yeniden programlamak Mileage şartını karşılamaz.'], href: '#/electrical/control'},
      {baslik: 'Araç kontrolü', deger: 'NUCLEO-G474RE', not: 'TCAN1042HGV ile tezgâh adayı', dogrula: true,
        ayrinti: ['Mevcut ESP32 erken prototipte kullanılabilir.', 'CAN altyapısı henüz doğrulanmadı.']},
      {baslik: 'Besleme ve koruma', deger: '12 V DC-DC', not: 'Mean Well RSD-100C-12 adayı', dogrula: true,
        ayrinti: ['TE EV200A1ANA kontaktör ve Eaton JJN Class T sigorta örnek adaylar.', 'Ön şarj ve koruma ölçümle seçilecek.'], href: '#/electrical/auxiliary'},
      {baslik: 'PC-2 test platformu', deger: '48 V · 4 kW', not: 'Önceki sezon aracı, 3300 dev/dk', dogrula: true,
        ayrinti: ['Curtis 1232SE sürücü, kısa devreden sonra çalışmadı.', 'MOSFET arızası bir tahmin; ölçüm kaydı bekleniyor.', 'Uzaktan kumandalı sürüş yeniden test edilmeli.']},
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
    ad: 'Sürücü', ozet: 'Pilot ekipmanı görsel konsepti.',
    derin: {etiket: 'Sürücü Stüdyosu', href: '#/driver'},
    kartlar: [
      {baslik: 'Kask', deger: '3B konsept', not: 'Koyu ve yansıtıcı vizör', dogrula: true, ayrinti: ['Ürün seçimi ve güvenlik sertifikası doğrulanmadı.']},
      {baslik: 'Tulum', deger: '3B konsept', not: 'Mat siyah, şampanya V', dogrula: true, ayrinti: ['Yarışma kıyafet uygunluğu doğrulanmadı.']},
      {baslik: 'Eldiven', deger: '3B konsept', not: 'Sol eldiven yakın planı', dogrula: true, ayrinti: ['Ürün seçimi doğrulanmadı.']}
    ],
    not: 'Temel model tevy Pit Crew Member v1 (CC0 1.0).'
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
  {sistem: 'mekanik', baslik: '25 → 15 km/sa süzülme', durum: 'Planlandı', yontem: 'Aynı zeminde bağlı ve ayrık aktarma kıyası.'},
  {sistem: 'elektrik', baslik: 'Akım sınırlı tezgâh', durum: 'Planlandı', yontem: 'Faz akımı, bara gerilimi, PWM kesme ve sıcaklık kaydı.'},
  {sistem: 'yazilim', baslik: 'Algılama ve tam duruş', durum: 'Planlandı', yontem: 'Şerit takibi, çizgiden önce duruş, koyu engel mesafesi.'}
];

/* Yarışlar. Logo kullanılmaz; yalnızca metin. */
export const races = [
  {
    id: 'shell', ad: 'Shell Eco-marathon', alt: 'Polonya 2027 · Urban Concept / Battery Electric',
    genel: [
      {baslik: 'Hedef kategori', deger: 'Urban Concept', not: 'Battery Electric', dogrula: false},
      {baslik: 'Olası yarışlar', deger: 'ADC · Mileage', not: 'Aynı araçla iki ayrı başvuru', dogrula: true},
      {baslik: 'Portal durumu', deger: 'Takım oluşturuldu', not: 'Ekip beyanı', dogrula: true},
      {baslik: 'Teknik paket', deger: 'Gönderilmedi', not: 'Gönderim ve kabul teyit edilmedi', dogrula: true}
    ],
    gorevler: [
      {ad: 'Autonomous Driving Competition', ozet: 'Araç pistte kendi gider, dur çizgisinde durur, engelden kaçar.', dogrula: true},
      {ad: 'Mileage Challenge', ozet: 'Sürücü kullanır; geçerli sürüş km/kWh ile değerlendirilir.', dogrula: true}
    ],
    basvuru: ['Team Manager ve Faculty Advisor profilleri', 'Ön / arka 3/4 açı araç görselleri', 'Bir dakikadan kısa video', 'Enerji ve çekiş blok şemaları', 'En fazla üç sayfa otonom teknoloji PDF’i', 'Belgeleme ve motivasyon metni'],
    kurallar: [
      {baslik: 'Azami gerilim', deger: '60 V', not: 'Araç üzerinde, tasarım gereği'},
      {baslik: 'Lityum batarya', deger: '1.000 Wh', not: 'Azami enerji'},
      {baslik: 'Toplam genişlik', deger: '1.200–1.300 mm', not: 'Aynalar hariç, Urban Concept'},
      {baslik: 'Araç kütlesi', deger: '225 kg', not: 'Sürücü hariç üst sınır'},
      {baslik: 'Jant çapı', deger: '14–18 inç', not: 'Gerçek jant çapı'},
      {baslik: 'Lastik genişliği', deger: '≥ 80 mm', not: 'Takılı lastikte'},
      {baslik: 'Fren · Madde 51', deger: '≥ 3 mm disk', not: 'Ticari bileşen, çift hidrolik devre'},
      {baslik: 'Sürücü · Madde 66(a)', deger: 'Shell’e özel', not: 'Mileage için; ADC’de 402(b)(vi) kaldırır'},
      {baslik: 'İki yarış · Madde 403', deger: '2 başvuru', not: 'Ayrı teknik ve güvenlik kontrolü'},
      {baslik: 'Otonomi', deger: 'Araç üstünde', not: 'Yapay zekâ ve kontrol kararları'}
    ],
    kuralNotu: 'Chapter I/IV’ün incelenen sürümünden. Yeni sürüm başvuru öncesi kontrol edilecek.',
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
export const inventoryStatuses = ['Elde', 'Tedarik önceliği', 'Aday', 'Karara bağlı', 'Arızalı', 'Model bilinmiyor'];
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
  {id: 'S09', ad: 'Ayırıcı konumu', model: 'Konum anahtarları + kasnak enkoderi', kategori: 'Sensör', durum: 'Karara bağlı', adet: '1 set', ekip: 'Mekanik + elektrik', not: 'Kavrama kararı açık.', kaynak: 'Sensör envanteri R01'},
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
  {id: 'T01', ad: 'Motor numunesi', model: 'Arora 48 V 500 W', kategori: 'Tahrik', durum: 'Elde', adet: '1', ekip: 'Elektrik + mekanik', not: 'Etiket, jant, mil ve disk bağlantısı ölçülecek.', kaynak: 'ATLAS'},
  {id: 'T02', ad: 'Motor tedarik adayı', model: 'UUMotor U48500S 48 V 500 W', kategori: 'Tahrik', durum: 'Aday', adet: '—', ekip: 'Elektrik + mekanik', not: 'Gerçek jant ve mil ölçüsü teyit edilecek.', kaynak: 'ATLAS'},
  {id: 'T03', ad: 'Yüksek tork adayı', model: 'QS260 14″ 27H V1 48 V 1.000 W', kategori: 'Tahrik', durum: 'Aday', adet: '—', ekip: 'Elektrik + mekanik', not: 'Daha yüksek tork gerekirse incelenecek.', kaynak: 'ATLAS'},
  {id: 'T04', ad: 'Okuldaki hub motor', model: '52 V · 1200 W olarak anıldı', kategori: 'Tahrik', durum: 'Model bilinmiyor', adet: '1', ekip: 'Mekanik', not: '“21 inç” jant mı lastik mi belirsiz.', kaynak: 'ATLAS'},
  {id: 'T05', ad: 'Tezgâh / ADC sürücüsü', model: 'Flipsky 75100 Pro V2.0', kategori: 'Tahrik', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'Mileage için uygun değil (Madde 66(a)).', kaynak: 'ATLAS'},
  {id: 'T06', ad: 'PC-2 tahrik sürücüsü', model: 'Curtis 1232SE', kategori: 'Tahrik', durum: 'Arızalı', adet: '1', ekip: 'Elektrik', not: 'Kısa devreden sonra çalışmadı; teşhis ölçümü bekliyor.', kaynak: 'ATLAS'},
  {id: 'C01', ad: 'Kontrol tezgâh kartı', model: 'NUCLEO-G474RE + TI TCAN1042HGV', kategori: 'Kontrol', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'CAN ile araç kontrolü.', kaynak: 'ATLAS'},
  {id: 'C02', ad: 'Erken prototip kartı', model: 'ESP32', kategori: 'Kontrol', durum: 'Elde', adet: '—', ekip: 'Elektrik', not: 'Geçmiş ESP-NOW çalışması.', kaynak: 'ATLAS'},
  {id: 'C03', ad: 'Direksiyon step motoru', model: 'NEMA43 olarak anılan motor + DM860H benzeri sürücü', kategori: 'Kontrol', durum: 'Elde', adet: '1', ekip: 'Mekanik + elektrik', not: 'PC-2’de; etiket ve yük testi bekliyor.', kaynak: 'ATLAS'},
  {id: 'C04', ad: 'Lineer aktüatör', model: 'BTS7960 sürücülü', kategori: 'Kontrol', durum: 'Elde', adet: '2', ekip: 'Mekanik + elektrik', not: 'PC-2’de; hareket aralığı ölçülecek.', kaynak: 'ATLAS'},
  {id: 'C05', ad: 'Kokpit ekranı', model: 'Nextion NX4827T043', kategori: 'Kontrol', durum: 'Aday', adet: '1', ekip: 'Elektrik + yazılım', not: 'Arayüz taslağı tarayıcıda.', kaynak: 'ATLAS'},
  {id: 'E01', ad: 'Eski batarya', model: '48 V 100 Ah LiFePO₄ · JK BMS', kategori: 'Enerji', durum: 'Elde', adet: '1', ekip: 'Elektrik', not: '~50–52 kg; yarış sınırının üzerinde.', kaynak: 'ATLAS'},
  {id: 'E02', ad: 'Yeni batarya paketi', model: '15S3P LiFePO₄ · 48 V 18 Ah', kategori: 'Enerji', durum: 'Karara bağlı', adet: '1', ekip: 'Elektrik', not: '864 Wh nominal hedef.', kaynak: 'ATLAS · project.json'},
  {id: 'E03', ad: 'Hücre adayı', model: 'Atakale/SoliCELL IFR32700 3,2 V 6 Ah', kategori: 'Enerji', durum: 'Aday', adet: '45', ekip: 'Elektrik', not: '15S3P için 45 hücre.', kaynak: 'ATLAS'},
  {id: 'E04', ad: '12 V DC-DC', model: 'Mean Well RSD-100C-12', kategori: 'Enerji', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'Örnek aday.', kaynak: 'ATLAS'},
  {id: 'E05', ad: 'Ana kontaktör', model: 'TE EV200A1ANA', kategori: 'Enerji', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'Örnek aday.', kaynak: 'ATLAS'},
  {id: 'E06', ad: 'Ana sigorta', model: 'Eaton JJN Class T ailesi', kategori: 'Enerji', durum: 'Aday', adet: '—', ekip: 'Elektrik', not: 'Değer akım ölçümüyle seçilecek.', kaynak: 'ATLAS'},
  {id: 'M01', ad: 'Göbek rulmanı', model: 'DAC35680037 (35 × 68 × 37 mm)', kategori: 'Mekanik', durum: 'Aday', adet: '—', ekip: 'Mekanik', not: 'Dört bijon göbekle değerlendirildi.', kaynak: 'ATLAS'},
  {id: 'A01', ad: 'Ölçüm aletleri', model: 'Multimetre ve osiloskop', kategori: 'Atölye', durum: 'Elde', adet: '—', ekip: 'Elektrik', not: 'Atölyede mevcut.', kaynak: 'ATLAS'},
  {id: 'A02', ad: 'Ayarlı güç kaynağı', model: 'Model belirtilmedi', kategori: 'Atölye', durum: 'Elde', adet: '—', ekip: 'Elektrik', not: 'Atölyede mevcut.', kaynak: 'ATLAS'},
  {id: 'A03', ad: 'Lehimleme ekipmanı', model: 'Model belirtilmedi', kategori: 'Atölye', durum: 'Elde', adet: '—', ekip: 'Elektrik', not: 'Atölyede mevcut.', kaynak: 'ATLAS'}
];

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
    {baslik: 'Şasi imalatı', not: 'Profesyonel alüminyum şasi imalat desteği.',
      ayrinti: ['Öğrenciler gereksinim, CAD, montaj ve entegrasyonda sorumlu.', 'Firma ve imalat takvimi açık.', 'CAD ve araç tesisatında destek açığı var.']},
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
