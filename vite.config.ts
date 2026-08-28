import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The deploy workflow passes `--base=/<repo>/` when publishing to a GitHub Pages project URL.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
