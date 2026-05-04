// Gestion des formulaires d'ajout/modification pour les admins

let currentEditingRow = null;
let currentEditingDocId = null;

// Variable globale pour suivre les modifications non sauvegardées
window.hasUnsavedFormChanges = false;
let currentModalToClose = null;

window.showUnsavedChangesModal = function (modalType) {
  currentModalToClose = modalType;
  document.getElementById('unsaved-changes-modal').style.display = 'flex';
};

window.confirmCloseUnsavedModal = function () {
  window.hasUnsavedFormChanges = false;
  const unsavedModal = document.getElementById('unsaved-changes-modal');
  if (unsavedModal) unsavedModal.style.display = 'none';

  if (currentModalToClose === 'experience') {
    closeExperienceModal(true);
  } else if (currentModalToClose === 'formation') {
    closeFormationModal(true);
  } else if (currentModalToClose === 'settings') {
    if (typeof confirmCloseSettings === 'function') confirmCloseSettings();
  }
};

window.cancelCloseUnsavedModal = function () {
  const unsavedModal = document.getElementById('unsaved-changes-modal');
  if (unsavedModal) unsavedModal.style.display = 'none';
};

// Listeners pour détecter les modifications dans les formulaires
document.addEventListener('DOMContentLoaded', () => {
  const markUnsaved = () => { window.hasUnsavedFormChanges = true; };
  document.getElementById('experience-form')?.addEventListener('input', markUnsaved);
  document.getElementById('experience-form')?.addEventListener('change', markUnsaved);
  document.getElementById('formation-form')?.addEventListener('input', markUnsaved);
  document.getElementById('formation-form')?.addEventListener('change', markUnsaved);
});


/**
 * Trie par ordre alphabétique les options d'un menu déroulant en conservant
 * l'option "-- Sélectionner --" en haut et l'option "Autre" à la fin si elle existe.
 * Met également à jour TomSelect si l'élément l'utilise.
 */
function sortSelectOptionsGenerically(selectElement) {
  if (!selectElement) return;

  // Si le select contient des optgroup, on ne trie pas de façon générique (risquerait de casser la hiérarchie)
  if (selectElement.querySelector('optgroup')) return;

  const options = Array.from(selectElement.options);
  if (options.length <= 1) return;

  // Garder la valeur actuelle et la cible TomSelect
  const ts = selectElement.tomselect;
  const currentValue = ts ? ts.getValue() : selectElement.value;

  // Identifier le placeholder '-- Sélectionner --'
  let placeholderOpt = null;
  const placeholderIndex = options.findIndex(o => o.value === '' || o.text.includes('--'));
  if (placeholderIndex > -1) {
    placeholderOpt = options.splice(placeholderIndex, 1)[0];
  }

  // Identifier 'Autre'
  let autreOpt = null;
  const autreIndex = options.findIndex(o => o.value.toLowerCase() === 'autre' || o.text.toLowerCase().includes('autre'));
  if (autreIndex > -1) {
    autreOpt = options.splice(autreIndex, 1)[0];
  }

  // Trier alphabétiquement (insensible à la casse/accents)
  const optionsToSort = options;
  optionsToSort.sort((a, b) => a.text.localeCompare(b.text, 'fr', { sensitivity: 'base' }));

  // Vider le select
  selectElement.innerHTML = '';
  if (ts) {
    ts.clear(true); // Efface la sélection silencieusement pour pouvoir tout purger
    ts.clearOptions();
  }

  // Remettre le placeholder
  if (placeholderOpt) {
    selectElement.appendChild(placeholderOpt);
    if (ts) ts.addOption({ value: placeholderOpt.value, text: placeholderOpt.text });
  }

  // Mettre les options triées
  optionsToSort.forEach(opt => {
    selectElement.appendChild(opt);
    if (ts) ts.addOption({ value: opt.value, text: opt.text });
  });

  // Remettre "Autre" à la fin
  if (autreOpt) {
    selectElement.appendChild(autreOpt);
    if (ts) ts.addOption({ value: autreOpt.value, text: autreOpt.text });
  }

  // Restaurer les valeurs et forcer la MAJ
  if (ts) {
    ts.setValue(currentValue, true);
    ts.sync();
  } else {
    selectElement.value = currentValue;
  }
}

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

  // Options à potentiellement retirer pour Colo
  const removableOptionsColo = [
    { value: 'Scout', text: 'Scout' },
    { value: 'Péri-scolaire', text: 'Péri-scolaire' },
    { value: 'SNU', text: 'SNU (Service National Universel)' },
    { value: 'ALSH', text: 'ALSH (Accueil de Loisirs Sans Hébergement)' },
    { value: 'Classe découverte', text: 'Classe découverte' },
    { value: 'Formation Base BAFA', text: 'Formation Base BAFA' },
    { value: 'Formation Appro BAFA', text: 'Formation Appro BAFA' },
    { value: 'Formation Base BAFD', text: 'Formation Base BAFD' },
    { value: 'Formation Appro BAFD', text: 'Formation Appro BAFD' },
  ];

  // Options à potentiellement retirer pour Autre
  const removableOptionsAutre = [
    { value: 'Scout', text: 'Scout' },
    { value: 'Péri-scolaire', text: 'Péri-scolaire' },
    { value: 'ALSH', text: 'ALSH (Accueil de Loisirs Sans Hébergement)' },
    { value: 'Gestion libre', text: 'Gestion libre' },
    { value: 'Gestion libre à l\'étranger', text: 'Gestion libre à l\'étranger' },
    { value: 'Gestion libre / Camping', text: 'Gestion libre / Camping' },
    { value: 'Gestion libre', text: 'Gestion libre' },
    { value: 'Itinérance', text: 'Itinérance' },
    { value: 'Itinérance étranger', text: 'Itinérance étranger' },
    { value: 'Pension complète', text: 'Pension complète' },
    { value: 'Pension complète étranger', text: 'Pension complète étranger' },
  ];

  // Toutes les options pouvant être retirées (pour les remettre par défaut)
  const allRemovableOptions = [...removableOptionsColo, ...removableOptionsAutre];

  // 1. Remettre toutes les options dans le DOM natif et Tom Select par défaut
  allRemovableOptions.forEach(optData => {
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
  } else if (expType === 'periscolaire') {
    if (container) container.style.display = 'none';
    if (staySelect.tomselect) {
      staySelect.tomselect.setValue('Péri-scolaire', true);
    } else {
      staySelect.value = 'Péri-scolaire';
    }
  } else if (expType === 'colo') {
    // Si la valeur actuelle est une qu'on va retirer, on la réinitialise
    const isRemovableSelected = removableOptionsColo.some(opt => opt.value === staySelect.value);
    if (isRemovableSelected) {
      if (staySelect.tomselect) {
        staySelect.tomselect.setValue('', true);
      } else {
        staySelect.value = '';
      }
    }

    // Retirer complètement les options de removableOptionsColo du DOM et de Tom Select
    removableOptionsColo.forEach(optData => {
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
  } else if (expType === 'autre') {
    // Comme pour 'colo', on retire toutes les options configurées
    const isRemovableSelected = removableOptionsAutre.some(opt => opt.value === staySelect.value);
    if (isRemovableSelected) {
      if (staySelect.tomselect) {
        staySelect.tomselect.setValue('', true);
      } else {
        staySelect.value = '';
      }
    }

    // Retirer complètement les options de removableOptionsAutre du DOM et de Tom Select
    removableOptionsAutre.forEach(optData => {
      // Du DOM natif
      const opt = Array.from(staySelect.options).find(o => o.value === optData.value);
      if (opt) opt.remove();
      // De Tom Select
      if (staySelect.tomselect) {
        staySelect.tomselect.removeOption(optData.value);
      }
    });

    // Synchronisation finale pour Autre
    if (staySelect.tomselect) staySelect.tomselect.sync();
  }

  // Reforcer le mask du container si ALSH, Scout ou Périscolaire car tomselect peut recréer l'affichage
  if ((expType === 'alsh' || expType === 'scout' || expType === 'periscolaire') && container) container.style.display = 'none';

  // Trier alphabétiquement tout le select
  sortSelectOptionsGenerically(staySelect);
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

  // Mise à jour de la liste des intitulés de poste (qui dépend aussi du type)
  if (typeof updatePositionLabels === 'function') {
    updatePositionLabels();
  }

  // Mise à jour de la liste des organisateurs
  if (typeof updateOrganizerOptions === 'function') {
    updateOrganizerOptions();
  }

  // Si c'est un ALSH, Scout ou Périscolaire, on montre les options radio
  if (expType === 'alsh' || expType === 'scout' || expType === 'periscolaire') {
    alshOptions.style.display = 'block';

    // Mettre à jour le libellé du bouton radio selon le type
    const isScout = (expType === 'scout');
    const isPeriscolaire = (expType === 'periscolaire');
    const mercredisRadioLabel = document.querySelector('input[name="alsh-duration-type"][value="mercredis"]');
    if (mercredisRadioLabel && mercredisRadioLabel.parentElement) {
      // Le texte est le nœud texte à la fin du label
      const label = mercredisRadioLabel.parentElement;
      // Récupérer le dernier nœud texte du label
      const textNodes = Array.from(label.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
      if (textNodes.length > 0) {
        textNodes[textNodes.length - 1].textContent = isScout ? '\n                                Tous les samedis\n                            ' : isPeriscolaire ? '\n                                Tous les jours scolaires\n                            ' : '\n                                Tous les mercredis\n                            ';
      } else {
        label.lastChild.textContent = isScout ? ' Tous les samedis' : isPeriscolaire ? ' Tous les jours scolaires' : ' Tous les mercredis';
      }
    }

    // Afficher le bon message d'info
    const alshInfoMsg = document.getElementById('alsh-info-message');
    const periscolaireInfoMsg = document.getElementById('periscolaire-info-message');
    if (alshInfoMsg) alshInfoMsg.style.display = isPeriscolaire ? 'none' : '';
    if (periscolaireInfoMsg) periscolaireInfoMsg.style.display = isPeriscolaire ? '' : 'none';

    // Vérifier quel radio est coché
    const isMercredis = document.querySelector('input[name="alsh-duration-type"][value="mercredis"]').checked;

    if (isMercredis) {
      // Mode "Tous les mercredis/samedis"
      standardDateContainer.style.display = 'none';
      mercredisDateContainer.style.display = 'block';

      const dayTypeSpan = document.getElementById('alsh-day-type');
      if (dayTypeSpan) {
        dayTypeSpan.textContent = isScout ? 'des samedis' : 'des mercredis';
      }

      // Masquer le champ durée standard car géré automatiquement (36j)
      // Mais on peut vouloir laisser l'info visible en lecture seule ou hidden logic
      // L'utilisateur demande "dans le champ durée '36' et disabled"
      if (durationInput) {
        durationInput.type = "number";
        durationInput.value = isPeriscolaire ? "144" : "36";
        durationInput.disabled = true;
      }
    } else {
      // Mode "Ponctuel" (comportement classique)
      standardDateContainer.style.display = 'block';
      mercredisDateContainer.style.display = 'none';

      // En mode ponctuel, la durée est calculée par les champs date
      if (durationInput) {
        durationInput.readOnly = true;
        // On ne réinitialise pas la valeur ici pour ne pas effacer un calcul existant
      }
    }
  } else {
    // Pas ALSH, Scout ni Périscolaire (Colo, Autre) -> comportement classique
    alshOptions.style.display = 'none';

    // Réinitialiser les messages d'info
    const alshInfoMsg = document.getElementById('alsh-info-message');
    const periscolaireInfoMsg = document.getElementById('periscolaire-info-message');
    if (alshInfoMsg) alshInfoMsg.style.display = '';
    if (periscolaireInfoMsg) periscolaireInfoMsg.style.display = 'none';

    standardDateContainer.style.display = 'block';
    mercredisDateContainer.style.display = 'none';

    if (durationInput) {
      durationInput.readOnly = true;
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
    periodDisplay.textContent = `${startYear} -${endYear} `;
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

  // Lire le type d'expérience en cours
  const expTypeElement = document.getElementById('exp-type');
  const expType = expTypeElement ? expTypeElement.value : '';

  // Lire la valeur du type de séjour (Gestion) pour appliquer les filtres prioritaires (SNU, Formations...)
  const expStayTypeElement = document.getElementById('exp-stay-type');
  const stayType = expStayTypeElement ? expStayTypeElement.value : '';

  // Conserver la valeur actuelle
  let currentValue = positionSelect.value;
  if (positionSelect.tomselect) {
    currentValue = positionSelect.tomselect.getValue();
  }

  // Vider le select
  positionSelect.innerHTML = '<option value="">-- Sélectionner --</option>';
  if (positionSelect.tomselect) {
    positionSelect.tomselect.clearOptions();
    positionSelect.tomselect.addOption({ value: '', text: '-- Sélectionner --' });
  }

  const allPositions = [
    { m: 'Animateur Stagiaire', f: 'Animatrice Stagiaire', roles: ['all'] },
    { m: 'Animateur (diplômé)', f: 'Animatrice (diplômée)', roles: ['all'] },
    { m: 'Animateur Ski', f: 'Animatrice Ski', roles: ['all'] },
    { m: 'Animateur Snow', f: 'Animatrice Snow', roles: ['all'] },
    { m: 'Animateur SB', f: 'Animatrice SB', roles: ['all'] },
    { m: 'Animateur AS', f: 'Animatrice AS', roles: ['all'] },
    { m: 'Animateur Référent Handicap', f: 'Animatrice Référente Handicap', roles: ['all'] },
    { m: 'Responsable de Groupe', f: 'Responsable de Groupe', roles: ['all'] },
    { m: 'Surveillant de Baignade (non animateur)', f: 'Surveillante de Baignade (non animatrice)', roles: ['all'] },
    { m: 'Assistant Sanitaire (non animateur)', f: 'Assistante Sanitaire (non animatrice)', roles: ['all'] },
    { m: 'Tuteur de Maisonnée', f: 'Tutrice de Maisonnée', roles: ['all'] },
    { m: 'Cuisinier', f: 'Cuisinière', roles: ['all'] },
    { m: 'Directeur', f: 'Directrice', roles: ['all'] },
    { m: 'Directeur Stagiaire', f: 'Directrice Stagiaire', roles: ['all'] },
    { m: 'Directeur AS', f: 'Directrice AS', roles: ['all'] },
    { m: 'Directeur SB', f: 'Directrice SB', roles: ['all'] },
    { m: 'Directeur de Formation', f: 'Directrice de Formation', roles: ['all'] },
    { m: 'Directeur de Structure', f: 'Directrice de Structure', roles: ['all'] },
    { m: 'Directeur Adjoint', f: 'Directrice Adjointe', roles: ['all'] },
    { m: 'Directeur Adjoint & SB', f: 'Directrice Adjointe & SB', roles: ['all'] },
    { m: 'Directeur Adjoint & AS', f: 'Directrice Adjointe & AS', roles: ['all'] },
    { m: 'Formateur BAFA', f: 'Formatrice BAFA', roles: ['all'] },
    { m: 'Formateur BAFD', f: 'Formatrice BAFD', roles: ['all'] },
    { m: 'Respons Scout', f: 'Respons Scout', roles: ['scout'] },
    { m: 'Chef Scout', f: 'Cheffe Scout', roles: ['scout'] },
    /*{ m: 'Autre (préciser)', f: 'Autre (préciser)', roles: ['all', 'scout'] }*/
  ];
  // Intitulés de poste à retirer spécifiquement pour "Colonie de vacances" (colo)
  // Utiliser la valeur 'm' (masculin) de l'intitulé pour le cibler
  const removableOptionsPosteColo = [
    'Tuteur de Maisonnée', 'Chef Scout', 'Formateur BAFA', 'Formateur BAFD', 'Respons Scout'
  ];

  // Intitulés de poste à retirer spécifiquement pour "Centre de loisir" (alsh)
  const removableOptionsPosteAlsh = [
    'Animateur Ski', 'Animateur Snow', 'Directeur de Formation', 'Tuteur de Maisonnée', 'Directeur Adjoint & SB', 'Directeur Adjoint & AS', 'Formateur BAFA', 'Formateur BAFD', 'Respons Scout', 'Chef Scout'
  ];

  // Intitulés de poste à retirer spécifiquement pour "Autre" (autre)
  const removableOptionsPosteAutre = [
    'Animateur Ski', 'Animateur Snow', 'Directeur de Formation', 'Directeur Adjoint & SB', 'Directeur Adjoint & AS', 'Formateur BAFA', 'Formateur BAFD', 'Respons Scout', 'Chef Scout'
  ];

  // Intitulés de poste à afficher EXCLUSIVEMENT pour "SNU" (dans gestion)
  // Attention à respecter les majuscules exactes ("Responsable de Groupe", pas "responsable de groupe")
  const onlyOptionsPosteSnu = [
    'Tuteur de Maisonnée', 'Directeur de Structure', 'Directeur Adjoint', 'Directeur Adjoint & SB', 'Directeur Adjoint & AS', 'Responsable de Groupe', 'Cuisinier', 'Animateur Référent Handicap'
  ];

  // Intitulés de poste à afficher EXCLUSIVEMENT pour les Formations BAFA (dans gestion)
  const onlyOptionsPosteFormationBafa = [
    'Formateur BAFA', 'Directeur de Formation', 'Cuisinier'
  ];

  // Intitulés de poste à afficher EXCLUSIVEMENT pour les Formations BAFD (dans gestion)
  const onlyOptionsPosteFormationBafd = [
    'Formateur BAFD', 'Directeur de Formation', 'Cuisinier'
  ];

  // Intitulés de poste à afficher EXCLUSIVEMENT pour les Formations BAFD (dans gestion)
  const onlyOptionsPostePeriscolaire = [
    'Animateur (diplômé)', 'Animateur Stagiaire', 'Directeur', 'Cuisinier', 'Directeur Adjoint', 'Animateur Référent Handicap'
  ];

  // Intitulés de poste à afficher EXCLUSIVEMENT pour les Formations BAFD (dans gestion)
  const onlyOptionsPosteClasseDecouverte = [
    'Animateur (diplômé)', 'Animateur Stagiaire', 'Directeur', 'Cuisinier', 'Directeur Adjoint', 'Animateur Référent Handicap'
  ];

  let optionFoundForCurrentValue = false;

  allPositions.forEach(pos => {
    let shouldShow = false;

    if (expType === 'scout') {
      if (pos.roles.includes('scout') || pos.roles.includes('periscolaire')) shouldShow = true;
    } else if (expType === 'periscolaire') {
      shouldShow = onlyOptionsPostePeriscolaire.includes(pos.m);
    } else {
      if (pos.roles.includes('all')) shouldShow = true;

      // Masquage prioritaire si le gestionnaire (Gestion) est SNU ou Formation
      if (stayType === 'SNU') {
        shouldShow = onlyOptionsPosteSnu.includes(pos.m);
      } else if (stayType === 'Formation Base BAFA' || stayType === 'Formation Appro BAFA') {
        shouldShow = onlyOptionsPosteFormationBafa.includes(pos.m);
      } else if (stayType === 'Formation Base BAFD' || stayType === 'Formation Appro BAFD') {
        shouldShow = onlyOptionsPosteFormationBafd.includes(pos.m);
      } else if (stayType === 'Péri-scolaire') {
        shouldShow = onlyOptionsPostePeriscolaire.includes(pos.m);
      } else if (stayType === 'Classe découverte') {
        shouldShow = onlyOptionsPosteClasseDecouverte.includes(pos.m);
      } else {
        // Masquer selon le type sélectionné (Colo, ALSH, Autre)
        if (expType === 'colo' && removableOptionsPosteColo.includes(pos.m)) {
          shouldShow = false;
        } else if (expType === 'alsh' && removableOptionsPosteAlsh.includes(pos.m)) {
          shouldShow = false;
        } else if (expType === 'autre' && removableOptionsPosteAutre.includes(pos.m)) {
          shouldShow = false;
        }
      }
    }

    if (shouldShow) {
      const optionValue = pos.m;
      const optionText = isFeminin ? pos.f : pos.m;

      if (optionValue === currentValue) {
        optionFoundForCurrentValue = true;
      }

      // Ajouter au DOM
      const opt = document.createElement('option');
      opt.value = optionValue;
      opt.text = optionText;
      positionSelect.appendChild(opt);

      // Ajouter à TomSelect
      if (positionSelect.tomselect) {
        positionSelect.tomselect.addOption({ value: optionValue, text: optionText });
      }
    }
  });

  // Si la valeur actuelle n'est plus dans la liste des options possibles, on la réinitialise
  if (!optionFoundForCurrentValue && currentValue !== '') {
    currentValue = '';
  }

  // Restaurer la valeur et finaliser
  if (positionSelect.tomselect) {
    positionSelect.tomselect.setValue(currentValue, true);
    positionSelect.tomselect.sync();
  } else {
    positionSelect.value = currentValue;
  }

  // Trier alphabétiquement (générique)
  sortSelectOptionsGenerically(positionSelect);
}

/**
 * Gère l'affichage des organisateurs selon le type d'expérience.
 */
function updateOrganizerOptions() {
  const expType = document.getElementById('exp-type').value;
  const organizerSelect = document.getElementById('exp-organizer');
  if (!organizerSelect) return;

  const ts = organizerSelect.tomselect;
  const currentValue = ts ? ts.getValue() : organizerSelect.value;

  // --- CONFIGURATION DES FILTRES ---

  // Liste des organismes à RETIRER spécifiquement pour "Colonie de vacances" (colo)
  const removableOptionsColo = [
    'Scouts et Guides de France (SGDF)',
    'Éclaireuses/Éclaireurs de France (EEDF)',
    'Éclaireuses et Éclaireurs Unionistes de France (EEUdF)',
    'Scouts Musulmans de France (SMF)',
    'Éclaireuses et Éclaireurs Israélites de France (EEIF)',
    'Guides et Scouts d\'Europe (AGSE)'
  ];

  // Liste des organismes à afficher EXCLUSIVEMENT pour "Scout" (scout)
  const onlyOptionsScout = [
    'Éclaireuses/Éclaireurs de France (EEDF)',
    'Scouts et Guides de France (SGDF)',
    'Scouts Musulmans de France (SMF)',
    'Éclaireuses et Éclaireurs Israélites de France (EEIF)',
    'Éclaireuses et Éclaireurs Unionistes de France (EEUdF)',
    'Guides et Scouts d\'Europe (AGSE)'
  ];

  // --- FIN DE CONFIGURATION ---

  // Liste de tous les organisateurs connus (base de référence)
  const allKnownOrganizers = [
    'UCPA', 'Telligo', 'Djuringa', 'Cap Monde', 'CGCV', 'Compagnons Des Jours Heureux',
    'Haute Pyrénées Sport & Nature', 'Nouvelles Aventures Junior', 'Sports Elite Jeunes',
    'SNU', 'Temps Jeunes', 'UFCV', 'Croq Vacances', 'Léo Lagrange', 'Avea', 'CIE Thales',
    'Zigo', 'Le Zèbre', 'Cap Juniors', 'Mondiale Junior', 'Agence Nature', 'Les séjours de l\'AJD',
    'Association Regards', 'CE SNCF', 'CE Air France', 'Chemins du Monde', 'Chic Planet',
    'GoColo', 'Le Temps des Copains', 'Nouvelles Vagues', 'Passion Aventure Junior',
    'Sans Frontières', 'SILC', 'Visas Loisirs',
    'Éclaireuses/Éclaireurs de France (EEDF)',
    'Scouts et Guides de France (SGDF)',
    'Scouts Musulmans de France (SMF)',
    'Éclaireuses et Éclaireurs Israélites de France (EEIF)',
    'Éclaireuses et Éclaireurs Unionistes de France (EEUdF)',
    'Guides et Scouts d\'Europe (AGSE)'
  ];

  let toShow = [];
  if (expType === 'scout') {
    // Mode Whitelist : Ne proposer que les organismes scouts configurés
    toShow = onlyOptionsScout;
  } else if (expType === 'colo') {
    // Mode Blacklist : Tout montrer SAUF les organismes configurés comme retirés
    toShow = allKnownOrganizers.filter(opt => !removableOptionsColo.includes(opt));
  } else {
    // Mode par défaut : Tout montrer
    toShow = allKnownOrganizers;
  }

  // 1. Nettoyer les doublons ou anciennes versions (sans acronyme) qui pourraient traîner
  Array.from(organizerSelect.options).forEach(opt => {
    const val = opt.value;
    // On garde uniquement le placeholder, "Autre", et les options de la liste officielle
    if (val !== '' && val !== 'Autre' && !allKnownOrganizers.includes(val)) {
      opt.remove();
      if (ts) ts.removeOption(val);
    }
  });

  // 2. Appliquer le filtrage (Ajout/Suppression)
  allKnownOrganizers.forEach(val => {
    if (toShow.includes(val)) {
      // S'assurer que l'option est présente dans le DOM
      let opt = Array.from(organizerSelect.options).find(o => o.value === val);
      if (!opt) {
        opt = document.createElement('option');
        opt.value = val;
        opt.text = val;
        // Insérer avant "Autre" pour l'ordre
        const autreOpt = Array.from(organizerSelect.options).find(o => o.value === 'Autre');
        if (autreOpt) {
          organizerSelect.insertBefore(opt, autreOpt);
        } else {
          organizerSelect.appendChild(opt);
        }
        if (ts) ts.addOption({ value: val, text: val });
      }
    } else {
      // Retirer l'option si elle ne doit pas être là
      const opt = Array.from(organizerSelect.options).find(o => o.value === val);
      if (opt) opt.remove();
      if (ts) ts.removeOption(val);
    }
  });

  // 2. Gérer la valeur actuelle si elle a été masquée
  if (!toShow.includes(currentValue) && currentValue !== 'Autre' && currentValue !== '') {
    if (ts) ts.setValue('', true);
    else organizerSelect.value = '';
  }

  if (ts) ts.sync();

  // Trier alphabétiquement (générique)
  sortSelectOptionsGenerically(organizerSelect);
}
window.updateOrganizerOptions = updateOrganizerOptions;


// Afficher le modal d'ajout d'expérience
async function showAddExperienceModal() {
  document.getElementById('experience-modal-title').textContent = 'Ajouter une expérience';
  const form = document.getElementById('experience-form');
  form.reset();
  const ceField = document.getElementById('exp-ce');
  if (ceField) ceField.value = '';

  // Reset Tom Selects
  ['exp-stay-type', 'exp-position', 'exp-organizer'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.tomselect) el.tomselect.clear();
  });

  // Reset logo text
  if (typeof toggleOrganizerCustom === 'function') toggleOrganizerCustom();

  hideExperienceError();
  currentEditingRow = null;
  currentEditingDocId = null;

  // Réinitialiser le logo (image, input, erreurs)
  removeLogo();

  // Réinitialiser les champs de localisation
  clearItineraryTable();
  toggleLocationFields();

  // Initialiser l'affichage des champs ALSH et types de séjours
  toggleAlshDateFields();
  updateExpStayTypeOptions();
  updateOrganizerOptions();
  initSearchableSelects();

  window.hasUnsavedFormChanges = false;

  document.getElementById('experience-modal').style.display = 'flex';
  document.body.classList.add('modal-open');

  // Réinitialiser les champs de date (nouveau système)
  const startInput = document.getElementById('exp-date-start');
  const endInput = document.getElementById('exp-date-end');
  if (startInput) startInput.value = '';
  if (endInput) endInput.value = '';
  const durationField = document.getElementById('exp-duration');
  if (durationField) durationField.value = '';
  const durationHint = document.getElementById('exp-duration-hint');
  if (durationHint) { durationHint.textContent = 'Saisissez une date de début et de fin pour calculer la durée.'; durationHint.style.display = 'block'; }

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
  const ids = ['exp-stay-type', 'exp-position', 'form-title', 'exp-type', 'exp-organizer', 'form-organism'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      sortSelectOptionsGenerically(el);

      if (id !== 'exp-type' && !el.tomselect) {
        new TomSelect(el, {
          create: false,
          sortField: [], // Désactiver le tri pour respecter l'ordre du DOM (groupes, hiérarchie)
          plugins: ['dropdown_input'], // Assure que l'input de recherche est dans le dropdown
          onInitialize: function () {
            // S'assurer que le container a la bonne largeur
            if (id === 'exp-organizer' || id === 'form-organism') {
              this.wrapper.style.width = 'auto';
              this.wrapper.style.flex = '1';
            } else {
              this.wrapper.style.width = '100%';
            }
          }
        });
      }
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

  // Gérer l'intitulé du poste pour les formations BAFA/BAFD dans le menu de gestion
  const positionSelect = document.getElementById('exp-position');
  if (select && positionSelect) {
    const positionFormGroup = positionSelect.closest('.form-group');
    const val = select.value;

    if (val === 'Formation Base BAFA' || val === 'Formation Appro BAFA') {
      if (positionFormGroup) positionFormGroup.style.display = 'block';
      if (positionSelect.tomselect) {
        positionSelect.tomselect.setValue('Formateur BAFA', true);
      } else {
        positionSelect.value = 'Formateur BAFA';
      }
      setTimeout(() => { if (typeof window.toggleExpPositionCustom === 'function') window.toggleExpPositionCustom(); }, 0);
    } else if (val === 'Formation Base BAFD' || val === 'Formation Appro BAFD') {
      if (positionFormGroup) positionFormGroup.style.display = 'block';
      if (positionSelect.tomselect) {
        positionSelect.tomselect.setValue('Formateur BAFD', true);
      } else {
        positionSelect.value = 'Formateur BAFD';
      }
      setTimeout(() => { if (typeof window.toggleExpPositionCustom === 'function') window.toggleExpPositionCustom(); }, 0);
    } else {
      // Re-afficher le champ si ce n'est pas une formation
      if (positionFormGroup) positionFormGroup.style.display = 'block';
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

  // Mettre à jour les intitulés de poste disponibles vu que le gestionnaire a changé
  if (typeof updatePositionLabels === 'function') {
    updatePositionLabels();
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

window.toggleOrganizerCustom = function (skipReset = false) {
  const select = document.getElementById('exp-organizer');
  const custom = document.getElementById('exp-organizer-custom');
  const urlInput = document.getElementById('exp-organizer-url');
  const fileInput = document.getElementById('exp-logo-file');
  const logoPathInput = document.getElementById('exp-logo-path');
  const preview = document.getElementById('logo-preview');
  const placeholder = document.getElementById('logo-placeholder');
  const removeBtn = document.getElementById('remove-logo');
  const deptInput = document.getElementById('exp-dept');
  const logoText = document.getElementById('exp-logo-text');

  if (!select) return;

  const knownOrganizers = {
    'UCPA': { url: 'https://www.ucpa.com/', logo: 'assets/img/ucpa.jpeg', dept: '94' },
    'Telligo': { url: 'https://www.telligo.fr/', logo: 'assets/img/telligo.png', dept: '94' },
    'Djuringa': { url: 'https://www.djuringa-juniors.fr/', logo: 'assets/img/djuringa.png', dept: '69' },
    'Cap Monde': { url: 'https://www.capmonde.fr/', logo: 'assets/img/capMonde.png', dept: '74' },
    'CGCV': { url: 'https://www.cgcv.org/com/homepage', logo: 'assets/img/cgcv.jpeg', dept: '92' },
    'Compagnons Des Jours Heureux': { url: 'https://www.compagnons.asso.fr/', logo: 'assets/img/cjh.png', dept: '78' },
    'Haute Pyrénées Sport & Nature': { url: 'https://www.sport-nature.org/', logo: 'assets/img/hpsn.webp', dept: '65' },
    'Nouvelles Aventures Junior': { url: 'https://www.naj-colo.com/', logo: 'assets/img/naj.png', dept: '13' },
    'Sports Elite Jeunes': { url: 'https://www.sportselitejeunes.fr/', logo: 'assets/img/sej.png', dept: '75' },
    'SNU': { url: 'https://www.snu.fr/', logo: 'assets/img/snu.png', dept: '69' },
    'Temps Jeunes': { url: 'https://temps-jeunes.com/', logo: 'assets/img/tj.png', dept: '69' },
    'UFCV': { url: 'https://www.ufcv.fr/', logo: 'assets/img/ufcv.png', dept: '93' },
    'Croq Vacances': { url: 'https://www.croqvacances.com/', logo: 'assets/img/croqVacances.png', dept: '44' },
    'Léo Lagrange': { url: 'https://www.leolagrange.org/', logo: 'assets/img/leoLagrange.png', dept: '75' },
    'Avea': { url: 'https://www.avea.fr/', logo: 'assets/img/avea.png', dept: '75' },
    'CIE Thales': { url: 'https://www.cie-thales.net/', logo: 'assets/img/cieThales.png', dept: '92' },
    'Zigo': { url: 'https://www.zigotours.com/', logo: 'assets/img/zigo.webp', dept: '38' },
    'Le Zèbre': { url: 'https://www.le-zebre.com/', logo: 'assets/img/leZebre.jpg', dept: '13' },
    'Cap Juniors': { url: 'https://www.cap-juniors.com/', logo: 'assets/img/capJuniors.png', dept: '69' },
    'Mondiale Junior': { url: 'https://www.mondiale-junior.fr/', logo: 'assets/img/mondialeJunior.webp', dept: '13' },
    'Agence Nature': { url: 'https://www.agencenature.com/', logo: 'assets/img/agenceNature.webp', dept: '13' },
    'Les séjours de l\'AJD': { url: 'https://www.sejours-ajd.fr/', logo: 'assets/img/sejoursAJD.webp', dept: '75' },
    'Association Regards': { url: 'https://www.asso-regards.org/', logo: 'assets/img/assoRegards.jpg', dept: '92' },
    'CE SNCF': { url: 'https://recrutement-sej.ccgpfcheminots.com/', logo: 'assets/img/ceSNCF.jpg', dept: '75' },
    'CE Air France': { url: 'https://cceairfrance-recrute.talent-soft.com/', logo: 'assets/img/ceAirFrance.png', dept: '95' },
    'Chemins du Monde': { url: 'https://cheminsdumonde.fr/', logo: 'assets/img/cheminsDuMonde.webp', dept: '12' },
    'Chic Planet': { url: 'https://colos.chic-planet.fr/', logo: 'assets/img/chicPlanet.webp', dept: '31' },
    'GoColo': { url: 'https://www.gocolo.fr/', logo: 'assets/img/gocolo.png', dept: '12' },
    'Le Temps des Copains': { url: 'https://www.tempsdescopains.com/', logo: 'assets/img/letempsdescopains.webp', dept: '94' },
    'Nouvelles Vagues': { url: 'https://www.nouvelles-vagues.com/', logo: 'assets/img/nouvellesVagues.png', dept: '31' },
    'Passion Aventure Junior': { url: 'https://passion-aventure-junior.com/', logo: 'assets/img/passionAventureJunior.png', dept: '31' },
    'Sans Frontières': { url: 'https://www.sans-frontieres.fr/', logo: 'assets/img/sansFrontieres.png', dept: '75' },
    'SILC': { url: 'https://silc.fr/', logo: 'assets/img/silc.webp', dept: '16' },
    'Éclaireuses/Éclaireurs de France (EEDF)': { url: 'https://www.eedf.fr/', logo: 'assets/img/eedf.webp', dept: '93' },
    'Scouts et Guides de France (SGDF)': { url: 'https://www.sgdf.fr/', logo: 'assets/img/scoutgdf.png', dept: '94' },
    'Visas Loisirs': { url: 'https://visasloisirs.com/', logo: 'assets/img/visasLoisirs.webp', dept: '38' },
    'Éclaireuses et Éclaireurs Unionistes de France (EEUdF)': { url: 'https://eeudf.org/', logo: 'assets/img/eeudf.webp', dept: '92' },
    'Scouts Musulmans de France (SMF)': { url: 'https://scoutsmusulmans.fr/', logo: 'assets/img/scoutsmusulmansdefrance.webp', dept: '93' },
    'Éclaireuses et Éclaireurs Israélites de France (EEIF)': { url: 'https://www.eeif.org/', logo: 'assets/img/eeif.webp', dept: '78' },
    'Guides et Scouts d\'Europe (AGSE)': { url: 'https://www.scouts-europe.org/', logo: 'assets/img/euroscouts.webp', dept: '77' },
  };

  if (select.value === 'Autre') {
    if (custom) {
      custom.style.display = 'block';
      custom.required = true;
    }
    if (urlInput) {
      urlInput.disabled = false;
      urlInput.readOnly = false;
      if (!skipReset) urlInput.value = '';
    }
    if (fileInput) fileInput.disabled = false;

    // Cleanup any forced logo
    const logoLabel = select.closest('.form-group')?.querySelector('label[for="exp-logo-file"]');
    if (logoLabel) {
      logoLabel.style.pointerEvents = 'auto';
      logoLabel.style.cursor = 'pointer';
    }

    if (deptInput) {
      deptInput.disabled = false;
      deptInput.readOnly = false;
      if (!skipReset) deptInput.value = '';
    }

    if (!skipReset) {
      if (logoPathInput) logoPathInput.value = '';
      if (preview) preview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      if (removeBtn) removeBtn.style.display = 'none';
    } else {
      // En mode skipReset (edit), si on a un logo, on affiche le bouton supprimer
      if (removeBtn && logoPathInput && logoPathInput.value) {
        removeBtn.style.display = 'inline-block';
      }
    }

    if (logoText) logoText.textContent = 'Cliquez ou déposez un logo ici';

  } else if (knownOrganizers[select.value]) {
    if (custom) {
      custom.style.display = 'none';
      custom.required = false;
      custom.value = '';
    }

    const data = knownOrganizers[select.value];
    if (urlInput) {
      urlInput.value = data.url;
      urlInput.readOnly = true;
    }
    if (fileInput) fileInput.disabled = true;

    const logoLabel = select.closest('.form-group')?.querySelector('label[for="exp-logo-file"]');
    if (logoLabel) {
      logoLabel.style.pointerEvents = 'none';
      logoLabel.style.cursor = 'default';
    }

    if (deptInput) {
      if (data.dept !== undefined) deptInput.value = data.dept;
      deptInput.readOnly = true;
      // Optionnellement on le disable, mais attention en form submit car disabled exclut du payload
      // Sauf si getFormData(). Donc on laisse visible mais readOnly ou on change la couleur
    }

    if (logoPathInput) logoPathInput.value = data.logo;
    if (preview && placeholder && removeBtn) {
      preview.src = data.logo;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      removeBtn.style.display = 'none'; // Empêche l'utilisateur d'enlever ce logo pré-défini
    }

    if (logoText) logoText.textContent = "Le logo est prédéfini pour cet organisme";
  } else {
    // Cas '-- Sélectionner --'
    if (custom) {
      custom.style.display = 'none';
      custom.required = false;
      custom.value = '';
    }
    if (urlInput) {
      urlInput.disabled = false;
      urlInput.readOnly = false;
      if (!skipReset) urlInput.value = '';
    }
    if (fileInput) fileInput.disabled = false;
    if (deptInput) {
      deptInput.disabled = false;
      deptInput.readOnly = false;
      if (!skipReset) deptInput.value = '';
    }

    const logoLabel = select.closest('.form-group')?.querySelector('label[for="exp-logo-file"]');
    if (logoLabel) {
      logoLabel.style.pointerEvents = 'auto';
      logoLabel.style.cursor = 'pointer';
    }

    if (!skipReset) {
      if (logoPathInput) logoPathInput.value = '';
      if (preview) preview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      if (removeBtn) removeBtn.style.display = 'none';
    } else {
      // En mode skipReset (edit), si on a un logo, on affiche le bouton supprimer
      if (removeBtn && logoPathInput && logoPathInput.value) {
        removeBtn.style.display = 'inline-block';
      }
    }

    if (logoText) logoText.textContent = 'Cliquez ou déposez un logo ici';
  }
};

window.toggleFormationOrganizerCustom = function (skipReset = false) {
  const select = document.getElementById('form-organism');
  const custom = document.getElementById('form-organism-custom');
  const urlInput = document.getElementById('form-organism-url');
  const fileInput = document.getElementById('form-logo-file');
  const logoPathInput = document.getElementById('form-logo-path');
  const preview = document.getElementById('form-logo-preview');
  const placeholder = document.getElementById('form-logo-placeholder');
  const removeBtn = document.getElementById('form-remove-logo');
  const deptInput = document.getElementById('form-organism-dept');
  const logoText = document.getElementById('form-logo-text');

  if (!select) return;

  const knownOrganizersFormation = {
    'UCPA': { url: 'https://www.ucpa.com/', logo: 'assets/img/ucpa.jpeg', dept: '94' },
    'Afocal': { url: 'https://www.afocal.fr/', logo: 'assets/img/afocal.webp', dept: '75' },
    'FFSS': { url: 'https://www.ffss.fr/', logo: 'assets/img/ffss.jpeg', dept: '75' },
    'SNU': { url: 'https://www.snu.fr/', logo: 'assets/img/snu.png', dept: '69' },
    'Temps Jeunes': { url: 'https://temps-jeunes.com/', logo: 'assets/img/tj.png', dept: '69' },
    'UFCV': { url: 'https://www.ufcv.fr/', logo: 'assets/img/ufcv.png', dept: '93' },
    'Léo Lagrange': { url: 'https://www.leolagrange.org/', logo: 'assets/img/leoLagrange.png', dept: '75' },
    'CIE Thales': { url: 'https://www.cie-thales.net/', logo: 'assets/img/cieThales.png', dept: '92' },
    'Zigo': { url: 'https://www.zigotours.com/', logo: 'assets/img/zigo.jpg', dept: '38' },
    'Le Zèbre': { url: 'https://www.le-zebre.com/', logo: 'assets/img/leZebre.jpg', dept: '13' },
    'Cap Juniors': { url: 'https://www.cap-juniors.com/', logo: 'assets/img/capJuniors.png', dept: '69' },
    'Mondiale Junior': { url: 'https://www.mondiale-junior.fr/', logo: 'assets/img/mondialeJunior.jpg', dept: '13' },
    'Agence Nature': { url: 'https://www.agencenature.com/', logo: 'assets/img/agenceNature.png', dept: '13' },
    'SILC': { url: 'https://silc.fr/', logo: 'assets/img/silc.webp', dept: '16' },
    'Les Francas': { url: 'https://www.francas.asso.fr/', logo: 'assets/img/lesFrancas.webp', dept: '69' },
    'Cemea': { url: 'https://cemea.asso.fr/', logo: 'assets/img/cemea.webp', dept: '38' },
    'ALEF': { url: 'https://www.alef.asso.fr/', logo: 'assets/img/alef.jpg', dept: '69' },
    'IFAC': { url: 'https://ifac-formation.fr/', logo: 'assets/img/ifac.jpg', dept: '92' },
    'CGCV': { url: 'https://www.cgcv.org/com/homepage', logo: 'assets/img/cgcv.jpeg', dept: '92' }
  };

  if (select.value === 'Autre') {
    if (custom) {
      custom.style.display = 'block';
      custom.required = true;
    }
    if (urlInput) {
      urlInput.disabled = false;
      urlInput.readOnly = false;
      if (!skipReset) urlInput.value = '';
    }
    if (fileInput) fileInput.disabled = false;
    if (deptInput) {
      deptInput.disabled = false;
      deptInput.readOnly = false;
      if (!skipReset) deptInput.value = '';
    }

    const logoLabel = select.closest('.form-group')?.querySelector('label[for="form-logo-file"]');
    if (logoLabel) {
      logoLabel.style.pointerEvents = 'auto';
      logoLabel.style.cursor = 'pointer';
    }

    // Cleanup any forced logo
    if (!skipReset) {
      if (logoPathInput) logoPathInput.value = '';
      if (preview) preview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      if (removeBtn) removeBtn.style.display = 'none';
    } else {
      // En mode skipReset (edit), si on a un logo, on affiche le bouton supprimer
      if (removeBtn && logoPathInput && logoPathInput.value) {
        removeBtn.style.display = 'inline-block';
      }
    }

    if (logoText) logoText.textContent = 'Cliquez ou déposez un logo ici';

  } else if (knownOrganizersFormation[select.value]) {
    if (custom) {
      custom.style.display = 'none';
      custom.required = false;
      custom.value = '';
    }

    const data = knownOrganizersFormation[select.value];
    if (urlInput) {
      urlInput.value = data.url;
      urlInput.readOnly = true;
    }
    if (fileInput) fileInput.disabled = true;

    if (deptInput) {
      if (data.dept !== undefined) deptInput.value = data.dept;
      deptInput.readOnly = true;
    }

    const logoLabel = select.closest('.form-group')?.querySelector('label[for="form-logo-file"]');
    if (logoLabel) {
      logoLabel.style.pointerEvents = 'none';
      logoLabel.style.cursor = 'default';
    }

    if (logoPathInput) logoPathInput.value = data.logo;
    if (preview && placeholder && removeBtn) {
      preview.src = data.logo;
      preview.style.display = 'block';
      placeholder.style.display = 'none';
      removeBtn.style.display = 'none'; // Empêche l'utilisateur d'enlever ce logo pré-défini
    }

    if (logoText) logoText.textContent = "Le logo est prédéfini pour cet organisme";
  } else {
    // Cas '-- Sélectionner --'
    if (custom) {
      custom.style.display = 'none';
      custom.required = false;
      custom.value = '';
    }
    if (urlInput) {
      urlInput.disabled = false;
      urlInput.readOnly = false;
      if (!skipReset) urlInput.value = '';
    }
    if (fileInput) fileInput.disabled = false;
    if (deptInput) {
      deptInput.disabled = false;
      deptInput.readOnly = false;
      if (!skipReset) deptInput.value = '';
    }

    const logoLabel = select.closest('.form-group')?.querySelector('label[for="form-logo-file"]');
    if (logoLabel) {
      logoLabel.style.pointerEvents = 'auto';
      logoLabel.style.cursor = 'pointer';
    }

    if (!skipReset) {
      if (logoPathInput) logoPathInput.value = '';
      if (preview) preview.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
      if (removeBtn) removeBtn.style.display = 'none';
    } else {
      // En mode skipReset (edit), si on a un logo, on affiche le bouton supprimer
      if (removeBtn && logoPathInput && logoPathInput.value) {
        removeBtn.style.display = 'inline-block';
      }
    }

    if (logoText) logoText.textContent = 'Cliquez ou déposez un logo ici';
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

window.toggleDeptExplanation = function (event, type) {
  if (event) event.preventDefault();
  const bubbleId = type === 'exp' ? 'exp-dept-explanation-bubble' : 'form-dept-explanation-bubble';
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
  return `${months[monthIndex]} ${year} `;
}

/**
 * Convertit une date HTML (YYYY-MM-DD) en texte français court (ex: "15 Juillet 2024")
 */
function dateToFrenchText(dateValue) {
  if (!dateValue) return '';
  const [year, month, day] = dateValue.split('-');
  const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return '';
  return `${parseInt(day, 10)} ${months[monthIndex]} ${year}`;
}

/**
 * Convertit un texte de date français ("15 Juillet 2024" ou "Juillet 2024") en YYYY-MM-DD.
 * Pour les données existantes avec seulement un mois, retourne le 1er du mois.
 */
function frenchTextToDate(dateText) {
  if (!dateText) return '';
  const lowerText = dateText.toLowerCase().trim();

  // Cas ALSH scolaire
  const alshMatch = lowerText.match(/septembre\s+(\d{4})\s*-\s*juin\s+(\d{4})/);
  if (alshMatch) return `${alshMatch[1]}-09-01`;

  const months = {
    'janvier': '01', 'janv': '01', 'février': '02', 'févr': '02', 'mars': '03',
    'avril': '04', 'avr': '04', 'mai': '05', 'juin': '06',
    'juillet': '07', 'juil': '07', 'août': '08', 'septembre': '09', 'sept': '09',
    'octobre': '10', 'oct': '10', 'novembre': '11', 'nov': '11', 'décembre': '12', 'déc': '12'
  };

  const yearMatch = lowerText.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : '';
  if (!year) return '';

  let month = '01';
  for (const [name, num] of Object.entries(months)) {
    if (lowerText.includes(name)) { month = num; break; }
  }

  // Jour explicite : "15 Juillet 2024"
  const dayMatch = lowerText.match(/^(\d{1,2})\s/);
  const day = dayMatch ? dayMatch[1].padStart(2, '0') : '01';

  return `${year}-${month}-${day}`;
}

/**
 * Calcule automatiquement la durée (jours) pour le formulaire d'expérience
 * à partir des champs exp-date-start et exp-date-end.
 */
function calculateExpDuration() {
  const startVal = document.getElementById('exp-date-start')?.value;
  const endVal = document.getElementById('exp-date-end')?.value;
  const durationInput = document.getElementById('exp-duration');
  const hint = document.getElementById('exp-duration-hint');

  if (!startVal) {
    if (durationInput) { durationInput.value = ''; }
    if (hint) hint.style.display = 'block';
    return;
  }

  const start = new Date(startVal);
  const end = endVal ? new Date(endVal) : null;

  if (end && end >= start) {
    const diffMs = end - start;
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1; // Inclus les deux bornes
    if (durationInput) durationInput.value = days;
    if (hint) hint.style.display = 'none';
  } else if (!endVal) {
    // Pas de fin saisie : 1 jour par défaut
    if (durationInput) durationInput.value = 1;
    if (hint) hint.style.display = 'none';
  } else {
    // Fin avant début
    if (durationInput) durationInput.value = '';
    if (hint) { hint.textContent = '⚠️ La date de fin doit être après la date de début.'; hint.style.display = 'block'; }
  }
}
window.calculateExpDuration = calculateExpDuration;

/**
 * Calcule automatiquement la durée pour le formulaire de formation.
 */
function calculateFormDuration() {
  const startVal = document.getElementById('form-date-start')?.value;
  const endVal = document.getElementById('form-date-end')?.value;
  const durationInput = document.getElementById('form-duration');
  const hint = document.getElementById('form-duration-hint');

  if (!startVal) {
    if (durationInput) durationInput.value = '';
    if (hint) hint.style.display = 'block';
    return;
  }

  const start = new Date(startVal);
  const end = endVal ? new Date(endVal) : null;

  if (end && end >= start) {
    const diffMs = end - start;
    const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
    if (durationInput) durationInput.value = days;
    if (hint) hint.style.display = 'none';
  } else if (!endVal) {
    if (durationInput) durationInput.value = 1;
    if (hint) hint.style.display = 'none';
  } else {
    if (durationInput) durationInput.value = '';
    if (hint) { hint.textContent = '⚠️ La date de fin doit être après la date de début.'; hint.style.display = 'block'; }
  }
}
window.calculateFormDuration = calculateFormDuration;

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
    };
    reader.readAsDataURL(file);
  });
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

  const logoText = document.getElementById('form-logo-text');
  if (logoText) logoText.textContent = 'Cliquez ou déposez un logo ici';
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

  const logoText = document.getElementById('exp-logo-text');
  if (logoText) logoText.textContent = 'Cliquez ou déposez un logo ici';
}

// Initialiser le gestionnaire lors de l'ouverture de la modale
document.addEventListener('DOMContentLoaded', function () {
  initLogoFileUpload();
  initFormationLogoFileUpload();
  initSearchableSelects(); // Important de garder après reset si non présent, ajouté avant.
});

// Afficher le modal d'édition d'expérience
async function showEditExperienceModal(data, row) {
  document.getElementById('experience-modal-title').textContent = 'Modifier une expérience';
  hideExperienceError();

  // Remplir le formulaire avec les données
  document.getElementById('exp-type').value = data.type || 'colo';
  document.getElementById('exp-ce').value = data.ce || '';

  // Gestion spécifique ALSH/Scout/Périscolaire (Mercredis vs Ponctuel)
  const isAlsh = (data.type === 'alsh' || data.type === 'scout' || data.type === 'periscolaire');
  // On vérifie si la durée contient "Tous les mercredis", "Tous les samedis" ou "Une année périscolaire"
  const durationLower = (data.duration || '').toLowerCase();
  const isMercredis = durationLower.includes('mercredis') || durationLower.includes('samedis') || durationLower.includes('périscolaire') || durationLower.includes('periscolaire');

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
  if (typeof updateExpStayTypeOptions === 'function') {
    updateExpStayTypeOptions();
  }
  if (typeof updateOrganizerOptions === 'function') {
    updateOrganizerOptions();
  }

  // Remplir les champs date avec le nouveau système (compatible données existantes)
  const startDateVal = frenchTextToDate(data.date || '');
  const expDateStart = document.getElementById('exp-date-start');
  const expDateEnd = document.getElementById('exp-date-end');
  if (expDateStart) expDateStart.value = startDateVal || '';
  // Pour la date de fin : si on a une durée en jours, on la calcule
  if (expDateEnd) {
    if (startDateVal && !isMercredis) {
      const durationMatch2 = (data.duration || '').match(/^(\d+)/);
      if (durationMatch2) {
        const durDays = parseInt(durationMatch2[1], 10);
        if (durDays > 1) {
          const endDate = new Date(startDateVal);
          endDate.setDate(endDate.getDate() + durDays - 1);
          expDateEnd.value = endDate.toISOString().split('T')[0];
        } else {
          expDateEnd.value = '';
        }
      } else {
        expDateEnd.value = '';
      }
    } else {
      expDateEnd.value = '';
    }
  }
  document.getElementById('exp-date').value = data.date || '';

  // Recalculer la durée affichée
  if (!isMercredis) calculateExpDuration();
  const rawOrganizer = data.organizer || '';
  // Matcher "Nom (Dept)"
  const organizerMatch = rawOrganizer.match(/^(.*?)\s*\(([^)]+)\)$/);

  let orgName = rawOrganizer;
  let orgDept = '';

  if (organizerMatch) {
    orgName = organizerMatch[1].trim();
    orgDept = organizerMatch[2].trim();
  }

  const orgSelect = document.getElementById('exp-organizer');
  const orgCustom = document.getElementById('exp-organizer-custom');

  if (orgSelect) {
    let optionExists = false;
    for (let i = 0; i < orgSelect.options.length; i++) {
      if (orgSelect.options[i].value === orgName && orgName !== '') {
        optionExists = true;
        break;
      }
    }

    if (optionExists) {
      if (orgSelect.tomselect) orgSelect.tomselect.setValue(orgName, true);
      else orgSelect.value = orgName;
      if (orgCustom) {
        orgCustom.value = '';
        orgCustom.style.display = 'none';
      }
    } else if (orgName) {
      if (orgSelect.tomselect) orgSelect.tomselect.setValue('Autre', true);
      else orgSelect.value = 'Autre';
      if (orgCustom) {
        orgCustom.value = orgName;
        orgCustom.style.display = 'block';
      }
    } else {
      if (orgSelect.tomselect) orgSelect.tomselect.setValue('', true);
      else orgSelect.value = '';
      if (orgCustom) {
        orgCustom.value = '';
        orgCustom.style.display = 'none';
      }
    }
  }

  document.getElementById('exp-dept').value = orgDept;
  document.getElementById('exp-organizer-url').value = data.organizerUrl || '';

  // Gérer le logo
  const logoPath = extractLogoFilename(data.logoPath || '');
  document.getElementById('exp-logo-path').value = logoPath;

  const preview = document.getElementById('logo-preview');
  const placeholder = document.getElementById('logo-placeholder');
  const removeBtn = document.getElementById('remove-logo');

  if (logoPath) {
    if (preview) {
      preview.src = data.logoPath || '';
      preview.style.display = 'block';
    }
    if (placeholder) placeholder.style.display = 'none';
  } else {
    if (preview) preview.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }

  // Appliquer le style selon le choix (après avoir chargé le logo pour que toggle gère la visibilité du bouton supprimer)
  if (typeof toggleOrganizerCustom === 'function') {
    toggleOrganizerCustom(true);
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
      if (stayTypeSelect.tomselect) stayTypeSelect.tomselect.setValue(stayTypeVal, true);
    }
    if (stayTypeCustom) {
      stayTypeCustom.style.display = 'none';
      stayTypeCustom.value = '';
    }
  } else if (stayTypeVal) {
    // C'est un type personnalisé -> "Autre"
    if (stayTypeSelect) {
      stayTypeSelect.value = 'Autre';
      if (stayTypeSelect.tomselect) stayTypeSelect.tomselect.setValue('Autre', true);
    }
    if (stayTypeCustom) {
      stayTypeCustom.style.display = 'block';
      stayTypeCustom.value = stayTypeVal;
    }
  } else {
    if (stayTypeSelect) {
      stayTypeSelect.value = '';
      if (stayTypeSelect.tomselect) stayTypeSelect.tomselect.clear(true);
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
      if (positionSelect.tomselect) positionSelect.tomselect.setValue(currentPosition, true);
      else positionSelect.value = currentPosition;

      if (customPositionInput) {
        customPositionInput.value = '';
        customPositionInput.style.display = 'none';
        customPositionInput.required = false;
      }
    } else if (currentPosition) {
      // Si n'existe pas, mettre "Autre" et remplir le champ custom
      if (positionSelect.tomselect) positionSelect.tomselect.setValue('Autre', true);
      else positionSelect.value = 'Autre';

      if (customPositionInput) {
        customPositionInput.value = currentPosition;
        customPositionInput.style.display = 'block';
        customPositionInput.required = true;
      }
    } else {
      if (positionSelect.tomselect) positionSelect.tomselect.clear(true);
      else positionSelect.value = '';

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

  // Appliquer la logique du type de gestion une dernière fois pour être sûr
  if (typeof updateExpStayTypeOptions === 'function') {
    updateExpStayTypeOptions();
  }

  window.hasUnsavedFormChanges = false;

  document.getElementById('experience-modal').style.display = 'flex';
  document.body.classList.add('modal-open');
}

// Fermer le modal d'expérience
function closeExperienceModal(force = false) {
  if (window.hasUnsavedFormChanges && !force) {
    window.showUnsavedChangesModal('experience');
    return;
  }
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
  const modals = ['experience-modal', 'formation-modal', 'delete-confirm-modal'];
  modals.forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          if (modalId === 'experience-modal') {
            closeExperienceModal();
          } else if (modalId === 'formation-modal') {
            closeFormationModal();
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

// Variable pour stocker la structure originale des intitulés de formation
let originalFormationTitleHtml = '';

/**
 * Gère l'affichage des intitulés de formation selon le type (BAFA vs BAFD).
 */
function updateFormationTitleLabels(clearValue = false) {
  const typeSelect = document.getElementById('form-type');
  const titleSelect = document.getElementById('form-title');
  if (!typeSelect || !titleSelect) return;

  // Sauvegarder la structure originale au premier appel
  if (!originalFormationTitleHtml) {
    originalFormationTitleHtml = titleSelect.innerHTML;
  }

  const formationType = typeSelect.value;
  const ts = titleSelect.tomselect;

  // Utiliser la valeur actuelle sauf si on demande explicitement de vider (changement manuel de type)
  let currentValue = ts ? ts.getValue() : titleSelect.value;
  if (clearValue) {
    currentValue = '';
  }

  // Tableaux de blackliste demandés
  const removableOptionsFormationBafa = [
    'Formation Générale BAFD',
    'Perfectionnement BAFD',
    'Formation de formateur BAFD'
  ];

  const removableOptionsFormationBafd = [
    'Formation Générale BAFA',
    'Appro BAFA : 6-12 ans',
    'Appro BAFA : Accueil de loisirs',
    'Appro BAFA : Activités physiques et sportives',
    'Appro BAFA : Activités scientifiques et techniques',
    'Appro BAFA : Ados & préados',
    'Appro BAFA : AS',
    'Appro BAFA : Animation d\'intérieur',
    'Appro BAFA : Animer à la mer',
    'Appro BAFA : Animer à la montagne',
    'Appro BAFA : Animer en ville',
    'Appro BAFA : Grands jeux & animation',
    'Appro BAFA : Jeux de plein air',
    'Appro BAFA : Petite enfance',
    'Appro BAFA : Mini camps',
    'Appro BAFA : Publics en situation de handicap',
    'Appro BAFA : Gestion de conflits et jeux coopératifs',
    'Appro BAFA : Séjour à l\'étranger',
    'Appro BAFA : Séjour et environnement',
    'Appro BAFA : Ski & Glisse',
    'Appro BAFA : Spectacle et expression',
    'Qualification BAFA : Activités de loisirs motocycliste',
    'Qualification BAFA : Canoë-Kayak',
    'Qualification BAFA : Surveillant de Baignade',
    'Qualification BAFA : Surveillant de Baignade (Renouvellement)',
    'Qualification BAFA : Voile',
    'Formation de formateur BAFA'
  ];

  const blacklist = formationType === 'bafa' ? removableOptionsFormationBafa : removableOptionsFormationBafd;

  // Réinitialiser le select
  titleSelect.innerHTML = originalFormationTitleHtml;

  // Filtrer les options
  Array.from(titleSelect.options).forEach(opt => {
    if (blacklist.includes(opt.value)) {
      opt.remove();
    }
  });

  // Nettoyer les optgroups vides
  Array.from(titleSelect.querySelectorAll('optgroup')).forEach(group => {
    if (group.querySelectorAll('option').length === 0) {
      group.remove();
    }
  });

  // Synchroniser TomSelect
  if (ts) {
    // 1. Vider totalement TomSelect (options et groupes)
    ts.clear(true);
    ts.clearOptions();

    // 2. Ré-importer les options filtrées depuis le select natif
    ts.sync();

    // 3. Restaurer la valeur (éventuellement vide)
    ts.setValue(currentValue, true);
  } else {
    titleSelect.value = currentValue;
  }

  // Mettre à jour l'affichage du champ "Autre" si le titre est vidé
  if (clearValue && typeof toggleFormTitleCustom === 'function') {
    toggleFormTitleCustom();
  }
}
window.updateFormationTitleLabels = updateFormationTitleLabels;

// Réinitialiser le formulaire de formation
async function showAddFormationModal() {
  document.getElementById('formation-modal-title').textContent = 'Ajouter une formation';
  const form = document.getElementById('formation-form');
  form.reset();

  // Mettre à jour les labels selon le type par défaut
  updateFormationTitleLabels();

  ['form-title', 'form-organism'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.tomselect) el.tomselect.clear();
  });

  toggleFormTitleCustom();
  if (typeof toggleFormationOrganizerCustom === 'function') toggleFormationOrganizerCustom();
  removeFormationLogo();
  hideFormationError();

  // Réinitialiser les champs de date du nouveau système
  const formStartInput = document.getElementById('form-date-start');
  const formEndInput = document.getElementById('form-date-end');
  if (formStartInput) formStartInput.value = '';
  if (formEndInput) formEndInput.value = '';
  const formDuration = document.getElementById('form-duration');
  if (formDuration) formDuration.value = '';
  const formDurationHint = document.getElementById('form-duration-hint');
  if (formDurationHint) { formDurationHint.textContent = 'Saisissez une date de début et de fin pour calculer la durée.'; formDurationHint.style.display = 'block'; }
  document.getElementById('form-date').value = '';

  window.hasUnsavedFormChanges = false;

  document.getElementById('formation-modal').style.display = 'flex';
  document.body.classList.add('modal-open');
}

// Afficher le modal d'édition de formation
function showEditFormationModal(data, row) {
  document.getElementById('formation-modal-title').textContent = 'Modifier une formation';
  hideFormationError();

  // Remplir le formulaire avec les données
  document.getElementById('form-type').value = data.type || 'bafa';

  // Mettre à jour les labels selon le type chargé
  updateFormationTitleLabels();

  // Remplir les champs date avec le nouveau système (compatible données existantes)
  const formStartDateVal = frenchTextToDate(data.date || '');
  const formDateStartEl = document.getElementById('form-date-start');
  const formDateEndEl = document.getElementById('form-date-end');
  if (formDateStartEl) formDateStartEl.value = formStartDateVal || '';
  if (formDateEndEl) {
    if (formStartDateVal) {
      const formDurMatch = (data.duration || '').match(/^(\d+)/);
      if (formDurMatch) {
        const formDurDays = parseInt(formDurMatch[1], 10);
        if (formDurDays > 1) {
          const formEndDate = new Date(formStartDateVal);
          formEndDate.setDate(formEndDate.getDate() + formDurDays - 1);
          formDateEndEl.value = formEndDate.toISOString().split('T')[0];
        } else {
          formDateEndEl.value = '';
        }
      } else {
        formDateEndEl.value = '';
      }
    } else {
      formDateEndEl.value = '';
    }
  }
  document.getElementById('form-date').value = data.date || '';

  // Recalculer la durée affichée
  calculateFormDuration();

  const rawOrganism = data.organism || '';
  // Matcher "Nom (Dept)"
  const organismMatch = rawOrganism.match(/^(.*?)\s*\(([^)]+)\)$/);

  let orgName = rawOrganism;
  let orgDept = '';

  if (organismMatch) {
    orgName = organismMatch[1].trim();
    orgDept = organismMatch[2].trim();
  }

  const orgSelect = document.getElementById('form-organism');
  const orgCustom = document.getElementById('form-organism-custom');

  if (orgSelect) {
    let optionExists = false;
    for (let i = 0; i < orgSelect.options.length; i++) {
      if (orgSelect.options[i].value === orgName && orgName !== '') {
        optionExists = true;
        break;
      }
    }

    if (optionExists) {
      if (orgSelect.tomselect) orgSelect.tomselect.setValue(orgName, true);
      else orgSelect.value = orgName;
      if (orgCustom) {
        orgCustom.value = '';
        orgCustom.style.display = 'none';
      }
    } else if (orgName) {
      if (orgSelect.tomselect) orgSelect.tomselect.setValue('Autre', true);
      else orgSelect.value = 'Autre';
      if (orgCustom) {
        orgCustom.value = orgName;
        orgCustom.style.display = 'block';
      }
    } else {
      if (orgSelect.tomselect) orgSelect.tomselect.setValue('', true);
      else orgSelect.value = '';
      if (orgCustom) {
        orgCustom.value = '';
        orgCustom.style.display = 'none';
      }
    }
  }

  const deptInput = document.getElementById('form-organism-dept');
  if (deptInput) {
    deptInput.value = orgDept;
    if (orgSelect && orgSelect.value !== 'Autre' && orgSelect.value !== '') {
      deptInput.readOnly = true;
    } else {
      deptInput.readOnly = false;
    }
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
  } else {
    removeFormationLogo();
  }

  // Appliquer le style selon le choix
  if (typeof toggleFormationOrganizerCustom === 'function') {
    toggleFormationOrganizerCustom(true);
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
      if (titleSelect.tomselect) titleSelect.tomselect.setValue(currentTitle, true);

      if (customTitleInput) {
        customTitleInput.value = '';
        customTitleInput.style.display = 'none';
      }
    } else {
      // Si n'existe pas, mettre "Autre" et remplir le champ custom
      titleSelect.value = 'Autre';
      if (titleSelect.tomselect) titleSelect.tomselect.setValue('Autre', true);

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
function closeFormationModal(force = false) {
  if (window.hasUnsavedFormChanges && !force) {
    window.showUnsavedChangesModal('formation');
    return;
  }
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
    expTypeSelect.addEventListener('change', () => {
      toggleAlshDateFields();
      updateExpStayTypeOptions();
      updateOrganizerOptions();
    });
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
      const isAlshOrScout = (expType === 'alsh' || expType === 'scout' || expType === 'periscolaire');
      const isPeriscolaire = (expType === 'periscolaire');
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

        // La durée est fixée selon le type
        if (isPeriscolaire) {
          finalDuration = "Une année périscolaire";
        } else if (expType === 'scout') {
          finalDuration = "Tous les samedis";
        } else {
          finalDuration = "Tous les mercredis";
        }
      } else {
        // Mode classique (Ponctuel ou Colo/Autre) : lire les champs date-start/end
        const startDateVal = document.getElementById('exp-date-start')?.value;
        const endDateVal = document.getElementById('exp-date-end')?.value;

        if (!startDateVal) {
          showExperienceError("Veuillez saisir une date de début.");
          return;
        }

        // Construire le texte de date pour le stockage
        if (endDateVal && endDateVal !== startDateVal) {
          finalDate = `${dateToFrenchText(startDateVal)} - ${dateToFrenchText(endDateVal)}`;
        } else {
          finalDate = dateToFrenchText(startDateVal);
        }

        // Récupérer la durée calculée (read-only, déjà calculée par calculateExpDuration)
        const durationInput = document.getElementById('exp-duration');
        finalDuration = durationInput ? durationInput.value : '';
      }

      // On met la date formatée dans le champ hidden pour qu'elle soit récupérée par getFormData ou la suite
      document.getElementById('exp-date').value = finalDate;
      // Pour la durée, il faudra peut-être l'injecter manuellement dans l'objet `data` plus bas 
      // car le champ input standard pourrait être ignoré ou avoir une valeur "Tous les mercredis"


      const stayType = document.getElementById('exp-stay-type').value || '';

      // Gérer les lieux selon le type de séjour

      let location = null;
      let locationUrl = null;
      let itineraryLocationsData = null;

      if (stayType && stayType.includes('Itinérance')) {
        // Mode itinérance : récupérer le tableau de lieux
        itineraryLocationsData = getItineraryLocations();
        if (itineraryLocationsData.length === 0 || itineraryLocationsData.length === 1) {
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
        // itineraryLocationsData reste null
      }

      // Gérer le logo : si vide, tenter la détection automatique
      let logoPath = '';
      const logoInputVal = document.getElementById('exp-logo-path').value.trim();
      const rawOrganizerUrl = document.getElementById('exp-organizer-url').value.trim();

      if (!logoInputVal) {
        // Pas de logo
      } else {
        // Logo déjà uploadé/défini
        if (logoInputVal.startsWith('http') || logoInputVal.startsWith('data:image') || logoInputVal.startsWith('assets/img/')) {
          logoPath = logoInputVal;
        } else {
          logoPath = `assets/img/${logoInputVal}`;
        }
      }

      // Illustration par défaut si aucun logo n'est défini
      if (!logoPath) {
        logoPath = `assets/img/no-img.jpg`;
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
      } else if (ageMaxVal) {
        const ageMax = parseInt(ageMaxVal, 10);
        ageRangeString = `${ageMax} ans`;
      }

      const data = {
        type: document.getElementById('exp-type').value,
        date: finalDate, // Utiliser la date calculée plus haut (gère Mercredis et Mois standard)
        duration: (() => {
          if (finalDuration === "Tous les mercredis" || finalDuration === "Tous les samedis" || finalDuration === "Une année périscolaire") return finalDuration;
          // Sinon logique standard avec jours
          if (!finalDuration) return '';
          const days = parseInt(finalDuration, 10);
          return days > 1 ? `${days} jours` : `${days} jour`;
        })(),
        organizer: (() => {
          const orgSelect = document.getElementById('exp-organizer').value;
          const org = (orgSelect === 'Autre') ? document.getElementById('exp-organizer-custom').value.trim() : orgSelect;

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

          const orgSelect = document.getElementById('exp-organizer').value;
          const org = (orgSelect === 'Autre') ? document.getElementById('exp-organizer-custom').value.trim() : orgSelect;
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
        youthCount: parseInt(document.getElementById('exp-youth-count').value || '0', 10),
        ce: document.getElementById('exp-ce').value.trim()
      };

      // Gérer le tableau locations selon le type de séjour
      if (stayType && stayType.includes('Itinérance')) {
        data.locations = itineraryLocationsData;
      } else {
        data.locations = null;
      }

      try {
        if (currentEditingRow) {
          // Modification : trouver le document dans Firebase
          await updateExperienceInFirebase(data, currentEditingRow);
        } else {
          // Ajout
          await addExperienceToFirebase(data);
        }

        window.hasUnsavedFormChanges = false;
        closeExperienceModal(true);
        // Recharger les données
        if (typeof loadDataFromFirebase === 'function') {
          const scrollPos = window.scrollY; // Sauvegarder la position
          await loadDataFromFirebase();
          window.scrollTo(0, scrollPos); // Restaurer la position
        }
      } catch (error) {
        console.error('Erreur:', error);
        showExperienceError('Erreur lors de l\'enregistrement. Veuillez recharger la page.');
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

      // Construire la date à partir des champs start/end
      const formStartVal = document.getElementById('form-date-start')?.value;
      const formEndVal = document.getElementById('form-date-end')?.value;

      if (!formStartVal) {
        showFormationError("Veuillez saisir une date de début.");
        return;
      }

      const dateText = (formEndVal && formEndVal !== formStartVal)
        ? `${dateToFrenchText(formStartVal)} - ${dateToFrenchText(formEndVal)}`
        : dateToFrenchText(formStartVal);
      document.getElementById('form-date').value = dateText;

      // Gérer le chemin du logo avec le préfixe GitHub Pages
      // Gérer le logo : auto-détection si vide
      let logoPath = '';
      const logoInputVal = document.getElementById('form-logo-path').value.trim();
      const organismUrl = document.getElementById('form-organism-url').value.trim();

      const orgSelect = document.getElementById('form-organism').value;
      const organismName = (orgSelect === 'Autre') ? document.getElementById('form-organism-custom').value.trim() : orgSelect;

      if (!logoInputVal) {
        // Pas de logo
      } else if (logoInputVal) {
        if (logoInputVal.startsWith('http') || logoInputVal.startsWith('data:image') || logoInputVal.startsWith('assets/img/')) {
          logoPath = logoInputVal;
        } else {
          logoPath = `assets/img/${logoInputVal}`;
        }
      }

      // Illustration par défaut si aucun logo n'est défini
      if (!logoPath) {
        logoPath = `assets/img/no-img.jpg`;
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
          const orgSelect = document.getElementById('form-organism').value;
          const org = (orgSelect === 'Autre') ? document.getElementById('form-organism-custom').value.trim() : orgSelect;
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

          const orgSelect = document.getElementById('form-organism').value;
          const org = (orgSelect === 'Autre') ? document.getElementById('form-organism-custom').value.trim() : orgSelect;
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

        window.hasUnsavedFormChanges = false;
        closeFormationModal(true);
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
  // Ajouter les timestamps (utiliser serverTimestamp pour plus de précision)
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();
  data.createdAt = timestamp;
  data.updatedAt = timestamp;

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
    // Mettre à jour le timestamp de modification
    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

    // Garder la date de création originale si elle existe dans le doc
    const existingData = doc.data();
    if (existingData && existingData.createdAt) {
      data.createdAt = existingData.createdAt;
    } else {
      data.createdAt = data.updatedAt; // Fallback pour les vieilles données
    }

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
  // Ajouter les timestamps
  const timestamp = firebase.firestore.FieldValue.serverTimestamp();
  data.createdAt = timestamp;
  data.updatedAt = timestamp;

  await getCollectionRef('formations').add(data);
  console.log('Formation ajoutée avec succès');
}

// Modifier une formation dans Firebase
async function updateFormationInFirebase(data, row) {
  if (!isOwner()) {
    throw new Error('Non autorisé : vous n\'êtes pas le propriétaire de ce profil.');
  }
  // Utiliser les données stockées dans l'attribut data-formation pour retrouver les valeurs originales
  let date, organism;

  if (row.dataset.formation) {
    try {
      const originalData = JSON.parse(row.dataset.formation);
      date = originalData.date;
      organism = originalData.organism;
    } catch (e) {
      console.error("Erreur parsing data-formation", e);
    }
  }

  // Fallback
  if (!date) date = row.cells[1]?.textContent?.trim();
  if (!organism) organism = row.cells[3]?.querySelector('a')?.textContent?.trim();

  const snapshot = await getCollectionRef('formations')
    .where('date', '==', date)
    .where('organism', '==', organism)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    // Mettre à jour le timestamp
    data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

    const existingData = doc.data();
    if (existingData && existingData.createdAt) {
      data.createdAt = existingData.createdAt;
    } else {
      data.createdAt = data.updatedAt;
    }

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
  // Utiliser les données stockées dans l'attribut data-formation
  let date, organism;

  if (row.dataset.formation) {
    try {
      const originalData = JSON.parse(row.dataset.formation);
      date = originalData.date;
      organism = originalData.organism;
    } catch (e) {
      console.error("Erreur parsing data-formation", e);
    }
  }

  // Fallback
  if (!date) date = row.cells[1]?.textContent?.trim();
  if (!organism) organism = row.cells[3]?.querySelector('a')?.textContent?.trim();

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

/* === Autocomplete Lieux === */
function setupCityAutocomplete(inputId, deptInputId) {
  const inputEl = document.getElementById(inputId);
  if (!inputEl) return;
  const deptInputEl = document.getElementById(deptInputId);

  const parent = inputEl.parentElement;

  const dropdown = document.createElement('div');
  dropdown.className = 'autocomplete-dropdown';
  dropdown.style.display = 'none';
  dropdown.style.position = 'absolute';
  dropdown.style.background = 'white';
  dropdown.style.border = '1px solid #ddd';
  dropdown.style.borderRadius = '4px';
  dropdown.style.maxHeight = '200px';
  dropdown.style.overflowY = 'auto';
  dropdown.style.width = '100%';
  dropdown.style.zIndex = '1000';
  dropdown.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
  dropdown.style.top = '100%';
  dropdown.style.left = '0';
  dropdown.style.marginTop = '4px';

  parent.style.position = 'relative';
  parent.appendChild(dropdown);

  let debounceTimer;

  inputEl.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    const query = this.value.trim();

    if (query.length < 3) {
      dropdown.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,codeDepartement,departement,region&boost=population&limit=5`;
        const resp = await fetch(url);
        const data = await resp.json();

        dropdown.innerHTML = '';
        if (data.length > 0) {
          data.forEach(city => {
            const item = document.createElement('div');
            item.style.padding = '8px 12px';
            item.style.cursor = 'pointer';
            item.style.borderBottom = '1px solid #f0f0f0';
            item.style.textAlign = 'left';

            item.addEventListener('mouseenter', () => item.style.backgroundColor = '#f9f9f9');
            item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');

            const cityName = document.createElement('div');
            cityName.textContent = city.nom;
            cityName.style.fontWeight = 'bold';
            cityName.style.color = '#333';

            const regionName = document.createElement('div');
            const deptName = city.departement ? city.departement.nom : '';
            const regName = city.region ? city.region.nom : '';
            regionName.textContent = `${deptName} (${city.codeDepartement}) - ${regName}`;
            regionName.style.fontSize = '0.75em';
            regionName.style.color = '#777';
            regionName.style.marginTop = '2px';

            item.appendChild(cityName);
            item.appendChild(regionName);

            item.addEventListener('mousedown', (e) => {
              e.preventDefault();
              inputEl.value = city.nom;
              if (deptInputEl) {
                deptInputEl.value = city.codeDepartement;
              }
              dropdown.style.display = 'none';
            });

            dropdown.appendChild(item);
          });
          dropdown.style.display = 'block';
        } else {
          dropdown.style.display = 'none';
        }
      } catch (e) {
        console.error("Erreur géo API", e);
      }
    }, 300);
  });

  inputEl.addEventListener('blur', function () {
    setTimeout(() => {
      dropdown.style.display = 'none';
    }, 150);
  });

  inputEl.addEventListener('focus', function () {
    if (this.value.trim().length >= 3 && dropdown.children.length > 0) {
      dropdown.style.display = 'block';
    }
  });
}

document.addEventListener('DOMContentLoaded', function () {
  setupCityAutocomplete('exp-location', 'exp-location-dept');
  setupCityAutocomplete('form-location', 'form-location-dept');
});

