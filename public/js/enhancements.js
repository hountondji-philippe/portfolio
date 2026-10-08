/* ============================================================
   ENHANCEMENTS.JS — Custom Cursor, Scroll Reveal, Parallax,
   Reading Progress, Magnetic Buttons
   ============================================================ */

(function () {
  'use strict';

  // ===========================
  // READING PROGRESS BAR
  // ===========================
  const progressBar = document.getElementById('readingProgress');
  function updateProgress() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  // ===========================
  // SCROLL REVEAL (IntersectionObserver)
  // ===========================
  const revealEls = document.querySelectorAll('.rv, .rvl, .rvr, .rv-scale, .rv-fade');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealEls.forEach(el => observer.observe(el));
  } else {
    // Fallback
    revealEls.forEach(el => el.classList.add('visible'));
  }

  // ===========================
  // MAGNETIC BUTTONS
  // ===========================
  const magneticBtns = document.querySelectorAll('.btn-magnetic, .btn-p, .btn-s');

  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width  / 2;
      const y = e.clientY - rect.top  - rect.height / 2;
      const strength = 0.25;
      btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // ===========================
  // PARALLAX — HERO
  // ===========================
  function parallaxHero() {
    const sy = window.scrollY;
    const hero = document.getElementById('home');
    if (!hero) return;

    const terminal = hero.querySelector('.tc');
    const badge    = hero.querySelector('.hbadge');
    const heading  = hero.querySelector('.hh');

    const isMobile = window.innerWidth < 768;
    if (terminal && !isMobile) {
      terminal.style.transform = `translateY(${sy * 0.06}px)`;
    } else if (terminal) {
      terminal.style.transform = ''; // Reset on mobile
    }

    if (badge && !isMobile) {
      badge.style.transform = `translateY(${sy * -0.03}px)`;
    } else if (badge) {
      badge.style.transform = ''; // Reset on mobile
    }

    // Fade hero on scroll
    const alpha = Math.max(0, 1 - sy / 600);
    if (heading) heading.style.opacity = alpha + '';
  }

  // ===========================
  // SCROLL HANDLER
  // ===========================
  let lastScroll = 0;
  let rafScroll;

  function onScroll() {
    if (rafScroll) cancelAnimationFrame(rafScroll);
    rafScroll = requestAnimationFrame(() => {
      updateProgress();
      parallaxHero();
      lastScroll = window.scrollY;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  // ===========================
  // ACTIVE NAV LINK
  // ===========================
  const sections = document.querySelectorAll('section[id], div[id]');
  const navLinks = document.querySelectorAll('.nl a');

  function updateActiveNav() {
    const sy = window.scrollY + 100;
    sections.forEach(sec => {
      const top    = sec.offsetTop;
      const height = sec.offsetHeight;
      if (sy >= top && sy < top + height) {
        const id = sec.id;
        navLinks.forEach(a => {
          a.classList.toggle('act', a.getAttribute('href') === '#' + id);
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ===========================
  // STATS COUNTER ANIMATION
  // ===========================
  const statNums = document.querySelectorAll('.sbn[data-count]');
  let statsAnimated = false;

  function animateStats() {
    if (statsAnimated) return;
    const sbar = document.querySelector('.sbar');
    if (!sbar) return;
    const rect = sbar.getBoundingClientRect();
    if (rect.top < window.innerHeight - 50) {
      statsAnimated = true;
      statNums.forEach(el => {
        const target = parseInt(el.dataset.count) || 0;
        const suffix = el.dataset.suf || '';
        const duration = 1200;
        const start = performance.now();
        function step(now) {
          const progress = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.floor(ease * target) + suffix;
          if (progress < 1) requestAnimationFrame(step);
          else el.textContent = target + suffix;
        }
        requestAnimationFrame(step);
      });
    }
  }

  window.addEventListener('scroll', animateStats, { passive: true });
  animateStats(); // try on load too

  // ===========================
  // SMOOTH ANCHOR SCROLLING
  // ===========================
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Close mobile menu if open
        const nmenu = document.getElementById('nmenu');
        const mbn   = document.getElementById('mbn');
        if (nmenu && nmenu.classList.contains('open')) {
          nmenu.classList.remove('open');
          if (mbn) mbn.setAttribute('aria-expanded', 'false');
        }
      }
    });
  });

  // ===========================
  // ACTIVE NAV LINK (reste identique)
  // ===========================
  // ===========================
  document.querySelectorAll('.tp2, .exptg, .pcn-tag').forEach(el => {
    el.addEventListener('click', (e) => {
      const ripple = document.createElement('span');
      const rect = el.getBoundingClientRect();
      ripple.style.cssText = `
        position:absolute;border-radius:50%;
        background:rgba(255,255,255,0.25);
        transform:scale(0);animation:rippleAnim 0.4s ease;
        left:${e.clientX - rect.left}px;top:${e.clientY - rect.top}px;
        width:40px;height:40px;margin:-20px;pointer-events:none;
      `;
      el.style.position = 'relative';
      el.style.overflow = 'hidden';
      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Inject ripple keyframe
  if (!document.getElementById('ripple-style')) {
    const st = document.createElement('style');
    st.id = 'ripple-style';
    st.textContent = `
      @keyframes rippleAnim {
        to { transform: scale(3); opacity: 0; }
      }
      .no-anim *, .no-anim *::before, .no-anim *::after {
        animation-duration: 0.001ms !important;
        transition-duration: 0.001ms !important;
      }
    `;
    document.head.appendChild(st);
  }

})();
