import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
    return {
        plugins: [react()],
        // Jika di-deploy di Vercel, gunakan root ('/'). 
        // Bebas error 404 di GitHub Pages yang memakai subdirektori ('/parking-receipt-gandaria-city/').
        base: process.env.VERCEL ? '/' : '/parking-receipt-gandaria-city/',
        build: {
            outDir: 'dist',
        }
    };
});
