function populateExerciseSelect() {
  const exercises = [...new Set(workouts.map(w => w.exercise))];
  const sel = document.getElementById('exercise-select');
  const cur = sel.value;
  sel.innerHTML = `<option value="">${t('dash.selectExercise')}</option>`;
  exercises.forEach(e => {
    const o = document.createElement('option');
    o.value = e;
    o.textContent = e;
    sel.appendChild(o);
  });
  // Auto-select: keep current or pick the most-logged exercise
  if (cur && exercises.includes(cur)) {
    sel.value = cur;
  } else if (exercises.length) {
    const counts = {};
    workouts.forEach(w => { counts[w.exercise] = (counts[w.exercise] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (top) sel.value = top;
  }
}
