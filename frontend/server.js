const http = require('node:http');
const path = require('node:path');
const { readFile } = require('node:fs/promises');

const root = __dirname;
const port = Number(process.env.PORT) || 4173;
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  const isHomePage = pathname === '/' || pathname === '/index.html';
  const isFrontendAsset = pathname.startsWith('/frontend/');
  const fileRoot = isHomePage ? path.resolve(root, '..') : root;
  const requestedPath = isHomePage
    ? 'index.html'
    : isFrontendAsset
      ? pathname.slice('/frontend/'.length)
      : pathname.slice(1);
  const filePath = path.resolve(fileRoot, requestedPath);
  const relativePath = path.relative(fileRoot, filePath);
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    console.error(`Unable to serve ${pathname}:`, error);
    response.writeHead(500);
    response.end('Internal server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Weed-Zap dashboard available at http://127.0.0.1:${port}`);
});
