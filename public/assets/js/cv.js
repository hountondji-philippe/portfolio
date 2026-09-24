// assets/js/cv.js
// Logique dynamique de la page CV : chargement API, fallback local, thème et impression

(function () {
  'use strict';

  // ── GESTION DU THÈME (CLAIR / SOMBRE) ───────────────────────────────────
  const racineHtml = document.documentElement;
  const btnThemeCv = document.getElementById('btn-theme-cv');

  const themeInitial = localStorage.getItem('theme-portfolio') || 'clair';
  racineHtml.setAttribute('data-theme', themeInitial);

  if (btnThemeCv) {
    btnThemeCv.addEventListener('click', () => {
      const actuel = racineHtml.getAttribute('data-theme');
      const nouveau = actuel === 'sombre' ? 'clair' : 'sombre';
      racineHtml.setAttribute('data-theme', nouveau);
      localStorage.setItem('theme-portfolio', nouveau);
    });
  }

  // ── IMPRESSION / EXPORT PDF ─────────────────────────────────────────────
  const btnImprimer = document.getElementById('btn-imprimer');
  if (btnImprimer) {
    btnImprimer.addEventListener('click', () => {
      window.print();
    });
  }

  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 200);
    });
  }

  // ── UTILITAIRES ─────────────────────────────────────────────────────────
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

  // ── CHARGEMENT ET RENDU DES DONNÉES ─────────────────────────────────────
  async function init() {
    const [settingsData, skillsData, languesData, expData, formData, projData] = await Promise.all([
      recuperer('/api/formations?resource=settings'),
      recuperer('/api/skills'),
      recuperer('/api/formations?resource=languages'),
      recuperer('/api/experiences'),
      recuperer('/api/formations'),
      recuperer('/api/projects'),
    ]);

    // Profil & Coordonnées
    if (settingsData && settingsData.settings) {
      const s = settingsData.settings;
      if (s.titrePro) {
        document.getElementById('cv-titre-pro').textContent = s.titrePro;
      }
      if (s.photoUrl) {
        const img = document.getElementById('cv-photo');
        img.src = s.photoUrl;
      }
      if (s.localisation) {
        const el = document.getElementById('cv-loc');
        if (el) el.textContent = s.localisation;
      }
      if (s.emailPublic) {
        const el = document.getElementById('cv-mail');
        if (el) { el.textContent = s.emailPublic; el.href = 'mailto:' + s.emailPublic; }
      }
      if (s.telephone) {
        const el = document.getElementById('cv-tel');
        if (el) { el.textContent = s.telephone; el.href = 'tel:' + s.telephone.replace(/\s+/g, ''); }
      }
      if (s.bio) {
        const secBio = document.getElementById('section-bio');
        const textBio = document.getElementById('cv-bio');
        if (secBio && textBio) {
          textBio.textContent = s.bio;
          secBio.style.display = 'block';
        }
      }
      if (s.qualites) {
        const items = s.qualites.split(/[,•;]+/).map((q) => q.trim()).filter(Boolean);
        if (items.length) {
          const listQ = document.getElementById('cv-qualites');
          if (listQ) listQ.innerHTML = items.map((q) => '<li>' + echapper(q) + '</li>').join('');
        }
      }
    }

    // Compétences
    if (skillsData && skillsData.skills && skillsData.skills.length > 0) {
      const parCategorie = {};
      skillsData.skills.forEach((sk) => {
        if (!parCategorie[sk.categorie]) parCategorie[sk.categorie] = [];
        parCategorie[sk.categorie].push(sk.nom);
      });

      const LABELS_CAT = {
        FRONTEND: 'Développement Front-End',
        BACKEND: 'Back-End & Logique Serveur',
        MOBILE: 'Mobile',
        RESEAUX_INFRA: 'Réseaux & Infrastructure',
        MARKETING_DIGITAL: 'Marketing Digital',
        DESIGN_CONTENU: 'Design & Création',
        AUTRE: 'Autres Outils',
      };

      const contCompetences = document.getElementById('cv-competences');
      if (contCompetences) {
        contCompetences.innerHTML = Object.entries(parCategorie).map(([cat, noms]) => `
          <div class="sous-groupe-competence">
            <span class="titre-sous-groupe">${echapper(LABELS_CAT[cat] || cat)} :</span>
            <p>${noms.map(echapper).join(', ')}</p>
          </div>
        `).join('');
      }
    }

    // Langues
    if (languesData && languesData.languages && languesData.languages.length > 0) {
      const contLangues = document.getElementById('cv-langues');
      if (contLangues) {
        contLangues.innerHTML = languesData.languages.map((l) => `
          <li>
            <span class="nom-langue">${echapper(l.nom)}</span>
            <span class="niveau-langue">${echapper(l.niveau)}</span>
          </li>
        `).join('');
      }
    }

    // Expériences
    if (expData && expData.experiences && expData.experiences.length > 0) {
      const contExp = document.getElementById('cv-experiences');
      if (contExp) {
        contExp.innerHTML = expData.experiences.map((exp) => {
          const periode = [exp.dateDebut, exp.dateFin || (exp.statut === 'EN_COURS' ? 'Présent' : '')].filter(Boolean).join(' — ');
          const sousTitre = [exp.entreprise, exp.lieu].filter(Boolean).map(echapper).join(' · ');
          
          let puces = '';
          if (exp.description) {
            const lignes = exp.description.split(/\n|•|- /).map((l) => l.trim()).filter(Boolean);
            if (lignes.length > 1) {
              puces = '<ul class="puces-experience">' + lignes.map((l) => '<li>' + echapper(l) + '</li>').join('') + '</ul>';
            } else {
              puces = '<p class="desc-formation">' + echapper(exp.description) + '</p>';
            }
          }

          return `
            <article class="bloc-experience">
              <div class="ligne-titre-experience">
                <h3 class="poste-experience">${echapper(exp.titre)}</h3>
              </div>
              <p class="contexte-experience">${sousTitre} ${periode ? `<span class="separateur-meta">|</span> <span class="date-experience">${echapper(periode)}</span>` : ''}</p>
              ${puces}
            </article>
          `;
        }).join('');
      }
    }

    // Formations
    if (formData && formData.formations && formData.formations.length > 0) {
      const contForm = document.getElementById('cv-formations');
      if (contForm) {
        contForm.innerHTML = formData.formations.map((f) => `
          <article class="bloc-formation">
            <div class="ligne-titre-formation">
              <h3 class="diplome-formation">${echapper(f.titre)}</h3>
            </div>
            <p class="contexte-formation">${echapper(f.ecole || '')} ${f.periode ? `<span class="separateur-meta">|</span> <span class="date-formation">${echapper(f.periode)}</span>` : ''}</p>
            ${f.description ? `<p class="desc-formation">${echapper(f.description)}</p>` : ''}
          </article>
        `).join('');
      }
    }

    // Projets Notables
    if (projData && projData.projects && projData.projects.length > 0) {
      const contProj = document.getElementById('cv-projets');
      if (contProj) {
        const topProjets = projData.projects.slice(0, 4);
        contProj.innerHTML = topProjets.map((p) => `
          <div class="item-projet-cv">
            <span class="nom-projet-cv">${echapper(p.titre)}</span>
            <p class="desc-projet-cv">${echapper(p.description)}</p>
            ${p.technologies ? `<span class="tech-projet-cv">${echapper(p.technologies)}</span>` : ''}
          </div>
        `).join('');
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();