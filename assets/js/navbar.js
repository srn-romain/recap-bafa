document.addEventListener("DOMContentLoaded", function () {
    // Generate Navbar HTML
    const navbarHTML = `
    <nav id="sticky-navbar">
        <div class="nav-content">
            <!-- Profile Pic (Dynamic) -->
            <test id="nav-profile-pic-container" style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; display: none; margin-right: 10px;">
                <img id="nav-profile-pic" src="" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">
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
                    <div class="form-group">
                        <label>Prénom <span class="required-asterisk">*</span></label>
                        <input type="text" id="auth-firstname" placeholder="Ex: Jean">
                    </div>
                    <div class="form-group">
                        <label>Nom <span class="required-asterisk">*</span></label>
                        <input type="text" id="auth-lastname" placeholder="Ex: Dupont">
                    </div>
                    <div class="form-group">
                        <label>Lien LinkedIn</label>
                        <input type="url" id="auth-linkedin" placeholder="https://www.linkedin.com/in/...">
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
    /*setTimeout(() => {
        window.updateNavbarLinksVisibility();
        if (typeof window.updateUI === 'function') {
            window.updateUI();
        }
    }, 100);*/

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
