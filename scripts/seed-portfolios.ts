import 'dotenv/config'
import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const projectId = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'development'
const writeToken = process.env.SANITY_WRITE_TOKEN

if (!projectId) {
  console.error('Missing VITE_SANITY_PROJECT_ID or SANITY_PROJECT_ID in .env')
  process.exit(1)
}

if (!writeToken) {
  console.error('Missing SANITY_WRITE_TOKEN in .env. Migration requires write access to Sanity.')
  process.exit(1)
}

const admin = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: writeToken,
})

const ASSETS = path.resolve(__dirname, '..', 'src', 'assets', 'images', 'portofolio')

function assetPath(rel: string) {
  return path.join(ASSETS, rel)
}

async function uploadImage(relPath: string): Promise<string> {
  const full = assetPath(relPath)
  if (!fs.existsSync(full)) {
    console.warn(`  [warn] image not found: ${full}`)
    return ''
  }
  const buffer = fs.readFileSync(full)
  const asset = await admin.assets.upload('image', buffer, {
    filename: path.basename(full),
  })
  return asset._id
}

async function ensureValidStack(slug: string, name: string): Promise<string> {
  // Try to find existing valid stack
  const existing = await admin.fetch<{ _id: string; _type: string } | null>(
    `*[_type == "stack" && slug.current == $slug][0]{_id, _type}`,
    { slug }
  )
  if (existing && existing._type === 'stack') {
    return existing._id
  }

  // If malformed doc exists without _type, delete it
  const malformed = await admin.fetch<{ _id: string } | null>(
    `*[_id != null && slug.current == $slug && !_type][0]._id`,
    { slug }
  )
  if (malformed) {
    console.log(`  [stack] removing malformed doc ${malformed._id}`)
    await admin.delete(malformed._id)
  }

  // Create new stack
  const doc = await admin.create({
    _type: 'stack',
    name,
    slug: { current: slug },
  })
  console.log(`  [stack] created ${name} -> ${doc._id}`)
  return doc._id
}

async function ensureValidPortfolio(slug: string, data: any): Promise<string> {
  // Check if valid portfolio already exists
  const existing = await admin.fetch<{ _id: string; _type: string } | null>(
    `*[_type == "portfolio" && slug.current == $slug][0]{_id, _type}`,
    { slug }
  )
  if (existing && existing._type === 'portfolio') {
    return existing._id
  }

  // If malformed doc exists, delete it
  const malformed = await admin.fetch<{ _id: string } | null>(
    `*[_id != null && slug.current == $slug && !_type][0]._id`,
    { slug }
  )
  if (malformed) {
    console.log(`  [portfolio] removing malformed doc ${malformed._id}`)
    await admin.delete(malformed._id)
  }

  const doc = await admin.create({
    _type: 'portfolio',
    ...data,
  })
  console.log(`  [portfolio] created ${slug} -> ${doc._id}`)
  return doc._id
}

async function main() {
  console.log(`Sanity: ${projectId}/${dataset}`)

  // 1) Ensure stacks used by 3NT Studio exist
  const stackNames = [
    ['React 19', 'react-19'],
    ['Vite', 'vite'],
    ['Tailwind CSS 4', 'tailwind-css-4'],
    ['Sanity CMS', 'sanity-cms'],
    ['Framer Motion', 'framer-motion'],
    ['jsPDF', 'jspdf'],
    ['TypeScript', 'typescript'],
  ]

  console.log('\nEnsuring stacks...')
  const stackIds: Record<string, string> = {}
  for (const [name, slug] of stackNames) {
    const id = await ensureValidStack(slug, name)
    stackIds[name] = id
  }

  // 2) Upload images
  console.log('\nUploading images...')
  const images: Record<string, string> = {}
  const imageMap: Record<string, string> = {
    '3nt-studio': '3nt-studio/3nt-home-mockup-opt.webp',
    'bookingin': 'bookingin/bookingin-home-mockup-opt.webp',
    'ektm': 'ektm/HomePages.webp',
    'berbagi-lagi': 'berbagilagi/berbagi-home-mockup-opt.webp',
    'the-days': 'the-days/thedays-home-mockup-opt.webp',
    'anagata-executive': 'anagata-executive/anagata-home-mockup.webp',
  }

  for (const [slug, rel] of Object.entries(imageMap)) {
    const full = assetPath(rel)
    if (!fs.existsSync(full)) {
      console.warn(`  [warn] image not found: ${full}`)
      continue
    }
    const buffer = fs.readFileSync(full)
    const asset = await admin.assets.upload('image', buffer, {
      filename: path.basename(full),
    })
    images[slug] = asset._id
    console.log(`  [image] ${slug} -> ${asset._id}`)
  }

  // 3) Create portfolio documents
  console.log('\nCreating portfolios...')

  const portfolios: Record<string, any> = {
    '3nt-studio': {
      title: '3NT Studio - Website Photostudio',
      slug: { current: '3nt-studio' },
      category: 'Web Development',
      image: images['3nt-studio'] ? { _type: 'image', asset: { _type: 'reference', _ref: images['3nt-studio'] } } : undefined,
      overview: 'Proyek ini adalah 3NT Studio, sebuah platform website premium yang berfungsi sebagai Portfolio Fotografi & Sistem Booking Otomatis. Website ini dirancang dengan estetika modern, minimalis, dan monokromatik untuk memberikan kesan mewah dan profesional bagi sebuah studio foto.',
      goals: 'Proyek ini bertujuan untuk menjadi etalase digital bagi 3NT Studio dalam memamerkan karya fotografi mereka sekaligus menyediakan sistem manajemen pemesanan (booking) yang terintegrasi bagi calon klien.',
      features: [
        { title: 'Portfolio Dinamis', desc: 'Galeri foto yang dapat dikelola secara langsung melalui Sanity CMS dengan efek visual menarik.' },
        { title: 'Sistem Booking Otomatis', desc: 'Pengguna dapat memilih paket dan tanggal pemesanan dengan konfirmasi PDF real-time.' },
        { title: 'Interactive Photobooth', desc: 'Fitur unik untuk mengambil foto monokrom langsung dari browser.' },
        { title: 'Cinematic Hero Section', desc: 'Latar belakang video layar penuh dan animasi tipografi yang halus.' },
        { title: 'Admin Dashboard', desc: 'Dashboard berbasis Sanity Studio untuk mengelola konten dan reservasi.' },
      ],
      architecture: 'Proyek ini menggunakan arsitektur modern yang memisahkan Frontend (React 19 + Vite + Tailwind CSS 4) dan Backend/CMS (Sanity.io).',
      techStack: Object.values(stackIds).map(id => ({ _type: 'reference', _ref: id })),
      link: 'https://3nt-studio.vercel.app',
    },
    'bookingin': {
      title: 'Bookingin - Website Hotel',
      slug: { current: 'bookingin' },
      category: 'Web Development',
      image: images['bookingin'] ? { _type: 'image', asset: { _type: 'reference', _ref: images['bookingin'] } } : undefined,
    },
    'ektm': {
      title: 'EKTM - Mobile Apps EKTM',
      slug: { current: 'ektm' },
      category: 'Mobile Apps',
      image: images['ektm'] ? { _type: 'image', asset: { _type: 'reference', _ref: images['ektm'] } } : undefined,
    },
    'berbagi-lagi': {
      title: 'Berbagi Lagi - Website Donasi',
      slug: { current: 'berbagi-lagi' },
      category: 'Web Development',
      image: images['berbagi-lagi'] ? { _type: 'image', asset: { _type: 'reference', _ref: images['berbagi-lagi'] } } : undefined,
    },
    'the-days': {
      title: 'The Days - Website Coffee',
      slug: { current: 'the-days' },
      category: 'Web Development',
      image: images['the-days'] ? { _type: 'image', asset: { _type: 'reference', _ref: images['the-days'] } } : undefined,
    },
    'anagata-executive': {
      title: 'Anagata Executive - Website JobPortal',
      slug: { current: 'anagata-executive' },
      category: 'Web Development',
      image: images['anagata-executive'] ? { _type: 'image', asset: { _type: 'reference', _ref: images['anagata-executive'] } } : undefined,
    },
  }

  let created = 0
  let skipped = 0
  let failed = 0
  for (const [slug, data] of Object.entries(portfolios)) {
    try {
      const existing = await admin.fetch<{ _id: string; _type: string } | null>(
        `*[_type == "portfolio" && slug.current == $slug][0]{_id, _type}`,
        { slug }
      )
      if (existing && existing._type === 'portfolio') {
        console.log(`  [portfolio] skip ${slug} (already exists)`)
        skipped++
        continue
      }

      // Clean up malformed doc if exists
      const malformed = await admin.fetch<{ _id: string } | null>(
        `*[_id != null && slug.current == $slug && !_type][0]._id`,
        { slug }
      )
      if (malformed) {
        console.log(`  [portfolio] removing malformed doc ${malformed._id}`)
        await admin.delete(malformed._id)
      }

      const doc = await admin.create({
        _type: 'portfolio',
        ...data,
      })
      console.log(`  [portfolio] created ${slug} -> ${doc._id}`)
      created++
    } catch (err: any) {
      console.error(`  [portfolio] FAILED ${slug}: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone. created=${created} skipped=${skipped} failed=${failed}`)
}

main().catch(err => {
  console.error('Migration failed:', err)
  process.exit(1)
})
