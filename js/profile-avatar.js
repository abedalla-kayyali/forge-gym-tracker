(function () {
  const FORGE_AVATAR_SLOT_ORDER = ['head', 'shoulders', 'torso', 'arms', 'legs', 'back'];
  const FORGE_AVATAR_TIER_SCORE = { none: 0, basic: 1, elite: 2, mythic: 3 };
  const FORGE_AVATAR_STATE_KEY = 'forge_avatar_slot_state_v1';
  let _forgeAvatarShareMode = 'showcase';
  let _forgeAvatarDetailView = 'avatar';
  const FORGE_MUSCLE_PATHS = {
    front: [
      { muscle: 'Traps', d: 'M68 68 Q60 68 55 70 L63 90 Q63 76 68 68 Z', opacity: 0.85 },
      { muscle: 'Traps', d: 'M132 68 Q140 68 145 70 L137 90 Q137 76 132 68 Z', opacity: 0.85 },
      { muscle: 'Chest', d: 'M68 68 Q64 72 63 88 L63 120 Q75 128 100 130 Q125 128 137 120 L137 88 Q136 72 132 68 Q118 62 100 61 Q82 62 68 68 Z' },
      { muscle: 'Shoulders', d: 'M55 68 Q44 72 42 86 Q40 100 48 108 Q55 115 63 110 L63 88 Q62 74 68 68 Z' },
      { muscle: 'Shoulders', d: 'M145 68 Q156 72 158 86 Q160 100 152 108 Q145 115 137 110 L137 88 Q138 74 132 68 Z' },
      { muscle: 'Biceps', d: 'M42 108 Q36 114 35 130 Q34 146 40 152 Q47 157 55 152 Q62 147 63 132 L63 110 Q55 115 48 108 Z' },
      { muscle: 'Biceps', d: 'M158 108 Q164 114 165 130 Q166 146 160 152 Q153 157 145 152 Q138 147 137 132 L137 110 Q145 115 152 108 Z' },
      { muscle: 'Triceps', d: 'M40 152 Q34 157 33 168 Q33 178 38 182 Q44 186 52 183 Q58 180 59 170 Q60 160 55 156 Q48 155 40 152 Z' },
      { muscle: 'Triceps', d: 'M160 152 Q166 157 167 168 Q167 178 162 182 Q156 186 148 183 Q142 180 141 170 Q140 160 145 156 Q152 155 160 152 Z' },
      { muscle: 'Forearms', d: 'M33 180 Q31 192 31 206 Q32 218 38 224 Q45 228 52 224 Q58 220 59 208 Q59 196 59 184 Q52 186 44 184 Q38 183 33 180 Z' },
      { muscle: 'Forearms', d: 'M167 180 Q169 192 169 206 Q168 218 162 224 Q155 228 148 224 Q142 220 141 208 Q141 196 141 184 Q148 186 156 184 Q162 183 167 180 Z' },
      { muscle: 'Core', d: 'M64 120 Q65 150 66 170 L134 170 Q135 150 136 120 Q125 128 100 130 Q75 128 64 120 Z' },
      { muscle: 'Legs', d: 'M60 172 L60 174 Q58 202 57 232 Q55 258 57 280 Q61 294 73 296 Q85 298 87 282 Q91 258 91 232 L91 172 Z' },
      { muscle: 'Legs', d: 'M140 172 L140 174 Q142 202 143 232 Q145 258 143 280 Q139 294 127 296 Q115 298 113 282 Q109 258 109 232 L109 172 Z' },
      { muscle: 'Calves', d: 'M57 294 Q54 314 56 334 Q58 352 65 366 Q70 376 77 376 Q84 376 86 366 Q90 350 90 332 Q90 312 87 296 Q85 298 73 296 Q61 294 57 294 Z' },
      { muscle: 'Calves', d: 'M143 294 Q146 314 144 334 Q142 352 135 366 Q130 376 123 376 Q116 376 114 366 Q110 350 110 332 Q110 312 113 296 Q115 298 127 296 Q139 294 143 294 Z' }
    ],
    back: [
      { muscle: 'Shoulders', d: 'M55 68 Q44 72 42 86 Q40 100 48 108 Q55 115 63 110 L63 88 Q62 74 68 68 Z' },
      { muscle: 'Shoulders', d: 'M145 68 Q156 72 158 86 Q160 100 152 108 Q145 115 137 110 L137 88 Q138 74 132 68 Z' },
      { muscle: 'Traps', d: 'M68 68 Q64 72 63 88 L63 105 L137 105 L137 88 Q136 72 132 68 Q118 62 100 61 Q82 62 68 68 Z', opacity: 0.9 },
      { muscle: 'Back', d: 'M63 105 L63 148 L137 148 L137 105 Z' },
      { muscle: 'Lower Back', d: 'M63 148 L63 172 L137 172 L137 148 Z', opacity: 0.9 },
      { muscle: 'Triceps', d: 'M42 108 Q36 114 35 130 Q34 146 40 152 Q47 157 55 152 Q62 147 63 132 L63 110 Q55 115 48 108 Z' },
      { muscle: 'Triceps', d: 'M158 108 Q164 114 165 130 Q166 146 160 152 Q153 157 145 152 Q138 147 137 132 L137 110 Q145 115 152 108 Z' },
      { muscle: 'Forearms', d: 'M40 152 Q34 158 33 172 Q32 186 38 196 Q44 202 51 198 Q58 194 59 182 Q60 168 55 158 Q48 157 40 152 Z' },
      { muscle: 'Forearms', d: 'M160 152 Q166 158 167 172 Q168 186 162 196 Q156 202 149 198 Q142 194 141 182 Q140 168 145 158 Q152 157 160 152 Z' },
      { muscle: 'Glutes', d: 'M62 172 L62 174 Q60 198 62 218 Q67 234 80 236 Q94 238 97 220 Q100 206 99 186 L99 172 Z' },
      { muscle: 'Glutes', d: 'M138 172 L138 174 Q140 198 138 218 Q133 234 120 236 Q106 238 103 220 Q100 206 101 186 L101 172 Z' },
      { muscle: 'Legs', d: 'M62 232 Q60 258 60 280 Q62 296 75 298 Q87 300 89 284 Q91 260 91 236 Q94 238 80 236 Q67 234 62 232 Z' },
      { muscle: 'Legs', d: 'M138 232 Q140 258 140 280 Q138 296 125 298 Q113 300 111 284 Q109 260 109 236 Q106 238 120 236 Q133 234 138 232 Z' },
      { muscle: 'Calves', d: 'M60 296 Q57 316 59 336 Q61 354 68 368 Q73 378 80 378 Q87 378 89 368 Q91 352 91 334 Q91 314 89 298 Q87 300 75 298 Q62 296 60 296 Z' },
      { muscle: 'Calves', d: 'M140 296 Q143 316 141 336 Q139 354 132 368 Q127 378 120 378 Q113 378 111 368 Q109 352 109 334 Q109 314 111 298 Q113 300 125 298 Q138 296 140 296 Z' }
    ]
  };

  function _forgeAvatarIsAr() {
    return (typeof currentLang !== 'undefined') && currentLang === 'ar';
  }

  function _forgeAvatarTx(en, ar) {
    return _forgeAvatarIsAr() ? ar : en;
  }

  function _forgeAvatarClamp(val) {
    const n = Number(val);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }

  function _forgeAvatarRankTier(rankData) {
    const name = String(rankData && rankData.name || '').toLowerCase();
    if (name.includes('legend') || name.includes('master') || name.includes('gold')) return 'legend';
    if (name.includes('warrior') || name.includes('elite') || name.includes('beast') || name.includes('champ')) return 'elite';
    return 'rookie';
  }

  function _forgeAvatarTheme(rankTier) {
    if (rankTier === 'legend') return 'solar';
    if (rankTier === 'elite') return 'aqua';
    return 'iron';
  }

  function _forgeAvatarSlotLabel(slot) {
    const labels = {
      head: _forgeAvatarTx('Crown', 'ط§ظ„طھط§ط¬'),
      shoulders: _forgeAvatarTx('Pauldrons', 'ط§ظ„ط£ظƒطھط§ظپ'),
      torso: _forgeAvatarTx('Chestplate', 'ط§ظ„ط¯ط±ط¹'),
      arms: _forgeAvatarTx('Gauntlets', 'ط§ظ„ظ‚ظپط§ط²ط§طھ'),
      legs: _forgeAvatarTx('Greaves', 'ط§ظ„ط³ط§ظ‚ط§ظ†'),
      back: _forgeAvatarTx('Cape', 'ط§ظ„ط¹ط¨ط§ط،ط©')
    };
    return labels[slot] || slot;
  }

  function _forgeAvatarTopSlot(slots) {
    const order = ['legs', 'back', 'shoulders', 'torso', 'arms', 'head'];
    let best = 'head';
    order.forEach((slot) => {
      if ((FORGE_AVATAR_TIER_SCORE[slots[slot]] || 0) > (FORGE_AVATAR_TIER_SCORE[slots[best]] || 0)) best = slot;
    });
    return best;
  }

  function _forgeAvatarLowestRegion(balance) {
    const entries = [
      ['legs', _forgeAvatarClamp(balance.legs)],
      ['arms', _forgeAvatarClamp(balance.arms)],
      ['torso', (_forgeAvatarClamp(balance.chest) + _forgeAvatarClamp(balance.core)) / 2],
      ['back', _forgeAvatarClamp(balance.back)],
      ['shoulders', _forgeAvatarClamp(balance.shoulders)]
    ];
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0][0];
  }

  window._forgeAvatarSlotTier = function _forgeAvatarSlotTier(score) {
    const safe = _forgeAvatarClamp(score);
    if (safe >= 0.85) return 'mythic';
    if (safe >= 0.65) return 'elite';
    if (safe >= 0.4) return 'basic';
    return 'none';
  };

  function _forgeAvatarInsight(slots, balance) {
    const topSlot = _forgeAvatarTopSlot(slots);
    const lowSlot = _forgeAvatarLowestRegion(balance);
    if (_forgeAvatarClamp(balance.overall) < 0.2) {
      return _forgeAvatarTx('Train more muscle groups to unlock your armor.', 'ط¯ط±ظ‘ط¨ ط¹ط¶ظ„ط§طھ ط£ظƒط«ط± ظ„ظپطھط­ ظ‚ط·ط¹ ط§ظ„ط¯ط±ط¹.');
    }
    if (slots[lowSlot] === 'none') {
      return _forgeAvatarTx(
        `${_forgeAvatarSlotLabel(lowSlot)} locked. Bring that region up to balance.`,
        `ظ‚ط·ط¹ط© ${_forgeAvatarSlotLabel(lowSlot)} ظ…ظ‚ظپظ„ط©. ط§ط±ظپط¹ ظ‡ط°ط§ ط§ظ„ط¬ط²ط، ظ„طھط­ظ‚ظٹظ‚ ط§ظ„طھظˆط§ط²ظ†.`
      );
    }
    return _forgeAvatarTx(
      `${_forgeAvatarSlotLabel(topSlot)} equipped. Balanced training is paying off.`,
      `طھظ… طھط¬ظ‡ظٹط² ${_forgeAvatarSlotLabel(topSlot)}. ط§ظ„طھظ…ط±ظٹظ† ط§ظ„ظ…طھظˆط§ط²ظ† ط¨ط¯ط£ ظٹط¸ظ‡ط±.`
    );
  }

  function _forgeAvatarSlotSourceScore(slot, balance) {
    if (slot === 'head') return 1;
    if (slot === 'shoulders') return (_forgeAvatarClamp(balance.shoulders) + _forgeAvatarClamp(balance.back)) / 2;
    if (slot === 'torso') return (_forgeAvatarClamp(balance.chest) + _forgeAvatarClamp(balance.core)) / 2;
    if (slot === 'arms') return _forgeAvatarClamp(balance.arms);
    if (slot === 'legs') return _forgeAvatarClamp(balance.legs);
    if (slot === 'back') return _forgeAvatarClamp(balance.posterior);
    return 0;
  }

  function _forgeAvatarSlotSourceLabel(slot) {
    const labels = {
      head: _forgeAvatarTx('Rank progression', 'طھظ‚ط¯ظ… ط§ظ„ط±طھط¨ط©'),
      shoulders: _forgeAvatarTx('Shoulders + back balance', 'طھظˆط§ط²ظ† ط§ظ„ط£ظƒطھط§ظپ ظˆط§ظ„ط¸ظ‡ط±'),
      torso: _forgeAvatarTx('Chest + core balance', 'طھظˆط§ط²ظ† ط§ظ„طµط¯ط± ظˆط§ظ„ظˆط³ط·'),
      arms: _forgeAvatarTx('Arm balance', 'طھظˆط§ط²ظ† ط§ظ„ط°ط±ط§ط¹ظٹظ†'),
      legs: _forgeAvatarTx('Lower-body balance', 'طھظˆط§ط²ظ† ط§ظ„ط¬ط²ط، ط§ظ„ط³ظپظ„ظٹ'),
      back: _forgeAvatarTx('Posterior-chain balance', 'طھظˆط§ط²ظ† ط§ظ„ط³ظ„ط³ظ„ط© ط§ظ„ط®ظ„ظپظٹط©')
    };
    return labels[slot] || slot;
  }

  function _forgeAvatarSlotUnlockThreshold(slot) {
    if (slot === 'head') return 100;
    if (slot === 'shoulders' || slot === 'torso' || slot === 'arms' || slot === 'legs' || slot === 'back') return 40;
    return 40;
  }

  function _forgeAvatarSlotExplain(slot) {
    const defs = {
      head: {
        area: _forgeAvatarTx('rank progression', 'تقدم الرتبة'),
        drills: _forgeAvatarTx('gain XP, keep logging sessions, and complete more balanced training weeks', 'اجمع الخبرة وواصل تسجيل التمرين وأكمل أسابيع تدريب متوازنة')
      },
      shoulders: {
        area: _forgeAvatarTx('shoulders and upper back', 'الأكتاف والظهر العلوي'),
        drills: _forgeAvatarTx('overhead press, lateral raises, rows, face pulls, and rear-delt work', 'الضغط العلوي والرفرفة الجانبية والتمارين السحب وتمارين الكتف الخلفي')
      },
      torso: {
        area: _forgeAvatarTx('chest and core', 'الصدر والوسط'),
        drills: _forgeAvatarTx('bench press, incline press, push-ups, dips, planks, and ab work', 'البنش والإنكلاين والضغط والمتوازي والبلانك وتمارين البطن')
      },
      arms: {
        area: _forgeAvatarTx('biceps, triceps, and forearms', 'البايسبس والترايسبس والساعد'),
        drills: _forgeAvatarTx('curls, skull crushers, rope pushdowns, chin-ups, and grip work', 'الكيرلز والسكَل كراشر والبوش داون والعقلة وتمارين القبضة')
      },
      legs: {
        area: _forgeAvatarTx('quads, hamstrings, glutes, and calves', 'الفخذ الأمامي والخلفي والغلوتس والسمانة'),
        drills: _forgeAvatarTx('squats, lunges, leg press, RDLs, calf raises, and split squats', 'السكوات واللانجز والليج برس والرومانيان ديدلفت وتمارين السمانة والسبلت سكوات')
      },
      back: {
        area: _forgeAvatarTx('posterior chain: back, glutes, hamstrings, and lower back', 'السلسلة الخلفية: الظهر والغلوتس والهامسترنغ وأسفل الظهر'),
        drills: _forgeAvatarTx('RDLs, deadlifts, rows, hip hinges, back extensions, glute bridges, and pull work', 'الرومانيان ديدلفت والديدلفت والرو والهيب هنج والباك إكستنشن والجسور وتمارين السحب')
      }
    };
    return defs[slot] || {
      area: _forgeAvatarTx('training balance', 'توازن التدريب'),
      drills: _forgeAvatarTx('train the matching region more consistently', 'درّب المنطقة المطابقة بشكل أكثر انتظاماً')
    };
  }

  function _forgeAvatarSlotAction(slot, score, tier) {
    const pct = Math.round((Number(score) || 0) * 100);
    const unlockAt = _forgeAvatarSlotUnlockThreshold(slot);
    const remaining = Math.max(0, unlockAt - pct);
    const info = _forgeAvatarSlotExplain(slot);
    if (tier !== 'none') {
      return _forgeAvatarTx(
        `${_forgeAvatarSlotLabel(slot)} is active at ${pct}%. To upgrade it, keep building ${info.area} with ${info.drills}.`,
        `${_forgeAvatarSlotLabel(slot)} مفعّل عند ${pct}%. لرفعه للمستوى التالي استمر في بناء ${info.area} عبر ${info.drills}.`
      );
    }
    return _forgeAvatarTx(
      `You are at ${pct}%. Need +${remaining}% to unlock ${_forgeAvatarSlotLabel(slot)}. Best path: add 2 focused sessions for ${info.area} using ${info.drills}.`,
      `أنت الآن عند ${pct}%. تحتاج +${remaining}% لفتح ${_forgeAvatarSlotLabel(slot)}. أفضل خطوة: أضف حصتين مركزتين لـ ${info.area} باستخدام ${info.drills}.`
    );
  }

  function _forgeAvatarUnlockHint(slot, tier) {
    const info = _forgeAvatarSlotExplain(slot);
    const unlockAt = _forgeAvatarSlotUnlockThreshold(slot);
    if (tier !== 'none') {
      return _forgeAvatarTx(
        `${_forgeAvatarSlotLabel(slot)} tracks ${info.area}. Keep that area balanced to upgrade this item.`,
        `${_forgeAvatarSlotLabel(slot)} يتتبع ${info.area}. حافظ على توازن هذه المنطقة لرفع هذا العنصر.`
      );
    }
    return _forgeAvatarTx(
      `${_forgeAvatarSlotLabel(slot)} unlocks at ${unlockAt}%. It is powered by ${info.area}.`,
      `${_forgeAvatarSlotLabel(slot)} يفتح عند ${unlockAt}%. هذا العنصر يعتمد على ${info.area}.`
    );
  }

  function _forgeAvatarDetailsData(state, balance) {
    const slots = FORGE_AVATAR_SLOT_ORDER.map((slot) => {
      const sourceScore = _forgeAvatarSlotSourceScore(slot, balance);
      const tier = state.slots[slot];
      const unlockAt = _forgeAvatarSlotUnlockThreshold(slot);
      return {
        id: slot,
        label: _forgeAvatarSlotLabel(slot),
        tier,
        sourceLabel: _forgeAvatarSlotSourceLabel(slot),
        sourceScore,
        progressPct: Math.max(8, Math.round(sourceScore * 100)),
        hint: _forgeAvatarUnlockHint(slot, tier),
        unlockAt,
        nextAction: _forgeAvatarSlotAction(slot, sourceScore, tier)
      };
    });
    const weakest = slots.slice().sort((a, b) => a.sourceScore - b.sourceScore)[0];
    return {
      slots,
      weakest,
      focus: weakest
        ? _forgeAvatarTx(
            `Focus next on ${weakest.label}. It is your lowest armor lane right now.`,
            `ط±ظƒط² ط¨ط¹ط¯ ط°ظ„ظƒ ط¹ظ„ظ‰ ${weakest.label}. ظ‡ط°ط§ ظ‡ظˆ ط£ط¶ط¹ظپ ظ…ط³ط§ط± ط¯ط±ط¹ ظ„ط¯ظٹظƒ ط§ظ„ط¢ظ†.`
          )
        : _forgeAvatarTx('Keep training evenly to evolve your avatar.', 'ط§ط³طھظ…ط± ظپظٹ ط§ظ„طھط¯ط±ظٹط¨ ط§ظ„ظ…طھظˆط§ط²ظ† ظ„طھط·ظˆظٹط± ط§ظ„ط£ظپط§طھط§ط±.')
    };
  }

  window.buildProfileAvatarSlotInspectData = function buildProfileAvatarSlotInspectData(slotId, stateArg) {
    const rank = (typeof getCurrentLevel === 'function' && typeof calcXP === 'function') ? getCurrentLevel(calcXP()) : null;
    const balance = (typeof window.getBalanceRegionSummary === 'function') ? window.getBalanceRegionSummary() : {};
    const state = stateArg || window.buildProfileAvatarState(rank || {}, balance);
    const details = _forgeAvatarDetailsData(state, state.balance || balance);
    const slot = details.slots.find(function (row) { return row.id === slotId; });
    if (!slot) return null;
    const info = _forgeAvatarSlotExplain(slotId);
    const remaining = Math.max(0, slot.unlockAt - slot.progressPct);
    const commonMistakes = {
      head: _forgeAvatarTx('Skipping logs and inconsistent training weeks slow rank growth.', '???? ??????? ???? ?????? ?????? ??????? ???? ??? ??????.'),
      shoulders: _forgeAvatarTx('Too much chest pressing without rows or rear-delt work leaves this underbuilt.', '??????? ?? ????? ?????? ???? ??? ?? ??? ???? ???? ??? ?????? ??????.'),
      torso: _forgeAvatarTx('Training chest without direct core work usually stalls this item.', '????? ????? ???? ??? ????? ????? ???? ??? ?????? ??????.'),
      arms: _forgeAvatarTx('Compound lifts alone may not be enough if direct arm volume is missing.', '???????? ??????? ????? ?? ?? ???? ??? ??? ??? ?????? ??????? ??????.'),
      legs: _forgeAvatarTx('Skipping calves or hamstrings makes lower-body balance look weaker than expected.', '????? ??????? ?? ??????? ???? ????? ????? ?????? ???? ?? ???????.'),
      back: _forgeAvatarTx('Too much chest and arms work without hinges or glute work keeps the cape locked.', '??????? ?? ????? ????????? ???? ??? ??? ?? ????? ???? ????? ??????.')
    };
    const quickWin = slot.tier === 'none'
      ? _forgeAvatarTx(
          'Fastest unlock this week: add 2 sessions for ' + info.area + ' and close the +' + remaining + '% gap.',
          '???? ???? ??? ???????: ??? ????? ?? ' + info.area + ' ????? ???? +' + remaining + '%.'
        )
      : _forgeAvatarTx(
          'Fastest upgrade this week: keep one heavy day and one balanced accessory day for ' + info.area + '.',
          '???? ????? ??? ???????: ???? ??? ??? ???? ???? ????????? ?????? ?? ' + info.area + '.'
        );
    return {
      id: slot.id,
      label: slot.label,
      tier: slot.tier,
      sourceLabel: slot.sourceLabel,
      needText: slot.tier === 'none'
        ? _forgeAvatarTx('Need +' + remaining + '% to unlock', '????? +' + remaining + '% ?????')
        : _forgeAvatarTx(slot.progressPct + '% active', slot.progressPct + '% ?????'),
      whatCounts: _forgeAvatarTx('What counts: ' + info.area + '.', '?? ???? ??????: ' + info.area + '.'),
      bestExercises: _forgeAvatarTx('Best exercises: ' + info.drills + '.', '???? ????????: ' + info.drills + '.'),
      quickWin: quickWin,
      commonMistake: commonMistakes[slotId] || _forgeAvatarTx('Inconsistent training volume is the usual blocker.', '??? ?????? ??? ??????? ?? ?????? ???????.'),
      scoreLine: _forgeAvatarTx('Current ' + slot.progressPct + '% | Unlock ' + slot.unlockAt + '%', '?????? ' + slot.progressPct + '% | ????? ' + slot.unlockAt + '%')
    };
  };

  function _forgeAvatarEsc(str) {
    return String(str || '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function _forgeAvatarSummary(state, meta) {
    const details = _forgeAvatarDetailsData(state, state.balance || {});
    const strongest = (meta && meta.strongest) || details.slots.slice().sort((a, b) => b.sourceScore - a.sourceScore)[0]?.label || _forgeAvatarTx('Balanced', 'ظ…طھظˆط§ط²ظ†');
    const weakest = (meta && meta.weakest) || details.weakest?.label || _forgeAvatarTx('None', 'ظ„ط§ ظٹظˆط¬ط¯');
    return { details, strongest, weakest };
  }

  function _forgeAvatarTotalWeightedVolume() {
    return (typeof workouts !== 'undefined' && Array.isArray(workouts) ? workouts : []).reduce(function (sum, row) {
      return sum + Number(row && row.totalVolume || 0);
    }, 0);
  }

  function _forgeAvatarRecentPrs() {
    const recentCutoff = Date.now() - (30 * 86400000);
    const weighted = (typeof workouts !== 'undefined' && Array.isArray(workouts) ? workouts : []).filter(function (row) {
      return row && row.isPR && row.date && new Date(row.date).getTime() >= recentCutoff;
    }).length;
    const body = (typeof bwWorkouts !== 'undefined' && Array.isArray(bwWorkouts) ? bwWorkouts : []).filter(function (row) {
      return row && row.isPR && row.date && new Date(row.date).getTime() >= recentCutoff;
    }).length;
    return weighted + body;
  }

  function _forgeAvatarAggregateMetrics() {
    let readiness = 60;
    try {
      readiness = Number(window.buildCoachUnifiedState && window.buildCoachUnifiedState()?.readiness?.score || 60);
    } catch (_e) {}
    const streakFns = [
      typeof window.calcStreak === 'function' ? window.calcStreak : null,
      typeof window._calcCardioStreak === 'function' ? window._calcCardioStreak : null,
      typeof window._calcBwDayStreak === 'function' ? window._calcBwDayStreak : null
    ].filter(Boolean);
    const streakDays = streakFns.reduce(function (best, fn) {
      try { return Math.max(best, Number(fn() || 0)); } catch (_e) { return best; }
    }, 0);
    return {
      weightedVolume: _forgeAvatarTotalWeightedVolume(),
      streakDays: streakDays,
      readiness: readiness,
      cardioSessions: (typeof cardioLog !== 'undefined' && Array.isArray(cardioLog) ? cardioLog.length : 0),
      recentPRs: _forgeAvatarRecentPrs()
    };
  }

  function _forgeAvatarToolTier(value, thresholds) {
    if (value >= thresholds[2]) return 'mythic';
    if (value >= thresholds[1]) return 'elite';
    if (value >= thresholds[0]) return 'basic';
    return 'none';
  }

  window.buildProfileAvatarToolState = function buildProfileAvatarToolState(metricsArg) {
    const metrics = Object.assign({
      weightedVolume: 0,
      streakDays: 0,
      readiness: 60,
      cardioSessions: 0,
      recentPRs: 0
    }, metricsArg || {});
    const defs = [
      { id: 'hammer', label: 'FORGE HAMMER', source: _forgeAvatarTx('Weighted volume', 'ط­ط¬ظ… ط§ظ„ط£ظˆط²ط§ظ†'), tier: _forgeAvatarToolTier(metrics.weightedVolume, [20000, 90000, 220000]) },
      { id: 'chain', label: 'STREAK CHAIN', source: _forgeAvatarTx('Training streak', 'ط§ظ„طھطھط§ظ„ظٹ ط§ظ„طھط¯ط±ظٹط¨ظٹ'), tier: _forgeAvatarToolTier(metrics.streakDays, [3, 7, 21]) },
      { id: 'reactor', label: 'CORE REACTOR', source: _forgeAvatarTx('Readiness', 'ط§ظ„ط¬ط§ظ‡ط²ظٹط©'), tier: _forgeAvatarToolTier(metrics.readiness, [60, 75, 88]) },
      { id: 'flask', label: 'RECOVERY FLASK', source: _forgeAvatarTx('Cardio consistency', 'ط§ظ†طھط¸ط§ظ… ط§ظ„ظƒط§ط±ط¯ظٹظˆ'), tier: _forgeAvatarToolTier(metrics.cardioSessions, [3, 8, 20]) },
      { id: 'sigil', label: 'PR SIGIL', source: _forgeAvatarTx('Recent PRs', 'ط§ظ„ط£ط±ظ‚ط§ظ… ط§ظ„ظ‚ظٹط§ط³ظٹط© ط§ظ„ط­ط¯ظٹط«ط©'), tier: _forgeAvatarToolTier(metrics.recentPRs, [1, 3, 8]) }
    ].map(function (tool) {
      return Object.assign(tool, {
        unlocked: tool.tier !== 'none',
        tierScore: FORGE_AVATAR_TIER_SCORE[tool.tier] || 0
      });
    });
    return {
      list: defs,
      map: defs.reduce(function (acc, item) { acc[item.id] = item; return acc; }, {}),
      featured: defs.filter(function (item) { return item.unlocked; }).sort(function (a, b) { return b.tierScore - a.tierScore; }).slice(0, 3)
    };
  };

  window.buildProfileAvatarToolInspectData = function buildProfileAvatarToolInspectData(toolId, stateArg) {
    const rank = (typeof getCurrentLevel === 'function' && typeof calcXP === 'function') ? getCurrentLevel(calcXP()) : null;
    const balance = (typeof window.getBalanceRegionSummary === 'function') ? window.getBalanceRegionSummary() : {};
    const state = stateArg || window.buildProfileAvatarState(rank || {}, balance);
    const tool = state.tools && state.tools.map ? state.tools.map[toolId] : null;
    if (!tool) return null;
    return {
      id: tool.id,
      label: tool.label,
      tier: tool.tier,
      source: tool.source,
      unlocked: tool.unlocked,
      action: tool.unlocked
        ? _forgeAvatarTx(`Active from ${tool.source.toLowerCase()}. Keep pushing to upgrade it.`, `ظ†ط´ط· ط¨ط³ط¨ط¨ ${tool.source}. ط§ط³طھظ…ط± ظ„ط±ظپط¹ظ‡.`)
        : _forgeAvatarTx(`Locked. Improve ${tool.source.toLowerCase()} to unlock it.`, `ظ…ظ‚ظپظ„. ط­ط³ظ‘ظ† ${tool.source} ظ„ظپطھط­ظ‡.`)
    };
  };

  function _forgeAvatarWorkoutRows() {
    const weighted = typeof workouts !== 'undefined' && Array.isArray(workouts) ? workouts : [];
    const body = typeof bwWorkouts !== 'undefined' && Array.isArray(bwWorkouts) ? bwWorkouts : [];
    return { weighted, body };
  }

  function _forgeAvatarMuscleVolumes() {
    const rows = _forgeAvatarWorkoutRows();
    const volumes = {};
    const lastHit = {};
    rows.weighted.forEach(function (entry) {
      const muscle = String(entry && entry.muscle || '').trim();
      if (!muscle) return;
      const vol = Number(entry.totalVolume || 0);
      if (!Number.isFinite(vol) || vol <= 0) return;
      volumes[muscle] = (volumes[muscle] || 0) + vol;
      const hit = entry.date ? new Date(entry.date).getTime() : 0;
      if (hit && (!lastHit[muscle] || hit > lastHit[muscle])) lastHit[muscle] = hit;
    });
    rows.body.forEach(function (entry) {
      const muscle = String(entry && entry.muscle || '').trim();
      if (!muscle) return;
      const sets = Array.isArray(entry.sets) ? entry.sets : [];
      const bwScore = sets.reduce(function (sum, set) {
        return sum + Number(set.reps || set.secs || 0);
      }, 0) * 35;
      if (bwScore > 0) volumes[muscle] = (volumes[muscle] || 0) + bwScore;
      const hit = entry.date ? new Date(entry.date).getTime() : 0;
      if (hit && (!lastHit[muscle] || hit > lastHit[muscle])) lastHit[muscle] = hit;
    });
    return { volumes, lastHit };
  }

  function _forgeAvatarDaysSince(ts) {
    if (!ts || !Number.isFinite(ts)) return 999;
    const now = Date.now();
    return Math.max(0, Math.floor((now - ts) / 86400000));
  }

  function _forgeAvatarForgeTier(volume) {
    const safe = Number(volume || 0);
    if (safe >= 300000) return 5;
    if (safe >= 150000) return 4;
    if (safe >= 50000) return 3;
    if (safe >= 10000) return 2;
    return 1;
  }

  function _forgeAvatarTierMeta(tier, rankColor, filterIds) {
    const accent = rankColor || '#39ff8f';
    const ids = filterIds || { plasma: 'forgePlasmaGlow', neon: 'forgeNeonGlow', molten: 'forgeMoltenGlow' };
    if (tier >= 5) return { fill: '#ffffff', stroke: accent, glow: 'url(#' + ids.plasma + ')', label: _forgeAvatarTx('Radiant Plasma', 'ط¨ظ„ط§ط²ظ…ط§ ظ…طھظˆظ‡ط¬ط©'), cls: 'plasma' };
    if (tier === 4) return { fill: accent, stroke: '#f8fffb', glow: 'url(#' + ids.neon + ')', label: _forgeAvatarTx('Forge Energy', 'ط·ط§ظ‚ط© ظپظˆط±ط¬'), cls: 'neon' };
    if (tier === 3) return { fill: '#ff5f2a', stroke: '#ff9d4f', glow: 'url(#' + ids.molten + ')', label: _forgeAvatarTx('Molten Core', 'ظ‚ظ„ط¨ ظ…ظ†طµظ‡ط±'), cls: 'molten' };
    if (tier === 2) return { fill: '#cd7f32', stroke: '#ebb06f', glow: '', label: _forgeAvatarTx('Heated Bronze', 'ط¨ط±ظˆظ†ط² ط³ط§ط®ظ†'), cls: 'bronze' };
    return { fill: '#2a2a2a', stroke: '#555b61', glow: '', label: _forgeAvatarTx('Cold Iron', 'ط­ط¯ظٹط¯ ط¨ط§ط±ط¯'), cls: 'iron' };
  }

  function _forgeAvatarPosterStats(state) {
    const data = _forgeAvatarMuscleVolumes();
    const muscles = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Core', 'Legs', 'Calves', 'Glutes', 'Traps', 'Lower Back'];
    const rows = muscles.map(function (muscle) {
      const volume = Number(data.volumes[muscle] || 0);
      const days = _forgeAvatarDaysSince(data.lastHit[muscle]);
      return {
        muscle: muscle,
        volume: volume,
        daysSince: days,
        tier: _forgeAvatarForgeTier(volume),
        stale: days >= 14
      };
    });
    const sorted = rows.slice().sort(function (a, b) { return b.volume - a.volume; });
    return {
      rows: rows,
      strongest: sorted[0] || { muscle: _forgeAvatarTx('Balanced', 'ظ…طھظˆط§ط²ظ†'), volume: 0, tier: 1, daysSince: 999 },
      weakest: sorted[sorted.length - 1] || { muscle: _forgeAvatarTx('None', 'ظ„ط§ ظٹظˆط¬ط¯'), volume: 0, tier: 1, daysSince: 999 }
    };
  }

  function _forgeAvatarNextTierTarget(tier) {
    if (tier >= 5) return null;
    if (tier === 4) return 300000;
    if (tier === 3) return 150000;
    if (tier === 2) return 50000;
    return 10000;
  }

  function _forgeAvatarFormatVolume(volume) {
    const safe = Number(volume || 0);
    if (safe >= 1000000) return (safe / 1000000).toFixed(1) + 'M';
    if (safe >= 1000) return Math.round(safe).toLocaleString();
    return String(Math.round(safe));
  }

  window.buildProfileAvatarMuscleInspectData = function buildProfileAvatarMuscleInspectData(muscle, stateArg) {
    const rank = (typeof getCurrentLevel === 'function' && typeof calcXP === 'function') ? getCurrentLevel(calcXP()) : null;
    const balance = (typeof window.getBalanceRegionSummary === 'function') ? window.getBalanceRegionSummary() : {};
    const state = stateArg || window.buildProfileAvatarState(rank || {}, balance);
    const stats = _forgeAvatarPosterStats(state);
    const row = stats.rows.find(function (item) { return item.muscle === muscle; }) || { muscle: muscle, volume: 0, daysSince: 999, tier: 1, stale: false };
    const meta = _forgeAvatarTierMeta(row.tier, state.rankColor);
    const nextTarget = _forgeAvatarNextTierTarget(row.tier);
    const remaining = nextTarget ? Math.max(0, nextTarget - row.volume) : 0;
    return {
      muscle: row.muscle,
      currentLabel: meta.label,
      volume: row.volume,
      volumeText: _forgeAvatarFormatVolume(row.volume) + ' kg',
      daysSince: row.daysSince,
      daysText: row.daysSince >= 999 ? _forgeAvatarTx('No log yet', 'ظ„ط§ ظٹظˆط¬ط¯ طھط³ط¬ظٹظ„ ط¨ط¹ط¯') : (row.daysSince === 0 ? _forgeAvatarTx('Today', 'ط§ظ„ظٹظˆظ…') : _forgeAvatarTx(row.daysSince + 'd ago', `ظ‚ط¨ظ„ ${row.daysSince} ظٹظˆظ…`)),
      stale: row.stale,
      nextTarget: nextTarget,
      nextTargetText: nextTarget ? _forgeAvatarTx(`${_forgeAvatarFormatVolume(remaining)} kg to next tier`, `${_forgeAvatarFormatVolume(remaining)} ظƒط¬ظ… ظ„ظ„ظ…ط³طھظˆظ‰ ط§ظ„طھط§ظ„ظٹ`) : _forgeAvatarTx('Max tier unlocked', 'طھظ… ظپطھط­ ط£ط¹ظ„ظ‰ ظ…ط³طھظˆظ‰'),
      progressPct: nextTarget ? Math.max(6, Math.min(100, Math.round((row.volume / nextTarget) * 100))) : 100,
      state: state
    };
  };

  function _forgeAvatarBodyMapSvg(state, stats, filterIds) {
    const statMap = {};
    stats.rows.forEach(function (row) { statMap[row.muscle] = row; });
    function renderSide(side, title, x, y, scale) {
      const parts = FORGE_MUSCLE_PATHS[side].map(function (part) {
        const row = statMap[part.muscle] || { volume: 0, tier: 1, stale: false };
        const meta = _forgeAvatarTierMeta(row.tier, state.rankColor, filterIds);
        const opacity = row.stale ? 0.46 : (part.opacity || 1);
        const extraCls = row.stale ? ' forge-stale-zone' : '';
        return `<path d="${part.d}" data-forge-muscle="${_forgeAvatarEsc(part.muscle)}" fill="${meta.fill}" stroke="${meta.stroke}" stroke-width="${row.tier >= 4 ? 2 : 1.25}" opacity="${opacity}"${meta.glow ? ` filter="${meta.glow}"` : ''} class="forge-zone-target forge-zone-${meta.cls}${extraCls}"></path>`;
      }).join('');
      return `
        <g transform="translate(${x},${y}) scale(${scale})">
          <text x="100" y="-22" text-anchor="middle" fill="rgba(255,255,255,0.68)" font-family="DM Mono, monospace" font-size="12" letter-spacing="2">${title}</text>
          <path d="M88 49 Q100 46 112 49 L114 66 Q100 68 86 66 Z" fill="#121a19" stroke="rgba(255,255,255,0.12)" stroke-width="1.2"></path>
          ${parts}
          <ellipse cx="73" cy="392" rx="18" ry="10" fill="#101716" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
          <ellipse cx="127" cy="392" rx="18" ry="10" fill="#101716" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
        </g>
      `;
    }
    return `
      <g>
        ${renderSide('front', _forgeAvatarTx('FRONT', 'ط£ظ…ط§ظ…'), 76, 252, 1.72)}
        ${renderSide('back', _forgeAvatarTx('BACK', 'ط®ظ„ظپ'), 352, 252, 1.72)}
      </g>
    `;
  }

  function _forgeAvatarBindInspectTargets(root, state) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    Array.from(root.querySelectorAll('[data-forge-muscle]')).forEach(function (node) {
      node.style.cursor = 'pointer';
      node.onclick = function (ev) {
        if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation();
        window.openProfileAvatarMuscleInspect(node.getAttribute('data-forge-muscle'), state);
      };
    });
  }

  window.closeProfileAvatarMuscleInspect = function closeProfileAvatarMuscleInspect() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('profile-avatar-muscle-modal');
    if (modal) modal.classList.remove('open');
  };

  window.closeProfileAvatarToolInspect = function closeProfileAvatarToolInspect() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('profile-avatar-tool-modal');
    if (modal) modal.classList.remove('open');
  };

  window.openProfileAvatarToolInspect = function openProfileAvatarToolInspect(toolId, stateArg) {
    if (typeof document === 'undefined') return null;
    const modal = document.getElementById('profile-avatar-tool-modal');
    if (!modal) return null;
    const title = document.getElementById('profile-avatar-tool-title');
    const sub = document.getElementById('profile-avatar-tool-sub');
    const body = document.getElementById('profile-avatar-tool-body');
    const data = window.buildProfileAvatarToolInspectData(toolId, stateArg);
    if (!data) return null;
    if (title) title.textContent = data.label;
    if (sub) sub.textContent = String(data.tier).toUpperCase();
    if (body) body.innerHTML = `
      <div class="avatar-tool-inspect-source">${_forgeAvatarEsc(data.source)}</div>
      <div class="avatar-tool-inspect-action">${_forgeAvatarEsc(data.action)}</div>
    `;
    modal.classList.add('open');
    if (typeof sndAvatarSlot === 'function') sndAvatarSlot();
    if (typeof hapAvatarSlot === 'function') hapAvatarSlot();
    return data;
  };

  window.closeProfileAvatarSlotInspect = function closeProfileAvatarSlotInspect() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('profile-avatar-slot-modal');
    if (modal) modal.classList.remove('open');
  };

  window.openProfileAvatarSlotInspect = function openProfileAvatarSlotInspect(slotId, stateArg) {
    if (typeof document === 'undefined') return null;
    const modal = document.getElementById('profile-avatar-slot-modal');
    if (!modal) return null;
    const title = document.getElementById('profile-avatar-slot-title');
    const sub = document.getElementById('profile-avatar-slot-sub');
    const body = document.getElementById('profile-avatar-slot-body');
    const data = window.buildProfileAvatarSlotInspectData(slotId, stateArg);
    if (!data) return null;
    if (title) title.textContent = data.label;
    if (sub) sub.textContent = String(data.tier).toUpperCase();
    if (body) body.innerHTML =       '<div class="avatar-slot-inspect-need">' + _forgeAvatarEsc(data.needText) + '</div>' +
      '<div class="avatar-slot-inspect-score">' + _forgeAvatarEsc(data.scoreLine) + '</div>' +
      '<div class="avatar-slot-inspect-block"><div class="avatar-slot-inspect-label">' + _forgeAvatarEsc(_forgeAvatarTx('What counts', '?? ???? ?????')) + '</div><div class="avatar-slot-inspect-copy">' + _forgeAvatarEsc(data.whatCounts) + '</div></div>' +
      '<div class="avatar-slot-inspect-block"><div class="avatar-slot-inspect-label">' + _forgeAvatarEsc(_forgeAvatarTx('Best exercises', '???? ????????')) + '</div><div class="avatar-slot-inspect-copy">' + _forgeAvatarEsc(data.bestExercises) + '</div></div>' +
      '<div class="avatar-slot-inspect-block"><div class="avatar-slot-inspect-label">' + _forgeAvatarEsc(_forgeAvatarTx('Fastest path this week', '???? ???? ??? ???????')) + '</div><div class="avatar-slot-inspect-copy">' + _forgeAvatarEsc(data.quickWin) + '</div></div>' +
      '<div class="avatar-slot-inspect-block"><div class="avatar-slot-inspect-label">' + _forgeAvatarEsc(_forgeAvatarTx('Common mistake', '????? ??????')) + '</div><div class="avatar-slot-inspect-copy">' + _forgeAvatarEsc(data.commonMistake) + '</div></div>';
    modal.classList.add('open');
    if (typeof sndAvatarSlot === 'function') sndAvatarSlot();
    if (typeof hapAvatarSlot === 'function') hapAvatarSlot();
    return data;
  };

  window.setProfileAvatarDetailView = function setProfileAvatarDetailView(view) {
    _forgeAvatarDetailView = view === 'map' ? 'map' : 'avatar';
    if (typeof document === 'undefined') return _forgeAvatarDetailView;
    Array.from(document.querySelectorAll('.avatar-detail-tab')).forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-view') === _forgeAvatarDetailView);
    });
    const avatarPanel = document.getElementById('profile-avatar-view-avatar');
    const mapPanel = document.getElementById('profile-avatar-view-map');
    if (avatarPanel) avatarPanel.style.display = _forgeAvatarDetailView === 'avatar' ? '' : 'none';
    if (mapPanel) mapPanel.style.display = _forgeAvatarDetailView === 'map' ? '' : 'none';
    return _forgeAvatarDetailView;
  };

  window.openProfileAvatarMuscleInspect = function openProfileAvatarMuscleInspect(muscle, stateArg) {
    if (typeof document === 'undefined') return null;
    const modal = document.getElementById('profile-avatar-muscle-modal');
    if (!modal) return null;
    const title = document.getElementById('profile-avatar-muscle-title');
    const sub = document.getElementById('profile-avatar-muscle-sub');
    const meter = document.getElementById('profile-avatar-muscle-meter');
    const next = document.getElementById('profile-avatar-muscle-next');
    const statA = document.getElementById('profile-avatar-muscle-stat-a');
    const statB = document.getElementById('profile-avatar-muscle-stat-b');
    const statC = document.getElementById('profile-avatar-muscle-stat-c');
    const data = window.buildProfileAvatarMuscleInspectData(muscle, stateArg);
    if (title) title.textContent = data.muscle;
    if (sub) sub.textContent = data.currentLabel;
    if (meter) meter.style.width = data.progressPct + '%';
    if (next) next.textContent = data.nextTargetText;
    if (statA) statA.textContent = data.volumeText;
    if (statB) statB.textContent = data.daysText;
    if (statC) statC.textContent = data.stale ? _forgeAvatarTx('Cooling down', 'طھط¨ط±ط¯ ط§ظ„ط¢ظ†') : _forgeAvatarTx('Actively forged', 'ظ†ط´ط· ط§ظ„ط¢ظ†');
    modal.classList.add('open');
    if (typeof sndAvatarSlot === 'function') sndAvatarSlot();
    if (typeof hapAvatarSlot === 'function') hapAvatarSlot();
    return data;
  };

  function _forgeAvatarSvgIdSuffix(seed) {
    return String(seed || 'forge').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'forge';
  }

  window.buildProfileAvatarPosterSvg = function buildProfileAvatarPosterSvg(stateArg, options) {
    const rank = (typeof getCurrentLevel === 'function' && typeof calcXP === 'function') ? getCurrentLevel(calcXP()) : null;
    const balance = (typeof window.getBalanceRegionSummary === 'function') ? window.getBalanceRegionSummary() : {};
    const state = stateArg || window.buildProfileAvatarState(rank || {}, balance);
    const mode = (options && options.mode) || 'showcase';
    const name = _forgeAvatarEsc((options && options.name) || (typeof userProfile !== 'undefined' && userProfile && userProfile.name) || 'FORGE ATHLETE');
    const suffix = _forgeAvatarSvgIdSuffix([mode, state.rankTier, state.theme, name].join('-'));
    const filterIds = {
      molten: 'forge-molten-' + suffix,
      neon: 'forge-neon-' + suffix,
      plasma: 'forge-plasma-' + suffix
    };
    const posterStats = _forgeAvatarPosterStats(state);
    const summary = _forgeAvatarSummary(state, {
      strongest: (options && options.strongest) || _forgeAvatarTx(posterStats.strongest.muscle, posterStats.strongest.muscle),
      weakest: (options && options.weakest) || _forgeAvatarTx(posterStats.weakest.muscle, posterStats.weakest.muscle)
    });
    const dateStr = _forgeAvatarEsc(new Date().toLocaleDateString(_forgeAvatarIsAr() ? 'ar-SA' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
    const avatarHero = _forgeAvatarSvg(state).replace('<svg ', '<svg x="74" y="228" width="470" height="560" ');
    const miniBodyMap = _forgeAvatarBodyMapSvg(state, posterStats, filterIds);
    const featuredTools = ((state.tools && Array.isArray(state.tools.featured) && state.tools.featured.length)
      ? state.tools.featured
      : (state.tools && Array.isArray(state.tools.list) ? state.tools.list.slice(0, 3) : [])).slice(0, 3);
    const topRows = posterStats.rows.slice().sort(function (a, b) { return b.volume - a.volume; }).slice(0, 3);
    const toolRows = featuredTools.map(function (tool, idx) {
      const x = 74 + (idx * 312);
      return '<g transform="translate(' + x + ', 1140)">' +
        '<rect width="286" height="92" rx="22" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)"></rect>' +
        '<text x="20" y="34" fill="#ffffff" font-family="Barlow Condensed, Arial, sans-serif" font-size="30" font-weight="700">' + _forgeAvatarEsc(tool.label) + '</text>' +
        '<text x="20" y="58" fill="rgba(255,255,255,0.68)" font-family="DM Mono, monospace" font-size="14">' + _forgeAvatarEsc(String(tool.tier).toUpperCase()) + '</text>' +
        '<text x="20" y="78" fill="rgba(255,255,255,0.56)" font-family="Barlow, Arial, sans-serif" font-size="16">' + _forgeAvatarEsc(tool.source) + '</text>' +
      '</g>';
    }).join('');
    const spotlightCards = topRows.map(function (row, idx) {
      const meta = _forgeAvatarTierMeta(row.tier, state.rankColor);
      const x = 610;
      const y = 400 + (idx * 128);
      return '<g>' +
        '<rect x="' + x + '" y="' + y + '" width="388" height="96" rx="24" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)"></rect>' +
        '<circle cx="' + (x + 32) + '" cy="' + (y + 32) + '" r="10" fill="' + meta.stroke + '"></circle>' +
        '<text x="' + (x + 56) + '" y="' + (y + 36) + '" fill="#ffffff" font-family="Barlow Condensed, Arial, sans-serif" font-size="30" font-weight="700">' + _forgeAvatarEsc(row.muscle) + '</text>' +
        '<text x="' + (x + 56) + '" y="' + (y + 62) + '" fill="rgba(255,255,255,0.65)" font-family="DM Mono, monospace" font-size="14">' + _forgeAvatarEsc(meta.label.toUpperCase()) + '</text>' +
        '<text x="' + (x + 56) + '" y="' + (y + 82) + '" fill="rgba(255,255,255,0.72)" font-family="Barlow, Arial, sans-serif" font-size="18">' + _forgeAvatarEsc(Math.round(Number(row.volume) || 0).toLocaleString() + ' kg') + '</text>' +
      '</g>';
    }).join('');
    const posterBody = mode === 'proof'
      ? '<text x="610" y="178" fill="rgba(255,255,255,0.7)" font-family="DM Mono, monospace" font-size="18">FORGE PROOF</text>' +
        '<text x="610" y="244" fill="#ffffff" font-family="Bebas Neue, Impact, sans-serif" font-size="104">' + Math.round(_forgeAvatarClamp(state.overall) * 100) + '%</text>' +
        '<text x="610" y="284" fill="rgba(255,255,255,0.72)" font-family="Barlow, Arial, sans-serif" font-size="24">' + _forgeAvatarEsc(_forgeAvatarTx('Readiness and balance fused into one visual build.', '???????? ???????? ?? ???? ???? ????.')) + '</text>' +
        '<text x="610" y="332" fill="rgba(255,255,255,0.82)" font-family="Barlow Condensed, Arial, sans-serif" font-size="30" font-weight="700">' + _forgeAvatarEsc(_forgeAvatarTx('Strongest lane', '???? ????')) + ': ' + _forgeAvatarEsc(summary.strongest) + '</text>' +
        '<text x="610" y="366" fill="rgba(255,255,255,0.68)" font-family="Barlow, Arial, sans-serif" font-size="24">' + _forgeAvatarEsc(_forgeAvatarTx('Focus next', '??? ??? ???')) + ': ' + _forgeAvatarEsc(summary.weakest) + '</text>' +
        spotlightCards
      : '<text x="610" y="178" fill="rgba(255,255,255,0.7)" font-family="DM Mono, monospace" font-size="18">FORGE SHOWCASE</text>' +
        '<text x="610" y="244" fill="#ffffff" font-family="Bebas Neue, Impact, sans-serif" font-size="82">' + _forgeAvatarEsc(state.rankName.toUpperCase()) + '</text>' +
        '<text x="610" y="286" fill="rgba(255,255,255,0.86)" font-family="Barlow Condensed, Arial, sans-serif" font-size="30" font-weight="700">' + _forgeAvatarEsc(state.insight) + '</text>' +
        '<text x="610" y="334" fill="rgba(255,255,255,0.78)" font-family="Barlow, Arial, sans-serif" font-size="24">' + _forgeAvatarEsc(_forgeAvatarTx('Strongest region', '???? ?????')) + ': ' + _forgeAvatarEsc(summary.strongest) + '</text>' +
        '<text x="610" y="368" fill="rgba(255,255,255,0.66)" font-family="Barlow, Arial, sans-serif" font-size="24">' + _forgeAvatarEsc(_forgeAvatarTx('Needs attention', '????? ??????')) + ': ' + _forgeAvatarEsc(summary.weakest) + '</text>' +
        (spotlightCards || ('<text x="610" y="450" fill="rgba(255,255,255,0.62)" font-family="Barlow, Arial, sans-serif" font-size="24">' + _forgeAvatarEsc(_forgeAvatarTx('Train more muscle groups to unlock stronger forged armor.', '???? ????? ???? ???? ??? ????? ????.')) + '</text>'));
    return '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">' +
      '<defs>' +
        '<linearGradient id="avatarPosterBg" x1="0%" y1="0%" x2="100%" y2="100%">' +
          '<stop offset="0%" stop-color="#071513"/>' +
          '<stop offset="50%" stop-color="#0c241f"/>' +
          '<stop offset="100%" stop-color="#101816"/>' +
        '</linearGradient>' +
        '<radialGradient id="avatarPosterGlow" cx="25%" cy="20%" r="55%">' +
          '<stop offset="0%" stop-color="' + _forgeAvatarEsc(state.rankColor) + '" stop-opacity="0.28"/>' +
          '<stop offset="100%" stop-color="' + _forgeAvatarEsc(state.rankColor) + '" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<filter id="' + filterIds.molten + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur><feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>' +
        '<filter id="' + filterIds.neon + '" x="-55%" y="-55%" width="210%" height="210%"><feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur><feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>' +
        '<filter id="' + filterIds.plasma + '" x="-75%" y="-75%" width="250%" height="250%"><feGaussianBlur stdDeviation="11" result="blur"></feGaussianBlur><feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -6"></feColorMatrix><feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>' +
      '</defs>' +
      '<rect width="1080" height="1350" fill="url(#avatarPosterBg)"></rect>' +
      '<rect width="1080" height="1350" fill="url(#avatarPosterGlow)"></rect>' +
      '<rect x="42" y="42" width="996" height="1266" rx="42" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)"></rect>' +
      '<text x="84" y="98" fill="' + _forgeAvatarEsc(state.rankColor) + '" font-family="DM Mono, monospace" font-size="20">FORGE PROGRESSION</text>' +
      '<text x="84" y="160" fill="#ffffff" font-family="Bebas Neue, Impact, sans-serif" font-size="78">' + name + '</text>' +
      '<text x="84" y="206" fill="rgba(255,255,255,0.62)" font-family="Barlow, Arial, sans-serif" font-size="28">' + dateStr + '</text>' +
      '<rect x="74" y="228" width="470" height="780" rx="36" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"></rect>' +
      '<circle cx="308" cy="390" r="182" fill="' + _forgeAvatarEsc(state.rankColor) + '" opacity="0.12"></circle>' +
      '<circle cx="308" cy="390" r="132" fill="#ffffff" opacity="0.04"></circle>' +
      avatarHero +
      '<text x="84" y="1004" fill="rgba(255,255,255,0.78)" font-family="Barlow Condensed, Arial, sans-serif" font-size="38" font-weight="700">' + _forgeAvatarEsc(state.rankIcon) + ' ' + _forgeAvatarEsc(state.rankName) + '</text>' +
      '<text x="84" y="1044" fill="rgba(255,255,255,0.58)" font-family="DM Mono, monospace" font-size="22">' + _forgeAvatarEsc(_forgeAvatarTx('Theme', '?????')) + ' ' + _forgeAvatarEsc(String(state.theme).toUpperCase()) + ' | ' + _forgeAvatarEsc(_forgeAvatarTx('Balance', '???????')) + ' ' + Math.round(_forgeAvatarClamp(state.overall) * 100) + '%</text>' +
      '<g transform="translate(638, 760)">' +
        '<rect x="0" y="0" width="320" height="310" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)"></rect>' +
        '<text x="18" y="28" fill="rgba(255,255,255,0.72)" font-family="DM Mono, monospace" font-size="16">' + _forgeAvatarEsc(_forgeAvatarTx('Muscle map', '????? ???????')) + '</text>' +
        '<g transform="translate(-18, -94) scale(0.42)">' + miniBodyMap + '</g>' +
      '</g>' +
      posterBody +
      toolRows +
    '</svg>';
  };

  function _forgeAvatarGetPersistedSlots() {
    try { return JSON.parse(localStorage.getItem(FORGE_AVATAR_STATE_KEY) || '{}'); } catch (_e) { return {}; }
  }

  function _forgeAvatarPersistSlots(slots) {
    try { localStorage.setItem(FORGE_AVATAR_STATE_KEY, JSON.stringify(slots || {})); } catch (_e) {}
  }

  function _forgeAvatarCheckUpgrade(state) {
    const prev = _forgeAvatarGetPersistedSlots();
    const upgraded = FORGE_AVATAR_SLOT_ORDER.filter((slot) => {
      return (FORGE_AVATAR_TIER_SCORE[state.slots[slot]] || 0) > (FORGE_AVATAR_TIER_SCORE[prev[slot]] || 0);
    });
    const hadPrev = Object.keys(prev).length > 0;
    _forgeAvatarPersistSlots(state.slots);
    return hadPrev ? upgraded : [];
  }

  function _forgeAvatarPulseCard() {
    const card = document.getElementById('profile-avatar-card');
    if (!card) return;
    card.classList.remove('avatar-upgraded');
    void card.offsetWidth;
    card.classList.add('avatar-upgraded');
    setTimeout(function () { card.classList.remove('avatar-upgraded'); }, 1200);
  }

  function _forgeAvatarToBlob(svg) {
    return new Promise(function (resolve) {
      try {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        resolve(blob);
      } catch (_e) {
        resolve(null);
      }
    });
  }

  function _forgeAvatarSvgToPngBlob(svg) {
    return new Promise(function (resolve) {
      const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = 1080;
        canvas.height = 1350;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          URL.revokeObjectURL(url);
          resolve(blob || null);
        }, 'image/png');
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }

  function _forgeAvatarRenderSharePreview(mode) {
    const preview = document.getElementById('profile-avatar-share-preview');
    if (!preview) return null;
    const rank = (typeof getCurrentLevel === 'function' && typeof calcXP === 'function') ? getCurrentLevel(calcXP()) : null;
    const balance = (typeof window.getBalanceRegionSummary === 'function') ? window.getBalanceRegionSummary() : {};
    const state = window.buildProfileAvatarState(rank || {}, balance);
    const summary = _forgeAvatarSummary(state);
    const svg = window.buildProfileAvatarPosterSvg(state, {
      mode: mode,
      name: (typeof userProfile !== 'undefined' && userProfile && userProfile.name) || 'FORGE ATHLETE',
      strongest: summary.strongest,
      weakest: summary.weakest
    });
    preview.innerHTML = svg;
    _forgeAvatarBindInspectTargets(preview, state);
    const title = document.getElementById('profile-avatar-share-title');
    if (title) title.textContent = _forgeAvatarTx('Share Avatar', 'ظ…ط´ط§ط±ظƒط© ط§ظ„ط£ظپط§طھط§ط±');
    const modeLbl = document.getElementById('profile-avatar-share-mode-label');
    if (modeLbl) modeLbl.textContent = mode === 'proof' ? _forgeAvatarTx('Proof Mode', 'ظˆط¶ط¹ ط§ظ„ط¥ط«ط¨ط§طھ') : _forgeAvatarTx('Showcase Mode', 'ظˆط¶ط¹ ط§ظ„ط¹ط±ط¶');
    Array.from(document.querySelectorAll('.avatar-share-mode-btn')).forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
    return svg;
  }

  window.buildProfileAvatarState = function buildProfileAvatarState(rankData, balanceData) {
    const rankTier = _forgeAvatarRankTier(rankData || {});
    const theme = _forgeAvatarTheme(rankTier);
    const metrics = _forgeAvatarAggregateMetrics();
    const balance = {
      chest: _forgeAvatarClamp(balanceData && balanceData.chest),
      back: _forgeAvatarClamp(balanceData && balanceData.back),
      shoulders: _forgeAvatarClamp(balanceData && balanceData.shoulders),
      arms: _forgeAvatarClamp(balanceData && balanceData.arms),
      core: _forgeAvatarClamp(balanceData && balanceData.core),
      legs: _forgeAvatarClamp(balanceData && balanceData.legs),
      posterior: _forgeAvatarClamp(balanceData && balanceData.posterior),
      overall: _forgeAvatarClamp(balanceData && balanceData.overall)
    };

    const slots = {
      head: rankTier === 'legend' ? 'mythic' : rankTier === 'elite' ? 'elite' : 'basic',
      shoulders: window._forgeAvatarSlotTier((balance.shoulders + balance.back) / 2),
      torso: window._forgeAvatarSlotTier((balance.chest + balance.core) / 2),
      arms: window._forgeAvatarSlotTier(balance.arms),
      legs: window._forgeAvatarSlotTier(balance.legs),
      back: window._forgeAvatarSlotTier(balance.posterior)
    };

    return {
      rankTier,
      theme,
      rankName: rankData && rankData.name ? rankData.name : _forgeAvatarTx('Rookie', 'ظ…ط¨طھط¯ط¦'),
      rankIcon: rankData && rankData.icon ? rankData.icon : '*',
      rankColor: rankData && rankData.color ? rankData.color : '#39ff8f',
      overall: balance.overall,
      metrics,
      balance,
      slots,
      tools: window.buildProfileAvatarToolState(metrics),
      insight: _forgeAvatarInsight(slots, balance)
    };
  };

  function _forgeAvatarSvg(state) {
    const isAr = _forgeAvatarIsAr();
    const dir = isAr ? 'rtl' : 'ltr';
    const tools = state.tools && state.tools.map ? state.tools.map : {};
    return `
      <svg class="forge-avatar-svg forge-avatar-svg-anime forge-avatar-theme-${state.theme} forge-avatar-rank-${state.rankTier}" viewBox="0 0 220 260" role="img" aria-label="${state.rankName}" dir="${dir}">
        <defs>
          <linearGradient id="forgeAvatarBg-${state.theme}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.16)"></stop>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"></stop>
          </linearGradient>
          <linearGradient id="forgeAnimeEdge-${state.theme}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.55)"></stop>
            <stop offset="100%" stop-color="rgba(255,255,255,0.02)"></stop>
          </linearGradient>
        </defs>
        <rect x="18" y="16" width="184" height="228" rx="30" class="forge-avatar-shell"></rect>
        <rect x="18" y="16" width="184" height="228" rx="30" fill="url(#forgeAvatarBg-${state.theme})"></rect>
        <path d="M78 26 L110 16 L142 26 L148 44 L136 62 L84 62 L72 44 Z" class="forge-avatar-anime-crest"></path>
        <g class="forge-avatar-backpiece forge-avatar-tier-${state.slots.back}">
          <path d="M74 86 C62 100, 56 124, 60 172 L84 214 L94 108 Z"></path>
          <path d="M146 86 C158 100, 164 124, 160 172 L136 214 L126 108 Z"></path>
        </g>
        <g class="forge-avatar-body">
          <circle cx="110" cy="54" r="20" class="forge-avatar-head"></circle>
          <path d="M94 48 L110 42 L126 48" class="forge-avatar-anime-brow"></path>
          <path d="M102 58 L118 58" class="forge-avatar-anime-eye"></path>
          <path d="M92 78 L128 78 L142 116 L134 192 L86 192 L78 116 Z" class="forge-avatar-torso"></path>
          <path d="M88 82 L64 128 L78 136 L98 102 Z" class="forge-avatar-arm-left"></path>
          <path d="M132 82 L156 128 L142 136 L122 102 Z" class="forge-avatar-arm-right"></path>
          <path d="M96 190 L82 236 L98 236 L110 196 Z" class="forge-avatar-leg-left"></path>
          <path d="M124 190 L110 196 L122 236 L138 236 Z" class="forge-avatar-leg-right"></path>
        </g>
        <g class="forge-avatar-tier-${state.slots.head}">
          <path d="M92 34 L110 22 L128 34 L122 46 L98 46 Z" class="forge-avatar-helm"></path>
        </g>
        <g class="forge-avatar-tier-${state.slots.shoulders}">
          <path d="M74 82 L96 76 L102 92 L78 104 Z" class="forge-avatar-shoulder-left"></path>
          <path d="M146 82 L124 76 L118 92 L142 104 Z" class="forge-avatar-shoulder-right"></path>
        </g>
        <g class="forge-avatar-tier-${state.slots.torso}">
          <path d="M92 88 L128 88 L136 114 L130 182 L90 182 L84 114 Z" class="forge-avatar-chestplate"></path>
          <path d="M110 90 L110 180" class="forge-avatar-coreline"></path>
        </g>
        <g class="forge-avatar-tier-${state.slots.arms}">
          <path d="M62 132 L78 138 L72 170 L58 164 Z" class="forge-avatar-gauntlet-left"></path>
          <path d="M158 132 L142 138 L148 170 L162 164 Z" class="forge-avatar-gauntlet-right"></path>
        </g>
        <g class="forge-avatar-tier-${state.slots.legs}">
          <path d="M88 188 L104 188 L100 236 L82 236 Z" class="forge-avatar-greave-left"></path>
          <path d="M116 188 L132 188 L138 236 L120 236 Z" class="forge-avatar-greave-right"></path>
        </g>
        <g class="forge-avatar-tool forge-avatar-tool-hammer forge-avatar-tier-${tools.hammer ? tools.hammer.tier : 'none'}">
          <path d="M158 78 L176 68 L182 76 L170 84 L176 122 L170 124 L162 86 Z"></path>
          <rect x="170" y="62" width="24" height="12" rx="4"></rect>
        </g>
        <g class="forge-avatar-tool forge-avatar-tool-chain forge-avatar-tier-${tools.chain ? tools.chain.tier : 'none'}">
          <path d="M58 54 C72 42, 88 38, 110 38 C132 38, 148 42, 162 54" fill="none"></path>
          <circle cx="74" cy="46" r="4"></circle>
          <circle cx="92" cy="40" r="4"></circle>
          <circle cx="110" cy="38" r="4"></circle>
          <circle cx="128" cy="40" r="4"></circle>
          <circle cx="146" cy="46" r="4"></circle>
        </g>
        <g class="forge-avatar-tool forge-avatar-tool-reactor forge-avatar-tier-${tools.reactor ? tools.reactor.tier : 'none'}">
          <circle cx="110" cy="124" r="10"></circle>
          <circle cx="110" cy="124" r="4" class="forge-avatar-tool-core"></circle>
        </g>
        <g class="forge-avatar-tool forge-avatar-tool-flask forge-avatar-tier-${tools.flask ? tools.flask.tier : 'none'}">
          <path d="M48 144 L56 144 L60 166 Q61 174 54 176 L50 176 Q43 174 44 166 Z"></path>
          <path d="M50 136 L54 136 L54 144 L50 144 Z"></path>
        </g>
        <g class="forge-avatar-tool forge-avatar-tool-sigil forge-avatar-tier-${tools.sigil ? tools.sigil.tier : 'none'}">
          <path d="M150 132 L160 126 L170 132 L166 144 L154 144 Z"></path>
        </g>
      </svg>
    `;
  }

  window.renderProfileAvatarCard = function renderProfileAvatarCard(rankData, balanceData) {
    const rank = rankData || (typeof getCurrentLevel === 'function' && typeof calcXP === 'function' ? getCurrentLevel(calcXP()) : null) || {};
    const balance = balanceData || (typeof window.getBalanceRegionSummary === 'function' ? window.getBalanceRegionSummary() : null) || {};
    const state = window.buildProfileAvatarState(rank, balance);

    if (typeof document === 'undefined') return state;
    const stage = document.getElementById('profile-avatar-stage');
    const insight = document.getElementById('profile-avatar-insight');
    const badge = document.getElementById('profile-avatar-theme-badge');
    const slots = document.getElementById('profile-avatar-slot-list');
    const title = document.getElementById('profile-avatar-card-title');
    const sub = document.getElementById('profile-avatar-card-subtitle');

    if (title) title.textContent = _forgeAvatarTx('Forge Avatar', 'ط£ظپط§طھط§ط± ظپظˆط±ط¬');
    if (sub) sub.textContent = _forgeAvatarTx('Armor evolves from your training balance.', 'ط§ظ„ط¯ط±ط¹ ظٹطھط·ظˆط± ط­ط³ط¨ طھظˆط§ط²ظ† طھط¯ط±ظٹط¨ظƒ.');
    if (stage) stage.innerHTML = _forgeAvatarSvg(state);
    if (insight) insight.textContent = state.insight;
    if (badge) {
      badge.textContent = _forgeAvatarTx('Theme', 'ط§ظ„ط³ظ…ط§طھ') + ': ' + _forgeAvatarTx(
        state.theme.charAt(0).toUpperCase() + state.theme.slice(1),
        state.theme === 'solar' ? 'ط´ظ…ط³ظٹ' : state.theme === 'aqua' ? 'ظ…ط§ط¦ظٹ' : 'ط­ط¯ظٹط¯ظٹ'
      );
      badge.style.color = state.rankColor || '#39ff8f';
    }
    if (slots) {
      const slotHtml = FORGE_AVATAR_SLOT_ORDER.map((slot) => `
        <span class="profile-avatar-slot-chip tier-${state.slots[slot]}">
          <strong>${_forgeAvatarSlotLabel(slot)}</strong>
          <small>${state.slots[slot]}</small>
        </span>
      `).join('');
      const toolHtml = (state.tools && Array.isArray(state.tools.featured) ? state.tools.featured : []).map((tool) => `
        <span class="profile-avatar-slot-chip tool-chip tier-${tool.tier}">
          <strong>${tool.label}</strong>
          <small>${tool.source}</small>
        </span>
      `).join('');
      slots.innerHTML = slotHtml + toolHtml;
    }
    const upgraded = _forgeAvatarCheckUpgrade(state);
    if (upgraded.length) {
      _forgeAvatarPulseCard();
      if (typeof sndAvatarUnlock === 'function') sndAvatarUnlock();
      if (typeof hapAvatarUnlock === 'function') hapAvatarUnlock();
      if (typeof showToast === 'function') {
        showToast(_forgeAvatarTx(
          `${_forgeAvatarSlotLabel(upgraded[0])} upgraded`,
          `طھظ… طھط·ظˆظٹط± ${_forgeAvatarSlotLabel(upgraded[0])}`
        ), 'success');
      }
    }
    const card = document.getElementById('profile-avatar-card');
    if (card) {
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.onclick = function () { window.openProfileAvatarDetails(state); };
      card.onkeydown = function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          window.openProfileAvatarDetails(state);
        }
      };
    }
    return state;
  };

  window.closeProfileAvatarDetails = function closeProfileAvatarDetails() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('profile-avatar-modal');
    if (!modal) return;
    modal.classList.remove('open');
  };

  window.openProfileAvatarDetails = function openProfileAvatarDetails(stateArg) {
    if (typeof document === 'undefined') return null;
    const modal = document.getElementById('profile-avatar-modal');
    const hero = document.getElementById('profile-avatar-modal-hero');
    const title = document.getElementById('profile-avatar-modal-title');
    const sub = document.getElementById('profile-avatar-modal-sub');
    const focus = document.getElementById('profile-avatar-modal-focus');
    const list = document.getElementById('profile-avatar-modal-slots');
    if (!modal || !hero || !title || !sub || !focus || !list) return null;

    const rank = (typeof getCurrentLevel === 'function' && typeof calcXP === 'function') ? getCurrentLevel(calcXP()) : null;
    const balance = (typeof window.getBalanceRegionSummary === 'function') ? window.getBalanceRegionSummary() : {};
    const state = stateArg || window.buildProfileAvatarState(rank || {}, balance);
    const details = _forgeAvatarDetailsData(state, state.balance || balance);
    const posterStats = _forgeAvatarPosterStats(state);
    const modalFilterIds = { molten: 'forgeMoltenGlow-modal', neon: 'forgeNeonGlow-modal', plasma: 'forgePlasmaGlow-modal' };
    const tools = state.tools && Array.isArray(state.tools.list) ? state.tools.list : [];
    const featuredTools = (state.tools && Array.isArray(state.tools.featured) && state.tools.featured.length ? state.tools.featured : tools.slice(0, 3));
    const mapStats = posterStats.rows.slice().sort(function (a, b) { return b.volume - a.volume; }).slice(0, 3);

    title.textContent = _forgeAvatarTx('Avatar Gear Sheet', '????? ????? ????????');
    sub.textContent = state.rankIcon + ' ' + state.rankName + ' - ' + _forgeAvatarTx('overall balance', '??????? ?????') + ' ' + Math.round(_forgeAvatarClamp(state.overall) * 100) + '%';
    hero.innerHTML = '<div class="avatar-detail-tabs">' +
      '<button class="avatar-detail-tab active" data-view="avatar" type="button">' + _forgeAvatarEsc(_forgeAvatarTx('Avatar', '????????')) + '</button>' +
      '<button class="avatar-detail-tab" data-view="map" type="button">' + _forgeAvatarEsc(_forgeAvatarTx('Muscle Map', '????? ???????')) + '</button>' +
      '</div>' +
      '<div class="avatar-detail-view" id="profile-avatar-view-avatar">' +
        '<div class="avatar-modal-single-hero">' +
          '<div class="avatar-modal-anime-stage">' + _forgeAvatarSvg(state) + '</div>' +
          '<div class="avatar-modal-tools">' +
            (featuredTools.map(function (tool) {
              return '<button class="avatar-tool-card tier-' + tool.tier + '" type="button" data-avatar-tool="' + _forgeAvatarEsc(tool.id) + '">' +
                '<div class="avatar-tool-card-name">' + _forgeAvatarEsc(tool.label) + '</div>' +
                '<div class="avatar-tool-card-tier">' + _forgeAvatarEsc(String(tool.tier).toUpperCase()) + '</div>' +
                '<div class="avatar-tool-card-src">' + _forgeAvatarEsc(tool.source) + '</div>' +
              '</button>';
            }).join('') || ('<div class="avatar-tool-card"><div class="avatar-tool-card-name">' + _forgeAvatarEsc(_forgeAvatarTx('No tools unlocked yet', '?? ???? ????? ?????? ???')) + '</div><div class="avatar-tool-card-src">' + _forgeAvatarEsc(_forgeAvatarTx('Build streak, volume, and readiness to unlock your first tool.', '???? ????? ??????? ?????? ????????? ???? ??? ????.')) + '</div></div>')) +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="avatar-detail-view" id="profile-avatar-view-map" style="display:none;">' +
        '<div class="avatar-modal-anime-stage">' +
          '<svg viewBox="0 0 720 1040" width="100%" height="100%" role="img" aria-label="Forge muscle map">' +
            '<defs>' +
              '<filter id="' + modalFilterIds.molten + '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="blur"></feGaussianBlur><feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>' +
              '<filter id="' + modalFilterIds.neon + '" x="-55%" y="-55%" width="210%" height="210%"><feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur><feMerge><feMergeNode in="blur"></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>' +
              '<filter id="' + modalFilterIds.plasma + '" x="-75%" y="-75%" width="250%" height="250%"><feGaussianBlur stdDeviation="11" result="blur"></feGaussianBlur><feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -6"></feColorMatrix><feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge></filter>' +
            '</defs>' +
            _forgeAvatarBodyMapSvg(state, posterStats, modalFilterIds) +
          '</svg>' +
        '</div>' +
        '<div class="avatar-muscle-stats">' +
          mapStats.map(function (row) {
            const meta = _forgeAvatarTierMeta(row.tier, state.rankColor, modalFilterIds);
            return '<div class="avatar-tool-card">' +
              '<div class="avatar-tool-card-name">' + _forgeAvatarEsc(row.muscle) + '</div>' +
              '<div class="avatar-tool-card-tier" style="color:' + _forgeAvatarEsc(meta.stroke) + '">' + _forgeAvatarEsc(meta.label.toUpperCase()) + '</div>' +
              '<div class="avatar-tool-card-src">' + _forgeAvatarEsc(Math.round(Number(row.volume) || 0).toLocaleString() + ' kg') + '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';
    focus.textContent = details.focus;
    list.innerHTML = details.slots.map(function (slot) {
      return '<div class="avatar-modal-slot tier-' + slot.tier + '" data-slot="' + slot.id + '">' +
        '<div class="avatar-modal-slot-top">' +
          '<div>' +
            '<div class="avatar-modal-slot-name">' + slot.label + '</div>' +
            '<div class="avatar-modal-slot-src">' + slot.sourceLabel + '</div>' +
          '</div>' +
          '<div class="avatar-modal-slot-tier">' + slot.tier + '</div>' +
        '</div>' +
        '<div class="avatar-modal-slot-bar"><span style="width:' + slot.progressPct + '%"></span></div>' +
        '<div class="avatar-modal-slot-hint">' + slot.hint + '</div>' +
        '<div class="avatar-modal-slot-hint">' + _forgeAvatarTx('Current', '??????') + ' ' + slot.progressPct + '% | ' + _forgeAvatarTx('Unlock', '?????') + ' ' + slot.unlockAt + '%</div>' +
        '<div class="avatar-modal-slot-hint">' + slot.nextAction + '</div>' +
      '</div>';
    }).join('');
    Array.from(hero.querySelectorAll('.avatar-detail-tab')).forEach(function (btn) {
      btn.onclick = function () {
        window.setProfileAvatarDetailView(btn.getAttribute('data-view'));
      };
    });
    Array.from(hero.querySelectorAll('[data-avatar-tool]')).forEach(function (btn) {
      btn.onclick = function () {
        const toolId = btn.getAttribute('data-avatar-tool');
        btn.classList.remove('active-pulse');
        void btn.offsetWidth;
        btn.classList.add('active-pulse');
        setTimeout(function () { btn.classList.remove('active-pulse'); }, 460);
        window.openProfileAvatarToolInspect(toolId, state);
      };
    });
    const mapPanel = document.getElementById('profile-avatar-view-map');
    if (mapPanel) _forgeAvatarBindInspectTargets(mapPanel, state);
    Array.from(list.querySelectorAll('.avatar-modal-slot')).forEach(function (el) {
      el.onclick = function () {
        el.classList.remove('active-pulse');
        void el.offsetWidth;
        el.classList.add('active-pulse');
        if (typeof sndAvatarSlot === 'function') sndAvatarSlot();
        if (typeof hapAvatarSlot === 'function') hapAvatarSlot();
        setTimeout(function () { el.classList.remove('active-pulse'); }, 460);
        window.openProfileAvatarSlotInspect(el.getAttribute('data-slot'), state);
      };
    });
    window.setProfileAvatarDetailView('avatar');
    modal.classList.add('open');
    if (typeof sndAvatarOpen === 'function') sndAvatarOpen();
    if (typeof hapAvatarOpen === 'function') hapAvatarOpen();
    return state;
  };

  window.closeProfileAvatarShare = function closeProfileAvatarShare() {
    if (typeof document === 'undefined') return;
    const modal = document.getElementById('profile-avatar-share-modal');
    if (modal) modal.classList.remove('open');
  };

  window.openProfileAvatarShare = function openProfileAvatarShare(mode) {
    if (typeof document === 'undefined') return null;
    const modal = document.getElementById('profile-avatar-share-modal');
    if (!modal) return null;
    _forgeAvatarShareMode = mode || _forgeAvatarShareMode || 'showcase';
    _forgeAvatarRenderSharePreview(_forgeAvatarShareMode);
    modal.classList.add('open');
    if (typeof sndAvatarOpen === 'function') sndAvatarOpen();
    return _forgeAvatarShareMode;
  };

  window.setProfileAvatarShareMode = function setProfileAvatarShareMode(mode) {
    _forgeAvatarShareMode = mode === 'proof' ? 'proof' : 'showcase';
    _forgeAvatarRenderSharePreview(_forgeAvatarShareMode);
  };

  window.downloadProfileAvatarPoster = async function downloadProfileAvatarPoster() {
    const svg = _forgeAvatarRenderSharePreview(_forgeAvatarShareMode || 'showcase');
    if (!svg) return;
    const blob = await _forgeAvatarSvgToPngBlob(svg);
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `forge-avatar-${_forgeAvatarShareMode || 'showcase'}.png`;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };

  window.nativeShareProfileAvatar = async function nativeShareProfileAvatar() {
    const svg = _forgeAvatarRenderSharePreview(_forgeAvatarShareMode || 'showcase');
    if (!svg) return;
    const blob = await _forgeAvatarSvgToPngBlob(svg);
    if (!blob) return window.downloadProfileAvatarPoster();
    if (!navigator.share) return window.downloadProfileAvatarPoster();
    const file = new File([blob], `forge-avatar-${_forgeAvatarShareMode || 'showcase'}.png`, { type: 'image/png' });
    const canShareFile = !navigator.canShare || navigator.canShare({ files: [file] });
    try {
      if (canShareFile) {
        await navigator.share({
          title: 'FORGE Avatar',
          text: _forgeAvatarTx('My FORGE avatar progression.', 'طھط·ظˆط± ط£ظپط§طھط§ط± ظپظˆط±ط¬ ط§ظ„ط®ط§طµ ط¨ظٹ.'),
          files: [file]
        });
      } else {
        await navigator.share({
          title: 'FORGE Avatar',
          text: _forgeAvatarTx('My FORGE avatar progression.', 'طھط·ظˆط± ط£ظپط§طھط§ط± ظپظˆط±ط¬ ط§ظ„ط®ط§طµ ط¨ظٹ.')
        });
      }
    } catch (e) {
      if (e && e.name !== 'AbortError') window.downloadProfileAvatarPoster();
    }
  };
})();
