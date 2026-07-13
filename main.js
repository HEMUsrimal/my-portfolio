/* ====================================================================
   CYBERPUNK PORTFOLIO — MAIN JAVASCRIPT (WITH MOTION ONE & UPGRADES)
==================================================================== */

import { animate, inView, stagger, spring } from "motion";

/* --- UTILITY: PERFORMANCE OPTIMIZATION --- */
// Debounce function prevents expensive functions (like canvas resize) from firing too often
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => { clearTimeout(timeout); func(...args); };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
import * as THREE from 'three';

// 1. Set up the Scene, Camera, and Renderer
const container = document.getElementById('canvas-3d-container');
if (container) {
  const scene = new THREE.Scene();
  const initWidth = container.clientWidth || window.innerWidth;
  const initHeight = container.clientHeight || 600;
  const camera = new THREE.PerspectiveCamera(75, initWidth / initHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true }); // alpha: true makes background transparent

  renderer.setSize(initWidth, initHeight);
  container.appendChild(renderer.domElement);

  // 2. Create a 3D Object (A glowing Cyberpunk Wireframe Cube)
  const geometry = new THREE.BoxGeometry(2.5, 2.5, 2.5); // Slightly larger cube to fit the background nicely
  const material = new THREE.MeshBasicMaterial({
    color: 0x00e5ff, // Cyan
    wireframe: true  // Gives it that hacker/terminal vibe
  });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  camera.position.z = 5;

  // 3. Animate the Object (The Render Loop)
  function animate3D() {
    requestAnimationFrame(animate3D);

    // Rotate the object on its axes
    cube.rotation.x += 0.006;
    cube.rotation.y += 0.006;

    renderer.render(scene, camera);
  }

  animate3D();

  // Resize handler to keep the canvas responsive to its parent size
  window.addEventListener('resize', () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || 600;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

/* -------------------- 0. PRELOADER & PAGE LOAD ANIMATIONS -------------------- */
(function initPreloader() {
  const preloader = document.getElementById('preloader');
  const loadingPhase = document.getElementById('loading-phase');
  const avatarContainer = document.getElementById('avatar-container');
  const faceContainer = document.getElementById('preloader-3d-container');

  if (!preloader || !loadingPhase || !avatarContainer || !faceContainer) return;

  // Lock scrolling while preloader is active
  document.body.style.overflow = 'hidden';
  window.scrollTo(0, 0); // Always start at the very top

  // Preloader 3D Face Setup
  const fScene = new THREE.Scene();
  const fCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  const fRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  fRenderer.setSize(280, 280);
  fRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  faceContainer.appendChild(fRenderer.domElement);

  fCamera.position.z = 12.0; // Zoomed in camera position to scale up the 3D image size in the viewport

  let particleSystem;
  let geometry;
  let material;
  let velocities = [];
  let isExploding = false;
  let explosionProgress = 0;

  // Load the image to parse it into 3D particles
  const img = new Image();
  img.src = 'assets/image.JPG';
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    const imgCanvas = document.createElement('canvas');
    // Aspect-ratio matching resolution for 413:531
    const sizeX = 80;
    const sizeY = 104;
    imgCanvas.width = sizeX;
    imgCanvas.height = sizeY;
    const imgCtx = imgCanvas.getContext('2d');

    // Draw the entire image without cropping to show the full head and body
    imgCtx.drawImage(img, 0, 0, img.width, img.height, 0, 0, sizeX, sizeY);

    const imgData = imgCtx.getImageData(0, 0, sizeX, sizeY).data;

    const positions = [];
    const origPositions = [];
    const colors = [];
    const baseColors = []; // Storing base colors to reference in scan sweep brightness calculation
    const spacing = 0.098; // Increased spacing to spread the dots out by 30% (less dense, clearer features)

    // 1. Build background color profiles from margins to perform clean chroma-keying
    const bgProfile = [];
    const getPixel = (px, py) => {
      const idx = (py * sizeX + px) * 4;
      return { r: imgData[idx], g: imgData[idx + 1], b: imgData[idx + 2] };
    };

    // Sample from left border (x = 2), right border (x = sizeX - 3), and top border (y = 2)
    for (let y = 0; y < sizeY; y += 4) {
      bgProfile.push(getPixel(2, y));
      bgProfile.push(getPixel(sizeX - 3, y));
    }
    for (let x = 0; x < sizeX; x += 4) {
      bgProfile.push(getPixel(x, 2));
    }

    for (let y = 0; y < sizeY; y++) {
      for (let x = 0; x < sizeX; x++) {
        // Normalized coordinates (0 to 1)
        const nx = x / sizeX;
        const ny = y / sizeY;

        const idx = (y * sizeX + x) * 4;
        const r = imgData[idx];
        const g = imgData[idx + 1];
        const b = imgData[idx + 2];
        const a = imgData[idx + 3];

        if (a < 50) continue;

        // Skip background pixels by checking Euclidean distance in RGB color space
        let minDistance = 255;
        for (let i = 0; i < bgProfile.length; i++) {
          const bg = bgProfile[i];
          const dist = Math.sqrt(
            Math.pow(r - bg.r, 2) +
            Math.pow(g - bg.g, 2) +
            Math.pow(b - bg.b, 2)
          );
          if (dist < minDistance) {
            minDistance = dist;
          }
        }
        // If color matches the margin background profile close enough, skip it
        if (minDistance < 32) continue;

        const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Space coordinates centered at (0, 0)
        const px = (x - sizeX / 2) * spacing;
        const py = -(y - sizeY / 2) * spacing;

        // Remove barrel distortion: Keep the projection flat with a very subtle horizontal curvature
        const dx = nx - 0.5;
        const curveZ = (1.0 - (dx * dx) * 4.0) * 0.25; // Very subtle rounding (max 0.25 depth) to prevent warping the face/body

        // Maintain sharp, accurate face/body detail depth directly from image luminance
        const detailZ = l * 0.65;
        const pz = curveZ + detailZ - 0.45;

        positions.push(px, py, pz);
        origPositions.push(px, py, pz);

        const color = new THREE.Color();
        // Theme Colors: Head (Cyan), Torso (Emerald), Hips (Magenta)
        if (ny < 0.32) {
          color.setRGB(0.0, 0.85, 1.0); // Neon Cyan
        } else if (ny < 0.68) {
          color.setRGB(0.1, 0.95, 0.4); // Neon Emerald Green
        } else {
          color.setRGB(1.0, 0.0, 0.5); // Neon Violet/Magenta
        }

        // Apply shade factoring using luminance
        color.multiplyScalar(0.45 + l * 0.55);

        colors.push(color.r, color.g, color.b);
        baseColors.push(color.r, color.g, color.b);

        velocities.push(
          (Math.random() - 0.5) * 0.1 + px * 0.15,
          (Math.random() - 0.5) * 0.1 + py * 0.15,
          (Math.random() - 0.5) * 0.1 + pz * 0.15
        );
      }
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    // Dynamic procedural creation of a soft glow circle particle texture
    function createGlowTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
      grad.addColorStop(0.35, 'rgba(0, 229, 255, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 16, 16);
      return new THREE.CanvasTexture(canvas);
    }

    material = new THREE.PointsMaterial({
      size: 0.15, // Soft glowing circular particle sizes (increased for visibility)
      vertexColors: true,
      transparent: true,
      opacity: 0.0, // Fade in initially
      blending: THREE.AdditiveBlending,
      map: createGlowTexture(),
      depthWrite: false
    });

    particleSystem = new THREE.Points(geometry, material);
    fScene.add(particleSystem);

    let time = 0;

    function render() {
      requestAnimationFrame(render);
      time += 0.015;

      if (particleSystem) {
        if (!isExploding) {
          // 1. Slow idle rotation
          particleSystem.rotation.y += 0.005;

          // 2. Slow breathing wiggle and sweep scanline highlighting
          const posAttr = geometry.attributes.position;
          const posArray = posAttr.array;

          const colorAttr = geometry.attributes.color;
          const colorArray = colorAttr.array;

          // Scanning sweep wave moving vertically
          const sweepY = Math.sin(time * 1.5) * 4.0;

          for (let i = 0; i < posArray.length; i += 3) {
            const idx = i / 3;
            const origPx = origPositions[idx * 3];
            const origPy = origPositions[idx * 3 + 1];
            const origPz = origPositions[idx * 3 + 2];

            // Breathing noise drift
            posArray[i] = origPx + Math.sin(time * 2.0 + origPy * 3.0) * 0.03;
            posArray[i + 1] = origPy + Math.cos(time * 1.5 + origPx * 3.0) * 0.02;
            posArray[i + 2] = origPz + Math.sin(time + origPx * 2.0) * 0.03;

            // Sweeper highlight
            const distToSweep = Math.abs(posArray[i + 1] - sweepY);
            const baseR = baseColors[idx * 3];
            const baseG = baseColors[idx * 3 + 1];
            const baseB = baseColors[idx * 3 + 2];

            if (distToSweep < 0.45) {
              const boost = 1.0 + (1.0 - distToSweep / 0.45) * 1.3; // Glow wave boost
              colorArray[idx * 3] = Math.min(1.0, baseR * boost);
              colorArray[idx * 3 + 1] = Math.min(1.0, baseG * boost);
              colorArray[idx * 3 + 2] = Math.min(1.0, baseB * boost);
            } else {
              colorArray[idx * 3] = baseR;
              colorArray[idx * 3 + 1] = baseG;
              colorArray[idx * 3 + 2] = baseB;
            }
          }

          posAttr.needsUpdate = true;
          colorAttr.needsUpdate = true;

          if (material.opacity < 1.0) {
            material.opacity += 0.02; // Fade in smoothly
          }
        } else {
          // Explode points
          const posAttr = geometry.attributes.position;
          const posArray = posAttr.array;

          explosionProgress += 0.015;

          for (let i = 0; i < posArray.length; i += 3) {
            const idx = i / 3;
            posArray[i] += velocities[idx * 3] * 0.4;
            posArray[i + 1] += velocities[idx * 3 + 1] * 0.4;
            posArray[i + 2] += velocities[idx * 3 + 2] * 0.4;
          }

          posAttr.needsUpdate = true;
          particleSystem.rotation.y += 0.05;
          fCamera.position.z += 0.15;
          material.opacity = Math.max(0, 1 - explosionProgress * 1.5);
        }
      }

      fRenderer.render(fScene, fCamera);
    }

    render();
  };

  window.triggerPreloader3DExplosion = function () {
    isExploding = true;
  };

  // Step 1: 3-Second Loading Phase
  setTimeout(() => {
    // Fade out the loading bar and text
    animate(loadingPhase, { opacity: 0, scale: 0.9 }, { duration: 0.4 }).finished.then(() => {
      loadingPhase.style.display = 'none';
      avatarContainer.style.display = 'flex';

      // Step 2: Pop the preloader text elements in smoothly
      animate(".loaded-text", { opacity: [0, 1], y: [-15, 0] }, { delay: 0.2, duration: 0.6, easing: "ease-out" });
      animate("#scroll-prompt", { opacity: [0, 1], y: [15, 0] }, { delay: 0.4, duration: 0.6, easing: "ease-out" });

      // Listen for the user's first interaction to trigger the magic zoom
      let transitioned = false;
      function triggerTransition() {
        if (transitioned) return;
        transitioned = true;

        // Clean up all listeners
        window.removeEventListener('wheel', triggerTransition);
        window.removeEventListener('touchmove', triggerTransition);
        preloader.removeEventListener('click', triggerTransition);
        window.removeEventListener('keydown', triggerTransition);

        handlePreloaderScroll();
      }

      window.addEventListener('wheel', triggerTransition, { passive: true });
      window.addEventListener('touchmove', triggerTransition, { passive: true });
      preloader.addEventListener('click', triggerTransition);
      window.addEventListener('keydown', triggerTransition);
    });
  }, 3000); // 3000 milliseconds = 3 Seconds

  function handlePreloaderScroll() {
    // Hide text instantly
    animate(".loaded-text, #scroll-prompt", { opacity: 0, scale: 0.8 }, { duration: 0.2 });

    // Trigger the 3D particle explosion
    if (window.triggerPreloader3DExplosion) {
      window.triggerPreloader3DExplosion();
    }

    // Zoom the 3D container
    animate(faceContainer,
      {
        scale: 6,
        opacity: [1, 1, 0]
      },
      {
        duration: 1.5,
        easing: [0.7, 0, 0.84, 0]
      }
    );

    // Fade out the black background
    animate(preloader, { backgroundColor: "rgba(5, 8, 5, 0)" }, { duration: 0.8, delay: 0.7 }).finished.then(() => {
      preloader.style.display = 'none';
      document.body.style.overflow = '';

      // Step 3: Trigger the Portfolio's Main Animations
      startPortfolioAnimations();
    });
  }

  function startPortfolioAnimations() {
    animate(".crt-screen", { opacity: [0, 1] }, { duration: 0.6, easing: "ease-in-out" });
    animate(
      ".interactive-terminal, #core-canvas, .hero-inner",
      { opacity: [0, 1], y: [40, 0] },
      { delay: stagger(0.15), duration: 0.8, easing: [0.16, 1, 0.3, 1] }
    );
  }
})();

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

  terminalInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const cmd = terminalInput.value.trim().toLowerCase();
      terminalInput.value = '';
      if (!cmd) return;

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
        case 'skills': window.location.hash = '#stack'; break;
        case 'experience': window.location.hash = '#experience'; break;
        case 'projects': window.location.hash = '#projects'; break;
        case 'publications': window.location.hash = '#publications'; break;
        case 'certifications': window.location.hash = '#certifications'; break;
        case 'volunteer': window.location.hash = '#volunteer'; break;
        case 'photography': window.location.hash = '#photography'; break;
        case 'gallery': window.location.hash = '#gallery'; break;
        case 'contact': window.location.hash = '#contact'; break;
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
        case 'clear': bootContainer.innerHTML = ''; break;
        case 'sudo': responseEl.innerHTML = "<span style='color:var(--magenta)'>Permission denied. Intrusion event logged. Contacting network security node.</span>"; break;
        default: responseEl.innerHTML = `Unknown protocol: '${escapeHtml(cmd)}'. Type 'help' to review catalog.`; break;
      }

      if (cmd !== 'clear') bootContainer.appendChild(responseEl);
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  });

  terminalBody.addEventListener('click', () => terminalInput.focus());
})();

/* -------------------- 2. MATRIX DIGITAL RAIN (EFFICIENCY UPGRADED) -------------------- */
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
  // Using debounce for better performance on window resize
  window.addEventListener('resize', debounce(resize, 200));
  draw();
})();

/* -------------------- 3. DECRYPT-ON-HOVER -------------------- */
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
  inView(".reveal", (info) => {
    animate(
      info.target,
      { opacity: [0, 1], y: [60, 0] },
      { type: spring, stiffness: 100, damping: 20 }
    );
  });
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
    <div class="photo-cell" style="opacity: 0;">
      <img src="${p.src}" alt="${p.caption}" loading="lazy">
      <div class="photo-tag">${p.tag}</div>
      <div class="photo-caption">${p.caption}</div>
    </div>
  `).join('');

  inView("#photoGrid", () => {
    animate(
      ".photo-cell",
      { opacity: [0, 1], y: [40, 0], scale: [0.95, 1] },
      { delay: stagger(0.15), duration: 0.7, easing: "ease-out" }
    );
  });
})();

/* -------------------- 7. ACTIVE CONTACT FORM -------------------- */
(function contactForm() {
  // Initialize EmailJS
  if (typeof emailjs !== 'undefined') {
    emailjs.init("blxXKEpaHDQfM33-4");
  }

  const form = document.getElementById('terminal-contact-form');
  const response = document.getElementById('sshResponse');
  if (!form || !response) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const nameVal = document.getElementById('f-name').value;
    const emailVal = document.getElementById('f-email').value;
    const msgVal = document.getElementById('f-msg').value;
    const submitBtn = document.getElementById('transmit-btn');
    const originalBtnText = "[ TRANSMIT MESSAGE ]";

    submitBtn.textContent = '[ TRANSMITTING... ]';
    submitBtn.style.pointerEvents = 'none';
    submitBtn.style.opacity = '0.5';
    response.innerHTML = '';
    response.style.color = 'var(--green)';

    // Cyberpunk step sequence logging
    const sequence = [
      { text: "$ initializing handshake protocols...", time: 300 },
      { text: "$ resolving DNS nodes for udayangasrimaluni2002@gmail.com...", time: 400 },
      { text: "$ connection established to udayangasrimaluni2002@gmail.com...", time: 350 },
      { text: `$ encoding client identity details: [${nameVal}]...`, time: 500 },
      { text: "$ packaging secure payload...", time: 400 },
      { text: "$ sending payload packets [======    ] 60%...", time: 500 },
      { text: "$ sending payload packets [==========] 100%...", time: 300 },
      { text: "$ transaction registered. calculating cryptographic checksum...", time: 450 }
    ];

    let delay = 0;
    sequence.forEach((step, index) => {
      setTimeout(() => {
        const line = document.createElement('div');
        line.textContent = step.text;
        if (step.color) line.style.color = step.color;
        response.appendChild(line);

        const scrollContainer = document.querySelector('.ssh-body');
        if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }, delay);
      delay += step.time;
    });

    // Trigger EmailJS dispatch
    emailjs.sendForm('service_1jp6jz7', 'template_4s2acm3', e.target, 'blxXKEpaHDQfM33-4')
      .then(function() {
        // On Success
        setTimeout(() => {
          const lineSuccess = document.createElement('div');
          lineSuccess.textContent = "$ [SUCCESS] payload securely transmitted to udayangasrimaluni2002@gmail.com.";
          lineSuccess.style.color = "var(--cyan)";
          response.appendChild(lineSuccess);

          const lineLogged = document.createElement('div');
          lineLogged.textContent = "$ [LOGGED] local record registered under 'messages' profile.";
          lineLogged.style.color = "var(--green)";
          response.appendChild(lineLogged);

          const scrollContainer = document.querySelector('.ssh-body');
          if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;

          submitBtn.innerHTML = '<span style="color: var(--green);">[ TRANSMISSION SUCCESSFUL ]</span>';
          submitBtn.style.opacity = '1';

          const existing = JSON.parse(localStorage.getItem('sent_messages') || '[]');
          existing.push({ name: nameVal, email: emailVal, message: msgVal });
          localStorage.setItem('sent_messages', JSON.stringify(existing));

          form.reset();

          setTimeout(() => {
            submitBtn.textContent = originalBtnText;
            submitBtn.style.pointerEvents = 'auto';
            setTimeout(() => { response.innerHTML = ''; }, 5000);
          }, 4000);
        }, Math.max(delay, 2000));
      })
      .catch(error => {
        // On Error
        console.error("EmailJS Detailed Error:", error.text || error);
        setTimeout(() => {
          const lineError = document.createElement('div');
          lineError.textContent = "$ [ERROR] secure transmission protocol failed. connection abort.";
          lineError.style.color = "var(--magenta)";
          response.appendChild(lineError);

          const scrollContainer = document.querySelector('.ssh-body');
          if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;

          submitBtn.innerHTML = '<span style="color: var(--magenta);">[ CONNECTION FAILED - RETRY ]</span>';
          submitBtn.style.opacity = '1';
          submitBtn.style.pointerEvents = 'auto';

          setTimeout(() => {
            submitBtn.textContent = originalBtnText;
          }, 4000);
        }, Math.max(delay, 2000));
      });
  });
})();

/* -------------------- 8. ROTATABLE 3D SERVER GLOBE (EFFICIENCY UPGRADED) -------------------- */
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

  const style = getComputedStyle(document.documentElement);
  const colorGreen = style.getPropertyValue('--green').trim() || '#39ff14';
  const colorCyan = style.getPropertyValue('--cyan').trim() || '#00e5ff';
  const colorMagenta = style.getPropertyValue('--magenta').trim() || '#ff007f';

  const particles = [];
  const latRings = 9, dotsPerLat = 22;
  for (let r = 1; r < latRings; r++) {
    const lat = -Math.PI / 2 + (Math.PI * r) / latRings;
    const y = Math.sin(lat);
    const ringRad = Math.cos(lat);
    for (let d = 0; d < dotsPerLat; d++) {
      const lon = (2 * Math.PI * d) / dotsPerLat;
      particles.push({ x: ringRad * Math.cos(lon), y, z: ringRad * Math.sin(lon), color: colorGreen, isLink: true });
    }
  }

  const lonLines = 8, dotsPerLon = 18;
  for (let l = 0; l < lonLines; l++) {
    const lon = (Math.PI * l) / lonLines;
    for (let d = 0; d < dotsPerLon; d++) {
      const lat = -Math.PI / 2 + (Math.PI * d) / dotsPerLon;
      particles.push({ x: Math.cos(lat) * Math.cos(lon), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(lon), color: colorCyan });
    }
  }

  particles.push({ x: 0, y: 1, z: 0, color: colorMagenta }, { x: 0, y: -1, z: 0, color: colorMagenta });

  const serverNodes = [
    { x: 0.15, y: 0.25, z: -0.15, size: 5, color: colorMagenta },
    { x: -0.2, y: -0.3, z: 0.1, size: 5, color: colorMagenta },
    { x: -0.1, y: 0.35, z: -0.25, size: 5, color: colorMagenta },
    { x: 0.25, y: -0.2, z: 0.2, size: 5, color: colorMagenta }
  ];

  // 3D Orbital Saturn-like Inner Ring Text: "this is udayanga world"
  const textParticles = [];
  const textString = " ✦ this is udayanga world ✦ this is udayanga world ";
  const textRadius = 1.18; // Inner Saturn ring radius
  const tiltX = 0.45;      // Slanted front-to-back
  const tiltZ = 0.15;      // Slanted side-to-side

  for (let i = 0; i < textString.length; i++) {
    const angle = (i / textString.length) * Math.PI * 2;
    const rx = Math.cos(angle) * textRadius;
    const ry = 0;
    const rz = Math.sin(angle) * textRadius;

    // Apply Saturn tilt rotations
    const x1 = rx;
    const y1 = ry * Math.cos(tiltX) - rz * Math.sin(tiltX);
    const z1 = ry * Math.sin(tiltX) + rz * Math.cos(tiltX);

    const x2 = x1 * Math.cos(tiltZ) - y1 * Math.sin(tiltZ);
    const y2 = x1 * Math.sin(tiltZ) + y1 * Math.cos(tiltZ);
    const z2 = z1;

    textParticles.push({
      x: x2,
      y: y2,
      z: z2,
      char: textString[i],
      color: colorMagenta // Neon magenta color
    });
  }

  /* --- NEW: SATURN RING 3D NAVIGATION (HTML ELEMENTS) --- */
  const navLinksData = [
    { name: "01_stack", hash: "#stack" },
    { name: "02_experience", hash: "#experience" },
    { name: "03_projects", hash: "#projects" },
    { name: "04_publications", hash: "#publications" },
    { name: "05_certifications", hash: "#certifications" },
    { name: "06_volunteer", hash: "#volunteer" },
    { name: "07_photography", hash: "#photography" },
    { name: "08_contact", hash: "#contact" }
  ];

  // Find relative canvas wrapper so HTML overlay moves exactly with the 3D canvas!
  const canvasWrapper = canvas.parentElement || hero;
  const orbitContainer = document.createElement('div');
  orbitContainer.className = 'orbit-container';
  canvasWrapper.appendChild(orbitContainer);

  const orbitRadius = 1.58; // Outer Saturn ring radius
  const orbitTiltX = 0.45;  // Same slant to align parallel
  const orbitTiltZ = 0.15;

  const orbitElements = navLinksData.map((link, index) => {
    const el = document.createElement('a');
    el.href = link.hash;
    el.className = 'orbit-link reveal'; // Added reveal so it triggers hover custom cursor
    el.textContent = link.name;

    // Smooth scrolling for links
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const targetEl = document.querySelector(link.hash);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
        window.location.hash = link.hash;
      }
    });

    orbitContainer.appendChild(el);
    return {
      el: el,
      baseAngle: (index / navLinksData.length) * Math.PI * 2 // Distribute in a perfect circle
    };
  });

  function resize() {
    W = canvas.width = canvas.clientWidth;
    H = canvas.height = canvas.clientHeight;
    radius = Math.min(W, H) * 0.35;
  }

  function project(p, cx, cy) {
    let x1 = p.x * Math.cos(rotY) - p.z * Math.sin(rotY);
    let z1 = p.x * Math.sin(rotY) + p.z * Math.cos(rotY);
    let y2 = p.y * Math.cos(rotX) - z1 * Math.sin(rotX);
    let z2 = p.y * Math.sin(rotX) + z1 * Math.cos(rotX);
    const perspective = 3.5;
    const scale = perspective / (perspective + z2);

    return { x: cx + x1 * radius * scale, y: cy + y2 * radius * scale, z: z2, scale: scale, color: p.color, size: p.size || 2.2 };
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;

    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.38);
    coreGlow.addColorStop(0, 'rgba(0, 229, 255, 0.3)');
    coreGlow.addColorStop(0.6, 'rgba(255, 0, 127, 0.08)');
    coreGlow.addColorStop(1, 'rgba(5, 8, 5, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.38, 0, Math.PI * 2);
    ctx.fill();

    if (isHovered && !isDragging) {
      rotY += (targetRotY - rotY) * 0.06;
      rotX += (targetRotX - rotX) * 0.06;
    } else if (!isDragging) {
      rotY += 0.0025;
      rotX += (0.3 - rotX) * 0.06;
    }

    const projected = [...particles, ...serverNodes, ...textParticles].map(p => {
      const proj = project(p, cx, cy);
      if (p.char) proj.char = p.char;
      return proj;
    }).sort((a, b) => b.z - a.z);

    ctx.lineWidth = 0.5;
    for (let i = 0; i < projected.length; i++) {
      if (projected[i].size === 5) {
        for (let j = 0; j < projected.length; j++) {
          if (projected[j].size !== 5 && !projected[j].char && Math.random() > 0.94) {
            const dx = projected[i].x - projected[j].x, dy = projected[i].y - projected[j].y;
            if (Math.sqrt(dx * dx + dy * dy) < radius * 0.5) {
              ctx.strokeStyle = `rgba(0, 229, 255, ${0.15 * (1.8 - projected[i].z)})`;
              ctx.beginPath(); ctx.moveTo(projected[i].x, projected[i].y); ctx.lineTo(projected[j].x, projected[j].y); ctx.stroke();
            }
          }
        }
      }
    }

    projected.forEach(p => {
      ctx.beginPath();
      if (p.char) {
        // Draw 3D projected character
        ctx.font = `bold ${Math.max(9, Math.round(p.scale * 13))}px monospace`;
        ctx.fillStyle = p.color;
        // Text opacity fades out towards the back of the sphere
        ctx.globalAlpha = Math.max(0.08, Math.min(1.0, (1.8 - p.z) / 2));
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.char, p.x, p.y);
      } else {
        // Draw standard particle dot
        ctx.arc(p.x, p.y, Math.max(1, p.scale * p.size), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.18, Math.min(1, (1.8 - p.z) / 2));
        ctx.fill();
      }
    });

    ctx.globalAlpha = 1.0;

    /* --- NEW: UPDATE HTML ORBIT NAV POSITIONS IN REAL-TIME --- */
    const orbitTime = Date.now() * 0.0002; // Speed of the spinning ring

    orbitElements.forEach(item => {
      // Calculate 3D point on the ring
      const currentAngle = item.baseAngle + orbitTime;
      const rx = Math.cos(currentAngle) * orbitRadius;
      const ry = 0;
      const rz = Math.sin(currentAngle) * orbitRadius;

      // Apply Saturn tilt rotations so the HTML buttons rotate parallel to the text ring
      const x1 = rx;
      const y1 = ry * Math.cos(orbitTiltX) - rz * Math.sin(orbitTiltX);
      const z1 = ry * Math.sin(orbitTiltX) + rz * Math.cos(orbitTiltX);

      const x2 = x1 * Math.cos(orbitTiltZ) - y1 * Math.sin(orbitTiltZ);
      const y2 = x1 * Math.sin(orbitTiltZ) + y1 * Math.cos(orbitTiltZ);
      const z2 = z1;

      const point3D = { x: x2, y: y2, z: z2 };

      // Project to 2D HTML coordinates using EXACT SAME math as the Canvas!
      const proj = project(point3D, cx, cy);

      // Update HTML link position & size
      item.el.style.transform = `translate3d(${proj.x}px, ${proj.y}px, 0) translate(-50%, -50%) scale(${proj.scale})`;

      // 3D Depth: Fade out when it goes behind the globe, make bright when in front
      const opacity = Math.max(0.1, (1.8 - proj.z) / 2);
      item.el.style.opacity = opacity;

      // Z-Index: Put links behind the globe when they orbit to the back
      item.el.style.zIndex = Math.floor((2 - proj.z) * 100);
    });
    /* -------------------------------------------------------- */

    requestAnimationFrame(draw);
  }

  hero.addEventListener('mousemove', (e) => {
    if (isDragging) return;
    isHovered = true;
    const rect = canvas.getBoundingClientRect();
    targetRotY = ((e.clientX - (rect.left + rect.width / 2)) / rect.width) * 1.6;
    targetRotX = 0.3 - ((e.clientY - (rect.top + rect.height / 2)) / rect.height) * 1.2;
  });

  hero.addEventListener('mouseleave', () => { isHovered = false; });
  canvas.addEventListener('mousedown', (e) => { isDragging = true; prevX = e.clientX; prevY = e.clientY; });
  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    rotY += (e.clientX - prevX) * 0.005; rotX += (e.clientY - prevY) * 0.005;
    prevX = e.clientX; prevY = e.clientY;
  });
  window.addEventListener('mouseup', () => { isDragging = false; });

  canvas.addEventListener('touchstart', (e) => { if (e.touches[0]) { isDragging = true; prevX = e.touches[0].clientX; prevY = e.touches[0].clientY; } }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    rotY += (e.touches[0].clientX - prevX) * 0.005; rotX += (e.touches[0].clientY - prevY) * 0.005;
    prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
  }, { passive: true });
  window.addEventListener('touchend', () => { isDragging = false; });

  resize();
  // Using debounce for better performance on window resize
  window.addEventListener('resize', debounce(resize, 200));
  draw();
})();

/* -------------------- 9. DYNAMIC GITHUB PROJECTS LOAD -------------------- */
(function loadGithubProjects() {
  const container = document.getElementById('projectsList');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const row = e.target.closest('.file-row');
    if (row && row.getAttribute('data-url')) {
      window.open(row.getAttribute('data-url'), '_blank', 'noreferrer noopener');
    }
  });

  const username = "HEMUsrimal";
  fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=12`)
    .then(res => { if (!res.ok) throw new Error("API limit"); return res.json(); })
    .then(repos => {
      const sorted = repos.filter(r => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count);
      if (sorted.length === 0) return;

      container.innerHTML = '';
      sorted.forEach(repo => {
        const row = document.createElement('div');
        row.className = 'file-row';
        row.style.opacity = '0';
        row.setAttribute('data-decrypt', repo.description || "Active software deployment block.");
        row.setAttribute('data-url', repo.html_url);
        row.innerHTML = `
          <div class="file-row-top">
            <div class="file-name">${repo.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}<span class="ext">.git</span></div>
            <div class="file-status">★ ${repo.stargazers_count} | ⑂ ${repo.forks_count} — [DECRYPT]</div>
          </div>
          <div class="decrypt-text" data-default="[file locked — awaiting decryption key]"></div>
          <div class="file-progress"></div>
        `;
        container.appendChild(row);
      });

      animate(".file-row", { opacity: [0, 1], x: [-30, 0] }, { delay: stagger(0.08), duration: 0.5, easing: "ease-out" });
    })
    .catch(err => console.warn("Falling back to static portfolio system: ", err));
})();

document.getElementById('year').textContent = new Date().getFullYear();

/* ====================================================================
   NEW FEATURES ADDED (EFFICIENCY & FRAMER STYLE)
==================================================================== */

/* -------------------- 10. CUSTOM CYBERPUNK CURSOR -------------------- */
(function customCursor() {
  // Create cursor elements dynamically so you don't have to touch HTML
  const cursorDot = document.createElement('div');
  const cursorRing = document.createElement('div');

  cursorDot.className = 'cyber-cursor-dot';
  cursorRing.className = 'cyber-cursor-ring';

  document.body.appendChild(cursorDot);
  document.body.appendChild(cursorRing);

  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Dot follows instantly
    cursorDot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  });

  // Smooth trailing effect for the ring (Hardware accelerated via requestAnimationFrame)
  function renderRing() {
    ringX += (mouseX - ringX) * 0.15; // The 0.15 controls the "drag/lag" smoothness
    ringY += (mouseY - ringY) * 0.15;
    cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    requestAnimationFrame(renderRing);
  }
  requestAnimationFrame(renderRing);
})();

/* -------------------- 11. MAGNETIC BUTTONS (FRAMER EFFECT) -------------------- */
(function magneticElements() {
  // Apply magnetic effect to interactive elements like submit buttons or project rows
  const magneticItems = document.querySelectorAll('.ssh-submit, .file-row-top');

  magneticItems.forEach((item) => {
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      // Calculate mouse position relative to the center of the element
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Pull element towards cursor smoothly
      animate(item, { x: x * 0.2, y: y * 0.2 }, { duration: 0.2, easing: "ease-out" });
    });

    // Snap back into place when mouse leaves
    item.addEventListener('mouseleave', () => {
      animate(item, { x: 0, y: 0 }, { type: spring, stiffness: 300, damping: 15 });
    });
  });
})();