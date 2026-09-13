import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { CommandBar } from './CommandBar'
import { NotificationBell } from './NotificationBell'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <CommandBar />
          <div className="flex items-center gap-4 text-slate-500">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
