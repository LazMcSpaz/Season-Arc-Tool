import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useProject } from '../contexts/ProjectContext'
import { exportProjectAsText, downloadText } from '../lib/export'

export default function ExportButton() {
  const { projectId } = useParams<{ projectId: string }>()
  const { project } = useProject()
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!projectId || !project) return
    setExporting(true)
    try {
      const text = await exportProjectAsText(projectId)
      const safeName = project.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
      downloadText(text, `${safeName}_export.txt`)
    } catch (err) {
      console.error('Export failed:', err)
    }
    setExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="px-3 py-1.5 border border-border rounded text-text-muted font-mono text-xs hover:text-text-secondary hover:border-border-active transition-colors disabled:opacity-50"
    >
      {exporting ? '...' : 'EXPORT'}
    </button>
  )
}
