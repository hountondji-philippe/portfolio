(function () {
'use strict';

const LABELS_CATEGORIE = {
  FRONTEND: 'Front-end', BACKEND: 'Back-end', MOBILE: 'Mobile',
  RESEAUX_INFRA: 'Réseaux', MARKETING_DIGITAL: 'Marketing digital',
  DESIGN_CONTENU: 'Design', AUTRE: 'Autre',
};
const LABELS_TYPE_PROJET = { ACADEMIQUE: 'Académique', PROFESSIONNEL: 'Professionnel' };
const ORDRE_CATEGORIES = ['FRONTEND', 'BACKEND', 'MOBILE', 'RESEAUX_INFRA', 'MARKETING_DIGITAL', 'DESIGN_CONTENU', 'AUTRE'];

function echapper(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function recuperer(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

function periodeStr(debut, fin) {
  if (debut && fin) return echapper(debut) + ' — ' + echapper(fin);
  if (debut) return echapper(debut) + ' — Présent';
  return fin ? echapper(fin) : '';
}

// ── Profil / en-tête ─────────────────────────────────────────────────────
function renderProfil(settings) {
  const s = (settings && settings.settings) || {};

  if (s.titrePro) document.getElementById('cv-titre-pro').textContent = s.titrePro;
  if (s.bio) {
    document.getElementById('cv-bio').textContent = s.bio;
  } else {
    document.getElementById('section-bio').classList.add('masque');
  }

  if (s.photoUrl) {
    const img = document.getElementById('cv-photo');
    img.src = s.photoUrl;
    img.classList.remove('masque');
    document.getElementById('cv-photo-vide').classList.add('masque');
  }

  const contacts = [];
  if (s.telephone) contacts.push(['Téléphone', s.telephone]);
  if (s.emailPublic) contacts.push(['Email', s.emailPublic]);
  if (s.localisation) contacts.push(['Localisation', s.localisation]);
  document.getElementById('cv-contacts').innerHTML = contacts.map(([label, val]) =>
    '<li><strong>' + echapper(label) + '</strong>' + echapper(val) + '</li>'
  ).join('') || '<li class="etat-vide-cv">Aucune information de contact renseignée</li>';

  const qualitesBox = document.getElementById('section-qualites');
  if (s.qualites) {
    const items = s.qualites.split(',').map((q) => q.trim()).filter(Boolean);
    document.getElementById('cv-qualites').innerHTML = items.map((q) => '<li>' + echapper(q) + '</li>').join('');
  } else {
    qualitesBox.classList.add('masque');
  }
}

// ── Compétences ──────────────────────────────────────────────────────────
function renderCompetences(data) {
  const skills = (data && data.skills) || [];
  const cont = document.getElementById('cv-competences');
  if (!skills.length) { cont.innerHTML = '<p class="etat-vide-cv">Aucune compétence renseignée</p>'; return; }

  const parCategorie = {};
  skills.forEach((s) => {
    if (!parCategorie[s.categorie]) parCategorie[s.categorie] = [];
    parCategorie[s.categorie].push(s);
  });

  cont.innerHTML = ORDRE_CATEGORIES.filter((cat) => parCategorie[cat]).map((cat) => {
    const items = parCategorie[cat];
    return '<div class="groupe-competence"><h3>' + echapper(LABELS_CATEGORIE[cat] || cat) + '</h3>' +
      '<div class="tags-competence">' +
      items.map((s) => '<span class="tag-competence">' + echapper(s.nom) + '</span>').join('') +
      '</div></div>';
  }).join('');
}

// ── Langues ──────────────────────────────────────────────────────────────
function renderLangues(data) {
  const langues = (data && data.languages) || [];
  const cont = document.getElementById('cv-langues');
  if (!langues.length) { cont.innerHTML = '<li class="etat-vide-cv">Aucune langue renseignée</li>'; return; }
  cont.innerHTML = langues.map((l) =>
    '<li><span>' + echapper(l.nom) + '</span><span class="niveau-langue">' + echapper(l.niveau) + '</span></li>'
  ).join('');
}

// ── Expériences ──────────────────────────────────────────────────────────
function renderExperiences(data) {
  const experiences = (data && data.experiences) || [];
  const cont = document.getElementById('cv-experiences');
  if (!experiences.length) { cont.innerHTML = '<p class="etat-vide-cv">Aucune expérience renseignée</p>'; return; }

  cont.innerHTML = experiences.map((exp) => {
    const tags = exp.tags ? exp.tags.split(',').map((t) => '<span>' + echapper(t.trim()) + '</span>').join('') : '';
    const sousTitre = [exp.entreprise, exp.lieu].filter(Boolean).map(echapper).join(' · ');
    return '<div class="item-chrono">' +
      '<div class="item-entete">' +
      '<span class="item-titre">' + echapper(exp.titre) + '</span>' +
      '<span class="item-periode">' + periodeStr(exp.dateDebut, exp.dateFin) + '</span>' +
      '</div>' +
      (sousTitre ? '<div class="item-sous-titre">' + sousTitre + '</div>' : '') +
      (exp.description ? '<p class="item-description">' + echapper(exp.description) + '</p>' : '') +
      (tags ? '<div class="item-tags">' + tags + '</div>' : '') +
      '</div>';
  }).join('');
}

// ── Formations ───────────────────────────────────────────────────────────
function renderFormations(data) {
  const formations = (data && data.formations) || [];
  const cont = document.getElementById('cv-formations');
  if (!formations.length) { cont.innerHTML = '<p class="etat-vide-cv">Aucune formation renseignée</p>'; return; }

  cont.innerHTML = formations.map((f) =>
    '<div class="item-chrono">' +
    '<div class="item-entete">' +
    '<span class="item-titre">' + echapper(f.titre) + '</span>' +
    '<span class="item-periode">' + echapper(f.periode || '') + '</span>' +
    '</div>' +
    (f.ecole ? '<div class="item-sous-titre">' + echapper(f.ecole) + '</div>' : '') +
    (f.description ? '<p class="item-description">' + echapper(f.description) + '</p>' : '') +
    '</div>'
  ).join('');
}

// ── Projets (académiques + professionnels fusionnés, sans distinction visuelle forte) ──
function renderProjets(data) {
  const projets = (data && data.projects) || [];
  const cont = document.getElementById('cv-projets');
  if (!projets.length) { cont.innerHTML = '<p class="etat-vide-cv">Aucun projet renseigné</p>'; return; }

  cont.innerHTML = projets.map((p) => {
    const liens = [];
    if (p.lienSite) liens.push('<a href="' + echapper(p.lienSite) + '" target="_blank" rel="noopener noreferrer">Voir le site</a>');
    if (p.lienGithub) liens.push('<a href="' + echapper(p.lienGithub) + '" target="_blank" rel="noopener noreferrer">GitHub</a>');

    return '<div class="carte-projet-cv">' +
      '<div class="carte-projet-cv-entete">' +
      '<span class="carte-projet-cv-titre">' + echapper(p.titre) + '</span>' +
      '<span class="badge-type-projet">' + echapper(LABELS_TYPE_PROJET[p.type] || p.type) + '</span>' +
      '</div>' +
      '<p class="carte-projet-cv-desc">' + echapper(p.description) + '</p>' +
      (p.technologies ? '<div class="carte-projet-cv-tech">' + echapper(p.technologies) + '</div>' : '') +
      (liens.length ? '<div class="carte-projet-cv-liens">' + liens.join(' · ') + '</div>' : '') +
      '</div>';
  }).join('');
}

// ── Mise à l'échelle mobile (affichage type "page PDF") ───────────────────
function ajusterEchelleMobile() {
  const feuille = document.querySelector('.feuille-cv');
  if (!feuille) return;

  feuille.style.transform = '';
  feuille.style.marginBottom = '';

  if (window.innerWidth >= 720) return;

  const largeurNaturelle = feuille.offsetWidth;
  const hauteurNaturelle = feuille.offsetHeight;
  const echelle = (window.innerWidth - 24) / largeurNaturelle;

  feuille.style.transformOrigin = 'top center';
  feuille.style.transform = 'scale(' + echelle + ')';
  feuille.style.marginBottom = (hauteurNaturelle * echelle - hauteurNaturelle) + 'px';
}

window.addEventListener('resize', ajusterEchelleMobile);


// ── Init ──────────────────────────────────────────────────────────────────
async function init() {
  const [settings, skills, langues, experiences, formations, projets] = await Promise.all([
    recuperer('/api/formations?resource=settings'),
    recuperer('/api/skills'),
    recuperer('/api/formations?resource=languages'),
    recuperer('/api/experiences'),
    recuperer('/api/formations'),
    recuperer('/api/projects'),
  ]);

renderProfil(settings);
  renderCompetences(skills);
  renderLangues(langues);
  renderExperiences(experiences);
  renderFormations(formations);
  renderProjets(projets);

  ajusterEchelleMobile();

  if (new URLSearchParams(window.location.search).get('print') === '1') {
    setTimeout(() => window.print(), 100);
  }

document.getElementById('btn-imprimer').addEventListener('click', () => window.print());

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
