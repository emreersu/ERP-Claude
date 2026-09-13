import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QUICK_COMMANDS } from '../lib/commands'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../types'

export function CommandGuide() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const filtered = QUICK_COMMANDS.filter(
    (c) =>
      !query.trim() ||
      c.code.toUpperCase().includes(query.toUpperCase()) ||
      c.title.toUpperCase().includes(query.toUpperCase()) ||
      c.sapKarsiligi.toUpperCase().includes(query.toUpperCase())
  )

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-bt-navy-900">SAP MM rehberi</h1>
      <p className="mb-4 text-sm text-slate-500">
        Bu sistemdeki her komutun gerçek SAP MM'deki karşılığı ve ne işe yaradığı — amaç, bu programı
        kullanırken SAP MM mantığını da öğrenmen.
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Komut, ekran adı veya SAP T-code'u ara (örn. MIGO)"
        className="mb-5 w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((c) => {
          const yetkiVar = !profile || c.allowedRoles.includes(profile.rol)
          return (
            <div key={c.code} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-bt-navy-800 px-2 py-0.5 font-mono text-xs text-bt-gold-300">
                  {c.code}
                </span>
                <span className="text-[11px] text-slate-400">
                  SAP karşılığı: <span className="font-mono">{c.sapKarsiligi}</span>
                </span>
              </div>
              <p className="mb-1 text-sm font-semibold text-bt-navy-900">{c.title}</p>
              <p className="mb-3 text-sm leading-relaxed text-slate-600">{c.ogrenmeNotu}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {c.allowedRoles.map((r) => (
                    <span key={r} className="badge bg-slate-100 text-[10px] text-slate-500">
                      {ROLE_LABELS[r]}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => yetkiVar && navigate(c.path)}
                  disabled={!yetkiVar}
                  className="rounded-md bg-bt-navy-800 px-3 py-1 text-xs text-white hover:bg-bt-navy-700 disabled:opacity-40"
                >
                  Ekranı aç
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
