export type UserRole = 'yonetici' | 'satin_alma' | 'depo' | 'muhasebe' | 'izleyici'

export type PRStatus =
  | 'taslak'
  | 'onay_bekliyor'
  | 'onaylandi'
  | 'reddedildi'
  | 'satin_alma_surecinde'
  | 'tamamlandi'
  | 'iptal_edildi'

export type PriorityLevel = 'dusuk' | 'normal' | 'yuksek' | 'acil'

export const ROLE_LABELS: Record<UserRole, string> = {
  yonetici: 'Yönetici',
  satin_alma: 'Satın Alma',
  depo: 'Depo',
  muhasebe: 'Muhasebe',
  izleyici: 'Yönetici / İzleyici',
}

export const PR_STATUS_LABELS: Record<PRStatus, string> = {
  taslak: 'Taslak',
  onay_bekliyor: 'Onay Bekliyor',
  onaylandi: 'Onaylandı',
  reddedildi: 'Reddedildi',
  satin_alma_surecinde: 'Satın Alma Sürecinde',
  tamamlandi: 'Tamamlandı',
  iptal_edildi: 'İptal Edildi',
}

export interface Profile {
  id: string
  ad_soyad: string
  eposta: string
  telefon?: string | null
  rol: UserRole
  departman?: string | null
  aktif: boolean
}

export interface Supplier {
  id: string
  firma_adi: string
  vergi_no?: string | null
  yetkili?: string | null
  telefon?: string | null
  eposta?: string | null
  adres?: string | null
  kategori?: string | null
  odeme_kosulu?: string | null
  para_birimi: string
  performans_puani: number
  aktif: boolean
}

export interface Product {
  id: string
  urun_kodu: string
  urun_adi: string
  mevcut_stok: number
  minimum_stok: number
  kritik_stok_seviyesi?: number | null
  aktif: boolean
}

export interface PurchaseRequisitionItem {
  id: string
  pr_id: string
  product_id?: string | null
  urun_kodu?: string | null
  aciklama: string
  miktar: number
  tahmini_fiyat?: number | null
  ihtiyac_tarihi?: string | null
}

export interface PurchaseRequisition {
  id: string
  pr_no: string
  talep_tarihi: string
  talep_eden: string
  ihtiyac_tarihi?: string | null
  oncelik: PriorityLevel
  aciklama?: string | null
  durum: PRStatus
  created_at: string
  items?: PurchaseRequisitionItem[]
}

/** T-Code hızlı komut tanımı */
export interface QuickCommand {
  code: string
  title: string
  description: string
  path: string
  allowedRoles: UserRole[]
  /** Gerçek SAP MM'deki karşılığı — öğrenme amaçlı */
  sapKarsiligi: string
  /** Bu kodun SAP MM mantığında ne işe yaradığını anlatan öğretici not */
  ogrenmeNotu: string
}

// ---------- FAZ 2: RFQ / Teklif ----------
export type RfqStatus = 'taslak' | 'gonderildi' | 'teklif_toplaniyor' | 'kapandi'
export type TeklifKaynagi = 'eposta' | 'pdf' | 'excel' | 'whatsapp' | 'telefon' | 'yuz_yuze' | 'web_sitesi' | 'diger'

export const RFQ_STATUS_LABELS: Record<RfqStatus, string> = {
  taslak: 'Taslak',
  gonderildi: 'Gönderildi',
  teklif_toplaniyor: 'Teklif Toplanıyor',
  kapandi: 'Kapandı',
}

export const TEKLIF_KAYNAGI_LABELS: Record<TeklifKaynagi, string> = {
  eposta: 'E-posta',
  pdf: 'PDF',
  excel: 'Excel',
  whatsapp: 'WhatsApp',
  telefon: 'Telefon',
  yuz_yuze: 'Yüz yüze',
  web_sitesi: 'Web sitesi',
  diger: 'Diğer',
}

export interface Quotation {
  id: string
  qt_no: string
  rfq_id?: string | null
  supplier_id: string
  teklif_kaynagi: TeklifKaynagi
  yetkili_kisi?: string | null
  odeme_kosulu?: string | null
  teslim_suresi_gun?: number | null
  gecerlilik_tarihi?: string | null
  not_metni?: string | null
  onerilen: boolean
  secilen: boolean
  degerlendirme_notu?: string | null
  created_at: string
  items?: QuotationItem[]
  suppliers?: Supplier
}

export interface QuotationItem {
  id: string
  quotation_id: string
  urun_aciklama: string
  miktar: number
  birim_fiyat: number
  kdv_orani: number
}

// ---------- FAZ 3: PO ----------
export type PoStatus =
  | 'taslak' | 'onay_bekliyor' | 'onaylandi' | 'tedarikciye_gonderildi' | 'hazirlaniyor'
  | 'sevkiyatta' | 'kismi_teslimat' | 'teslim_edildi' | 'mal_kabul_bekliyor' | 'tamamlandi' | 'iptal'

export const PO_STATUS_LABELS: Record<PoStatus, string> = {
  taslak: 'Taslak',
  onay_bekliyor: 'Onay Bekliyor',
  onaylandi: 'Onaylandı',
  tedarikciye_gonderildi: 'Tedarikçiye Gönderildi',
  hazirlaniyor: 'Hazırlanıyor',
  sevkiyatta: 'Sevkiyatta',
  kismi_teslimat: 'Kısmi Teslimat',
  teslim_edildi: 'Teslim Edildi',
  mal_kabul_bekliyor: 'Mal Kabul Bekliyor',
  tamamlandi: 'Tamamlandı',
  iptal: 'İptal',
}

export interface PurchaseOrder {
  id: string
  po_no: string
  pr_id?: string | null
  quotation_id?: string | null
  supplier_id: string
  siparis_tarihi: string
  planlanan_teslim_tarihi?: string | null
  odeme_sekli?: string | null
  odeme_vadesi?: string | null
  siparis_yontemi: string
  ara_toplam: number
  kdv: number
  genel_toplam: number
  durum: PoStatus
  created_at: string
  suppliers?: Supplier
  items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
  id: string
  po_id: string
  product_id?: string | null
  aciklama: string
  miktar: number
  birim_fiyat: number
  kdv_orani: number
  gelen_miktar: number
}

// ---------- FAZ 4: Mal kabul / stok ----------
export type GrStatus = 'bekliyor' | 'tam_kabul' | 'kismi_kabul' | 'reddedildi'

export const GR_STATUS_LABELS: Record<GrStatus, string> = {
  bekliyor: 'Bekliyor',
  tam_kabul: 'Tam Kabul',
  kismi_kabul: 'Kısmi Kabul',
  reddedildi: 'Reddedildi',
}

export interface GoodsReceipt {
  id: string
  gr_no: string
  po_id: string
  kabul_tarihi: string
  durum: GrStatus
  not_metni?: string | null
  purchase_orders?: PurchaseOrder
}

// ---------- FAZ 5: Fatura / ödeme ----------
export type FaturaDurumu = 'taslak' | 'kontrol_bekliyor' | 'uyumlu' | 'uyumsuz' | 'onaylandi'
export type OdemeDurumu = 'odeme_bekliyor' | 'kismi_odendi' | 'odendi' | 'gecikti'

export const FATURA_DURUMU_LABELS: Record<FaturaDurumu, string> = {
  taslak: 'Taslak',
  kontrol_bekliyor: 'Kontrol Bekliyor',
  uyumlu: 'Uyumlu',
  uyumsuz: 'Uyumsuz',
  onaylandi: 'Onaylandı',
}

export const ODEME_DURUMU_LABELS: Record<OdemeDurumu, string> = {
  odeme_bekliyor: 'Ödeme Bekliyor',
  kismi_odendi: 'Kısmi Ödendi',
  odendi: 'Ödendi',
  gecikti: 'Gecikti',
}

export interface Invoice {
  id: string
  fatura_no: string
  fatura_tarihi: string
  supplier_id: string
  po_id?: string | null
  ara_toplam: number
  kdv: number
  genel_toplam: number
  vade_tarihi?: string | null
  durum: FaturaDurumu
  odeme_durumu: OdemeDurumu
  uyumsuzluk_notu?: string | null
  suppliers?: Supplier
  purchase_orders?: PurchaseOrder
}

export interface StockMovement {
  id: string
  product_id: string
  hareket_tipi: string
  miktar: number
  aciklama?: string | null
  created_at: string
  products?: Product
}
