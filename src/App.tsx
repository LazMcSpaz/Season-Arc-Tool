import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ProjectLayout from './components/ProjectLayout'
import OfflineIndicator from './components/OfflineIndicator'
import LoginPage from './pages/LoginPage'
import ProjectListPage from './pages/ProjectListPage'
import ArcGridPage from './pages/ArcGridPage'
import EpisodeViewPage from './pages/EpisodeViewPage'
import CharacterViewPage from './pages/CharacterViewPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ProjectListPage />} />
            <Route path="/project/:projectId" element={<ProjectLayout />}>
              <Route index element={<ArcGridPage />} />
              <Route path="episode/:episodeId" element={<EpisodeViewPage />} />
              <Route path="character/:characterId" element={<CharacterViewPage />} />
            </Route>
          </Route>
        </Routes>
        <OfflineIndicator />
      </BrowserRouter>
    </AuthProvider>
  )
}
