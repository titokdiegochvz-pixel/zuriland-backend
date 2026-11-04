import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const frontendDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
    base: command === 'serve' ? '/' : '/site/',
    plugins: [react()],
    build: {
        outDir: resolve(frontendDirectory, '../public/site'),
        emptyOutDir: true,
    },
}));
