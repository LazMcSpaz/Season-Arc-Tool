import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'

export default function AddEpisodeButton() {
  const { episodes, addEpisode } = useProject()
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    setAdding(true)
    const nextNumber = episodes.length > 0
      ? Math.max(...episodes.map((e) => e.number)) + 1
      : 1
    await addEpisode(nextNumber)
    setAdding(false)
  }

  return (
    <button
      onClick={handleAdd}
      disabled={adding}
      className="px-3 py-1.5 border border-border rounded text-text-muted font-mono text-xs hover:text-text-secondary hover:border-border-active transition-colors disabled:opacity-50"
    >
      {adding ? '...' : '+ EPISODE'}
    </button>
  )
}
