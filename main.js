/* ====================================================================
   CYBERPUNK PORTFOLIO — MAIN JAVASCRIPT
==================================================================== */

/* -------------------- 1. BOOT / TYPING SEQUENCE -------------------- */
(function bootSequence(){
  const container = document.getElementById('bootSequence');
  if(!container) return;

  // UPDATE YOUR TYPING ANIMATION TEXT HERE
  const bootLines = [
    "Loading modules...",
    "[OK] SE Undergraduate @ University of Sri Jayewardenepura",
    "[OK] AI, Computer Vision & Edge Computing Enthusiast",
    "[OK] Embedded Systems Developer",
    "[OK] Mobile App Developer (Android / Java)",
    "[OK] IoT & Robotics Builder",
    "[OK] Photographer & Visual Storyteller"
  ];

  const typeSpeed   = 16;
  const lineGap     = 240;
  const startDelay  = 350;
  const loop        = false;
  let lineIndex = 0;

  function typeLine(text, lineEl, onDone){
    let i = 0;
    const caret = document.createElement('span');
    caret.className = 'typing-caret';

    function step(){
      if(text.startsWith('[OK]')){
        const okPart = '[OK]';
        if(i <= okPart.length){
          lineEl.innerHTML = `<span class="ok-tag">${text.slice(0, i)}</span>`;
        } else {
          lineEl.innerHTML = `<span class="ok-tag">${okPart}</span>${escapeHtml(text.slice(okPart.length, i))}`;
        }
      } else {
        lineEl.textContent = text.slice(0, i);
      }
      lineEl.appendChild(caret);
      i++;
      if(i <= text.length){ setTimeout(step, typeSpeed); }
      else { caret.remove(); onDone(); }
    }
    step();
  }

  function escapeHtml(str){ return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function runSequence(){ container.innerHTML = ''; lineIndex = 0; nextLine(); }
  function nextLine(){
    if(lineIndex >= bootLines.length){ if(loop){ setTimeout(runSequence, 4000); } return; }
    const lineEl = document.createElement('span');
    lineEl.className = 'boot-line visible';
    container.appendChild(lineEl);
    typeLine(bootLines[lineIndex], lineEl, function(){ lineIndex++; setTimeout(nextLine, lineGap); });
  }

  setTimeout(runSequence, startDelay);
})();

/* -------------------- 2. MATRIX DIGITAL RAIN -------------------- */
(function matrixRain(){
  const canvas = document.getElementById('matrix-canvas');
  if(!canvas) return;

  const ctx = canvas.getContext('2d');
  const chars = '01ABCDEF▒▓█▇▆▅▄▃▂▁';
  const fontSize = 18;
  let columns = [];
  let width = 0;
  let height = 0;

  function resize(){
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    columns = Array(Math.floor(width / fontSize)).fill(1);
  }

  function draw(){
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(77, 255, 140, 0.88)';
    ctx.font = `${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--font-body').trim() || 'monospace'}`;
    columns.forEach((y, index) => {
      const text = chars.charAt(Math.floor(Math.random() * chars.length));
      const x = index * fontSize;
      ctx.fillText(text, x, y * fontSize);
      if(y * fontSize > height && Math.random() > 0.975) {
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

/* -------------------- 3. PARTICLE DATA-CORE -------------------- */
/* --------------------------------------------------------------------
   3. PARTICLE DATA-CORE — signature hero element
   -------------------------------------------------------------------- */
(function dataCore(){
  const canvas = document.getElementById('core-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const heroEl = document.getElementById('hero');

  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const PARTICLE_COUNT = isMobile ? 320 : 640;
  const connectDistance = isMobile ? 34 : 46;
  const autoRotateSpeed = 0.0016;
  const mouseInfluence = 0.06;

  let W, H, RADIUS;
  let particles = [];
  let rotY = 0, rotX = 0.35;
  let targetTiltX = 0, targetTiltY = 0;
  let curTiltX = 0, curTiltY = 0;
  let rafId;

  function buildParticles(){
    particles = [];
    for(let i = 0; i < PARTICLE_COUNT; i++){
      const phi = Math.acos(-1 + (2 * i) / PARTICLE_COUNT);
      const theta = Math.sqrt(PARTICLE_COUNT * Math.PI) * phi;
      particles.push({ phi, theta });
    }
  }

  function resize(){
    W = canvas.width = heroEl.clientWidth;
    H = canvas.height = heroEl.clientHeight;
    RADIUS = Math.min(W, H) * (isMobile ? 0.30 : 0.24);
  }

  function project(p, cx, cy){
    const baseX = RADIUS * Math.sin(p.phi) * Math.cos(p.theta + rotY);
    const baseY = RADIUS * Math.cos(p.phi);
    const baseZ = RADIUS * Math.sin(p.phi) * Math.sin(p.theta + rotY);

    const totalTiltX = rotX + curTiltX;
    const y2 = baseY * Math.cos(totalTiltX) - baseZ * Math.sin(totalTiltX);
    const z2 = baseY * Math.sin(totalTiltX) + baseZ * Math.cos(totalTiltX);

    const x3 = baseX * Math.cos(curTiltY) + z2 * Math.sin(curTiltY);
    const z3 = -baseX * Math.sin(curTiltY) + z2 * Math.cos(curTiltY);

    const perspective = 480;
    const scale = perspective / (perspective + z3);
    return { x: cx + x3 * scale, y: cy + y2 * scale, scale, z: z3 };
  }

  function draw(){
    rafId = requestAnimationFrame(draw);
    ctx.clearRect(0, 0, W, H);

    const cx = W * (isMobile ? 0.5 : 0.78);
    const cy = H * 0.46;

    rotY += autoRotateSpeed;
    curTiltX += (targetTiltX - curTiltX) * 0.04;
    curTiltY += (targetTiltY - curTiltY) * 0.04;

    const projected = particles.map(p => project(p, cx, cy));
    projected.sort((a, b) => a.z - b.z);

    // faint connecting lines between near particles
    ctx.lineWidth = 0.5;
    for(let i = 0; i < projected.length; i++){
      for(let j = i + 1; j < Math.min(i + 6, projected.length); j++){
        const a = projected[i], b = projected[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < connectDistance){
          const alpha = (1 - dist / connectDistance) * 0.12 * ((a.scale + b.scale) / 2);
          ctx.strokeStyle = `rgba(77, 255, 140, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // particles, colored by depth
    projected.forEach(p => {
      const depthMix = (p.scale - 0.75) / 0.5;
      const r = Math.round(91 + (77 - 91) * depthMix);
      const g = Math.round(232 + (255 - 232) * depthMix);
      const b = Math.round(255 + (140 - 255) * depthMix);
      const alpha = Math.max(0.15, Math.min(1, depthMix + 0.3));
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.6, p.scale * 1.8), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fill();
    });

    // central glow core
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, RADIUS * 0.5);
    coreGlow.addColorStop(0, 'rgba(77,255,140,0.10)');
    coreGlow.addColorStop(1, 'rgba(77,255,140,0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, RADIUS * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function onPointerMove(clientX, clientY){
    const rect = heroEl.getBoundingClientRect();
    const nx = (clientX - rect.left) / rect.width - 0.5;
    const ny = (clientY - rect.top) / rect.height - 0.5;
    targetTiltY = nx * mouseInfluence * 6;
    targetTiltX = ny * mouseInfluence * 4;
  }

  window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if(e.touches[0]) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  buildParticles();
  resize();
  window.addEventListener('resize', () => { resize(); });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){ if(!rafId) rafId = requestAnimationFrame(draw); }
      else { cancelAnimationFrame(rafId); rafId = null; }
    });
  }, { threshold: 0.05 });
  observer.observe(heroEl);

  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    cancelAnimationFrame(rafId);
    draw();
  }
})();


/* -------------------- 4. DECRYPT-ON-HOVER (Projects) -------------------- */
(function decryptEffect(){
  const rows = document.querySelectorAll('.file-row');
  if(!rows.length) return;

  const scrambleChars = "!<>-_\\/[]{}—=+*^?#________";
  const scrambleSpeed = 28;
  const revealStagger = 18;

  rows.forEach(row => {
    const target = row.querySelector('.decrypt-text');
    const finalText = row.getAttribute('data-decrypt') || '';
    const lockedText = target.getAttribute('data-default') || '';
    let frame = null;
    let isAnimating = false;

    target.textContent = lockedText;

    function scramble(){
      if(isAnimating) cancelAnimationFrame(frame);
      isAnimating = true;
      const len = finalText.length;
      const start = performance.now();

      function update(now){
        const elapsed = now - start;
        const progress = Math.floor(elapsed / scrambleSpeed);
        let out = '';
        for(let i = 0; i < len; i++){
          const lockPoint = i * (revealStagger / scrambleSpeed);
          out += progress > lockPoint
            ? finalText[i]
            : (finalText[i] === ' ' ? ' ' : scrambleChars[Math.floor(Math.random() * scrambleChars.length)]);
        }
        target.textContent = out;
        if(progress < len * (revealStagger / scrambleSpeed) + 6){ frame = requestAnimationFrame(update); }
        else { target.textContent = finalText; isAnimating = false; }
      }
      frame = requestAnimationFrame(update);
    }

    row.addEventListener('mouseenter', scramble);
    row.addEventListener('mouseleave', () => {
      if(isAnimating) cancelAnimationFrame(frame);
      isAnimating = false;
      target.textContent = lockedText;
    });
    row.addEventListener('click', () => {
      if(target.textContent === lockedText){ scramble(); }
      else { target.textContent = lockedText; }
    });
  });
})();

/* -------------------- 5. STATUS BAR CLOCK -------------------- */
(function statusClock(){
  const clock = document.getElementById('statusClock');
  if(!clock) return;

  function update(){
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    clock.textContent = `${hours}:${minutes}:${seconds}`;
  }

  update();
  setInterval(update, 1000);
})();

/* -------------------- 6. SCROLL REVEAL -------------------- */
(function scrollReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!items.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  items.forEach(item => observer.observe(item));
})();

/* -------------------- 7. PHOTO GRID -------------------- */
(function photoGrid(){
  const grid = document.getElementById('photoGrid');
  if(!grid) return;

  // UPDATE YOUR PHOTOS HERE (Change the src link and caption)
  const photos = [
    { src: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&q=80", tag: "FEED_01", caption: "Golden Hour — Field Study" },
    { src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80", tag: "FEED_02", caption: "Night Skyline — Long Exposure" },
    { src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80", tag: "FEED_03", caption: "Mountain Pass — Wide Frame" },
    { src: "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=800&q=80", tag: "FEED_04", caption: "Urban Geometry" },
    { src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80", tag: "FEED_05", caption: "Forest Canopy — Macro" },
    { src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80", tag: "FEED_06", caption: "Coastal Drift" },
  ];

  grid.innerHTML = photos.map(p => `
    <div class="photo-cell">
      <img src="${p.src}" alt="${p.caption}" loading="lazy">
      <div class="photo-scan"></div>
      <div class="photo-tag">${p.tag}</div>
      <div class="photo-caption">${p.caption}</div>
    </div>
  `).join('');
})();

/* -------------------- CONTACT FORM -------------------- */
/* -------------------- 9. SECURE CONTACT FORM -------------------- */
(function contactForm(){
  const form = document.getElementById('contactForm');
  const response = document.getElementById('sshResponse');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    
    // 1. Lock the submit button to prevent spamming
    const submitBtn = form.querySelector('.ssh-submit');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '[ TRANSMITTING... ]';
    submitBtn.style.pointerEvents = 'none';
    submitBtn.style.opacity = '0.6';

    // 2. Prepare the terminal response area
    response.innerHTML = '';
    response.style.color = 'var(--ink-dim)';

    // 3. The simulated hacking/transmission sequence
    const sequence = [
      { text: "$ resolving secure host...", time: 500 },
      { text: "$ handshake successful. initializing AES-256...", time: 700 },
      { text: "$ encrypting payload [====      ] 40%", time: 400, replace: false },
      { text: "$ encrypting payload [========  ] 80%", time: 300, replace: true },
      { text: "$ encrypting payload [==========] 100%", time: 500, replace: true },
      { text: "$ routing through secure proxy nodes...", time: 600, replace: false },
      { text: "$ payload delivered. connection terminated.", color: "var(--green)", glow: true, time: 2500, replace: false }
    ];

    let delayAccumulator = 0;

    // 4. Loop through the sequence and print lines like a real terminal
    sequence.forEach((step, index) => {
      setTimeout(() => {
        
        if (step.replace && response.lastChild) {
          // Replace the last line (creates the animated progress bar effect)
          response.lastChild.textContent = step.text;
        } else {
          // Add a new line
          const line = document.createElement('div');
          line.textContent = step.text;
          if (step.color) line.style.color = step.color;
          if (step.glow) {
            line.style.fontWeight = 'bold';
            line.style.textShadow = '0 0 10px rgba(77, 255, 140, 0.6)';
          }
          response.appendChild(line);
        }

        // 5. Cleanup and reset when the sequence finishes
        if (index === sequence.length - 1) {
          setTimeout(() => {
            form.reset();
            submitBtn.textContent = originalBtnText;
            submitBtn.style.pointerEvents = 'auto';
            submitBtn.style.opacity = '1';
            
            // Optional: clear the terminal after 6 seconds
            setTimeout(() => { response.innerHTML = ''; }, 6000);
          }, step.time);
        }

      }, delayAccumulator);
      
      delayAccumulator += step.time; // Add the time for the next step
    });
  });
})();

document.getElementById('year').textContent = new Date().getFullYear();