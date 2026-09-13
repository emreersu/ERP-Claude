import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface LogRow {
  id: string
  islem: string
  ilgili_tablo: string
  created_at: string
  eski_deger: unknown
  yeni_deger: unknown
  profiles?: { ad_soyad: string }
}

export function AuditLog() {
  const [items, setItems] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*, profiles:kullanici_id(ad_soyad)')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setItems((data as unknown as LogRow[]) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">İşlem geçmişi</h1>
      <p className="mb-6 text-sm text-slate-500">Kim, ne zaman, hangi kayıtta ne değiştirdi</p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr><th className="px-4 py-2">Tarih</th><th className="px-4 py-2">Kullanıcı</th><th className="px-4 py-2">Tablo</th><th className="px-4 py-2">İşlem</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Yükleniyor…</td></tr>}
            {!loading && items.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Henüz kayıt yok.</td></tr>}
            {items.map((l) => (
              <tr key={l.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{new Date(l.created_at).toLocaleString('tr-TR')}</td>
                <td className="px-4 py-2">{l.profiles?.ad_soyad ?? '—'}</td>
                <td className="px-4 py-2 font-mono text-xs">{l.ilgili_tablo}</td>
                <td className="px-4 py-2">{l.islem}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
