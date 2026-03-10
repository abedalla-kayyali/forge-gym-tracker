function renderBodyHeatmap(arr) {
  if (!arr) arr = workouts;
  const el = document.getElementById('muscle-heatmap-body');
  if (!el) return;
  if (!arr.length) return; // keep empty state

  // Compute days-since-last-trained per muscle
  const now = Date.now();
  const lastTrainedMs = {};
  arr.forEach(w => {
    if (!w.muscle) return;
    const ts = new Date(w.date).getTime();
    if (!lastTrainedMs[w.muscle] || ts > lastTrainedMs[w.muscle]) lastTrainedMs[w.muscle] = ts;
  });

  // Heat color: 0-1d = red (just trained), 2-3d = orange (DOMS), 4-6d = yellow (ready), 7-13d = green (primed), 14+d = dark (overdue)
  function heatColor(muscle) {
    const ts = lastTrainedMs[muscle];
    if (!ts) return '#1a2e1a'; // never trained
    const days = (now - ts) / 86400000;
    if (days <= 1) return '#e74c3c'; // just trained
    if (days <= 3) return '#e67e22'; // recovering (DOMS)
    if (days <= 6) return '#f1c40f'; // ready
    if (days <= 13) return '#2ecc71'; // primed
    return '#1a4a2a'; // rested / overdue
  }

  // Front body zones
  const FRONT = [
    ['Traps', 'M68 68 Q60 68 55 70 L63 90 Q63 76 68 68 Z M132 68 Q140 68 145 70 L137 90 Q137 76 132 68 Z'],
    ['Chest', 'M68 68 Q64 72 63 88 L63 120 Q75 128 100 130 Q125 128 137 120 L137 88 Q136 72 132 68 Q118 62 100 61 Q82 62 68 68 Z'],
    ['Shoulders', 'M55 68 Q44 72 42 86 Q40 100 48 108 Q55 115 63 110 L63 88 Q62 74 68 68 Z M145 68 Q156 72 158 86 Q160 100 152 108 Q145 115 137 110 L137 88 Q138 74 132 68 Z'],
    ['Biceps', 'M42 108 Q36 114 35 130 Q34 146 40 152 Q47 157 55 152 Q62 147 63 132 L63 110 Q55 115 48 108 Z M158 108 Q164 114 165 130 Q166 146 160 152 Q153 157 145 152 Q138 147 137 132 L137 110 Q145 115 152 108 Z'],
    ['Triceps', 'M40 152 Q34 157 33 168 Q33 178 38 182 Q44 186 52 183 Q58 180 59 170 Q60 160 55 156 Q48 155 40 152 Z M160 152 Q166 157 167 168 Q167 178 162 182 Q156 186 148 183 Q142 180 141 170 Q140 160 145 156 Q152 155 160 152 Z'],
    ['Forearms', 'M33 180 Q31 192 31 206 Q32 218 38 224 Q45 228 52 224 Q58 220 59 208 Q59 196 59 184 Q52 186 44 184 Q38 183 33 180 Z M167 180 Q169 192 169 206 Q168 218 162 224 Q155 228 148 224 Q142 220 141 208 Q141 196 141 184 Q148 186 156 184 Q162 183 167 180 Z'],
    ['Core', 'M64 120 Q65 150 66 170 L134 170 Q135 150 136 120 Q125 128 100 130 Q75 128 64 120 Z'],
    ['Legs', 'M60 172 L60 174 Q58 202 57 232 Q55 258 57 280 Q61 294 73 296 Q85 298 87 282 Q91 258 91 232 L91 172 Z M140 172 L140 174 Q142 202 143 232 Q145 258 143 280 Q139 294 127 296 Q115 298 113 282 Q109 258 109 232 L109 172 Z'],
    ['Calves', 'M57 294 Q54 314 56 334 Q58 352 65 366 Q70 376 77 376 Q84 376 86 366 Q90 350 90 332 Q90 312 87 296 Q85 298 73 296 Q61 294 57 294 Z M143 294 Q146 314 144 334 Q142 352 135 366 Q130 376 123 376 Q116 376 114 366 Q110 350 110 332 Q110 312 113 296 Q115 298 127 296 Q139 294 143 294 Z'],
  ];

  // Back body zones
  const BACK = [
    ['Traps', 'M68 68 Q82 62 100 61 Q118 62 132 68 L134 90 Q100 95 66 90 Z'],
    ['Back', 'M66 90 L134 90 L136 172 L64 172 Z'],
    ['Shoulders', 'M55 68 Q44 72 42 86 Q40 100 48 108 L63 110 L63 88 Q62 74 68 68 Z M145 68 Q156 72 158 86 Q160 100 152 108 L137 110 L137 88 Q138 74 132 68 Z'],
    ['Triceps', 'M42 108 Q36 114 35 130 Q34 146 40 152 Q47 157 55 152 Q62 147 63 132 L63 110 Z M158 108 Q164 114 165 130 Q166 146 160 152 Q153 157 145 152 Q138 147 137 132 L137 110 Z'],
    ['Lower Back', 'M68 160 L132 160 L132 190 L68 190 Z'],
    ['Glutes', 'M64 170 L136 170 L136 230 Q100 238 64 230 Z'],
    ['Legs', 'M64 230 Q60 260 58 290 L92 290 Q91 260 91 230 Z M136 230 Q140 260 142 290 L108 290 Q109 260 109 230 Z'],
    ['Calves', 'M58 290 Q54 320 57 350 Q62 370 77 372 Q90 370 92 348 Q92 318 92 290 Z M142 290 Q146 320 143 350 Q138 370 123 372 Q110 370 108 348 Q108 318 108 290 Z'],
  ];

  // Body silhouette (neck + head rough outline)
  const silhouette = `
    <ellipse cx="100" cy="32" rx="18" ry="22" fill="var(--surface)" stroke="var(--border)" stroke-width=".8"/>
    <rect x="86" y="50" width="28" height="18" rx="4" fill="var(--surface)" stroke="var(--border)" stroke-width=".8"/>
  `;

  const buildSvg = (zones) => {
    const paths = zones.map(([muscle, d]) => {
      const c = heatColor(muscle);
      return `<path class="hz" data-muscle="${muscle}" style="fill:${c}" onclick="_openMuscleDetail('${muscle}')" d="${d}" stroke="var(--border)" stroke-width=".8" opacity=".9"/>`;
    }).join('');
    return `<svg class="heatmap-svg" viewBox="0 0 200 390" xmlns="http://www.w3.org/2000/svg">
      ${silhouette}${paths}
    </svg>`;
  };

  const legend = [
    ['#e74c3c', t('heat.tier1')],
    ['#e67e22', t('heat.tier2')],
    ['#f1c40f', t('heat.tier3')],
    ['#2ecc71', t('heat.tier4')],
    ['#1a4a2a', t('heat.tier5')],
  ].map(([c, l]) => `
    <div class="heatmap-legend-item">
      <div class="heatmap-legend-swatch" style="background:${c}"></div>
      <span class="heatmap-legend-lbl">${l}</span>
    </div>`).join('');

  el.innerHTML = `
    <div style="text-align:center;font-family:'DM Mono',monospace;font-size:9px;letter-spacing:1px;color:var(--text3);margin-bottom:8px;">FRONT &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; BACK</div>
    <div class="heatmap-wrap">
      ${buildSvg(FRONT)}
      ${buildSvg(BACK)}
      <div class="heatmap-legend">${legend}</div>
    </div>`;
}
