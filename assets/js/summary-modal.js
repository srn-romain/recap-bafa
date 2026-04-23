/**
 * Gère la modale récapitulative des expériences et formations.
 */

document.addEventListener('DOMContentLoaded', function () {
  createSummaryModal();
});

/**
 * Crée la structure de la modale récapitulative et l'injecte dans le body.
 */
function createSummaryModal() {
  if (document.getElementById('summary-modal')) return;

  const modalHTML = `
    <div id="summary-modal" class="modal" style="display: none; z-index: 2000;">
        <div class="modal-content summary-modal-content" style="max-width: 500px; padding: 0; overflow: hidden; border-radius: 15px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
            <div id="summary-header" style="padding: 20px; color: white; position: relative;">
                <span class="close-modal" onclick="closeSummaryModal()" style="color: white; position: absolute; top: 15px; right: 20px; opacity: 0.8; cursor: pointer; font-size: 24px;">&times;</span>
                <div style="display: flex; align-items: center; gap: 15px;">
                    <div id="summary-logo-container" style="width: 60px; height: 60px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                        <img id="summary-logo" src="" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div>
                        <h2 id="summary-title" style="color: white; text-align: left; margin: 0; font-size: 1.25rem; line-height: 1.2; background: transparent; box-shadow: none;">Titre</h2>
                        <p id="summary-subtitle" style="color: rgba(255,255,255,0.9); text-align: left; margin: 5px 0 0 0; font-size: 0.9rem; background: transparent; box-shadow: none;">Sous-titre</p>
                    </div>
                </div>
            </div>
            
            <div id="summary-body" style="padding: 25px; background: #f8fafc;">
                <div class="summary-details-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                    
                    <!-- Date et Durée -->
                    <div class="summary-info-card" style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; background: #fff7ed; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #f39c12; font-size: 1.2rem;">
                            <i class="bi bi-calendar3"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Période & Durée</div>
                            <div id="summary-date-duration" style="font-size: 0.95rem; color: #1e293b; font-weight: 500;">Date - Durée</div>
                        </div>
                    </div>

                    <!-- Organisateur -->
                    <div class="summary-info-card" style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; background: #f0fdf4; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #22c55e; font-size: 1.2rem;">
                            <i class="bi bi-building"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Organisme</div>
                            <div id="summary-organizer-link-container">
                                <a id="summary-organizer" href="#" target="_blank" style="font-size: 0.95rem; color: #1e293b; font-weight: 500; display: flex; align-items: center; gap: 5px;">
                                    Organisateur <i class="bi bi-box-arrow-up-right" style="font-size: 0.8rem;"></i>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Lieu -->
                    <div class="summary-info-card" style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; background: #eff6ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 1.2rem;">
                            <i class="bi bi-geo-alt"></i>
                        </div>
                        <div style="flex: 1;">
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Lieu</div>
                            <div id="summary-location-container">
                                <a id="summary-location" href="#" target="_blank" style="font-size: 0.95rem; color: #1e293b; font-weight: 500; display: flex; align-items: center; gap: 5px;">
                                    Lieu <i class="bi bi-geo"></i>
                                </a>
                            </div>
                        </div>
                    </div>

                    <!-- Autres infos (Type séjour, Tranche d'âge, Nb jeunes) -->
                    <div id="summary-extra-info" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div class="summary-info-card" style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Type de séjour</div>
                            <div id="summary-stay-type" style="font-size: 0.9rem; color: #1e293b; font-weight: 500;">-</div>
                        </div>
                        <div class="summary-info-card" style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0;">
                            <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Tranche d'âge</div>
                            <div id="summary-age-range" style="font-size: 0.9rem; color: #1e293b; font-weight: 500;">-</div>
                        </div>
                        <div class="summary-info-card" style="background: white; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; grid-column: span 2;">
                             <div style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Public encadré</div>
                            <div id="summary-youth-count" style="font-size: 0.9rem; color: #1e293b; font-weight: 500;">-</div>
                        </div>
                    </div>

                </div>
            </div>
            
            <div id="summary-footer" style="padding: 15px; background: white; border-top: 1px solid #e2e8f0; text-align: center;">
                <button type="button" onclick="closeSummaryModal()" style="background: #64748b; color: white; border: none; padding: 8px 25px; border-radius: 30px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">Fermer</button>
            </div>
        </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Affiche la modale récapitulative avec les données fournies.
 */
window.showSummaryModal = function (data, itemType) {
  const modal = document.getElementById('summary-modal');
  if (!modal) return;

  const header = document.getElementById('summary-header');
  const logo = document.getElementById('summary-logo');
  const title = document.getElementById('summary-title');
  const subtitle = document.getElementById('summary-subtitle');
  const dateDuration = document.getElementById('summary-date-duration');
  const organizer = document.getElementById('summary-organizer');
  const location = document.getElementById('summary-location');
  const extraInfo = document.getElementById('summary-extra-info');

  // 1. Couleurs et En-tête selon le type
  if (itemType === 'experience') {
    header.style.background = 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
    title.textContent = data.position || 'Expérience';
    subtitle.textContent = data.stayType || 'Animation';
    extraInfo.style.display = 'grid';
    
    // Champs spécifiques expérience
    document.getElementById('summary-stay-type').textContent = data.stayType || '-';
    document.getElementById('summary-age-range').textContent = data.ageRange || '-';
    document.getElementById('summary-youth-count').textContent = data.youthCount ? `${data.youthCount} jeunes` : '-';
    
    // Organisateur
    organizer.textContent = data.organizer || 'Inconnu';
    organizer.href = data.organizerUrl && data.organizerUrl !== '#' ? data.organizerUrl : '#';
    organizer.style.pointerEvents = (data.organizerUrl && data.organizerUrl !== '#') ? 'auto' : 'none';
    
    // Lieu
    let locText = data.location || 'Inconnu';
    if (Array.isArray(data.locations) && data.locations.length > 0) {
      locText = data.locations.map(l => l.location || l.name).join(' → ');
    }
    location.textContent = locText;
    location.href = data.locationUrl && data.locationUrl !== '#' ? data.locationUrl : '#';
    location.style.pointerEvents = (data.locationUrl && data.locationUrl !== '#') ? 'auto' : 'none';

  } else {
    // Formation
    header.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
    title.textContent = data.title || 'Formation';
    subtitle.textContent = (data.type || 'Formation').toUpperCase();
    extraInfo.style.display = 'none'; // Masquer les détails d'animation
    
    // Organisateur
    organizer.textContent = data.organism || 'Inconnu';
    organizer.href = data.organismUrl && data.organismUrl !== '#' ? data.organismUrl : '#';
    organizer.style.pointerEvents = (data.organismUrl && data.organismUrl !== '#') ? 'auto' : 'none';
    
    // Lieu
    location.textContent = data.location || 'Inconnu';
    location.href = data.locationUrl && data.locationUrl !== '#' ? data.locationUrl : '#';
    location.style.pointerEvents = (data.locationUrl && data.locationUrl !== '#') ? 'auto' : 'none';
  }

  // 2. Données communes
  logo.src = data.logoPath || 'assets/img/default-logo.png';
  dateDuration.textContent = `${data.date || '?'} - ${data.duration || '?'}`;

  // 3. Afficher
  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
};

/**
 * Ferme la modale récapitulative.
 */
window.closeSummaryModal = function () {
  const modal = document.getElementById('summary-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
};

// Fermeture au clic à l'extérieur
window.addEventListener('click', function (event) {
  const modal = document.getElementById('summary-modal');
  if (event.target === modal) {
    closeSummaryModal();
  }
});
