import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { GR_STATUS_LABELS, type GoodsReceipt } from '../types'

export function GoodsReceipts() {
  const [items, setItems] = useState<GoodsReceipt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('goods_receipts').select('*, purchase_orders(*, suppliers(*))').order('kabul_tarihi', { ascending: false })
      .then(({ data }) => { setItems((data as unknown as GoodsReceipt[]) ?? []); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Mal kabul listesi</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">GR02</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-2">GR no</th><th className="px-4 py-2">PO</th><th className="px-4 py-2">Tedarikçi</th><th className="px-4 py-2">Tarih</th><th className="px-4 py-2">Durum</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Henüz mal kabul yok.</td></tr>}
            {items.map((gr) => (
              <tr key={gr.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-bt-navy-700">{gr.gr_no}</td>
                <td className="px-4 py-2">{gr.purchase_orders?.po_no}</td>
                <td className="px-4 py-2">{gr.purchase_orders?.suppliers?.firma_adi}</td>
                <td className="px-4 py-2">{new Date(gr.kabul_tarihi).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-2"><span className="badge bg-slate-100 text-slate-700">{GR_STATUS_LABELS[gr.durum]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
