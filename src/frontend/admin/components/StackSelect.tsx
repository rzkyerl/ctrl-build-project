import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface StackOption {
  _id: string
  name: string
  iconUrl?: string
}

interface StackSelectProps {
  selected: string[]
  onChange: (ids: string[], names: string[]) => void
  onCreate?: () => void
  refreshKey?: number
}

export const StackSelect: React.FC<StackSelectProps> = ({ selected, onChange, onCreate, refreshKey }) => {
  const [stacks, setStacks]   = useState<StackOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')
  const [retries, setRetries] = useState(0)

  const fetchStacks = () => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetch('/api/stacks')
      .then(res => res.json())
      .then(body => {
        if (!cancelled) {
          if (!body.success) throw new Error(body.error || 'Unable to load stacks.')
          setStacks(body.data || [])
          setLoading(false)
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Failed to load stacks.')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }

  useEffect(() => {
    const cleanup = fetchStacks()
    return cleanup
  }, [refreshKey, retries])

  const retry = () => {
    setRetries(v => v + 1)
  }

  const toggle = (stack: StackOption) => {
    const newIds = selected.includes(stack._id)
      ? selected.filter(s => s !== stack._id)
      : [...selected, stack._id]
    const newNames = stacks.filter(s => newIds.includes(s._id)).map(s => s.name)
    onChange(newIds, newNames)
  }

  const remove = (id: string) => {
    const newIds = selected.filter(s => s !== id)
    const newNames = stacks.filter(s => newIds.includes(s._id)).map(s => s.name)
    onChange(newIds, newNames)
  }

  if (loading) return <div style={{ fontSize:12, color:'var(--ad-text-muted)' }}>Loading stacks...</div>

  if (error) return (
    <div style={{ fontSize:12, color:'var(--ad-text-muted)' }}>
      {error} 
      <button type="button" onClick={retry} style={{ color:'var(--ad-text-dim)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Retry</button>
    </div>
  )

  const filtered = stacks.filter(s => s.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="cb-portfolio-stack-field">
      {stacks.length > 0 && (
        <input
          className="cb-portfolio-input"
          placeholder="Search technologies..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 10 }}
        />
      )}

      {selected.length > 0 && (
        <div className="cb-portfolio-stack-selected" style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:10 }}>
          {selected.map(id => {
            const stack = stacks.find(s => s._id === id)
            if (!stack) return null
            return (
              <span key={id} className="cb-portfolio-stack-chip selected" style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                {stack.iconUrl && <img src={stack.iconUrl} alt={stack.name} />}
                {stack.name}
                <button type="button" onClick={() => remove(id)} style={{ background:'none', border:'none', color:'inherit', cursor:'pointer', padding:0, display:'flex', alignItems:'center' }}>
                  <X size={12} />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {stacks.length === 0 ? (
        <div style={{ fontSize:12, color:'var(--ad-text-muted)' }}>
          No stacks available.{' '}
          <button type="button" onClick={onCreate} style={{ color:'var(--ad-text-dim)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Create your first stack.</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ fontSize:12, color:'var(--ad-text-muted)' }}>No stacks match your search.</div>
      ) : (
        <div className="cb-portfolio-stack-select">
          {filtered.map(stack => (
            <button
              key={stack._id}
              type="button"
              className={`cb-portfolio-stack-chip${selected.includes(stack._id) ? ' selected' : ''}`}
              onClick={() => toggle(stack)}
            >
              {stack.iconUrl && <img src={stack.iconUrl} alt={stack.name} />}
              {stack.name}
            </button>
          ))}
        </div>
      )}

      {stacks.length > 0 && (
        <button type="button" className="cb-portfolio-btn cb-portfolio-btn-ghost cb-portfolio-btn-sm" onClick={onCreate} style={{ marginTop:10 }}>
          + Create New Stack
        </button>
      )}
    </div>
  )
}
