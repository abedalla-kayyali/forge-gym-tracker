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
