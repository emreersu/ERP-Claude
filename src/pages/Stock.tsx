import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export function Stock() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [kod, setKod] = useState('')
  const [ad, setAd] = useState('')
  const [mevcutStok, setMevcutStok] = useState<number>(0)
  const [minStok, setMinStok] = useState<number>(0)
  const [kritikStok, setKritikStok] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data } = await supabase.from('products').select('*').order('urun_kodu')
    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function createProduct() {
    if (!kod.trim() || !ad.trim()) {
      setError('Ürün kodu ve adı zorunludur.')
      return
    }
    setSaving(true)
    setError(null)
    const { data: unit } = await supabase.from('units').select('id').eq('kod', 'adet').maybeSingle()
    const { error: insertError } = await supabase.from('products').insert({
      urun_kodu: kod.trim().toUpperCase(),
      urun_adi: ad.trim(),
      unit_id: unit?.id ?? null,
      mevcut_stok: mevcutStok,
      minimum_stok: minStok,
      kritik_stok_seviyesi: kritikStok || null,
    })
    setSaving(false)
    if (insertError) {
      setError('Oluşturulamadı: ' + insertError.message)
      return
    }
    setKod(''); setAd(''); setMevcutStok(0); setMinStok(0); setKritikStok(0)
    setShowNew(false)
    load()
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-bt-navy-900">Stok kartları</h1>
          <p className="text-sm text-slate-500 font-mono">ST01 / MM01</p>
        </div>
        <button onClick={() => setShowNew((s) => !s)} className="rounded-md bg-bt-navy-800 px-4 py-2 text-sm text-white hover:bg-bt-navy-700">
          <i className="ti ti-plus" aria-hidden="true" /> Yeni ürün kartı (MM01)
        </button>
      </div>

      {showNew && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Yeni ürün / malzeme kartı</h2>
          <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Ürün kodu</label>
              <input value={kod} onChange={(e) => setKod(e.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-mono" placeholder="örn. ELEK-005" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Ürün adı</label>
              <input value={ad} onChange={(e) => setAd(e.target.value)} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Başlangıç stoğu</label>
              <input type="number" value={mevcutStok} onChange={(e) => setMevcutStok(Number(e.target.value))} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Minimum stok</label>
              <input type="number" value={minStok} onChange={(e) => setMinStok(Number(e.target.value))} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
            </div>
          </div>
          {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
          <button onClick={createProduct} disabled={saving} className="rounded-md bg-bt-navy-800 px-4 py-1.5 text-sm text-white hover:bg-bt-navy-700 disabled:opacity-60">
            {saving ? 'Oluşturuluyor…' : 'Kartı oluştur'}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-2">Kod</th><th className="px-4 py-2">Ürün</th><th className="px-4 py-2">Mevcut</th><th className="px-4 py-2">Minimum</th><th className="px-4 py-2">Durum</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {!loading && products.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Henüz ürün kartı yok.</td></tr>}
            {products.map((p) => {
              const kritik = p.kritik_stok_seviyesi != null && p.mevcut_stok <= p.kritik_stok_seviyesi
              return (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-2 font-mono text-xs">{p.urun_kodu}</td>
                  <td className="px-4 py-2">{p.urun_adi}</td>
                  <td className="px-4 py-2 font-medium">{p.mevcut_stok}</td>
                  <td className="px-4 py-2 text-slate-500">{p.minimum_stok}</td>
                  <td className="px-4 py-2">
                    <span className={`badge ${kritik ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {kritik ? 'Kritik' : 'Normal'}
                    </span>
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
