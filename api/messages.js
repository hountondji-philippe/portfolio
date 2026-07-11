// api/messages.js
// GET/PATCH/DELETE (admin uniquement). ?id= pour PATCH/DELETE.

const { getPrismaClient } = require('../lib/db');
const { requireAuth } = require('../lib/auth');

async function handler(req, res) {
  const prisma = getPrismaClient();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 500);
      const filter = req.query.filter;
      const where = {};
      if (filter === 'read') where.isRead = true;
      if (filter === 'unread') where.isRead = false;

      const [total, messages] = await Promise.all([
        prisma.message.count({ where }),
        prisma.message.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      ]);
      return res.status(200).json({ success: true, messages, total, page, limit });
    } catch (err) {
      console.error('[messages GET]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'PATCH') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      const existant = await prisma.message.findUnique({ where: { id } });
      if (!existant) return res.status(404).json({ error: 'Message introuvable.' });
      const message = await prisma.message.update({ where: { id }, data: { isRead: !existant.isRead } });
      return res.status(200).json({ success: true, isRead: message.isRead });
    } catch (err) {
      console.error('[messages PATCH]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'ID requis.' });
    try {
      await prisma.message.delete({ where: { id } });
      return res.status(200).json({ success: true });
    } catch (err) {
      if (err.code === 'P2025') return res.status(404).json({ error: 'Message introuvable.' });
      console.error('[messages DELETE]', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

module.exports = requireAuth(handler);