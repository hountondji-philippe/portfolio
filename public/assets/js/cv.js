// assets/js/cv.js
// Gestion de l'affichage dynamique et de l'export PDF direct (html2pdf & impression)

(function () {
  'use strict';

  // ── EXPORT PDF DIRECT (TÉLÉCHARGEMENT DU VRAI FICHIER PDF) ──────────────
  const btnTelechargerPdf = document.getElementById('btn-telecharger-pdf');
  if (btnTelechargerPdf) {
    btnTelechargerPdf.addEventListener('click', () => {
      const feuille = document.getElementById('feuille-cv');
      if (!feuille) return;

      const contenuOriginal = btnTelechargerPdf.innerHTML;
      btnTelechargerPdf.innerHTML = '<iconify-icon icon="mdi:loading"></iconify-icon> <span>Génération...</span>';
      btnTelechargerPdf.disabled = true;

      const opt = {
        margin: 0,
        filename: 'CV_Hountondji_Philippe.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(feuille).save().then(() => {
          btnTelechargerPdf.innerHTML = contenuOriginal;
          btnTelechargerPdf.disabled = false;
        }).catch((err) => {
          console.warn('Fallback téléchargement direct', err);
          window.location.href = 'cv/CV_philippe_hountondji.pdf';
          btnTelechargerPdf.innerHTML = contenuOriginal;
          btnTelechargerPdf.disabled = false;
        });
      } else {
        window.location.href = 'cv/CV_philippe_hountondji.pdf';
        btnTelechargerPdf.innerHTML = contenuOriginal;
        btnTelechargerPdf.disabled = false;
      }
    });
  }

  // ── IMPRESSION A4 DIRECTE ───────────────────────────────────────────────
  const btnImprimer = document.getElementById('btn-imprimer');
  if (btnImprimer) {
    btnImprimer.addEventListener('click', () => {
      window.print();
    });
  }

  if (new URLSearchParams(window.location.search).get('print') === '1') {
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 300);
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

  // ── CHARGEMENT DES DONNÉES DEPUIS L'API SI DISPONIBLE ───────────────────
  async function init() {
    const [settingsData, expData, formData] = await Promise.all([
      recuperer('/api/formations?resource=settings'),
      recuperer('/api/experiences'),
      recuperer('/api/formations'),
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
    }

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