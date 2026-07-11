// api/formations.js
// GET (public) : liste. POST (admin) : ajout. PUT/DELETE (admin) via ?id=.
//
// Fusionne aussi les réglages du site (ex-api/settings.js) via ?resource=settings,
// pour rester sous la limite de fonctions serverless du plan Vercel Hobby (12 max) :
//   GET  /api/formations?resource=settings        (public)  -> { settings: { cvUrl } }
//   PUT  /api/formations?resource=settings         (admin)  -> body: { cvUrl }

const { getPrismaClient } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

const STATUTS_VALIDES = ['EN_COURS', 'OBTENU'];

// ── Réglages du site (ex api/settings.js) ───────────────────────────────────
async function handlerSettings(req, res, prisma) {
  if (req.method === 'GET') {
    try {
      const settings = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
      return res.status(200).json({ success: true, settings: { cvUrl: settings ? settings.cvUrl : null } });
    } catch (err) {
      console.error('[formations/settings GET]', err.message);
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
      console.error('[formations/settings PUT]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

// ── Formations ───────────────────────────────────────────────────────────────
async function handler(req, res) {
  const prisma = getPrismaClient();
  const { id, resource } = req.query;

  if (resource === 'settings') {
    return handlerSettings(req, res, prisma);
  }

  if (req.method === 'GET') {
    try {
      const formations = await prisma.formation.findMany({ orderBy: { ordre: 'asc' } });
      return res.status(200).json({ success: true, formations });
    } catch (err) {
      console.error('[formations GET]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé.' });

  if (req.method === 'POST') {
    try {
      const titre = String(req.body.titre || '').trim().slice(0, 200);
      const ecole = String(req.body.ecole || '').trim().slice(0, 200);
      const periode = String(req.body.periode || '').trim().slice(0, 100);
      const description = String(req.body.description || '').trim().slice(0, 2000);
      const statut = String(req.body.statut || 'OBTENU').trim();
      const ordre = parseInt(req.body.ordre, 10) || 0;

      if (titre.length < 2) return res.status(400).json({ error: 'Titre trop court.' });
      if (!STATUTS_VALIDES.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });

      const formation = await prisma.formation.create({
        data: { titre, ecole: ecole || null, periode: periode || null, description: description || null, statut, ordre },
      });
      return res.status(201).json({ success: true, formation });
    } catch (err) {
      console.error('[formations POST]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      const titre = String(req.body.titre || '').trim().slice(0, 200);
      const ecole = String(req.body.ecole || '').trim().slice(0, 200);
      const periode = String(req.body.periode || '').trim().slice(0, 100);
      const description = String(req.body.description || '').trim().slice(0, 2000);
      const statut = String(req.body.statut || 'OBTENU').trim();
      const ordre = parseInt(req.body.ordre, 10) || 0;

      if (!STATUTS_VALIDES.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });

      const formation = await prisma.formation.update({
        where: { id },
        data: { titre, ecole: ecole || null, periode: periode || null, description: description || null, statut, ordre },
      });
      return res.status(200).json({ success: true, formation });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Formation introuvable.' });
      console.error('[formations PUT]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      await prisma.formation.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Formation introuvable.' });
      console.error('[formations DELETE]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

module.exports = (req, res) => {
  if (req.method === 'GET') return handler(req, res);
  return requireAuth(handler)(req, res);
};