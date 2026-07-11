// api/newsletter.js
// Inscription newsletter minimale : ne stocke rien en base (pas de nouveau
// modèle Prisma nécessaire), envoie simplement un email de notification à
// Philippe via le compte Gmail déjà configuré (mêmes identifiants que
// api/admin/account.js pour send-reply).
//
// POST { email }

const nodemailer = require('nodemailer');
const validator = require('validator');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const email = String((req.body || {}).email || '').trim().slice(0, 254);

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('[newsletter] Configuration Gmail manquante.');
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
  } catch (err) {
    console.error('[newsletter]', err.message);
    return res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
};
