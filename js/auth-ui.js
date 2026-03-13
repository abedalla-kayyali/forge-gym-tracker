// FORGE Auth UI
// Injects #forge-auth overlay into <body> and handles login / sign-up / forgot password.
// Calls window._authSuccess(session) on successful auth (defined in index.html boot block).
// Must load after supabase-client.js.

(function () {
  'use strict';

  // â”€â”€ Inject overlay HTML â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      .auth-lang-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 4;
        height: 30px;
        min-width: 30px;
        padding: 0 8px;
        border-radius: 999px;
        border: 1px solid rgba(57,255,143,.28);
        background: rgba(57,255,143,.1);
        color: rgba(171,255,216,.95);
        font-family: 'DM Mono', monospace;
        font-size: .72rem;
        letter-spacing: 1px;
        cursor: pointer;
        transition: border-color .2s, background .2s;
      }
      .auth-lang-btn:hover {
        border-color: rgba(57,255,143,.5);
        background: rgba(57,255,143,.18);
      }
      [dir="rtl"] #forge-auth .auth-lang-btn {
        left: 10px;
        right: auto;
      }
      .auth-lang-float {
        position: fixed;
        top: 10px;
        top: calc(env(safe-area-inset-top, 0px) + 10px);
        right: 12px;
        z-index: 10002;
        height: 34px;
        min-width: 34px;
        padding: 0 10px;
        border-radius: 999px;
        border: 1px solid rgba(57,255,143,.42);
        background: rgba(6,16,12,.85);
        color: #baffdb;
        font-family: 'DM Mono', monospace;
        font-size: .74rem;
        letter-spacing: 1px;
        font-weight: 700;
        box-shadow: 0 8px 24px rgba(0,0,0,.35), 0 0 0 1px rgba(57,255,143,.14) inset;
        cursor: pointer;
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        opacity: 1 !important;
        visibility: visible !important;
      }
      [dir="rtl"] #forge-auth .auth-lang-float {
        right: auto;
        left: 12px;
      }
      .auth-lang-inline-wrap {
        display: flex;
        justify-content: center;
        margin: -4px 0 14px;
      }
      .auth-lang-inline-btn {
        height: 34px;
        min-width: 54px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid rgba(57,255,143,.45);
        background: rgba(57,255,143,.12);
        color: #d7ffea;
        font-family: 'DM Mono', monospace;
        font-size: .75rem;
        font-weight: 700;
        letter-spacing: 1px;
        cursor: pointer;
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
      [dir="rtl"] #forge-auth .auth-field label,
      [dir="rtl"] #forge-auth .auth-logo,
      [dir="rtl"] #forge-auth .auth-version {
        text-align: right;
      }
      [dir="rtl"] #forge-auth .auth-forgot {
        text-align: left;
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
      .auth-update-btn {
        width: 100%;
        margin-top: 8px;
        padding: 10px;
        background: rgba(57,255,143,.08);
        border: 1px dashed rgba(57,255,143,.35);
        border-radius: 12px;
        color: rgba(171,255,216,.9);
        font-family: 'DM Mono', monospace;
        font-size: .75rem;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        cursor: pointer;
        transition: border-color .2s, background .2s, color .2s;
      }
      .auth-update-btn:hover {
        border-color: rgba(57,255,143,.55);
        background: rgba(57,255,143,.14);
        color: #d9ffeb;
      }
      .auth-update-btn:disabled {
        opacity: .55;
        cursor: not-allowed;
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
    <button class="auth-lang-float" id="auth-lang-float" onclick="window._authToggleLanguage()" title="Switch language">EN</button>

    <div class="auth-card">
      <button class="auth-lang-btn" id="auth-lang-btn" onclick="window._authToggleLanguage()" title="Switch language">EN</button>
      <div class="auth-logo">
        <div class="auth-logo-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#39ff8f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M9 4v16M15 4v16"/>
          </svg>
        </div>
        <span>FORGE</span>
        <div class="auth-logo-sub" id="auth-logo-sub">Gym Tracker</div>
      </div>
      <div class="auth-lang-inline-wrap">
        <button class="auth-lang-inline-btn" id="auth-lang-inline-btn" onclick="window._authToggleLanguage()" title="Switch language">EN</button>
      </div>

      <!-- LOGIN FORM -->
      <div id="auth-form-login">
        <div class="auth-tabs">
          <button class="auth-tab active" id="auth-tab-login" onclick="_authSwitchTab('login')">Login</button>
          <button class="auth-tab" id="auth-tab-signup" onclick="_authSwitchTab('signup')">Sign Up</button>
        </div>
        <div class="auth-field">
          <label for="auth-email-l" id="auth-label-email-l">Email</label>
          <input type="email" id="auth-email-l" autocomplete="email" placeholder="you@example.com">
        </div>
        <div class="auth-field">
          <label for="auth-pass-l" id="auth-label-pass-l">Password</label>
          <input type="password" id="auth-pass-l" autocomplete="current-password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢">
        </div>
        <button class="auth-forgot" id="auth-forgot-btn" onclick="_authSwitchTab('forgot')">Forgot password?</button>
        <button class="auth-submit" id="auth-btn-login" onclick="_authLogin()">LOGIN</button>
        <div class="auth-error" id="auth-error-login"></div>
        <div class="auth-divider" id="auth-divider-login">or</div>
        <button class="auth-guest-btn" id="auth-guest-login" onclick="window._authGuestMode()">Continue as Guest</button>
        <button class="auth-update-btn" id="auth-btn-force-update" onclick="window._authForceUpdate()">Force Update App</button>
      </div>

      <!-- SIGN UP FORM -->
      <div id="auth-form-signup" style="display:none;">
        <div class="auth-tabs">
          <button class="auth-tab" id="auth-tab-login2" onclick="_authSwitchTab('login')">Login</button>
          <button class="auth-tab active" id="auth-tab-signup2" onclick="_authSwitchTab('signup')">Sign Up</button>
        </div>
        <div class="auth-field">
          <label for="auth-email-s" id="auth-label-email-s">Email</label>
          <input type="email" id="auth-email-s" autocomplete="email" placeholder="you@example.com">
        </div>
        <div class="auth-field">
          <label for="auth-pass-s" id="auth-label-pass-s">Password</label>
          <input type="password" id="auth-pass-s" autocomplete="new-password" placeholder="Min 6 characters">
        </div>
        <button class="auth-submit" id="auth-btn-signup" onclick="_authSignup()">CREATE ACCOUNT</button>
        <div class="auth-error" id="auth-error-signup"></div>
        <div class="auth-divider" id="auth-divider-signup">or</div>
        <button class="auth-guest-btn" id="auth-guest-signup" onclick="window._authGuestMode()">Continue as Guest</button>
        <button class="auth-update-btn" id="auth-btn-force-update-2" onclick="window._authForceUpdate()">Force Update App</button>
      </div>

      <!-- FORGOT PASSWORD FORM -->
      <div id="auth-form-forgot" style="display:none;">
        <button class="auth-back" id="auth-back-btn" onclick="_authSwitchTab('login')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          <span id="auth-back-text">Back to Login</span>
        </button>
        <div class="auth-field">
          <label for="auth-email-r" id="auth-label-email-r">Email address</label>
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

  // â”€â”€ Floating particles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  const _AUTH_I18N = {
    en: {
      logoSub: 'Gym Tracker',
      tabLogin: 'Login',
      tabSignup: 'Sign Up',
      email: 'Email',
      password: 'Password',
      passwordMin: 'Min 6 characters',
      forgot: 'Forgot password?',
      loginBtn: 'LOGIN',
      createBtn: 'CREATE ACCOUNT',
      divider: 'or',
      guest: 'Continue as Guest',
      update: 'Force Update App',
      backToLogin: 'Back to Login',
      emailAddress: 'Email address',
      resetBtn: 'SEND RESET LINK',
      langTitle: 'Switch language',
      langLabel: 'EN',
      passMask: 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢',
      errSupabase: 'Supabase not configured.',
      errFill: 'Please fill in email and password.',
      errLogin: 'Login failed.',
      errPassLen: 'Password must be at least 6 characters.',
      errSignup: 'Sign up failed.',
      msgConfirmEmail: 'Check your email to confirm your account, then log in.',
      errEnterEmail: 'Please enter your email address.',
      msgResetSent: 'Reset link sent! Check your inbox (and spam folder).',
      errReset: 'Could not send reset email.',
      msgUpdating: 'Updating app... one moment.',
      errUpdate: 'Update failed. Please refresh browser.'
    },
    ar: {
      logoSub: 'ظ…طھطھط¨ط¹ ط§ظ„ط¬ظٹظ…',
      tabLogin: 'طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„',
      tabSignup: 'ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨',
      email: 'ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ',
      password: 'ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±',
      passwordMin: '6 ط£ط­ط±ظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„',
      forgot: 'ظ‡ظ„ ظ†ط³ظٹطھ ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±طں',
      loginBtn: 'ط¯ط®ظˆظ„',
      createBtn: 'ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨',
      divider: 'ط£ظˆ',
      guest: 'ط§ظ„ط¯ط®ظˆظ„ ظƒط²ط§ط¦ط±',
      update: 'طھط­ط¯ظٹط« ط§ظ„طھط·ط¨ظٹظ‚',
      backToLogin: 'ط§ظ„ط¹ظˆط¯ط© ظ„طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„',
      emailAddress: 'ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ',
      resetBtn: 'ط¥ط±ط³ط§ظ„ ط±ط§ط¨ط· ط§ظ„ط§ط³طھط¹ط§ط¯ط©',
      langTitle: 'طھط¨ط¯ظٹظ„ ط§ظ„ظ„ط؛ط©',
      langLabel: 'ط¹',
      passMask: 'â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢',
      errSupabase: 'ط¥ط¹ط¯ط§ط¯ Supabase ط؛ظٹط± ظ…ظƒطھظ…ظ„.',
      errFill: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظˆظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±.',
      errLogin: 'ظپط´ظ„ طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„.',
      errPassLen: 'ظٹط¬ط¨ ط£ظ† طھظƒظˆظ† ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± 6 ط£ط­ط±ظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„.',
      errSignup: 'ظپط´ظ„ ط¥ظ†ط´ط§ط، ط§ظ„ط­ط³ط§ط¨.',
      msgConfirmEmail: 'طھط­ظ‚ظ‚ ظ…ظ† ط¨ط±ظٹط¯ظƒ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ ظ„طھط£ظƒظٹط¯ ط§ظ„ط­ط³ط§ط¨ ط«ظ… ط³ط¬ظ‘ظ„ ط§ظ„ط¯ط®ظˆظ„.',
      errEnterEmail: 'ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ط§ظ„ط¨ط±ظٹط¯ ط§ظ„ط¥ظ„ظƒطھط±ظˆظ†ظٹ.',
      msgResetSent: 'طھظ… ط¥ط±ط³ط§ظ„ ط±ط§ط¨ط· ط§ظ„ط§ط³طھط¹ط§ط¯ط©. طھط­ظ‚ظ‚ ظ…ظ† ط¨ط±ظٹط¯ظƒ ط§ظ„ظˆط§ط±ط¯.',
      errReset: 'طھط¹ط°ظ‘ط± ط¥ط±ط³ط§ظ„ ط±ط§ط¨ط· ط§ظ„ط§ط³طھط¹ط§ط¯ط©.',
      msgUpdating: 'ط¬ط§ط±ظچ طھط­ط¯ظٹط« ط§ظ„طھط·ط¨ظٹظ‚... ظ„ط­ط¸ط©.',
      errUpdate: 'ظپط´ظ„ ط§ظ„طھط­ط¯ظٹط«. ظٹط±ط¬ظ‰ ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©.'
    }
  };

  function _authLang() {
    if (typeof currentLang !== 'undefined') return currentLang;
    return localStorage.getItem('forge_lang') || 'en';
  }

  function _authT(k) {
    const lang = _authLang() === 'ar' ? 'ar' : 'en';
    return (_AUTH_I18N[lang] && _AUTH_I18N[lang][k]) || _AUTH_I18N.en[k] || '';
  }

  window._authApplyLanguage = function () {
    const lang = _authLang() === 'ar' ? 'ar' : 'en';
    const isAr = lang === 'ar';
    const root = document.getElementById('forge-auth');
    if (!root) return;
    root.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    root.setAttribute('lang', isAr ? 'ar' : 'en');

    const mapText = {
      'auth-logo-sub': 'logoSub',
      'auth-tab-login': 'tabLogin',
      'auth-tab-login2': 'tabLogin',
      'auth-tab-signup': 'tabSignup',
      'auth-tab-signup2': 'tabSignup',
      'auth-label-email-l': 'email',
      'auth-label-email-s': 'email',
      'auth-label-pass-l': 'password',
      'auth-label-pass-s': 'password',
      'auth-forgot-btn': 'forgot',
      'auth-btn-login': 'loginBtn',
      'auth-btn-signup': 'createBtn',
      'auth-divider-login': 'divider',
      'auth-divider-signup': 'divider',
      'auth-guest-login': 'guest',
      'auth-guest-signup': 'guest',
      'auth-btn-force-update': 'update',
      'auth-btn-force-update-2': 'update',
      'auth-back-text': 'backToLogin',
      'auth-label-email-r': 'emailAddress',
      'auth-btn-reset': 'resetBtn'
    };

    Object.entries(mapText).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = _authT(key);
    });

    const langBtn = document.getElementById('auth-lang-btn');
    if (langBtn) {
      langBtn.textContent = isAr ? 'EN' : 'AR';
      langBtn.title = _authT('langTitle');
      langBtn.setAttribute('aria-label', _authT('langTitle'));
    }
    const langFloatBtn = document.getElementById('auth-lang-float');
    if (langFloatBtn) {
      langFloatBtn.textContent = isAr ? 'EN' : 'AR';
      langFloatBtn.title = _authT('langTitle');
      langFloatBtn.setAttribute('aria-label', _authT('langTitle'));
    }
    const langInlineBtn = document.getElementById('auth-lang-inline-btn');
    if (langInlineBtn) {
      langInlineBtn.textContent = isAr ? 'EN' : 'AR';
      langInlineBtn.title = _authT('langTitle');
      langInlineBtn.setAttribute('aria-label', _authT('langTitle'));
    }

    const emailL = document.getElementById('auth-email-l');
    const passL = document.getElementById('auth-pass-l');
    const emailS = document.getElementById('auth-email-s');
    const passS = document.getElementById('auth-pass-s');
    const emailR = document.getElementById('auth-email-r');
    if (emailL) emailL.placeholder = 'you@example.com';
    if (passL) passL.placeholder = _authT('passMask');
    if (emailS) emailS.placeholder = 'you@example.com';
    if (passS) passS.placeholder = _authT('passwordMin');
    if (emailR) emailR.placeholder = 'you@example.com';
  };

  window._authToggleLanguage = function () {
    if (typeof toggleLanguage === 'function') {
      toggleLanguage();
      return;
    }
    const next = _authLang() === 'ar' ? 'en' : 'ar';
    localStorage.setItem('forge_lang', next);
    window._authApplyLanguage();
  };

  window._authApplyLanguage();

  // â”€â”€ Tab switching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window._authSwitchTab = function (tab) {
    document.getElementById('auth-form-login').style.display  = tab === 'login'  ? '' : 'none';
    document.getElementById('auth-form-signup').style.display = tab === 'signup' ? '' : 'none';
    document.getElementById('auth-form-forgot').style.display = tab === 'forgot' ? '' : 'none';
    if (typeof window._authApplyLanguage === 'function') window._authApplyLanguage();
    _authClearAllErrors();
  };

  // â”€â”€ Error / success helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  function _authSetUpdateLoading(loading) {
    document.querySelectorAll('.auth-update-btn').forEach(btn => { btn.disabled = loading; });
  }

  // â”€â”€ Show / Hide overlay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window._authShowOverlay = function () {
    const el = document.getElementById('forge-auth');
    if (el) el.style.removeProperty('display');
  };
  window._authHideOverlay = function () {
    const el = document.getElementById('forge-auth');
    if (el) el.style.setProperty('display', 'none', 'important');
  };

  // â”€â”€ Login â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window._authLogin = async function () {
    if (!window._sb) { _authShowError('auth-error-login', _authT('errSupabase')); return; }
    const email = document.getElementById('auth-email-l')?.value.trim();
    const pass  = document.getElementById('auth-pass-l')?.value;
    if (!email || !pass) { _authShowError('auth-error-login', _authT('errFill')); return; }
    _authClearAllErrors();
    _authSetLoading('auth-btn-login', true);
    try {
      const { data, error } = await window._sb.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      _authHideOverlay();
      if (typeof window._authSuccess === 'function') window._authSuccess(data.session);
    } catch (e) {
      _authShowError('auth-error-login', e.message || _authT('errLogin'));
    } finally {
      _authSetLoading('auth-btn-login', false);
    }
  };

  // â”€â”€ Sign Up â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window._authSignup = async function () {
    if (!window._sb) { _authShowError('auth-error-signup', _authT('errSupabase')); return; }
    const email = document.getElementById('auth-email-s')?.value.trim();
    const pass  = document.getElementById('auth-pass-s')?.value;
    if (!email || !pass) { _authShowError('auth-error-signup', _authT('errFill')); return; }
    if (pass.length < 6) { _authShowError('auth-error-signup', _authT('errPassLen')); return; }
    _authClearAllErrors();
    _authSetLoading('auth-btn-signup', true);
    try {
      const { data, error } = await window._sb.auth.signUp({ email, password: pass });
      if (error) throw error;
      if (data.session) {
        _authHideOverlay();
        if (typeof window._authSuccess === 'function') window._authSuccess(data.session, true);
      } else {
        _authShowError('auth-error-signup', _authT('msgConfirmEmail'));
        _authSwitchTab('login');
      }
    } catch (e) {
      _authShowError('auth-error-signup', e.message || _authT('errSignup'));
    } finally {
      _authSetLoading('auth-btn-signup', false);
    }
  };

  // â”€â”€ Forgot Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window._authResetPassword = async function () {
    if (!window._sb) { _authShowError('auth-error-forgot', _authT('errSupabase')); return; }
    const email = document.getElementById('auth-email-r')?.value.trim();
    if (!email) { _authShowError('auth-error-forgot', _authT('errEnterEmail')); return; }
    _authClearAllErrors();
    _authSetLoading('auth-btn-reset', true);
    try {
      const { error } = await window._sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });
      if (error) throw error;
      _authShowSuccess('auth-success-forgot', _authT('msgResetSent'));
      document.getElementById('auth-email-r').value = '';
    } catch (e) {
      _authShowError('auth-error-forgot', e.message || _authT('errReset'));
    } finally {
      _authSetLoading('auth-btn-reset', false);
    }
  };

  // â”€â”€ Guest mode â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  window._authGuestMode = function () {
    localStorage.setItem('forge_guest', '1');
    _authHideOverlay();
    if (typeof _onboardingCheck === 'function') _onboardingCheck();
  };

  // Force-update helper for stale mobile PWA caches before login
  window._authForceUpdate = async function () {
    _authClearAllErrors();
    _authShowSuccess('auth-success-forgot', _authT('msgUpdating'));
    _authSetUpdateLoading(true);
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.allSettled(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.allSettled(keys.map(k => caches.delete(k)));
      }
      // Keep user data, only force fresh network bootstrap
      const next = new URL(window.location.href);
      const stamp = String(Date.now());
      next.searchParams.set('refresh', stamp);
      next.searchParams.set('update', '1');
      window.location.replace(next.toString());
    } catch (e) {
      _authShowError('auth-error-login', (e && e.message) ? e.message : _authT('errUpdate'));
      _authSetUpdateLoading(false);
    }
  };

  // â”€â”€ Enter key support â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

