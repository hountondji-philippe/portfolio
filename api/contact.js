// api/contact.js
// Reçoit le formulaire de contact et enregistre le message en base.

const validator = require('validator');
const { getPrismaClient } = require('../lib/db');
const { verifierCsrf } = require('../lib/auth');

function sanitize(val, max) {
  return validator.escape(String(val || '').trim()).slice(0, max);
}

function clientIP(req) {
  const forwarded = req.headers['x-forwarded-for'] || '';
  return String(forwarded).split(',')[0].trim().slice(0, 45) || null;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  try {
    const name = sanitize(req.body.name, 100);
    const email = sanitize(req.body.email, 254);
    const phone = sanitize(req.body.phone, 20);
    const message = sanitize(req.body.message, 2000);

    if (name.length < 2) return res.status(400).json({ error: 'Nom invalide.' });
    if (!validator.isEmail(email)) return res.status(400).json({ error: 'Email invalide.' });
    if (message.length < 10) return res.status(400).json({ error: 'Message trop court.' });
    if (phone && !/^\+?[0-9]{8,20}$/.test(phone)) {
      return res.status(400).json({ error: 'Numéro invalide.' });
    }

    const prisma = getPrismaClient();
    await prisma.message.create({
      data: {
        name,
        email,
        phone: phone || null,
        message,
        ipAddress: clientIP(req),
      },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[contact]', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

module.exports = verifierCsrf(handler);