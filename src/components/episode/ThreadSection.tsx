import type { Thread, Beat, ArcCell, BeatCharacter, CharacterNote, Character } from '../../lib/types'
import BeatCard from './BeatCard'

interface Props {
  thread: Thread
  beats: Beat[]
  arcCell: ArcCell | undefined
  beatCharacters: BeatCharacter[]
  characterNotes: CharacterNote[]
  characters: Character[]
  onAddBeat: (threadId: string, sortOrder: number) => Promise<any>
  onUpdateBeat: (id: string, updates: Partial<Beat>) => Promise<void>
  onDeleteBeat: (id: string) => Promise<void>
  onTagCharacter: (beatId: string, characterId: string) => Promise<void>
  onUntagCharacter: (beatId: string, characterId: string) => Promise<void>
}

export default function ThreadSection({
  thread, beats, arcCell, beatCharacters, characterNotes, characters,
  onAddBeat, onUpdateBeat, onDeleteBeat, onTagCharacter, onUntagCharacter,
}: Props) {
  const threadBeats = beats
    .filter((b) => b.thread_id === thread.id)
    .sort((a, b) => a.sort_order - b.sort_order)

  const handleAddBeat = () => {
    const maxOrder = threadBeats.length > 0
      ? Math.max(...threadBeats.map((b) => b.sort_order))
      : -1
    onAddBeat(thread.id, maxOrder + 1)
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: thread.color }}
        />
        <h3 className="font-heading text-sm text-text-primary">{thread.name}</h3>
      </div>

      {arcCell && arcCell.content && (
        <div className="mb-4 px-3 py-2 bg-surface border-l-2 border-border rounded-r" style={{ borderLeftColor: thread.color }}>
          <p className="font-mono text-xs text-text-muted mb-0.5">ARC REFERENCE</p>
          <p className="text-sm text-text-arc font-body whitespace-pre-wrap">{arcCell.content}</p>
        </div>
      )}

      <div className="space-y-2">
        {threadBeats.map((beat) => {
          const taggedCharIds = beatCharacters
            .filter((bc) => bc.beat_id === beat.id)
            .map((bc) => bc.character_id)
          const taggedChars = characters.filter((c) => taggedCharIds.includes(c.id))
          const notes = characterNotes.filter((cn) => cn.beat_id === beat.id)

          return (
            <BeatCard
              key={beat.id}
              beat={beat}
              taggedCharacters={taggedChars}
              characterNotes={notes}
              allCharacters={characters}
              onUpdate={(updates) => onUpdateBeat(beat.id, updates)}
              onDelete={() => onDeleteBeat(beat.id)}
              onTagCharacter={(charId) => onTagCharacter(beat.id, charId)}
              onUntagCharacter={(charId) => onUntagCharacter(beat.id, charId)}
            />
          )
        })}
      </div>

      <button
        onClick={handleAddBeat}
        className="mt-2 w-full py-2 border border-dashed border-border rounded text-text-muted font-mono text-xs hover:text-text-secondary hover:border-border-active transition-colors"
      >
        + BEAT
      </button>
    </div>
  )
}
