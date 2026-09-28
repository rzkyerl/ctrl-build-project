import React, { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'

interface Testimonial {
  _id: string
  author: string
  role: string
  company: string
  quote: string
}

const TestimonialList: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [feedback, setFeedback]         = useState('')

  const [modalOpen, setModalOpen]       = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [saving, setSaving]             = useState(false)
  const [formError, setFormError]       = useState('')

  const [author, setAuthor]             = useState('')
  const [role, setRole]                 = useState('')
  const [company, setCompany]           = useState('')
  const [quote, setQuote]               = useState('')

  const [deleteId, setDeleteId]         = useState<string | null>(null)
  const [deleting, setDeleting]         = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/testimonials')
      const body = await res.json()
      if (!res.ok || !body.success) throw new Error(body.error || 'Unable to load testimonials.')
      setTestimonials(body.data)
    } catch (err: any) {
      setError(err.message || 'Unable to load testimonials. Check that the local API server is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditingId(null)
    setAuthor('')
    setRole('')
    setCompany('')
    setQuote('')
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = async (t: Testimonial) => {
    setEditingId(t._id)
    setFormError('')
    setAuthor(t.author)
    setRole(t.role)
    setCompany(t.company)
    setQuote(t.quote)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingId(null)
    setFormError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedAuthor = author.trim()
    const trimmedRole = role.trim()
    const trimmedCompany = company.trim()
    const trimmedQuote = quote.trim()

    if (!trimmedAuthor || !trimmedRole || !trimmedCompany || !trimmedQuote) {
      setFormError('All fields are required.')
      return
    }

    setFormError('')
    setSaving(true)
    try {
      const payload = { author: trimmedAuthor, role: trimmedRole, company: trimmedCompany, quote: trimmedQuote }

      if (editingId) {
        const res = await fetch(`/api/testimonials/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json()
        if (!res.ok || !body.success) throw new Error(body.error || 'Failed to update testimonial.')
        setTestimonials(prev => prev.map(t => t._id === editingId ? { ...t, ...payload } : t))
        setFeedback('Testimonial updated successfully.')
      } else {
        const res = await fetch('/api/testimonials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const body = await res.json()
        if (!res.ok || !body.success) throw new Error(body.error || 'Failed to create testimonial.')
        setTestimonials(prev => [...prev, { ...payload, _id: body.data._id }])
        setFeedback('Testimonial created successfully.')
      }
      setTimeout(() => setFeedback(''), 3000)
      closeModal()
    } catch (err: any) {
      setFormError(err.message || 'Failed to save testimonial.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/testimonials/${deleteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete testimonial.')
      setTestimonials(prev => prev.filter(t => t._id !== deleteId))
      setFeedback('Testimonial deleted successfully.')
      setTimeout(() => setFeedback(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete testimonial.')
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  if (loading) return <div className="cb-testimonial-loading">LOADING...</div>

  return (
    <div>
      <div className="cb-testimonial-page-header">
        <div>
          <h1 className="cb-testimonial-page-title">Testimonials</h1>
          <p className="cb-testimonial-page-subtitle">{testimonials.length} testimonials total</p>
        </div>
        <button className="cb-testimonial-btn cb-testimonial-btn-primary" onClick={openCreate}>
          <Plus size={14} /> New Testimonial
        </button>
      </div>

      {feedback && <div className="cb-testimonial-success">{feedback}</div>}
      {error && <div className="cb-testimonial-error">{error}</div>}

      {testimonials.length === 0 ? (
        <div className="cb-testimonial-empty">
          <div className="cb-testimonial-empty-icon">💬</div>
          <p className="cb-testimonial-empty-text">No testimonials yet</p>
          <button className="cb-testimonial-btn cb-testimonial-btn-primary" onClick={openCreate}>
            <Plus size={14} /> Add first testimonial
          </button>
        </div>
      ) : (
        <div className="cb-testimonial-table-wrap">
          <table className="cb-testimonial-table">
            <thead>
              <tr>
                <th>Author</th>
                <th>Role</th>
                <th>Company</th>
                <th>Quote</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {testimonials.map(t => (
                <tr key={t._id}>
                  <td>
                    <div className="cb-testimonial-name">{t.author}</div>
                  </td>
                  <td>
                    <div className="cb-testimonial-role">{t.role}</div>
                  </td>
                  <td>
                    <div className="cb-testimonial-company">{t.company}</div>
                  </td>
                  <td>
                    <div className="cb-testimonial-quote">"{t.quote}"</div>
                  </td>
                  <td>
                    <div className="cb-testimonial-actions">
                      <button className="cb-testimonial-btn cb-testimonial-btn-ghost cb-testimonial-btn-sm" onClick={() => openEdit(t)} title="Edit">
                        <Pencil size={12} />
                      </button>
                      <button className="cb-testimonial-btn cb-testimonial-btn-danger cb-testimonial-btn-sm" onClick={() => setDeleteId(t._id)} title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="cb-testimonial-modal-overlay" onClick={closeModal}>
          <div className="cb-testimonial-modal" onClick={e => e.stopPropagation()}>
            <div className="cb-testimonial-modal-header">
              <div className="cb-testimonial-modal-title">{editingId ? 'Edit Testimonial' : 'New Testimonial'}</div>
              <button className="cb-testimonial-btn cb-testimonial-btn-ghost cb-testimonial-btn-sm" onClick={closeModal} style={{ padding: 6 }}>
                <X size={14} />
              </button>
            </div>

            <div className="cb-testimonial-modal-body">
              {formError && <div className="cb-testimonial-error" style={{ marginBottom: 16 }}>{formError}</div>}
              <form className="cb-testimonial-form" onSubmit={handleSubmit} id="testimonial-modal-form">
                <div className="cb-testimonial-field">
                  <label className="cb-testimonial-label">Author *</label>
                  <input className="cb-testimonial-input" value={author} onChange={e => setAuthor(e.target.value)} required />
                </div>

                <div className="cb-testimonial-field">
                  <label className="cb-testimonial-label">Role *</label>
                  <input className="cb-testimonial-input" value={role} onChange={e => setRole(e.target.value)} required />
                </div>

                <div className="cb-testimonial-field">
                  <label className="cb-testimonial-label">Company *</label>
                  <input className="cb-testimonial-input" value={company} onChange={e => setCompany(e.target.value)} required />
                </div>

                <div className="cb-testimonial-field">
                  <label className="cb-testimonial-label">Quote *</label>
                  <textarea className="cb-testimonial-textarea" value={quote} onChange={e => setQuote(e.target.value)} rows={4} required />
                </div>
              </form>
            </div>

            <div className="cb-testimonial-modal-actions">
              <button type="button" className="cb-testimonial-btn cb-testimonial-btn-ghost" onClick={closeModal} disabled={saving}>Cancel</button>
              <button type="submit" form="testimonial-modal-form" className="cb-testimonial-btn cb-testimonial-btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Testimonial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="cb-testimonial-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="cb-testimonial-modal" onClick={e => e.stopPropagation()}>
            <div className="cb-testimonial-modal-title">Delete Testimonial</div>
            <div className="cb-testimonial-modal-desc">
              Are you sure you want to delete this testimonial? This action cannot be undone.
            </div>
            <div className="cb-testimonial-modal-actions">
              <button className="cb-testimonial-btn cb-testimonial-btn-ghost" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
              <button className="cb-testimonial-btn cb-testimonial-btn-danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestimonialList
