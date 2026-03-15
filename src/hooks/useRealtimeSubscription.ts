import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RealtimeCallbacks<T> {
  onInsert?: (row: T) => void
  onUpdate?: (row: T) => void
  onDelete?: (oldRow: T) => void
}

export function useRealtimeSubscription<T extends Record<string, unknown>>(
  table: string,
  filter: { column: string; value: string } | null,
  callbacks: RealtimeCallbacks<T>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return

    const channelName = filter
      ? `${table}:${filter.column}:${filter.value}`
      : `${table}:all`

    const config: {
      event: '*'
      schema: 'public'
      table: string
      filter?: string
    } = {
      event: '*',
      schema: 'public',
      table,
    }

    if (filter) {
      config.filter = `${filter.column}=eq.${filter.value}`
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        config,
        (payload: RealtimePostgresChangesPayload<T>) => {
          if (payload.eventType === 'INSERT' && callbacks.onInsert) {
            callbacks.onInsert(payload.new as T)
          } else if (payload.eventType === 'UPDATE' && callbacks.onUpdate) {
            callbacks.onUpdate(payload.new as T)
          } else if (payload.eventType === 'DELETE' && callbacks.onDelete) {
            callbacks.onDelete(payload.old as T)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter?.column, filter?.value, enabled])
}
