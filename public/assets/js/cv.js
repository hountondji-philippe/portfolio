
(function () {
  'use strict';

  const LABELS_CATEGORIE = {
    FRONTEND: 'Front-end', BACKEND: 'Back-end', MOBILE: 'Mobile',
    RESEAUX_INFRA: 'Réseaux', MARKETING_DIGITAL: 'Marketing digital',
    DESIGN_CONTENU: 'Design', AUTRE: 'Autre',
  };
  const ORDRE_CATEGORIES = ['FRONTEND', 'BACKEND', 'MOBILE', 'RESEAUX_INFRA', 'MARKETING_DIGITAL', 'DESIGN_CONTENU', 'AUTRE'];
  const LABELS_TYPE_PROJET = { ACADEMIQUE: 'Académique', PROFESSIONNEL: 'Professionnel' };

  // -- PAGINATION MANUELLE (répète le cadre gauche sur chaque page si besoin) --
  function reinitialiserPagination() {
    const colonneDroitePrincipale = document.querySelector('.corps-cv-grid:not(.corps-cv-grid-suite) .colonne-droite-contenu');
    document.querySelectorAll('.feuille-cv-suite').forEach((page) => {
      const colonneSuite = page.querySelector('.colonne-droite-contenu');
      if (colonneSuite && colonneDroitePrincipale) {
        Array.from(colonneSuite.children).forEach((bloc) => colonneDroitePrincipale.appendChild(bloc));
      }
      page.remove();
    });
    delete document.body.dataset.cvPagine;
  }

  function paginerCV(forcerDesktop) {
    if (!forcerDesktop && window.innerWidth <= 820) return;
    reinitialiserPagination();

    const enveloppe = document.querySelector('.enveloppe-cv');
    const sidebarOriginal = document.querySelector('.colonne-gauche-cadre');
    const colonneDroite = document.querySelector('.colonne-droite-contenu');
    const bandeau = document.querySelector('.bandeau-bleu-haut');
    if (!enveloppe || !sidebarOriginal || !colonneDroite || !bandeau) return;

    const PX_PAR_MM = 3.7795;
    const HAUTEUR_PAGE = 297 * PX_PAR_MM;
    const MARGE_SECURITE = 40;
    const dispoPage1 = HAUTEUR_PAGE - bandeau.offsetHeight - MARGE_SECURITE;
    const dispoPageSuite = HAUTEUR_PAGE - MARGE_SECURITE - 20;

    const blocs = Array.from(colonneDroite.children);
    const pages = [[]];
    let hauteurCumulee = 0;
    let dispoCourante = dispoPage1;

    blocs.forEach((bloc) => {
      const h = bloc.offsetHeight + 20;
      if (hauteurCumulee + h > dispoCourante && pages[pages.length - 1].length > 0) {
        pages.push([]);
        hauteurCumulee = 0;
        dispoCourante = dispoPageSuite;
      }
      pages[pages.length - 1].push(bloc);
      hauteurCumulee += h;
    });

    document.body.dataset.cvPagine = '1';
    if (pages.length <= 1) return;

    const colonneDroitePage1 = document.createElement('div');
    colonneDroitePage1.className = 'colonne-droite-contenu';
    pages[0].forEach((b) => colonneDroitePage1.appendChild(b));
    colonneDroite.replaceWith(colonneDroitePage1);

    for (let i = 1; i < pages.length; i++) {
      const feuilleSuite = document.createElement('div');
      feuilleSuite.className = 'feuille-cv feuille-cv-suite';

      const grilleSuite = document.createElement('div');
      grilleSuite.className = 'corps-cv-grid corps-cv-grid-suite';

      const sidebarClone = sidebarOriginal.cloneNode(true);
      sidebarClone.classList.add('colonne-gauche-cadre--suite');
      sidebarClone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));

      const colonneDroiteSuite = document.createElement('div');
      colonneDroiteSuite.className = 'colonne-droite-contenu';
      pages[i].forEach((b) => colonneDroiteSuite.appendChild(b));

      grilleSuite.appendChild(sidebarClone);
      grilleSuite.appendChild(colonneDroiteSuite);
      feuilleSuite.appendChild(grilleSuite);
      enveloppe.appendChild(feuilleSuite);
    }
  }

  // -- EXPORT PDF DIRECT (TELECHARGEMENT DU VRAI FICHIER PDF) --------------
  const btnTelechargerPdf = document.getElementById('btn-telecharger-pdf');

  function declencherTelechargementPdf() {
    const source = document.querySelector('.enveloppe-cv');
    if (!source || !btnTelechargerPdf) return;

    const contenuOriginal = btnTelechargerPdf.innerHTML;
    btnTelechargerPdf.innerHTML = '<iconify-icon icon="mdi:loading"></iconify-icon> <span>Génération...</span>';
    btnTelechargerPdf.disabled = true;

    source.classList.add('enveloppe-cv--export');
    paginerCV(true);

    const opt = {
      margin: [6, 0, 8, 0],
      filename: 'CV_Hountondji_Philippe.pdf',
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['css'],
        before: '.feuille-cv-suite',
        avoid: ['.element-cv', '.groupe-section-gauche', '.bloc-section-droite', '.colonne-gauche-cadre']
      }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(source).toPdf().get('pdf').then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const largeurPage = pdf.internal.pageSize.getWidth();
        const hauteurPage = pdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139);
          pdf.text('Hountondji Philippe — CV', 8, hauteurPage - 4);
          pdf.text('Page ' + i + ' / ' + totalPages, largeurPage - 8, hauteurPage - 4, { align: 'right' });
        }
      }).save().then(() => {
        source.classList.remove('enveloppe-cv--export');
        btnTelechargerPdf.innerHTML = contenuOriginal;
        btnTelechargerPdf.disabled = false;
      }).catch((err) => {
        console.warn('Échec html2pdf, repli sur impression navigateur', err);
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
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 300);
    });
  }
  if (paramsUrl.get('download') === '1') {
    window.addEventListener('load', () => {
      setTimeout(declencherTelechargementPdf, 500);
    });
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

  function formaterUrlAffichage(url) {
    return String(url || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  function renderProjets(projets) {
    const cont = document.getElementById('cv-projets');
    if (!cont) return;
    if (!projets || !projets.length) {
      // Conserver le contenu riche existant dans le HTML
      return;
    }

    cont.innerHTML = projets.map((p) => {
      const liens = [];
      if (p.lienSite) liens.push('<a href="' + echapper(p.lienSite) + '" target="_blank" rel="noopener">' + echapper(formaterUrlAffichage(p.lienSite)) + '</a>');
      if (p.lienGithub) liens.push('<a href="' + echapper(p.lienGithub) + '" target="_blank" rel="noopener">' + echapper(formaterUrlAffichage(p.lienGithub)) + '</a>');

      return '<article class="element-cv">' +
        '<h3 class="poste-titre">' + echapper(p.titre) +
        '<span class="badge-type-projet">' + echapper(LABELS_TYPE_PROJET[p.type] || p.type) + '</span>' +
        '</h3>' +
        (p.technologies ? '<p class="contexte-ligne">' + echapper(p.technologies) + '</p>' : '') +
        '<p class="desc-simple">' + echapper(p.description) + '</p>' +
        (liens.length ? '<p class="liens-projet">' + liens.join('') + '</p>' : '') +
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
    renderProjets(projetsData && projetsData.projects);

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

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => requestAnimationFrame(paginerCV));
    } else {
      setTimeout(paginerCV, 300);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
