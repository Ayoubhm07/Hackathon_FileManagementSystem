<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>DocFlow — Information</title>
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

    <div class="hero-side">
      <div class="hero-content">
        <div class="brand-badge">
          <span class="brand-dot"></span>
          DocFlow Secure
        </div>
        <h1 class="hero-title">
          Documents.<br/>
          <span class="gradient-text">Intelligents.</span>
        </h1>
        <p class="hero-sub">
          Traitement automatique, extraction et validation<br/>
          de vos documents administratifs français.
        </p>
      </div>
    </div>

    <div class="form-side">
      <div class="form-card info-card" id="form-card">

        <div class="form-logo">
          <div class="logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="logo-text">DocFlow</span>
        </div>

        <#if message?has_content>
          <#if message.type == 'success'>
            <div class="page-icon-wrap">
              <div class="page-icon page-icon--success">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 class="form-title info-title--success">C'est envoyé !</h2>
          <#elseif message.type == 'error'>
            <div class="page-icon-wrap">
              <div class="page-icon page-icon--error">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
            <h2 class="form-title">Une erreur est survenue</h2>
          <#else>
            <div class="page-icon-wrap">
              <div class="page-icon page-icon--indigo">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </div>
            <h2 class="form-title">Information</h2>
          </#if>

          <p class="info-message">${message.summary}</p>
        </#if>

        <#if actionUri?has_content>
          <a href="${actionUri}" class="submit-btn" style="display:flex;text-decoration:none;margin-top:1.5rem;">
            <span>Continuer</span>
          </a>
        <#else>
          <a href="${url.loginUrl}" class="submit-btn" style="display:flex;text-decoration:none;margin-top:1.5rem;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right:6px">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Retour à la connexion
          </a>
        </#if>

        <div class="form-footer" style="margin-top:1.5rem">
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
    const card = document.getElementById('form-card');
    card.style.opacity = '0';
    card.style.transform = 'scale(0.96) translateY(16px)';
    requestAnimationFrame(() => {
      card.style.transition = 'opacity 0.65s cubic-bezier(0.16,1,0.3,1), transform 0.65s cubic-bezier(0.16,1,0.3,1)';
      card.style.opacity = '1';
      card.style.transform = 'scale(1) translateY(0)';
    });
  </#noparse></script>
</body>
</html>
