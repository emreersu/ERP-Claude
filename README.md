# BayTech Mühendislik — Satın Alma Yönetim Sistemi

FAZ 1 (bu teslimat): Login, kullanıcı/rol sistemi, dashboard, tedarikçi,
ürün/malzeme kütüğü, satın alma talebi (PR) — komut sistemi ve T-code
mantığıyla birlikte.

## Teknoloji

- React + TypeScript + Vite
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth + RLS)
- react-router-dom, vite-plugin-pwa

## Kurulum

1. supabase.com üzerinde ücretsiz bir proje açın.
2. SQL Editor'de `supabase/migrations/0001_faz1_schema.sql` dosyasını çalıştırın.
   Bu, tüm tabloları, RLS politikalarını ve demo verileri (ABB, Schneider,
   Chint, MCCB 400A vb.) oluşturur.
3. Supabase Authentication panelinden en az bir kullanıcı oluşturun, sonra
   SQL Editor'de o kullanıcıyı bir profile eşleyin:

   insert into profiles (id, ad_soyad, eposta, rol)
   values ('<auth.users tablosundaki uuid>', 'Emre Ersu', 'emre@baytech.com.tr', 'satin_alma');

4. `.env.example` dosyasını `.env` olarak kopyalayın, Supabase proje
   ayarlarındaki URL ve anon key'i girin.
5. Kurulum ve çalıştırma:

   npm install
   npm run dev       # geliştirme sunucusu
   npm run build     # üretim derlemesi (PWA dahil, dist/ klasörüne)

6. `dist/` klasörünü Cloudflare Pages / Vercel / Netlify gibi bir yere
   yükleyin. Tarayıcıda "Uygulamayı yükle" (bilgisayar) veya "Ana ekrana
   ekle" (telefon) ile PWA olarak kurulabilir.

## T-code komut sistemi

Üst çubuktaki komut alanına kod yazıp Enter'a basmak ilgili ekranı açar.
Tüm kodlar `src/lib/commands.ts` içinde tek yerden tanımlı.

| Kod | Ekran |
|---|---|
| PR01 / PR02 | Yeni talep / talep listesi |
| RFQ01 / RFQ02 | Teklif talebi (FAZ 2) |
| QT01 / QT02 | Teklif girişi / karşılaştırma (FAZ 2) |
| PO01 / PO02 / PO03 | PO oluştur / listele / takip et (FAZ 3) |
| GR01 / GR02 | Mal kabul (FAZ 4) |
| ST01 / ST02 | Stok kartları / hareketleri (FAZ 4) |
| SUP01 / SUP02 | Tedarikçi ekle / listele |
| INV01 / INV02 | Fatura girişi / kontrolü (FAZ 5) |
| REP01 | Raporlar (FAZ 6) |

Her komutun izin verilen rolleri `commands.ts` içinde tanımlı; yetkisiz
bir kullanıcı komutu çalıştırmaya çalışırsa arayüzde uyarı gösterilir
(veritabanı tarafında RLS politikaları da aynı kısıtlamayı uygular).

## Roller

`yonetici`, `satin_alma`, `depo`, `muhasebe`, `izleyici` — dokümanda
tarif edilen yetkilerle birebir, RLS politikaları olarak
`supabase/migrations/0001_faz1_schema.sql` içinde tanımlı.

## Sıradaki fazlar

- FAZ 2: RFQ + teklif toplama + teklif karşılaştırma ekranı
- FAZ 3: PO oluşturma (PR'den otomatik veri aktarımı) + onay akışı
- FAZ 4: Teslimat takibi + mal kabul + otomatik stok güncelleme
- FAZ 5: Fatura girişi + PO/mal kabul/fatura üç yönlü eşleştirme + ödeme takibi
- FAZ 6: Raporlar + Excel/PDF dışa aktarım
- FAZ 7: Bildirimler + audit log arayüzü + Supabase Realtime + PWA cilası

## Durum: Tüm fazlar teslim edildi

- FAZ 2: Teklif girişi (telefon/WhatsApp dahil kaynaklar), teklif karşılaştırma, tedarikçi seçilince otomatik PO taslağı
- FAZ 3: PO oluşturma, listeleme, yönetici onay/red akışı
- FAZ 4: Mal kabul (beklenen/gelen/hasarlı miktar, kısmi kabul), stok kartları, stok hareketleri (mal kabul onaylanınca veritabanı tetikleyicisiyle otomatik stok güncellenir)
- FAZ 5: Fatura girişi + PO ile otomatik tutar karşılaştırma (veritabanı tetikleyicisi ile), ödeme takibi, gecikme/yaklaşan vade uyarıları
- FAZ 6: Tedarikçi bazlı harcama grafiği, Excel dışa aktarım (PO raporu)
- FAZ 7: Realtime bildirim çanı (Supabase Realtime ile anlık), işlem geçmişi (audit log) ekranı, PWA (manifest + service worker, offline önbellekleme)

## Not

Bazı alanlar (RFQ formu, tedarikçi ekleme formu, PDF çıktı, gelişmiş rapor filtreleri) bu teslimatta basitleştirilmiş
veya SQL üzerinden yönetiliyor — sistemin uçtan uca çalışması ve gerçek veritabanına bağlı olması önceliklendirildi.
Kullanım sırasında hangi ekranın öncelikle detaylandırılması gerektiğini birlikte belirleyip ekleyebiliriz.
