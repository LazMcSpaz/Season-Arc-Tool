import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineIndicator() {
  const { online, pendingCount, syncing } = useOnlineStatus()

  if (online && pendingCount === 0) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-mono bg-surface border-border shadow-lg">
      {!online ? (
        <>
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="text-red-400">OFFLINE</span>
          {pendingCount > 0 && (
            <span className="text-text-muted">
              {pendingCount} pending
            </span>
          )}
        </>
      ) : syncing ? (
        <>
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-yellow-400">SYNCING...</span>
        </>
      ) : pendingCount > 0 ? (
        <>
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-yellow-400">{pendingCount} pending</span>
        </>
      ) : null}
    </div>
  )
}
