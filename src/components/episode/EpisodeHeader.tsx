import { useState, useRef } from 'react'
import type { Episode } from '../../lib/types'

interface Props {
  episode: Episode
  onUpdate: (updates: Partial<Episode>) => Promise<void>
}

export default function EpisodeHeader({ episode, onUpdate }: Props) {
  const [title, setTitle] = useState(episode.title)
  const [thematicLink, setThematicLink] = useState(episode.thematic_link)
  const [notes, setNotes] = useState(episode.notes)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  const save = (field: string, value: string) => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      onUpdate({ [field]: value })
    }, 300)
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-xs text-text-muted">EP {episode.number}</span>
        <input
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); save('title', e.target.value) }}
          onBlur={() => { if (title !== episode.title) onUpdate({ title }) }}
          placeholder="Episode title..."
          className="flex-1 bg-transparent font-heading text-xl text-text-primary placeholder-text-muted focus:outline-none border-b border-transparent focus:border-border-active"
        />
      </div>

      <div>
        <label className="block font-mono text-xs text-text-muted mb-1">THEMATIC LINK</label>
        <input
          type="text"
          value={thematicLink}
          onChange={(e) => { setThematicLink(e.target.value); save('thematic_link', e.target.value) }}
          onBlur={() => { if (thematicLink !== episode.thematic_link) onUpdate({ thematic_link: thematicLink }) }}
          placeholder="What connects all threads in this episode..."
          className="w-full px-3 py-2 bg-surface border border-border rounded text-text-arc text-sm font-body placeholder-text-muted focus:outline-none focus:border-border-active"
        />
      </div>

      <details className="group">
        <summary className="font-mono text-xs text-text-muted cursor-pointer hover:text-text-secondary">
          EPISODE NOTES
        </summary>
        <textarea
          value={notes}
          onChange={(e) => { setNotes(e.target.value); save('notes', e.target.value) }}
          onBlur={() => { if (notes !== episode.notes) onUpdate({ notes }) }}
          placeholder="Tone notes, open questions, reminders..."
          rows={3}
          className="mt-2 w-full px-3 py-2 bg-surface border border-border rounded text-text-primary text-sm font-body placeholder-text-muted focus:outline-none focus:border-border-active resize-y"
        />
      </details>
    </div>
  )
}
