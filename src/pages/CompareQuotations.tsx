import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Quotation } from '../types'

export function CompareQuotations() {
  const [items, setItems] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState<Record<string, string>>({})
  const { profile } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('quotations')
      .select('*, suppliers(*), items:quotation_items(*)')
      .eq('secilen', false)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setItems((data as unknown as Quotation[]) ?? [])
        setLoading(false)
      })
  }, [])

  function toplam(q: Quotation) {
    return (q.items ?? []).reduce((sum, i) => sum + i.miktar * i.birim_fiyat, 0)
  }

  async function selectSupplier(q: Quotation) {
    await supabase
      .from('quotations')
      .update({ secilen: true, degerlendirme_notu: note[q.id] ?? null })
      .eq('id', q.id)

    if (profile) {
      // Basit PO taslağı oluştur — dokümandaki "kazanan teklif seçildiyse PO'da bilgiler otomatik gelmeli" kuralı
      const { data: po } = await supabase
        .from('purchase_orders')
        .insert({
          quotation_id: q.id,
          supplier_id: q.supplier_id,
          odeme_sekli: q.odeme_kosulu,
          created_by: profile.id,
          durum: 'taslak',
          genel_toplam: toplam(q) * 1.2,
          ara_toplam: toplam(q),
          kdv: toplam(q) * 0.2,
        })
        .select()
        .single()

      if (po) {
        const itemsToInsert = (q.items ?? []).map((i) => ({
          po_id: po.id,
          aciklama: i.urun_aciklama,
          miktar: i.miktar,
          birim_fiyat: i.birim_fiyat,
          kdv_orani: i.kdv_orani,
        }))
        await supabase.from('purchase_order_items').insert(itemsToInsert)
      }
    }
    navigate('/siparisler')
  }

  if (loading) return <p className="text-sm text-slate-400">Yükleniyor…</p>

  // Ürün açıklamasına göre grupla
  const productNames = Array.from(new Set(items.flatMap((q) => (q.items ?? []).map((i) => i.urun_aciklama))))

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Teklif karşılaştırma</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">QT02</p>

      {productNames.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-2">Ürün</th>
                {items.map((q) => (
                  <th key={q.id} className="px-4 py-2">{q.suppliers?.firma_adi}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productNames.map((name) => (
                <tr key={name} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-medium">{name}</td>
                  {items.map((q) => {
                    const item = (q.items ?? []).find((i) => i.urun_aciklama === name)
                    return (
                      <td key={q.id} className="px-4 py-2">
                        {item ? `${item.birim_fiyat.toLocaleString('tr-TR')} TL` : '—'}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {items.map((q) => (
          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="font-semibold text-bt-navy-900">{q.suppliers?.firma_adi}</p>
            <p className="mt-1 text-sm text-slate-500">Toplam: {toplam(q).toLocaleString('tr-TR')} TL</p>
            <p className="text-sm text-slate-500">Teslim süresi: {q.teslim_suresi_gun ?? '—'} gün</p>
            <p className="text-sm text-slate-500">Ödeme: {q.odeme_kosulu ?? '—'}</p>
            <textarea
              value={note[q.id] ?? ''}
              onChange={(e) => setNote((prev) => ({ ...prev, [q.id]: e.target.value }))}
              placeholder="Değerlendirme notu (örn. teslim süresi, geçmiş performans)"
              rows={2}
              className="mt-3 w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            />
            <button
              onClick={() => selectSupplier(q)}
              className="mt-3 w-full rounded-md bg-bt-navy-800 py-1.5 text-sm text-white hover:bg-bt-navy-700"
            >
              Bu tedarikçiyi seç → PO oluştur
            </button>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-slate-400">Karşılaştırılacak teklif yok.</p>}
      </div>
    </div>
  )
}
