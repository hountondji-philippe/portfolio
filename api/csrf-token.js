// api/csrf-token.js
// Délivre un token CSRF stateless pour sécuriser le formulaire de contact.

const { genererCsrfToken } = require('../lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  const csrfToken = genererCsrfToken();
  return res.status(200).json({ csrfToken });
};