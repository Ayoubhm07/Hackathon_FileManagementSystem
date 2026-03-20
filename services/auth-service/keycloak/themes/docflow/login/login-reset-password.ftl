<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DocFlow — Mot de passe oublié</title>
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
          Réinitialisation sécurisée
        </div>
        <h1 class="hero-title">
          Retrouvez<br/>
          <span class="gradient-text">l'accès.</span>
        </h1>
        <p class="hero-sub">
          Entrez votre adresse email et nous vous<br/>
          enverrons un lien de réinitialisation sécurisé.
        </p>
        <div class="info-steps">
          <div class="info-step">
            <div class="info-step-num">1</div>
            <span>Saisissez votre email</span>
          </div>
          <div class="info-step-connector"></div>
          <div class="info-step">
            <div class="info-step-num">2</div>
            <span>Vérifiez votre boîte mail</span>
          </div>
          <div class="info-step-connector"></div>
          <div class="info-step">
            <div class="info-step-num">3</div>
            <span>Choisissez un nouveau mot de passe</span>
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

        <!-- Icon -->
        <div class="page-icon-wrap">
          <div class="page-icon page-icon--indigo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <h2 class="form-title">Mot de passe oublié ?</h2>
        <p class="form-subtitle">Entrez votre email pour recevoir un lien de réinitialisation</p>

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

        <form id="kc-reset-form" action="${url.loginAction}" method="post">

          <div class="field-group">
            <div class="field-wrapper">
              <input
                id="username"
                name="username"
                type="text"
                autocomplete="email"
                class="field-input"
                placeholder=" "
                autofocus
              />
              <label for="username" class="field-label">
                <#if realm.loginWithEmailAllowed && realm.registrationEmailAsUsername>Adresse email
                <#else>Email ou nom d'utilisateur</#if>
              </label>
            </div>
          </div>

          <button type="submit" class="submit-btn" id="submit-btn">
            <span class="btn-text">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="display:inline-block;vertical-align:middle;margin-right:6px">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" stroke-width="2"/>
                <polyline points="22,6 12,13 2,6" stroke="currentColor" stroke-width="2"/>
              </svg>
              Envoyer le lien
            </span>
            <span class="btn-loader" style="display:none">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Envoi…
            </span>
            <div class="btn-ripple" id="btn-ripple"></div>
          </button>

        </form>

        <p class="auth-switch-text">
          <a href="${url.loginUrl}" class="auth-back-link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="display:inline-block;vertical-align:middle;margin-right:4px">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Retour à la connexion
          </a>
        </p>

        <div class="form-footer">
          <span class="security-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            </svg>
            Lien expirant dans 15 minutes · DocFlow v2
          </span>
        </div>
      </div>
    </div>
  </div>

  <script src="${url.resourcesPath}/js/three-scene.js"></script>
  <script><#noparse>
    const form    = document.getElementById('kc-reset-form');
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
