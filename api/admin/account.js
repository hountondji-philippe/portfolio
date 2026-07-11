// api/admin/account.js
// Regroupe toutes les actions admin secondaires dans un seul fichier pour
// rester sous la limite de fonctions serverless du plan Vercel Hobby :
// logout, change-password, stats, send-reply (email Gmail), upload-image.
//
// GET  ?action=stats
// POST body.action = 'logout' | 'change-password' | 'send-reply' | 'upload-image'

const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const validator = require('validator');
const { put } = require('@vercel/blob');
const { getPrismaClient } = require('../../lib/db');
const { requireAuth, revoquerToken } = require('../../lib/auth');

const TAILLE_MAX_IMAGE = 5 * 1024 * 1024;

function genererEmailHTML({ nomDestinataire, reponse, messageOriginal, dateMessage }) {
  function echapper(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  const reponseFmt = echapper(reponse).replace(/\n/g, '<br>');
  const messageFmt = echapper(messageOriginal).replace(/\n/g, '<br>');
  return `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:0;background:#f0f2f5;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
<tr><td style="background:#111214;padding:28px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:20px;">Philippe Hountondji</h1>
<p style="margin:6px 0 0;color:#9aa0a6;font-size:12px;">Porto-Novo, Benin</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="margin:0 0 20px;font-size:16px;">Bonjour ${echapper(nomDestinataire)},</p>
<p style="margin:0 0 8px;font-size:12px;color:#6b7269;text-transform:uppercase;">Votre message du ${echapper(dateMessage)}</p>
<div style="background:#f6f7f3;border-left:3px solid #9aa0a6;padding:14px 16px;margin-bottom:20px;font-style:italic;color:#475569;">${messageFmt}</div>
<p style="margin:0 0 8px;font-size:12px;color:#62b808;text-transform:uppercase;">Ma reponse</p>
<div style="background:#eaf6d9;border-left:3px solid #62b808;padding:14px 16px;">${reponseFmt}</div>
</td></tr></table></td></tr></table></body></html>`;
}

async function actionStats(req, res, prisma) {
  const debutJour = new Date(); debutJour.setHours(0, 0, 0, 0);
  const [total, lus, nonLus, aujourdhui, repondus, skillsCount, projectsCount] = await Promise.all([
    prisma.message.count(),
    prisma.message.count({ where: { isRead: true } }),
    prisma.message.count({ where: { isRead: false } }),
    prisma.message.count({ where: { createdAt: { gte: debutJour } } }),
    prisma.message.count({ where: { repliedAt: { not: null } } }),
    prisma.skill.count(),
    prisma.project.count(),
  ]);
  return res.status(200).json({ success: true, stats: { total, read: lus, unread: nonLus, today: aujourdhui, replied: repondus, skillsCount, projectsCount } });
}

async function actionLogout(req, res, admin) {
  await revoquerToken(admin);
  return res.status(200).json({ success: true });
}

async function actionChangePassword(req, res, prisma, admin) {
  const current = String(req.body.current || '').slice(0, 128);
  const next = String(req.body.next || '').slice(0, 128);
  if (!current || !next) return res.status(400).json({ error: 'Les deux mots de passe sont requis.' });
  if (next.length < 12) return res.status(400).json({ error: 'Mot de passe trop court (12 caractères min).' });
  if (current === next) return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent.' });

  const compte = await prisma.admin.findUnique({ where: { id: admin.id } });
  if (!compte) return res.status(404).json({ error: 'Compte introuvable.' });

  const valide = await bcrypt.compare(current, compte.passwordHash);
  if (!valide) return res.status(401).json({ error: 'Mot de passe actuel incorrect.' });

  const nouveauHash = await bcrypt.hash(next, 14);
  await prisma.admin.update({ where: { id: compte.id }, data: { passwordHash: nouveauHash } });
  await revoquerToken(admin);
  return res.status(200).json({ success: true });
}

async function actionSendReply(req, res, prisma) {
  const to = String(req.body.to || '').trim().slice(0, 254);
  const message = String(req.body.message || '').trim().slice(0, 5000);
  const nomDestinataire = String(req.body.nomDestinataire || 'visiteur(se)').slice(0, 100);
  const messageOriginal = String(req.body.messageOriginal || '').slice(0, 5000);
  const messageId = req.body.messageId;

  if (!validator.isEmail(to)) return res.status(400).json({ error: 'Email destinataire invalide.' });
  if (message.length < 5) return res.status(400).json({ error: 'Message trop court.' });
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return res.status(500).json({ error: 'Configuration Gmail manquante.' });
  }

  const dateMessage = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const html = genererEmailHTML({ nomDestinataire, reponse: message, messageOriginal, dateMessage });

  const transporteur = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  await transporteur.sendMail({
    from: '"Philippe Hountondji" <' + process.env.GMAIL_USER + '>',
    to, subject: 'Reponse a votre message - Philippe Hountondji', html,
  });

  if (messageId) {
    await prisma.message.update({ where: { id: messageId }, data: { repliedAt: new Date(), isRead: true } }).catch(() => {});
  }
  return res.status(200).json({ success: true });
}

async function actionUploadImage(req, res) {
  // Vérification explicite du token Vercel Blob : c'est la cause la plus
  // fréquente d'un 500 générique sur cette action.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[account upload-image] BLOB_READ_WRITE_TOKEN manquant dans les variables d\'environnement Vercel.');
    return res.status(500).json({ error: "Stockage d'image non configuré (token Vercel Blob manquant). Voir Vercel → Storage → Blob." });
  }

  const { imageBase64, nomFichier } = req.body || {};
  if (!imageBase64 || !imageBase64.startsWith('data:image/')) {
    return res.status(400).json({ error: 'Image invalide.' });
  }
  const correspondance = imageBase64.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!correspondance) return res.status(400).json({ error: 'Format image invalide.' });

  const extension = correspondance[1];
  const donnees = Buffer.from(correspondance[2], 'base64');
  if (donnees.length > TAILLE_MAX_IMAGE) return res.status(400).json({ error: 'Image trop lourde (max 5 Mo).' });

  const nom = 'projets/' + Date.now() + '-' + (nomFichier || 'image').replace(/[^a-zA-Z0-9.-]/g, '') + '.' + extension;

  try {
    const blob = await put(nom, donnees, { access: 'public', contentType: 'image/' + extension });
    return res.status(200).json({ success: true, url: blob.url });
  } catch (err) {
    // On log la vraie erreur côté serveur (visible dans Vercel → Logs)
    console.error('[account upload-image] Échec put() Vercel Blob :', err);
    // Et on la renvoie temporairement au client pour diagnostiquer plus vite.
    // À retirer une fois le problème résolu si tu préfères un message générique.
    return res.status(500).json({ error: 'Échec upload: ' + (err.message || 'erreur inconnue du stockage.') });
  }
}

async function handler(req, res) {
  const prisma = getPrismaClient();

  if (req.method === 'GET' && req.query.action === 'stats') {
    try { return await actionStats(req, res, prisma); }
    catch (err) { console.error('[account stats]', err.message); return res.status(500).json({ error: 'Erreur serveur.' }); }
  }

  if (req.method === 'POST') {
    const action = req.body.action;

    // upload-image gère déjà son propre try/catch en interne (pour
    // renvoyer un message précis) : on ne veut pas l'écraser ici.
    if (action === 'upload-image') return actionUploadImage(req, res);

    try {
      if (action === 'logout') return await actionLogout(req, res, req.admin);
      if (action === 'change-password') return await actionChangePassword(req, res, prisma, req.admin);
      if (action === 'send-reply') return await actionSendReply(req, res, prisma);
      return res.status(400).json({ error: 'Action inconnue.' });
    } catch (err) {
      console.error('[account ' + action + ']', err.message);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée.' });
}

module.exports = requireAuth(handler);