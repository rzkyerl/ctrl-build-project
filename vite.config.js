import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { devApiProxy } from './vite-dev-api.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ prefixed) into process.env
  const env = loadEnv(mode, process.cwd(), '')
  // Make backend-only API keys available to the dev middleware.
  // Also accept common alias names (e.g. GOOGLE_GEMINI_API_KEY).
  process.env.NVIDIA_NIM_API_KEY = env.NVIDIA_NIM_API_KEY
  process.env.GROQ_API_KEY      = env.GROQ_API_KEY
  process.env.GEMINI_API_KEY    = env.GEMINI_API_KEY || env.GOOGLE_GEMINI_API_KEY
  process.env.LANGSEARCH_API_KEY = env.LANGSEARCH_API_KEY
  process.env.SERPER_API_KEY     = env.SERPER_API_KEY
  // In dev, always treat .env.local as having higher priority than .env
  const localEnv = loadEnv(mode, process.cwd(), '')
  if (localEnv.NVIDIA_NIM_API_KEY) process.env.NVIDIA_NIM_API_KEY = localEnv.NVIDIA_NIM_API_KEY
  if (localEnv.GROQ_API_KEY)      process.env.GROQ_API_KEY      = localEnv.GROQ_API_KEY
  if (localEnv.GEMINI_API_KEY || localEnv.GOOGLE_GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = localEnv.GEMINI_API_KEY || localEnv.GOOGLE_GEMINI_API_KEY
  }
  if (localEnv.LANGSEARCH_API_KEY) process.env.LANGSEARCH_API_KEY = localEnv.LANGSEARCH_API_KEY
  if (localEnv.SERPER_API_KEY)    process.env.SERPER_API_KEY    = localEnv.SERPER_API_KEY

  return {
    plugins: [react(), devApiProxy()],
    build: {
      // three.js minified ~600KB adalah wajar dan sudah dipisahkan ke chunk-nya sendiri.
      // Naikkan limit agar warning tidak muncul untuk chunk vendor yang legitimate.
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // three.js dan GLTFLoader — hanya dipakai di hero, pisahkan agar
            // halaman lain tidak perlu memuatnya
            if (id.includes('node_modules/three')) {
              return 'vendor-three'
            }

            // @splinetool — pisahkan jika suatu saat diaktifkan kembali
            if (id.includes('@splinetool')) {
              return 'vendor-spline'
            }

            // react-router-dom + react-router
            if (id.includes('react-router')) {
              return 'vendor-router'
            }

            // React core (react + react-dom) — chunk kecil tapi sering di-cache
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react'
            }

            // Semua node_modules lain jadi satu vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor'
            }
          },
        },
      },
    },
  }
})
