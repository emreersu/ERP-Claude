import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Supplier } from '../types'

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    supabase
      .from('suppliers')
      .select('*')
      .order('firma_adi')
      .then(({ data }) => {
        setSuppliers((data as Supplier[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-bt-navy-900">Tedarikçiler</h1>
          <p className="text-sm text-slate-500">
            <span className="font-mono">SUP01</span> ile yeni tedarikçi ekleyebilirsiniz
          </p>
        </div>
        <button
          onClick={() => navigate('/tedarikciler/yeni')}
          className="rounded-md bg-bt-navy-800 px-4 py-2 text-sm text-white hover:bg-bt-navy-700"
        >
          <i className="ti ti-plus" aria-hidden="true" /> Yeni tedarikçi
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Firma</th>
              <th className="px-4 py-2">Yetkili</th>
              <th className="px-4 py-2">Kategori</th>
              <th className="px-4 py-2">Ödeme koşulu</th>
              <th className="px-4 py-2">Performans</th>
              <th className="px-4 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Yükleniyor…
                </td>
              </tr>
            )}
            {!loading && suppliers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Kayıtlı tedarikçi yok.
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-bt-navy-900">{s.firma_adi}</td>
                <td className="px-4 py-2">{s.yetkili ?? '—'}</td>
                <td className="px-4 py-2">{s.kategori ?? '—'}</td>
                <td className="px-4 py-2">{s.odeme_kosulu ?? '—'}</td>
                <td className="px-4 py-2">{s.performans_puani ?? 0}/100</td>
                <td className="px-4 py-2">
                  <span
                    className={`badge ${
                      s.aktif ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {s.aktif ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
