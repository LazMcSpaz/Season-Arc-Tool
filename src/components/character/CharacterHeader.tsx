import { useState, useRef } from 'react'
import type { Character } from '../../lib/types'
import { COLOR_PALETTE } from '../../lib/colors'

interface Props {
  character: Character
  onUpdate: (updates: Partial<Character>) => Promise<void>
}

export default function CharacterHeader({ character, onUpdate }: Props) {
  const [name, setName] = useState(character.name)
  const [arcSummary, setArcSummary] = useState(character.arc_summary)
  const [showColors, setShowColors] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined)

  const save = (field: string, value: string) => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      onUpdate({ [field]: value })
    }, 300)
  }

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowColors(!showColors)}
          className="w-5 h-5 rounded-full shrink-0 border-2 border-transparent hover:border-border-active transition-colors"
          style={{ backgroundColor: character.color }}
          title="Change color"
        />
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); save('name', e.target.value) }}
          onBlur={() => { if (name !== character.name) onUpdate({ name }) }}
          className="flex-1 bg-transparent font-heading text-xl text-text-primary focus:outline-none border-b border-transparent focus:border-border-active"
        />
      </div>

      {showColors && (
        <div className="flex flex-wrap gap-1.5 p-2 bg-surface border border-border rounded">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => { onUpdate({ color: c }); setShowColors(false) }}
              className={`w-5 h-5 rounded-full border-2 ${character.color === c ? 'border-text-primary' : 'border-transparent hover:border-border-active'} transition-colors`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}

      <div>
        <label className="block font-mono text-xs text-text-muted mb-1">ARC SUMMARY</label>
        <textarea
          value={arcSummary}
          onChange={(e) => { setArcSummary(e.target.value); save('arc_summary', e.target.value) }}
          onBlur={() => { if (arcSummary !== character.arc_summary) onUpdate({ arc_summary: arcSummary }) }}
          placeholder="High-level summary of this character's season arc..."
          rows={3}
          className="w-full px-3 py-2 bg-surface border border-border rounded text-text-primary text-sm font-body placeholder-text-muted focus:outline-none focus:border-border-active resize-y"
        />
      </div>
    </div>
  )
}
