import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { fetchProjectData } from '../lib/queries'
import { offlineMutation } from '../lib/offlineQueue'
import { useRealtimeSubscription } from '../hooks/useRealtimeSubscription'
import type { Project, Thread, Episode, ArcCell, Character } from '../lib/types'

interface ProjectContextValue {
  project: Project | null
  threads: Thread[]
  episodes: Episode[]
  arcCells: ArcCell[]
  characters: Character[]
  loading: boolean

  // Mutations
  addEpisode: (number: number) => Promise<Episode | null>
  addThread: (name: string, color: string) => Promise<Thread | null>
  addCharacter: (name: string, color: string) => Promise<Character | null>
  updateArcCell: (episodeId: string, threadId: string, content: string) => Promise<void>
  updateEpisode: (id: string, updates: Partial<Episode>) => Promise<void>
  updateThread: (id: string, updates: Partial<Thread>) => Promise<void>
  updateCharacter: (id: string, updates: Partial<Character>) => Promise<void>
  deleteThread: (id: string) => Promise<void>
  deleteEpisode: (id: string) => Promise<void>
  deleteCharacter: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [threads, setThreads] = useState<Thread[]>([])
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [arcCells, setArcCells] = useState<ArcCell[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    const data = await fetchProjectData(projectId)
    setProject(data.project)
    setThreads(data.threads)
    setEpisodes(data.episodes)
    setArcCells(data.arcCells)
    setCharacters(data.characters)
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    load()
  }, [load])

  const realtimeEnabled = !loading && !!projectId
  const projectFilter = useMemo(
    () => projectId ? { column: 'project_id', value: projectId } : null,
    [projectId]
  )

  // Realtime: threads
  useRealtimeSubscription<Thread>('thread', projectFilter, {
    onInsert: (row) => setThreads((prev) =>
      prev.some((t) => t.id === row.id) ? prev : [...prev, row]
    ),
    onUpdate: (row) => setThreads((prev) => prev.map((t) => (t.id === row.id ? row : t))),
    onDelete: (old) => setThreads((prev) => prev.filter((t) => t.id !== old.id)),
  }, realtimeEnabled)

  // Realtime: episodes
  useRealtimeSubscription<Episode>('episode', projectFilter, {
    onInsert: (row) => setEpisodes((prev) =>
      prev.some((e) => e.id === row.id) ? prev : [...prev, row].sort((a, b) => a.number - b.number)
    ),
    onUpdate: (row) => setEpisodes((prev) => prev.map((e) => (e.id === row.id ? row : e))),
    onDelete: (old) => setEpisodes((prev) => prev.filter((e) => e.id !== old.id)),
  }, realtimeEnabled)

  // Realtime: characters
  useRealtimeSubscription<Character>('character', projectFilter, {
    onInsert: (row) => setCharacters((prev) =>
      prev.some((c) => c.id === row.id) ? prev : [...prev, row].sort((a, b) => a.name.localeCompare(b.name))
    ),
    onUpdate: (row) => setCharacters((prev) => prev.map((c) => (c.id === row.id ? row : c))),
    onDelete: (old) => setCharacters((prev) => prev.filter((c) => c.id !== old.id)),
  }, realtimeEnabled)

  // Realtime: arc_cells (no project_id column, subscribe unfiltered)
  useRealtimeSubscription<ArcCell>('arc_cell', null, {
    onInsert: (row) => setArcCells((prev) =>
      prev.some((c) => c.id === row.id) ? prev : [...prev, row]
    ),
    onUpdate: (row) => setArcCells((prev) => prev.map((c) => (c.id === row.id ? row : c))),
    onDelete: (old) => setArcCells((prev) => prev.filter((c) => c.id !== old.id)),
  }, realtimeEnabled)

  const addEpisode = async (number: number): Promise<Episode | null> => {
    if (!projectId) return null
    const insertData = { project_id: projectId, number }
    const tempId = crypto.randomUUID()
    const result = await offlineMutation(
      async () => {
        const { data } = await supabase
          .from('episode')
          .insert(insertData as any)
          .select()
          .single<Episode>()
        return data
      },
      { table: 'episode', operation: 'insert', data: { ...insertData, id: tempId } }
    )
    const data = result ?? { id: tempId, ...insertData, title: '', created_at: new Date().toISOString() } as Episode
    setEpisodes((prev) => [...prev, data].sort((a, b) => a.number - b.number))
    // Create empty arc cells for all threads
    if (threads.length > 0) {
      const cells = threads.map((t) => ({
        episode_id: data.id,
        thread_id: t.id,
        content: '',
      }))
      const cellResult = await offlineMutation(
        async () => {
          const { data: newCells } = await supabase
            .from('arc_cell')
            .insert(cells as any)
            .select()
          return newCells as ArcCell[]
        },
        { table: 'arc_cell', operation: 'insert', data: cells }
      )
      if (cellResult) {
        setArcCells((prev) => [...prev, ...cellResult])
      } else {
        // Offline: add temp arc cells to local state
        const tempCells = cells.map((c) => ({ ...c, id: crypto.randomUUID(), updated_at: new Date().toISOString() })) as ArcCell[]
        setArcCells((prev) => [...prev, ...tempCells])
      }
    }
    return data
  }

  const addThread = async (name: string, color: string): Promise<Thread | null> => {
    if (!projectId) return null
    const sortOrder = threads.length
    const insertData = { project_id: projectId, name, color, sort_order: sortOrder }
    const tempId = crypto.randomUUID()
    const result = await offlineMutation(
      async () => {
        const { data } = await supabase
          .from('thread')
          .insert(insertData as any)
          .select()
          .single<Thread>()
        return data
      },
      { table: 'thread', operation: 'insert', data: { ...insertData, id: tempId } }
    )
    const data = result ?? { id: tempId, ...insertData, created_at: new Date().toISOString() } as Thread
    setThreads((prev) => [...prev, data])
    // Create empty arc cells for all episodes
    if (episodes.length > 0) {
      const cells = episodes.map((e) => ({
        episode_id: e.id,
        thread_id: data.id,
        content: '',
      }))
      const cellResult = await offlineMutation(
        async () => {
          const { data: newCells } = await supabase
            .from('arc_cell')
            .insert(cells as any)
            .select()
          return newCells as ArcCell[]
        },
        { table: 'arc_cell', operation: 'insert', data: cells }
      )
      if (cellResult) {
        setArcCells((prev) => [...prev, ...cellResult])
      } else {
        const tempCells = cells.map((c) => ({ ...c, id: crypto.randomUUID(), updated_at: new Date().toISOString() })) as ArcCell[]
        setArcCells((prev) => [...prev, ...tempCells])
      }
    }
    return data
  }

  const addCharacter = async (name: string, color: string): Promise<Character | null> => {
    if (!projectId) return null
    const insertData = { project_id: projectId, name, color }
    const tempId = crypto.randomUUID()
    const result = await offlineMutation(
      async () => {
        const { data } = await supabase
          .from('character')
          .insert(insertData as any)
          .select()
          .single<Character>()
        return data
      },
      { table: 'character', operation: 'insert', data: { ...insertData, id: tempId } }
    )
    const data = result ?? { id: tempId, ...insertData, arc_summary: '', created_at: new Date().toISOString() } as Character
    setCharacters((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  const updateArcCell = async (episodeId: string, threadId: string, content: string) => {
    const upsertData = { episode_id: episodeId, thread_id: threadId, content }
    const existing = arcCells.find((c) => c.episode_id === episodeId && c.thread_id === threadId)
    await offlineMutation(
      async () => {
        const { data } = await supabase
          .from('arc_cell')
          .upsert(upsertData as any, { onConflict: 'episode_id,thread_id' })
          .select()
          .single<ArcCell>()
        if (data) {
          setArcCells((prev) => {
            const idx = prev.findIndex((c) => c.episode_id === episodeId && c.thread_id === threadId)
            if (idx >= 0) {
              const next = [...prev]
              next[idx] = data
              return next
            }
            return [...prev, data]
          })
        }
        return data
      },
      { table: 'arc_cell', operation: 'upsert', data: upsertData, onConflict: 'episode_id,thread_id', editedAt: existing?.updated_at }
    )
    // Optimistic update for offline case
    setArcCells((prev) => {
      const idx = prev.findIndex((c) => c.episode_id === episodeId && c.thread_id === threadId)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], content }
        return next
      }
      return prev
    })
  }

  const updateEpisode = async (id: string, updates: Partial<Episode>) => {
    setEpisodes((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)))
    await offlineMutation(
      () => supabase.from('episode').update(updates as any).eq('id', id) as any,
      { table: 'episode', operation: 'update', data: updates, match: { id } }
    )
  }

  const updateThread = async (id: string, updates: Partial<Thread>) => {
    setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
    await offlineMutation(
      () => supabase.from('thread').update(updates as any).eq('id', id) as any,
      { table: 'thread', operation: 'update', data: updates, match: { id } }
    )
  }

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    await offlineMutation(
      () => supabase.from('character').update(updates as any).eq('id', id) as any,
      { table: 'character', operation: 'update', data: updates, match: { id } }
    )
  }

  const deleteThread = async (id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id))
    setArcCells((prev) => prev.filter((c) => c.thread_id !== id))
    await offlineMutation(
      () => supabase.from('thread').delete().eq('id', id) as any,
      { table: 'thread', operation: 'delete', match: { id } }
    )
  }

  const deleteEpisode = async (id: string) => {
    setEpisodes((prev) => prev.filter((e) => e.id !== id))
    setArcCells((prev) => prev.filter((c) => c.episode_id !== id))
    await offlineMutation(
      () => supabase.from('episode').delete().eq('id', id) as any,
      { table: 'episode', operation: 'delete', match: { id } }
    )
  }

  const deleteCharacter = async (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
    await offlineMutation(
      () => supabase.from('character').delete().eq('id', id) as any,
      { table: 'character', operation: 'delete', match: { id } }
    )
  }

  return (
    <ProjectContext.Provider value={{
      project, threads, episodes, arcCells, characters, loading,
      addEpisode, addThread, addCharacter,
      updateArcCell, updateEpisode, updateThread, updateCharacter,
      deleteThread, deleteEpisode, deleteCharacter,
      reload: load,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used within ProjectProvider')
  return ctx
}
