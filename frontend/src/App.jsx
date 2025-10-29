/**
 * App.jsx — Root application component
 *
 * Sets up the full React Router v6 route tree and wraps the entire
 * application in <AuthProvider> so that authentication state (user,
 * session, loading) is available to every page and component via
 * the `useAuth` hook.
 *
 * Route structure:
 *   Public  (accessible without login)
 *     /             → LandingPage
 *     /login        → LoginPage
 *     /register     → RegisterPage
 *
 *   Protected  (redirect to /login if unauthenticated)
 *     /visualizer   → VisualizerPage   (main code execution UI)
 *     /courses      → Courses
 *     /notes        → Notes
 *     /tutorials    → Tutorials
 *
 * ProtectedRoute wraps each private page and shows a spinner while
 * the Supabase session is still being hydrated on first load.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './components/LandingPage'
import VisualizerPage from './pages/VisualizerPage'
import Courses from './components/Courses'
import Notes from './components/Notes'
import Tutorials from './components/Tutorials'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
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
