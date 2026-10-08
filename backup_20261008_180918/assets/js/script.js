const LABELS_CATEGORIES = {
  FRONTEND: 'Front-end',
  BACKEND: 'Back-end et logique serveur',
  MOBILE: 'Mobile',
  RESEAUX_INFRA: 'Réseaux et infrastructure',
  MARKETING_DIGITAL: 'Marketing digital',
  DESIGN_CONTENU: 'Design et création de contenu',
  AUTRE: 'Autres compétences',
};

const racineHtml = document.documentElement;
const basculeTheme = document.getElementById('basculeTheme');

const themeEnregistre = localStorage.getItem('theme-portfolio');
if (themeEnregistre) racineHtml.setAttribute('data-theme', themeEnregistre);

if (basculeTheme) {
  basculeTheme.addEventListener('click', () => {
    const actuel = racineHtml.getAttribute('data-theme');
    const nouveau = actuel === 'sombre' ? 'clair' : 'sombre';
    racineHtml.setAttribute('data-theme', nouveau);
    localStorage.setItem('theme-portfolio', nouveau);
  });
}

const boutonMenuMobile = document.getElementById('boutonMenuMobile');
const listeLiensNav = document.getElementById('listeLiensNav');
if (boutonMenuMobile && listeLiensNav) {
  boutonMenuMobile.addEventListener('click', () => {
    listeLiensNav.classList.toggle('ouvert');
  });
  listeLiensNav.querySelectorAll('a').forEach((lien) => {
    lien.addEventListener('click', () => listeLiensNav.classList.remove('ouvert'));
  });
}

const indexRecherche = [
  { titre: 'À propos', categorie: 'Section', cible: '#a-propos', motsClefs: 'profil parcours eneam' },
  { titre: 'Compétences', categorie: 'Section', cible: '#competences', motsClefs: 'laravel react node flutter php' },
  { titre: 'Projets', categorie: 'Section', cible: '#projets', motsClefs: 'projet realisation' },
  { titre: 'Contact', categorie: 'Section', cible: '#contact', motsClefs: 'email whatsapp linkedin' },
];

const champRecherche = document.getElementById('champRecherche');
const listeResultatsRecherche = document.getElementById('listeResultatsRecherche');

function afficherResultatsRecherche(terme) {
  if (!champRecherche || !listeResultatsRecherche) return;
  const t = terme.trim().toLowerCase();

  if (!t) {
    listeResultatsRecherche.classList.remove('visible');
    listeResultatsRecherche.innerHTML = '';
    return;
  }

  const resultats = indexRecherche.filter(
    (item) => item.titre.toLowerCase().includes(t) || item.motsClefs.includes(t)
  );

  listeResultatsRecherche.innerHTML = resultats.length
    ? resultats
        .map(
          (item, i) => `
        <li>
          <a href="${item.cible}" data-cible="${item.cible}" class="${i === 0 ? 'resultat-actif' : ''}">
            <span class="resultat-titre">${item.titre}</span>
            <span class="resultat-categorie">${item.categorie}</span>
          </a>
        </li>`
        )
        .join('')
    : `<li class="aucun-resultat">Aucun résultat pour « ${terme} »</li>`;

  listeResultatsRecherche.classList.add('visible');
}

if (champRecherche) {
  champRecherche.addEventListener('input', (e) => afficherResultatsRecherche(e.target.value));
  champRecherche.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const premier = listeResultatsRecherche.querySelector('a');
      if (premier) { e.preventDefault(); premier.click(); }
    }
  });
  listeResultatsRecherche.addEventListener('click', (e) => {
    const lien = e.target.closest('a');
    if (!lien) return;
    const cible = document.querySelector(lien.dataset.cible);
    if (cible) { e.preventDefault(); cible.scrollIntoView({ behavior: 'smooth' }); }
    champRecherche.value = '';
    listeResultatsRecherche.classList.remove('visible');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.zone-recherche-nav')) listeResultatsRecherche.classList.remove('visible');
  });
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      champRecherche.focus();
    }
  });
}

async function appliquerLienCV() {
  const liens = document.querySelectorAll('.lien-cv');
  if (!liens.length) return;
  try {
    const reponse = await fetch('/api/formations?resource=settings');
    const data = await reponse.json();
    if (data.success && data.settings.cvUrl) {
      liens.forEach((lien) => { lien.href = data.settings.cvUrl; });
    }
  } catch (err) {
    console.error('Erreur chargement CV', err);
  }
}

function echapperTexte(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderEtapeFormation(f, active) {
  const encours = f.statut === 'EN_COURS';
  const badgeClasse = encours ? 'badge-formation-encours' : 'badge-formation-termine';
  const badgeTexte = encours ? 'En cours' : 'Obtenu';
  const annee = f.periode || (f.anneeDebut ? [f.anneeDebut, f.anneeFin].filter(Boolean).join(' — ') : '');
  const titre = f.titre || f.diplome || '';
  const ecole = f.ecole || f.etablissement || '';
  return '<div class="item-formation' + (active ? ' item-en-cours' : '') + '">' +
    '<span class="badge-statut-formation ' + badgeClasse + '">' +
    '<span class="dot-statut"></span>' + badgeTexte +
    '</span>' +
    (annee ? '<div class="annee-formation">' + echapperTexte(annee) + '</div>' : '') +
    '<h3 class="titre-formation">' + echapperTexte(titre) + '</h3>' +
    (ecole ? '<p class="etablissement-formation">' + echapperTexte(ecole) + '</p>' : '') +
    (f.description ? '<p class="description-formation">' + echapperTexte(f.description) + '</p>' : '') +
    '</div>';
}

async function chargerFormations() {
  const conteneur = document.getElementById('timelineFormation');
  if (!conteneur) return;

  const FORMATIONS_DEFAUT = [
    {
      id: 1,
      diplome: "Licence 3 — Administration des Réseaux Informatiques",
      etablissement: "ENEAM (Université d'Abomey-Calavi)",
      lieu: "Porto-Novo / Cotonou, Bénin",
      anneeDebut: "2024",
      anneeFin: "2026",
      statut: "EN_COURS",
      description: "Spécialisation avancée en routage dynamique (OSPF, BGP), segmentation réseau (VLANs), cybersécurité, durcissement système et gestion d'infrastructures d'entreprise."
    },
    {
      id: 2,
      diplome: "Licence 1 & 2 — Informatique de Gestion",
      etablissement: "ENEAM (Université d'Abomey-Calavi)",
      lieu: "Bénin",
      anneeDebut: "2022",
      anneeFin: "2024",
      statut: "TERMINE",
      description: "Algorithmique avancée, architecture des ordinateurs, génie logiciel, modélisation MERISE & UML, bases de données relationnelles et développement web full-stack."
    },
    {
      id: 3,
      diplome: "Baccalauréat Scientifique — Série C",
      etablissement: "Enseignement Secondaire Général",
      lieu: "Bénin",
      anneeDebut: "2021",
      anneeFin: "2022",
      statut: "TERMINE",
      description: "Formation intensive en mathématiques pures et sciences physiques, rigueur analytique et logique formelle."
    }
  ];

  try {
    let formations = [];
    try {
      const reponse = await fetch('/api/formations');
      const data = await reponse.json();
      if (data.success && data.formations && data.formations.length) {
        formations = data.formations;
      }
    } catch (_) {}

    if (!formations.length) formations = FORMATIONS_DEFAUT;

    const enCours = formations.filter((f) => f.statut === 'EN_COURS');
    const miseEnAvant = enCours[0] || formations[0];
    const reste = formations.filter((f) => f.id !== miseEnAvant.id);

    let html = renderEtapeFormation(miseEnAvant, true);

    if (reste.length) {
      html += '<button type="button" class="bouton-toggle-formations" id="boutonToggleFormations">' +
        '<span class="texte-toggle-formations">Voir les formations précédentes</span>' +
        '<span class="fleche-toggle-formations">▾</span>' +
        '</button>' +
        '<div class="formations-precedentes" id="formationsPrecedentes">' +
        reste.map((f) => renderEtapeFormation(f, false)).join('') +
        '</div>';
    }

    conteneur.innerHTML = html;

    const boutonToggle = document.getElementById('boutonToggleFormations');
    const zonePrecedentes = document.getElementById('formationsPrecedentes');
    if (boutonToggle && zonePrecedentes) {
      boutonToggle.addEventListener('click', () => {
        const ouvert = zonePrecedentes.classList.toggle('ouverte');
        boutonToggle.classList.toggle('ouvert', ouvert);
        boutonToggle.querySelector('.texte-toggle-formations').textContent = ouvert
          ? 'Masquer les formations précédentes'
          : 'Voir les formations précédentes';
      });
    }
  } catch (err) {
    console.error('Erreur chargement formations', err);
  }
}

const LABELS_STATUT_EXP_PUBLIC = { TERMINE: 'Terminé', EN_COURS: 'En cours', PREVU: 'Prévu', RECHERCHE: 'En recherche active' };

async function chargerExperiencesPubliques() {
  const conteneur = document.getElementById('grilleExperience');
  if (!conteneur) return;

  const EXPERIENCES_DEFAUT = [
    {
      titre: "Développeur Full-Stack & Administrateur Réseau Indépendant",
      entreprise: "Projets Clients & Freelance",
      lieu: "Porto-Novo & Remote",
      dateDebut: "2023",
      dateFin: "Présent",
      statut: "EN_COURS",
      description: "Conception et déploiement de solutions sur mesure (Laravel, React, Node.js). Mise en place d'architectures réseau sécurisées, sécurisation d'APIs et optimisation des performances."
    },
    {
      titre: "Architecte & Développeur Plateforme VBG Bénin",
      entreprise: "Projet Citoyen & Impact Social",
      lieu: "Bénin",
      dateDebut: "2024",
      dateFin: "2024",
      statut: "TERMINE",
      description: "Création d'un système complet de signalement anonyme et sécurisé. Chiffrement de bout en bout des signalements sensibles, cartographie interactive et tableau de bord de suivi."
    },
    {
      titre: "Conception & Simulation Infrastructure Campus Multi-Sites",
      entreprise: "Travaux d'Ingénierie Réseau — ENEAM",
      lieu: "Bénin",
      dateDebut: "2023",
      dateFin: "2024",
      statut: "TERMINE",
      description: "Modélisation sous Cisco Packet Tracer : segmentation en VLANs 802.1Q, routage inter-VLAN, protocoles OSPF multi-aires, listes de contrôle d'accès (ACL) et redondance passerelle HSRP."
    }
  ];

  try {
    let experiences = [];
    try {
      const reponse = await fetch('/api/experiences');
      const data = await reponse.json();
      if (data.success && data.experiences && data.experiences.length) {
        experiences = data.experiences;
      }
    } catch (_) {}

    if (!experiences.length) experiences = EXPERIENCES_DEFAUT;

    conteneur.innerHTML = experiences.map((exp) => {
      const active = exp.statut === 'RECHERCHE' || exp.statut === 'EN_COURS';
      const meta = [exp.entreprise, exp.lieu, [exp.dateDebut, exp.dateFin].filter(Boolean).join(' — ')]
        .filter(Boolean).map(echapperTexte).join(' · ');
      return '<div class="carte-experience' + (active ? ' carte-experience-active' : '') + '">' +
        (active ? '<span class="badge-timeline badge-en-cours">' + (LABELS_STATUT_EXP_PUBLIC[exp.statut] || exp.statut) + '</span>' : '') +
        '<h3>' + echapperTexte(exp.titre) + '</h3>' +
        (meta ? '<p class="meta-experience">' + meta + '</p>' : '') +
        (exp.description ? '<p>' + echapperTexte(exp.description) + '</p>' : '') +
        '</div>';
    }).join('');
  } catch (err) {
    console.error('Erreur chargement expériences', err);
  }
}

async function chargerCompetences() {
  const conteneur = document.getElementById('listeAccordeonCompetences');
  if (!conteneur) return;

  const ICONES_CATEGORIES = ['mdi:code-braces', 'mdi:lan', 'mdi:server-security', 'mdi:database'];

  const COMPETENCES_DEFAUT = {
    "Développement Web & APIs": [
      { nom: "Laravel", icone: "logos:laravel" },
      { nom: "PHP 8", icone: "logos:php" },
      { nom: "React.js", icone: "logos:react" },
      { nom: "Node.js", icone: "logos:nodejs-icon" },
      { nom: "Next.js", icone: "logos:nextjs-icon" },
      { nom: "JavaScript", icone: "logos:javascript" },
      { nom: "TypeScript", icone: "logos:typescript-icon" },
      { nom: "Flutter", icone: "logos:flutter" },
      { nom: "HTML5", icone: "logos:html-5" },
      { nom: "CSS3 / Sass", icone: "logos:css-3" }
    ],
    "Réseaux, Télécoms & Protocoles": [
      { nom: "Cisco IOS", icone: "logos:cisco" },
      { nom: "Cisco Packet Tracer", icone: "mdi:router-network" },
      { nom: "Routage OSPF & BGP", icone: "mdi:lan-connect" },
      { nom: "VLANs & 802.1Q", icone: "mdi:network-outline" },
      { nom: "Wireshark", icone: "logos:wireshark" },
      { nom: "DNS & DHCP", icone: "mdi:server" },
      { nom: "Pare-feu & ACLs", icone: "mdi:firewall" }
    ],
    "Systèmes, DevOps & Sécurité": [
      { nom: "Linux Debian / Ubuntu", icone: "logos:linux-tux" },
      { nom: "Docker", icone: "logos:docker-icon" },
      { nom: "Git & GitHub", icone: "logos:git-icon" },
      { nom: "Nginx", icone: "logos:nginx" },
      { nom: "Apache", icone: "logos:apache" },
      { nom: "Sécurité OWASP", icone: "mdi:shield-check" },
      { nom: "Cryptographie & SSL/TLS", icone: "mdi:lock-check" }
    ],
    "Bases de Données & Conception": [
      { nom: "PostgreSQL", icone: "logos:postgresql" },
      { nom: "MySQL", icone: "logos:mysql" },
      { nom: "Redis", icone: "logos:redis" },
      { nom: "Modélisation MERISE / UML", icone: "mdi:sitemap" },
      { nom: "RESTful API Architecture", icone: "mdi:api" }
    ]
  };

  try {
    let parCategorie = {};
    try {
      const reponse = await fetch('/api/skills');
      const data = await reponse.json();
      if (data.success && data.skills && data.skills.length) {
        data.skills.forEach((skill) => {
          const cat = LABELS_CATEGORIES[skill.categorie] || skill.categorie;
          if (!parCategorie[cat]) parCategorie[cat] = [];
          parCategorie[cat].push(skill);
        });
      }
    } catch (_) {}

    if (!Object.keys(parCategorie).length) {
      parCategorie = COMPETENCES_DEFAUT;
    }

    conteneur.innerHTML = Object.entries(parCategorie)
      .map(([categorie, skills], index) => `
        <div class="bloc-categorie-competences">
          <div class="entete-cat-comp">
            <span class="pastille-cat-comp">
              <iconify-icon icon="${ICONES_CATEGORIES[index] || 'mdi:star'}" width="18"></iconify-icon>
            </span>
            <h3 class="titre-cat-comp">${categorie}</h3>
            <span class="nb-outils-comp">${skills.length} outils</span>
          </div>
          <div class="rangee-badges-comp">
            ${skills.map((s) => `
              <div class="badge-comp-h" title="${s.nom}">
                <iconify-icon icon="${s.icone}" width="20" height="20"></iconify-icon>
                <span>${s.nom}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

  } catch (err) {
    console.error('Erreur chargement compétences', err);
  }
}

async function chargerCompteursProjets() {
  const compteurAcademique = document.getElementById('compteurProjetsAcademiques');
  const compteurPro = document.getElementById('compteurProjetsPro');
  if (!compteurAcademique && !compteurPro) return;

  try {
    const [ra, rp] = await Promise.all([
      fetch('/api/projects?type=ACADEMIQUE'),
      fetch('/api/projects?type=PROFESSIONNEL'),
    ]);
    const da = await ra.json();
    const dp = await rp.json();
    if (compteurAcademique) compteurAcademique.textContent = (da.projects || []).length + ' projet(s)';
    if (compteurPro) compteurPro.textContent = (dp.projects || []).length + ' projet(s)';
  } catch (err) {
    console.error('Erreur chargement compteurs projets', err);
  }
}

const LABELS_STATUT = { TERMINE: 'Terminé', EN_COURS: 'En cours', PREVU: 'Prévu' };

const PROJETS_DEFAUT_FALLBACK = {
  ACADEMIQUE: [
    {
      titre: 'Architecture Réseau Campus Multi-Sites (Cisco IOS)',
      description: 'Déploiement complet d\'une topologie d\'entreprise sous Cisco IOS : routage dynamique OSPF multi-aires, segmentation 802.1Q par département, redondance de passerelle HSRP et filtrage par listes de contrôle d\'accès (ACL).',
      statut: 'TERMINE',
      technologies: 'Cisco IOS, OSPF, VLAN 802.1Q, HSRP, ACLs, Wireshark',
      imageUrl: 'images/projets-3.jpeg',
      lienSite: '',
      lienGithub: 'https://github.com/hountondji-philippe'
    },
    {
      titre: 'Conception & Modélisation Système d\'Information Bancaire',
      description: 'Analyse et conception complète d\'un système d\'information de gestion selon la méthode MERISE (MCD, MLD, MPD) et implémentation sur base relationnelle PostgreSQL avec contraintes d\'intégrité strictes.',
      statut: 'TERMINE',
      technologies: 'PostgreSQL, MERISE, Modélisation UML, SQL Avancé, Triggers',
      imageUrl: 'images/apropos.jpeg',
      lienSite: '',
      lienGithub: 'https://github.com/hountondji-philippe'
    },
    {
      titre: 'Audit de Sécurité Réseau & Analyse de Trames',
      description: 'Analyse approfondie du trafic réseau via Wireshark, simulation d\'attaques (ARP spoofing, scans de ports) et mise en place de contre-mesures de durcissement sur serveurs Linux Debian/Ubuntu.',
      statut: 'TERMINE',
      technologies: 'Wireshark, Linux Debian, Nmap, TCP/IP, Durcissement',
      imageUrl: 'images/projets-3.jpeg',
      lienSite: '',
      lienGithub: 'https://github.com/hountondji-philippe'
    }
  ],
  PROFESSIONNEL: [
    {
      titre: 'VBG Bénin — Système Sécurisé de Signalement Chiffré',
      description: 'Plateforme citoyenne à haute exigence de confidentialité pour la collecte et le traitement sécurisé des signalements. Chiffrement de bout en bout des données sensibles et tableaux de bord pour les intervenants.',
      statut: 'TERMINE',
      technologies: 'Laravel 11, AES-256, PostgreSQL, Leaflet Maps, Tailwind CSS',
      imageUrl: 'images/VBG.png',
      lienSite: '',
      lienGithub: 'https://github.com/hountondji-philippe'
    },
    {
      titre: 'NEXTMUX — Moteur de Multiplexage & Traitement de Flux',
      description: 'Architecture backend haute performance pour le routage, la transformation et la synchronisation de données multi-sources. Authentification JWT, files d\'attente asynchrones et monitoring en temps réel.',
      statut: 'TERMINE',
      technologies: 'Laravel 11, PHP 8.2, MySQL, REST API, JWT, Redis',
      imageUrl: 'images/apropos.jpeg',
      lienSite: '',
      lienGithub: 'https://github.com/hountondji-philippe'
    },
    {
      titre: 'RestoDirect — Gestion de Commandes & Flux Temps Réel',
      description: 'Système SaaS réactif pour la restauration et les services de livraison : suivi bidirectionnel en temps réel via WebSockets, gestion des stocks synchronisée et tableaux de bord interactifs.',
      statut: 'TERMINE',
      technologies: 'React.js, Node.js, Socket.io, PostgreSQL, Express',
      imageUrl: 'images/acceuil.jpeg',
      lienSite: '',
      lienGithub: 'https://github.com/hountondji-philippe'
    }
  ]
};

async function chargerListeProjets(type) {
  const conteneur = document.getElementById('grilleCartesProjets');
  if (!conteneur) return;

  function renderProjets(liste) {
    conteneur.innerHTML = liste.map((p) => `
      <div class="carte-projet">
        <div class="image-carte-projet">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.titre}">` : 'Aperçu à venir'}
        </div>
        <div class="corps-carte-projet">
          <span class="statut-carte-projet">${LABELS_STATUT[p.statut] || p.statut}</span>
          <h3>${p.titre}</h3>
          <p>${p.description}</p>
          ${p.technologies ? `
            <div class="tags-technos-projet">
              ${p.technologies.split(',').map((t) => `<span>${t.trim()}</span>`).join('')}
            </div>` : ''}
          <div class="liens-carte-projet">
            ${p.lienSite ? `<a href="${p.lienSite}" target="_blank" rel="noopener noreferrer">Voir le site</a>` : ''}
            ${p.lienGithub ? `<a href="${p.lienGithub}" target="_blank" rel="noopener noreferrer">GitHub</a>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  try {
    const reponse = await fetch('/api/projects?type=' + type);
    const data = await reponse.json();
    if (data.success && data.projects && data.projects.length) {
      renderProjets(data.projects);
      return;
    }
  } catch (_) {}

  const fallback = PROJETS_DEFAUT_FALLBACK[type] || [];
  if (fallback.length) {
    renderProjets(fallback);
  } else {
    conteneur.innerHTML = '<p style="color:var(--texte-attenue)">Aucun projet pour le moment.</p>';
  }
}

const NUMERO_WHATSAPP_PHILIPPE = '22958156930';

function basculerOngletContact(onglet) {
  const estEmail = onglet === 'email';
  const formEmail = document.getElementById('formulaireContact');
  const formWa = document.getElementById('formulaireWhatsapp');
  const btnEmail = document.getElementById('ongletEmailBtn');
  const btnWa = document.getElementById('ongletWhatsappBtn');

  if (formEmail) formEmail.style.display = estEmail ? 'block' : 'none';
  if (formWa) formWa.style.display = estEmail ? 'none' : 'block';
  if (btnEmail) btnEmail.classList.toggle('actif', estEmail);
  if (btnWa) btnWa.classList.toggle('actif', !estEmail);
}
window.basculerOngletContact = basculerOngletContact;

function envoyerViaWhatsapp() {
  const nom = (document.getElementById('waNom').value || '').trim();
  const numero = (document.getElementById('waNumero').value || '').trim();
  const message = (document.getElementById('waMessage').value || '').trim();
  const retour = document.getElementById('retourWhatsapp');

  retour.textContent = '';
  retour.className = 'retour-formulaire';

  if (!nom || !numero || message.length < 5) {
    retour.textContent = 'Remplissez le nom, le numéro et un message d\'au moins 5 caractères.';
    retour.classList.add('erreur');
    return;
  }

  let texte = 'Bonjour Philippe,%0a%0a';
  texte += 'Nom : ' + encodeURIComponent(nom) + '%0a';
  texte += 'Numéro : ' + encodeURIComponent(numero) + '%0a%0a';
  texte += 'Message :%0a' + encodeURIComponent(message);

  window.open('https://wa.me/' + NUMERO_WHATSAPP_PHILIPPE + '?text=' + texte, '_blank', 'noopener,noreferrer');

  document.getElementById('waNom').value = '';
  document.getElementById('waNumero').value = '';
  document.getElementById('waMessage').value = '';
}
window.envoyerViaWhatsapp = envoyerViaWhatsapp;

document.getElementById('lien-telecharger-cv')?.addEventListener('click', (e) => {
  e.preventDefault();
  window.open('/cv.html?print=1', '_blank');
});

const formulaireContact = document.getElementById('formulaireContact');
if (formulaireContact) {
  formulaireContact.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bouton = formulaireContact.querySelector('button[type="submit"]');
    const retour = document.getElementById('retourFormulaire');
    const contenuBoutonOriginal = bouton.innerHTML;

    bouton.disabled = true;
    bouton.innerHTML = 'Envoi...';
    retour.textContent = '';
    retour.className = 'retour-formulaire';

    try {
      const csrfReponse = await fetch('/api/csrf-token');
      const { csrfToken } = await csrfReponse.json();

      const reponse = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({
          name: document.getElementById('champNom').value,
          email: document.getElementById('champEmail').value,
          phone: document.getElementById('champTelephone').value,
          message: document.getElementById('champMessage').value,
        }),
      });
      const data = await reponse.json();

      if (data.success) {
        retour.textContent = 'Message envoyé. Réponse sous 24h.';
        retour.classList.add('succes');
        formulaireContact.reset();
      } else {
        retour.textContent = data.error || "Erreur lors de l'envoi.";
        retour.classList.add('erreur');
      }
    } catch (err) {
      retour.textContent = 'Erreur réseau. Réessayez.';
      retour.classList.add('erreur');
    } finally {
      bouton.disabled = false;
      bouton.innerHTML = contenuBoutonOriginal;
    }
  });
}

const formulaireNewsletter = document.getElementById('formulaireNewsletter');
if (formulaireNewsletter) {
  formulaireNewsletter.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bouton = formulaireNewsletter.querySelector('button[type="submit"]');
    const champEmail = document.getElementById('emailNewsletter');
    const retour = document.getElementById('retourNewsletter');
    const texteBoutonOriginal = bouton.textContent;

    bouton.disabled = true;
    bouton.textContent = '...';
    retour.textContent = '';
    retour.className = 'retour-formulaire';

    try {
      const reponse = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: champEmail.value }),
      });
      const data = await reponse.json();

      if (data.success) {
        retour.textContent = 'Inscription confirmée, merci !';
        retour.classList.add('succes');
        formulaireNewsletter.reset();
      } else {
        retour.textContent = data.error || "Erreur lors de l'inscription.";
        retour.classList.add('erreur');
      }
    } catch (err) {
      retour.textContent = 'Erreur réseau. Réessayez.';
      retour.classList.add('erreur');
    } finally {
      bouton.disabled = false;
      bouton.textContent = texteBoutonOriginal;
    }
  });
}

function envoyerEvenementTracker(payload) {
  fetch('/api/tracker', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

envoyerEvenementTracker({ event: 'visite', page: window.location.pathname, referrer: document.referrer });

let debutVisite = Date.now();
window.addEventListener('beforeunload', () => {
  const dureeSec = Math.round((Date.now() - debutVisite) / 1000);
  if (dureeSec > 0) {
    envoyerEvenementTracker({ event: 'duree', page: window.location.pathname, dureeSec });
  }
});

document.addEventListener('click', (e) => {
  const cible = e.target.closest('a');
  if (!cible) return;
  const href = cible.getAttribute('href') || '';
  let typeAction = null;
  if (href.includes('#contact')) typeAction = 'clic_contact';
  else if (href.includes('cv/')) typeAction = 'clic_cv';
  else if (href.includes('github.com')) typeAction = 'clic_github';
  else if (href.includes('linkedin.com')) typeAction = 'clic_linkedin';
  else if (href.includes('wa.me')) typeAction = 'clic_whatsapp';
  else if (cible.closest('.carte-projet, .bloc-type-projet')) typeAction = 'clic_projet';

  if (typeAction) {
    envoyerEvenementTracker({ event: 'action', typeAction, cible: href, page: window.location.pathname });
  }
});

chargerCompetences();
chargerCompteursProjets();
chargerFormations();
chargerExperiencesPubliques();
appliquerLienCV();

const typePage = document.body.dataset.typeProjets;
if (typePage) chargerListeProjets(typePage);
