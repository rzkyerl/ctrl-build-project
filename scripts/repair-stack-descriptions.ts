import 'dotenv/config'
import { createClient } from '@sanity/client'

const projectId = (process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || '').trim()
const dataset = (process.env.VITE_SANITY_DATASET || process.env.SANITY_DATASET || 'development').trim()
const writeToken = process.env.SANITY_WRITE_TOKEN

const admin = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: writeToken,
})

const DESCRIPTIONS: Record<string, string> = {
  'laravel': 'Framework PHP untuk membangun aplikasi web yang ekspresif dan elegan.',
  'react': 'Library JavaScript untuk membangun antarmuka pengguna yang interaktif dan komponen.',
  'nextdotjs': 'Framework React untuk aplikasi web dengan rendering hybrid dan routing bawaan.',
  'svelte': 'Framework JavaScript kompilatif untuk antarmuka pengguna yang ringan dan cepat.',
  'docker': 'Platform untuk membangun, menjalankan, dan mengemas aplikasi menggunakan container.',
  'html5': 'Bahasa markup standar untuk membuat struktur dan konten halaman web.',
  'css': 'Bahasa stylesheet untuk mendesain presentasi dan layout halaman web.',
  'javascript': 'Bahasa pemrograman untuk menambahkan interaktivitas dan logika di sisi klien.',
  'tailwindcss': 'Framework CSS utility-first untuk merancang antarmuka secara cepat dan konsisten.',
  'figma': 'Platform desain kolaboratif untuk membuat antarmuka, prototype, dan sistem desain.',
  'nodedotjs': 'Runtime JavaScript untuk menjalankan kode di sisi server dan membangun layanan backend.',
  'python': 'Bahasa pemrograman serbaguna untuk pengembangan web, data science, dan otomatisasi.',
  'postgresql': 'Sistem manajemen database relasional open-source yang andal dan kaya fitur.',
  'sanity': 'Platform headless CMS untuk mengelola konten terstruktur dan distribusi multi-channel.',
  'vercel': 'Platform cloud untuk deployment dan hosting aplikasi frontend dengan edge network.',
  'github': 'Platform hosting kode dan kolaborasi tim berbasis Git untuk pengembangan perangkat lunak.',
  'git': 'Version control system untuk melacak perubahan source code dan kolaborasi tim.',
  'postman': 'Kolaborasi platform untuk menguji, mendokumentasikan, dan mengelola API.',
  'nestjs': 'Framework Node.js untuk membangun aplikasi backend yang efisien dan dapat diuji.',
  'mysql': 'Sistem manajemen database relasional open-source yang populer untuk aplikasi web.',
  'php': 'Bahasa pemrograman sisi server untuk pengembangan web yang dinamis.',
  'turborepo': 'Sistem build monorepo untuk mengoptimalkan tugas dan caching pada proyek JavaScript.',
  'vite': 'Build tool frontend generasi berikutnya untuk development server dan bundling yang cepat.',
  'bootstrap': 'Framework CSS untuk membangun antarmuka web yang responsif dan mobile-first.',
}

async function main() {
  const stacks = await admin.fetch<{ _id: string; name: string; slug: { current: string }; description?: string | null }[]>(`
    *[_type == "stack"] | order(name asc) {
      _id, name, slug, description
    }
  `)

  console.log(`Before patch: ${stacks.length} stacks`)

  let patched = 0
  let skipped = 0

  for (const stack of stacks) {
    const slug = stack.slug.current
    const description = DESCRIPTIONS[slug]

    if (!description) {
      console.log(`  skip ${stack.name}: no description template for slug "${slug}"`)
      skipped++
      continue
    }

    if (stack.description && stack.description.trim().length > 0) {
      console.log(`  skip ${stack.name}: description already set`)
      skipped++
      continue
    }

    await admin.patch(stack._id).set({ description }).commit()
    console.log(`  patched ${stack.name}`)
    patched++
  }

  console.log('\n=== REPAIR REPORT ===')
  console.log(`Total stacks:    ${stacks.length}`)
  console.log(`Patched:         ${patched}`)
  console.log(`Skipped:         ${skipped}`)
}

main().catch(err => {
  console.error('Repair failed:', err)
  process.exit(1)
})
