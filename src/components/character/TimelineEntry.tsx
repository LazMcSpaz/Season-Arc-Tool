import { useState, useRef } from 'react'
import type { Beat, CharacterNote, Episode, Thread } from '../../lib/types'

interface Props {
  beat: Beat
  episode: Episode | undefined
  thread: Thread | undefined
  note: CharacterNote | undefined
  onUpsertNote: (beatId: string, content: string) => Promise<void>
}

export default function TimelineEntry({ beat, episode, thread, note, onUpsertNote }: Props) {
  const [noteText, setNoteText] = useState(note?.content ?? '')
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleNoteChange = (value: string) => {
    setNoteText(value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      onUpsertNote(beat.id, value)
    }, 300)
  }

  return (
    <div className="border border-border rounded bg-surface">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span className="font-mono text-xs text-text-muted">
          EP {episode?.number ?? '?'}
        </span>
        {thread && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: thread.color }}
            />
            <span className="text-xs text-text-secondary font-body">{thread.name}</span>
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-text-muted">
          {beat.label.toUpperCase()}
        </span>
      </div>

      <div className="px-3 py-2">
        <p className="text-sm text-text-primary font-body whitespace-pre-wrap leading-relaxed">
          {beat.text || <span className="text-text-muted italic">No beat text</span>}
        </p>
      </div>

      <div className="px-3 py-2 border-t border-border bg-surface-alt rounded-b">
        <label className="block font-mono text-xs text-text-muted mb-1">CHARACTER NOTE</label>
        <textarea
          value={noteText}
          onChange={(e) => handleNoteChange(e.target.value)}
          onBlur={() => {
            if (noteText !== (note?.content ?? '')) {
              onUpsertNote(beat.id, noteText)
            }
          }}
          placeholder="Emotional state, knowledge, location..."
          rows={2}
          className="w-full bg-transparent text-text-arc text-sm font-body placeholder-text-muted focus:outline-none resize-y"
        />
      </div>
    </div>
  )
}
