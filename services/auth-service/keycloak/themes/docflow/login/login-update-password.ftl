<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DocFlow — Nouveau mot de passe</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>

  <canvas id="neural-canvas"></canvas>
  <div class="noise-overlay"></div>

  <div class="login-layout">

    <!-- Left: Hero -->
    <div class="hero-side">
      <div class="hero-content">
        <div class="brand-badge">
          <span class="brand-dot"></span>
          Sécurité du compte
        </div>
        <h1 class="hero-title">
          Nouveau<br/>
          <span class="gradient-text">mot de passe.</span>
        </h1>
        <p class="hero-sub">
          Choisissez un mot de passe fort pour<br/>
          sécuriser votre compte DocFlow.
        </p>
        <div class="pwd-tips">
          <p class="pwd-tips-title">Conseils de sécurité</p>
          <div class="pwd-tip">
            <span class="pwd-tip-check">✓</span>
            Au moins 8 caractères
          </div>
          <div class="pwd-tip">
            <span class="pwd-tip-check">✓</span>
            Majuscules et minuscules
          </div>
          <div class="pwd-tip">
            <span class="pwd-tip-check">✓</span>
            Chiffres et caractères spéciaux
          </div>
          <div class="pwd-tip">
            <span class="pwd-tip-check">✓</span>
            Différent de l'ancien mot de passe
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Form -->
    <div class="form-side">
      <div class="form-card" id="form-card">

        <div class="form-logo">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">DocFlow</span>
        </div>

        <div class="page-icon-wrap">
          <div class="page-icon page-icon--success">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <h2 class="form-title">Nouveau mot de passe</h2>
        <p class="form-subtitle">Choisissez un mot de passe sécurisé pour votre compte</p>

        <#if message?has_content>
          <div class="alert alert-${message.type}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="alert-icon">
              <#if message.type == 'error'>
                <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <#else>
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </#if>
            </svg>
            ${message.summary}
          </div>
        </#if>

        <form id="kc-update-pwd-form" action="${url.loginAction}" method="post">

          <!-- New password -->
          <div class="field-group">
            <div class="field-wrapper">
              <input
                id="password-new"
                name="password-new"
                type="password"
                autocomplete="new-password"
                class="field-input"
                placeholder=" "
                autofocus
              />
              <label for="password-new" class="field-label">Nouveau mot de passe</label>
              <button type="button" class="eye-toggle" id="eye-toggle-1" aria-label="Afficher">
                <svg id="eye-open-1" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg id="eye-closed-1" width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="pwd-strength" id="pwd-strength">
              <div class="pwd-strength-bar" id="pwd-bar"></div>
            </div>
            <p class="pwd-hint" id="pwd-hint"></p>
          </div>

          <!-- Confirm password -->
          <div class="field-group">
            <div class="field-wrapper">
              <input
                id="password-confirm"
                name="password-confirm"
                type="password"
                autocomplete="new-password"
                class="field-input"
                placeholder=" "
              />
              <label for="password-confirm" class="field-label">Confirmer le mot de passe</label>
              <button type="button" class="eye-toggle" id="eye-toggle-2" aria-label="Afficher">
                <svg id="eye-open-2" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg id="eye-closed-2" width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <!-- Match indicator -->
            <p class="pwd-match" id="pwd-match"></p>
          </div>

          <button type="submit" class="submit-btn" id="submit-btn">
            <span class="btn-text">Mettre à jour</span>
            <span class="btn-loader" style="display:none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Mise à jour…
            </span>
            <div class="btn-ripple" id="btn-ripple"></div>
          </button>

        </form>

        <div class="form-footer">
          <span class="security-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            Connexion sécurisée · DocFlow v2
          </span>
        </div>
      </div>
    </div>
  </div>

  <script src="${url.resourcesPath}/js/three-scene.js"></script>
  <script><#noparse>
    // Eye toggles
    function makeEyeToggle(toggleId, openId, closedId, inputId) {
      const toggle = document.getElementById(toggleId);
      const input  = document.getElementById(inputId);
      const open   = document.getElementById(openId);
      const closed = document.getElementById(closedId);
      if (!toggle || !input) return;
      toggle.addEventListener('click', () => {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        open.style.display   = isHidden ? 'none'  : 'block';
        closed.style.display = isHidden ? 'block' : 'none';
      });
    }
    makeEyeToggle('eye-toggle-1', 'eye-open-1', 'eye-closed-1', 'password-new');
    makeEyeToggle('eye-toggle-2', 'eye-open-2', 'eye-closed-2', 'password-confirm');

    // Password strength
    const newPwd = document.getElementById('password-new');
    const pwdBar = document.getElementById('pwd-bar');
    const pwdHint = document.getElementById('pwd-hint');
    const confPwd = document.getElementById('password-confirm');
    const pwdMatch = document.getElementById('pwd-match');

    function checkStrength(val) {
      let score = 0;
      if (val.length >= 8)  score++;
      if (val.length >= 12) score++;
      if (/[A-Z]/.test(val)) score++;
      if (/[0-9]/.test(val)) score++;
      if (/[^A-Za-z0-9]/.test(val)) score++;
      const levels = [
        { pct: '20%',  color: '#EF4444', label: 'Très faible' },
        { pct: '40%',  color: '#F97316', label: 'Faible' },
        { pct: '60%',  color: '#F59E0B', label: 'Moyen' },
        { pct: '80%',  color: '#10B981', label: 'Fort' },
        { pct: '100%', color: '#06B6D4', label: 'Très fort' },
      ];
      return levels[Math.max(0, score - 1)] || levels[0];
    }

    if (newPwd && pwdBar) {
      newPwd.addEventListener('input', () => {
        const level = checkStrength(newPwd.value);
        pwdBar.style.width = newPwd.value ? level.pct : '0%';
        pwdBar.style.background = level.color;
        pwdBar.style.boxShadow = newPwd.value ? `0 0 8px ${level.color}60` : 'none';
        pwdHint.textContent = newPwd.value ? level.label : '';
        pwdHint.style.color = level.color;
        checkMatch();
      });
    }

    function checkMatch() {
      if (!confPwd.value) { pwdMatch.textContent = ''; return; }
      if (newPwd.value === confPwd.value) {
        pwdMatch.textContent = '✓ Les mots de passe correspondent';
        pwdMatch.style.color = '#10B981';
      } else {
        pwdMatch.textContent = '✗ Les mots de passe ne correspondent pas';
        pwdMatch.style.color = '#EF4444';
      }
    }
    if (confPwd) confPwd.addEventListener('input', checkMatch);

    // Submit loading state
    const form    = document.getElementById('kc-update-pwd-form');
    const btn     = document.getElementById('submit-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    const ripple  = document.getElementById('btn-ripple');
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      ripple.style.cssText = `left:${x}px;top:${y}px;width:0;height:0;opacity:0.3`;
      ripple.offsetWidth;
      ripple.style.cssText += `;width:300px;height:300px;margin-left:-150px;margin-top:-150px;opacity:0;transition:all 0.6s`;
    });
    form.addEventListener('submit', () => {
      btnText.style.display   = 'none';
      btnLoader.style.display = 'flex';
      btn.disabled = true;
    });

    // Card entrance
    const card = document.getElementById('form-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(28px)';
    requestAnimationFrame(() => {
      card.style.transition = 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  </#noparse></script>
</body>
</html>
