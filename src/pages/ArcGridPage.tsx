import { useProject } from '../contexts/ProjectContext'
import ArcGrid from '../components/arc-grid/ArcGrid'
import AddEpisodeButton from '../components/arc-grid/AddEpisodeButton'
import AddThreadButton from '../components/arc-grid/AddThreadButton'

export default function ArcGridPage() {
  const { loading, threads, episodes } = useProject()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-text-muted font-mono text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="font-heading text-lg text-text-primary">Season Arc Grid</h2>
        <div className="flex gap-2 ml-auto">
          <AddThreadButton />
          <AddEpisodeButton />
        </div>
      </div>

      {threads.length === 0 && episodes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-muted mb-4">
            Start by adding story threads and episodes.
          </p>
          <div className="flex justify-center gap-3">
            <AddThreadButton />
            <AddEpisodeButton />
          </div>
        </div>
      ) : (
        <ArcGrid />
      )}
    </div>
  )
}
