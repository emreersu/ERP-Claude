import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { FATURA_DURUMU_LABELS, ODEME_DURUMU_LABELS, type Invoice } from '../types'

export function Invoices() {
  const [items, setItems] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('invoices').select('*, suppliers(*), purchase_orders(*)').order('created_at', { ascending: false })
    setItems((data as unknown as Invoice[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function approve(id: string) {
    await supabase.from('invoices').update({ durum: 'onaylandi' }).eq('id', id)
    load()
  }

  async function markPaid(id: string) {
    await supabase.from('invoices').update({ odeme_durumu: 'odendi' }).eq('id', id)
    await supabase.from('payments').insert({ invoice_id: id, tutar: 0, odeme_yontemi: 'banka' })
    load()
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Fatura yönetimi</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">INV02</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Fatura no</th><th className="px-4 py-2">PO</th><th className="px-4 py-2">Tedarikçi</th>
              <th className="px-4 py-2">Tutar</th><th className="px-4 py-2">Eşleşme</th><th className="px-4 py-2">Ödeme</th><th className="px-4 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Henüz fatura yok.</td></tr>}
            {items.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{inv.fatura_no}</td>
                <td className="px-4 py-2">{inv.purchase_orders?.po_no ?? '—'}</td>
                <td className="px-4 py-2">{inv.suppliers?.firma_adi}</td>
                <td className="px-4 py-2">{inv.genel_toplam.toLocaleString('tr-TR')} TL</td>
                <td className="px-4 py-2">
                  <span className={`badge ${inv.durum === 'uyumsuz' ? 'bg-red-50 text-red-700' : inv.durum === 'onaylandi' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                    {FATURA_DURUMU_LABELS[inv.durum]}
                  </span>
                  {inv.durum === 'uyumsuz' && <p className="mt-0.5 text-xs text-red-500">{inv.uyumsuzluk_notu}</p>}
                </td>
                <td className="px-4 py-2"><span className="badge bg-slate-100 text-slate-700">{ODEME_DURUMU_LABELS[inv.odeme_durumu]}</span></td>
                <td className="px-4 py-2">
                  <div className="flex gap-1">
                    {inv.durum === 'uyumlu' && (
                      <button onClick={() => approve(inv.id)} className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100">Onayla</button>
                    )}
                    {inv.odeme_durumu !== 'odendi' && (
                      <button onClick={() => markPaid(inv.id)} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700 hover:bg-blue-100">Ödendi işaretle</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
