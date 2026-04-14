import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      // Proxy auth requests to production during local dev
      "/api/auth": {
        target: "https://storm-tracker-murex.vercel.app",
        changeOrigin: true,
        headers: {
          Origin: "https://storm-tracker-murex.vercel.app",
        },
      },
    },
  },
})
