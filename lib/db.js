const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');

neonConfig.webSocketConstructor = ws;

let prisma;

function getPrismaClient() {
  if (prisma) return prisma;

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL manquante dans les variables d\'environnement.');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);
  prisma = new PrismaClient({ adapter });

  return prisma;
}

module.exports = { getPrismaClient };
