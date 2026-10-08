
(function () {
  'use strict';

  /* ═══════════════════════════════════
     1. BARRE DE PROGRESSION DU SCROLL
  ═══════════════════════════════════ */
  function initBarreProgression() {
    const barre = document.createElement('div');
    barre.className = 'barre-progression-scroll';
    document.body.prepend(barre);
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const pct = (h.scrollTop || document.body.scrollTop) / ((h.scrollHeight || document.body.scrollHeight) - h.clientHeight);
      barre.style.transform = 'scaleX(' + Math.min(Math.max(pct, 0), 1) + ')';
    }, { passive: true });
  }

  /* ═══════════════════════════════════
     2. SCROLL REVEAL (Intersection Observer)
  ═══════════════════════════════════ */
  function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal-on-scroll');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('visible'));
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      rootMargin: '0px 0px -50px 0px',
      threshold: 0.08
    });

    elements.forEach((el) => obs.observe(el));
  }

  /* ═══════════════════════════════════
     3. TOILE RÉSEAU INTERACTIF HERO (Canvas)
     Particules connectées & interaction souris
  ═══════════════════════════════════ */
  function initToileReseau() {
    const canvas = document.getElementById('toileReseauHero');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const COULEUR_POINT = 'rgba(0, 198, 255, OPACITE)';
    const COULEUR_LIEN = 'rgba(0, 198, 255, OPACITE)';
    const NB_POINTS = window.innerWidth < 768 ? 32 : 55;
    const DIST_MAX_LIEN = 160;
    const DIST_MAX_CURSEUR = 200;
    const VITESSE = 0.45;

    let largeur = 0, hauteur = 0;
    let curseur = { x: -2000, y: -2000 };
    let points = [];
    let rafId = null;

    function redimensionner() {
      largeur = canvas.offsetWidth || window.innerWidth;
      hauteur = canvas.offsetHeight || 600;
      canvas.width = largeur;
      canvas.height = hauteur;
    }

    function creerPoints() {
      points = [];
      for (let i = 0; i < NB_POINTS; i++) {
        points.push({
          x: Math.random() * largeur,
          y: Math.random() * hauteur,
          vx: (Math.random() - 0.5) * VITESSE,
          vy: (Math.random() - 0.5) * VITESSE,
          rayon: Math.random() * 2 + 1,
        });
      }
    }

    function dessiner() {
      ctx.clearRect(0, 0, largeur, hauteur);

            for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > largeur) p.vx *= -1;
        if (p.y < 0 || p.y > hauteur) p.vy *= -1;
      }

            for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < DIST_MAX_LIEN) {
            const alpha = (1 - dist / DIST_MAX_LIEN) * 0.28;
            ctx.beginPath();
            ctx.strokeStyle = COULEUR_LIEN.replace('OPACITE', alpha.toFixed(3));
            ctx.lineWidth = 1;
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }

                const dxc = points[i].x - curseur.x;
        const dyc = points[i].y - curseur.y;
        const distC = Math.sqrt(dxc * dxc + dyc * dyc);

        if (distC < DIST_MAX_CURSEUR) {
          const alpha = (1 - distC / DIST_MAX_CURSEUR) * 0.65;
          ctx.beginPath();
          ctx.strokeStyle = COULEUR_LIEN.replace('OPACITE', alpha.toFixed(3));
          ctx.lineWidth = 1.4;
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(curseur.x, curseur.y);
          ctx.stroke();
        }
      }

            for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dxc = p.x - curseur.x;
        const dyc = p.y - curseur.y;
        const distC = Math.sqrt(dxc * dxc + dyc * dyc);

        const estProche = distC < DIST_MAX_CURSEUR;
        const rayon = estProche ? p.rayon * (1 + 0.7 * (1 - distC / DIST_MAX_CURSEUR)) : p.rayon;
        const alpha = estProche ? 0.9 : 0.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, rayon, 0, Math.PI * 2);
        ctx.fillStyle = COULEUR_POINT.replace('OPACITE', alpha.toString());
        ctx.shadowColor = '#00C6FF';
        ctx.shadowBlur = estProche ? 8 : 4;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      rafId = requestAnimationFrame(dessiner);
    }

    const hero = document.getElementById('presentation');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        curseur.x = e.clientX - rect.left;
        curseur.y = e.clientY - rect.top;
      }, { passive: true });

      hero.addEventListener('mouseleave', () => {
        curseur.x = -2000;
        curseur.y = -2000;
      });
    }

    redimensionner();
    creerPoints();
    dessiner();

    window.addEventListener('resize', () => {
      redimensionner();
      creerPoints();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
      } else {
        dessiner();
      }
    });
  }

  /* ═══════════════════════════════════
     4. COMPTEURS ANIMÉS (Stats)
  ═══════════════════════════════════ */
  function initCompteurs() {
    const pastilles = document.querySelectorAll('.pastille-stat-luxe[data-stat-cible]');
    if (!pastilles.length) return;

    if (!('IntersectionObserver' in window)) {
      pastilles.forEach(p => {
        const span = p.querySelector('.valeur-compteur');
        if (span && p.dataset.statCible) span.textContent = p.dataset.statCible;
      });
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const cible = parseInt(el.dataset.statCible, 10);
        const span = el.querySelector('.valeur-compteur');
        if (!span || isNaN(cible)) return;

        const duree = 1600;
        const debut = performance.now();

        function animer(maintenant) {
          const progres = Math.min((maintenant - debut) / duree, 1);
          const ease = 1 - Math.pow(1 - progres, 4);
          span.textContent = Math.round(ease * cible);
          if (progres < 1) {
            requestAnimationFrame(animer);
          } else {
            span.textContent = cible;
          }
        }
        requestAnimationFrame(animer);
        obs.unobserve(el);
      });
    }, { threshold: 0.3 });

    pastilles.forEach((p) => obs.observe(p));
  }

  /* ═══════════════════════════════════
     5. MOTEUR FLUX VIDÉO & CYBER ARRIÈRE-PLAN PROJETS
     Animation fluide visible en continu derrière les projets :
     Flux binaire, commandes Cisco IOS, endpoints API REST, paquets TCP
  ═══════════════════════════════════ */
  function initToileMatrixProjets() {
    const canvas = document.getElementById('toileMatrixProjets');
    const video = document.getElementById('videoFondProjets');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let largeur, hauteur;
    const LIGNES_CODE = [
      '// [SYS_KERNEL] Network interface eth0: 10 Gbps Link Up',
      'Router(config)# router ospf 1 -> area 0 backbone converged',
      'Route: 192.168.10.0/24 [110/10] via 10.0.0.1, 00:14:22, Gi0/1',
      'App\\Http\\Controllers\\ApiController::dispatch(Job $payload);',
      'DB::connection("pgsql")->table("telemetry")->insert($data);',
      'WebSocket connection established: wss://api.philippe.dev/live',
      'OWASP WAF: Request signature verified [TLS 1.3 / AES-256-GCM]',
      'VLAN 10 [CORE_MGMT] | VLAN 20 [SERVERS_VLAN] | 802.1Q Trunk UP',
      'const client = createClient({ url: process.env.REDIS_URL });',
      'await client.connect(); // Redis cluster ping: 1.2ms',
      'SELECT id, service_name, status, ping_ms FROM infrastructure;',
      'POST /v1/auth/verify -> 200 OK [ResponseTime: 38ms]',
      'SSH-2.0-OpenSSH_9.3p1 Debian-1: Key exchange completed',
      'Cisco-IOS# show ip interface brief -> Gi0/0: UP, Gi0/1: UP',
      'React.useEffect(() => { subscribeToSocketStream(); }, []);'
    ];

    let colonnes = 0;
    let gouttes = [];
    let paquets = [];
    let animationId = null;

    function redimensionner() {
      largeur = canvas.offsetWidth || window.innerWidth;
      hauteur = canvas.offsetHeight || 900;
      canvas.width = largeur;
      canvas.height = hauteur;
      colonnes = Math.floor(largeur / 24);
      gouttes = [];
      for (let i = 0; i < colonnes; i++) {
        gouttes[i] = Math.floor(Math.random() * -40);
      }

            paquets = [];
      for (let i = 0; i < 20; i++) {
        paquets.push({
          x: Math.random() * largeur,
          y: Math.random() * hauteur,
          vitesseX: (Math.random() * 2 + 1) * (Math.random() > 0.5 ? 1 : -1),
          texte: ['TCP/IP [10.0.4.' + Math.floor(Math.random() * 254) + ']', 'SYN-ACK [RTT 4ms]', 'HTTP/3 200 OK', 'OSPF LSA-Area-0', 'VLAN-10 Trunk'][Math.floor(Math.random() * 5)],
          couleur: ['#00E5FF', '#38BDF8', '#4ADE80', '#00C6FF'][Math.floor(Math.random() * 4)],
          taille: Math.random() * 2.5 + 2
        });
      }
    }

        if (video && canvas.captureStream) {
      try {
        const stream = canvas.captureStream(30);
        video.srcObject = stream;
        video.play().catch(() => {});
      } catch (_) {}
    }

    function dessinerFluxInformatique() {
            ctx.fillStyle = 'rgba(6, 13, 26, 0.16)';
      ctx.fillRect(0, 0, largeur, hauteur);

      ctx.font = '12px "JetBrains Mono", monospace';

            for (let i = 0; i < colonnes; i++) {
        const char = '0123456789ABCDEF{}<>/=:[].$_*#'[Math.floor(Math.random() * 30)];
        const x = i * 24;
        const y = gouttes[i] * 18;

        if (Math.random() > 0.92) {
          ctx.fillStyle = '#FFFFFF';
        } else if (Math.random() > 0.70) {
          ctx.fillStyle = '#00E5FF';
        } else {
          ctx.fillStyle = 'rgba(0, 198, 255, 0.35)';
        }

        ctx.fillText(char, x, y);

        if (y > hauteur && Math.random() > 0.98) {
          gouttes[i] = 0;
        }
        gouttes[i]++;
      }

            ctx.font = '13px "JetBrains Mono", monospace';
      const decalageTemps = Date.now() * 0.045;
      for (let j = 0; j < 8; j++) {
        const indexLigne = (j + Math.floor(Date.now() / 4000)) % LIGNES_CODE.length;
        const texte = LIGNES_CODE[indexLigne];
        const posY = 120 + j * 100;
        const posX = ((decalageTemps * (j % 2 === 0 ? 1 : -0.7) + j * 200) % (largeur + 600)) - 300;

        ctx.fillStyle = j % 2 === 0 ? 'rgba(0, 229, 255, 0.55)' : 'rgba(74, 222, 128, 0.5)';
        ctx.fillText(texte, posX, posY);
      }

            paquets.forEach((p) => {
        p.x += p.vitesseX;
        if (p.x < 0) p.x = largeur;
        if (p.x > largeur) p.x = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.taille, 0, Math.PI * 2);
        ctx.fillStyle = p.couleur;
        ctx.shadowColor = p.couleur;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(232, 240, 255, 0.85)';
        ctx.fillText(p.texte, p.x + 8, p.y + 3);
      });

      animationId = requestAnimationFrame(dessinerFluxInformatique);
    }

    redimensionner();
    dessinerFluxInformatique();

    window.addEventListener('resize', redimensionner);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animationId) cancelAnimationFrame(animationId);
      } else {
        dessinerFluxInformatique();
      }
    });
  }

  /* ═══════════════════════════════════
     6. EFFET D'INCLINAISON 3D SUR CARTES PROJETS
  ═══════════════════════════════════ */
  function initCartesHover() {
    const cartes = document.querySelectorAll('.carte-projet-luxe');
    cartes.forEach((carte) => {
      carte.addEventListener('mousemove', (e) => {
        const rect = carte.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const milieuX = rect.width / 2;
        const milieuY = rect.height / 2;
        const rotX = ((y - milieuY) / milieuY) * -4;
        const rotY = ((x - milieuX) / milieuX) * 4;

        carte.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-8px)`;
      });

      carte.addEventListener('mouseleave', () => {
        carte.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

    function demarrerTout() {
    initBarreProgression();
    initScrollReveal();
    initToileReseau();
    initCompteurs();
    initToileMatrixProjets();
    initCartesHover();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrerTout);
  } else {
    demarrerTout();
  }
})();
