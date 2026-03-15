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
    <nav className="border-b border-border px-4 py-3 flex items-center gap-6">
      <Link
        to={`/project/${projectId}`}
        className="font-heading text-sm text-text-primary hover:text-text-secondary transition-colors"
      >
        {project?.title ?? 'Loading...'}
      </Link>

      <div className="flex gap-4 ml-auto font-mono text-xs">
        <Link
          to={`/project/${projectId}`}
          className={`transition-colors ${isArcGrid ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
        >
          ARC GRID
        </Link>
        <span
          className={`transition-colors ${isEpisode ? 'text-text-primary' : 'text-text-muted'}`}
        >
          EPISODE
        </span>
        {characters.length > 0 && (
          <Link
            to={`/project/${projectId}/character/${characters[0].id}`}
            className={`transition-colors ${isCharacter ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary'}`}
          >
            CHARACTER
          </Link>
        )}
      </div>

      <ExportButton />

      <Link
        to="/"
        className="text-text-muted font-mono text-xs hover:text-text-secondary transition-colors"
      >
        PROJECTS
      </Link>
    </nav>
  )
}

export default function ProjectLayout() {
  return (
    <ProjectProvider>
      <div className="min-h-svh flex flex-col">
        <ProjectNav />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </ProjectProvider>
  )
}
