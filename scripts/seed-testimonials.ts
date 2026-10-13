import 'dotenv/config'
import { createClient } from '@sanity/client'

const projectId = (process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'development').trim()
const writeToken = process.env.SANITY_WRITE_TOKEN

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: writeToken,
})

const TESTIMONIALS = [
  {
    _id: 'testimonial-bayu-tri-novianto',
    author: 'Bayu Tri Novianto',
    role: 'Founder 3NT Studio',
    company: '3NT Studio',
    quote: 'Transformed our entire creative process overnight.',
  },
  {
    _id: 'testimonial-anonymous-anagata-executive',
    author: 'Anonymous',
    role: 'Consultant',
    company: 'Anagata Executive',
    quote: 'The most elegant solution we have ever implemented.',
  },
  {
    _id: 'testimonial-anonymous-student',
    author: 'Anonymous',
    role: 'Student',
    company: 'Student',
    quote: 'Pure craftsmanship in every single detail.',
  },
]

async function main() {
  // Check existing testimonials
  const existing = await client.fetch(`*[_type == "testimonial"] { _id, author, role, company, quote }`)
  console.log(`Existing testimonials before migration: ${existing.length}`)
  for (const t of existing) {
    console.log(`  - ${t._id}: ${t.author} (${t.role} @ ${t.company})`)
  }

  const byId = new Map(existing.map(t => [t._id, t]))

  const created: string[] = []
  const patched: string[] = []
  const skipped: string[] = []

  for (const data of TESTIMONIALS) {
    const existingDoc = byId.get(data._id)
    if (!existingDoc) {
      try {
        const doc = await client.create({
          _id: data._id,
          _type: 'testimonial',
          author: data.author,
          role: data.role,
          company: data.company,
          quote: data.quote,
        })
        created.push(`${data._id} -> ${doc._id}`)
        console.log(`Created: ${data._id}`)
      } catch (err: any) {
        console.error(`Failed to create ${data._id}:`, err.message)
      }
    } else if (
      existingDoc.author !== data.author ||
      existingDoc.role !== data.role ||
      existingDoc.company !== data.company ||
      existingDoc.quote !== data.quote
    ) {
      try {
        await client.patch(data._id).set({
          author: data.author,
          role: data.role,
          company: data.company,
          quote: data.quote,
        }).commit()
        patched.push(data._id)
        console.log(`Patched: ${data._id}`)
      } catch (err: any) {
        console.error(`Failed to patch ${data._id}:`, err.message)
      }
    } else {
      skipped.push(data._id)
      console.log(`Skipped (already exists and matches): ${data._id}`)
    }
  }

  // Verify final state
  const final = await client.fetch(`*[_type == "testimonial"] | order(_createdAt asc) { _id, author, role, company, quote, _createdAt }`)
  console.log(`\n=== FINAL STATE ===`)
  console.log(`Total testimonials: ${final.length}`)
  for (const t of final) {
    console.log(`  - ${t._id}: ${t.author} (${t.role} @ ${t.company})`)
    console.log(`    quote: "${t.quote}"`)
  }

  console.log(`\nCreated: ${created.length}`)
  console.log(`Patched: ${patched.length}`)
  console.log(`Skipped: ${skipped.length}`)
}

main().catch(console.error)
