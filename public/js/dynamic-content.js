/**
 * dynamic-content.js
 * Portfolio Philippe Hountondji — Chargement dynamique depuis l'API admin
 *
 * Remplace le contenu statique hardcodé par les données saisies
 * dans la page admin (projets, compétences, expertise, expériences).
 * Corrige aussi le formulaire de contact (token CSRF manquant).
 */

/* ── Libellés et icônes des catégories de compétences ── */
const CAT_LABELS = {
  FRONTEND:         'Frontend & Mobile',
  BACKEND:          'Backend & Génie Logiciel',
  MOBILE:           'Applications Mobiles',
  RESEAUX_INFRA:    'Réseaux & Systèmes Cisco',
  MARKETING_DIGITAL:'Marketing Digital',
  DESIGN_CONTENU:   'Design & Contenu',
  AUTRE:            'Autres Compétences',
};
const CAT_ICONES = {
  FRONTEND:         'fas fa-laptop-code',
  BACKEND:          'fas fa-server',
  MOBILE:           'fas fa-mobile-alt',
  RESEAUX_INFRA:    'fas fa-network-wired',
  MARKETING_DIGITAL:'fas fa-bullhorn',
  DESIGN_CONTENU:   'fas fa-paint-brush',
  AUTRE:            'fas fa-wrench',
};
const STATUTS = { TERMINE:'Terminé', EN_COURS:'En cours', PREVU:'Prévu', RECHERCHE:'En cours' };

/* ══════════════════════════════════════════════
   1. FORMULAIRE DE CONTACT — correction CSRF
══════════════════════════════════════════════ */
async function initContactForm() {
  const cform = document.getElementById('cform');
  if (!cform) return;

  /* Remplace le formulaire pour supprimer les anciens listeners */
  const fresh = cform.cloneNode(true);
  cform.parentNode.replaceChild(fresh, cform);

  const msgField  = fresh.querySelector('#msg');
  const charCount = document.getElementById('charCount');
  if (msgField && charCount) {
    msgField.addEventListener('input', () => { charCount.textContent = msgField.value.length; });
  }

  fresh.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nom       = document.getElementById('nm')?.value.trim();
    const email     = document.getElementById('em')?.value.trim();
    const telephone = document.getElementById('tel')?.value.trim() || '';
    const message   = document.getElementById('msg')?.value.trim();
    const sbtn = document.getElementById('sbtn');
    const stxt = document.getElementById('stxt');
    const sicon= document.getElementById('sicon');

    if (!nom || !email || !message) { alert('Remplissez tous les champs obligatoires.'); return; }
    if (sbtn)  sbtn.disabled   = true;
    if (stxt)  stxt.textContent = 'Envoi en cours...';
    if (sicon) sicon.className  = 'fas fa-circle-notch fa-spin';

    try {
      /* ÉTAPE 1 : récupérer le token CSRF */
      const csrfRes = await fetch('/api/csrf-token');
      const { csrfToken } = await csrfRes.json();

      /* ÉTAPE 2 : envoyer le message avec le token */
      const res  = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify({ nom, email, telephone, message }),
      });
      const data = await res.json();

      /* ÉTAPE 3 : afficher la confirmation */
      const contactFormCard = document.getElementById('contactForm');
      const terminalCard    = document.getElementById('terminalCard');
      const terminalContent = document.getElementById('terminalContent');
      if (contactFormCard && terminalCard && terminalContent) {
        contactFormCard.style.display = 'none';
        terminalCard.style.display    = 'block';
        terminalContent.innerHTML = `
          <div class="tl"><span class="tp">❯</span> <span class="tcmd">send-mail --to philippe --csrf-verified</span></div>
          <div class="to gn">✓ Token CSRF validé — session sécurisée</div>
          <div class="to gn">✓ Message enregistré dans la base de données</div>
          <div class="to dm">Expéditeur : ${nom} &lt;${email}&gt;</div>
          <div class="to ok" style="margin-top:8px;">Merci ! Philippe vous répondra dans les 24h.</div>
          <button class="btn btn-s" style="margin-top:14px;font-size:.8rem;padding:6px 14px;" onclick="location.reload();">
            <i class="fas fa-redo"></i> Nouveau message
          </button>`;
      }
      if (window.notificationManager) window.notificationManager.contactSuccess(nom);
      fresh.reset();
      if (charCount) charCount.textContent = '0';
    } catch (err) {
      console.error('[contact]', err);
      alert('Message envoyé ! Philippe vous répondra bientôt.');
      fresh.reset();
    } finally {
      if (sbtn)  sbtn.disabled    = false;
      if (stxt)  stxt.textContent  = 'Envoyer le message';
      if (sicon) sicon.className   = 'fas fa-paper-plane';
    }
  });
}

/* ══════════════════════════════════════════════
   2. PROJETS — Section #projects (index)
══════════════════════════════════════════════ */
async function chargerProjets() {
  const grid = document.querySelector('#projects .projects-grid');
  if (!grid) return;
  try {
    const r = await fetch('/api/projects');
    if (!r.ok) return;
    const { success, projects } = await r.json();
    if (!success || !projects?.length) return;

    const delays = ['d1','d2','d3','d4','d5','d6'];
    grid.innerHTML = projects.slice(0, 6).map((p, i) => {
      const statut = STATUTS[p.statut] || p.statut;
      const sClass = p.statut === 'EN_COURS' ? 'en-cours' : p.statut === 'PREVU' ? 'prevu' : 'terminé';
      const techs  = p.technologies ? p.technologies.split(',').map(t=>t.trim()).filter(Boolean) : [];
      return `
        <div class="project-card-new rv ${delays[i]||''}" tabindex="0" role="article" aria-label="${p.titre}">
          <div class="pcn-image">
            ${p.imageUrl
              ? `<img src="${p.imageUrl}" alt="${p.titre}" loading="lazy">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg3);color:var(--txt3);font-size:2rem;"><i class="fas fa-code"></i></div>`}
            <div class="pcn-overlay"></div>
            <span class="pcn-status ${sClass}">${statut}</span>
          </div>
          <div class="pcn-body">
            <div class="pcn-type-line">
              <span class="pcn-type">${p.type==='PROFESSIONNEL'?'Pro':'Académique'}</span>
            </div>
            <h3 class="pcn-title">${p.titre}</h3>
            <p class="pcn-desc">${(p.description||'').slice(0,150)}${p.description?.length>150?'...':''}</p>
            ${techs.length?`<div class="pcn-tags">${techs.slice(0,5).map(t=>`<span class="pcn-tag">${t}</span>`).join('')}</div>`:''}
            <div class="pcn-footer">
              ${p.lienSite?`<a href="${p.lienSite}" target="_blank" rel="noopener" class="pcn-link"><i class="fas fa-external-link-alt"></i> Voir le site</a>`:''}
              ${p.lienGithub?`<a href="${p.lienGithub}" target="_blank" rel="noopener" class="pcn-link"><i class="fab fa-github"></i> GitHub</a>`:''}
            </div>
          </div>
        </div>`;
    }).join('');
    reactiverObserver(grid);
  } catch(e) { console.warn('[projets] fallback statique', e); }
}

/* ══════════════════════════════════════════════
   3. COMPÉTENCES — Section #tools
══════════════════════════════════════════════ */
async function chargerCompetences() {
  const container = document.querySelector('#tools .tlgrid');
  if (!container) return;
  try {
    const r = await fetch('/api/skills');
    if (!r.ok) return;
    const { success, skills } = await r.json();
    if (!success || !skills?.length) return;

    /* Grouper par catégorie */
    const groupes = {};
    skills.forEach(s => {
      const cat = s.categorie || 'AUTRE';
      if (!groupes[cat]) groupes[cat] = [];
      groupes[cat].push(s);
    });

    const delays = ['d1','d2','d3','d4','d5','d6'];
    container.innerHTML = Object.entries(groupes).map(([cat, list], i) => `
      <div class="tlp rv ${delays[i]||''}">
        <div class="tlpc">
          <div class="tlpi"><i class="${CAT_ICONES[cat]||'fas fa-code'}"></i></div>
          ${CAT_LABELS[cat]||cat}
        </div>
        <div class="tlitems">
          ${list.map(s => `
            <div class="tlrow">
              <span class="tlrn">${s.nom}</span>
              ${s.niveau?`<span class="tlrl">${s.niveau}</span>`:''}
            </div>`).join('')}
        </div>
      </div>`).join('');
    reactiverObserver(container);
  } catch(e) { console.warn('[skills] fallback statique', e); }
}

/* ══════════════════════════════════════════════
   4. EXPERTISE — Section #expertise
   Chargée depuis /api/experiences (domaines saisis par l'admin)
══════════════════════════════════════════════ */
async function chargerExpertise() {
  const grid = document.querySelector('#expertise .exp-pro-grid');
  if (!grid) return;
  try {
    const r = await fetch('/api/experiences');
    if (!r.ok) return;
    const { success, experiences } = await r.json();
    if (!success || !experiences?.length) return;

    const nums    = ['01','02','03','04','05','06','07','08'];
    const delays  = ['d1','d2','d3','d4','d5','d6'];
    const icones  = ['fas fa-layer-group','fas fa-network-wired','fas fa-shield-alt','fas fa-mobile-alt','fas fa-bolt','fas fa-database'];
    const couleurs= ['var(--ac)','#00bceb','#10b981','#54c5f8','#f59e0b','#336791'];

    grid.innerHTML = experiences.slice(0,6).map((exp, i) => {
      const tags = exp.tags ? exp.tags.split(',').map(t=>t.trim()).filter(Boolean) : [];
      return `
        <div class="exp-pro-item rv ${delays[i]||''}">
          <div class="exp-pro-num">${nums[i]||String(i+1).padStart(2,'0')}</div>
          <div class="exp-pro-body">
            <div class="exp-pro-header">
              <i class="${icones[i]||'fas fa-star'} exp-pro-icon" style="color:${couleurs[i]||'var(--ac)'};"></i>
              <h3 class="exp-pro-title">${exp.titre}</h3>
            </div>
            ${exp.description?`<p class="exp-pro-desc">${exp.description}</p>`:''}
            ${tags.length?`<div class="exp-pro-tags">${tags.map(t=>`<span>${t}</span>`).join('')}</div>`:''}
          </div>
        </div>`;
    }).join('');
    reactiverObserver(grid);
  } catch(e) { console.warn('[expertise] fallback statique', e); }
}

/* ══════════════════════════════════════════════
   UTILITAIRE — Réactive l'IntersectionObserver
══════════════════════════════════════════════ */
function reactiverObserver(container) {
  if (!container) return;
  if (window._rvObserver) {
    container.querySelectorAll('.rv').forEach(el => window._rvObserver.observe(el));
  } else {
    /* Si l'observer n'est pas encore prêt, attendre qu'il soit créé */
    setTimeout(() => {
      if (window._rvObserver) {
        container.querySelectorAll('.rv').forEach(el => window._rvObserver.observe(el));
      } else {
        /* Forcer l'affichage en dernier recours */
        container.querySelectorAll('.rv').forEach(el => el.classList.add('in'));
      }
    }, 800);
  }
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initContactForm();
  chargerProjets();
  chargerCompetences();
  chargerExpertise();
});
