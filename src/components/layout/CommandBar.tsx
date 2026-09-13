import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { findCommand, searchCommands } from '../../lib/commands'
import { useAuth } from '../../contexts/AuthContext'

export function CommandBar() {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { profile } = useAuth()

  const suggestions = value.trim() ? searchCommands(value).slice(0, 6) : []

  function go(codeOrPath: string, path: string, allowedRoles: string[]) {
    if (profile && !allowedRoles.includes(profile.rol)) {
      setError(`${codeOrPath}: bu işlem için yetkiniz yok (${profile.rol})`)
      return
    }
    setError(null)
    setValue('')
    setOpen(false)
    navigate(path)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!value.trim()) return
    const cmd = findCommand(value)
    if (!cmd) {
      setError(`"${value}" tanımlı bir komut değil.`)
      return
    }
    go(cmd.code, cmd.path, cmd.allowedRoles)
  }

  return (
    <div className="relative w-80">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
            setError(null)
          }}
          onFocus={() => setOpen(true)}
          placeholder="Komut girin (örn. PO01)"
          className="w-full rounded-md border border-slate-300 px-3 py-1.5 font-mono text-sm uppercase tracking-wide focus:border-bt-navy-600 focus:outline-none focus:ring-1 focus:ring-bt-navy-600"
        />
        <button
          type="submit"
          className="rounded-md bg-bt-navy-800 px-3 py-1.5 text-sm text-white hover:bg-bt-navy-700"
        >
          <i className="ti ti-arrow-right" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => navigate('/rehber')}
          title="Komutları ve SAP MM karşılıklarını öğren"
          className="rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-50"
        >
          <i className="ti ti-help" aria-hidden="true" />
        </button>
      </form>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          {suggestions.map((c) => (
            <button
              key={c.code}
              onClick={() => go(c.code, c.path, c.allowedRoles)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="rounded bg-bt-navy-800 px-1.5 py-0.5 font-mono text-xs text-bt-gold-300">
                {c.code}
              </span>
              <span className="flex-1">{c.title}</span>
              <span className="text-xs text-slate-400">{c.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
