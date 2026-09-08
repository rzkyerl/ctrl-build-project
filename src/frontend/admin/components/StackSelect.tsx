import React, { useEffect, useState } from 'react'
import { sanityClient } from '../../../backend/lib/sanity'

interface StackOption {
  _id: string
  name: string
  iconUrl?: string
}

interface StackSelectProps {
  selected: string[]
  onChange: (ids: string[], names: string[]) => void
}

export const StackSelect: React.FC<StackSelectProps> = ({ selected, onChange }) => {
  const [stacks, setStacks]   = useState<StackOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sanityClient
      .fetch<StackOption[]>(`*[_type == "stack"] | order(name asc) { _id, name, "iconUrl": icon.asset->url }`)
      .then(setStacks)
      .finally(() => setLoading(false))
  }, [])

  const toggle = (stack: StackOption) => {
    const newIds   = selected.includes(stack._id)
      ? selected.filter(s => s !== stack._id)
      : [...selected, stack._id]
    const newNames = stacks.filter(s => newIds.includes(s._id)).map(s => s.name)
    onChange(newIds, newNames)
  }

  if (loading) return <div style={{ fontSize:12, color:'var(--ad-text-muted)' }}>Loading stacks...</div>

  if (stacks.length === 0) return (
    <div style={{ fontSize:12, color:'var(--ad-text-muted)' }}>
      No stacks available.{' '}
      <a href="/admin/stacks/create" style={{ color:'var(--ad-text-dim)' }}>Add stacks first.</a>
    </div>
  )

  return (
    <div className="ad-stack-select">
      {stacks.map(stack => (
        <button
          key={stack._id}
          type="button"
          className={`ad-stack-chip${selected.includes(stack._id) ? ' selected' : ''}`}
          onClick={() => toggle(stack)}
        >
          {stack.iconUrl && <img src={stack.iconUrl} alt={stack.name} />}
          {stack.name}
        </button>
      ))}
    </div>
  )
}
