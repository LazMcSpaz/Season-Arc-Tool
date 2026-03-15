import { supabase } from './supabase'
import type { Project, Thread, Episode, ArcCell, Beat, Character, BeatCharacter } from './types'

export async function exportProjectAsText(projectId: string): Promise<string> {
  // Fetch all data
  const [projectRes, threadsRes, episodesRes, charsRes] = await Promise.all([
    supabase.from('project').select('*').eq('id', projectId).single(),
    supabase.from('thread').select('*').eq('project_id', projectId).order('sort_order'),
    supabase.from('episode').select('*').eq('project_id', projectId).order('number'),
    supabase.from('character').select('*').eq('project_id', projectId).order('name'),
  ])

  const project = projectRes.data as Project | null
  const threads = (threadsRes.data ?? []) as Thread[]
  const episodes = (episodesRes.data ?? []) as Episode[]
  const characters = (charsRes.data ?? []) as Character[]

  if (!project) throw new Error('Project not found')

  const episodeIds = episodes.map((e) => e.id)
  const [arcCellsRes, beatsRes] = await Promise.all([
    episodeIds.length > 0
      ? supabase.from('arc_cell').select('*').in('episode_id', episodeIds)
      : Promise.resolve({ data: [] }),
    episodeIds.length > 0
      ? supabase.from('beat').select('*').in('episode_id', episodeIds).order('sort_order')
      : Promise.resolve({ data: [] }),
  ])

  const arcCells = (arcCellsRes.data ?? []) as ArcCell[]
  const beats = (beatsRes.data ?? []) as Beat[]

  const beatIds = beats.map((b) => b.id)
  const bcRes = beatIds.length > 0
    ? await supabase.from('beat_character').select('*').in('beat_id', beatIds)
    : { data: [] }
  const beatCharacters = (bcRes.data ?? []) as BeatCharacter[]

  const charMap = new Map(characters.map((c) => [c.id, c]))

  // Build export
  const lines: string[] = []
  lines.push(`${'='.repeat(60)}`)
  lines.push(`${project.title.toUpperCase()}`)
  lines.push(`${'='.repeat(60)}`)
  lines.push('')

  for (const episode of episodes) {
    lines.push(`${'─'.repeat(60)}`)
    lines.push(`EPISODE ${episode.number}${episode.title ? ` — ${episode.title}` : ''}`)
    lines.push(`${'─'.repeat(60)}`)

    if (episode.thematic_link) {
      lines.push(`Thematic Link: ${episode.thematic_link}`)
      lines.push('')
    }

    for (const thread of threads) {
      const arcCell = arcCells.find(
        (c) => c.episode_id === episode.id && c.thread_id === thread.id
      )
      const threadBeats = beats
        .filter((b) => b.episode_id === episode.id && b.thread_id === thread.id)
        .sort((a, b) => a.sort_order - b.sort_order)

      if (!arcCell?.content && threadBeats.length === 0) continue

      lines.push(`  [${thread.name}]`)

      if (arcCell?.content) {
        lines.push(`  Arc: ${arcCell.content}`)
        lines.push('')
      }

      for (const beat of threadBeats) {
        const charIds = beatCharacters
          .filter((bc) => bc.beat_id === beat.id)
          .map((bc) => charMap.get(bc.character_id)?.name)
          .filter(Boolean)

        const charTag = charIds.length > 0 ? ` [${charIds.join(', ')}]` : ''
        lines.push(`  ${beat.label.toUpperCase()}: ${beat.text}${charTag}`)
      }

      lines.push('')
    }

    if (episode.notes) {
      lines.push(`  Notes: ${episode.notes}`)
      lines.push('')
    }
  }

  return lines.join('\n')
}

export function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
