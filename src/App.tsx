import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Suppliers } from './pages/Suppliers'
import { Requisitions } from './pages/Requisitions'
import { NewRequisition } from './pages/NewRequisition'
import { Quotations } from './pages/Quotations'
import { NewQuotation } from './pages/NewQuotation'
import { CompareQuotations } from './pages/CompareQuotations'
import { PurchaseOrders } from './pages/PurchaseOrders'
import { NewPurchaseOrder } from './pages/NewPurchaseOrder'
import { GoodsReceipts } from './pages/GoodsReceipts'
import { NewGoodsReceipt } from './pages/NewGoodsReceipt'
import { Stock } from './pages/Stock'
import { StockMovements } from './pages/StockMovements'
import { Products } from './pages/Products'
import { Invoices } from './pages/Invoices'
import { NewInvoice } from './pages/NewInvoice'
import { Payments } from './pages/Payments'
import { Reports } from './pages/Reports'
import { AuditLog } from './pages/AuditLog'
import { CommandGuide } from './pages/CommandGuide'
import { ComingSoon } from './pages/ComingSoon'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="flex h-screen items-center justify-center">Yükleniyor…</div>
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />

        <Route path="/talepler" element={<Requisitions />} />
        <Route path="/talepler/yeni" element={<NewRequisition />} />

        <Route path="/teklif-talepleri" element={<ComingSoon title="Teklif talepleri (RFQ02)" faz="genişletilmiş RFQ akışı" />} />
        <Route path="/teklif-talepleri/yeni" element={<ComingSoon title="Yeni teklif talebi (RFQ01)" faz="genişletilmiş RFQ akışı" />} />
        <Route path="/teklifler" element={<Quotations />} />
        <Route path="/teklifler/yeni" element={<NewQuotation />} />
        <Route path="/teklifler/karsilastir" element={<CompareQuotations />} />

        <Route path="/siparisler" element={<PurchaseOrders />} />
        <Route path="/siparisler/yeni" element={<NewPurchaseOrder />} />
        <Route path="/siparisler/takip" element={<PurchaseOrders />} />

        <Route path="/mal-kabul" element={<GoodsReceipts />} />
        <Route path="/mal-kabul/yeni" element={<NewGoodsReceipt />} />
        <Route path="/stok" element={<Stock />} />
        <Route path="/stok/hareketler" element={<StockMovements />} />
        <Route path="/urunler" element={<Products />} />

        <Route path="/tedarikciler" element={<Suppliers />} />
        <Route path="/tedarikciler/yeni" element={<ComingSoon title="Yeni tedarikçi formu" faz="ek geliştirme (şu an SQL ile ekleniyor)" />} />

        <Route path="/faturalar" element={<Invoices />} />
        <Route path="/faturalar/yeni" element={<NewInvoice />} />
        <Route path="/odemeler" element={<Payments />} />

        <Route path="/raporlar" element={<Reports />} />
        <Route path="/ayarlar" element={<ComingSoon title="Sistem ayarları" faz="ek geliştirme" />} />
        <Route path="/islem-gecmisi" element={<AuditLog />} />
        <Route path="/rehber" element={<CommandGuide />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
