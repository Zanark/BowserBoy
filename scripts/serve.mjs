import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { siteFiles, siteSource } from './site-files.mjs';
import { createDemoRom } from './demo-rom.mjs';

const args = process.argv.slice(2);
const value = (flag, fallback) => args.includes(flag) ? args[args.indexOf(flag) + 1] : fallback;
const port = Number(value('--port', process.env.PORT ?? '5173'));
const basePath = value('--base', '/');
if (!Number.isInteger(port) || port < 1 || port > 65535 || !/^\/(?:[\w-]+\/)*$/.test(basePath)) {
  throw new Error('Use a valid --port and a --base path such as /BowserBoyAdvance/.');
}
const dist = args.includes('--dist');
const files = new Set((await siteFiles()).map((file) => file.replaceAll('\\', '/')));
files.add('assets/pixel-lab.gba');
const types = { html: 'text/html', css: 'text/css', js: 'text/javascript', svg: 'image/svg+xml', png: 'image/png', txt: 'text/plain', gba: 'application/octet-stream' };

createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
      return;
    }
    const path = new URL(request.url, 'http://localhost').pathname;
    const relative = path.startsWith(basePath) ? path.slice(basePath.length) || 'index.html' : null;
    if (!files.has(relative)) { response.writeHead(404).end('Not found'); return; }
    const data = !dist && relative === 'assets/pixel-lab.gba' ? createDemoRom() :
      await readFile(dist ? join('dist', ...relative.split('/')) : siteSource(join(...relative.split('/'))));
    response.writeHead(200, {
      'Content-Type': `${types[relative.split('.').pop()]}${relative.endsWith('.html') ? '; charset=utf-8' : ''}`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    console.error('Static server:', error);
    response.writeHead(500).end('Could not read the site file');
  }
}).listen(port, '127.0.0.1', () => console.log(`BowserBoyAdvance: http://127.0.0.1:${port}${basePath}`));
