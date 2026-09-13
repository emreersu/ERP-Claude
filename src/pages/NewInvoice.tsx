import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { PurchaseOrder } from '../types'

export function NewInvoice() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [pos, setPos] = useState<PurchaseOrder[]>([])
  const [poId, setPoId] = useState('')
  const [faturaNo, setFaturaNo] = useState('')
  const [faturaTarihi, setFaturaTarihi] = useState(new Date().toISOString().slice(0, 10))
  const [genelToplam, setGenelToplam] = useState<number>(0)
  const [vadeTarihi, setVadeTarihi] = useState('')
  const [saving, setSaving] = useState(false)
  const [sonuc, setSonuc] = useState<{ uyumlu: boolean; mesaj: string } | null>(null)

  useEffect(() => {
    supabase
      .from('purchase_orders')
      .select('*, suppliers(*)')
      .in('durum', ['onaylandi', 'teslim_edildi', 'mal_kabul_bekliyor', 'tamamlandi'])
      .then(({ data }) => setPos((data as unknown as PurchaseOrder[]) ?? []))
  }, [])

  const selectedPo = pos.find((p) => p.id === poId)

  useEffect(() => {
    if (selectedPo) setGenelToplam(selectedPo.genel_toplam)
  }, [selectedPo])

  async function handleSubmit() {
    if (!profile || !selectedPo || !faturaNo.trim()) return
    setSaving(true)

    const araToplam = genelToplam / 1.2
    const kdv = genelToplam - araToplam

    const { data: inv, error } = await supabase
      .from('invoices')
      .insert({
        fatura_no: faturaNo,
        fatura_tarihi: faturaTarihi,
        supplier_id: selectedPo.supplier_id,
        po_id: selectedPo.id,
        ara_toplam: araToplam,
        kdv,
        genel_toplam: genelToplam,
        vade_tarihi: vadeTarihi || null,
        created_by: profile.id,
      })
      .select()
      .single()

    setSaving(false)
    if (error) return

    if (inv?.durum === 'uyumsuz') {
      setSonuc({ uyumlu: false, mesaj: inv.uyumsuzluk_notu ?? 'PO ile fatura tutarı eşleşmiyor.' })
    } else {
      setSonuc({ uyumlu: true, mesaj: 'PO tutarı ile fatura tutarı uyumlu.' })
      setTimeout(() => navigate('/faturalar'), 1200)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">Fatura girişi</h1>
      <p className="mb-6 text-sm text-slate-500 font-mono">INV01</p>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">İlgili PO</label>
          <select value={poId} onChange={(e) => setPoId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="">Seçiniz</option>
            {pos.map((p) => (
              <option key={p.id} value={p.id}>{p.po_no} — {p.suppliers?.firma_adi} ({p.genel_toplam.toLocaleString('tr-TR')} TL)</option>
            ))}
          </select>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fatura no</label>
            <input value={faturaNo} onChange={(e) => setFaturaNo(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Fatura tarihi</label>
            <input type="date" value={faturaTarihi} onChange={(e) => setFaturaTarihi(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Genel toplam (KDV dahil)</label>
            <input type="number" value={genelToplam} onChange={(e) => setGenelToplam(Number(e.target.value))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Vade tarihi</label>
            <input type="date" value={vadeTarihi} onChange={(e) => setVadeTarihi(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
          </div>
        </div>
        {selectedPo && (
          <p className="text-xs text-slate-500">PO tutarı: {selectedPo.genel_toplam.toLocaleString('tr-TR')} TL — sistem otomatik karşılaştıracak.</p>
        )}
      </div>

      {sonuc && (
        <div className={`mb-4 rounded-md p-3 text-sm ${sonuc.uyumlu ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          <i className={`ti ${sonuc.uyumlu ? 'ti-check' : 'ti-alert-triangle'}`} aria-hidden="true" /> {sonuc.mesaj}
        </div>
      )}

      <button onClick={handleSubmit} disabled={saving || !selectedPo || !faturaNo.trim()} className="rounded-md bg-bt-navy-800 px-5 py-2 text-sm font-medium text-white hover:bg-bt-navy-700 disabled:opacity-60">
        {saving ? 'Kontrol ediliyor…' : 'Faturayı kaydet ve kontrol et'}
      </button>
    </div>
  )
}
