import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [eposta, setEposta] = useState('')
  const [sifre, setSifre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await signIn(eposta, sifre)
    setLoading(false)
    if (error) {
      setError('Giriş başarısız. E-posta veya şifre hatalı.')
      return
    }
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bt-navy-950">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded bg-bt-gold-500 text-lg font-bold text-bt-navy-950">
            BT
          </div>
          <p className="font-semibold text-bt-navy-900">BAYTECH MÜHENDİSLİK</p>
          <p className="text-xs text-slate-500">Satın Alma Yönetim Sistemi</p>
        </div>

        <label className="mb-1 block text-sm font-medium text-slate-700">E-posta</label>
        <input
          type="email"
          value={eposta}
          onChange={(e) => setEposta(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-bt-navy-600 focus:outline-none focus:ring-1 focus:ring-bt-navy-600"
          placeholder="ad.soyad@baytech.com.tr"
        />

        <label className="mb-1 block text-sm font-medium text-slate-700">Şifre</label>
        <input
          type="password"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          required
          className="mb-4 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-bt-navy-600 focus:outline-none focus:ring-1 focus:ring-bt-navy-600"
        />

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-bt-navy-800 py-2 text-sm font-medium text-white hover:bg-bt-navy-700 disabled:opacity-60"
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </button>
      </form>
    </div>
  )
}
