import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { TEKLIF_KAYNAGI_LABELS, type Quotation } from '../types'

export function Quotations() {
  const [items, setItems] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('quotations')
      .select('*, suppliers(*), items:quotation_items(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as unknown as Quotation[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-bt-navy-900">Teklif yönetimi</h1>
          <p className="text-sm text-slate-500 font-mono">QT01 / QT02</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/teklifler/karsilastir')} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
            <i className="ti ti-arrows-diff" aria-hidden="true" /> Karşılaştır
          </button>
          <button onClick={() => navigate('/teklifler/yeni')} className="rounded-md bg-bt-navy-800 px-4 py-2 text-sm text-white hover:bg-bt-navy-700">
            <i className="ti ti-plus" aria-hidden="true" /> Yeni teklif
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Teklif no</th>
              <th className="px-4 py-2">Tedarikçi</th>
              <th className="px-4 py-2">Yöntem</th>
              <th className="px-4 py-2">Kalemler</th>
              <th className="px-4 py-2">Toplam</th>
              <th className="px-4 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Henüz teklif yok.</td></tr>}
            {items.map((q) => {
              const toplam = (q.items ?? []).reduce((sum, i) => sum + i.miktar * i.birim_fiyat, 0)
              return (
                <tr key={q.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs text-bt-navy-700">{q.qt_no}</td>
                  <td className="px-4 py-2">{q.suppliers?.firma_adi ?? '—'}</td>
                  <td className="px-4 py-2">{TEKLIF_KAYNAGI_LABELS[q.teklif_kaynagi]}</td>
                  <td className="px-4 py-2 text-slate-500">{(q.items ?? []).length} kalem</td>
                  <td className="px-4 py-2">{toplam.toLocaleString('tr-TR')} TL</td>
                  <td className="px-4 py-2">
                    {q.secilen ? (
                      <span className="badge bg-green-50 text-green-700">Seçildi</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-600">Değerlendiriliyor</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
