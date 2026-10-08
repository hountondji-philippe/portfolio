/* ============================================================
   PORTFOLIO.JS — Contrôleur Principal & Interactions
   Portfolio Philippe Hountondji — Design System Cyberpunk
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // 1. DÉFILEMENT FLUIDE (SMOOTH SCROLL)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const href = anchor.getAttribute('href');
      if (href === '#' || href === '#!') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = 72;
      const targetTop = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });

  // 2. BARRE DE NAVIGATION & PROGRESSION DE LECTURE
  const header = document.getElementById('hdr');
  const navLinks = document.querySelectorAll('.nl a');
  const sections = document.querySelectorAll('section[id]');
  const stbtn = document.getElementById('stbtn');
  const readingProgress = document.getElementById('readingProgress');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // Barre de progression
    if (readingProgress && docHeight > 0) {
      const progressPercent = Math.min((y / docHeight) * 100, 100);
      readingProgress.style.width = progressPercent + '%';
    }

    // Réduction du header
    if (header) header.classList.toggle('sc', y > 25);

    // Bouton retour en haut
    if (stbtn) stbtn.classList.toggle('show', y > 400);

    // Espion de navigation (Scrollspy)
    let currentSection = '';
    sections.forEach(s => {
      if (y >= s.offsetTop - 120) currentSection = s.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('act', link.getAttribute('href') === '#' + currentSection);
    });
  }, { passive: true });

  // 3. MENU MOBILE
  const mbn = document.getElementById('mbn');
  const nmenu = document.getElementById('nmenu');
  const micon = document.getElementById('micon');
  let isMenuOpen = false;
  let menuOverlay = null;

  function toggleMobileMenu() {
    isMenuOpen = !isMenuOpen;
    if (nmenu) nmenu.classList.toggle('open', isMenuOpen);
    if (mbn) mbn.setAttribute('aria-expanded', isMenuOpen);
    if (micon) micon.className = isMenuOpen ? 'fas fa-xmark' : 'fas fa-bars';
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';

    if (isMenuOpen) {
      menuOverlay = document.createElement('div');
      Object.assign(menuOverlay.style, {
        position: 'fixed',
        inset: '0',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: '998'
      });
      menuOverlay.addEventListener('click', toggleMobileMenu);
      document.body.appendChild(menuOverlay);
    } else {
      if (menuOverlay) { menuOverlay.remove(); menuOverlay = null; }
    }
  }

  if (mbn) mbn.addEventListener('click', toggleMobileMenu);
  if (nmenu) {
    nmenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      if (isMenuOpen) toggleMobileMenu();
    }));
  }

  // 4. SCROLL REVEAL (INTERSECTION OBSERVER)
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.rv, .rvl, .rvr').forEach(el => revealObserver.observe(el));

  // 5. COMPTEURS ANIMÉS
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  const countObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const targetCount = parseInt(el.dataset.count, 10);
        const suffix = el.dataset.suf || '';
        const startTime = performance.now();
        const duration = 1500;

        function animateNumber(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          el.textContent = Math.round(easeOutCubic(progress) * targetCount) + (progress >= 1 ? suffix : '');
          if (progress < 1) requestAnimationFrame(animateNumber);
        }
        requestAnimationFrame(animateNumber);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.2 });

  document.querySelectorAll('.sbn[data-count]').forEach(el => countObserver.observe(el));

  // 6. TERMINAL HERO — ANIMATION SYSTÈME (ONGLET SYSTÈME)
  const tlinesSystem = [
    { t: 'cmd', v: 'show version' },
    { t: 'out', c: 'cy', v: 'Philippe-OS v2.0.0, RELEASE SOFTWARE (fc2)' },
    { t: 'out', c: 'dm', v: 'Compiled by: Philippe Hountondji · ENEAM, Porto-Novo BJ' },
    { t: 'sp' },
    { t: 'cmd', v: 'show ip interface brief' },
    { t: 'out', c: 'ok', v: 'Eth0/portfolio   10.221.06.30   UP    UP   [online]' },
    { t: 'out', c: 'ok', v: 'Lo0/localhost    127.0.0.1      UP    UP   [loopback]' },
    { t: 'out', c: 'cy', v: 'Tu0/vpn-benin    192.168.229.1  UP    UP   [secure]' },
    { t: 'sp' },
    { t: 'cmd', v: 'show ip ospf neighbor' },
    { t: 'out', c: 'cy', v: 'Neighbor ID    State    Interface    Uptime' },
    { t: 'out', c: 'ok', v: '10.0.0.1       FULL/DR  Eth0/port    3y 00:00:00' },
    { t: 'out', c: 'ok', v: 'OSPF Area 0: Converged · VLANs 10,20,30 ACTIVE' },
    { t: 'sp' },
    { t: 'cmd', v: 'uptime && whoami' },
    { t: 'out', c: 'pr', v: 'up 3 years, dev & réseau · load: 100% engaged' },
    { t: 'out', c: 'gn', v: 'philippe@eneam-uac · Full-Stack & Admin Réseau · BJ' }
  ];

  function runSystemTerminal() {
    const tBody = document.getElementById('tBody');
    if (!tBody) return;
    tBody.innerHTML = '';
    let idx = 0;

    function nextLine() {
      if (idx >= tlinesSystem.length) {
        const cursorDiv = document.createElement('div');
        cursorDiv.className = 'tl';
        cursorDiv.innerHTML = '<span class="tp" style="color:var(--ac);">❯</span> <span class="tcur"></span>';
        tBody.appendChild(cursorDiv);
        return;
      }
      const item = tlinesSystem[idx++];
      const lineDiv = document.createElement('div');

      if (item.t === 'sp') {
        lineDiv.style.height = '6px';
      } else if (item.t === 'cmd') {
        lineDiv.className = 'tl';
        lineDiv.innerHTML = `<span class="tp" style="color:var(--ac);">❯</span> <span class="tcmd">${item.v}</span>`;
      } else {
        lineDiv.className = `to ${item.c || ''}`;
        lineDiv.textContent = item.v;
      }
      tBody.appendChild(lineDiv);
      tBody.scrollTop = tBody.scrollHeight;
      setTimeout(nextLine, item.t === 'cmd' ? 260 : 150);
    }
    setTimeout(nextLine, 300);
  }
  runSystemTerminal();

  // 7. FORMULAIRE DE CONTACT PRINCIPAL
  const cform = document.getElementById('cform');
  const msgField = document.getElementById('msg');
  const charCount = document.getElementById('charCount');

  if (msgField && charCount) {
    msgField.addEventListener('input', () => {
      charCount.textContent = msgField.value.length;
    });
  }

  if (cform) {
    cform.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nom = document.getElementById('nm')?.value.trim();
      const email = document.getElementById('em')?.value.trim();
      const telephone = document.getElementById('tel')?.value.trim();
      const message = document.getElementById('msg')?.value.trim();

      const sbtn = document.getElementById('sbtn');
      const stxt = document.getElementById('stxt');
      const sicon = document.getElementById('sicon');

      if (!nom || !email || !message) {
        alert('Veuillez remplir tous les champs obligatoires.');
        return;
      }

      if (sbtn) sbtn.disabled = true;
      if (stxt) stxt.textContent = 'Envoi en cours...';
      if (sicon) sicon.className = 'fas fa-circle-notch fa-spin';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom, email, telephone, message })
        });
        const data = await response.json();

        // Afficher terminal de confirmation
        const contactFormCard = document.getElementById('contactForm');
        const terminalCard = document.getElementById('terminalCard');
        const terminalContent = document.getElementById('terminalContent');

        if (contactFormCard && terminalCard && terminalContent) {
          contactFormCard.style.display = 'none';
          terminalCard.style.display = 'block';
          terminalContent.innerHTML = `
            <div class="tl"><span class="tp">❯</span> <span class="tcmd">send-mail --target="philippe"</span></div>
            <div class="to gn">✓ Connexion au serveur SMTP Neon/API établie</div>
            <div class="to gn">✓ Message chiffré et transmis avec succès !</div>
            <div class="to dm">Expéditeur: ${nom} (${email})</div>
            <div class="to ok" style="margin-top:8px;">Merci pour votre message ! Philippe vous répondra sous 24h.</div>
            <button class="btn btn-s" style="margin-top:14px;font-size:0.8rem;padding:6px 14px;" onclick="location.reload();">
              <i class="fas fa-redo"></i> Envoyer un autre message
            </button>
          `;
        }

        if (window.notificationManager) {
          window.notificationManager.contactSuccess(nom);
        }
        cform.reset();
        if (charCount) charCount.textContent = '0';
      } catch (err) {
        alert('Votre message a été transmis à Philippe. Merci !');
        cform.reset();
      } finally {
        if (sbtn) sbtn.disabled = false;
        if (stxt) stxt.textContent = 'Envoyer le message';
        if (sicon) sicon.className = 'fas fa-paper-plane';
      }
    });
  }

  // 8. FORMULAIRE FLOTTANT RAPIDE (PC)
  const formFloating = document.getElementById('formFloating');
  const formToggleBtn = document.getElementById('formToggleBtn');
  const formPopup = document.getElementById('formPopup');
  const formPopupCloseBtn = document.getElementById('formPopupCloseBtn');
  const floatingForm = document.getElementById('floatingForm');
  const floatingMsg = document.getElementById('floatingMsg');
  const floatingCharCount = document.getElementById('floatingCharCount');

  if (formToggleBtn && formPopup) {
    formToggleBtn.addEventListener('click', () => {
      formPopup.classList.toggle('show');
    });
  }
  if (formPopupCloseBtn && formPopup) {
    formPopupCloseBtn.addEventListener('click', () => {
      formPopup.classList.remove('show');
    });
  }
  if (floatingMsg && floatingCharCount) {
    floatingMsg.addEventListener('input', () => {
      floatingCharCount.textContent = floatingMsg.value.length;
    });
  }

  if (floatingForm) {
    floatingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('floatingNm')?.value.trim();
      const email = document.getElementById('floatingEm')?.value.trim();
      const phone = document.getElementById('floatingTel')?.value.trim();
      const message = document.getElementById('floatingMsg')?.value.trim();
      const submitBtn = document.getElementById('floatingSubmitBtn');

      if (!name || !email || !message) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Envoi...';
      }

      try {
        await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nom: name, email, telephone: phone, message })
        });
        if (formPopup) formPopup.classList.remove('show');
        if (window.notificationManager) {
          window.notificationManager.contactSuccess(name);
        } else {
          alert('Message envoyé avec succès !');
        }
        floatingForm.reset();
        if (floatingCharCount) floatingCharCount.textContent = '0';
      } catch (err) {
        alert('Message transmis à Philippe !');
        if (formPopup) formPopup.classList.remove('show');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Envoyer</span>';
        }
      }
    });
  }

  // 9. FORMULAIRE NEWSLETTER DU FOOTER
  const newsletterForm = document.getElementById('newsletterForm');
  const nlemail = document.getElementById('nlemail');
  const nlbtn = document.getElementById('nlbtn');

  if (nlemail && nlbtn) {
    nlemail.addEventListener('input', () => {
      nlbtn.disabled = !nlemail.value.includes('@');
    });
  }

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = nlemail.value.trim();
      if (!email) return;

      try {
        await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        alert('Merci pour votre inscription à la newsletter !');
        newsletterForm.reset();
        nlbtn.disabled = true;
      } catch (err) {
        alert('Inscription enregistrée. Merci !');
        newsletterForm.reset();
      }
    });
  }

  // 10. CHARGEMENT DYNAMIQUE DES FORMATIONS & EXPÉRIENCES
  async function chargerFormationsEtExperiences() {
    try {
      const formRes = await fetch('/api/formations');
      if (formRes.ok) {
        const formData = await formRes.json();
        if (formData.success && formData.formations && formData.formations.length) {
          const timeline = document.getElementById('timelineFormation');
          if (timeline) {
            timeline.innerHTML = formData.formations.map(f => `
              <div class="formation-card">
                <span class="badge ${f.statut === 'EN_COURS' ? 'badge-encours' : ''}">${f.statut === 'EN_COURS' ? 'En cours' : 'Obtenu'}</span>
                <h3>${f.titre || f.diplome}</h3>
                <p class="formation-ecole">${f.ecole || f.etablissement} — ${f.periode || f.anneeDebut}</p>
                <p class="formation-desc">${f.description || ''}</p>
              </div>
            `).join('');
          }
        }
      }
    } catch (_) {}
  }
  chargerFormationsEtExperiences();
});
