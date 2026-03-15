import { Link, Outlet, useParams, useLocation } from 'react-router-dom'
import { ProjectProvider, useProject } from '../contexts/ProjectContext'
import ExportButton from './ExportButton'

function ProjectNav() {
  const { projectId } = useParams<{ projectId: string }>()
  const location = useLocation()
  const { project, characters } = useProject()

  const isArcGrid = location.pathname === `/project/${projectId}`
  const isEpisode = location.pathname.includes('/episode/')
  const isCharacter = location.pathname.includes('/character/')

  return (
    <nav className="border-b border-border px-3 sm:px-4 py-2 sm:py-3">
      {/* Top row: title + projects link */}
      <div className="flex items-center justify-between mb-2 sm:mb-0">
        <Link
          to={`/project/${projectId}`}
          className="font-heading text-sm text-text-primary hover:text-text-secondary transition-colors"
        >
          {project?.title ?? 'Loading...'}
        </Link>
        <Link
          to="/"
          className="text-text-muted font-mono text-xs hover:text-text-secondary transition-colors flex items-center"
        >
          PROJECTS
        </Link>
      </div>

      {/* Nav row: view tabs + export */}
      <div className="flex items-center gap-2 sm:gap-4 font-mono text-xs">
        <Link
          to={`/project/${projectId}`}
          className={`px-3 py-2 rounded transition-colors ${isArcGrid ? 'bg-surface-alt text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
        >
          ARC GRID
        </Link>
        <span
          className={`px-3 py-2 rounded transition-colors ${isEpisode ? 'bg-surface-alt text-text-primary' : 'text-text-muted'}`}
        >
          EPISODE
        </span>
        {characters.length > 0 && (
          <Link
            to={`/project/${projectId}/character/${characters[0].id}`}
            className={`px-3 py-2 rounded transition-colors ${isCharacter ? 'bg-surface-alt text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            CHARACTER
          </Link>
        )}

        <div className="ml-auto">
          <ExportButton />
        </div>
      </div>
    </nav>
  )
}

export default function ProjectLayout() {
  return (
    <ProjectProvider>
      <div className="min-h-svh flex flex-col">
        <ProjectNav />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </ProjectProvider>
  )
}
