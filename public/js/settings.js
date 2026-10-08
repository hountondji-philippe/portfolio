/* ============================================================
   SETTINGS.JS — Panneau de Personnalisation — PHILIPPE HOUNTONDJI
   Thème par défaut : Violet Cyberpunk (#a855f7)
   ============================================================ */

(function () {
  'use strict';

  // ===== PALETTES DE COULEURS ACCENT =====
  const ACCENT_COLORS = [
    { name: 'Violet Cyberpunk', value: '#a855f7', light: '#c084fc', dark: 'rgba(168,85,247,0.14)', glow: 'rgba(168,85,247,0.24)' },
    { name: 'Cyan Électrique', value: '#00e5ff', light: '#38bdf8', dark: 'rgba(0,229,255,0.14)', glow: 'rgba(0,229,255,0.24)' },
    { name: 'Ocean Blue',      value: '#4285F4', light: '#5a9af5', dark: 'rgba(66,133,244,0.14)', glow: 'rgba(66,133,244,0.24)' },
    { name: 'Émeraude Matrix', value: '#10b981', light: '#34d399', dark: 'rgba(16,185,129,0.14)', glow: 'rgba(16,185,129,0.24)' },
    { name: 'Rose Néon',       value: '#E91E63', light: '#f0387a', dark: 'rgba(233,30,99,0.14)',  glow: 'rgba(233,30,99,0.24)'  },
    { name: 'Ambre Gold',      value: '#FF9800', light: '#ffac33', dark: 'rgba(255,152,0,0.14)',  glow: 'rgba(255,152,0,0.24)'  },
    { name: 'Terre cuite',     value: '#cc785c', light: '#e8956e', dark: 'rgba(204,120,92,0.14)', glow: 'rgba(204,120,92,0.24)' },
    { name: 'Deep Purple',     value: '#673AB7', light: '#9575cd', dark: 'rgba(103,58,183,0.14)', glow: 'rgba(103,58,183,0.24)' },
    { name: 'Teal Pro',        value: '#009688', light: '#4db6ac', dark: 'rgba(0,150,136,0.14)',  glow: 'rgba(0,150,136,0.24)'  },
    { name: 'Bleu Gris',       value: '#607D8B', light: '#90a4ae', dark: 'rgba(96,125,139,0.14)', glow: 'rgba(96,125,139,0.24)' },
  ];

  const DEFAULT_STATE = {
    theme: 'dark',
    accentIndex: 0, // 0 = Violet Cyberpunk
    animations: true,
    fontSize: 100,
    bubbles: false
  };

  const STORAGE_KEY = 'ph-settings';
  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { ...DEFAULT_STATE };

  const fab     = document.getElementById('settingsFab');
  const panel   = document.getElementById('settingsPanel');
  const overlay = document.getElementById('settingsOverlay');

  // Appliquer immédiatement les réglages
  function applySettings(s) {
    const root = document.documentElement;
    const color = ACCENT_COLORS[s.accentIndex] || ACCENT_COLORS[0];

    // Variables de couleur d'accent
    root.style.setProperty('--ac',  color.value);
    root.style.setProperty('--acl', color.light);
    root.style.setProperty('--acd', color.dark);
    root.style.setProperty('--acg', color.glow);

    // Thème clair / sombre / système
    let isDark = true;
    if (s.theme === 'light') isDark = false;
    else if (s.theme === 'system') {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    if (!isDark) {
      root.style.setProperty('--bg',  '#f8fafc');
      root.style.setProperty('--bg1', '#ffffff');
      root.style.setProperty('--bg2', '#f1f5f9');
      root.style.setProperty('--bg3', '#e2e8f0');
      root.style.setProperty('--txt', '#0f172a');
      root.style.setProperty('--txt2','#475569');
      root.style.setProperty('--txt3','#64748b');
      root.style.setProperty('--bdr', 'rgba(15, 23, 42, 0.08)');
      root.style.setProperty('--bdr2','rgba(15, 23, 42, 0.04)');
    } else {
      root.style.setProperty('--bg',  '#0a0a0b');
      root.style.setProperty('--bg1', '#111113');
      root.style.setProperty('--bg2', '#18181c');
      root.style.setProperty('--bg3', '#1e1e24');
      root.style.setProperty('--txt', '#f9f8f5');
      root.style.setProperty('--txt2','#b8b5ad');
      root.style.setProperty('--txt3','#88868e');
      root.style.setProperty('--bdr', 'rgba(255, 255, 255, 0.08)');
      root.style.setProperty('--bdr2','rgba(255, 255, 255, 0.05)');
    }

    // Animations
    document.body.classList.toggle('no-anim', !s.animations);

    // Zoom interface
    const fontSizeRem = (s.fontSize / 100) * 16;
    root.style.setProperty('--font-size', fontSizeRem + 'px');

    updateInPageWidgets(s);
    if (panel && panel.classList.contains('open')) updatePanelUI(s);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  function updateInPageWidgets(s) {
    document.querySelectorAll('[data-theme]').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === s.theme));

    const inpageGrid = document.getElementById('inpage-colors');
    if (inpageGrid) {
      inpageGrid.innerHTML = ACCENT_COLORS.map((c, i) => `
        <button class="sp-color-btn${i === s.accentIndex ? ' active' : ''}" 
                style="background:${c.value}" 
                data-color-index="${i}" 
                title="${c.name}"></button>
      `).join('');

      inpageGrid.querySelectorAll('.sp-color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.colorIndex);
          state.accentIndex = idx;
          applySettings(state);
        });
      });
    }
  }

  function updatePanelUI(s) {
    if (!panel) return;
    panel.querySelectorAll('.sp-theme-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.theme === s.theme));
    panel.querySelectorAll('.sp-color-btn').forEach((btn, i) => btn.classList.toggle('active', i === s.accentIndex));

    const currentColorEl = document.getElementById('sp-current-color');
    if (currentColorEl) currentColorEl.textContent = ACCENT_COLORS[s.accentIndex].name;

    const currentThemeEl = document.getElementById('sp-current-theme');
    if (currentThemeEl) {
      currentThemeEl.textContent = s.theme === 'dark' ? 'Sombre' : s.theme === 'light' ? 'Clair' : 'Automatique';
    }

    const slider = document.getElementById('sp-font-slider');
    if (slider) {
      slider.value = s.fontSize;
      const pct = ((s.fontSize - 70) / (100 - 70)) * 100;
      slider.style.background = `linear-gradient(to right, var(--ac) ${pct}%, var(--bg3) ${pct}%)`;
      const valEl = document.getElementById('sp-font-val');
      if (valEl) valEl.textContent = s.fontSize + '%';
    }

    const animT = document.getElementById('sp-toggle-anim');
    if (animT) animT.checked = s.animations;
  }

  function buildSettingsContent() {
    const colorsHtml = ACCENT_COLORS.map((c, i) => `
      <button class="sp-color-btn${i === state.accentIndex ? ' active' : ''}" style="background:${c.value}" data-color-index="${i}" title="${c.name}"></button>
    `).join('');

    return `
      <div class="sp-header">
        <div class="sp-title"><i class="fas fa-sliders-h"></i> Personnalisation</div>
        <button class="sp-close" id="sp-close-btn" aria-label="Fermer"><i class="fas fa-times"></i></button>
      </div>
      
      <div class="sp-intro">
        <p>Paramètres d'Affichage</p>
        <span>Adaptez l'expérience visuelle du portfolio selon vos préférences — mise à jour instantanée.</span>
      </div>
      
      <div class="sp-body">
        <div class="sp-col">
          <div class="sp-section">
            <div class="sp-section-label">
              <i class="fas fa-palette"></i> Thème
            </div>
            <div class="sp-section-desc">Sombre, clair ou selon votre système</div>
            <div class="sp-theme-row">
              <button class="sp-theme-btn" data-theme="dark">
                <i class="fas fa-moon"></i>
                <span>Sombre</span>
                <small>Mode immersif</small>
              </button>
              <button class="sp-theme-btn" data-theme="light">
                <i class="fas fa-sun"></i>
                <span>Clair</span>
                <small>Haute lisibilité</small>
              </button>
              <button class="sp-theme-btn" data-theme="system">
                <i class="fas fa-desktop"></i>
                <span>Auto</span>
                <small>Système</small>
              </button>
            </div>
            <div class="sp-color-preview">
              <span>Thème actif : <strong id="sp-current-theme">${state.theme === 'dark' ? 'Sombre' : state.theme === 'light' ? 'Clair' : 'Automatique'}</strong></span>
            </div>
          </div>

          <div class="sp-section">
            <div class="sp-section-label">
              <i class="fas fa-paint-brush"></i> Couleur principale (Accent)
            </div>
            <div class="sp-section-desc">Cliquez pour appliquer la palette souhaitée</div>
            <div class="sp-colors-grid">${colorsHtml}</div>
            <div class="sp-color-preview">
              <span>Couleur active : <strong id="sp-current-color">${ACCENT_COLORS[state.accentIndex].name}</strong></span>
            </div>
          </div>

          <div class="sp-section">
            <div class="sp-section-label">
              <i class="fas fa-search-plus"></i> Échelle de l'interface
            </div>
            <div class="sp-section-desc">Ajustez la taille des polices et éléments</div>
            <div class="sp-slider-row">
              <div class="sp-slider-header">
                <span>Taille</span>
                <span class="sp-slider-value" id="sp-font-val">${state.fontSize}%</span>
              </div>
              <input type="range" class="sp-range" id="sp-font-slider" min="70" max="100" step="5" value="${state.fontSize}">
              <div class="sp-slider-labels">
                <span>70%</span>
                <span>85%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div class="sp-section">
            <div class="sp-section-label">
              <i class="fas fa-magic"></i> Fluidité & Animations
            </div>
            <div class="sp-toggle-row">
              <div class="sp-toggle-text">
                <span class="sp-toggle-label">Animations interactives</span>
                <span class="sp-toggle-desc">Transitions, terminaux et reveals</span>
              </div>
              <label class="sp-switch">
                <input type="checkbox" id="sp-toggle-anim" ${state.animations ? 'checked' : ''}>
                <div class="sp-switch-track"></div>
              </label>
            </div>
          </div>

          <button class="sp-reset-btn" id="sp-reset-btn">
            <i class="fas fa-undo"></i>
            <span>Réinitialiser par défaut</span>
            <small>Violet Cyberpunk • Mode sombre</small>
          </button>
        </div>
      </div>
    `;
  }

  function renderPanel() {
    if (!panel) return;
    panel.innerHTML = buildSettingsContent();
    updatePanelUI(state);

    document.getElementById('sp-close-btn')?.addEventListener('click', closePanel);

    panel.querySelectorAll('.sp-theme-btn').forEach(b => {
      b.addEventListener('click', () => {
        state.theme = b.dataset.theme;
        applySettings(state);
      });
    });

    panel.querySelectorAll('.sp-color-btn').forEach((b, i) => {
      b.addEventListener('click', () => {
        state.accentIndex = i;
        applySettings(state);
      });
    });

    const slider = document.getElementById('sp-font-slider');
    if (slider) {
      slider.addEventListener('input', () => {
        state.fontSize = parseInt(slider.value);
        applySettings(state);
      });
    }

    document.getElementById('sp-toggle-anim')?.addEventListener('change', (e) => {
      state.animations = e.target.checked;
      applySettings(state);
    });

    document.getElementById('sp-reset-btn')?.addEventListener('click', () => {
      state = { ...DEFAULT_STATE };
      applySettings(state);
      renderPanel();
    });
  }

  function openPanel() {
    renderPanel();
    panel.classList.add('open');
    overlay.classList.add('open');
    fab.classList.add('open', 'hidden');
    if (window.innerWidth <= 768) document.body.style.overflow = 'hidden';
  }

  function closePanel() {
    panel.classList.remove('open');
    overlay.classList.remove('open');
    fab.classList.remove('open', 'hidden');
    document.body.style.overflow = '';
  }

  if (fab && panel && overlay) {
    fab.addEventListener('click', openPanel);
    overlay.addEventListener('click', closePanel);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
  }

  window.DGSettings = {
    getState: () => state,
    open: openPanel,
    close: closePanel,
    applyFromPage: (s) => {
      state = { ...state, ...s };
      applySettings(state);
      if (panel && panel.classList.contains('open')) renderPanel();
    }
  };

  // Exécution au chargement du DOM
  document.addEventListener('DOMContentLoaded', () => {
    applySettings(state);
  });

  applySettings(state);
})();
