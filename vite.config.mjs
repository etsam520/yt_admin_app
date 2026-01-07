import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    optimizeDeps: {
        include: ['quill', 'quill-delta', 'quill/dist/quill.core.css', '@vueup/vue-quill', 'react', 'react-dom', 'react-dom/client', 'react/jsx-runtime', '@excalidraw/excalidraw']
    },
    plugins: [
        vue(),
        react({
            include: /\.(jsx|js|tsx|ts)$/
        }),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    define: {
        global: 'globalThis'
    }
});
