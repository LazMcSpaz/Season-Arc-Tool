import { useState } from 'react'
import { useProject } from '../../contexts/ProjectContext'
import { COLOR_PALETTE } from '../../lib/colors'

export default function AddThreadButton() {
  const { threads, addThread } = useProject()
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLOR_PALETTE[0])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    await addThread(name.trim(), color)
    setAdding(false)
    setShowForm(false)
    setName('')
    setColor(COLOR_PALETTE[(threads.length + 1) % COLOR_PALETTE.length])
  }

  if (showForm) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Thread name..."
          autoFocus
          className="px-2 py-1 bg-surface-alt border border-border rounded text-text-primary text-sm focus:outline-none focus:border-border-active w-40"
        />
        <div className="flex gap-1 flex-wrap max-w-[200px]">
          {COLOR_PALETTE.slice(0, 10).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-4 h-4 rounded-full border ${color === c ? 'border-text-primary' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={adding}
          className="px-2 py-1 border border-border-active rounded text-text-primary font-mono text-xs hover:bg-border transition-colors disabled:opacity-50"
        >
          ADD
        </button>
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="text-text-muted font-mono text-xs hover:text-text-secondary"
        >
          CANCEL
        </button>
      </form>
    )
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="px-3 py-1.5 border border-border rounded text-text-muted font-mono text-xs hover:text-text-secondary hover:border-border-active transition-colors"
    >
      + THREAD
    </button>
  )
}
