import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import nodeExternals from 'rollup-plugin-node-externals';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { analyzer } from 'vite-bundle-analyzer';
export default defineConfig({
    plugins: [
        nodeExternals({
            builtins: true,
            deps: false,
            devDeps: false,
            peerDeps: false,
            optDeps: false,
            include: [
                'bun:sqlite',
                'path',
                'crypto',
                'util',
                'stream',
                'fs',
                'pg',
                'redis',
                'react-devtools-core',
                '@lvce-editor/ripgrep', // 修复特殊文件引用的情况
                'node-sqlite3-wasm', // 修复特殊文件引用的情况
            ],
        }),

        react(),
        // analyzer({
        //     analyzerMode: 'server', // Options: 'server', 'static', 'json'
        //     analyzerPort: 8888, // Port for the server mode
        //     openAnalyzer: true, // Automatically open the analyzer in the browser
        //     summary: true, // Show full chunk info in the console
        // }),
    ],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        lib: {
            entry: './src/app.tsx',
            name: 'code-graph',
            formats: ['es'],
        },

        target: 'esnext',
        sourcemap: false,
    },
    define: {
        __filename: 'import.meta.filename',
        'window.FormData': 'globalThis.FormData',
    },
    resolve: {
        conditions: ['module', 'node', 'production'],
    },
});
