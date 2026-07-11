// prisma/seed.js
// Réinjecte les données de départ (formations + expériences) après la
// migration qui a créé les nouvelles tables.
//
// Lancement : node prisma/seed.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ── FORMATIONS ──────────────────────────────────────────────────────
  await prisma.formation.createMany({
    data: [
      {
        titre: 'Licence 2 — Informatique de Gestion',
        ecole: "ENEAM, Université d'Abomey-Calavi, Cotonou",
        periode: '2025 — Présent',
        description: 'Approfondissement en développement web, administration système, sécurité informatique et bases de données.',
        statut: 'EN_COURS',
        ordre: 0,
      },
      {
        titre: 'Licence 1 — Informatique de Gestion',
        ecole: 'ENEAM, Cotonou',
        periode: '2025',
        description: "Première année validée. Bases en programmation, réseaux et systèmes d'exploitation.",
        statut: 'OBTENU',
        ordre: 1,
      },
      {
        titre: 'Baccalauréat',
        ecole: 'CEG Danto, Porto-Novo',
        periode: '2024',
        statut: 'OBTENU',
        ordre: 2,
      },
      {
        titre: 'BEPC',
        ecole: 'CEG Malé, Bénin',
        periode: '2021',
        statut: 'OBTENU',
        ordre: 3,
      },
    ],
  });

  // ── EXPERIENCES ─────────────────────────────────────────────────────
  await prisma.experience.createMany({
    data: [
      {
        // Stage trouvé : remplace l'ancienne entrée "en recherche".
        // Ajuste dateDebut/lieu/description si besoin, ce sont des
        // valeurs de départ raisonnables à partir de ce que tu as donné.
        titre: 'Stage de Licence 2 — Développeur web',
        typeExp: 'Stage académique',
        entreprise: 'NextMux',
        lieu: 'Bénin',
        dateDebut: '22 juin 2026',
        dateFin: null,
        description: 'Stage de fin de Licence 2 chez NextMux, en développement web. Mise en pratique des compétences full-stack sur des projets réels.',
        tags: 'Laravel, React, Node.js',
        statut: 'EN_COURS',
        ordre: 0,
      },
      {
        titre: 'Développeur web — Projets personnels',
        typeExp: 'Indépendant',
        entreprise: null,
        lieu: 'Porto-Novo, Bénin',
        dateDebut: '2024',
        dateFin: 'Présent',
        description: 'Développement de plusieurs applications web en autonomie, dont une plateforme sécurisée déployée en production pour les témoignages de violences basées sur le genre au Bénin.',
        tags: null,
        statut: 'TERMINE',
        ordre: 1,
      },
    ],
  });

  console.log('Seed terminé : formations et expériences réinjectées.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());