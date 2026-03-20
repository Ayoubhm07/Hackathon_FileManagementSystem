<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DocFlow — Créer un compte</title>
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
          Nouvelle inscription
        </div>
        <h1 class="hero-title">
          Rejoignez<br/>
          <span class="gradient-text">DocFlow.</span>
        </h1>
        <p class="hero-sub">
          Créez votre compte et accédez à la plateforme<br/>
          de gestion documentaire intelligente.
        </p>
        <div class="feature-list">
          <div class="feature-item">
            <div class="feature-dot feature-dot--indigo"></div>
            <span>Traitement OCR automatique</span>
          </div>
          <div class="feature-item">
            <div class="feature-dot feature-dot--cyan"></div>
            <span>Classification intelligente</span>
          </div>
          <div class="feature-item">
            <div class="feature-dot feature-dot--violet"></div>
            <span>Validation de conformité</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right: Form -->
    <div class="form-side">
      <div class="form-card form-card--register" id="form-card">

        <div class="form-logo">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">DocFlow</span>
        </div>

        <h2 class="form-title">Créer un compte</h2>
        <p class="form-subtitle">Complétez le formulaire pour commencer</p>

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

        <form id="kc-register-form" action="${url.registrationAction}" method="post">

          <!-- Name row: first + last side by side -->
          <div class="name-row">
            <div class="field-group">
              <div class="field-wrapper">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value="${(register.firstName!'')}"
                  autocomplete="given-name"
                  class="field-input"
                  placeholder=" "
                />
                <label for="firstName" class="field-label">Prénom</label>
              </div>
            </div>
            <div class="field-group">
              <div class="field-wrapper">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value="${(register.lastName!'')}"
                  autocomplete="family-name"
                  class="field-input"
                  placeholder=" "
                />
                <label for="lastName" class="field-label">Nom</label>
              </div>
            </div>
          </div>

          <!-- Email -->
          <div class="field-group">
            <div class="field-wrapper">
              <input
                id="email"
                name="email"
                type="email"
                value="${(register.email!'')}"
                autocomplete="email"
                class="field-input"
                placeholder=" "
              />
              <label for="email" class="field-label">Adresse email</label>
            </div>
          </div>

          <#if !realm.registrationEmailAsUsername>
            <div class="field-group">
              <div class="field-wrapper">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value="${(register.username!'')}"
                  autocomplete="username"
                  class="field-input"
                  placeholder=" "
                />
                <label for="username" class="field-label">Nom d'utilisateur</label>
              </div>
            </div>
          </#if>

          <#if passwordRequired??>
            <!-- Password -->
            <div class="field-group">
              <div class="field-wrapper">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autocomplete="new-password"
                  class="field-input"
                  placeholder=" "
                  id="password-new"
                />
                <label for="password" class="field-label">Mot de passe</label>
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
              <!-- Password strength indicator -->
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
            </div>
          </#if>

          <button type="submit" class="submit-btn" id="submit-btn">
            <span class="btn-text">Créer mon compte</span>
            <span class="btn-loader" style="display:none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Création…
            </span>
            <div class="btn-ripple" id="btn-ripple"></div>
          </button>

        </form>

        <p class="auth-switch-text">
          Déjà un compte ?
          <a href="${url.loginUrl}" class="auth-switch-link">Se connecter</a>
        </p>

        <div class="form-footer">
          <span class="security-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            Inscription sécurisée · DocFlow v2
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
    makeEyeToggle('eye-toggle-1', 'eye-open-1', 'eye-closed-1', 'password');
    makeEyeToggle('eye-toggle-2', 'eye-open-2', 'eye-closed-2', 'password-confirm');

    // Password strength
    const pwdInput = document.getElementById('password');
    const pwdBar   = document.getElementById('pwd-bar');
    const pwdHint  = document.getElementById('pwd-hint');
    if (pwdInput && pwdBar) {
      pwdInput.addEventListener('input', () => {
        const val = pwdInput.value;
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
        const level = levels[Math.max(0, score - 1)] || levels[0];
        pwdBar.style.width = val.length ? level.pct : '0%';
        pwdBar.style.background = level.color;
        pwdBar.style.boxShadow = val.length ? `0 0 8px ${level.color}60` : 'none';
        pwdHint.textContent = val.length ? level.label : '';
        pwdHint.style.color = level.color;
      });
    }

    // Submit loading state
    const form    = document.getElementById('kc-register-form');
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
