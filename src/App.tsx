import { Route, Routes } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { EventDetailPage } from '@/pages/EventDetailPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App
