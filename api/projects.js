// api/projects.js
// GET (public, ?type=) : liste. POST (admin) : ajout. PUT/DELETE (admin) via ?id=.

const { getPrismaClient } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

const TYPES_VALIDES = ['ACADEMIQUE', 'PROFESSIONNEL'];
const STATUTS_VALIDES = ['TERMINE', 'EN_COURS', 'PREVU'];

function isURLSafe(val) {
  if (!val) return true;
  return !/^(javascript|data|vbscript|file|blob):/i.test(String(val).trim());
}

async function handler(req, res) {
  const prisma = getPrismaClient();
  const { id, type } = req.query;

  if (req.method === 'GET') {
    try {
      const where = {};
      if (type && TYPES_VALIDES.includes(type)) where.type = type;
      const projects = await prisma.project.findMany({ where, orderBy: { ordre: 'asc' } });
      return res.status(200).json({ success: true, projects });
    } catch (err) {
      console.error('[projects GET]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé.' });

  if (req.method === 'POST') {
    try {
      const titre = String(req.body.titre || '').trim().slice(0, 200);
      const description = String(req.body.description || '').trim().slice(0, 2000);
      const technologies = String(req.body.technologies || '').trim().slice(0, 500);
      const lienSite = String(req.body.lienSite || '').trim().slice(0, 500);
      const lienGithub = String(req.body.lienGithub || '').trim().slice(0, 500);
      const imageUrl = String(req.body.imageUrl || '').trim();
      const projetType = String(req.body.type || '').trim();
      const statut = String(req.body.statut || 'TERMINE').trim();
      const ordre = parseInt(req.body.ordre, 10) || 0;

      if (titre.length < 2) return res.status(400).json({ error: 'Titre trop court.' });
      if (description.length < 5) return res.status(400).json({ error: 'Description trop courte.' });
      if (!TYPES_VALIDES.includes(projetType)) return res.status(400).json({ error: 'Type invalide.' });
      if (!STATUTS_VALIDES.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });
      if (!isURLSafe(lienSite) || !isURLSafe(lienGithub) || !isURLSafe(imageUrl)) {
        return res.status(400).json({ error: 'URL invalide détectée.' });
      }

      const project = await prisma.project.create({
        data: { titre, description, technologies: technologies || null, lienSite: lienSite || null, lienGithub: lienGithub || null, imageUrl: imageUrl || null, type: projetType, statut, ordre },
      });
      return res.status(201).json({ success: true, project });
    } catch (err) {
      console.error('[projects POST]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      const titre = String(req.body.titre || '').trim().slice(0, 200);
      const description = String(req.body.description || '').trim().slice(0, 2000);
      const technologies = String(req.body.technologies || '').trim().slice(0, 500);
      const lienSite = String(req.body.lienSite || '').trim().slice(0, 500);
      const lienGithub = String(req.body.lienGithub || '').trim().slice(0, 500);
      const imageUrl = String(req.body.imageUrl || '').trim();
      const projetType = String(req.body.type || '').trim();
      const statut = String(req.body.statut || 'TERMINE').trim();
      const ordre = parseInt(req.body.ordre, 10) || 0;

      if (!TYPES_VALIDES.includes(projetType)) return res.status(400).json({ error: 'Type invalide.' });
      if (!STATUTS_VALIDES.includes(statut)) return res.status(400).json({ error: 'Statut invalide.' });
      if (!isURLSafe(lienSite) || !isURLSafe(lienGithub) || !isURLSafe(imageUrl)) {
        return res.status(400).json({ error: 'URL invalide détectée.' });
      }

      const project = await prisma.project.update({
        where: { id },
        data: { titre, description, technologies: technologies || null, lienSite: lienSite || null, lienGithub: lienGithub || null, imageUrl: imageUrl || null, type: projetType, statut, ordre },
      });
      return res.status(200).json({ success: true, project });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Projet introuvable.' });
      console.error('[projects PUT]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      await prisma.project.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Projet introuvable.' });
      console.error('[projects DELETE]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

module.exports = (req, res) => {
  if (req.method === 'GET') return handler(req, res);
  return requireAuth(handler)(req, res);
};