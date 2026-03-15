import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Project } from '../lib/types'

export default function ProjectListPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    supabase
      .from('project')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setProjects(data as Project[])
        setLoading(false)
      })
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setCreating(true)
    const { data, error } = await supabase
      .from('project')
      .insert({ title: newTitle.trim() } as any)
      .select()
      .single<Project>()
    setCreating(false)
    if (data && !error) {
      navigate(`/project/${data.id}`)
    }
  }

  return (
    <div className="max-w-[860px] mx-auto p-4 sm:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-heading text-2xl text-text-primary">Projects</h1>
        <button
          onClick={signOut}
          className="text-text-muted font-mono text-sm hover:text-text-secondary transition-colors"
        >
          SIGN OUT
        </button>
      </div>

      <form onSubmit={handleCreate} className="flex gap-3 mb-8">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New project title..."
          className="flex-1 px-3 py-2 bg-surface border border-border rounded text-text-primary placeholder-text-muted focus:outline-none focus:border-border-active"
        />
        <button
          type="submit"
          disabled={creating}
          className="px-4 py-2 bg-surface-alt border border-border-active rounded text-text-primary font-mono text-sm hover:bg-border transition-colors disabled:opacity-50"
        >
          {creating ? '...' : 'CREATE'}
        </button>
      </form>

      {loading ? (
        <p className="text-text-muted font-mono text-sm">Loading...</p>
      ) : projects.length === 0 ? (
        <p className="text-text-muted text-center py-12">
          No projects yet. Create one above to get started.
        </p>
      ) : (
        <div className="space-y-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/project/${p.id}`}
              className="block p-4 bg-surface border border-border rounded hover:border-border-active transition-colors"
            >
              <h2 className="font-heading text-lg text-text-primary">{p.title}</h2>
              <p className="text-text-muted text-sm mt-1">
                {new Date(p.created_at).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
