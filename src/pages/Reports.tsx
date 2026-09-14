import { useEffect, useState } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import type { PurchaseOrder, Product, Invoice } from '../types'

export function Reports() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: poData }, { data: productData }, { data: invoiceData }] = await Promise.all([
        supabase.from('purchase_orders').select('*, suppliers(*), items:purchase_order_items(*)'),
        supabase.from('products').select('*'),
        supabase.from('invoices').select('*, suppliers(*)'),
      ])
      setPos((poData as unknown as PurchaseOrder[]) ?? [])
      setProducts((productData as Product[]) ?? [])
      setInvoices((invoiceData as unknown as Invoice[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const tedarikciBazli = Object.values(
    pos.reduce((acc, po) => {
      const ad = po.suppliers?.firma_adi ?? 'Bilinmiyor'
      acc[ad] = acc[ad] || { ad, toplam: 0 }
      acc[ad].toplam += po.genel_toplam
      return acc
    }, {} as Record<string, { ad: string; toplam: number }>)
  )

  const aylikTrend = Object.values(
    pos.reduce((acc, po) => {
      const d = new Date(po.siparis_tarihi)
      const key = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
      acc[key] = acc[key] || { ay: key, toplam: 0 }
      acc[key].toplam += po.genel_toplam
      return acc
    }, {} as Record<string, { ay: string; toplam: number }>)
  )

  const urunBazli = Object.values(
    pos.flatMap((po) => po.items ?? []).reduce((acc, item) => {
      acc[item.aciklama] = acc[item.aciklama] || { ad: item.aciklama, toplam: 0, adet: 0 }
      acc[item.aciklama].toplam += item.miktar * item.birim_fiyat
      acc[item.aciklama].adet += item.miktar
      return acc
    }, {} as Record<string, { ad: string; toplam: number; adet: number }>)
  ).sort((a, b) => b.toplam - a.toplam).slice(0, 8)

  const bekleyenPO = pos.filter((p) => !['tamamlandi', 'iptal'].includes(p.durum)).length
  const bekleyenFatura = invoices.filter((i) => i.odeme_durumu !== 'odendi').length
  const uyumsuzFatura = invoices.filter((i) => i.durum === 'uyumsuz').length
  const kritikStok = products.filter((p) => p.kritik_stok_seviyesi != null && p.mevcut_stok <= p.kritik_stok_seviyesi)

  function exportExcel() {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(pos.map((po) => ({
      'PO No': po.po_no, Tedarikçi: po.suppliers?.firma_adi ?? '', Tarih: po.siparis_tarihi,
      'Genel Toplam': po.genel_toplam, Durum: po.durum,
    }))), 'PO Raporu')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(urunBazli), 'Ürün Bazlı')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products.map((p) => ({
      Kod: p.urun_kodu, Ürün: p.urun_adi, 'Mevcut Stok': p.mevcut_stok, 'Minimum Stok': p.minimum_stok,
    }))), 'Stok Raporu')
    XLSX.writeFile(wb, 'baytech-satinalma-raporu.xlsx')
  }

  if (loading) return <p className="text-sm text-slate-400">Yükleniyor…</p>

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-bt-navy-900">Satın alma raporları</h1>
          <p className="text-sm text-slate-500 font-mono">REP01</p>
        </div>
        <button onClick={exportExcel} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          <i className="ti ti-file-spreadsheet" aria-hidden="true" /> Excel'e aktar
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Bekleyen PO'lar</p>
          <p className="text-2xl font-semibold text-bt-navy-900">{bekleyenPO}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Bekleyen faturalar</p>
          <p className="text-2xl font-semibold text-bt-navy-900">{bekleyenFatura}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Uyumsuz faturalar</p>
          <p className={`text-2xl font-semibold ${uyumsuzFatura > 0 ? 'text-red-600' : 'text-bt-navy-900'}`}>{uyumsuzFatura}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-400">Kritik stoktaki ürün</p>
          <p className={`text-2xl font-semibold ${kritikStok.length > 0 ? 'text-red-600' : 'text-bt-navy-900'}`}>{kritikStok.length}</p>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Aylık satın alma trendi</h2>
          {aylikTrend.length === 0 ? <p className="py-10 text-center text-xs text-slate-400">Henüz veri yok.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={aylikTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ay" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString('tr-TR')} TL`} />
                <Line type="monotone" dataKey="toplam" stroke="#163166" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Tedarikçi bazında satın alma</h2>
          {tedarikciBazli.length === 0 ? <p className="py-10 text-center text-xs text-slate-400">Henüz veri yok.</p> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tedarikciBazli}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ad" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString('tr-TR')} TL`} />
                <Bar dataKey="toplam" fill="#163166" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Ürün bazında harcama (en yüksek 8)</h2>
          {urunBazli.length === 0 ? <p className="py-10 text-center text-xs text-slate-400">Henüz veri yok.</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={urunBazli} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={11} />
                <YAxis type="category" dataKey="ad" fontSize={10} width={140} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString('tr-TR')} TL`} />
                <Legend />
                <Bar dataKey="toplam" name="Harcama (TL)" fill="#c9a227" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {kritikStok.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="mb-2 text-sm font-semibold text-red-700">Kritik stok uyarısı</h2>
          <div className="flex flex-wrap gap-2">
            {kritikStok.map((p) => (
              <span key={p.id} className="badge bg-white text-red-700">{p.urun_adi} — {p.mevcut_stok} adet kaldı</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
