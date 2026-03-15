import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProject } from '../../contexts/ProjectContext'
import ArcCellComponent from './ArcCellComponent'
import type { Thread, Episode } from '../../lib/types'
import { COLOR_PALETTE } from '../../lib/colors'

function ThreadMenu({ thread, onUpdate, onDelete }: {
  thread: Thread
  onUpdate: (id: string, updates: Partial<Thread>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(thread.name)
  const [showColors, setShowColors] = useState(false)

  if (editing) {
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (name.trim() && name !== thread.name) {
              onUpdate(thread.id, { name: name.trim() })
            }
            setEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur()
            }
          }}
          autoFocus
          className="w-full px-2 py-1 bg-surface-alt border border-border rounded text-text-primary text-sm focus:outline-none focus:border-border-active"
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 cursor-pointer"
          style={{ backgroundColor: thread.color }}
          onClick={() => setShowColors(!showColors)}
        />
        <span className="text-sm text-text-secondary font-body flex-1">
          {thread.name}
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="text-text-muted hover:text-text-secondary text-xs px-1"
        >
          ...
        </button>
      </div>

      {showColors && (
        <div className="flex flex-wrap gap-1 mt-2 p-1.5 bg-surface-alt border border-border rounded">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => { onUpdate(thread.id, { color: c }); setShowColors(false) }}
              className={`w-5 h-5 rounded-full border-2 ${thread.color === c ? 'border-text-primary' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-surface-alt border border-border rounded shadow-lg min-w-[120px]">
          <button
            onClick={() => { setEditing(true); setOpen(false) }}
            className="w-full text-left px-3 py-2.5 text-sm text-text-primary hover:bg-border transition-colors"
          >
            Rename
          </button>
          <button
            onClick={() => { setShowColors(true); setOpen(false) }}
            className="w-full text-left px-3 py-2.5 text-sm text-text-primary hover:bg-border transition-colors"
          >
            Change color
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete thread "${thread.name}" and all its beats?`)) {
                onDelete(thread.id)
              }
              setOpen(false)
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-border transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function EpisodeMenu({ episode, onUpdate, onDelete, onOpen }: {
  episode: Episode
  onUpdate: (id: string, updates: Partial<Episode>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onOpen: () => void
}) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(episode.title)

  if (editing) {
    return (
      <div className="text-center">
        <span className="font-mono text-xs text-text-secondary">EP {episode.number}</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => {
            if (title !== episode.title) {
              onUpdate(episode.id, { title })
            }
            setEditing(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur()
            }
          }}
          autoFocus
          placeholder="Episode title..."
          className="w-full mt-1 px-2 py-1 bg-surface-alt border border-border rounded text-text-primary text-xs text-center focus:outline-none focus:border-border-active"
        />
      </div>
    )
  }

  return (
    <div className="relative text-center">
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={onOpen}
          className="font-mono text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          EP {episode.number}
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="text-text-muted hover:text-text-secondary text-xs px-1"
        >
          ...
        </button>
      </div>
      {episode.title && (
        <span className="block text-text-muted font-body text-xs font-normal mt-0.5">
          {episode.title}
        </span>
      )}

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-20 bg-surface-alt border border-border rounded shadow-lg min-w-[120px]">
          <button
            onClick={onOpen}
            className="w-full text-left px-3 py-2.5 text-sm text-text-primary hover:bg-border transition-colors"
          >
            Open
          </button>
          <button
            onClick={() => { setEditing(true); setOpen(false) }}
            className="w-full text-left px-3 py-2.5 text-sm text-text-primary hover:bg-border transition-colors"
          >
            Rename
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete Episode ${episode.number} and all its beats?`)) {
                onDelete(episode.id)
              }
              setOpen(false)
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-border transition-colors"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function ArcGrid() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const {
    threads, episodes, arcCells,
    updateArcCell, updateThread, updateEpisode,
    deleteThread, deleteEpisode,
  } = useProject()

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
                className="p-3 border-b border-border min-w-[200px]"
              >
                <EpisodeMenu
                  episode={ep}
                  onUpdate={updateEpisode}
                  onDelete={deleteEpisode}
                  onOpen={() => navigate(`/project/${projectId}/episode/${ep.id}`)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {threads.map((thread) => (
            <tr key={thread.id}>
              <td className="sticky left-0 z-10 bg-bg p-3 border-r border-b border-border">
                <ThreadMenu
                  thread={thread}
                  onUpdate={updateThread}
                  onDelete={deleteThread}
                />
              </td>
              {episodes.map((ep) => {
                const cell = getArcCell(ep.id, thread.id)
                return (
                  <ArcCellComponent
                    key={`${ep.id}-${thread.id}`}
                    content={cell?.content ?? ''}
                    threadColor={thread.color}
                    onSave={(content) => updateArcCell(ep.id, thread.id, content)}
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
