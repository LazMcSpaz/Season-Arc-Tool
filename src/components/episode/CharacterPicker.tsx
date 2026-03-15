import { useEffect, useRef } from 'react'
import type { Character } from '../../lib/types'

interface Props {
  characters: Character[]
  onSelect: (characterId: string) => void
  onClose: () => void
}

export default function CharacterPicker({ characters, onSelect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-20 top-full left-0 mt-1 bg-surface-alt border border-border rounded shadow-lg min-w-[160px] max-h-[200px] overflow-y-auto"
    >
      {characters.map((char) => (
        <button
          key={char.id}
          onClick={() => onSelect(char.id)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-border transition-colors"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: char.color }}
          />
          <span className="text-sm text-text-primary font-body">{char.name}</span>
        </button>
      ))}
    </div>
  )
}
