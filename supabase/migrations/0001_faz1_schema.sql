-- ============================================================
-- BAYTECH MÜHENDİSLİK - Satın Alma Yönetim Sistemi
-- FAZ 1: Kullanıcılar, Roller, Tedarikçiler, Ürünler, Talepler
-- ============================================================

-- ---------- ENUM TİPLERİ ----------
create type user_role as enum ('yonetici', 'satin_alma', 'depo', 'muhasebe', 'izleyici');

create type pr_status as enum (
  'taslak', 'onay_bekliyor', 'onaylandi', 'reddedildi',
  'satin_alma_surecinde', 'tamamlandi', 'iptal_edildi'
);

create type priority_level as enum ('dusuk', 'normal', 'yuksek', 'acil');

-- ---------- ROLLER / YETKİLER ----------
create table roles (
  id uuid primary key default gen_random_uuid(),
  code user_role not null unique,
  ad text not null,
  aciklama text,
  created_at timestamptz not null default now()
);

insert into roles (code, ad, aciklama) values
  ('yonetici', 'Yönetici', 'Tüm kayıtları görüntüler, onay verir, sistem ayarlarını yönetir'),
  ('satin_alma', 'Satın Alma', 'Talep, teklif, PO oluşturur ve tedarikçi yönetir'),
  ('depo', 'Depo', 'Mal kabul yapar, teslimatları takip eder, stok girişi oluşturur'),
  ('muhasebe', 'Muhasebe', 'Fatura girer, PO/mal kabul ile eşleştirir, ödeme durumunu günceller'),
  ('izleyici', 'Yönetici / İzleyici', 'Sadece görüntüleme yetkisi');

-- ---------- KULLANICILAR ----------
-- auth.users (Supabase Auth) tablosuna 1-1 genişletme
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  ad_soyad text not null,
  eposta text not null unique,
  telefon text,
  rol user_role not null default 'izleyici',
  departman text,
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- DEPARTMAN / PROJE / MALİYET MERKEZİ ----------
create table departments (
  id uuid primary key default gen_random_uuid(),
  ad text not null unique,
  created_at timestamptz not null default now()
);

create table cost_centers (
  id uuid primary key default gen_random_uuid(),
  kod text not null unique,
  ad text not null,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  ad text not null,
  kod text unique,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------- TEDARİKÇİLER ----------
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  firma_adi text not null,
  vergi_no text,
  yetkili text,
  telefon text,
  eposta text,
  adres text,
  web_sitesi text,
  kategori text,
  odeme_kosulu text,
  para_birimi text default 'TRY',
  notlar text,
  aktif boolean not null default true,
  -- performans metrikleri (goods_receipts / invoices üzerinden hesaplanabilir, burada cache alan)
  performans_puani numeric(5,2) default 0,
  toplam_siparis_sayisi int default 0,
  ortalama_teslim_suresi_gun numeric(6,2),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table supplier_contacts (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id) on delete cascade,
  ad_soyad text not null,
  gorev text,
  telefon text,
  eposta text,
  created_at timestamptz not null default now()
);

-- ---------- ÜRÜN / MALZEME ----------
create table product_categories (
  id uuid primary key default gen_random_uuid(),
  ad text not null unique,
  ust_kategori_id uuid references product_categories(id)
);

create table units (
  id uuid primary key default gen_random_uuid(),
  kod text not null unique,   -- adet, mt, kg, lt ...
  ad text not null
);

create table products (
  id uuid primary key default gen_random_uuid(),
  urun_kodu text not null unique,   -- örn ELEK-001
  urun_adi text not null,
  aciklama text,
  category_id uuid references product_categories(id),
  marka text,
  model text,
  unit_id uuid references units(id),
  minimum_stok numeric(12,2) default 0,
  maksimum_stok numeric(12,2),
  mevcut_stok numeric(12,2) default 0,
  kritik_stok_seviyesi numeric(12,2),
  aktif boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- SATIN ALMA TALEBİ (PR) ----------
create sequence pr_no_seq start 1;

create table purchase_requisitions (
  id uuid primary key default gen_random_uuid(),
  pr_no text not null unique,           -- PR-2026-001 (trigger ile üretilir)
  talep_tarihi date not null default current_date,
  talep_eden uuid not null references profiles(id),
  department_id uuid references departments(id),
  project_id uuid references projects(id),
  cost_center_id uuid references cost_centers(id),
  ihtiyac_tarihi date,
  oncelik priority_level not null default 'normal',
  talep_turu text,
  aciklama text,
  durum pr_status not null default 'taslak',
  red_aciklamasi text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table purchase_requisition_items (
  id uuid primary key default gen_random_uuid(),
  pr_id uuid not null references purchase_requisitions(id) on delete cascade,
  product_id uuid references products(id),
  urun_kodu text,          -- kütükte olmayan serbest metin girişine izin verir
  aciklama text not null,
  miktar numeric(12,2) not null,
  unit_id uuid references units(id),
  tahmini_fiyat numeric(14,2),
  ihtiyac_tarihi date,
  not_metni text
);

-- PR numarası otomatik üretimi: PR-YYYY-NNN
create or replace function generate_pr_no() returns trigger as $$
begin
  new.pr_no := 'PR-' || extract(year from now())::text || '-' ||
               lpad(nextval('pr_no_seq')::text, 3, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_pr_no before insert on purchase_requisitions
  for each row when (new.pr_no is null) execute function generate_pr_no();

-- ---------- EKLER (genel amaçlı, tüm modüller kullanır) ----------
create table attachments (
  id uuid primary key default gen_random_uuid(),
  ilgili_tablo text not null,     -- 'purchase_requisitions', 'purchase_orders' ...
  ilgili_id uuid not null,
  dosya_adi text not null,
  dosya_tipi text,
  storage_path text not null,
  yukleyen uuid references profiles(id),
  yukleme_tarihi timestamptz not null default now()
);

-- ---------- AUDIT LOG ----------
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  kullanici_id uuid references profiles(id),
  ilgili_tablo text not null,
  ilgili_id uuid not null,
  islem text not null,        -- 'olusturdu', 'guncelledi', 'onayladi', 'reddetti' ...
  eski_deger jsonb,
  yeni_deger jsonb,
  created_at timestamptz not null default now()
);

-- ---------- updated_at otomatik güncelleme ----------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();
create trigger trg_suppliers_updated before update on suppliers
  for each row execute function set_updated_at();
create trigger trg_products_updated before update on products
  for each row execute function set_updated_at();
create trigger trg_pr_updated before update on purchase_requisitions
  for each row execute function set_updated_at();

-- ---------- ROW LEVEL SECURITY ----------
alter table profiles enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table purchase_requisitions enable row level security;
alter table purchase_requisition_items enable row level security;
alter table attachments enable row level security;
alter table audit_logs enable row level security;

-- Herkes giriş yapan kullanıcı kendi profilini görebilir + aktif kullanıcılar birbirini görebilir (isim göstermek için)
create policy "profiles_select_authenticated" on profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_update_self_or_yonetici" on profiles
  for update using (
    auth.uid() = id
    or exists (select 1 from profiles p where p.id = auth.uid() and p.rol = 'yonetici')
  );

-- Tedarikçi ve ürün: satın alma + yönetici yazabilir, herkes okuyabilir
create policy "suppliers_select_all" on suppliers for select using (auth.role() = 'authenticated');
create policy "suppliers_write_satinalma" on suppliers for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);
create policy "suppliers_update_satinalma" on suppliers for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);

create policy "products_select_all" on products for select using (auth.role() = 'authenticated');
create policy "products_write_satinalma_depo" on products for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','depo','yonetici'))
);
create policy "products_update_satinalma_depo" on products for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','depo','yonetici'))
);

-- Satın alma talebi: herkes okuyabilir; sadece satın alma + yönetici oluşturabilir/düzenleyebilir
create policy "pr_select_all" on purchase_requisitions for select using (auth.role() = 'authenticated');
create policy "pr_insert_satinalma" on purchase_requisitions for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);
create policy "pr_update_satinalma_or_owner" on purchase_requisitions for update using (
  talep_eden = auth.uid()
  or exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);

create policy "pr_items_select_all" on purchase_requisition_items for select using (auth.role() = 'authenticated');
create policy "pr_items_write_satinalma" on purchase_requisition_items for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);

create policy "attachments_select_all" on attachments for select using (auth.role() = 'authenticated');
create policy "attachments_insert_authenticated" on attachments for insert with check (auth.role() = 'authenticated');

create policy "audit_select_yonetici" on audit_logs for select using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('yonetici','satin_alma'))
);
create policy "audit_insert_authenticated" on audit_logs for insert with check (auth.role() = 'authenticated');

-- ---------- DEMO VERİLER ----------
insert into units (kod, ad) values
  ('adet', 'Adet'), ('mt', 'Metre'), ('kg', 'Kilogram'), ('lt', 'Litre'), ('kutu', 'Kutu');

insert into product_categories (ad) values
  ('Elektrik Panosu Malzemeleri'), ('Kablo ve Bağlantı'), ('SCADA / Otomasyon');

insert into projects (ad, kod) values
  ('GES Pano Üretimi', 'PRJ-GES-PANO'),
  ('GES Saha Panoları', 'PRJ-GES-SAHA'),
  ('Genel Üretim', 'PRJ-GENEL');

insert into departments (ad) values ('Satın Alma'), ('Depo'), ('Muhasebe'), ('Üretim');

insert into suppliers (firma_adi, yetkili, telefon, kategori, odeme_kosulu, para_birimi) values
  ('ABB', 'Genel Merkez', '+90 212 000 00 00', 'Elektrik Panosu Malzemeleri', '30 gün', 'TRY'),
  ('Schneider Electric', 'Genel Merkez', '+90 212 000 00 01', 'Elektrik Panosu Malzemeleri', '30 gün', 'TRY'),
  ('Chint', 'Hasan', '+90 532 000 00 02', 'Elektrik Panosu Malzemeleri', '30 gün', 'TRY'),
  ('Hyundai', 'Genel Merkez', '+90 212 000 00 03', 'Elektrik Panosu Malzemeleri', '45 gün', 'TRY'),
  ('Sigma', 'Genel Merkez', '+90 212 000 00 04', 'Kablo ve Bağlantı', '30 gün', 'TRY');

insert into products (urun_kodu, urun_adi, category_id, unit_id, minimum_stok, mevcut_stok, kritik_stok_seviyesi)
select 'ELEK-001', 'MCCB 400A', c.id, u.id, 50, 120, 60
from product_categories c, units u where c.ad = 'Elektrik Panosu Malzemeleri' and u.kod = 'adet';

insert into products (urun_kodu, urun_adi, category_id, unit_id, minimum_stok, mevcut_stok, kritik_stok_seviyesi)
select 'ELEK-002', 'NH Bıçaklı Sigorta 160A', c.id, u.id, 30, 45, 35
from product_categories c, units u where c.ad = 'Elektrik Panosu Malzemeleri' and u.kod = 'adet';

insert into products (urun_kodu, urun_adi, category_id, unit_id, minimum_stok, mevcut_stok, kritik_stok_seviyesi)
select 'KAB-001', 'Kablo 4x16 mm² NYY', c.id, u.id, 200, 350, 250
from product_categories c, units u where c.ad = 'Kablo ve Bağlantı' and u.kod = 'mt';
