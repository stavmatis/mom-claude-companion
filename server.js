const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const VAULT_PATH = path.join(DATA_DIR, 'vault.json');
const LOG_PATH = path.join(DATA_DIR, 'autosave-log.jsonl');
const AUTH_PATH = path.join(DATA_DIR, 'auth.hash');
const PORT = Number(process.env.PORT || 8877);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon'
};

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
}

function send(res, status, body, type = 'application/json; charset=utf-8') {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'content-type': type,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 2_000_000) {
        reject(new Error('too_large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function timingSafeEqualText(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function checkVaultAuth(req, candidate) {
  ensureDataDir();
  const supplied = String(candidate || req.headers['x-vault-auth'] || '');
  if (!supplied) return false;
  if (!fs.existsSync(AUTH_PATH)) {
    fs.writeFileSync(AUTH_PATH, supplied, { mode: 0o600 });
    return true;
  }
  return timingSafeEqualText(supplied, fs.readFileSync(AUTH_PATH, 'utf8').trim());
}

function validVault(payload) {
  return payload && typeof payload === 'object' &&
    typeof payload.iv === 'string' && payload.iv.length >= 12 && payload.iv.length <= 64 &&
    typeof payload.ct === 'string' && payload.ct.length > 20 && payload.ct.length < 1_500_000;
}

function appendLog(action, vault) {
  ensureDataDir();
  const entry = {
    time: new Date().toISOString(),
    action,
    updatedAt: vault.updatedAt || null,
    bytes: Buffer.byteLength(JSON.stringify(vault)),
    checksum: crypto.createHash('sha256').update(vault.ct).digest('hex').slice(0, 16)
  };
  fs.appendFileSync(LOG_PATH, JSON.stringify(entry) + '\n', { mode: 0o600 });
}

function saveVault(payload) {
  ensureDataDir();
  const vault = {
    iv: payload.iv,
    ct: payload.ct,
    updatedAt: payload.updatedAt || new Date().toISOString()
  };
  const tmp = `${VAULT_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(vault, null, 2), { mode: 0o600 });
  fs.renameSync(tmp, VAULT_PATH);
  appendLog(payload.reason || 'autosave', vault);
  return vault;
}

function staticPath(urlPath) {
  const cleaned = decodeURIComponent(urlPath.split('?')[0]);
  const requested = cleaned === '/' ? '/index.html' : cleaned;
  const full = path.normalize(path.join(ROOT, requested));
  if (!full.startsWith(ROOT)) return null;
  return full;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/health') {
      return send(res, 200, { ok: true, service: 'dimitra-iqos-log', hasSave: fs.existsSync(VAULT_PATH) });
    }

    if (url.pathname === '/api/vault' && req.method === 'GET') {
      if (!checkVaultAuth(req, url.searchParams.get('auth'))) return send(res, 401, { error: 'unauthorized' });
      if (!fs.existsSync(VAULT_PATH)) return send(res, 404, { error: 'no_save_yet' });
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      return fs.createReadStream(VAULT_PATH).pipe(res);
    }

    if (url.pathname === '/api/vault' && req.method === 'PUT') {
      const payload = JSON.parse(await readBody(req));
      if (!checkVaultAuth(req, payload.auth)) return send(res, 401, { error: 'unauthorized' });
      if (!validVault(payload)) return send(res, 400, { error: 'invalid_vault' });
      const saved = saveVault(payload);
      return send(res, 200, { ok: true, updatedAt: saved.updatedAt });
    }

    if (url.pathname.startsWith('/api/')) return send(res, 404, { error: 'not_found' });

    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed', 'text/plain; charset=utf-8');
    const full = staticPath(url.pathname);
    if (!full || !fs.existsSync(full) || fs.statSync(full).isDirectory()) return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
    const ext = path.extname(full);
    res.writeHead(200, {
      'content-type': TYPES[ext] || 'application/octet-stream',
      'cache-control': ext === '.html' ? 'no-store' : 'public, max-age=60',
      'x-content-type-options': 'nosniff'
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(full).pipe(res);
  } catch (err) {
    send(res, err.message === 'too_large' ? 413 : 500, { error: err.message === 'too_large' ? 'too_large' : 'server_error' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  ensureDataDir();
  console.log(`Dimitra IQOS Log listening on http://127.0.0.1:${PORT}`);
});
