(function () {
  const PROFILE_DISMISS_KEY = 'forge_profile_setup_dismissed_v1';
  const COACH_DISMISS_KEY = 'forge_coach_goal_prompt_dismissed_v1';

  function _setupIsAr() {
    return (typeof currentLang !== 'undefined') && currentLang === 'ar';
  }

  function _setupTx(en, ar) {
    return _setupIsAr() ? ar : en;
  }

  function _profileRef() {
    if (typeof userProfile === 'object' && userProfile) return userProfile;
    return {};
  }

  function _missingSetup(profile) {
    const safe = profile || _profileRef();
    return {
      name: !String(safe.name || '').trim(),
      goal: !String(safe.goal || '').trim()
    };
  }

  function _setupDone(profile) {
    const missing = _missingSetup(profile);
    return !missing.name && !missing.goal;
  }

  function _hide(el) {
    if (el) el.style.display = 'none';
  }

  function _show(el) {
    if (el) el.style.display = '';
  }

  window.renderProfileSetupPrompt = function renderProfileSetupPrompt() {
    const card = document.getElementById('profile-setup-card');
    if (!card) return false;

    const profile = _profileRef();
    const missing = _missingSetup(profile);
    const done = _setupDone(profile);
    const dismissed = localStorage.getItem(PROFILE_DISMISS_KEY) === '1';

    if (done) localStorage.removeItem(PROFILE_DISMISS_KEY);

    const title = document.getElementById('profile-setup-title');
    const sub = document.getElementById('profile-setup-sub');
    const nameInput = document.getElementById('profile-setup-name');
    const goalInput = document.getElementById('profile-setup-goal');

    if (title) {
      title.textContent = missing.name && missing.goal
        ? _setupTx('Add your name and goal for better coaching.', 'أضف اسمك وهدفك لتحصل على تدريب أفضل.')
        : missing.name
          ? _setupTx('Add your name so FORGE can personalize your profile.', 'أضف اسمك ليخصص FORGE ملفك الشخصي.')
          : _setupTx('Set your training goal to improve recommendations.', 'حدد هدفك التدريبي لتحسين التوصيات.');
    }

    if (sub) {
      sub.textContent = _setupTx(
        'This stays optional, but it improves Coach, nutrition targets, and profile personalization.',
        'هذا اختياري، لكنه يحسن المدرب والأهداف الغذائية وتخصيص الملف الشخصي.'
      );
    }

    if (nameInput) nameInput.value = profile.name || '';
    if (goalInput) goalInput.value = profile.goal || '';

    if (done || dismissed) {
      _hide(card);
      return false;
    }

    _show(card);
    return true;
  };

  window.dismissProfileSetupPrompt = function dismissProfileSetupPrompt() {
    localStorage.setItem(PROFILE_DISMISS_KEY, '1');
    window.renderProfileSetupPrompt();
  };

  window.saveProfileSetupPrompt = function saveProfileSetupPrompt() {
    const name = document.getElementById('profile-setup-name')?.value.trim() || '';
    const goal = document.getElementById('profile-setup-goal')?.value || '';

    const nameField = document.getElementById('profile-name');
    const goalField = document.getElementById('profile-goal');
    if (nameField && name) nameField.value = name;
    if (goalField && goal) goalField.value = goal;

    localStorage.removeItem(PROFILE_DISMISS_KEY);
    if (typeof saveProfile === 'function') saveProfile();
    if (typeof renderProfileSetupPrompt === 'function') renderProfileSetupPrompt();
    if (typeof renderCoachGoalSetupPrompt === 'function') renderCoachGoalSetupPrompt();
  };

  window.goToProfileGoalSetup = function goToProfileGoalSetup() {
    localStorage.removeItem(PROFILE_DISMISS_KEY);
    localStorage.removeItem(COACH_DISMISS_KEY);
    if (typeof switchView === 'function') switchView('more', document.getElementById('bnav-more'));
    if (typeof renderProfile === 'function') renderProfile();
    setTimeout(function () {
      const el = document.getElementById('profile-goal');
      if (el && typeof el.focus === 'function') el.focus();
    }, 60);
  };

  window.dismissCoachGoalPrompt = function dismissCoachGoalPrompt() {
    localStorage.setItem(COACH_DISMISS_KEY, '1');
    window.renderCoachGoalSetupPrompt();
  };

  window.renderCoachGoalSetupPrompt = function renderCoachGoalSetupPrompt() {
    const card = document.getElementById('coach-goal-setup-card');
    if (!card) return false;

    const profile = _profileRef();
    const title = document.getElementById('coach-goal-setup-title');
    const sub = document.getElementById('coach-goal-setup-sub');
    const missingGoal = !String(profile.goal || '').trim();
    const dismissed = localStorage.getItem(COACH_DISMISS_KEY) === '1';

    if (missingGoal) {
      if (title) title.textContent = _setupTx('Set a goal to unlock better coaching.', 'حدد هدفك لتحصل على تدريب أذكى.');
      if (sub) sub.textContent = _setupTx(
        'Coach can still work without it, but goal-based plans and nutrition targets will be weaker.',
        'المدرب يعمل بدون ذلك، لكن الخطط المعتمدة على الهدف والأهداف الغذائية ستكون أضعف.'
      );
    }

    if (!missingGoal) localStorage.removeItem(COACH_DISMISS_KEY);

    if (!missingGoal || dismissed) {
      _hide(card);
      return false;
    }

    _show(card);
    return true;
  };

  // Legacy compatibility: startup callers should not break while first-run UI is removed.
  window._onboardingCheck = function () { return false; };
  window._onbComplete = function () { return false; };
})();

// ── v238: First-run wizard ──
(function initFirstRunWizard() {
  // Check if wizard already shown
  if (localStorage.getItem('forge_onboarding_v238_done')) return;

  // Check if user already has data (existing user — skip wizard)
  var hasName = localStorage.getItem('forge_username') || localStorage.getItem('forge_name') || localStorage.getItem('forge_profile_name');
  var hasWorkouts = localStorage.getItem('forge_workouts') || localStorage.getItem('forge_bw_workouts');
  // Also check if there's a profile object
  try {
    var p = JSON.parse(localStorage.getItem('forge_profile') || localStorage.getItem('userProfile') || '{}');
    if (p && (p.name || p.username)) hasName = p.name || p.username;
  } catch(e) {}

  if (hasName || hasWorkouts) {
    // Existing user — mark done silently
    localStorage.setItem('forge_onboarding_v238_done', '1');
    return;
  }

  // Show wizard
  var wizard = document.getElementById('first-run-wizard');
  if (!wizard) return;
  wizard.style.display = 'block';

  window._obNext = function(step) {
    if (window.fx) { fx.sound('sndTap'); fx.haptic('hapTap'); }
    else if (typeof sndTap === 'function') sndTap();

    if (step === 2) {
      var name = (document.getElementById('ob-name-input') || {}).value;
      if (!name || !name.trim()) {
        // Shake the input
        var inp = document.getElementById('ob-name-input');
        if (inp) { inp.style.borderColor = 'var(--danger)'; setTimeout(function() { inp.style.borderColor = ''; }, 1000); }
        return;
      }
      // Save name — use the same key as the rest of the app
      localStorage.setItem('forge_username', name.trim());
      // Also update forge_profile object if it exists
      try {
        var key = localStorage.getItem('forge_profile') ? 'forge_profile' : (localStorage.getItem('userProfile') ? 'userProfile' : null);
        if (key) { var p2 = JSON.parse(localStorage.getItem(key) || '{}'); p2.name = name.trim(); localStorage.setItem(key, JSON.stringify(p2)); }
      } catch(e) {}
    }

    // Hide current step, show next
    var cur = document.getElementById('ob-step-' + step);
    var next = document.getElementById('ob-step-' + (step + 1));
    if (cur) cur.hidden = true;
    if (next) next.hidden = false;
  };

  window._obGoal = function(goal) {
    if (window.fx) { fx.sound('sndTap'); fx.haptic('hapTap'); }
    localStorage.setItem('forge_goal', goal);
    var cur = document.getElementById('ob-step-3');
    var next = document.getElementById('ob-step-4');
    if (cur) cur.hidden = true;
    if (next) next.hidden = false;
  };

  window._obFinish = function(level) {
    localStorage.setItem('forge_experience', level);
    localStorage.setItem('forge_onboarding_v238_done', '1');
    if (window.fx) { fx.sound('sndSessionStart'); fx.haptic('hapSave'); }
    else if (typeof sndSave === 'function') sndSave();
    var wizard2 = document.getElementById('first-run-wizard');
    if (wizard2) wizard2.style.display = 'none';
  };
})();

// ── v238: Progressive feature tips (shown at workout milestones) ──
window.checkFeatureTip = function(workoutCount) {
  var TIPS = [
    { at: 5,  id: 'voice',   msg: '🎤 Tip: Try Voice-to-Log! Tap the mic on any exercise.' },
    { at: 10, id: 'heatmap', msg: '🔥 Tip: Check your Recovery Heatmap in the Coach tab.' },
    { at: 15, id: 'coach',   msg: '🤖 Tip: Ask your AI Coach anything about your training.' },
    { at: 20, id: 'program', msg: '⚡ Tip: Generate a personalized AI Program!' },
  ];
  var shown = JSON.parse(localStorage.getItem('forge_feature_tips_shown') || '[]');
  var tip = null;
  for (var i = 0; i < TIPS.length; i++) {
    if (TIPS[i].at === workoutCount && shown.indexOf(TIPS[i].id) === -1) { tip = TIPS[i]; break; }
  }
  if (!tip) return;
  shown.push(tip.id);
  localStorage.setItem('forge_feature_tips_shown', JSON.stringify(shown));
  if (typeof showToast === 'function') showToast(tip.msg, 5000);
};

// ── v238: Re-engagement (3+ days since last workout) ──
(function checkReEngagement() {
  var workouts = [];
  try {
    var w1 = JSON.parse(localStorage.getItem('forge_workouts') || '[]');
    var w2 = JSON.parse(localStorage.getItem('forge_bw_workouts') || '[]');
    workouts = w1.concat(w2);
  } catch(e) {}
  if (!workouts.length) return;

  // Find most recent workout date
  var lastDate = 0;
  workouts.forEach(function(w) {
    var d = new Date(w.date || w.timestamp || w.savedAt || 0).getTime();
    if (d > lastDate) lastDate = d;
  });
  if (!lastDate) return;

  var daysSince = Math.floor((Date.now() - lastDate) / 86400000);
  if (daysSince < 3) return;

  // Show re-engagement toast after 1s
  setTimeout(function() {
    var msg = '🔥 ' + daysSince + ' days since your last session. Your muscles are rested and ready!';
    if (typeof showToast === 'function') showToast(msg, 6000);
  }, 1000);
})();
