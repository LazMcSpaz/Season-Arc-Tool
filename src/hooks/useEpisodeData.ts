import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { fetchEpisodeData } from '../lib/queries'
import { offlineMutation } from '../lib/offlineQueue'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { Beat, ArcCell, BeatCharacter, CharacterNote } from '../lib/types'

export function useEpisodeData(episodeId: string | undefined) {
  const [beats, setBeats] = useState<Beat[]>([])
  const [arcCells, setArcCells] = useState<ArcCell[]>([])
  const [beatCharacters, setBeatCharacters] = useState<BeatCharacter[]>([])
  const [characterNotes, setCharacterNotes] = useState<CharacterNote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!episodeId) return
    setLoading(true)
    const data = await fetchEpisodeData(episodeId)
    setBeats(data.beats)
    setArcCells(data.arcCells)
    setBeatCharacters(data.beatCharacters)
    setCharacterNotes(data.characterNotes)
    setLoading(false)
  }, [episodeId])

  useEffect(() => {
    load()
  }, [load])

  const realtimeEnabled = !loading && !!episodeId
  const episodeFilter = useMemo(
    () => episodeId ? { column: 'episode_id', value: episodeId } : null,
    [episodeId]
  )

  // Realtime: beats
  useRealtimeSubscription<Beat>('beat', episodeFilter, {
    onInsert: (row) => setBeats((prev) =>
      prev.some((b) => b.id === row.id) ? prev : [...prev, row].sort((a, b) => a.sort_order - b.sort_order)
    ),
    onUpdate: (row) => setBeats((prev) => prev.map((b) => (b.id === row.id ? row : b))),
    onDelete: (old) => setBeats((prev) => prev.filter((b) => b.id !== old.id)),
  }, realtimeEnabled)

  // Realtime: beat_character (unfiltered, match client-side)
  useRealtimeSubscription<BeatCharacter>('beat_character', null, {
    onInsert: (row) => {
      if (beats.some((b) => b.id === row.beat_id)) {
        setBeatCharacters((prev) =>
          prev.some((bc) => bc.beat_id === row.beat_id && bc.character_id === row.character_id)
            ? prev : [...prev, row]
        )
      }
    },
    onDelete: (old) => setBeatCharacters((prev) =>
      prev.filter((bc) => !(bc.beat_id === old.beat_id && bc.character_id === old.character_id))
    ),
  }, realtimeEnabled)

  // Realtime: character_note (unfiltered, match client-side)
  useRealtimeSubscription<CharacterNote>('character_note', null, {
    onInsert: (row) => {
      if (beats.some((b) => b.id === row.beat_id)) {
        setCharacterNotes((prev) =>
          prev.some((cn) => cn.id === row.id) ? prev : [...prev, row]
        )
      }
    },
    onUpdate: (row) => setCharacterNotes((prev) => prev.map((cn) => (cn.id === row.id ? row : cn))),
    onDelete: (old) => setCharacterNotes((prev) => prev.filter((cn) => cn.id !== old.id)),
  }, realtimeEnabled)

  const addBeat = async (threadId: string, sortOrder: number) => {
    if (!episodeId) return
    const insertData = { episode_id: episodeId, thread_id: threadId, sort_order: sortOrder }
    const tempId = crypto.randomUUID()
    const result = await offlineMutation(
      async () => {
        const { data } = await supabase
          .from('beat')
          .insert(insertData as any)
          .select()
          .single<Beat>()
        return data
      },
      { table: 'beat', operation: 'insert', data: { ...insertData, id: tempId } }
    )
    const data = result ?? { id: tempId, ...insertData, label: 'Beat' as const, text: '', created_at: new Date().toISOString() } as Beat
    setBeats((prev) => [...prev, data].sort((a, b) => a.sort_order - b.sort_order))
    return data
  }

  const updateBeat = async (id: string, updates: Partial<Beat>) => {
    setBeats((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
    await offlineMutation(
      () => supabase.from('beat').update(updates as any).eq('id', id) as any,
      { table: 'beat', operation: 'update', data: updates, match: { id } }
    )
  }

  const deleteBeat = async (id: string) => {
    setBeats((prev) => prev.filter((b) => b.id !== id))
    setBeatCharacters((prev) => prev.filter((bc) => bc.beat_id !== id))
    setCharacterNotes((prev) => prev.filter((cn) => cn.beat_id !== id))
    await offlineMutation(
      () => supabase.from('beat').delete().eq('id', id) as any,
      { table: 'beat', operation: 'delete', match: { id } }
    )
  }

  const tagCharacter = async (beatId: string, characterId: string) => {
    const insertData = { beat_id: beatId, character_id: characterId }
    const result = await offlineMutation(
      async () => {
        const { data } = await supabase
          .from('beat_character')
          .insert(insertData as any)
          .select()
          .single<BeatCharacter>()
        return data
      },
      { table: 'beat_character', operation: 'insert', data: insertData }
    )
    const data = result ?? { ...insertData, created_at: new Date().toISOString() } as BeatCharacter
    setBeatCharacters((prev) => [...prev, data])
  }

  const untagCharacter = async (beatId: string, characterId: string) => {
    setBeatCharacters((prev) =>
      prev.filter((bc) => !(bc.beat_id === beatId && bc.character_id === characterId))
    )
    await offlineMutation(
      () => supabase.from('beat_character').delete().eq('beat_id', beatId).eq('character_id', characterId) as any,
      { table: 'beat_character', operation: 'delete', match: { beat_id: beatId, character_id: characterId } }
    )
  }

  return {
    beats, arcCells, beatCharacters, characterNotes, loading,
    addBeat, updateBeat, deleteBeat, tagCharacter, untagCharacter,
    reload: load,
  }
}
