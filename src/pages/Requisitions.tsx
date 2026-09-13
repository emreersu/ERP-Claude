import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PR_STATUS_LABELS, type PurchaseRequisition } from '../types'

export function Requisitions() {
  const [items, setItems] = useState<PurchaseRequisition[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('purchase_requisitions')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as PurchaseRequisition[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-bt-navy-900">Satın alma talepleri</h1>
          <p className="text-sm text-slate-500 font-mono">PR02</p>
        </div>
        <button
          onClick={() => navigate('/talepler/yeni')}
          className="rounded-md bg-bt-navy-800 px-4 py-2 text-sm text-white hover:bg-bt-navy-700"
        >
          <i className="ti ti-plus" aria-hidden="true" /> Yeni talep (PR01)
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Talep no</th>
              <th className="px-4 py-2">Açıklama</th>
              <th className="px-4 py-2">Öncelik</th>
              <th className="px-4 py-2">Tarih</th>
              <th className="px-4 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Henüz talep yok.
                </td>
              </tr>
            )}
            {items.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-bt-navy-700">{t.pr_no}</td>
                <td className="px-4 py-2">{t.aciklama ?? '—'}</td>
                <td className="px-4 py-2 capitalize">{t.oncelik}</td>
                <td className="px-4 py-2">{new Date(t.talep_tarihi).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-2">
                  <span className="badge bg-slate-100 text-slate-700">{PR_STATUS_LABELS[t.durum]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
