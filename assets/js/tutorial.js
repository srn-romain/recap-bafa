
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
            content: 'Commencez par ajouter vos expériences (Colos, ALSH, Scoutisme...). Les formulaires sont dynamiques !',
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
            content: 'Le tour est fini. N’oubliez pas de vous déconnecter sur un ordinateur public. Bonne route !',
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
        const el = document.querySelector(selector);
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        const padding = 5;

        // On scroll si besoin
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Mise à jour de l'overlay avec un trou (mask)
        // Note: Sur certains navigateurs on utilise clip-path avec un polygone complexe pour faire un trou
        setTimeout(() => {
            const upRect = el.getBoundingClientRect();
            overlay.style.clipPath = `polygon(
                0% 0%, 0% 100%, 
                ${upRect.left - padding}px 100%, 
                ${upRect.left - padding}px ${upRect.top - padding}px, 
                ${upRect.right + padding}px ${upRect.top - padding}px, 
                ${upRect.right + padding}px ${upRect.bottom + padding}px, 
                ${upRect.left - padding}px ${upRect.bottom + padding}px, 
                ${upRect.left - padding}px 100%, 100% 100%, 100% 0%
            )`;

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
            highlight(steps[currentStep].element);
        },
        next: function () {
            currentStep++;
            if (currentStep < steps.length) {
                highlight(steps[currentStep].element);
            } else {
                this.stop();
            }
        },
        stop: function () {
            if (overlay) overlay.style.display = 'none';
            if (tooltip) tooltip.style.display = 'none';
            document.body.style.overflow = '';
            // Marquer comme vu
            localStorage.setItem('tutorial_seen', 'true');
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
