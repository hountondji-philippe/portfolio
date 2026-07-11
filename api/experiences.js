// api/experiences.js
// GET (public) : liste. POST (admin) : ajout. PUT/DELETE (admin) via ?id=.

const { getPrismaClient } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

const STATUTS_VALIDES = ['TERMINE', 'EN_COURS', 'PREVU', 'RECHERCHE'];

async function handler(req, res) {
  const prisma = getPrismaClient();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const experiences = await prisma.experience.findMany({ orderBy: { ordre: 'asc' } });
      return res.status(200).json({ success: true, experiences });
    } catch (err) {
      console.error('[experiences GET]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé.' });

  function lireBody() {
    return {
      titre: String(req.body.titre || '').trim().slice(0, 200),
      typeExp: String(req.body.typeExp || '').trim().slice(0, 100),
      entreprise: String(req.body.entreprise || '').trim().slice(0, 200),
      lieu: String(req.body.lieu || '').trim().slice(0, 200),
      dateDebut: String(req.body.dateDebut || '').trim().slice(0, 100),
      dateFin: String(req.body.dateFin || '').trim().slice(0, 100),
      description: String(req.body.description || '').trim().slice(0, 2000),
      tags: String(req.body.tags || '').trim().slice(0, 500),
      statut: String(req.body.statut || 'TERMINE').trim(),
      ordre: parseInt(req.body.ordre, 10) || 0,
    };
  }

  if (req.method === 'POST') {
    try {
      const data = lireBody();
      if (data.titre.length < 2) return res.status(400).json({ error: 'Titre trop court.' });
      if (!STATUTS_VALIDES.includes(data.statut)) return res.status(400).json({ error: 'Statut invalide.' });
      const experience = await prisma.experience.create({ data });
      return res.status(201).json({ success: true, experience });
    } catch (err) {
      console.error('[experiences POST]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      const data = lireBody();
      if (data.titre.length < 2) return res.status(400).json({ error: 'Titre trop court.' });
      if (!STATUTS_VALIDES.includes(data.statut)) return res.status(400).json({ error: 'Statut invalide.' });
      const experience = await prisma.experience.update({ where: { id }, data });
      return res.status(200).json({ success: true, experience });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Expérience introuvable.' });
      console.error('[experiences PUT]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      await prisma.experience.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Expérience introuvable.' });
      console.error('[experiences DELETE]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

module.exports = (req, res) => {
  if (req.method === 'GET') return handler(req, res);
  return requireAuth(handler)(req, res);
};