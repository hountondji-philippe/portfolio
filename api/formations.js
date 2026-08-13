// api/formations.js
// GET (public) : liste. POST (admin) : ajout. PUT/DELETE (admin) via ?id=.
//
// Fusionne aussi (pour rester sous la limite de fonctions serverless du plan
// Vercel Hobby, 12 max) :
//   - les réglages/profil du site, via ?resource=settings
//       GET  /api/formations?resource=settings   (public)  -> { settings: {...} }
//       PUT  /api/formations?resource=settings   (admin)   -> body: { titrePro, bio, photoUrl, telephone, emailPublic, localisation, qualites }
//   - les langues, via ?resource=languages
//       GET    /api/formations?resource=languages           (public)  -> { languages: [...] }
//       POST   /api/formations?resource=languages           (admin)   -> body: { nom, niveau, ordre }
//       PUT    /api/formations?resource=languages&id=xxx    (admin)
//       DELETE /api/formations?resource=languages&id=xxx    (admin)

const { getPrismaClient } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

const STATUTS_VALIDES = ['EN_COURS', 'OBTENU'];

// ── Réglages / profil du CV (ex api/settings.js) ────────────────────────────
async function handlerSettings(req, res, prisma) {
  if (req.method === 'GET') {
    try {
      const s = await prisma.siteSettings.findUnique({ where: { id: 'main' } });
      return res.status(200).json({
        success: true,
        settings: {
          titrePro: s ? s.titrePro : null,
          bio: s ? s.bio : null,
          photoUrl: s ? s.photoUrl : null,
          telephone: s ? s.telephone : null,
          emailPublic: s ? s.emailPublic : null,
          localisation: s ? s.localisation : null,
          qualites: s ? s.qualites : null,
        },
      });
    } catch (err) {
      console.error('[formations/settings GET]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé.' });

  if (req.method === 'PUT') {
    try {
      const titrePro = String(req.body.titrePro || '').trim().slice(0, 150);
      const bio = String(req.body.bio || '').trim().slice(0, 3000);
      const photoUrl = String(req.body.photoUrl || '').trim();
      const telephone = String(req.body.telephone || '').trim().slice(0, 30);
      const emailPublic = String(req.body.emailPublic || '').trim().slice(0, 254);
      const localisation = String(req.body.localisation || '').trim().slice(0, 150);
      const qualites = String(req.body.qualites || '').trim().slice(0, 500);

      const data = {
        titrePro: titrePro || null,
        bio: bio || null,
        photoUrl: photoUrl || null,
        telephone: telephone || null,
        emailPublic: emailPublic || null,
        localisation: localisation || null,
        qualites: qualites || null,
      };

      const settings = await prisma.siteSettings.upsert({
        where: { id: 'main' },
        update: data,
        create: { id: 'main', ...data },
      });
      return res.status(200).json({ success: true, settings });
    } catch (err) {
      console.error('[formations/settings PUT]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

// ── Langues (nouveau, fusionné ici) ─────────────────────────────────────────
async function handlerLanguages(req, res, prisma) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const languages = await prisma.langue.findMany({ orderBy: { ordre: 'asc' } });
      return res.status(200).json({ success: true, languages });
    } catch (err) {
      console.error('[formations/languages GET]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ error: 'Non autorisé.' });

  if (req.method === 'POST') {
    try {
      const nom = String(req.body.nom || '').trim().slice(0, 100);
      const niveau = String(req.body.niveau || '').trim().slice(0, 50);
      const ordre = parseInt(req.body.ordre, 10) || 0;

      if (nom.length < 2) return res.status(400).json({ error: 'Nom de langue trop court.' });
      if (!niveau) return res.status(400).json({ error: 'Niveau requis.' });

      const langue = await prisma.langue.create({ data: { nom, niveau, ordre } });
      return res.status(201).json({ success: true, langue });
    } catch (err) {
      console.error('[formations/languages POST]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      const nom = String(req.body.nom || '').trim().slice(0, 100);
      const niveau = String(req.body.niveau || '').trim().slice(0, 50);
      const ordre = parseInt(req.body.ordre, 10) || 0;

      if (nom.length < 2) return res.status(400).json({ error: 'Nom de langue trop court.' });
      if (!niveau) return res.status(400).json({ error: 'Niveau requis.' });

      const langue = await prisma.langue.update({ where: { id }, data: { nom, niveau, ordre } });
      return res.status(200).json({ success: true, langue });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Langue introuvable.' });
      console.error('[formations/languages PUT]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      await prisma.langue.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Langue introuvable.' });
      console.error('[formations/languages DELETE]', err.message);
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
  if (resource === 'languages') {
    return handlerLanguages(req, res, prisma);
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