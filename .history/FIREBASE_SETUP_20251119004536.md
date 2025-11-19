# Guide de configuration Firebase pour le site BAFA/BAFD

Ce guide vous explique comment configurer Firebase pour rendre votre site dynamique tout en conservant le fonctionnement actuel.

## 📋 Prérequis

1. Un compte Google (pour accéder à Firebase)
2. Un navigateur web moderne

## 🚀 Étapes de configuration

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet" ou "Add project"
3. Entrez un nom pour votre projet (ex: "recap-bafa")
4. Suivez les étapes de création du projet
5. Activez Google Analytics si vous le souhaitez (optionnel)

### 2. Activer Firestore Database

1. Dans votre projet Firebase, allez dans "Firestore Database" dans le menu de gauche
2. Cliquez sur "Créer une base de données" ou "Create database"
3. Choisissez le mode "Production" ou "Test" (pour commencer, le mode test est plus simple)
4. Sélectionnez une région (ex: "europe-west" pour l'Europe)
5. Cliquez sur "Activer" ou "Enable"

### 3. Configurer les règles de sécurité Firestore

Pour le développement, vous pouvez utiliser ces règles (à modifier en production) :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if false; // Modifiez cette règle pour autoriser l'écriture si nécessaire
    }
  }
}
```

⚠️ **Important** : Ces règles permettent la lecture à tous. Pour la production, configurez des règles de sécurité appropriées.

### 4. Obtenir la configuration Firebase

1. Dans Firebase Console, allez dans "Paramètres du projet" (icône d'engrenage)
2. Faites défiler jusqu'à "Vos applications"
3. Cliquez sur l'icône `</>` (Web)
4. Entrez un nom pour votre application (ex: "recap-bafa-web")
5. Copiez la configuration qui ressemble à ceci :

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

### 5. Configurer le fichier firebase-config.js

1. Ouvrez le fichier `assets/js/firebase-config.js`
2. Remplacez les valeurs `VOTRE_API_KEY`, `VOTRE_AUTH_DOMAIN`, etc. par les valeurs de votre configuration Firebase

### 6. Ajouter le SDK Firebase au HTML

Le SDK Firebase doit être ajouté dans votre fichier `index.html`. Il est déjà ajouté dans la version modifiée, mais vérifiez qu'il est présent :

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"></script>
```

### 7. Créer les collections dans Firestore

Vous devez créer deux collections dans Firestore :
- `experiences` : pour stocker les expériences
- `formations` : pour stocker les formations

#### Structure d'un document "experience" :

```json
{
  "type": "colo",
  "date": "Août 2025",
  "duration": "17 jours",
  "organizer": "Temps-Jeunes (69)",
  "organizerUrl": "https://temps-jeunes.com/",
  "logoPath": "assets/img/tj.png",
  "location": "Nice (06)",
  "locationUrl": "https://maps.app.goo.gl/kaZxAM6bwsG9ydc26",
  "locations": null,
  "country": null,
  "stayType": "Pension complète",
  "position": "Directeur stagiaire",
  "ageRange": "11-13 ans",
  "youthCount": 25
}
```

**Note** : Pour les expériences avec plusieurs lieux (itinérance), utilisez :
```json
{
  "locations": [
    {"name": "Amsterdam", "url": "https://maps.app.goo.gl/..."},
    {"name": "Gouda", "url": "https://maps.app.goo.gl/..."}
  ],
  "country": "Pays-Bas"
}
```

#### Structure d'un document "formation" :

```json
{
  "type": "bafd",
  "date": "Avril 2025",
  "duration": "8 jours",
  "organism": "UFCV (93)",
  "organismUrl": "https://bafa.ufcv.fr/",
  "logoPath": "assets/img/ufcv.png",
  "title": "Formation générale BAFD",
  "location": "Lyon Tassin (69)",
  "locationUrl": "https://maps.app.goo.gl/Eb5waDZYek1VebnQ9"
}
```

### 8. Importer les données existantes

Vous pouvez importer vos données de deux façons :

#### Option A : Via l'interface Firebase Console

1. Allez dans Firestore Database
2. Cliquez sur "Démarrer la collection" ou "Start collection"
3. Nommez la collection `experiences`
4. Ajoutez chaque expérience comme un document (ID automatique ou personnalisé)
5. Répétez pour la collection `formations`

#### Option B : Via un script d'import (recommandé)

Un script d'import sera créé pour faciliter la migration des données existantes.

## 🔄 Fonctionnement

### Mode avec Firebase

Si Firebase est correctement configuré :
- Les données sont chargées depuis Firestore
- Les modifications dans Firebase sont immédiatement visibles (après rechargement)
- Le site fonctionne normalement avec toutes les fonctionnalités

### Mode sans Firebase (fallback)

Si Firebase n'est pas configuré ou en cas d'erreur :
- Le site utilise les données statiques du HTML
- Toutes les fonctionnalités continuent de fonctionner
- Aucune erreur n'est affichée à l'utilisateur

## 📝 Types de données

### Types d'expériences :
- `colo` : Colonie de vacances
- `alsh` : Centre de loisir
- `autre` : Autre type

### Types de formations :
- `bafa` : Formation BAFA
- `bafd` : Formation BAFD

## 🔒 Sécurité

⚠️ **Important pour la production** :

1. Configurez des règles Firestore appropriées
2. Ne partagez pas votre clé API publiquement
3. Utilisez Firebase Authentication si vous voulez restreindre l'accès
4. Activez la validation des données côté serveur

## 🆘 Dépannage

### Les données ne se chargent pas

1. Vérifiez que Firebase est correctement configuré dans `firebase-config.js`
2. Vérifiez la console du navigateur pour les erreurs
3. Vérifiez que les collections existent dans Firestore
4. Vérifiez les règles de sécurité Firestore

### Erreur "Firebase is not defined"

1. Vérifiez que les scripts Firebase sont chargés dans le HTML
2. Vérifiez l'ordre de chargement des scripts

### Le site affiche les données statiques

C'est normal ! Le site utilise un système de fallback. Si Firebase n'est pas configuré, il utilise les données du HTML.

## 📚 Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)

