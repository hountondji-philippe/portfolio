// api/analytics.js
// GET (résumé/sessions/live) + DELETE (supprimer une action ou une session), admin.
// GET  ?view=resume | sessions | live
// DELETE ?type=action&id=...        (supprime une entrée d'activité récente)
// DELETE ?type=session&sessionId=... (supprime une session + ses visites/actions)

const { getPrismaClient } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

async function vueResume(req, res, prisma) {
  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const il30j = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const il14j = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const il5min = new Date(Date.now() - 5 * 60 * 1000);

  const [totalVisiteurs, visitesAujourdhui, visiteurs30j, enDirect] = await Promise.all([
    prisma.visitorSession.count(),
    prisma.visit.findMany({ where: { entreeAt: { gte: debutJour } }, distinct: ['sessionId'], select: { sessionId: true } }),
    prisma.visit.findMany({ where: { entreeAt: { gte: il30j } }, distinct: ['sessionId'], select: { sessionId: true } }),
    prisma.visitorSession.count({ where: { derniereVue: { gte: il5min } } }),
  ]);

  const visitesRecentes = await prisma.visit.findMany({
    where: { entreeAt: { gte: il30j } },
    select: { page: true, sessionId: true, dureeSec: true },
  });

  const pagesMap = {};
  visitesRecentes.forEach((v) => {
    if (!pagesMap[v.page]) pagesMap[v.page] = { page: v.page, vues: 0, sessions: new Set(), dureeTotale: 0 };
    pagesMap[v.page].vues += 1;
    pagesMap[v.page].sessions.add(v.sessionId);
    pagesMap[v.page].dureeTotale += v.dureeSec || 0;
  });
  const pagesPopulaires = Object.values(pagesMap)
    .map((p) => ({ page: p.page, vues: p.vues, visiteursUniques: p.sessions.size, dureeMoy: Math.round(p.dureeTotale / p.vues) }))
    .sort((a, b) => b.vues - a.vues)
    .slice(0, 8);

  const visitesParJour = await prisma.visit.findMany({
    where: { entreeAt: { gte: il14j } },
    select: { entreeAt: true, sessionId: true },
  });
  const parJourMap = {};
  visitesParJour.forEach((v) => {
    const jour = v.entreeAt.toISOString().slice(0, 10);
    if (!parJourMap[jour]) parJourMap[jour] = new Set();
    parJourMap[jour].add(v.sessionId);
  });
  const parJour = Object.entries(parJourMap).map(([jour, s]) => ({ jour, visiteurs: s.size }));

  const dureesValides = visitesRecentes.filter((v) => v.dureeSec > 0 && v.dureeSec < 3600);
  const dureeMoyGlobale = dureesValides.length
    ? Math.round(dureesValides.reduce((acc, v) => acc + v.dureeSec, 0) / dureesValides.length)
    : 0;

  const sessionsParPays = await prisma.visitorSession.groupBy({
    by: ['pays'], where: { pays: { not: null } }, _count: true, orderBy: { _count: { pays: 'desc' } }, take: 10,
  });

  return res.status(200).json({
    totalVisiteurs, visiteursAujourdhui: visitesAujourdhui.length, visiteurs30j: visiteurs30j.length,
    enDirect, dureeMoySec: dureeMoyGlobale, pagesPopulaires, parJour,
    parPays: sessionsParPays.map((p) => ({ pays: p.pays, nb: p._count })),
  });
}

async function vueSessions(req, res, prisma) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const sessions = await prisma.visitorSession.findMany({ orderBy: { derniereVue: 'desc' }, take: limit });
  return res.status(200).json({ sessions });
}

async function vueLive(req, res, prisma) {
  const il5min = new Date(Date.now() - 5 * 60 * 1000);
  const [enDirect, actionsRecentes] = await Promise.all([
    prisma.visitorSession.count({ where: { derniereVue: { gte: il5min } } }),
    prisma.visitorAction.findMany({
      orderBy: { createdAt: 'desc' }, take: 15,
      select: { id: true, typeAction: true, cible: true, page: true, createdAt: true, sessionId: true },
    }),
  ]);
  return res.status(200).json({
    enDirect,
    actionsRecentes: actionsRecentes.map((a) => ({ ...a, sessionCourt: a.sessionId.slice(0, 8) })),
  });
}

async function supprimerAction(req, res, prisma) {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'ID requis.' });
  try {
    await prisma.visitorAction.delete({ where: { id } });
    return res.status(200).json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Action introuvable.' });
    console.error('[analytics DELETE action]', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function supprimerSession(req, res, prisma) {
  const sessionId = req.query.sessionId;
  if (!sessionId) return res.status(400).json({ error: 'sessionId requis.' });
  try {
    // Pas de relation en cascade dans le schéma (sessionId est un simple
    // champ, pas une clé étrangère) : suppression manuelle dans les trois
    // tables concernées, regroupée en une seule transaction.
    await prisma.$transaction([
      prisma.visitorAction.deleteMany({ where: { sessionId } }),
      prisma.visit.deleteMany({ where: { sessionId } }),
      prisma.visitorSession.delete({ where: { sessionId } }),
    ]);
    return res.status(200).json({ success: true });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Session introuvable.' });
    console.error('[analytics DELETE session]', err.message);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

async function handler(req, res) {
  const prisma = getPrismaClient();

  if (req.method === 'GET') {
    try {
      const view = req.query.view;
      if (view === 'resume') return await vueResume(req, res, prisma);
      if (view === 'sessions') return await vueSessions(req, res, prisma);
      if (view === 'live') return await vueLive(req, res, prisma);
      return res.status(400).json({ error: 'Vue inconnue.' });
    } catch (err) {
      console.error('[analytics]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'DELETE') {
    const type = req.query.type;
    try {
      if (type === 'action') return await supprimerAction(req, res, prisma);
      if (type === 'session') return await supprimerSession(req, res, prisma);
      return res.status(400).json({ error: 'Type de suppression inconnu.' });
    } catch (err) {
      console.error('[analytics DELETE]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

module.exports = requireAuth(handler);