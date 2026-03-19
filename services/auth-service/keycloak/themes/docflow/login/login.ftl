<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DocFlow — Connexion</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="${url.resourcesPath}/css/login.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>

  <!-- 3D Canvas Background -->
  <canvas id="neural-canvas"></canvas>

  <!-- Noise overlay -->
  <div class="noise-overlay"></div>

  <!-- Main layout -->
  <div class="login-layout">

    <!-- Left: 3D Hero -->
    <div class="hero-side">
      <div class="hero-content">
        <div class="brand-badge">
          <span class="brand-dot"></span>
          Intelligence Documentaire
        </div>
        <h1 class="hero-title">
          Documents.<br/>
          <span class="gradient-text">Intelligents.</span>
        </h1>
        <p class="hero-sub">
          Traitement automatique, extraction et validation<br/>
          de vos documents administratifs français.
        </p>
        <div class="pipeline-preview">
          <div class="pipe-step active">OCR</div>
          <div class="pipe-line"></div>
          <div class="pipe-step">Classif.</div>
          <div class="pipe-line"></div>
          <div class="pipe-step">Extraction</div>
          <div class="pipe-line"></div>
          <div class="pipe-step">Validation</div>
        </div>
      </div>
    </div>

    <!-- Right: Form -->
    <div class="form-side">
      <div class="form-card" id="form-card">

        <!-- Logo -->
        <div class="form-logo">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">DocFlow</span>
        </div>

        <h2 class="form-title">Connexion</h2>
        <p class="form-subtitle">Accédez à votre espace de travail</p>

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

        <form id="kc-form-login" action="${url.loginAction}" method="post">

          <div class="field-group">
            <div class="field-wrapper">
              <input
                id="username"
                name="username"
                type="text"
                value="${(login.username!'')}"
                autocomplete="username"
                class="field-input"
                placeholder=" "
                <#if usernameEditDisabled??>disabled</#if>
              />
              <label for="username" class="field-label">
                <#if !realm.loginWithEmailAllowed>Nom d'utilisateur
                <#elseif !realm.registrationEmailAsUsername>Email ou nom d'utilisateur
                <#else>Adresse email</#if>
              </label>
              <div class="field-border"></div>
            </div>
          </div>

          <div class="field-group">
            <div class="field-wrapper">
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                class="field-input"
                placeholder=" "
              />
              <label for="password" class="field-label">Mot de passe</label>
              <div class="field-border"></div>
              <button type="button" class="eye-toggle" id="eye-toggle" aria-label="Afficher le mot de passe">
                <svg id="eye-open" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg id="eye-closed" width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:none">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>

          <#if realm.rememberMe?? && !usernameEditDisabled??>
            <div class="remember-row">
              <label class="checkbox-label">
                <input type="checkbox" name="rememberMe" class="checkbox-input" <#if login.rememberMe??>checked</#if>/>
                <span class="checkbox-custom">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                Rester connecté
              </label>
              <#if realm.resetPasswordAllowed>
                <a href="${url.loginResetCredentialsUrl}" class="forgot-link">Mot de passe oublié ?</a>
              </#if>
            </div>
          </#if>

          <button type="submit" class="submit-btn" id="submit-btn">
            <span class="btn-text">Se connecter</span>
            <span class="btn-loader" style="display:none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </span>
            <div class="btn-ripple" id="btn-ripple"></div>
          </button>

        </form>

        <#if realm.registrationAllowed?? && realm.registrationAllowed>
          <p class="register-text">
            Pas encore de compte ?
            <a href="${url.registrationUrl}" class="register-link">Créer un compte</a>
          </p>
        </#if>

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
    // Password toggle
    const toggle = document.getElementById('eye-toggle');
    const pwdInput = document.getElementById('password');
    const eyeOpen = document.getElementById('eye-open');
    const eyeClosed = document.getElementById('eye-closed');
    toggle.addEventListener('click', () => {
      const isHidden = pwdInput.type === 'password';
      pwdInput.type = isHidden ? 'text' : 'password';
      eyeOpen.style.display = isHidden ? 'none' : 'block';
      eyeClosed.style.display = isHidden ? 'block' : 'none';
    });

    // Submit loading state + ripple
    const form = document.getElementById('kc-form-login');
    const btn = document.getElementById('submit-btn');
    const btnText = btn.querySelector('.btn-text');
    const btnLoader = btn.querySelector('.btn-loader');
    const ripple = document.getElementById('btn-ripple');
    btn.addEventListener('click', function(e) {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      ripple.style.cssText = `left:${x}px;top:${y}px;width:0;height:0;opacity:0.3`;
      ripple.offsetWidth;
      ripple.style.cssText += `;width:300px;height:300px;margin-left:-150px;margin-top:-150px;opacity:0;transition:all 0.6s`;
    });
    form.addEventListener('submit', () => {
      btnText.style.display = 'none';
      btnLoader.style.display = 'flex';
      btn.disabled = true;
    });

    // Card entrance animation
    const card = document.getElementById('form-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(24px)';
    requestAnimationFrame(() => {
      card.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
  </#noparse></script>
</body>
</html>
