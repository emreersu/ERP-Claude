import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ProductPicker, type PickedProduct } from '../components/ProductPicker'
import type { PriorityLevel } from '../types'

interface Kalem {
  product: PickedProduct | null
  miktar: number
  tahmini_fiyat?: number
}

export function NewRequisition() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [aciklama, setAciklama] = useState('')
  const [ihtiyacTarihi, setIhtiyacTarihi] = useState('')
  const [oncelik, setOncelik] = useState<PriorityLevel>('normal')
  const [kalemler, setKalemler] = useState<Kalem[]>([{ product: null, miktar: 1 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateKalem(i: number, patch: Partial<Kalem>) {
    setKalemler((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)))
  }

  function addKalem() {
    setKalemler((prev) => [...prev, { product: null, miktar: 1 }])
  }

  function removeKalem(i: number) {
    setKalemler((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (!profile) return
    const gecerliKalemler = kalemler.filter((k) => k.product)
    if (gecerliKalemler.length === 0) {
      setError('En az bir kalem için ürün seçilmelidir.')
      return
    }
    setSaving(true)
    setError(null)

    const { data: pr, error: prError } = await supabase
      .from('purchase_requisitions')
      .insert({
        talep_eden: profile.id,
        ihtiyac_tarihi: ihtiyacTarihi || null,
        oncelik,
        aciklama,
        durum: 'onay_bekliyor',
      })
      .select()
      .single()

    if (prError || !pr) {
      setError('Talep oluşturulamadı: ' + prError?.message)
      setSaving(false)
      return
    }

    const { error: itemError } = await supabase.from('purchase_requisition_items').insert(
      gecerliKalemler.map((k) => ({
        pr_id: pr.id,
        product_id: k.product!.id,
        urun_kodu: k.product!.urun_kodu,
        aciklama: k.product!.urun_adi,
        miktar: k.miktar,
        tahmini_fiyat: k.tahmini_fiyat ?? null,
      }))
    )

    setSaving(false)
    if (itemError) {
      setError('Kalemler kaydedilemedi: ' + itemError.message)
      return
    }
    navigate('/talepler')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Yeni satın alma talebi</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">PR01</p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">İhtiyaç tarihi</label>
            <input
              type="date"
              value={ihtiyacTarihi}
              onChange={(e) => setIhtiyacTarihi(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Öncelik</label>
            <select
              value={oncelik}
              onChange={(e) => setOncelik(e.target.value as PriorityLevel)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="dusuk">Düşük</option>
              <option value="normal">Normal</option>
              <option value="yuksek">Yüksek</option>
              <option value="acil">Acil</option>
            </select>
          </div>
        </div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Açıklama</label>
        <textarea
          value={aciklama}
          onChange={(e) => setAciklama(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Talebin genel açıklaması"
        />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 text-sm font-semibold text-bt-navy-900">Kalemler</h2>
        <p className="mb-3 text-xs text-slate-400">Malzeme kütüğünden ürün seç — SAP'de olduğu gibi serbest metin girilmez.</p>
        {kalemler.map((k, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <ProductPicker value={k.product} onChange={(p) => updateKalem(i, { product: p })} />
            <input
              type="number"
              min={1}
              value={k.miktar}
              onChange={(e) => updateKalem(i, { miktar: Number(e.target.value) })}
              className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Tahmini fiyat"
              value={k.tahmini_fiyat ?? ''}
              onChange={(e) => updateKalem(i, { tahmini_fiyat: Number(e.target.value) })}
              className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <button onClick={() => removeKalem(i)} className="px-2 text-slate-400 hover:text-red-600">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button onClick={addKalem} className="mt-1 text-sm text-bt-navy-700 hover:underline">
          <i className="ti ti-plus" aria-hidden="true" /> Kalem ekle
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="rounded-md bg-bt-navy-800 px-5 py-2 text-sm font-medium text-white hover:bg-bt-navy-700 disabled:opacity-60"
      >
        {saving ? 'Kaydediliyor…' : 'Talebi oluştur'}
      </button>
    </div>
  )
}
