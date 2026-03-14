'use strict';

(function () {
  const KEY_STATE = 'forge_duel_state_v1';
  const KEY_SNAP = 'forge_duel_snapshot_v1';
  const DAY_MS = 86400000;
  const TABLES = ['forge_duels', 'duels'];
  let _state = _loadState();
  let _channel = null;

  function _toNum(v, fb) {
    const n = Number(v);
    return Number.isFinite(n) ? n : (fb || 0);
  }
  function _arr(v) { return Array.isArray(v) ? v : []; }
  function _isoNow() { return new Date().toISOString(); }
  function _safeGet(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed == null ? fallback : parsed;
    } catch (_e) {
      return fallback;
    }
  }
  function _safeSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_e) {}
  }
  function _id() {
    return 'duel_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }
  function _isAr() {
    return (typeof currentLang !== 'undefined') && currentLang === 'ar';
  }
  function _tx(en, ar) {
    return _isAr() ? ar : en;
  }
  function _playerName() {
    return String(
      window.userProfile?.name ||
      window.userProfile?.displayName ||
      window.userProfile?.username ||
      window.userProfile?.email?.split?.('@')?.[0] ||
      'You'
    );
  }
  function _defaultState() {
    return { active: null, history: [] };
  }
  function _loadState() {
    const s = _safeGet(KEY_STATE, _defaultState());
    if (!s || typeof s !== 'object') return _defaultState();
    if (!Array.isArray(s.history)) s.history = [];
    return s;
  }
  function _saveState() {
    _safeSet(KEY_STATE, _state);
    _renderCoachCard();
  }
  function _workouts() {
    return (typeof workouts !== 'undefined' && Array.isArray(workouts)) ? workouts : [];
  }
  function _bwWorkouts() {
    return (typeof bwWorkouts !== 'undefined' && Array.isArray(bwWorkouts)) ? bwWorkouts : [];
  }
  function _cardio() {
    if (typeof cardioLog !== 'undefined' && Array.isArray(cardioLog)) return cardioLog;
    return Array.isArray(window.cardioLog) ? window.cardioLog : [];
  }
  function _baseSnapshot() {
    const w = _workouts();
    const bw = _bwWorkouts();
    const c = _cardio();
    return {
      wLen: w.length,
      bwLen: bw.length,
      cLen: c.length,
      totalVol: w.reduce((a, x) => a + _toNum(x?.totalVolume, 0), 0),
      bwReps: bw.reduce((a, x) => a + _toNum(x?.totalReps, 0), 0),
      cardioMins: c.reduce((a, x) => a + _toNum(x?.durationMins ?? x?.duration, 0), 0)
    };
  }
  function _deltaSinceLastSave() {
    const prev = _safeGet(KEY_SNAP, null);
    const now = _baseSnapshot();
    _safeSet(KEY_SNAP, now);
    if (!prev) return { xp: 0, volume: 0 };

    let xp = 0;
    let volume = 0;

    const w = _workouts();
    const bw = _bwWorkouts();
    const c = _cardio();

    const newWeighted = w.slice(Math.max(0, _toNum(prev.wLen, 0)));
    const newBw = bw.slice(Math.max(0, _toNum(prev.bwLen, 0)));
    const newCardio = c.slice(Math.max(0, _toNum(prev.cLen, 0)));

    newWeighted.forEach((row) => {
      const vol = _toNum(row?.totalVolume, 0);
      const sets = _arr(row?.sets).length;
      const prs = row?.isPR ? 1 : 0;
      xp += Math.round(18 + (vol / 250) + (sets * 1.5) + (prs * 12));
      volume += Math.round(vol);
    });
    newBw.forEach((row) => {
      const reps = _toNum(row?.totalReps, 0);
      const sets = _arr(row?.sets).length;
      xp += Math.round(12 + (reps / 20) + sets);
      volume += Math.round(reps * 4);
    });
    newCardio.forEach((row) => {
      const mins = _toNum(row?.durationMins ?? row?.duration, 0);
      const kcal = _toNum(row?.calories, 0);
      xp += Math.round(10 + (mins * 0.9) + (kcal / 60));
      volume += Math.round(mins * 45);
    });

    const fallbackVol = Math.max(0, _toNum(now.totalVol, 0) - _toNum(prev.totalVol, 0));
    const fallbackReps = Math.max(0, _toNum(now.bwReps, 0) - _toNum(prev.bwReps, 0));
    const fallbackMins = Math.max(0, _toNum(now.cardioMins, 0) - _toNum(prev.cardioMins, 0));

    if (xp <= 0 && (fallbackVol > 0 || fallbackReps > 0 || fallbackMins > 0)) {
      xp = Math.round((fallbackVol / 220) + (fallbackReps / 20) + (fallbackMins * 0.9));
    }
    if (volume <= 0 && (fallbackVol > 0 || fallbackReps > 0 || fallbackMins > 0)) {
      volume = Math.round(fallbackVol + (fallbackReps * 4) + (fallbackMins * 45));
    }

    return { xp: Math.max(0, xp), volume: Math.max(0, volume) };
  }
  function _modeLabel(mode) {
    return mode === 'volume_7d'
      ? _tx('Most Volume in 7 days', 'أكبر حجم تدريبي خلال 7 أيام')
      : _tx('First to 5000 XP', 'الأول إلى 5000 نقطة خبرة');
  }
  function _target(mode) {
    return mode === 'volume_7d' ? 45000 : 5000;
  }
  function _isActive(d) {
    if (!d || d.status !== 'active') return false;
    const endMs = new Date(d.endsAt || 0).getTime();
    return Number.isFinite(endMs) && Date.now() <= endMs;
  }
  function _progress(d, score) {
    const t = Math.max(1, _toNum(d?.target, _target(d?.mode || 'xp_7d')));
    return Math.max(0, Math.min(100, Math.round((Math.max(0, score) / t) * 100)));
  }
  function _normalizeRemote(row) {
    if (!row || typeof row !== 'object') return null;
    const rid = String(row.id || row.duel_id || '');
    if (!rid) return null;
    return {
      id: rid,
      mode: String(row.mode || row.duel_mode || 'xp_7d'),
      target: _toNum(row.target || row.goal_target, 5000),
      status: String(row.status || 'active'),
      challenger: String(row.challenger || row.player_a || row.user_a || _playerName()),
      opponent: String(row.opponent || row.player_b || row.user_b || 'Opponent'),
      scoreSelf: _toNum(row.score_self ?? row.challenger_score ?? row.score_a ?? row.scoreA, 0),
      scoreOpponent: _toNum(row.score_opponent ?? row.opponent_score ?? row.score_b ?? row.scoreB, 0),
      startsAt: String(row.starts_at || row.startsAt || _isoNow()),
      endsAt: String(row.ends_at || row.endsAt || new Date(Date.now() + (7 * DAY_MS)).toISOString()),
      updatedAt: String(row.updated_at || row.updatedAt || _isoNow())
    };
  }
  function _duelPayload(d) {
    return {
      id: d.id,
      mode: d.mode,
      target: d.target,
      status: d.status,
      challenger: d.challenger,
      opponent: d.opponent,
      score_self: _toNum(d.scoreSelf, 0),
      score_opponent: _toNum(d.scoreOpponent, 0),
      starts_at: d.startsAt,
      ends_at: d.endsAt,
      updated_at: _isoNow()
    };
  }
  async function _pushRemote() {
    const d = _state.active;
    if (!_isActive(d) || !window._sb) return;
    const payload = _duelPayload(d);
    for (const table of TABLES) {
      try {
        const { error } = await window._sb.from(table).upsert(payload);
        if (!error) return;
      } catch (_e) {}
    }
  }
  async function _pullRemote() {
    const d = _state.active;
    if (!d || !window._sb) return;
    for (const table of TABLES) {
      try {
        const { data, error } = await window._sb
          .from(table)
          .select('*')
          .eq('id', d.id)
          .maybeSingle();
        if (error || !data) continue;
        const parsed = _normalizeRemote(data);
        if (!parsed) continue;
        _state.active = { ...d, ...parsed };
        _saveState();
        return;
      } catch (_e) {}
    }
  }
  function _subscribeRemote() {
    if (!window._sb || !_state.active?.id) return;
    try {
      if (_channel) {
        window._sb.removeChannel(_channel);
        _channel = null;
      }
      _channel = window._sb
        .channel('forge-duel-' + _state.active.id)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'duels', filter: `id=eq.${_state.active.id}` },
          (payload) => {
            const parsed = _normalizeRemote(payload?.new || payload?.record);
            if (!parsed) return;
            _state.active = { ..._state.active, ...parsed };
            _saveState();
          }
        )
        .subscribe();
    } catch (_e) {}
  }
  function _finalizeIfNeeded() {
    const d = _state.active;
    if (!d) return false;
    const now = Date.now();
    const end = new Date(d.endsAt || 0).getTime();
    const scoreSelf = _toNum(d.scoreSelf, 0);
    const scoreOpp = _toNum(d.scoreOpponent, 0);
    const target = _toNum(d.target, _target(d.mode));
    const targetHit = scoreSelf >= target || scoreOpp >= target;
    const expired = !Number.isFinite(end) || now > end;
    if (!targetHit && !expired) return false;
    d.status = 'completed';
    d.completedAt = _isoNow();
    d.winner = scoreSelf === scoreOpp ? 'draw' : (scoreSelf > scoreOpp ? 'self' : 'opponent');
    _state.history = [d, ..._arr(_state.history)].slice(0, 20);
    _state.active = null;
    _saveState();
    return true;
  }
  function _daysLeft(d) {
    const end = new Date(d.endsAt || 0).getTime();
    if (!Number.isFinite(end)) return 0;
    return Math.max(0, Math.ceil((end - Date.now()) / DAY_MS));
  }
  function _start(mode) {
    const opponent = window.prompt(
      _tx('Enter opponent name', 'اكتب اسم المنافس'),
      ''
    );
    if (!opponent) return;
    const m = mode === 'volume_7d' ? 'volume_7d' : 'xp_7d';
    const duel = {
      id: _id(),
      mode: m,
      target: _target(m),
      status: 'active',
      challenger: _playerName(),
      opponent: String(opponent).trim().slice(0, 28) || _tx('Opponent', 'منافس'),
      scoreSelf: 0,
      scoreOpponent: 0,
      startsAt: _isoNow(),
      endsAt: new Date(Date.now() + (7 * DAY_MS)).toISOString(),
      updatedAt: _isoNow()
    };
    _state.active = duel;
    _safeSet(KEY_SNAP, _baseSnapshot());
    _saveState();
    _pushRemote();
    _subscribeRemote();
  }
  function _cancel() {
    const d = _state.active;
    if (!d) return;
    d.status = 'cancelled';
    d.completedAt = _isoNow();
    _state.history = [d, ..._arr(_state.history)].slice(0, 20);
    _state.active = null;
    _saveState();
  }
  function _renderCoachCard(hostEl) {
    const host = hostEl || document.querySelector('#coach-tab-today .ctoday-wrap');
    if (!host) return;
    let card = host.querySelector('.coach-duel-card');
    if (!card) {
      card = document.createElement('div');
      card.className = 'ctoday-card coach-duel-card';
      host.appendChild(card);
    }

    const d = _state.active;
    if (!d || !_isActive(d)) {
      card.innerHTML =
        '<div class="ctoday-card-title">' + _tx('7-Day Duel', 'تحدي 7 أيام') + '</div>' +
        '<div class="ctoday-plan-note">' + _tx('Challenge a friend asynchronously and compete on progress.', 'تحدى صديقك بشكل غير متزامن وتنافسوا على التقدم.') + '</div>' +
        '<div class="coach-dual-actions" style="margin-top:10px;">' +
          '<button class="coach-action-btn primary" onclick="FORGE_DUELS.startXp()">' + _tx('Start XP Duel', 'ابدأ تحدي XP') + '</button>' +
          '<button class="coach-action-btn" onclick="FORGE_DUELS.startVolume()">' + _tx('Start Volume Duel', 'ابدأ تحدي الحجم') + '</button>' +
        '</div>';
      return;
    }

    const pSelf = _progress(d, d.scoreSelf);
    const pOpp = _progress(d, d.scoreOpponent);
    const lead = _toNum(d.scoreSelf, 0) - _toNum(d.scoreOpponent, 0);
    const leadText = lead === 0
      ? _tx('Tie duel', 'التحدي متعادل')
      : lead > 0
        ? _tx(`You lead by ${lead}`, `أنت متقدم بـ ${lead}`)
        : _tx(`Behind by ${Math.abs(lead)}`, `متأخر بـ ${Math.abs(lead)}`);
    card.innerHTML =
      '<div class="ctoday-card-title">' + _tx('Live Duel', 'تحدي مباشر') + '</div>' +
      '<div class="ctoday-plan-note"><strong>' + _modeLabel(d.mode) + '</strong> · ' + _tx('days left', 'متبقي أيام') + ': ' + _daysLeft(d) + '</div>' +
      '<div class="duel-split">' +
        '<div class="duel-side self"><div class="duel-name">' + d.challenger + '</div><div class="duel-score">' + _toNum(d.scoreSelf, 0) + '</div><div class="duel-bar"><span style="width:' + pSelf + '%;"></span></div></div>' +
        '<div class="duel-vs">VS</div>' +
        '<div class="duel-side opp"><div class="duel-name">' + d.opponent + '</div><div class="duel-score">' + _toNum(d.scoreOpponent, 0) + '</div><div class="duel-bar"><span style="width:' + pOpp + '%;"></span></div></div>' +
      '</div>' +
      '<div class="ctoday-plan-note duel-lead">' + leadText + '</div>' +
      '<div class="coach-dual-actions" style="margin-top:8px;">' +
        '<button class="coach-action-btn" onclick="FORGE_DUELS.syncNow()">' + _tx('Sync Duel', 'مزامنة التحدي') + '</button>' +
        '<button class="coach-action-btn" onclick="FORGE_DUELS.cancelActive()">' + _tx('End Duel', 'إنهاء التحدي') + '</button>' +
      '</div>';
  }
  function _onPostSave() {
    if (!_isActive(_state.active)) return;
    if (_finalizeIfNeeded()) return;
    const d = _state.active;
    const delta = _deltaSinceLastSave();
    const inc = d.mode === 'volume_7d' ? delta.volume : delta.xp;
    if (inc <= 0) return;
    d.scoreSelf = _toNum(d.scoreSelf, 0) + inc;
    d.updatedAt = _isoNow();
    _saveState();
    _pushRemote();
    _finalizeIfNeeded();
  }

  document.addEventListener('DOMContentLoaded', function () {
    _renderCoachCard();
    _subscribeRemote();
    setTimeout(_pullRemote, 300);
    setTimeout(_pullRemote, 1600);
  });

  window.FORGE_DUELS = {
    startXp: function () { _start('xp_7d'); },
    startVolume: function () { _start('volume_7d'); },
    cancelActive: _cancel,
    syncNow: function () { _pullRemote(); _pushRemote(); },
    onPostSave: _onPostSave,
    renderInto: _renderCoachCard
  };
})();
