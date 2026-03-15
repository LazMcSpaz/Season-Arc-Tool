import { supabase } from './supabase'
import type {
  Project, Thread, Episode, ArcCell, Beat,
  Character, BeatCharacter, CharacterNote,
} from './types'

export async function fetchProjectData(projectId: string) {
  const [projectRes, threadsRes, episodesRes, charactersRes] = await Promise.all([
    supabase.from('project').select('*').eq('id', projectId).single(),
    supabase.from('thread').select('*').eq('project_id', projectId).order('sort_order'),
    supabase.from('episode').select('*').eq('project_id', projectId).order('number'),
    supabase.from('character').select('*').eq('project_id', projectId).order('name'),
  ])

  const project = projectRes.data as Project | null
  const threads = (threadsRes.data ?? []) as Thread[]
  const episodes = (episodesRes.data ?? []) as Episode[]
  const characters = (charactersRes.data ?? []) as Character[]

  // Fetch arc cells for all episodes in this project
  const episodeIds = episodes.map((e) => e.id)
  const arcCellsRes = episodeIds.length > 0
    ? await supabase.from('arc_cell').select('*').in('episode_id', episodeIds)
    : { data: [] }
  const arcCells = (arcCellsRes.data ?? []) as ArcCell[]

  return { project, threads, episodes, arcCells, characters }
}

export async function fetchEpisodeData(episodeId: string) {
  const [beatsRes, arcCellsRes] = await Promise.all([
    supabase.from('beat').select('*').eq('episode_id', episodeId).order('sort_order'),
    supabase.from('arc_cell').select('*').eq('episode_id', episodeId),
  ])

  const beats = (beatsRes.data ?? []) as Beat[]
  const arcCells = (arcCellsRes.data ?? []) as ArcCell[]

  // Fetch character tags and notes for these beats
  const beatIds = beats.map((b) => b.id)
  let beatCharacters: BeatCharacter[] = []
  let characterNotes: CharacterNote[] = []

  if (beatIds.length > 0) {
    const [bcRes, cnRes] = await Promise.all([
      supabase.from('beat_character').select('*').in('beat_id', beatIds),
      supabase.from('character_note').select('*').in('beat_id', beatIds),
    ])
    beatCharacters = (bcRes.data ?? []) as BeatCharacter[]
    characterNotes = (cnRes.data ?? []) as CharacterNote[]
  }

  return { beats, arcCells, beatCharacters, characterNotes }
}

export async function fetchCharacterTimeline(characterId: string) {
  const [characterRes, bcRes, notesRes] = await Promise.all([
    supabase.from('character').select('*').eq('id', characterId).single(),
    supabase.from('beat_character').select('*').eq('character_id', characterId),
    supabase.from('character_note').select('*').eq('character_id', characterId),
  ])

  const character = characterRes.data as Character | null
  const beatCharacters = (bcRes.data ?? []) as BeatCharacter[]
  const characterNotes = (notesRes.data ?? []) as CharacterNote[]

  // Fetch the actual beats for this character
  const beatIds = beatCharacters.map((bc) => bc.beat_id)
  let beats: Beat[] = []

  if (beatIds.length > 0) {
    const beatsRes = await supabase.from('beat').select('*').in('id', beatIds).order('sort_order')
    beats = (beatsRes.data ?? []) as Beat[]
  }

  return { character, beats, beatCharacters, characterNotes }
}
