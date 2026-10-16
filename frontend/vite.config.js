import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El frontend vive en el puerto 5173 y la API en el 5080.
// Configuramos un proxy para que, si se usa la ruta relativa "/api",
// las peticiones se reenvíen a la API evitando problemas de CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
})
