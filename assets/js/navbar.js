document.addEventListener("DOMContentLoaded", function () {
    // Generate Navbar HTML
    const navbarHTML = `
    <nav id="sticky-navbar">
        <div class="nav-content">
            <!-- Home Icon (Mobile) -->
            <a href="index.html" class="nav-item home-btn" title="Accueil" id="nav-home-btn">
                <i class="bi bi-house-door-fill"></i>
            </a>

            <!-- Menu Button (Desktop) -->
            <a href="index.html" class="nav-item" title="Menu" id="nav-menu-btn">
                <i class="bi bi-house-door-fill"></i> Accueil
            </a>

            <!-- LinkedIn (visible si connecté) -->
            <a id="linkedin-link" href="#" target="_blank" class="nav-item" title="LinkedIn" style="display: none;">
                <i class="bi bi-linkedin"></i>
            </a>

            <!-- Paramètres (visible si propriétaire/admin) -->
            <button id="settings-btn" onclick="openSettingsModal()" class="nav-item" title="Paramètres" style="display: none;">
                <i class="bi bi-gear-fill"></i>
            </button>
            
            <!-- Connexion (visible si déconnecté) -->
            <button id="auth-button-top" onclick="showAuthModal()" class="nav-item" style="font-size: 1rem; font-weight: bold; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 5px 15px;">
                <i class="bi bi-person"></i> Connexion
            </button>

            <!-- Déconnexion (visible si connecté) -->
            <button id="logout-button-top" onclick="signOut()" class="nav-item" title="Se déconnecter" style="display: none;">
                <i class="bi bi-box-arrow-right"></i>
            </button>
        </div>
    </nav>
    `;

    // Modal d'authentification (Injectée seulement si elle n'existe pas déjà)
    const authModalHTML = `
    <div id="auth-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <span class="close-modal" onclick="closeAuthModal()">&times;</span>
            <h2>Connexion</h2>
            <div id="auth-error-message" class="error-message" style="display: none;"></div>
            <form id="login-form" onsubmit="handleLogin(event)">
                <div id="register-fields" style="display: none;">
                    <div class="form-group">
                        <label>Prénom *</label>
                        <input type="text" id="auth-firstname" placeholder="Ex: Jean">
                    </div>
                    <div class="form-group">
                        <label>Nom *</label>
                        <input type="text" id="auth-lastname" placeholder="Ex: Dupont">
                    </div>
                    <div class="form-group">
                        <label>Lien LinkedIn (facultatif)</label>
                        <input type="url" id="auth-linkedin" placeholder="https://www.linkedin.com/in/...">
                    </div>
                </div>
                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="login-email" placeholder="votre@email.com" required>
                </div>
                <div class="form-group">
                    <label>Mot de passe *</label>
                    <div class="password-input-wrapper">
                        <input type="password" id="login-password" placeholder="Votre mot de passe" required>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility()">
                            <i class="bi bi-eye" id="password-eye-icon"></i>
                        </button>
                    </div>
                </div>
                <button type="submit" class="auth-option-btn admin-btn" style="width: 100%;">
                    <i class="bi bi-box-arrow-in-right"></i> <span id="auth-submit-text">Se connecter</span>
                </button>
                <!-- Champ caché pour le mode (login/register) -->
                <input type="hidden" id="auth-mode" value="login">
            </form>
            <p style="text-align: center; margin-top: 15px; cursor: pointer; color: #50644c; text-decoration: underline;"
                onclick="toggleAuthMode()">
                <span id="auth-toggle-text">Pas encore de compte ? Créer un compte</span>
            </p>
        </div>
    </div>
    `;

    // Insert navbar
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // Insert modal if not exists
    if (!document.getElementById('auth-modal')) {
        document.body.insertAdjacentHTML('beforeend', authModalHTML);
    }
});
