// scripts/setup-admin.js
// Crée le compte admin unique. À exécuter une seule fois, en local,
// jamais via une route HTTP publique.
// Utilisation : node scripts/setup-admin.js

const bcrypt = require('bcrypt');
const { getPrismaClient } = require('../lib/db');

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('ADMIN_EMAIL et ADMIN_PASSWORD doivent être définis dans .env');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('ADMIN_PASSWORD doit faire au moins 12 caractères.');
    process.exit(1);
  }

  const prisma = getPrismaClient();
  const existant = await prisma.admin.findUnique({ where: { email } });

  if (existant) {
    console.log('Un compte admin existe déjà pour cet email.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 14);
  await prisma.admin.create({ data: { email, passwordHash } });

  console.log('Compte admin créé pour ' + email);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});