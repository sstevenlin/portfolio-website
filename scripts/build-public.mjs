import { cpSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'public');

const staticFiles = [
  'index.html',
  'app.js',
  'about.html',
  'playlist-converter.html',
  'resume.pdf',
];

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

for (const file of staticFiles) {
  const src = join(root, file);
  if (existsSync(src)) {
    cpSync(src, join(out, file));
  }
}

for (const dir of ['css', 'assets']) {
  const src = join(root, dir);
  if (existsSync(src)) {
    cpSync(src, join(out, dir), { recursive: true });
  }
}

console.log('Built static site into public/');
