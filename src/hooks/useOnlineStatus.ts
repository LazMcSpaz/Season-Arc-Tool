import { useState, useEffect, useCallback } from 'react'
import { flushQueue, getQueueLength } from '../lib/offlineQueue'

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(getQueueLength)
  const [syncing, setSyncing] = useState(false)

  const syncQueue = useCallback(async () => {
    if (!navigator.onLine || syncing) return
    const count = getQueueLength()
    if (count === 0) return
    setSyncing(true)
    await flushQueue()
    setPendingCount(getQueueLength())
    setSyncing(false)
  }, [syncing])

  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      syncQueue()
    }
    const goOffline = () => setOnline(false)
    const queueChanged = () => setPendingCount(getQueueLength())

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    window.addEventListener('offline-queue-change', queueChanged)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('offline-queue-change', queueChanged)
    }
  }, [syncQueue])

  return { online, pendingCount, syncing, syncQueue }
}
