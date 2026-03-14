'use strict';

(function () {
  const KEY_STATE = 'forge_duel_state_v2';
  const TABLES = ['forge_duels', 'duels'];
  const PROFILE_TABLES = ['profiles_public', 'profiles'];
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
    if (parsed.scope === 'cardio') return _tx('Cardio Sessions', 'جلسات الكارديو');
    if (parsed.scope === 'muscle') return _tx(`${parsed.muscle || 'Muscle'} Sessions`, `جلسات ${parsed.muscle || 'عضلة'}`);
    return _tx('Workout Sessions', 'جلسات التمرين');
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

  async function _searchUsers(query) {
    const me = await _getMe();
    if (!window._sb || !me) return [];
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    try {
      let rows = [];
      for (const table of PROFILE_TABLES) {
        try {
          const { data, error } = await window._sb.from(table).select('id,name,email,display_name,data').limit(220);
          if (!error && Array.isArray(data)) {
            rows = data;
            _profileTableCache[table] = true;
            break;
          }
          _profileTableCache[table] = false;
        } catch (_e) {
          _profileTableCache[table] = false;
        }
      }
      if (!rows.length) return [];
      return rows
        .map(r => ({
          id: r.id,
          name: String(r?.name || r?.display_name || r?.data?.name || r?.data?.displayName || r?.data?.username || ''),
          email: String(r?.email || r?.data?.email || ''),
          stats: r?.duel_public_stats || r?.data?.duelPublicStats || null
        }))
        .filter(u => u.id && u.id !== me.id)
        .filter(u => (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          String(u.id).toLowerCase().includes(q)
        ))
        .slice(0, 20);
    } catch (_e) {
      return [];
    }
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
    return _friendToken({ id: _me.id, name: _playerName(_me), email: _me.email || '' });
  }
  function _addFriendByCode(rawCode) {
    const u = _decodeUser(String(rawCode || '').trim());
    if (!u.id) return false;
    if (_me && String(u.id) === String(_me.id)) return false;
    _addFriend(u);
    return true;
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
      if (typeof showToast === 'function') showToast(_tx('Cannot create duel now', 'تعذر إنشاء التحدي الآن'), 'warn');
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
      if (typeof showToast === 'function') showToast(_tx('Duel started (local mode)', 'تم بدء التحدي (وضع محلي)'), 'warn');
      _closeModal();
      return;
    }
    try {
      const { error } = await window._sb.from(table).upsert(payload);
      if (error) throw error;
      if (typeof showToast === 'function') showToast(_tx('Duel invite sent', 'تم إرسال دعوة التحدي'), 'success');
      _closeModal();
      _refreshState();
    } catch (_e) {
      if (typeof showToast === 'function') showToast(_tx('Failed to send invite', 'فشل إرسال الدعوة'), 'warn');
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
      if (typeof showToast === 'function') showToast(accept ? _tx('Duel accepted', 'تم قبول التحدي') : _tx('Duel declined', 'تم رفض التحدي'), 'success');
      _refreshState();
    } catch (_e) {
      if (typeof showToast === 'function') showToast(_tx('Action failed', 'فشل تنفيذ العملية'), 'warn');
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
                '<div><strong>' + ch.name + '</strong><div class="duel-invite-sub">' + _formatScope(r.mode) + ' · ' + _tx('target', 'الهدف') + ' ' + _toNum(r.target, _targetFor(r.mode)) + '</div></div>' +
                '<div class="duel-invite-actions">' +
                  '<button class="coach-action-btn primary" onclick="FORGE_DUELS.acceptInvite(\'' + r.id + '\')">' + _tx('Accept', 'قبول') + '</button>' +
                  '<button class="coach-action-btn" onclick="FORGE_DUELS.declineInvite(\'' + r.id + '\')">' + _tx('Decline', 'رفض') + '</button>' +
                '</div>' +
              '</div>'
            );
          }).join('') + '</div>'
        : '<div class="ctoday-plan-note">' + _tx('No pending invites', 'لا توجد دعوات حالياً') + '</div>';

    card.innerHTML =
      '<div class="ctoday-card-title">1v1 Duel</div>' +
      '<div class="ctoday-plan-note">' + _tx('Search athletes by name/email and challenge them in workout, muscle, or cardio.', 'ابحث عن الرياضيين بالاسم أو البريد وتحداهم في التمرين أو العضلة أو الكارديو.') + '</div>' +
      '<div class="coach-dual-actions" style="margin-top:10px;">' +
        '<button class="coach-action-btn primary" onclick="FORGE_DUELS.open()">' + _tx('Find Athlete', 'ابحث عن لاعب') + '</button>' +
        '<button class="coach-action-btn" onclick="FORGE_DUELS.refresh()">' + _tx('Refresh', 'تحديث') + '</button>' +
      '</div>' +
      '<div class="ctoday-plan-note" style="margin-top:8px;"><strong>' + _tx('Friends', 'الأصدقاء') + ':</strong> ' + _arr(_state.friends).length + '</div>' +
      '<div class="ctoday-plan-note" style="margin-top:10px;"><strong>' + _tx('Invites', 'الدعوات') + ':</strong> ' + inv.length + '</div>' +
      inviteHtml;
      return;
    }

    const ds = _displayScores(active);
    const pMine = _progress(active, ds.mine);
    const pTheirs = _progress(active, ds.theirs);
    const lead = ds.mine - ds.theirs;
    const leadText = lead === 0
      ? _tx('Tie game', 'التحدي متعادل')
      : lead > 0
        ? _tx(`You lead by ${lead}`, `أنت متقدم بـ ${lead}`)
        : _tx(`Behind by ${Math.abs(lead)}`, `متأخر بـ ${Math.abs(lead)}`);

    card.innerHTML =
      '<div class="ctoday-card-title">1v1 Duel</div>' +
      '<div class="ctoday-plan-note"><strong>' + _formatScope(active.mode) + '</strong> · ' + _tx('days left', 'متبقي أيام') + ': ' + _daysLeft(active) + '</div>' +
      '<div class="duel-split">' +
        '<div class="duel-side self"><div class="duel-name">' + ds.myName + '</div><div class="duel-score">' + ds.mine + '</div><div class="duel-bar"><span style="width:' + pMine + '%;"></span></div></div>' +
        '<div class="duel-vs">VS</div>' +
        '<div class="duel-side opp"><div class="duel-name">' + ds.theirName + '</div><div class="duel-score">' + ds.theirs + '</div><div class="duel-bar"><span style="width:' + pTheirs + '%;"></span></div></div>' +
      '</div>' +
      '<div class="ctoday-plan-note duel-lead">' + leadText + '</div>' +
      '<div class="coach-dual-actions" style="margin-top:8px;">' +
        '<button class="coach-action-btn" onclick="FORGE_DUELS.syncNow()">' + _tx('Sync Score', 'مزامنة النتيجة') + '</button>' +
        '<button class="coach-action-btn" onclick="FORGE_DUELS.cancelActive()">' + _tx('End Duel', 'إنهاء التحدي') + '</button>' +
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
          '<input id="duel-friend-code-input" class="duel-search-input" placeholder="Paste friend code" />' +
          '<button class="coach-action-btn" onclick="FORGE_DUELS.addFriendCode()">' + _tx('Add Friend', 'إضافة صديق') + '</button>' +
          '<button class="coach-action-btn" onclick="FORGE_DUELS.copyCode()">' + _tx('Copy My Code', 'نسخ كودي') + '</button>' +
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
    }
    const rs = document.getElementById('duel-search-results');
    if (rs) rs.innerHTML = '<div class="ctoday-plan-note">' + _tx('Type a name or email to find athletes.', 'اكتب اسماً أو بريداً للبحث عن الرياضيين.') + '</div>';
    _renderFriendsZone();
    _renderCodeQr();
  }
  function _closeModal() {
    const modal = document.getElementById('duel-modal');
    if (modal) modal.style.display = 'none';
  }
  async function _searchFromModal() {
    const input = document.getElementById('duel-search-input');
    const q = String(input?.value || '').trim();
    const rs = document.getElementById('duel-search-results');
    if (!rs) return;
    if (!q) {
      rs.innerHTML = '<div class="ctoday-plan-note">' + _tx('Enter search text', 'اكتب نص البحث') + '</div>';
      return;
    }
    rs.innerHTML = '<div class="ctoday-plan-note">' + _tx('Searching...', 'جاري البحث...') + '</div>';
    const users = await _searchUsers(q);
    if (!users.length) {
      rs.innerHTML = '<div class="ctoday-plan-note">' + _tx('No athlete found. Use Friend Code/QR to connect directly.', 'لم يتم العثور على لاعب. استخدم كود/QR الصديق للربط مباشرة.') + '</div>';
      return;
    }
    rs.innerHTML = users.map(u => {
      const uid = _jsArg(u.id);
      const un = _jsArg(u.name || '');
      const ue = _jsArg(u.email || '');
      const friendBtn = _isFriend(u.id)
        ? '<button class="coach-action-btn" onclick="FORGE_DUELS.removeFriend(' + uid + ')">' + _tx('Remove Friend', 'حذف صديق') + '</button>'
        : '<button class="coach-action-btn" onclick="FORGE_DUELS.addFriend(' + uid + ',' + un + ',' + ue + ')">' + _tx('Add Friend', 'إضافة صديق') + '</button>';
      return (
        '<div class="duel-user-row">' +
          '<div class="duel-user-meta"><strong>' + (u.name || 'Athlete') + '</strong><small>' + (u.email || '') + '</small></div>' +
          '<div class="duel-user-actions">' +
            friendBtn +
            '<button class="coach-action-btn" onclick="FORGE_DUELS.challenge(' + uid + ',' + un + ',' + ue + ',\'scope:workout\')">' + _tx('Workout', 'تمرين') + '</button>' +
            '<button class="coach-action-btn" onclick="FORGE_DUELS.challenge(' + uid + ',' + un + ',' + ue + ',\'scope:cardio\')">' + _tx('Cardio', 'كارديو') + '</button>' +
            '<button class="coach-action-btn primary" onclick="FORGE_DUELS.challengeMuscle(' + uid + ',' + un + ',' + ue + ')">' + _tx('Muscle', 'عضلة') + '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }
  function _pickMuscle() {
    const raw = window.prompt(_tx('Choose muscle: ', 'اختر العضلة: ') + MUSCLES.join(', '), MUSCLES[0]);
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
      if (typeof showToast === 'function') showToast(_tx('Invalid muscle name', 'اسم عضلة غير صالح'), 'warn');
      return;
    }
    _createInvite({ id: userId, name, email }, 'scope:muscle:' + muscle, 5);
  }

  async function _renderFriendsZone() {
    const zone = document.getElementById('duel-friends-zone');
    if (!zone) return;
    const fr = _arr(_state.friends);
    if (!fr.length) {
      zone.innerHTML = '<div class="ctoday-plan-note">' + _tx('No friends yet. Add by code or search.', 'لا يوجد أصدقاء بعد. أضف بالكود أو بالبحث.') + '</div>';
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
      '<div class="ctoday-plan-note"><strong>' + _tx('Friends', 'الأصدقاء') + ':</strong> ' + fr.length + '</div>' +
      fr.map(f => {
        const uid = _jsArg(f.id);
        const un = _jsArg(f.name || '');
        const ue = _jsArg(f.email || '');
        const st = profileMap[f.id]?.duelPublicStats || null;
        const stats = st
          ? (_tx('7d workouts', 'تمارين 7 أيام') + ': ' + _toNum(st.workout7d, 0) + ' | ' + _tx('7d cardio', 'كارديو 7 أيام') + ': ' + _toNum(st.cardio7d, 0))
          : _tx('No shared stats yet', 'لا توجد إحصاءات مشتركة بعد');
        return (
          '<div class="duel-user-row">' +
            '<div class="duel-user-meta"><strong>' + (f.name || 'Athlete') + '</strong><small>' + stats + '</small></div>' +
            '<div class="duel-user-actions">' +
              '<button class="coach-action-btn" onclick="FORGE_DUELS.challenge(' + uid + ',' + un + ',' + ue + ',\'scope:workout\')">' + _tx('Workout', 'تمرين') + '</button>' +
              '<button class="coach-action-btn" onclick="FORGE_DUELS.challenge(' + uid + ',' + un + ',' + ue + ',\'scope:cardio\')">' + _tx('Cardio', 'كارديو') + '</button>' +
              '<button class="coach-action-btn" onclick="FORGE_DUELS.challengeMuscle(' + uid + ',' + un + ',' + ue + ')">' + _tx('Muscle', 'عضلة') + '</button>' +
              '<button class="coach-action-btn" onclick="FORGE_DUELS.removeFriend(' + uid + ')">' + _tx('Remove', 'حذف') + '</button>' +
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
      '<div class="duel-qr-wrap"><img src="' + url + '" alt="friend-qr" /><code>' + code.slice(0, 24) + '...</code></div>';
  }
  function _addFriendFromInput() {
    const input = document.getElementById('duel-friend-code-input');
    const ok = _addFriendByCode(String(input?.value || ''));
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
          showToast(_tx(`New duel invite from ${challenger}`, `دعوة تحدي جديدة من ${challenger}`), 'success');
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
