# VACCINO 2027

**Otonom elektrikli yarış aracı · Etkileşimli proje vitrini**

Vaccino, enerji verimliliği ve otonom sürüş odağında geliştirilen bir öğrenci mühendislik takımı projesidir. Bu depo, aracın tasarım alternatiflerini, 3B görselleştirmelerini ve takımın çalışmalarını tanıtan **herkese açık web sitesini** içerir.

> **Proje durumu:** Aktif geliştirme. Buradaki araç geometrileri, sistem yerleşimleri ve performans gösterimleri görsel/teknik konsept niteliğindedir; üretim CAD'i, test doğrulaması veya yarışma uygunluk onayı değildir.

## Siteyi incele

- **Web sitesi:** [Vaccino Showcase](https://hasanaras3416-jpg.github.io/vaccino-showcase/) — GitHub Pages yayını etkinse açılır.
- **Uygulama kaynağı:** [platform/](platform/)
- **Geliştirme ve tasarım kararları:** [docs/](docs/)

> Web sitesi bağlantısı henüz açılmıyorsa depo yine de incelenebilir; aşağıdaki yerel başlatma adımlarını kullanabilirsiniz.

## Öne çıkan bölümler

| Bölüm | İçerik |
| --- | --- |
| Ana sayfa | Sinematik 3B araç tanıtımı |
| 3B Model ve Showroom | Döndürülebilir araç, yakınlaştırma ve etkileşimli inceleme |
| Mekanik | Hub motor ve merkezi aktarma arasında animasyonlu mimari karşılaştırması |
| Elektrik | Alt sistem görselleştirmeleri ve mühendislik açıklamaları |
| Yazılım | Simülasyon ve görüntü işleme çalışma alanları |
| Driver Studio | 3B pilot ekipman konsepti, kamera yakınlaştırmaları |
| Diğer bölümler | Yarışmalar, envanter ve gösterim arayüzleri |

## Bilgisayarda çalıştırma

Python 3 kurulu bir bilgisayarda depoyu indirip **depo ana dizininde** aşağıdaki komutu çalıştırın:

```bash
python -m http.server 4174
```

Ardından tarayıcıdan **http://localhost:4174/** adresine gidin.

Uygulama statik HTML, CSS ve JavaScript ile Three.js kullanır. Doğrudan `file://` üzerinden açmak, modül ve veri yüklemeleri nedeniyle çalışmayabilir; yerel HTTP sunucusu kullanın. Güncel Chrome/Chromium tabanlı tarayıcı önerilir.

## Depo yapısı

```text
.
├── index.html              # Ziyaretçiyi uygulamaya yönlendirir
├── platform/
│   ├── index.html          # Web uygulaması
│   ├── assets/             # Stil, görseller ve 3B varlıklar
│   ├── data/               # Projeyi besleyen tanıtım verileri
│   ├── src/                # Uygulama ve 3B etkileşim kodu
│   └── vendor/             # Gerekli tarayıcı kütüphaneleri
├── docs/                   # Proje bağlamı, tasarım sistemi ve iş akışı
└── AGENTS.md               # Kod asistanları için geliştirme kuralları
```

## Teknik ve görsel kapsam

- Hub motor ve merkezi aktarma alternatifleri **değerlendirme aşamasındadır**. Gösterilen konumlar temsili olup kütle dağılımı, yerleşim, soğutma, kablo güzergâhı ve gerçek performans ayrı mühendislik doğrulaması gerektirir.
- Driver Studio'daki pilot ve ekipmanlar **görsel konsepttir**; sertifika, ekipman satın alma kararı veya yarışma kurallarına uygunluk iddiası oluşturmaz.
- Simülasyon ve gösterim verileri gerçek araç performansını garanti etmez.
- Envanter gibi tarayıcı tabanlı özellikler kullanıcılar arasında ortak bir veritabanına senkronize edilmez.
- Takımın özel mühendislik belgeleri, özel CAD dosyaları ve test kayıtları bu genel depoda tutulmaz.

## Geliştirme düzeni

Kararlı, paylaşılabilir kaynak kod **`main`** dalında; devam eden tasarım çalışmaları **`design/premium-automotive-home`** dalında yürütülür. Değişiklikler incelenerek `main` dalına aktarılır.

- [Proje bağlamı](docs/PROJECT_CONTEXT.md)
- [Tasarım sistemi](docs/DESIGN_SYSTEM.md)
- [Çalışma ve doğrulama süreci](docs/WORKFLOW.md)

## Kaynak ve kullanım hakları

Driver Studio'daki temel 3B karakter, [tevy — Pit Crew Member v1](https://tevy.dev/models/pit-crew) modelinden uyarlanmıştır ([CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)). Bu lisans bilgisi diğer kaynak kodların, görsellerin veya marka işaretlerinin aynı lisansla dağıtıldığı anlamına gelmez.

Vaccino ve üçüncü taraf marka işaretlerinin kullanım hakları ilgili sahiplerine aittir. **Depodaki diğer içerikler için açık kaynak lisansı beyan edilmemiştir**; yeniden kullanım koşulları için depo sahibiyle iletişime geçin.

---

*Vaccino 2027 · Öğrenci mühendislik projesi · Geliştirme sürümü*
