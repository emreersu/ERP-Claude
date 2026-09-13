import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { supabase } from '../lib/supabase'
import { PR_STATUS_LABELS } from '../types'

interface Stats {
  acikTalepler: number
  aktifPo: number
  malKabulBekleyen: number
  buAyTutar: number
}

const PIE_COLORS = ['#163166', '#c9a227', '#1c7a3b', '#8a5a12', '#7f77dd', '#9aa5b8']

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center gap-2 text-slate-400">
        <i className={`ti ${icon} text-lg`} aria-hidden="true" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-2xl font-semibold text-bt-navy-900">{value}</p>
    </div>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({ acikTalepler: 0, aktifPo: 0, malKabulBekleyen: 0, buAyTutar: 0 })
  const [sonTalepler, setSonTalepler] = useState<
    { pr_no: string; aciklama: string | null; durum: string; talep_tarihi: string }[]
  >([])
  const [aylikHarcama, setAylikHarcama] = useState<{ ay: string; tutar: number }[]>([])
  const [kategoriHarcama, setKategoriHarcama] = useState<{ ad: string; tutar: number }[]>([])

  useEffect(() => {
    async function load() {
      const { count: acikTalepler } = await supabase
        .from('purchase_requisitions')
        .select('*', { count: 'exact', head: true })
        .in('durum', ['taslak', 'onay_bekliyor', 'satin_alma_surecinde'])

      const { count: aktifPo } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .not('durum', 'in', '(tamamlandi,iptal)')

      const { count: malKabulBekleyen } = await supabase
        .from('purchase_orders')
        .select('*', { count: 'exact', head: true })
        .eq('durum', 'mal_kabul_bekliyor')

      const { data: son } = await supabase
        .from('purchase_requisitions')
        .select('pr_no, aciklama, durum, talep_tarihi')
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: poData } = await supabase
        .from('purchase_orders')
        .select('siparis_tarihi, genel_toplam, items:purchase_order_items(miktar, birim_fiyat, product_id, products(category_id, product_categories(ad)))')

      let buAyTutar = 0
      const ayBazli: Record<string, number> = {}
      const katBazli: Record<string, number> = {}
      const now = new Date()

      for (const po of poData ?? []) {
        const tarih = new Date(po.siparis_tarihi as string)
        const ayKey = tarih.toLocaleDateString('tr-TR', { month: 'short' })
        ayBazli[ayKey] = (ayBazli[ayKey] ?? 0) + (po.genel_toplam as number)

        if (tarih.getMonth() === now.getMonth() && tarih.getFullYear() === now.getFullYear()) {
          buAyTutar += po.genel_toplam as number
        }

        interface PoItemRow {
          miktar: number
          birim_fiyat: number
          products?: { product_categories?: { ad?: string } } | null
        }
        for (const item of (po.items as unknown as PoItemRow[]) ?? []) {
          const ad = item.products?.product_categories?.ad ?? 'Diğer'
          katBazli[ad] = (katBazli[ad] ?? 0) + item.miktar * item.birim_fiyat
        }
      }

      setStats({
        acikTalepler: acikTalepler ?? 0,
        aktifPo: aktifPo ?? 0,
        malKabulBekleyen: malKabulBekleyen ?? 0,
        buAyTutar,
      })
      setSonTalepler(son ?? [])
      setAylikHarcama(Object.entries(ayBazli).map(([ay, tutar]) => ({ ay, tutar })))
      setKategoriHarcama(Object.entries(katBazli).map(([ad, tutar]) => ({ ad, tutar })))
    }
    load()
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Ana Sayfa</h1>
      <p className="mb-6 text-sm text-slate-500">Satın alma operasyonuna genel bakış</p>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Açık Satın Alma Talepleri" value={stats.acikTalepler} icon="ti-file-text" />
        <StatCard label="Aktif PO'lar" value={stats.aktifPo} icon="ti-shopping-cart" />
        <StatCard label="Mal Kabul Bekleyen" value={stats.malKabulBekleyen} icon="ti-package-import" />
        <StatCard label="Bu Ay Satın Alma" value={`${stats.buAyTutar.toLocaleString('tr-TR')} TL`} icon="ti-currency-lira" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Aylık satın alma harcaması</h2>
          {aylikHarcama.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">Henüz veri yok.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aylikHarcama}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ay" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v) => `${Number(v).toLocaleString('tr-TR')} TL`} />
                <Bar dataKey="tutar" fill="#163166" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-bt-navy-900">Ürün grubu bazlı harcama</h2>
          {kategoriHarcama.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-400">Henüz veri yok.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={kategoriHarcama} dataKey="tutar" nameKey="ad" cx="50%" cy="50%" outerRadius={75} label={(e) => (e as unknown as { ad: string }).ad}>
                  {kategoriHarcama.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toLocaleString('tr-TR')} TL`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-bt-navy-900">Son Talepler</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Talep no</th>
              <th className="px-4 py-2">Açıklama</th>
              <th className="px-4 py-2">Tarih</th>
              <th className="px-4 py-2">Durum</th>
            </tr>
          </thead>
          <tbody>
            {sonTalepler.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Henüz kayıt yok. <span className="font-mono">PR01</span> komutuyla ilk talebi oluşturabilirsiniz.
                </td>
              </tr>
            )}
            {sonTalepler.map((t) => (
              <tr key={t.pr_no} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs text-bt-navy-700">{t.pr_no}</td>
                <td className="px-4 py-2">{t.aciklama ?? '—'}</td>
                <td className="px-4 py-2">{new Date(t.talep_tarihi).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-2">
                  <span className="badge bg-slate-100 text-slate-700">
                    {PR_STATUS_LABELS[t.durum as keyof typeof PR_STATUS_LABELS] ?? t.durum}
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
