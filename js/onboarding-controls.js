function _onbGoto(step, dir) {
  const prevStep = _onbStep;
  _onbStep = step;

  // Animate slides
  document.querySelectorAll('.onb-step').forEach(s => {
    s.classList.remove('active', 'slide-left');
  });
  const prevEl = document.getElementById('onb-step-' + prevStep);
  const nextEl = document.getElementById('onb-step-' + step);
  if (dir !== undefined && prevEl && prevEl !== nextEl && dir >= 0) {
    prevEl.classList.add('slide-left');
  }
  if (nextEl) nextEl.classList.add('active');

  // Render summary on done step
  if (step === 3) _onbRenderSummary();

  // Auto-focus name input
  setTimeout(() => {
    if (step === 1) document.getElementById('onb-name')?.focus();
  }, 360);
}

function _onbNext() {
  if (_onbStep === 3) {
    _onbComplete();
    return;
  }
  if (_onbStep === 1) {
    _onbData.name = document.getElementById('onb-name')?.value.trim() || _onbData.name;
  }
  _onbGoto(_onbStep + 1, 1);
}

function _onbBack() {
  if (_onbStep <= 0) return;
  _onbGoto(_onbStep - 1, -1);
}

function _onbSelectGoal(goal) {
  _onbData.goal = goal;
  document.querySelectorAll('.onb-goal-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.goal === goal);
  });
  // Auto-advance to done step after brief visual confirmation
  setTimeout(() => _onbGoto(3, 1), 350);
}

function _onbRenderSummary() {
  const el = document.getElementById('onb-summary');
  if (!el) return;
  const name = document.getElementById('onb-name')?.value.trim() || _onbData.name || '';
  const goalMap = { muscle: 'Build Muscle', fat: 'Burn Fat', strength: 'Get Stronger', active: 'Stay Active' };
  let html = '';
  if (name) html += `<div class="onb-summary-row"><span class="onb-summary-key">Name</span><span class="onb-summary-val">${name}</span></div>`;
  if (_onbData.goal) html += `<div class="onb-summary-row"><span class="onb-summary-key">Goal</span><span class="onb-summary-val">${goalMap[_onbData.goal] || _onbData.goal}</span></div>`;
  el.innerHTML = html;
}
