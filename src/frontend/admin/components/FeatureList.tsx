import React from 'react'
import { Plus, X } from 'lucide-react'

export interface Feature {
  title: string
  desc: string
}

interface FeatureListProps {
  features: Feature[]
  onChange: (features: Feature[]) => void
}

export const FeatureList: React.FC<FeatureListProps> = ({ features, onChange }) => {
  const update = (index: number, field: keyof Feature, value: string) => {
    const next = features.map((f, i) => i === index ? { ...f, [field]: value } : f)
    onChange(next)
  }

  const add = () => onChange([...features, { title: '', desc: '' }])

  const remove = (index: number) => onChange(features.filter((_, i) => i !== index))

  return (
    <div>
      <div className="ad-feature-list">
        {features.map((feature, i) => (
          <div key={i} className="ad-feature-item">
            <input
              className="ad-input"
              placeholder="Feature title"
              value={feature.title}
              onChange={e => update(i, 'title', e.target.value)}
            />
            <input
              className="ad-input"
              placeholder="Short description"
              value={feature.desc}
              onChange={e => update(i, 'desc', e.target.value)}
            />
            <button
              type="button"
              className="ad-feature-remove"
              onClick={() => remove(i)}
              title="Remove feature"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="ad-btn ad-btn-ghost ad-btn-sm"
        style={{ marginTop: 8 }}
        onClick={add}
      >
        <Plus size={12} /> Add Feature
      </button>
    </div>
  )
}
