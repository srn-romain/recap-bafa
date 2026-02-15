// Script pour charger les données depuis Firebase
// Avec fallback vers les données statiques du HTML

/**
 * Structure des données d'expérience
 */

// Map des genres pour l'affichage (synchronisé avec admin-forms.js)
// Map des genres pour l'affichage (synchronisé avec admin-forms.js)
const GENDER_MAP = [
  { m: 'Animateur Stagiaire', f: 'Animatrice Stagiaire' },
  { m: 'Animateur (diplômé)', f: 'Animatrice (diplômée)', displayM: 'Animateur', displayF: 'Animatrice' },
  { m: 'Animateur Ski', f: 'Animatrice Ski' },
  { m: 'Animateur Snow', f: 'Animatrice Snow' },
  { m: 'Animateur SB', f: 'Animatrice SB' },
  { m: 'Animateur AS', f: 'Animatrice AS' },
  { m: 'Animateur Référent Handicap', f: 'Animatrice Référente Handicap' },
  { m: 'Responsable de Groupe', f: 'Responsable de Groupe' },
  { m: 'Surveillant de Baignade (non animateur)', f: 'Surveillante de Baignade (non animatrice)', displayM: 'Surveillant de Baignade', displayF: 'Surveillante de Baignade' },
  { m: 'Assistant Sanitaire (non animateur)', f: 'Assistante Sanitaire (non animatrice)', displayM: 'Assistant Sanitaire', displayF: 'Assistante Sanitaire' },
  { m: 'Tuteur de Maisonnée (SNU)', f: 'Tutrice de Maisonnée (SNU)', displayM: 'Tuteur de Maisonnée', displayF: 'Tutrice de Maisonnée' },
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
  { m: 'Autre (préciser)', f: 'Autre (préciser)' }
];

function createExperienceRow(experience) {
  const tr = document.createElement('tr');
  tr.setAttribute('data-type', experience.type);
  // Stocker l'objet complet pour une récupération facile lors de l'édition
  tr.dataset.experience = JSON.stringify(experience);
  tr.classList.add('experience-row');

  // Colonne N°
  const tdNum = document.createElement('td');
  tdNum.className = 'num';
  tr.appendChild(tdNum);

  // Colonne Date
  const tdDate = document.createElement('td');
  tdDate.textContent = experience.date;
  tr.appendChild(tdDate);

  // Colonne Durée
  const tdDuration = document.createElement('td');
  tdDuration.textContent = experience.duration;
  tr.appendChild(tdDuration);

  // Colonne Organisateur
  const tdOrganizer = document.createElement('td');
  const organizerLink = document.createElement('a');
  organizerLink.href = experience.organizerUrl;
  organizerLink.target = '_blank';
  organizerLink.textContent = experience.organizer;
  tdOrganizer.appendChild(organizerLink);
  tr.appendChild(tdOrganizer);

  // Colonne Logo
  const tdLogo = document.createElement('td');
  const logoLink = document.createElement('a');
  logoLink.href = experience.organizerUrl;
  logoLink.target = '_blank';
  const logoImg = document.createElement('img');
  logoImg.src = experience.logoPath;
  logoImg.alt = 'Logo de ' + experience.organizer;
  logoImg.className = 'image-carrée';
  logoLink.appendChild(logoImg);
  tdLogo.appendChild(logoLink);
  tr.appendChild(tdLogo);

  // Colonne Lieu
  const tdLocation = document.createElement('td');
  if (Array.isArray(experience.locations)) {
    // Plusieurs lieux (itinérance)
    const isLoggedIn = window.currentUser !== null && window.userRole !== null;

    experience.locations.forEach((loc, index) => {
      const locLink = document.createElement('a');

      if (isLoggedIn && loc.url && loc.url !== '#') {
        locLink.href = loc.url;
        locLink.target = '_blank';
        locLink.className = 'location-link';
      } else {
        locLink.href = '#';
        locLink.className = 'location-link-disabled';
        if (loc.url && loc.url !== '#') {
          locLink.title = 'Connectez-vous pour voir sur Google Maps';
        }
      }

      locLink.textContent = loc.location || loc.name || 'Lieu inconnu';
      tdLocation.appendChild(locLink);

      if (index < experience.locations.length - 1) {
        tdLocation.appendChild(document.createTextNode(', '));
      }
    });
    if (experience.country) {
      tdLocation.appendChild(document.createTextNode(' (' + experience.country + ')'));
    }
  } else {
    // Un seul lieu
    const locLink = document.createElement('a');
    // Vérifier si l'utilisateur est connecté avant d'activer le lien
    const isLoggedIn = window.currentUser !== null && window.userRole !== null;
    if (isLoggedIn && experience.locationUrl && experience.locationUrl !== '#') {
      locLink.href = experience.locationUrl;
      locLink.target = '_blank';
      locLink.className = 'location-link';
    } else {
      locLink.href = '#';
      locLink.className = 'location-link-disabled';
      locLink.title = 'Connectez-vous pour voir sur Google Maps';
      if (experience.locationUrl && experience.locationUrl !== '#') {
        locLink.setAttribute('data-original-href', experience.locationUrl);
      }
    }
    locLink.textContent = experience.location;
    tdLocation.appendChild(locLink);

    if (experience.country) {
      tdLocation.appendChild(document.createTextNode(' (' + experience.country + ')'));
    }
  }
  tr.appendChild(tdLocation);

  // Colonne Type de séjour
  const tdStayType = document.createElement('td');
  tdStayType.textContent = experience.stayType;
  tr.appendChild(tdStayType);

  // Colonne Intitulé du poste
  const tdPosition = document.createElement('td');
  let positionText = experience.position;

  // Utiliser le mapping pour l'affichage (féminisation et versions courtes)
  if (experience.position) {
    const rawPos = experience.position.trim();
    const mapped = GENDER_MAP.find(p => p.m === rawPos);

    if (mapped) {
      if (window.userGender === 'feminin') {
        // Mode féminin : utiliser displayF (court) ou f (complet)
        positionText = mapped.displayF || mapped.f;
      } else {
        // Mode masculin : utiliser displayM (court) si dispo, sinon garder la valeur originale (m)
        positionText = mapped.displayM || mapped.m;
      }
    }
  }

  tdPosition.textContent = positionText;
  tr.appendChild(tdPosition);

  // Colonne Tranche d'âge
  const tdAgeRange = document.createElement('td');
  tdAgeRange.textContent = experience.ageRange;
  tr.appendChild(tdAgeRange);

  // Colonne Nb de jeunes
  const tdYouthCount = document.createElement('td');
  tdYouthCount.textContent = experience.youthCount;
  tr.appendChild(tdYouthCount);

  return tr;
}

/**
 * Structure des données de formation
 */
function createFormationRow(formation) {
  const tr = document.createElement('tr');
  tr.setAttribute('data-type', formation.type);

  // Colonne N°
  const tdNum = document.createElement('td');
  tdNum.className = 'num';
  tr.appendChild(tdNum);

  // Colonne Date
  const tdDate = document.createElement('td');
  tdDate.textContent = formation.date;
  tr.appendChild(tdDate);

  // Colonne Durée
  const tdDuration = document.createElement('td');
  tdDuration.textContent = formation.duration;
  tr.appendChild(tdDuration);

  // Colonne Organisme
  const tdOrganism = document.createElement('td');
  const organismLink = document.createElement('a');
  organismLink.href = formation.organismUrl;
  organismLink.target = '_blank';
  organismLink.textContent = formation.organism;
  tdOrganism.appendChild(organismLink);
  tr.appendChild(tdOrganism);

  // Colonne Logo
  const tdLogo = document.createElement('td');
  const logoLink = document.createElement('a');
  logoLink.href = formation.organismUrl;
  logoLink.target = '_blank';
  const logoImg = document.createElement('img');
  logoImg.src = formation.logoPath;
  logoImg.alt = 'Logo de ' + formation.organism;
  logoImg.className = 'image-carrée';
  logoLink.appendChild(logoImg);
  tdLogo.appendChild(logoLink);
  tr.appendChild(tdLogo);

  // Colonne Intitulé
  const tdTitle = document.createElement('td');
  tdTitle.textContent = formation.title;
  tr.appendChild(tdTitle);

  // Colonne Lieu
  const tdLocation = document.createElement('td');
  const locLink = document.createElement('a');
  // Vérifier si l'utilisateur est connecté avant d'activer le lien
  const isLoggedIn = window.currentUser !== null && window.userRole !== null;
  if (isLoggedIn && formation.locationUrl && formation.locationUrl !== '#') {
    locLink.href = formation.locationUrl;
    locLink.target = '_blank';
    locLink.className = 'location-link';
  } else {
    locLink.href = '#';
    locLink.className = 'location-link-disabled';
    locLink.title = 'Connectez-vous pour voir sur Google Maps';
    if (formation.locationUrl && formation.locationUrl !== '#') {
      locLink.setAttribute('data-original-href', formation.locationUrl);
    }
  }
  locLink.textContent = formation.location;
  tdLocation.appendChild(locLink);
  tr.appendChild(tdLocation);

  return tr;
}

/**
 * Charger les expériences depuis Firebase
 */
async function loadExperiencesFromFirebase() {
  const loadingSpinner = document.getElementById('loading-experiences');
  const table = document.getElementById('table-experiences');

  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.log("Firebase non disponible, utilisation des données statiques");
    // Cacher le spinner si pas de Firebase
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }
    return false;
  }

  // Afficher le spinner si pas déjà affiché
  if (loadingSpinner && loadingSpinner.classList.contains('hidden')) {
    loadingSpinner.classList.remove('hidden');
  }
  if (table && table.style.display !== 'none') {
    table.style.display = 'none';
  }

  try {
    // Déterminer la collection à utiliser (root ou sous-collection user)
    let experiencesRef;
    if (window.targetUid) {
      experiencesRef = window.firebaseDb.collection('users').doc(window.targetUid).collection('experiences');
      console.log(`Chargement des expériences pour l'utilisateur ${window.targetUid}`);
    } else {
      experiencesRef = window.firebaseDb.collection('experiences');
      console.log("Chargement des expériences depuis la collection racine (Legacy)");
    }

    // Récupérer toutes les expériences (le tri sera fait côté client)
    const snapshot = await experiencesRef.get();

    if (snapshot.empty) {
      console.log("Aucune expérience trouvée dans Firebase");
      // Cacher le spinner
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
      if (table) {
        table.style.display = '';
        // Vider le tableau sauf l'en-tête
        const rows = table.querySelectorAll('tr[data-type]');
        rows.forEach(row => {
          if (!row.classList.contains('always-visible')) row.remove();
        });
        // Ajouter le message "Aucune donnée"
        const tbody = table.querySelector('tbody') || table;
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="10" style="text-align: center; padding: 20px; font-style: italic; color: #7f8c8d;">Aucune donnée à afficher</td>';
        tbody.appendChild(emptyRow);
      }
      return true; // Retourner true pour dire que le chargement est "fini" même si vide
    }

    const table = document.getElementById('table-experiences');
    if (!table) return false;

    // Supprimer toutes les lignes sauf l'en-tête
    const rows = table.querySelectorAll('tr[data-type]');
    rows.forEach(row => {
      if (!row.classList.contains('always-visible')) {
        row.remove();
      }
    });

    // Ajouter les expériences depuis Firebase
    const experiences = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      experiences.push({
        id: doc.id,
        type: data.type || 'colo',
        date: data.date || '',
        duration: data.duration || '',
        organizer: data.organizer || '',
        organizerUrl: data.organizerUrl || '',
        logoPath: data.logoPath || '',
        location: data.location || '',
        locationUrl: data.locationUrl || '',
        locations: data.locations || null,
        country: data.country || '',
        stayType: data.stayType || '',
        position: data.position || '',
        ageRange: data.ageRange || '',
        youthCount: data.youthCount || 0
      });
    });

    // Trier par date (tri côté client car les dates sont des chaînes)
    // Utiliser la fonction parseFrenchDate de main.js si disponible, sinon créer une version locale
    const parseDate = typeof parseFrenchDate === 'function' ? parseFrenchDate : function (dateStr) {
      dateStr = dateStr.toLowerCase().trim();
      if (/^\d{4}-\d{4}$/.test(dateStr)) {
        return new Date(parseInt(dateStr.split('-')[0], 10), 0, 1);
      }
      const monthMap = {
        'janvier': 0, 'janv': 0, 'février': 1, 'févr': 1, 'mars': 2,
        'avril': 3, 'avr': 3, 'mai': 4, 'juin': 5,
        'juillet': 6, 'juil': 6, 'août': 7, 'septembre': 8, 'sept': 8,
        'octobre': 9, 'oct': 9, 'novembre': 10, 'nov': 10, 'décembre': 11, 'déc': 11
      };
      const yearMatch = dateStr.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
      let month = 0;
      for (const [monthName, monthValue] of Object.entries(monthMap)) {
        if (dateStr.includes(monthName)) {
          month = monthValue;
          break;
        }
      }
      return new Date(year, month, 1);
    };

    experiences.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA; // Tri décroissant (plus récent en premier)
    });

    // Ajouter les lignes triées au tableau
    experiences.forEach(experience => {
      const row = createExperienceRow(experience);
      table.appendChild(row);
    });

    // Cacher le spinner et afficher le tableau
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }

    console.log("Expériences chargées depuis Firebase");
    return true;
  } catch (error) {
    console.error("Erreur lors du chargement des expériences:", error);
    // Cacher le spinner en cas d'erreur
    const loadingSpinner = document.getElementById('loading-experiences');
    const table = document.getElementById('table-experiences');
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }
    return false;
  }
}

/**
 * Charger les formations depuis Firebase
 */
async function loadFormationsFromFirebase() {
  const loadingSpinner = document.getElementById('loading-formations');
  const table = document.getElementById('table-formations');

  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.log("Firebase non disponible, utilisation des données statiques");
    // Cacher le spinner si pas de Firebase
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }
    return false;
  }

  // Afficher le spinner si pas déjà affiché
  if (loadingSpinner && loadingSpinner.classList.contains('hidden')) {
    loadingSpinner.classList.remove('hidden');
  }
  if (table && table.style.display !== 'none') {
    table.style.display = 'none';
  }

  try {
    // Déterminer la collection à utiliser (root ou sous-collection user)
    let formationsRef;
    if (window.targetUid) {
      formationsRef = window.firebaseDb.collection('users').doc(window.targetUid).collection('formations');
      console.log(`Chargement des formations pour l'utilisateur ${window.targetUid}`);
    } else {
      formationsRef = window.firebaseDb.collection('formations');
      console.log("Chargement des formations depuis la collection racine (Legacy)");
    }

    // Récupérer toutes les formations (le tri sera fait côté client)
    const snapshot = await formationsRef.get();

    if (snapshot.empty) {
      console.log("Aucune formation trouvée dans Firebase");
      // Cacher le spinner
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
      if (table) {
        table.style.display = '';
        // Vider le tableau sauf l'en-tête
        const rows = table.querySelectorAll('tr[data-type]');
        rows.forEach(row => {
          if (!row.classList.contains('always-visible')) row.remove();
        });
        // Ajouter le message "Aucune donnée"
        const tbody = table.querySelector('tbody') || table;
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="8" style="text-align: center; padding: 20px; font-style: italic; color: #7f8c8d;">Aucune donnée à afficher</td>';
        tbody.appendChild(emptyRow);
      }
      return true; // Retourner true pour dire que le chargement est "fini" même si vide
    }

    const table = document.getElementById('table-formations');
    if (!table) return false;

    // Supprimer toutes les lignes sauf l'en-tête
    const rows = table.querySelectorAll('tr[data-type]');
    rows.forEach(row => {
      if (!row.classList.contains('always-visible')) {
        row.remove();
      }
    });

    // Ajouter les formations depuis Firebase
    const formations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      formations.push({
        type: data.type || 'bafa',
        date: data.date || '',
        duration: data.duration || '',
        organism: data.organism || '',
        organismUrl: data.organismUrl || '#',
        logoPath: data.logoPath || '',
        title: data.title || '',
        location: data.location || '',
        locationUrl: data.locationUrl || '#'
      });
    });

    // Trier par date (tri côté client car les dates sont des chaînes)
    // Utiliser la fonction parseFrenchDate de main.js si disponible, sinon créer une version locale
    const parseDate = typeof parseFrenchDate === 'function' ? parseFrenchDate : function (dateStr) {
      dateStr = dateStr.toLowerCase().trim();
      if (/^\d{4}-\d{4}$/.test(dateStr)) {
        return new Date(parseInt(dateStr.split('-')[0], 10), 0, 1);
      }
      const monthMap = {
        'janvier': 0, 'janv': 0, 'février': 1, 'févr': 1, 'mars': 2,
        'avril': 3, 'avr': 3, 'mai': 4, 'juin': 5,
        'juillet': 6, 'juil': 6, 'août': 7, 'septembre': 8, 'sept': 8,
        'octobre': 9, 'oct': 9, 'novembre': 10, 'nov': 10, 'décembre': 11, 'déc': 11
      };
      const yearMatch = dateStr.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
      let month = 0;
      for (const [monthName, monthValue] of Object.entries(monthMap)) {
        if (dateStr.includes(monthName)) {
          month = monthValue;
          break;
        }
      }
      return new Date(year, month, 1);
    };

    formations.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA; // Tri décroissant (plus récent en premier)
    });

    // Ajouter les lignes triées au tableau
    formations.forEach(formation => {
      const row = createFormationRow(formation);
      table.appendChild(row);
    });

    // Cacher le spinner et afficher le tableau
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }

    console.log("Formations chargées depuis Firebase");
    return true;
  } catch (error) {
    console.error("Erreur lors du chargement des formations:", error);
    // Cacher le spinner en cas d'erreur
    const loadingSpinner = document.getElementById('loading-formations');
    const table = document.getElementById('table-formations');
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }
    return false;
  }
}

/**
 * Charger toutes les données depuis Firebase
 */
async function loadDataFromFirebase() {
  // Afficher les spinners au début du chargement
  const loadingExperiences = document.getElementById('loading-experiences');
  const loadingFormations = document.getElementById('loading-formations');
  const tableExperiences = document.getElementById('table-experiences');
  const tableFormations = document.getElementById('table-formations');

  if (loadingExperiences) {
    loadingExperiences.classList.remove('hidden');
  }
  if (tableExperiences) {
    tableExperiences.style.display = 'none';
  }

  if (loadingFormations) {
    loadingFormations.classList.remove('hidden');
  }
  if (tableFormations) {
    tableFormations.style.display = 'none';
  }

  const experiencesLoaded = await loadExperiencesFromFirebase();
  const formationsLoaded = await loadFormationsFromFirebase();

  // Charger les infos du profil (titre)
  if (window.targetUid) {
    loadUserProfile();
  }


  if (experiencesLoaded || formationsLoaded) {
    // Numéroter les lignes immédiatement après le chargement
    if (typeof remplirNum === 'function') {
      const experiencesTable = document.getElementById('table-experiences');
      const formationsTable = document.getElementById('table-formations');
      if (experiencesTable) remplirNum(experiencesTable);
      if (formationsTable) remplirNum(formationsTable);
    }

    // Réinitialiser les fonctionnalités après le chargement
    setTimeout(() => {
      // Réinitialiser les filtres (cela appellera aussi remplirNum)
      if (typeof filterTable === 'function') {
        filterTable('all', 'table-experiences');
        filterTable('all', 'table-formations');
      }

      // S'assurer que les numéros sont bien remplis
      if (typeof remplirNum === 'function') {
        const experiencesTable = document.getElementById('table-experiences');
        const formationsTable = document.getElementById('table-formations');
        if (experiencesTable) remplirNum(experiencesTable);
        if (formationsTable) remplirNum(formationsTable);
      }

      // Recalculer les statistiques
      if (typeof calculateAllStatistics === 'function') {
        calculateAllStatistics();
      } else {
        // Si la fonction n'est pas encore disponible, attendre un peu plus
        setTimeout(() => {
          if (typeof calculateAllStatistics === 'function') {
            calculateAllStatistics();
          }
        }, 500);
      }

      // Réinitialiser la recherche
      if (typeof setupSearch === 'function') {
        setupSearch('search-experiences', 'table-experiences');
        setupSearch('search-formations', 'table-formations');
      }

      // Réinitialiser le tri (mais seulement si les en-têtes n'ont pas déjà été configurés)
      if (typeof setupSortableTables === 'function') {
        // Réinitialiser le flag pour permettre la réinitialisation après chargement Firebase
        if (typeof sortableTablesInitialized !== 'undefined') {
          window.sortableTablesInitialized = false;
        }
        setupSortableTables();
      }

      // Mettre à jour l'UI pour gérer les liens Google Maps et les colonnes d'édition
      // Appeler updateUI() dans tous les cas (connecté ou non) pour désactiver/activer les liens
      if (typeof updateUI === 'function') {
        setTimeout(() => {
          updateUI();
        }, 100);
      }

      // Mettre à jour la visibilité des liens de la navbar après tout le chargement
      if (typeof window.updateNavbarLinksVisibility === 'function') {
        setTimeout(window.updateNavbarLinksVisibility, 300);
      }
    }, 200);
  }
}

// Charger les données au chargement de la page
// Attendre que le DOM et Firebase soient chargés
function initializeFirebaseData() {
  if (typeof firebase !== 'undefined' && window.firebaseInitialized) {
    loadDataFromFirebase();
  } else {
    console.log("Firebase SDK non chargé ou non configuré, utilisation des données statiques");
  }
}

// Charger le profil utilisateur (pour le titre et LinkedIn)
async function loadUserProfile() {
  if (!window.targetUid || !window.firebaseDb) return;

  try {
    const doc = await window.firebaseDb.collection('users').doc(window.targetUid).get();
    if (doc.exists) {
      const data = doc.data();
      const title = document.querySelector('h2');
      const linkedinLink = document.getElementById('linkedin-link');

      // Construire le nom complet
      let fullName = 'Animateur';
      if (data.firstname && data.lastname) {
        // Formater: Prénom (1ère lettre maj, reste min) NOM (tout maj)
        const formatName = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        fullName = `${formatName(data.firstname)} ${data.lastname.toUpperCase()}`;
      } else if (data.displayName) {
        fullName = data.displayName;
      } else if (data.email) {
        fullName = data.email.split('@')[0];
      }

      // Mettre à jour le titre
      if (title) {
        title.innerHTML = `Détails des expériences BAFA & BAFD de <orange>${fullName}</orange>`;
      }

      // Gérer l'icône LinkedIn et le positionnement du bouton paramètres
      const settingsBtn = document.getElementById('settings-btn');
      if (linkedinLink) {
        if (data.linkedin && data.linkedin.trim() !== '') {
          linkedinLink.href = data.linkedin;
          linkedinLink.style.display = 'block';
          // Si LinkedIn est affiché, le bouton settings reste à sa place (à côté)
          if (settingsBtn) {
            settingsBtn.style.left = '70px';
            settingsBtn.style.top = '26px'; // Garder l'alignement vertical défini
          }
        } else {
          linkedinLink.style.display = 'none';
          // Si LinkedIn est caché, le bouton settings prend sa place
          if (settingsBtn) {
            settingsBtn.style.left = '20px';
            settingsBtn.style.top = '18px'; // S'aligner comme l'icône LinkedIn
          }
        }
      }

      // Gérer l'affichage de l'email de contact
      const contactEmailParagraph = document.getElementById('contact-email-paragraph');
      const contactEmailLink = document.getElementById('contact-email-link');

      console.log('Affichage email:', { visible: data.emailVisible, email: data.email });

      if (contactEmailParagraph && contactEmailLink) {
        if (data.emailVisible && data.email) {
          contactEmailLink.href = `mailto:${data.email}`;
          contactEmailLink.textContent = data.email; // Afficher l'email explicitement
          contactEmailParagraph.style.display = 'block';
        } else {
          contactEmailParagraph.style.display = 'none';
        }
      }

      // Mettre à jour les statistiques manuelles
      if (data.stats) {
        const animators = data.stats.animators || 0;
        const directors = data.stats.directors || 0;
        const trainers = data.stats.trainers || 0;

        const parts = [];
        if (animators > 0) parts.push(`<span class="stat-value">${animators}</span> animateur${animators > 1 ? 's' : ''}`);
        if (directors > 0) parts.push(`<span class="stat-value">${directors}</span> directeur${directors > 1 ? 's' : ''}`);
        if (trainers > 0) parts.push(`<span class="stat-value">${trainers}</span> formateur${trainers > 1 ? 's' : ''}`);

        const sentenceEl = document.getElementById('stat-colleagues-sentence');
        if (sentenceEl && parts.length > 0) {
          let sentence = "J'ai travaillé avec ";
          if (parts.length === 1) {
            sentence += parts[0];
          } else if (parts.length > 0) {
            const last = parts.pop();
            sentence += parts.join(', ') + ' et ' + last;
          }
          sentenceEl.innerHTML = sentence;
          sentenceEl.style.display = 'block';
        } else if (sentenceEl) {
          sentenceEl.style.display = 'none';
        }
      }
    }
  } catch (e) {
    console.error("Erreur chargement profil", e);
  }
}

// Essayer de charger immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebaseData);
} else {
  // Le DOM est déjà chargé
  setTimeout(initializeFirebaseData, 500); // Attendre un peu pour que Firebase soit initialisé
}

