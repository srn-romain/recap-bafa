// Gestion des paramètres utilisateur
const SETTINGS_FEEDBACK_ID = 'settings-feedback';

/**
 * Affiche un message de feedback dans la modale
 * @param {string} type 'success' ou 'error'
 * @param {string} message Le message à afficher
 */
window.showSettingsFeedback = function (type, message, { durationMs = 3000, allowHtml = false } = {}) {
    const feedbackEl = document.getElementById(SETTINGS_FEEDBACK_ID);
    if (feedbackEl) {
        feedbackEl.innerHTML = allowHtml ? message : message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        feedbackEl.className = `feedback-message ${type}`;
        feedbackEl.style.display = 'block';

        // Auto-hide après quelques secondes si c'est un succès
        if (type === 'success') {
            setTimeout(() => {
                feedbackEl.style.display = 'none';
            }, durationMs);
        }
    }

    // Déclencher également un toaster global pour informer l'utilisateur
    if (typeof window.showToast === 'function') {
        const plainText = message.replace(/<[^>]*>?/gm, '');
        if (type === 'success') {
            window.showSuccessToast(plainText, durationMs);
        } else if (type === 'error') {
            window.showErrorToast(plainText, durationMs || 6000);
        }
    }
}

/**
 * Toggle l'affichage de la bulle explicative du genre
 */
window.toggleGenderExplanation = function (event) {
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
window.toggleLinkedinExplanation = function (event) {
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

/**
 * Logique ergonomique des cases à cocher de confidentialité.
 * Gère l'exclusion mutuelle et met à jour le bandeau d'info.
 */
window.handlePrivacyCheckboxChange = function (which) {
    const publicCb = document.getElementById('settings-public-visibility');
    const emailCb = document.getElementById('settings-email-visibility');
    const privateCb = document.getElementById('settings-is-private');

    if (which === 'private' && privateCb && privateCb.checked) {
        // Compte privé : incompatible avec "visible dans la recherche" et "email visible"
        if (publicCb) publicCb.checked = false;
        if (emailCb) emailCb.checked = false;
    } else if (which === 'public' && publicCb && publicCb.checked) {
        // Si on remet "visible dans la recherche", on enlève "privé"
        if (privateCb) privateCb.checked = false;
    } else if (which === 'email' && emailCb && emailCb.checked) {
        // Email visible est incompatible avec compte privé
        if (privateCb) privateCb.checked = false;
    }

    updatePrivacyBanner();
};

/**
 * Met à jour le bandeau récapitulatif de confidentialité.
 */
function updatePrivacyBanner() {
    const publicCb = document.getElementById('settings-public-visibility');
    const emailCb = document.getElementById('settings-email-visibility');
    const privateCb = document.getElementById('settings-is-private');
    const banner = document.getElementById('privacy-status-banner');
    const iconEl = document.getElementById('privacy-status-icon');
    const textEl = document.getElementById('privacy-status-text');

    if (!banner || !iconEl || !textEl) return;

    const isPublic = publicCb && publicCb.checked;
    const isEmail = emailCb && emailCb.checked;
    const isPrivate = privateCb && privateCb.checked;

    let icon, text, bg, color;

    if (isPrivate) {
        icon = '🔒';
        bg = '#fdf0f0';
        color = '#c0392b';
        text = '<strong>Profil privé</strong> — Votre page n\'est visible que par vous. Elle n\'apparaît pas dans les résultats de recherche et aucune information n\'est exposée aux visiteurs.';
    } else if (!isPublic && !isEmail) {
        icon = '🔕';
        bg = '#fef9ec';
        color = '#d68910';
        text = '<strong>Profil discret</strong> — Votre page est accessible si quelqu\'un connaît votre lien direct, mais elle n\'apparaît pas dans les résultats de recherche.';
    } else if (isPublic && !isEmail) {
        icon = '🌍';
        bg = '#eef9f0';
        color = '#1e8449';
        text = '<strong>Profil public</strong> — Votre page est visible dans les résultats de recherche. Votre adresse email reste privée.';
    } else if (isPublic && isEmail) {
        icon = '🌍';
        bg = '#eef9f0';
        color = '#1e8449';
        text = '<strong>Profil public avec email</strong> — Votre page est visible dans la recherche et votre adresse email est affichée aux visiteurs.';
    } else {
        // isEmail seul (cas rare)
        icon = '🔕';
        bg = '#fef9ec';
        color = '#d68910';
        text = '<strong>Profil discret avec email visible</strong> — Votre page n\'apparaît pas dans la recherche, mais les visiteurs ayant votre lien pourront voir votre email.';
    }

    banner.style.display = 'block';
    banner.style.background = bg;
    banner.style.color = color;
    banner.style.border = `1.5px solid ${color}40`;
    iconEl.textContent = icon;
    textEl.innerHTML = text;
}
window.updatePrivacyBanner = updatePrivacyBanner;

let backgroundImageData = null;
let profilePicData = null; // New variable for profile picture
const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

/**
 * Gère l'upload de l'image de fond et de profil
 */
// Les écouteurs pour les inputs de la modale sont maintenant gérés directement via 
// les attributs onchange/oninput dans settings-modal-component.js pour éviter 
// les problèmes de timing lors de l'injection dynamique de la modale.

/**
 * Traite la photo de profil sélectionnée
 */
window.handleProfilePicUpload = function (event) {
    const file = event.target.files[0];
    const previewImg = document.getElementById('preview-profile-pic');

    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
        showSettingsFeedback('error', `L'image est trop lourde (${(file.size / 1024 / 1024).toFixed(2)} Mo). Max : ${MAX_IMAGE_SIZE_MB} Mo.`);
        event.target.value = '';
        profilePicData = null;
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        profilePicData = e.target.result;

        // Afficher la preview
        if (previewImg) {
            previewImg.src = profilePicData;
            previewImg.style.display = 'block';
        }

        // Sauvegarde immédiate
        try {
            await window.firebaseDb.collection('users').doc(window.currentUser.uid).update({
                profilePic: profilePicData
            });

            // Update global vars
            window.userProfilePic = profilePicData;

            // Update UI immédiate si fonction updateUI existe (navbar)
            if (typeof updateUI === 'function') {
                updateUI();
            }

            showSettingsFeedback('success', "Photo de profil mise à jour !");
            settingsChangesSaved = true; // Marquer pour reload si besoin

        } catch (error) {
            console.error("Erreur sauvegarde photo profil", error);
            showSettingsFeedback('error', "Erreur sauvegarde photo : " + error.message);
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Supprime la photo de profil
 */
window.removeProfilePic = async function () {
    profilePicData = null;
    const input = document.getElementById('settings-profile-pic');
    const previewImg = document.getElementById('preview-profile-pic');

    try {
        await window.firebaseDb.collection('users').doc(window.currentUser.uid).update({
            profilePic: firebase.firestore.FieldValue.delete()
        });

        // Update UI
        if (input) input.value = '';
        if (previewImg) {
            previewImg.src = '';
            previewImg.style.display = 'none';
        }

        // Global state
        window.userProfilePic = null;
        if (typeof updateUI === 'function') {
            updateUI();
        }

        showSettingsFeedback('success', "Photo de profil supprimée.");
        settingsChangesSaved = true;

    } catch (error) {
        console.error("Erreur suppression photo", error);
        showSettingsFeedback('error', "Erreur suppression : " + error.message);
    }
}

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
window.removeBackgroundImage = function () {
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
        firstname: document.getElementById('settings-firstname')?.value.trim().replace(/\\s+/g, ' ') || '',
        lastname: document.getElementById('settings-lastname')?.value.trim().replace(/\\s+/g, ' ') || '',
        gender: document.getElementById('settings-gender')?.value || '',
        linkedin: document.getElementById('settings-linkedin')?.value.trim() || '',
        publiclyVisible: document.getElementById('settings-public-visibility')?.checked || false,
        emailVisible: document.getElementById('settings-email-visibility')?.checked || false,
        isPrivate: document.getElementById('settings-is-private')?.checked || false,
        stickyHeader: document.getElementById('settings-sticky-header')?.checked || false,
        animators: document.getElementById('settings-animators-count')?.value || '',
        directors: document.getElementById('settings-directors-count')?.value || '',
        trainers: document.getElementById('settings-trainers-count')?.value || ''
    };
}

/**
 * Vérifie s'il y a des changements non enregistrés
 */
function hasUnsavedSettingsChanges() {
    if (!settingsInitialState) return false;
    const currentState = getSettingsState();
    return JSON.stringify(currentState) !== JSON.stringify(settingsInitialState);
}

/**
 * Ouvre la modale de paramètres et pré-remplit les champs
 */
window.openSettingsModal = async function () {
    if (!window.currentUser || !window.targetUid || window.currentUser.uid !== window.targetUid) {
        return; // Sécurité côté client
    }

    const modal = document.getElementById('settings-modal');
    // Réinitialiser le flag de changements
    settingsChangesSaved = false;

    // Reset feedback
    const feedbackEl = document.getElementById(SETTINGS_FEEDBACK_ID);
    if (feedbackEl) feedbackEl.style.display = 'none';

    // Remplir l'email
    const emailDisplay = document.getElementById('settings-email-display');
    if (emailDisplay && window.currentUser && window.currentUser.email) {
        emailDisplay.textContent = window.currentUser.email;
    }

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

            // Charger la visibilité privée
            const isPrivateInput = document.getElementById('settings-is-private');
            if (isPrivateInput) {
                isPrivateInput.checked = data.isPrivate === true; // Par défaut false
            }

            // Charger la préférence de défilement de l'en-tête (par défaut false)
            const stickyHeaderInput = document.getElementById('settings-sticky-header');
            if (stickyHeaderInput) {
                stickyHeaderInput.checked = data.stickyHeader === true; // Par défaut false
            }

            // Gérer le bloc d'habilitation directeur
            const directorRoleBlock = document.getElementById('settings-director-role-block');
            if (directorRoleBlock) {
                directorRoleBlock.style.display = (data.role === 'dirlo' || window.userRole === 'dirlo') ? 'block' : 'none';
            }

            // Mettre à jour le bandeau de confidentialité avec l'état chargé
            updatePrivacyBanner();

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

            // Mettre à jour la preview des stats
            updateSettingsStatsPreview();

            // Remplir la photo de profil
            const profilePreview = document.getElementById('preview-profile-pic');
            if (profilePreview) {
                if (data.profilePic) {
                    profilePreview.src = data.profilePic;
                    profilePreview.style.display = 'block';
                    profilePicData = data.profilePic; // Stocker pour pas la perdre si on change rien
                } else {
                    profilePreview.src = '';
                    profilePreview.style.display = 'none';
                    profilePicData = null;
                }
            }

            // Remplir le lien de partage caché
            const shareLinkInput = document.getElementById('share-profile-link');
            if (shareLinkInput) {
                const currentUrl = new URL(window.location.href);
                let path = currentUrl.pathname;

                // Si on est sur l'accueil (index.html ou /), le lien doit pointer vers dashboard.html
                if (path.endsWith('index.html') || path.endsWith('/')) {
                    if (path.endsWith('index.html')) {
                        path = path.replace('index.html', 'dashboard.html');
                    } else {
                        path += 'dashboard.html';
                    }
                } else if (!path.includes('dashboard.html')) {
                    // Fallback générique : essayer de pointer vers dashboard.html dans le même dossier
                    path = path.substring(0, path.lastIndexOf('/')) + '/dashboard.html';
                }

                shareLinkInput.value = `${currentUrl.origin}${path}?uid=${window.currentUser.uid}`;
            }
        }
    } catch (e) {
        console.error("Erreur chargement profil settings", e);
        showSettingsFeedback('error', "Impossible de charger les données du profil.");
    }

    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}

/**
 * Ferme la modale de paramètres avec vérification
 */
let settingsChangesSaved = false;

window.closeSettingsModal = function (force = false) {
    // Si on force la fermeture (ex: depuis la modale de confirmation)
    if (force) {
        confirmCloseSettings();
        return;
    }

    if (hasUnsavedSettingsChanges()) {
        const unsavedModal = document.getElementById('settings-unsaved-changes-modal');
        if (unsavedModal) {
            unsavedModal.style.display = 'flex';
        } else {
            // Fallback si la modale de confirmation n'existe pas
            if (confirm("Vous avez des modifications non enregistrées. Voulez-vous vraiment fermer sans sauvegarder ?")) {
                confirmCloseSettings();
            }
        }
        return;
    }

    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        // Si des changements importants ont été sauvegardés, on recharge
        if (settingsChangesSaved) {
            window.location.reload();
        }
    }
};

/**
 * Confirme la fermeture sans sauvegarder
 */
window.confirmCloseSettings = function () {
    // Fermer les modales existantes
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal) settingsModal.style.display = 'none';

    document.body.classList.remove('modal-open');

    // Réinitialiser l'état
    settingsInitialState = null;

    // Fermer la modale globale d'avertissement depuis settings (s'assure de l'effacer)
    const unsavedModal = document.getElementById('settings-unsaved-changes-modal');
    if (unsavedModal) unsavedModal.style.display = 'none';
};

/**
 * Annule la fermeture et reste sur les paramètres
 */
window.cancelCloseSettings = function () {
    const unsavedModal = document.getElementById('settings-unsaved-changes-modal');
    if (unsavedModal) unsavedModal.style.display = 'none';
};

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
window.handleSettingsSubmit = async function (event) {
    event.preventDefault();

    const firstname = document.getElementById('settings-firstname').value.trim().replace(/\\s+/g, ' ');
    const lastname = document.getElementById('settings-lastname').value.trim().replace(/\\s+/g, ' ');
    const gender = document.getElementById('settings-gender').value;
    const linkedin = document.getElementById('settings-linkedin').value.trim();
    const publiclyVisible = document.getElementById('settings-public-visibility').checked;
    const emailVisible = document.getElementById('settings-email-visibility').checked;
    const isPrivate = document.getElementById('settings-is-private').checked;
    const stickyHeader = document.getElementById('settings-sticky-header')?.checked ?? false;

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
            linkedin: linkedin,
            publiclyVisible: publiclyVisible,
            emailVisible: emailVisible,
            isPrivate: isPrivate,
            stickyHeader: stickyHeader,
            stats: {
                animators: animatorsCount ? parseInt(animatorsCount) : 0,
                directors: directorsCount ? parseInt(directorsCount) : 0,
                trainers: trainersCount ? parseInt(trainersCount) : 0
            }
        });

        // Update local status immediately if needed
        window.userGender = gender;
        window.stickyHeaderEnabled = stickyHeader;
        localStorage.setItem('stickyHeaderEnabled', stickyHeader ? 'true' : 'false');
        if (typeof updateStickyHeaderState === 'function') {
            updateStickyHeaderState();
        }

        // Mettre à jour l'état initial pour éviter le warning si on ferme après save
        settingsInitialState = getSettingsState();

        showSettingsFeedback('success', "Profil mis à jour avec succès !");

        // Mise à jour instantanée de l'interface sans recharger la page
        try {
            if (typeof getUserRole === 'function') await getUserRole(window.currentUser);
            if (typeof updateUI === 'function') updateUI();
            if (typeof loadUserProfile === 'function') await loadUserProfile();
            if (typeof calculateAllStatistics === 'function') calculateAllStatistics();
        } catch (e) {
            console.warn("Erreur lors de la mise à jour instantanée de l'interface:", e);
        }

        // On ne force plus le rechargement à la fermeture car l'UI est déjà à jour
        settingsChangesSaved = false;

    } catch (error) {
        console.error("Erreur mise à jour profil", error);
        showSettingsFeedback('error', "Erreur lors de la mise à jour : " + error.message);
    }
}

/**
 * Envoie un email de réinitialisation de mot de passe
 */
window.sendPasswordReset = async function () {
    if (!window.currentUser || !window.currentUser.email) return;

    try {
        await firebase.auth().sendPasswordResetEmail(window.currentUser.email);
        const sender = 'noreply@macollectiondebafa.firebaseapp.com';
        // Mettre en relief l'email et laisser le message plus longtemps (12s)
        const highlightedEmail = `<span style="font-weight:700; color:#f39c12; text-decoration:underline;">${window.currentUser.email}</span>`;
        const msg = `Email de réinitialisation envoyé à ${highlightedEmail} — vérifiez vos spams !<br><small>Expéditeur : <strong>${sender}</strong></small>`;
        showSettingsFeedback('success', msg, { durationMs: 12000, allowHtml: true });
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
window.showDeleteConfirmation = function () {
    document.getElementById('danger-initial-view').style.display = 'none';
    document.getElementById('danger-confirmation-view').style.display = 'block';
    // Clear input
    document.getElementById('delete-confirmation-input').value = '';
}

/**
 * Annule la suppression et revient à la vue initiale
 */
window.cancelDeleteConfirmation = function () {
    document.getElementById('danger-confirmation-view').style.display = 'none';
    document.getElementById('danger-initial-view').style.display = 'block';
}

/**
 * Exécute la suppression du compte après validation du mot clé
 */
window.finalDeleteAccount = async function () {
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
window.exportData = async function () {
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
window.triggerImportData = function () {
    const input = document.getElementById('import-file-input');
    if (input) input.click();
}


/**
 * Toggle l'affichage de la bulle explicative des stats
 */
window.toggleStatsExplanation = function (event) {
    event.preventDefault();
    const bubble = document.getElementById('stats-explanation-bubble');
    if (bubble) {
        bubble.style.display = (bubble.style.display === 'none' || !bubble.style.display) ? 'block' : 'none';
    }
}

// Variables pour gérer l'import en attente
let pendingImportData = null;
let pendingImportInput = null;

/**
 * Prépare l'import depuis le fichier JSON sélectionné et demande confirmation
 */
window.importData = async function (input) {
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
            if (modal) {
                modal.style.display = 'flex';
                document.body.classList.add('modal-open');
            }

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
window.closeImportConfirmationModal = function () {
    const modal = document.getElementById('import-confirmation-modal');
    if (modal) {
        modal.style.display = 'none';
        // Only remove scroll lock if the main settings modal is also closed
        const settingsModal = document.getElementById('settings-modal');
        if (!settingsModal || settingsModal.style.display === 'none') {
            document.body.classList.remove('modal-open');
        }
    }

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
window.confirmImport = async function () {
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
window.copyProfileLink = function () {
    const linkInput = document.getElementById('share-profile-link');
    if (!linkInput) return;

    // Remplir le lien à la volée s'il est vide ou pour forcer l'exactitude
    if (window.currentUser && window.currentUser.uid) {
        const currentUrl = new URL(window.location.href);
        let path = currentUrl.pathname;

        if (path.endsWith('index.html') || path.endsWith('/')) {
            if (path.endsWith('index.html')) {
                path = path.replace('index.html', 'dashboard.html');
            } else {
                path += 'dashboard.html';
            }
        } else if (!path.includes('dashboard.html')) {
            path = path.substring(0, path.lastIndexOf('/')) + '/dashboard.html';
        }

        linkInput.value = `${currentUrl.origin}${path}?uid=${window.currentUser.uid}`;
    }

    if (!linkInput.value) {
        console.warn("copyProfileLink: Lien de partage non disponible");
        return;
    }

    navigator.clipboard.writeText(linkInput.value).then(() => {
        const btnText = document.getElementById('share-btn-text');

        // Gestion du bouton rapide (Dashboard)
        const quickBtnText = document.getElementById('quick-copy-text');
        const quickBtn = document.getElementById('quick-copy-link-btn');
        const defaultText = "Copier le lien de mon profil";
        const defaultQuickText = "Copier le lien de partage de mon profil";

        if (btnText) btnText.textContent = 'Lien copié !';

        if (quickBtnText && quickBtn) {
            // Figer la largeur actuelle pour éviter le redimensionnement
            const currentWidth = quickBtn.getBoundingClientRect().width;
            quickBtn.style.width = `${currentWidth}px`;
            quickBtn.style.justifyContent = 'center'; // S'assurer que le contenu reste centré

            quickBtnText.textContent = 'Lien copié !';
        }

        if (typeof window.showSuccessToast === 'function') {
            window.showSuccessToast('Lien de votre profil copié dans le presse-papier !');
        }

        setTimeout(() => {
            if (btnText) btnText.textContent = defaultText;

            if (quickBtnText && quickBtn) {
                quickBtnText.textContent = defaultQuickText;
                // Relâcher la largeur (optionnel, ou on peut la laisser figée)
                quickBtn.style.width = '';
            }
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
/**
 * Met à jour la phrase de prévisualisation des statistiques manuelles
 */
window.updateSettingsStatsPreview = function () {
    const animators = parseInt(document.getElementById('settings-animators-count')?.value || 0, 10);
    const directors = parseInt(document.getElementById('settings-directors-count')?.value || 0, 10);
    const trainers = parseInt(document.getElementById('settings-trainers-count')?.value || 0, 10);

    const previewEl = document.getElementById('settings-stats-preview');
    if (!previewEl) return;

    const parts = [];
    // Récupérer le genre pour l'accord
    const gender = document.getElementById('settings-gender')?.value || '';

    if (animators > 0) {
        let label = animators > 1 ? 'animateurs' : 'animateur';
        if (gender === 'feminin') label = animators > 1 ? 'animatrices' : 'animatrice';
        parts.push(`<span style="color: #50644c; font-weight: bold;">${animators}</span> ${label}`);
    }
    
    if (directors > 0) {
        let label = directors > 1 ? 'directeurs' : 'directeur';
        if (gender === 'feminin') label = directors > 1 ? 'directrices' : 'directrice';
        parts.push(`<span style="color: #50644c; font-weight: bold;">${directors}</span> ${label}`);
    }
    
    if (trainers > 0) {
        let label = trainers > 1 ? 'formateurs' : 'formateur';
        if (gender === 'feminin') label = trainers > 1 ? 'formatrices' : 'formatrice';
        parts.push(`<span style="color: #50644c; font-weight: bold;">${trainers}</span> ${label}`);
    }

    if (parts.length > 0) {
        let sentence = "J'ai travaillé avec ";
        if (parts.length === 1) {
            sentence += parts[0];
        } else {
            const last = parts.pop();
            sentence += parts.join(', ') + ' et ' + last;
        }
        previewEl.innerHTML = `La phrase affichée publiquement sera : <br><em>"${sentence}"</em>`;
        previewEl.style.borderColor = "#a6d866";
        previewEl.style.background = "#f8fdf4";
    } else {
        // Mode Teaser / Incitation
        previewEl.innerHTML = `En remplissant ces données, la phrase qui sera affichée pourrait être :<br><em>"J'ai travaillé avec 15 animateurs, 2 directeurs et 1 formateur"</em>`;
        previewEl.style.borderColor = "#ddd";
        previewEl.style.background = "#fafafa";
    }
    previewEl.style.display = 'block';
}