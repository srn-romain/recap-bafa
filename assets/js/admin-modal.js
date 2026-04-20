document.addEventListener('DOMContentLoaded', function () {
    createAdminModal();
});

// Creates the admin stats modal structure and injects it into the body
function createAdminModal() {
    const modalHTML = `
    <div id="admin-stats-modal" class="modal" style="display: none; z-index: 1000;">
        <style>
            .admin-stats-grid {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 12px;
                width: 100%;
            }
            .admin-stat-card {
                background: white;
                border-radius: 8px;
                padding: 1rem;
                text-align: center;
                border: 1px solid #fee2e2;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
            }
            .admin-stat-value {
                font-size: 1.5rem;
                font-weight: 700;
                margin: 0;
            }
            .admin-stat-label {
                font-size: 0.75rem;
                color: #4b5563;
                margin-top: 0.25rem;
                line-height: 1.2;
            }
            .admin-stat-full {
                grid-column: 1 / -1;
                width: 100%;
                overflow-x: auto;
            }
            .custom-marker-icon {
                background: none !important;
                border: none !important;
            }
            @media (max-width: 900px) {
                .admin-stats-grid {
                    grid-template-columns: repeat(3, 1fr);
                }
            }
            @media (max-width: 600px) {
                .admin-stats-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                .admin-stat-value {
                    font-size: 1.2rem;
                }
            }
            @media (max-width: 400px) {
                .admin-stats-grid {
                    grid-template-columns: 1fr;
                }
            }
        </style>
        <div class="modal-content" style="max-width: 900px;">
            <span class="close-modal" onclick="closeAdminStatsModal()" style="z-index: 1001; margin-top: 13px; margin-right: 13px">&times;</span>
            <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; text-align: center;">
                    <i class="bi bi-shield-lock-fill" style="color: #dc2626; font-size: 1.5rem; margin-right: 0.75rem;"></i>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #991b1b; margin: 0;">Statistiques Administrateur</h3>
                </div>

                <div class="admin-stats-grid">
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #1f2937;" id="adminStatTotalUsers">0</p>
                        <p class="admin-stat-label">Utilisateurs totaux</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #16a34a;" id="adminStatActiveUsers">0</p>
                        <p class="admin-stat-label">Utilisateurs actifs</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #7c3aed;" id="adminStatTotalExps">0</p>
                        <p class="admin-stat-label">Expériences totales</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #d97706;" id="adminStatUpcomingExps">0</p>
                        <p class="admin-stat-label">Exps. à venir</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #4f46e5;" id="adminStatPastExps">0</p>
                        <p class="admin-stat-label">Exps. passées</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #059669;" id="adminStatTotalForms">0</p>
                        <p class="admin-stat-label">Formations totales</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #d97706;" id="adminStatUpcomingForms">0</p>
                        <p class="admin-stat-label">Forms. à venir</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #4f46e5;" id="adminStatPastForms">0</p>
                        <p class="admin-stat-label">Forms. passées</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #ea580c;" id="adminStatTotalDays">0</p>
                        <p class="admin-stat-label">Jours cumulés</p>
                    </div>
                    <div class="admin-stat-card">
                        <p class="admin-stat-value" style="color: #0891b2;" id="adminStatTotalOrgs">0</p>
                        <p class="admin-stat-label">Organismes</p>
                    </div>
                    <div class="admin-stat-card admin-stat-full" style="text-align: left; align-items: flex-start; margin-bottom: 0px;">
                        <p style="font-size: 0.875rem; font-weight: 700; color: #b91c1c; margin-bottom: 0.8rem; width: 100%; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <i class="bi bi-activity"></i>Activité du site
                        </p>
                        <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                            <table style="min-width: 450px; width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                                <thead>
                                <tr style="border-bottom: 1px solid #fee2e2;">
                                    <th style="padding: 8px; text-align: center; color: #6b7280; font-weight: 500;">Période</th>
                                    <th style="padding: 8px; text-align: center; color: #6b7280; font-weight: 500;">7 jours</th>
                                    <th style="padding: 8px; text-align: center; color: #6b7280; font-weight: 500;">30 jours</th>
                                    <th style="padding: 8px; text-align: center; color: #6b7280; font-weight: 500;">1 an</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr style="border-bottom: 1px solid #fee2e2;">
                                    <td style="padding: 10px 8px; font-weight: 600; color: #374151;">Connexions (activités)</td>
                                    <td style="padding: 10px 8px; text-align: center; color: #16a34a; font-weight: 700; font-size: 1.1rem;">
                                        <span id="statConnexions7d">0</span><span id="trendConnexions7d" style="font-size: 0.7rem; margin-left: 4px;"></span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center; color: #16a34a; font-weight: 700; font-size: 1.1rem;">
                                        <span id="statConnexions30d">0</span><span id="trendConnexions30d" style="font-size: 0.7rem; margin-left: 4px;"></span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center; color: #16a34a; font-weight: 700; font-size: 1.1rem;">
                                        <span id="statConnexions1y">0</span><span id="trendConnexions1y" style="font-size: 0.7rem; margin-left: 4px;"></span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 8px; font-weight: 600; color: #374151;">Ajouts de données</td>
                                    <td style="padding: 10px 8px; text-align: center; color: #2563eb; font-weight: 700; font-size: 1.1rem;">
                                        <span id="statAjouts7d">0</span><span id="trendAjouts7d" style="font-size: 0.7rem; margin-left: 4px;"></span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center; color: #2563eb; font-weight: 700; font-size: 1.1rem;">
                                        <span id="statAjouts30d">0</span><span id="trendAjouts30d" style="font-size: 0.7rem; margin-left: 4px;"></span>
                                    </td>
                                    <td style="padding: 10px 8px; text-align: center; color: #2563eb; font-weight: 700; font-size: 1.1rem;">
                                        <span id="statAjouts1y">0</span><span id="trendAjouts1y" style="font-size: 0.7rem; margin-left: 4px;"></span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="admin-stat-card admin-stat-full" style="text-align: left; align-items: flex-start; margin-bottom: 0.5rem;">
                    <p style="font-size: 0.875rem; font-weight: 700; color: #7c3aed; margin-bottom: 1rem; width: 100%; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                        <i class="bi bi-bar-chart-fill"></i>Top Organismes
                    </p>
                    <div id="adminTopOrganisms" style="width: 100%; display: flex; flex-direction: column; gap: 12px; padding: 0 10px 10px 10px;">
                        <p style="margin: 0; color: #6b7280; font-style: italic; text-align: center; width: 100%;">Analyse en cours...</p>
                    </div>
                </div>
                <div class="admin-stat-card admin-stat-full" style="text-align: left; align-items: flex-start; min-height: 180px;">
                    <p style="font-size: 0.875rem; font-weight: 700; color: #2563eb; margin-bottom: 0.5rem; width: 100%; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                         <i class="bi bi-clock-history"></i>Dernières connexions (hors vous)
                    </p>
                    <div id="adminStatLastLoginList" style="width: 100%; display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto; padding-right: 5px; overflow-x: auto;">
                        <p style="margin: 0; color: #6b7280; font-style: italic; text-align: center; width: 100%;">Chargement...</p>
                    </div>
                </div>
                </div>
            </div>

            <!-- CARTE ADMIN -->
            <div style="margin-top: 1.5rem; background: white; border-radius: 12px; padding: 1rem; border: 1px solid #fee2e2; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h4 style="font-size: 0.875rem; font-weight: 700; color: #991b1b; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="bi bi-geo-alt-fill"></i> Carte des lieux d'expériences (BAFA/BAFD)
                </h4>
                <p id="mapLoadingStatus" style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem; font-style: italic; text-align: center;">
                    Initialisation de la carte...</p>
                <div id="adminRacesMap" style="width: 100%; height: 350px; border-radius: 8px; background-color: #f3f4f6; border: 1px solid #e5e7eb; z-index: 1;">
                </div>
            </div>
        </div>
    </div>
    `;

    // Inject modal into body
    if (!document.getElementById('admin-stats-modal')) {
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Opens the admin stats modal and loads data
window.openAdminStatsModal = function () {
    const modal = document.getElementById('admin-stats-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.classList.add('modal-open');

        // Load Leaflet if needed, then initialize stats
        loadLeafletAndStats();

        // Fix map size check after modal display to ensure correct rendering
        setTimeout(() => {
            if (typeof adminMap !== 'undefined' && adminMap) {
                adminMap.invalidateSize();
            }
        }, 500);
    }
};

window.closeAdminStatsModal = function () {
    const modal = document.getElementById('admin-stats-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
};

// Close on outside click
window.addEventListener('click', function (event) {
    const modal = document.getElementById('admin-stats-modal');
    if (event.target === modal) {
        closeAdminStatsModal();
    }
});

// Load Leaflet and then trigger stats
function loadLeafletAndStats() {
    if (typeof L !== 'undefined') {
        // Leaflet already loaded
        if (typeof loadAdminStats === 'function') {
            loadAdminStats();
        }
        return;
    }

    // Load CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);
    }

    // Load JS
    if (!document.querySelector('script[src*="leaflet.js"]')) {
        const jsScript = document.createElement('script');
        jsScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        jsScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        jsScript.crossOrigin = '';
        jsScript.onload = function () {
            if (typeof loadAdminStats === 'function') {
                loadAdminStats();
            }
        };
        document.head.appendChild(jsScript);
    }
}
