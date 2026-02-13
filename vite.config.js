import { defineConfig } from 'vite';

export default defineConfig({
  // Base URL - cambiar según donde se sirva en IIS
  // Para raíz del servidor: '/'
  // Para subcarpeta: '/simicrush/'
  base: '/',

  publicDir: 'public',

  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild', // Usar esbuild en lugar de terser
    // Genera source maps para debugging
    sourcemap: false,
    rollupOptions: {
      output: {
        // Asegura que los paths sean correctos
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  server: {
    // Para desarrollo local
    host: 'localhost',
    port: 5173,
    // Permite acceder desde cualquier IP (útil para testing en otros dispositivos)
    strictPort: false
  }
});
