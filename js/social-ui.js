'use strict';

(function () {
  const state = {
    currentTab: 'hub',
    selectedFriendId: '',
    lastResults: [],
    profileDirectory: [],
    lastUiSnapshot: null,
    booted: false
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function _duelState() {
    if (window.FORGE_DUELS && typeof window.FORGE_DUELS.getStateSnapshot === 'function') {
      return window.FORGE_DUELS.getStateSnapshot();
    }
    try {
      const raw = localStorage.getItem('forge_duel_state_v2');
      return raw ? JSON.parse(raw) : { active: null, invites: [], history: [], friends: [] };
    } catch (_e) {
      return { active: null, invites: [], history: [], friends: [] };
    }
  }

  function _uiDuelState() {
    if (window.FORGE_DUELS && typeof window.FORGE_DUELS.getUiSnapshot === 'function') {
      return window.FORGE_DUELS.getUiSnapshot();
    }
    return { active: null, invites: [], history: [] };
  }

  function _friendCount() {
    const s = _duelState();
    return Array.isArray(s?.friends) ? s.friends.length : 0;
  }

  function _activeDuelLabel() {
    const s = _duelState();
    return s?.active ? 'LIVE' : 'NONE';
  }

  function _escape(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function _num(v, fb) {
    const n = Number(v);
    return Number.isFinite(n) ? n : (fb || 0);
  }

  function _maybeToast(msg, tone) {
    if (typeof showToast === 'function') showToast(msg, tone || 'success');
  }

  function _localSummary() {
    const weighted = Array.isArray(window.workouts) ? window.workouts : [];
    const bw = Array.isArray(window.bwWorkouts) ? window.bwWorkouts : [];
    const cardio = Array.isArray(window.cardioLog) ? window.cardioLog : [];
    const weekMs = Date.now() - (7 * 86400000);
    const toMs = (v) => new Date(v || 0).getTime();
    const weighted7 = weighted.filter((row) => toMs(row?.date) >= weekMs).length;
    const bw7 = bw.filter((row) => toMs(row?.date) >= weekMs).length;
    const cardio7 = cardio.filter((row) => toMs(row?.date) >= weekMs).length;
    const volume7 = weighted.filter((row) => toMs(row?.date) >= weekMs).reduce((sum, row) => sum + _num(row?.volume, 0), 0);
    const streak = typeof window.calcStreak === 'function' ? _num(window.calcStreak(), 0) : 0;
    const xp = typeof window.calcXP === 'function' ? _num(window.calcXP(), 0) : 0;
    const lvl = typeof window.getCurrentLevel === 'function' ? window.getCurrentLevel(xp) : null;
    const profile = window.userProfile || {};
    return {
      name: (profile.name || profile.displayName) || 'You',
      workout7d: weighted7 + bw7,
      cardio7d: cardio7,
      volume7d: Math.round(volume7),
      streak,
      readiness: _num(window._coachScoreCached?.totalScore, _num(window.readinessScore, 0)),
      balance: _num(window._coachScoreCached?.balanceScore, 0),
      xp,
      rank: lvl?.name || '',
      strongestArea: profile.targetMuscle || ''
    };
  }

  function _friendProfile(friendId) {
    return state.profileDirectory.find((row) => String(row.id) === String(friendId)) || null;
  }

  function _friendCompareSummary(friendId) {
    const friend = _friendProfile(friendId);
    const stats = friend?.stats || {};
    return {
      name: friend?.name || 'Friend',
      workout7d: _num(stats.workout7d, 0),
      cardio7d: _num(stats.cardio7d, 0),
      volume7d: _num(stats.volume7d, 0),
      streak: _num(stats.streak, 0),
      readiness: _num(stats.readiness, 0),
      balance: _num(stats.balanceScore, 0),
      xp: _num(stats.xp, 0),
      rank: stats.rank || '',
      strongestArea: stats.strongestArea || ''
    };
  }

  function _leadCopy(me, friend) {
    const lanes = [
      { key: 'workout7d', label: 'weekly sessions' },
      { key: 'cardio7d', label: 'cardio' },
      { key: 'volume7d', label: 'volume' },
      { key: 'streak', label: 'streak' },
      { key: 'readiness', label: 'readiness' },
      { key: 'balance', label: 'balance' }
    ];
    let bestLead = null;
    let bestTrail = null;
    lanes.forEach((lane) => {
      const diff = _num(me[lane.key], 0) - _num(friend[lane.key], 0);
      if (diff > 0 && (!bestLead || diff > bestLead.diff)) bestLead = { ...lane, diff };
      if (diff < 0 && (!bestTrail || Math.abs(diff) > Math.abs(bestTrail.diff))) bestTrail = { ...lane, diff };
    });
    if (bestLead && bestTrail) return 'You lead in ' + bestLead.label + '. Catch up lane: ' + bestTrail.label + '.';
    if (bestLead) return 'You lead in ' + bestLead.label + '. Push a duel before the gap closes.';
    if (bestTrail) return 'You trail in ' + bestTrail.label + '. Best catch-up lane is clear.';
    return 'Even matchup. One strong session can swing this rivalry.';
  }

  function _compareMetric(label, me, friend, unit) {
    const meVal = _num(me, 0);
    const friendVal = _num(friend, 0);
    const lead = meVal === friendVal ? 'TIE' : meVal > friendVal ? 'YOU' : 'FRIEND';
    return '' +
      '<div class="social-compare-metric">' +
        '<div class="social-compare-top"><span>' + label + '</span><strong>' + lead + '</strong></div>' +
        '<div class="social-compare-values"><b>' + meVal + (unit || '') + '</b><span>vs</span><b>' + friendVal + (unit || '') + '</b></div>' +
      '</div>';
  }

  function _panelHtml(title, sub, actions) {
    return '' +
      '<div class="social-card">' +
        '<div class="social-card-title">' + title + '</div>' +
        '<div class="social-card-sub">' + sub + '</div>' +
        (actions || '') +
      '</div>';
  }

  function _inviteCard(invite) {
    const inviteId = JSON.stringify(String(invite?.id || ''));
    return '' +
      '<div class="social-feed-card">' +
        '<div class="social-feed-top"><strong>' + _escape(invite.challengerName || 'Athlete') + '</strong><span>' + _escape(invite.modeLabel || 'Workout Sessions') + '</span></div>' +
        '<div class="social-feed-sub">Target ' + _num(invite.target, 0) + ' | Ready to accept?</div>' +
        '<div class="social-friend-actions">' +
          '<button class="social-action-btn primary" type="button" onclick=\'if(window.FORGE_DUELS){window.FORGE_DUELS.acceptInvite(' + inviteId + ');} window.FORGE_SOCIAL.refresh();\'>Accept</button>' +
          '<button class="social-action-btn" type="button" onclick=\'if(window.FORGE_DUELS){window.FORGE_DUELS.declineInvite(' + inviteId + ');} window.FORGE_SOCIAL.refresh();\'>Decline</button>' +
        '</div>' +
      '</div>';
  }

  function _historyCard(item) {
    return '' +
      '<div class="social-feed-card">' +
        '<div class="social-feed-top"><strong>' + _escape(item.modeLabel || 'Workout Sessions') + '</strong><span>' + _escape((item.status || '').toUpperCase()) + '</span></div>' +
        '<div class="social-feed-sub">' + _escape(item.challengerName || 'Athlete') + ' vs ' + _escape(item.opponentName || 'Athlete') + '</div>' +
      '</div>';
  }

  function _emitSocialSignals(prev, next) {
    if (!prev || !next) return;
    const prevFriends = _num(prev.friendCount, 0);
    const nextFriends = _num(next.friendCount, 0);
    if (nextFriends > prevFriends) {
      _maybeToast('Friend added to your rivalry list', 'success');
      if (typeof sndSocialAccept === 'function') sndSocialAccept();
      if (typeof hapSocialAccept === 'function') hapSocialAccept();
    }
    const prevInviteCount = _num(prev.inviteCount, 0);
    const nextInviteCount = _num(next.inviteCount, 0);
    if (nextInviteCount > prevInviteCount) {
      _maybeToast('New duel invite received', 'success');
      if (typeof sndSocialInvite === 'function') sndSocialInvite();
      if (typeof hapSocialInvite === 'function') hapSocialInvite();
    }
    if (!prev.activeId && next.activeId) {
      _maybeToast('Duel lane is live', 'success');
      if (typeof sndSocialLead === 'function') sndSocialLead();
      if (typeof hapSocialLead === 'function') hapSocialLead();
    }
    if (prev.activeId && !next.activeId && next.historyCount > prev.historyCount) {
      _maybeToast('Duel finished. Check your result.', 'success');
      if (typeof sndSocialWin === 'function') sndSocialWin();
      if (typeof hapSocialWin === 'function') hapSocialWin();
    }
  }

  function renderHub() {
    const el = byId('social-panel-hub');
    if (!el) return;
    const social = _uiDuelState();
    const active = social?.active;
    const invites = Array.isArray(social?.invites) ? social.invites : [];
    const activeCard = active
      ? '<div class="social-card social-duel-hero">' +
          '<div class="social-card-title">ACTIVE DUEL</div>' +
          '<div class="social-card-sub">' + _escape(active.modeLabel || 'Workout Sessions') + ' | ' + _num(active.daysLeft, 0) + ' day(s) left</div>' +
          '<div class="social-compare-head">' +
            '<div class="social-compare-side"><span>YOU</span><strong>' + _escape(active.myName || 'You') + '</strong></div>' +
            '<div class="social-compare-vs">VS</div>' +
            '<div class="social-compare-side"><span>RIVAL</span><strong>' + _escape(active.theirName || 'Friend') + '</strong></div>' +
          '</div>' +
          '<div class="social-compare-grid">' +
            _compareMetric('Progress', active.mine, active.theirs, '') +
            _compareMetric('Target', active.target, active.target, '') +
          '</div>' +
        '</div>'
      : '<div class="social-card"><div class="social-card-title">NO ACTIVE DUEL</div><div class="social-card-sub">Add a rival and start a competitive lane from Friends or Duels.</div></div>';
    const inviteRail = invites.length
      ? invites.map(_inviteCard).join('')
      : '<div class="social-card-sub">No pending invites right now.</div>';
    el.innerHTML = '' +
      _panelHtml(
        'SOCIAL HUB',
        active
          ? 'Your duel lane is live. Protect your lead or make a comeback.'
          : 'No active duel. Add a rival and start a competitive lane.',
        '<div class="social-action-row">' +
          '<button class="social-action-btn primary" type="button" onclick="window.FORGE_SOCIAL.open(\'friends\')">Add Friend</button>' +
          '<button class="social-action-btn" type="button" onclick="window.FORGE_SOCIAL.open(\'duels\')">Open Duels</button>' +
        '</div>'
      ) +
      activeCard +
      '<div class="social-card"><div class="social-card-title">INVITE RAIL</div><div class="social-card-sub">Respond fast to keep the social loop active.</div><div class="social-feed-list">' + inviteRail + '</div></div>';
  }

  function _friendCard(friend) {
    const name = _escape(friend?.name || 'Athlete');
    const email = _escape(friend?.email || 'No email shared');
    const id = JSON.stringify(String(friend?.id || ''));
    const profile = _friendProfile(friend?.id) || {};
    const stats = profile?.stats || {};
    const meta = [];
    if (stats.rank) meta.push(_escape(stats.rank));
    if (_num(stats.streak, 0) > 0) meta.push(_num(stats.streak, 0) + 'd streak');
    if (stats.strongestArea) meta.push(_escape(stats.strongestArea));
    return '' +
      '<div class="social-friend-card">' +
        '<div class="social-friend-meta">' +
          '<strong>' + name + '</strong>' +
          '<span>' + email + '</span>' +
          (meta.length ? '<div class="social-friend-tags">' + meta.map((tag) => '<em>' + tag + '</em>').join('') + '</div>' : '') +
        '</div>' +
        '<div class="social-friend-actions">' +
          '<button class="social-action-btn" type="button" onclick=\'window.FORGE_SOCIAL.open("compare"); window.FORGE_SOCIAL.selectFriend(' + id + ')\'">Compare</button>' +
          '<button class="social-action-btn" type="button" onclick=\'window.FORGE_SOCIAL.startDuel(' + id + ',"workout")\'>Workout Duel</button>' +
          '<button class="social-action-btn" type="button" onclick=\'window.FORGE_SOCIAL.removeFriend(' + id + ')\'">Remove</button>' +
        '</div>' +
      '</div>';
  }

  function _resultCard(user) {
    const id = JSON.stringify(String(user?.id || ''));
    const name = _escape(user?.name || 'Athlete');
    const email = _escape(user?.email || 'No email shared');
    return '' +
      '<div class="social-friend-card social-search-result">' +
        '<div class="social-friend-meta">' +
          '<strong>' + name + '</strong>' +
          '<span>' + email + '</span>' +
        '</div>' +
        '<div class="social-friend-actions">' +
          '<button class="social-action-btn primary" type="button" onclick=\'window.FORGE_SOCIAL.addFoundFriend(' + id + ')\'">Add Friend</button>' +
          '<button class="social-action-btn" type="button" onclick=\'window.FORGE_SOCIAL.selectFriend(' + id + '); window.FORGE_SOCIAL.open("compare")\'>Compare</button>' +
        '</div>' +
      '</div>';
  }

  function renderFriends() {
    const el = byId('social-panel-friends');
    if (!el) return;
    const s = _duelState();
    const friends = Array.isArray(s?.friends) ? s.friends : [];
    const resultHtml = state.lastResults.length
      ? state.lastResults.map(_resultCard).join('')
      : '<div class="social-card-sub">Search by name or email to add a rival. QR and code remain available from the old duel center while this surface expands.</div>';
    const friendHtml = friends.length
      ? friends.map(_friendCard).join('')
      : '<div class="social-card-sub">No friends yet. Search for one by name or email, or use your friend code.</div>';
    const myCode = window.FORGE_DUELS && typeof window.FORGE_DUELS.getFriendCode === 'function'
      ? window.FORGE_DUELS.getFriendCode()
      : '';
    el.innerHTML = '' +
      _panelHtml(
        'FRIENDS',
        'Search, add, and manage your rivals from this surface.',
        '<div class="social-friend-tools">' +
          '<div class="social-search-wrap">' +
            '<input id="social-friend-search" class="social-search-input" type="text" placeholder="Search by name or email" />' +
            '<button class="social-action-btn primary" type="button" onclick="window.FORGE_SOCIAL.searchFriends()">Search</button>' +
          '</div>' +
          '<div class="social-action-row">' +
            '<button class="social-action-btn" type="button" onclick="if(window.FORGE_DUELS){window.FORGE_DUELS.open();}">QR and Code</button>' +
            '<button class="social-action-btn" type="button" onclick="window.FORGE_SOCIAL.copyFriendCode()">Copy Code</button>' +
          '</div>' +
          (myCode ? '<div class="social-code-chip">My Code: <code>' + _escape(myCode) + '</code></div>' : '') +
        '</div>'
      ) +
      '<div class="social-card"><div class="social-card-title">SEARCH RESULTS</div><div class="social-card-sub">Best matches from the public athlete directory.</div><div class="social-friend-list">' + resultHtml + '</div></div>' +
      '<div class="social-card"><div class="social-card-title">YOUR FRIENDS</div><div class="social-card-sub">People you can compare with and challenge.</div><div class="social-friend-list">' + friendHtml + '</div></div>';
  }

  function renderCompare() {
    const el = byId('social-panel-compare');
    if (!el) return;
    const s = _duelState();
    const friends = Array.isArray(s?.friends) ? s.friends : [];
    const selected = friends.find((f) => String(f.id) === String(state.selectedFriendId)) || friends[0] || null;
    if (!selected) {
      el.innerHTML = _panelHtml(
        'COMPARE',
        'Head-to-head workout, cardio, streak, and balance comparisons will render here.',
        '<div class="social-empty-grid">' +
          '<div class="social-card"><div class="social-card-title">NO RIVAL YET</div><div class="social-card-sub">Add a friend first, then compare sessions, cardio, streak, and balance.</div></div>' +
          '<div class="social-card"><div class="social-card-title">NEXT MOVE</div><div class="social-card-sub">Search a rival from Friends to unlock compare cards.</div></div>' +
        '</div>'
      );
      return;
    }
    state.selectedFriendId = String(selected.id);
    const me = _localSummary();
    const friend = _friendCompareSummary(selected.id);
    const compareMeta = '' +
      '<div class="social-empty-grid">' +
        '<div class="social-card"><div class="social-card-title">RANK</div><div class="social-card-sub">You: ' + _escape(me.rank || 'Unranked') + ' | Rival: ' + _escape(friend.rank || 'Unranked') + '</div></div>' +
        '<div class="social-card"><div class="social-card-title">STRONGEST AREA</div><div class="social-card-sub">You: ' + _escape(me.strongestArea || 'N/A') + ' | Rival: ' + _escape(friend.strongestArea || 'N/A') + '</div></div>' +
      '</div>';
    el.innerHTML = '' +
      _panelHtml(
        'COMPARE',
        _leadCopy(me, friend),
        '<div class="social-compare-head">' +
          '<div class="social-compare-side"><span>YOU</span><strong>' + _escape(me.name) + '</strong></div>' +
          '<div class="social-compare-vs">VS</div>' +
          '<div class="social-compare-side"><span>RIVAL</span><strong>' + _escape(friend.name) + '</strong></div>' +
        '</div>'
      ) + compareMeta +
      '<div class="social-compare-grid">' +
        _compareMetric('Weekly Sessions', me.workout7d, friend.workout7d, '') +
        _compareMetric('Cardio 7d', me.cardio7d, friend.cardio7d, '') +
        _compareMetric('Volume 7d', me.volume7d, friend.volume7d, 'kg') +
        _compareMetric('Streak', me.streak, friend.streak, 'd') +
        _compareMetric('Readiness', me.readiness, friend.readiness, '') +
        _compareMetric('Balance', me.balance, friend.balance, '') +
      '</div>';
  }

  function _duelComposer() {
    const s = _duelState();
    const friends = Array.isArray(s?.friends) ? s.friends : [];
    if (!friends.length) {
      return '<div class="social-card-sub">Add a friend first to start a duel directly from Social.</div>';
    }
    const selected = friends.find((f) => String(f.id) === String(state.selectedFriendId)) || friends[0];
    if (selected && !state.selectedFriendId) state.selectedFriendId = String(selected.id);
    const options = friends.map((f) => '<option value="' + _escape(f.id) + '"' + (String(f.id) === String(state.selectedFriendId) ? ' selected' : '') + '>' + _escape(f.name || 'Athlete') + '</option>').join('');
    return '' +
      '<div class="social-friend-tools">' +
        '<div class="social-search-wrap">' +
          '<select id="social-duel-friend" class="social-search-input" onchange="window.FORGE_SOCIAL.selectFriend(this.value)">' + options + '</select>' +
        '</div>' +
        '<div class="social-action-row">' +
          '<button class="social-action-btn primary" type="button" onclick="window.FORGE_SOCIAL.startDuel(null,\'workout\')">Workout Duel</button>' +
          '<button class="social-action-btn" type="button" onclick="window.FORGE_SOCIAL.startDuel(null,\'cardio\')">Cardio Duel</button>' +
        '</div>' +
        '<div class="social-action-row">' +
          '<button class="social-action-btn" type="button" onclick="window.FORGE_SOCIAL.startDuel(null,\'muscle\')">Muscle Duel</button>' +
          '<button class="social-action-btn" type="button" onclick="if(window.FORGE_DUELS){FORGE_DUELS.open();}">Advanced Duel Center</button>' +
        '</div>' +
      '</div>';
  }

  function renderDuels() {
    const el = byId('social-panel-duels');
    if (!el) return;
    const social = _uiDuelState();
    const invites = Array.isArray(social?.invites) ? social.invites : [];
    const history = Array.isArray(social?.history) ? social.history : [];
    const inviteHtml = invites.length ? invites.map(_inviteCard).join('') : '<div class="social-card-sub">No pending invites in the duel inbox.</div>';
    const historyHtml = history.length ? history.slice(0, 4).map(_historyCard).join('') : '<div class="social-card-sub">No duel history yet.</div>';
    el.innerHTML = _panelHtml(
      'DUELS',
      'Start workout, cardio, or muscle duels with a cleaner competitive flow.',
      _duelComposer()
    ) +
    '<div class="social-card"><div class="social-card-title">PENDING INVITES</div><div class="social-card-sub">Quick accept or decline from the duel lane.</div><div class="social-feed-list">' + inviteHtml + '</div></div>' +
    '<div class="social-card"><div class="social-card-title">RECENT HISTORY</div><div class="social-card-sub">See how your rivalry lane has been moving.</div><div class="social-feed-list">' + historyHtml + '</div></div>';
  }

  function renderKpis() {
    const friends = byId('social-kpi-friends');
    const duel = byId('social-kpi-duel');
    const compare = byId('social-kpi-compare');
    if (friends) friends.textContent = String(_friendCount());
    if (duel) duel.textContent = _activeDuelLabel();
    if (compare) compare.textContent = _friendCount() > 0 ? 'LIVE' : 'READY';
  }

  function setTab(tab, btn) {
    state.currentTab = tab || 'hub';
    document.querySelectorAll('.social-tab-btn').forEach((node) => {
      node.classList.toggle('active', node.id === 'social-tab-' + state.currentTab);
    });
    document.querySelectorAll('.social-panel').forEach((panel) => {
      const on = panel.id === 'social-panel-' + state.currentTab;
      panel.classList.toggle('active', on);
      panel.style.display = on ? '' : 'none';
    });
    if (btn && btn.classList) btn.classList.add('active');
  }

  async function refreshDirectory() {
    if (!window.FORGE_DUELS || typeof window.FORGE_DUELS.listProfiles !== 'function') {
      state.profileDirectory = [];
      return;
    }
    state.profileDirectory = await window.FORGE_DUELS.listProfiles();
  }

  async function searchFriends() {
    const input = byId('social-friend-search');
    const q = String(input?.value || '').trim();
    if (!q || !window.FORGE_DUELS || typeof window.FORGE_DUELS.searchUsers !== 'function') {
      state.lastResults = [];
      renderFriends();
      return;
    }
    state.lastResults = await window.FORGE_DUELS.searchUsers(q);
    renderFriends();
  }

  function addFoundFriend(id) {
    const user = state.lastResults.find((row) => String(row.id) === String(id));
    if (!user || !window.FORGE_DUELS) return;
    window.FORGE_DUELS.addFriend(user.id, user.name || '', user.email || '');
    refresh();
  }

  function removeFriend(id) {
    if (!window.FORGE_DUELS) return;
    window.FORGE_DUELS.removeFriend(id);
    if (String(state.selectedFriendId) === String(id)) state.selectedFriendId = '';
    refresh();
  }

  async function copyFriendCode() {
    const code = window.FORGE_DUELS && typeof window.FORGE_DUELS.getFriendCode === 'function'
      ? window.FORGE_DUELS.getFriendCode()
      : '';
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      _maybeToast('Friend code copied', 'success');
    } catch (_e) {
      _maybeToast(code, 'warn');
    }
  }

  function selectFriend(id) {
    state.selectedFriendId = String(id || '');
    renderCompare();
    renderDuels();
  }

  function startDuel(id, mode) {
    const duelState = _duelState();
    const friends = Array.isArray(duelState?.friends) ? duelState.friends : [];
    const targetId = String(id || state.selectedFriendId || '');
    const friend = friends.find((f) => String(f.id) === targetId) || friends[0];
    if (!friend || !window.FORGE_DUELS) return;
    state.selectedFriendId = String(friend.id);
    if (mode === 'cardio') {
      window.FORGE_DUELS.challenge(friend.id, friend.name || '', friend.email || '', 'scope:cardio');
    } else if (mode === 'muscle') {
      window.FORGE_DUELS.challengeMuscle(friend.id, friend.name || '', friend.email || '');
    } else {
      window.FORGE_DUELS.challenge(friend.id, friend.name || '', friend.email || '', 'scope:workout');
    }
    refresh();
  }

  async function refresh() {
    const prev = state.lastUiSnapshot;
    await refreshDirectory();
    renderKpis();
    renderHub();
    renderFriends();
    renderCompare();
    renderDuels();
    setTab(state.currentTab);
    const nextSocial = _uiDuelState();
    state.lastUiSnapshot = {
      friendCount: _friendCount(),
      inviteCount: Array.isArray(nextSocial?.invites) ? nextSocial.invites.length : 0,
      historyCount: Array.isArray(nextSocial?.history) ? nextSocial.history.length : 0,
      activeId: nextSocial?.active?.id || ''
    };
    if (state.booted) _emitSocialSignals(prev, state.lastUiSnapshot);
  }

  function init() {
    if (state.booted) return;
    state.booted = true;
    refresh();
  }

  window.FORGE_SOCIAL = {
    init,
    open: function (tab, btn) {
      if (!state.booted) init();
      setTab(tab || 'hub', btn || null);
      refresh();
    },
    refresh,
    searchFriends,
    addFoundFriend,
    removeFriend,
    copyFriendCode,
    selectFriend,
    startDuel,
    getState: function () { return { ...state }; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('social-view')) init();
  });
})();
