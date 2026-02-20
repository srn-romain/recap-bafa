// Gestion des formulaires d'ajout/modification pour les admins

let currentEditingRow = null;
let currentEditingDocId = null;

/**
 * Gère l'affichage et les options du champ 'Gestion' ('exp-stay-type') selon le type d'expérience.
 */
function updateExpStayTypeOptions() {
  const expType = document.getElementById('exp-type').value;
  const staySelect = document.getElementById('exp-stay-type');
  if (!staySelect) return;
  const container = staySelect.closest('.form-group');

  // Toujours réafficher le container par défaut pour pouvoir repasser à un autre type
  if (container) container.style.display = 'block';

  // Options à potentiellement retirer
  const removableOptions = [
    { value: 'Scout', text: 'Scout' },
    { value: 'Péri-scolaire', text: 'Péri-scolaire' },
    { value: 'SNU', text: 'SNU (Service National Universel)' },
    { value: 'ALSH', text: 'ALSH (Accueil de Loisirs Sans Hébergement)' }
  ];

  // 1. Remettre toutes les options dans le DOM natif et Tom Select par défaut
  removableOptions.forEach(optData => {
    let opt = Array.from(staySelect.options).find(o => o.value === optData.value);
    if (!opt) {
      opt = document.createElement('option');
      opt.value = optData.value;
      opt.text = optData.text;
      // Insérer avant "Autre" pour garder un ordre correct
      const autreOpt = Array.from(staySelect.options).find(o => o.value === 'Autre');
      if (autreOpt) {
        staySelect.insertBefore(opt, autreOpt);
      } else {
        staySelect.appendChild(opt);
      }
    }
  });

  // Synchroniser avant suppression pour s'assurer de l'état clean
  if (staySelect.tomselect) staySelect.tomselect.sync();

  // 2. Appliquer les règles
  if (expType === 'alsh') {
    if (container) container.style.display = 'none';
    if (staySelect.tomselect) {
      staySelect.tomselect.setValue('ALSH', true);
    } else {
      staySelect.value = 'ALSH';
    }
  } else if (expType === 'scout') {
    if (container) container.style.display = 'none';
    if (staySelect.tomselect) {
      staySelect.tomselect.setValue('Scout', true);
    } else {
      staySelect.value = 'Scout';
    }
  } else if (expType === 'colo') {
    // Si la valeur actuelle est une qu'on va retirer, on la réinitialise
    const isRemovableSelected = removableOptions.some(opt => opt.value === staySelect.value);
    if (isRemovableSelected) {
      if (staySelect.tomselect) {
        staySelect.tomselect.setValue('', true);
      } else {
        staySelect.value = '';
      }
    }

    // Retirer complètement les options de removableOptions du DOM et de Tom Select
    removableOptions.forEach(optData => {
      // Du DOM natif
      const opt = Array.from(staySelect.options).find(o => o.value === optData.value);
      if (opt) opt.remove();
      // De Tom Select
      if (staySelect.tomselect) {
        staySelect.tomselect.removeOption(optData.value);
      }
    });

    // Synchronisation finale pour Colo
    if (staySelect.tomselect) staySelect.tomselect.sync();
  }

  // Reforcer le mask du container si ALSH ou Scout car tomselect peut recréer l'affichage
  if ((expType === 'alsh' || expType === 'scout') && container) container.style.display = 'none';
}
window.updateExpStayTypeOptions = updateExpStayTypeOptions;

/**
 * Gère l'affichage des champs de date selon le type d'expérience (ALSH vs autres)
 * et le mode (Ponctuel vs Tous les mercredis)
 */
function toggleAlshDateFields() {
  const expType = document.getElementById('exp-type').value;
  const alshOptions = document.getElementById('alsh-options');
  const standardDateContainer = document.getElementById('standard-date-container');
  const mercredisDateContainer = document.getElementById('mercredis-date-container');
  const durationInput = document.getElementById('exp-duration'); // Champ durée

  // Mise à jour de la liste 'gestion'
  if (typeof updateExpStayTypeOptions === 'function') {
    updateExpStayTypeOptions();
  }

  // Si c'est un ALSH ou Scout, on montre les options radio
  if (expType === 'alsh' || expType === 'scout') {
    alshOptions.style.display = 'block';

    // Vérifier quel radio est coché
    const isMercredis = document.querySelector('input[name="alsh-duration-type"][value="mercredis"]').checked;

    if (isMercredis) {
      // Mode "Tous les mercredis"
      standardDateContainer.style.display = 'none';
      mercredisDateContainer.style.display = 'block';

      const dayTypeSpan = document.getElementById('alsh-day-type');
      if (dayTypeSpan) {
        dayTypeSpan.textContent = (expType === 'scout') ? 'des samedis' : 'des mercredis';
      }

      // Masquer le champ durée standard car géré automatiquement (36j)
      // Mais on peut vouloir laisser l'info visible en lecture seule ou hidden logic
      // L'utilisateur demande "dans le champ durée '36' et disabled"
      if (durationInput) {
        durationInput.type = "number";
        durationInput.value = "36";
        durationInput.disabled = true;
      }
    } else {
      // Mode "Ponctuel" (comportement classique)
      standardDateContainer.style.display = 'block';
      mercredisDateContainer.style.display = 'none';

      if (durationInput) {
        durationInput.type = "number";
        durationInput.value = ""; // Reset quand on repasse en ponctuel (comportement par défaut au clic)
        durationInput.disabled = false;
        durationInput.placeholder = "Ex: 17";
      }
    }
  } else {
    // Pas ALSH (Colo, Autre) -> comportement classique
    alshOptions.style.display = 'none';
    standardDateContainer.style.display = 'block';
    mercredisDateContainer.style.display = 'none';

    if (durationInput) {
      durationInput.type = "number";
      durationInput.disabled = false;
      durationInput.placeholder = "Ex: 17";
    }
  }
}

/**
 * Met à jour l'année de fin et le texte informatif pour "Tous les mercredis"
 */
function updateMercredisYearEnd() {
  const startYearInput = document.getElementById('mercredis-year-start');
  const endYearSpan = document.getElementById('mercredis-year-end');
  const periodDisplay = document.getElementById('mercredis-period-display');

  const startYear = parseInt(startYearInput.value);

  if (startYear && startYear > 1900 && startYear < 2200) {
    const endYear = startYear + 1;
    endYearSpan.textContent = endYear;
    periodDisplay.textContent = `${startYear}-${endYear}`;
  } else {
    endYearSpan.textContent = 'AAAA';
    periodDisplay.textContent = 'XXXX-YYYY';
  }
}

// Exposer les fonctions globalement pour les attributs onchange/oninput HTML
window.toggleAlshDateFields = toggleAlshDateFields;
window.updateMercredisYearEnd = updateMercredisYearEnd;

/**
 * Formate un nom (lieu ou pays) : 
 * Première lettre en majuscule, le reste en minuscule.
 * Après un espace ou un tiret, la lettre suivante est mise en majuscule.
 */
function formatLocationName(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/(^|[\s\-])\S/g, function (match) {
    return match.toUpperCase();
  });
}

// Helper: Vérifier si l'utilisateur est propriétaire (uniquement le propriétaire peut modifier ses données)
function isOwner() {
  // Si on est sur une page utilisateur spécifique
  if (window.targetUid) {
    return (window.currentUser && window.currentUser.uid === window.targetUid);
  }
  // Si on est sur la page générale (legacy), seul l'admin peut modifier
  return window.userRole === 'admin';
}

// Helper: Obtenir la référence de la collection (reflète la logique de lecture)
function getCollectionRef(name) {
  if (window.targetUid) {
    return window.firebaseDb.collection('users').doc(window.targetUid).collection(name);
  }
  return window.firebaseDb.collection(name);
}

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

// Adapter les labels du menu "Intitulé du poste" selon le genre
async function updatePositionLabels() {
  const positionSelect = document.getElementById('exp-position');
  if (!positionSelect) return;

  // Charger le genre de l'utilisateur
  let gender = window.userGender || ''; // Utiliser le cache global si dispo

  if (!gender) {
    try {
      if (window.currentUser && window.firebaseDb) {
        const doc = await window.firebaseDb.collection('users').doc(window.currentUser.uid).get();
        if (doc.exists) {
          gender = doc.data().gender || '';
          window.userGender = gender; // Mettre à jour le cache
        }
      }
    } catch (e) {
      console.warn('Impossible de charger le genre:', e);
    }
  }

  // Définir les labels en fonction du genre
  const isFeminin = gender === 'feminin';

  // Mettre à jour les options (texte et valeur)
  const options = positionSelect.options;
  options[0].text = '-- Sélectionner --';
  options[0].value = '';

  const positions = [
    { m: 'Animateur Stagiaire', f: 'Animatrice Stagiaire' },
    { m: 'Animateur (diplômé)', f: 'Animatrice (diplômée)' },
    { m: 'Animateur Ski', f: 'Animatrice Ski' },
    { m: 'Animateur Snow', f: 'Animatrice Snow' },
    { m: 'Animateur SB', f: 'Animatrice SB' },
    { m: 'Animateur AS', f: 'Animatrice AS' },
    { m: 'Animateur Référent Handicap', f: 'Animatrice Référente Handicap' },
    { m: 'Responsable de Groupe', f: 'Responsable de Groupe' },
    { m: 'Surveillant de Baignade (non animateur)', f: 'Surveillante de Baignade (non animatrice)' },
    { m: 'Assistant Sanitaire (non animateur)', f: 'Assistante Sanitaire (non animatrice)' },
    { m: 'Tuteur de Maisonnée (SNU)', f: 'Tutrice de Maisonnée (SNU)' },
    { m: 'Cuisinier', f: 'Cuisinière' },
    { m: 'Directeur', f: 'Directrice' },
    { m: 'Directeur Stagiaire', f: 'Directrice Stagiaire' },
    { m: 'Directeur AS', f: 'Directrice AS' },
    { m: 'Directeur SB', f: 'Directrice SB' },
    { m: 'Directeur de Formation', f: 'Directrice de Formation' },
    { m: 'Directeur de Structure', f: 'Directrice de Structure' },
    { m: 'Directeur Adjoint', f: 'Directrice Adjointe' },
    { m: 'Directeur Adjoint & SB', f: 'Directrice Adjointe & SB' },
    { m: 'Directeur Adjoint & AS', f: 'Directrice Adjointe & AS' },
    { m: 'Formateur BAFA', f: 'Formatrice BAFA' },
    { m: 'Formateur BAFD', f: 'Formatrice BAFD' },
    { m: 'Respons Scout', f: 'Respons Scout' },
    { m: 'Chef Scout', f: 'Cheffe Scout' },
    { m: 'Autre (préciser)', f: 'Autre (préciser)' }
  ];

  positions.forEach((pos, index) => {
    // Enregistrement en base au masculin (pos.m)
    // Affichage au masculin ou féminin selon le genre (text)
    if (options[index + 1]) {
      options[index + 1].value = pos.m;
      options[index + 1].text = isFeminin ? pos.f : pos.m;
    }
  });

  // Synchroniser Tom Select si présent
  if (positionSelect.tomselect) {
    positionSelect.tomselect.sync();
  }
}


// Afficher le modal d'ajout d'expérience
async function showAddExperienceModal() {
  document.getElementById('experience-modal-title').textContent = 'Ajouter une expérience';
  const form = document.getElementById('experience-form');
  form.reset();

  // Reset Tom Selects
  ['exp-stay-type', 'exp-position'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.tomselect) el.tomselect.clear();
  });

  hideExperienceError();
  currentEditingRow = null;
  currentEditingDocId = null;

  // Réinitialiser le logo (image, input, erreurs)
  removeLogo();

  // Activer la recherche automatique par défaut en ajout
  const autoLogoCheck = document.getElementById('exp-auto-logo-check');
  if (autoLogoCheck) autoLogoCheck.checked = true;

  // Réinitialiser les champs de localisation
  clearItineraryTable();
  toggleLocationFields();

  // Initialiser l'affichage des champs ALSH
  toggleAlshDateFields();

  document.getElementById('experience-modal').style.display = 'flex';
  document.body.classList.add('modal-open');

  // Écouter les changements du mois pour mettre à jour le texte
  const monthInput = document.getElementById('exp-date-month');
  if (monthInput) {
    monthInput.addEventListener('change', function () {
      const dateText = monthToFrenchText(this.value);
      document.getElementById('exp-date').value = dateText;
    });
    // Ouvrir le calendrier au clic sur le champ entier
    monthInput.addEventListener('click', function () {
      if ('showPicker' in this) {
        this.showPicker();
      }
    });
  }

  // Listeners are now global to avoid accumulation

  // Afficher les messages d'info par défaut (pas de logo au départ)
  toggleLogoInfoMessages();

  // Adapter les labels selon le genre
  await updatePositionLabels();

  // Réinitialiser le champ custom
  const customInput = document.getElementById('exp-position-custom');
  if (customInput) {
    customInput.style.display = 'none';
    customInput.value = '';
    customInput.required = false;
  }

  // Réinitialiser les champs custom
  const stayCustom = document.getElementById('exp-stay-type-custom');
  if (stayCustom) {
    stayCustom.style.display = 'none';
    stayCustom.value = '';
    stayCustom.required = false;
  }

  const countryInput = document.getElementById('exp-country');
  if (countryInput) {
    countryInput.style.display = 'none';
    countryInput.value = '';
    countryInput.required = false;
  }

  // Initialiser les dropdowns de recherche
  initSearchableSelects();
}

// Initialiser Tom Select pour les listes déroulantes
function initSearchableSelects() {
  const ids = ['exp-stay-type', 'exp-position', 'form-title'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.tomselect) {
      new TomSelect(el, {
        create: false,
        sortField: [], // Désactiver le tri pour respecter l'ordre du DOM (groupes, hiérarchie)
        plugins: ['dropdown_input'], // Assure que l'input de recherche est dans le dropdown
        onInitialize: function () {
          // S'assurer que le container a la bonne largeur
          this.wrapper.style.width = '100%';
        }
      });
    }
  });
}

// Toggle l'affichage du champ "Autre" pour le type de séjour
window.toggleExpStayTypeCustom = function () {
  const select = document.getElementById('exp-stay-type');
  const customInput = document.getElementById('exp-stay-type-custom');
  const countryInput = document.getElementById('exp-country');

  if (select && customInput) {
    if (select.value === 'Autre') {
      customInput.style.display = 'block';
      customInput.required = true;
    } else {
      customInput.style.display = 'none';
      customInput.required = false;
    }
  }

  if (select && countryInput) {
    // Si le type contient "étranger" (peu importe la casse)
    if (select.value.toLowerCase().includes('étranger')) {
      countryInput.style.display = 'block';
      countryInput.required = true;
    } else {
      countryInput.style.display = 'none';
      countryInput.required = false;
      // Ne pas vider la valeur ici si on est en train de charger un edit
    }
  }

  // Masquer le département du lieu si c'est à l'étranger
  const locationDeptInput = document.getElementById('exp-location-dept');
  if (select && locationDeptInput) {
    if (select.value.toLowerCase().includes('étranger')) { // Casse et accent gérés par le .includes dans le HTML values
      locationDeptInput.style.display = 'none';
    } else {
      locationDeptInput.style.display = ''; // Revenir au style par défaut (flex item)
    }
  }
};

// Toggle l'affichage du champ "Autre" pour l'intitulé du poste d'une expérience
window.toggleExpPositionCustom = function () {
  const select = document.getElementById('exp-position');
  const customInput = document.getElementById('exp-position-custom');
  if (select && customInput) {
    const val = select.value;
    // Vérifier "Autre", "autre", ou "Autre (préciser)"
    if (val === 'Autre' || val === 'autre' || val === 'Autre (préciser)') {
      customInput.style.display = 'block';
      customInput.required = true;
    } else {
      customInput.style.display = 'none';
      customInput.required = false;
    }
  }
};

// Basculer l'affichage de l'explication pour l'URL Google Map
window.toggleMapExplanation = function (event, type) {
  if (event) event.preventDefault();
  const bubbleId = type === 'exp' ? 'exp-map-explanation-bubble' : 'form-map-explanation-bubble';
  const bubble = document.getElementById(bubbleId);
  if (bubble) {
    bubble.style.display = bubble.style.display === 'none' ? 'block' : 'none';
  }
};

// Toggle entre champs lieu unique et tableau itinérance
function toggleLocationFields() {
  toggleExpStayTypeCustom(); // Mettre à jour l'affichage du champ custom
  const stayType = document.getElementById('exp-stay-type')?.value;
  const singleFields = document.getElementById('single-location-fields');
  const itineraryFields = document.getElementById('itinerary-locations');
  const tbody = document.getElementById('itinerary-tbody');

  if (stayType && stayType.includes('Itinérance')) {
    if (singleFields) singleFields.style.display = 'none';
    if (itineraryFields) itineraryFields.style.display = 'block';
    // Désactiver le required sur le champ unique
    const expLocation = document.getElementById('exp-location');
    if (expLocation) expLocation.removeAttribute('required');

    // Initialiser avec une ligne si vide
    if (tbody && tbody.children.length === 0) {
      addItineraryRow();
      addItineraryRow();
    }

    updateItineraryRemoveButton();
  } else {
    if (singleFields) singleFields.style.display = 'block';
    if (itineraryFields) itineraryFields.style.display = 'none';
    // Réactiver le required sur le champ unique
    const expLocation = document.getElementById('exp-location');
    if (expLocation) expLocation.setAttribute('required', 'required');
  }
}

// Ajouter une ligne au tableau d'itinérance
function addItineraryRow(location = '', url = '') {
  const tbody = document.getElementById('itinerary-tbody');
  if (!tbody) return;

  const rowId = `itinerary-row-${Date.now()}`;

  const row = document.createElement('tr');
  row.id = rowId;
  row.style.background = 'white';
  row.style.borderBottom = '1px solid #bbf7d0';

  row.innerHTML = `
    <td style="padding: 10px;">
      <input type="text" class="itinerary-location" placeholder="Ex: Lyon" 
        style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; color: #1e293b; background: #fff; transition: all 0.2s;" 
        onfocus="this.style.borderColor='#2563eb'; this.style.outline='none'; this.style.boxShadow='0 0 0 2px rgba(37, 99, 235, 0.1)';" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none';">
    </td>
    <td style="padding: 10px;">
      <input type="url" class="itinerary-url" placeholder="https://maps.app.goo.gl/..." 
        style="width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.9rem; color: #1e293b; background: #fff; transition: all 0.2s;" 
        onfocus="this.style.borderColor='#2563eb'; this.style.outline='none'; this.style.boxShadow='0 0 0 2px rgba(37, 99, 235, 0.1)';" onblur="this.style.borderColor='#cbd5e1'; this.style.boxShadow='none';">
    </td>
  `;

  // Assigner les valeurs via JS pour éviter les problèmes d'échappement
  const inputs = row.getElementsByTagName('input');
  if (inputs.length >= 1) inputs[0].value = location || '';
  if (inputs.length >= 2) inputs[1].value = url || '';

  tbody.appendChild(row);

  updateItineraryRemoveButton();
}

// Supprimer la dernière ligne du tableau (sauf si c'est la seule)
function removeLastItineraryRow() {
  const tbody = document.getElementById('itinerary-tbody');
  // Ne supprimer que s'il reste plus d'une ligne
  if (tbody && tbody.children.length > 2) {
    tbody.lastElementChild.remove();
    updateItineraryRemoveButton();
  }
}

// Mettre à jour la visibilité du bouton "Retirer"
function updateItineraryRemoveButton() {
  const tbody = document.getElementById('itinerary-tbody');
  const removeBtn = document.getElementById('remove-itinerary-btn');
  if (tbody && removeBtn) {
    if (tbody.children.length > 2) {
      removeBtn.style.display = 'flex';
    } else {
      removeBtn.style.display = 'none';
    }
  }
}

// Récupérer les lieux d'itinérance
function getItineraryLocations() {
  const locations = [];
  const rows = document.querySelectorAll('#itinerary-tbody tr');

  rows.forEach(row => {
    const locationInput = row.querySelector('.itinerary-location');
    const urlInput = row.querySelector('.itinerary-url');

    if (locationInput && locationInput.value.trim()) {
      locations.push({
        location: formatLocationName(locationInput.value.trim()),
        url: urlInput ? urlInput.value.trim() : ''
      });
    }
  });

  return locations;
}

// Vider le tableau d'itinérance
function clearItineraryTable() {
  const tbody = document.getElementById('itinerary-tbody');
  if (tbody) {
    tbody.innerHTML = '';
  }
  updateItineraryRemoveButton();
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
// Convertir un texte français en mois (YYYY-MM)
function frenchTextToMonth(dateText) {
  if (!dateText) return '';
  const lowerText = dateText.toLowerCase();

  // Cas spécifique : Septembre 2023 - Juin 2024
  const alshMatch = lowerText.match(/septembre\s+(\d{4})\s*-\s*juin\s+(\d{4})/);
  if (alshMatch) {
    return `${alshMatch[1]}-09`;
  }

  const months = {
    'janvier': '01', 'janv': '01', 'février': '02', 'févr': '02', 'mars': '03',
    'avril': '04', 'avr': '04', 'mai': '05', 'juin': '06',
    'juillet': '07', 'juil': '07', 'août': '08', 'septembre': '09', 'sept': '09',
    'octobre': '10', 'oct': '10', 'novembre': '11', 'nov': '11', 'décembre': '12', 'déc': '12'
  };

  const yearMatch = lowerText.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '';
  let month = '01';

  // Si pas d'année, on ne peut pas former YYYY-MM valide pour le tri
  if (!year) return '';

  for (const [monthName, monthNum] of Object.entries(months)) {
    if (lowerText.includes(monthName)) {
      month = monthNum;
      break;
    }
  }
  return `${year}-${month}`;
}

// Extraire le nom du fichier ou retourner l'URL/Base64 tel quel
function extractLogoFilename(logoPath) {
  if (!logoPath) return '';

  // Si c'est du Base64 ou une URL complète (http/https), retourner tel quel
  if (logoPath.startsWith('data:image') || logoPath.startsWith('http')) {
    return logoPath;
  }

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

// Fonction pour auto-détecter le logo depuis l'URL
async function autoDetectLogo() {
  const urlInput = document.getElementById('exp-organizer-url');
  const logoInput = document.getElementById('exp-logo-path');
  const preview = document.getElementById('logo-preview');

  if (!urlInput || !urlInput.value) {
    alert("Veuillez d'abord entrer l'URL de l'organisateur.");
    return;
  }

  try {
    const url = new URL(urlInput.value);
    const domain = url.hostname;
    // Utiliser l'API Clearbit pour récupérer le logo
    const logoUrl = `https://logo.clearbit.com/${domain}`;

    // Tenter de récupérer l'image pour l'encoder en Base64
    // Note: Clearbit permet généralement le CORS
    const response = await fetch(logoUrl);
    if (!response.ok) throw new Error("Logo non trouvé");

    const blob = await response.blob();

    // Convertir en Base64
    const reader = new FileReader();
    reader.onloadend = function () {
      const base64data = reader.result;
      const placeholder = document.getElementById('logo-placeholder');
      const removeBtn = document.getElementById('remove-logo');

      logoInput.value = base64data;
      if (preview) {
        preview.src = base64data;
        preview.style.display = 'block';
      }
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      if (removeBtn) {
        removeBtn.style.display = 'inline-block';
      }
    }
    reader.readAsDataURL(blob);

  } catch (e) {
    console.error("Erreur auto-détection logo", e);
    // Fallback: essayer Google Favicon si Clearbit échoue, ou juste laisser l'utilisateur faire
    const fallbackUrl = `https://www.google.com/s2/favicons?domain=${urlInput.value}&sz=64`;
    const placeholder = document.getElementById('logo-placeholder');
    const removeBtn = document.getElementById('remove-logo');

    logoInput.value = fallbackUrl; // On met l'URL car on ne peut pas toujours fetch google favicons en CORS strict
    if (preview) {
      preview.src = fallbackUrl;
      preview.style.display = 'block';
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }
    if (removeBtn) {
      removeBtn.style.display = 'inline-block';
    }
  }
}

// Version async de autoDetectLogo pour utilisation lors de la soumission
// Version async de autoDetectLogo pour utilisation lors de la soumission
async function autoDetectLogoAsync(organizerUrl, modalType = 'exp', organizerName = '') {
  const prefix = modalType === 'form' ? 'form-' : '';
  const logoInputId = modalType === 'form' ? 'form-logo-path' : 'exp-logo-path';
  const previewId = modalType === 'form' ? 'form-logo-preview' : 'logo-preview';
  const placeholderId = modalType === 'form' ? 'form-logo-placeholder' : 'logo-placeholder';
  const removeBtnId = modalType === 'form' ? 'form-remove-logo' : 'remove-logo';

  const logoInput = document.getElementById(logoInputId);
  const preview = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const removeBtn = document.getElementById(removeBtnId);

  // Helper pour mettre à jour l'UI
  const updateUI = (src) => {
    if (logoInput) logoInput.value = src;
    if (preview) {
      preview.src = src;
      preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'inline-block';

    if (modalType === 'form') {
      toggleFormationLogoInfo();
    } else {
      toggleLogoInfoMessages();
    }
  };

  // Helper fetch blob and convert to base64
  const urlToBase64 = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ${url}`);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      throw e;
    }
  };

  // 1. Essayer avec l'URL si présente : Google Favicon (Le plus robuste pour "via le site")
  if (organizerUrl) {
    try {
      let domain = '';
      try {
        const url = new URL(organizerUrl);
        domain = url.hostname;
      } catch (e) {
        domain = organizerUrl;
      }

      // Essai 1: Google Favicon (128px)
      const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      // Tenter de le convertir en Base64 (CORS peut bloquer)
      try {
        const base64 = await urlToBase64(googleUrl);
        updateUI(base64);
        return base64;
      } catch (corsErr) {
        // Si CORS bloque, on utilise l'URL directement (ça marche dans <img src=...>)
        updateUI(googleUrl);
        return googleUrl;
      }
    } catch (e) {
      // Continue vers Clearbit si échec total (rare pour Google)
    }
  }

  // 1b. Clearbit par Domaine (fallback qualité)
  if (organizerUrl) {
    try {
      let domain = '';
      try { domain = new URL(organizerUrl).hostname; } catch (e) { domain = organizerUrl; }

      const logoUrl = `https://logo.clearbit.com/${domain}`;
      const base64 = await urlToBase64(logoUrl);
      updateUI(base64);
      return base64;
    } catch (e) { }
  }

  // 2. Essayer de trouver le VRAI LOGO par le NOM (via Clearbit Autocomplete)
  if (organizerName) {
    try {
      const searchUrl = `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(organizerName)}`;
      const res = await fetch(searchUrl);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].logo) {
          const logoUrl = data[0].logo;
          try {
            const base64 = await urlToBase64(logoUrl);
            updateUI(base64);
            return base64;
          } catch (uploadErr) {
            updateUI(logoUrl);
            return logoUrl;
          }
        }
      }
    } catch (e) {
      console.warn("Recherche Autocomplete Clearbit échouée", e);
    }
  }

  // 3. Fallback: Google Favicon
  if (organizerUrl) {
    try {
      let domain = '';
      try { domain = new URL(organizerUrl).hostname; } catch (e) { domain = organizerUrl; }
      const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      updateUI(googleUrl);
      return googleUrl;
    } catch (e) { }
  }

  // 4. Fallback ULTIME: Logo Abstrait/Généré (DiceBear Shapes)
  if (organizerName) {
    const avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(organizerName)}`;
    try {
      const base64 = await urlToBase64(avatarUrl);
      updateUI(base64);
      return base64;
    } catch (e) {
      updateUI(avatarUrl);
      return avatarUrl;
    }
  }

  return null;
}

// Constantes pour la validation des images
const MAX_LOGO_SIZE_MB = 2;
const MAX_LOGO_SIZE_BYTES = MAX_LOGO_SIZE_MB * 1024 * 1024;

// Gestionnaire pour l'upload du fichier logo
function initLogoFileUpload() {
  const fileInput = document.getElementById('exp-logo-file');
  const logoPathInput = document.getElementById('exp-logo-path');
  const preview = document.getElementById('logo-preview');
  const errorEl = document.getElementById('exp-logo-error');

  if (!fileInput) return;

  fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];

    // Réinitialiser les erreurs
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }

    if (!file) return;

    // Vérifier la taille du fichier
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      if (errorEl) {
        errorEl.textContent = `⚠️ L'image est trop lourde (${(file.size / 1024 / 1024).toFixed(2)} Mo). Taille maximale : ${MAX_LOGO_SIZE_MB} Mo.`;
        errorEl.style.display = 'block';
      }
      fileInput.value = ''; // Réinitialiser l'input
      return;
    }

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      if (errorEl) {
        errorEl.textContent = '⚠️ Le fichier doit être une image.';
        errorEl.style.display = 'block';
      }
      fileInput.value = '';
      return;
    }

    // Convertir l'image en Base64
    const reader = new FileReader();
    reader.onloadend = function () {
      const base64data = reader.result;
      const placeholder = document.getElementById('logo-placeholder');
      const removeBtn = document.getElementById('remove-logo');

      // Mettre à jour l'input hidden
      if (logoPathInput) {
        logoPathInput.value = base64data;
      }

      // Afficher le preview et cacher le placeholder
      if (preview) {
        preview.src = base64data;
        preview.style.display = 'block';
      }
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      if (removeBtn) {
        removeBtn.style.display = 'inline-block';
      }

      // Cacher les messages d'info auto-détection
      toggleLogoInfoMessages();
    };
    reader.onerror = function () {
      if (errorEl) {
        errorEl.textContent = '⚠️ Erreur lors de la lecture du fichier.';
        errorEl.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  });
}

// Gestionnaire pour l'upload du fichier logo (Formation)
function initFormationLogoFileUpload() {
  const fileInput = document.getElementById('form-logo-file');
  const logoPathInput = document.getElementById('form-logo-path');
  const preview = document.getElementById('form-logo-preview');
  const errorEl = document.getElementById('form-logo-error');

  if (!fileInput) return;

  fileInput.addEventListener('change', function (e) {
    const file = e.target.files[0];

    // Réinitialiser les erreurs
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }

    if (!file) return;

    // Vérifier la taille du fichier
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      if (errorEl) {
        errorEl.textContent = `⚠️ L'image est trop lourde (${(file.size / 1024 / 1024).toFixed(2)} Mo). Taille maximale : ${MAX_LOGO_SIZE_MB} Mo.`;
        errorEl.style.display = 'block';
      }
      fileInput.value = '';
      return;
    }

    // Vérifier que c'est une image
    if (!file.type.startsWith('image/')) {
      if (errorEl) {
        errorEl.textContent = '⚠️ Le fichier doit être une image.';
        errorEl.style.display = 'block';
      }
      fileInput.value = '';
      return;
    }

    // Convertir l'image en Base64
    const reader = new FileReader();
    reader.onloadend = function () {
      const base64data = reader.result;
      const placeholder = document.getElementById('form-logo-placeholder');
      const removeBtn = document.getElementById('form-remove-logo');

      // Mettre à jour l'input hidden
      if (logoPathInput) {
        logoPathInput.value = base64data;
      }

      // Afficher le preview et cacher le placeholder
      if (preview) {
        preview.src = base64data;
        preview.style.display = 'block';
      }
      if (placeholder) {
        placeholder.style.display = 'none';
      }
      if (removeBtn) {
        removeBtn.style.display = 'inline-block';
      }

      toggleFormationLogoInfo();
    };
    reader.readAsDataURL(file);
  });
}

// Afficher/Masquer info logo formation
function toggleFormationLogoInfo() {
  const logoPathInput = document.getElementById('form-logo-path');
  const preview = document.getElementById('form-logo-preview');
  const infoSmall = document.getElementById('form-logo-auto-info-small');
  const infoBox = document.getElementById('form-logo-auto-info-box');

  const hasLogo = (logoPathInput && logoPathInput.value.trim()) ||
    (preview && preview.style.display === 'block');

  if (infoSmall) {
    infoSmall.style.display = hasLogo ? 'none' : 'block';
  }
  if (infoBox) {
    infoBox.style.display = hasLogo ? 'none' : 'block';
  }
}

// Supprimer logo formation
function removeFormationLogo() {
  const fileInput = document.getElementById('form-logo-file');
  const logoPathInput = document.getElementById('form-logo-path');
  const preview = document.getElementById('form-logo-preview');
  const placeholder = document.getElementById('form-logo-placeholder');
  const removeBtn = document.getElementById('form-remove-logo');
  const errorEl = document.getElementById('form-logo-error');

  if (fileInput) fileInput.value = '';
  if (logoPathInput) logoPathInput.value = '';
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (placeholder) {
    placeholder.style.display = 'flex';
  }
  if (removeBtn) {
    removeBtn.style.display = 'none';
  }
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  toggleFormationLogoInfo();
}

// Fonction pour afficher/masquer les messages d'info selon la présence du logo
function toggleLogoInfoMessages() {
  const logoPathInput = document.getElementById('exp-logo-path');
  const preview = document.getElementById('logo-preview');
  const infoSmall = document.getElementById('logo-auto-info-small');
  const infoBox = document.getElementById('logo-auto-info-box');

  // Vérifier si un logo est présent
  const hasLogo = (logoPathInput && logoPathInput.value.trim()) ||
    (preview && preview.style.display === 'block');

  // Cacher les messages si un logo est présent, les afficher sinon
  if (infoSmall) {
    infoSmall.style.display = hasLogo ? 'none' : 'block';
  }
  if (infoBox) {
    infoBox.style.display = hasLogo ? 'none' : 'block';
  }
}

// Fonction pour supprimer le logo
function removeLogo() {
  const fileInput = document.getElementById('exp-logo-file');
  const logoPathInput = document.getElementById('exp-logo-path');
  const preview = document.getElementById('logo-preview');
  const placeholder = document.getElementById('logo-placeholder');
  const removeBtn = document.getElementById('remove-logo');
  const errorEl = document.getElementById('exp-logo-error');

  // Réinitialiser tous les éléments
  if (fileInput) fileInput.value = '';
  if (logoPathInput) logoPathInput.value = '';
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  if (placeholder) {
    placeholder.style.display = 'flex';
  }
  if (removeBtn) {
    removeBtn.style.display = 'none';
  }
  if (errorEl) {
    errorEl.style.display = 'none';
    errorEl.textContent = '';
  }

  // Afficher les messages d'info puisqu'il n'y a plus de logo
  toggleLogoInfoMessages();
}

// Initialiser le gestionnaire lors de l'ouverture de la modale
document.addEventListener('DOMContentLoaded', function () {
  initLogoFileUpload();
  initFormationLogoFileUpload();
});

// Afficher le modal d'édition d'expérience
async function showEditExperienceModal(data, row) {
  document.getElementById('experience-modal-title').textContent = 'Modifier une expérience';
  hideExperienceError();

  // Remplir le formulaire avec les données
  document.getElementById('exp-type').value = data.type || 'colo';

  // Gestion spécifique ALSH (Mercredis vs Ponctuel)
  const isAlsh = (data.type === 'alsh' || data.type === 'scout');
  // On vérifie si la durée contient "Tous les mercredis" ou "Tous les samedis"
  const durationLower = (data.duration || '').toLowerCase();
  const isMercredis = durationLower.includes('mercredis') || durationLower.includes('samedis');

  if (isAlsh) {
    if (isMercredis) {
      const mercredisRadio = document.querySelector('input[name="alsh-duration-type"][value="mercredis"]');
      if (mercredisRadio) mercredisRadio.checked = true;

      // Extraire l'année de départ depuis la date (ex: "Septembre 2023 ...")
      const yearMatch = (data.date || '').match(/septembre\s+(\d{4})/i);
      if (yearMatch) {
        const startYear = yearMatch[1];
        const startInput = document.getElementById('mercredis-year-start');
        if (startInput) {
          startInput.value = startYear;
          // Mettre à jour l'affichage de l'année de fin
          if (typeof updateMercredisYearEnd === 'function') {
            updateMercredisYearEnd();
          }
        }
      }
    } else {
      const ponctuelRadio = document.querySelector('input[name="alsh-duration-type"][value="ponctuel"]');
      if (ponctuelRadio) ponctuelRadio.checked = true;
    }
  } else {
    // Reset par défaut
    const ponctuelRadio = document.querySelector('input[name="alsh-duration-type"][value="ponctuel"]');
    if (ponctuelRadio) ponctuelRadio.checked = true;
  }

  // Appliquer la visibilité des champs selon le type et le mode
  if (typeof toggleAlshDateFields === 'function') {
    toggleAlshDateFields();
  }

  // Convertir la date française en format mois pour l'input month
  const monthValue = frenchTextToMonth(data.date || '');
  document.getElementById('exp-date-month').value = monthValue;
  document.getElementById('exp-date').value = data.date || '';

  // Parser la durée pour enlever " jours" ou " jour"
  let durationVal = data.duration || '';
  const durationMatch = durationVal.match(/^(\d+)/);
  if (durationMatch) {
    document.getElementById('exp-duration').value = durationMatch[1];
  } else {
    // Si pas de match (ex: "Tous les mercredis"), on ne vide le champ QUE si on n'est pas en mode Mercredis
    // En mode Mercredis, toggleAlshDateFields a déjà mis "36"
    const isMercredisMode = document.querySelector('input[name="alsh-duration-type"][value="mercredis"]').checked;
    if (!isMercredisMode) {
      document.getElementById('exp-duration').value = '';
    }
  }
  const rawOrganizer = data.organizer || '';
  // Matcher "Nom (Dept)"
  const organizerMatch = rawOrganizer.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (organizerMatch) {
    document.getElementById('exp-organizer').value = organizerMatch[1].trim();
    document.getElementById('exp-dept').value = organizerMatch[2].trim();
  } else {
    document.getElementById('exp-organizer').value = rawOrganizer;
    document.getElementById('exp-dept').value = '';
  }
  document.getElementById('exp-organizer-url').value = data.organizerUrl || '';

  // Gérer le logo
  const logoPath = extractLogoFilename(data.logoPath || '');
  document.getElementById('exp-logo-path').value = logoPath;

  // Afficher le preview du logo si disponible
  const preview = document.getElementById('logo-preview');
  const placeholder = document.getElementById('logo-placeholder');
  const removeBtn = document.getElementById('remove-logo');

  if (logoPath) {
    if (preview) {
      preview.src = data.logoPath || '';
      preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'inline-block';
  } else {
    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';

    // Désactiver la recherche automatique par défaut en modification si pas de logo
    const autoLogoCheck = document.getElementById('exp-auto-logo-check');
    if (autoLogoCheck) autoLogoCheck.checked = false;
  }

  // Gérer le type de séjour et les lieux
  const stayTypeVal = data.stayType || '';

  const stayTypeSelect = document.getElementById('exp-stay-type');
  const stayTypeCustom = document.getElementById('exp-stay-type-custom');

  let optionExists = false;
  if (stayTypeSelect) {
    for (let i = 0; i < stayTypeSelect.options.length; i++) {
      if (stayTypeSelect.options[i].value === stayTypeVal) {
        optionExists = true;
        break;
      }
    }
  }

  if (optionExists) {
    if (stayTypeSelect) {
      stayTypeSelect.value = stayTypeVal;
      if (stayTypeSelect.tomselect) stayTypeSelect.tomselect.setValue(stayTypeVal);
    }
    if (stayTypeCustom) {
      stayTypeCustom.style.display = 'none';
      stayTypeCustom.value = '';
    }
  } else if (stayTypeVal) {
    // C'est un type personnalisé -> "Autre"
    if (stayTypeSelect) {
      stayTypeSelect.value = 'Autre';
      if (stayTypeSelect.tomselect) stayTypeSelect.tomselect.setValue('Autre');
    }
    if (stayTypeCustom) {
      stayTypeCustom.style.display = 'block';
      stayTypeCustom.value = stayTypeVal;
    }
  } else {
    if (stayTypeSelect) {
      stayTypeSelect.value = '';
      if (stayTypeSelect.tomselect) stayTypeSelect.tomselect.clear();
    }
    if (stayTypeCustom) {
      stayTypeCustom.style.display = 'none';
      stayTypeCustom.value = '';
    }
  }

  // Gérer le pays
  const countryInput = document.getElementById('exp-country');
  if (countryInput) {
    countryInput.value = data.country || '';
    // L'affichage sera géré par toggleLocationFields (qui appelle toggleExpStayTypeCustom)
  }

  // Basculer vers le bon mode (itinérance ou classique)
  toggleLocationFields();

  // Données d'itinérance : utiliser uniquement 'locations'
  const itineraryData = data.locations || [];

  if (stayTypeVal && stayTypeVal.includes('Itinérance')) {
    // Mode itinérance : pré-remplir le tableau
    clearItineraryTable();
    if (itineraryData && itineraryData.length > 0) {
      itineraryData.forEach(loc => {
        // Supporter loc.location (nouveau) et loc.name (ancien) si transition
        const locationName = loc.location || loc.name || '';
        addItineraryRow(locationName, loc.url);
      });
    } else {
      // Si vide, ajouter une ligne initiale
      addItineraryRow();
    }
  } else {
    // Mode classique : pré-remplir les champs uniques (Nom + Dept)
    const rawLocation = data.location || '';
    const locationMatch = rawLocation.match(/^(.*?)\s*\(([^)]+)\)$/);
    if (locationMatch) {
      document.getElementById('exp-location').value = locationMatch[1].trim();
      document.getElementById('exp-location-dept').value = locationMatch[2].trim();
    } else {
      document.getElementById('exp-location').value = rawLocation;
      document.getElementById('exp-location-dept').value = '';
    }
    document.getElementById('exp-location-url').value = data.locationUrl || '';
  }

  // Adapter les labels (et valeurs) selon le genre AVANT de sélectionner la valeur
  await updatePositionLabels();

  const positionSelect = document.getElementById('exp-position');
  const customPositionInput = document.getElementById('exp-position-custom');

  if (positionSelect) {
    const currentPosition = data.position || '';
    let optionExists = false;

    // Vérifier si la position existe dans les options
    for (let i = 0; i < positionSelect.options.length; i++) {
      if (positionSelect.options[i].value === currentPosition) {
        optionExists = true;
        break;
      }
    }

    if (optionExists) {
      positionSelect.value = currentPosition;
      if (customPositionInput) {
        customPositionInput.value = '';
        customPositionInput.style.display = 'none';
        customPositionInput.required = false;
      }
    } else if (currentPosition) {
      // Si n'existe pas, mettre "Autre" et remplir le champ custom
      positionSelect.value = 'Autre';
      if (customPositionInput) {
        customPositionInput.value = currentPosition;
        customPositionInput.style.display = 'block';
        customPositionInput.required = true;
      }
    } else {
      positionSelect.value = '';
      if (customPositionInput) {
        customPositionInput.value = '';
        customPositionInput.style.display = 'none';
        customPositionInput.required = false;
      }
    }
  }

  // Parser la tranche d'âge (ex: "11 - 13 ans" ou "12 ans")
  const ageRange = data.ageRange || '';
  const ageMatchRange = ageRange.match(/(\d+)\s*-\s*(\d+)/);
  const ageMatchSingle = ageRange.match(/^(\d+)\s*ans$/); // Matcher "12 ans" précisément

  if (ageMatchRange) {
    document.getElementById('exp-age-min').value = ageMatchRange[1];
    document.getElementById('exp-age-max').value = ageMatchRange[2];
  } else if (ageMatchSingle) {
    document.getElementById('exp-age-min').value = ageMatchSingle[1];
    document.getElementById('exp-age-max').value = '';
  } else {
    document.getElementById('exp-age-min').value = '';
    document.getElementById('exp-age-max').value = '';
  }
  document.getElementById('exp-youth-count').value = data.youthCount || 0;

  currentEditingRow = row;
  currentEditingDocId = null;

  // Ajouter l'event listener pour le changement de type de séjour
  if (stayTypeSelect) {
    stayTypeSelect.addEventListener('change', toggleLocationFields);
  }

  // Gérer l'affichage des messages d'info selon la présence du logo
  toggleLogoInfoMessages();

  // Appliquer la logique du type de gestion une dernière fois pour être sûr
  if (typeof updateExpStayTypeOptions === 'function') {
    updateExpStayTypeOptions();
  }

  document.getElementById('experience-modal').style.display = 'flex';
  document.body.classList.add('modal-open');
}

// Fermer le modal d'expérience
function closeExperienceModal() {
  document.getElementById('experience-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
  currentEditingRow = null;
  currentEditingDocId = null;

  // Réinitialiser le message d'erreur du logo
  const logoError = document.getElementById('exp-logo-error');
  if (logoError) {
    logoError.style.display = 'none';
    logoError.textContent = '';
  }

  // Réinitialiser l'input file
  const logoFileInput = document.getElementById('exp-logo-file');
  if (logoFileInput) {
    logoFileInput.value = '';
  }
}

// Fermer la modale au clic extérieur
document.addEventListener('DOMContentLoaded', function () {
  // Fermer les modales au clic sur le fond
  const modals = ['experience-modal', 'formation-modal', 'auth-modal', 'delete-confirm-modal'];
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.addEventListener('click', function (e) {
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

window.toggleFormTitleCustom = function () {
  const select = document.getElementById('form-title');
  const customInput = document.getElementById('form-title-custom');
  if (select && customInput) {
    if (select.value === 'Autre') {
      customInput.style.display = 'block';
      customInput.required = true;
    } else {
      customInput.style.display = 'none';
      customInput.required = false;
      // Ne pas vider la valeur si on bascule juste pour voir, mais bon UX standard : vider
      // customInput.value = ''; 
    }
  }
};

// Afficher le modal d'ajout de formation
function showAddFormationModal() {
  document.getElementById('formation-modal-title').textContent = 'Ajouter une formation';
  document.getElementById('formation-form').reset();

  // Reset Tom Select
  const titleSelect = document.getElementById('form-title');
  if (titleSelect && titleSelect.tomselect) titleSelect.tomselect.clear();

  const customInput = document.getElementById('form-title-custom');
  if (customInput) { customInput.style.display = 'none'; }

  hideFormationError();
  // Réinitialiser les logos
  removeFormationLogo();
  toggleFormationLogoInfo();

  // Activer la recherche automatique par défaut en ajout
  const autoLogoCheck = document.getElementById('form-auto-logo-check');
  if (autoLogoCheck) autoLogoCheck.checked = true;

  currentEditingRow = null;
  currentEditingDocId = null;
  document.getElementById('formation-modal').style.display = 'flex';
  document.body.classList.add('modal-open');

  // Écouter les changements du mois pour mettre à jour le texte
  const monthInput = document.getElementById('form-date-month');
  if (monthInput) {
    monthInput.addEventListener('change', function () {
      const dateText = monthToFrenchText(this.value);
      document.getElementById('form-date').value = dateText;
    });
    // Ouvrir le calendrier au clic sur le champ entier
    monthInput.addEventListener('click', function () {
      if ('showPicker' in this) {
        this.showPicker();
      }
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

  // Parser la durée pour enlever " jours" ou " jour"
  let durationVal = data.duration || '';
  const durationMatch = durationVal.match(/^(\d+)/);
  if (durationMatch) {
    document.getElementById('form-duration').value = durationMatch[1];
  } else {
    document.getElementById('form-duration').value = '';
  }

  const rawOrganism = data.organism || '';
  // Matcher "Nom (Dept)"
  const organismMatch = rawOrganism.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (organismMatch) {
    document.getElementById('form-organism').value = organismMatch[1].trim();
    document.getElementById('form-organism-dept').value = organismMatch[2].trim();
  } else {
    document.getElementById('form-organism').value = rawOrganism;
    document.getElementById('form-organism-dept').value = '';
  }
  document.getElementById('form-organism-url').value = data.organismUrl || '';

  // Gérer le logo
  const logoPath = extractLogoFilename(data.logoPath || '');
  document.getElementById('form-logo-path').value = logoPath;

  const preview = document.getElementById('form-logo-preview');
  const placeholder = document.getElementById('form-logo-placeholder');
  const removeBtn = document.getElementById('form-remove-logo');

  if (logoPath) {
    if (preview) {
      preview.src = data.logoPath || ''; // Utiliser path complet pour src
      preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
    if (removeBtn) removeBtn.style.display = 'inline-block';
  } else {
    removeFormationLogo();
  }
  toggleFormationLogoInfo();

  // Désactiver la recherche automatique par défaut en modification si pas de logo
  if (!logoPath) {
    const autoLogoCheck = document.getElementById('form-auto-logo-check');
    if (autoLogoCheck) autoLogoCheck.checked = false;
  }

  // Gérer l'intitulé (Select ou Custom)
  const currentTitle = data.title || '';
  const titleSelect = document.getElementById('form-title');
  const customTitleInput = document.getElementById('form-title-custom');

  // Vérifier si le titre existe dans les options
  let optionExists = false;
  if (titleSelect) {
    for (let i = 0; i < titleSelect.options.length; i++) {
      if (titleSelect.options[i].value === currentTitle) {
        optionExists = true;
        break;
      }
    }

    if (optionExists) {
      titleSelect.value = currentTitle;
      if (titleSelect.tomselect) titleSelect.tomselect.setValue(currentTitle);

      if (customTitleInput) {
        customTitleInput.value = '';
        customTitleInput.style.display = 'none';
      }
    } else {
      // Si n'existe pas, mettre "Autre" et remplir le champ custom
      titleSelect.value = 'Autre';
      if (titleSelect.tomselect) titleSelect.tomselect.setValue('Autre');

      if (customTitleInput) {
        customTitleInput.value = currentTitle;
        customTitleInput.style.display = 'block';
      }
    }
  }
  const rawLocation = data.location || '';
  const locationMatch = rawLocation.match(/^(.*?)\s*\(([^)]+)\)$/);
  if (locationMatch) {
    document.getElementById('form-location').value = locationMatch[1].trim();
    document.getElementById('form-location-dept').value = locationMatch[2].trim();
  } else {
    document.getElementById('form-location').value = rawLocation;
    document.getElementById('form-location-dept').value = '';
  }
  document.getElementById('form-location-url').value = data.locationUrl || '';

  currentEditingRow = row;
  currentEditingDocId = null;

  document.getElementById('formation-modal').style.display = 'flex';
  document.body.classList.add('modal-open');
}

// Fermer le modal de formation
function closeFormationModal() {
  document.getElementById('formation-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
  currentEditingRow = null;
  currentEditingDocId = null;
}

// Initialisation des Event Listeners globaux
document.addEventListener('DOMContentLoaded', function () {
  // Listener pour le changement de type de séjour (Expérience)
  const expStaySelect = document.getElementById('exp-stay-type');
  if (expStaySelect) {
    expStaySelect.addEventListener('change', toggleLocationFields);
  }

  // Écouter le changement de type d'expérience pour afficher/masquer les options ALSH
  const expTypeSelect = document.getElementById('exp-type');
  if (expTypeSelect) {
    expTypeSelect.addEventListener('change', toggleAlshDateFields);
  }

});

// Gérer la soumission du formulaire d'expérience
document.addEventListener('DOMContentLoaded', function () {
  const expForm = document.getElementById('experience-form');
  if (expForm) {
    expForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      hideExperienceError();

      if (!isOwner()) {
        showExperienceError('Vous devez être propriétaire ou administrateur pour effectuer cette action.');
        return;
      }

      // Logique de validation et construction de date selon le mode
      let finalDate = '';
      let finalDuration = '';

      const expType = document.getElementById('exp-type').value;
      const isAlshOrScout = (expType === 'alsh' || expType === 'scout');
      const isMercredis = isAlshOrScout && document.querySelector('input[name="alsh-duration-type"][value="mercredis"]').checked;

      if (isMercredis) {
        // Validation année
        const startYear = document.getElementById('mercredis-year-start').value;
        if (!startYear || startYear < 2000 || startYear > 2100) {
          showExperienceError("Veuillez saisir une année de départ valide.");
          return;
        }
        const endYear = parseInt(startYear) + 1;
        finalDate = `Septembre ${startYear} - Juin ${endYear}`;

        // La durée est fixée à "Tous les mercredis" ou "Tous les samedis"
        finalDuration = (expType === 'scout') ? "Tous les samedis" : "Tous les mercredis";
      } else {
        // Mode classique (Ponctuel ou Colo/Autre)
        const monthValue = document.getElementById('exp-date-month').value;
        if (!monthValue) {
          showExperienceError("Veuillez saisir une date.");
          return;
        }
        finalDate = monthToFrenchText(monthValue);

        // Si le champ durée est désactivé (bug potentiel de transition), on prend la valeur
        // Si c'est ponctuel, l'utilisateur saisit un nombre
        const durationInput = document.getElementById('exp-duration');
        // On s'assure de récupérer la valeur même si on vient de repasser "type text" à "number" ou inversement
        // Normalement toggleAlshDateFields gère l'input type
        finalDuration = durationInput.value;
        if (!finalDuration && durationInput.type === 'number') {
          // Durée optionnelle ? Le placeholder dit Ex: 17, mais label n'a pas *. 
          // On laisse vide si vide.
        }
      }

      // On met la date formatée dans le champ hidden pour qu'elle soit récupérée par getFormData ou la suite
      document.getElementById('exp-date').value = finalDate;
      // Pour la durée, il faudra peut-être l'injecter manuellement dans l'objet `data` plus bas 
      // car le champ input standard pourrait être ignoré ou avoir une valeur "Tous les mercredis"


      const stayType = document.getElementById('exp-stay-type').value || '';

      // Gérer les lieux selon le type de séjour

      let location = null;
      let locationUrl = null;
      let itineraryLocations = null;

      if (stayType && stayType.includes('Itinérance')) {
        // Mode itinérance : récupérer le tableau de lieux
        itineraryLocations = getItineraryLocations();
        if (itineraryLocations.length === 0 || itineraryLocations.length === 1) {
          showExperienceError('Veuillez remplir au moins deux lieux pour l\'itinérance.');
          return;
        }
        // En itinérance, on vide explicitement les champs location et locationUrl
        location = null;
        locationUrl = null;
      } else {
        // Mode classique : un seul lieu
        const locName = formatLocationName(document.getElementById('exp-location').value.trim());
        const locDept = document.getElementById('exp-location-dept').value.trim().toUpperCase();

        // Validation du département (chiffres ou 2A/2B)
        if (locDept && !/^\d+$|^2[AB]$/.test(locDept)) {
          showExperienceError('Le département doit être composé de chiffres ou être 2A/2B.');
          return;
        }

        location = locDept ? `${locName} (${locDept})` : locName;

        // Générer lien Google Maps si vide
        const rawLocUrl = document.getElementById('exp-location-url').value;
        if (rawLocUrl) {
          locationUrl = rawLocUrl;
        } else if (location) {
          locationUrl = `https://www.google.fr/maps/search/${encodeURIComponent(location)}`;
        } else {
          locationUrl = null;
        }
        // itineraryLocations reste null
      }

      // Gérer le logo : si vide, tenter la détection automatique
      let logoPath = '';
      const logoInputVal = document.getElementById('exp-logo-path').value.trim();
      const rawOrganizerUrl = document.getElementById('exp-organizer-url').value.trim();

      if (!logoInputVal) {
        // Pas de logo uploadé, vérifier checkbox
        const autoLogoChecked = document.getElementById('exp-auto-logo-check') ? document.getElementById('exp-auto-logo-check').checked : true;

        if (autoLogoChecked) {
          const organizerName = document.getElementById('exp-organizer').value.trim();

          // On tente si on a une URL OU un nom
          if (rawOrganizerUrl || organizerName) {
            try {
              // Appeler la détection automatique
              await autoDetectLogoAsync(rawOrganizerUrl, 'exp', organizerName);
              // Récupérer le logo après détection
              const detectedLogo = document.getElementById('exp-logo-path').value.trim();
              if (detectedLogo) {
                logoPath = detectedLogo;
              }
            } catch (error) {
              console.warn('Auto-détection du logo échouée:', error);
              // Continuer sans logo
            }
          }
        }
      } else {
        // Logo déjà uploadé/défini
        if (logoInputVal.startsWith('http') || logoInputVal.startsWith('data:image')) {
          logoPath = logoInputVal;
        } else {
          logoPath = `assets/img/${logoInputVal}`;
        }
      }

      // Illustration aléatoire si aucun logo n'est défini
      if (!logoPath) {
        const randomImages = ['random1.png', 'random2.png', 'random3.png'];
        const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        logoPath = `assets/img/${randomImage}`;
      }

      // Valider et formater l'âge
      const ageMinVal = document.getElementById('exp-age-min').value;
      const ageMaxVal = document.getElementById('exp-age-max').value;
      let ageRangeString = '';

      if (ageMinVal) {
        const ageMin = parseInt(ageMinVal, 10);
        if (ageMaxVal) {
          const ageMax = parseInt(ageMaxVal, 10);
          if (ageMin > ageMax) {
            showExperienceError("L'âge minimum ne peut pas être supérieur à l'âge maximum.");
            return;
          }
          ageRangeString = `${ageMin}-${ageMax} ans`;
        } else {
          ageRangeString = `${ageMin} ans`;
        }
      }

      const data = {
        type: document.getElementById('exp-type').value,
        date: finalDate, // Utiliser la date calculée plus haut (gère Mercredis et Mois standard)
        duration: (() => {
          if (finalDuration === "Tous les mercredis" || finalDuration === "Tous les samedis") return finalDuration;
          // Sinon logique standard avec jours
          if (!finalDuration) return '';
          const days = parseInt(finalDuration, 10);
          return days > 1 ? `${days} jours` : `${days} jour`;
        })(),
        organizer: (() => {
          const org = document.getElementById('exp-organizer').value.trim();
          const dept = document.getElementById('exp-dept').value.trim().toUpperCase();
          if (dept && !/^\d+$|^2[AB]$/.test(dept)) {
            showExperienceError('Le département de l\'organisateur doit être composé de chiffres ou être 2A/2B.');
            throw new Error('Validation Error'); // Stop execution inside IIFE (will be caught by main try-catch if not careful but here it is inside a lambda for data obj construction... wait. This is tricky inside an IIFE/arrow function assigned to property.
            // Better to validate BEFORE creating data object.
          }
          return dept ? `${org} (${dept})` : org;
        })(),
        organizerUrl: (() => {
          const rawUrl = document.getElementById('exp-organizer-url').value.trim();
          if (rawUrl) return rawUrl;

          const org = document.getElementById('exp-organizer').value.trim();
          const dept = document.getElementById('exp-dept').value.trim();
          const fullOrg = org + (dept ? ` ${dept}` : ''); // Use space for cleaner search query

          if (fullOrg) {
            return `https://www.google.com/search?q=${encodeURIComponent(fullOrg)}`;
          }
          return '';
        })(),
        logoPath: logoPath,
        location: location,
        locationUrl: locationUrl,
        stayType: (() => {
          const selectVal = document.getElementById('exp-stay-type').value;
          if (['Autre', 'autre', 'Autre (préciser)'].includes(selectVal)) {
            return document.getElementById('exp-stay-type-custom').value.trim();
          }
          return selectVal;
        })(),
        country: (() => {
          const selectVal = document.getElementById('exp-stay-type').value;
          if (selectVal.toLowerCase().includes('étranger')) {
            return formatLocationName(document.getElementById('exp-country').value.trim());
          }
          return null;
        })(),
        // Position du poste : si "Autre" est sélectionné, prendre la valeur du champ texte
        position: (() => {
          const selectVal = document.getElementById('exp-position').value;
          // Vérifier si la valeur correspond à une des variantes de "Autre"
          if (['Autre', 'autre', 'Autre (préciser)'].includes(selectVal)) {
            return document.getElementById('exp-position-custom').value.trim();
          }
          return selectVal;
        })(),
        ageRange: ageRangeString,
        youthCount: parseInt(document.getElementById('exp-youth-count').value || '0', 10)
      };

      // Gérer le tableau locations : garder l'un ou l'autre selon le type
      if (stayType && stayType.includes('Itinérance')) {
        data.locations = itineraryLocations;
        // On force la suppression de l'ancien champ s'il existe encore
        data.itineraryLocations = null;
      } else {
        data.locations = null;
        // On force la suppression de l'ancien champ s'il existe encore
        data.itineraryLocations = null;
      }

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
          const scrollPos = window.scrollY; // Sauvegarder la position
          await loadDataFromFirebase();
          window.scrollTo(0, scrollPos); // Restaurer la position
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
    formForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      hideFormationError();

      if (!isOwner()) {
        showFormationError('Vous devez être propriétaire ou administrateur pour effectuer cette action.');
        return;
      }

      // Convertir le mois sélectionné en texte français
      const monthValue = document.getElementById('form-date-month').value;
      const dateText = monthValue ? monthToFrenchText(monthValue) : '';
      document.getElementById('form-date').value = dateText;

      // Gérer le chemin du logo avec le préfixe GitHub Pages
      // Gérer le logo : auto-détection si vide
      let logoPath = '';
      const logoInputVal = document.getElementById('form-logo-path').value.trim();
      const organismUrl = document.getElementById('form-organism-url').value.trim();

      const organismName = document.getElementById('form-organism').value.trim();

      if (!logoInputVal) {
        // Vérifier checkbox
        const autoLogoChecked = document.getElementById('form-auto-logo-check') ? document.getElementById('form-auto-logo-check').checked : true;

        if (autoLogoChecked && (organismUrl || organismName)) {
          try {
            // Auto-détection
            const detected = await autoDetectLogoAsync(organismUrl, 'form', organismName);
            if (detected) logoPath = detected;
          } catch (err) {
            console.warn('Auto-détection logo formation failed', err);
          }
        }
      } else if (logoInputVal) {
        if (logoInputVal.startsWith('http') || logoInputVal.startsWith('data:image')) {
          logoPath = logoInputVal;
        } else {
          logoPath = `assets/img/${logoInputVal}`;
        }
      }

      // Illustration aléatoire si aucun logo n'est défini
      if (!logoPath) {
        const randomImages = ['random1.png', 'random2.png', 'random3.png'];
        const randomImage = randomImages[Math.floor(Math.random() * randomImages.length)];
        logoPath = `assets/img/${randomImage}`;
      }

      const data = {
        type: document.getElementById('form-type').value,
        date: dateText,
        duration: (() => {
          const val = document.getElementById('form-duration').value;
          if (!val) return '';
          const days = parseInt(val, 10);
          return days > 1 ? `${days} jours` : `${days} jour`;
        })(),
        organism: (() => {
          const org = document.getElementById('form-organism').value.trim();
          const dept = document.getElementById('form-organism-dept').value.trim().toUpperCase();
          if (dept && !/^\d+$|^2[AB]$/.test(dept)) {
            showFormationError('Le département de l\'organisme doit être composé de chiffres ou être 2A/2B.');
            throw new Error('Validation Error');
          }
          return dept ? `${org} (${dept})` : org;
        })(),
        organismUrl: (() => {
          const rawUrl = document.getElementById('form-organism-url').value.trim();
          if (rawUrl) return rawUrl;

          const org = document.getElementById('form-organism').value.trim();
          const dept = document.getElementById('form-organism-dept').value.trim();
          const fullOrg = org + (dept ? ` ${dept}` : '');

          if (fullOrg) {
            return `https://www.google.com/search?q=${encodeURIComponent(fullOrg)}`;
          }
          return '';
        })(),
        logoPath: logoPath,
        title: (() => {
          const selectVal = document.getElementById('form-title').value;
          return selectVal === 'Autre' ? (document.getElementById('form-title-custom').value || '') : selectVal;
        })(),
        location: (() => {
          const loc = formatLocationName(document.getElementById('form-location').value.trim());
          const dept = document.getElementById('form-location-dept').value.trim().toUpperCase();
          if (dept && !/^\d+$|^2[AB]$/.test(dept)) {
            showFormationError('Le département du lieu doit être composé de chiffres ou être 2A/2B.');
            throw new Error('Validation Error');
          }
          return dept ? `${loc} (${dept})` : loc;
        })(),
        locationUrl: (() => {
          const rawUrl = document.getElementById('form-location-url').value.trim();
          if (rawUrl) return rawUrl;

          const loc = formatLocationName(document.getElementById('form-location').value.trim());
          const dept = document.getElementById('form-location-dept').value.trim();
          // Construct location string for search
          const fullLoc = loc + (dept ? ` ${dept}` : '');

          if (fullLoc) {
            return `https://www.google.fr/maps/search/${encodeURIComponent(fullLoc)}`;
          }
          return null;
        })()
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
          const scrollPos = window.scrollY; // Sauvegarder la position
          await loadDataFromFirebase();
          window.scrollTo(0, scrollPos); // Restaurer la position
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
  if (!isOwner()) {
    throw new Error('Non autorisé : vous n\'êtes pas le propriétaire de ce profil.');
  }
  await getCollectionRef('experiences').add(data);
  console.log('Expérience ajoutée avec succès');
}

// Modifier une expérience dans Firebase
async function updateExperienceInFirebase(data, row) {
  if (!isOwner()) {
    throw new Error('Non autorisé : vous n\'êtes pas le propriétaire de ce profil.');
  }
  // Trouver le document correspondant dans Firebase
  // Utiliser les données stockées dans l'attribut data-experience pour retrouver les valeurs originales
  let date, organizer;

  if (row.dataset.experience) {
    try {
      const originalData = JSON.parse(row.dataset.experience);
      date = originalData.date;
      organizer = originalData.organizer;
    } catch (e) {
      console.error("Erreur parsing data-experience", e);
    }
  }

  // Fallback (pour compatibilité)
  if (!date) {
    // Attention : textContent peut contenir du texte masqué pour le tri
    // On essaie de nettoyer si on détecte le format ALSH concaténé
    let rawDate = row.cells[1]?.textContent?.trim();
    // Si la date est "longue" et semble dupliquée (cas du fix précédent)
    // Mais le plus sûr est le dataset.
    date = rawDate;
  }
  if (!organizer) organizer = row.cells[3]?.querySelector('a')?.textContent?.trim();

  const snapshot = await getCollectionRef('experiences')
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
  if (!isOwner()) {
    throw new Error('Non autorisé : vous n\'êtes pas le propriétaire de ce profil.');
  }
  await getCollectionRef('formations').add(data);
  console.log('Formation ajoutée avec succès');
}

// Modifier une formation dans Firebase
async function updateFormationInFirebase(data, row) {
  if (!isOwner()) {
    throw new Error('Non autorisé : vous n\'êtes pas le propriétaire de ce profil.');
  }
  const date = row.cells[1]?.textContent?.trim();
  const organism = row.cells[3]?.querySelector('a')?.textContent?.trim();

  const snapshot = await getCollectionRef('formations')
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
  if (!isOwner()) {
    throw new Error('Non autorisé : vous n\'êtes pas le propriétaire de ce profil.');
  }
  // Utiliser les données stockées dans l'attribut data-experience
  let date, organizer;

  if (row.dataset.experience) {
    try {
      const originalData = JSON.parse(row.dataset.experience);
      date = originalData.date;
      organizer = originalData.organizer;
    } catch (e) {
      console.error("Erreur parsing data-experience", e);
    }
  }

  // Fallback
  if (!date) {
    date = row.cells[1]?.textContent?.trim();
  }
  if (!organizer) {
    organizer = row.cells[3]?.querySelector('a')?.textContent?.trim();
  }

  const snapshot = await getCollectionRef('experiences')
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
  if (!isOwner()) {
    throw new Error('Non autorisé : vous n\'êtes pas le propriétaire de ce profil.');
  }
  const date = row.cells[1]?.textContent?.trim();
  const organism = row.cells[3]?.querySelector('a')?.textContent?.trim();

  const snapshot = await getCollectionRef('formations')
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

