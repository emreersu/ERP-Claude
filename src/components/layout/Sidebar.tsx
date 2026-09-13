import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { ROLE_LABELS } from '../../types'

const MENU = [
  { to: '/', label: 'Ana Sayfa', icon: 'ti-home' },
  { to: '/talepler', label: 'Satın Alma Talebi', icon: 'ti-file-text' },
  { to: '/teklifler', label: 'Teklif Yönetimi', icon: 'ti-clipboard-list' },
  { to: '/siparisler', label: 'Satın Alma Siparişleri', icon: 'ti-shopping-cart' },
  { to: '/tedarikciler', label: 'Tedarikçiler', icon: 'ti-truck' },
  { to: '/urunler', label: 'Ürün / Malzeme', icon: 'ti-box' },
  { to: '/stok', label: 'Stok Yönetimi', icon: 'ti-stack-2' },
  { to: '/mal-kabul', label: 'Mal Kabul', icon: 'ti-package-import' },
  { to: '/faturalar', label: 'Faturalar', icon: 'ti-receipt' },
  { to: '/odemeler', label: 'Ödeme Takibi', icon: 'ti-credit-card' },
  { to: '/raporlar', label: 'Raporlar', icon: 'ti-chart-bar' },
  { to: '/islem-gecmisi', label: 'İşlem Geçmişi', icon: 'ti-history' },
  { to: '/rehber', label: 'SAP MM Rehberi', icon: 'ti-school' },
  { to: '/ayarlar', label: 'Ayarlar', icon: 'ti-settings' },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()

  return (
    <aside className="flex h-screen w-64 flex-col bg-bt-navy-950 text-white">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-bt-gold-500 text-sm font-bold text-bt-navy-950">
          BT
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">BAYTECH</p>
          <p className="text-[11px] leading-tight text-bt-gold-300">MÜHENDİSLİK</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4">
        {MENU.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-bt-navy-700 text-bt-gold-300'
                  : 'text-slate-300 hover:bg-bt-navy-800 hover:text-white'
              }`
            }
          >
            <i className={`ti ${item.icon} text-base`} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-sm font-medium">{profile?.ad_soyad ?? '—'}</p>
        <p className="text-xs text-bt-gold-300">{profile ? ROLE_LABELS[profile.rol] : ''}</p>
        <button
          onClick={signOut}
          className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-white"
        >
          <i className="ti ti-logout" aria-hidden="true" /> Çıkış yap
        </button>
      </div>
    </aside>
  )
}
