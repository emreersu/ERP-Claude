import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Supplier, TeklifKaynagi } from '../types'
import { TEKLIF_KAYNAGI_LABELS } from '../types'

interface Kalem {
  urun_aciklama: string
  miktar: number
  birim_fiyat: number
}

export function NewQuotation() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [kaynak, setKaynak] = useState<TeklifKaynagi>('telefon')
  const [yetkili, setYetkili] = useState('')
  const [odemeKosulu, setOdemeKosulu] = useState('')
  const [teslimSuresi, setTeslimSuresi] = useState<number | ''>('')
  const [notMetni, setNotMetni] = useState('')
  const [kalemler, setKalemler] = useState<Kalem[]>([{ urun_aciklama: '', miktar: 1, birim_fiyat: 0 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('suppliers').select('*').eq('aktif', true).order('firma_adi').then(({ data }) => {
      setSuppliers((data as Supplier[]) ?? [])
    })
  }, [])

  function updateKalem(i: number, patch: Partial<Kalem>) {
    setKalemler((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)))
  }
  function addKalem() {
    setKalemler((prev) => [...prev, { urun_aciklama: '', miktar: 1, birim_fiyat: 0 }])
  }
  function removeKalem(i: number) {
    setKalemler((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (!profile || !supplierId) {
      setError('Tedarikçi seçilmelidir.')
      return
    }
    const gecerli = kalemler.filter((k) => k.urun_aciklama.trim())
    if (gecerli.length === 0) {
      setError('En az bir kalem girilmelidir.')
      return
    }
    setSaving(true)
    setError(null)

    const { data: qt, error: qtError } = await supabase
      .from('quotations')
      .insert({
        supplier_id: supplierId,
        teklif_kaynagi: kaynak,
        yetkili_kisi: yetkili || null,
        odeme_kosulu: odemeKosulu || null,
        teslim_suresi_gun: teslimSuresi || null,
        not_metni: notMetni || null,
        created_by: profile.id,
      })
      .select()
      .single()

    if (qtError || !qt) {
      setError('Teklif kaydedilemedi: ' + qtError?.message)
      setSaving(false)
      return
    }

    const { error: itemError } = await supabase.from('quotation_items').insert(
      gecerli.map((k) => ({
        quotation_id: qt.id,
        urun_aciklama: k.urun_aciklama,
        miktar: k.miktar,
        birim_fiyat: k.birim_fiyat,
      }))
    )

    setSaving(false)
    if (itemError) {
      setError('Kalemler kaydedilemedi: ' + itemError.message)
      return
    }
    navigate('/teklifler')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Teklif gir</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">QT01</p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tedarikçi</label>
            <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Seçiniz</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.firma_adi}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Teklif yöntemi</label>
            <select value={kaynak} onChange={(e) => setKaynak(e.target.value as TeklifKaynagi)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
              {Object.entries(TEKLIF_KAYNAGI_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Yetkili kişi</label>
            <input value={yetkili} onChange={(e) => setYetkili(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="örn. Hasan" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Ödeme koşulu</label>
            <input value={odemeKosulu} onChange={(e) => setOdemeKosulu(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="örn. 30 gün" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Teslim süresi (gün)</label>
            <input type="number" value={teslimSuresi} onChange={(e) => setTeslimSuresi(e.target.value ? Number(e.target.value) : '')} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Not</label>
        <textarea value={notMetni} onChange={(e) => setNotMetni(e.target.value)} rows={2} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder='örn. "12.09.2026 tarihinde telefon görüşmesiyle 430 TL + KDV fiyat üzerinden anlaşılmıştır."' />
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Kalemler</h2>
        {kalemler.map((k, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input value={k.urun_aciklama} onChange={(e) => updateKalem(i, { urun_aciklama: e.target.value })} placeholder="Ürün açıklaması" className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" min={1} value={k.miktar} onChange={(e) => updateKalem(i, { miktar: Number(e.target.value) })} className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input type="number" placeholder="Birim fiyat" value={k.birim_fiyat} onChange={(e) => updateKalem(i, { birim_fiyat: Number(e.target.value) })} className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button onClick={() => removeKalem(i)} className="px-2 text-slate-400 hover:text-red-600"><i className="ti ti-x" aria-hidden="true" /></button>
          </div>
        ))}
        <button onClick={addKalem} className="mt-1 text-sm text-bt-navy-700 hover:underline"><i className="ti ti-plus" aria-hidden="true" /> Kalem ekle</button>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <button onClick={handleSubmit} disabled={saving} className="rounded-md bg-bt-navy-800 px-5 py-2 text-sm font-medium text-white hover:bg-bt-navy-700 disabled:opacity-60">
        {saving ? 'Kaydediliyor…' : 'Teklifi kaydet'}
      </button>
    </div>
  )
}
