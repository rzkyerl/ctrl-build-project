import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { createClient } from '@sanity/client'

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const projectId = (process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'production').trim()
const writeToken = process.env.SANITY_WRITE_TOKEN

if (!projectId) {
  console.warn('[backend] VITE_SANITY_PROJECT_ID/SANITY_PROJECT_ID is not set.')
}

const sanityReadClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: writeToken,
})

const sanityAdminClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: writeToken,
})

function parseFeatures(raw: string | undefined): { title: string; desc: string }[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((f: any) => f && f.title) : []
  } catch {
    return []
  }
}

function parseIds(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id: any) => typeof id === 'string' && id) : []
  } catch {
    return []
  }
}

function getSimpleIconUrl(slug: string): string | null {
  const cleaned = slug.trim().toLowerCase()
  if (!cleaned) return null
  return `https://cdn.simpleicons.org/${cleaned}`
}

const maybeUploadIcon = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.is('multipart/form-data') || req.is('multipart')) {
    upload.single('icon')(req, res, next)
  } else {
    next()
  }
}

async function uploadImageToSanity(file: Express.Multer.File) {
  const asset = await sanityAdminClient.assets.upload('image', file.buffer, {
    filename: file.originalname,
  })
  return asset._id
}

function ok(data: any) {
  return { success: true as const, data }
}

function fail(message: string, status = 500) {
  return { success: false as const, error: message }
}

/* ─── PORTFOLIOS ─── */

app.get('/api/portfolios', async (req, res) => {
  try {
    const data = await sanityReadClient.fetch<Portfolio[]>(`
      *[_type == "portfolio"] | order(_createdAt desc) {
        _id, title, category, slug, link, _createdAt, _updatedAt,
        "imageUrl": image.asset->url
      }
    `)
    res.json(ok(data))
  } catch (err: any) {
    console.error('Get portfolios error:', err)
    res.status(500).json(fail('Unable to load portfolio data from Sanity.'))
  }
})

app.get('/api/portfolios/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const data = await sanityReadClient.fetch<Portfolio | null>(
      `*[_type == "portfolio" && slug.current == $slug][0] {
        _id, title, slug, category, overview, goals,
        features, architecture, link,
        _createdAt, _updatedAt,
        "imageUrl": image.asset->url,
        "techStack": techStack[]->{ _id, name, "iconUrl": icon.asset->url }
      }`,
      { slug }
    )
    if (!data) return res.status(404).json(fail('Portfolio not found.', 404))
    res.json(ok(data))
  } catch (err: any) {
    console.error('Get portfolio by slug error:', err)
    res.status(500).json(fail('Unable to load portfolio data from Sanity.'))
  }
})

app.get('/api/portfolios/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = await sanityReadClient.fetch<Portfolio | null>(
      `*[_type == "portfolio" && _id == $id][0] {
        _id, title, slug, category, overview, goals,
        features, architecture, link,
        _createdAt, _updatedAt,
        "imageUrl": image.asset->url,
        "techStack": techStack[]->{ _id, name, "iconUrl": icon.asset->url }
      }`,
      { id }
    )
    if (!data) return res.status(404).json(fail('Portfolio not found.', 404))
    res.json(ok(data))
  } catch (err: any) {
    console.error('Get portfolio error:', err)
    res.status(500).json(fail('Unable to load portfolio data from Sanity.'))
  }
})

app.post('/api/portfolios', upload.single('image'), async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { title, slug, category, overview, goals, features, architecture, techStack, link } = req.body
    if (!title || !slug) return res.status(400).json(fail('Title and slug are required.', 400))

    const featuresArr = parseFeatures(features)
    const techStackIds = parseIds(techStack)

    let imageAssetId: string | undefined
    if (req.file) {
      imageAssetId = await uploadImageToSanity(req.file)
    }

    const doc: any = {
      _type: 'portfolio',
      title,
      slug: { current: slug },
      category,
      overview,
      goals,
      features: featuresArr,
      architecture,
      techStack: techStackIds.map((id) => ({ _type: 'reference', _ref: id })),
      link,
    }
    if (imageAssetId) {
      doc.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } }
    }

    const created = await sanityAdminClient.create(doc)
    res.status(201).json(ok({ _id: created._id }))
  } catch (err: any) {
    console.error('Create portfolio error:', err)
    res.status(500).json(fail(err.message || 'Failed to create portfolio.'))
  }
})

app.patch('/api/portfolios/:id', upload.single('image'), async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { id } = req.params
    const { title, slug, category, overview, goals, features, architecture, techStack, link } = req.body
    if (!title || !slug) return res.status(400).json(fail('Title and slug are required.', 400))

    const featuresArr = parseFeatures(features)
    const techStackIds = parseIds(techStack)

    const patch = sanityAdminClient.patch(id).set({
      title,
      slug: { current: slug },
      category,
      overview,
      goals,
      features: featuresArr,
      architecture,
      techStack: techStackIds.map((tid) => ({ _type: 'reference', _ref: tid })),
      link,
    })

    if (req.file) {
      const imageAssetId = await uploadImageToSanity(req.file)
      patch.set({ image: { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } } })
    }

    await patch.commit()
    res.json(ok({ _id: id }))
  } catch (err: any) {
    console.error('Update portfolio error:', err)
    res.status(500).json(fail(err.message || 'Failed to update portfolio.'))
  }
})

app.delete('/api/portfolios/:id', async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { id } = req.params
    await sanityAdminClient.delete(id)
    res.status(204).end()
  } catch (err: any) {
    console.error('Delete portfolio error:', err)
    res.status(500).json(fail(err.message || 'Failed to delete portfolio.'))
  }
})

app.get('/api/images', async (req, res) => {
  const target = typeof req.query.url === 'string' ? req.query.url : ''
  if (!target) return res.status(400).json(fail('url query parameter is required.', 400))

  let parsed
  try {
    parsed = new URL(target)
  } catch {
    return res.status(400).json(fail('Invalid image URL.', 400))
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json(fail('Unsupported protocol.', 400))
  }

  try {
    const response = await fetch(target, { signal: req.signal })
    if (!response.ok) {
      return res.status(502).json(fail('Upstream image request failed.', 502))
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    res.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream')
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Cache-Control', 'public, max-age=86400')
    res.send(buffer)
  } catch (err: any) {
    console.error('Image proxy error:', err)
    res.status(502).json(fail('Failed to load image.', 502))
  }
})

/* ─── TESTIMONIALS ─── */

app.get('/api/testimonials', async (req, res) => {
  try {
    const data = await sanityReadClient.fetch<Testimonial[]>(`
      *[_type == "testimonial"] | order(_createdAt desc) {
        _id, author, role, company, quote
      }
    `)
    res.json(ok(data))
  } catch (err: any) {
    console.error('Get testimonials error:', err)
    res.status(500).json(fail('Unable to load testimonial data from Sanity.'))
  }
})

app.get('/api/testimonials/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = await sanityReadClient.fetch<Testimonial | null>(
      `*[_type == "testimonial" && _id == $id][0] {
        _id, author, role, company, quote
      }`,
      { id }
    )
    if (!data) return res.status(404).json(fail('Testimonial not found.', 404))
    res.json(ok(data))
  } catch (err: any) {
    console.error('Get testimonial error:', err)
    res.status(500).json(fail('Unable to load testimonial data from Sanity.'))
  }
})

app.post('/api/testimonials', async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { author, role, company, quote } = req.body
    if (!author || !role || !company || !quote) {
      return res.status(400).json(fail('Author, role, company, and quote are required.', 400))
    }

    const doc: any = {
      _type: 'testimonial',
      author,
      role,
      company,
      quote,
    }

    const created = await sanityAdminClient.create(doc)
    res.status(201).json(ok({ _id: created._id }))
  } catch (err: any) {
    console.error('Create testimonial error:', err)
    res.status(500).json(fail(err.message || 'Failed to create testimonial.'))
  }
})

app.patch('/api/testimonials/:id', async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { id } = req.params
    const { author, role, company, quote } = req.body

    const patch = sanityAdminClient.patch(id).set({
      ...(author !== undefined ? { author } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(company !== undefined ? { company } : {}),
      ...(quote !== undefined ? { quote } : {}),
    })

    await patch.commit()
    res.json(ok({ _id: id }))
  } catch (err: any) {
    console.error('Update testimonial error:', err)
    res.status(500).json(fail(err.message || 'Failed to update testimonial.'))
  }
})

app.delete('/api/testimonials/:id', async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { id } = req.params
    await sanityAdminClient.delete(id)
    res.status(204).end()
  } catch (err: any) {
    console.error('Delete testimonial error:', err)
    res.status(500).json(fail(err.message || 'Failed to delete testimonial.'))
  }
})

/* ─── STACKS ─── */

app.get('/api/stacks', async (req, res) => {
  try {
    const data = await sanityReadClient.fetch<Stack[]>(`
      *[_type == "stack"] | order(name asc) {
        _id, name, slug, description, _createdAt, _updatedAt,
        "iconUrl": icon.asset->url
      }
    `)
    const stacks = data.map((stack) => ({
      ...stack,
      iconUrl: stack.iconUrl || getSimpleIconUrl(stack.slug.current),
    }))
    res.json(ok(stacks))
  } catch (err: any) {
    console.error('Get stacks error:', err)
    res.status(500).json(fail('Unable to load stack data from Sanity.'))
  }
})

app.get('/api/stacks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const data = await sanityReadClient.fetch<Stack | null>(
      `*[_type == "stack" && _id == $id][0] {
        _id, name, slug, description,
        "iconUrl": icon.asset->url
      }`,
      { id }
    )
    if (!data) return res.status(404).json(fail('Stack not found.', 404))
    const stack = {
      ...data,
      iconUrl: data.iconUrl || getSimpleIconUrl(data.slug.current),
    }
    res.json(ok(stack))
  } catch (err: any) {
    console.error('Get stack error:', err)
    res.status(500).json(fail('Unable to load stack data from Sanity.'))
  }
})

app.post('/api/stacks', maybeUploadIcon, async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { name, slug, description } = req.body
    if (!name || !slug) return res.status(400).json(fail('Name and slug are required.', 400))

    let iconAssetId: string | undefined
    if (req.file) {
      iconAssetId = await uploadImageToSanity(req.file)
    }

    const doc: any = {
      _type: 'stack',
      name,
      slug: { current: slug },
      ...(description ? { description } : {}),
    }
    if (iconAssetId) {
      doc.icon = { _type: 'image', asset: { _type: 'reference', _ref: iconAssetId } }
    }

    const created = await sanityAdminClient.create(doc)
    res.status(201).json(ok({ _id: created._id }))
  } catch (err: any) {
    console.error('Create stack error:', err)
    res.status(500).json(fail(err.message || 'Failed to create stack.'))
  }
})

app.patch('/api/stacks/:id', maybeUploadIcon, async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { id } = req.params
    const { name, slug, description } = req.body
    if (!name || !slug) return res.status(400).json(fail('Name and slug are required.', 400))

    const patch = sanityAdminClient.patch(id).set({
      name,
      slug: { current: slug },
      ...(description !== undefined ? { description } : {}),
    })

    if (req.file) {
      const iconAssetId = await uploadImageToSanity(req.file)
      patch.set({ icon: { _type: 'image', asset: { _type: 'reference', _ref: iconAssetId } } })
    }

    await patch.commit()
    res.json(ok({ _id: id }))
  } catch (err: any) {
    console.error('Update stack error:', err)
    res.status(500).json(fail(err.message || 'Failed to update stack.'))
  }
})

app.delete('/api/stacks/:id', async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { id } = req.params
    const used = await sanityReadClient.fetch<{ _id: string }[]>(
      `*[_type == "portfolio" && references($id)]{ _id }`,
      { id }
    )
    if (used.length > 0) {
      return res.status(409).json(fail('Cannot delete this technology because it is used by portfolio projects.'))
    }

    await sanityAdminClient.delete(id)
    res.status(204).end()
  } catch (err: any) {
    console.error('Delete stack error:', err)
    res.status(500).json(fail('Failed to delete stack.'))
  }
})

const PORT = process.env.BACKEND_PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`)
})

interface Testimonial {
  _id: string
  author: string
  role: string
  company: string
  quote: string
}

interface Portfolio {
  _id: string
  title: string
  category: string
  slug: { current: string }
  link?: string
  _createdAt: string
  _updatedAt: string
  imageUrl?: string
}

interface Stack {
  _id: string
  name: string
  slug: { current: string }
  description?: string | null
  iconUrl?: string
}
