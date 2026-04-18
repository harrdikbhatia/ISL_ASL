import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   assetsInclude: ['**/*.task'],
})


// export default defineConfig({
//   assetsInclude: ['**/*.task'], // Tells Vite to treat .task as a static asset
//   // ... other config
// })