/* ============================================================
   POPUP.JS — Zoom et détails des projets de Philippe Hountondji
   ============================================================ */

const projectData = {
  'vbg-benin': {
    title: 'Plateforme Citoyenne VBG Bénin',
    slogan: 'Système sécurisé de signalement chiffré',
    status: 'terminé',
    image: 'images/VBG.png',
    description: "Architecture résiliente et hautement confidentielle dédiée à la collecte et au traitement sécurisé des signalements. Chiffrement de bout en bout des données sensibles, cartographie interactive et tableaux de bord de suivi pour les intervenants.",
    whatItDoes: `<div class="popup-detail-section">
      <h3><i class="fas fa-rocket"></i> Architecture & Fonctionnalités</h3>
      <p>La plateforme VBG Bénin répond à un impératif de protection maximale de l'anonymat des victimes et témoins tout en facilitant l'action des acteurs sociaux.</p>
      <ul>
        <li>Chiffrement symétrique AES-256 des déclarations et pièces jointes</li>
        <li>Anonymisation cryptographique des métadonnées de connexion</li>
        <li>Cartographie interactive Leaflet géolocalisant les zones d'intervention</li>
        <li>Tableau de bord statistique avec filtrage multicritères</li>
        <li>Génération automatique de rapports d'incident au format PDF sécurisé</li>
      </ul>
    </div>`,
    problems: `<div class="popup-detail-section problemes">
      <h3><i class="fas fa-bullseye"></i> Défis techniques surmontés</h3>
      <ul>
        <li>Protection absolue contre les fuites de données confidentielles</li>
        <li>Conformité stricte avec les normes de sécurité OWASP</li>
        <li>Optimisation des requêtes sur gros volumes de données chiffrées</li>
        <li>Interface intuitive utilisable sur smartphone même en bas débit</li>
      </ul>
    </div>`,
    demoUrl: 'projets-professionnels.html',
    tags: ['Laravel', 'PostgreSQL', 'AES-256', 'Leaflet Maps', 'REST API']
  },

  'nextmux': {
    title: 'NEXTMUX — Moteur de Multiplexage',
    slogan: 'Architecture de traitement et routage de flux',
    status: 'production',
    image: 'images/apropos.jpeg',
    description: "Moteur backend haute performance conçu pour le routage, la transformation et la synchronisation continue de données multi-sources. Authentification JWT, files d'attente asynchrones et monitoring proactif.",
    whatItDoes: `<div class="popup-detail-section">
      <h3><i class="fas fa-rocket"></i> Conception Backend</h3>
      <p>NEXTMUX est un hub de données capable d'ingérer, de valider et de distribuer des flux asynchrones avec une latence minimale.</p>
      <ul>
        <li>Pipeline de traitement découplé avec files de messages asynchrones</li>
        <li>Authentification par tokens JWT avec rotation automatique</li>
        <li>Moteur de transformation de formats de données en temps réel</li>
        <li>Endpoints d'API RESTful haute disponibilité et rate-limiting strict</li>
      </ul>
    </div>`,
    problems: `<div class="popup-detail-section problemes">
      <h3><i class="fas fa-bullseye"></i> Problèmes résolus</h3>
      <ul>
        <li>Suppression des goulots d'étranglement lors des pics de charge</li>
        <li>Standardisation des échanges entre microservices hétérogènes</li>
        <li>Journalisation centralisée des transactions pour audit</li>
      </ul>
    </div>`,
    demoUrl: 'projets-professionnels.html',
    tags: ['Laravel 11', 'PHP 8.2', 'MySQL', 'REST API', 'Redis']
  },

  'campus-reseau': {
    title: 'Architecture Campus Multi-Sites Cisco',
    slogan: 'Routage dynamique OSPF, segmentation VLAN & haute disponibilité',
    status: 'terminé',
    image: 'images/projets-3.jpeg',
    description: "Déploiement complet d'une topologie réseau d'entreprise sous Cisco IOS : routage dynamique OSPF multi-aires, segmentation 802.1Q par département, redondance de passerelle HSRP et filtrage par listes de contrôle d'accès (ACL).",
    whatItDoes: `<div class="popup-detail-section">
      <h3><i class="fas fa-network-wired"></i> Spécifications de l'infrastructure</h3>
      <p>Modélisation et configuration d'une infrastructure réseau complète pour un campus universitaire multi-bâtiments.</p>
      <ul>
        <li>Routage dynamique OSPF multi-aires avec Area 0 fédératrice</li>
        <li>Segmentation en VLANs par service (Administration, Étudiants, Serveurs)</li>
        <li>Trunking 802.1Q et sécurisation des ports d'accès (Port-Security)</li>
        <li>Redondance de passerelle par défaut avec protocole HSRP</li>
        <li>Listes de contrôle d'accès (ACL) étendues pour isolation stricte</li>
      </ul>
    </div>`,
    problems: `<div class="popup-detail-section problemes">
      <h3><i class="fas fa-shield-alt"></i> Sécurité & Continuité de service</h3>
      <ul>
        <li>Convergence réseau quasi instantanée lors de la défaillance d'une liaison</li>
        <li>Suppression totale des boucles de commutation via Spanning Tree (RSTP)</li>
        <li>Contrôle strict des flux inter-départements et protection de l'infrastructure</li>
      </ul>
    </div>`,
    demoUrl: 'projets-academiques.html',
    tags: ['Cisco IOS', 'OSPF Multi-Aires', 'VLANs 802.1Q', 'HSRP', 'ACLs']
  },

  'restodirect': {
    title: 'RestoDirect — SaaS Temps Réel',
    slogan: 'Gestion réactive de commandes & flux WebSocket',
    status: 'terminé',
    image: 'images/acceuil.jpeg',
    description: "Plateforme web réactive pour la gestion de commandes en restauration : synchronisation bidirectionnelle en temps réel par WebSockets, tableau de bord interactif des cuisines et gestion optimisée des stocks.",
    whatItDoes: `<div class="popup-detail-section">
      <h3><i class="fas fa-bolt"></i> Fonctionnalités Temps Réel</h3>
      <p>Système complet reliant les clients, les serveurs et la cuisine avec mise à jour instantanée sans rafraîchissement.</p>
      <ul>
        <li>Canal de communication WebSocket bidirectionnel instantané</li>
        <li>Dashboard cuisine réactif avec alertes sonores et visuelles</li>
        <li>Gestion dynamique des menus et déclassement automatique des ruptures</li>
        <li>Statistiques de vente et métriques de délai de préparation</li>
      </ul>
    </div>`,
    problems: `<div class="popup-detail-section problemes">
      <h3><i class="fas fa-check-circle"></i> Bénéfices</h3>
      <ul>
        <li>Zéro commande perdue ou retardée grâce aux WebSockets</li>
        <li>Fluidification maximale du flux opérationnel aux heures de pointe</li>
      </ul>
    </div>`,
    demoUrl: 'projets-professionnels.html',
    tags: ['React.js', 'Node.js', 'Socket.io', 'PostgreSQL', 'Tailwind']
  }
};

window.openPopup = function(projectId) {
  const p = projectData[projectId];
  if (!p) return;

  let modal = document.getElementById('projectModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'projectModal';
    modal.className = 'project-modal-backdrop';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="project-modal-dialog">
      <button class="project-modal-close" onclick="closePopup()"><i class="fas fa-times"></i></button>
      <div class="project-modal-header">
        <img src="${p.image}" alt="${p.title}" class="project-modal-cover">
        <div class="project-modal-title-wrap">
          <span class="pcn-status ${p.status}">${p.status.toUpperCase()}</span>
          <h2>${p.title}</h2>
          <p class="project-modal-slogan">${p.slogan}</p>
        </div>
      </div>
      <div class="project-modal-body">
        <p class="project-modal-desc">${p.description}</p>
        ${p.whatItDoes || ''}
        ${p.problems || ''}
        <div class="project-modal-tags">
          ${(p.tags || []).map(t => `<span class="pcn-tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="project-modal-footer">
        <a href="${p.demoUrl}" class="btn btn-p" target="_self">Consulter l'étude complète <i class="fas fa-arrow-right"></i></a>
        <button class="btn btn-s" onclick="closePopup()">Fermer</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  setTimeout(() => modal.classList.add('active'), 10);
};

window.closePopup = function() {
  const modal = document.getElementById('projectModal');
  if (!modal) return;
  modal.classList.remove('active');
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 200);
};

document.addEventListener('click', (e) => {
  const modal = document.getElementById('projectModal');
  if (modal && e.target === modal) window.closePopup();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') window.closePopup();
});
