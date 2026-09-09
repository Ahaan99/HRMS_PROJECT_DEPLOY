import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// EVS portal always runs on 5180 locally so it never collides with the other
// HRMS portals (admin 5173, IT 5177, ...). The backend's EVS_APP_URL /
// EVS_FRONTEND_URL and the admin panel's VITE_EVS_APP_URL point here.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, strictPort: true },
  preview: { port: 5180, strictPort: true },
})
