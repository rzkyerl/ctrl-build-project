import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
})
