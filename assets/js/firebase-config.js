// Configuration Firebase
// Remplacez ces valeurs par celles de votre projet Firebase
const firebaseConfig = {
    apiKey: "AIzaSyB2Q1hELyD44pz4A5lQtt2Lep-pjRzcIBM",
    authDomain: "macollectiondebafa.firebaseapp.com",
    projectId: "macollectiondebafa",
    storageBucket: "macollectiondebafa.firebasestorage.app",
    messagingSenderId: "821501918782",
    appId: "1:821501918782:web:d630280c4b9c9fb92f1b6f"
  };

// Rendre la configuration accessible globalement
window.firebaseConfig = firebaseConfig;

// Initialiser Firebase uniquement si la configuration est valide
// Variables globales pour être accessibles depuis d'autres scripts
window.firebaseInitialized = false;
window.firebaseDb = null;

if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "VOTRE_API_KEY") {
  try {
    // Vérifier que Firebase est chargé
    if (typeof firebase !== 'undefined') {
      // Initialiser Firebase
      firebase.initializeApp(firebaseConfig);
      window.firebaseDb = firebase.firestore();
      window.firebaseInitialized = true;
      console.log("Firebase initialisé avec succès");
    } else {
      console.log("Firebase SDK non chargé");
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation de Firebase:", error);
  }
} else {
  console.log("Firebase non configuré - utilisation des données statiques");
}

