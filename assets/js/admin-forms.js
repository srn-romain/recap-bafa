// Gestion des formulaires d'ajout/modification pour les admins

let currentEditingRow = null;
let currentEditingDocId = null;

// Afficher un message d'erreur dans la modale d'expérience
function showExperienceError(message) {
  const errorDiv = document.getElementById('experience-error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// Masquer le message d'erreur d'expérience
function hideExperienceError() {
  const errorDiv = document.getElementById('experience-error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

// Afficher le modal d'ajout d'expérience
function showAddExperienceModal() {
  document.getElementById('experience-modal-title').textContent = 'Ajouter une expérience';
  document.getElementById('experience-form').reset();
  hideExperienceError();
  currentEditingRow = null;
  currentEditingDocId = null;
  document.getElementById('experience-modal').style.display = 'flex';
  
  // Écouter les changements du mois pour mettre à jour le texte
  const monthInput = document.getElementById('exp-date-month');
  if (monthInput) {
    monthInput.addEventListener('change', function() {
      const dateText = monthToFrenchText(this.value);
      document.getElementById('exp-date').value = dateText;
    });
  }
}

// Convertir un mois (YYYY-MM) en texte français
function monthToFrenchText(monthValue) {
  if (!monthValue) return '';
  const [year, month] = monthValue.split('-');
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return '';
  return `${months[monthIndex]} ${year}`;
}

// Convertir un texte français en mois (YYYY-MM)
function frenchTextToMonth(dateText) {
  if (!dateText) return '';
  const months = {
    'janvier': '01', 'janv': '01', 'février': '02', 'févr': '02', 'mars': '03',
    'avril': '04', 'avr': '04', 'mai': '05', 'juin': '06',
    'juillet': '07', 'juil': '07', 'août': '08', 'septembre': '09', 'sept': '09',
    'octobre': '10', 'oct': '10', 'novembre': '11', 'nov': '11', 'décembre': '12', 'déc': '12'
  };
  const lowerText = dateText.toLowerCase();
  const yearMatch = lowerText.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '';
  let month = '01';
  for (const [monthName, monthNum] of Object.entries(months)) {
    if (lowerText.includes(monthName)) {
      month = monthNum;
      break;
    }
  }
  return year ? `${year}-${month}` : '';
}

// Extraire le nom du fichier du chemin complet du logo
function extractLogoFilename(logoPath) {
  if (!logoPath) return '';
  // Enlever le préfixe GitHub Pages
  const githubPrefix = 'https://srn-romain.github.io/recap-bafa/assets/img/';
  if (logoPath.startsWith(githubPrefix)) {
    return logoPath.replace(githubPrefix, '');
  }
  // Enlever le préfixe file:///C:/Users/Sieur/WebstormProjects/recap-bafa/
  const localPrefix = 'file:///C:/Users/Sieur/WebstormProjects/recap-bafa/';
  if (logoPath.startsWith(localPrefix)) {
    const withoutPrefix = logoPath.replace(localPrefix, '');
    // Si c'est assets/img/xxx, retourner juste xxx
    if (withoutPrefix.startsWith('assets/img/')) {
      return withoutPrefix.replace('assets/img/', '');
    }
    return withoutPrefix;
  }
  // Si c'est déjà assets/img/xxx, retourner juste xxx
  if (logoPath.startsWith('assets/img/')) {
    return logoPath.replace('assets/img/', '');
  }
  return logoPath;
}

// Afficher le modal d'édition d'expérience
function showEditExperienceModal(data, row) {
  document.getElementById('experience-modal-title').textContent = 'Modifier une expérience';
  hideExperienceError();
  
  // Remplir le formulaire avec les données
  document.getElementById('exp-type').value = data.type || 'colo';
  
  // Convertir la date française en format mois pour l'input month
  const monthValue = frenchTextToMonth(data.date || '');
  document.getElementById('exp-date-month').value = monthValue;
  document.getElementById('exp-date').value = data.date || '';
  
  document.getElementById('exp-duration').value = data.duration || '';
  document.getElementById('exp-organizer').value = data.organizer || '';
  document.getElementById('exp-organizer-url').value = data.organizerUrl || '';
  
  // Extraire juste le nom du fichier pour le logo
  document.getElementById('exp-logo-path').value = extractLogoFilename(data.logoPath || '');
  
  document.getElementById('exp-location').value = data.location || '';
  document.getElementById('exp-location-url').value = data.locationUrl || '';
  document.getElementById('exp-stay-type').value = data.stayType || '';
  document.getElementById('exp-position').value = data.position || '';
  document.getElementById('exp-age-range').value = data.ageRange || '';
  document.getElementById('exp-youth-count').value = data.youthCount || 0;
  
  currentEditingRow = row;
  currentEditingDocId = null;
  
  document.getElementById('experience-modal').style.display = 'flex';
}

// Fermer le modal d'expérience
function closeExperienceModal() {
  document.getElementById('experience-modal').style.display = 'none';
  currentEditingRow = null;
  currentEditingDocId = null;
}

// Fermer la modale au clic extérieur
document.addEventListener('DOMContentLoaded', function() {
  // Fermer les modales au clic sur le fond
  const modals = ['experience-modal', 'formation-modal', 'auth-modal', 'delete-confirm-modal'];
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          if (modalId === 'experience-modal') {
            closeExperienceModal();
          } else if (modalId === 'formation-modal') {
            closeFormationModal();
          } else if (modalId === 'auth-modal') {
            closeAuthModal();
          } else if (modalId === 'delete-confirm-modal') {
            closeDeleteConfirmModal();
          }
        }
      });
    }
  });
});

// Afficher un message d'erreur dans la modale de formation
function showFormationError(message) {
  const errorDiv = document.getElementById('formation-error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
}

// Masquer le message d'erreur de formation
function hideFormationError() {
  const errorDiv = document.getElementById('formation-error-message');
  if (errorDiv) {
    errorDiv.style.display = 'none';
  }
}

// Afficher le modal d'ajout de formation
function showAddFormationModal() {
  document.getElementById('formation-modal-title').textContent = 'Ajouter une formation';
  document.getElementById('formation-form').reset();
  hideFormationError();
  currentEditingRow = null;
  currentEditingDocId = null;
  document.getElementById('formation-modal').style.display = 'flex';
  
  // Écouter les changements du mois pour mettre à jour le texte
  const monthInput = document.getElementById('form-date-month');
  if (monthInput) {
    monthInput.addEventListener('change', function() {
      const dateText = monthToFrenchText(this.value);
      document.getElementById('form-date').value = dateText;
    });
  }
}

// Afficher le modal d'édition de formation
function showEditFormationModal(data, row) {
  document.getElementById('formation-modal-title').textContent = 'Modifier une formation';
  hideFormationError();
  
  // Remplir le formulaire avec les données
  document.getElementById('form-type').value = data.type || 'bafa';
  
  // Convertir la date française en format mois pour l'input month
  const monthValue = frenchTextToMonth(data.date || '');
  document.getElementById('form-date-month').value = monthValue;
  document.getElementById('form-date').value = data.date || '';
  
  document.getElementById('form-duration').value = data.duration || '';
  document.getElementById('form-organism').value = data.organism || '';
  document.getElementById('form-organism-url').value = data.organismUrl || '';
  
  // Extraire juste le nom du fichier pour le logo
  document.getElementById('form-logo-path').value = extractLogoFilename(data.logoPath || '');
  
  document.getElementById('form-title').value = data.title || '';
  document.getElementById('form-location').value = data.location || '';
  document.getElementById('form-location-url').value = data.locationUrl || '';
  
  currentEditingRow = row;
  currentEditingDocId = null;
  
  document.getElementById('formation-modal').style.display = 'flex';
}

// Fermer le modal de formation
function closeFormationModal() {
  document.getElementById('formation-modal').style.display = 'none';
  currentEditingRow = null;
  currentEditingDocId = null;
}

// Gérer la soumission du formulaire d'expérience
document.addEventListener('DOMContentLoaded', function() {
  const expForm = document.getElementById('experience-form');
  if (expForm) {
    expForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      hideExperienceError();
      
      if (window.userRole !== 'admin') {
        showExperienceError('Vous devez être administrateur pour effectuer cette action.');
        return;
      }
      
      // Convertir le mois sélectionné en texte français
      const monthValue = document.getElementById('exp-date-month').value;
      const dateText = monthValue ? monthToFrenchText(monthValue) : '';
      document.getElementById('exp-date').value = dateText;
      
      // Gérer le chemin du logo avec le préfixe GitHub Pages
      const logoFilename = document.getElementById('exp-logo-path').value.trim();
      const logoPath = logoFilename ? `https://srn-romain.github.io/recap-bafa/assets/img/${logoFilename}` : '';
      
      const data = {
        type: document.getElementById('exp-type').value,
        date: dateText,
        duration: document.getElementById('exp-duration').value || '',
        organizer: document.getElementById('exp-organizer').value,
        organizerUrl: document.getElementById('exp-organizer-url').value || '',
        logoPath: logoPath,
        location: document.getElementById('exp-location').value,
        locationUrl: document.getElementById('exp-location-url').value || '',
        stayType: document.getElementById('exp-stay-type').value || '',
        position: document.getElementById('exp-position').value || '',
        ageRange: document.getElementById('exp-age-range').value || '',
        youthCount: parseInt(document.getElementById('exp-youth-count').value || '0', 10)
      };
      
      try {
        if (currentEditingRow) {
          // Modification : trouver le document dans Firebase
          await updateExperienceInFirebase(data, currentEditingRow);
        } else {
          // Ajout
          await addExperienceToFirebase(data);
        }
        
        closeExperienceModal();
        // Recharger les données
        if (typeof loadDataFromFirebase === 'function') {
          await loadDataFromFirebase();
        }
      } catch (error) {
        console.error('Erreur:', error);
        showExperienceError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
      }
    });
  }
  
  // Gérer la soumission du formulaire de formation
  const formForm = document.getElementById('formation-form');
  if (formForm) {
    formForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      hideFormationError();
      
      if (window.userRole !== 'admin') {
        showFormationError('Vous devez être administrateur pour effectuer cette action.');
        return;
      }
      
      // Convertir le mois sélectionné en texte français
      const monthValue = document.getElementById('form-date-month').value;
      const dateText = monthValue ? monthToFrenchText(monthValue) : '';
      document.getElementById('form-date').value = dateText;
      
      // Gérer le chemin du logo avec le préfixe GitHub Pages
      const logoFilename = document.getElementById('form-logo-path').value.trim();
      const logoPath = logoFilename ? `https://srn-romain.github.io/recap-bafa/assets/img/${logoFilename}` : '';
      
      const data = {
        type: document.getElementById('form-type').value,
        date: dateText,
        duration: document.getElementById('form-duration').value || '',
        organism: document.getElementById('form-organism').value,
        organismUrl: document.getElementById('form-organism-url').value || '',
        logoPath: logoPath,
        title: document.getElementById('form-title').value || '',
        location: document.getElementById('form-location').value,
        locationUrl: document.getElementById('form-location-url').value || ''
      };
      
      try {
        if (currentEditingRow) {
          // Modification
          await updateFormationInFirebase(data, currentEditingRow);
        } else {
          // Ajout
          await addFormationToFirebase(data);
        }
        
        closeFormationModal();
        // Recharger les données
        if (typeof loadDataFromFirebase === 'function') {
          await loadDataFromFirebase();
        }
      } catch (error) {
        console.error('Erreur:', error);
        showFormationError('Erreur lors de l\'enregistrement. Veuillez réessayer.');
      }
    });
  }
  
  // Boutons d'ajout
  const addExpBtn = document.getElementById('add-experience-btn');
  if (addExpBtn) {
    addExpBtn.onclick = showAddExperienceModal;
  }
  
  const addFormBtn = document.getElementById('add-formation-btn');
  if (addFormBtn) {
    addFormBtn.onclick = showAddFormationModal;
  }
});

// Ajouter une expérience à Firebase
async function addExperienceToFirebase(data) {
  await window.firebaseDb.collection('experiences').add(data);
  console.log('Expérience ajoutée avec succès');
}

// Modifier une expérience dans Firebase
async function updateExperienceInFirebase(data, row) {
  // Trouver le document correspondant dans Firebase
  // On va chercher par les données de la ligne
  const date = row.cells[1]?.textContent?.trim();
  const organizer = row.cells[3]?.querySelector('a')?.textContent?.trim();
  
  const snapshot = await window.firebaseDb.collection('experiences')
    .where('date', '==', date)
    .where('organizer', '==', organizer)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.update(data);
    console.log('Expérience modifiée avec succès');
  } else {
    throw new Error('Document non trouvé');
  }
}

// Ajouter une formation à Firebase
async function addFormationToFirebase(data) {
  await window.firebaseDb.collection('formations').add(data);
  console.log('Formation ajoutée avec succès');
}

// Modifier une formation dans Firebase
async function updateFormationInFirebase(data, row) {
  const date = row.cells[1]?.textContent?.trim();
  const organism = row.cells[3]?.querySelector('a')?.textContent?.trim();
  
  const snapshot = await window.firebaseDb.collection('formations')
    .where('date', '==', date)
    .where('organism', '==', organism)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.update(data);
    console.log('Formation modifiée avec succès');
  } else {
    throw new Error('Document non trouvé');
  }
}

// Supprimer une expérience de Firebase
async function deleteExperienceFromFirebase(row) {
  const date = row.cells[1]?.textContent?.trim();
  const organizer = row.cells[3]?.querySelector('a')?.textContent?.trim();
  
  const snapshot = await window.firebaseDb.collection('experiences')
    .where('date', '==', date)
    .where('organizer', '==', organizer)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.delete();
    console.log('Expérience supprimée avec succès');
  } else {
    throw new Error('Document non trouvé');
  }
}

// Supprimer une formation de Firebase
async function deleteFormationFromFirebase(row) {
  const date = row.cells[1]?.textContent?.trim();
  const organism = row.cells[3]?.querySelector('a')?.textContent?.trim();
  
  const snapshot = await window.firebaseDb.collection('formations')
    .where('date', '==', date)
    .where('organism', '==', organism)
    .limit(1)
    .get();
  
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    await doc.ref.delete();
    console.log('Formation supprimée avec succès');
  } else {
    throw new Error('Document non trouvé');
  }
}

// La fonction handleLogin est maintenant dans firebase-auth.js

