const nodemailer = require('nodemailer');
const validator = require('validator');
const { verifierCsrf } = require('../lib/auth');

const tentatives = new Map();
const LIMITE_PAR_HEURE = 5;

function verifierRateLimit(ip) {
  const maintenant = Date.now();
  const entree = tentatives.get(ip) || { nb: 0, debut: maintenant };

  if (maintenant - entree.debut > 3600000) {
    tentatives.set(ip, { nb: 1, debut: maintenant });
    return true;
  }

  if (entree.nb >= LIMITE_PAR_HEURE) return false;

  entree.nb++;
  tentatives.set(ip, entree);
  return true;
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const ip = String((req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown');
  if (!verifierRateLimit(ip)) {
    return res.status(429).json({ error: 'Trop de tentatives. Réessayez dans une heure.' });
  }

  const email = String((req.body || {}).email || '').trim().slice(0, 254);

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(500).json({ error: 'Configuration serveur manquante.' });
  }

  try {
    const transporteur = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });

    await transporteur.sendMail({
      from: '"Portfolio — Newsletter" <' + process.env.GMAIL_USER + '>',
      to: process.env.GMAIL_USER,
      subject: 'Nouvelle inscription newsletter',
      html: '<p>Nouvelle inscription à la newsletter du portfolio :</p><p><strong>' +
        email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
        '</strong></p>',
    });

    return res.status(200).json({ success: true });
  } catch {
    return res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
}

module.exports = verifierCsrf(handler);
