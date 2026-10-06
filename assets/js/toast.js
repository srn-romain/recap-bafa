/**
 * Système de Notifications Toasters et Gestion des Erreurs Bloquantes
 * Recap-BAFA
 */
(function () {
  'use strict';

  // Configuration par défaut
  const CONFIG = {
    containerId: 'toast-container',
    backdropId: 'toast-blocking-backdrop',
    defaultDuration: {
      success: 4000,
      info: 5000,
      warning: 6000,
      error: 7000,
      blocking: 9000
    },
    adminEmail: 'contact@recap-bafa.fr',
    contactAdminText: "Veuillez contacter l'administrateur."
  };

  let toastContainer = null;
  let blockingBackdrop = null;
  let activeBlockingCount = 0;
  const recentErrors = new Set(); // Pour dédupliquer les erreurs répétitives

  /**
   * Initialise ou récupère le conteneur DOM des toasts
   */
  function ensureToastContainer() {
    if (!toastContainer || !document.body.contains(toastContainer)) {
      toastContainer = document.getElementById(CONFIG.containerId);
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = CONFIG.containerId;
        toastContainer.setAttribute('aria-live', 'polite');
        document.body.appendChild(toastContainer);
      }
    }

    if (!blockingBackdrop || !document.body.contains(blockingBackdrop)) {
      blockingBackdrop = document.getElementById(CONFIG.backdropId);
      if (!blockingBackdrop) {
        blockingBackdrop = document.createElement('div');
        blockingBackdrop.id = CONFIG.backdropId;
        blockingBackdrop.className = 'toast-blocking-backdrop';
        document.body.appendChild(blockingBackdrop);
      }
    }

    return { container: toastContainer, backdrop: blockingBackdrop };
  }

  /**
   * Active ou désactive l'état bloquant de l'interface
   */
  function updateBlockingState(delta) {
    activeBlockingCount = Math.max(0, activeBlockingCount + delta);
    const { backdrop } = ensureToastContainer();
    if (activeBlockingCount > 0) {
      backdrop.classList.add('active');
      document.body.classList.add('modal-open');
    } else {
      backdrop.classList.remove('active');
      // Ne retire modal-open que si aucune autre modale standard n'est ouverte
      const openModals = document.querySelectorAll('.modal[style*="display: flex"], .modal[style*="display: block"]');
      if (openModals.length === 0) {
        document.body.classList.remove('modal-open');
      }
    }
  }

  /**
   * Retourne l'icône HTML associée au type de toast
   */
  function getToastIcon(type, isBlocking) {
    if (isBlocking) {
      return '<i class="bi bi-exclamation-triangle-fill"></i>';
    }
    switch (type) {
      case 'success':
        return '<i class="bi bi-check-circle-fill"></i>';
      case 'info':
        return '<i class="bi bi-info-circle-fill"></i>';
      case 'warning':
        return '<i class="bi bi-exclamation-circle-fill"></i>';
      case 'error':
        return '<i class="bi bi-x-circle-fill"></i>';
      default:
        return '<i class="bi bi-bell-fill"></i>';
    }
  }

  /**
   * Retourne le titre par défaut pour chaque type
   */
  function getDefaultTitle(type, isBlocking) {
    if (isBlocking) {
      return 'Erreur bloquante détectée';
    }
    switch (type) {
      case 'success':
        return 'Succès';
      case 'info':
        return 'Information';
      case 'warning':
        return 'Attention';
      case 'error':
        return 'Erreur';
      default:
        return 'Notification';
    }
  }

  /**
   * Fonction principale d'affichage de toast
   * @param {Object|string} options Options ou message texte
   * @param {string} [type='info'] Type de toast si options est une chaîne
   * @param {number} [customDuration] Durée en ms si options est une chaîne
   */
  function showToast(options, type = 'info', customDuration = null) {
    let opts = {};

    if (typeof options === 'string') {
      opts = {
        message: options,
        type: type || 'info',
        duration: customDuration
      };
    } else if (typeof options === 'object' && options !== null) {
      opts = { ...options };
    }

    const toastType = opts.type || 'info';
    const isBlocking = Boolean(opts.isBlocking || toastType === 'blocking');
    const actualType = isBlocking ? 'blocking' : toastType;
    const title = opts.title || getDefaultTitle(actualType, isBlocking);
    const duration = typeof opts.duration === 'number'
      ? opts.duration
      : (CONFIG.defaultDuration[actualType] || 4500);

    const contactAdmin = opts.contactAdmin !== undefined
      ? opts.contactAdmin
      : isBlocking; // Par défaut obligatoire pour les erreurs bloquantes

    const { container } = ensureToastContainer();

    // Création de l'élément toast
    const toastEl = document.createElement('div');
    toastEl.className = `toast-item toast-${actualType}`;
    toastEl.setAttribute('role', isBlocking ? 'alertdialog' : 'status');

    let contactAdminHtml = '';
    if (contactAdmin) {
      const contactText = typeof contactAdmin === 'string' ? contactAdmin : CONFIG.contactAdminText;
      contactAdminHtml = `
        <div class="toast-contact-admin">
          <i class="bi bi-headset"></i>
          <span>${contactText}</span>
        </div>
      `;
    }

    const messageHtml = opts.allowHtml ? opts.message : String(opts.message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    toastEl.innerHTML = `
      <div class="toast-body">
        <div class="toast-icon-wrapper">
          ${getToastIcon(actualType, isBlocking)}
        </div>
        <div class="toast-content">
          <div class="toast-title">${title}</div>
          <p class="toast-message">${messageHtml}</p>
          ${contactAdminHtml}
        </div>
        <button type="button" class="toast-close-btn" aria-label="Fermer la notification">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="toast-progress">
        <div class="toast-progress-bar"></div>
      </div>
    `;

    // Gestion du blocage utilisateur
    if (isBlocking) {
      updateBlockingState(1);
    }

    container.appendChild(toastEl);

    // Déclencher l'animation d'entrée
    requestAnimationFrame(() => {
      toastEl.classList.add('toast-show');
    });

    // Gestion du timer et de la barre de progression horizontale
    const progressBar = toastEl.querySelector('.toast-progress-bar');
    let startTime = Date.now();
    let remainingTime = duration;
    let timerId = null;
    let isPaused = false;
    let isClosed = false;

    function startTimer() {
      if (progressBar) {
        // Laisser un micro-délai pour que le navigateur prenne en compte l'état initial
        requestAnimationFrame(() => {
          if (!isPaused && !isClosed) {
            progressBar.style.transition = `transform ${remainingTime}ms linear`;
            progressBar.style.transform = 'scaleX(0)';
          }
        });
      }

      startTime = Date.now();
      timerId = setTimeout(() => {
        closeToast();
      }, remainingTime);
    }

    function pauseTimer() {
      if (isPaused || isClosed) return;
      isPaused = true;
      clearTimeout(timerId);

      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, remainingTime - elapsed);

      if (progressBar) {
        const computedStyle = window.getComputedStyle(progressBar);
        const transformMatrix = computedStyle.transform;
        progressBar.style.transition = 'none';
        progressBar.style.transform = transformMatrix;
      }
    }

    function resumeTimer() {
      if (!isPaused || isClosed) return;
      isPaused = false;
      startTimer();
    }

    function closeToast() {
      if (isClosed) return;
      isClosed = true;
      clearTimeout(timerId);

      toastEl.classList.remove('toast-show');
      toastEl.classList.add('toast-hide');

      if (isBlocking) {
        updateBlockingState(-1);
      }

      setTimeout(() => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
        if (typeof opts.onClose === 'function') {
          opts.onClose();
        }
      }, 350);
    }

    // Pause au survol (sauf si utilisateur clique dessus)
    toastEl.addEventListener('mouseenter', pauseTimer);
    toastEl.addEventListener('mouseleave', resumeTimer);

    // Bouton de fermeture
    const closeBtn = toastEl.querySelector('.toast-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeToast();
      });
    }

    // Démarrer la durée d'affichage
    startTimer();

    return {
      close: closeToast,
      element: toastEl
    };
  }

  /**
   * Affiche un toast d'erreur bloquante (warning rouge bloquant l'utilisateur)
   */
  function showBlockingErrorToast(message, duration = null) {
    const errorMsg = message || "Une erreur bloquante inattendue est survenue.";
    return showToast({
      title: 'Attention - Erreur bloquante',
      message: errorMsg,
      type: 'blocking',
      isBlocking: true,
      duration: duration || CONFIG.defaultDuration.blocking,
      contactAdmin: CONFIG.contactAdminText
    });
  }

  // Fonctions de commodité globales
  window.showToast = showToast;
  window.showSuccessToast = (msg, dur) => showToast(msg, 'success', dur);
  window.showInfoToast = (msg, dur) => showToast(msg, 'info', dur);
  window.showWarningToast = (msg, dur) => showToast(msg, 'warning', dur);
  window.showErrorToast = (msg, dur) => showToast(msg, 'error', dur);
  window.showBlockingErrorToast = showBlockingErrorToast;
  window.showBlockingError = showBlockingErrorToast;

  // Objet de gestion complet Toast
  window.Toast = {
    show: showToast,
    success: (msg, dur) => showToast(msg, 'success', dur),
    info: (msg, dur) => showToast(msg, 'info', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    error: (msg, dur) => showToast(msg, 'error', dur),
    blocking: showBlockingErrorToast
  };

  /**
   * Filtrage des erreurs anodines / bruit externe
   */
  function isBenignError(msg, source) {
    if (!msg) return true;
    const lowerMsg = String(msg).toLowerCase();
    const lowerSource = String(source || '').toLowerCase();

    // Extensions Chrome / Firefox
    if (lowerSource.includes('chrome-extension://') || lowerSource.includes('moz-extension://')) {
      return true;
    }
    // ResizeObserver loop limit exceeded
    if (lowerMsg.includes('resizeobserver') || lowerMsg.includes('script error.')) {
      return true;
    }
    // Erreurs réseau 404 sur les favicons ou images non critiques déjà gérées avec fallback
    if (lowerMsg.includes('favicon.ico') || lowerMsg.includes('no-img.jpg')) {
      return true;
    }
    return false;
  }

  /**
   * Intercepteur d'erreurs globales (Window Error)
   */
  window.addEventListener('error', function (event) {
    const errorMsg = event.message || (event.error && event.error.message) || 'Erreur inconnue';
    const source = event.filename || '';

    if (isBenignError(errorMsg, source)) return;

    // Déduplication (éviter les rafales de toasts identiques)
    const errorKey = `${errorMsg}:${source}`;
    if (recentErrors.has(errorKey)) return;
    recentErrors.add(errorKey);
    setTimeout(() => recentErrors.delete(errorKey), 5000);

    showBlockingErrorToast(`Erreur d'exécution : ${errorMsg}`);
  });

  /**
   * Intercepteur de promesses rejetées non capturées (Unhandled Promise Rejections)
   */
  window.addEventListener('unhandledrejection', function (event) {
    const reason = event.reason;
    let errorMsg = 'Promesse non gérée';

    if (reason) {
      if (typeof reason === 'string') {
        errorMsg = reason;
      } else if (reason.message) {
        errorMsg = reason.message;
      } else if (reason.code) {
        errorMsg = `Code: ${reason.code}`;
      }
    }

    if (isBenignError(errorMsg, '')) return;

    const errorKey = `unhandledrejection:${errorMsg}`;
    if (recentErrors.has(errorKey)) return;
    recentErrors.add(errorKey);
    setTimeout(() => recentErrors.delete(errorKey), 5000);

    showBlockingErrorToast(`Erreur asynchrone : ${errorMsg}`);
  });

  /**
   * Intercepteur sécurisé de console.error pour capturer les erreurs critiques
   */
  const originalConsoleError = console.error;
  console.error = function (...args) {
    try {
      // Appeler d'abord le console.error natif pour préserver les logs dans la console devtools
      originalConsoleError.apply(console, args);

      // Vérifier si le message correspond à une erreur critique explicite à remonter
      const firstArg = args[0];
      let msg = '';
      if (firstArg instanceof Error) {
        msg = firstArg.message;
      } else if (typeof firstArg === 'string') {
        msg = args.map(a => (typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a))).join(' ');
      }

      // Si le message contient "Erreur critique" ou "[CRITICAL]" ou "Permission denied" ou Firebase quota
      const isCritical = msg && (
        msg.toLowerCase().includes('erreur critique') ||
        msg.toLowerCase().includes('critical error') ||
        msg.toLowerCase().includes('permission-denied') ||
        msg.toLowerCase().includes('quota exceeded')
      );

      if (isCritical && !isBenignError(msg, '')) {
        const errorKey = `console.error:${msg}`;
        if (!recentErrors.has(errorKey)) {
          recentErrors.add(errorKey);
          setTimeout(() => recentErrors.delete(errorKey), 5000);
          showBlockingErrorToast(`Erreur système : ${msg}`);
        }
      }
    } catch (e) {
      // Ne jamais faire planter le navigateur dans l'intercepteur de logs
    }
  };

})();
