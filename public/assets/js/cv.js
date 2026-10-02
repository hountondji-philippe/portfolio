(function () {
  'use strict';

  const LABELS_CATEGORIE = {
    FRONTEND: 'Front-end', BACKEND: 'Back-end', MOBILE: 'Mobile',
    RESEAUX_INFRA: 'Réseaux', MARKETING_DIGITAL: 'Marketing digital',
    DESIGN_CONTENU: 'Design', AUTRE: 'Autre',
  };
  const ORDRE_CATEGORIES = ['FRONTEND', 'BACKEND', 'MOBILE', 'RESEAUX_INFRA', 'MARKETING_DIGITAL', 'DESIGN_CONTENU', 'AUTRE'];
  const LABELS_TYPE_PROJET = { ACADEMIQUE: 'Académique', PROFESSIONNEL: 'Professionnel' };

  const btnTelechargerPdf = document.getElementById('btn-telecharger-pdf');

  function declencherTelechargementPdf() {
    const source = document.getElementById('cv-document');
    if (!source || !btnTelechargerPdf) return;

    const contenuOriginal = btnTelechargerPdf.innerHTML;
    btnTelechargerPdf.innerHTML = '<iconify-icon icon="mdi:loading"></iconify-icon> <span>Génération du PDF...</span>';
    btnTelechargerPdf.disabled = true;

    source.classList.add('enveloppe-cv--export');

    const opt = {
      margin: 0,
      filename: 'CV_Philippe_Hountondji.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        windowWidth: 1024
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], before: '.feuille-cv-page2' }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(source).save().then(() => {
        source.classList.remove('enveloppe-cv--export');
        btnTelechargerPdf.innerHTML = contenuOriginal;
        btnTelechargerPdf.disabled = false;
      }).catch(() => {
        source.classList.remove('enveloppe-cv--export');
        window.print();
        btnTelechargerPdf.innerHTML = contenuOriginal;
        btnTelechargerPdf.disabled = false;
      });
    } else {
      source.classList.remove('enveloppe-cv--export');
      window.print();
      btnTelechargerPdf.innerHTML = contenuOriginal;
      btnTelechargerPdf.disabled = false;
    }
  }

  if (btnTelechargerPdf) {
    btnTelechargerPdf.addEventListener('click', declencherTelechargementPdf);
  }

  const btnImprimer = document.getElementById('btn-imprimer');
  if (btnImprimer) {
    btnImprimer.addEventListener('click', () => {
      window.print();
    });
  }

  const paramsUrl = new URLSearchParams(window.location.search);
  if (paramsUrl.get('print') === '1') {
    window.addEventListener('load', () => setTimeout(() => window.print(), 300));
  }
  if (paramsUrl.get('download') === '1') {
    window.addEventListener('load', () => setTimeout(declencherTelechargementPdf, 500));
  }

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

  function renderCompetences(skills) {
    const cont = document.getElementById('cv-competences');
    if (!cont || !skills || !skills.length) return;

    const parCategorie = {};
    skills.forEach((s) => {
      if (!parCategorie[s.categorie]) parCategorie[s.categorie] = [];
      parCategorie[s.categorie].push(s.nom);
    });

    cont.innerHTML = ORDRE_CATEGORIES.filter((cat) => parCategorie[cat]).map((cat) =>
      '<p><strong>' + echapper(LABELS_CATEGORIE[cat] || cat) + ' :</strong> ' + parCategorie[cat].map(echapper).join(', ') + '</p>'
    ).join('');
  }

  function renderLangues(langues) {
    const cont = document.getElementById('cv-langues');
    if (!cont || !langues || !langues.length) return;
    cont.innerHTML = langues.map((l) => '<p>' + echapper(l.nom) + ' — ' + echapper(l.niveau) + '</p>').join('');
  }

  function renderQualites(qualites) {
    const cont = document.getElementById('cv-qualites');
    if (!cont || !qualites) return;
    const items = qualites.split(',').map((q) => q.trim()).filter(Boolean);
    if (!items.length) return;
    cont.innerHTML = items.map((q) => '<p>' + echapper(q) + '</p>').join('');
  }

  function renderProjets(projets) {
    const cont = document.getElementById('cv-projets-grille');
    if (!cont) return;
    if (!projets || !projets.length) return;

    cont.innerHTML = projets.map((p) => {
      const liens = [];
      if (p.lienSite) liens.push('<a href="' + echapper(p.lienSite) + '" target="_blank" rel="noopener">Démo</a>');
      if (p.lienGithub) liens.push('<a href="' + echapper(p.lienGithub) + '" target="_blank" rel="noopener">GitHub</a>');

      return '<article class="carte-projet-cv">' +
        '<div class="titre-projet-cv">' +
        '<span>' + echapper(p.titre) + '</span>' +
        '<span class="badge-type-projet">' + echapper(LABELS_TYPE_PROJET[p.type] || p.type) + '</span>' +
        '</div>' +
        (p.technologies ? '<div class="techs-projet-cv">' + echapper(p.technologies) + '</div>' : '') +
        '<p class="desc-projet-cv">' + echapper(p.description) + '</p>' +
        (liens.length ? '<div class="liens-projet-cv">' + liens.join('') + '</div>' : '') +
        '</article>';
    }).join('');
  }

  async function init() {
    const [settingsData, expData, formData, skillsData, languesData, projetsData] = await Promise.all([
      recuperer('/api/formations?resource=settings'),
      recuperer('/api/experiences'),
      recuperer('/api/formations'),
      recuperer('/api/skills'),
      recuperer('/api/formations?resource=languages'),
      recuperer('/api/projects'),
    ]);

    if (settingsData && settingsData.settings) {
      const s = settingsData.settings;
      if (s.titrePro) {
        const el = document.getElementById('cv-titre-pro');
        if (el) el.textContent = s.titrePro;
      }
      if (s.photoUrl) {
        const img = document.getElementById('cv-photo');
        if (img) img.src = s.photoUrl;
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
      renderQualites(s.qualites);
    }

    if (skillsData && skillsData.skills) renderCompetences(skillsData.skills);
    if (languesData && languesData.languages) renderLangues(languesData.languages);
    if (projetsData && projetsData.projects) renderProjets(projetsData.projects);

    if (expData && expData.experiences && expData.experiences.length > 0) {
      const contExp = document.getElementById('cv-experiences');
      if (contExp) {
        contExp.innerHTML = expData.experiences.map((exp) => {
          const periode = [exp.dateDebut, exp.dateFin || (exp.statut === 'EN_COURS' ? 'Présent' : '')].filter(Boolean).join(' — ');
          const sousTitre = [exp.entreprise, exp.lieu].filter(Boolean).map(echapper).join(', ');

          let puces = '';
          if (exp.description) {
            const lignes = exp.description.split(/\n|•|- /).map((l) => l.trim()).filter(Boolean);
            if (lignes.length > 1) {
              puces = '<ul class="puces-cv">' + lignes.map((l) => '<li>' + echapper(l) + '</li>').join('') + '</ul>';
            } else {
              puces = '<p class="desc-simple">' + echapper(exp.description) + '</p>';
            }
          }

          return `
            <article class="element-cv">
              <h3 class="poste-titre">${echapper(exp.titre)}</h3>
              <p class="contexte-ligne">${sousTitre} ${periode ? `| ${echapper(periode)}` : ''}</p>
              ${puces}
            </article>
          `;
        }).join('');
      }
    }

    if (formData && formData.formations && formData.formations.length > 0) {
      const contForm = document.getElementById('cv-formations');
      if (contForm) {
        contForm.innerHTML = formData.formations.map((f) => `
          <article class="element-cv">
            <h3 class="poste-titre">${echapper(f.titre)}</h3>
            <p class="contexte-ligne">${echapper(f.ecole || '')} ${f.periode ? `| ${echapper(f.periode)}` : ''}</p>
            ${f.description ? `<p class="desc-simple">${echapper(f.description)}</p>` : ''}
          </article>
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
