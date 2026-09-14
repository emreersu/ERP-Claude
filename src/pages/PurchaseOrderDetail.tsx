import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PO_STATUS_LABELS, type PurchaseOrder } from '../types'

interface Delivery {
  id: string
  teslimat_yontemi: string
  kargo_no: string | null
  teslim_alan: string | null
  planlanan_tarih: string | null
  gerceklesen_tarih: string | null
  not_metni: string | null
}

const TESLIMAT_YONTEMLERI = [
  { value: 'kargo', label: 'Kargo' },
  { value: 'nakliye_firmasi', label: 'Nakliye firması' },
  { value: 'tedarikci_araci', label: 'Tedarikçi aracı' },
  { value: 'sirket_araci', label: 'Şirket aracı' },
  { value: 'elden_teslim', label: 'Elden teslim' },
  { value: 'diger', label: 'Diğer' },
]

export function PurchaseOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [po, setPo] = useState<PurchaseOrder | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)

  const [yontem, setYontem] = useState('kargo')
  const [kargoNo, setKargoNo] = useState('')
  const [teslimAlan, setTeslimAlan] = useState('')
  const [planlananTarih, setPlanlananTarih] = useState('')
  const [notMetni, setNotMetni] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    if (!id) return
    const { data: poData } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(*), items:purchase_order_items(*)')
      .eq('id', id)
      .single()
    setPo(poData as unknown as PurchaseOrder)

    const { data: delData } = await supabase
      .from('deliveries')
      .select('*')
      .eq('po_id', id)
      .order('created_at', { ascending: false })
    setDeliveries((delData as Delivery[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function addDelivery() {
    if (!id) return
    setSaving(true)
    await supabase.from('deliveries').insert({
      po_id: id,
      teslimat_yontemi: yontem,
      kargo_no: kargoNo || null,
      teslim_alan: teslimAlan || null,
      planlanan_tarih: planlananTarih || null,
      not_metni: notMetni || null,
    })
    // Sevkiyat bilgisi girilince PO durumunu "sevkiyatta" yap
    if (po && (po.durum === 'onaylandi' || po.durum === 'tedarikciye_gonderildi')) {
      await supabase.from('purchase_orders').update({ durum: 'sevkiyatta' }).eq('id', id)
    }
    setKargoNo('')
    setTeslimAlan('')
    setPlanlananTarih('')
    setNotMetni('')
    setSaving(false)
    load()
  }

  if (loading) return <p className="text-sm text-slate-400">Yükleniyor…</p>
  if (!po) return <p className="text-sm text-slate-400">PO bulunamadı.</p>

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate('/siparisler')} className="mb-3 text-xs text-slate-500 hover:underline">
        <i className="ti ti-arrow-left" aria-hidden="true" /> Sipariş listesine dön
      </button>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-bt-navy-900">{po.po_no}</h1>
            <p className="text-sm text-slate-500">{po.suppliers?.firma_adi}</p>
          </div>
          <span className="badge bg-slate-100 text-slate-700">{PO_STATUS_LABELS[po.durum]}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
          <p>Sipariş tarihi: {new Date(po.siparis_tarihi).toLocaleDateString('tr-TR')}</p>
          <p>Planlanan teslim: {po.planlanan_teslim_tarihi ? new Date(po.planlanan_teslim_tarihi).toLocaleDateString('tr-TR') : '—'}</p>
          <p>Genel toplam: {po.genel_toplam.toLocaleString('tr-TR')} TL</p>
          <p>Ödeme vadesi: {po.odeme_vadesi ?? '—'}</p>
        </div>
        <table className="mt-4 w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr><th className="py-1">Kalem</th><th className="py-1">Miktar</th><th className="py-1">Birim fiyat</th></tr>
          </thead>
          <tbody>
            {(po.items ?? []).map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="py-1.5">{i.aciklama}</td>
                <td className="py-1.5">{i.miktar}</td>
                <td className="py-1.5">{i.birim_fiyat.toLocaleString('tr-TR')} TL</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Teslimat / kargo bilgisi ekle</h2>
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Teslimat yöntemi</label>
            <select value={yontem} onChange={(e) => setYontem(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {TESLIMAT_YONTEMLERI.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Kargo / takip no <span className="text-slate-400">(opsiyonel)</span></label>
            <input value={kargoNo} onChange={(e) => setKargoNo(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="örn. YK123456789" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Teslim alan</label>
            <input value={teslimAlan} onChange={(e) => setTeslimAlan(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="örn. Emre Ersu" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Planlanan teslim tarihi</label>
            <input type="date" value={planlananTarih} onChange={(e) => setPlanlananTarih(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <label className="mb-1 block text-xs font-medium text-slate-700">Not</label>
        <textarea value={notMetni} onChange={(e) => setNotMetni(e.target.value)} rows={2} className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder='örn. "Tedarikçiden elden teslim alınarak fabrikaya getirildi."' />
        <button onClick={addDelivery} disabled={saving} className="rounded-md bg-bt-navy-800 px-4 py-2 text-sm text-white hover:bg-bt-navy-700 disabled:opacity-60">
          {saving ? 'Kaydediliyor…' : 'Teslimat bilgisini kaydet'}
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Teslimat geçmişi</h2>
        {deliveries.length === 0 ? (
          <p className="text-sm text-slate-400">Henüz teslimat bilgisi girilmedi.</p>
        ) : (
          <div className="space-y-2">
            {deliveries.map((d) => (
              <div key={d.id} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
                <p className="font-medium">{TESLIMAT_YONTEMLERI.find((t) => t.value === d.teslimat_yontemi)?.label}</p>
                {d.kargo_no && <p className="text-xs text-slate-500">Kargo no: <span className="font-mono">{d.kargo_no}</span></p>}
                {d.teslim_alan && <p className="text-xs text-slate-500">Teslim alan: {d.teslim_alan}</p>}
                {d.planlanan_tarih && <p className="text-xs text-slate-500">Planlanan: {new Date(d.planlanan_tarih).toLocaleDateString('tr-TR')}</p>}
                {d.not_metni && <p className="mt-1 text-xs text-slate-600">{d.not_metni}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={() => navigate('/mal-kabul/yeni')} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
        <i className="ti ti-package-import" aria-hidden="true" /> Mal kabule geç
      </button>
    </div>
  )
}
