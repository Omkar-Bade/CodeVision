import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage    from './components/LandingPage'
import VisualizerPage from './pages/VisualizerPage'
import Courses        from './components/Courses'
import Notes          from './components/Notes'
import Tutorials      from './components/Tutorials'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<LandingPage />}    />
        <Route path="/visualizer" element={<VisualizerPage />} />
        <Route path="/courses"    element={<Courses />}        />
        <Route path="/notes"      element={<Notes />}          />
        <Route path="/tutorials"  element={<Tutorials />}      />
      </Routes>
    </BrowserRouter>
  )
}
