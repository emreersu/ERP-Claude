import type { QuickCommand } from '../types'

/**
 * T-code benzeri hızlı komut sistemi. Her komutun gerçek SAP MM karşılığı
 * ve öğretici bir notu var — amaç, bu sistemi kullanarak gerçek SAP MM
 * mantığını öğrenmek.
 */
export const QUICK_COMMANDS: QuickCommand[] = [
  {
    code: 'PR01', title: 'Yeni Satın Alma Talebi', description: 'Yeni bir satın alma talebi oluştur',
    path: '/talepler/yeni', allowedRoles: ['satin_alma', 'yonetici'],
    sapKarsiligi: 'ME51N (Create Purchase Requisition)',
    ogrenmeNotu: 'SAP MM\'de satın alma süreci her zaman bir "talep" (Purchase Requisition / PR) ile başlar. Bu, henüz tedarikçiye gitmemiş, sadece "buna ihtiyacımız var" demek. SAP\'de ME51N ile açılır.',
  },
  {
    code: 'PR02', title: 'Talepleri Listele', description: 'Tüm satın alma taleplerini görüntüle',
    path: '/talepler', allowedRoles: ['satin_alma', 'yonetici', 'izleyici', 'depo', 'muhasebe'],
    sapKarsiligi: 'ME5A (List Display of Purchase Requisitions)',
    ogrenmeNotu: 'SAP\'de talepleri listelemek ve filtrelemek için kullanılır. Talep durumları (taslak/onaylı/kapalı) burada takip edilir.',
  },
  {
    code: 'RFQ01', title: 'Yeni Teklif Talebi', description: 'Tedarikçilerden teklif iste',
    path: '/teklif-talepleri/yeni', allowedRoles: ['satin_alma', 'yonetici'],
    sapKarsiligi: 'ME41 (Create RFQ - Request for Quotation)',
    ogrenmeNotu: 'RFQ, "bize fiyat verir misiniz" demenin resmi yolu. SAP\'de talep onaylandıktan sonra birden fazla tedarikçiye aynı RFQ gönderilebilir.',
  },
  {
    code: 'RFQ02', title: 'Teklif Taleplerini Listele', description: 'Gönderilen teklif taleplerini görüntüle',
    path: '/teklif-talepleri', allowedRoles: ['satin_alma', 'yonetici'],
    sapKarsiligi: 'ME4S (List of RFQs)',
    ogrenmeNotu: 'Hangi RFQ\'nun hangi tedarikçiye gittiğini ve cevap durumunu görmek için kullanılır.',
  },
  {
    code: 'QT01', title: 'Teklif Gir', description: 'Tedarikçiden alınan teklifi kaydet',
    path: '/teklifler/yeni', allowedRoles: ['satin_alma', 'yonetici'],
    sapKarsiligi: 'ME47 (Maintain Quotation)',
    ogrenmeNotu: 'Tedarikçi cevap verdiğinde (telefonla bile olsa) bu teklif sisteme girilir. SAP\'de gerçek hayatta olduğu gibi, teklif her zaman resmi bir belge olmak zorunda değildir.',
  },
  {
    code: 'QT02', title: 'Teklifleri Karşılaştır', description: 'Aynı ürün için teklifleri yan yana karşılaştır',
    path: '/teklifler/karsilastir', allowedRoles: ['satin_alma', 'yonetici'],
    sapKarsiligi: 'ME49 (Price Comparison of Quotations)',
    ogrenmeNotu: 'SAP\'nin "fiyat karşılaştırma" ekranının basitleştirilmiş hali. Burada sadece fiyat değil, teslim süresi ve ödeme koşulu da değerlendirilir — gerçek satın almacılar da böyle karar verir.',
  },
  {
    code: 'PO01', title: 'Yeni PO', description: 'Yeni satın alma siparişi oluştur',
    path: '/siparisler/yeni', allowedRoles: ['satin_alma', 'yonetici'],
    sapKarsiligi: 'ME21N (Create Purchase Order)',
    ogrenmeNotu: 'PO (Purchase Order), tedarikçiye gönderilen resmi sipariş belgesidir — SAP MM\'nin en çok kullanılan ekranıdır. Bir kere PO kesildi mi, sipariş bağlayıcı hale gelir.',
  },
  {
    code: 'PO02', title: 'PO Listesi', description: 'Satın alma siparişlerini görüntüle',
    path: '/siparisler', allowedRoles: ['satin_alma', 'yonetici', 'depo', 'muhasebe', 'izleyici'],
    sapKarsiligi: 'ME2N (Purchase Orders by PO Number)',
    ogrenmeNotu: 'Tüm siparişleri ve durumlarını (onay bekliyor / teslim edildi / tamamlandı) tek ekranda görürsün.',
  },
  {
    code: 'PO03', title: 'PO Takibi', description: 'Sipariş durumu ve teslimat takibi',
    path: '/siparisler/takip', allowedRoles: ['satin_alma', 'yonetici', 'depo'],
    sapKarsiligi: 'ME23N (Display Purchase Order)',
    ogrenmeNotu: 'Bir PO\'nun tüm geçmişini (kim onayladı, ne zaman gönderildi, mal geldi mi) tek yerden izlemeyi öğretir.',
  },
  {
    code: 'GR01', title: 'Mal Kabul', description: 'Gelen teslimatı mal kabul ekranından işle',
    path: '/mal-kabul/yeni', allowedRoles: ['depo', 'satin_alma', 'yonetici'],
    sapKarsiligi: 'MIGO (Goods Movement / Goods Receipt)',
    ogrenmeNotu: 'SAP\'nin en bilinen T-code\'larından biri. Mal fiziksel olarak geldiğinde burada "kabul edildi" denir ve bu an itibariyle stok otomatik artar.',
  },
  {
    code: 'GR02', title: 'Mal Kabul Listesi', description: 'Yapılan mal kabullerin listesi',
    path: '/mal-kabul', allowedRoles: ['depo', 'yonetici', 'satin_alma'],
    sapKarsiligi: 'MB51 (Material Document List)',
    ogrenmeNotu: 'Geçmişte yapılan tüm mal kabul işlemlerinin kaydı — denetim ve geriye dönük kontrol için önemlidir.',
  },
  {
    code: 'ST01', title: 'Stok Kartları', description: 'Ürün/malzeme stok kartlarını görüntüle',
    path: '/stok', allowedRoles: ['depo', 'yonetici', 'satin_alma', 'izleyici'],
    sapKarsiligi: 'MMBE (Stock Overview)',
    ogrenmeNotu: 'Her malzemenin anlık stok durumunu gösterir. Kritik stok seviyesinin altına düşen ürünler burada işaretlenir.',
  },
  {
    code: 'ST02', title: 'Stok Hareketleri', description: 'Stok giriş/çıkış hareket geçmişi',
    path: '/stok/hareketler', allowedRoles: ['depo', 'yonetici'],
    sapKarsiligi: 'MB52 / MMBE hareket geçmişi',
    ogrenmeNotu: 'Stoğun neden değiştiğini (hangi mal kabulden, hangi çıkıştan) izlemeyi öğretir — SAP\'de "malzeme belgesi" (material document) mantığının temelidir.',
  },
  {
    code: 'SUP01', title: 'Yeni Tedarikçi', description: 'Yeni tedarikçi kartı oluştur',
    path: '/tedarikciler/yeni', allowedRoles: ['satin_alma', 'yonetici'],
    sapKarsiligi: 'XK01 (Create Vendor - Centrally)',
    ogrenmeNotu: 'SAP\'de tedarikçiye "vendor" denir. Bir tedarikçiyle çalışmadan önce sistemde bir "vendor master" kaydı oluşturulması gerekir.',
  },
  {
    code: 'SUP02', title: 'Tedarikçi Listesi', description: 'Tedarikçileri ve performanslarını görüntüle',
    path: '/tedarikciler', allowedRoles: ['satin_alma', 'yonetici', 'izleyici', 'muhasebe'],
    sapKarsiligi: 'XK03 / ME2L (Purchase Orders by Vendor)',
    ogrenmeNotu: 'Tedarikçi bazlı satın alma geçmişini ve performans metriklerini görmeyi öğretir.',
  },
  {
    code: 'MM01', title: 'Malzeme Oluştur', description: 'Yeni ürün/malzeme kartı oluştur',
    path: '/urunler', allowedRoles: ['satin_alma', 'depo', 'yonetici'],
    sapKarsiligi: 'MM01 (Create Material)',
    ogrenmeNotu: 'SAP\'nin belki de en ünlü T-code\'u. Her ürün/malzeme sisteme girmeden önce burada bir "malzeme kartı" ile tanımlanır.',
  },
  {
    code: 'INV01', title: 'Fatura Girişi', description: 'Gelen faturayı PO ve mal kabul ile eşleştirerek kaydet',
    path: '/faturalar/yeni', allowedRoles: ['muhasebe', 'satin_alma', 'yonetici'],
    sapKarsiligi: 'MIRO (Invoice Verification)',
    ogrenmeNotu: 'SAP\'nin "üç yönlü kontrol" (3-way match) mantığı: PO + Mal Kabul + Fatura tutarları karşılaştırılır. Uyuşmazsa sistem uyarır — muhasebede en kritik kontrol noktalarından biridir.',
  },
  {
    code: 'INV02', title: 'Fatura Kontrolü', description: 'PO / mal kabul / fatura uyumunu kontrol et',
    path: '/faturalar', allowedRoles: ['muhasebe', 'yonetici', 'satin_alma'],
    sapKarsiligi: 'MIR4 / MIR6 (Invoice Overview)',
    ogrenmeNotu: 'Bekleyen ve uyumsuz faturaları tek ekranda görüp çözüme kavuşturmayı öğretir.',
  },
  {
    code: 'REP01', title: 'Satın Alma Raporları', description: 'Aylık, tedarikçi ve ürün bazlı raporlar',
    path: '/raporlar', allowedRoles: ['yonetici', 'satin_alma', 'muhasebe', 'izleyici'],
    sapKarsiligi: 'ME80FN (General Analyses - Purchasing)',
    ogrenmeNotu: 'SAP\'de satın alma verilerini analiz etmek için kullanılan raporlama ekranlarının basitleştirilmiş hali.',
  },
]

export function findCommand(input: string): QuickCommand | undefined {
  const normalized = input.trim().toUpperCase()
  return QUICK_COMMANDS.find((c) => c.code === normalized)
}

export function searchCommands(input: string): QuickCommand[] {
  const normalized = input.trim().toUpperCase()
  if (!normalized) return QUICK_COMMANDS
  return QUICK_COMMANDS.filter(
    (c) => c.code.includes(normalized) || c.title.toUpperCase().includes(normalized)
  )
}
