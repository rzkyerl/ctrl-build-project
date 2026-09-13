import 'dotenv/config'
import { createClient } from '@sanity/client'
import https from 'https'
import http from 'http'
import fs from 'fs'
import path from 'path'

const projectId = (process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'development').trim()
const writeToken = process.env.SANITY_WRITE_TOKEN

const sanityAdminClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: writeToken,
})

const FRONTEND_STACKS = [
  { name: 'Laravel',      slug: 'laravel' },
  { name: 'React',        slug: 'react' },
  { name: 'Next.js',      slug: 'nextdotjs' },
  { name: 'SvelteKit',    slug: 'svelte' },
  { name: 'Docker',       slug: 'docker' },
  { name: 'HTML5',        slug: 'html5' },
  { name: 'CSS3',         slug: 'css' },
  { name: 'JavaScript',   slug: 'javascript' },
  { name: 'Tailwind CSS', slug: 'tailwindcss' },
  { name: 'Figma',        slug: 'figma' },
  { name: 'Node.js',      slug: 'nodedotjs' },
  { name: 'Python',       slug: 'python' },
  { name: 'PostgreSQL',   slug: 'postgresql' },
  { name: 'Sanity',       slug: 'sanity' },
  { name: 'Vercel',       slug: 'vercel' },
  { name: 'GitHub',       slug: 'github' },
  { name: 'Git',          slug: 'git' },
  { name: 'Postman',      slug: 'postman' },
  { name: 'NestJS',       slug: 'nestjs' },
  { name: 'MySQL',        slug: 'mysql' },
  { name: 'PHP',          slug: 'php' },
  { name: 'TurboRepo',    slug: 'turborepo' },
  { name: 'Vite',         slug: 'vite' },
  { name: 'Bootstrap',    slug: 'bootstrap' },
]

const BLOCKED_STACK_SLUGS = new Set(['framer-motion', 'typescript', 'jspdf'])

const TMP_DIR = path.join(process.cwd(), 'tmp', 'stack-icons')
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve, reject)
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function uploadIcon(slug: string): Promise<string | undefined> {
  const url = `https://cdn.simpleicons.org/${slug}/000000`
  try {
    const buffer = await downloadBuffer(url)
    const asset = await sanityAdminClient.assets.upload('image', buffer, {
      filename: `${slug}.svg`,
    })
    return asset._id
  } catch (err) {
    console.warn(`Failed to upload icon for ${slug}:`, err)
    return undefined
  }
}

async function main() {
  const existing = await sanityAdminClient.fetch<{ _id: string; name: string; slug: { current: string } }[]>(`
    *[_type == "stack"] | order(name asc) { _id, name, slug }
  `)

  const bySlug = new Map<string, { _id: string; name: string }>()
  for (const doc of existing) {
    bySlug.set(doc.slug.current, { _id: doc._id, name: doc.name })
  }

  const matched: string[] = []
  const created: string[] = []
  const updated: string[] = []

for (const item of FRONTEND_STACKS) {
      if (BLOCKED_STACK_SLUGS.has(item.slug)) {
        continue
      }

      const found = bySlug.get(item.slug)
      if (found) {
        matched.push(`${item.name} (${item.slug}) -> ${found._id}`)
        continue
      }

      let looseMatch: { _id: string; name: string; slug: string } | undefined
      const candidates = existing.filter((doc) => {
        const ds = doc.slug.current.toLowerCase()
        const dn = doc.name.toLowerCase()
        const fn = item.name.toLowerCase()
        const fs = item.slug.toLowerCase()
        if (ds === fs) return true
        if (dn === fn) return true
        if (ds.includes(fs) || fs.includes(ds)) return true
        if (dn.includes(fn) || fn.includes(dn)) return true
        return false
      })

      if (candidates.length === 1) {
        looseMatch = { _id: candidates[0]._id, name: candidates[0].name, slug: candidates[0].slug.current }
      } else if (candidates.length > 1) {
        console.warn(`Ambiguous match for ${item.name}:`, candidates.map(c => c._id))
        continue
      }

      if (looseMatch) {
        const iconAssetId = await uploadIcon(item.slug)
        await sanityAdminClient.patch(looseMatch._id).set({
          name: item.name,
          slug: { current: item.slug },
          ...(iconAssetId ? { icon: { _type: 'image', asset: { _type: 'reference', _ref: iconAssetId } } } : {}),
        }).commit()
        matched.push(`${item.name} (${item.slug}) updated from ${looseMatch.name} (${looseMatch.slug}) -> ${looseMatch._id}`)
        updated.push(`${item.name} (${item.slug})`)
        continue
      }

      const iconAssetId = await uploadIcon(item.slug)
      const doc: any = {
        _type: 'stack',
        name: item.name,
        slug: { current: item.slug },
      }
      if (iconAssetId) {
        doc.icon = { _type: 'image', asset: { _type: 'reference', _ref: iconAssetId } }
      }

      const createdDoc = await sanityAdminClient.create(doc)
      created.push(`${item.name} (${item.slug}) -> ${createdDoc._id}`)
    }

  console.log('=== MIGRATION REPORT ===')
  console.log(`Frontend count: ${FRONTEND_STACKS.length}`)
  console.log(`Sanity before:  ${existing.length}`)
  console.log(`Matched:        ${matched.length}`)
  console.log(`Created:        ${created.length}`)
  console.log(`Updated:        ${updated.length}`)
  console.log('\nMatched:', matched)
  console.log('\nCreated:', created)
  console.log('\nUpdated:', updated)
}

main().catch(console.error)
