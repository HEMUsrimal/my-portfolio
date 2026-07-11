/* ====================================================================
   CYBERPUNK PORTFOLIO — MAIN JAVASCRIPT
==================================================================== */

/* -------------------- 1. INTERACTIVE TERMINAL -------------------- */
(function interactiveTerminal() {
  const bootContainer = document.getElementById('bootSequence');
  const inputRow = document.getElementById('terminalInputRow');
  const terminalInput = document.getElementById('terminalInput');
  const terminalBody = document.getElementById('terminalBody');
  if (!bootContainer || !inputRow || !terminalInput) return;

  const bootLines = [
    "Initializing neural core...",
    "[OK] Loading stack definitions...",
    "[OK] Establishing secure connection to UI_CORE...",
    "[OK] Boot sequence complete. Welcome, Guest.",
    "Type 'help' to list available system protocols."
  ];

  let lineIndex = 0;

  function typeLine(text, lineEl, onDone) {
    let i = 0;
    const caret = document.createElement('span');
    caret.className = 'cursor-blink';
    caret.textContent = '_';

    function step() {
      if (text.startsWith('[OK]')) {
        const okPart = '[OK]';
        if (i <= okPart.length) {
          lineEl.innerHTML = `<span class="ok-tag">${text.slice(0, i)}</span>`;
        } else {
          lineEl.innerHTML = `<span class="ok-tag">${okPart}</span>${escapeHtml(text.slice(okPart.length, i))}`;
        }
      } else {
        lineEl.textContent = text.slice(0, i);
      }
      lineEl.appendChild(caret);
      i++;
      if (i <= text.length) { setTimeout(step, 14); }
      else { caret.remove(); if (onDone) onDone(); }
    }
    step();
  }

  function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function nextLine() {
    if (lineIndex >= bootLines.length) {
      inputRow.style.display = 'flex';
      terminalInput.focus();
      return;
    }
    const lineEl = document.createElement('div');
    lineEl.className = 'boot-line visible';
    bootContainer.appendChild(lineEl);
    typeLine(bootLines[lineIndex], lineEl, function () {
      lineIndex++;
      terminalBody.scrollTop = terminalBody.scrollHeight;
      setTimeout(nextLine, 80);
    });
  }

  setTimeout(nextLine, 400);

  // Command Execution Router
  terminalInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const cmd = terminalInput.value.trim().toLowerCase();
      terminalInput.value = '';
      if (!cmd) return;

      // Echo user command
      const echoEl = document.createElement('div');
      echoEl.innerHTML = `<span class="prompt">guest@portfolio:~$</span> ${escapeHtml(cmd)}`;
      echoEl.style.marginBottom = '6px';
      bootContainer.appendChild(echoEl);

      const responseEl = document.createElement('div');
      responseEl.style.marginBottom = '14px';
      responseEl.style.color = 'var(--ink-dim)';

      switch (cmd) {
        case 'help':
          responseEl.innerHTML = `Available commands:<br>
          - <b>about</b>          : Who is H.E.M. Udayanga Srimal?<br>
          - <b>skills</b>         : View loaded systems & skill protocols<br>
          - <b>experience</b>     : View professional history logs<br>
          - <b>projects</b>       : Access mainframe database records<br>
          - <b>publications</b>   : Read research abstracts & bibliography<br>
          - <b>certifications</b> : List verified security & cloud tracks<br>
          - <b>volunteer</b>      : View community contribution logs<br>
          - <b>photography</b>    : Initialize Aperture_Core configuration<br>
          - <b>gallery</b>        : View photo gallery datalogs<br>
          - <b>contact</b>        : Initialize secure communication<br>
          - <b>messages</b>       : Read transmission logs sent from this terminal<br>
          - <b>clear</b>          : Flush terminal buffer`;
          break;
        case 'about':
          responseEl.innerHTML = "<b>H.E.M. Udayanga Srimal</b> — Software Engineer specializing in Embedded Systems, Computer Vision, and AI Edge Computing. Aiming to build robust, offline-capable hardware workflows and intelligent systems.";
          break;
        case 'skills':
          responseEl.innerHTML = "Opening stack section...";
          window.location.hash = '#stack';
          break;
        case 'experience':
          responseEl.innerHTML = "Accessing professional experience logs...";
          window.location.hash = '#experience';
          break;
        case 'projects':
          responseEl.innerHTML = "Accessing Mainframe Databanks...";
          window.location.hash = '#projects';
          break;
        case 'publications':
          responseEl.innerHTML = "Accessing publications directory...";
          window.location.hash = '#publications';
          break;
        case 'certifications':
          responseEl.innerHTML = "Loading certified cloud credentials...";
          window.location.hash = '#certifications';
          break;
        case 'volunteer':
          responseEl.innerHTML = "Opening community contributions log...";
          window.location.hash = '#volunteer';
          break;
        case 'photography':
          responseEl.innerHTML = "Initializing Aperture_Core configuration...";
          window.location.hash = '#photography';
          break;
        case 'gallery':
          responseEl.innerHTML = "Opening Visual Data Logs...";
          window.location.hash = '#gallery';
          break;
        case 'contact':
          responseEl.innerHTML = "Initializing secure connection to Port 22...";
          window.location.hash = '#contact';
          break;
        case 'messages':
          const saved = JSON.parse(localStorage.getItem('sent_messages') || '[]');
          if (saved.length === 0) {
            responseEl.innerHTML = "No secure transmissions detected from this node. Use the contact form below to log a message.";
          } else {
            responseEl.innerHTML = `<b>SECURE ARCHIVES (${saved.length} transmission logs):</b><br>` + saved.map((m, idx) => {
              return `[LOG_${idx}] From: ${escapeHtml(m.name)} &lt;${escapeHtml(m.email)}&gt;<br> MSG: ${escapeHtml(m.message)}<br>---`;
            }).join('<br>');
          }
          break;
        case 'clear':
          bootContainer.innerHTML = '';
          break;
        case 'sudo':
          responseEl.innerHTML = "<span style='color:var(--magenta)'>Permission denied. Intrusion event logged. Contacting network security node.</span>";
          break;
        default:
          responseEl.innerHTML = `Unknown protocol: '${escapeHtml(cmd)}'. Type 'help' to review catalog.`;
          break;
      }

      if (cmd !== 'clear') bootContainer.appendChild(responseEl);
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  });

  // Keep terminal focused when clicking its container
  terminalBody.addEventListener('click', () => terminalInput.focus());

})();

/* -------------------- 2. MATRIX DIGITAL RAIN -------------------- */
(function matrixRain() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const chars = '01ABCDEF▒▓█▇▆▅▄▃▂▁';
  const fontSize = 18;
  let columns = [];
  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Array(Math.floor(width / fontSize)).fill(1);
  }

  function draw() {
    ctx.fillStyle = 'rgba(6, 7, 6, 0.08)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(77, 255, 140, 0.58)';
    ctx.font = `${fontSize}px monospace`;
    columns.forEach((y, index) => {
      const text = chars.charAt(Math.floor(Math.random() * chars.length));
      const x = index * fontSize;
      ctx.fillText(text, x, y * fontSize);
      if (y * fontSize > height && Math.random() > 0.98) {
        columns[index] = 0;
      }
      columns[index]++;
    });
    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

/* -------------------- 3. DECRYPT-ON-HOVER (Projects with Event Delegation) -------------------- */
(function decryptEffect() {
  const scrambleChars = "!<>-_\\/[]{}—=+*^?#________";
  const scrambleSpeed = 16;
  const revealStagger = 8;
  const animations = new WeakMap();

  document.addEventListener('mouseover', function (e) {
    const row = e.target.closest('.file-row');
    if (!row) return;

    const target = row.querySelector('.decrypt-text');
    if (!target) return;

    const finalText = row.getAttribute('data-decrypt') || '';

    if (animations.has(row)) return;

    let animState = { frame: null, isAnimating: true };
    animations.set(row, animState);

    const len = finalText.length;
    const start = performance.now();

    function update(now) {
      if (!animState.isAnimating) return;
      const elapsed = now - start;
      const progress = Math.floor(elapsed / scrambleSpeed);
      let out = '';
      for (let i = 0; i < len; i++) {
        const lockPoint = i * (revealStagger / scrambleSpeed);
        out += progress > lockPoint
          ? finalText[i]
          : (finalText[i] === ' ' ? ' ' : scrambleChars[Math.floor(Math.random() * scrambleChars.length)]);
      }
      target.textContent = out;
      if (progress < len * (revealStagger / scrambleSpeed) + 6) {
        animState.frame = requestAnimationFrame(update);
      } else {
        target.textContent = finalText;
        animState.isAnimating = false;
      }
    }
    animState.frame = requestAnimationFrame(update);
  });

  document.addEventListener('mouseout', function (e) {
    const row = e.target.closest('.file-row');
    if (!row) return;

    const related = e.relatedTarget;
    if (related && row.contains(related)) return;

    const target = row.querySelector('.decrypt-text');
    if (!target) return;

    const lockedText = target.getAttribute('data-default') || '[file locked — awaiting decryption key]';

    const animState = animations.get(row);
    if (animState) {
      cancelAnimationFrame(animState.frame);
      animState.isAnimating = false;
      animations.delete(row);
    }
    target.textContent = lockedText;
  });
})();

/* -------------------- 4. STATUS BAR CLOCK -------------------- */
(function statusClock() {
  const clock = document.getElementById('statusClock');
  if (!clock) return;

  function update() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clock.textContent = `${hours}:${minutes}:${seconds}`;
  }

  update();
  setInterval(update, 1000);
})();

/* -------------------- 5. SCROLL REVEAL -------------------- */
(function scrollReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  items.forEach(item => observer.observe(item));
})();

/* -------------------- 6. PHOTO GRID -------------------- */
(function photoGrid() {
  const grid = document.getElementById('photoGrid');
  if (!grid) return;

  const photos = [
    { src: "assets/cyberpunk_workspace.png", tag: "FEED_01", caption: "3D Zero-G Workspace - Cyberpunk" },
    { src: "assets/iot_esp32_setup.png", tag: "FEED_02", caption: "IoT Development Workbench - ESP32 Telemetry" },
    { src: "assets/computer_vision_feed.png", tag: "FEED_03", caption: "Computer Vision Analysis Nodes - City Grid" },
    { src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=80", tag: "FEED_04", caption: "Urban Geometrical Long Exposures" },
    { src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80", tag: "FEED_05", caption: "Forest Canopy Field Study" },
    { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80", tag: "FEED_06", caption: "Sri Lanka Coastal Drift Photography" },
  ];

  grid.innerHTML = photos.map(p => `
    <div class="photo-cell">
      <img src="${p.src}" alt="${p.caption}" loading="lazy">
      <div class="photo-tag">${p.tag}</div>
      <div class="photo-caption">${p.caption}</div>
    </div>
  `).join('');
})();

/* -------------------- 7. ACTIVE CONTACT FORM -------------------- */
(function contactForm() {
  // To enable real email deliveries to udayangasrimaluni2002@gmail.com:
  // 1. Create a free account at https://formspree.io
  // 2. Create a form pointing to your email, and paste the Form ID below:
  const FORMSPREE_FORM_ID = ""; // e.g. "xqyznvwg"

  const form = document.getElementById('contactForm');
  const response = document.getElementById('sshResponse');
  if (!form || !response) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Get form data
    const nameVal = document.getElementById('f-name').value;
    const emailVal = document.getElementById('f-email').value;
    const msgVal = document.getElementById('f-msg').value;

    const submitBtn = form.querySelector('.ssh-submit');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '[ TRANSMITTING... ]';
    submitBtn.style.pointerEvents = 'none';
    submitBtn.style.opacity = '0.5';

    response.innerHTML = '';
    response.style.color = 'var(--green)';

    // Trigger actual Formspree submission in background if ID is set
    if (FORMSPREE_FORM_ID) {
      fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: "POST",
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          message: msgVal
        }),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })
        .then(res => {
          if (!res.ok) {
            console.warn("Formspree transmission failed: status " + res.status);
          }
        })
        .catch(err => {
          console.error("Network error on Formspree submission:", err);
        });
    }

    // Step-by-step interactive simulated network terminal log
    const sequence = [
      { text: "$ initializing handshake protocols...", time: 300 },
      { text: "$ resolving DNS nodes for udayangasrimaluni2002@gmail.com...", time: 400 },
      { text: "$ connection established to udayangasrimaluni2002@gmail.com...", time: 350 },
      { text: `$ encoding client identity details: [${nameVal}]...`, time: 500 },
      { text: "$ packaging secure payload...", time: 400 },
      { text: "$ sending payload packets [======    ] 60%...", time: 500 },
      { text: "$ sending payload packets [==========] 100%...", time: 300 },
      { text: "$ transaction registered. calculating cryptographic checksum...", time: 450 },
      { text: "$ [SUCCESS] payload securely transmitted to udayangasrimaluni2002@gmail.com.", color: "var(--cyan)", time: 400 },
      { text: "$ [LOGGED] local record registered under 'messages' profile.", color: "var(--green)", time: 200 }
    ];

    let delay = 0;
    sequence.forEach((step, index) => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.textContent = step.text;
        if (step.color) line.style.color = step.color;
        response.appendChild(line);

        // Auto scroll parent frame
        const scrollContainer = document.querySelector('.ssh-body');
        if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;

        if (index === sequence.length - 1) {
          // Save payload locally so hero terminal 'messages' command actually works
          const existing = JSON.parse(localStorage.getItem('sent_messages') || '[]');
          existing.push({ name: nameVal, email: emailVal, message: msgVal });
          localStorage.setItem('sent_messages', JSON.stringify(existing));

          setTimeout(() => {
            form.reset();
            submitBtn.textContent = originalBtnText;
            submitBtn.style.pointerEvents = 'auto';
            submitBtn.style.opacity = '1';

            // Clear simulated output log after 5s
            setTimeout(() => { response.innerHTML = ''; }, 5000);
          }, 800);
        }
      }, delay);
      delay += step.time;
    });
  });
})();

/* -------------------- 8. ROTATABLE & TRACKING 3D PARTICLE SERVER GLOBE -------------------- */
(function particleGlobe() {
  const canvas = document.getElementById('core-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const hero = document.getElementById('hero');

  let W = canvas.clientWidth;
  let H = canvas.clientHeight;
  let radius = Math.min(W, H) * 0.35;

  let rotY = 0;
  let rotX = 0.3;
  let targetRotY = 0;
  let targetRotX = 0.3;
  let isHovered = false;
  let isDragging = false;
  let prevX = 0, prevY = 0;

  // Resolve color variables dynamically
  const style = getComputedStyle(document.documentElement);
  const colorGreen = style.getPropertyValue('--green').trim() || '#39ff14';
  const colorCyan = style.getPropertyValue('--cyan').trim() || '#00e5ff';
  const colorMagenta = style.getPropertyValue('--magenta').trim() || '#ff007f';

  // Build grid globe coordinate system of dots
  const particles = [];

  // 1. Latitude Circles
  const latRings = 9;
  const dotsPerLat = 22;
  for (let r = 1; r < latRings; r++) {
    const lat = -Math.PI / 2 + (Math.PI * r) / latRings;
    const y = Math.sin(lat);
    const ringRad = Math.cos(lat);
    for (let d = 0; d < dotsPerLat; d++) {
      const lon = (2 * Math.PI * d) / dotsPerLat;
      const x = ringRad * Math.cos(lon);
      const z = ringRad * Math.sin(lon);
      particles.push({ x, y, z, color: colorGreen, isLink: true });
    }
  }

  // 2. Longitude Lines
  const lonLines = 8;
  const dotsPerLon = 18;
  for (let l = 0; l < lonLines; l++) {
    const lon = (Math.PI * l) / lonLines;
    for (let d = 0; d < dotsPerLon; d++) {
      const lat = -Math.PI / 2 + (Math.PI * d) / dotsPerLon;
      const x = Math.cos(lat) * Math.cos(lon);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon);
      particles.push({ x, y, z, color: colorCyan });
    }
  }

  // Add poles
  particles.push({ x: 0, y: 1, z: 0, color: colorMagenta });
  particles.push({ x: 0, y: -1, z: 0, color: colorMagenta });

  // Floating internal server nodes
  const serverNodes = [
    { x: 0.15, y: 0.25, z: -0.15, size: 5, color: colorMagenta },
    { x: -0.2, y: -0.3, z: 0.1, size: 5, color: colorMagenta },
    { x: -0.1, y: 0.35, z: -0.25, size: 5, color: colorMagenta },
    { x: 0.25, y: -0.2, z: 0.2, size: 5, color: colorMagenta }
  ];

  function resize() {
    W = canvas.width = canvas.clientWidth;
    H = canvas.height = canvas.clientHeight;
    radius = Math.min(W, H) * 0.35;
  }

  function project(p, cx, cy) {
    // Rotate Y
    let x1 = p.x * Math.cos(rotY) - p.z * Math.sin(rotY);
    let z1 = p.x * Math.sin(rotY) + p.z * Math.cos(rotY);

    // Rotate X
    let y2 = p.y * Math.cos(rotX) - z1 * Math.sin(rotX);
    let z2 = p.y * Math.sin(rotX) + z1 * Math.cos(rotX);

    const perspective = 3.5;
    const scale = perspective / (perspective + z2);

    return {
      x: cx + x1 * radius * scale,
      y: cy + y2 * radius * scale,
      z: z2,
      scale: scale,
      color: p.color,
      size: p.size || 2.2
    };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;

    // 1. Draw glowing server core gradient
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.38);
    coreGlow.addColorStop(0, 'rgba(0, 229, 255, 0.3)');
    coreGlow.addColorStop(0.6, 'rgba(255, 0, 127, 0.08)');
    coreGlow.addColorStop(1, 'rgba(5, 8, 5, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Rotate handling
    if (isDragging) {
      // Direct drag rotation
    } else if (isHovered) {
      // Subtly rotate on axis to face the cursor
      rotY += (targetRotY - rotY) * 0.06;
      rotX += (targetRotX - rotX) * 0.06;
    } else {
      // Idle rotation
      rotY += 0.0025;
      rotX += (0.3 - rotX) * 0.06;
    }

    const allNodes = [...particles, ...serverNodes];
    const projected = allNodes.map(p => project(p, cx, cy));

    // Sort by depth
    projected.sort((a, b) => b.z - a.z);

    // 2. Draw connections (data routing links) between server nodes and nearby dots
    ctx.lineWidth = 0.5;
    for (let i = 0; i < projected.length; i++) {
      if (projected[i].size === 5) { // If it is a server node
        for (let j = 0; j < projected.length; j++) {
          if (projected[j].size !== 5 && Math.random() > 0.94) {
            const dx = projected[i].x - projected[j].x;
            const dy = projected[i].y - projected[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < radius * 0.5) {
              ctx.strokeStyle = `rgba(0, 229, 255, ${0.15 * (1.8 - projected[i].z)})`;
              ctx.beginPath();
              ctx.moveTo(projected[i].x, projected[i].y);
              ctx.lineTo(projected[j].x, projected[j].y);
              ctx.stroke();
            }
          }
        }
      }
    }

    // 3. Draw Dots
    projected.forEach(p => {
      const alpha = Math.max(0.18, Math.min(1, (1.8 - p.z) / 2));
      const size = Math.max(1, p.scale * p.size);

      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(draw);
  }

  // Mouse Move Cursor Tracking ("Look At" modifier)
  hero.addEventListener('mousemove', (e) => {
    if (isDragging) return;
    isHovered = true;

    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const px = (e.clientX - cx) / rect.width;
    const py = (e.clientY - cy) / rect.height;

    // Subtle tilt bounds
    targetRotY = px * 1.6;
    targetRotX = 0.3 - py * 1.2;
  });

  hero.addEventListener('mouseleave', () => { isHovered = false; });

  // Drag interaction
  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;

    rotY += dx * 0.005;
    rotX += dy * 0.005;

    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener('mouseup', () => { isDragging = false; });

  // Touch Support
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches[0]) {
      isDragging = true;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    const dx = e.touches[0].clientX - prevX;
    const dy = e.touches[0].clientY - prevY;

    rotY += dx * 0.005;
    rotX += dy * 0.005;

    prevX = e.touches[0].clientX;
    prevY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchend', () => { isDragging = false; });

  resize();
  window.addEventListener('resize', resize);
  draw();
})();

/* -------------------- 9. DYNAMIC GITHUB PROJECTS LOAD -------------------- */
(function loadGithubProjects() {
  const container = document.getElementById('projectsList');
  if (!container) return;

  const username = "HEMUsrimal";
  const apiEndpoint = `https://api.github.com/users/${username}/repos?sort=updated&per_page=12`;

  fetch(apiEndpoint)
    .then(res => {
      if (!res.ok) throw new Error("API rate limit or offline");
      return res.json();
    })
    .then(repos => {
      // Filter out forks and sort by star count
      const sorted = repos
        .filter(r => !r.fork)
        .sort((a, b) => b.stargazers_count - a.stargazers_count);

      if (sorted.length === 0) return;

      // Clear the static fallback entries
      container.innerHTML = '';

      sorted.forEach(repo => {
        const row = document.createElement('div');
        row.className = 'file-row';
        const desc = repo.description || "Active software deployment block. Integrity verified.";
        row.setAttribute('data-decrypt', desc);

        row.innerHTML = `
          <div class="file-row-top">
            <div class="file-name">${escapeHtml(repo.name)}<span class="ext">.git</span></div>
            <div class="file-status">★ ${repo.stargazers_count} | ⑂ ${repo.forks_count} — [DECRYPT]</div>
          </div>
          <div class="decrypt-text" data-default="[file locked — awaiting decryption key]"></div>
          <div class="file-progress"></div>
        `;

        row.addEventListener('click', () => {
          window.open(repo.html_url, '_blank', 'noreferrer noopener');
        });

        container.appendChild(row);
      });

      function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    })
    .catch(err => {
      console.warn("Falling back to static portfolio system: ", err);
    });
})();

document.getElementById('year').textContent = new Date().getFullYear();