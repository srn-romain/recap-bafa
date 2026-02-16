// Gestion de l'authentification Firebase
// Rôles : 'guest' (invité) ou 'admin' (administrateur)

window.currentUser = null;
window.userRole = null;

// Initialiser l'authentification
function initAuth() {
  if (!window.firebaseInitialized || !firebase.auth) {
    console.log("Firebase Auth non disponible");
    return;
  }

  // Écouter les changements d'état d'authentification
  firebase.auth().onAuthStateChanged(async (user) => {
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
      document.body.classList.remove('user-logged-in');
      updateUI();
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
      console.log('Rôle récupéré:', window.userRole, 'Genre:', window.userGender, 'pour UID:', user.uid);
    } else {
      window.userRole = null;
      window.userGender = null;
      console.log('Aucun document trouvé pour UID:', user.uid);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    window.userRole = null;
    window.userGender = null;
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
function toggleAuthMode() {
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
  } else {
    // Passer en mode connexion
    modeInput.value = 'login';
    title.textContent = "Connexion";
    submitText.textContent = "Se connecter";
    toggleText.textContent = "Pas encore de compte ? Créer un compte";
    registerFields.style.display = 'none';
    firstNameInput.required = false;
    lastNameInput.required = false;
  }
}

// Masquer le message d'erreur d'authentification
function hideAuthError() {
  const errorDiv = document.getElementById('auth-error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

// Gérer la connexion ou l'inscription
async function handleLogin(event) {
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

  // Si l'identifiant contient 'invite', ajouter automatiquement '@gmail.com' (Legacy)
  if (email.toLowerCase().includes('invite') && !email.includes('@')) {
    email = email + '@gmail.com';
    document.getElementById('login-email').value = email;
  }

  try {
    let result;

    if (mode === 'register') {
      // Inscription
      const firstName = document.getElementById('auth-firstname').value;
      const lastName = document.getElementById('auth-lastname').value;
      const linkedin = document.getElementById('auth-linkedin').value;

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

// Déconnexion
async function signOut() {
  try {
    await firebase.auth().signOut();
    window.currentUser = null;
    window.userRole = null;

    // Vider les données des formations du tableau
    const formationsTable = document.getElementById('table-formations');
    if (formationsTable) {
      const rows = formationsTable.querySelectorAll('tr[data-type]:not(.always-visible)');
      rows.forEach(row => row.remove());
    }

    // Vider les stats formations
    const totalDaysFormation = document.getElementById('total-days-formation');
    const totalBafaFormations = document.getElementById('total-bafa-formations');
    const totalBafdFormations = document.getElementById('total-bafd-formations');
    if (totalDaysFormation) totalDaysFormation.textContent = '0';
    if (totalBafaFormations) totalBafaFormations.textContent = '0';
    if (totalBafdFormations) totalBafdFormations.textContent = '0';

    // Cacher le canvas du graphique
    const formationCanvas = document.getElementById('formationOrganizationChart');
    if (formationCanvas) {
      formationCanvas.style.display = 'none';
      formationCanvas.style.visibility = 'hidden';
    }

    // Recalculer les statistiques (sans les formations)
    if (typeof calculateAllStatistics === 'function') {
      calculateAllStatistics();
    }

    // Mettre à jour l'UI
    updateUI();
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
        element.textContent = `${number}- ${sectionTitle}`;
        number++;
      }
    }
  });
}

// Mettre à jour l'interface selon le rôle et l'UID cible
function updateUI() {
  // Récupérer l'UID cible depuis l'URL (défini dans dashboard.html)
  const targetUid = window.targetUid;

  // Vérifier si l'utilisateur est connecté
  const isLoggedIn = window.currentUser !== null;
  const currentUid = window.currentUser ? window.currentUser.uid : null;

  // L'utilisateur est propriétaire si l'UID connecté correspond à l'UID cible
  // L'admin ne peut pas modifier les données d'un autre utilisateur depuis son profil public
  const isOwner = (isLoggedIn && targetUid) ? (currentUid === targetUid) : (isLoggedIn && window.userRole === 'admin');

  console.log('updateUI - targetUid:', targetUid, 'currentUid:', currentUid, 'isOwner:', isOwner);

  // Boutons de connexion/déconnexion en haut
  const authButtonTop = document.getElementById('auth-button-top');
  const logoutButtonTop = document.getElementById('logout-button-top');

  if (authButtonTop) {
    // Si connecté, on cache le bouton de connexion (car on affiche Logout)
    // Si déconnecté, on l'affiche pour permettre la connexion
    authButtonTop.style.display = isLoggedIn ? 'none' : 'block';
  }

  if (logoutButtonTop) {
    logoutButtonTop.style.display = isLoggedIn ? 'block' : 'none';
  }

  // Gérer automatiquement le dépliage/pliage des astuces selon qu'on est propriétaire ou non
  const tipsContent = document.getElementById('tips-content');
  const tipsIcon = document.getElementById('tips-icon');
  const tipsContainer = tipsContent ? tipsContent.closest('.info-box') : null;

  if (tipsContent && tipsIcon) {
    if (isOwner) {
      // Pour le propriétaire : replié par défaut pour être discret
      tipsContent.style.display = 'none';
      tipsIcon.classList.remove('bi-chevron-down');
      tipsIcon.classList.add('bi-chevron-right');
      if (tipsContainer) tipsContainer.classList.add('tips-collapsed');
    } else {
      // Pour les visiteurs : déplié par défaut pour aider
      tipsContent.style.display = 'block';
      tipsIcon.classList.remove('bi-chevron-right');
      tipsIcon.classList.add('bi-chevron-down');
      if (tipsContainer) tipsContainer.classList.remove('tips-collapsed');
    }
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

  // Afficher toutes les sections (Formations, Stats) pour tout le monde (Public Read)
  const formationsTitle = document.getElementById('formations');
  const formationsTableContainer = document.getElementById('table-formations')?.closest('.tabs');
  const formationsFilters = document.querySelector('#formations + .tabs');

  if (formationsTitle) formationsTitle.style.display = '';
  if (formationsTableContainer) formationsTableContainer.style.display = '';
  if (formationsFilters) formationsFilters.style.display = '';

  // S'assurer que le tableau des formations est visible
  const formationsTable = document.getElementById('table-formations');
  if (formationsTable) formationsTable.style.display = '';

  // Afficher les stats
  const canvas = document.getElementById('formationOrganizationChart');
  if (canvas) {
    canvas.style.display = '';
    canvas.style.visibility = '';
  }

  // Activer les liens Google Maps pour tout le monde (demandé : "tout est accessible")
  const mapLinks = document.querySelectorAll('a[href*="maps.app.goo.gl"]');
  mapLinks.forEach(link => {
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

  // Gérer la visibilité de la section statistiques admin
  const adminStatsSection = document.getElementById('admin-stats-section');
  if (adminStatsSection) {
    if (window.userRole === 'admin') {
      adminStatsSection.style.display = 'block';
      if (typeof loadAdminStats === 'function') {
        loadAdminStats();
      }
    } else {
      adminStatsSection.style.display = 'none';
    }
  }

  updateSectionNumbers();
}

// Afficher le menu utilisateur
function showUserMenu() {
  const menu = document.getElementById('user-menu');
  if (menu) {
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  }
}

// Afficher le modal d'authentification
function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Réinitialiser le formulaire et masquer les erreurs
    hideAuthError();
    const form = document.getElementById('login-form');
    if (form) {
      form.reset();
    }
  }
}

// Fermer le modal d'authentification
function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.style.display = 'none';
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
  }
}

// Fermer la modale de confirmation
function closeDeleteConfirmModal() {
  const modal = document.getElementById('delete-confirm-modal');
  if (modal) {
    modal.style.display = 'none';
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
  const cells = row.cells;
  const data = {
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

