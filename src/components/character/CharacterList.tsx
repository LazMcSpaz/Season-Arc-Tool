import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProject } from '../../contexts/ProjectContext'
import { COLOR_PALETTE } from '../../lib/colors'

export default function CharacterList() {
  const { projectId, characterId } = useParams<{ projectId: string; characterId: string }>()
  const { characters, addCharacter } = useProject()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    const color = COLOR_PALETTE[characters.length % COLOR_PALETTE.length]
    const char = await addCharacter(name.trim(), color)
    setAdding(false)
    setShowForm(false)
    setName('')
    if (char) {
      // Navigation will happen via link
    }
  }

  return (
    <div className="w-48 shrink-0 border-r border-border p-3 space-y-1">
      <p className="font-mono text-xs text-text-muted mb-2">CHARACTERS</p>

      {characters.map((c) => (
        <Link
          key={c.id}
          to={`/project/${projectId}/character/${c.id}`}
          className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
            c.id === characterId
              ? 'bg-surface-alt text-text-primary'
              : 'text-text-secondary hover:bg-surface hover:text-text-primary'
          }`}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: c.color }}
          />
          {c.name}
        </Link>
      ))}

      {showForm ? (
        <form onSubmit={handleAdd} className="pt-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name..."
            autoFocus
            className="w-full px-2 py-1 bg-surface-alt border border-border rounded text-text-primary text-sm focus:outline-none focus:border-border-active"
          />
          <div className="flex gap-1 mt-1">
            <button
              type="submit"
              disabled={adding}
              className="flex-1 py-1 border border-border-active rounded text-text-primary font-mono text-xs disabled:opacity-50"
            >
              ADD
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-1 border border-border rounded text-text-muted font-mono text-xs"
            >
              CANCEL
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-1.5 border border-dashed border-border rounded text-text-muted font-mono text-xs hover:text-text-secondary hover:border-border-active transition-colors mt-2"
        >
          + CHARACTER
        </button>
      )}
    </div>
  )
}
