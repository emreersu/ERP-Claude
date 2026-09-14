import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { PO_STATUS_LABELS, type PurchaseOrder } from '../types'

export function PurchaseOrders() {
  const [items, setItems] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const navigate = useNavigate()
  const canApprove = profile?.rol === 'yonetici' || profile?.rol === 'satin_alma'

  async function load() {
    const { data } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(*), items:purchase_order_items(*)')
      .order('created_at', { ascending: false })
    setItems((data as unknown as PurchaseOrder[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(id: string) {
    await supabase.from('purchase_orders').update({
      durum: 'onaylandi',
      onaylayan: profile?.id,
      onay_tarihi: new Date().toISOString(),
    }).eq('id', id)
    load()
  }

  async function reject(id: string) {
    const reason = prompt('Red açıklaması:')
    if (reason === null) return
    await supabase.from('purchase_orders').update({ durum: 'iptal', red_aciklamasi: reason }).eq('id', id)
    load()
  }

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Satın alma siparişleri</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">PO02</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">PO no</th>
              <th className="px-4 py-2">Tedarikçi</th>
              <th className="px-4 py-2">Tarih</th>
              <th className="px-4 py-2">Toplam</th>
              <th className="px-4 py-2">Durum</th>
              <th className="px-4 py-2"></th>
              {canApprove && <th className="px-4 py-2">Onay</th>}
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Henüz PO yok. Bir teklifi karşılaştırma ekranından seçerek oluşturabilirsiniz.</td></tr>}
            {items.map((po) => (
              <tr key={po.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs text-bt-navy-700">{po.po_no}</td>
                <td className="px-4 py-2">{po.suppliers?.firma_adi ?? '—'}</td>
                <td className="px-4 py-2">{new Date(po.siparis_tarihi).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-2">{po.genel_toplam.toLocaleString('tr-TR')} TL</td>
                <td className="px-4 py-2"><span className="badge bg-slate-100 text-slate-700">{PO_STATUS_LABELS[po.durum]}</span></td>
                <td className="px-4 py-2">
                  <button onClick={() => navigate(`/siparisler/${po.id}`)} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200">
                    Detay / Kargo
                  </button>
                </td>
                {canApprove && (
                  <td className="px-4 py-2">
                    {po.durum === 'onay_bekliyor' || po.durum === 'taslak' ? (
                      <div className="flex gap-1">
                        <button onClick={() => approve(po.id)} className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100">Onayla</button>
                        <button onClick={() => reject(po.id)} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100">Reddet</button>
                      </div>
                    ) : '—'}
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
