import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, X } from 'lucide-react'
import { sanityClient }          from '../../../../backend/lib/sanity'
import { FeatureList, Feature }  from '../../components/FeatureList'
import { StackSelect }           from '../../components/StackSelect'
import { PortfolioPreview }      from '../../components/PortfolioPreview'

const CATEGORIES = ['Web Development', 'Mobile Apps', 'UI/UX Design']
const toSlug = (val: string) =>
  val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

const PortfolioEdit: React.FC = () => {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileRef  = useRef<HTMLInputElement>(null)

  const [title, setTitle]               = useState('')
  const [slug, setSlug]                 = useState('')
  const [slugManual, setSlugManual]     = useState(true)
  const [category, setCategory]         = useState(CATEGORIES[0])
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [overview, setOverview]         = useState('')
  const [goals, setGoals]               = useState('')
  const [features, setFeatures]         = useState<Feature[]>([])
  const [architecture, setArchitecture] = useState('')
  const [techStack, setTechStack]       = useState<string[]>([])
  const [stackNames, setStackNames]     = useState<string[]>([])
  const [link, setLink]                 = useState('')
  const [loading, setLoading]           = useState(false)
  const [fetching, setFetching]         = useState(true)
  const [error, setError]               = useState('')

  useEffect(() => {
    if (!id) return
    sanityClient.fetch(`
      *[_type == "portfolio" && _id == $id][0] {
        _id, title, slug, category, overview, goals,
        features, architecture, link,
        "imageUrl": image.asset->url,
        "techStackIds": techStack[]->_id,
        "techStackNames": techStack[]->name
      }
    `, { id })
    .then((data: any) => {
      if (!data) return
      setTitle(data.title || '')
      setSlug(data.slug?.current || '')
      setCategory(data.category || CATEGORIES[0])
      setImagePreview(data.imageUrl || '')
      setOverview(data.overview || '')
      setGoals(data.goals || '')
      setFeatures(Array.isArray(data.features) ? data.features : [])
      setArchitecture(data.architecture || '')
      setTechStack(data.techStackIds || [])
      setStackNames(data.techStackNames || [])
      setLink(data.link || '')
    })
    .catch(() => setError('Failed to load portfolio.'))
    .finally(() => setFetching(false))
  }, [id])

  const handleImageChange = (file: File) => {
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
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

      const res = await fetch(`/api/portfolios/${id}`, { method: 'PATCH', body: formData })
      if (!res.ok) throw new Error(await res.text())
      navigate(`/admin/portfolios/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to update portfolio.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div className="ad-loading">LOADING...</div>

  return (
    <div>
      <div className="ad-page-header">
        <div>
          <h1 className="ad-page-title">Edit Portfolio</h1>
          <p className="ad-page-subtitle">{title}</p>
        </div>
      </div>

      {error && <div className="ad-error">{error}</div>}

      <div className="ad-split">
        {/* Form Panel */}
        <div className="ad-split-panel">
          <div className="ad-split-panel-header">Form</div>
          <div className="ad-split-panel-body">
            <form className="ad-form" onSubmit={handleSubmit} id="portfolio-edit-form">

              <div className="ad-field">
                <label className="ad-label">Title *</label>
                <input className="ad-input" value={title}
                  onChange={e => { setTitle(e.target.value); if (!slugManual) setSlug(toSlug(e.target.value)) }} required />
              </div>

              <div className="ad-field">
                <label className="ad-label">Slug *</label>
                <input className="ad-input" value={slug}
                  onChange={e => { setSlug(toSlug(e.target.value)); setSlugManual(true) }} required />
                <span className="ad-input-hint">URL: /projects/{slug}</span>
              </div>

              <div className="ad-field">
                <label className="ad-label">Category *</label>
                <select className="ad-select" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div className="ad-field">
                <label className="ad-label">Main Image</label>
                {imagePreview ? (
                  <div style={{ position:'relative', display:'inline-block' }}>
                    <img src={imagePreview} alt="Preview" className="ad-upload-preview" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview('') }}
                      style={{ position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#fff' }}>
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="ad-upload-zone" onClick={() => fileRef.current?.click()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleImageChange(f) }}
                    onDragOver={e => e.preventDefault()}>
                    <Upload size={20} style={{ color:'var(--ad-text-muted)', margin:'0 auto 8px', display:'block' }} />
                    <div className="ad-upload-text">Click or drag to replace image</div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleImageChange(e.target.files[0])} />
                  </div>
                )}
              </div>

              <div className="ad-field">
                <label className="ad-label">Overview</label>
                <textarea className="ad-textarea" rows={3} value={overview} onChange={e => setOverview(e.target.value)} />
              </div>

              <div className="ad-field">
                <label className="ad-label">Goals</label>
                <textarea className="ad-textarea" rows={3} value={goals} onChange={e => setGoals(e.target.value)} />
              </div>

              <div className="ad-field">
                <label className="ad-label">Features</label>
                <FeatureList features={features} onChange={setFeatures} />
              </div>

              <div className="ad-field">
                <label className="ad-label">Architecture</label>
                <textarea className="ad-textarea" rows={2} value={architecture} onChange={e => setArchitecture(e.target.value)} />
              </div>

              <div className="ad-field">
                <label className="ad-label">Tech Stack</label>
                <StackSelect
                  selected={techStack}
                  onChange={(ids, names) => { setTechStack(ids); setStackNames(names) }}
                />
              </div>

              <div className="ad-field">
                <label className="ad-label">Live URL</label>
                <input className="ad-input" type="url" placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />
              </div>
            </form>
          </div>
        </div>

        {/* Preview Panel */}
        <div style={{ position:'sticky', top:24 }}>
          <div className="ad-split-panel">
            <div className="ad-split-panel-header">
              Live Preview
              <span style={{ fontSize:10, color:'var(--ad-text-muted)' }}>updates as you type</span>
            </div>
            <div className="ad-split-panel-body">
              <PortfolioPreview data={{
                title, category, imageUrl: imagePreview,
                overview, goals, features, architecture,
                techStack: stackNames, link,
              }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
        <button type="button" className="ad-btn ad-btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
        <button type="submit" form="portfolio-edit-form" className="ad-btn ad-btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

export default PortfolioEdit
