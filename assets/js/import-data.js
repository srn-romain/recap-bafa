/**
 * Script d'import des données vers Firebase
 * 
 * Ce script peut être utilisé pour :
 * 1. Extraire les données du HTML actuel
 * 2. Les formater pour Firebase
 * 3. Les importer dans Firestore (nécessite une configuration Firebase valide)
 * 
 * UTILISATION :
 * 1. Ouvrez la console du navigateur (F12)
 * 2. Exécutez : extractDataFromHTML() pour extraire les données
 * 3. Copiez le résultat JSON
 * 4. Utilisez importToFirebase(data) pour importer (si Firebase est configuré)
 */

/**
 * Extraire les expériences du HTML
 */
function extractExperiencesFromHTML() {
  const table = document.getElementById('table-experiences');
  if (!table) {
    console.error("Tableau des expériences non trouvé");
    return [];
  }

  const rows = table.querySelectorAll('tr[data-type]');
  const experiences = [];

  rows.forEach(row => {
    if (row.classList.contains('always-visible')) return; // Ignorer l'en-tête

    const cells = row.cells;
    if (cells.length < 10) return;

    const type = row.getAttribute('data-type') || 'colo';
    const date = cells[1]?.textContent?.trim() || '';
    const duration = cells[2]?.textContent?.trim() || '';

    // Organisateur
    const organizerLink = cells[3]?.querySelector('a');
    const organizer = organizerLink?.textContent?.trim() || '';
    const organizerUrl = organizerLink?.href || '#';

    // Logo
    const logoImg = cells[4]?.querySelector('img');
    const logoPath = logoImg?.src || '';

    // Lieu (peut être multiple)
    const locationCell = cells[5];
    const locationLinks = locationCell?.querySelectorAll('a') || [];
    let location = '';
    let locationUrl = '#';
    let locations = null;
    let country = null;

    if (locationLinks.length > 1) {
      // Itinérance - plusieurs lieux
      locations = [];
      locationLinks.forEach(link => {
        locations.push({
          name: link.textContent.trim(),
          url: link.href
        });
      });
      // Extraire le pays depuis le texte
      const locationText = locationCell.textContent;
      const countryMatch = locationText.match(/\(([^)]+)\)/);
      if (countryMatch) {
        country = countryMatch[1];
      }
    } else if (locationLinks.length === 1) {
      location = locationLinks[0].textContent.trim();
      locationUrl = locationLinks[0].href;
    }

    const stayType = cells[6]?.textContent?.trim() || '';
    const position = cells[7]?.textContent?.trim() || '';
    const ageRange = cells[8]?.textContent?.trim() || '';
    const youthCount = parseInt(cells[9]?.textContent?.trim() || '0', 10);

    const experience = {
      type: type.split(' ')[0], // Prendre le premier type
      date: date,
      duration: duration,
      organizer: organizer,
      organizerUrl: organizerUrl,
      logoPath: logoPath.replace(window.location.origin, '').replace(window.location.pathname.replace('index.html', ''), ''),
      stayType: stayType,
      position: position,
      ageRange: ageRange,
      youthCount: youthCount
    };

    if (locations) {
      experience.locations = locations;
      experience.country = country;
    } else {
      experience.location = location;
      experience.locationUrl = locationUrl;
    }

    experiences.push(experience);
  });

  return experiences;
}

/**
 * Extraire les formations du HTML
 */
function extractFormationsFromHTML() {
  const table = document.getElementById('table-formations');
  if (!table) {
    console.error("Tableau des formations non trouvé");
    return [];
  }

  const rows = table.querySelectorAll('tr[data-type]');
  const formations = [];

  rows.forEach(row => {
    if (row.classList.contains('always-visible')) return; // Ignorer l'en-tête

    const cells = row.cells;
    if (cells.length < 7) return;

    const type = row.getAttribute('data-type') || 'bafa';
    const date = cells[1]?.textContent?.trim() || '';
    const duration = cells[2]?.textContent?.trim() || '';

    // Organisme
    const organismLink = cells[3]?.querySelector('a');
    const organism = organismLink?.textContent?.trim() || '';
    const organismUrl = organismLink?.href || '#';

    // Logo
    const logoImg = cells[4]?.querySelector('img');
    const logoPath = logoImg?.src || '';

    const title = cells[5]?.textContent?.trim() || '';

    // Lieu
    const locationLink = cells[6]?.querySelector('a');
    const location = locationLink?.textContent?.trim() || '';
    const locationUrl = locationLink?.href || '#';

    const formation = {
      type: type.split(' ')[0], // Prendre le premier type
      date: date,
      duration: duration,
      organism: organism,
      organismUrl: organismUrl,
      logoPath: logoPath.replace(window.location.origin, '').replace(window.location.pathname.replace('index.html', ''), ''),
      title: title,
      location: location,
      locationUrl: locationUrl
    };

    formations.push(formation);
  });

  return formations;
}

/**
 * Extraire toutes les données du HTML
 */
function extractDataFromHTML() {
  const experiences = extractExperiencesFromHTML();
  const formations = extractFormationsFromHTML();

  const data = {
    experiences: experiences,
    formations: formations
  };

  console.log("Données extraites :");
  console.log(JSON.stringify(data, null, 2));

  // Copier dans le presse-papier si possible
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
      .then(() => console.log("✅ Données copiées dans le presse-papier"))
      .catch(err => console.error("Erreur lors de la copie:", err));
  }

  return data;
}

/**
 * Importer les expériences dans Firebase
 */
async function importExperiencesToFirebase(experiences) {
  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.error("Firebase n'est pas initialisé");
    return false;
  }

  try {
    const batch = window.firebaseDb.batch();
    const experiencesRef = window.firebaseDb.collection('experiences');

    experiences.forEach((experience, index) => {
      const docRef = experiencesRef.doc();
      batch.set(docRef, experience);
    });

    await batch.commit();
    console.log(`✅ ${experiences.length} expériences importées avec succès`);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'import des expériences:", error);
    return false;
  }
}

/**
 * Importer les formations dans Firebase
 */
async function importFormationsToFirebase(formations) {
  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.error("Firebase n'est pas initialisé");
    return false;
  }

  try {
    const batch = window.firebaseDb.batch();
    const formationsRef = window.firebaseDb.collection('formations');

    formations.forEach((formation, index) => {
      const docRef = formationsRef.doc();
      batch.set(docRef, formation);
    });

    await batch.commit();
    console.log(`✅ ${formations.length} formations importées avec succès`);
    return true;
  } catch (error) {
    console.error("Erreur lors de l'import des formations:", error);
    return false;
  }
}

/**
 * Importer toutes les données dans Firebase
 */
async function importToFirebase(data) {
  if (!data) {
    console.error("Aucune donnée à importer");
    return false;
  }

  const experiencesImported = await importExperiencesToFirebase(data.experiences || []);
  const formationsImported = await importFormationsToFirebase(data.formations || []);

  if (experiencesImported && formationsImported) {
    console.log("✅ Toutes les données ont été importées avec succès");
    console.log("🔄 Rechargez la page pour voir les données depuis Firebase");
    return true;
  }

  return false;
}

/**
 * Fonction helper pour importer directement depuis le HTML
 */
async function importFromHTMLToFirebase() {
  // Vérifier et initialiser Firebase si nécessaire
  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.log("🔄 Tentative d'initialisation de Firebase...");

    // Vérifier si Firebase SDK est chargé
    if (typeof firebase === 'undefined') {
      console.error("❌ Firebase SDK n'est pas chargé. Vérifiez que les scripts Firebase sont présents dans le HTML.");
      return false;
    }

    // Vérifier si la configuration existe
    const config = window.firebaseConfig || (typeof firebaseConfig !== 'undefined' ? firebaseConfig : null);
    if (!config) {
      console.error("❌ Configuration Firebase non trouvée. Vérifiez firebase-config.js");
      return false;
    }

    try {
      // Initialiser Firebase
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      window.firebaseDb = firebase.firestore();
      window.firebaseInitialized = true;
      console.log("✅ Firebase initialisé avec succès");
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation de Firebase:", error);
      return false;
    }
  }

  console.log("📥 Extraction des données du HTML...");
  const data = extractDataFromHTML();

  console.log("📤 Import vers Firebase...");
  const success = await importToFirebase(data);

  if (success) {
    console.log("✅ Import terminé ! Rechargez la page.");
  } else {
    console.log("❌ Erreur lors de l'import. Vérifiez la configuration Firebase.");
  }

  return success;
}

// Exporter les fonctions pour utilisation dans la console
window.extractDataFromHTML = extractDataFromHTML;
window.importToFirebase = importToFirebase;
window.importFromHTMLToFirebase = importFromHTMLToFirebase;

