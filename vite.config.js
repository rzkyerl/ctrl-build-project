import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { devApiProxy } from './vite-dev-api.js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all env vars (including non-VITE_ prefixed) into process.env
  const env = loadEnv(mode, process.cwd(), '')
  // Make NVIDIA_NIM_API_KEY available to the dev middleware
  process.env.NVIDIA_NIM_API_KEY = env.NVIDIA_NIM_API_KEY

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
