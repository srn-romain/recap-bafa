
const Tutorial = (function () {
    let currentStep = 0;
    const steps = [
        {
            element: '#nav-profile-pic-container',
            title: 'Votre Profil',
            content: 'Personnalisez votre photo dans les paramètres pour humaniser votre fiche aux yeux des recruteurs.',
            position: 'bottom'
        },
        {
            element: '#settings-btn',
            title: 'Paramètres',
            content: 'Réglez votre visibilité, changez vos informations ou exportez vos données en un clic.',
            position: 'bottom'
        },
        {
            element: '#quick-copy-link-btn',
            title: 'Partage de profil',
            content: 'Copiez ce lien pour l’envoyer aux recruteurs. Ils verront une version épurée et professionnelle de votre parcours.',
            position: 'bottom'
        },
        {
            element: '#add-experience-btn',
            title: 'Ajouter une Expérience',
            content: 'Commencez par ajouter vos expériences (Colos, ALSH, Périscolaire...). Saisissez une date de début et de fin pour calculer la durée !',
            position: 'bottom'
        },
        {
            element: '.pdf-btn', // Le premier bouton PDF trouvé (Expériences)
            title: 'Génération PDF',
            content: 'Exportez vos tableaux en PDF propre pour vos dossiers de candidature.',
            position: 'bottom'
        },
        {
            element: '#add-formation-btn',
            title: 'Formations',
            content: 'Enregistrez ici vos étapes du BAFA, BAFD, secourisme ou même le SNU.',
            position: 'bottom'
        },
        {
            element: '#statistiques',
            title: 'Statistiques',
            content: 'Visualisez votre impact : jours cumulés, tranches d’âge encadrées et plus encore.',
            position: 'top'
        },
        {
            element: '#logout-button-top',
            title: 'Terminé !',
            content: 'Le tour est fini. N’oubliez pas de vous déconnecter si vous êtes sur un ordinateur public. Bonne route !',
            position: 'bottom'
        }
    ];

    let overlay = null;
    let tooltip = null;

    function init() {
        if (overlay) return;

        overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 11000;
            display: none;
            pointer-events: auto;
            transition: all 0.3s ease;
        `;

        tooltip = document.createElement('div');
        tooltip.id = 'tutorial-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            width: 300px;
            z-index: 11001;
            display: none;
            flex-direction: column;
            gap: 12px;
            animation: fadeIn 0.3s ease;
        `;

        document.body.appendChild(overlay);
        document.body.appendChild(tooltip);

        overlay.addEventListener('click', () => {
            // Empêcher la fermeture au clic sur l'overlay pour forcer les boutons
        });
    }

    function highlight(selector) {
        let el = document.querySelector(selector);

        // Si l'élément est masqué ou inexistant, on cherche un parent visible ou on cible la navbar par défaut
        if (!el || window.getComputedStyle(el).display === 'none') {
            if (selector === '#nav-profile-pic-container') {
                el = document.querySelector('#sticky-navbar');
            } else {
                console.warn("Élément non trouvé ou masqué :", selector);
            }
        }

        const rect = el ? el.getBoundingClientRect() : {
            top: window.innerHeight / 2,
            bottom: window.innerHeight / 2,
            left: window.innerWidth / 2,
            right: window.innerWidth / 2,
            width: 0,
            height: 0
        };
        const padding = 5;

        // On scroll si l'élément existe et n'est pas la navbar (déjà en haut)
        if (el && el.id !== 'sticky-navbar') {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Mise à jour de l'overlay avec un trou (mask)
        setTimeout(() => {
            const upRect = el ? el.getBoundingClientRect() : rect;

            if (el && window.getComputedStyle(el).display !== 'none') {
                overlay.style.clipPath = `polygon(
                    0% 0%, 0% 100%, 
                    ${upRect.left - padding}px 100%, 
                    ${upRect.left - padding}px ${upRect.top - padding}px, 
                    ${upRect.right + padding}px ${upRect.top - padding}px, 
                    ${upRect.right + padding}px ${upRect.bottom + padding}px, 
                    ${upRect.left - padding}px ${upRect.bottom + padding}px, 
                    ${upRect.left - padding}px 100%, 100% 100%, 100% 0%
                )`;
            } else {
                overlay.style.clipPath = 'none';
            }

            updateTooltip(upRect);
        }, 500); // Délai pour le scroll smooth

        return rect;
    }

    function updateTooltip(rect) {
        const step = steps[currentStep];
        tooltip.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3 style="margin:0; color:#2c3e50; font-size:1.2rem;">${step.title}</h3>
                <span style="font-size:0.8rem; color:#888;">${currentStep + 1}/${steps.length}</span>
            </div>
            <p style="margin:0; color:#555; text-align:left; font-size:0.95rem; line-height:1.5;">${step.content}</p>
            <test style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                <button onclick="Tutorial.stop()" style="background:none; border:none; color:#888; cursor:pointer; font-size:0.85rem;">Passer</button>
                <button onclick="Tutorial.next()" style="background:#f39c12; color:white; border:none; padding:8px 18px; border-radius:6px; cursor:pointer; font-weight:bold;">
                    ${currentStep === steps.length - 1 ? 'Terminer' : 'Suivant'}
                </button>
            </test>
        `;

        tooltip.style.display = 'flex';

        let top, left;
        const margin = 15;

        if (step.position === 'bottom') {
            top = rect.bottom + window.scrollY + margin;
            left = rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2);
        } else {
            top = rect.top + window.scrollY - tooltip.offsetHeight - margin;
            left = rect.left + window.scrollX + (rect.width / 2) - (tooltip.offsetWidth / 2);
        }

        // Garder le tooltip dans l'écran
        if (left < 10) left = 10;
        if (left + tooltip.offsetWidth > window.innerWidth - 10) left = window.innerWidth - tooltip.offsetWidth - 10;

        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }

    return {
        start: function () {
            init();
            currentStep = 0;
            overlay.style.display = 'block';
            document.body.style.overflow = 'hidden';

            // On vérifie si le premier élément existe, sinon on cherche le premier disponible
            this.showStep();
        },
        showStep: function () {
            if (currentStep >= steps.length) {
                this.stop();
                return;
            }

            const step = steps[currentStep];
            const el = document.querySelector(step.element);
            const isVisible = el && window.getComputedStyle(el).display !== 'none';

            // Si l'élément n'existe pas ou est masqué (ex: statistiques sans données)
            // On l'ignore, sauf pour la photo de profil qui a son propre fallback dans highlight()
            if ((!el || !isVisible) && step.element !== '#nav-profile-pic-container') {
                console.log("Étape masquée car élément absent ou invisible :", step.element);
                this.next(); // On passe récursivement à la suivante
                return;
            }

            highlight(step.element);
        },
        next: function () {
            currentStep++;
            this.showStep();
        },
        stop: function () {
            if (overlay) overlay.style.display = 'none';
            if (tooltip) tooltip.style.display = 'none';
            document.body.style.overflow = '';

            // Marquer comme vu pour cet utilisateur spécifique
            if (window.currentUser) {
                localStorage.setItem('tutorial_seen_' + window.currentUser.uid, 'true');
            } else {
                localStorage.setItem('tutorial_seen', 'true');
            }
        },
        isActive: function () {
            return overlay && overlay.style.display === 'block';
        }
    };
})();

// Ajouter les styles d'animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

window.Tutorial = Tutorial;
