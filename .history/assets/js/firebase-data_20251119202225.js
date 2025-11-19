// Script pour charger les données depuis Firebase
// Avec fallback vers les données statiques du HTML

/**
 * Structure des données d'expérience
 */
function createExperienceRow(experience) {
  const tr = document.createElement('tr');
  tr.setAttribute('data-type', experience.type);
  
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
    experience.locations.forEach((loc, index) => {
      const locLink = document.createElement('a');
      locLink.href = loc.url;
      locLink.target = '_blank';
      locLink.textContent = loc.name;
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
    locLink.href = experience.locationUrl;
    locLink.target = '_blank';
    locLink.textContent = experience.location;
    tdLocation.appendChild(locLink);
  }
  tr.appendChild(tdLocation);
  
  // Colonne Type de séjour
  const tdStayType = document.createElement('td');
  tdStayType.textContent = experience.stayType;
  tr.appendChild(tdStayType);
  
  // Colonne Intitulé du poste
  const tdPosition = document.createElement('td');
  tdPosition.textContent = experience.position;
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
  locLink.href = formation.locationUrl;
  locLink.target = '_blank';
  locLink.textContent = formation.location;
  tdLocation.appendChild(locLink);
  tr.appendChild(tdLocation);
  
  return tr;
}

/**
 * Charger les expériences depuis Firebase
 */
async function loadExperiencesFromFirebase() {
  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.log("Firebase non disponible, utilisation des données statiques");
    return false;
  }
  
  try {
    const experiencesRef = window.firebaseDb.collection('experiences');
    // Récupérer toutes les expériences (le tri sera fait côté client)
    const snapshot = await experiencesRef.get();
    
    if (snapshot.empty) {
      console.log("Aucune expérience trouvée dans Firebase");
      return false;
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
        type: data.type || 'colo',
        date: data.date || '',
        duration: data.duration || '',
        organizer: data.organizer || '',
        organizerUrl: data.organizerUrl || '#',
        logoPath: data.logoPath || '',
        location: data.location || '',
        locationUrl: data.locationUrl || '#',
        locations: data.locations || null,
        country: data.country || null,
        stayType: data.stayType || '',
        position: data.position || '',
        ageRange: data.ageRange || '',
        youthCount: data.youthCount || 0
      });
    });
    
    // Trier par date (tri côté client car les dates sont des chaînes)
    // Utiliser la fonction parseFrenchDate de main.js si disponible, sinon créer une version locale
    const parseDate = typeof parseFrenchDate === 'function' ? parseFrenchDate : function(dateStr) {
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
    
    console.log("Expériences chargées depuis Firebase");
    return true;
  } catch (error) {
    console.error("Erreur lors du chargement des expériences:", error);
    return false;
  }
}

/**
 * Charger les formations depuis Firebase
 */
async function loadFormationsFromFirebase() {
  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.log("Firebase non disponible, utilisation des données statiques");
    return false;
  }
  
  try {
    const formationsRef = window.firebaseDb.collection('formations');
    // Récupérer toutes les formations (le tri sera fait côté client)
    const snapshot = await formationsRef.get();
    
    if (snapshot.empty) {
      console.log("Aucune formation trouvée dans Firebase");
      return false;
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
    const parseDate = typeof parseFrenchDate === 'function' ? parseFrenchDate : function(dateStr) {
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
    
    console.log("Formations chargées depuis Firebase");
    return true;
  } catch (error) {
    console.error("Erreur lors du chargement des formations:", error);
    return false;
  }
}

/**
 * Charger toutes les données depuis Firebase
 */
async function loadDataFromFirebase() {
  const experiencesLoaded = await loadExperiencesFromFirebase();
  const formationsLoaded = await loadFormationsFromFirebase();
  
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
      
      // Réinitialiser le tri
      if (typeof setupSortableTables === 'function') {
        setupSortableTables();
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

// Essayer de charger immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebaseData);
} else {
  // Le DOM est déjà chargé
  setTimeout(initializeFirebaseData, 500); // Attendre un peu pour que Firebase soit initialisé
}

