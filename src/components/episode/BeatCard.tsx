import { useState, useRef } from 'react'
import type { Beat, Character, CharacterNote, BeatLabel } from '../../lib/types'
import CharacterPicker from './CharacterPicker'

const LABELS: BeatLabel[] = ['Opening', 'Beat', 'Climax', 'Closing']

interface Props {
  beat: Beat
  taggedCharacters: Character[]
  characterNotes: CharacterNote[]
  allCharacters: Character[]
  onUpdate: (updates: Partial<Beat>) => Promise<void>
  onDelete: () => Promise<void>
  onTagCharacter: (characterId: string) => Promise<void>
  onUntagCharacter: (characterId: string) => Promise<void>
}

export default function BeatCard({
  beat, taggedCharacters, characterNotes, allCharacters,
  onUpdate, onDelete, onTagCharacter, onUntagCharacter,
}: Props) {
  const [text, setText] = useState(beat.text)
  const [showPicker, setShowPicker] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleTextChange = (value: string) => {
    setText(value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      onUpdate({ text: value })
    }, 300)
  }

  const availableCharacters = allCharacters.filter(
    (c) => !taggedCharacters.some((tc) => tc.id === c.id)
  )

  return (
    <div className="bg-surface border border-border rounded p-3">
      <div className="flex items-center gap-2 mb-2">
        <select
          value={beat.label}
          onChange={(e) => onUpdate({ label: e.target.value as BeatLabel })}
          className="bg-surface-alt border border-border rounded px-2 py-0.5 font-mono text-xs text-text-secondary focus:outline-none focus:border-border-active"
        >
          {LABELS.map((l) => (
            <option key={l} value={l}>{l.toUpperCase()}</option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          onClick={() => {
            if (confirm('Delete this beat?')) onDelete()
          }}
          className="text-text-muted font-mono text-xs hover:text-red-400 transition-colors"
        >
          x
        </button>
      </div>

      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        onBlur={() => { if (text !== beat.text) onUpdate({ text }) }}
        placeholder="Beat description..."
        rows={2}
        className="w-full bg-transparent text-text-primary text-sm font-body placeholder-text-muted focus:outline-none resize-y leading-relaxed"
      />

      {/* Character tags */}
      <div className="flex flex-wrap items-center gap-1.5 mt-2">
        {taggedCharacters.map((char) => (
          <span
            key={char.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
            style={{
              backgroundColor: char.color + '33',
              color: '#C8BFA8',
              border: `1px solid ${char.color}66`,
            }}
          >
            {char.name}
            <button
              onClick={() => onUntagCharacter(char.id)}
              className="hover:text-red-400 ml-0.5"
            >
              x
            </button>
          </span>
        ))}
        {availableCharacters.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="px-1.5 py-0.5 border border-dashed border-border rounded text-text-muted text-xs hover:border-border-active hover:text-text-secondary transition-colors"
            >
              +
            </button>
            {showPicker && (
              <CharacterPicker
                characters={availableCharacters}
                onSelect={(id) => { onTagCharacter(id); setShowPicker(false) }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* Character continuity notes (read-only) */}
      {taggedCharacters.length > 0 && (
        <div className="mt-2">
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="font-mono text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            {showNotes ? 'HIDE' : 'SHOW'} CONTINUITY ({taggedCharacters.length})
          </button>
          {showNotes && (
            <div className="mt-2 space-y-1.5">
              {taggedCharacters.map((char) => {
                const note = characterNotes.find((n) => n.character_id === char.id)
                return (
                  <div
                    key={char.id}
                    className="px-2 py-1.5 bg-surface-alt rounded text-xs"
                    style={{ borderLeft: `2px solid ${char.color}` }}
                  >
                    <span className="font-mono text-text-secondary">{char.name}</span>
                    {note ? (
                      <p className="text-text-arc mt-0.5 font-body">{note.content}</p>
                    ) : (
                      <p className="text-text-muted italic mt-0.5">No note yet</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
