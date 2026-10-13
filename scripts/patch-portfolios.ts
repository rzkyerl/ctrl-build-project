import 'dotenv/config'
import { createClient } from '@sanity/client'

const projectId = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID
const dataset = 'development'
const token = process.env.SANITY_WRITE_TOKEN

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
})

// Data recovered from git history (commit 44b42e2, backend/database/seeders/PortfolioSeeder.php)
// Only fields that are missing/empty will be PATCHed.
// techStack references only existing Stack documents in Sanity.
const recoveryData: Record<string, any> = {
  'bookingin': {
    role: 'Full-stack Developer',
    overview: 'Bookingin adalah platform pemesanan hotel modern yang memudahkan pengguna mencari dan memesan akomodasi.',
    goals: 'Menyediakan pengalaman pemesanan hotel yang mulus dan cepat.',
    features: [
      { title: 'Pencarian Hotel', desc: 'Cari hotel berdasarkan lokasi dan tanggal.' },
      { title: 'Detail Kamar', desc: 'Informasi lengkap mengenai fasilitas dan harga.' },
    ],
    architecture: 'Built with React and Laravel API.',
    techStack: [
      { _type: 'reference', _ref: 'MR3wh2jaPncJ0KqiesGVhT' },  // React
      { _type: 'reference', _ref: 'MR3wh2jaPncJ0KqieuiGrZ' },  // Laravel
      { _type: 'reference', _ref: 'W06gt9WfKEZ4J1i20ClWJS' },  // MySQL
    ],
  },
  'ektm': {
    role: 'Mobile Developer',
    overview: 'Aplikasi mobile untuk manajemen kartu tanda mahasiswa elektronik.',
    goals: 'Digitalisasi kartu mahasiswa untuk kemudahan akses.',
    features: [
      { title: 'Digital ID', desc: 'Menampilkan kartu mahasiswa dalam format digital.' },
    ],
    architecture: 'Mobile application developed with React Native.',
    // React Native and Firebase are not existing Stack documents, so techStack is omitted
  },
  'berbagi-lagi': {
    role: 'Full-stack Developer',
    overview: 'Platform donasi online untuk membantu sesama.',
    goals: 'Memfasilitasi penggalangan dana secara transparan.',
    features: [
      { title: 'Sistem Donasi', desc: 'Proses donasi yang mudah dan aman.' },
    ],
    architecture: 'Web application with integrated payment gateway.',
    techStack: [
      { _type: 'reference', _ref: 'MR3wh2jaPncJ0KqiesGVhT' },  // React
      { _type: 'reference', _ref: 'MR3wh2jaPncJ0KqieuiJZV' },  // Node.js
      // MongoDB is not an existing Stack document, so omitted
    ],
  },
  'the-days': {
    role: 'Frontend Developer',
    overview: 'Website katalog dan pemesanan untuk kedai kopi modern.',
    goals: 'Meningkatkan visibilitas brand kedai kopi.',
    features: [
      { title: 'Katalog Menu', desc: 'Daftar menu kopi dan makanan yang menarik.' },
    ],
    architecture: 'Single Page Application (SPA).',
    techStack: [
      { _type: 'reference', _ref: 'MR3wh2jaPncJ0KqiesGVhT' },  // React
      { _type: 'reference', _ref: 'MR3wh2jaPncJ0KqieuiRq9' },  // Tailwind CSS
    ],
  },
  'anagata-executive': {
    role: 'Full-stack Developer',
    overview: 'Portal lowongan kerja khusus untuk posisi eksekutif.',
    goals: 'Menghubungkan profesional dengan perusahaan terkemuka.',
    features: [
      { title: 'Job Listing', desc: 'Daftar pekerjaan terbaru dengan filter canggih.' },
    ],
    architecture: 'Enterprise-grade job portal architecture.',
    techStack: [
      { _type: 'reference', _ref: 'MR3wh2jaPncJ0KqieuiIDX' },  // Next.js
      { _type: 'reference', _ref: 'W06gt9WfKEZ4J1i20ClUda' },  // PostgreSQL
      // Prisma is not an existing Stack document, so omitted
    ],
  },
}

async function main() {
  console.log(`Sanity: ${projectId}/${dataset}\n`)

  for (const [slug, data] of Object.entries(recoveryData)) {
    const existing = await client.fetch(
      `*[_type == "portfolio" && slug.current == $slug][0]{_id, title, category, image, overview, goals, architecture, techStack, link, role}`,
      { slug }
    )

    if (!existing) {
      console.log(`[skip] ${slug}: portfolio not found`)
      continue
    }

    const patch: Record<string, any> = {}
    const missingFields: string[] = []

    for (const [field, value] of Object.entries(data)) {
      if (field === 'techStack') {
        if (!existing.techStack || existing.techStack.length === 0) {
          patch.techStack = value
          missingFields.push('techStack')
        }
        continue
      }
      if (field === 'features') {
        if (!existing.features || existing.features.length === 0) {
          patch.features = value
          missingFields.push('features')
        }
        continue
      }
      if (existing[field] == null || existing[field] === '' || existing[field] === undefined) {
        patch[field] = value
        missingFields.push(field)
      }
    }

    if (missingFields.length === 0) {
      console.log(`[skip] ${slug}: no missing fields`)
      continue
    }

    console.log(`[patch] ${slug}: adding ${missingFields.join(', ')}`)
    await client.patch(existing._id).set(patch).commit()
    console.log(`[ok] ${slug} patched`)
  }

  console.log('\nDone.')
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
