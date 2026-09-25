
(function () {
  'use strict';

  const LABELS_CATEGORIE = {
    FRONTEND: 'Front-end', BACKEND: 'Back-end', MOBILE: 'Mobile',
    RESEAUX_INFRA: 'Réseaux', MARKETING_DIGITAL: 'Marketing digital',
    DESIGN_CONTENU: 'Design', AUTRE: 'Autre',
  };
  const ORDRE_CATEGORIES = ['FRONTEND', 'BACKEND', 'MOBILE', 'RESEAUX_INFRA', 'MARKETING_DIGITAL', 'DESIGN_CONTENU', 'AUTRE'];
  const LABELS_TYPE_PROJET = { ACADEMIQUE: 'Académique', PROFESSIONNEL: 'Professionnel' };

  // -- EXPORT PDF DIRECT (TELECHARGEMENT DU VRAI FICHIER PDF) --------------
  const btnTelechargerPdf = document.getElementById('btn-telecharger-pdf');

  function declencherTelechargementPdf() {
    const feuille = document.getElementById('feuille-cv');
    if (!feuille || !btnTelechargerPdf) return;

    const contenuOriginal = btnTelechargerPdf.innerHTML;
    btnTelechargerPdf.innerHTML = '<iconify-icon icon="mdi:loading"></iconify-icon> <span>Génération...</span>';
    btnTelechargerPdf.disabled = true;

    const opt = {
      // CORRECTION : marge haut/bas non nulle, identique sur CHAQUE page.
      // Avant (margin: 0), le contenu qui commençait une page 2 ou 3 était
      // collé au bord exact du papier (0mm), ce qui donne un rendu "capture
      // découpée" et risque d'être rogné à l'impression réelle (la plupart
      // des imprimantes ne savent pas imprimer jusqu'au bord). Gauche/droite
      // restent à 0 pour ne pas casser le bandeau bleu qui touche le bord
      // droit sur la page 1 (identité visuelle du template conservée).
      margin: [6, 0, 8, 0], // [haut, gauche, bas, droite] en mm
      filename: 'CV_Hountondji_Philippe.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      // Indique explicitement à html2pdf quels blocs ne doivent jamais être
      // tranchés entre deux pages (sinon découpage au pixel près, sans se
      // soucier de la mise en page).
      pagebreak: {
        mode: ['css', 'legacy'],
        avoid: ['.element-cv', '.groupe-section-gauche', '.bloc-section-droite', '.colonne-gauche-cadre']
      }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(feuille).toPdf().get('pdf').then((pdf) => {
        // CORRECTION : pied de page (nom + numéro de page) sur CHAQUE page
        // du PDF final. C'est ce détail qui distingue un PDF "conçu" d'un
        // simple screenshot découpé en tranches.
        const totalPages = pdf.internal.getNumberOfPages();
        const largeurPage = pdf.internal.pageSize.getWidth();
        const hauteurPage = pdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(100, 116, 139); // gris, cohérent avec --texte-gris
          pdf.text('Hountondji Philippe — CV', 8, hauteurPage - 4);
          pdf.text('Page ' + i + ' / ' + totalPages, largeurPage - 8, hauteurPage - 4, { align: 'right' });
        }
      }).save().then(() => {
        btnTelechargerPdf.innerHTML = contenuOriginal;
        btnTelechargerPdf.disabled = false;
      }).catch((err) => {
        console.warn('Échec html2pdf, repli sur impression navigateur', err);
        window.print();
        btnTelechargerPdf.innerHTML = contenuOriginal;
        btnTelechargerPdf.disabled = false;
      });
    } else {
      window.print();
      btnTelechargerPdf.innerHTML = contenuOriginal;
      btnTelechargerPdf.disabled = false;
    }
  }

  if (btnTelechargerPdf) {
    btnTelechargerPdf.addEventListener('click', declencherTelechargementPdf);
  }

  // -- IMPRESSION A4 DIRECTE ------------------------------------------------
  const btnImprimer = document.getElementById('btn-imprimer');
  if (btnImprimer) {
    btnImprimer.addEventListener('click', () => {
      window.print();
    });
  }

  // -- DECLENCHEURS AUTOMATIQUES VIA PARAMETRE D'URL ------------------------
  // cv.html?print=1    -> ouvre la boîte de dialogue d'impression du navigateur
  // cv.html?download=1 -> lance directement le téléchargement du PDF (html2pdf)
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

  // -- UTILITAIRES ------------------------------------------------------------
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

  // -- RENDU COMPETENCES (groupées par catégorie, remplace le contenu statique) --
  function renderCompetences(skills) {
    const cont = document.getElementById('cv-competences');
    if (!cont || !skills || !skills.length) return; // garde le contenu statique par défaut si rien en base

    const parCategorie = {};
    skills.forEach((s) => {
      if (!parCategorie[s.categorie]) parCategorie[s.categorie] = [];
      parCategorie[s.categorie].push(s.nom);
    });

    cont.innerHTML = ORDRE_CATEGORIES.filter((cat) => parCategorie[cat]).map((cat) =>
      '<p><strong>' + echapper(LABELS_CATEGORIE[cat] || cat) + ' :</strong> ' + parCategorie[cat].map(echapper).join(', ') + '</p>'
    ).join('');
  }

  // -- RENDU LANGUES (remplace le contenu statique) --------------------------
  function renderLangues(langues) {
    const cont = document.getElementById('cv-langues');
    if (!cont || !langues || !langues.length) return;
    cont.innerHTML = langues.map((l) => '<p>' + echapper(l.nom) + ' — ' + echapper(l.niveau) + '</p>').join('');
  }

  // -- RENDU QUALITES / CENTRES D'INTERET (depuis les réglages) -------------
  function renderQualites(qualites) {
    const cont = document.getElementById('cv-qualites');
    if (!cont || !qualites) return;
    const items = qualites.split(',').map((q) => q.trim()).filter(Boolean);
    if (!items.length) return;
    cont.innerHTML = items.map((q) => '<p>' + echapper(q) + '</p>').join('');
  }

  // -- RENDU PROJETS (académiques + professionnels fusionnés, sans distinction de section) --
  function renderProjets(projets) {
    const cont = document.getElementById('cv-projets');
    if (!cont) return;
    if (!projets || !projets.length) {
      cont.innerHTML = '<p class="etat-vide-cv">Aucun projet renseigné pour le moment.</p>';
      return;
    }

    cont.innerHTML = projets.map((p) => {
      const liens = [];
      if (p.lienSite) liens.push('<a href="' + echapper(p.lienSite) + '" target="_blank" rel="noopener">Voir le site</a>');
      if (p.lienGithub) liens.push('<a href="' + echapper(p.lienGithub) + '" target="_blank" rel="noopener">GitHub</a>');

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

  // -- CHARGEMENT DES DONNEES DEPUIS L'API SI DISPONIBLE ---------------------
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

    // Expériences dynamiques (si la base renvoie des données)
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

    // Formations dynamiques
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