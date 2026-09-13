import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { StockMovement } from '../types'

export function StockMovements() {
  const [items, setItems] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('stock_movements').select('*, products(*)').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => { setItems((data as unknown as StockMovement[]) ?? []); setLoading(false) })
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Stok hareketleri</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">ST02</p>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-2">Tarih</th><th className="px-4 py-2">Ürün</th><th className="px-4 py-2">Tip</th><th className="px-4 py-2">Miktar</th><th className="px-4 py-2">Açıklama</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">Hareket yok.</td></tr>}
            {items.map((m) => (
              <tr key={m.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{new Date(m.created_at).toLocaleString('tr-TR')}</td>
                <td className="px-4 py-2">{m.products?.urun_adi}</td>
                <td className="px-4 py-2"><span className={`badge ${m.hareket_tipi === 'giris' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{m.hareket_tipi === 'giris' ? 'Giriş' : 'Çıkış'}</span></td>
                <td className="px-4 py-2">{m.miktar}</td>
                <td className="px-4 py-2 text-slate-500">{m.aciklama}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
