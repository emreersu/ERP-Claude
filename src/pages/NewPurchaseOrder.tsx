import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Supplier } from '../types'

interface Kalem { aciklama: string; miktar: number; birim_fiyat: number }

export function NewPurchaseOrder() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [siparisYontemi, setSiparisYontemi] = useState('sistem')
  const [odemeVadesi, setOdemeVadesi] = useState('')
  const [kalemler, setKalemler] = useState<Kalem[]>([{ aciklama: '', miktar: 1, birim_fiyat: 0 }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('suppliers').select('*').eq('aktif', true).order('firma_adi').then(({ data }) => setSuppliers((data as Supplier[]) ?? []))
  }, [])

  function updateKalem(i: number, patch: Partial<Kalem>) {
    setKalemler((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)))
  }

  const araToplam = kalemler.reduce((s, k) => s + k.miktar * k.birim_fiyat, 0)
  const kdv = araToplam * 0.2
  const genelToplam = araToplam + kdv

  async function handleSubmit() {
    if (!profile || !supplierId) return
    setSaving(true)
    const { data: po } = await supabase.from('purchase_orders').insert({
      supplier_id: supplierId,
      siparis_yontemi: siparisYontemi,
      odeme_vadesi: odemeVadesi || null,
      ara_toplam: araToplam,
      kdv,
      genel_toplam: genelToplam,
      durum: 'onay_bekliyor',
      created_by: profile.id,
    }).select().single()

    if (po) {
      await supabase.from('purchase_order_items').insert(
        kalemler.filter((k) => k.aciklama.trim()).map((k) => ({
          po_id: po.id, aciklama: k.aciklama, miktar: k.miktar, birim_fiyat: k.birim_fiyat,
        }))
      )
    }
    setSaving(false)
    navigate('/siparisler')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Yeni satın alma siparişi</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">PO01</p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tedarikçi</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Seçiniz</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.firma_adi}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Sipariş yöntemi</label>
            <select value={siparisYontemi} onChange={(e) => setSiparisYontemi(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="sistem">Sistem üzerinden</option>
              <option value="telefon">Telefon</option>
              <option value="eposta">E-posta</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ödeme vadesi</label>
            <input value={odemeVadesi} onChange={(e) => setOdemeVadesi(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="örn. 30 gün" />
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Kalemler</h2>
        {kalemler.map((k, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input value={k.aciklama} onChange={(e) => updateKalem(i, { aciklama: e.target.value })} placeholder="Ürün açıklaması" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" min={1} value={k.miktar} onChange={(e) => updateKalem(i, { miktar: Number(e.target.value) })} className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" value={k.birim_fiyat} onChange={(e) => updateKalem(i, { birim_fiyat: Number(e.target.value) })} className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Birim fiyat" />
          </div>
        ))}
        <button onClick={() => setKalemler((p) => [...p, { aciklama: '', miktar: 1, birim_fiyat: 0 }])} className="mt-1 text-sm text-bt-navy-700 hover:underline">
          <i className="ti ti-plus" aria-hidden="true" /> Kalem ekle
        </button>

        <div className="mt-4 border-t border-slate-100 pt-3 text-right text-sm">
          <p>Ara toplam: {araToplam.toLocaleString('tr-TR')} TL</p>
          <p>KDV (%20): {kdv.toLocaleString('tr-TR')} TL</p>
          <p className="font-semibold text-bt-navy-900">Genel toplam: {genelToplam.toLocaleString('tr-TR')} TL</p>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={saving || !supplierId} className="rounded-md bg-bt-navy-800 px-5 py-2 text-sm font-medium text-white hover:bg-bt-navy-700 disabled:opacity-60">
        {saving ? 'Kaydediliyor…' : 'PO oluştur (onaya gönder)'}
      </button>
    </div>
  )
}
