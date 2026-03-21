(function initGoogleDriveBackup(global) {
  'use strict';

  const CFG = global.FORGE_CONFIG || {};
  const CLIENT_ID = CFG.GOOGLE_DRIVE_CLIENT_ID || '';
  const FILE_NAME = CFG.GOOGLE_DRIVE_BACKUP_FILE || 'FORGE_backup_latest.json';
  const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

  const LS = Object.freeze({
    ENABLED: 'forge_gdrive_backup_enabled',
    EMAIL: 'forge_gdrive_backup_email',
    FILE_ID: 'forge_gdrive_backup_file_id',
    LAST_BACKUP_TS: 'forge_gdrive_backup_last_ts',
    LAST_AUTO_DAY: 'forge_gdrive_backup_last_day',
    LAST_AUTO_SAVE_TS: 'forge_gdrive_backup_last_save_ts'
  });

  const AUTO_SAVE_THROTTLE_MS = 15 * 60 * 1000;
  const AUTO_POLL_MS = 60 * 60 * 1000;

  let _tokenClient = null;
  let _token = '';
  let _tokenExpiryMs = 0;
  let _autoInFlight = false;

  function _toast(msg, type) {
    if (typeof global.showToast === 'function') global.showToast(msg, type);
  }

  function _lsGet(key) {
    try { return localStorage.getItem(key); } catch (_e) { return null; }
  }

  function _lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_e) {}
  }

  function _lsDel(key) {
    try { localStorage.removeItem(key); } catch (_e) {}
  }

  function _isEnabled() {
    return _lsGet(LS.ENABLED) === '1';
  }

  function _setEnabled(v) {
    _lsSet(LS.ENABLED, v ? '1' : '0');
    _renderStatus();
  }

  function _configured() {
    return !!CLIENT_ID;
  }

  function _todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function _ensureTokenClient() {
    if (_tokenClient) return _tokenClient;
    if (!global.google || !google.accounts || !google.accounts.oauth2) {
      throw new Error('Google Identity SDK not loaded');
    }
    _tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPE,
      callback: () => {}
    });
    return _tokenClient;
  }

  function _ensureAccessToken(interactive) {
    if (!_configured()) return Promise.reject(new Error('Google Drive is not configured'));
    if (_token && Date.now() < (_tokenExpiryMs - 60 * 1000)) return Promise.resolve(_token);
    const client = _ensureTokenClient();
    return new Promise((resolve, reject) => {
      client.callback = (resp) => {
        if (!resp || resp.error || !resp.access_token) {
          reject(new Error(resp?.error || 'Failed to authorize Google Drive'));
          return;
        }
        _token = resp.access_token;
        const expiresIn = Number(resp.expires_in || 0);
        _tokenExpiryMs = Date.now() + (expiresIn > 0 ? expiresIn * 1000 : 30 * 60 * 1000);
        resolve(_token);
      };
      client.requestAccessToken({ prompt: interactive ? 'consent' : '' });
    });
  }

  async function _authedFetch(url, options, interactive) {
    const token = await _ensureAccessToken(!!interactive);
    const opts = options || {};
    const headers = Object.assign({}, opts.headers || {}, { Authorization: 'Bearer ' + token });
    const res = await fetch(url, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      let body = '';
      try { body = await res.text(); } catch (_e) {}
      throw new Error('Google Drive API error ' + res.status + (body ? ': ' + body.slice(0, 300) : ''));
    }
    return res;
  }

  async function _fetchGoogleEmail() {
    try {
      const res = await _authedFetch('https://www.googleapis.com/oauth2/v3/userinfo', {}, true);
      const info = await res.json();
      if (info && info.email) _lsSet(LS.EMAIL, info.email);
    } catch (_e) {
      // Optional metadata; ignore.
    }
  }

  async function _findBackupFile(interactive) {
    const q = encodeURIComponent("name='" + FILE_NAME + "' and 'appDataFolder' in parents and trashed=false");
    const url =
      'https://www.googleapis.com/drive/v3/files' +
      '?spaces=appDataFolder' +
      '&pageSize=1' +
      '&orderBy=modifiedTime desc' +
      '&fields=files(id,name,modifiedTime)' +
      '&q=' + q;
    const res = await _authedFetch(url, {}, interactive);
    const data = await res.json();
    const file = Array.isArray(data.files) && data.files.length ? data.files[0] : null;
    if (file && file.id) _lsSet(LS.FILE_ID, file.id);
    return file;
  }

  function _buildMultipartBody(metadata, content, boundary) {
    return (
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) + '\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      content + '\r\n' +
      '--' + boundary + '--'
    );
  }

  async function _uploadPayload(payload, interactive, silent) {
    if (!payload || typeof payload !== 'object') throw new Error('Invalid backup payload');
    const existing = await _findBackupFile(interactive);
    const metadata = existing
      ? { name: FILE_NAME, mimeType: 'application/json' }
      : { name: FILE_NAME, mimeType: 'application/json', parents: ['appDataFolder'] };
    const boundary = 'forge_backup_' + Date.now();
    const body = _buildMultipartBody(metadata, JSON.stringify(payload, null, 2), boundary);
    const method = existing ? 'PATCH' : 'POST';
    const uploadUrl = existing
      ? 'https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(existing.id) + '?uploadType=multipart&fields=id,modifiedTime'
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime';
    const res = await _authedFetch(uploadUrl, {
      method,
      headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
      body
    }, interactive);
    const out = await res.json();
    if (out && out.id) _lsSet(LS.FILE_ID, out.id);
    _lsSet(LS.LAST_BACKUP_TS, String(Date.now()));
    _lsSet(LS.LAST_AUTO_DAY, _todayIso());
    if (!silent) _toast('Google Drive backup updated');
    _renderStatus();
    return out;
  }

  async function connectGoogleDriveBackup() {
    if (!_configured()) {
      _toast('Add GOOGLE_DRIVE_CLIENT_ID in js/config.js first', 'warn');
      return;
    }
    try {
      await _ensureAccessToken(true);
      await _fetchGoogleEmail();
      _setEnabled(true);
      _toast('Google Drive backup connected', 'success');
      const payload = typeof global.buildBackupPayload === 'function' ? global.buildBackupPayload() : null;
      if (payload) await _uploadPayload(payload, true, false);
    } catch (err) {
      _toast('Google Drive connect failed', 'error');
      console.error('[FORGE gdrive] connect failed:', err);
    }
  }

  function disconnectGoogleDriveBackup() {
    _setEnabled(false);
    _lsDel(LS.EMAIL);
    _lsDel(LS.FILE_ID);
    _lsDel(LS.LAST_AUTO_DAY);
    _lsDel(LS.LAST_AUTO_SAVE_TS);
    if (_token && global.google && google.accounts && google.accounts.oauth2 && typeof google.accounts.oauth2.revoke === 'function') {
      try { google.accounts.oauth2.revoke(_token, () => {}); } catch (_e) {}
    }
    _token = '';
    _tokenExpiryMs = 0;
    _toast('Google Drive backup disconnected');
    _renderStatus();
  }

  async function backupNowToGoogleDrive() {
    if (!_configured()) {
      _toast('Add GOOGLE_DRIVE_CLIENT_ID in js/config.js first', 'warn');
      return;
    }
    try {
      _setEnabled(true);
      const payload = typeof global.buildBackupPayload === 'function' ? global.buildBackupPayload() : null;
      if (!payload) { _toast('Backup payload is unavailable', 'error'); return; }
      await _uploadPayload(payload, true, false);
    } catch (err) {
      _toast('Google Drive backup failed', 'error');
      console.error('[FORGE gdrive] manual backup failed:', err);
    }
  }

  async function restoreLatestFromGoogleDrive() {
    if (!_configured()) {
      _toast('Add GOOGLE_DRIVE_CLIENT_ID in js/config.js first', 'warn');
      return;
    }
    try {
      const file = await _findBackupFile(true);
      if (!file || !file.id) {
        _toast('No Google Drive backup found yet', 'warn');
        return;
      }
      const url = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(file.id) + '?alt=media';
      const res = await _authedFetch(url, {}, true);
      const payload = await res.json();
      if (typeof global.restoreBackupPayload !== 'function') {
        _toast('Restore handler is unavailable', 'error');
        return;
      }
      const ok = global.restoreBackupPayload(payload, { skipToast: true });
      if (ok) _toast('Google Drive backup restored', 'success');
      else _toast('Backup file is invalid', 'error');
    } catch (err) {
      _toast('Restore from Google Drive failed', 'error');
      console.error('[FORGE gdrive] restore failed:', err);
    }
  }

  async function _autoBackup(reason) {
    if (!_isEnabled() || !_configured() || _autoInFlight) return;
    const payload = typeof global.buildBackupPayload === 'function' ? global.buildBackupPayload() : null;
    if (!payload) return;
    _autoInFlight = true;
    try {
      await _uploadPayload(payload, false, true);
      if (reason === 'save') _lsSet(LS.LAST_AUTO_SAVE_TS, String(Date.now()));
    } catch (err) {
      // Silent by design for auto mode.
      console.debug('[FORGE gdrive] auto backup skipped:', err?.message || err);
    } finally {
      _autoInFlight = false;
      _renderStatus();
    }
  }

  function onSave() {
    if (!_isEnabled()) return;
    const last = parseInt(_lsGet(LS.LAST_AUTO_SAVE_TS) || '0', 10);
    if (Date.now() - last < AUTO_SAVE_THROTTLE_MS) return;
    _autoBackup('save');
  }

  function _tickDailyAutoBackup() {
    if (!_isEnabled()) return;
    const day = _todayIso();
    if (_lsGet(LS.LAST_AUTO_DAY) === day) return;
    _autoBackup('daily');
  }

  function _renderStatus() {
    const statusEl = document.getElementById('gdrive-backup-status');
    const titleEl = document.getElementById('gdrive-backup-connect-title');
    const descEl = document.getElementById('gdrive-backup-connect-desc');
    const email = _lsGet(LS.EMAIL) || '';
    const enabled = _isEnabled();
    const lastTs = parseInt(_lsGet(LS.LAST_BACKUP_TS) || '0', 10);
    const lastText = lastTs ? new Date(lastTs).toLocaleString('en-GB') : 'never';

    if (statusEl) {
      statusEl.textContent = enabled
        ? ('Connected' + (email ? ' as ' + email : '') + ' | Last backup: ' + lastText)
        : 'Not connected';
    }
    if (titleEl) titleEl.textContent = enabled ? 'Disconnect Google Drive Backup' : 'Connect Google Drive Backup';
    if (descEl) {
      descEl.textContent = enabled
        ? 'Tap to disconnect. Auto backup runs daily and after saves.'
        : 'Enable automatic JSON backup to your private Google Drive app data folder.';
    }
  }

  function toggleGoogleDriveBackup() {
    if (_isEnabled()) disconnectGoogleDriveBackup();
    else connectGoogleDriveBackup();
  }

  function init() {
    _renderStatus();
    setTimeout(_renderStatus, 1500);
    setInterval(_tickDailyAutoBackup, AUTO_POLL_MS);
  }

  global.toggleGoogleDriveBackup = toggleGoogleDriveBackup;
  global.backupNowToGoogleDrive = backupNowToGoogleDrive;
  global.restoreLatestFromGoogleDrive = restoreLatestFromGoogleDrive;
  global.FORGE_GDRIVE = {
    onSave,
    connect: connectGoogleDriveBackup,
    disconnect: disconnectGoogleDriveBackup,
    backupNow: backupNowToGoogleDrive,
    restoreLatest: restoreLatestFromGoogleDrive,
    renderStatus: _renderStatus
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window);
