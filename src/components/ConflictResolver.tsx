import { useState, useEffect } from 'react'
import { onConflicts, resolveConflict, type Conflict } from '../lib/offlineQueue'

/** Human-friendly labels for tables */
const TABLE_LABELS: Record<string, string> = {
  arc_cell: 'Arc Cell',
  character_note: 'Character Note',
  project: 'Project',
}

/** Which field holds the main content for each conflict-aware table */
const CONTENT_FIELD: Record<string, string> = {
  arc_cell: 'content',
  character_note: 'content',
  project: 'title',
}

function ConflictCard({ conflict }: { conflict: Conflict }) {
  const contentField = CONTENT_FIELD[conflict.table] ?? 'content'
  const localContent = conflict.localValue[contentField] ?? ''
  const serverContent = conflict.serverValue[contentField] ?? ''
  const label = TABLE_LABELS[conflict.table] ?? conflict.table

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-3 max-w-md w-full">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <h3 className="font-mono text-sm text-text-primary">
          CONFLICT — {label}
        </h3>
      </div>

      <p className="text-text-muted text-xs">
        This record was changed on another device while you were offline. Pick which version to keep.
      </p>

      <div className="space-y-2">
        <div className="border border-border rounded p-3">
          <span className="font-mono text-xs text-text-muted block mb-1">YOUR VERSION</span>
          <p className="text-sm text-text-primary whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {localContent || <span className="italic text-text-muted">(empty)</span>}
          </p>
        </div>

        <div className="border border-border rounded p-3">
          <span className="font-mono text-xs text-text-muted block mb-1">SERVER VERSION</span>
          <p className="text-sm text-text-primary whitespace-pre-wrap break-words max-h-32 overflow-y-auto">
            {serverContent || <span className="italic text-text-muted">(empty)</span>}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => resolveConflict(conflict.id, 'local')}
          className="flex-1 py-2.5 bg-surface-alt border border-border-active rounded text-text-primary font-mono text-xs hover:bg-border transition-colors"
        >
          KEEP MINE
        </button>
        <button
          onClick={() => resolveConflict(conflict.id, 'server')}
          className="flex-1 py-2.5 bg-surface-alt border border-border rounded text-text-secondary font-mono text-xs hover:bg-border transition-colors"
        >
          KEEP SERVER
        </button>
      </div>
    </div>
  )
}

export default function ConflictResolver() {
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  useEffect(() => {
    return onConflicts(setConflicts)
  }, [])

  if (conflicts.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <ConflictCard conflict={conflicts[0]} />
    </div>
  )
}
