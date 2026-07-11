// api/skills.js
// GET (public) : liste. POST (admin) : ajout. PUT/DELETE (admin) via ?id=xxx.
// Consolide skills/index.js + skills/[id].js en un seul fichier pour rester
// sous la limite de fonctions serverless du plan Vercel Hobby.

const { getPrismaClient } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

const CATEGORIES_VALIDES = [
  'FRONTEND', 'BACKEND', 'MOBILE', 'RESEAUX_INFRA',
  'MARKETING_DIGITAL', 'DESIGN_CONTENU', 'AUTRE',
];

async function handler(req, res) {
  const prisma = getPrismaClient();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const skills = await prisma.skill.findMany({ orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }] });
      return res.status(200).json({ success: true, skills });
    } catch (err) {
      console.error('[skills GET]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  // Toutes les autres méthodes exigent une authentification admin.
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé.' });

  if (req.method === 'POST') {
    try {
      const nom = String(req.body.nom || '').trim().slice(0, 100);
      const icone = String(req.body.icone || '').trim().slice(0, 255);
      const categorie = String(req.body.categorie || '').trim();
      const ordre = parseInt(req.body.ordre, 10) || 0;

      if (nom.length < 1) return res.status(400).json({ error: 'Nom requis.' });
      if (!CATEGORIES_VALIDES.includes(categorie)) return res.status(400).json({ error: 'Catégorie invalide.' });

      const skill = await prisma.skill.create({ data: { nom, icone, categorie, ordre } });
      return res.status(201).json({ success: true, skill });
    } catch (err) {
      console.error('[skills POST]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      const nom = String(req.body.nom || '').trim().slice(0, 100);
      const icone = String(req.body.icone || '').trim().slice(0, 255);
      const categorie = String(req.body.categorie || '').trim();
      const ordre = parseInt(req.body.ordre, 10) || 0;

      if (!CATEGORIES_VALIDES.includes(categorie)) return res.status(400).json({ error: 'Catégorie invalide.' });

      const skill = await prisma.skill.update({ where: { id }, data: { nom, icone, categorie, ordre } });
      return res.status(200).json({ success: true, skill });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Compétence introuvable.' });
      console.error('[skills PUT]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      await prisma.skill.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Compétence introuvable.' });
      console.error('[skills DELETE]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

module.exports = (req, res) => {
  if (req.method === 'GET') return handler(req, res);
  return requireAuth(handler)(req, res);
};