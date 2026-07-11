// api/settings.js
// GET (public) : renvoie les réglages du site (pour l'instant, juste cvUrl).
// PUT (admin) : met à jour un ou plusieurs réglages.

const { getPrismaClient } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

async function handler(req, res) {
  const prisma = getPrismaClient();

  if (req.method === 'GET') {
    try {
      const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
      return res.status(200).json({ success: true, settings: { cvUrl: settings ? settings.cvUrl : null } });
    } catch (err) {
      console.error('[settings GET]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé.' });

  if (req.method === 'PUT') {
    try {
      const cvUrl = String(req.body.cvUrl || '').trim();
      const settings = await prisma.siteSettings.upsert({
        where: { id: 'main' },
        update: { cvUrl: cvUrl || null },
        create: { id: 'main', cvUrl: cvUrl || null },
      });
      return res.status(200).json({ success: true, settings: { cvUrl: settings.cvUrl } });
    } catch (err) {
      console.error('[settings PUT]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

module.exports = (req, res) => {
  if (req.method === 'GET') return handler(req, res);
  return requireAuth(handler)(req, res);
};