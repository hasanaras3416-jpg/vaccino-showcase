# Vaccino 26/27 — Interactive Showcase

Vaccino 26/27 otonom elektrikli araç projesinin herkese açık, etkileşimli tanıtım sitesi.

**Sürüm:** v1.3 · Showroom · Atölye · Demo pist · Envanter

## İncele

Yayın açıldığında: https://hasanaras3416-jpg.github.io/vaccino-showcase/

Sitenin kaynak dosyaları `platform/` altındadır. Ana `index.html` bu klasöre yönlendirir.

## Yerel çalıştırma

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Tarayıcıdan `http://127.0.0.1:4173/` adresini aç.

## Notlar

- **Gösterim / demo sürümü.** Dış kabuk, lift ve görselleştirme detayları temsili; CAD, CFD, dayanım ve üretilebilirlik doğrulaması değildir.
- Pist ve enerji hesapları varsayımsal parametrelerle çalışan örnek modeldir; gerçek yarış performansı garantisi vermez.
- Envanter düzenlemeleri yalnızca tarayıcıda saklanır; başka kullanıcılarla senkronize olmaz.
- Özgün mühendislik belgeleri, özel ekip dosyaları ve test kayıtları bu herkese açık depoya kopyalanmaz.
- Web sitesinin içinde gösterilen metin ve veriler herkes tarafından görülebilir.

© Vaccino ekibi. Kaynak kod üzerinde değişiklik yapmak için lisans koşullarını repo sahibine danışın.
