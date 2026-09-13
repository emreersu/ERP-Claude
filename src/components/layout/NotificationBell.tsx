import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface Notification {
  id: string
  baslik: string
  mesaj: string | null
  okundu: boolean
  created_at: string
}

export function NotificationBell() {
  const { profile } = useAuth()
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!profile) return

    supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setItems((data as Notification[]) ?? []))

    // Realtime: yeni bildirim geldiğinde anlık ekle
    const channel = supabase
      .channel('notifications-' + profile.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `profile_id=eq.${profile.id}` },
        (payload) => setItems((prev) => [payload.new as Notification, ...prev])
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile])

  const unread = items.filter((i) => !i.okundu).length

  async function markAllRead() {
    if (!profile) return
    await supabase.from('notifications').update({ okundu: true }).eq('profile_id', profile.id).eq('okundu', false)
    setItems((prev) => prev.map((i) => ({ ...i, okundu: true })))
  }

  return (
    <div className="relative">
      <button onClick={() => { setOpen((o) => !o); if (!open) markAllRead() }} className="relative">
        <i className="ti ti-bell text-lg" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-md border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">Bildirimler</div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-400">Bildirim yok.</p>}
            {items.map((n) => (
              <div key={n.id} className="border-b border-slate-50 px-3 py-2 text-sm">
                <p className="font-medium text-bt-navy-900">{n.baslik}</p>
                {n.mesaj && <p className="text-xs text-slate-500">{n.mesaj}</p>}
                <p className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleString('tr-TR')}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
