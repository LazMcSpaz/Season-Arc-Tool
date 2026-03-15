import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import { fetchCharacterTimeline } from '../lib/queries'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import type { Character, Beat, BeatCharacter, CharacterNote } from '../lib/types'

export function useCharacterTimeline(characterId: string | undefined) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [beats, setBeats] = useState<Beat[]>([])
  const [beatCharacters, setBeatCharacters] = useState<BeatCharacter[]>([])
  const [characterNotes, setCharacterNotes] = useState<CharacterNote[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!characterId) return
    setLoading(true)
    const data = await fetchCharacterTimeline(characterId)
    setCharacter(data.character)
    setBeats(data.beats)
    setBeatCharacters(data.beatCharacters)
    setCharacterNotes(data.characterNotes)
    setLoading(false)
  }, [characterId])

  useEffect(() => {
    load()
  }, [load])

  const realtimeEnabled = !loading && !!characterId
  const charFilter = useMemo(
    () => characterId ? { column: 'character_id', value: characterId } : null,
    [characterId]
  )

  // Realtime: character_note for this character
  useRealtimeSubscription<CharacterNote>('character_note', charFilter, {
    onInsert: (row) => setCharacterNotes((prev) =>
      prev.some((cn) => cn.id === row.id) ? prev : [...prev, row]
    ),
    onUpdate: (row) => setCharacterNotes((prev) => prev.map((cn) => (cn.id === row.id ? row : cn))),
    onDelete: (old) => setCharacterNotes((prev) => prev.filter((cn) => cn.id !== old.id)),
  }, realtimeEnabled)

  // Realtime: beat_character for this character (new tags / removals)
  useRealtimeSubscription<BeatCharacter>('beat_character', charFilter, {
    onInsert: (row) => {
      setBeatCharacters((prev) =>
        prev.some((bc) => bc.beat_id === row.beat_id && bc.character_id === row.character_id)
          ? prev : [...prev, row]
      )
      // Re-fetch to get the new beat data
      load()
    },
    onDelete: (old) => {
      setBeatCharacters((prev) =>
        prev.filter((bc) => !(bc.beat_id === old.beat_id && bc.character_id === old.character_id))
      )
      setBeats((prev) => prev.filter((b) => b.id !== old.beat_id))
    },
  }, realtimeEnabled)

  const upsertNote = async (beatId: string, content: string) => {
    if (!characterId) return
    const { data } = await supabase
      .from('character_note')
      .upsert(
        { character_id: characterId, beat_id: beatId, content } as any,
        { onConflict: 'character_id,beat_id' }
      )
      .select()
      .single<CharacterNote>()
    if (data) {
      setCharacterNotes((prev) => {
        const idx = prev.findIndex(
          (n) => n.character_id === characterId && n.beat_id === beatId
        )
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = data
          return next
        }
        return [...prev, data]
      })
    }
  }

  const updateCharacter = async (updates: Partial<Character>) => {
    if (!characterId) return
    await supabase.from('character').update(updates as any).eq('id', characterId)
    setCharacter((prev) => (prev ? { ...prev, ...updates } : prev))
  }

  return {
    character, beats, beatCharacters, characterNotes, loading,
    upsertNote, updateCharacter,
    reload: load,
  }
}
