// assets/js/cv.js
// Gestion de l'affichage dynamique et de l'export PDF direct (html2pdf & impression)
// Version corrigee : pagination correcte (plusieurs pages A4 si besoin, sans
// couper un bloc en deux) pour l'affichage, l'impression et le PDF telecharge.

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
  // Avec html2canvas, le CV est capturé comme UNE SEULE image continue, puis
  // découpée en tranches de 297mm. Le cadre gauche (coordonnées, langues,
  // compétences...) étant court, il n'apparaît que sur la tranche 1 — rien à
  // découper pour lui sur la tranche 2. Pour que la page 2 ait aussi son
  // cadre complet, il faut reconstruire une vraie "page 2" dans le DOM, avec
  // une copie du cadre gauche, AVANT que la capture ne soit faite. C'est ce
  // que fait cette fonction : elle répartit les sections (Expériences,
  // Formations, Projets) entre plusieurs pages selon ce qui tient réellement,
  // et duplique le cadre gauche sur chaque page ajoutée.
  function paginerCV(forcerDesktop) {
    // En navigation normale, pas de pagination A4 sur mobile (l'utilisateur
    // voit le CV en défilement continu, adapté à l'écran). Pendant l'export
    // PDF, en revanche, on force la mise en page bureau (voir plus bas) donc
    // ce garde-fou est ignoré : forcerDesktop=true saute cette limite.
    if (!forcerDesktop && window.innerWidth <= 820) return;
    if (document.body.dataset.cvPagine === '1') return; // déjà fait, ne pas dupliquer deux fois

    const enveloppe = document.querySelector('.enveloppe-cv');
    const sidebarOriginal = document.querySelector('.colonne-gauche-cadre');
    const colonneDroite = document.querySelector('.colonne-droite-contenu');
    const bandeau = document.querySelector('.bandeau-bleu-haut');
    if (!enveloppe || !sidebarOriginal || !colonneDroite || !bandeau) return;

    const PX_PAR_MM = 3.7795; // conversion mm -> px CSS (96dpi), identique à ce que le navigateur utilise
    const HAUTEUR_PAGE = 297 * PX_PAR_MM;
    const MARGE_SECURITE = 40; // évite qu'un bloc arrive pile au bord
    const dispoPage1 = HAUTEUR_PAGE - bandeau.offsetHeight - MARGE_SECURITE;
    const dispoPageSuite = HAUTEUR_PAGE - MARGE_SECURITE - 20;

    const blocs = Array.from(colonneDroite.children); // les .bloc-section-droite (Expériences, Formations, Projets)
    const pages = [[]];
    let hauteurCumulee = 0;
    let dispoCourante = dispoPage1;

    blocs.forEach((bloc) => {
      const h = bloc.offsetHeight + 20; // + l'espace entre sections (gap: 20px)
      if (hauteurCumulee + h > dispoCourante && pages[pages.length - 1].length > 0) {
        pages.push([]);
        hauteurCumulee = 0;
        dispoCourante = dispoPageSuite;
      }
      pages[pages.length - 1].push(bloc);
      hauteurCumulee += h;
    });

    document.body.dataset.cvPagine = '1';
    if (pages.length <= 1) return; // tout tient sur une seule page, rien à changer

    // Page 1 : ne garde que ses propres blocs
    const colonneDroitePage1 = document.createElement('div');
    colonneDroitePage1.className = 'colonne-droite-contenu';
    pages[0].forEach((b) => colonneDroitePage1.appendChild(b));
    colonneDroite.replaceWith(colonneDroitePage1);

    // Pages suivantes : copie complète du cadre gauche + suite du contenu
    for (let i = 1; i < pages.length; i++) {
      const feuilleSuite = document.createElement('div');
      feuilleSuite.className = 'feuille-cv feuille-cv-suite';

      const grilleSuite = document.createElement('div');
      grilleSuite.className = 'corps-cv-grid corps-cv-grid-suite';

      const sidebarClone = sidebarOriginal.cloneNode(true);
      sidebarClone.classList.add('colonne-gauche-cadre--suite');
      // Retire les id dupliqués (cv-loc, cv-mail...) pour un HTML valide ;
      // le contenu texte, lui, reste bien copié.
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

    // CORRECTION IMPORTANTE : on force l'apparence "bureau" (deux colonnes,
    // dimensions A4) AVANT de mesurer quoi que ce soit. Sans ça, télécharger
    // depuis un téléphone capturait la mise en page mobile empilée en une
    // seule colonne (celle du @media max-width:820px), ce qui donnait un PDF
    // complètement différent et désordonné (cadre gauche seul sur sa page,
    // sections mal réparties). La classe ci-dessous force les dimensions
    // bureau quel que soit l'appareil utilisé pour télécharger.
    source.classList.add('enveloppe-cv--export');
    paginerCV(true); // pagine avec les dimensions bureau désormais forcées

    const opt = {
      // Marge haut/bas non nulle, identique sur CHAQUE page (y compris les
      // pages 2/3 ajoutées par paginerCV()), pour que rien ne touche le bord
      // du papier. Gauche/droite restent à 0 pour ne pas casser le bandeau
      // bleu qui touche le bord droit sur la page 1.
      margin: [6, 0, 8, 0], // [haut, gauche, bas, droite] en mm
      filename: 'CV_Hountondji_Philippe.pdf',
      // CORRECTION : retour en JPEG mais en qualité maximale (1.0 au lieu de
      // 0.98). Le PNG (essayé juste avant) donne un fichier illisible en
      // taille (30+ Mo) dès qu'une vraie photo est présente, car PNG
      // compresse très mal les photos. JPEG en qualité 1.0 reste net, sans
      // perte visible, pour un poids de fichier raisonnable.
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      // Force un saut de page avant chaque page ajoutée par paginerCV(), et
      // empêche en plus qu'un bloc individuel soit tranché en deux.
      pagebreak: {
        mode: ['css'],
        before: '.feuille-cv-suite',
        avoid: ['.element-cv', '.groupe-section-gauche', '.bloc-section-droite', '.colonne-gauche-cadre']
      }
    };

    if (typeof html2pdf !== 'undefined') {
      html2pdf().set(opt).from(source).toPdf().get('pdf').then((pdf) => {
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
  function formaterUrlAffichage(url) {
    // Retire "https://" et le "/" final pour un affichage propre du lien,
    // dans le même esprit que les liens GitHub/LinkedIn des coordonnées.
    return String(url || '').replace(/^https?:\/\//i, '').replace(/\/$/, '');
  }

  function renderProjets(projets) {
    const cont = document.getElementById('cv-projets');
    if (!cont) return;
    if (!projets || !projets.length) {
      cont.innerHTML = '<p class="etat-vide-cv">Aucun projet renseigné pour le moment.</p>';
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

    // Une fois tout le contenu réel en place, on répartit sur plusieurs
    // pages si besoin. On attend que les polices (Oswald/Inter) soient
    // chargées pour que les hauteurs mesurées soient exactes (sinon le texte
    // peut changer légèrement de taille après coup et fausser le calcul).
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