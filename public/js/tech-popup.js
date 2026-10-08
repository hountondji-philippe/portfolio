// ============================================================
// TECHNOLOGY POPUP FUNCTIONALITY — PHILIPPE HOUNTONDJI
// ============================================================

const techData = {
  'laravel': {
    name: 'Laravel 11',
    icon: 'fab fa-laravel',
    description: "Framework PHP moderne de référence pour l'architecture web d'entreprise. Maîtrise de l'ORM Eloquent, des migrations, des files d'attente, de l'authentification sécurisée, des APIs RESTful et du respect des patterns MVC et Clean Architecture.",
    level: 'Expert',
    category: 'Backend & Framework'
  },
  'react': {
    name: 'React.js',
    icon: 'fab fa-react',
    description: "Bibliothèque JavaScript leader pour la création d'interfaces utilisateur modernes et réactives. Maîtrise des composants fonctionnels, hooks personnalisés, gestion d'état, routage SPA et consommation d'APIs asynchrones.",
    level: 'Avancé',
    category: 'Frontend'
  },
  'nodejs': {
    name: 'Node.js & Express',
    icon: 'fab fa-node-js',
    description: "Environnement d'exécution JavaScript serveur haute performance. Création d'APIs REST modulaires, microservices, architectures événementielles et passerelles temps réel avec Express et WebSocket.",
    level: 'Expert',
    category: 'Backend'
  },
  'flutter': {
    name: 'Flutter & Dart',
    icon: 'fas fa-mobile-alt',
    description: "Framework Google cross-platform permettant de concevoir des applications mobiles Android et iOS natives à partir d'une seule base de code. Interfaces soignées, performances 60 FPS et intégration d'APIs.",
    level: 'Avancé',
    category: 'Mobile'
  },
  'cisco': {
    name: 'Cisco IOS & Réseaux',
    icon: 'fas fa-network-wired',
    description: "Configuration et administration d'équipements réseaux Cisco (routeurs, switches couche 2 et 3). Maîtrise du CLI Cisco IOS, configuration des interfaces, routage statique et dynamique, et listes de contrôle d'accès (ACL).",
    level: 'Expert',
    category: 'Réseaux & Télécoms'
  },
  'ospf': {
    name: 'Routage OSPF & BGP',
    icon: 'fas fa-route',
    description: "Protocoles de routage dynamique à état de liens. Configuration d'aires multiples OSPF (Area 0, stub, NSSA), calcul métrique Dijktsra, convergence rapide, redistribution de routes et notions BGP pour topologies multi-sites.",
    level: 'Expert',
    category: 'Réseaux & Protocoles'
  },
  'vlan': {
    name: 'VLANs 802.1Q & Trunking',
    icon: 'fas fa-layer-group',
    description: "Segmentation logique de réseaux locaux pour l'isolation de flux et la sécurité. Configuration du protocole 802.1Q trunk, routage inter-VLAN (Router-on-a-stick / Switch L3), Spanning Tree Protocol (STP) et VTP.",
    level: 'Expert',
    category: 'Réseaux d\'Entreprise'
  },
  'linux': {
    name: 'Linux Debian & Ubuntu Server',
    icon: 'fab fa-linux',
    description: "Administration système avancée, scripting Bash, durcissement sécuritaire, gestion des services systemd, configuration SSH sécurisée, pare-feu UFW/iptables et déploiement de serveurs web Nginx/Apache.",
    level: 'Avancé',
    category: 'Système & DevOps'
  },
  'postgresql': {
    name: 'PostgreSQL & Neon DB',
    icon: 'fas fa-database',
    description: "Système de gestion de base de données relationnelle objet robuste. Modélisation relationnelle rigoureuse, requêtes SQL complexes, indexation, contraintes d'intégrité et intégration d'ORM comme Prisma et Eloquent.",
    level: 'Avancé',
    category: 'Bases de données'
  },
  'mysql': {
    name: 'MySQL',
    icon: 'fas fa-database',
    description: "Base de données relationnelle standard. Optimisation des requêtes, modélisation conceptuelle MERISE/UML, transactions ACID, procédures stockées et maintenance.",
    level: 'Expert',
    category: 'Bases de données'
  },
  'cybersecurite': {
    name: 'Cybersécurité & OWASP',
    icon: 'fas fa-shield-alt',
    description: "Application des bonnes pratiques du Top 10 OWASP : prévention des injections SQL, XSS, CSRF, sécurisation des headers HTTP, chiffrement des données sensibles (AES-256), hachage bcrypt et gestion des politiques ACL réseau.",
    level: 'Avancé',
    category: 'Sécurité'
  },
  'websocket': {
    name: 'WebSockets & Temps Réel',
    icon: 'fas fa-bolt',
    description: "Communication bidirectionnelle temps réel full-duplex client-serveur. Implémentation avec Socket.io et WebSockets natifs pour dashboards réactifs, notifications instantanées et streaming de données.",
    level: 'Avancé',
    category: 'Temps Réel'
  },
  'php': {
    name: 'PHP 8.2+',
    icon: 'fab fa-php',
    description: "Langage moderne orienté objet, typage strict, attributs, performances accrues. Développement d'applications web robustes et services backend conformes aux normes PSR.",
    level: 'Expert',
    category: 'Backend'
  },
  'python': {
    name: 'Python',
    icon: 'fab fa-python',
    description: "Langage polyvalent utilisé pour l'automatisation de scripts réseaux, l'analyse de données, le traitement d'API et le prototypage rapide.",
    level: 'Avancé',
    category: 'Backend & Scripting'
  },
  'git': {
    name: 'Git & GitHub',
    icon: 'fab fa-git-alt',
    description: "Gestion de version distribuée. Gestion des branches, pull requests, résolution de conflits, conventions Git flow et intégration continue GitHub Actions.",
    level: 'Expert',
    category: 'Outils & DevOps'
  },
  'html5-css3': {
    name: 'HTML5 & CSS3',
    icon: 'fab fa-html5',
    description: "Fondations du développement web moderne : sémantique accessible, layouts Grid & Flexbox, responsive design adaptatif, animations et variables CSS personnalisées.",
    level: 'Expert',
    category: 'Frontend'
  },
  'javascript': {
    name: 'JavaScript ES6+',
    icon: 'fab fa-js',
    description: "Développement JavaScript moderne côté client et serveur : programmation asynchrone (Promises, Async/Await), manipulation DOM performante, modules ES et architecture d'API.",
    level: 'Expert',
    category: 'Frontend'
  },
  'rest-api': {
    name: 'APIs RESTful',
    icon: 'fas fa-plug',
    description: "Conception et documentation d'APIs REST selon les standards de l'industrie : gestion des codes HTTP, pagination, validation stricte, sécurité JWT et scalabilité.",
    level: 'Expert',
    category: 'Architecture'
  }
};

function initTechPopup() {
  const popup = document.getElementById('techPopup');
  const overlay = document.getElementById('techPopupOverlay');
  const closeBtn = document.getElementById('techPopupClose');
  const title = document.getElementById('techPopupTitle');
  const icon = document.getElementById('techPopupIcon');
  const description = document.getElementById('techPopupDescription');
  const category = document.getElementById('techPopupCategory');

  if (!popup || !overlay || !closeBtn) return;

  function openPopup(techKey) {
    const tech = techData[techKey];
    if (!tech) return;

    title.textContent = tech.name;
    icon.innerHTML = `<i class="${tech.icon}"></i>`;
    description.innerHTML = tech.description;
    category.textContent = `${tech.category} — Niveau : ${tech.level}`;

    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    setTimeout(() => popup.classList.add('active'), 10);
  }

  function closePopup() {
    popup.classList.remove('active');
    setTimeout(() => {
      popup.style.display = 'none';
      document.body.style.overflow = '';
    }, 200);
  }

  closeBtn.addEventListener('click', closePopup);
  overlay.addEventListener('click', closePopup);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('active')) closePopup();
  });

  document.querySelectorAll('[data-tech]').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const techKey = el.getAttribute('data-tech');
      openPopup(techKey);
    });
  });
}

document.addEventListener('DOMContentLoaded', initTechPopup);
