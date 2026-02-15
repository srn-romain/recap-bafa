// Gestion des paramètres utilisateur
const SETTINGS_FEEDBACK_ID = 'settings-feedback';

/**
 * Affiche un message de feedback dans la modale
 * @param {string} type 'success' ou 'error'
 * @param {string} message Le message à afficher
 */
function showSettingsFeedback(type, message) {
    const feedbackEl = document.getElementById(SETTINGS_FEEDBACK_ID);
    if (!feedbackEl) return;

    feedbackEl.textContent = message;
    feedbackEl.className = `feedback-message ${type}`;
    feedbackEl.style.display = 'block';

    // Auto-hide après quelques secondes si c'est un succès
    if (type === 'success') {
        setTimeout(() => {
            feedbackEl.style.display = 'none';
        }, 3000);
    }
}

/**
 * Toggle l'affichage de la bulle explicative du genre
 */
function toggleGenderExplanation(event) {
    event.preventDefault();
    const bubble = document.getElementById('gender-explanation-bubble');

    if (bubble) {
        if (bubble.style.display === 'none' || !bubble.style.display) {
            bubble.style.display = 'block';
        } else {
            bubble.style.display = 'none';
        }
    }
}

/**
 * Toggle l'affichage de la bulle explicative LinkedIn
 */
function toggleLinkedinExplanation(event) {
    event.preventDefault();
    const bubble = document.getElementById('linkedin-explanation-bubble');

    if (bubble) {
        if (bubble.style.display === 'none' || !bubble.style.display) {
            bubble.style.display = 'block';
        } else {
            bubble.style.display = 'none';
        }
    }
}

// Variables pour l'image de fond
let backgroundImageData = null;
const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Gère l'upload de l'image de fond
 */
document.addEventListener('DOMContentLoaded', function () {
    const backgroundInput = document.getElementById('settings-background-image');
    if (backgroundInput) {
        backgroundInput.addEventListener('change', handleBackgroundImageUpload);
    }
});

/**
 * Traite l'image de fond sélectionnée
 */
function handleBackgroundImageUpload(event) {
    const file = event.target.files[0];
    const errorEl = document.getElementById('background-image-error');
    const previewContainer = document.getElementById('background-preview');
    const previewImg = document.getElementById('preview-background-img');

    // Réinitialiser les erreurs
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }

    if (!file) return;

    // Vérifier la taille du fichier
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        if (errorEl) {
            errorEl.textContent = `⚠️ L'image est trop lourde (${(file.size / 1024 / 1024).toFixed(2)} Mo). Taille maximale : ${MAX_IMAGE_SIZE_MB} Mo.`;
            errorEl.style.display = 'block';
        }
        event.target.value = ''; // Réinitialiser l'input
        backgroundImageData = null;
        if (previewContainer) previewContainer.style.display = 'none';
        return;
    }

    // Lire et afficher l'image
    const reader = new FileReader();
    reader.onload = function (e) {
        backgroundImageData = e.target.result;

        if (previewImg) {
            previewImg.src = backgroundImageData;
        }
        if (previewContainer) {
            previewContainer.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Supprime l'image de fond
 */
function removeBackgroundImage() {
    backgroundImageData = null;
    const input = document.getElementById('settings-background-image');
    const previewContainer = document.getElementById('background-preview');
    const errorEl = document.getElementById('background-image-error');

    if (input) input.value = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (errorEl) {
        errorEl.style.display = 'none';
        errorEl.textContent = '';
    }
}

// État initial pour détection de changements
let settingsInitialState = null;

/**
 * Récupère l'état actuel des champs du formulaire
 */
function getSettingsState() {
    return {
        firstname: document.getElementById('settings-firstname')?.value.trim() || '',
        lastname: document.getElementById('settings-lastname')?.value.trim() || '',
        gender: document.getElementById('settings-gender')?.value || '',
        linkedin: document.getElementById('settings-linkedin')?.value.trim() || '',
        publiclyVisible: document.getElementById('settings-public-visibility')?.checked || false,
        emailVisible: document.getElementById('settings-email-visibility')?.checked || false,
        animators: document.getElementById('settings-animators-count')?.value || '',
        directors: document.getElementById('settings-directors-count')?.value || '',
        trainers: document.getElementById('settings-trainers-count')?.value || ''
    };
}

/**
 * Vérifie s'il y a des changements non enregistrés
 */
function hasUnsavedChanges() {
    if (!settingsInitialState) return false;
    const currentState = getSettingsState();
    return JSON.stringify(currentState) !== JSON.stringify(settingsInitialState);
}

/**
 * Ouvre la modale de paramètres et pré-remplit les champs
 */
async function openSettingsModal() {
    if (!window.currentUser || !window.targetUid || window.currentUser.uid !== window.targetUid) {
        return; // Sécurité côté client
    }

    const modal = document.getElementById('settings-modal');
    // Reset feedback
    const feedbackEl = document.getElementById(SETTINGS_FEEDBACK_ID);
    if (feedbackEl) feedbackEl.style.display = 'none';

    // Charger les données actuelles
    try {
        const doc = await window.firebaseDb.collection('users').doc(window.currentUser.uid).get();
        if (doc.exists) {
            const data = doc.data();
            const firstnameInput = document.getElementById('settings-firstname');
            const lastnameInput = document.getElementById('settings-lastname');
            const genderInput = document.getElementById('settings-gender');
            const linkedinInput = document.getElementById('settings-linkedin');
            const visibilityInput = document.getElementById('settings-public-visibility');

            if (firstnameInput) firstnameInput.value = data.firstname || '';
            if (lastnameInput) lastnameInput.value = data.lastname || '';
            if (genderInput) genderInput.value = data.gender || '';
            if (linkedinInput) linkedinInput.value = data.linkedin || '';
            if (visibilityInput) visibilityInput.checked = data.publiclyVisible !== false; // Par défaut true

            // Charger la visibilité de l'email
            const emailVisibilityInput = document.getElementById('settings-email-visibility');
            if (emailVisibilityInput) {
                emailVisibilityInput.checked = data.emailVisible === true; // Par défaut false
            }

            // Charger les stats manuelles
            const animatorsInput = document.getElementById('settings-animators-count');
            const directorsInput = document.getElementById('settings-directors-count');
            const trainersInput = document.getElementById('settings-trainers-count');

            if (data.stats) {
                if (animatorsInput) animatorsInput.value = data.stats.animators !== undefined ? data.stats.animators : '';
                if (directorsInput) directorsInput.value = data.stats.directors !== undefined ? data.stats.directors : '';
                if (trainersInput) trainersInput.value = data.stats.trainers !== undefined ? data.stats.trainers : '';
            } else {
                // Pas de stats, vider les champs
                if (animatorsInput) animatorsInput.value = '';
                if (directorsInput) directorsInput.value = '';
                if (trainersInput) trainersInput.value = '';
            }

            // Sauvegarder l'état initial
            settingsInitialState = getSettingsState();

            // Remplir le lien de partage caché
            const shareLinkInput = document.getElementById('share-profile-link');
            if (shareLinkInput) {
                const currentUrl = new URL(window.location.href);
                // On s'assure d'avoir l'UID
                shareLinkInput.value = `${currentUrl.origin}${currentUrl.pathname}?uid=${window.currentUser.uid}`;
            }
        }
    } catch (e) {
        console.error("Erreur chargement profil settings", e);
        showSettingsFeedback('error', "Impossible de charger les données du profil.");
    }

    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Ferme la modale de paramètres avec vérification
 */
function closeSettingsModal() {
    if (hasUnsavedChanges()) {
        // Afficher la modale de confirmation personnalisée
        const unsavedModal = document.getElementById('unsaved-changes-modal');
        if (unsavedModal) {
            unsavedModal.style.display = 'flex';
        }
        return;
    }

    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Confirme la fermeture sans sauvegarder
 */
function confirmCloseSettings() {
    // Fermer les deux modales
    const unsavedModal = document.getElementById('unsaved-changes-modal');
    const settingsModal = document.getElementById('settings-modal');

    if (unsavedModal) unsavedModal.style.display = 'none';
    if (settingsModal) settingsModal.style.display = 'none';

    // Réinitialiser l'état
    settingsInitialState = null;
}

/**
 * Annule la fermeture et retourne aux paramètres
 */
function cancelCloseSettings() {
    const unsavedModal = document.getElementById('unsaved-changes-modal');
    if (unsavedModal) {
        unsavedModal.style.display = 'none';
    }
}

// Fermer la modale si on clique en dehors
window.addEventListener('click', function (event) {
    const modal = document.getElementById('settings-modal');
    if (event.target === modal) {
        closeSettingsModal();
    }
});

/**
 * Gère la soumission du formulaire de paramètres
 */
async function handleSettingsSubmit(event) {
    event.preventDefault();

    const firstname = document.getElementById('settings-firstname').value.trim();
    const lastname = document.getElementById('settings-lastname').value.trim();
    const gender = document.getElementById('settings-gender').value;
    const linkedin = document.getElementById('settings-linkedin').value.trim();
    const publiclyVisible = document.getElementById('settings-public-visibility').checked;
    const emailVisible = document.getElementById('settings-email-visibility').checked;

    // Récupérer les stats manuelles
    const animatorsCount = document.getElementById('settings-animators-count').value;
    const directorsCount = document.getElementById('settings-directors-count').value;
    const trainersCount = document.getElementById('settings-trainers-count').value;

    // Reset feedback
    const feedbackEl = document.getElementById(SETTINGS_FEEDBACK_ID);
    if (feedbackEl) feedbackEl.style.display = 'none';

    try {
        await window.firebaseDb.collection('users').doc(window.currentUser.uid).update({
            firstname: firstname,
            lastname: lastname,
            gender: gender,
            displayName: `${firstname} ${lastname}`,
            linkedin: linkedin,
            publiclyVisible: publiclyVisible,
            emailVisible: emailVisible,
            stats: {
                animators: animatorsCount ? parseInt(animatorsCount) : 0,
                directors: directorsCount ? parseInt(directorsCount) : 0,
                trainers: trainersCount ? parseInt(trainersCount) : 0
            }
        });

        // Mettre à jour l'état initial pour éviter le warning si on ferme après save
        settingsInitialState = getSettingsState();

        // Mettre à jour l'UI locale
        if (typeof loadUserProfile === 'function') {
            loadUserProfile(); // Recharger le titre
        }

        // Mettre à jour les labels des postes si la fonction existe
        if (typeof updatePositionLabels === 'function') {
            updatePositionLabels();
        }

        showSettingsFeedback('success', "Profil mis à jour avec succès !");

    } catch (error) {
        console.error("Erreur mise à jour profil", error);
        showSettingsFeedback('error', "Erreur lors de la mise à jour : " + error.message);
    }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
async function sendPasswordReset() {
    if (!window.currentUser || !window.currentUser.email) return;

    try {
        await firebase.auth().sendPasswordResetEmail(window.currentUser.email);
        showSettingsFeedback('success', `Email de réinitialisation envoyé à ${window.currentUser.email}`);
    } catch (error) {
        console.error("Erreur reset password", error);
        showSettingsFeedback('error', "Erreur: " + error.message);
    }
}

/**
 * Supprime le compte utilisateur et ses données
 */
/**
 * Affiche l'écran de confirmation de suppression
 */
function showDeleteConfirmation() {
    document.getElementById('danger-initial-view').style.display = 'none';
    document.getElementById('danger-confirmation-view').style.display = 'block';
    // Clear input
    document.getElementById('delete-confirmation-input').value = '';
}

/**
 * Annule la suppression et revient à la vue initiale
 */
function cancelDeleteConfirmation() {
    document.getElementById('danger-confirmation-view').style.display = 'none';
    document.getElementById('danger-initial-view').style.display = 'block';
}

/**
 * Exécute la suppression du compte après validation du mot clé
 */
async function finalDeleteAccount() {
    const input = document.getElementById('delete-confirmation-input');
    const confirmation = input.value.trim();

    if (confirmation !== "SUPPRIMER") {
        showSettingsFeedback('error', "Mot de confirmation incorrect. Tapez 'SUPPRIMER'.");
        return;
    }

    try {
        const uid = window.currentUser.uid;
        showSettingsFeedback('success', "Suppression en cours...");

        // Supprimer expériences
        const expSnapshot = await window.firebaseDb.collection('users').doc(uid).collection('experiences').get();
        const expBatch = window.firebaseDb.batch();
        expSnapshot.forEach(doc => {
            expBatch.delete(doc.ref);
        });
        await expBatch.commit();

        // Supprimer formations
        const formSnapshot = await window.firebaseDb.collection('users').doc(uid).collection('formations').get();
        const formBatch = window.firebaseDb.batch();
        formSnapshot.forEach(doc => {
            formBatch.delete(doc.ref);
        });
        await formBatch.commit();

        // Supprimer le document user
        await window.firebaseDb.collection('users').doc(uid).delete();

        // Supprimer le compte Auth
        await window.currentUser.delete();

        // Pas de message de succès car on redirige
        window.location.href = "index.html";

    } catch (error) {
        console.error("Erreur suppression compte", error);
        // Si l'utilisateur doit se reconnecter
        if (error.code === 'auth/requires-recent-login') {
            showSettingsFeedback('error', "Par sécurité, veuillez vous déconnecter et vous reconnecter avant de supprimer votre compte.");
        } else {
            showSettingsFeedback('error', "Erreur lors de la suppression : " + error.message);
        }
    }
}

/**
 * Déclenche l'export des données en JSON
 */
async function exportData() {
    if (!window.currentUser) return;

    try {
        const uid = window.currentUser.uid;
        const exportData = {
            exportDate: new Date().toISOString(),
            user: {},
            experiences: [],
            formations: []
        };

        // 1. Récupérer les infos user
        const userDoc = await window.firebaseDb.collection('users').doc(uid).get();
        if (userDoc.exists) {
            exportData.user = userDoc.data();
        }

        // 2. Récupérer les expériences
        const expSnapshot = await window.firebaseDb.collection('users').doc(uid).collection('experiences').get();
        expSnapshot.forEach(doc => {
            exportData.experiences.push(doc.data());
        });

        // 3. Récupérer les formations
        const formSnapshot = await window.firebaseDb.collection('users').doc(uid).collection('formations').get();
        formSnapshot.forEach(doc => {
            exportData.formations.push(doc.data());
        });

        // 4. Créer le fichier JSON
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // 5. Télécharger
        const a = document.createElement('a');
        a.href = url;
        a.download = `recap-bafa-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSettingsFeedback('success', "Sauvegarde téléchargée avec succès !");

    } catch (error) {
        console.error("Erreur export :", error);
        showSettingsFeedback('error', "Erreur lors de l'export des données : " + error.message);
    }
}

/**
 * Déclenche le clic sur l'input file caché
 */
function triggerImportData() {
    const input = document.getElementById('import-file-input');
    if (input) input.click();
}


// Variables pour gérer l'import en attente
let pendingImportData = null;
let pendingImportInput = null;

/**
 * Prépare l'import depuis le fichier JSON sélectionné et demande confirmation
 */
async function importData(input) {
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    pendingImportInput = input;

    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!data.experiences && !data.formations) {
                throw new Error("Format de fichier invalide (sections manquantes)");
            }

            pendingImportData = data;

            // Afficher la modale de confirmation
            const expCount = data.experiences?.length || 0;
            const formCount = data.formations?.length || 0;

            const summaryText = document.getElementById('import-summary-text');
            if (summaryText) {
                summaryText.innerHTML = `Vous allez importer <strong>${expCount} expérience(s)</strong> et <strong>${formCount} formation(s)</strong>.`;
            }

            const modal = document.getElementById('import-confirmation-modal');
            if (modal) modal.style.display = 'flex';

        } catch (error) {
            console.error("Erreur lecture import :", error);
            showSettingsFeedback('error', "Erreur lecture fichier : " + error.message);
            input.value = '';
        }
    };

    reader.readAsText(file);
}

/**
 * Ferme la modale de confirmation d'import
 */
function closeImportConfirmationModal() {
    const modal = document.getElementById('import-confirmation-modal');
    if (modal) modal.style.display = 'none';

    // Reset
    pendingImportData = null;
    if (pendingImportInput) {
        pendingImportInput.value = '';
        pendingImportInput = null;
    }
}

/**
 * Exécute l'import après confirmation
 */
async function confirmImport() {
    console.log("Confirming import...");
    if (!pendingImportData) {
        console.error("No pending import data");
        return;
    }
    if (!window.currentUser) {
        console.error("No current user");
        return;
    }

    const data = pendingImportData;
    const uid = window.currentUser.uid;
    let successCount = 0;
    const modal = document.getElementById('import-confirmation-modal');

    // Changer le bouton en "Chargement..."
    const confirmBtn = modal.querySelector('.submit-btn');
    const originalBtnText = confirmBtn.textContent;
    confirmBtn.disabled = true;
    confirmBtn.textContent = "En cours...";

    try {
        // Importer les expériences
        if (data.experiences && Array.isArray(data.experiences)) {
            for (const exp of data.experiences) {
                await window.firebaseDb.collection('users').doc(uid).collection('experiences').add(exp);
                successCount++;
            }
        }

        // Importer les formations
        if (data.formations && Array.isArray(data.formations)) {
            for (const form of data.formations) {
                await window.firebaseDb.collection('users').doc(uid).collection('formations').add(form);
                successCount++;
            }
        }

        closeImportConfirmationModal();

        // Afficher feedback dans la modale principale (settings) si ouverte, ou recharger direct
        // Ici on recharge pour voir les données

        // On peut afficher un petit overlay ou juste recharger
        location.reload();

    } catch (error) {
        console.error("Erreur import :", error);
        closeImportConfirmationModal();
        showSettingsFeedback('error', "Erreur lors de l'importation : " + error.message);
    }
}

/**
 * Copie le lien de partage dans le presse-papier
 */
function copyProfileLink() {
    const linkInput = document.getElementById('share-profile-link');
    if (!linkInput) return;

    // Le lien est dans un input caché
    navigator.clipboard.writeText(linkInput.value).then(() => {
        const btnText = document.getElementById('share-btn-text');
        const defaultText = "Copier le lien de mon profil";

        if (btnText) btnText.textContent = 'Lien copié !';

        setTimeout(() => {
            if (btnText) btnText.textContent = defaultText;
        }, 2000);
    }).catch(err => {
        console.error('Erreur copie :', err);
        showSettingsFeedback('error', 'Erreur lors de la copie du lien.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Les listeners sont généralement attachés via onclick dans le HTML
    // ou gérés par firebase-auth.js pour l'affichage initial
});
