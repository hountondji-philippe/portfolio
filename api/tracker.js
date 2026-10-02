const { getPrismaClient } = require('../lib/db');
const { clientIP, hasherIP, genererSessionId, geoLocaliser } = require('../lib/tracking');

const ACTIONS_AUTORISEES = [
  'scroll_bas', 'clic_contact', 'clic_projet', 'clic_cv',
  'clic_github', 'clic_linkedin', 'clic_whatsapp',
];

const rateLimitMap = new Map();
const LIMITE_PAR_MINUTE = 60;

function verifierRateLimit(ip) {
  const maintenant = Date.now();
  const entree = rateLimitMap.get(ip) || { nb: 0, debut: maintenant };

  if (maintenant - entree.debut > 60000) {
    rateLimitMap.set(ip, { nb: 1, debut: maintenant });
    return true;
  }

  if (entree.nb >= LIMITE_PAR_MINUTE) return false;

  entree.nb++;
  rateLimitMap.set(ip, entree);
  return true;
}

async function traiterVisite(req, res, prisma) {
  const page = String(req.body.page || '/').slice(0, 255);
  const referrer = String(req.body.referrer || '').slice(0, 500);
  const sessionId = genererSessionId(req);
  const ip = clientIP(req);
  const ipHash = hasherIP(ip);
  const userAgent = String(req.headers['user-agent'] || '').slice(0, 500);
  const geo = await geoLocaliser(ip);

  await prisma.visit.create({ data: { sessionId, page, referrer, userAgent, ipHash, pays: geo.pays, ville: geo.ville } });
  await prisma.visitorSession.upsert({
    where: { sessionId },
    update: { derniereVue: new Date(), nbPages: { increment: 1 }, pays: geo.pays || undefined, ville: geo.ville || undefined },
    create: { sessionId, userAgent, ipHash, pays: geo.pays, ville: geo.ville },
  });
  return res.status(200).json({ ok: true });
}

async function traiterAction(req, res, prisma) {
  const typeActionBrut = String(req.body.typeAction || '');
  const typeAction = ACTIONS_AUTORISEES.includes(typeActionBrut) ? typeActionBrut : 'autre';
  const cible = String(req.body.cible || '').slice(0, 255);
  const page = String(req.body.page || '/').slice(0, 255);
  const sessionId = genererSessionId(req);

  await prisma.visitorAction.create({ data: { sessionId, typeAction, cible, page } });
  await prisma.visitorSession.update({
    where: { sessionId },
    data: { nbActions: { increment: 1 }, derniereVue: new Date() },
  }).catch(() => {});
  return res.status(200).json({ ok: true });
}

async function traiterDuree(req, res, prisma) {
  const page = String(req.body.page || '/').slice(0, 255);
  const duree = Math.min(Math.max(parseInt(req.body.dureeSec, 10) || 0, 0), 3600);
  const sessionId = genererSessionId(req);

  const derniereVisite = await prisma.visit.findFirst({
    where: { sessionId, page, sortieAt: null },
    orderBy: { entreeAt: 'desc' },
  });
  if (derniereVisite) {
    await prisma.visit.update({ where: { id: derniereVisite.id }, data: { dureeSec: duree, sortieAt: new Date() } });
  }
  return res.status(200).json({ ok: true });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée.' });

  const ip = String((req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown');
  if (!verifierRateLimit(ip)) {
    return res.status(429).json({ ok: false });
  }

  try {
    const prisma = getPrismaClient();
    const event = req.body.event;

    if (event === 'visite') return await traiterVisite(req, res, prisma);
    if (event === 'action') return await traiterAction(req, res, prisma);
    if (event === 'duree') return await traiterDuree(req, res, prisma);

    return res.status(400).json({ error: 'Événement inconnu.' });
  } catch {
    return res.status(500).json({ ok: false });
  }
};
