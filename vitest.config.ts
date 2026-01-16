import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
    },
    resolve: {
        alias: [
            { find: 'jimu-core', replacement: path.resolve(__dirname, './tests/mocks/jimu-core.tsx') },
            { find: /^jimu-ui$/, replacement: path.resolve(__dirname, './tests/mocks/jimu-ui.tsx') },
            { find: 'jimu-ui/advanced/setting-components', replacement: path.resolve(__dirname, './tests/mocks/setting-components.tsx') },
            { find: 'jimu-for-builder', replacement: path.resolve(__dirname, './tests/mocks/jimu-for-builder.tsx') },
            { find: 'jimu-arcgis', replacement: path.resolve(__dirname, './tests/mocks/jimu-arcgis.tsx') }
        ]
    }
})
