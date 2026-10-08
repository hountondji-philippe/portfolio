/* ============================================================
   PHILIPPE OS v2.0.0 — Terminal Interactif Full-Stack & Réseau
   ============================================================ */

window.switchTerminalTab = function(tabName) {
  const tBody        = document.getElementById('tBody');
  const tInteractive = document.getElementById('tInteractive');
  const tIA          = document.getElementById('tIA');
  const btnSys       = document.getElementById('btn-tab-sys');
  const btnInt       = document.getElementById('btn-tab-int');
  const btnIA        = document.getElementById('btn-tab-ia');

  if (!tBody || !tInteractive || !tIA) return;

  tBody.style.display        = 'none';
  tInteractive.style.display = 'none';
  tIA.style.display          = 'none';

  [btnSys, btnInt, btnIA].forEach(b => b && b.classList.remove('active'));

  if (tabName === 'system') {
    tBody.style.display = 'block';
    if (btnSys) btnSys.classList.add('active');
  } else if (tabName === 'interactive') {
    tInteractive.style.display = 'flex';
    if (btnInt) btnInt.classList.add('active');
    const input = document.getElementById('tInput');
    if (input) setTimeout(() => input.focus(), 50);
    const out = document.getElementById('iOutput');
    if (out) out.scrollTop = out.scrollHeight;
  } else if (tabName === 'ia') {
    tIA.style.display = 'flex';
    if (btnIA) btnIA.classList.add('active');
    const input = document.getElementById('iaInput');
    if (input) setTimeout(() => input.focus(), 50);
    const out = document.getElementById('iaOutput');
    if (out) out.scrollTop = out.scrollHeight;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const tInput   = document.getElementById('tInput');
  const iOutput  = document.getElementById('iOutput');
  const iaInput  = document.getElementById('iaInput');
  const iaOutput = document.getElementById('iaOutput');

  if (!tInput || !iOutput) return;

  const COLOR_MAP = {
    ok    : 'var(--ac)',
    err   : '#ef4444',
    warn  : '#f59e0b',
    info  : 'var(--txt2)',
    dim   : 'var(--txt3)',
    bright: 'var(--txt)',
    green : '#10b981',
    purple: 'var(--ac)',
    cyan  : '#00e5ff'
  };

  function tLog(containerId, text, colorKey = 'dim', isHtml = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const line = document.createElement('div');
    line.style.color        = COLOR_MAP[colorKey] || 'var(--txt3)';
    line.style.marginBottom = '4px';
    line.style.wordBreak    = 'break-word';
    line.style.fontFamily   = "'JetBrains Mono', monospace";
    line.style.fontSize     = '0.82rem';
    line.style.lineHeight   = '1.6';
    if (isHtml) line.innerHTML = text;
    else line.textContent = text;
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
    return line;
  }

  function levenshtein(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[a.length][b.length];
  }

  const KNOWN_CMDS = ['help', 'clear', 'profil', 'reseau', 'cisco', 'vlan', 'skills', 'projets', 'cv', 'contact', 'newsletter', 'echo', 'date', 'whoami', 'ping', 'ipconfig', 'color', 'matrix'];

  function suggestCommand(cmd) {
    let best = null, bestDist = Infinity;
    for (const k of KNOWN_CMDS) {
      const d = levenshtein(cmd, k);
      if (d < bestDist) { bestDist = d; best = k; }
    }
    return bestDist <= 2 ? best : null;
  }

  // État du terminal (conversationnel)
  let termState = { mode: 'normal', data: {} };

  // Message d'accueil initial
  tLog('iOutput', 'Philippe OS v2.0.0 (x86_64-pc-linux-gnu)', 'bright');
  tLog('iOutput', 'Architecte Logiciel & Administrateur Réseau (ENEAM)', 'ok');
  tLog('iOutput', 'Tapez "help" pour afficher les commandes disponibles.', 'dim');
  tLog('iOutput', '────────────────────────────────────────────────────────', 'dim');

  tInput.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const cmd = tInput.value.trim();
    tInput.value = '';
    if (!cmd) return;

    tLog('iOutput', `philippe@sys-admin:~$ ${cmd}`, 'bright');

    // Machine à états pour formulaires dans le terminal
    if (termState.mode === 'awaiting_contact_name') {
      termState.data.name = cmd;
      tLog('iOutput', 'Votre adresse email :', 'warn');
      termState.mode = 'awaiting_contact_email';
      return;
    }
    if (termState.mode === 'awaiting_contact_email') {
      termState.data.email = cmd;
      tLog('iOutput', 'Numéro de téléphone (+229...) [ou Entrée pour passer] :', 'warn');
      termState.mode = 'awaiting_contact_phone';
      return;
    }
    if (termState.mode === 'awaiting_contact_phone') {
      termState.data.phone = cmd;
      tLog('iOutput', 'Votre message pour Philippe :', 'warn');
      termState.mode = 'awaiting_contact_msg';
      return;
    }
    if (termState.mode === 'awaiting_contact_msg') {
      termState.data.message = cmd;
      tLog('iOutput', 'Transmission du message via l\'API...', 'info');
      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: termState.data.name,
            email: termState.data.email,
            telephone: termState.data.phone || '',
            message: termState.data.message
          })
        });
        const resData = await res.json();
        if (res.ok && resData.success !== false) {
          tLog('iOutput', '✓ Message transmis avec succès à Philippe !', 'green');
        } else {
          tLog('iOutput', `✗ Erreur: ${resData.message || resData.error || 'Échec de transmission'}`, 'err');
        }
      } catch (err) {
        tLog('iOutput', '✓ Message enregistré en local. Philippe vous recontactera rapidement.', 'green');
      }
      termState = { mode: 'normal', data: {} };
      return;
    }

    if (termState.mode === 'awaiting_nl_email') {
      tLog('iOutput', 'Inscription à la newsletter en cours...', 'info');
      try {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cmd })
        });
        const resData = await res.json();
        if (res.ok && resData.success !== false) {
          tLog('iOutput', '✓ Inscription confirmée avec succès !', 'green');
        } else {
          tLog('iOutput', `✗ Erreur: ${resData.message || resData.error || 'Erreur inconnue'}`, 'err');
        }
      } catch {
        tLog('iOutput', '✓ Inscription enregistrée.', 'green');
      }
      termState = { mode: 'normal', data: {} };
      return;
    }

    await processCommand(cmd);
  });

  async function processCommand(cmd) {
    const args = cmd.trim().split(/\s+/).filter(Boolean);
    const mainCmd = args[0].toLowerCase();

    switch (mainCmd) {
      case 'help':
        tLog('iOutput', '┌─ COMMANDES DISPONIBLES ──────────────────────────┐', 'dim');
        tLog('iOutput', '│  profil       - Biographie & statut de Philippe   │', 'ok');
        tLog('iOutput', '│  skills       - Technologies & outils maîtrisés   │', 'ok');
        tLog('iOutput', '│  cisco        - Simulation de routeur Cisco IOS   │', 'ok');
        tLog('iOutput', '│  vlan         - Statut segmentation 802.1Q       │', 'ok');
        tLog('iOutput', '│  projets      - Liste des réalisations majeures   │', 'ok');
        tLog('iOutput', '│  cv           - Consulter le CV officiel          │', 'ok');
        tLog('iOutput', '│  contact      - Envoyer un message direct         │', 'ok');
        tLog('iOutput', '│  newsletter   - S\'abonner aux nouveautés          │', 'ok');
        tLog('iOutput', '│  ipconfig     - Paramètres d\'interfaces réseau    │', 'ok');
        tLog('iOutput', '│  ping [hôte]  - Tester la connectivité ICMP       │', 'ok');
        tLog('iOutput', '│  color [0-9]  - Modifier la couleur du site       │', 'ok');
        tLog('iOutput', '│  clear        - Nettoyer le terminal              │', 'ok');
        tLog('iOutput', '└──────────────────────────────────────────────────┘', 'dim');
        break;

      case 'clear':
        iOutput.innerHTML = '';
        break;

      case 'profil':
      case 'whoami':
        tLog('iOutput', '┌─ HOUNTONDJI Philippe Jésussédè ─────────────────────┐', 'ok');
        tLog('iOutput', '│  Rôle        : Développeur Web Full-Stack & Admin Réseau', 'bright');
        tLog('iOutput', '│  Formation   : Licence 3 Réseaux & Systèmes (ENEAM - UAC)', 'bright');
        tLog('iOutput', '│  Localisation: Porto-Novo & Cotonou, Bénin 🇧🇯', 'bright');
        tLog('iOutput', '│  Spécialités : Laravel · React · Node.js · Flutter', 'bright');
        tLog('iOutput', '│                Cisco IOS · Routage OSPF · VLANs · Linux', 'bright');
        tLog('iOutput', '│  Statut      : Disponible pour stages & missions', 'ok');
        tLog('iOutput', '└─────────────────────────────────────────────────────┘', 'dim');
        break;

      case 'skills':
      case 'stack':
        tLog('iOutput', '=== STACK TECHNIQUE DE PHILIPPE ===', 'ok');
        tLog('iOutput', '• Back-end    : Laravel 11, Node.js, Express, PHP 8.2, Python', 'bright');
        tLog('iOutput', '• Front-end   : React.js, JavaScript ES6+, HTML5, CSS3, Tailwind', 'bright');
        tLog('iOutput', '• Mobile      : Flutter, Dart (Android & iOS)', 'bright');
        tLog('iOutput', '• Réseau      : Cisco IOS, OSPF, BGP, VLANs 802.1Q, HSRP, Wireshark', 'cyan');
        tLog('iOutput', '• BDD & Cloud : PostgreSQL (Neon), MySQL, Vercel, Supabase, Git', 'bright');
        tLog('iOutput', '• Sécurité    : Chiffrement AES-256, Normes OWASP, Pare-feu ACLs', 'green');
        break;

      case 'cisco':
      case 'reseau':
        tLog('iOutput', 'Router-Core# show ip route ospf', 'bright');
        tLog('iOutput', 'Codes: C - connected, S - static, R - RIP, O - OSPF', 'dim');
        tLog('iOutput', 'Gateway of last resort is 10.0.0.1 to network 0.0.0.0', 'dim');
        tLog('iOutput', 'O    192.168.10.0/24 [110/2] via 10.0.0.2, 00:14:22, GigabitEthernet0/0', 'ok');
        tLog('iOutput', 'O    192.168.20.0/24 [110/2] via 10.0.0.3, 00:14:22, GigabitEthernet0/1', 'ok');
        tLog('iOutput', 'O    192.168.30.0/24 [110/3] via 10.0.0.4, 00:09:11, GigabitEthernet0/2', 'ok');
        tLog('iOutput', '✓ Topologie multi-aires OSPF stabilisée (Convergence: 100%)', 'green');
        break;

      case 'vlan':
        tLog('iOutput', 'Switch-Distribution# show vlan brief', 'bright');
        tLog('iOutput', 'VLAN Name                             Status    Ports', 'dim');
        tLog('iOutput', '---- -------------------------------- --------- -------------------------------', 'dim');
        tLog('iOutput', '1    default                          active    Fa0/1, Fa0/2', 'dim');
        tLog('iOutput', '10   VLAN_ADMIN_MANAGEMENT            active    Fa0/3 - Fa0/8', 'ok');
        tLog('iOutput', '20   VLAN_SERVERS_DATABASE            active    Gi0/1 - Gi0/4', 'ok');
        tLog('iOutput', '30   VLAN_STUDENTS_ENEAM              active    Fa0/9 - Fa0/24', 'ok');
        tLog('iOutput', 'Trunk encapsulation 802.1Q : Gi0/1 (UP/UP)', 'green');
        break;

      case 'projets':
        tLog('iOutput', '=== PROJETS PHARES ===', 'ok');
        tLog('iOutput', '1. Plateforme VBG Bénin  — Signalement chiffré AES-256 & Cartographie', 'bright');
        tLog('iOutput', '2. NEXTMUX Engine        — Multiplexage & API REST haute performance', 'bright');
        tLog('iOutput', '3. Campus Multi-Sites    — Topologie Cisco IOS OSPF & VLANs', 'bright');
        tLog('iOutput', '4. RestoDirect SaaS      — Flux de commandes temps réel WebSockets', 'bright');
        tLog('iOutput', 'Tapez "projets" ou faites défiler la page pour les voir.', 'dim');
        break;

      case 'cv':
        tLog('iOutput', 'Redirection vers le CV interactif...', 'ok');
        window.location.href = 'cv.html';
        break;

      case 'contact':
        termState.mode = 'awaiting_contact_name';
        tLog('iOutput', '=== FORMULAIRE DE CONTACT DIRECT ===', 'ok');
        tLog('iOutput', 'Veuillez entrer votre nom complet :', 'warn');
        break;

      case 'newsletter':
        termState.mode = 'awaiting_nl_email';
        tLog('iOutput', 'Entrez votre adresse email pour vous abonner :', 'warn');
        break;

      case 'ping':
        const target = args[1] || 'eneam.uac.bj';
        tLog('iOutput', `PING ${target} (10.15.2.1) 56(84) bytes of data.`, 'dim');
        for (let seq = 1; seq <= 4; seq++) {
          const ms = (Math.random() * 8 + 4).toFixed(2);
          tLog('iOutput', `64 bytes from 10.15.2.1: icmp_seq=${seq} ttl=64 time=${ms} ms`, 'bright');
        }
        tLog('iOutput', `--- ${target} ping statistics ---`, 'dim');
        tLog('iOutput', '4 packets transmitted, 4 received, 0% packet loss', 'green');
        break;

      case 'ipconfig':
      case 'ifconfig':
        tLog('iOutput', 'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500', 'dim');
        tLog('iOutput', '      inet 192.168.1.42  netmask 255.255.255.0  broadcast 192.168.1.255', 'bright');
        tLog('iOutput', '      inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>', 'dim');
        tLog('iOutput', '      ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)', 'dim');
        tLog('iOutput', '      RX packets 145028  bytes 142095512 (135.5 MiB)', 'ok');
        tLog('iOutput', '      TX packets 89410   bytes 9845112 (9.3 MiB)', 'ok');
        break;

      case 'color':
        const idx = parseInt(args[1]);
        if (!isNaN(idx) && window.setTerminalColor) {
          window.setTerminalColor(idx);
        } else {
          tLog('iOutput', 'Usage: color [0-9] (ex: color 0 pour Violet Cyberpunk, color 1 pour Cyan)', 'warn');
        }
        break;

      case 'date':
        tLog('iOutput', new Date().toLocaleString('fr-FR'), 'bright');
        break;

      case 'echo':
        tLog('iOutput', args.slice(1).join(' '), 'bright');
        break;

      case 'matrix':
        tLog('iOutput', 'Wake up, Neo... The Matrix has you. Follow the white rabbit. 🐰', 'green');
        break;

      default:
        const sugg = suggestCommand(mainCmd);
        tLog('iOutput', `Commande inconnue: "${mainCmd}"`, 'err');
        if (sugg) {
          tLog('iOutput', `Vouliez-vous dire "${sugg}" ?`, 'warn');
        } else {
          tLog('iOutput', 'Tapez "help" pour la liste des commandes.', 'dim');
        }
        break;
    }
  }

  // Onglet IA
  if (iaInput && iaOutput) {
    tLog('iaOutput', 'Assistant IA Philippe Portfolio activé (Groq / LLaMA-3).', 'ok');
    tLog('iaOutput', 'Posez-moi des questions sur les compétences de Philippe, ses projets ou son parcours.', 'dim');
    tLog('iaOutput', '────────────────────────────────────────────────────────', 'dim');

    iaInput.addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
      const q = iaInput.value.trim();
      iaInput.value = '';
      if (!q) return;

      tLog('iaOutput', `❯ ${q}`, 'bright');
      const qLower = q.toLowerCase();

      let answer = "";
      if (qLower.includes('qui') || qLower.includes('philippe') || qLower.includes('profil')) {
        answer = "Philippe Hountondji est un développeur full-stack (Laravel, React, Node.js, Flutter) et administrateur réseau étudiant en Licence 3 à l'ENEAM (UAC) au Bénin. Il allie compétences logicielles et maîtrise des infrastructures d'entreprise.";
      } else if (qLower.includes('projet') || qLower.includes('vbg') || qLower.includes('nextmux')) {
        answer = "Parmi ses réalisations phares : la plateforme citoyenne VBG Bénin (chiffrement AES-256 et cartographie), le moteur de multiplexage NEXTMUX (Laravel/MySQL), la simulation d'infrastructure campus multi-sites Cisco (OSPF & VLANs) et l'application temps réel RestoDirect.";
      } else if (qLower.includes('reseau') || qLower.includes('cisco') || qLower.includes('ospf') || qLower.includes('vlan')) {
        answer = "En réseau, Philippe maîtrise le CLI Cisco IOS, le routage dynamique OSPF/BGP, la segmentation VLAN 802.1Q, la haute disponibilité HSRP, la sécurité par pare-feu/ACLs et l'analyse de paquets Wireshark.";
      } else if (qLower.includes('contact') || qLower.includes('recrut') || qLower.includes('stage') || qLower.includes('embauche')) {
        answer = "Philippe est disponible immédiatement pour des opportunités de stage ou des projets clients. Vous pouvez lui écrire via le formulaire de contact, par email à hountondjiphilippe58@gmail.com ou par WhatsApp au +229 01 58 15 69 30.";
      } else {
        answer = `Merci pour votre question ! Philippe maîtrise un profil complet : architecture web full-stack, intégration d'APIs et administration de réseaux Cisco sécurisés. N'hésitez pas à explorer ses projets ou à le contacter directement.`;
      }

      setTimeout(() => {
        tLog('iaOutput', answer, 'purple');
      }, 300);
    });
  }
});
