'use strict';

(function () {
  const KEY_STATE = 'forge_duel_state_v2';
  const TABLES = ['forge_duels', 'duels'];
  const PROFILE_TABLES = ['profiles_public', 'profiles'];
  const FRIEND_CODE_PREFIX = 'FG-';
  const PROFILE_CACHE_MS = 90000;
  const DAY_MS = 86400000;
  const INBOX_POLL_MS = 60000;
  const MUSCLES = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Biceps', 'Triceps', 'Forearms', 'Glutes', 'Calves'];

  let _state = _loadState();
  let _channel = null;
  let _table = null;
  let _me = null;
  let _lastInboxPull = 0;
  let _tableMissingUntil = 0;
  const _profileTableCache = {};
  let _profilesCache = { at: 0, rows: [] };
  let _searchDebounce = 0;
  let _scanRaf = 0;
  let _scanStream = null;

  function _toNum(v, fb) {
    const n = Number(v);
    return Number.isFinite(n) ? n : (fb || 0);
  }
  function _arr(v) { return Array.isArray(v) ? v : []; }
  function _isoNow() { return new Date().toISOString(); }
  function _isAr() { return (typeof currentLang !== 'undefined') && currentLang === 'ar'; }
  function _tx(en, ar) { return _isAr() ? ar : en; }
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
  function _jsArg(v) {
    return JSON.stringify(String(v == null ? '' : v));
  }
  function _workouts() { return (typeof workouts !== 'undefined' && Array.isArray(workouts)) ? workouts : []; }
  function _bwWorkouts() { return (typeof bwWorkouts !== 'undefined' && Array.isArray(bwWorkouts)) ? bwWorkouts : []; }
  function _cardio() {
    if (typeof cardioLog !== 'undefined' && Array.isArray(cardioLog)) return cardioLog;
    return Array.isArray(window.cardioLog) ? window.cardioLog : [];
  }

  function _encodeUser(user) {
    const id = encodeURIComponent(String(user?.id || ''));
    const name = encodeURIComponent(String(user?.name || user?.displayName || user?.username || 'Athlete'));
    const email = encodeURIComponent(String(user?.email || ''));
    return [id, name, email].join('|');
  }
  function _shortId(id) {
    return String(id || '').replace(/-/g, '').toUpperCase().slice(0, 10);
  }
  function _escapeHtml(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function _normQ(v) {
    return String(v || '').trim().toLowerCase();
  }
  function _decodeUser(token) {
    const raw = String(token || '');
    const parts = raw.split('|');
    if (parts.length >= 3) {
      return {
        id: decodeURIComponent(parts[0] || ''),
        name: decodeURIComponent(parts[1] || 'Athlete'),
        email: decodeURIComponent(parts[2] || '')
      };
    }
    return { id: '', name: raw || 'Athlete', email: '' };
  }
  function _playerName(me) {
    return String(
      me?.name ||
      window.userProfile?.name ||
      window.userProfile?.displayName ||
      window.userProfile?.username ||
      me?.email?.split('@')?.[0] ||
      'You'
    );
  }
  function _parseScope(mode) {
    const m = String(mode || '');
    if (!m.startsWith('scope:')) return { scope: 'workout', muscle: '' };
    const bits = m.split(':');
    return { scope: bits[1] || 'workout', muscle: bits[2] || '' };
  }
  function _formatScope(mode) {
    const parsed = _parseScope(mode);
    if (parsed.scope === 'cardio') return _tx('Cardio Sessions', 'ط¬ظ„ط³ط§طھ ط§ظ„ظƒط§ط±ط¯ظٹظˆ');
    if (parsed.scope === 'muscle') return _tx(`${parsed.muscle || 'Muscle'} Sessions`, `ط¬ظ„ط³ط§طھ ${parsed.muscle || 'ط¹ط¶ظ„ط©'}`);
    return _tx('Workout Sessions', 'ط¬ظ„ط³ط§طھ ط§ظ„طھظ…ط±ظٹظ†');
  }
  function _targetFor(mode) {
    const parsed = _parseScope(mode);
    if (parsed.scope === 'cardio') return 5;
    if (parsed.scope === 'muscle') return 5;
    return 7;
  }
  function _defaultState() {
    return { active: null, invites: [], history: [], friends: [] };
  }
  function _loadState() {
    const s = _safeGet(KEY_STATE, _defaultState());
    if (!s || typeof s !== 'object') return _defaultState();
    if (!Array.isArray(s.invites)) s.invites = [];
    if (!Array.isArray(s.history)) s.history = [];
    if (!Array.isArray(s.friends)) s.friends = [];
    return s;
  }
  function _saveState() {
    _safeSet(KEY_STATE, _state);
    _renderCoachCard();
  }
  function _getDateKey(v) {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  }
  function _toDayMs(v) {
    const k = _getDateKey(v);
    if (!k) return NaN;
    return new Date(k + 'T00:00:00').getTime();
  }
  function _isMineToken(token) {
    if (!_me) return false;
    const u = _decodeUser(token);
    const myId = String(_me.id || '');
    const myEmail = String(_me.email || '').toLowerCase();
    if (u.id && myId && u.id === myId) return true;
    if (u.email && myEmail && String(u.email).toLowerCase() === myEmail) return true;
    return false;
  }
  function _isActive(row) {
    if (!row || row.status !== 'active') return false;
    const endMs = new Date(row.ends_at || row.endsAt || 0).getTime();
    return Number.isFinite(endMs) && Date.now() <= endMs;
  }
  function _asRow(row) {
    if (!row || typeof row !== 'object') return null;
    return {
      id: String(row.id || row.duel_id || ''),
      mode: String(row.mode || 'scope:workout'),
      target: _toNum(row.target, 0) || _targetFor(String(row.mode || 'scope:workout')),
      status: String(row.status || 'pending'),
      challenger: String(row.challenger || ''),
      opponent: String(row.opponent || ''),
      score_self: _toNum(row.score_self, 0),
      score_opponent: _toNum(row.score_opponent, 0),
      starts_at: String(row.starts_at || row.startsAt || _isoNow()),
      ends_at: String(row.ends_at || row.endsAt || new Date(Date.now() + 7 * DAY_MS).toISOString()),
      updated_at: String(row.updated_at || row.updatedAt || _isoNow())
    };
  }
  function _getSide(row) {
    if (_isMineToken(row.challenger)) return 'challenger';
    if (_isMineToken(row.opponent)) return 'opponent';
    return '';
  }
  function _scoreFor(mode, startsAt) {
    const parsed = _parseScope(mode);
    const fromMs = _toDayMs(startsAt);
    const dms = (v) => _toDayMs(v);
    const muscle = (parsed.muscle || '').toLowerCase();

    if (parsed.scope === 'cardio') {
      return _cardio().filter(c => dms(c?.date) >= fromMs).length;
    }
    if (parsed.scope === 'muscle') {
      const w = _workouts().filter(wk => dms(wk?.date) >= fromMs && String(wk?.muscle || '').toLowerCase() === muscle).length;
      const bw = _bwWorkouts().filter(wk => dms(wk?.date) >= fromMs && String(wk?.muscle || '').toLowerCase() === muscle).length;
      return w + bw;
    }
    return _workouts().filter(wk => dms(wk?.date) >= fromMs).length + _bwWorkouts().filter(wk => dms(wk?.date) >= fromMs).length;
  }

  async function _ensureTable() {
    if (Date.now() < _tableMissingUntil) return null;
    if (_table || !window._sb) return _table;
    for (const name of TABLES) {
      try {
        const { error } = await window._sb.from(name).select('id').limit(1);
        if (!error) { _table = name; return name; }
      } catch (_e) {}
    }
    _tableMissingUntil = Date.now() + (5 * 60 * 1000);
    return null;
  }
  async function _getMe() {
    if (_me) return _me;
    if (!window._sb) return null;
    try {
      const { data } = await window._sb.auth.getSession();
      const u = data?.session?.user;
      if (!u?.id) return null;
      _me = {
        id: u.id,
        email: String(u.email || ''),
        name: String(window.userProfile?.name || u.user_metadata?.name || u.email?.split('@')?.[0] || 'Athlete')
      };
      return _me;
    } catch (_e) {
      return null;
    }
  }

  function _normalizeProfileRow(row) {
    const r = row || {};
    return {
      id: String(r.id || ''),
      name: String(r?.name || r?.display_name || r?.data?.name || r?.data?.displayName || r?.data?.username || ''),
      email: String(r?.email || r?.data?.email || ''),
      stats: r?.duel_public_stats || r?.data?.duelPublicStats || null,
      updatedAt: String(r?.updated_at || r?.data?.updatedAt || '')
    };
  }
  async function _fetchProfiles(force) {
    if (!window._sb) return [];
    if (!force && _profilesCache.rows.length && (Date.now() - _profilesCache.at) < PROFILE_CACHE_MS) {
      return _profilesCache.rows;
    }
    for (const table of PROFILE_TABLES) {
      try {
        const selectCols = table === 'profiles_public'
          ? 'id,name,email,display_name,duel_public_stats,updated_at'
          : 'id,data';
        const { data, error } = await window._sb.from(table).select(selectCols).limit(260);
        if (!error && Array.isArray(data)) {
          _profileTableCache[table] = true;
          _profilesCache = { at: Date.now(), rows: data.map(_normalizeProfileRow).filter(u => u.id) };
          return _profilesCache.rows;
        }
        _profileTableCache[table] = false;
      } catch (_e) {
        _profileTableCache[table] = false;
      }
    }
    _profilesCache = { at: Date.now(), rows: [] };
    return [];
  }
  function _userMatchScore(user, query) {
    const q = _normQ(query);
    if (!q) {
      const w7 = _toNum(user?.stats?.workout7d, 0);
      const c7 = _toNum(user?.stats?.cardio7d, 0);
      const ws = _toNum(user?.stats?.workoutSessions, 0);
      return (w7 * 12) + (c7 * 8) + Math.min(60, ws);
    }
    const qRaw = q.replace(/^fg-/, '').replace(/[^a-z0-9]/g, '');
    const nm = String(user.name || '').toLowerCase();
    const em = String(user.email || '').toLowerCase();
    const sid = _shortId(user.id).toLowerCase();
    const uid = String(user.id || '').toLowerCase();
    let score = 0;
    if (em && em === q) score += 140;
    if (nm && nm === q) score += 120;
    if (nm.startsWith(q)) score += 95;
    if (em.startsWith(q)) score += 90;
    if (nm.includes(q)) score += 70;
    if (em.includes(q)) score += 65;
    if (qRaw && sid.startsWith(qRaw)) score += 120;
    if (uid.includes(qRaw || q)) score += 45;
    if (_isFriend(user.id)) score -= 6;
    return score;
  }
  async function _searchUsers(query) {
    const me = await _getMe();
    if (!window._sb || !me) return [];
    const rows = await _fetchProfiles(false);
    const q = _normQ(query);
    return rows
      .filter(u => u.id && u.id !== me.id)
      .map(u => ({ ...u, _score: _userMatchScore(u, q) }))
      .filter(u => (q ? u._score > 0 : true))
      .sort((a, b) => b._score - a._score)
      .slice(0, q ? 20 : 10);
  }

  function _friendToken(user) {
    return _encodeUser({ id: user.id, name: user.name || 'Athlete', email: user.email || '' });
  }
  function _isFriend(userId) {
    return _state.friends.some(f => String(f.id) === String(userId));
  }
  function _addFriend(user) {
    if (!user || !user.id || _isFriend(user.id)) return;
    _state.friends.unshift({ id: String(user.id), name: String(user.name || 'Athlete'), email: String(user.email || '') });
    _state.friends = _state.friends.slice(0, 80);
    _saveState();
  }
  function _removeFriend(userId) {
    _state.friends = _state.friends.filter(f => String(f.id) !== String(userId));
    _saveState();
  }
  function _myFriendCode() {
    if (!_me) return '';
    return FRIEND_CODE_PREFIX + _shortId(_me.id);
  }
  async function _addFriendByCode(rawCode) {
    const raw = String(rawCode || '').trim();
    if (!raw) return false;

    // Backward compatible with legacy long token code.
    if (raw.includes('|')) {
      const legacy = _decodeUser(raw);
      if (!legacy.id || (_me && String(legacy.id) === String(_me.id))) return false;
      _addFriend(legacy);
      return true;
    }

    const q = _normQ(raw);
    const codePart = q.replace(/^fg-/, '').replace(/[^a-z0-9]/g, '');
    const all = await _fetchProfiles(true);
    if (!all.length) return false;
    const meId = String(_me?.id || '');
    const exact = all.find(u => u.id && u.id !== meId && (
      _shortId(u.id).toLowerCase() === codePart ||
      String(u.id).toLowerCase() === q ||
      String(u.email || '').toLowerCase() === q
    ));
    if (exact) {
      _addFriend(exact);
      return true;
    }
    const prefixMatches = all.filter(u => u.id && u.id !== meId && _shortId(u.id).toLowerCase().startsWith(codePart));
    if (prefixMatches.length === 1) {
      _addFriend(prefixMatches[0]);
      return true;
    }
    return false;
  }
  async function _publishOwnStats() {
    try {
      const profile = _safeGet('forge_profile', {});
      const cardioLen = _cardio().length;
      const weightedLen = _workouts().length;
      const bwLen = _bwWorkouts().length;
      const last7Ms = Date.now() - (7 * DAY_MS);
      const toMs = (d) => new Date(d || 0).getTime();
      const cardio7 = _cardio().filter(c => toMs(c?.date) >= last7Ms).length;
      const workout7 = _workouts().filter(w => toMs(w?.date) >= last7Ms).length + _bwWorkouts().filter(w => toMs(w?.date) >= last7Ms).length;
      profile.duelPublicStats = {
        updatedAt: _isoNow(),
        workoutSessions: weightedLen + bwLen,
        cardioSessions: cardioLen,
        workout7d: workout7,
        cardio7d: cardio7
      };
      _safeSet('forge_profile', profile);
      if (window._sb && _me) {
        const payload = {
          id: _me.id,
          name: _playerName(_me),
          email: String(_me.email || ''),
          duel_public_stats: profile.duelPublicStats,
          updated_at: _isoNow()
        };
        for (const table of PROFILE_TABLES) {
          if (_profileTableCache[table] === false) continue;
          try {
            const { error } = await window._sb.from(table).upsert(payload, { onConflict: 'id' });
            if (!error) {
              _profileTableCache[table] = true;
              break;
            }
            _profileTableCache[table] = false;
          } catch (_e) {
            _profileTableCache[table] = false;
          }
        }
      }
      if (_me && typeof window._syncPushProfile === 'function') window._syncPushProfile(_me.id);
    } catch (_e) {}
  }

  async function _createInvite(user, scopeMode, customTarget) {
    const me = await _getMe();
    const table = await _ensureTable();
    if (!me || !user?.id) {
      if (typeof showToast === 'function') showToast(_tx('Cannot create duel now', 'طھط¹ط°ط± ط¥ظ†ط´ط§ط، ط§ظ„طھط­ط¯ظٹ ط§ظ„ط¢ظ†'), 'warn');
      return;
    }
    const now = Date.now();
    const mode = String(scopeMode || 'scope:workout');
    const target = Math.max(1, parseInt(customTarget, 10) || _targetFor(mode));
    const payload = {
      id: _id(),
      mode,
      target,
      status: 'pending',
      challenger: _encodeUser({ id: me.id, name: _playerName(me), email: me.email }),
      opponent: _encodeUser({ id: user.id, name: user.name || 'Athlete', email: user.email || '' }),
      score_self: 0,
      score_opponent: 0,
      starts_at: new Date(now).toISOString(),
      ends_at: new Date(now + 7 * DAY_MS).toISOString(),
      updated_at: _isoNow()
    };
    if (!window._sb || !table) {
      payload.status = 'active';
      _state.active = payload;
      _saveState();
      if (typeof showToast === 'function') showToast(_tx('Duel started (local mode)', 'طھظ… ط¨ط¯ط، ط§ظ„طھط­ط¯ظٹ (ظˆط¶ط¹ ظ…ط­ظ„ظٹ)'), 'warn');
      _closeModal();
      return;
    }
    try {
      const { error } = await window._sb.from(table).upsert(payload);
      if (error) throw error;
      if (typeof showToast === 'function') showToast(_tx('Duel invite sent', 'طھظ… ط¥ط±ط³ط§ظ„ ط¯ط¹ظˆط© ط§ظ„طھط­ط¯ظٹ'), 'success');
      _closeModal();
      _refreshState();
    } catch (_e) {
      if (typeof showToast === 'function') showToast(_tx('Failed to send invite', 'ظپط´ظ„ ط¥ط±ط³ط§ظ„ ط§ظ„ط¯ط¹ظˆط©'), 'warn');
    }
  }

  async function _fetchRows() {
    const me = await _getMe();
    const table = await _ensureTable();
    if (!window._sb || !table || !me) return [];
    try {
      const { data, error } = await window._sb
        .from(table)
        .select('*')
        .in('status', ['pending', 'active', 'completed', 'declined', 'cancelled'])
        .order('updated_at', { ascending: false })
        .limit(180);
      if (error || !Array.isArray(data)) return [];
      return data.map(_asRow).filter(Boolean).filter(r => _getSide(r));
    } catch (_e) {
      return [];
    }
  }
  async function _refreshState() {
    if (!window._sb || !await _ensureTable()) {
      _saveState();
      _renderFriendsZone();
      return;
    }
    const rows = await _fetchRows();
    const pending = rows.filter(r => r.status === 'pending' && _getSide(r) === 'opponent');
    const active = rows.find(r => r.status === 'active') || null;
    const history = rows.filter(r => ['completed', 'declined', 'cancelled'].includes(r.status)).slice(0, 10);
    _state.invites = pending;
    _state.active = active;
    _state.history = history;
    _saveState();
    _renderFriendsZone();
  }
  async function _refreshInboxIfDue() {
    if (Date.now() - _lastInboxPull < INBOX_POLL_MS) return;
    _lastInboxPull = Date.now();
    await _refreshState();
  }

  async function _respondInvite(id, accept) {
    const table = await _ensureTable();
    if (!window._sb || !table || !id) return;
    const now = _isoNow();
    const patch = accept
      ? { status: 'active', starts_at: now, updated_at: now }
      : { status: 'declined', updated_at: now };
    try {
      const { error } = await window._sb.from(table).update(patch).eq('id', id);
      if (error) throw error;
      if (typeof showToast === 'function') showToast(accept ? _tx('Duel accepted', 'طھظ… ظ‚ط¨ظˆظ„ ط§ظ„طھط­ط¯ظٹ') : _tx('Duel declined', 'طھظ… ط±ظپط¶ ط§ظ„طھط­ط¯ظٹ'), 'success');
      _refreshState();
    } catch (_e) {
      if (typeof showToast === 'function') showToast(_tx('Action failed', 'ظپط´ظ„ طھظ†ظپظٹط° ط§ظ„ط¹ظ…ظ„ظٹط©'), 'warn');
    }
  }

  async function _syncActiveScore() {
    const row = _state.active;
    if (!row || row.status !== 'active') return;
    const table = await _ensureTable();
    const me = await _getMe();
    if (!me) return;
    const side = _getSide(row);
    if (!side) return;

    const myScore = _scoreFor(row.mode, row.starts_at);
    const target = _toNum(row.target, _targetFor(row.mode));
    const patch = { updated_at: _isoNow() };
    if (side === 'challenger') patch.score_self = myScore;
    else patch.score_opponent = myScore;

    const nextSelf = side === 'challenger' ? myScore : _toNum(row.score_self, 0);
    const nextOpp = side === 'opponent' ? myScore : _toNum(row.score_opponent, 0);
    const endMs = new Date(row.ends_at || 0).getTime();
    if (nextSelf >= target || nextOpp >= target || (Number.isFinite(endMs) && Date.now() > endMs)) {
      patch.status = 'completed';
    }

    if (!window._sb || !table) {
      if (side === 'challenger') row.score_self = myScore;
      else row.score_opponent = myScore;
      row.updated_at = _isoNow();
      if (patch.status === 'completed') row.status = 'completed';
      _saveState();
      return;
    }

    try {
      const { error } = await window._sb.from(table).update(patch).eq('id', row.id);
      if (!error) _refreshState();
    } catch (_e) {}
  }

  async function _cancelActive() {
    const row = _state.active;
    const table = await _ensureTable();
    if (!row) return;
    if (!table || !window._sb) {
      row.status = 'cancelled';
      row.updated_at = _isoNow();
      _state.history = [row, ..._arr(_state.history)].slice(0, 10);
      _state.active = null;
      _saveState();
      return;
    }
    try {
      await window._sb.from(table).update({ status: 'cancelled', updated_at: _isoNow() }).eq('id', row.id);
      _refreshState();
    } catch (_e) {}
  }

  function _daysLeft(row) {
    const end = new Date(row?.ends_at || 0).getTime();
    if (!Number.isFinite(end)) return 0;
    return Math.max(0, Math.ceil((end - Date.now()) / DAY_MS));
  }
  function _progress(row, score) {
    const t = Math.max(1, _toNum(row?.target, _targetFor(row?.mode)));
    return Math.max(0, Math.min(100, Math.round((Math.max(0, score) / t) * 100)));
  }
  function _displayScores(row) {
    const meSide = _getSide(row);
    const selfName = _decodeUser(row.challenger).name;
    const oppName = _decodeUser(row.opponent).name;
    if (meSide === 'opponent') {
      return {
        mine: _toNum(row.score_opponent, 0),
        theirs: _toNum(row.score_self, 0),
        myName: oppName,
        theirName: selfName
      };
    }
    return {
      mine: _toNum(row.score_self, 0),
      theirs: _toNum(row.score_opponent, 0),
      myName: selfName,
      theirName: oppName
    };
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

    const inv = _arr(_state.invites);
    const active = _state.active;
    if (!active || !_isActive(active)) {
      const inviteHtml = inv.length
        ? '<div class="duel-invite-list">' + inv.slice(0, 3).map(r => {
            const ch = _decodeUser(r.challenger);
            return (
              '<div class="duel-invite-row">' +
                '<div><strong>' + ch.name + '</strong><div class="duel-invite-sub">' + _formatScope(r.mode) + ' آ· ' + _tx('target', 'ط§ظ„ظ‡ط¯ظپ') + ' ' + _toNum(r.target, _targetFor(r.mode)) + '</div></div>' +
                '<div class="duel-invite-actions">' +
                  '<button class="coach-action-btn primary" onclick="FORGE_DUELS.acceptInvite(\'' + r.id + '\')">' + _tx('Accept', 'ظ‚ط¨ظˆظ„') + '</button>' +
                  '<button class="coach-action-btn" onclick="FORGE_DUELS.declineInvite(\'' + r.id + '\')">' + _tx('Decline', 'ط±ظپط¶') + '</button>' +
                '</div>' +
              '</div>'
            );
          }).join('') + '</div>'
        : '<div class="ctoday-plan-note">' + _tx('No pending invites', 'ظ„ط§ طھظˆط¬ط¯ ط¯ط¹ظˆط§طھ ط­ط§ظ„ظٹط§ظ‹') + '</div>';

    card.innerHTML =
      '<div class="ctoday-card-title">1v1 Duel</div>' +
      '<div class="ctoday-plan-note">' + _tx('Search athletes by name/email and challenge them in workout, muscle, or cardio.', 'ط§ط¨ط­ط« ط¹ظ† ط§ظ„ط±ظٹط§ط¶ظٹظٹظ† ط¨ط§ظ„ط§ط³ظ… ط£ظˆ ط§ظ„ط¨ط±ظٹط¯ ظˆطھط­ط¯ط§ظ‡ظ… ظپظٹ ط§ظ„طھظ…ط±ظٹظ† ط£ظˆ ط§ظ„ط¹ط¶ظ„ط© ط£ظˆ ط§ظ„ظƒط§ط±ط¯ظٹظˆ.') + '</div>' +
      '<div class="coach-dual-actions" style="margin-top:10px;">' +
        '<button class="coach-action-btn primary" onclick="FORGE_DUELS.open()">' + _tx('Find Athlete', 'ط§ط¨ط­ط« ط¹ظ† ظ„ط§ط¹ط¨') + '</button>' +
        '<button class="coach-action-btn" onclick="FORGE_DUELS.refresh()">' + _tx('Refresh', 'طھط­ط¯ظٹط«') + '</button>' +
      '</div>' +
      '<div class="ctoday-plan-note" style="margin-top:8px;"><strong>' + _tx('Friends', 'ط§ظ„ط£طµط¯ظ‚ط§ط،') + ':</strong> ' + _arr(_state.friends).length + '</div>' +
      '<div class="ctoday-plan-note" style="margin-top:10px;"><strong>' + _tx('Invites', 'ط§ظ„ط¯ط¹ظˆط§طھ') + ':</strong> ' + inv.length + '</div>' +
      inviteHtml;
      return;
    }

    const ds = _displayScores(active);
    const pMine = _progress(active, ds.mine);
    const pTheirs = _progress(active, ds.theirs);
    const lead = ds.mine - ds.theirs;
    const leadText = lead === 0
      ? _tx('Tie game', 'ط§ظ„طھط­ط¯ظٹ ظ…طھط¹ط§ط¯ظ„')
      : lead > 0
        ? _tx(`You lead by ${lead}`, `ط£ظ†طھ ظ…طھظ‚ط¯ظ… ط¨ظ€ ${lead}`)
        : _tx(`Behind by ${Math.abs(lead)}`, `ظ…طھط£ط®ط± ط¨ظ€ ${Math.abs(lead)}`);

    card.innerHTML =
      '<div class="ctoday-card-title">1v1 Duel</div>' +
      '<div class="ctoday-plan-note"><strong>' + _formatScope(active.mode) + '</strong> آ· ' + _tx('days left', 'ظ…طھط¨ظ‚ظٹ ط£ظٹط§ظ…') + ': ' + _daysLeft(active) + '</div>' +
      '<div class="duel-split">' +
        '<div class="duel-side self"><div class="duel-name">' + ds.myName + '</div><div class="duel-score">' + ds.mine + '</div><div class="duel-bar"><span style="width:' + pMine + '%;"></span></div></div>' +
        '<div class="duel-vs">VS</div>' +
        '<div class="duel-side opp"><div class="duel-name">' + ds.theirName + '</div><div class="duel-score">' + ds.theirs + '</div><div class="duel-bar"><span style="width:' + pTheirs + '%;"></span></div></div>' +
      '</div>' +
      '<div class="ctoday-plan-note duel-lead">' + leadText + '</div>' +
      '<div class="coach-dual-actions" style="margin-top:8px;">' +
        '<button class="coach-action-btn" onclick="FORGE_DUELS.syncNow()">' + _tx('Sync Score', 'ظ…ط²ط§ظ…ظ†ط© ط§ظ„ظ†طھظٹط¬ط©') + '</button>' +
        '<button class="coach-action-btn" onclick="FORGE_DUELS.cancelActive()">' + _tx('End Duel', 'ط¥ظ†ظ‡ط§ط، ط§ظ„طھط­ط¯ظٹ') + '</button>' +
      '</div>';
  }

  function _ensureModal() {
    let modal = document.getElementById('duel-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'duel-modal';
    modal.className = 'duel-modal';
    modal.style.display = 'none';
    modal.innerHTML =
      '<div class="duel-modal-backdrop" onclick="FORGE_DUELS.closeModal()"></div>' +
      '<div class="duel-modal-card">' +
        '<div class="duel-modal-head"><strong>1v1 Matchmaking</strong><button class="coach-action-btn" onclick="FORGE_DUELS.closeModal()">X</button></div>' +
        '<div class="duel-modal-row">' +
          '<input id="duel-friend-code-input" class="duel-search-input" placeholder="Paste short code (FG-XXXXXX)" />' +
          '<button class="coach-action-btn" onclick="FORGE_DUELS.addFriendCode()">' + _tx('Add Friend', 'ط¥ط¶ط§ظپط© طµط¯ظٹظ‚') + '</button>' +
          '<button class="coach-action-btn" onclick="FORGE_DUELS.copyCode()">' + _tx('Copy My Code', 'ظ†ط³ط® ظƒظˆط¯ظٹ') + '</button>' +
          '<button class="coach-action-btn" onclick="FORGE_DUELS.scanCode()">' + _tx('Scan QR', 'ظ…ط³ط­ QR') + '</button>' +
        '</div>' +
        '<div id="duel-my-code-qr" class="duel-my-code-qr"></div>' +
        '<div id="duel-friends-zone" class="duel-friends-zone"></div>' +
        '<div class="duel-modal-row">' +
          '<input id="duel-search-input" class="duel-search-input" placeholder="Search by name or email" />' +
          '<button class="coach-action-btn primary" onclick="FORGE_DUELS.search()">Search</button>' +
        '</div>' +
        '<div id="duel-search-results" class="duel-search-results"></div>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }
  function _openModal() {
    const modal = _ensureModal();
    modal.style.display = 'block';
    const input = document.getElementById('duel-search-input');
    if (input) {
      input.value = '';
      setTimeout(() => { try { input.focus(); } catch (_e) {} }, 30);
      input.onkeydown = (e) => { if (e.key === 'Enter') _searchFromModal(); };
      input.oninput = () => {
        clearTimeout(_searchDebounce);
        _searchDebounce = setTimeout(() => {
          const q = String(input.value || '').trim();
          if (q.length < 2) _renderSuggestedUsers();
          else _searchFromModal();
        }, 240);
      };
    }
    _renderSuggestedUsers();
    _renderFriendsZone();
    _renderCodeQr();
  }
  function _closeModal() {
    const modal = document.getElementById('duel-modal');
    if (modal) modal.style.display = 'none';
    _closeScanModal();
  }
  function _renderUserResults(users, hintText) {
    const rs = document.getElementById('duel-search-results');
    if (!rs) return;
    if (!users || !users.length) {
      rs.innerHTML = '<div class="ctoday-plan-note">' + (hintText || _tx('No athlete found. Use Friend Code/QR to connect directly.', 'ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ„ط§ط¹ط¨. ط§ط³طھط®ط¯ظ… ظƒظˆط¯/QR ط§ظ„طµط¯ظٹظ‚ ظ„ظ„ط±ط¨ط· ظ…ط¨ط§ط´ط±ط©.')) + '</div>';
      return;
    }
    rs.innerHTML = users.map(u => {
      const uid = _jsArg(u.id);
      const un = _jsArg(u.name || '');
      const ue = _jsArg(u.email || '');
      const friendBtn = _isFriend(u.id)
        ? '<button class="coach-action-btn" onclick="FORGE_DUELS.removeFriend(' + uid + ')">' + _tx('Remove Friend', 'ط­ط°ظپ طµط¯ظٹظ‚') + '</button>'
        : '<button class="coach-action-btn" onclick="FORGE_DUELS.addFriend(' + uid + ',' + un + ',' + ue + ')">' + _tx('Add Friend', 'ط¥ط¶ط§ظپط© طµط¯ظٹظ‚') + '</button>';
      const statLine = u?.stats
        ? (_tx('7d', '7 ط£ظٹط§ظ…') + ': ' + _toNum(u.stats.workout7d, 0) + 'W / ' + _toNum(u.stats.cardio7d, 0) + 'C')
        : (_tx('No stats shared', 'ظ„ط§ طھظˆط¬ط¯ ط¥ط­طµط§ط،ط§طھ ظ…ط´طھط±ظƒط©'));
      const shortCode = FRIEND_CODE_PREFIX + _shortId(u.id);
      return (
        '<div class="duel-user-row">' +
          '<div class="duel-user-meta"><strong>' + _escapeHtml(u.name || 'Athlete') + '</strong><small>' + _escapeHtml(u.email || shortCode) + ' | ' + _escapeHtml(statLine) + '</small></div>' +
          '<div class="duel-user-actions">' +
            friendBtn +
            '<button class="coach-action-btn" onclick="FORGE_DUELS.challenge(' + uid + ',' + un + ',' + ue + ',\'scope:workout\')">' + _tx('Workout', 'طھظ…ط±ظٹظ†') + '</button>' +
            '<button class="coach-action-btn" onclick="FORGE_DUELS.challenge(' + uid + ',' + un + ',' + ue + ',\'scope:cardio\')">' + _tx('Cardio', 'ظƒط§ط±ط¯ظٹظˆ') + '</button>' +
            '<button class="coach-action-btn primary" onclick="FORGE_DUELS.challengeMuscle(' + uid + ',' + un + ',' + ue + ')">' + _tx('Muscle', 'ط¹ط¶ظ„ط©') + '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
  async function _renderSuggestedUsers() {
    const users = await _searchUsers('');
    _renderUserResults(users, _tx('Type 2+ letters, email, or short code (FG-XXXX).', 'ط§ظƒطھط¨ ط­ط±ظپظٹظ† ط£ظˆ ط£ظƒط«ط±طŒ ط¨ط±ظٹط¯ظ‹ط§طŒ ط£ظˆ ظƒظˆط¯ظ‹ط§ ظ‚طµظٹط±ظ‹ط§ (FG-XXXX).'));
  }
  async function _searchFromModal() {
    const input = document.getElementById('duel-search-input');
    const q = String(input?.value || '').trim();
    const rs = document.getElementById('duel-search-results');
    if (!rs) return;
    if (!q) {
      _renderSuggestedUsers();
      return;
    }
    rs.innerHTML = '<div class="ctoday-plan-note">' + _tx('Searching...', 'ط¬ط§ط±ظٹ ط§ظ„ط¨ط­ط«...') + '</div>';
    const users = await _searchUsers(q);
    _renderUserResults(users);
  }
  function _pickMuscle() {
    const raw = window.prompt(_tx('Choose muscle: ', 'ط§ط®طھط± ط§ظ„ط¹ط¶ظ„ط©: ') + MUSCLES.join(', '), MUSCLES[0]);
    if (!raw) return '';
    const m = MUSCLES.find(x => x.toLowerCase() === String(raw).trim().toLowerCase());
    return m || '';
  }
  function _challenge(userId, name, email, mode) {
    _addFriend({ id: userId, name, email });
    _createInvite({ id: userId, name, email }, mode, _targetFor(mode));
  }
  function _challengeMuscle(userId, name, email) {
    const muscle = _pickMuscle();
    if (!muscle) {
      if (typeof showToast === 'function') showToast(_tx('Invalid muscle name', 'ط§ط³ظ… ط¹ط¶ظ„ط© ط؛ظٹط± طµط§ظ„ط­'), 'warn');
      return;
    }
    _createInvite({ id: userId, name, email }, 'scope:muscle:' + muscle, 5);
  }

  async function _renderFriendsZone() {
    const zone = document.getElementById('duel-friends-zone');
    if (!zone) return;
    const fr = _arr(_state.friends);
    if (!fr.length) {
      zone.innerHTML = '<div class="ctoday-plan-note">' + _tx('No friends yet. Add by code or search.', 'ظ„ط§ ظٹظˆط¬ط¯ ط£طµط¯ظ‚ط§ط، ط¨ط¹ط¯. ط£ط¶ظپ ط¨ط§ظ„ظƒظˆط¯ ط£ظˆ ط¨ط§ظ„ط¨ط­ط«.') + '</div>';
      return;
    }
    const profileMap = Object.create(null);
    if (window._sb) {
      try {
        const ids = fr.map(f => f.id).filter(Boolean);
        if (ids.length) {
          let data = [];
          for (const table of PROFILE_TABLES) {
            try {
              const res = await window._sb.from(table).select('id,name,email,display_name,duel_public_stats,data').in('id', ids);
              if (!res.error && Array.isArray(res.data)) {
                data = res.data;
                _profileTableCache[table] = true;
                break;
              }
              _profileTableCache[table] = false;
            } catch (_e) {
              _profileTableCache[table] = false;
            }
          }
          _arr(data).forEach(r => {
            profileMap[r.id] = {
              duelPublicStats: r?.duel_public_stats || r?.data?.duelPublicStats || null
            };
          });
        }
      } catch (_e) {}
    }
    zone.innerHTML =
      '<div class="ctoday-plan-note"><strong>' + _tx('Friends', 'ط§ظ„ط£طµط¯ظ‚ط§ط،') + ':</strong> ' + fr.length + '</div>' +
      fr.map(f => {
        const uid = _jsArg(f.id);
        const un = _jsArg(f.name || '');
        const ue = _jsArg(f.email || '');
        const st = profileMap[f.id]?.duelPublicStats || null;
        const stats = st
          ? (_tx('7d workouts', 'طھظ…ط§ط±ظٹظ† 7 ط£ظٹط§ظ…') + ': ' + _toNum(st.workout7d, 0) + ' | ' + _tx('7d cardio', 'ظƒط§ط±ط¯ظٹظˆ 7 ط£ظٹط§ظ…') + ': ' + _toNum(st.cardio7d, 0))
          : _tx('No shared stats yet', 'ظ„ط§ طھظˆط¬ط¯ ط¥ط­طµط§ط،ط§طھ ظ…ط´طھط±ظƒط© ط¨ط¹ط¯');
        return (
          '<div class="duel-user-row">' +
            '<div class="duel-user-meta"><strong>' + (f.name || 'Athlete') + '</strong><small>' + stats + '</small></div>' +
            '<div class="duel-user-actions">' +
              '<button class="coach-action-btn" onclick="FORGE_DUELS.challenge(' + uid + ',' + un + ',' + ue + ',\'scope:workout\')">' + _tx('Workout', 'طھظ…ط±ظٹظ†') + '</button>' +
              '<button class="coach-action-btn" onclick="FORGE_DUELS.challenge(' + uid + ',' + un + ',' + ue + ',\'scope:cardio\')">' + _tx('Cardio', 'ظƒط§ط±ط¯ظٹظˆ') + '</button>' +
              '<button class="coach-action-btn" onclick="FORGE_DUELS.challengeMuscle(' + uid + ',' + un + ',' + ue + ')">' + _tx('Muscle', 'ط¹ط¶ظ„ط©') + '</button>' +
              '<button class="coach-action-btn" onclick="FORGE_DUELS.removeFriend(' + uid + ')">' + _tx('Remove', 'ط­ط°ظپ') + '</button>' +
            '</div>' +
          '</div>'
        );
      }).join('');
  }
  function _renderCodeQr() {
    const el = document.getElementById('duel-my-code-qr');
    if (!el) return;
    const code = _myFriendCode();
    if (!code) {
      el.innerHTML = '';
      return;
    }
    const url = 'https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=' + encodeURIComponent(code);
    el.innerHTML =
      '<div class="ctoday-plan-note">' + _tx('My Friend QR/Code', 'رمز/كود الصديق الخاص بي') + '</div>' +
      '<div class="duel-qr-wrap"><img src="' + url + '" alt="friend-qr" /><code>' + code + '</code></div>';
  }
  async function _addFriendFromInput() {
    const input = document.getElementById('duel-friend-code-input');
    const ok = await _addFriendByCode(String(input?.value || ''));
    if (ok) {
      if (input) input.value = '';
      if (typeof showToast === 'function') showToast(_tx('Friend added', 'تمت إضافة الصديق'), 'success');
      _renderFriendsZone();
      _saveState();
    } else {
      if (typeof showToast === 'function') showToast(_tx('Invalid friend code', 'كود صديق غير صالح'), 'warn');
    }
  }
  async function _copyMyCode() {
    const code = _myFriendCode();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      if (typeof showToast === 'function') showToast(_tx('Friend code copied', 'تم نسخ كود الصديق'), 'success');
    } catch (_e) {
      if (typeof showToast === 'function') showToast(code, 'warn');
    }
  }
  function _ensureScanModal() {
    let modal = document.getElementById('duel-scan-modal');
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'duel-scan-modal';
    modal.className = 'duel-scan-modal';
    modal.style.display = 'none';
    modal.innerHTML =
      '<div class="duel-scan-backdrop" onclick="FORGE_DUELS.closeScan()"></div>' +
      '<div class="duel-scan-card">' +
        '<div class="duel-scan-head"><strong>' + _tx('Scan Friend QR', 'مسح QR الصديق') + '</strong><button class="coach-action-btn" onclick="FORGE_DUELS.closeScan()">X</button></div>' +
        '<video id="duel-scan-video" class="duel-scan-video" autoplay playsinline muted></video>' +
        '<div class="ctoday-plan-note">' + _tx('Align the QR inside the frame.', 'ضع رمز QR داخل الإطار.') + '</div>' +
      '</div>';
    document.body.appendChild(modal);
    return modal;
  }
  function _closeScanModal() {
    const modal = document.getElementById('duel-scan-modal');
    if (modal) modal.style.display = 'none';
    if (_scanRaf) cancelAnimationFrame(_scanRaf);
    _scanRaf = 0;
    if (_scanStream) {
      try { _scanStream.getTracks().forEach(t => t.stop()); } catch (_e) {}
      _scanStream = null;
    }
  }
  async function _scanCode() {
    if (!window.isSecureContext || !navigator.mediaDevices || typeof window.BarcodeDetector === 'undefined') {
      if (typeof showToast === 'function') showToast(_tx('Camera scan unavailable here. Paste code instead.', 'المسح بالكاميرا غير متاح هنا. الصق الكود بدلًا من ذلك.'), 'warn');
      return;
    }
    const modal = _ensureScanModal();
    const video = document.getElementById('duel-scan-video');
    if (!video) return;
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      _scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      video.srcObject = _scanStream;
      modal.style.display = 'block';
      try { await video.play(); } catch (_e) {}

      const loop = async () => {
        if (!modal || modal.style.display === 'none') return;
        try {
          const found = await detector.detect(video);
          const raw = String(found?.[0]?.rawValue || '').trim();
          if (raw) {
            const ok = await _addFriendByCode(raw);
            if (ok) {
              if (typeof showToast === 'function') showToast(_tx('Friend added from QR', 'تمت إضافة الصديق من QR'), 'success');
              _renderFriendsZone();
              _saveState();
            } else if (typeof showToast === 'function') {
              showToast(_tx('QR scanned, but no user matched.', 'تم مسح QR لكن لا يوجد مستخدم مطابق.'), 'warn');
            }
            _closeScanModal();
            return;
          }
        } catch (_e) {}
        _scanRaf = requestAnimationFrame(loop);
      };
      _scanRaf = requestAnimationFrame(loop);
    } catch (_e) {
      _closeScanModal();
      if (typeof showToast === 'function') showToast(_tx('Could not open camera scanner.', 'تعذر فتح ماسح الكاميرا.'), 'warn');
    }
  }
  function _openDuelCenter() {
    try {
      if (typeof window.switchView === 'function') {
        window.switchView('coach', document.getElementById('bnav-coach'));
      }
      const todayBtn = document.querySelector('.coach-tab[onclick*="coachSwitchTab(\'today\'"]') || document.querySelector('.coach-tab');
      if (typeof window.coachSwitchTab === 'function') window.coachSwitchTab('today', todayBtn || null);
      setTimeout(() => {
        const duelCard = document.querySelector('#coach-tab-today .coach-duel-card');
        if (duelCard) {
          try { duelCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_e) {}
          duelCard.classList.add('duel-card-pulse');
          setTimeout(() => duelCard.classList.remove('duel-card-pulse'), 1200);
        }
      }, 180);
    } catch (_e) {}
  }

  async function _subscribe() {
    const table = await _ensureTable();
    if (!window._sb || !table) return;
    if (_channel) {
      try { window._sb.removeChannel(_channel); } catch (_e) {}
      _channel = null;
    }
    _channel = window._sb
      .channel('forge-duels-live')
      .on('postgres_changes', { event: '*', schema: 'public', table }, async (payload) => {
        const row = _asRow(payload?.new || payload?.record);
        if (!row) return;
        if (!_getSide(row)) return;
        if (row.status === 'pending' && _getSide(row) === 'opponent' && typeof showToast === 'function') {
          const challenger = _decodeUser(row.challenger).name;
          showToast(_tx(`New duel invite from ${challenger}`, `ط¯ط¹ظˆط© طھط­ط¯ظٹ ط¬ط¯ظٹط¯ط© ظ…ظ† ${challenger}`), 'success');
        }
        await _refreshState();
      })
      .subscribe();
  }

  async function _onPostSave() {
    _publishOwnStats();
    await _syncActiveScore();
    await _refreshInboxIfDue();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    await _getMe();
    _publishOwnStats();
    _renderCoachCard();
    _refreshState();
    _subscribe();
  });

  window.FORGE_DUELS = {
    open: function () { _openDuelCenter(); _openModal(); },
    closeModal: _closeModal,
    search: _searchFromModal,
    addFriendCode: _addFriendFromInput,
    copyCode: _copyMyCode,
    scanCode: _scanCode,
    closeScan: _closeScanModal,
    addFriend: function (id, name, email) { _addFriend({ id, name, email }); _renderFriendsZone(); },
    removeFriend: function (id) { _removeFriend(id); _renderFriendsZone(); },
    challenge: _challenge,
    challengeMuscle: _challengeMuscle,
    startXp: function () { _openDuelCenter(); _openModal(); },
    startVolume: function () { _openDuelCenter(); _openModal(); },
    acceptInvite: function (id) { _respondInvite(id, true); },
    declineInvite: function (id) { _respondInvite(id, false); },
    cancelActive: _cancelActive,
    syncNow: function () { _syncActiveScore(); _refreshState(); },
    refresh: _refreshState,
    onPostSave: _onPostSave,
    renderInto: _renderCoachCard
  };
})();


