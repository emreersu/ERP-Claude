import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PR_STATUS_LABELS, type PurchaseRequisition } from '../types'

export function Requisitions() {
  const [items, setItems] = useState<PurchaseRequisition[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { profile } = useAuth()

  async function load() {
    const { data } = await supabase
      .from('purchase_requisitions')
      .select('*')
      .order('created_at', { ascending: false })
    setItems((data as PurchaseRequisition[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(id: string) {
    await supabase.from('purchase_requisitions').update({ durum: 'onaylandi' }).eq('id', id)
    load()
  }

  async function reject(id: string) {
    const reason = prompt('Red açıklaması:')
    if (reason === null) return
    await supabase.from('purchase_requisitions').update({ durum: 'reddedildi', red_aciklamasi: reason }).eq('id', id)
    load()
  }

  const canApprove = profile?.rol === 'yonetici' || profile?.rol === 'satin_alma'

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
              {canApprove && <th className="px-4 py-2">Onay</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
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
                {canApprove && (
                  <td className="px-4 py-2">
                    {t.durum === 'onay_bekliyor' ? (
                      <div className="flex gap-1">
                        <button onClick={() => approve(t.id)} className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100">Onayla</button>
                        <button onClick={() => reject(t.id)} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">Reddet</button>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
