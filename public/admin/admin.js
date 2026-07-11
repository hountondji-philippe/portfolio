(function () {
'use strict';

let TOKEN = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token');
let messageActuel = null;
let graphiqueJours = null;

// ===================== REQUETES =====================
function req(method, url, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (TOKEN) opts.headers.Authorization = 'Bearer ' + TOKEN;
  if (body) opts.body = JSON.stringify(body);

  return fetch('/api' + url, opts).then((r) => {
    // Une session déjà active qui expire renvoie 401 : message générique.
    // Un échec de connexion (mauvais identifiants) renvoie aussi 401, mais
    // sans TOKEN préalable : on laisse passer le vrai message du serveur.
    if (r.status === 401 && TOKEN) throw new Error('Session expirée. Reconnectez-vous.');
    return r.json();
  });
}

// ===================== TOAST =====================
function toast(msg, type) {
  type = type || 'info';
  const box = document.createElement('div');
  box.className = 'toast toast-' + type;
  box.textContent = String(msg).slice(0, 300);
  document.body.appendChild(box);
  setTimeout(() => box.classList.add('visible'), 10);
  setTimeout(() => {
    box.classList.remove('visible');
    setTimeout(() => box.remove(), 300);
  }, type === 'erreur' ? 6000 : 3500);
}

function formaterDate(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}
function formaterDateCourte(d) {
  return d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
}
function val(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}
function echapper(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ===================== THEME CLAIR / SOMBRE =====================
// Même clé localStorage ('theme-portfolio') que sur le site public, pour
// que le choix de thème soit cohérent entre l'admin et l'accueil.
function bindBasculeTheme() {
  const racineHtml = document.documentElement;
  const bouton = document.getElementById('basculeTheme');

  const themeEnregistre = localStorage.getItem('theme-portfolio');
  if (themeEnregistre) racineHtml.setAttribute('data-theme', themeEnregistre);

  if (bouton) {
    bouton.addEventListener('click', () => {
      const actuel = racineHtml.getAttribute('data-theme');
      const nouveau = actuel === 'sombre' ? 'clair' : 'sombre';
      racineHtml.setAttribute('data-theme', nouveau);
      localStorage.setItem('theme-portfolio', nouveau);
      if (graphiqueJours) renderGraphiqueJours(graphiqueJours.__dernieresDonnees || []);
    });
  }
}

// ===================== INIT =====================
function init() {
  bindBasculeTheme();
  if (TOKEN) afficherTableau();
  else {
    document.getElementById('page-connexion').style.display = 'flex';
    document.getElementById('tableau-bord').classList.add('masque');
  }
  bindConnexion();
  bindNavigation();
  bindDeconnexion();
  bindFormulaires();
  bindActionsRapides();
  bindOngletsImage();
  bindModaleMessage();
  bindUploadCV();
}

// ===================== CONNEXION =====================
function bindConnexion() {
  const form = document.getElementById('formulaire-connexion');
  const btnVoir = document.querySelector('.bouton-voir-mdp');
  const champMdp = document.getElementById('champ-motdepasse');

  if (btnVoir && champMdp) {
    btnVoir.addEventListener('click', () => {
      const visible = champMdp.type === 'text';
      champMdp.type = visible ? 'password' : 'text';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('champ-email').value.trim();
    const password = document.getElementById('champ-motdepasse').value;
    const btn = form.querySelector('.bouton-connexion');
    const erreur = document.getElementById('erreur-connexion');

    btn.disabled = true;
    btn.textContent = 'Connexion...';
    erreur.style.display = 'none';

    try {
      const data = await req('POST', '/admin/login', { email, password });
      if (data.success && data.token) {
        TOKEN = data.token;
        const souvenir = document.getElementById('se-souvenir').checked;
        if (souvenir) localStorage.setItem('admin_token', TOKEN);
        else sessionStorage.setItem('admin_token', TOKEN);
        afficherTableau();
      } else {
        erreur.style.display = 'flex';
        erreur.querySelector('span').textContent = data.error || 'Identifiants incorrects.';
        form.classList.add('secouer');
        setTimeout(() => form.classList.remove('secouer'), 400);
      }
    } catch (err) {
      erreur.style.display = 'flex';
      erreur.querySelector('span').textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  });
}

function afficherTableau() {
  document.getElementById('page-connexion').style.display = 'none';
  document.getElementById('tableau-bord').classList.remove('masque');
  chargerDonnees('vue-ensemble');
  chargerCompteurMessages();
}

function bindDeconnexion() {
  document.getElementById('btn-deconnexion').addEventListener('click', async () => {
    try { await req('POST', '/admin/account', { action: 'logout' }); } catch {}
    TOKEN = null;
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    location.reload();
  });
}

// ===================== NAVIGATION =====================
function bindNavigation() {
  document.querySelectorAll('.element-nav').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = el.dataset.page;
      document.querySelectorAll('.element-nav').forEach((n) => n.classList.remove('actif'));
      el.classList.add('actif');
      document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
      document.getElementById('page-' + page).classList.add('active');
      document.getElementById('titre-page').textContent = el.textContent.trim();
      document.getElementById('barreLaterale').classList.remove('ouverte');
      chargerDonnees(page);
    });
  });

  document.querySelectorAll('[data-page]:not(.element-nav)').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelector('.element-nav[data-page="' + el.dataset.page + '"]').click();
    });
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    document.getElementById('barreLaterale').classList.toggle('ouverte');
  });

  document.getElementById('btn-actualiser').addEventListener('click', () => {
    const active = document.querySelector('.page.active');
    if (active) chargerDonnees(active.id.replace('page-', ''));
  });
}

function chargerDonnees(page) {
  if (page === 'vue-ensemble') chargerVueEnsemble();
  if (page === 'messages') chargerMessages();
  if (page === 'projets') chargerProjets();
  if (page === 'formations') chargerFormations();
  if (page === 'experiences') chargerExperiences();
  if (page === 'competences') chargerCompetences();
  if (page === 'analytics') chargerAnalytics();
  if (page === 'parametres') chargerParametresCV();
}

// ===================== CV (Paramètres) =====================
async function chargerParametresCV() {
  const info = document.getElementById('cv-actuel-info');
  try {
    const d = await req('GET', '/formations?resource=settings');
    if (d.success && d.settings.cvUrl) {
      info.innerHTML = 'CV actuel : <a href="' + echapper(d.settings.cvUrl) + '" target="_blank" rel="noopener noreferrer">' + echapper(d.settings.cvUrl.split('/').pop()) + '</a>';
    } else {
      info.textContent = 'Aucun CV téléversé pour le moment (le site utilise le fichier par défaut du dépôt).';
    }
  } catch (err) {
    info.textContent = 'Impossible de vérifier le CV actuel.';
  }
}

function bindUploadCV() {
  const fichier = document.getElementById('cv-fichier');
  if (!fichier) return;
  fichier.addEventListener('change', async () => {
    const f = fichier.files[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { toast('Le fichier doit être un PDF.', 'erreur'); fichier.value = ''; return; }
    if (f.size > 10 * 1024 * 1024) { toast('Fichier trop lourd (max 10 Mo).', 'erreur'); fichier.value = ''; return; }

    const info = document.getElementById('cv-actuel-info');
    info.textContent = 'Envoi en cours...';

    try {
      const base64 = await new Promise((resolve, reject) => {
        const lecteur = new FileReader();
        lecteur.onload = (e) => resolve(e.target.result);
        lecteur.onerror = reject;
        lecteur.readAsDataURL(f);
      });

      const dUpload = await req('POST', '/admin/account', { action: 'upload-cv', pdfBase64: base64, nomFichier: f.name });
      if (!dUpload.success) throw new Error(dUpload.error || "Échec de l'upload.");

      const dSettings = await req('PUT', '/formations?resource=settings', { cvUrl: dUpload.url });
      if (!dSettings.success) throw new Error(dSettings.error || 'Échec de l\'enregistrement.');

      toast('CV mis à jour', 'succes');
      chargerParametresCV();
    } catch (err) {
      toast(err.message, 'erreur');
      chargerParametresCV();
    } finally {
      fichier.value = '';
    }
  });
}

async function chargerCompteurMessages() {
  try {
    const d = await req('GET', '/admin/account?action=stats');
    if (d.success) document.getElementById('nb-messages').textContent = d.stats.unread;
  } catch {}
}

window.__adminInit = init;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

window.verifierServeurBtn = function () {
  document.getElementById('barre-serveur').style.display = 'none';
};

// ===================== VUE D'ENSEMBLE =====================
async function chargerVueEnsemble() {
  try {
    const d = await req('GET', '/admin/account?action=stats');
    if (d.success) {
      document.getElementById('total-messages').textContent = d.stats.total;
      document.getElementById('messages-non-lus').textContent = d.stats.unread;
      document.getElementById('messages-aujourd-hui').textContent = d.stats.today;
      document.getElementById('total-competences').textContent = d.stats.skillsCount;
      document.getElementById('total-projets').textContent = d.stats.projectsCount;
      document.getElementById('nb-messages').textContent = d.stats.unread;
    }
  } catch (err) { toast(err.message, 'erreur'); }

  try {
    const d = await req('GET', '/messages?limit=5');
    const cont = document.getElementById('liste-messages-recents');
    if (!d.messages || !d.messages.length) {
      cont.innerHTML = '<div class="etat-vide">Aucun message</div>';
      return;
    }
    cont.innerHTML = d.messages.map(renderMessage).join('');
    cont.querySelectorAll('.element-message').forEach((el) => {
      el.addEventListener('click', () => ouvrirMessage(el.dataset.id));
    });
  } catch {}
}

function bindActionsRapides() {
  document.querySelectorAll('.carte-action').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      if (action === 'exporter') return exporterMessages();
      if (action === 'supprimer-lus') {
        if (!confirm('Supprimer tous les messages lus ?')) return;
        try {
          const d = await req('GET', '/messages?filter=read&limit=200');
          for (const m of d.messages || []) await req('DELETE', '/messages?id=' + m.id);
          toast('Messages lus supprimés', 'succes');
          chargerVueEnsemble();
        } catch (err) { toast(err.message, 'erreur'); }
      }
      if (action === 'tout-marquer-lu') {
        try {
          const d = await req('GET', '/messages?filter=unread&limit=200');
          for (const m of d.messages || []) await req('PATCH', '/messages?id=' + m.id);
          toast('Tous marqués comme lus', 'succes');
          chargerVueEnsemble();
        } catch (err) { toast(err.message, 'erreur'); }
      }
    });
  });

  document.getElementById('btn-supprimer-tout').addEventListener('click', async () => {
    if (!confirm('Supprimer TOUS les messages ? Action irréversible.')) return;
    try {
      const d = await req('GET', '/messages?limit=500');
      for (const m of d.messages || []) await req('DELETE', '/messages?id=' + m.id);
      toast('Tous les messages supprimés', 'succes');
      chargerVueEnsemble();
    } catch (err) { toast(err.message, 'erreur'); }
  });
}

async function exporterMessages() {
  try {
    const d = await req('GET', '/messages?limit=500');
    if (!d.messages || !d.messages.length) return toast('Aucun message à exporter', 'avert');
    const csv = ['ID,Nom,Email,Tel,Message,Lu,Date'].concat(
      d.messages.map((m) => m.id + ',"' + (m.name || '').replace(/"/g, '""') + '","' + m.email + '","' + (m.phone || '') + '","' + (m.message || '').replace(/"/g, '""').replace(/\n/g, ' ') + '",' + (m.isRead ? 'Oui' : 'Non') + ',"' + formaterDate(m.createdAt) + '"')
    ).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }));
    a.download = 'messages_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    toast('Export réussi', 'succes');
  } catch (err) { toast(err.message, 'erreur'); }
}

// ===================== MESSAGES =====================
let filtreMsgs = 'all';

async function chargerMessages() {
  const cont = document.getElementById('liste-messages');
  cont.innerHTML = '<div class="chargement-liste">Chargement...</div>';
  try {
    const d = await req('GET', '/messages?limit=100&filter=' + filtreMsgs);
    if (!d.messages || !d.messages.length) {
      cont.innerHTML = '<div class="etat-vide">Aucun message</div>';
      return;
    }
    const recherche = (document.getElementById('recherche-messages').value || '').toLowerCase();
    let msgs = d.messages;
    if (recherche) msgs = msgs.filter((m) => (m.name + m.email + m.message).toLowerCase().includes(recherche));
    cont.innerHTML = msgs.map(renderMessage).join('');
    cont.querySelectorAll('.element-message').forEach((el) => {
      el.addEventListener('click', () => ouvrirMessage(el.dataset.id));
    });
  } catch (err) {
    cont.innerHTML = '<div class="etat-vide-liste">' + echapper(err.message) + '</div>';
  }
}

function renderMessage(m) {
  const nl = !m.isRead;
  return '<div class="element-message ' + (nl ? 'non-lu' : '') + '" data-id="' + m.id + '">' +
    '<div class="entete-message"><span class="nom-expediteur">' + echapper(m.name) + '</span>' +
    '<span class="date-message">' + formaterDateCourte(m.createdAt) + '</span></div>' +
    '<div class="email-expediteur">' + echapper(m.email) + '</div>' +
    '<div class="apercu-texte">' + echapper(m.message) + '</div>' +
    (m.repliedAt ? '<span class="badge-repondu">Répondu</span>' : '') +
    '</div>';
}

async function ouvrirMessage(id) {
  try {
    const d = await req('GET', '/messages?limit=200');
    const msg = (d.messages || []).find((m) => m.id === id);
    if (!msg) return;
    messageActuel = msg;

    document.getElementById('corps-modale').innerHTML =
      '<div class="detail-message">' +
      '<div class="champ-message"><label>Expéditeur</label><div class="valeur">' + echapper(msg.name) + '</div></div>' +
      '<div class="champ-message"><label>Email</label><div class="valeur">' + echapper(msg.email) + '</div></div>' +
      (msg.phone ? '<div class="champ-message"><label>Téléphone</label><div class="valeur">' + echapper(msg.phone) + '</div></div>' : '') +
      '<div class="champ-message"><label>Date</label><div class="valeur">' + formaterDate(msg.createdAt) + '</div></div>' +
      '<div class="champ-message"><label>Message</label><div class="valeur" style="white-space:pre-wrap">' + echapper(msg.message) + '</div></div>' +
      '<div class="champ-message"><label>Répondre par email</label>' +
      '<textarea id="texte-reponse" rows="4" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--ligne-discrete);font-family:inherit"></textarea>' +
      '<button class="bouton-principal" style="margin-top:10px" id="btn-envoyer-reponse">Envoyer la réponse</button>' +
      '</div></div>';

    document.getElementById('btn-envoyer-reponse').addEventListener('click', () => envoyerReponse(msg.id, msg.email));

    document.getElementById('fenetre-message').classList.add('active');
    if (!msg.isRead) req('PATCH', '/messages?id=' + id).catch(() => {});
  } catch (err) { toast(err.message, 'erreur'); }
}

async function envoyerReponse(id, email) {
  const texte = document.getElementById('texte-reponse');
  if (!texte.value.trim()) return toast("Écrivez une réponse avant d'envoyer.", 'avert');
  const btn = document.getElementById('btn-envoyer-reponse');
  btn.disabled = true;
  btn.textContent = 'Envoi...';

  try {
    const msg = messageActuel;
    const d = await req('POST', '/admin/account', {
      action: 'send-reply',
      to: email,
      message: texte.value.trim(),
      nomDestinataire: msg ? msg.name : '',
      messageOriginal: msg ? msg.message : '',
      messageId: id,
    });
    if (d.success) {
      toast('Réponse envoyée', 'succes');
      document.getElementById('fenetre-message').classList.remove('active');
      chargerMessages();
      chargerCompteurMessages();
    } else {
      toast(d.error || "Erreur lors de l'envoi.", 'erreur');
    }
  } catch (err) { toast(err.message, 'erreur'); }
  finally { btn.disabled = false; btn.textContent = 'Envoyer la réponse'; }
}

function bindModaleMessage() {
  document.getElementById('btn-fermer-fenetre-message').addEventListener('click', () => {
    document.getElementById('fenetre-message').classList.remove('active');
  });
  document.getElementById('btn-fermer-message').addEventListener('click', () => {
    document.getElementById('fenetre-message').classList.remove('active');
  });
  document.getElementById('btn-supprimer-message').addEventListener('click', async () => {
    if (!messageActuel || !confirm('Supprimer ce message ?')) return;
    try {
      await req('DELETE', '/messages?id=' + messageActuel.id);
      toast('Message supprimé', 'succes');
      document.getElementById('fenetre-message').classList.remove('active');
      chargerMessages();
      chargerCompteurMessages();
    } catch (err) { toast(err.message, 'erreur'); }
  });

  document.getElementById('filtre-messages').addEventListener('change', (e) => {
    filtreMsgs = e.target.value;
    chargerMessages();
  });
  let timerRecherche;
  document.getElementById('recherche-messages').addEventListener('input', () => {
    clearTimeout(timerRecherche);
    timerRecherche = setTimeout(chargerMessages, 300);
  });
}

// ===================== ONGLETS SOURCE IMAGE (URL / GALERIE) =====================
function bindOngletsImage() {
  document.querySelectorAll('.bouton-onglet-image').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cible = btn.dataset.cible;
      const mode = btn.dataset.mode;
      document.querySelectorAll('.bouton-onglet-image[data-cible="' + cible + '"]').forEach((b) => b.classList.remove('actif'));
      btn.classList.add('actif');
      document.getElementById(cible + '-image-url').classList.toggle('masque', mode !== 'url');
      document.getElementById(cible + '-zone-upload').classList.toggle('masque', mode !== 'galerie');
    });
  });

  const fichier = document.getElementById('projet-image-fichier');
  fichier.addEventListener('change', () => {
    const f = fichier.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast('Image trop lourde (max 5 Mo).', 'erreur');
    const lecteur = new FileReader();
    lecteur.onload = (e) => {
      const apercu = document.getElementById('projet-image-apercu');
      apercu.src = e.target.result;
      apercu.classList.remove('masque');
    };
    lecteur.readAsDataURL(f);
  });
}

async function resoudreImageProjet() {
  const modeGalerie = document.querySelector('.bouton-onglet-image[data-cible="projet"].actif').dataset.mode === 'galerie';
  if (!modeGalerie) return document.getElementById('projet-image-url').value.trim();

  const fichier = document.getElementById('projet-image-fichier').files[0];
  if (!fichier) return '';

  const base64 = await new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = (e) => resolve(e.target.result);
    lecteur.onerror = reject;
    lecteur.readAsDataURL(fichier);
  });

  const d = await req('POST', '/admin/account', { action: 'upload-image', imageBase64: base64, nomFichier: fichier.name });
  if (!d.success) throw new Error(d.error || "Échec de l'upload.");
  return d.url;
}

// ===================== PROJETS =====================
const LABELS_STATUT_PROJET = { TERMINE: 'Terminé', EN_COURS: 'En cours', PREVU: 'Prévu' };
const LABELS_TYPE_PROJET = { ACADEMIQUE: 'Académique', PROFESSIONNEL: 'Professionnel' };

async function chargerProjets() {
  const liste = document.getElementById('liste-projets');
  liste.innerHTML = '<div class="chargement-liste">Chargement...</div>';
  try {
    const d = await req('GET', '/projects');
    const projects = d.projects || [];
    document.getElementById('nb-projets').textContent = projects.length;
    liste.innerHTML = projects.length ? projects.map(renderProjet).join('') : '<div class="etat-vide-liste">Aucun projet</div>';
    bindListe('liste-projets', 'projects', chargerProjets);
  } catch (err) { liste.innerHTML = '<div class="etat-vide-liste">' + echapper(err.message) + '</div>'; }
}

function renderProjet(p) {
  const badge = { TERMINE: 'badge-termine', EN_COURS: 'badge-en-cours', PREVU: 'badge-prevu' }[p.statut] || '';
  const tags = p.technologies ? p.technologies.split(',').map((t) => '<span class="tag-petit">' + echapper(t.trim()) + '</span>').join('') : '';
  const miniature = p.imageUrl
    ? '<img src="' + echapper(p.imageUrl) + '" class="miniature-liste" alt="">'
    : '<div class="miniature-liste miniature-vide">Pas d\'image</div>';
  return '<div class="element-liste" data-id="' + p.id + '">' +
    miniature +
    '<div class="element-liste-info">' +
    '<div class="element-liste-titre">' + echapper(p.titre) +
    '<span class="badge-element ' + badge + '">' + (LABELS_STATUT_PROJET[p.statut] || p.statut) + '</span>' +
    '<span class="tag-petit">' + LABELS_TYPE_PROJET[p.type] + '</span>' +
    '</div>' +
    '<div class="element-liste-meta">' + echapper((p.description || '').slice(0, 100)) + '</div>' +
    (tags ? '<div class="element-liste-tags">' + tags + '</div>' : '') +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-shrink:0">' +
    '<button class="bouton-modifier-element" data-id="' + p.id + '" data-type="projects">Modifier</button>' +
    '<button class="bouton-supprimer-element" data-id="' + p.id + '" data-type="projects">Supprimer</button>' +
    '</div></div>';
}

// ===================== FORMATIONS =====================
const LABELS_STATUT_FORMATION = { EN_COURS: 'En cours', OBTENU: 'Obtenu' };

async function chargerFormations() {
  const liste = document.getElementById('liste-formations');
  liste.innerHTML = '<div class="chargement-liste">Chargement...</div>';
  try {
    const d = await req('GET', '/formations');
    const formations = d.formations || [];
    document.getElementById('nb-formations').textContent = formations.length;
    liste.innerHTML = formations.length ? formations.map(renderFormation).join('') : '<div class="etat-vide-liste">Aucune formation</div>';
    bindListe('liste-formations', 'formations', chargerFormations);
  } catch (err) { liste.innerHTML = '<div class="etat-vide-liste">' + echapper(err.message) + '</div>'; }
}

function renderFormation(f) {
  const badge = f.statut === 'EN_COURS' ? 'badge-en-cours' : 'badge-termine';
  return '<div class="element-liste" data-id="' + f.id + '">' +
    '<div class="element-liste-info">' +
    '<div class="element-liste-titre">' + echapper(f.titre) +
    '<span class="badge-element ' + badge + '">' + (LABELS_STATUT_FORMATION[f.statut] || f.statut) + '</span>' +
    '</div>' +
    '<div class="element-liste-meta">' + echapper(f.ecole || '') + (f.periode ? ' · ' + echapper(f.periode) : '') + '</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-shrink:0">' +
    '<button class="bouton-modifier-element" data-id="' + f.id + '" data-type="formations">Modifier</button>' +
    '<button class="bouton-supprimer-element" data-id="' + f.id + '" data-type="formations">Supprimer</button>' +
    '</div></div>';
}

// ===================== EXPERIENCES =====================
const LABELS_STATUT_EXP = { TERMINE: 'Terminé', EN_COURS: 'En cours', PREVU: 'Prévu', RECHERCHE: 'En recherche' };

async function chargerExperiences() {
  const liste = document.getElementById('liste-experiences');
  liste.innerHTML = '<div class="chargement-liste">Chargement...</div>';
  try {
    const d = await req('GET', '/experiences');
    const experiences = d.experiences || [];
    document.getElementById('nb-experiences').textContent = experiences.length;
    liste.innerHTML = experiences.length ? experiences.map(renderExperience).join('') : '<div class="etat-vide-liste">Aucune expérience</div>';
    bindListe('liste-experiences', 'experiences', chargerExperiences);
  } catch (err) { liste.innerHTML = '<div class="etat-vide-liste">' + echapper(err.message) + '</div>'; }
}

function renderExperience(exp) {
  const badge = { TERMINE: 'badge-termine', EN_COURS: 'badge-en-cours', PREVU: 'badge-prevu', RECHERCHE: 'badge-recherche' }[exp.statut] || '';
  const tags = exp.tags ? exp.tags.split(',').map((t) => '<span class="tag-petit">' + echapper(t.trim()) + '</span>').join('') : '';
  return '<div class="element-liste" data-id="' + exp.id + '">' +
    '<div class="element-liste-info">' +
    '<div class="element-liste-titre">' + echapper(exp.titre) +
    '<span class="badge-element ' + badge + '">' + (LABELS_STATUT_EXP[exp.statut] || exp.statut) + '</span>' +
    '</div>' +
    '<div class="element-liste-meta">' + echapper(exp.entreprise || '') + (exp.lieu ? ' · ' + echapper(exp.lieu) : '') + '</div>' +
    (tags ? '<div class="element-liste-tags">' + tags + '</div>' : '') +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-shrink:0">' +
    '<button class="bouton-modifier-element" data-id="' + exp.id + '" data-type="experiences">Modifier</button>' +
    '<button class="bouton-supprimer-element" data-id="' + exp.id + '" data-type="experiences">Supprimer</button>' +
    '</div></div>';
}

// ===================== COMPETENCES =====================
const LABELS_CATEGORIE_COMP = {
  FRONTEND: 'Front-end', BACKEND: 'Back-end', MOBILE: 'Mobile',
  RESEAUX_INFRA: 'Réseaux', MARKETING_DIGITAL: 'Marketing digital',
  DESIGN_CONTENU: 'Design', AUTRE: 'Autre',
};

async function chargerCompetences() {
  const liste = document.getElementById('liste-competences');
  liste.innerHTML = '<div class="chargement-liste">Chargement...</div>';
  try {
    const d = await req('GET', '/skills');
    const skills = d.skills || [];
    document.getElementById('nb-competences').textContent = skills.length;
    liste.innerHTML = skills.length ? skills.map(renderCompetence).join('') : '<div class="etat-vide-liste">Aucune compétence</div>';
    bindListe('liste-competences', 'skills', chargerCompetences);
  } catch (err) { liste.innerHTML = '<div class="etat-vide-liste">' + echapper(err.message) + '</div>'; }
}

function renderCompetence(c) {
  return '<div class="element-liste" data-id="' + c.id + '">' +
    '<div class="element-liste-info">' +
    '<div class="element-liste-titre">' + echapper(c.nom) +
    '<span class="tag-petit">' + (LABELS_CATEGORIE_COMP[c.categorie] || c.categorie) + '</span>' +
    '</div>' +
    '<div class="element-liste-meta">' + echapper(c.icone) + '</div>' +
    '</div>' +
    '<div style="display:flex;gap:6px;flex-shrink:0">' +
    '<button class="bouton-modifier-element" data-id="' + c.id + '" data-type="skills">Modifier</button>' +
    '<button class="bouton-supprimer-element" data-id="' + c.id + '" data-type="skills">Supprimer</button>' +
    '</div></div>';
}

// ===================== BINDING GENERIQUE DES LISTES =====================
const ROUTES_TYPE = { projects: '/projects', formations: '/formations', experiences: '/experiences', skills: '/skills' };
const LISTE_TYPE = { projects: '/projects', formations: '/formations', experiences: '/experiences', skills: '/skills' };

function bindListe(idListe, type, rechargerFn) {
  const liste = document.getElementById(idListe);

  liste.querySelectorAll('.bouton-supprimer-element').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Supprimer cet élément définitivement ?')) return;
      try {
        await req('DELETE', ROUTES_TYPE[type] + '?id=' + btn.dataset.id);
        toast('Supprimé', 'succes');
        rechargerFn();
      } catch (err) { toast(err.message, 'erreur'); }
    });
  });

  liste.querySelectorAll('.bouton-modifier-element').forEach((btn) => {
    btn.addEventListener('click', () => ouvrirModifier(btn.dataset.id, type, rechargerFn));
  });
}

// ===================== MODALE DE MODIFICATION =====================
function ouvrirModale(titre, corps, boutons) {
  let m = document.getElementById('mg');
  if (!m) {
    m = document.createElement('div');
    m.id = 'mg';
    m.className = 'fenetre-modale';
    m.innerHTML = '<div class="contenu-modale">' +
      '<div class="entete-modale"><h3 id="mg-t"></h3><button class="bouton-fermer-modale" id="mg-fermer">&times;</button></div>' +
      '<div class="corps-modale" id="mg-c"></div>' +
      '<div class="pied-modale" id="mg-p"></div>' +
      '</div>';
    document.body.appendChild(m);
    document.getElementById('mg-fermer').addEventListener('click', () => m.classList.remove('active'));
  }
  document.getElementById('mg-t').textContent = titre;
  document.getElementById('mg-c').innerHTML = corps;
  const pied = document.getElementById('mg-p');
  pied.innerHTML = '';
  const btnFermer = document.createElement('button');
  btnFermer.className = 'bouton-secondaire';
  btnFermer.textContent = 'Fermer';
  btnFermer.onclick = () => m.classList.remove('active');
  pied.appendChild(btnFermer);
  (boutons || []).forEach((b) => {
    const btn = document.createElement('button');
    btn.className = b.classe || 'bouton-principal';
    btn.textContent = b.texte;
    btn.onclick = b.fn;
    pied.appendChild(btn);
  });
  m.classList.add('active');
}

function champModif(label, id, valeur, type, max) {
  return '<div class="champ-form"><label>' + echapper(label) + '</label>' +
    '<input type="' + (type || 'text') + '" id="' + id + '" value="' + echapper(valeur || '') + '"' + (max ? ' maxlength="' + max + '"' : '') + '></div>';
}
function textareaModif(label, id, valeur) {
  return '<div class="champ-form pleine-largeur"><label>' + echapper(label) + '</label><textarea id="' + id + '">' + echapper(valeur || '') + '</textarea></div>';
}
function selectModif(label, id, options, actif) {
  return '<div class="champ-form"><label>' + echapper(label) + '</label><select id="' + id + '">' +
    options.map((o) => '<option value="' + o[0] + '"' + (o[0] === actif ? ' selected' : '') + '>' + o[1] + '</option>').join('') +
    '</select></div>';
}

async function ouvrirModifier(id, type, rechargerFn) {
  let item;
  try {
    const d = await req('GET', LISTE_TYPE[type]);
    const liste = d.projects || d.formations || d.experiences || d.skills || [];
    item = liste.find((el) => String(el.id) === String(id));
  } catch (err) { return toast(err.message, 'erreur'); }
  if (!item) return toast('Élément introuvable.', 'erreur');

  let corps = '<div class="grille-champs-modif">';

  if (type === 'projects') {
    corps += champModif('Titre', 'm-titre', item.titre, 'text', 200) +
      selectModif('Type', 'm-type', [['ACADEMIQUE', 'Académique'], ['PROFESSIONNEL', 'Professionnel']], item.type) +
      textareaModif('Description', 'm-description', item.description) +
      champModif('Technologies', 'm-technologies', item.technologies, 'text', 500) +
      selectModif('Statut', 'm-statut', [['TERMINE', 'Terminé'], ['EN_COURS', 'En cours'], ['PREVU', 'Prévu']], item.statut) +
      champModif('Lien du site', 'm-lien-site', item.lienSite, 'url', 500) +
      champModif('Lien GitHub', 'm-lien-github', item.lienGithub, 'url', 500) +
      champModif('Ordre', 'm-ordre', item.ordre, 'number') +
      '<div class="champ-form pleine-largeur">' +
      '<label>Image du projet</label>' +
      (item.imageUrl ? '<img src="' + echapper(item.imageUrl) + '" class="apercu-image-existante" alt="">' : '') +
      '<div class="onglet-source-image">' +
      '<button type="button" class="bouton-onglet-image actif" data-cible="modif" data-mode="url">URL</button>' +
      '<button type="button" class="bouton-onglet-image" data-cible="modif" data-mode="galerie">Galerie</button>' +
      '</div>' +
      '<input type="url" id="modif-image-url" placeholder="https://..." value="' + echapper(item.imageUrl || '') + '" maxlength="500">' +
      '<div class="zone-upload-image masque" id="modif-zone-upload" onclick="document.getElementById(\'modif-image-fichier\').click()">' +
      'Cliquer pour choisir une image (5 Mo max)' +
      '<input type="file" id="modif-image-fichier" accept="image/*" style="display:none">' +
      '<img id="modif-image-apercu" class="apercu-image-upload masque">' +
      '</div>' +
      '<input type="hidden" id="modif-image-actuelle" value="' + echapper(item.imageUrl || '') + '">' +
      '</div>';
  } else if (type === 'formations') {
    corps += champModif('Titre', 'm-titre', item.titre, 'text', 200) +
      champModif('École / Établissement', 'm-ecole', item.ecole, 'text', 200) +
      champModif('Période', 'm-periode', item.periode, 'text', 100) +
      selectModif('Statut', 'm-statut', [['EN_COURS', 'En cours'], ['OBTENU', 'Obtenu']], item.statut) +
      champModif('Ordre', 'm-ordre', item.ordre, 'number') +
      textareaModif('Description', 'm-description', item.description);
  } else if (type === 'experiences') {
    corps += champModif('Titre', 'm-titre', item.titre, 'text', 200) +
      champModif('Type', 'm-type-exp', item.typeExp, 'text', 100) +
      champModif('Entreprise', 'm-entreprise', item.entreprise, 'text', 200) +
      champModif('Lieu', 'm-lieu', item.lieu, 'text', 200) +
      champModif('Date début', 'm-date-debut', item.dateDebut, 'text', 100) +
      champModif('Date fin', 'm-date-fin', item.dateFin, 'text', 100) +
      textareaModif('Description', 'm-description', item.description) +
      champModif('Tags', 'm-tags', item.tags, 'text', 500) +
      selectModif('Statut', 'm-statut', [['TERMINE', 'Terminé'], ['EN_COURS', 'En cours'], ['PREVU', 'Prévu'], ['RECHERCHE', 'En recherche']], item.statut) +
      champModif('Ordre', 'm-ordre', item.ordre, 'number');
  } else if (type === 'skills') {
    corps += champModif('Nom', 'm-nom', item.nom, 'text', 100) +
      champModif('Icône Iconify', 'm-icone', item.icone, 'text', 255) +
      selectModif('Catégorie', 'm-categorie', Object.entries(LABELS_CATEGORIE_COMP).map(([k, v]) => [k, v]), item.categorie) +
      champModif('Ordre', 'm-ordre', item.ordre, 'number');
  }
  corps += '</div>';

  const titres = { projects: 'Modifier le projet', formations: 'Modifier la formation', experiences: "Modifier l'expérience", skills: 'Modifier la compétence' };
  ouvrirModale(titres[type], corps, [{
    texte: 'Enregistrer',
    fn: async () => sauvegarderModif(id, type, rechargerFn),
  }]);

  if (type === 'projects') bindOngletsImageModale();
}

function bindOngletsImageModale() {
  document.querySelectorAll('.bouton-onglet-image[data-cible="modif"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bouton-onglet-image[data-cible="modif"]').forEach((b) => b.classList.remove('actif'));
      btn.classList.add('actif');
      document.getElementById('modif-image-url').classList.toggle('masque', btn.dataset.mode !== 'url');
      document.getElementById('modif-zone-upload').classList.toggle('masque', btn.dataset.mode !== 'galerie');
    });
  });

  const fichier = document.getElementById('modif-image-fichier');
  fichier.addEventListener('change', () => {
    const f = fichier.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast('Image trop lourde (max 5 Mo).', 'erreur');
    const lecteur = new FileReader();
    lecteur.onload = (e) => {
      const apercu = document.getElementById('modif-image-apercu');
      apercu.src = e.target.result;
      apercu.classList.remove('masque');
    };
    lecteur.readAsDataURL(f);
  });
}

async function resoudreImageModif() {
  const modeGalerie = document.querySelector('.bouton-onglet-image[data-cible="modif"].actif').dataset.mode === 'galerie';
  if (!modeGalerie) return document.getElementById('modif-image-url').value.trim();

  const fichier = document.getElementById('modif-image-fichier').files[0];
  if (!fichier) return document.getElementById('modif-image-actuelle').value;

  const base64 = await new Promise((resolve, reject) => {
    const lecteur = new FileReader();
    lecteur.onload = (e) => resolve(e.target.result);
    lecteur.onerror = reject;
    lecteur.readAsDataURL(fichier);
  });

  const d = await req('POST', '/admin/account', { action: 'upload-image', imageBase64: base64, nomFichier: fichier.name });
  if (!d.success) throw new Error(d.error || "Échec de l'upload.");
  return d.url;
}

async function sauvegarderModif(id, type, rechargerFn) {
  const boutonSauver = document.querySelector('#mg .bouton-principal');
  boutonSauver.disabled = true;
  boutonSauver.textContent = 'Enregistrement...';

  try {
    let body = {};
    if (type === 'projects') {
      body = {
        titre: val('m-titre'), type: val('m-type'), description: val('m-description'),
        technologies: val('m-technologies'), statut: val('m-statut'),
        lienSite: val('m-lien-site'), lienGithub: val('m-lien-github'),
        imageUrl: await resoudreImageModif(), ordre: parseInt(val('m-ordre'), 10) || 0,
      };
    } else if (type === 'formations') {
      body = {
        titre: val('m-titre'), ecole: val('m-ecole'), periode: val('m-periode'),
        description: val('m-description'), statut: val('m-statut'),
        ordre: parseInt(val('m-ordre'), 10) || 0,
      };
    } else if (type === 'experiences') {
      body = {
        titre: val('m-titre'), typeExp: val('m-type-exp'), entreprise: val('m-entreprise'),
        lieu: val('m-lieu'), dateDebut: val('m-date-debut'), dateFin: val('m-date-fin'),
        description: val('m-description'), tags: val('m-tags'), statut: val('m-statut'),
        ordre: parseInt(val('m-ordre'), 10) || 0,
      };
    } else if (type === 'skills') {
      body = {
        nom: val('m-nom'), icone: val('m-icone'), categorie: val('m-categorie'),
        ordre: parseInt(val('m-ordre'), 10) || 0,
      };
    }

    const d = await req('PUT', ROUTES_TYPE[type] + '?id=' + id, body);
    if (d.success) {
      toast('Modifications enregistrées', 'succes');
      document.getElementById('mg').classList.remove('active');
      rechargerFn();
    } else {
      toast(d.error || 'Erreur.', 'erreur');
    }
  } catch (err) { toast(err.message, 'erreur'); }
  finally {
    boutonSauver.disabled = false;
    boutonSauver.textContent = 'Enregistrer';
  }
}

// ===================== FORMULAIRES D'AJOUT =====================
function bindFormulaires() {
  // --- Ajout projet ---
  document.getElementById('form-ajout-projet').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-ajouter-projet');
    btn.disabled = true;
    btn.textContent = 'Ajout...';

    try {
      const imageUrl = await resoudreImageProjet();
      const body = {
        titre: val('projet-titre'),
        type: val('projet-type'),
        description: val('projet-description'),
        technologies: val('projet-technologies'),
        statut: val('projet-statut'),
        lienSite: val('projet-lien-site'),
        lienGithub: val('projet-lien-github'),
        imageUrl,
        ordre: parseInt(val('projet-ordre'), 10) || 0,
      };
      const d = await req('POST', '/projects', body);
      if (d.success) {
        toast('Projet ajouté', 'succes');
        e.target.reset();
        document.getElementById('projet-image-apercu').classList.add('masque');
        chargerProjets();
      } else {
        toast(d.error || 'Erreur.', 'erreur');
      }
    } catch (err) { toast(err.message, 'erreur'); }
    finally { btn.disabled = false; btn.textContent = 'Ajouter le projet'; }
  });

  // --- Ajout formation ---
  document.getElementById('form-ajout-formation').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-ajouter-formation');
    btn.disabled = true;
    btn.textContent = 'Ajout...';

    try {
      const body = {
        titre: val('form-titre'), ecole: val('form-ecole'), periode: val('form-periode'),
        description: val('form-description'), statut: val('form-statut'),
        ordre: parseInt(val('form-ordre'), 10) || 0,
      };
      const d = await req('POST', '/formations', body);
      if (d.success) {
        toast('Formation ajoutée', 'succes');
        e.target.reset();
        chargerFormations();
      } else {
        toast(d.error || 'Erreur.', 'erreur');
      }
    } catch (err) { toast(err.message, 'erreur'); }
    finally { btn.disabled = false; btn.textContent = 'Ajouter la formation'; }
  });

  // --- Ajout expérience ---
  document.getElementById('form-ajout-experience').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-ajouter-experience');
    btn.disabled = true;
    btn.textContent = 'Ajout...';

    try {
      const body = {
        titre: val('exp-titre'), typeExp: val('exp-type'), entreprise: val('exp-entreprise'),
        lieu: val('exp-lieu'), dateDebut: val('exp-date-debut'), dateFin: val('exp-date-fin'),
        description: val('exp-description'), tags: val('exp-tags'), statut: val('exp-statut'),
        ordre: parseInt(val('exp-ordre'), 10) || 0,
      };
      const d = await req('POST', '/experiences', body);
      if (d.success) {
        toast('Expérience ajoutée', 'succes');
        e.target.reset();
        chargerExperiences();
      } else {
        toast(d.error || 'Erreur.', 'erreur');
      }
    } catch (err) { toast(err.message, 'erreur'); }
    finally { btn.disabled = false; btn.textContent = "Ajouter l'expérience"; }
  });

  // --- Ajout compétence ---
  document.getElementById('form-ajout-competence').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-ajouter-competence');
    btn.disabled = true;
    btn.textContent = 'Ajout...';

    try {
      const body = {
        nom: val('comp-nom'), icone: val('comp-icone'), categorie: val('comp-categorie'),
        ordre: parseInt(val('comp-ordre'), 10) || 0,
      };
      const d = await req('POST', '/skills', body);
      if (d.success) {
        toast('Compétence ajoutée', 'succes');
        e.target.reset();
        chargerCompetences();
      } else {
        toast(d.error || 'Erreur.', 'erreur');
      }
    } catch (err) { toast(err.message, 'erreur'); }
    finally { btn.disabled = false; btn.textContent = 'Ajouter la compétence'; }
  });

  // --- Changement de mot de passe ---
  document.getElementById('formulaire-mdp').addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = val('mdp-actuel');
    const next = val('nouveau-mdp');
    const confirmMdp = val('confirmer-mdp');
    const msg = document.getElementById('message-mdp');

    if (next !== confirmMdp) { msg.textContent = 'Les mots de passe ne correspondent pas.'; msg.style.color = '#b23a3a'; return; }
    if (next.length < 12) { msg.textContent = 'Minimum 12 caractères.'; msg.style.color = '#b23a3a'; return; }

    try {
      const d = await req('POST', '/admin/account', { action: 'change-password', current, next });
      if (d.success) {
        msg.textContent = 'Mot de passe modifié. Reconnexion...';
        msg.style.color = 'var(--vert-accent)';
        setTimeout(() => {
          TOKEN = null;
          localStorage.removeItem('admin_token');
          sessionStorage.removeItem('admin_token');
          location.reload();
        }, 1800);
      } else {
        msg.textContent = d.error || 'Erreur.';
        msg.style.color = '#b23a3a';
      }
    } catch (err) { msg.textContent = err.message; msg.style.color = '#b23a3a'; }
  });
}

// ===================== ANALYTICS =====================
async function chargerAnalytics() {
  try {
    const d = await req('GET', '/analytics?view=resume');
    if (d.error) throw new Error(d.error);

    document.getElementById('an-nb-direct').textContent = d.enDirect || 0;
    document.getElementById('an-total').textContent = d.totalVisiteurs || 0;
    document.getElementById('an-aujourd').textContent = d.visiteursAujourdhui || 0;
    document.getElementById('an-30j').textContent = d.visiteurs30j || 0;
    document.getElementById('an-duree').textContent = formaterDuree(d.dureeMoySec);

    renderGraphiqueJours(d.parJour || []);
    renderPagesPopulaires(d.pagesPopulaires || []);
    renderParPays(d.parPays || []);
  } catch (err) { toast(err.message, 'erreur'); }

  try {
    const d = await req('GET', '/analytics?view=live');
    renderFluxLive(d.actionsRecentes || []);
  } catch {}

  try {
    const sessions = await req('GET', '/analytics?view=sessions&limit=20');
    renderSessions(sessions.sessions || []);
  } catch {}
}

function formaterDuree(sec) {
  if (!sec || sec < 1) return '—';
  if (sec < 60) return sec + 's';
  const m = Math.floor(sec / 60), s = sec % 60;
  return m + 'min' + (s ? ' ' + s + 's' : '');
}

function renderGraphiqueJours(parJour) {
  const ctx = document.getElementById('an-chart-jours');
  if (!ctx || !window.Chart) return;
  const jours = [], visiteurs = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const clef = d.toISOString().slice(0, 10);
    jours.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
    const trouve = parJour.find((r) => r.jour === clef);
    visiteurs.push(trouve ? trouve.visiteurs : 0);
  }
  if (graphiqueJours) graphiqueJours.destroy();
  graphiqueJours = new Chart(ctx.getContext('2d'), {
    type: 'bar',
    data: { labels: jours, datasets: [{ label: 'Visiteurs', data: visiteurs, backgroundColor: '#62b808', borderRadius: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } },
  });
  graphiqueJours.__dernieresDonnees = parJour;
}

function renderPagesPopulaires(pages) {
  const el = document.getElementById('an-pages-pop');
  if (!pages.length) { el.innerHTML = '<div class="etat-vide-liste">Aucune donnée</div>'; return; }
  const max = pages[0].vues || 1;
  el.innerHTML = pages.map((p) => {
    const pct = Math.round((p.vues / max) * 100);
    return '<div class="an-barre-page"><span>' + echapper(p.page) + '</span>' +
      '<div class="an-barre-fond"><div class="an-barre-rempli" style="width:' + pct + '%"></div></div>' +
      '<span class="an-vues">' + p.vues + ' vues</span></div>';
  }).join('');
}

function renderParPays(parPays) {
  const el = document.getElementById('an-par-pays');
  if (!parPays.length) { el.innerHTML = '<div class="etat-vide-liste">Aucune donnée de localisation</div>'; return; }
  const max = parPays[0].nb || 1;
  el.innerHTML = '<div class="bloc-pays">' + parPays.map((p) => {
    const pct = Math.round((p.nb / max) * 100);
    return '<div class="ligne-pays"><span class="pays-nom">' + echapper(p.pays) + '</span>' +
      '<div class="pays-barre-fond"><div class="pays-barre-rempli" style="width:' + pct + '%"></div></div>' +
      '<span class="pays-nb">' + p.nb + '</span></div>';
  }).join('') + '</div>';
}

function renderFluxLive(actions) {
  const el = document.getElementById('an-flux-live');
  if (!actions.length) { el.innerHTML = '<div class="etat-vide-liste">Aucune activité récente</div>'; return; }
  el.innerHTML = actions.map((a) => {
    const heure = new Date(a.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return '<div class="an-live-ligne">' +
      '<span>' + heure + '</span><span>#' + a.sessionCourt + '</span>' +
      '<span>' + echapper(a.typeAction) + (a.cible ? ' → ' + echapper(a.cible) : '') + '</span>' +
      '<span>' + echapper(a.page || '') + '</span>' +
      '<button class="bouton-supprimer-analytics" data-type="action" data-id="' + a.id + '" title="Supprimer cette action">&times;</button>' +
      '</div>';
  }).join('');
  bindSuppressionAnalytics(el);
}

function renderSessions(sessions) {
  const el = document.getElementById('an-sessions');
  if (!sessions.length) { el.innerHTML = '<div class="etat-vide-liste">Aucune session</div>'; return; }
  el.innerHTML = sessions.map((s) => {
    const ua = s.userAgent || '';
    const appareil = ua.includes('Mobile') ? 'Mobile' : 'Ordinateur';
    const localisation = s.ville && s.pays ? s.ville + ', ' + s.pays : (s.pays || '');
    return '<div class="an-session-ligne">' +
      '<span>#' + s.sessionId.slice(0, 8) + '</span>' +
      '<div class="an-session-meta">' +
      '<span>' + appareil + '</span>' +
      (localisation ? '<span class="badge-localisation">' + echapper(localisation) + '</span>' : '') +
      '<span>' + s.nbPages + ' page(s)</span>' +
      '<span>' + s.nbActions + ' action(s)</span>' +
      '</div>' +
      '<button class="bouton-supprimer-analytics" data-type="session" data-sessionid="' + s.sessionId + '" title="Supprimer cette session">&times;</button>' +
      '</div>';
  }).join('');
  bindSuppressionAnalytics(el);
}

function bindSuppressionAnalytics(conteneur) {
  conteneur.querySelectorAll('.bouton-supprimer-analytics').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const type = btn.dataset.type;
      const confirmMsg = type === 'session'
        ? 'Supprimer cette session et toutes ses visites/actions associées ?'
        : 'Supprimer cette action ?';
      if (!confirm(confirmMsg)) return;

      btn.disabled = true;
      try {
        const url = type === 'session'
          ? '/analytics?type=session&sessionId=' + encodeURIComponent(btn.dataset.sessionid)
          : '/analytics?type=action&id=' + encodeURIComponent(btn.dataset.id);
        const d = await req('DELETE', url);
        if (d.success) {
          toast('Supprimé', 'succes');
          chargerAnalytics();
        } else {
          toast(d.error || 'Erreur.', 'erreur');
          btn.disabled = false;
        }
      } catch (err) {
        toast(err.message, 'erreur');
        btn.disabled = false;
      }
    });
  });
}

})();