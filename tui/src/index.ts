import { join } from 'node:path';
import { downloadRipGrep } from './utils/ripgrep';

await downloadRipGrep(join(import.meta.dirname, './'));

export { default as Chat } from './chat/Chat';
