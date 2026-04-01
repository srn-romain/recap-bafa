// Script pour charger les données depuis Firebase
// Avec fallback vers les données statiques du HTML

/**
 * Structure des données d'expérience
 */

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
  { m: 'Respons Scout', f: 'Respons Scout' },
  { m: 'Chef Scout', f: 'Cheffe Scout' },
  { m: 'Autre (préciser)', f: 'Autre (préciser)' }
];

/**
 * Détermine si un badge doit être affiché pour une expérience ou formation
 */
function getStatusBadge(item) {
  const dateStr = item.date;
  const durationStr = item.duration;
  const type = item.type;

  // Ne gère pas le cas du periscolaire, tous les samedis et tous les mercredis
  const isPeriodic = (type === 'alsh' || type === 'scout' || type === 'periscolaire') &&
    typeof durationStr === 'string' &&
    (durationStr.includes('mercredis') || durationStr.includes('samedis') || durationStr.includes('périscolaire'));

  if (isPeriodic || type === 'periscolaire') {
    return null;
  }

  const parseFn = typeof parseFrenchDate === 'function' ? parseFrenchDate : (d) => new Date(d);
  const extractFn = typeof extractDays === 'function' ? extractDays : (t) => 0;

  const startDate = parseFn(dateStr);
  const now = new Date();

  // Durée en jours
  const days = extractFn(durationStr);

  // Calculer la date de fin
  const endDate = new Date(startDate);
  if (days > 1) {
    endDate.setDate(endDate.getDate() + days - 1);
  } else if (days === 0) {
    // Si pas de durée, on considère par défaut que ça dure le mois entier pour le badge "en cours"
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Dernier jour du mois
  }

  // Nouveau : 5 jours après la date de fin
  const newUntilDate = new Date(endDate);
  newUntilDate.setDate(newUntilDate.getDate() + 5);

  // Futur
  if (startDate > now) {
    const span = document.createElement('span');
    span.className = 'badge-status badge-futur';
    span.textContent = 'À venir';
    return span;
  }

  // En cours
  if (now >= startDate && now <= endDate) {
    const span = document.createElement('span');
    span.className = 'badge-status badge-ongoing';
    span.textContent = days > 0 ? `En cours (${durationStr})` : 'En cours';
    return span;
  }

  // Nouveau
  if (now > endDate && now <= newUntilDate) {
    const span = document.createElement('span');
    span.className = 'badge-status badge-new';
    span.textContent = 'Nouveau';
    return span;
  }

  return null;
}



/**
 * Formate une date d'expérience pour l'affichage dans le tableau principal.
 * - "15 Juillet 2024"                        → "15 Juillet 2024"
 * - "15 Juillet 2024 - 31 Juillet 2024"      → "du 15 au 31 Juillet 2024"
 * - "15 Juillet 2024 - 3 Août 2024"          → "du 15 juil. au 3 août 2024"
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return dateStr;

  const MONTH_ABBR = {
    'janvier': 'janv.', 'février': 'févr.', 'mars': 'mars',
    'avril': 'avr.', 'mai': 'mai', 'juin': 'juin',
    'juillet': 'juil.', 'août': 'août', 'septembre': 'sept.',
    'octobre': 'oct.', 'novembre': 'nov.', 'décembre': 'déc.'
  };

  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

  // Essayer de parser "Jour Mois Année - Jour Mois Année"
  const rangeMatch = dateStr.match(
    /^(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})\s*[-–]\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})$/
  );

  if (rangeMatch) {
    const [, d1, m1Raw, y1, d2, m2Raw, y2] = rangeMatch;
    const m1 = m1Raw.toLowerCase();
    const m2 = m2Raw.toLowerCase();

    if (m1 === m2 && y1 === y2) {
      // Même mois, même année → "Du 15 au 31 Juillet 2024"
      return `Du ${parseInt(d1)} au ${parseInt(d2)} ${capitalize(m1Raw)} ${y1}`;
    } else {
      // Mois ou années différents → abréviations
      const abbr1 = MONTH_ABBR[m1] || m1Raw;
      const abbr2 = MONTH_ABBR[m2] || m2Raw;
      const yearSuffix = y1 === y2 ? y1 : `${y1}-${y2}`;
      return `Du ${parseInt(d1)} ${abbr1} au ${parseInt(d2)} ${abbr2} ${yearSuffix}`;
    }
  }

  // Fallback : retourner tel quel (ex: "Juillet 2024", "Septembre 2023 - Juin 2024")
  return dateStr;
}

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
  // Vérification pour format spécifique ALSH/Scout/Périscolaire "Tous les mercredis/samedis/Une année périscolaire"
  // On veut afficher seulement "AAAA-AAAA" mais garder le tri correct
  const isPeriodic = (experience.type === 'alsh' || experience.type === 'scout' || experience.type === 'periscolaire') &&
    typeof experience.duration === 'string' &&
    (experience.duration.includes('mercredis') || experience.duration.includes('samedis') || experience.duration.includes('périscolaire'));

  if (isPeriodic) {
    const periodMatch = experience.date.match(/septembre\s+(\d{4})\s*-\s*juin\s+(\d{4})/i);
    if (periodMatch) {
      // Astuce : on inclut la date complète en masqué pour que le tri fonctionne toujours sur "Septembre..."
      // et on affiche visuellement la période "AAAA-AAAA"
      tdDate.innerHTML = `<span style="display:none;">${experience.date}</span>${periodMatch[1]}-${periodMatch[2]}`;
    } else {
      tdDate.textContent = experience.date;
    }
  } else {
    tdDate.textContent = formatDateForDisplay(experience.date);
  }

  // Ajouter le badge de statut
  const badge = getStatusBadge(experience);
  if (badge) {
    tdDate.appendChild(badge);
  }

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
  // Stocker l'objet complet pour une récupération facile lors de l'édition
  tr.dataset.formation = JSON.stringify(formation);
  tr.classList.add('formation-row');

  // Colonne N°
  const tdNum = document.createElement('td');
  tdNum.className = 'num';
  tr.appendChild(tdNum);

  // Colonne Date
  const tdDate = document.createElement('td');
  tdDate.textContent = formation.date;

  // Ajouter le badge de statut
  const badge = getStatusBadge(formation);
  if (badge) {
    tdDate.appendChild(badge);
  }

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
  logoImg.loading = 'lazy';
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
        const rows = table.querySelectorAll('tr[data-type], tr.no-data-row');
        rows.forEach(row => {
          if (!row.classList.contains('always-visible')) row.remove();
        });
        // Ajouter le message "Aucune donnée"
        const tbody = table.querySelector('tbody') || table;
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'no-data-row';
        emptyRow.innerHTML = '<td colspan="10" style="text-align: center; padding: 20px; font-style: italic; color: #7f8c8d;">Aucune donnée à afficher</td>';
        tbody.appendChild(emptyRow);
      }
      return true; // Retourner true pour dire que le chargement est "fini" même si vide
    }

    if (!table) return false;

    // Supprimer toutes les lignes sauf l'en-tête
    const rows = table.querySelectorAll('tr[data-type], tr.no-data-row');
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
      // Extraire le jour s'il est au début (ex: "5 Juillet 2024")
      const dayMatch = dateStr.match(/^(\d{1,2})/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
      return new Date(year, month, day);
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

      // Vérifier si une expérience concerne le BAFD pour le titre
      const pos = (experience.position || '').toLowerCase();
      if (pos.includes('dir-') || pos.includes('directeur') || pos.includes('bafd')) {
        window.userHasBafd = true;
      }
    });

    // Mettre à jour le titre si nécessaire
    if (window.userHasBafd && typeof updateDashboardTitle === 'function') {
      updateDashboardTitle();
    }

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
        const rows = table.querySelectorAll('tr[data-type], tr.no-data-row');
        rows.forEach(row => {
          if (!row.classList.contains('always-visible')) row.remove();
        });
        // Ajouter le message "Aucune donnée"
        const tbody = table.querySelector('tbody') || table;
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'no-data-row';
        emptyRow.innerHTML = '<td colspan="8" style="text-align: center; padding: 20px; font-style: italic; color: #7f8c8d;">Aucune donnée à afficher</td>';
        tbody.appendChild(emptyRow);
      }
      return true; // Retourner true pour dire que le chargement est "fini" même si vide
    }

    if (!table) return false;

    // Supprimer toutes les lignes sauf l'en-tête
    const rows = table.querySelectorAll('tr[data-type], tr.no-data-row');
    rows.forEach(row => {
      if (!row.classList.contains('always-visible')) {
        row.remove();
      }
    });

    // Ajouter les formations depuis Firebase
    const formations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const formation = {
        type: data.type || 'bafa',
        date: data.date || '',
        duration: data.duration || '',
        organism: data.organism || '',
        organismUrl: (data.organismUrl && data.organismUrl !== '#') ? data.organismUrl : '',
        logoPath: data.logoPath || '',
        title: data.title || '',
        location: data.location || '',
        locationUrl: (data.locationUrl && data.locationUrl !== '#') ? data.locationUrl : ''
      };
      formations.push(formation);

      // Vérifier si une formation concerne le BAFD pour le titre
      if (formation.type.toLowerCase() === 'bafd' || formation.title.toLowerCase().includes('bafd')) {
        window.userHasBafd = true;
      }
    });

    // Mettre à jour le titre si nécessaire
    if (window.userHasBafd && typeof updateDashboardTitle === 'function') {
      updateDashboardTitle();
    }

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
      // Extraire le jour s'il est au début (ex: "5 Juillet 2024")
      const dayMatch = dateStr.match(/^(\d{1,2})/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
      return new Date(year, month, day);
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
  // Réinitialiser les drapeaux pour le titre
  window.userHasBafd = false;

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

  // 1. Charger les infos du profil et vérifier la confidentialité
  let accessGranted = true;
  if (window.targetUid) {
    accessGranted = await loadUserProfile();
  }

  if (!accessGranted) {
    // Cacher les spinners si accès refusé
    if (loadingExperiences) loadingExperiences.classList.add('hidden');
    if (loadingFormations) loadingFormations.classList.add('hidden');
    return;
  }

  // 2. Charger les données si accès autorisé
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

/**
 * Met à jour le titre du tableau de bord avec ou sans mention BAFD
 */
function updateDashboardTitle() {
  const title = document.getElementById('main-dashboard-title');
  if (!title || !window.currentUserFullName) return;

  const bafdText = window.userHasBafd ? ' & BAFD' : '';
  title.innerHTML = `Détails des expériences BAFA${bafdText} de <orange>${window.currentUserFullName}</orange>`;
}

// Charger le profil utilisateur (pour le titre et LinkedIn)
async function loadUserProfile() {
  if (!window.targetUid || !window.firebaseDb) return true;

  try {
    const doc = await window.firebaseDb.collection('users').doc(window.targetUid).get();
    if (doc.exists) {
      const data = doc.data();
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
      window.currentUserFullName = fullName;

      // Mettre à jour le titre initialement (uniquement BAFA par défaut)
      window.userHasBafd = false;
      updateDashboardTitle();

      // Gestion de la confidentialité (Compte privé)
      const isOwner = window.currentUser && window.currentUser.uid === window.targetUid;
      const ownerNotice = document.getElementById('privacy-notice-owner');
      const visitorNotice = document.getElementById('privacy-notice-visitor');
      const introSection = document.getElementById('intro-section');
      const tableExperiences = document.getElementById('table-experiences');
      const tableFormations = document.getElementById('table-formations');
      const statsSection = document.getElementById('statistiques');
      const footer = document.getElementById('footer');
      const dashboardTitle = document.getElementById('main-dashboard-title');

      // Reset notices
      if (ownerNotice) ownerNotice.style.display = 'none';
      if (visitorNotice) visitorNotice.style.display = 'none';

      if (data.isPrivate === true) {
        if (isOwner) {
          // Propriétaire : Afficher la page normally + bandeau jaune
          if (ownerNotice) ownerNotice.style.display = 'block';
        } else {
          // Visiteur non autorisé : Masquer tout et afficher le message d'erreur
          if (visitorNotice) visitorNotice.style.display = 'block';

          // Masquer les sections de contenu
          const experiencesHeader = document.getElementById('experiences');
          const formationsHeader = document.getElementById('formations');
          const sectionsToHide = [
            introSection, tableExperiences, tableFormations, statsSection,
            dashboardTitle, footer, experiencesHeader, formationsHeader
          ];

          // Masquer tous les conteneurs de recherche
          document.querySelectorAll('.search-container').forEach(el => el.style.setProperty('display', 'none', 'important'));

          sectionsToHide.forEach(el => {
            if (el) {
              el.style.setProperty('display', 'none', 'important');

              // Masquer aussi les conteneurs de type .tabs qui suivent ou précèdent
              if (el.id === 'table-experiences' || el.id === 'table-formations' || el.id === 'statistiques') {
                let parent = el.parentElement;
                while (parent && !parent.classList.contains('tabs')) {
                  parent = parent.parentElement;
                }
                if (parent) parent.style.setProperty('display', 'none', 'important');

                // Masquer aussi les onglets de filtres au-dessus et les éléments adjacents
                let prev = (parent || el).previousElementSibling;
                while (prev && (prev.classList.contains('tabs') || prev.classList.contains('search-container') || prev.tagName === 'H1' || prev.tagName === 'BR')) {
                  prev.style.setProperty('display', 'none', 'important');
                  prev = prev.previousElementSibling;
                }
                // Pour le titre statistique, masquer aussi l'élément suivant (la grille de stats)
                if (el.id === 'statistiques') {
                  let next = el.nextElementSibling;
                  while (next && (next.classList.contains('tabs') || next.tagName === 'BR')) {
                    next.style.setProperty('display', 'none', 'important');
                    next = next.nextElementSibling;
                  }
                }
              }
            }
          });

          // Masquer la navbar (sauf home et auth)
          const navItems = document.querySelectorAll('.nav-toc-link');
          navItems.forEach(item => item.style.setProperty('display', 'none', 'important'));

          console.log("Accès refusé : Profil privé");
          return false; // Accès refusé
        }
      }

      // Si accès public OU autorisé (propriétaire d'un compte privé)
      if (data.isPrivate !== true || isOwner) {
        // Accès public ou autorisé : S'assurer que les sections sont visibles
        const experiencesHeader = document.getElementById('experiences');
        const formationsHeader = document.getElementById('formations');
        const sectionsToShow = [
          introSection, tableExperiences, tableFormations, statsSection,
          dashboardTitle, footer, experiencesHeader, formationsHeader
        ];

        sectionsToShow.forEach(el => {
          if (el) el.style.setProperty('display', '', ''); // Reset display
        });
        document.querySelectorAll('.search-container').forEach(el => el.style.setProperty('display', '', ''));
        document.querySelectorAll('.nav-toc-link').forEach(item => item.style.setProperty('display', '', ''));
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
    return true; // Accès autorisé
  } catch (e) {
    console.error("Erreur chargement profil", e);
    return true; // Fallback par défaut si erreur (ou false si on veut être strict)
  }
}

// Essayer de charger immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebaseData);
} else {
  // Le DOM est déjà chargé
  setTimeout(initializeFirebaseData, 500); // Attendre un peu pour que Firebase soit initialisé
}

