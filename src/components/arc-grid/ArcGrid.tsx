import { useNavigate, useParams } from 'react-router-dom'
import { useProject } from '../../contexts/ProjectContext'
import ArcCellComponent from './ArcCellComponent'

export default function ArcGrid() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { threads, episodes, arcCells, updateArcCell } = useProject()

  const getArcCell = (episodeId: string, threadId: string) =>
    arcCells.find((c) => c.episode_id === episodeId && c.thread_id === threadId)

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse min-w-full">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-bg p-3 text-left font-mono text-xs text-text-muted border-b border-r border-border min-w-[160px]">
              THREADS
            </th>
            {episodes.map((ep) => (
              <th
                key={ep.id}
                className="p-3 text-center font-mono text-xs text-text-secondary border-b border-border min-w-[180px] cursor-pointer hover:text-text-primary transition-colors"
                onClick={() => navigate(`/project/${projectId}/episode/${ep.id}`)}
              >
                EP {ep.number}
                {ep.title && (
                  <span className="block text-text-muted font-body text-xs font-normal mt-0.5">
                    {ep.title}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {threads.map((thread) => (
            <tr key={thread.id}>
              <td
                className="sticky left-0 z-10 bg-bg p-3 border-r border-b border-border"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: thread.color }}
                  />
                  <span className="text-sm text-text-secondary font-body">
                    {thread.name}
                  </span>
                </div>
              </td>
              {episodes.map((ep) => {
                const cell = getArcCell(ep.id, thread.id)
                return (
                  <ArcCellComponent
                    key={`${ep.id}-${thread.id}`}
                    content={cell?.content ?? ''}
                    threadColor={thread.color}
                    onSave={(content) => updateArcCell(ep.id, thread.id, content)}
                    onClick={() => navigate(`/project/${projectId}/episode/${ep.id}`)}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
