import { useParams } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import { useEpisodeData } from '../hooks/useEpisodeData'
import EpisodeHeader from '../components/episode/EpisodeHeader'
import ThreadSection from '../components/episode/ThreadSection'
import type { Episode } from '../lib/types'

export default function EpisodeViewPage() {
  const { episodeId } = useParams<{ episodeId: string }>()
  const { threads, episodes, characters, updateEpisode } = useProject()
  const {
    beats, arcCells, beatCharacters, characterNotes, loading,
    addBeat, updateBeat, deleteBeat, tagCharacter, untagCharacter,
  } = useEpisodeData(episodeId)

  const episode = episodes.find((e) => e.id === episodeId)

  if (loading || !episode) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-text-muted font-mono text-sm">Loading...</p>
      </div>
    )
  }

  const handleUpdateEpisode = async (updates: Partial<Episode>) => {
    await updateEpisode(episode.id, updates)
  }

  return (
    <div className="max-w-[860px] mx-auto p-6">
      <EpisodeHeader episode={episode} onUpdate={handleUpdateEpisode} />

      {threads.map((thread) => (
        <ThreadSection
          key={thread.id}
          thread={thread}
          beats={beats}
          arcCell={arcCells.find((c) => c.thread_id === thread.id)}
          beatCharacters={beatCharacters}
          characterNotes={characterNotes}
          characters={characters}
          onAddBeat={addBeat}
          onUpdateBeat={updateBeat}
          onDeleteBeat={deleteBeat}
          onTagCharacter={tagCharacter}
          onUntagCharacter={untagCharacter}
        />
      ))}

      {threads.length === 0 && (
        <p className="text-text-muted text-center py-8">
          No story threads yet. Add threads from the Arc Grid view.
        </p>
      )}
    </div>
  )
}
