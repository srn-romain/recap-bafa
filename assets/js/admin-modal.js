document.addEventListener('DOMContentLoaded', function () {
    createAdminModal();
});

// Creates the admin stats modal structure and injects it into the body
function createAdminModal() {
    const modalHTML = `
    <div id="admin-stats-modal" class="modal" style="display: none; z-index: 10001;">
        <div class="modal-content" style="max-width: 900px;">
            <span class="close-modal" onclick="closeAdminStatsModal()">&times;</span>
            <div style="background-color: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
                    <i class="bi bi-shield-lock-fill" style="color: #dc2626; font-size: 1.5rem; margin-right: 0.75rem;"></i>
                    <h3 style="font-size: 1.25rem; font-weight: 700; color: #991b1b; margin: 0;">Statistiques Administrateur</h3>
                </div>

                <div style="overflow-x: auto; margin-bottom: 2rem;">
                    <table style="width: 100%; border-collapse: separate; border-spacing: 12px; table-layout: fixed;">
                        <!-- Ligne 1 -->
                        <tr>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #1f2937; margin: 0;" id="adminStatTotalUsers">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Utilisateurs totaux</p>
                            </td>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #16a34a; margin: 0;" id="adminStatActiveUsers">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Utilisateurs actifs</p>
                            </td>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #7c3aed; margin: 0;" id="adminStatTotalExps">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Expériences totales</p>
                            </td>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #d97706; margin: 0;" id="adminStatUpcomingExps">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Exps. à venir</p>
                            </td>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #4f46e5; margin: 0;" id="adminStatPastExps">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Exps. passées</p>
                            </td>
                        </tr>
                        <!-- Ligne 2 -->
                        <tr>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #059669; margin: 0;" id="adminStatTotalForms">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Formations totales</p>
                            </td>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #d97706; margin: 0;" id="adminStatUpcomingForms">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Forms. à venir</p>
                            </td>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #4f46e5; margin: 0;" id="adminStatPastForms">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Forms. passées</p>
                            </td>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #ea580c; margin: 0;" id="adminStatTotalDays">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Jours cumulés</p>
                            </td>
                            <td style="background: white; border-radius: 8px; padding: 1rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 1.5rem; font-weight: 700; color: #0891b2; margin: 0;" id="adminStatTotalOrgs">0</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Organismes</p>
                            </td>
                        </tr>
                        <!-- Ligne 3 (Pleine largeur) -->
                        <tr>
                            <td colspan="5" style="background: white; border-radius: 8px; padding: 0.75rem; text-align: center; border: 1px solid #fee2e2; vertical-align: middle;">
                                <p style="font-size: 0.875rem; font-weight: 700; color: #2563eb; margin: 0;" id="adminStatLastLogin">-</p>
                                <p style="font-size: 0.75rem; color: #4b5563; margin-top: 0.25rem;">Dernière connexion enregistrée</p>
                            </td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- CARTE ADMIN -->
            <div style="margin-top: 1.5rem; background: white; border-radius: 12px; padding: 1rem; border: 1px solid #fee2e2; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <h4 style="font-size: 0.875rem; font-weight: 700; color: #991b1b; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="bi bi-geo-alt-fill"></i> Carte des lieux d'expériences (BAFA/BAFD)
                </h4>
                <p id="mapLoadingStatus" style="font-size: 0.75rem; color: #6b7280; margin-bottom: 0.5rem; font-style: italic;">
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
