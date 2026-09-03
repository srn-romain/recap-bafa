// Gestion de l'authentification Firebase
// Rôles : 'dirlo' (directeur) ou 'admin' (administrateur)
window.currentUser = null;
window.userRole = null;
window.authStateChecked = false;

console.log("Firebase Auth Script Loading...");

// Gérer la connexion avec Google
window.handleGoogleLogin = async function () {
  console.log("handleGoogleLogin called");
  hideAuthError();
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;

    // Vérifier si le document utilisateur existe déjà
    const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      // Extraire prénom et nom depuis le nom complet Google
      let firstName = "";
      let lastName = "";

      if (user.displayName) {
        const cleanName = user.displayName.trim().replace(/\s+/g, ' ');
        const parts = cleanName.split(' ');
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(' ') || "";
      }

      // Créer le document utilisateur initial
      await window.firebaseDb.collection('users').doc(user.uid).set({
        email: user.email,
        firstname: firstName,
        lastname: lastName,
        displayName: user.displayName || user.email,
        profilePic: user.photoURL || '',
        createdAt: new Date(),
        role: 'user',
        gender: null,
        publicVisibility: false,
        emailVisibility: false
      });
    } else {
      // Mettre à jour la date de dernière connexion et synchroniser la photo Google
      const updateData = { lastLogin: new Date() };
      if (user.photoURL) {
        updateData.profilePic = user.photoURL;
      }
      await window.firebaseDb.collection('users').doc(user.uid).update(updateData);
    }

    // Récupérer le rôle et mettre à jour l'état local
    await getUserRole(user);

    // Fermer la modale
    if (typeof closeAuthModal === 'function') closeAuthModal();

    // Rediriger vers le tableau de bord
    window.location.href = `dashboard.html?uid=${user.uid}`;

  } catch (error) {
    console.error("Erreur Google Login:", error);
    if (error.code !== 'auth/popup-closed-by-user') {
      showAuthError("Erreur lors de la connexion avec Google : " + (error.message || "Erreur inconnue"));
    }
  }
};

// Initialiser l'authentification
function initAuth() {
  if (!window.firebaseInitialized || !firebase.auth) {
    console.log("Firebase Auth non disponible");
    return;
  }

  // Écouter les changements d'état d'authentification
  firebase.auth().onAuthStateChanged(async (user) => {
    window.authStateChecked = true;
    if (user) {
      window.currentUser = user;

      // Mettre à jour la date de dernière connexion
      window.firebaseDb.collection('users').doc(user.uid).update({
        lastLogin: new Date()
      }).catch(err => console.error("Erreur update lastLogin", err));

      // Récupérer le rôle et le genre de l'utilisateur depuis Firestore
      await getUserRole(user);

      // Mettre à jour l'UI
      updateUI();

      // Recharger les données pour appliquer les paramètres utilisateur (genre, liens...)
      if (typeof loadDataFromFirebase === 'function') {
        loadDataFromFirebase();
      }
    } else {
      window.currentUser = null;
      window.userRole = null;
      window.userGender = null;
      window.userProfilePic = null;
      window.directorRequestStatus = null;
      document.body.classList.remove('user-logged-in');
      updateUI();

      // En cas de déconnexion sur un dashboard, on relance le chargement pour vérifier la confidentialité
      if (typeof loadDataFromFirebase === 'function') {
        loadDataFromFirebase();
      }
    }
  });
}

// Récupérer le rôle de l'utilisateur depuis Firestore
// Les documents sont identifiés par UID (ID du document)
async function getUserRole(user) {
  try {
    if (!user || !user.uid) {
      window.userRole = null;
      return;
    }

    // Chercher le document par UID (l'ID du document dans Firestore)
    const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();

    if (userDoc.exists) {
      const data = userDoc.data();
      window.userRole = data.role || null;
      window.userGender = data.gender || null; // Stocker le genre pour l'affichage
      window.userProfilePic = data.profilePic || null; // Stocker la photo de profil
      window.directorRequestStatus = data.directorRequestStatus || null; // Stocker l'état de la demande directeur
      console.log('Rôle récupéré:', window.userRole, 'Genre:', window.userGender, 'pour UID:', user.uid);
    } else {
      window.userRole = null;
      window.userGender = null;
      window.userProfilePic = null;
      console.log('Aucun document trouvé pour UID:', user.uid);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    window.userRole = null;
    window.userGender = null;
    window.userProfilePic = null;
  }
}

// Afficher un message d'erreur dans la modale d'authentification
function showAuthError(message) {
  const errorDiv = document.getElementById('auth-error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// Basculer entre connexion et inscription
window.toggleAuthMode = function () {
  const modeInput = document.getElementById('auth-mode');
  const title = document.querySelector('#auth-modal h2');
  const submitText = document.getElementById('auth-submit-text');
  const toggleText = document.getElementById('auth-toggle-text');
  const registerFields = document.getElementById('register-fields');
  const firstNameInput = document.getElementById('auth-firstname');
  const lastNameInput = document.getElementById('auth-lastname');

  if (modeInput.value === 'login') {
    // Passer en mode inscription
    modeInput.value = 'register';
    title.textContent = "Créer un compte";
    submitText.textContent = "Créer mon compte";
    toggleText.textContent = "Déjà un compte ? Se connecter";
    registerFields.style.display = 'block';
    firstNameInput.required = true;
    lastNameInput.required = true;

    // Afficher les critères et la mention de confidentialité immédiatement
    const privacyNotice = document.getElementById('auth-privacy-notice');
    if (privacyNotice) privacyNotice.style.display = 'block';

    const forgotPasswordLink = document.getElementById('forgot-password-link-container');
    if (forgotPasswordLink) forgotPasswordLink.style.display = 'none';

    setTimeout(updatePasswordStrengthUI, 0);
  } else {
    // Passer en mode connexion
    modeInput.value = 'login';
    title.textContent = "Connexion";
    submitText.textContent = "Se connecter";
    toggleText.textContent = "Pas encore de compte ? Créer un compte";
    registerFields.style.display = 'none';
    firstNameInput.required = false;
    lastNameInput.required = false;

    // Cacher la liste des critères et la mention de confidentialité en mode connexion
    const criteriaContainer = document.getElementById('password-criteria-container');
    const privacyNotice = document.getElementById('auth-privacy-notice');
    const forgotPasswordLink = document.getElementById('forgot-password-link-container');

    if (criteriaContainer) criteriaContainer.style.display = 'none';
    if (privacyNotice) privacyNotice.style.display = 'none';
    if (forgotPasswordLink) forgotPasswordLink.style.display = 'block';
  }
}

// Vérifier la force du mot de passe (Retourne le détail des critères)
function checkPasswordStrength(password) {
  if (!password) return {
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    isValid: false
  };

  const criteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  criteria.isValid = criteria.length && criteria.upper && criteria.lower && criteria.number && criteria.special;
  return criteria;
}

// Mettre à jour l'UI des critères de mot de passe
function updatePasswordStrengthUI() {
  const passwordInput = document.getElementById('login-password');
  const container = document.getElementById('password-criteria-container');
  const mode = document.getElementById('auth-mode').value;

  if (!passwordInput || !container) return;

  // Afficher seulement en mode inscription
  if (mode !== 'register') {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  const password = passwordInput.value || '';
  const results = checkPasswordStrength(password);

  updateCriterion('crit-length', results.length);
  updateCriterion('crit-upper', results.upper);
  updateCriterion('crit-lower', results.lower);
  updateCriterion('crit-number', results.number);
  updateCriterion('crit-special', results.special);
}

function updateCriterion(id, isValid) {
  const el = document.getElementById(id);
  if (!el) return;

  const icon = el.querySelector('i');

  if (isValid) {
    el.style.color = '#2ecc71'; // Vert
    el.style.fontWeight = 'bold';
    if (icon) {
      icon.className = 'bi bi-check-circle-fill';
    }
  } else {
    el.style.color = '#95a5a6'; // Gris
    el.style.fontWeight = 'normal';
    if (icon) {
      icon.className = 'bi bi-circle';
    }
  }
}

// Initialiser les écouteurs pour le mot de passe
document.addEventListener('DOMContentLoaded', () => {
  const pwdInput = document.getElementById('login-password');
  if (pwdInput) {
    pwdInput.addEventListener('input', updatePasswordStrengthUI);
  }
});

// Masquer le message d'erreur d'authentification
function hideAuthError() {
  const errorDiv = document.getElementById('auth-error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.style.backgroundColor = '';
    errorDiv.style.color = '';
    errorDiv.style.borderColor = '';
  }
}

// Afficher un message d'erreur dans le modal
function showAuthError(message) {
  const errorDiv = document.getElementById('auth-error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// Gérer la connexion ou l'inscription
window.handleLogin = async function (event) {
  if (event) {
    event.preventDefault();
  }

  // Masquer les erreurs précédentes
  hideAuthError();

  let email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const mode = document.getElementById('auth-mode') ? document.getElementById('auth-mode').value : 'login';

  if (!email || !password) {
    showAuthError('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  // Si l'identifiant contient 'dirlo', ajouter automatiquement '@gmail.com' (Legacy)
  if (email.toLowerCase().includes('dirlo') && !email.includes('@')) {
    email = email + '@gmail.com';
    document.getElementById('login-email').value = email;
  }

  try {
    let result;

    if (mode === 'register') {
      // Vérification stricte du mot de passe
      const securityCheck = checkPasswordStrength(password);
      if (!securityCheck.isValid) {
        showAuthError("Le mot de passe ne respecte pas tous les critères de sécurité.");
        return;
      }

      // Inscription
      // Inscription
      const firstName = document.getElementById('auth-firstname').value.trim().replace(/\\s+/g, ' ');
      const lastName = document.getElementById('auth-lastname').value.trim().replace(/\\s+/g, ' ');
      const linkedinInput = document.getElementById('auth-linkedin');
      const linkedin = linkedinInput ? linkedinInput.value : '';

      if (!firstName || !lastName) {
        showAuthError("Veuillez remplir votre nom et prénom.");
        return;
      }

      result = await firebase.auth().createUserWithEmailAndPassword(email, password);

      // Sauvegarder les infos supplémentaires
      await window.firebaseDb.collection('users').doc(result.user.uid).set({
        email: email,
        firstname: firstName,
        lastname: lastName,
        displayName: `${firstName} ${lastName}`,
        linkedin: linkedin || '',
        createdAt: new Date(),
        role: 'user'
      });

    } else {
      // Connexion standard
      result = await firebase.auth().signInWithEmailAndPassword(email, password);
    }

    // Récupérer le rôle (utile si connexion admin)
    await getUserRole(result.user);

    // Rediriger vers le tableau de bord personnalisé
    window.location.href = `dashboard.html?uid=${result.user.uid}`;

  } catch (error) {
    console.error("Erreur d'authentification:", error.code, error.message);

    let errorMessage = "Une erreur est survenue lors de l'authentification.";

    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      errorMessage = "Identifiant ou mot de passe incorrect.";
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = "Cet email est déjà utilisé par un autre compte.";
    } else if (error.code === 'auth/weak-password') {
      errorMessage = "Le mot de passe doit contenir au moins 6 caractères.";
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = "Format d'email invalide.";
    }

    showAuthError(errorMessage);
  }
}

/**
 * Gère la réinitialisation du mot de passe depuis la modale d'authentification
 */
async function handleForgotPassword() {
  const emailInput = document.getElementById('login-email');
  const email = emailInput ? emailInput.value.trim() : "";
  const errorDiv = document.getElementById('auth-error-message');

  if (!email) {
    showAuthError("Veuillez saisir votre adresse email dans le champ ci-dessus pour réinitialiser votre mot de passe.");
    if (emailInput) emailInput.focus();
    return;
  }

  try {
    hideAuthError();
    await firebase.auth().sendPasswordResetEmail(email);

    // Afficher un message de succès
    if (errorDiv) {
      errorDiv.innerHTML = `<i class="bi bi-check-circle-fill"></i> Email de réinitialisation envoyé à <strong>${email}</strong> ! Vérifiez vos spams.`;
      errorDiv.style.display = 'block';
      errorDiv.style.backgroundColor = '#d4edda';
      errorDiv.style.color = '#155724';
      errorDiv.style.borderColor = '#c3e6cb';

      // Remettre le style par défaut après 10 secondes ou si on reclique
      setTimeout(() => {
        if (errorDiv.style.backgroundColor === 'rgb(212, 237, 218)') { // #d4edda in RGB
          errorDiv.style.display = 'none';
          errorDiv.style.backgroundColor = '';
          errorDiv.style.color = '';
          errorDiv.style.borderColor = '';
        }
      }, 10000);
    }
  } catch (error) {
    console.error("Erreur Forgot Password:", error);
    let message = "Erreur lors de l'envoi de l'email.";
    if (error.code === 'auth/user-not-found') {
      message = "Aucun utilisateur trouvé avec cette adresse email.";
    } else if (error.code === 'auth/invalid-email') {
      message = "Format d'email invalide.";
    } else if (error.code === 'auth/too-many-requests') {
      message = "Trop de tentatives. Veuillez réessayer plus tard.";
    }
    showAuthError(message);
  }
}
window.handleForgotPassword = handleForgotPassword;

// Déconnexion
window.signOut = async function () {
  try {
    await firebase.auth().signOut();
    window.currentUser = null;
    window.userRole = null;
    window.userGender = null;
    window.userProfilePic = null;
    window.directorRequestStatus = null;
    document.body.classList.remove('user-logged-in');
    updateUI();
    if (typeof loadDataFromFirebase === 'function') {
      loadDataFromFirebase();
    }
  } catch (error) {
    console.error("Erreur lors de la déconnexion:", error);
  }
}

// Mettre à jour les numéros des titres de sections dynamiquement
function updateSectionNumbers() {
  const sections = [
    { id: 'experiences', title: 'Expériences' },
    { id: 'formations', title: 'Formations' },
    { id: 'statistiques', title: 'Statistiques' }
  ];

  let number = 1;
  sections.forEach(section => {
    const element = document.getElementById(section.id);
    if (element) {
      // Vérifier si la section est visible
      const computedStyle = window.getComputedStyle(element);
      const isVisible = computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        element.style.display !== 'none' &&
        !element.classList.contains('hidden-formations');

      if (isVisible) {
        // Extraire le titre original si présent dans data-section
        const sectionTitle = element.getAttribute('data-section-title') || section.title;
        const newText = `${number}- ${sectionTitle}`;

        // Cibler spécifiquement le span du titre s'il existe (pour ne pas écraser le bouton PDF)
        const titleSpan = element.querySelector('.section-title-text');
        if (titleSpan) {
          titleSpan.textContent = newText;
        } else {
          // Fallback si pas de span structuré (garde la compatibilité)
          element.textContent = newText;
        }
        number++;
      }
    }
  });
}

// Mettre à jour l'interface selon le rôle et l'UID cible
function updateUI() {
  // Si l'état d'authentification n'a pas encore été vérifié par Firebase Auth,
  // conserver les loaders et ne pas modifier l'affichage des boutons d'auth
  if (!window.authStateChecked) {
    console.log("updateUI appelé avant vérification Auth : attente de la résolution...");
    return;
  }

  // Récupérer l'UID cible depuis l'URL (défini dans dashboard.html)
  const targetUid = window.targetUid;

  // Vérifier si l'utilisateur est connecté
  const isLoggedIn = window.currentUser !== null;
  const currentUid = window.currentUser ? window.currentUser.uid : null;

  // L'utilisateur est propriétaire si l'UID connecté correspond à l'UID cible
  // L'admin ne peut pas modifier les données d'un autre utilisateur depuis son profil public
  const isOwner = (isLoggedIn && targetUid) ? (currentUid === targetUid) : (isLoggedIn && window.userRole === 'admin');

  console.log('updateUI - targetUid:', targetUid, 'currentUid:', currentUid, 'isOwner:', isOwner);

  // Masquer les loaders d'authentification s'ils sont présents
  const navAuthLoader = document.getElementById('nav-auth-loader');
  if (navAuthLoader) {
    navAuthLoader.style.display = 'none';
  }
  const heroAuthLoader = document.getElementById('hero-auth-loader');
  if (heroAuthLoader) {
    heroAuthLoader.style.display = 'none';
  }

  // Boutons de connexion/déconnexion en haut
  const authButtonTop = document.getElementById('auth-button-top');
  const logoutButtonTop = document.getElementById('logout-button-top');
  const navConnectionStatus = document.getElementById('nav-connection-status');

  if (navConnectionStatus) {
    if (isLoggedIn && window.currentUser && window.currentUser.email) {
      navConnectionStatus.textContent = `Connecté en tant que ${window.currentUser.email}`;
    } else {
      navConnectionStatus.textContent = "Vous n'êtes pas connecté";
    }
  }

  // Mettre à jour la photo de profil dans la navbar
  const navProfilePicContainer = document.getElementById('nav-profile-pic-container');
  const navProfilePic = document.getElementById('nav-profile-pic');

  if (navProfilePicContainer && navProfilePic) {
    if (isLoggedIn && window.userProfilePic) {
      navProfilePic.src = window.userProfilePic;
      navProfilePicContainer.style.display = 'block';
    } else {
      navProfilePicContainer.style.display = 'none';
    }
  }

  if (authButtonTop) {
    authButtonTop.style.display = isLoggedIn ? 'none' : 'block';
  }

  const registerButtonTop = document.getElementById('register-button-top');
  if (registerButtonTop) {
    registerButtonTop.style.display = isLoggedIn ? 'none' : 'block';
  }

  if (logoutButtonTop) {
    logoutButtonTop.style.display = isLoggedIn ? 'block' : 'none';
  }

  // Gestion du bandeau promotionnel pour les visiteurs non connectés
  const promoBanner = document.getElementById('promo-banner-visitor');
  if (promoBanner) {
    promoBanner.style.display = isLoggedIn ? 'none' : 'block';
  }

  // Gestion spécifique de l'index (boutons Hero)
  const heroAuthBtns = document.getElementById('hero-auth-btns');
  const heroLoggedBtns = document.getElementById('hero-logged-btns');
  const heroDashboardBtn = document.getElementById('hero-dashboard-btn');

  if (heroAuthBtns) {
    heroAuthBtns.style.display = isLoggedIn ? 'none' : 'contents';
  }

  if (heroLoggedBtns) {
    heroLoggedBtns.style.display = isLoggedIn ? 'contents' : 'none';
  }

  if (heroDashboardBtn && isLoggedIn && currentUid) {
    heroDashboardBtn.onclick = () => {
      window.location.href = `dashboard.html?uid=${currentUid}`;
    };
  }

  // Les astuces sont repliées par défaut pour tout le monde (propriétaire et visiteurs)
  const tipsContent = document.getElementById('tips-content');
  const tipsIcon = document.getElementById('tips-icon');
  const tipsContainer = tipsContent ? tipsContent.closest('.info-box') : null;

  if (tipsContent && tipsIcon) {
    tipsContent.style.display = 'none';
    tipsIcon.classList.remove('bi-chevron-down');
    tipsIcon.classList.add('bi-chevron-right');
    if (tipsContainer) tipsContainer.classList.add('tips-collapsed');
  }

  // Gérer la visibilité du bouton Paramètres (nouvel engrenage)
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.style.display = isOwner ? 'block' : 'none';
  }

  // Gérer la visibilité du bouton de copie rapide
  const quickCopyBtn = document.getElementById('quick-copy-link-btn');
  if (quickCopyBtn) {
    quickCopyBtn.style.display = isOwner ? 'flex' : 'none';
  }

  // La visibilité des sections (Formations, Stats) est désormais gérée par loadUserProfile
  // dans firebase-data.js pour respecter les paramètres de confidentialité.

  // Gérer l'activation/désactivation des liens Google Maps selon l'état de connexion
  const mapLinks = document.querySelectorAll('a[href*="maps.app.goo.gl"], a[href*="google.fr/maps"], a[href*="google.com/maps"]');
  mapLinks.forEach(link => {
    if (isLoggedIn) {
      // Activer le lien
      const originalHref = link.getAttribute('data-original-href');
      if (originalHref) {
        link.setAttribute('href', originalHref);
        link.removeAttribute('data-original-href');
      }
      link.style.pointerEvents = '';
      link.style.cursor = '';
      link.style.color = '';
      link.style.textDecoration = '';
      link.removeAttribute('title');
      link.onclick = null;
    } else {
      // Désactiver le lien si pas déjà fait
      if (link.getAttribute('href') !== '#') {
        link.setAttribute('data-original-href', link.getAttribute('href'));
        link.setAttribute('href', '#');
      }
      link.style.pointerEvents = 'auto'; // Pour le title
      link.style.cursor = 'help';
      link.title = 'Connectez-vous pour voir sur Google Maps';
    }
  });

  // Afficher/masquer les boutons d'ajout/édition (SEULEMENT POUR LE PROPRIÉTAIRE)
  const addExperienceBtn = document.getElementById('add-experience-btn');
  const addFormationBtn = document.getElementById('add-formation-btn');
  const searchContainerExp = document.querySelector('#search-experiences')?.closest('.search-container');
  const searchContainerForm = document.querySelector('#search-formations')?.closest('.search-container');

  if (isOwner) {
    if (addExperienceBtn) {
      addExperienceBtn.style.display = 'flex';
      if (searchContainerExp) searchContainerExp.classList.add('has-add-btn');
    }
    if (addFormationBtn) {
      addFormationBtn.style.display = 'flex';
      if (searchContainerForm) searchContainerForm.classList.add('has-add-btn');
    }

    // Ajouter les colonnes d'édition
    setTimeout(addEditColumns, 500);
  } else {
    if (addExperienceBtn) {
      addExperienceBtn.style.display = 'none';
      if (searchContainerExp) searchContainerExp.classList.remove('has-add-btn');
    }
    if (addFormationBtn) {
      addFormationBtn.style.display = 'none';
      if (searchContainerForm) searchContainerForm.classList.remove('has-add-btn');
    }

    // Retirer les colonnes d'édition
    removeEditColumns();
  }

  // Gérer la visibilité du bouton de statistiques admin
  const adminStatsBtn = document.getElementById('admin-stats-btn');
  if (adminStatsBtn) {
    if (window.userRole === 'admin') {
      // Afficher le bouton pour l'admin
      adminStatsBtn.style.display = 'flex'; // ou block selon le style navbar
    } else {
      adminStatsBtn.style.display = 'none';
    }
  }

  updateSectionNumbers();

  // Gestion des demandes directeur
  const adminRequestsSection = document.getElementById('admin-director-requests-section');
  if (adminRequestsSection) {
    adminRequestsSection.style.display = (window.userRole === 'admin') ? 'block' : 'none';
  }
  if (typeof checkDirectorRequestStatus === 'function') {
    checkDirectorRequestStatus();
  }
  if (window.userRole === 'admin' && typeof fetchDirectorRequests === 'function') {
    fetchDirectorRequests();
  }
}

// --- Gestion des demandes Directeur ---

// Vérifier et mettre à jour le statut de la demande directeur (côté user)
function checkDirectorRequestStatus() {
  const btn = document.getElementById('request-director-btn');
  const msg = document.getElementById('director-request-msg');
  const userListSection = document.getElementById('user-list-section');

  if (!btn || !msg) return;

  // Si l'utilisateur est admin ou directeur, on cache le bouton de demande
  if (window.userRole === 'admin' || window.userRole === 'dirlo') {
    btn.style.display = 'none';
    msg.style.display = 'none';
    // Afficher la section directeur si c'est un directeur/admin (si elle existe sur la page)
    if (userListSection) {
      userListSection.style.display = 'block';
      if (typeof loadPublicUsers === 'function' && (!window.allPublicUsers || window.allPublicUsers.length === 0)) {
        loadPublicUsers();
      }
    }
    return;
  } else {
    // Si user simple, cacher la section directeur
    if (userListSection) userListSection.style.display = 'none';
  }

  // Si pas connecté, cacher
  if (!window.currentUser) {
    btn.style.display = 'none';
    msg.style.display = 'none';
    return;
  }

  // Si connecté et user simple
  if (window.directorRequestStatus === 'pending') {
    btn.style.display = 'block';
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
    btn.textContent = 'Demande en attente...';
    msg.style.display = 'block';
  } else {
    // Rejected ou null
    btn.style.display = 'block'; // Afficher le bouton
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    btn.textContent = 'Demander un accès directeur';
    msg.style.display = 'none';
  }
}

// Gérer le modal directeur
function openDirectorRequestModal() {
  const modal = document.getElementById('director-request-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
}

function closeDirectorRequestModal() {
  const modal = document.getElementById('director-request-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
}

// Expose functions to window for HTML access
window.openDirectorRequestModal = openDirectorRequestModal;
window.closeDirectorRequestModal = closeDirectorRequestModal;
window.requestDirectorAccess = requestDirectorAccess;
window.checkDirectorRequestStatus = checkDirectorRequestStatus;
window.fetchDirectorRequests = fetchDirectorRequests;
window.approveDirectorRequest = approveDirectorRequest;
window.rejectDirectorRequest = rejectDirectorRequest;

// Envoyer une demande d'accès directeur
async function requestDirectorAccess() {
  if (!window.currentUser) return;

  try {
    await window.firebaseDb.collection('users').doc(window.currentUser.uid).update({
      directorRequestStatus: 'pending',
      directorRequestDate: new Date()
    });
    // Mettre à jour l'état local immédiatement pour réactivité UI
    window.directorRequestStatus = 'pending';
    checkDirectorRequestStatus();
    closeDirectorRequestModal();
  } catch (error) {
    console.error("Erreur demande directeur:", error);
    alert("Une erreur est survenue lors de l'envoi de la demande.");
    closeDirectorRequestModal();
  }
}

// Admin: Récupérer les demandes
async function fetchDirectorRequests() {
  const tableBody = document.getElementById('director-requests-table-body');
  const section = document.getElementById('admin-director-requests-section');
  const noMsg = document.getElementById('no-requests-msg');

  if (!tableBody || !section) return;

  // Seul l'admin voit ça
  if (window.userRole !== 'admin') {
    section.style.display = 'none';
    return;
  }

  try {
    const snapshot = await window.firebaseDb.collection('users')
      .where('directorRequestStatus', '==', 'pending')
      .get();

    tableBody.innerHTML = '';

    if (snapshot.empty) {
      noMsg.style.display = 'block';
      section.style.display = 'block';
      return;
    }

    noMsg.style.display = 'none';
    section.style.display = 'block';

    snapshot.forEach(doc => {
      const data = doc.data();
      const date = data.directorRequestDate ? new Date(data.directorRequestDate.seconds * 1000).toLocaleDateString() : '-';

      const tr = document.createElement('tr');
      tr.innerHTML = `
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.lastname || '-'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.firstname || '-'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${data.email || doc.id}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${date}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
                    <button onclick="approveDirectorRequest('${doc.id}')" style="background: #27ae60; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Accepter</button>
                    <button onclick="rejectDirectorRequest('${doc.id}')" style="background: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Refuser</button>
                </td>
            `;
      tableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Erreur fetch demandes:", error);
  }
}

// Admin: Accepter
async function approveDirectorRequest(uid) {
  if (!confirm("Confirmer l'accès directeur pour cet utilisateur ?")) return;
  try {
    await window.firebaseDb.collection('users').doc(uid).update({
      role: 'dirlo',
      directorRequestStatus: 'approved'
    });
    fetchDirectorRequests(); // Rafraichir
    alert("Accès accordé.");
  } catch (error) {
    console.error(error);
    alert("Erreur.");
  }
}

// Admin: Refuser
async function rejectDirectorRequest(uid) {
  if (!confirm("Refuser la demande ?")) return;
  try {
    await window.firebaseDb.collection('users').doc(uid).update({
      directorRequestStatus: null // On remet à null pour qu'il puisse redemander
    });
    fetchDirectorRequests();
    alert("Demande refusée.");
  } catch (error) {
    console.error(error);
    alert("Erreur.");
  }
}

// Afficher le menu utilisateur
function showUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}


// Afficher le modal d'authentification
window.showAuthModal = function (mode) {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    // Réinitialiser le formulaire et masquer les erreurs
    hideAuthError();
    const form = document.getElementById('login-form');
    if (form) {
      form.reset();
    }

    // Gérer le mode (connexion ou inscription)
    if (mode) {
      const modeInput = document.getElementById('auth-mode');
      if (modeInput && modeInput.value !== mode) {
        if (typeof toggleAuthMode === 'function') {
          toggleAuthMode();
        }
      }
    }
  }
}

// Fermer le modal d'authentification
window.closeAuthModal = function () {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
}

// Ajouter les colonnes d'édition et suppression pour admin
function addEditColumns() {
  // Tableau des expériences
  const expTable = document.getElementById('table-experiences');
  if (expTable) {
    const headerRow = expTable.querySelector('tr.always-visible');
    if (headerRow && !headerRow.querySelector('th.edit-column')) {
      const editHeader = document.createElement('th');
      editHeader.className = 'edit-column';
      editHeader.innerHTML = '<i class="bi bi-pencil-square"></i>';
      headerRow.appendChild(editHeader);

      const deleteHeader = document.createElement('th');
      deleteHeader.className = 'delete-column';
      deleteHeader.innerHTML = '<i class="bi bi-trash3"></i>';
      headerRow.appendChild(deleteHeader);
    }

    // Ajouter les boutons d'édition et suppression à chaque ligne
    const rows = expTable.querySelectorAll('tr[data-type]:not(.always-visible)');
    rows.forEach(row => {
      if (!row.querySelector('td.edit-column')) {
        const editCell = document.createElement('td');
        editCell.className = 'edit-column';
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="bi bi-pencil-square"></i>';
        editBtn.onclick = () => editExperience(row);
        editCell.appendChild(editBtn);
        row.appendChild(editCell);

        const deleteCell = document.createElement('td');
        deleteCell.className = 'delete-column';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="bi bi-trash3"></i>';
        deleteBtn.onclick = () => showDeleteConfirmModal(row, 'experience');
        deleteCell.appendChild(deleteBtn);
        row.appendChild(deleteCell);
      }
    });
  }

  // Tableau des formations
  const formTable = document.getElementById('table-formations');
  if (formTable) {
    const headerRow = formTable.querySelector('tr.always-visible');
    if (headerRow && !headerRow.querySelector('th.edit-column')) {
      const editHeader = document.createElement('th');
      editHeader.className = 'edit-column';
      editHeader.innerHTML = '<i class="bi bi-pencil-square"></i>';
      headerRow.appendChild(editHeader);

      const deleteHeader = document.createElement('th');
      deleteHeader.className = 'delete-column';
      deleteHeader.innerHTML = '<i class="bi bi-trash3"></i>';
      headerRow.appendChild(deleteHeader);
    }

    // Ajouter les boutons d'édition et suppression à chaque ligne
    const rows = formTable.querySelectorAll('tr[data-type]:not(.always-visible)');
    rows.forEach(row => {
      if (!row.querySelector('td.edit-column')) {
        const editCell = document.createElement('td');
        editCell.className = 'edit-column';
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '<i class="bi bi-pencil-square"></i>';
        editBtn.onclick = () => editFormation(row);
        editCell.appendChild(editBtn);
        row.appendChild(editCell);

        const deleteCell = document.createElement('td');
        deleteCell.className = 'delete-column';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="bi bi-trash3"></i>';
        deleteBtn.onclick = () => showDeleteConfirmModal(row, 'formation');
        deleteCell.appendChild(deleteBtn);
        row.appendChild(deleteCell);
      }
    });
  }
}

// Retirer les colonnes d'édition et suppression
function removeEditColumns() {
  document.querySelectorAll('.edit-column, .delete-column').forEach(col => col.remove());
}

// Variables pour la suppression
let currentDeletingRow = null;
let currentDeletingType = null;

// Afficher la modale de confirmation de suppression
function showDeleteConfirmModal(row, type) {
  currentDeletingRow = row;
  currentDeletingType = type;
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
}

// Fermer la modale de confirmation
function closeDeleteConfirmModal() {
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
  currentDeletingRow = null;
  currentDeletingType = null;
}

// Confirmer la suppression
async function confirmDelete() {
  if (!currentDeletingRow || !currentDeletingType) return;

  // Sécurité supplémentaire : vérifier l'autorisation via isOwner
  if (typeof isOwner === 'function' && !isOwner()) {
    alert("Action non autorisée : vous ne pouvez pas modifier ou supprimer les données de ce profil car vous n'en êtes pas le propriétaire.");
    closeDeleteConfirmModal();
    return;
  }

  // Sauvegarder la position de scroll avant rechargement
  const savedScrollY = window.scrollY;

  try {
    if (currentDeletingType === 'experience') {
      if (typeof deleteExperienceFromFirebase === 'function') {
        await deleteExperienceFromFirebase(currentDeletingRow);
      } else {
        throw new Error('Fonction deleteExperienceFromFirebase non disponible');
      }
    } else if (currentDeletingType === 'formation') {
      if (typeof deleteFormationFromFirebase === 'function') {
        await deleteFormationFromFirebase(currentDeletingRow);
      } else {
        throw new Error('Fonction deleteFormationFromFirebase non disponible');
      }
    }

    closeDeleteConfirmModal();
    // Recharger les données
    if (typeof loadDataFromFirebase === 'function') {
      await loadDataFromFirebase();
    }

    // Restaurer la position de scroll
    window.scrollTo({ top: savedScrollY, behavior: 'instant' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    alert('Erreur lors de la suppression. Veuillez réessayer.');
  }
}

// Éditer une expérience
function editExperience(row) {
  let data = {};

  if (row.dataset.experience) {
    try {
      data = JSON.parse(row.dataset.experience);
    } catch (e) {
      console.error('Erreur parsing data-experience', e);
    }
  }

  // Fallback si pas de dataset (ex: données statiques ou erreur)
  if (!data.date) {
    const cells = row.cells;
    data = {
      date: cells[1]?.textContent?.trim() || '',
      duration: cells[2]?.textContent?.trim() || '',
      organizer: cells[3]?.querySelector('a')?.textContent?.trim() || '',
      organizerUrl: cells[3]?.querySelector('a')?.href || '',
      logoPath: cells[4]?.querySelector('img')?.src || '',
      location: cells[5]?.textContent?.trim() || '',
      locationUrl: cells[5]?.querySelector('a')?.href || '',
      stayType: cells[6]?.textContent?.trim() || '',
      position: cells[7]?.textContent?.trim() || '',
      ageRange: cells[8]?.textContent?.trim() || '',
      youthCount: parseInt(cells[9]?.textContent?.trim() || '0', 10),
      type: row.getAttribute('data-type') || 'colo'
    };
  }

  if (typeof showEditExperienceModal === 'function') {
    showEditExperienceModal(data, row);
  }
}

// Éditer une formation
function editFormation(row) {
  let data = {};

  if (row.dataset.formation) {
    try {
      data = JSON.parse(row.dataset.formation);
    } catch (e) {
      console.error('Erreur parsing data-formation', e);
    }
  }

  // Fallback si pas de dataset
  if (!data.date) {
    const cells = row.cells;
    data = {
      date: cells[1]?.textContent?.trim() || '',
      duration: cells[2]?.textContent?.trim() || '',
      organism: cells[3]?.querySelector('a')?.textContent?.trim() || '',
      organismUrl: cells[3]?.querySelector('a')?.href || '',
      logoPath: cells[4]?.querySelector('img')?.src || '',
      title: cells[5]?.textContent?.trim() || '',
      location: cells[6]?.textContent?.trim() || '',
      locationUrl: cells[6]?.querySelector('a')?.href || '',
      type: row.getAttribute('data-type') || 'bafa'
    };
  }

  if (typeof showEditFormationModal === 'function') {
    showEditFormationModal(data, row);
  }
}

// Toggle la visibilité du mot de passe
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('login-password');
  const eyeIcon = document.getElementById('password-eye-icon');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    eyeIcon.classList.remove('bi-eye');
    eyeIcon.classList.add('bi-eye-slash');
  } else {
    passwordInput.type = 'password';
    eyeIcon.classList.remove('bi-eye-slash');
    eyeIcon.classList.add('bi-eye');
  }
}

// Initialiser l'authentification au chargement
if (window.firebaseInitialized) {
  initAuth();
} else {
  // Attendre que Firebase soit initialisé
  const checkFirebase = setInterval(() => {
    if (window.firebaseInitialized && firebase.auth) {
      clearInterval(checkFirebase);
      initAuth();
    }
  }, 100);
}

// Timeout de sécurité : si après 3.5s l'authentification n'a toujours pas répondu, masquer les loaders
setTimeout(() => {
  if (!window.authStateChecked) {
    window.authStateChecked = true;
    updateUI();
  }
  const heroAuthLoader = document.getElementById('hero-auth-loader');
  if (heroAuthLoader && heroAuthLoader.style.display !== 'none') {
    heroAuthLoader.style.display = 'none';
    const heroAuthBtns = document.getElementById('hero-auth-btns');
    if (heroAuthBtns && !window.currentUser) {
      heroAuthBtns.style.display = 'contents';
    }
  }
}, 3500);

// Fonction pour plier/déplier la section Astuces
window.toggleTips = function () {
  const content = document.getElementById('tips-content');
  const icon = document.getElementById('tips-icon');
  const container = content ? content.closest('.info-box') : null;

  if (content && icon) {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      icon.classList.remove('bi-chevron-right');
      icon.classList.add('bi-chevron-down');
      if (container) container.classList.remove('tips-collapsed');
    } else {
      content.style.display = 'none';
      icon.classList.remove('bi-chevron-down');
      icon.classList.add('bi-chevron-right');
      if (container) container.classList.add('tips-collapsed');
    }
  }
};
// Fonction pour plier/déplier l'explication des stats manuelles
window.toggleStatsExplanation = function (event) {
  if (event) event.preventDefault();
  const bubble = document.getElementById('stats-explanation-bubble');
  if (bubble) {
    bubble.style.display = (bubble.style.display === 'none' || bubble.style.display === '') ? 'block' : 'none';
  }
};
