// Variables globales pour le viewer
window.imageViewerInitialized = false;

window.openImageViewer = function (src) {
    if (!src) return;

    // Lazy initialization si le modal n'existe pas encore
    if (!document.getElementById('image-viewer-modal')) {
        const imageViewerHTML = `
        <div id="image-viewer-modal" class="modal" style="display: none; align-items: center; justify-content: center; background-color: rgba(0,0,0,0.9); z-index: 10002;" onclick="window.closeImageViewer()">
            <span class="close-modal" onclick="window.closeImageViewer()" style="position: absolute; top: 20px; right: 30px; color: white; font-size: 40px; cursor: pointer;">&times;</span>
            <img id="image-viewer-img" style="max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 0 20px rgba(255,255,255,0.1);">
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', imageViewerHTML);
    }

    const modal = document.getElementById('image-viewer-modal');
    const img = document.getElementById('image-viewer-img');
    if (modal && img) {
        img.src = src;
        modal.style.display = 'flex';
    }
};

window.closeImageViewer = function () {
    const modal = document.getElementById('image-viewer-modal');
    if (modal) modal.style.display = 'none';
};

document.addEventListener("DOMContentLoaded", function () {
    // Generate Navbar HTML
    const navbarHTML = `
    <nav id="sticky-navbar">
        <div class="nav-content">
            <!-- Profile Pic (Dynamic) -->
            <test id="nav-profile-pic-container" style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; display: none; margin-right: 10px;">
                <img id="nav-profile-pic" src="" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy">
            </test>

            <!-- Home Icon (Mobile) -->
            <a href="index.html" class="nav-item home-btn" title="Accueil" id="nav-home-btn">
                <i class="bi bi-house-door-fill"></i>
            </a>

            <!-- Menu Button (Desktop) -->
            <a href="index.html" class="nav-item" title="Menu" id="nav-menu-btn">
                <i class="bi bi-house-door-fill"></i> Accueil
            </a>
            
            <!-- Liens Sommaire (visible sur Dashboard) -->
            <test id="nav-link-experiences" class="nav-item nav-toc-link" onclick="document.getElementById('experiences').scrollIntoView({behavior: 'smooth'})" style="cursor: pointer;">
                <i class="bi bi-briefcase"></i> <span class="nav-text">Expériences</span>
            </test>
            <test id="nav-link-formations" class="nav-item nav-toc-link" onclick="document.getElementById('formations').scrollIntoView({behavior: 'smooth'})" style="cursor: pointer;">
                <i class="bi bi-journal-text"></i> <span class="nav-text">Formations</span>
            </test>
            <test id="nav-link-stats" class="nav-item nav-toc-link" onclick="document.getElementById('statistiques').scrollIntoView({behavior: 'smooth'})" style="cursor: pointer;">
                <i class="bi bi-bar-chart-line"></i> <span class="nav-text">Statistiques</span>
            </test>

            <!-- LinkedIn (visible si connecté) -->
            <a id="linkedin-link" href="#" target="_blank" class="nav-item" title="LinkedIn" style="display: none;">
                <i class="bi bi-linkedin"></i>
            </a>

            <!-- Statistiques Admin (visible si admin) -->
            <button id="admin-stats-btn" onclick="openAdminStatsModal()" class="nav-item" title="Statistiques Admin" style="display: none;">
                <i class="bi bi-bar-chart-fill"></i>
            </button>

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
                    <p style="font-size: 0.85rem; color: #666; margin-bottom: 10px;">Les champs marqués d'un <span style="color: red;">*</span> sont obligatoires.</p>
                    <div class="form-group">
                        <label>Prénom <span class="required-asterisk">*</span></label>
                        <input type="text" id="auth-firstname" placeholder="Ex: Jean">
                    </div>
                    <div class="form-group">
                        <label>Nom <span class="required-asterisk">*</span></label>
                        <input type="text" id="auth-lastname" placeholder="Ex: Dupont">
                    </div>
                </div>
                <div class="form-group">
                    <label>Email <span class="required-asterisk">*</span></label>
                    <input type="email" id="login-email" placeholder="votre@email.com" required>
                </div>
                <div class="form-group">
                    <label>Mot de passe <span class="required-asterisk">*</span></label>
                    <div class="password-input-wrapper">
                        <input type="password" id="login-password" placeholder="Votre mot de passe" required>
                        <button type="button" class="password-toggle" onclick="togglePasswordVisibility()">
                            <i class="bi bi-eye" id="password-eye-icon"></i>
                        </button>
                    </div>
                    <!-- Barre de complexité du mot de passe -->
                    <!-- Liste des critères de complexité -->
                    <div id="password-criteria-container" style="display: none; margin-top: 10px; font-size: 0.8rem; color: #666;">
                        <p style="margin: 0 0 5px 0; font-weight: 500;">Sécurité du mot de passe :</p>
                        <div id="crit-length" style="margin-bottom: 2px;"><i class="bi bi-circle"></i> 8 caractères minimum</div>
                        <div id="crit-upper" style="margin-bottom: 2px;"><i class="bi bi-circle"></i> Une majuscule</div>
                        <div id="crit-lower" style="margin-bottom: 2px;"><i class="bi bi-circle"></i> Une minuscule</div>
                        <div id="crit-number" style="margin-bottom: 2px;"><i class="bi bi-circle"></i> Un chiffre</div>
                        <div id="crit-special"><i class="bi bi-circle"></i> Un caractère spécial</div>
                    </div>
                </div>
                <button type="submit" class="auth-option-btn admin-btn" style="width: 100%;">
                    <i class="bi bi-box-arrow-in-right"></i> <span id="auth-submit-text">Se connecter</span>
                </button>
                <!-- Champ caché pour le mode (login/register) -->
                <input type="hidden" id="auth-mode" value="login">

                <div class="auth-divider">
                    <span>OU</span>
                </div>

                <button type="button" onclick="handleGoogleLogin()" class="google-btn">
                    <i class="bi bi-google"></i> <span>Continuer avec Google</span>
                </button>
            </form>
            <p style="text-align: center; margin-top: 15px; cursor: pointer; color: #50644c; text-decoration: underline;"
                onclick="toggleAuthMode()">
                <span id="auth-toggle-text">Pas encore de compte ? Créer un compte</span>
            </p>
            <p id="auth-privacy-notice" style="display: none; font-size: 0.75rem; color: #888; text-align: center; margin-top: 15px; line-height: 1.4; font-style: italic;">
                Vos informations personnelles sont collectées dans l'unique but de sécuriser votre accès et de permettre aux recruteurs de vous identifier de manière unique. 
                En aucun cas vos données ne seront utilisées à des fins commerciales. Nous ne vous contacterons jamais et vos données ne seront jamais cédées.
                <br><a href="index.html#rgpd" onclick="event.preventDefault(); if(typeof openRgpdModal === 'function'){ closeAuthModal(); openRgpdModal(); } else { window.open('index.html#rgpd', '_blank'); }"
                style="color: #50644c; text-decoration: underline;">Voir la politique complète</a>
            </p>
        </div>
    </div>
    `;

    // Insert navbar
    document.body.insertAdjacentHTML('afterbegin', navbarHTML);

    // Initialisation Viewer Image (Triggered lazily now, but setup nav click)
    // Click event for Navbar Profile Pic
    const navPic = document.getElementById('nav-profile-pic');
    if (navPic) {
        navPic.style.cursor = 'pointer';
        navPic.onclick = function () {
            window.openImageViewer(this.src);
        };
    }

    // Insert modal if not exists
    if (!document.getElementById('auth-modal')) {
        document.body.insertAdjacentHTML('beforeend', authModalHTML);
    }

    // Fonction globale pour mettre à jour la visibilité des liens de navigation
    window.updateNavbarLinksVisibility = function () {
        const sections = ['experiences', 'formations', 'statistiques'];
        // Mapping IDs des liens
        const linkIds = {
            'experiences': 'nav-link-experiences',
            'formations': 'nav-link-formations',
            'statistiques': 'nav-link-stats'
        };

        sections.forEach((sectionId) => {
            const section = document.getElementById(sectionId);
            const link = document.getElementById(linkIds[sectionId]);
            if (link) {
                // Masquer si la section n'existe pas ou si elle est cachée (display: none)
                if (!section || window.getComputedStyle(section).display === 'none') {
                    link.style.display = 'none';
                } else {
                    link.style.display = 'flex'; // Afficher en flex pour alignement icone/texte
                }
            }
        });
    };

    // Appeler une première fois (pour l'initialisation sync)
    // Utiliser setTimeout pour laisser le temps au CSS/DOM de se stabiliser
    setTimeout(() => {
        window.updateNavbarLinksVisibility();
        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }
    }, 100);

    // Scroll Spy pour activer les liens au défilement
    function setupScrollSpy() {
        const sections = ['experiences', 'formations', 'statistiques'];
        const navLinks = {
            'experiences': document.getElementById('nav-link-experiences'),
            'formations': document.getElementById('nav-link-formations'),
            'statistiques': document.getElementById('nav-link-stats')
        };

        // On utilise IntersectionObserver pour détecter quelle section est visible
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px', // Active la section quand elle est dans le haut de l'écran
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Désactiver tous les liens
                    Object.values(navLinks).forEach(link => {
                        if (link) link.classList.remove('active');
                    });

                    // Activer le lien courant
                    const id = entry.target.id;
                    if (navLinks[id]) {
                        navLinks[id].classList.add('active');
                    }
                }
            });
        }, observerOptions);

        sections.forEach(id => {
            const section = document.getElementById(id);
            if (section) observer.observe(section);
        });
    }

    // Initialiser le ScrollSpy
    setupScrollSpy();
});
