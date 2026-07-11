// assets/js/script.js
// Logique du site public : thème, menu, recherche, compétences, projets, contact.

const LABELS_CATEGORIES = {
  FRONTEND: 'Front-end',
  BACKEND: 'Back-end et logique serveur',
  MOBILE: 'Mobile',
  RESEAUX_INFRA: 'Réseaux et infrastructure',
  MARKETING_DIGITAL: 'Marketing digital',
  DESIGN_CONTENU: 'Design et création de contenu',
  AUTRE: 'Autres compétences',
};

// ===================== BASCULE CLAIR / SOMBRE =====================
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

// ===================== MENU MOBILE =====================
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

// ===================== RECHERCHE =====================
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

// ===================== CV (URL dynamique si téléversé depuis l'admin) =====================
async function appliquerLienCV() {
  const liens = document.querySelectorAll('.lien-cv');
  if (!liens.length) return;
  try {
    const reponse = await fetch('/api/settings');
    const data = await reponse.json();
    if (data.success && data.settings.cvUrl) {
      liens.forEach((lien) => { lien.href = data.settings.cvUrl; });
    }
    // Si aucun CV n'a encore été téléversé, on garde le lien par défaut
    // déjà présent dans le HTML (cv/CV_philippe_hountondji.pdf).
  } catch (err) {
    console.error('Erreur chargement CV', err);
  }
}

// ===================== FORMATION (chargée depuis l'API, une seule "En cours" mise en avant) =====================
function echapperTexte(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderEtapeFormation(f, active) {
  const badgeClasse = f.statut === 'EN_COURS' ? 'badge-en-cours' : 'badge-obtenu';
  const badgeTexte = f.statut === 'EN_COURS' ? 'En cours' : 'Obtenu';
  return '<div class="etape-timeline' + (active ? ' etape-active' : '') + '">' +
    '<div class="pastille-timeline"></div>' +
    '<div class="carte-timeline">' +
    '<div class="entete-carte-timeline">' +
    '<span class="badge-timeline ' + badgeClasse + '">' + badgeTexte + '</span>' +
    (f.periode ? '<span class="annee-timeline">' + echapperTexte(f.periode) + '</span>' : '') +
    '</div>' +
    '<h3>' + echapperTexte(f.titre) + '</h3>' +
    (f.ecole ? '<p class="ecole-timeline">' + echapperTexte(f.ecole) + '</p>' : '') +
    (f.description ? '<p>' + echapperTexte(f.description) + '</p>' : '') +
    '</div></div>';
}

async function chargerFormations() {
  const conteneur = document.getElementById('timelineFormation');
  if (!conteneur) return;

  try {
    const reponse = await fetch('/api/formations');
    const data = await reponse.json();
    if (!data.success || !data.formations || !data.formations.length) {
      conteneur.innerHTML = '<p style="color:var(--texte-attenue)">Aucune formation renseignée pour le moment.</p>';
      return;
    }

    const formations = data.formations;
    const enCours = formations.filter((f) => f.statut === 'EN_COURS');
    const obtenues = formations.filter((f) => f.statut !== 'EN_COURS');
    // La plus récente "En cours" (ou, à défaut, la première formation) reste
    // affichée en avant ; le reste se replie derrière le bouton.
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
    conteneur.innerHTML = '<p style="color:var(--texte-attenue)">Impossible de charger les formations.</p>';
  }
}

// ===================== EXPERIENCE (chargée depuis l'API) =====================
const LABELS_STATUT_EXP_PUBLIC = { TERMINE: 'Terminé', EN_COURS: 'En cours', PREVU: 'Prévu', RECHERCHE: 'En recherche active' };

async function chargerExperiencesPubliques() {
  const conteneur = document.getElementById('grilleExperience');
  if (!conteneur) return;

  try {
    const reponse = await fetch('/api/experiences');
    const data = await reponse.json();
    if (!data.success || !data.experiences || !data.experiences.length) {
      conteneur.innerHTML = '<p style="color:var(--texte-attenue)">Aucune expérience renseignée pour le moment.</p>';
      return;
    }

    conteneur.innerHTML = data.experiences.map((exp) => {
      const active = exp.statut === 'RECHERCHE' || exp.statut === 'EN_COURS';
      const meta = [exp.entreprise, exp.lieu, [exp.dateDebut, exp.dateFin].filter(Boolean).join(' — ')]
        .filter(Boolean).map(echapperTexte).join(' · ');
      return '<div class="carte-experience' + (active ? ' carte-experience-active' : '') + '">' +
        (active ? '<span class="badge-timeline badge-en-cours">' + (LABELS_STATUT_EXP_PUBLIC[exp.statut] || exp.statut) + '</span>' : '') +
        '<h3>' + echapperTexte(exp.titre) + '</h3>' +
        (meta ? '<p class="meta-experience">' + meta + '</p>' : '') +
        (exp.description ? '<p>' + echapperTexte(exp.description) + '</p>' : '') +
        (exp.statut === 'RECHERCHE' ? '<a href="#contact" class="bouton-secondaire" style="display:inline-block;margin-top:10px">Me proposer un stage</a>' : '') +
        '</div>';
    }).join('');
  } catch (err) {
    console.error('Erreur chargement expériences', err);
    conteneur.innerHTML = '<p style="color:var(--texte-attenue)">Impossible de charger les expériences.</p>';
  }
}

// ===================== COMPETENCES (accordeon dynamique) =====================
async function chargerCompetences() {
  const conteneur = document.getElementById('listeAccordeonCompetences');
  if (!conteneur) return;

  try {
    const reponse = await fetch('/api/skills');
    const data = await reponse.json();
    if (!data.success || !data.skills || !data.skills.length) return;

    const parCategorie = {};
    data.skills.forEach((skill) => {
      if (!parCategorie[skill.categorie]) parCategorie[skill.categorie] = [];
      parCategorie[skill.categorie].push(skill);
    });

    conteneur.innerHTML = Object.entries(parCategorie)
      .map(([categorie, skills], index) => `
        <div class="categorie-competence${index === 0 ? ' ouverte' : ''}">
          <div class="entete-categorie-competence">
            <span>${LABELS_CATEGORIES[categorie] || categorie}</span>
            <span class="fleche-categorie">▲</span>
          </div>
          <div class="corps-categorie-competence">
            <div class="grille-logos-competences">
              ${skills.map((s) => `
                <div class="carte-logo-competence" title="${s.nom}">
                  <iconify-icon icon="${s.icone}" width="42" height="42"></iconify-icon>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `).join('');

    conteneur.querySelectorAll('.entete-categorie-competence').forEach((entete) => {
      entete.addEventListener('click', () => {
        entete.closest('.categorie-competence').classList.toggle('ouverte');
      });
    });
  } catch (err) {
    console.error('Erreur chargement compétences', err);
  }
}

// ===================== PROJETS (compteurs sur la page d'accueil) =====================
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

// ===================== PROJETS (liste complete sur les pages dediees) =====================
const LABELS_STATUT = { TERMINE: 'Terminé', EN_COURS: 'En cours', PREVU: 'Prévu' };

async function chargerListeProjets(type) {
  const conteneur = document.getElementById('grilleCartesProjets');
  if (!conteneur) return;

  try {
    const reponse = await fetch('/api/projects?type=' + type);
    const data = await reponse.json();
    if (!data.success) return;

    if (!data.projects.length) {
      conteneur.innerHTML = '<p style="color:var(--texte-attenue)">Aucun projet pour le moment.</p>';
      return;
    }

    conteneur.innerHTML = data.projects.map((p) => `
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
  } catch (err) {
    console.error('Erreur chargement projets', err);
  }
}

// ===================== ONGLETS CONTACT (EMAIL / WHATSAPP) =====================
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

// ===================== FORMULAIRE DE CONTACT =====================
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

// ===================== NEWSLETTER (FOOTER) =====================
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

// ===================== TRACKING (VISITEURS) =====================
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

// ===================== INITIALISATION =====================
chargerCompetences();
chargerCompteursProjets();
chargerFormations();
chargerExperiencesPubliques();
appliquerLienCV();

const typePage = document.body.dataset.typeProjets;
if (typePage) chargerListeProjets(typePage);