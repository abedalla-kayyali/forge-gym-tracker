// FORGE RAG - Browser Export Script
// Paste this into the browser console on the FORGE app page.
// It will download forge_export.json with all your gym data.

(function exportForgeData() {
  const keys = [
    'forge_workouts',
    'forge_bodyweight',
    'forge_meals',
    'forge_meal_library',
    'forge_cardio',
    'forge_bw_workouts',
    'forge_settings',
  ];

  const data = {};
  keys.forEach(k => {
    try {
      const raw = localStorage.getItem(k);
      data[k] = raw ? JSON.parse(raw) : null;
    } catch (e) {
      data[k] = null;
    }
  });

  // Water entries (keyed by date)
  const waterEntries = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('forge_water_')) {
      try { waterEntries[k] = JSON.parse(localStorage.getItem(k)); } catch (_) {}
    }
  }
  data['forge_water'] = waterEntries;
  data['_exported_at'] = new Date().toISOString();

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'forge_export.json';
  a.click();
  console.log('[FORGE RAG] Export complete. Entries:', {
    workouts: Array.isArray(data.forge_workouts) ? data.forge_workouts.length : 0,
    bodyweight: Array.isArray(data.forge_bodyweight) ? data.forge_bodyweight.length : 0,
    cardio: Array.isArray(data.forge_cardio) ? data.forge_cardio.length : 0,
    meals: data.forge_meals ? Object.keys(data.forge_meals).length + ' days' : 0,
  });
})();
