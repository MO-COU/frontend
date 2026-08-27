import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { CustomerShell } from '@/components/layout/CustomerShell'
import { CouponDetailPage } from '@/pages/CouponDetailPage'
import { CustomerCouponPage } from '@/pages/customer/CustomerCouponPage'
import { CustomerDashboardPage } from '@/pages/customer/CustomerDashboardPage'
import { DashboardPage } from '@/pages/DashboardPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/coupons/:couponId" element={<CouponDetailPage />} />
      </Route>
      <Route element={<CustomerShell />}>
        <Route path="/shop" element={<CustomerDashboardPage />} />
        <Route path="/shop/coupons/:couponId" element={<CustomerCouponPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
