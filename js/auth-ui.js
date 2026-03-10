// FORGE Auth UI
// Injects #forge-auth overlay into <body> and handles login / sign-up.
// Calls window._authSuccess(session) on successful auth (defined in index.html boot block).
// Must load after supabase-client.js.

(function () {
  'use strict';

  // ── Inject overlay HTML ──────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'forge-auth';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;';
  overlay.innerHTML = `
    <style>
      #forge-auth {
        background: var(--bg, #080c09);
        display: flex !important;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      #forge-auth.auth-hidden { display: none !important; }
      .auth-card {
        background: var(--panel, #131c14);
        border: 1px solid var(--border2, #253527);
        border-radius: 16px;
        padding: 36px 28px;
        width: 100%;
        max-width: 380px;
        box-shadow: 0 0 40px rgba(46,204,113,0.06);
      }
      .auth-logo {
        text-align: center;
        margin-bottom: 24px;
      }
      .auth-logo span {
        font-family: 'Barlow', sans-serif;
        font-weight: 700;
        font-size: 2rem;
        letter-spacing: 4px;
        color: var(--accent, #39ff8f);
        text-transform: uppercase;
      }
      .auth-tabs {
        display: flex;
        border-bottom: 1px solid var(--border, #1e2e1f);
        margin-bottom: 24px;
      }
      .auth-tab {
        flex: 1;
        padding: 10px 0;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text2, #7a9e7e);
        font-family: 'Barlow', sans-serif;
        font-size: 0.95rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        transition: color .2s, border-color .2s;
        margin-bottom: -1px;
      }
      .auth-tab.active {
        color: var(--accent, #39ff8f);
        border-bottom-color: var(--accent, #39ff8f);
      }
      .auth-field {
        margin-bottom: 14px;
      }
      .auth-field label {
        display: block;
        font-size: 0.78rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: var(--text2, #7a9e7e);
        margin-bottom: 6px;
      }
      .auth-field input {
        width: 100%;
        background: var(--bg2, #0d1410);
        border: 1px solid var(--border2, #253527);
        border-radius: 8px;
        color: var(--text, #c8dcc9);
        font-family: 'Barlow', sans-serif;
        font-size: 1rem;
        padding: 10px 14px;
        outline: none;
        transition: border-color .2s;
      }
      .auth-field input:focus {
        border-color: var(--accent, #39ff8f);
      }
      .auth-submit {
        width: 100%;
        margin-top: 8px;
        padding: 13px;
        background: var(--accent, #39ff8f);
        color: var(--bg, #080c09);
        border: none;
        border-radius: 10px;
        font-family: 'Barlow', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: 2px;
        text-transform: uppercase;
        cursor: pointer;
        transition: opacity .2s;
      }
      .auth-submit:disabled { opacity: .5; cursor: not-allowed; }
      .auth-error {
        margin-top: 14px;
        padding: 10px 14px;
        background: rgba(231,76,60,0.12);
        border: 1px solid rgba(231,76,60,0.3);
        border-radius: 8px;
        color: var(--danger, #e74c3c);
        font-size: 0.88rem;
        display: none;
      }
      .auth-error.visible { display: block; }
      .auth-divider {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 20px 0 14px;
        color: var(--text2, #7a9e7e);
        font-size: 0.75rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
      }
      .auth-divider::before, .auth-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border, #1e2e1f);
      }
      .auth-guest-btn {
        width: 100%;
        padding: 11px;
        background: transparent;
        border: 1px solid var(--border2, #253527);
        border-radius: 10px;
        color: var(--text2, #7a9e7e);
        font-family: 'Barlow', sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        transition: border-color .2s, color .2s;
      }
      .auth-guest-btn:hover {
        border-color: var(--text2, #7a9e7e);
        color: var(--text, #c8dcc9);
      }
      .auth-version {
        text-align: center;
        margin-top: 18px;
        font-family: 'DM Mono', monospace;
        font-size: 0.7rem;
        color: var(--text3, #6a9a6e);
        letter-spacing: 1px;
        opacity: 0.75;
      }
    </style>

    <div class="auth-card">
      <div class="auth-logo"><span>FORGE</span></div>
      <div class="auth-tabs">
        <button class="auth-tab active" id="auth-tab-login" onclick="_authSwitchTab('login')">Login</button>
        <button class="auth-tab" id="auth-tab-signup" onclick="_authSwitchTab('signup')">Sign Up</button>
      </div>
      <div id="auth-form-login">
        <div class="auth-field">
          <label for="auth-email-l">Email</label>
          <input type="email" id="auth-email-l" autocomplete="email" placeholder="you@example.com">
        </div>
        <div class="auth-field">
          <label for="auth-pass-l">Password</label>
          <input type="password" id="auth-pass-l" autocomplete="current-password" placeholder="••••••••">
        </div>
        <button class="auth-submit" id="auth-btn-login" onclick="_authLogin()">LOGIN</button>
      </div>
      <div id="auth-form-signup" style="display:none;">
        <div class="auth-field">
          <label for="auth-email-s">Email</label>
          <input type="email" id="auth-email-s" autocomplete="email" placeholder="you@example.com">
        </div>
        <div class="auth-field">
          <label for="auth-pass-s">Password</label>
          <input type="password" id="auth-pass-s" autocomplete="new-password" placeholder="Min 6 characters">
        </div>
        <button class="auth-submit" id="auth-btn-signup" onclick="_authSignup()">CREATE ACCOUNT</button>
      </div>
      <div class="auth-error" id="auth-error"></div>
      <div class="auth-divider">or</div>
      <button class="auth-guest-btn" onclick="window._authGuestMode()">Continue as Guest</button>
      <div class="auth-version">${window.FORGE_VERSION || ''} &middot; ${window.FORGE_BUILD || ''}</div>
    </div>
  `;
  document.body.insertBefore(overlay, document.body.firstChild);

  // ── Tab switching ────────────────────────────────────────────────────────
  window._authSwitchTab = function (tab) {
    const isLogin = tab === 'login';
    document.getElementById('auth-tab-login').classList.toggle('active', isLogin);
    document.getElementById('auth-tab-signup').classList.toggle('active', !isLogin);
    document.getElementById('auth-form-login').style.display = isLogin ? '' : 'none';
    document.getElementById('auth-form-signup').style.display = isLogin ? 'none' : '';
    _authClearError();
  };

  // ── Error display ────────────────────────────────────────────────────────
  function _authClearError() {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  }
  function _authShowError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.classList.add('visible'); }
  }
  function _authSetLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = loading;
  }

  // ── Show / Hide overlay ──────────────────────────────────────────────────
  window._authShowOverlay = function () {
    const el = document.getElementById('forge-auth');
    if (el) el.style.removeProperty('display');
  };
  window._authHideOverlay = function () {
    const el = document.getElementById('forge-auth');
    // Use setProperty with !important to beat the `display:flex !important` CSS rule
    if (el) el.style.setProperty('display', 'none', 'important');
  };

  // ── Login ────────────────────────────────────────────────────────────────
  window._authLogin = async function () {
    if (!window._sb) { _authShowError('Supabase not configured. Edit js/config.js.'); return; }
    const email = document.getElementById('auth-email-l')?.value.trim();
    const pass  = document.getElementById('auth-pass-l')?.value;
    if (!email || !pass) { _authShowError('Please fill in email and password.'); return; }
    _authClearError();
    _authSetLoading('auth-btn-login', true);
    try {
      const { data, error } = await window._sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      _authHideOverlay();
      if (typeof window._authSuccess === 'function') window._authSuccess(data.session);
    } catch (e) {
      _authShowError(e.message || 'Login failed.');
    } finally {
      _authSetLoading('auth-btn-login', false);
    }
  };

  // ── Sign Up ──────────────────────────────────────────────────────────────
  window._authSignup = async function () {
    if (!window._sb) { _authShowError('Supabase not configured. Edit js/config.js.'); return; }
    const email = document.getElementById('auth-email-s')?.value.trim();
    const pass  = document.getElementById('auth-pass-s')?.value;
    if (!email || !pass) { _authShowError('Please fill in email and password.'); return; }
    if (pass.length < 6) { _authShowError('Password must be at least 6 characters.'); return; }
    _authClearError();
    _authSetLoading('auth-btn-signup', true);
    try {
      const { data, error } = await window._sb.auth.signUp({ email, password: pass });
      if (error) throw error;
      // signUp returns a session immediately if email confirmation is disabled
      if (data.session) {
        _authHideOverlay();
        if (typeof window._authSuccess === 'function') window._authSuccess(data.session, true);
      } else {
        // Email confirmation required
        _authShowError('Check your email to confirm your account, then log in.');
        _authSwitchTab('login');
      }
    } catch (e) {
      _authShowError(e.message || 'Sign up failed.');
    } finally {
      _authSetLoading('auth-btn-signup', false);
    }
  };

  // ── Guest mode ───────────────────────────────────────────────────────────
  window._authGuestMode = function () {
    localStorage.setItem('forge_guest', '1');
    _authHideOverlay();
    if (typeof _onboardingCheck === 'function') _onboardingCheck();
  };

  // ── Enter key support ────────────────────────────────────────────────────
  overlay.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    const loginVisible = document.getElementById('auth-form-login').style.display !== 'none';
    if (loginVisible) window._authLogin();
    else window._authSignup();
  });

})();
