import { supabase } from './supabase'

export interface QueuedMutation {
  id: string
  timestamp: number
  table: string
  operation: 'insert' | 'update' | 'delete' | 'upsert'
  data?: Record<string, any>
  match?: Record<string, string>
  onConflict?: string
  /** The record's updated_at at the time the edit was made (for conflict detection) */
  editedAt?: string
}

export interface Conflict {
  id: string
  mutation: QueuedMutation
  localValue: Record<string, any>
  serverValue: Record<string, any>
  table: string
}

const STORAGE_KEY = 'offline_mutation_queue'
const CONFLICTS_EVENT = 'offline-conflict'

let pendingConflicts: Conflict[] = []
let conflictResolver: ((resolution: 'local' | 'server', conflictId: string) => void) | null = null

export function onConflicts(handler: (conflicts: Conflict[]) => void) {
  const listener = () => handler([...pendingConflicts])
  window.addEventListener(CONFLICTS_EVENT, listener)
  return () => window.removeEventListener(CONFLICTS_EVENT, listener)
}

export function getPendingConflicts(): Conflict[] {
  return [...pendingConflicts]
}

export function resolveConflict(conflictId: string, resolution: 'local' | 'server') {
  if (conflictResolver) conflictResolver(resolution, conflictId)
}

function loadQueue(): QueuedMutation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedMutation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
}

export function enqueue(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) {
  const queue = loadQueue()
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  })
  saveQueue(queue)
  window.dispatchEvent(new Event('offline-queue-change'))
}

export function getQueueLength(): number {
  return loadQueue().length
}

/** Tables that have an updated_at column for conflict detection */
const CONFLICT_TABLES = ['arc_cell', 'character_note', 'project']

/**
 * Fetch the current server record to check for conflicts.
 * Returns null if the record doesn't exist or the table isn't conflict-aware.
 */
async function fetchServerRecord(
  table: string,
  match: Record<string, string>
): Promise<Record<string, any> | null> {
  if (!CONFLICT_TABLES.includes(table)) return null

  try {
    let q = supabase.from(table as any).select('*') as any
    for (const [col, val] of Object.entries(match)) {
      q = q.eq(col, val)
    }
    const { data } = await q.maybeSingle()
    return data
  } catch {
    return null
  }
}

function hasConflict(
  serverRecord: Record<string, any> | null,
  editedAt: string | undefined
): boolean {
  if (!serverRecord || !editedAt) return false
  const serverTime = new Date(serverRecord.updated_at).getTime()
  const editTime = new Date(editedAt).getTime()
  return serverTime > editTime
}

/**
 * Build the match/filter object for looking up the server record.
 * For upserts, the match keys come from the onConflict columns in the data.
 */
function getMatchKeys(m: QueuedMutation): Record<string, string> | null {
  if (m.match) return m.match
  if (m.operation === 'upsert' && m.onConflict && m.data) {
    const keys: Record<string, string> = {}
    for (const col of m.onConflict.split(',')) {
      const trimmed = col.trim()
      if (m.data[trimmed]) keys[trimmed] = m.data[trimmed]
    }
    return Object.keys(keys).length > 0 ? keys : null
  }
  return null
}

async function replayOne(m: QueuedMutation): Promise<'ok' | 'conflict' | 'error'> {
  try {
    const table = supabase.from(m.table as any)

    // Check for conflicts on update/upsert operations on conflict-aware tables
    if (
      (m.operation === 'update' || m.operation === 'upsert') &&
      m.editedAt &&
      CONFLICT_TABLES.includes(m.table)
    ) {
      const matchKeys = getMatchKeys(m)
      if (matchKeys) {
        const serverRecord = await fetchServerRecord(m.table, matchKeys)
        if (hasConflict(serverRecord, m.editedAt)) {
          // Create a conflict for the user to resolve
          const conflict: Conflict = {
            id: m.id,
            mutation: m,
            localValue: m.data ?? {},
            serverValue: serverRecord!,
            table: m.table,
          }
          pendingConflicts.push(conflict)
          window.dispatchEvent(new Event(CONFLICTS_EVENT))
          return 'conflict'
        }
      }
    }

    if (m.operation === 'insert' && m.data) {
      const { error } = await table.insert(m.data as any)
      if (error) {
        // If it's a duplicate key error, the record was already created (e.g. by realtime sync)
        if (error.code === '23505') return 'ok'
        console.error('Replay insert failed:', error)
        return 'error'
      }
    } else if (m.operation === 'update' && m.data && m.match) {
      let q = table.update(m.data as any) as any
      for (const [col, val] of Object.entries(m.match)) {
        q = q.eq(col, val)
      }
      const { error } = await q
      if (error) { console.error('Replay update failed:', error); return 'error' }
    } else if (m.operation === 'delete' && m.match) {
      let q = table.delete() as any
      for (const [col, val] of Object.entries(m.match)) {
        q = q.eq(col, val)
      }
      const { error } = await q
      if (error) { console.error('Replay delete failed:', error); return 'error' }
    } else if (m.operation === 'upsert' && m.data) {
      const opts = m.onConflict ? { onConflict: m.onConflict } : undefined
      const { error } = await table.upsert(m.data as any, opts as any)
      if (error) { console.error('Replay upsert failed:', error); return 'error' }
    }
    return 'ok'
  } catch {
    return 'error'
  }
}

export async function flushQueue(): Promise<number> {
  const queue = loadQueue()
  if (queue.length === 0) return 0

  let synced = 0
  const remaining: QueuedMutation[] = []
  const conflicted: QueuedMutation[] = []

  // Set up conflict resolution handler
  const resolutionPromises = new Map<string, { resolve: (v: 'local' | 'server') => void }>()
  conflictResolver = (resolution, conflictId) => {
    const p = resolutionPromises.get(conflictId)
    if (p) p.resolve(resolution)
  }

  for (const m of queue) {
    const result = await replayOne(m)
    if (result === 'ok') {
      synced++
    } else if (result === 'conflict') {
      // Wait for user to resolve this conflict
      const resolution = await new Promise<'local' | 'server'>((resolve) => {
        resolutionPromises.set(m.id, { resolve })
      })
      resolutionPromises.delete(m.id)
      pendingConflicts = pendingConflicts.filter((c) => c.id !== m.id)
      window.dispatchEvent(new Event(CONFLICTS_EVENT))

      if (resolution === 'local') {
        // Force-apply the local version
        const forceMutation = { ...m, editedAt: undefined }
        const forceResult = await replayOne(forceMutation)
        if (forceResult === 'ok') synced++
        else remaining.push(m)
      } else {
        // Keep server version — just drop this mutation
        synced++
      }
    } else {
      remaining.push(m)
      break
    }
  }

  conflictResolver = null

  const processedCount = synced + conflicted.length + remaining.length
  const unprocessed = remaining.length > 0
    ? [...remaining, ...queue.slice(processedCount)]
    : []
  saveQueue(unprocessed)
  window.dispatchEvent(new Event('offline-queue-change'))
  return synced
}

/**
 * Wraps a Supabase mutation call. If it fails due to a network error,
 * the mutation is queued for later replay and the error is swallowed.
 */
export async function offlineMutation<T>(
  fn: () => Promise<T>,
  fallback: Omit<QueuedMutation, 'id' | 'timestamp'>
): Promise<T | null> {
  try {
    const result = await fn()
    return result
  } catch (err: any) {
    const msg = err?.message?.toLowerCase() ?? ''
    const isNetworkError =
      !navigator.onLine ||
      msg.includes('failed to fetch') ||
      msg.includes('load failed') ||
      msg.includes('networkerror') ||
      msg.includes('network request failed')

    if (isNetworkError) {
      enqueue(fallback)
      return null
    }
    throw err
  }
}
