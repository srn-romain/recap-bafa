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
      // Récupérer le rôle de l'utilisateur depuis Firestore (par UID)
      await getUserRole(user);
      updateUI();
    } else {
      window.currentUser = null;
      window.userRole = null;
      // Masquer immédiatement la section stats formations
      const allStatsSections = document.querySelectorAll('#statistiques .stats-section');
      allStatsSections.forEach(section => {
        const h3 = section.querySelector('h3');
        if (h3 && h3.textContent.trim() === 'Formations') {
          section.classList.add('hidden-formations');
        }
      });
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
      console.log('Rôle récupéré:', window.userRole, 'pour UID:', user.uid);
    } else {
      window.userRole = null;
      console.log('Aucun document trouvé pour UID:', user.uid);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du rôle:", error);
    window.userRole = null;
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

// Masquer le message d'erreur d'authentification
function hideAuthError() {
  const errorDiv = document.getElementById('auth-error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

// Gérer la connexion (unifié pour admin et invité)
async function handleLogin(event) {
  if (event) {
    event.preventDefault();
  }
  
  // Masquer les erreurs précédentes
  hideAuthError();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  if (!email || !password) {
    showAuthError('Veuillez remplir tous les champs.');
    return;
  }
  
  try {
    const result = await firebase.auth().signInWithEmailAndPassword(email, password);
    
    // Récupérer le rôle de l'utilisateur depuis la collection users (par UID)
    // Ne pas créer de document automatiquement - l'utilisateur doit exister dans Firestore
    await getUserRole(result.user);
    
    // Si aucun rôle n'est trouvé, l'utilisateur n'existe pas dans la collection users
    if (!window.userRole) {
      showAuthError('Aucun rôle trouvé pour cet utilisateur. Contactez l\'administrateur.');
      await firebase.auth().signOut();
      return;
    }
    
    // Fermer la modale immédiatement
    closeAuthModal();
    
    // Mettre à jour l'UI immédiatement pour afficher les boutons
    updateUI();
    
    // Recharger les données pour s'assurer que les liens Google Maps sont correctement créés
    if (typeof loadDataFromFirebase === 'function') {
      setTimeout(() => {
        loadDataFromFirebase().then(() => {
          // Mettre à jour l'UI après le rechargement des données
          // Cela ajoutera aussi les colonnes d'édition si admin
          updateUI();
        });
      }, 300);
    }
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      showAuthError("Email ou mot de passe incorrect.");
    } else if (error.code === 'auth/invalid-email') {
      showAuthError("Format d'email invalide.");
    } else {
      showAuthError("Erreur lors de la connexion. Veuillez réessayer.");
    }
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
    
    // Masquer immédiatement la section stats formations avant de recalculer
    const allStatsSections = document.querySelectorAll('#statistiques .stats-section');
    allStatsSections.forEach(section => {
      const h3 = section.querySelector('h3');
      if (h3 && h3.textContent.trim() === 'Formations') {
        section.style.display = 'none';
        section.style.visibility = 'hidden';
        section.style.height = '0';
        section.style.overflow = 'hidden';
      }
    });
    
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

// Mettre à jour l'interface selon le rôle
function updateUI() {
  const isGuest = window.userRole === 'guest' || window.userRole === 'invite';
  const isAdmin = window.userRole === 'admin';
  const isLoggedIn = window.currentUser !== null && window.userRole !== null;
  
  console.log('updateUI appelé - userRole:', window.userRole, 'isAdmin:', isAdmin, 'isGuest:', isGuest, 'isLoggedIn:', isLoggedIn);

  // Boutons de connexion/déconnexion en haut
  const authButtonTop = document.getElementById('auth-button-top');
  const logoutButtonTop = document.getElementById('logout-button-top');
  
  if (authButtonTop) {
    authButtonTop.style.display = isLoggedIn ? 'none' : 'block';
  }
  
  if (logoutButtonTop) {
    logoutButtonTop.style.display = isLoggedIn ? 'block' : 'none';
  }
  
  
  // Afficher/masquer les informations utilisateur en bas
  const userInfo = document.getElementById('user-info');
  const userRoleDisplay = document.getElementById('user-role-display');
  
  if (userInfo && userRoleDisplay) {
    if (isLoggedIn) {
      userInfo.style.display = 'block';
      userRoleDisplay.textContent = isAdmin ? 'Administrateur' : 'Invité';
    } else {
      userInfo.style.display = 'none';
    }
  }

  // Afficher/masquer les formations
  const formationsTitle = document.getElementById('formations'); // Le h1 "2- Formations"
  const formationsTable = document.getElementById('table-formations');
  const formationsTableContainer = formationsTable?.closest('.tabs'); // Le conteneur du tableau
  const formationsFilters = document.querySelector('#formations + .tabs'); // Les filtres (BAFA/BAFD)
  const formationsTab = document.querySelector('.sommaire-liste li:nth-child(2)'); // L'onglet dans le sommaire
  const formationsSearch = document.getElementById('search-formations')?.closest('.search-container'); // La barre de recherche
  
  // Trouver la section stats formations (celle avec h3 "Formations")
  // Utiliser plusieurs méthodes pour être sûr de la trouver
  let formationsStats = null;
  
  // Méthode 1 : Chercher par le texte du h3
  const allStatsSections = document.querySelectorAll('#statistiques .stats-section');
  allStatsSections.forEach(section => {
    const h3 = section.querySelector('h3');
    if (h3 && h3.textContent.trim() === 'Formations') {
      formationsStats = section;
    }
  });
  
  // Méthode 2 : Si pas trouvé, prendre la dernière section stats (c'est normalement celle des formations)
  if (!formationsStats && allStatsSections.length > 1) {
    formationsStats = allStatsSections[allStatsSections.length - 1];
  }
  
  // Méthode 3 : Chercher directement par l'ID du canvas ou du conteneur du graphique
  if (!formationsStats) {
    const formationChartContainer = document.getElementById('formation-organization-chart');
    if (formationChartContainer) {
      formationsStats = formationChartContainer.closest('.stats-section');
    }
  }
  
  console.log('Formations stats section trouvée:', formationsStats);
  
  // Trouver aussi le graphique des formations
  const formationChart = document.getElementById('formation-organization-chart');
  const formationCanvas = document.getElementById('formationOrganizationChart');
  
  if (!isLoggedIn) {
    // Masquer TOUTES les formations si non connecté
    if (formationsTitle) formationsTitle.style.display = 'none';
    if (formationsTableContainer) formationsTableContainer.style.display = 'none';
    if (formationsFilters) formationsFilters.style.display = 'none';
    
    // Masquer la section stats formations complète (titre + texte + graphique)
    if (formationsStats) {
      formationsStats.style.display = 'none';
      formationsStats.style.visibility = 'hidden';
      formationsStats.style.height = '0';
      formationsStats.style.overflow = 'hidden';
      formationsStats.classList.add('hidden-formations');
    }
    
    // Ajouter une classe au body pour le CSS
    document.body.classList.remove('user-logged-in');
    
    // Masquer aussi individuellement le graphique au cas où
    if (formationChart) {
      formationChart.style.display = 'none';
      formationChart.style.visibility = 'hidden';
    }
    if (formationCanvas) {
      formationCanvas.style.display = 'none';
      formationCanvas.style.visibility = 'hidden';
    }
    
    if (formationsTab) formationsTab.style.display = 'none';
    if (formationsSearch) formationsSearch.style.display = 'none';
    
    // Vider le tableau des formations pour éviter qu'il reste visible
    if (formationsTable) {
      const rows = formationsTable.querySelectorAll('tr[data-type]:not(.always-visible)');
      rows.forEach(row => row.remove());
    }
  } else {
    // Afficher les formations si connecté
    if (formationsTitle) formationsTitle.style.display = '';
    if (formationsTableContainer) formationsTableContainer.style.display = '';
    if (formationsFilters) formationsFilters.style.display = '';
    if (formationsStats) {
      formationsStats.style.display = '';
      formationsStats.style.visibility = '';
      formationsStats.style.height = '';
      formationsStats.style.overflow = '';
      formationsStats.classList.remove('hidden-formations');
    }
    
    // Ajouter une classe au body pour le CSS
    document.body.classList.add('user-logged-in');
    if (formationChart) {
      formationChart.style.display = '';
      formationChart.style.visibility = '';
    }
    if (formationCanvas) {
      formationCanvas.style.display = '';
      formationCanvas.style.visibility = '';
    }
    if (formationsTab) formationsTab.style.display = '';
    if (formationsSearch) formationsSearch.style.display = '';
  }

  // Masquer les liens Google Maps si non connecté
  const mapLinks = document.querySelectorAll('a[href*="maps.app.goo.gl"]');
  mapLinks.forEach(link => {
    if (!isLoggedIn) {
      const originalHref = link.getAttribute('href') || link.getAttribute('data-original-href');
      if (originalHref && originalHref !== '#') {
        link.setAttribute('data-original-href', originalHref);
      }
      // Conserver la couleur originale du texte
      if (!link.getAttribute('data-original-color')) {
        const computedColor = window.getComputedStyle(link).color;
        link.setAttribute('data-original-color', computedColor);
      }
      link.setAttribute('href', '#');
      link.style.pointerEvents = 'none';
      link.style.cursor = 'not-allowed';
      link.style.color = link.getAttribute('data-original-color') || '#333';
      link.style.textDecoration = 'none';
      link.title = 'Connectez-vous pour voir sur Google Maps';
      link.onclick = (e) => {
        e.preventDefault();
        showAuthModal();
        return false;
      };
    } else {
      const originalHref = link.getAttribute('data-original-href');
      if (originalHref) {
        link.setAttribute('href', originalHref);
        link.removeAttribute('data-original-href');
      }
      // Restaurer la couleur originale
      const originalColor = link.getAttribute('data-original-color');
      if (originalColor) {
        link.style.color = originalColor;
        link.removeAttribute('data-original-color');
      } else {
        link.style.color = '';
      }
      link.style.pointerEvents = '';
      link.style.cursor = '';
      link.style.textDecoration = '';
      link.removeAttribute('title');
      link.onclick = null;
    }
  });

  // Afficher/masquer les boutons admin
  const addExperienceBtn = document.getElementById('add-experience-btn');
  const addFormationBtn = document.getElementById('add-formation-btn');
  const searchContainerExp = document.querySelector('#search-experiences')?.closest('.search-container');
  const searchContainerForm = document.querySelector('#search-formations')?.closest('.search-container');
  
  if (isAdmin) {
    if (addExperienceBtn) {
      addExperienceBtn.style.display = 'flex';
      if (searchContainerExp) {
        searchContainerExp.classList.add('has-add-btn');
      }
    }
    if (addFormationBtn) {
      addFormationBtn.style.display = 'flex';
      if (searchContainerForm) {
        searchContainerForm.classList.add('has-add-btn');
      }
    }
    
    // Ajouter la colonne d'édition aux tableaux
    // Attendre que les données soient chargées
    const addEditColumnsDelayed = () => {
      if (typeof addEditColumns === 'function') {
        // Vérifier que les tableaux ont des données
        const expTable = document.getElementById('table-experiences');
        const formTable = document.getElementById('table-formations');
        const hasExpData = expTable && expTable.querySelectorAll('tr[data-type]:not(.always-visible)').length > 0;
        const hasFormData = formTable && formTable.querySelectorAll('tr[data-type]:not(.always-visible)').length > 0;
        
        if (hasExpData || hasFormData) {
          addEditColumns();
        } else {
          // Réessayer après un court délai si les données ne sont pas encore chargées
          setTimeout(addEditColumnsDelayed, 300);
        }
      }
    };
    
    // Essayer immédiatement, puis avec un délai si nécessaire
    setTimeout(addEditColumnsDelayed, 100);
    setTimeout(addEditColumnsDelayed, 500);
  } else {
    if (addExperienceBtn) {
      addExperienceBtn.style.display = 'none';
      if (searchContainerExp) {
        searchContainerExp.classList.remove('has-add-btn');
      }
    }
    if (addFormationBtn) {
      addFormationBtn.style.display = 'none';
      if (searchContainerForm) {
        searchContainerForm.classList.remove('has-add-btn');
      }
    }
    
    // Retirer la colonne d'édition
    if (typeof removeEditColumns === 'function') {
      removeEditColumns();
    }
  }
  
  // Afficher/masquer le message d'invitation
  const invitationMsg = document.getElementById('invitation-message');
  if (invitationMsg) {
    invitationMsg.style.display = isLoggedIn ? 'none' : 'block';
  }
  
  // Mettre à jour les numéros des titres de sections dynamiquement (à la fin pour s'assurer que tous les changements de visibilité sont faits)
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
      editHeader.textContent = 'Modifier';
      headerRow.appendChild(editHeader);
      
      const deleteHeader = document.createElement('th');
      deleteHeader.className = 'delete-column';
      deleteHeader.textContent = 'Supprimer';
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
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.onclick = () => editExperience(row);
        editCell.appendChild(editBtn);
        row.appendChild(editCell);
        
        const deleteCell = document.createElement('td');
        deleteCell.className = 'delete-column';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
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
      editHeader.textContent = 'Modifier';
      headerRow.appendChild(editHeader);
      
      const deleteHeader = document.createElement('th');
      deleteHeader.className = 'delete-column';
      deleteHeader.textContent = 'Supprimer';
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
        editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
        editBtn.onclick = () => editFormation(row);
        editCell.appendChild(editBtn);
        row.appendChild(editCell);
        
        const deleteCell = document.createElement('td');
        deleteCell.className = 'delete-column';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
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
  // Récupérer les données de la ligne
  const cells = row.cells;
  const data = {
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

