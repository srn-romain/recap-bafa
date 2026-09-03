/**
 * Composant partagé : Modal de paramètres du compte
 * Ce fichier injecte dynamiquement la modal de paramètres dans le DOM
 * pour éviter la duplication de code entre index.html et dashboard.html.
 */

function injectSettingsModal() {
    // Vérifier si la modal existe déjà
    if (document.getElementById('settings-modal')) return;

    const modalHTML = `
    <div id="settings-modal" class="modal" style="display: none;">
        <div class="modal-content settings-modal-content">
            <span class="close-modal" onclick="closeSettingsModal()">&times;</span>
            <div style="text-align: center; border-bottom: 1px solid #a6d866; margin-bottom: 15px; padding-bottom: 5px; padding-left: 30px; padding-right: 30px;">
                <h2 style="margin-bottom: 5px; border: none;">Paramètres du compte</h2>
                <div id="settings-email-display" style="color: #888; font-size: 0.85rem; font-weight: 500; margin: 0;"></div>
            </div>

            <form id="settings-form" onsubmit="handleSettingsSubmit(event)">
                <p class="form-info-message" style="color: #666; font-size: 0.9em; margin-bottom: 20px;">
                    Les champs marqués d'un <span style="color: red;">*</span> sont obligatoires.
                </p>
                <h3 class="subsettings-title">Profil</h3>

                <!-- Photo de profil -->
                <div class="form-group" style="text-align: center; margin-bottom: 25px;">
                    <label style="display: block; margin-bottom: 10px;">Photo de profil</label>
                    <div style="width: 100px; height: 100px; border-radius: 50%; background: #f0f0f0; margin: 0 auto 10px; overflow: hidden; position: relative; border: 2px solid #ddd; display: flex; align-items: center; justify-content: center;">
                        <img id="preview-profile-pic" src="" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; display: none; position: relative; z-index: 1;" loading="lazy">
                        <i class="bi bi-person-fill" style="font-size: 3rem; color: #ccc; position: absolute; z-index: 0;"></i>
                    </div>

                    <div style="display: flex; justify-content: center; gap: 10px;">
                        <label for="settings-profile-pic" class="secondary-action-btn" style="width: auto; margin: 0; padding: 5px 10px; font-size: 0.8rem;">
                            <i class="bi bi-upload"></i> Modifier
                        </label>
                        <input type="file" id="settings-profile-pic" accept="image/*" style="display: none;" onchange="handleProfilePicUpload(event)">

                        <button type="button" onclick="removeProfilePic()" class="secondary-action-btn" style="width: auto; margin: 0; padding: 5px 10px; font-size: 0.8rem; color: #e74c3c; border-color: #e74c3c;">
                            <i class="bi bi-trash" style="color: #e74c3c;"></i>
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label>Prénom <span style="color: red;">*</span></label>
                    <input type="text" id="settings-firstname" placeholder="Prénom" required>
                </div>

                <div class="form-group">
                    <label>Nom <span style="color: red;">*</span></label>
                    <input type="text" id="settings-lastname" placeholder="Nom" required>
                </div>

                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="margin: 0;">Genre</label>
                        <a href="#" id="gender-why-link" onclick="toggleGenderExplanation(event)" style="font-size: 0.7rem; color: #999; text-decoration: underline; font-weight: normal; font-style: italic;">
                            Pourquoi cette question ?
                        </a>
                    </div>

                    <div id="gender-explanation-bubble" style="display: none; position: relative; margin-top: 10px; margin-bottom: 15px;">
                        <div style="background: linear-gradient(135deg, #a6d866 0%, #8ecf4e 100%); border-radius: 8px; padding: 15px; color: white; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(166, 216, 102, 0.3); position: relative;">
                            <div style="position: absolute; top: -8px; right: 120px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #a6d866;"></div>
                            <p style="margin: 0; line-height: 1.5;">
                                Cette information permet d'adapter automatiquement les termes d'intitulé de poste :
                                <em>Animateur/Animatrice</em>, <em>Directeur/Directrice</em>, etc.
                                Cela rend le profil plus personnel !
                            </p>
                        </div>
                    </div>

                    <select id="settings-gender" onchange="updateSettingsStatsPreview()">
                        <option value="">-- Sélectionner --</option>
                        <option value="masculin">Masculin</option>
                        <option value="feminin">Féminin</option>
                    </select>
                </div>

                <div class="form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <label style="margin: 0;">Lien LinkedIn</label>
                        <a href="#" id="linkedin-why-link" onclick="toggleLinkedinExplanation(event)" style="font-size: 0.7rem; color: #999; text-decoration: underline; font-weight: normal; font-style: italic;">
                            Pourquoi cette question ?
                        </a>
                    </div>

                    <div id="linkedin-explanation-bubble" style="display: none; position: relative; margin-top: 10px; margin-bottom: 15px;">
                        <div style="background: linear-gradient(135deg, #a6d866 0%, #8ecf4e 100%); border-radius: 8px; padding: 15px; color: white; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(166, 216, 102, 0.3); position: relative;">
                            <div style="position: absolute; top: -8px; right: 120px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #a6d866;"></div>
                            <p style="margin: 0; line-height: 1.5;">
                                Ajouter votre LinkedIn permet aux recruteurs et aux autres membres de vous contacter plus facilement et de voir votre parcours professionnel complet !
                            </p>
                        </div>
                    </div>

                    <input type="url" id="settings-linkedin" placeholder="https://linkedin.com/in/...">
                </div>

                <div class="settings-divider"></div>

                <h3 class="subsettings-title">Confidentialité</h3>

                <div class="form-group checkbox-row">
                    <input type="checkbox" id="settings-public-visibility" style="transform: scale(1.5); margin-right: 10px;" onchange="handlePrivacyCheckboxChange('public')">
                    <label for="settings-public-visibility">Afficher mon profil dans les résultats de recherche</label>
                </div>

                <div class="form-group checkbox-row">
                    <input type="checkbox" id="settings-email-visibility" style="transform: scale(1.5); margin-right: 10px;" onchange="handlePrivacyCheckboxChange('email')">
                    <label for="settings-email-visibility">Rendre mon adresse email visible aux visiteurs</label>
                </div>

                <div class="form-group checkbox-row">
                    <input type="checkbox" id="settings-is-private" style="transform: scale(1.5); margin-right: 10px;" onchange="handlePrivacyCheckboxChange('private')">
                    <label for="settings-is-private" style="font-size: 0.74em">Rendre mon compte privé (accessible uniquement par moi)</label>
                </div>

                <div id="privacy-status-banner" style="display:none; border-radius: 10px; padding: 12px 15px; margin-top: 8px; font-size: 0.82rem; line-height: 1.5;">
                    <span id="privacy-status-icon" style="font-size: 1.1rem; margin-right: 6px;"></span>
                    <span id="privacy-status-text"></span>
                </div>

                <div class="settings-divider"></div>

                <h3 class="subsettings-title">Préférences d'affichage</h3>

                <div class="form-group checkbox-row">
                    <input type="checkbox" id="settings-sticky-header" style="transform: scale(1.5); margin-right: 10px;">
                    <label for="settings-sticky-header">Faire défiler l'en-tête du tableau lors du scroll</label>
                </div>

                <div class="settings-divider"></div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    <h3 class="subsettings-title" style="margin: 0;">Statistiques manuelles</h3>
                    <a href="#" onclick="toggleStatsExplanation(event)" style="font-size: 0.7rem; color: #999; text-decoration: underline; font-weight: normal; font-style: italic;">
                        Pourquoi cette question ?
                    </a>
                </div>

                <div id="stats-explanation-bubble" style="display: none; position: relative; margin-top: 10px; margin-bottom: 15px;">
                    <div style="background: linear-gradient(135deg, #a6d866 0%, #8ecf4e 100%); border-radius: 8px; padding: 15px; color: white; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(166, 216, 102, 0.3); position: relative;">
                        <div style="position: absolute; top: -8px; right: 30px; width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 8px solid #a6d866;"></div>
                        <p style="margin: 0; line-height: 1.5;">
                            Nous vous demandons ces chiffres car le programme ne peut pas deviner si vous avez travaillé plusieurs fois avec les mêmes personnes. Ces données permettent d'avoir un aperçu réel de votre réseau dans la section <strong>Statistiques</strong>.
                        </p>
                    </div>
                </div>
                <div class="form-row" style="display: flex; gap: 10px;">
                    <div class="form-group" style="flex: 1;">
                        <label>Animateurs</label>
                        <input type="number" id="settings-animators-count" placeholder="Nb" min="0" oninput="updateSettingsStatsPreview()">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Directeurs</label>
                        <input type="number" id="settings-directors-count" placeholder="Nb" min="0" oninput="updateSettingsStatsPreview()">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>Formateurs</label>
                        <input type="number" id="settings-trainers-count" placeholder="Nb" min="0" oninput="updateSettingsStatsPreview()">
                    </div>
                </div>

                <div id="settings-stats-preview" style="display: none; background: #f8fdf4; border: 1px dashed #a6d866; border-radius: 8px; padding: 10px; margin-top: 15px; font-size: 0.8rem; color: #666; text-align: center; line-height: 1.4;"></div>

                <button type="submit" class="submit-btn" style="width: 100%; margin-top: 15px;">Enregistrer</button>
                <div id="settings-feedback" class="feedback-message hidden" style="margin-top: 10px;"></div>
            </form>

            <div class="settings-divider"></div>

            <div class="settings-actions">
                <h3 class="subsettings-title">Actions</h3>

                <div id="settings-director-role-block" style="display: none; background: #fefce8; border: 1px solid #fde047; border-radius: 10px; padding: 14px 16px; margin: 0 0 15px; text-align: center;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #854d0e; font-weight: 700; font-size: 0.9rem; margin-bottom: 5px;">
                        <i class="bi bi-award" style="color: #ca8a04; font-size: 1.1rem;"></i> Statut Directeur BAFD actif
                    </div>
                    <p style="color: #713f12; font-size: 0.8rem; margin: 0 0 10px 0; line-height: 1.4;">
                        Vous disposez des droits d'exploration des profils publics d'animateurs. Vous pouvez renoncer à ce statut à tout moment pour repasser en compte Animateur.
                    </p>
                    <button type="button" onclick="relinquishDirectorRole()" class="secondary-action-btn" style="width: auto; margin: 0 auto; background: #ffffff; border-color: #eab308; color: #a16207; font-size: 0.82rem; font-weight: 600; padding: 6px 14px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px;">
                        <i class="bi bi-person-dash"></i> Renoncer au statut Directeur (repasser Animateur)
                    </button>
                </div>

                <div class="action-buttons-group">
                    <button type="button" onclick="copyProfileLink()" class="secondary-action-btn">
                        <i class="bi bi-link-45deg"></i> <span id="share-btn-text">Copier le lien de mon profil</span>
                    </button>
                    <input type="text" id="share-profile-link" class="visually-hidden">

                    <button type="button" onclick="sendPasswordReset()" class="secondary-action-btn">
                        <i class="bi bi-key"></i> Réinitialiser mot de passe
                    </button>

                    <button type="button" onclick="closeSettingsModal(); if(typeof Tutorial !== 'undefined') Tutorial.start();" class="secondary-action-btn" style="background: #34495e; color: white;">
                        <i class="bi bi-play-circle"></i> Relancer le tutoriel
                    </button>
                </div>

                <div class="data-buttons-row">
                    <button type="button" onclick="exportData()" class="data-btn export-btn">
                        <i class="bi bi-download"></i> Exporter
                    </button>
                    <button type="button" onclick="triggerImportData()" class="data-btn import-btn">
                        <i class="bi bi-upload"></i> Importer
                    </button>
                    <input type="file" id="import-file-input" class="visually-hidden" accept=".json" onchange="importData(this)">
                </div>
            </div>

            <div class="danger-section">
                <div id="danger-initial-view">
                    <h3 class="danger-title">Zone de danger</h3>
                    <p class="danger-text">La suppression du compte est irréversible.</p>
                    <button type="button" onclick="showDeleteConfirmation()" class="danger-btn">Supprimer mon compte</button>
                </div>

                <div id="danger-confirmation-view" style="display: none;">
                    <h3 class="danger-title">Confirmation requise</h3>
                    <p class="danger-text">Toutes vos données (expériences, formations) seront définitivement effacées.</p>
                    <label for="delete-confirmation-input" class="danger-input-label">Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :</label>
                    <input type="text" id="delete-confirmation-input" class="danger-input" placeholder="SUPPRIMER">

                    <div class="danger-actions-row">
                        <button type="button" onclick="cancelDeleteConfirmation()" class="secondary-action-btn">Annuler</button>
                        <button type="button" onclick="finalDeleteAccount()" class="danger-btn">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal de confirmation d'import (également partagée car liée aux actions de settings) -->
    <div id="import-confirmation-modal" class="modal" style="display: none; z-index: 9999;">
        <div class="modal-content">
            <span class="close-modal" onclick="closeImportConfirmationModal()">&times;</span>
            <h2 style="border: none; margin-bottom: 10px;">Confirmer l'importation</h2>
            <p style="margin-bottom: 20px; line-height: 1.5;">
                Vous êtes sur le point d'importer des données. 
                <br><strong style="color: #e74c3c;">Attention :</strong> Cela écrasera vos données actuelles.
            </p>
            <div style="display: flex; gap: 10px;">
                <button type="button" onclick="closeImportConfirmationModal()" class="secondary-action-btn" style="flex: 1;">Annuler</button>
                <button type="button" id="confirm-import-btn" class="submit-btn" style="flex: 1; margin: 0;">Confirmer l'import</button>
            </div>
        </div>
    </div>

    <!-- Modal de confirmation pour modifications non enregistrées -->
    <div id="settings-unsaved-changes-modal" class="modal" style="display: none; z-index: 10000;">
        <div class="modal-content">
            <h2 style="margin-bottom: 15px;">
                <i class="bi bi-exclamation-triangle-fill" style="color: #f39c12;"></i>
                Modifications non enregistrées
            </h2>
            <p style="text-align: center; margin: 20px 0; color: #555;">
                Voulez-vous vraiment fermer sans sauvegarder ?
            </p>
            <div style="display: flex; gap: 10px; justify-content: center; align-items: center; margin-top: 25px;">
                <button type="button" onclick="confirmCloseSettings()" class="submit-btn" style="flex: 1; max-width: 180px; margin: 0; background-color: #e74c3c;">Quitter</button>
                <button type="button" onclick="cancelCloseSettings()" class="secondary-action-btn" style="flex: 1; max-width: 150px; margin: 0;">Annuler</button>
            </div>
        </div>
    </div>

    <!-- Modal de confirmation pour renoncer au statut Directeur -->
    <div id="director-relinquish-modal" class="modal" style="display: none; z-index: 10000;">
        <div class="modal-content" style="max-width: 460px; text-align: center; padding: 28px 24px;">
            <span class="close-modal" onclick="closeDirectorRelinquishModal()">&times;</span>
            <div style="width: 56px; height: 56px; border-radius: 50%; background: #fef3c7; color: #d97706; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.8rem;">
                <i class="bi bi-person-dash"></i>
            </div>
            <h2 style="margin-bottom: 12px; font-size: 1.25rem; color: #1f2937; border: none;">Renoncer au statut Directeur</h2>
            <p style="color: #4b5563; font-size: 0.92rem; line-height: 1.55; margin-bottom: 22px;">
                Votre compte repassera en <strong>profil Animateur standard</strong>.<br>
                Vous n'aurez plus accès à l'exploration des profils publics d'animateurs.
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button type="button" onclick="closeDirectorRelinquishModal()" class="secondary-action-btn" style="flex: 1; max-width: 140px; margin: 0;">
                    Annuler
                </button>
                <button type="button" id="confirm-relinquish-btn" onclick="executeRelinquishDirectorRole()" class="submit-btn" style="flex: 1.3; max-width: 200px; margin: 0; background-color: #d97706;">
                    Confirmer le changement
                </button>
            </div>
        </div>
    </div>

    <!-- Modal de confirmation décision Admin (Accepter / Refuser demande directeur) -->
    <div id="admin-director-decision-modal" class="modal" style="display: none; z-index: 10000;">
        <div class="modal-content" style="max-width: 480px; text-align: center; padding: 28px 24px;">
            <span class="close-modal" onclick="closeAdminDirectorDecisionModal()">&times;</span>
            <div id="admin-decision-icon-wrapper" style="width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.8rem;">
            </div>
            <h2 id="admin-decision-title" style="margin-bottom: 10px; font-size: 1.25rem; color: #1f2937; border: none;">
            </h2>
            <div id="admin-decision-user-box" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px 16px; margin: 0 auto 16px; text-align: left; font-size: 0.88rem; line-height: 1.5;">
            </div>
            <p id="admin-decision-text" style="color: #4b5563; font-size: 0.9rem; line-height: 1.5; margin-bottom: 22px;">
            </p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button type="button" onclick="closeAdminDirectorDecisionModal()" class="secondary-action-btn" style="flex: 1; max-width: 140px; margin: 0;">
                    Annuler
                </button>
                <button type="button" id="admin-decision-confirm-btn" class="submit-btn" style="flex: 1.3; max-width: 200px; margin: 0;">
                    Confirmer
                </button>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Auto-injection au chargement du script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSettingsModal);
} else {
    injectSettingsModal();
}
