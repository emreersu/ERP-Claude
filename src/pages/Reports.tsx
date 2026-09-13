import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import type { PurchaseOrder } from '../types'

export function Reports() {
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('purchase_orders').select('*, suppliers(*), items:purchase_order_items(*)').then(({ data }) => {
      setPos((data as unknown as PurchaseOrder[]) ?? [])
      setLoading(false)
    })
  }, [])

  const tedarikciBazli = Object.values(
    pos.reduce((acc, po) => {
      const ad = po.suppliers?.firma_adi ?? 'Bilinmiyor'
      acc[ad] = acc[ad] || { ad, toplam: 0 }
      acc[ad].toplam += po.genel_toplam
      return acc
    }, {} as Record<string, { ad: string; toplam: number }>)
  )

  function exportExcel() {
    const rows = pos.map((po) => ({
      'PO No': po.po_no,
      Tedarikçi: po.suppliers?.firma_adi ?? '',
      Tarih: po.siparis_tarihi,
      'Genel Toplam': po.genel_toplam,
      Durum: po.durum,
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'PO Raporu')
    XLSX.writeFile(wb, 'baytech-satinalma-raporu.xlsx')
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-bt-navy-900">Satın alma raporları</h1>
          <p className="text-sm text-slate-500 font-mono">REP01</p>
        </div>
        <button onClick={exportExcel} className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
          <i className="ti ti-file-spreadsheet" aria-hidden="true" /> Excel'e aktar
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Yükleniyor…</p>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Tedarikçi bazında satın alma</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tedarikciBazli}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ad" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v) => `${Number(v).toLocaleString('tr-TR')} TL`} />
              <Bar dataKey="toplam" fill="#163166" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
