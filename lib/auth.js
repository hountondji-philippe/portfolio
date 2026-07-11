// lib/auth.js
// Authentification admin (JWT) + protection CSRF.
// CORRECTIF vs l'ancien server.js : les tokens CSRF ne sont plus stockés
// dans une Map en mémoire (qui ne survit pas au serverless). Ils sont
// désormais signés (HMAC) et auto-vérifiables, donc stateless.

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getPrismaClient } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET;
const CSRF_SECRET = process.env.CSRF_SECRET || JWT_SECRET; // peut être le même secret
const CSRF_DUREE_MS = 60 * 60 * 1000; // 1h

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET manquant ou trop court (32 caractères minimum).');
}

// ── JWT ────────────────────────────────────────────────────────────────────
function genererToken(admin) {
  const jti = crypto.randomBytes(32).toString('hex');
  const token = jwt.sign(
    { id: admin.id, email: admin.email, jti },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
  return token;
}

async function verifierToken(token) {
  if (!token || token.length > 1024) {
    throw new Error('Token invalide.');
  }
  const payload = jwt.verify(token, JWT_SECRET); // lève une erreur si invalide/expiré

  const prisma = getPrismaClient();
  const revoque = await prisma.revokedToken.findUnique({ where: { jti: payload.jti } });
  if (revoque) throw new Error('Session révoquée. Reconnectez-vous.');

  return payload;
}

async function revoquerToken(payload) {
  const prisma = getPrismaClient();
  await prisma.revokedToken.create({
    data: {
      jti: payload.jti,
      expiresAt: new Date(payload.exp * 1000),
    },
  }).catch(() => {}); // ignore si déjà révoqué
}

// Middleware pour les handlers Vercel (style Express-like req/res)
function requireAuth(handler) {
  return async (req, res) => {
    try {
      const header = req.headers.authorization || '';
      if (!header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Non autorisé.' });
      }
      const token = header.slice(7);
      const payload = await verifierToken(token);
      req.admin = payload;
      return handler(req, res);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Session expirée.' : (err.message || 'Non autorisé.');
      return res.status(401).json({ error: msg });
    }
  };
}

// ── CSRF STATELESS ─────────────────────────────────────────────────────────
// Le token contient sa propre expiration + une signature HMAC. Pas besoin
// de stockage : n'importe quelle instance serverless peut le vérifier.
function genererCsrfToken() {
  const expiration = Date.now() + CSRF_DUREE_MS;
  const payload = String(expiration);
  const signature = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  return Buffer.from(payload + '.' + signature).toString('base64url');
}

function validerCsrfToken(token) {
  try {
    const decoded = Buffer.from(String(token), 'base64url').toString('utf8');
    const [payload, signature] = decoded.split('.');
    if (!payload || !signature) return false;

    const attendu = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
    const signatureOk = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(attendu));
    if (!signatureOk) return false;

    const expiration = parseInt(payload, 10);
    if (isNaN(expiration) || Date.now() > expiration) return false;

    return true;
  } catch {
    return false;
  }
}

function verifierCsrf(handler) {
  return async (req, res) => {
    const token = req.headers['x-csrf-token'];
    if (!validerCsrfToken(token)) {
      return res.status(403).json({ error: 'Token CSRF invalide ou expiré.' });
    }
    return handler(req, res);
  };
}

module.exports = {
  genererToken,
  verifierToken,
  revoquerToken,
  requireAuth,
  genererCsrfToken,
  validerCsrfToken,
  verifierCsrf,
};