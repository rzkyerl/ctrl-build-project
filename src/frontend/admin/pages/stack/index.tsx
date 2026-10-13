import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface Stack {
  _id: string
  name: string
  slug: { current: string }
  description?: string
  iconUrl?: string
}

const StackList: React.FC = () => {
  const [stacks, setStacks]       = useState<Stack[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [deleteId, setDeleteId]   = useState<string | null>(null)
  const [deleting, setDeleting]   = useState(false)

  const fetchStacks = async () => {
    try {
      const res = await fetch('/api/stacks')
      if (!res.ok) throw new Error('Network response was not ok')
      const result = await res.json()
      if (!result.success) throw new Error(result.error || 'Failed to load stacks.')
      setStacks(result.data)
    } catch {
      setError('Failed to load stacks.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStacks() }, [])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/stacks/${deleteId}`, { method: 'DELETE' })
      if (res.status === 409) {
        const body = await res.json().catch(() => ({ error: 'Cannot delete this technology because it is used by portfolio projects.' }))
        setError(body.error || 'Cannot delete this technology because it is used by portfolio projects.')
        setDeleteId(null)
        return
      }
      if (!res.ok) throw new Error(await res.text())
      setStacks(prev => prev.filter(s => s._id !== deleteId))
    } catch {
      setError('Failed to delete stack.')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading) return <div className="cb-stack-loading">LOADING...</div>

  return (
    <div>
      {/* Header */}
      <div className="cb-stack-page-header">
        <div>
          <h1 className="cb-stack-page-title">Tech Stacks</h1>
          <p className="cb-stack-page-subtitle">{stacks.length} stacks total</p>
        </div>
        <Link to="/admin/stacks/create" className="cb-stack-btn cb-stack-btn-primary">
          <Plus size={14} /> New Stack
        </Link>
      </div>

      {error && <div className="cb-stack-error">{error}</div>}

      {stacks.length === 0 ? (
        <div className="cb-stack-empty">
          <div className="cb-stack-empty-icon">🧱</div>
          <p className="cb-stack-empty-text">No stacks yet</p>
          <Link to="/admin/stacks/create" className="cb-stack-btn cb-stack-btn-primary">
            <Plus size={14} /> Add first stack
          </Link>
        </div>
      ) : (
        <div className="cb-stack-grid">
          {stacks.map(stack => (
            <div key={stack._id} className="cb-stack-card">
              {stack.iconUrl ? (
                <img src={stack.iconUrl} alt={stack.name} className="cb-stack-card-icon" />
              ) : (
                <div className="cb-stack-card-icon-placeholder">?</div>
              )}
              <div className="cb-stack-card-name">{stack.name}</div>
              {stack.description && (
                <div className="cb-stack-card-description">{stack.description}</div>
              )}
              <div className="cb-stack-card-slug">{stack.slug?.current}</div>
              <div className="cb-stack-card-actions">
                <Link
                  to={`/admin/stacks/${stack._id}/edit`}
                  className="cb-stack-btn cb-stack-btn-ghost cb-stack-btn-sm"
                >
                  <Pencil size={12} />
                </Link>
                <button
                  className="cb-stack-btn cb-stack-btn-danger cb-stack-btn-sm"
                  onClick={() => setDeleteId(stack._id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="cb-stack-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="cb-stack-modal" onClick={e => e.stopPropagation()}>
            <div className="cb-stack-modal-title">Delete Stack</div>
            <div className="cb-stack-modal-desc">
              Are you sure you want to delete this stack? This action cannot be undone.
            </div>
            <div className="cb-stack-modal-actions">
              <button className="cb-stack-btn cb-stack-btn-ghost" onClick={() => setDeleteId(null)}>
                Cancel
              </button>
              <button
                className="cb-stack-btn cb-stack-btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StackList
