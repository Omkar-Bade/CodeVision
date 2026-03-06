import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import LandingPage    from './components/LandingPage'
import VisualizerPage from './pages/VisualizerPage'
import Courses        from './components/Courses'
import Notes          from './components/Notes'
import Tutorials      from './components/Tutorials'
import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"           element={<LandingPage />}    />
          <Route path="/visualizer" element={<VisualizerPage />} />
          <Route path="/courses"    element={<Courses />}        />
          <Route path="/notes"      element={<Notes />}          />
          <Route path="/tutorials"  element={<Tutorials />}      />
          <Route path="/login"      element={<LoginPage />}      />
          <Route path="/register"   element={<RegisterPage />}   />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
