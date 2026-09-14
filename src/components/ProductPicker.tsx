import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface PickedProduct {
  id: string
  urun_kodu: string
  urun_adi: string
}

interface Props {
  value: PickedProduct | null
  onChange: (product: PickedProduct) => void
}

/**
 * Gerçek SAP MM'deki "F4 Help" (malzeme arama yardımı) mantığının basitleştirilmiş hali.
 * Kullanıcı isimden arar, eşleşen ürün kartlarından birini seçer. Eşleşme yoksa
 * bilinçli bir adımla yeni ürün kartı (MM01) oluşturabilir — hiçbir şey sessizce
 * otomatik oluşturulmaz.
 */
export function ProductPicker({ value, onChange }: Props) {
  const [query, setQuery] = useState(value?.urun_adi ?? '')
  const [results, setResults] = useState<PickedProduct[]>([])
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newKod, setNewKod] = useState('')
  const [newAd, setNewAd] = useState('')
  const [creating, setCreating] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }
    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, urun_kodu, urun_adi')
        .or(`urun_adi.ilike.%${query}%,urun_kodu.ilike.%${query}%`)
        .eq('aktif', true)
        .limit(8)
      setResults((data as PickedProduct[]) ?? [])
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

  function selectProduct(p: PickedProduct) {
    onChange(p)
    setQuery(p.urun_adi)
    setOpen(false)
    setShowCreate(false)
  }

  async function createProduct() {
    if (!newKod.trim() || !newAd.trim()) return
    setCreating(true)
    const { data: unit } = await supabase.from('units').select('id').eq('kod', 'adet').maybeSingle()
    const { data, error } = await supabase
      .from('products')
      .insert({ urun_kodu: newKod.trim(), urun_adi: newAd.trim(), unit_id: unit?.id ?? null, mevcut_stok: 0, minimum_stok: 0 })
      .select('id, urun_kodu, urun_adi')
      .single()
    setCreating(false)
    if (error || !data) {
      alert('Ürün kartı oluşturulamadı: ' + (error?.message ?? 'bilinmeyen hata'))
      return
    }
    selectProduct(data as PickedProduct)
  }

  return (
    <div ref={boxRef} className="relative flex-1">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setShowCreate(false)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Ürün adı veya kodu ara (en az 2 karakter)"
        className={`w-full rounded-md border px-3 py-2 text-sm ${value ? 'border-green-300 bg-green-50/40' : 'border-slate-300'}`}
      />
      {value && (
        <span className="absolute right-2 top-2.5 font-mono text-[10px] text-green-700">{value.urun_kodu}</span>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          {results.length > 0 &&
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectProduct(p)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{p.urun_kodu}</span>
                <span>{p.urun_adi}</span>
              </button>
            ))}

          {query.trim().length >= 2 && results.length === 0 && !showCreate && (
            <div className="px-3 py-3 text-sm">
              <p className="mb-2 text-slate-500">"{query}" ile eşleşen ürün kartı bulunamadı.</p>
              <button
                type="button"
                onClick={() => {
                  setShowCreate(true)
                  setNewAd(query)
                }}
                className="rounded-md bg-bt-navy-800 px-3 py-1.5 text-xs text-white hover:bg-bt-navy-700"
              >
                + Yeni ürün kartı oluştur (MM01)
              </button>
            </div>
          )}

          {showCreate && (
            <div className="border-t border-slate-100 p-3">
              <label className="mb-1 block text-xs font-medium text-slate-700">Ürün kodu</label>
              <input
                value={newKod}
                onChange={(e) => setNewKod(e.target.value.toUpperCase())}
                placeholder="örn. ELEK-004"
                className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs font-mono"
              />
              <label className="mb-1 block text-xs font-medium text-slate-700">Ürün adı</label>
              <input
                value={newAd}
                onChange={(e) => setNewAd(e.target.value)}
                className="mb-2 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
              />
              <button
                type="button"
                onClick={createProduct}
                disabled={creating || !newKod.trim() || !newAd.trim()}
                className="w-full rounded-md bg-bt-navy-800 py-1.5 text-xs text-white hover:bg-bt-navy-700 disabled:opacity-50"
              >
                {creating ? 'Oluşturuluyor…' : 'Ürün kartını oluştur ve seç'}
              </button>
            </div>
          )}

          {query.trim().length < 2 && (
            <p className="px-3 py-3 text-xs text-slate-400">Aramak için en az 2 karakter yazın.</p>
          )}
        </div>
      )}
    </div>
  )
}
