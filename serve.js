const http = require('http');
const fs   = require('fs');
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8765;
const path = require('path');
const ROOT = path.join(__dirname);
const MIME = { html:'text/html', js:'application/javascript', css:'text/css', json:'application/json', png:'image/png', ico:'image/x-icon', svg:'image/svg+xml' };

// Only allow write endpoints from localhost
function _isLocalhost(req) {
  const host = (req.headers['host'] || '').split(':')[0];
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

// Guard against path traversal: resolved path must stay within ROOT
function _safePath(urlPath) {
  const resolved = path.resolve(ROOT, '.' + urlPath);
  return resolved.startsWith(ROOT) ? resolved : null;
}

http.createServer((req, res) => {
  // Allow CORS for local development (GET only from any origin; write endpoints are localhost-gated)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // POST /save-icons — accepts { icon192: base64, icon512: base64 }
  // Restricted to localhost requests only (dev tool — never expose on 0.0.0.0)
  if (req.method === 'POST' && req.url === '/save-icons') {
    if (!_isLocalhost(req)) {
      res.writeHead(403); res.end('Forbidden: localhost only');
      return;
    }
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const iconsDir = path.join(ROOT, 'icons');
        if (data.icon192) fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), Buffer.from(data.icon192, 'base64'));
        if (data.icon512) fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), Buffer.from(data.icon512, 'base64'));
        res.writeHead(200, {'Content-Type':'application/json'});
        res.end(JSON.stringify({ok:true}));
        console.log('[FORGE] Icons saved to icons/ folder');
      } catch(e) {
        res.writeHead(500); res.end('Error: ' + e.message);
      }
    });
    return;
  }

  // Static file handler with path traversal protection
  const urlPath = (req.url === '/' ? '/index.html' : req.url).split('?')[0];
  const file = _safePath(urlPath);
  if (!file) { res.writeHead(400); res.end('Bad request'); return; }

  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(file).slice(1).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, '127.0.0.1', () => console.log('FORGE server running at http://localhost:' + PORT));
