import { createClient } from '@sanity/client'

// Client publik — hanya untuk READ (frontend public pages)
export const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset:   import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

// Client untuk admin CRUD — token disuntikkan dari serverless function
// JANGAN tambahkan write token di sini, token hanya boleh di server-side
export const sanityAdminClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID,
  dataset:   import.meta.env.VITE_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})
