// lib/tracking.js
// Utilitaires partagés pour le tracking anonyme des visites.

const crypto = require('crypto');

function clientIP(req) {
  const forwarded = req.headers['x-forwarded-for'] || '';
  return String(forwarded).split(',')[0].trim() || null;
}

function hasherIP(ip) {
  if (!ip) return null;
  const sel = process.env.IP_SALT || 'sel_par_defaut';
  return crypto.createHash('sha256').update(ip + sel).digest('hex').slice(0, 32);
}

function genererSessionId(req) {
  const ip = clientIP(req) || '';
  const ua = req.headers['user-agent'] || '';
  const jour = new Date().toISOString().slice(0, 10);
  return crypto.createHash('sha256').update(ip + ua + jour).digest('hex').slice(0, 32);
}

async function geoLocaliser(ip) {
  try {
    if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { pays: 'Local', ville: 'Local' };
    }
    const reponse = await fetch('https://ipapi.co/' + ip + '/json/', {
      signal: AbortSignal.timeout(3000),
    });
    const data = await reponse.json();
    if (data && !data.error) {
      return { pays: data.country_name || null, ville: data.city || null };
    }
    return { pays: null, ville: null };
  } catch {
    return { pays: null, ville: null };
  }
}

module.exports = { clientIP, hasherIP, genererSessionId, geoLocaliser };
