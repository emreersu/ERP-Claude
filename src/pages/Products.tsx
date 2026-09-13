import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('products').select('*').order('urun_kodu').then(({ data }) => {
      setItems((data as Product[]) ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Ürün / malzeme kütüğü</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">MM01</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-2">Kod</th><th className="px-4 py-2">Ürün adı</th><th className="px-4 py-2">Mevcut stok</th><th className="px-4 py-2">Durum</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {items.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{p.urun_kodu}</td>
                <td className="px-4 py-2">{p.urun_adi}</td>
                <td className="px-4 py-2">{p.mevcut_stok}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${p.aktif ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{p.aktif ? 'Aktif' : 'Pasif'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
