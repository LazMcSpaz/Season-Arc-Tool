import { useParams } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import { useCharacterTimeline } from '../hooks/useCharacterTimeline'
import CharacterHeader from '../components/character/CharacterHeader'
import CharacterList from '../components/character/CharacterList'
import TimelineEntry from '../components/character/TimelineEntry'

export default function CharacterViewPage() {
  const { characterId } = useParams<{ characterId: string }>()
  const { threads, episodes } = useProject()
  const {
    character, beats, characterNotes, loading,
    upsertNote, updateCharacter,
  } = useCharacterTimeline(characterId)

  // Sort beats by episode number then sort_order
  const sortedBeats = [...beats].sort((a, b) => {
    const epA = episodes.find((e) => e.id === a.episode_id)
    const epB = episodes.find((e) => e.id === b.episode_id)
    const numDiff = (epA?.number ?? 0) - (epB?.number ?? 0)
    if (numDiff !== 0) return numDiff
    return a.sort_order - b.sort_order
  })

  return (
    <div className="flex min-h-0 flex-1">
      <CharacterList />

      <div className="flex-1 overflow-y-auto">
        {loading || !character ? (
          <div className="flex items-center justify-center p-12">
            <p className="text-text-muted font-mono text-sm">Loading...</p>
          </div>
        ) : (
          <div className="max-w-[860px] mx-auto p-6">
            <CharacterHeader character={character} onUpdate={updateCharacter} />

            <div className="space-y-3">
              <p className="font-mono text-xs text-text-muted">
                TIMELINE ({sortedBeats.length} beat{sortedBeats.length !== 1 ? 's' : ''})
              </p>

              {sortedBeats.length === 0 ? (
                <p className="text-text-muted text-center py-8">
                  This character hasn't been tagged in any beats yet.
                  Tag them from the Episode View.
                </p>
              ) : (
                sortedBeats.map((beat) => (
                  <TimelineEntry
                    key={beat.id}
                    beat={beat}
                    episode={episodes.find((e) => e.id === beat.episode_id)}
                    thread={threads.find((t) => t.id === beat.thread_id)}
                    note={characterNotes.find((n) => n.beat_id === beat.id)}
                    onUpsertNote={upsertNote}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
