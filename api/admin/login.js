// api/admin/login.js
// Connexion admin. Retourne un JWT si les identifiants sont corrects.

const bcrypt = require('bcrypt');
const validator = require('validator');
const { getPrismaClient } = require('../../lib/db');
const { genererToken } = require('../../lib/auth');

const HASH_FACTICE = '$2b$14$invalidhashfortimingprotectXXXXXXXXXXXXXXXXXXXXXXXXX';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  try {
    const email = String(req.body.email || '').trim().slice(0, 254);
    const password = String(req.body.password || '').slice(0, 128);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis.' });
    }

    if (!validator.isEmail(email)) {
      // comparaison factice pour garder un temps de réponse constant
      await bcrypt.compare('dummy', HASH_FACTICE);
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const prisma = getPrismaClient();
    const admin = await prisma.admin.findUnique({ where: { email } });

    const hash = admin ? admin.passwordHash : HASH_FACTICE;
    const valide = await bcrypt.compare(password, hash);

    if (!admin || !valide) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const token = genererToken(admin);
    return res.status(200).json({ success: true, token });
  } catch (err) {
    console.error('[admin/login]', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
