(() => {
  // Bloquer drag & context menu sur images
  document.addEventListener('dragstart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
})();

// Clé InputDev chiffrée et déchiffrement ROT13
function _dk() {
  return 'težf_klpumzcsk8amshcyreqd7sp7gsmh'.replace(/[a-zA-Z]/g, c => {
    const code = c.charCodeAt(0) + 13;
    return String.fromCharCode(
      (c <= 'Z' ? 90 : 122) >= code ? code : code - 26
    );
  });
}

// Variables DOM
const header = document.querySelector('header');
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const navLinksItems = document.querySelectorAll('.nav-links a');
const backToTop = document.querySelector('.back-to-top');
const contactForm = document.getElementById('contactForm');

// Menu hamburger
if (hamburger && navLinks) {
  hamburger.addEventListener('click', e => {
    e.preventDefault();
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
}

navLinksItems.forEach(link => {
  link.addEventListener('click', () => {
    if (hamburger) hamburger.classList.remove('active');
    if (navLinks) navLinks.classList.remove('active');
  });
});

// Back-to-top et header scroll
window.addEventListener('scroll', () => {
  const scrollY = window.pageYOffset;
  if (header) header.classList.toggle('scrolled', scrollY > 100);
  if (backToTop) backToTop.classList.toggle('visible', scrollY > 300);
});
if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Sections scroll spy
const sections = document.querySelectorAll('section[id]');
function escapeSel(str) { return str.replace(/([^\w-])/g, '\\$1'); }
function activateNavLink() {
  const scrollY = window.pageYOffset;
  sections.forEach(section => {
    const top = section.offsetTop - 100;
    const id = section.getAttribute('id');
    const lnk = document.querySelector(`.nav-links a[href="#${escapeSel(id)}"]`);
    if (scrollY > top && scrollY <= top + section.offsetHeight) {
      navLinksItems.forEach(i => i.classList.remove('active'));
      if (lnk) lnk.classList.add('active');
    }
  });
}
window.addEventListener('scroll', activateNavLink);

// Intersection Observer animations
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      requestAnimationFrame(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      });
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.01, rootMargin: '0px 0px -50px' });

document.querySelectorAll('.skill-category, .projet-card, .stat, .contact-method').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(5px)';
  el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
  observer.observe(el);
});

// Fonction sanitize
function sanitizeInput(input, maxLen = 2000) {
  let raw = String(input).trim().slice(0, maxLen * 2);
  const div = document.createElement('div');
  div.textContent = raw;
  return div.textContent.slice(0, maxLen);
}

// Validation email
function isValidEmail(email) {
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email)
    && email.length <= 254
    && !email.includes('..');
}

// Notifications
function showNotification(message, type = 'info') {
  const allowed = { success: true, error: true, info: true };
  type = allowed[type] ? type : 'info';

  const box = document.createElement('div');
  box.className = 'notification notification-' + type;

  const icon = document.createElement('i');
  icon.className = 'fas ' + (type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle');

  const txt = document.createElement('span');
  txt.textContent = String(message).slice(0, 200);

  box.appendChild(icon);
  box.appendChild(txt);
  document.body.appendChild(box);

  setTimeout(() => box.classList.add('show'), 10);
  setTimeout(() => { box.classList.remove('show'); setTimeout(() => box.remove(), 300); }, 5000);
}

// Formulaire contact sécurisé
if (contactForm) {
  // Honeypot anti-bot
  const honeypot = document.createElement('input');
  honeypot.type = 'text';
  honeypot.name = 'website';
  honeypot.style.cssText = 'position:absolute;left:-9999px;opacity:0;height:0;width:0;';
  honeypot.tabIndex = -1;
  honeypot.autocomplete = 'off';
  honeypot.setAttribute('aria-hidden', 'true');
  contactForm.appendChild(honeypot);

  let inputDevSDK = null;
  function getSDK() {
    if (inputDevSDK) return inputDevSDK;
    if (typeof InputDevSDK !== 'undefined') {
      inputDevSDK = new InputDevSDK();
      return inputDevSDK;
    }
    return null;
  }

  // Rate limiting (stocké en sessionStorage)
  function getSubmitData() { try { return JSON.parse(sessionStorage.getItem('_sf') || '{}'); } catch(e){ return {}; } }
  function setSubmitData(data) { try { sessionStorage.setItem('_sf', JSON.stringify(data)); } catch(e){} }
  function isRateLimited() {
    const data = getSubmitData();
    const now = Date.now();
    const count = data.count || 0;
    const lockUntil = data.lockUntil || 0;

    if (now < lockUntil) {
      showNotification('Trop de tentatives. Réessayez plus tard.', 'error');
      return true;
    }
    if (now - (data.firstAt || 0) > 10*60*1000) {
      setSubmitData({ count:0, firstAt: now });
      return false;
    }
    if (count >= 3) {
      setSubmitData({ count, firstAt: data.firstAt, lockUntil: now + 120000 });
      showNotification('Limite atteinte. Réessayez dans 2 minutes.', 'error');
      return true;
    }
    return false;
  }
  function incrementSubmitCount() {
    const data = getSubmitData();
    const now = Date.now();
    setSubmitData({
      count: (data.count || 0) + 1,
      firstAt: data.firstAt || now,
      lockUntil: data.lockUntil || 0
    });
  }

  // Soumission formulaire
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    if (honeypot.value) return;
    if (isRateLimited()) return;

    const name = sanitizeInput(document.getElementById('name').value, 100);
    const email = sanitizeInput(document.getElementById('email').value, 254);
    const message = sanitizeInput(document.getElementById('message').value, 2000);

    let hasError = false;
    if (name.length < 2) { showNotification('Le nom doit contenir au moins 2 caractères.', 'error'); hasError = true; }
    if (!isValidEmail(email)) { showNotification('Email invalide.', 'error'); hasError = true; }
    if (message.length < 10) { showNotification('Le message doit contenir au moins 10 caractères.', 'error'); hasError = true; }
    if (hasError) return;

    const submitBtn = contactForm.querySelector('.btn-submit');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours…';

    const sdk = getSDK();
    const key = _dk();

    function onSuccess() {
      incrementSubmitCount();
      showNotification('Message envoyé !', 'success');
      contactForm.reset();
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
    }
    function onError() {
      showNotification('Erreur lors de l\'envoi.', 'error');
      submitBtn.innerHTML = originalHTML;
      submitBtn.disabled = false;
    }

    if (sdk) {
      sdk.submit(key, { name, email, message }).then(onSuccess).catch(onError);
    } else {
      // Fallback mailto
      const subj = encodeURIComponent('Message de ' + name + ' via portfolio');
      const body = encodeURIComponent('Nom: ' + name + '\nEmail: ' + email + '\nMessage:\n' + message);
      window.location.href = 'mailto:hountondjiphilippe58@gmail.com?subject=' + subj + '&body=' + body;
      onSuccess();
    }
  });
}
