import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/_redirects',
          dest: '.' // copy to dist root
        }
      ]
    })
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
