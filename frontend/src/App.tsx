import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/Toaster'
import { useAuthStore } from './store/authStore'

// Layout
import Layout from './layouts/Layout'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Diagnosis from './pages/Diagnosis'
import Prescriptions from './pages/Prescriptions'
import PrescriptionDetail from './pages/PrescriptionDetail'
import Reminders from './pages/Reminders'
import Profile from './pages/Profile'
import DoctorDashboard from './pages/DoctorDashboard'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected App Routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="diagnosis" element={<Diagnosis />} />
          <Route path="prescriptions" element={<Prescriptions />} />
          <Route path="prescriptions/:id" element={<PrescriptionDetail />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="doctor" element={<DoctorDashboard />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster />
    </>
  )
}

export default App
