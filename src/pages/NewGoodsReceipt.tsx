import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { PurchaseOrder } from '../types'

export function NewGoodsReceipt() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [poId, setPoId] = useState('')
  const [gelenMiktar, setGelenMiktar] = useState<Record<string, number>>({})
  const [hasarli, setHasarli] = useState<Record<string, number>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('purchase_orders')
      .select('*, suppliers(*), items:purchase_order_items(*)')
      .in('durum', ['onaylandi', 'tedarikciye_gonderildi', 'sevkiyatta', 'kismi_teslimat'])
      .then(({ data }) => setPos((data as unknown as PurchaseOrder[]) ?? []))
  }, [])

  const selectedPo = pos.find((p) => p.id === poId)

  async function handleSubmit() {
    if (!selectedPo || !profile) return
    setSaving(true)

    const anyEksik = (selectedPo.items ?? []).some(
      (item) => (gelenMiktar[item.id] ?? item.miktar) < item.miktar
    )

    const { data: gr } = await supabase
      .from('goods_receipts')
      .insert({
        po_id: selectedPo.id,
        kabul_eden: profile.id,
        durum: anyEksik ? 'kismi_kabul' : 'tam_kabul',
        miktar_uygun: !anyEksik,
        urun_uygun: true,
        fiziksel_durum_uygun: true,
        teknik_ozellik_uygun: true,
      })
      .select()
      .single()

    if (gr) {
      await supabase.from('goods_receipt_items').insert(
        (selectedPo.items ?? []).map((item) => ({
          gr_id: gr.id,
          po_item_id: item.id,
          beklenen_miktar: item.miktar,
          gelen_miktar: gelenMiktar[item.id] ?? item.miktar,
          hasarli_miktar: hasarli[item.id] ?? 0,
        }))
      )
      // durumu tekrar update ederek stok trigger'ını tetikle (insert sonrası ayrı update gerekiyor)
      await supabase.from('goods_receipts').update({ durum: anyEksik ? 'kismi_kabul' : 'tam_kabul' }).eq('id', gr.id)
    }
    setSaving(false)
    navigate('/mal-kabul')
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Mal kabul</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">GR01</p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <label className="mb-1 block text-sm font-medium text-slate-700">Bekleyen PO seç</label>
        <select value={poId} onChange={(e) => setPoId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
          <option value="">Seçiniz</option>
          {pos.map((p) => (
            <option key={p.id} value={p.id}>{p.po_no} — {p.suppliers?.firma_adi}</option>
          ))}
        </select>
      </div>

      {selectedPo && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Kalemler</h2>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr><th className="py-1">Ürün</th><th className="py-1">Beklenen</th><th className="py-1">Gelen</th><th className="py-1">Hasarlı</th></tr>
            </thead>
            <tbody>
              {(selectedPo.items ?? []).map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="py-2">{item.aciklama}</td>
                  <td className="py-2">{item.miktar}</td>
                  <td className="py-2">
                    <input
                      type="number"
                      defaultValue={item.miktar}
                      onChange={(e) => setGelenMiktar((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-2">
                    <input
                      type="number"
                      defaultValue={0}
                      onChange={(e) => setHasarli((prev) => ({ ...prev, [item.id]: Number(e.target.value) }))}
                      className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex gap-4 text-sm text-slate-600">
            <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Miktar uygun</label>
            <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Fiziksel durum uygun</label>
            <label className="flex items-center gap-1"><input type="checkbox" defaultChecked /> Teknik özellik uygun</label>
          </div>
        </div>
      )}

      <button onClick={handleSubmit} disabled={!selectedPo || saving} className="rounded-md bg-bt-navy-800 px-5 py-2 text-sm font-medium text-white hover:bg-bt-navy-700 disabled:opacity-60">
        {saving ? 'Kaydediliyor…' : 'Kabul et'}
      </button>
    </div>
  )
}
