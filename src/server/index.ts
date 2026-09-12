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

/* ─── STACKS ─── */

app.get('/api/stacks', async (req, res) => {
  try {
    const data = await sanityReadClient.fetch<Stack[]>(`
      *[_type == "stack"] | order(name asc) {
        _id, name, slug,
        "iconUrl": icon.asset->url
      }
    `)
    res.json(ok(data))
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
        _id, name, slug,
        "iconUrl": icon.asset->url
      }`,
      { id }
    )
    if (!data) return res.status(404).json(fail('Stack not found.', 404))
    res.json(ok(data))
  } catch (err: any) {
    console.error('Get stack error:', err)
    res.status(500).json(fail('Unable to load stack data from Sanity.'))
  }
})

app.post('/api/stacks', upload.single('icon'), async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { name, slug } = req.body
    if (!name || !slug) return res.status(400).json(fail('Name and slug are required.', 400))

    let iconAssetId: string | undefined
    if (req.file) {
      iconAssetId = await uploadImageToSanity(req.file)
    }

    const doc: any = {
      _type: 'stack',
      name,
      slug: { current: slug },
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

app.patch('/api/stacks/:id', upload.single('icon'), async (req, res) => {
  try {
    if (!writeToken) {
      return res.status(500).json(fail('Sanity write token is not configured.'))
    }

    const { id } = req.params
    const { name, slug } = req.body
    if (!name || !slug) return res.status(400).json(fail('Name and slug are required.', 400))

    const patch = sanityAdminClient.patch(id).set({
      name,
      slug: { current: slug },
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
    await sanityAdminClient.delete(id)
    res.status(204).end()
  } catch (err: any) {
    console.error('Delete stack error:', err)
    res.status(500).json(fail(err.message || 'Failed to delete stack.'))
  }
})

const PORT = process.env.BACKEND_PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend API running on http://localhost:${PORT}`)
})

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
  iconUrl?: string
}
