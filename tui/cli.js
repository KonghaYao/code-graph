#!/usr/bin/env node
const args = process.argv.slice(2);

if (args[0] === 'init') {
    import('./dist/zen-init.mjs');
} else {
    import('./dist/zen-code.mjs');
}
