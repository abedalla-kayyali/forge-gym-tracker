'use strict';

(function () {
  const state = {
    currentTab: 'hub',
    selectedFriendId: '',
    compareView: 'body',
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
  function _dayText(dateStr) {
    const ms = new Date(dateStr || 0).getTime();
    if (!Number.isFinite(ms) || !ms) return 'No log yet';
    const diff = Math.max(0, Math.floor((Date.now() - ms) / 86400000));
    if (diff === 0) return 'Today';
    if (diff === 1) return '1d ago';
    return diff + 'd ago';
  }
  function _fmtShortDate(dateStr) {
    if (!dateStr) return 'No log yet';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime()) || d.getTime() <= 0) return 'No log yet';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function _metricOrDash(v, unit) {
    const n = _num(v, NaN);
    if (!Number.isFinite(n) || n <= 0) return '—';
    return String(n) + (unit || '');
  }
  function _fmtMaybeDate(dateStr) {
    if (!dateStr) return 'No log yet';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime()) || d.getTime() <= 0) return 'No log yet';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  function _privacyEnabled() {
    return !window.FORGE_DUELS || typeof window.FORGE_DUELS.getSocialPrivacy !== 'function'
      ? true
      : window.FORGE_DUELS.getSocialPrivacy() !== false;
  }
  function _compareSubtabs() {
    const tabs = [
      ['body', 'Body'],
      ['cardio', 'Cardio'],
      ['bodyweight', 'Bodyweight'],
      ['overview', 'Overview']
    ];
    return '<div class="social-compare-subtabs">' + tabs.map((tab) => (
      '<button class="social-compare-subtab' + (state.compareView === tab[0] ? ' active' : '') + '" type="button" onclick=\'window.FORGE_SOCIAL.setCompareView("' + tab[0] + '")\'>' + tab[1] + '</button>'
    )).join('') + '</div>';
  }
  function _muscleZones() {
    return [
      { key: 'Neck', path: 'M124 30 Q140 22 156 30 L152 52 Q140 56 128 52 Z' },
      { key: 'Traps', path: 'M98 58 Q112 44 140 44 Q168 44 182 58 L176 84 Q154 90 140 90 Q126 90 104 84 Z' },
      { key: 'Chest', path: 'M96 92 Q114 80 140 80 Q166 80 184 92 L178 138 Q160 154 140 154 Q120 154 102 138 Z' },
      { key: 'Shoulders', path: 'M60 94 Q70 78 92 80 L96 136 Q78 138 62 126 Q52 112 60 94 Z' },
      { key: 'Shoulders', path: 'M220 94 Q210 78 188 80 L184 136 Q202 138 218 126 Q228 112 220 94 Z' },
      { key: 'Biceps', path: 'M62 136 Q76 132 88 142 L82 188 Q72 198 58 190 Q50 176 62 136 Z' },
      { key: 'Biceps', path: 'M218 136 Q204 132 192 142 L198 188 Q208 198 222 190 Q230 176 218 136 Z' },
      { key: 'Triceps', path: 'M54 190 Q68 182 80 188 L78 230 Q66 240 52 230 Q46 214 54 190 Z' },
      { key: 'Triceps', path: 'M226 190 Q212 182 200 188 L202 230 Q214 240 228 230 Q234 214 226 190 Z' },
      { key: 'Forearms', path: 'M48 230 Q60 224 72 230 L68 292 Q56 300 46 288 Q42 258 48 230 Z' },
      { key: 'Forearms', path: 'M232 230 Q220 224 208 230 L212 292 Q224 300 234 288 Q238 258 232 230 Z' },
      { key: 'Core', path: 'M110 152 Q124 146 140 146 Q156 146 170 152 L166 224 Q156 236 140 236 Q124 236 114 224 Z' },
      { key: 'Back', path: 'M96 92 Q114 84 140 84 Q166 84 184 92 L176 152 Q158 164 140 164 Q122 164 104 152 Z' },
      { key: 'Lower Back', path: 'M110 164 Q124 158 140 158 Q156 158 170 164 L166 210 Q154 220 140 220 Q126 220 114 210 Z' },
      { key: 'Glutes', path: 'M106 220 Q122 212 140 212 Q158 212 174 220 L170 258 Q158 270 140 270 Q122 270 110 258 Z' },
      { key: 'Legs', path: 'M110 260 Q124 252 132 260 L130 364 Q120 378 106 366 Q98 344 110 260 Z' },
      { key: 'Legs', path: 'M170 260 Q156 252 148 260 L150 364 Q160 378 174 366 Q182 344 170 260 Z' },
      { key: 'Calves', path: 'M108 364 Q118 356 126 364 L124 418 Q114 428 104 420 Q100 390 108 364 Z' },
      { key: 'Calves', path: 'M172 364 Q162 356 154 364 L156 418 Q166 428 176 420 Q180 390 172 364 Z' }
    ];
  }
  function _musclePower(summary, key) {
    const row = summary && summary[key] ? summary[key] : null;
    if (!row) return 0;
    const sessions = _num(row.sessions, 0);
    const maxWeight = _num(row.maxWeight, 0);
    return Math.max(Math.min(1, sessions / 8), Math.min(1, maxWeight / 120));
  }
  function _renderBodyMap(summary, who) {
    const zones = _muscleZones();
    const dominant = Object.keys(summary || {}).sort((a, b) => _musclePower(summary, b) - _musclePower(summary, a))[0] || '';
    return '' +
      '<div class="social-body-map-card social-anatomy-board">' +
        '<div class="social-body-map-label">' + who + '</div>' +
        '<svg class="social-body-map-svg" viewBox="0 0 280 430" role="img" aria-label="' + _escape(who + ' body map') + '">' +
          '<defs>' +
            '<linearGradient id="social-board-shell" x1="0" x2="0" y1="0" y2="1">' +
              '<stop offset="0%" stop-color="rgba(15,25,36,0.98)"/>' +
              '<stop offset="100%" stop-color="rgba(7,12,18,1)"/>' +
            '</linearGradient>' +
          '</defs>' +
          '<rect x="58" y="16" width="164" height="400" rx="38" fill="url(#social-board-shell)" stroke="rgba(159,230,255,0.14)" stroke-width="2"/>' +
          '<rect x="76" y="34" width="128" height="364" rx="30" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.06)"/>' +
          zones.map((zone) => {
            const power = _musclePower(summary, zone.key);
            const dominantGlow = zone.key === dominant ? 0.28 : 0;
            const fill = power <= 0 ? 'rgba(255,255,255,0.04)' : 'rgba(99,231,176,' + (0.16 + power * 0.34).toFixed(2) + ')';
            const stroke = power <= 0 ? 'rgba(255,255,255,0.10)' : 'rgba(159,230,255,' + (0.24 + power * 0.34 + dominantGlow).toFixed(2) + ')';
            return '<path class="social-body-zone" data-muscle="' + _escape(zone.key) + '" d="' + zone.path + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (zone.key === dominant ? '3' : '2') + '"/>';
          }).join('') +
        '</svg>' +
      '</div>';
  }
  function _spotlightMetrics(meSummary, friendSummary) {
    const keys = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Glutes', 'Calves', 'Biceps', 'Triceps', 'Forearms'];
    const rows = keys.map((key) => {
      const mine = meSummary?.[key] || {};
      const rival = friendSummary?.[key] || {};
      return {
        key,
        diff: (_num(mine.maxWeight, 0) + (_num(mine.sessions, 0) * 8)) - (_num(rival.maxWeight, 0) + (_num(rival.sessions, 0) * 8)),
        myMax: _num(mine.maxWeight, 0),
        myLast: mine.lastTrainedAt || '',
        rivalLast: rival.lastTrainedAt || ''
      };
    });
    const lead = rows.slice().sort((a, b) => b.diff - a.diff)[0];
    const trail = rows.slice().sort((a, b) => a.diff - b.diff)[0];
    const heavy = rows.slice().sort((a, b) => b.myMax - a.myMax)[0];
    const recent = rows.slice().sort((a, b) => new Date(b.myLast || 0).getTime() - new Date(a.myLast || 0).getTime())[0];
    return [
      { title: 'Strongest Lead', muscle: lead?.key || 'Chest', label: lead?.diff > 0 ? 'You lead' : 'Even' },
      { title: 'Biggest Gap', muscle: trail?.key || 'Legs', label: trail?.diff < 0 ? 'Rival leads' : 'Even' },
      { title: 'Heaviest Plate', muscle: heavy?.key || 'Chest', label: heavy?.myMax ? (heavy.myMax + ' kg') : 'No max yet' },
      { title: 'Most Recent', muscle: recent?.key || 'Core', label: _dayText(recent?.myLast || '') }
    ];
  }
  function _muscleInsight(meSummary, friendSummary) {
    const keys = ['Chest', 'Back', 'Shoulders', 'Legs', 'Core', 'Glutes', 'Calves', 'Biceps', 'Triceps', 'Forearms'];
    const scored = keys.map((key) => {
      const mine = meSummary?.[key] || {};
      const rival = friendSummary?.[key] || {};
      const myScore = _num(mine.maxWeight, 0) + (_num(mine.sessions, 0) * 8);
      const theirScore = _num(rival.maxWeight, 0) + (_num(rival.sessions, 0) * 8);
      return { key, diff: myScore - theirScore };
    });
    const lead = scored.slice().sort((a, b) => b.diff - a.diff)[0];
    const trail = scored.slice().sort((a, b) => a.diff - b.diff)[0];
    const parts = [];
    if (lead && lead.diff > 0) parts.push(lead.key + ': You lead');
    if (trail && trail.diff < 0) parts.push(trail.key + ': Rival leads');
    return parts.length ? parts.join(' | ') : 'Even body-map rivalry right now.';
  }
  function _buildMuscleExerciseRows(muscle, meSummary, friendSummary) {
    const mine = meSummary?.[muscle] || {};
    const rival = friendSummary?.[muscle] || {};
    const names = Array.from(new Set(Object.keys(mine).concat(Object.keys(rival))));
    return names.map((name) => {
      const myRow = mine?.[name] || {};
      const rivalRow = rival?.[name] || {};
      const myWeight = _num(myRow.maxWeight, 0);
      const rivalWeight = _num(rivalRow.maxWeight, 0);
      const myLast = new Date(myRow.lastAt || 0).getTime();
      const rivalLast = new Date(rivalRow.lastAt || 0).getTime();
      const lead = myWeight === rivalWeight
        ? (myLast === rivalLast ? 'EVEN' : myLast > rivalLast ? 'YOU' : 'RIVAL')
        : myWeight > rivalWeight ? 'YOU' : 'RIVAL';
      const gap = Math.abs(myWeight - rivalWeight);
      return {
        name,
        myRow,
        rivalRow,
        myWeight,
        rivalWeight,
        lead,
        gap,
        recentBias: Math.max(myLast, rivalLast)
      };
    }).filter((row) => _num(row.myRow.sessions, 0) > 0 || _num(row.rivalRow.sessions, 0) > 0)
      .sort((a, b) => (b.gap - a.gap) || (b.recentBias - a.recentBias))
      .slice(0, 6);
  }
  function _renderMuscleExerciseLeaderboard(muscle, meSummary, friendSummary) {
    const rows = _buildMuscleExerciseRows(muscle, meSummary, friendSummary);
    if (!rows.length) {
      return '<div class="social-card" style="margin-top:12px;"><div class="social-card-title">EXERCISE LEADERBOARD</div><div class="social-card-sub">No weighted exercise records published for this muscle yet.</div></div>';
    }
    return '<div class="social-card social-muscle-exercise-list" style="margin-top:12px;">' +
      '<div class="social-card-title">EXERCISE LEADERBOARD</div>' +
      '<div class="social-card-sub">Top lifts for this muscle, sorted by the biggest max-weight gap.</div>' +
      '<div class="social-rivalry-list">' + rows.map((row) => {
        const tip = row.lead === 'YOU'
          ? 'Protect this lane by touching it again this week.'
          : row.lead === 'RIVAL'
            ? 'One focused session can start closing this gap.'
            : 'Next strong session decides this exercise.';
        return '<div class="social-rivalry-row">' +
          '<div class="social-rivalry-main"><strong>' + _escape(row.name) + '</strong><span>' + _escape(row.lead === 'YOU' ? 'You lead' : row.lead === 'RIVAL' ? 'Rival leads' : 'Even') + '</span></div>' +
          '<div class="social-rivalry-metrics"><b>' + _escape(_metricOrDash(row.myWeight, 'kg')) + '</b><span>vs</span><b>' + _escape(_metricOrDash(row.rivalWeight, 'kg')) + '</b></div>' +
          '<div class="social-card-sub">Last: ' + _escape(_dayText(row.myRow.lastAt)) + ' vs ' + _escape(_dayText(row.rivalRow.lastAt)) + ' | Sessions: ' + _num(row.myRow.sessions, 0) + ' vs ' + _num(row.rivalRow.sessions, 0) + '<br>' + _escape(tip) + '</div>' +
        '</div>';
      }).join('') + '</div></div>';
  }

  function _localSummary() {
    const profile = window.userProfile || {};
    const own = window.FORGE_DUELS && typeof window.FORGE_DUELS.buildOwnCompareStats === 'function'
      ? window.FORGE_DUELS.buildOwnCompareStats()
      : {};
    return {
      name: (profile.name || profile.displayName) || 'You',
      workout7d: _num(own.workout7d, 0),
      cardio7d: _num(own.cardio7d, 0),
      volume7d: _num(own.volume7d, 0),
      streak: _num(own.streak, 0),
      readiness: _num(own.readiness, 0),
      balance: _num(own.balanceScore, 0),
      xp: _num(own.xp, 0),
      rank: own.rank || '',
      strongestArea: own.strongestArea || '',
      muscleSummary: own.muscleSummary || {},
      muscleExerciseSummary: own.muscleExerciseSummary || {},
      cardioSummary: own.cardioSummary || {},
      bodyweightSummary: own.bodyweightSummary || {},
      bodyweightExerciseSummary: own.bodyweightExerciseSummary || {},
      cardioActivitySummary: own.cardioActivitySummary || {},
      shared: true
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
      shared: stats.shared !== false,
      workout7d: _num(stats.workout7d, 0),
      cardio7d: _num(stats.cardio7d, 0),
      volume7d: _num(stats.volume7d, 0),
      streak: _num(stats.streak, 0),
      readiness: _num(stats.readiness, 0),
      balance: _num(stats.balanceScore, 0),
      xp: _num(stats.xp, 0),
      rank: stats.rank || '',
      strongestArea: stats.strongestArea || '',
      muscleSummary: stats.muscleSummary || {},
      muscleExerciseSummary: stats.muscleExerciseSummary || {},
      cardioSummary: stats.cardioSummary || {},
      bodyweightSummary: stats.bodyweightSummary || {},
      bodyweightExerciseSummary: stats.bodyweightExerciseSummary || {},
      cardioActivitySummary: stats.cardioActivitySummary || {}
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
    const privacyOn = _privacyEnabled();
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
      '<div class="social-card"><div class="social-card-title">INVITE RAIL</div><div class="social-card-sub">Respond fast to keep the social loop active.</div><div class="social-feed-list">' + inviteRail + '</div></div>' +
      '<div class="social-card social-privacy-card">' +
        '<div class="social-card-title">PRIVACY</div>' +
        '<div class="social-card-sub">Control whether friends can compare your body map, cardio, and bodyweight summaries.</div>' +
        '<div class="social-privacy-row">' +
          '<div class="social-privacy-copy"><strong>' + (privacyOn ? 'Sharing is on' : 'Sharing is off') + '</strong><span>' + (privacyOn ? 'Friends can view your aggregated compare stats.' : 'Friends can still add and duel you, but compare stats stay hidden.') + '</span></div>' +
          '<button class="social-action-btn' + (privacyOn ? ' primary' : '') + '" type="button" onclick="window.FORGE_SOCIAL.toggleShareStats()">' + (privacyOn ? 'Turn Off' : 'Turn On') + '</button>' +
        '</div>' +
      '</div>';
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

  function _compareHidden(friend) {
    return '' +
      _panelHtml(
        'COMPARE',
        'This athlete has hidden compare stats from friends.',
        _compareSubtabs()
      ) +
      '<div class="social-card"><div class="social-card-title">STATS HIDDEN</div><div class="social-card-sub">You can still keep this friend and challenge them to duels, but their body map and compare summaries are private.</div></div>';
  }

  function _renderCompareOverview(me, friend) {
    const compareMeta = '' +
      '<div class="social-empty-grid">' +
        '<div class="social-card"><div class="social-card-title">RANK</div><div class="social-card-sub">You: ' + _escape(me.rank || 'Unranked') + ' | Rival: ' + _escape(friend.rank || 'Unranked') + '</div></div>' +
        '<div class="social-card"><div class="social-card-title">STRONGEST AREA</div><div class="social-card-sub">You: ' + _escape(me.strongestArea || 'N/A') + ' | Rival: ' + _escape(friend.strongestArea || 'N/A') + '</div></div>' +
      '</div>';
    return compareMeta +
      '<div class="social-compare-grid">' +
        _compareMetric('Weekly Sessions', me.workout7d, friend.workout7d, '') +
        _compareMetric('Cardio 7d', me.cardio7d, friend.cardio7d, '') +
        _compareMetric('Volume 7d', me.volume7d, friend.volume7d, 'kg') +
        _compareMetric('Streak', me.streak, friend.streak, 'd') +
        _compareMetric('Readiness', me.readiness, friend.readiness, '') +
        _compareMetric('Balance', me.balance, friend.balance, '') +
      '</div>';
  }

  function _renderCompareBody(me, friend) {
    const spots = _spotlightMetrics(me.muscleSummary, friend.muscleSummary);
    return '' +
      '<div class="social-card social-body-rival-header">' +
        '<div class="social-card-title">RIVALRY HEAT</div>' +
        '<div class="social-card-sub">Most contested: ' + _escape((spots[0] && spots[0].muscle) || 'Chest') + ' | ' + _escape(_muscleInsight(me.muscleSummary, friend.muscleSummary)) + '</div>' +
      '</div>' +
      '<div class="social-card">' +
        '<div class="social-card-title">BODY MAP RIVALRY</div>' +
        '<div class="social-card-sub">Tap any muscle to compare max load, session count, and training recency.</div>' +
        '<div class="social-body-map-grid">' +
          _renderBodyMap(me.muscleSummary, 'You') +
          _renderBodyMap(friend.muscleSummary, 'Rival') +
        '</div>' +
        '<div class="social-body-summary">' + _escape(_muscleInsight(me.muscleSummary, friend.muscleSummary)) + '</div>' +
        '<div class="social-spotlight-rail">' +
          spots.map((spot) => (
            '<button class="social-spotlight-chip" type="button" onclick=\'window.FORGE_SOCIAL.openMuscleCompare("' + _escape(spot.muscle) + '")\'>' +
              '<span>' + _escape(spot.title) + '</span>' +
              '<strong>' + _escape(spot.muscle) + '</strong>' +
              '<em>' + _escape(spot.label) + '</em>' +
            '</button>'
          )).join('') +
        '</div>' +
      '</div>';
  }

  function _renderCompareCardio(me, friend) {
    const my = me.cardioSummary || {};
    const rival = friend.cardioSummary || {};
    const myHas = _num(my.sessions7d, 0) > 0 || _num(my.minutes7d, 0) > 0 || _num(my.distance7d, 0) > 0;
    const rivalHas = _num(rival.sessions7d, 0) > 0 || _num(rival.minutes7d, 0) > 0 || _num(rival.distance7d, 0) > 0;
    const verdict = (!myHas && !rivalHas)
      ? 'No cardio compare data yet.'
      : _num(my.minutes7d, 0) === _num(rival.minutes7d, 0)
      ? 'Cardio rivalry is even.'
      : _num(my.minutes7d, 0) > _num(rival.minutes7d, 0)
        ? 'You lead cardio volume.'
        : 'Rival leads cardio volume.';
    return '' +
      '<div class="social-card"><div class="social-card-title">CARDIO COMPARE</div><div class="social-card-sub">' + verdict + '</div></div>' +
      '<div class="social-compare-grid">' +
        _compareMetric('Sessions 7d', my.sessions7d, rival.sessions7d, '') +
        _compareMetric('Minutes 7d', my.minutes7d, rival.minutes7d, 'm') +
        _compareMetric('Distance 7d', my.distance7d, rival.distance7d, 'km') +
        _compareMetric('Activity Pulse', myHas ? 1 : 0, rivalHas ? 1 : 0, '') +
      '</div>' +
      '<div class="social-empty-grid">' +
        '<div class="social-card"><div class="social-card-title">YOUR CARDIO SNAPSHOT</div><div class="social-card-sub">' + _escape(my.topMode || 'No cardio logged') + ' | Last: ' + _escape(_fmtShortDate(my.lastCardioAt)) + '<br>Minutes: ' + _escape(_metricOrDash(my.minutes7d, 'm')) + ' | Distance: ' + _escape(_metricOrDash(my.distance7d, 'km')) + '</div></div>' +
        '<div class="social-card"><div class="social-card-title">RIVAL CARDIO SNAPSHOT</div><div class="social-card-sub">' + _escape(rival.topMode || 'No cardio logged') + ' | Last: ' + _escape(_fmtShortDate(rival.lastCardioAt)) + '<br>Minutes: ' + _escape(_metricOrDash(rival.minutes7d, 'm')) + ' | Distance: ' + _escape(_metricOrDash(rival.distance7d, 'km')) + '</div></div>' +
      '</div>' +
      _renderCardioRivalries(me.cardioActivitySummary || {}, friend.cardioActivitySummary || {});
  }

  function _renderCompareBodyweight(me, friend) {
    const my = me.bodyweightSummary || {};
    const rival = friend.bodyweightSummary || {};
    const myHas = _num(my.sessions7d, 0) > 0 || _num(my.skillsDone, 0) > 0 || _num(my.bestReps, 0) > 0 || _num(my.bestDurationSec, 0) > 0;
    const rivalHas = _num(rival.sessions7d, 0) > 0 || _num(rival.skillsDone, 0) > 0 || _num(rival.bestReps, 0) > 0 || _num(rival.bestDurationSec, 0) > 0;
    const verdict = (!myHas && !rivalHas)
      ? 'No bodyweight compare data yet.'
      : _num(my.skillsDone, 0) === _num(rival.skillsDone, 0)
      ? 'Bodyweight skill output is even.'
      : _num(my.skillsDone, 0) > _num(rival.skillsDone, 0)
        ? 'You lead on bodyweight skill variety.'
        : 'Rival leads on bodyweight skill variety.';
    return '' +
      '<div class="social-card"><div class="social-card-title">BODYWEIGHT COMPARE</div><div class="social-card-sub">' + verdict + '</div></div>' +
      '<div class="social-compare-grid">' +
        _compareMetric('Sessions 7d', my.sessions7d, rival.sessions7d, '') +
        _compareMetric('Skills Done', my.skillsDone, rival.skillsDone, '') +
        _compareMetric('Best Reps', my.bestReps, rival.bestReps, '') +
        _compareMetric('Best Hold', my.bestDurationSec, rival.bestDurationSec, 's') +
      '</div>' +
      '<div class="social-empty-grid">' +
        '<div class="social-card"><div class="social-card-title">YOUR BODYWEIGHT SNAPSHOT</div><div class="social-card-sub">Last: ' + _escape(_fmtShortDate(my.lastBodyweightAt)) + '<br>Best reps: ' + _escape(_metricOrDash(my.bestReps, '')) + ' | Hold: ' + _escape(_metricOrDash(my.bestDurationSec, 's')) + '</div></div>' +
        '<div class="social-card"><div class="social-card-title">RIVAL BODYWEIGHT SNAPSHOT</div><div class="social-card-sub">Last: ' + _escape(_fmtShortDate(rival.lastBodyweightAt)) + '<br>Best reps: ' + _escape(_metricOrDash(rival.bestReps, '')) + ' | Hold: ' + _escape(_metricOrDash(rival.bestDurationSec, 's')) + '</div></div>' +
      '</div>' +
      _renderBodyweightRivalries(me.bodyweightExerciseSummary || {}, friend.bodyweightExerciseSummary || {});
  }
  function _bodyweightRivalRows(meSummary, friendSummary) {
    const keys = Array.from(new Set(Object.keys(meSummary || {}).concat(Object.keys(friendSummary || {}))));
    return keys.map((key) => {
      const mine = meSummary?.[key] || {};
      const rival = friendSummary?.[key] || {};
      const myScore = Math.max(_num(mine.maxReps, 0), _num(mine.maxDurationSec, 0) / 10);
      const rivalScore = Math.max(_num(rival.maxReps, 0), _num(rival.maxDurationSec, 0) / 10);
      return {
        key,
        label: mine.exercise || rival.exercise || key,
        my: mine,
        rival,
        lead: myScore === rivalScore ? 'EVEN' : myScore > rivalScore ? 'YOU' : 'RIVAL',
        gap: Math.abs(myScore - rivalScore)
      };
    }).filter((row) => _num(row.my.sessions, 0) > 0 || _num(row.rival.sessions, 0) > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 8);
  }
  function _cardioRivalRows(meSummary, friendSummary) {
    const keys = Array.from(new Set(Object.keys(meSummary || {}).concat(Object.keys(friendSummary || {}))));
    return keys.map((key) => {
      const mine = meSummary?.[key] || {};
      const rival = friendSummary?.[key] || {};
      const myScore = _num(mine.bestMinutes, 0) + (_num(mine.bestDistanceKm, 0) * 10) + _num(mine.weeklyMinutes, 0);
      const rivalScore = _num(rival.bestMinutes, 0) + (_num(rival.bestDistanceKm, 0) * 10) + _num(rival.weeklyMinutes, 0);
      return {
        key,
        label: mine.activity || rival.activity || key,
        my: mine,
        rival,
        lead: myScore === rivalScore ? 'EVEN' : myScore > rivalScore ? 'YOU' : 'RIVAL',
        gap: Math.abs(myScore - rivalScore)
      };
    }).filter((row) => _num(row.my.sessions, 0) > 0 || _num(row.rival.sessions, 0) > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 8);
  }
  function _renderBodyweightRivalries(meSummary, friendSummary) {
    const rows = _bodyweightRivalRows(meSummary, friendSummary);
    if (!rows.length) {
      return '<div class="social-card"><div class="social-card-title">EXERCISE RIVALRY</div><div class="social-card-sub">No bodyweight exercise rivalry data yet. Log pull-ups, holds, or skills to start the battle board.</div></div>';
    }
    return '<div class="social-card">' +
      '<div class="social-card-title">EXERCISE RIVALRY</div>' +
      '<div class="social-card-sub">Compare max reps and hold times exercise by exercise.</div>' +
      '<div class="social-rivalry-list">' + rows.map((row) => (
        '<button class="social-rivalry-row" type="button" onclick=\'window.FORGE_SOCIAL.openBodyweightRivalry(' + JSON.stringify(row.key) + ')\'>' +
          '<div class="social-rivalry-main"><strong>' + _escape(row.label) + '</strong><span>' + _escape(row.lead === 'YOU' ? 'You lead' : row.lead === 'RIVAL' ? 'Rival leads' : 'Even') + '</span></div>' +
          '<div class="social-rivalry-metrics"><b>' + _escape(_metricOrDash(row.my.maxReps, ' reps')) + ' / ' + _escape(_metricOrDash(row.my.maxDurationSec, 's')) + '</b><span>vs</span><b>' + _escape(_metricOrDash(row.rival.maxReps, ' reps')) + ' / ' + _escape(_metricOrDash(row.rival.maxDurationSec, 's')) + '</b></div>' +
        '</button>'
      )).join('') + '</div></div>';
  }
  function _renderCardioRivalries(meSummary, friendSummary) {
    const rows = _cardioRivalRows(meSummary, friendSummary);
    if (!rows.length) {
      return '<div class="social-card"><div class="social-card-title">ACTIVITY RIVALRY</div><div class="social-card-sub">No cardio rivalry data yet. Log runs, rides, or walks to light up the leaderboard.</div></div>';
    }
    return '<div class="social-card">' +
      '<div class="social-card-title">ACTIVITY RIVALRY</div>' +
      '<div class="social-card-sub">Compare best single sessions and weekly totals by activity.</div>' +
      '<div class="social-rivalry-list">' + rows.map((row) => (
        '<button class="social-rivalry-row" type="button" onclick=\'window.FORGE_SOCIAL.openCardioRivalry(' + JSON.stringify(row.key) + ')\'>' +
          '<div class="social-rivalry-main"><strong>' + _escape(row.label) + '</strong><span>' + _escape(row.lead === 'YOU' ? 'You lead' : row.lead === 'RIVAL' ? 'Rival leads' : 'Even') + '</span></div>' +
          '<div class="social-rivalry-metrics"><b>' + _escape(_metricOrDash(row.my.bestMinutes, 'm')) + ' / ' + _escape(_metricOrDash(row.my.bestDistanceKm, 'km')) + '</b><span>vs</span><b>' + _escape(_metricOrDash(row.rival.bestMinutes, 'm')) + ' / ' + _escape(_metricOrDash(row.rival.bestDistanceKm, 'km')) + '</b></div>' +
        '</button>'
      )).join('') + '</div></div>';
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
        _compareSubtabs() + '<div class="social-empty-grid">' +
          '<div class="social-card"><div class="social-card-title">NO RIVAL YET</div><div class="social-card-sub">Add a friend first, then compare sessions, cardio, streak, and balance.</div></div>' +
          '<div class="social-card"><div class="social-card-title">NEXT MOVE</div><div class="social-card-sub">Search a rival from Friends to unlock compare cards.</div></div>' +
        '</div>'
      );
      return;
    }
    state.selectedFriendId = String(selected.id);
    const me = _localSummary();
    const friend = _friendCompareSummary(selected.id);
    if (!friend.shared) {
      el.innerHTML = _compareHidden(friend);
      return;
    }
    let body = _renderCompareBody(me, friend);
    if (state.compareView === 'overview') body = _renderCompareOverview(me, friend);
    else if (state.compareView === 'cardio') body = _renderCompareCardio(me, friend);
    else if (state.compareView === 'bodyweight') body = _renderCompareBodyweight(me, friend);
    el.innerHTML = '' +
      _panelHtml(
        'COMPARE',
        _leadCopy(me, friend),
        _compareSubtabs() +
        '<div class="social-compare-head">' +
          '<div class="social-compare-side"><span>YOU</span><strong>' + _escape(me.name) + '</strong></div>' +
          '<div class="social-compare-vs">VS</div>' +
          '<div class="social-compare-side"><span>RIVAL</span><strong>' + _escape(friend.name) + '</strong></div>' +
        '</div>'
      ) + body;
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
  function setCompareView(view) {
    state.compareView = String(view || 'body');
    renderCompare();
    _bindBodyCompareZones();
  }
  function _bindBodyCompareZones() {
    document.querySelectorAll('.social-body-zone').forEach((node) => {
      node.onclick = function () { openMuscleCompare(node.getAttribute('data-muscle')); };
    });
  }
  function openMuscleCompare(muscle) {
    const modal = byId('social-compare-muscle-modal');
    const title = byId('social-compare-muscle-title');
    const sub = byId('social-compare-muscle-sub');
    const body = byId('social-compare-muscle-body');
    const s = _duelState();
    const friends = Array.isArray(s?.friends) ? s.friends : [];
    const selected = friends.find((f) => String(f.id) === String(state.selectedFriendId)) || friends[0] || null;
    if (!modal || !selected) return;
    const me = _localSummary();
    const friend = _friendCompareSummary(selected.id);
    const myRow = me.muscleSummary?.[muscle] || {};
    const rivalRow = friend.muscleSummary?.[muscle] || {};
    const myWeight = _num(myRow.maxWeight, 0);
    const rivalWeight = _num(rivalRow.maxWeight, 0);
    const lead = myWeight === rivalWeight
      ? (_num(myRow.sessions, 0) === _num(rivalRow.sessions, 0) ? 'Even rivalry' : _num(myRow.sessions, 0) > _num(rivalRow.sessions, 0) ? 'You lead consistency' : 'Rival leads consistency')
      : myWeight > rivalWeight ? 'You lead max load' : 'Rival leads max load';
    const verdict = myWeight === rivalWeight
      ? (_num(myRow.sessions, 0) === _num(rivalRow.sessions, 0) ? (muscle + ' is contested') : _num(myRow.sessions, 0) > _num(rivalRow.sessions, 0) ? ('You own ' + muscle + ' consistency') : ('Rival owns ' + muscle + ' consistency'))
      : myWeight > rivalWeight ? ('You own ' + muscle + ' power') : ('Rival owns ' + muscle + ' power');
    if (title) title.textContent = muscle || 'Muscle';
    if (sub) sub.textContent = verdict;
    if (body) {
      body.innerHTML = '' +
        '<div class="social-empty-grid">' +
          '<div class="social-card"><div class="social-card-title">YOU</div><div class="social-card-sub">Max: ' + _escape(myWeight ? (myWeight + ' kg') : 'No weighted max') + '<br>Sessions: ' + _num(myRow.sessions, 0) + '<br>Last: ' + _escape(_dayText(myRow.lastTrainedAt)) + '</div></div>' +
          '<div class="social-card"><div class="social-card-title">RIVAL</div><div class="social-card-sub">Max: ' + _escape(rivalWeight ? (rivalWeight + ' kg') : 'No weighted max') + '<br>Sessions: ' + _num(rivalRow.sessions, 0) + '<br>Last: ' + _escape(_dayText(rivalRow.lastTrainedAt)) + '</div></div>' +
        '</div>' +
        '<div class="social-card" style="margin-top:12px;"><div class="social-card-title">MUSCLE VERDICT</div><div class="social-card-sub">' + _escape(lead) + '</div></div>' +
        _renderMuscleExerciseLeaderboard(muscle, me.muscleExerciseSummary || {}, friend.muscleExerciseSummary || {}) +
        '<div class="social-card" style="margin-top:12px;"><div class="social-card-title">CATCH-UP TIP</div><div class="social-card-sub">' +
          _escape(
            myWeight < rivalWeight
              ? ('Add 2 focused ' + muscle + ' sessions this week to close the load gap.')
              : ('Keep ' + muscle + ' frequency high to protect your lead.')
          ) +
        '</div></div>';
    }
    modal.style.display = 'flex';
  }
  function closeMuscleCompare() {
    const modal = byId('social-compare-muscle-modal');
    if (modal) modal.style.display = 'none';
  }
  function _openRivalryDetail(kind, key) {
    const modal = byId('social-rivalry-modal');
    const title = byId('social-rivalry-title');
    const sub = byId('social-rivalry-sub');
    const body = byId('social-rivalry-body');
    const s = _duelState();
    const friends = Array.isArray(s?.friends) ? s.friends : [];
    const selected = friends.find((f) => String(f.id) === String(state.selectedFriendId)) || friends[0] || null;
    if (!modal || !selected) return;
    const me = _localSummary();
    const friend = _friendCompareSummary(selected.id);
    if (kind === 'cardio') {
      const mine = me.cardioActivitySummary?.[key] || {};
      const rival = friend.cardioActivitySummary?.[key] || {};
      const label = mine.activity || rival.activity || key || 'Cardio';
      const lead = (_num(mine.bestMinutes, 0) + _num(mine.bestDistanceKm, 0)) === (_num(rival.bestMinutes, 0) + _num(rival.bestDistanceKm, 0))
        ? 'Even cardio rivalry'
        : (_num(mine.bestMinutes, 0) + _num(mine.bestDistanceKm, 0)) > (_num(rival.bestMinutes, 0) + _num(rival.bestDistanceKm, 0))
          ? 'You lead this activity'
          : 'Rival leads this activity';
      if (title) title.textContent = label;
      if (sub) sub.textContent = lead;
      if (body) {
        body.innerHTML = '' +
          '<div class="social-empty-grid">' +
            '<div class="social-card"><div class="social-card-title">YOU</div><div class="social-card-sub">Best minutes: ' + _escape(_metricOrDash(mine.bestMinutes, 'm')) + '<br>Best distance: ' + _escape(_metricOrDash(mine.bestDistanceKm, 'km')) + '<br>Weekly total: ' + _escape(_metricOrDash(mine.weeklyMinutes, 'm')) + ' / ' + _escape(_metricOrDash(mine.weeklyDistanceKm, 'km')) + '<br>Last: ' + _escape(_fmtMaybeDate(mine.lastAt)) + '</div></div>' +
            '<div class="social-card"><div class="social-card-title">RIVAL</div><div class="social-card-sub">Best minutes: ' + _escape(_metricOrDash(rival.bestMinutes, 'm')) + '<br>Best distance: ' + _escape(_metricOrDash(rival.bestDistanceKm, 'km')) + '<br>Weekly total: ' + _escape(_metricOrDash(rival.weeklyMinutes, 'm')) + ' / ' + _escape(_metricOrDash(rival.weeklyDistanceKm, 'km')) + '<br>Last: ' + _escape(_fmtMaybeDate(rival.lastAt)) + '</div></div>' +
          '</div>' +
          '<div class="social-card" style="margin-top:12px;"><div class="social-card-title">CHASE TIP</div><div class="social-card-sub">' +
            _escape(_num(mine.bestMinutes, 0) >= _num(rival.bestMinutes, 0)
              ? 'Protect your lead with one more strong session this week.'
              : 'Beat the rival by adding one longer session or one farther effort this week.') +
          '</div></div>';
      }
    } else {
      const mine = me.bodyweightExerciseSummary?.[key] || {};
      const rival = friend.bodyweightExerciseSummary?.[key] || {};
      const label = mine.exercise || rival.exercise || key || 'Bodyweight';
      const lead = Math.max(_num(mine.maxReps, 0), _num(mine.maxDurationSec, 0)) === Math.max(_num(rival.maxReps, 0), _num(rival.maxDurationSec, 0))
        ? 'Even bodyweight rivalry'
        : Math.max(_num(mine.maxReps, 0), _num(mine.maxDurationSec, 0)) > Math.max(_num(rival.maxReps, 0), _num(rival.maxDurationSec, 0))
          ? 'You lead this exercise'
          : 'Rival leads this exercise';
      if (title) title.textContent = label;
      if (sub) sub.textContent = lead;
      if (body) {
        body.innerHTML = '' +
          '<div class="social-empty-grid">' +
            '<div class="social-card"><div class="social-card-title">YOU</div><div class="social-card-sub">Max reps: ' + _escape(_metricOrDash(mine.maxReps, '')) + '<br>Best hold: ' + _escape(_metricOrDash(mine.maxDurationSec, 's')) + '<br>Sessions: ' + _num(mine.sessions, 0) + '<br>Last: ' + _escape(_fmtMaybeDate(mine.lastAt)) + '</div></div>' +
            '<div class="social-card"><div class="social-card-title">RIVAL</div><div class="social-card-sub">Max reps: ' + _escape(_metricOrDash(rival.maxReps, '')) + '<br>Best hold: ' + _escape(_metricOrDash(rival.maxDurationSec, 's')) + '<br>Sessions: ' + _num(rival.sessions, 0) + '<br>Last: ' + _escape(_fmtMaybeDate(rival.lastAt)) + '</div></div>' +
          '</div>' +
          '<div class="social-card" style="margin-top:12px;"><div class="social-card-title">CHASE TIP</div><div class="social-card-sub">' +
            _escape(_num(mine.maxReps, 0) >= _num(rival.maxReps, 0) && _num(mine.maxDurationSec, 0) >= _num(rival.maxDurationSec, 0)
              ? 'Hold your lead by repeating this skill again this week.'
              : 'Close the gap with one focused practice block and a max-effort set this week.') +
          '</div></div>';
      }
    }
    modal.style.display = 'flex';
  }
  function openCardioRivalry(key) {
    _openRivalryDetail('cardio', key);
  }
  function openBodyweightRivalry(key) {
    _openRivalryDetail('bodyweight', key);
  }
  function closeRivalryDetail() {
    const modal = byId('social-rivalry-modal');
    if (modal) modal.style.display = 'none';
  }
  async function toggleShareStats() {
    if (!window.FORGE_DUELS || typeof window.FORGE_DUELS.setSocialPrivacy !== 'function') return;
    const next = await window.FORGE_DUELS.setSocialPrivacy(!_privacyEnabled());
    _maybeToast(next ? 'Friend compare sharing enabled' : 'Friend compare sharing disabled', 'success');
    await refresh();
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
    _bindBodyCompareZones();
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
    setCompareView,
    toggleShareStats,
    openMuscleCompare,
    closeMuscleCompare,
    openCardioRivalry,
    openBodyweightRivalry,
    closeRivalryDetail,
    startDuel,
    getState: function () { return { ...state }; }
  };

  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('social-view')) init();
  });
})();
