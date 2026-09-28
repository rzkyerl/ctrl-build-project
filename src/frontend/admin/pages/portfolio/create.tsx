import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import { FeatureList, Feature } from '../../components/FeatureList'
import { StackSelect } from '../../components/StackSelect'
import { PortfolioPreview } from '../../components/PortfolioPreview'

const CATEGORIES = ['Web Development', 'Mobile Apps', 'UI/UX Design']

const toSlug = (val: string) =>
  val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const PortfolioCreate: React.FC = () => {
  const navigate = useNavigate()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [title, setTitle]               = useState('')
  const [slug, setSlug]                 = useState('')
  const [slugManual, setSlugManual]     = useState(false)
  const [category, setCategory]         = useState(CATEGORIES[0])
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [overview, setOverview]         = useState('')
  const [goals, setGoals]               = useState('')
  const [features, setFeatures]         = useState<Feature[]>([{ title: '', desc: '' }])
  const [architecture, setArchitecture] = useState('')
  const [techStack, setTechStack]       = useState<string[]>([])
  const [stackNames, setStackNames]     = useState<string[]>([])
  const [link, setLink]                 = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  const [showCreateStack, setShowCreateStack] = useState(false)
  const [creatingStack, setCreatingStack]     = useState(false)
  const [stackName, setStackName]             = useState('')
  const [stackSlug, setStackSlug]             = useState('')
  const [stackSlugManual, setStackSlugManual] = useState(false)
  const [stackDescription, setStackDescription] = useState('')
  const [stackIconFile, setStackIconFile]     = useState<File | null>(null)
  const [stackIconPreview, setStackIconPreview] = useState('')
  const [createStackError, setCreateStackError] = useState('')
  const [stacksRefreshed, setStacksRefreshed]   = useState(0)

  const stackFileRef = useRef<HTMLInputElement>(null)

  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!slugManual) setSlug(toSlug(val))
  }

  const handleImageChange = (file: File) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const openCreateStack = () => {
    setShowCreateStack(true)
    setStackName('')
    setStackSlug('')
    setStackSlugManual(false)
    setStackDescription('')
    setStackIconFile(null)
    setStackIconPreview('')
    setCreateStackError('')
  }

  const closeCreateStack = () => {
    setShowCreateStack(false)
    setStacksRefreshed(v => v + 1)
  }

  const handleStackIconChange = (file: File) => {
    setStackIconFile(file)
    setStackIconPreview(URL.createObjectURL(file))
  }

  const handleCreateStack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stackName || !stackSlug) return setCreateStackError('Name and slug are required.')
    setCreateStackError('')
    setCreatingStack(true)
    try {
      const formData = new FormData()
      formData.append('name', stackName)
      formData.append('slug', stackSlug)
      if (stackDescription) formData.append('description', stackDescription)
      if (stackIconFile) formData.append('icon', stackIconFile)

      const res = await fetch('/api/stacks', { method: 'POST', body: formData })
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error || 'Failed to create stack.')

      const newId = body.data?._id
      if (newId && !techStack.includes(newId)) {
        setTechStack(prev => [...prev, newId])
        setStackNames(prev => [...prev, stackName])
      }
      closeCreateStack()
    } catch (err: any) {
      setCreateStackError(err.message || 'Failed to create stack.')
    } finally {
      setCreatingStack(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !slug) return setError('Title and slug are required.')
    setError('')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('title',        title)
      formData.append('slug',         slug)
      formData.append('category',     category)
      formData.append('overview',     overview)
      formData.append('goals',        goals)
      formData.append('features',     JSON.stringify(features.filter(f => f.title)))
      formData.append('architecture', architecture)
      formData.append('techStack',    JSON.stringify(techStack))
      formData.append('link',         link)
      if (imageFile) formData.append('image', imageFile)

      const res = await fetch('/api/portfolios', { method: 'POST', body: formData })
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error || 'Failed to create portfolio.')
      navigate('/admin/portfolios')
    } catch (err: any) {
      setError(err.message || 'Failed to create portfolio.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="cb-portfolio-page-header">
        <div>
          <h1 className="cb-portfolio-page-title">New Portfolio</h1>
          <p className="cb-portfolio-page-subtitle">Fill in the details and see a live preview</p>
        </div>
      </div>

      {error && <div className="cb-portfolio-error">{error}</div>}

      <div className="cb-portfolio-split">
        {/* ── Form Panel ── */}
        <div className="cb-portfolio-split-panel">
          <div className="cb-portfolio-split-panel-header">Form</div>
          <div className="cb-portfolio-split-panel-body">
            <form className="cb-portfolio-form" onSubmit={handleSubmit} id="portfolio-create-form">

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Title *</label>
                <input className="cb-portfolio-input" placeholder="e.g. 3NT Studio" value={title} onChange={e => handleTitleChange(e.target.value)} required />
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Slug *</label>
                <input className="cb-portfolio-input" placeholder="e.g. 3nt-studio" value={slug}
                  onChange={e => { setSlug(toSlug(e.target.value)); setSlugManual(true) }} required />
                <span className="cb-portfolio-input-hint">URL: /projects/{slug || '...'}</span>
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Category *</label>
                <select className="cb-portfolio-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Main Image *</label>
                {imagePreview ? (
                  <div style={{ position:'relative', display:'block', width:'100%' }}>
                    <img src={imagePreview} alt="Preview" className="cb-portfolio-upload-preview" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview('') }}
                      style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="cb-portfolio-upload-zone" onClick={() => fileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleImageChange(f) }}
                    onDragOver={e => e.preventDefault()}>
                    <Upload size={20} style={{ color:'var(--ad-text-muted)', margin:'0 auto 8px', display:'block' }} />
                    <div className="cb-portfolio-upload-text">Click or drag image here</div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageChange(e.target.files[0])} />
                  </div>
                )}
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Overview</label>
                <textarea className="cb-portfolio-textarea" placeholder="Brief project description..." rows={3}
                  value={overview} onChange={e => setOverview(e.target.value)} />
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Goals</label>
                <textarea className="cb-portfolio-textarea" placeholder="Project goals and objectives..." rows={3}
                  value={goals} onChange={e => setGoals(e.target.value)} />
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Features</label>
                <FeatureList features={features} onChange={setFeatures} />
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Architecture</label>
                <textarea className="cb-portfolio-textarea" placeholder="Technical architecture description..." rows={2}
                  value={architecture} onChange={e => setArchitecture(e.target.value)} />
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Tech Stack</label>
                <StackSelect
                  selected={techStack}
                  onChange={(ids, names) => { setTechStack(ids); setStackNames(names) }}
                  onCreate={openCreateStack}
                  refreshKey={stacksRefreshed}
                />
              </div>

              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Live URL</label>
                <input className="cb-portfolio-input" type="url" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />
              </div>

            </form>
          </div>
        </div>

        {/* ── Preview Panel ── */}
        <div style={{ position:'sticky', top:24 }}>
          <div className="cb-portfolio-split-panel">
            <div className="cb-portfolio-split-panel-header">
              Live Preview
              <span style={{ fontSize:10, color:'var(--ad-text-muted)' }}>updates as you type</span>
            </div>
            <div className="cb-portfolio-split-panel-body">
              <PortfolioPreview data={{
                title, category, imageUrl: imagePreview,
                overview, goals, features, architecture,
                techStack: stackNames, link,
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
        <button type="button" className="cb-portfolio-btn cb-portfolio-btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
        <button type="submit" form="portfolio-create-form" className="cb-portfolio-btn cb-portfolio-btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Portfolio'}
        </button>
      </div>

      {/* Create Stack Modal */}
      {showCreateStack && (
        <div className="cb-portfolio-modal-overlay" onClick={closeCreateStack}>
          <div className="cb-portfolio-modal" onClick={e => e.stopPropagation()}>
            <div className="cb-portfolio-modal-title">Create New Stack</div>
            <div className="cb-portfolio-modal-desc">Add a new technology to the existing stack list.</div>
            {createStackError && <div className="cb-portfolio-error" style={{ marginBottom:16 }}>{createStackError}</div>}
            <form onSubmit={handleCreateStack} id="create-stack-modal-form">
              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Name *</label>
                <input className="cb-portfolio-input" value={stackName} onChange={e => { setStackName(e.target.value); if (!stackSlugManual) setStackSlug(toSlug(e.target.value)) }} required />
              </div>
              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Slug *</label>
                <input className="cb-portfolio-input" value={stackSlug} onChange={e => { setStackSlug(toSlug(e.target.value)); setStackSlugManual(true) }} required />
                <span className="cb-portfolio-input-hint">URL-safe identifier.</span>
              </div>
              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Description</label>
                <textarea className="cb-portfolio-textarea" rows={3} value={stackDescription} onChange={e => setStackDescription(e.target.value)} />
              </div>
              <div className="cb-portfolio-field">
                <label className="cb-portfolio-label">Icon</label>
                {stackIconPreview ? (
                  <div style={{ position:'relative', display:'inline-block' }}>
                    <img src={stackIconPreview} alt="Preview" style={{ width:64, height:64, objectFit:'contain', borderRadius:8, border:'1px solid var(--ad-border)', background:'var(--ad-surface2)', padding:4 }} />
                    <button type="button" onClick={() => { setStackIconFile(null); setStackIconPreview('') }}
                      style={{ position:'absolute', top:-8, right:-8, width:20, height:20, borderRadius:'50%', border:'1px solid var(--ad-border)', background:'var(--ad-surface)', color:'var(--ad-text-dim)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="cb-portfolio-upload-zone" onClick={() => stackFileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleStackIconChange(f) }}
                    onDragOver={e => e.preventDefault()}>
                    <Upload size={20} style={{ color:'var(--ad-text-muted)', margin:'0 auto 8px', display:'block' }} />
                    <div className="cb-portfolio-upload-text">Click or drag to upload icon</div>
                    <input ref={stackFileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleStackIconChange(e.target.files[0])} />
                  </div>
                )}
              </div>
              <div className="cb-portfolio-modal-actions">
                <button type="button" className="cb-portfolio-btn cb-portfolio-btn-ghost" onClick={closeCreateStack} disabled={creatingStack}>Cancel</button>
                <button type="submit" form="create-stack-modal-form" className="cb-portfolio-btn cb-portfolio-btn-primary" disabled={creatingStack}>
                  {creatingStack ? 'Creating...' : 'Create Stack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PortfolioCreate
