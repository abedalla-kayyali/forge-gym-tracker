function download(filename, content, mime) {
  const a = document.createElement('a');
  a.href = 'data:' + mime + ';charset=utf-8,' + encodeURIComponent(content);
  a.download = filename;
  a.click();
}

function confirmClear() {
  showConfirm(
    typeof t === 'function' && currentLang === 'ar' ? 'حذف جميع البيانات' : 'Delete All Data',
    typeof t === 'function' && currentLang === 'ar'
      ? 'سيتم حذف جميع بيانات التطبيق نهائياً، بما فيها التمارين والكارديو والتغذية والإعدادات والبطاقات المخصصة. لا يمكن التراجع عن هذا الإجراء.'
      : 'This will permanently delete all app data, including workouts, cardio, nutrition, settings, and custom cards. This cannot be undone.',
    () => {
      const defaultSettings = { defaultUnit: 'kg', sound: true, showHint: true };
      const keysToRemove = [
        'forge_workouts',
        'forge_bodyweight',
        'forge_templates',
        'forge_settings',
        'forge_meals',
        'forge_meal_library',
        'forge_bw_workouts',
        'forge_cardio',
        'forge_profile',
        'forge_checkins',
        'forge_steps',
        'forge_bw_custom_exercises',
        'forge_cardio_custom_types',
        'forge_duels',
        'forge_friends',
        'forge_avatar_slot_state_v1'
      ];

      Object.keys(localStorage).forEach((key) => {
        if (key.indexOf('forge_water_') === 0) keysToRemove.push(key);
        if (key.indexOf('forge_checkin_') === 0) keysToRemove.push(key);
      });

      [...new Set(keysToRemove)].forEach((key) => {
        try { localStorage.removeItem(key); } catch (_err) {}
      });

      workouts = [];
      if (typeof bwWorkouts !== 'undefined') bwWorkouts = [];
      if (typeof cardioLog !== 'undefined') cardioLog = [];
      bodyWeight = [];
      templates = [];
      settings = defaultSettings;
      if (typeof mealsLog !== 'undefined') mealsLog = {};
      if (typeof mealLibrary !== 'undefined') mealLibrary = {};
      if (typeof userProfile !== 'undefined') userProfile = {};
      if (typeof stepsData !== 'undefined') stepsData = {};
      if (typeof _bwCustomExercises !== 'undefined') _bwCustomExercises = [];
      if (typeof _cardioCustomTypes !== 'undefined') _cardioCustomTypes = [];
      waterToday = [];

      save();
      if (typeof renderBwExercisePicker === 'function') renderBwExercisePicker();
      if (typeof renderCardioSummary === 'function') renderCardioSummary();
      if (typeof renderCardioRecentLog === 'function') renderCardioRecentLog();
      if (typeof renderProfile === 'function') renderProfile();
      if (typeof renderStepsPanel === 'function') renderStepsPanel();
      updateStatBar();
      postSaveHooks();
      showToast(typeof t === 'function' && currentLang === 'ar' ? 'تم حذف جميع البيانات.' : 'All data cleared.', 'warn');
    }
  );
}
