// FORGE FX - ripple, particles, screen flash, and level-up overlays
// Extracted from index.html as part of modularization.

// RIPPLE EFFECT
function addRipple(el, e) {
  if (!el) return;
  // Ensure host has position:relative and overflow:hidden
  const cs = getComputedStyle(el);
  if (cs.position === 'static') el.style.position = 'relative';
  el.style.overflow = 'hidden';

  const rect = el.getBoundingClientRect();
  const x = (e?.clientX ?? rect.left + rect.width / 2) - rect.left;
  const y = (e?.clientY ?? rect.top + rect.height / 2) - rect.top;
  const size = Math.max(rect.width, rect.height) * 1.6;

  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `
    width:${size}px; height:${size}px;
    left:${x - size / 2}px; top:${y - size / 2}px;
    animation:rippleAnim .55s ease-out forwards;
  `;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

/* Wire ripple to all nav + action buttons on load */
function initRipples() {
  const selectors = [
    '.bnav-btn', '.btn', '.timer-preset-btn',
    '.muscle-card', '.body-zone', '.template-card',
    '.coach-tab', '.theme-swatch', '.accent-dot-btn',
    '.mo-tab', '.set-add-btn', '.ind-card'
  ];
  document.addEventListener('pointerdown', e => {
    const target = e.target.closest(selectors.join(','));
    if (target) {
      addRipple(target, e);
      sndTap();
      if (typeof hapTap === 'function') hapTap();
    }
  }, { passive: true });
}
initRipples();

// PARTICLE BURST (canvas confetti)
const fxCanvas = document.getElementById('fx-canvas');
const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;
let particles = [];
let fxRaf = null;

function resizeFxCanvas() {
  if (!fxCanvas) return;
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
}
resizeFxCanvas();
window.addEventListener('resize', resizeFxCanvas, { passive: true });

function spawnParticles(x, y, count, colorList) {
  if (!fxCtx) return;
  const colors = colorList || [
    getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#39ff8f',
    '#ffffff', '#ffdd57', '#ff6b6b'
  ];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 7;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 3 + Math.random() * 5;
    const shape = Math.random() > 0.5 ? 'circle' : 'rect';
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      color,
      size,
      shape,
      alpha: 1,
      gravity: 0.25,
      decay: 0.013 + Math.random() * 0.012,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2
    });
  }
  if (!fxRaf) fxLoop();
}

function fxLoop() {
  if (!fxCtx) return;
  fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  particles = particles.filter(p => p.alpha > 0.01);

  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.alpha -= p.decay;
    p.rot += p.rotV;

    fxCtx.save();
    fxCtx.globalAlpha = Math.max(0, p.alpha);
    fxCtx.fillStyle = p.color;
    fxCtx.translate(p.x, p.y);
    fxCtx.rotate(p.rot);

    if (p.shape === 'circle') {
      fxCtx.beginPath();
      fxCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      fxCtx.fill();
    } else {
      fxCtx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.6);
    }
    fxCtx.restore();
  });

  if (particles.length > 0) {
    fxRaf = requestAnimationFrame(fxLoop);
  } else {
    fxRaf = null;
    fxCtx.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
  }
}

/* Burst helpers */
function burstSave() {
  const x = window.innerWidth / 2;
  const y = window.innerHeight * 0.72;
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#39ff8f';
  spawnParticles(x, y, 55, [accent, '#ffffff', '#aaffdd', '#ffdd57']);
}

function burstPR(btnEl) {
  const rect = btnEl ? btnEl.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  spawnParticles(x, y, 90, ['#f39c12', '#ffdd57', '#ff6b6b', '#ffffff', '#ffd700']);
}

// SCREEN FLASH
function flashSave() {
  const el = document.getElementById('save-flash');
  if (!el) return;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
}

function flashPR() {
  const el = document.getElementById('pr-flash');
  if (!el) return;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.classList.add('flash');
  el.addEventListener('animationend', () => el.classList.remove('flash'), { once: true });
}

// LEVEL-UP OVERLAY
function showLevelUp(rankName, icon) {
  const overlay = document.getElementById('levelup-overlay');
  const rankEl = document.getElementById('levelup-rank');
  const iconEl = document.getElementById('levelup-icon');
  if (!overlay) return;
  if (rankEl) rankEl.textContent = rankName || 'WARRIOR';
  if (iconEl) iconEl.textContent = icon || '⚡';
  overlay.classList.remove('show');
  void overlay.offsetWidth;
  overlay.classList.add('show');
  overlay.addEventListener('animationend', () => overlay.classList.remove('show'), { once: true });

  // Gold confetti rain
  for (let i = 0; i < 4; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      spawnParticles(x, -10, 20, ['#ffd700', '#ffdd57', '#f39c12', '#ffffff',
        getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()]);
    }, i * 180);
  }
  sndLevelUp();
  if (typeof hapLevelUp === 'function') hapLevelUp();
}

// Skill unlock celebration
function _showSkillUnlock(skillName, treeIcon, nextSkill) {
  const overlay = document.getElementById('skill-unlock-overlay');
  if (!overlay) return;
  const iconEl = document.getElementById('su-tree-icon');
  const nameEl = document.getElementById('su-skill-name');
  const nextEl = document.getElementById('su-next-skill');
  if (iconEl) iconEl.textContent = treeIcon || '🏆';
  if (nameEl) nameEl.textContent = skillName.toUpperCase();
  if (nextEl) {
    if (nextSkill) {
      const unit = nextSkill.t === 'hold' ? 'secs hold' : 'reps';
      nextEl.innerHTML = `Next up: <strong>${window.FORGE_STORAGE.esc(nextSkill.n)}</strong> · Target ${nextSkill.target} ${unit}`;
    } else {
      nextEl.innerHTML = '🏆 TREE COMPLETE — you\'ve mastered this path!';
    }
  }
  overlay.classList.remove('show');
  void overlay.offsetWidth;
  overlay.classList.add('show');
  overlay.addEventListener('animationend', () => overlay.classList.remove('show'), { once: true });

  const accentClr = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  for (let i = 0; i < 6; i++) {
    setTimeout(() => {
      const x = (i % 3 === 0) ? 0.2 : (i % 3 === 1) ? 0.5 : 0.8;
      spawnParticles(x * window.innerWidth, -10, 22,
        ['#ffd700', '#ffdd57', '#ff9f5a', '#ffffff', accentClr]);
    }, i * 190);
  }
  if (typeof sndPR === 'function') sndPR();
  if (typeof hapPR === 'function') hapPR();
}
