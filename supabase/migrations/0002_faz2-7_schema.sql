-- ============================================================
-- BAYTECH MÜHENDİSLİK - FAZ 2-7 şeması
-- ============================================================

create type rfq_status as enum ('taslak', 'gonderildi', 'teklif_toplaniyor', 'kapandi');
create type teklif_kaynagi as enum ('eposta','pdf','excel','whatsapp','telefon','yuz_yuze','web_sitesi','diger');
create type po_status as enum (
  'taslak','onay_bekliyor','onaylandi','tedarikciye_gonderildi','hazirlaniyor',
  'sevkiyatta','kismi_teslimat','teslim_edildi','mal_kabul_bekliyor','tamamlandi','iptal'
);
create type teslimat_yontemi as enum ('kargo','nakliye_firmasi','tedarikci_araci','sirket_araci','elden_teslim','diger');
create type gr_status as enum ('bekliyor','tam_kabul','kismi_kabul','reddedildi');
create type fatura_durumu as enum ('taslak','kontrol_bekliyor','uyumlu','uyumsuz','onaylandi');
create type odeme_durumu as enum ('odeme_bekliyor','kismi_odendi','odendi','gecikti');

-- ---------- RFQ ----------
create sequence rfq_no_seq start 1;
create table rfqs (
  id uuid primary key default gen_random_uuid(),
  rfq_no text not null unique,
  pr_id uuid references purchase_requisitions(id),
  olusturma_tarihi date not null default current_date,
  gecerlilik_tarihi date,
  aciklama text,
  durum rfq_status not null default 'taslak',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table rfq_suppliers (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references rfqs(id) on delete cascade,
  supplier_id uuid not null references suppliers(id),
  gonderildi_mi boolean default false,
  unique (rfq_id, supplier_id)
);

create or replace function generate_rfq_no() returns trigger as $$
begin
  new.rfq_no := 'RFQ-' || extract(year from now())::text || '-' || lpad(nextval('rfq_no_seq')::text, 3, '0');
  return new;
end; $$ language plpgsql;
create trigger trg_rfq_no before insert on rfqs
  for each row when (new.rfq_no is null) execute function generate_rfq_no();

-- ---------- TEKLİF ----------
create sequence qt_no_seq start 1;
create table quotations (
  id uuid primary key default gen_random_uuid(),
  qt_no text not null unique,
  rfq_id uuid references rfqs(id),
  supplier_id uuid not null references suppliers(id),
  teklif_kaynagi teklif_kaynagi not null default 'eposta',
  yetkili_kisi text,
  odeme_kosulu text,
  teslim_suresi_gun int,
  gecerlilik_tarihi date,
  belge_var_mi boolean default false,
  attachment_id uuid references attachments(id),
  not_metni text,
  onerilen boolean default false,
  secilen boolean default false,
  degerlendirme_notu text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references quotations(id) on delete cascade,
  product_id uuid references products(id),
  urun_aciklama text not null,
  miktar numeric(12,2) not null,
  birim_fiyat numeric(14,2) not null,
  kdv_orani numeric(5,2) default 20
);

create or replace function generate_qt_no() returns trigger as $$
begin
  new.qt_no := 'QT-' || extract(year from now())::text || '-' || lpad(nextval('qt_no_seq')::text, 3, '0');
  return new;
end; $$ language plpgsql;
create trigger trg_qt_no before insert on quotations
  for each row when (new.qt_no is null) execute function generate_qt_no();
create trigger trg_qt_updated before update on quotations
  for each row execute function set_updated_at();

-- ---------- PO ----------
create sequence po_no_seq start 1;
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_no text not null unique,
  pr_id uuid references purchase_requisitions(id),
  quotation_id uuid references quotations(id),
  supplier_id uuid not null references suppliers(id),
  siparis_tarihi date not null default current_date,
  planlanan_teslim_tarihi date,
  odeme_sekli text,
  odeme_vadesi text,
  sevkiyat_yontemi text,
  para_birimi text default 'TRY',
  siparis_yontemi text default 'sistem',   -- 'telefon','eposta','sistem' vb.
  ara_toplam numeric(14,2) default 0,
  iskonto numeric(14,2) default 0,
  kdv numeric(14,2) default 0,
  genel_toplam numeric(14,2) default 0,
  ic_not text,
  tedarikciye_not text,
  durum po_status not null default 'taslak',
  onaylayan uuid references profiles(id),
  onay_tarihi timestamptz,
  red_aciklamasi text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid references products(id),
  urun_kodu text,
  aciklama text not null,
  miktar numeric(12,2) not null,
  birim_fiyat numeric(14,2) not null,
  iskonto numeric(14,2) default 0,
  kdv_orani numeric(5,2) default 20,
  teslim_tarihi date,
  gelen_miktar numeric(12,2) default 0    -- mal kabul ile güncellenir
);

create or replace function generate_po_no() returns trigger as $$
begin
  new.po_no := 'PO-' || extract(year from now())::text || '-' || lpad(nextval('po_no_seq')::text, 3, '0');
  return new;
end; $$ language plpgsql;
create trigger trg_po_no before insert on purchase_orders
  for each row when (new.po_no is null) execute function generate_po_no();
create trigger trg_po_updated before update on purchase_orders
  for each row execute function set_updated_at();

-- ---------- TESLİMAT ----------
create table deliveries (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references purchase_orders(id),
  teslimat_yontemi teslimat_yontemi not null default 'kargo',
  kargo_no text,
  teslim_alan text,
  planlanan_tarih date,
  gerceklesen_tarih date,
  not_metni text,
  created_at timestamptz not null default now()
);

-- ---------- MAL KABUL ----------
create sequence gr_no_seq start 1;
create table goods_receipts (
  id uuid primary key default gen_random_uuid(),
  gr_no text not null unique,
  po_id uuid not null references purchase_orders(id),
  delivery_id uuid references deliveries(id),
  kabul_tarihi date not null default current_date,
  kabul_eden uuid references profiles(id),
  durum gr_status not null default 'bekliyor',
  miktar_uygun boolean,
  urun_uygun boolean,
  fiziksel_durum_uygun boolean,
  teknik_ozellik_uygun boolean,
  not_metni text,
  created_at timestamptz not null default now()
);

create table goods_receipt_items (
  id uuid primary key default gen_random_uuid(),
  gr_id uuid not null references goods_receipts(id) on delete cascade,
  po_item_id uuid not null references purchase_order_items(id),
  beklenen_miktar numeric(12,2) not null,
  gelen_miktar numeric(12,2) not null,
  hasarli_miktar numeric(12,2) default 0,
  not_metni text
);

create or replace function generate_gr_no() returns trigger as $$
begin
  new.gr_no := 'GR-' || extract(year from now())::text || '-' || lpad(nextval('gr_no_seq')::text, 3, '0');
  return new;
end; $$ language plpgsql;
create trigger trg_gr_no before insert on goods_receipts
  for each row when (new.gr_no is null) execute function generate_gr_no();

-- ---------- STOK HAREKETİ ----------
create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  hareket_tipi text not null,   -- 'giris','cikis'
  miktar numeric(12,2) not null,
  kaynak_tablo text,            -- 'goods_receipts'
  kaynak_id uuid,
  aciklama text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Mal kabul onaylandığında stok otomatik güncellensin
create or replace function apply_goods_receipt_to_stock() returns trigger as $$
declare
  v_product_id uuid;
begin
  if new.durum in ('tam_kabul','kismi_kabul') and (old.durum is distinct from new.durum) then
    for v_product_id in
      select po_items.product_id
      from goods_receipt_items gri
      join purchase_order_items po_items on po_items.id = gri.po_item_id
      where gri.gr_id = new.id and po_items.product_id is not null
    loop
      update products p
      set mevcut_stok = p.mevcut_stok + gri.gelen_miktar
      from goods_receipt_items gri
      join purchase_order_items poi on poi.id = gri.po_item_id
      where p.id = poi.product_id and gri.gr_id = new.id and poi.product_id = p.id;
    end loop;

    insert into stock_movements (product_id, hareket_tipi, miktar, kaynak_tablo, kaynak_id, aciklama, created_by)
    select poi.product_id, 'giris', gri.gelen_miktar, 'goods_receipts', new.id,
           'Mal kabul: ' || new.gr_no, new.kabul_eden
    from goods_receipt_items gri
    join purchase_order_items poi on poi.id = gri.po_item_id
    where gri.gr_id = new.id and poi.product_id is not null;

    update purchase_order_items poi
    set gelen_miktar = poi.gelen_miktar + gri.gelen_miktar
    from goods_receipt_items gri
    where gri.po_item_id = poi.id and gri.gr_id = new.id;
  end if;
  return new;
end; $$ language plpgsql;

create trigger trg_gr_stock after update on goods_receipts
  for each row execute function apply_goods_receipt_to_stock();

-- ---------- FATURA ----------
create sequence inv_no_seq start 1;
create table invoices (
  id uuid primary key default gen_random_uuid(),
  fatura_no text not null,
  fatura_tarihi date not null default current_date,
  supplier_id uuid not null references suppliers(id),
  po_id uuid references purchase_orders(id),
  goods_receipt_id uuid references goods_receipts(id),
  ara_toplam numeric(14,2) not null,
  kdv numeric(14,2) not null,
  genel_toplam numeric(14,2) not null,
  vade_tarihi date,
  durum fatura_durumu not null default 'kontrol_bekliyor',
  odeme_durumu odeme_durumu not null default 'odeme_bekliyor',
  uyumsuzluk_notu text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  odeme_tarihi date not null default current_date,
  tutar numeric(14,2) not null,
  odeme_yontemi text,
  not_metni text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Fatura oluşurken PO toplamıyla otomatik uyum kontrolü
create or replace function check_invoice_match() returns trigger as $$
declare
  v_po_toplam numeric(14,2);
begin
  if new.po_id is not null then
    select genel_toplam into v_po_toplam from purchase_orders where id = new.po_id;
    if v_po_toplam is not null and abs(v_po_toplam - new.genel_toplam) > 0.01 then
      new.durum := 'uyumsuz';
      new.uyumsuzluk_notu := format('PO tutarı %s TL, fatura tutarı %s TL', v_po_toplam, new.genel_toplam);
    else
      new.durum := 'uyumlu';
    end if;
  end if;
  return new;
end; $$ language plpgsql;

create trigger trg_invoice_match before insert on invoices
  for each row execute function check_invoice_match();

-- ---------- BİLDİRİMLER ----------
create table notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  baslik text not null,
  mesaj text,
  ilgili_tablo text,
  ilgili_id uuid,
  okundu boolean default false,
  created_at timestamptz not null default now()
);

-- ---------- RLS ----------
alter table rfqs enable row level security;
alter table rfq_suppliers enable row level security;
alter table quotations enable row level security;
alter table quotation_items enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table deliveries enable row level security;
alter table goods_receipts enable row level security;
alter table goods_receipt_items enable row level security;
alter table stock_movements enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table notifications enable row level security;

create policy "rfq_select_all" on rfqs for select using (auth.role() = 'authenticated');
create policy "rfq_write_satinalma" on rfqs for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);
create policy "rfq_sup_select_all" on rfq_suppliers for select using (auth.role() = 'authenticated');
create policy "rfq_sup_write_satinalma" on rfq_suppliers for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);

create policy "qt_select_all" on quotations for select using (auth.role() = 'authenticated');
create policy "qt_write_satinalma" on quotations for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);
create policy "qt_items_select_all" on quotation_items for select using (auth.role() = 'authenticated');
create policy "qt_items_write_satinalma" on quotation_items for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);

create policy "po_select_all" on purchase_orders for select using (auth.role() = 'authenticated');
create policy "po_insert_satinalma" on purchase_orders for insert with check (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);
create policy "po_update_satinalma_yonetici" on purchase_orders for update using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);
create policy "po_items_select_all" on purchase_order_items for select using (auth.role() = 'authenticated');
create policy "po_items_write_satinalma" on purchase_order_items for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','yonetici'))
);

create policy "deliveries_select_all" on deliveries for select using (auth.role() = 'authenticated');
create policy "deliveries_write_satinalma_depo" on deliveries for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('satin_alma','depo','yonetici'))
);

create policy "gr_select_all" on goods_receipts for select using (auth.role() = 'authenticated');
create policy "gr_write_depo" on goods_receipts for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('depo','yonetici'))
);
create policy "gr_items_select_all" on goods_receipt_items for select using (auth.role() = 'authenticated');
create policy "gr_items_write_depo" on goods_receipt_items for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('depo','yonetici'))
);

create policy "stock_mov_select_all" on stock_movements for select using (auth.role() = 'authenticated');
create policy "stock_mov_insert_system" on stock_movements for insert with check (auth.role() = 'authenticated');

create policy "invoices_select_all" on invoices for select using (auth.role() = 'authenticated');
create policy "invoices_write_muhasebe" on invoices for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('muhasebe','yonetici'))
);
create policy "payments_select_all" on payments for select using (auth.role() = 'authenticated');
create policy "payments_write_muhasebe" on payments for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.rol in ('muhasebe','yonetici'))
);

create policy "notif_select_own" on notifications for select using (profile_id = auth.uid());
create policy "notif_insert_system" on notifications for insert with check (auth.role() = 'authenticated');
create policy "notif_update_own" on notifications for update using (profile_id = auth.uid());

-- ---------- REALTIME ----------
alter publication supabase_realtime add table purchase_requisitions;
alter publication supabase_realtime add table purchase_orders;
alter publication supabase_realtime add table goods_receipts;
alter publication supabase_realtime add table invoices;
alter publication supabase_realtime add table notifications;
