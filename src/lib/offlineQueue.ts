import { supabase } from './supabase'

export interface QueuedMutation {
  id: string
  timestamp: number
  table: string
  operation: 'insert' | 'update' | 'delete' | 'upsert'
  data?: Record<string, any>
  match?: Record<string, string>
  onConflict?: string
}

const STORAGE_KEY = 'offline_mutation_queue'

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

async function replayOne(m: QueuedMutation): Promise<boolean> {
  try {
    const table = supabase.from(m.table as any)

    if (m.operation === 'insert' && m.data) {
      const { error } = await table.insert(m.data as any)
      if (error) { console.error('Replay insert failed:', error); return false }
    } else if (m.operation === 'update' && m.data && m.match) {
      let q = table.update(m.data as any) as any
      for (const [col, val] of Object.entries(m.match)) {
        q = q.eq(col, val)
      }
      const { error } = await q
      if (error) { console.error('Replay update failed:', error); return false }
    } else if (m.operation === 'delete' && m.match) {
      let q = table.delete() as any
      for (const [col, val] of Object.entries(m.match)) {
        q = q.eq(col, val)
      }
      const { error } = await q
      if (error) { console.error('Replay delete failed:', error); return false }
    } else if (m.operation === 'upsert' && m.data) {
      const opts = m.onConflict ? { onConflict: m.onConflict } : undefined
      const { error } = await table.upsert(m.data as any, opts as any)
      if (error) { console.error('Replay upsert failed:', error); return false }
    }
    return true
  } catch {
    return false
  }
}

export async function flushQueue(): Promise<number> {
  const queue = loadQueue()
  if (queue.length === 0) return 0

  let synced = 0
  const remaining: QueuedMutation[] = []

  for (const m of queue) {
    const ok = await replayOne(m)
    if (ok) {
      synced++
    } else {
      remaining.push(m)
      // If one fails due to network, keep the rest too
      break
    }
  }

  // Keep unprocessed items
  const unprocessed = remaining.length > 0
    ? [...remaining, ...queue.slice(synced + remaining.length)]
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
