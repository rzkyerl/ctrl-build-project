import 'dotenv/config'
import { createClient } from '@sanity/client'

const projectId = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'development'
const writeToken = process.env.SANITY_WRITE_TOKEN

const admin = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: writeToken,
})

async function repair() {
  const portfolios = await admin.fetch(
    `*[_type == "portfolio"]{_id, title, techStack}`
  )

  console.log(`Found ${portfolios.length} portfolios`)
  for (const p of portfolios) {
    const techStack = (p.techStack as any[]) || []
    const needsFix = techStack.some(item => typeof item === 'string')
    if (!needsFix) {
      console.log(`  skip ${p.title}: techStack looks valid`)
      continue
    }

    const fixed = techStack.map((item: any) =>
      typeof item === 'string' ? { _type: 'reference', _ref: item } : item
    )

    await admin.patch(p._id).set({ techStack: fixed }).commit()
    console.log(`  fixed ${p.title}`)
  }
}

repair().catch(err => {
  console.error('Repair failed:', err)
  process.exit(1)
})
