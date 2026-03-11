// FORGE Auth UI
// Injects #forge-auth overlay into <body> and handles login / sign-up / forgot password.
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
        background: #080c09;
        display: flex !important;
        align-items: flex-start;
        justify-content: center;
        min-height: 100vh;
        overflow-y: auto;
        padding: 32px 16px 48px;
        box-sizing: border-box;
      }
      #forge-auth.auth-hidden { display: none !important; }

      /* Animated grid background */
      .auth-bg {
        position: fixed;
        inset: 0;
        background-image:
          linear-gradient(rgba(57,255,143,.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(57,255,143,.06) 1px, transparent 1px);
        background-size: 48px 48px;
        animation: authGridDrift 20s linear infinite;
        pointer-events: none;
      }
      @keyframes authGridDrift {
        0%   { background-position: 0 0; }
        100% { background-position: 48px 48px; }
      }

      /* Radial glow blobs */
      .auth-glow-1 {
        position: fixed;
        width: 480px; height: 480px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(57,255,143,.09) 0%, transparent 70%);
        top: -100px; left: -100px;
        animation: authBlob1 8s ease-in-out infinite alternate;
        pointer-events: none;
      }
      .auth-glow-2 {
        position: fixed;
        width: 360px; height: 360px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(46,204,113,.07) 0%, transparent 70%);
        bottom: -80px; right: -80px;
        animation: authBlob2 10s ease-in-out infinite alternate;
        pointer-events: none;
      }
      @keyframes authBlob1 {
        0%   { transform: translate(0,0) scale(1); }
        100% { transform: translate(60px,40px) scale(1.15); }
      }
      @keyframes authBlob2 {
        0%   { transform: translate(0,0) scale(1); }
        100% { transform: translate(-50px,-30px) scale(1.1); }
      }

      /* Floating particles */
      .auth-particles { position:fixed; inset:0; pointer-events:none; overflow:hidden; }
      .auth-particle {
        position: absolute;
        width: 2px; height: 2px;
        border-radius: 50%;
        background: var(--accent, #39ff8f);
        opacity: 0;
        animation: authParticleFloat linear infinite;
      }

      @keyframes authParticleFloat {
        0%   { opacity:0; transform: translateY(0) scale(1); }
        10%  { opacity:.6; }
        90%  { opacity:.3; }
        100% { opacity:0; transform: translateY(-100vh) scale(0.5); }
      }

      /* Card */
      .auth-card {
        position: relative;
        z-index: 1;
        background: rgba(13,20,16,.92);
        border: 1px solid rgba(57,255,143,.15);
        border-radius: 20px;
        padding: 36px 28px 28px;
        width: 100%;
        max-width: 380px;
        box-shadow:
          0 0 0 1px rgba(57,255,143,.06),
          0 8px 40px rgba(0,0,0,.6),
          0 0 60px rgba(57,255,143,.06);
        animation: authCardIn .5s cubic-bezier(.22,1,.36,1) both;
        backdrop-filter: blur(12px);
      }
      @keyframes authCardIn {
        from { opacity:0; transform: translateY(28px) scale(.97); }
        to   { opacity:1; transform: translateY(0) scale(1); }
      }

      /* Logo */
      .auth-logo {
        text-align: center;
        margin-bottom: 6px;
      }
      .auth-logo-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 52px; height: 52px;
        border-radius: 14px;
        background: linear-gradient(135deg, rgba(57,255,143,.12), rgba(57,255,143,.22));
        border: 1px solid rgba(57,255,143,.25);
        margin-bottom: 10px;
        box-shadow: 0 0 24px rgba(57,255,143,.18);
        animation: logoGlow 3s ease-in-out infinite alternate;
      }
      @keyframes logoGlow {
        from { box-shadow: 0 0 16px rgba(57,255,143,.15); border-color: rgba(57,255,143,.2); }
        to   { box-shadow: 0 0 32px rgba(57,255,143,.32); border-color: rgba(57,255,143,.4); }
      }
      .auth-logo span {
        display: block;
        font-family: 'Barlow', sans-serif;
        font-weight: 700;
        font-size: 1.9rem;
        letter-spacing: 6px;
        color: var(--accent, #39ff8f);
        text-transform: uppercase;
        text-shadow: 0 0 20px rgba(57,255,143,.4);
      }
      .auth-logo-sub {
        font-family: 'Barlow', sans-serif;
        font-size: .7rem;
        letter-spacing: 3px;
        color: rgba(57,255,143,.45);
        text-transform: uppercase;
        margin-top: 2px;
        margin-bottom: 24px;
      }

      /* Tabs */
      .auth-tabs {
        display: flex;
        border-bottom: 1px solid rgba(255,255,255,.07);
        margin-bottom: 22px;
        gap: 4px;
      }
      .auth-tab {
        flex: 1;
        padding: 9px 0;
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: rgba(200,220,201,.4);
        font-family: 'Barlow', sans-serif;
        font-size: .88rem;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        cursor: pointer;
        transition: color .2s, border-color .2s;
        margin-bottom: -1px;
      }
      .auth-tab.active {
        color: var(--accent, #39ff8f);
        border-bottom-color: var(--accent, #39ff8f);
      }

      /* Fields */
      .auth-field { margin-bottom: 14px; }
      .auth-field label {
        display: block;
        font-size: .72rem;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: rgba(200,220,201,.5);
        margin-bottom: 6px;
      }
      .auth-field input {
        width: 100%;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(57,255,143,.12);
        border-radius: 10px;
        color: #c8dcc9;
        font-family: 'Barlow', sans-serif;
        font-size: .97rem;
        padding: 11px 14px;
        outline: none;
        transition: border-color .2s, box-shadow .2s;
      }
      .auth-field input:focus {
        border-color: rgba(57,255,143,.5);
        box-shadow: 0 0 0 3px rgba(57,255,143,.08);
      }

      /* Forgot password link */
      .auth-forgot {
        display: block;
        text-align: right;
        font-size: .75rem;
        font-weight: 600;
        letter-spacing: .5px;
        color: rgba(57,255,143,.5);
        cursor: pointer;
        margin-top: -6px;
        margin-bottom: 14px;
        transition: color .2s;
        background: none;
        border: none;
        padding: 0;
        font-family: 'Barlow', sans-serif;
      }
      .auth-forgot:hover { color: rgba(57,255,143,.85); }

      /* Submit button */
      .auth-submit {
        width: 100%;
        margin-top: 6px;
        padding: 13px;
        background: linear-gradient(135deg, rgba(57,255,143,.15), rgba(57,255,143,.28));
        border: 1.5px solid rgba(57,255,143,.5);
        border-radius: 12px;
        color: #39ff8f;
        font-family: 'Barlow', sans-serif;
        font-size: .95rem;
        font-weight: 700;
        letter-spacing: 2.5px;
        text-transform: uppercase;
        cursor: pointer;
        transition: background .2s, box-shadow .2s, transform .15s;
        box-shadow: 0 2px 18px rgba(57,255,143,.12);
      }
      .auth-submit:hover {
        background: linear-gradient(135deg, rgba(57,255,143,.22), rgba(57,255,143,.38));
        box-shadow: 0 4px 28px rgba(57,255,143,.25);
      }
      .auth-submit:active { transform: scale(.98); }
      .auth-submit:disabled { opacity: .4; cursor: not-allowed; transform: none; }

      /* Error / success messages */
      .auth-error {
        margin-top: 12px;
        padding: 10px 14px;
        background: rgba(231,76,60,.1);
        border: 1px solid rgba(231,76,60,.25);
        border-radius: 10px;
        color: #e74c3c;
        font-size: .85rem;
        display: none;
        line-height: 1.5;
      }
      .auth-error.visible { display: block; }
      .auth-success {
        margin-top: 12px;
        padding: 10px 14px;
        background: rgba(57,255,143,.08);
        border: 1px solid rgba(57,255,143,.25);
        border-radius: 10px;
        color: #39ff8f;
        font-size: .85rem;
        display: none;
        line-height: 1.5;
      }
      .auth-success.visible { display: block; }

      /* Divider */
      .auth-divider {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 18px 0 14px;
        color: rgba(200,220,201,.25);
        font-size: .72rem;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }
      .auth-divider::before, .auth-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255,255,255,.06);
      }

      /* Guest button */
      .auth-guest-btn {
        width: 100%;
        padding: 11px;
        background: transparent;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 12px;
        color: rgba(200,220,201,.45);
        font-family: 'Barlow', sans-serif;
        font-size: .88rem;
        font-weight: 600;
        letter-spacing: 1px;
        text-transform: uppercase;
        cursor: pointer;
        transition: border-color .2s, color .2s;
      }
      .auth-guest-btn:hover {
        border-color: rgba(255,255,255,.18);
        color: rgba(200,220,201,.75);
      }

      /* Back link */
      .auth-back {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-family: 'Barlow', sans-serif;
        font-size: .8rem;
        font-weight: 600;
        letter-spacing: 1px;
        color: rgba(57,255,143,.45);
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        margin-bottom: 18px;
        transition: color .2s;
      }
      .auth-back:hover { color: rgba(57,255,143,.8); }

      /* Version */
      .auth-version {
        text-align: center;
        margin-top: 16px;
        font-family: 'DM Mono', monospace;
        font-size: .68rem;
        color: rgba(100,140,100,.4);
        letter-spacing: 1px;
      }
    </style>

    <!-- Background effects -->
    <div class="auth-bg"></div>
    <div class="auth-glow-1"></div>
    <div class="auth-glow-2"></div>
    <div class="auth-particles" id="auth-particles"></div>

    <div class="auth-card">
      <div class="auth-logo">
        <div class="auth-logo-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#39ff8f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M9 4v16M15 4v16"/>
          </svg>
        </div>
        <span>FORGE</span>
        <div class="auth-logo-sub">Gym Tracker</div>
      </div>

      <!-- LOGIN FORM -->
      <div id="auth-form-login">
        <div class="auth-tabs">
          <button class="auth-tab active" id="auth-tab-login" onclick="_authSwitchTab('login')">Login</button>
          <button class="auth-tab" id="auth-tab-signup" onclick="_authSwitchTab('signup')">Sign Up</button>
        </div>
        <div class="auth-field">
          <label for="auth-email-l">Email</label>
          <input type="email" id="auth-email-l" autocomplete="email" placeholder="you@example.com">
        </div>
        <div class="auth-field">
          <label for="auth-pass-l">Password</label>
          <input type="password" id="auth-pass-l" autocomplete="current-password" placeholder="••••••••">
        </div>
        <button class="auth-forgot" onclick="_authSwitchTab('forgot')">Forgot password?</button>
        <button class="auth-submit" id="auth-btn-login" onclick="_authLogin()">LOGIN</button>
        <div class="auth-error" id="auth-error-login"></div>
        <div class="auth-divider">or</div>
        <button class="auth-guest-btn" onclick="window._authGuestMode()">Continue as Guest</button>
      </div>

      <!-- SIGN UP FORM -->
      <div id="auth-form-signup" style="display:none;">
        <div class="auth-tabs">
          <button class="auth-tab" id="auth-tab-login2" onclick="_authSwitchTab('login')">Login</button>
          <button class="auth-tab active" id="auth-tab-signup2" onclick="_authSwitchTab('signup')">Sign Up</button>
        </div>
        <div class="auth-field">
          <label for="auth-email-s">Email</label>
          <input type="email" id="auth-email-s" autocomplete="email" placeholder="you@example.com">
        </div>
        <div class="auth-field">
          <label for="auth-pass-s">Password</label>
          <input type="password" id="auth-pass-s" autocomplete="new-password" placeholder="Min 6 characters">
        </div>
        <button class="auth-submit" id="auth-btn-signup" onclick="_authSignup()">CREATE ACCOUNT</button>
        <div class="auth-error" id="auth-error-signup"></div>
        <div class="auth-divider">or</div>
        <button class="auth-guest-btn" onclick="window._authGuestMode()">Continue as Guest</button>
      </div>

      <!-- FORGOT PASSWORD FORM -->
      <div id="auth-form-forgot" style="display:none;">
        <button class="auth-back" onclick="_authSwitchTab('login')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Login
        </button>
        <div class="auth-field">
          <label for="auth-email-r">Email address</label>
          <input type="email" id="auth-email-r" autocomplete="email" placeholder="you@example.com">
        </div>
        <button class="auth-submit" id="auth-btn-reset" onclick="_authResetPassword()">SEND RESET LINK</button>
        <div class="auth-error" id="auth-error-forgot"></div>
        <div class="auth-success" id="auth-success-forgot"></div>
      </div>

      <div class="auth-version">${window.FORGE_VERSION || ''} &middot; ${window.FORGE_BUILD || ''}</div>
    </div>
  `;
  document.body.insertBefore(overlay, document.body.firstChild);

  // ── Floating particles ───────────────────────────────────────────────────
  (function _spawnParticles() {
    const container = document.getElementById('auth-particles');
    if (!container) return;
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'auth-particle';
      const size = Math.random() * 3 + 1;
      p.style.cssText = [
        'left:' + (Math.random() * 100) + '%',
        'bottom:' + (Math.random() * -20) + '%',
        'width:' + size + 'px',
        'height:' + size + 'px',
        'animation-duration:' + (8 + Math.random() * 14) + 's',
        'animation-delay:' + (Math.random() * 12) + 's',
        'opacity:0'
      ].join(';');
      container.appendChild(p);
    }
  })();

  // ── Tab switching ────────────────────────────────────────────────────────
  window._authSwitchTab = function (tab) {
    document.getElementById('auth-form-login').style.display  = tab === 'login'  ? '' : 'none';
    document.getElementById('auth-form-signup').style.display = tab === 'signup' ? '' : 'none';
    document.getElementById('auth-form-forgot').style.display = tab === 'forgot' ? '' : 'none';
    _authClearAllErrors();
  };

  // ── Error / success helpers ───────────────────────────────────────────────
  function _authClearAllErrors() {
    ['auth-error-login','auth-error-signup','auth-error-forgot','auth-success-forgot'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.remove('visible'); }
    });
  }
  function _authShowError(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('visible'); }
  }
  function _authShowSuccess(id, msg) {
    const el = document.getElementById(id);
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
    if (el) el.style.setProperty('display', 'none', 'important');
  };

  // ── Login ────────────────────────────────────────────────────────────────
  window._authLogin = async function () {
    if (!window._sb) { _authShowError('auth-error-login', 'Supabase not configured.'); return; }
    const email = document.getElementById('auth-email-l')?.value.trim();
    const pass  = document.getElementById('auth-pass-l')?.value;
    if (!email || !pass) { _authShowError('auth-error-login', 'Please fill in email and password.'); return; }
    _authClearAllErrors();
    _authSetLoading('auth-btn-login', true);
    try {
      const { data, error } = await window._sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      _authHideOverlay();
      if (typeof window._authSuccess === 'function') window._authSuccess(data.session);
    } catch (e) {
      _authShowError('auth-error-login', e.message || 'Login failed.');
    } finally {
      _authSetLoading('auth-btn-login', false);
    }
  };

  // ── Sign Up ──────────────────────────────────────────────────────────────
  window._authSignup = async function () {
    if (!window._sb) { _authShowError('auth-error-signup', 'Supabase not configured.'); return; }
    const email = document.getElementById('auth-email-s')?.value.trim();
    const pass  = document.getElementById('auth-pass-s')?.value;
    if (!email || !pass) { _authShowError('auth-error-signup', 'Please fill in email and password.'); return; }
    if (pass.length < 6) { _authShowError('auth-error-signup', 'Password must be at least 6 characters.'); return; }
    _authClearAllErrors();
    _authSetLoading('auth-btn-signup', true);
    try {
      const { data, error } = await window._sb.auth.signUp({ email, password: pass });
      if (error) throw error;
      if (data.session) {
        _authHideOverlay();
        if (typeof window._authSuccess === 'function') window._authSuccess(data.session, true);
      } else {
        _authShowError('auth-error-signup', 'Check your email to confirm your account, then log in.');
        _authSwitchTab('login');
      }
    } catch (e) {
      _authShowError('auth-error-signup', e.message || 'Sign up failed.');
    } finally {
      _authSetLoading('auth-btn-signup', false);
    }
  };

  // ── Forgot Password ──────────────────────────────────────────────────────
  window._authResetPassword = async function () {
    if (!window._sb) { _authShowError('auth-error-forgot', 'Supabase not configured.'); return; }
    const email = document.getElementById('auth-email-r')?.value.trim();
    if (!email) { _authShowError('auth-error-forgot', 'Please enter your email address.'); return; }
    _authClearAllErrors();
    _authSetLoading('auth-btn-reset', true);
    try {
      const { error } = await window._sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });
      if (error) throw error;
      _authShowSuccess('auth-success-forgot', 'Reset link sent! Check your inbox (and spam folder).');
      document.getElementById('auth-email-r').value = '';
    } catch (e) {
      _authShowError('auth-error-forgot', e.message || 'Could not send reset email.');
    } finally {
      _authSetLoading('auth-btn-reset', false);
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
    if (document.getElementById('auth-form-signup').style.display !== 'none') {
      window._authSignup();
    } else if (document.getElementById('auth-form-forgot').style.display !== 'none') {
      window._authResetPassword();
    } else {
      window._authLogin();
    }
  });

})();
