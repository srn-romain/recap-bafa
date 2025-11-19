// Configuration Firebase
// Remplacez ces valeurs par celles de votre projet Firebase
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_AUTH_DOMAIN",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_STORAGE_BUCKET",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

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

