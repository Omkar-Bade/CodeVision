import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import ProtectedRoute    from './components/ProtectedRoute'
import LandingPage       from './components/LandingPage'
import VisualizerPage    from './pages/VisualizerPage'
import Courses           from './components/Courses'
import Notes             from './components/Notes'
import Tutorials         from './components/Tutorials'
import LoginPage         from './pages/LoginPage'
import RegisterPage      from './pages/RegisterPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/"        element={<LandingPage />}  />
          <Route path="/login"   element={<LoginPage />}    />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — require authentication */}
          <Route path="/visualizer" element={
            <ProtectedRoute><VisualizerPage /></ProtectedRoute>
          } />
          <Route path="/courses" element={
            <ProtectedRoute><Courses /></ProtectedRoute>
          } />
          <Route path="/notes" element={
            <ProtectedRoute><Notes /></ProtectedRoute>
          } />
          <Route path="/tutorials" element={
            <ProtectedRoute><Tutorials /></ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
