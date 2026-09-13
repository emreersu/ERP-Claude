import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ODEME_DURUMU_LABELS, type Invoice } from '../types'

export function Payments() {
  const [items, setItems] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('invoices').select('*, suppliers(*), purchase_orders(*)').order('vade_tarihi', { ascending: true })
      .then(({ data }) => { setItems((data as unknown as Invoice[]) ?? []); setLoading(false) })
  }, [])

  const bugun = new Date()

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Ödeme takibi</h1>
      <p className="mb-6 text-sm text-slate-500">Vade tarihine göre sıralı</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-2">Fatura no</th><th className="px-4 py-2">Tedarikçi</th><th className="px-4 py-2">Tutar</th><th className="px-4 py-2">Vade</th><th className="px-4 py-2">Durum</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {items.map((inv) => {
              const gecikti = inv.vade_tarihi && new Date(inv.vade_tarihi) < bugun && inv.odeme_durumu !== 'odendi'
              const yaklasiyor =
                inv.vade_tarihi &&
                !gecikti &&
                (new Date(inv.vade_tarihi).getTime() - bugun.getTime()) / 86400000 <= 3
              return (
                <tr key={inv.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono text-xs">{inv.fatura_no}</td>
                  <td className="px-4 py-2">{inv.suppliers?.firma_adi}</td>
                  <td className="px-4 py-2">{inv.genel_toplam.toLocaleString('tr-TR')} TL</td>
                  <td className="px-4 py-2">
                    {inv.vade_tarihi ? new Date(inv.vade_tarihi).toLocaleDateString('tr-TR') : '—'}
                    {gecikti && <span className="ml-2 badge bg-red-50 text-red-700">Gecikti</span>}
                    {yaklasiyor && <span className="ml-2 badge bg-amber-50 text-amber-700">Yaklaşıyor</span>}
                  </td>
                  <td className="px-4 py-2"><span className="badge bg-slate-100 text-slate-700">{ODEME_DURUMU_LABELS[inv.odeme_durumu]}</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
