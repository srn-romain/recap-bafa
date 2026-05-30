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
        <div class="modal-content summary-modal-content" style="max-width: 500px; padding: 0; overflow: hidden; border-radius: 15px; border: none; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; max-height: 90vh;">
            <div id="summary-header" style="padding: 20px; color: white; position: relative; flex-shrink: 0;">
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
            
            <div id="summary-body" style="padding: 25px; background: #f8fafc; overflow-y: auto; flex: 1;">
                <div class="summary-details-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                    
                    <!-- Date et Durée -->
                    <div class="summary-info-card" style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; background: #fff7ed; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #f39c12; font-size: 1.2rem;">
                            <i class="bi bi-calendar3"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Période & Durée</div>
                            <div id="summary-date-duration" style="font-size: 0.95rem; color: #1e293b; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap;">Date - Durée</div>
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

                    <!-- Comité d'entreprise -->
                    <div id="summary-ce-card" class="summary-info-card" style="background: white; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; display: none; align-items: center; gap: 15px;">
                        <div style="width: 40px; height: 40px; background: #fdf2f8; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #db2777; font-size: 1.2rem;">
                            <i class="bi bi-people"></i>
                        </div>
                        <div>
                            <div style="font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase;">Comité d'entreprise</div>
                            <div id="summary-ce" style="font-size: 0.95rem; color: #1e293b; font-weight: 500;">-</div>
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
            
            <div id="summary-footer" style="padding: 15px; background: white; border-top: 1px solid #e2e8f0; text-align: center; flex-shrink: 0;">
                <button type="button" onclick="closeSummaryModal()" style="background: #50634c; color: white; border: none; padding: 8px 25px; border-radius: 30px; font-weight: 600; cursor: pointer; font-size: 0.9rem;">Fermer</button>
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

  const isLoggedIn = window.currentUser !== null && window.userRole !== null;

  const header = document.getElementById('summary-header');
  const logo = document.getElementById('summary-logo');
  const title = document.getElementById('summary-title');
  const subtitle = document.getElementById('summary-subtitle');
  const dateDuration = document.getElementById('summary-date-duration');
  const organizer = document.getElementById('summary-organizer');
  const extraInfo = document.getElementById('summary-extra-info');

  /**
   * Retourne le <a id="summary-location"> existant, ou le recrée s'il a été
   * supprimé lors d'un précédent affichage itinérance (container.innerHTML = '').
   */
  function getOrRestoreLocationAnchor() {
    let loc = document.getElementById('summary-location');
    if (!loc) {
      const container = document.getElementById('summary-location-container');
      container.innerHTML = '';
      loc = document.createElement('a');
      loc.id = 'summary-location';
      loc.href = '#';
      loc.target = '_blank';
      loc.style.cssText = 'font-size:0.95rem;color:#1e293b;font-weight:500;display:flex;align-items:center;gap:5px;';
      container.appendChild(loc);
    }
    return loc;
  }

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
    if (Array.isArray(data.locations) && data.locations.length > 0) {
      // Itinérance : plusieurs lieux, chacun avec son propre lien
      const container = document.getElementById('summary-location-container');
      container.innerHTML = ''; // Vider le conteneur (remplace le <a> existant)
      data.locations.forEach((loc, index) => {
        const locName = loc.location || loc.name || 'Lieu inconnu';
        const locUrl = (isLoggedIn && loc.url && loc.url !== '#') ? loc.url : null;
        const el = document.createElement(locUrl ? 'a' : 'span');
        el.textContent = locName;
        el.style.fontSize = '0.95rem';
        el.style.color = '#1e293b';
        el.style.fontWeight = '500';
        el.style.display = 'inline-flex';
        el.style.alignItems = 'center';
        el.style.gap = '4px';
        if (locUrl) {
          el.href = locUrl;
          el.target = '_blank';
        } else if (loc.url && loc.url !== '#') {
           el.title = 'Connectez-vous pour voir sur Google Maps';
           el.style.cursor = 'help';
        }
        container.appendChild(el);
        if (index < data.locations.length - 1) {
          const arrow = document.createElement('span');
          arrow.textContent = ' → ';
          arrow.style.color = '#64748b';
          container.appendChild(arrow);
        }
      });
    } else {
      // Lieu unique — restaurer le <a> si besoin
      const locationAnchor = getOrRestoreLocationAnchor();
      locationAnchor.textContent = data.location || 'Inconnu';
      
      const hasValidUrl = data.locationUrl && data.locationUrl !== '#';
      if (isLoggedIn && hasValidUrl) {
          locationAnchor.href = data.locationUrl;
          locationAnchor.style.pointerEvents = 'auto';
          locationAnchor.title = 'Voir sur Google Maps';
          locationAnchor.style.cursor = 'pointer';
      } else {
          locationAnchor.href = '#';
          locationAnchor.style.pointerEvents = 'none';
          if (hasValidUrl) {
              locationAnchor.title = 'Connectez-vous pour voir sur Google Maps';
              locationAnchor.style.cursor = 'help';
              locationAnchor.style.pointerEvents = 'auto'; // On le laisse "cliquable" mais vers # pour le tooltip ? 
              // En fait non, si on veut pas qu'il soit cliquable, pointerEvents = none.
              // Mais si on veut le title, il faut pointerEvents auto ou alors mettre le title sur le parent.
          }
      }
    }

    // Comité d'entreprise
    const ceCard = document.getElementById('summary-ce-card');
    const ceText = document.getElementById('summary-ce');
    if (data.ce) {
      ceCard.style.display = 'flex';
      ceText.textContent = data.ce;
    } else {
      ceCard.style.display = 'none';
    }

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
    
    // Lieu — restaurer le <a> si besoin (cas : après une modale itinérance)
    const locationAnchor = getOrRestoreLocationAnchor();
    locationAnchor.textContent = data.location || 'Inconnu';
    
    const hasValidUrl = data.locationUrl && data.locationUrl !== '#';
    if (isLoggedIn && hasValidUrl) {
        locationAnchor.href = data.locationUrl;
        locationAnchor.style.pointerEvents = 'auto';
        locationAnchor.title = 'Voir sur Google Maps';
        locationAnchor.style.cursor = 'pointer';
    } else {
        locationAnchor.href = '#';
        locationAnchor.style.pointerEvents = 'none';
        if (hasValidUrl) {
            locationAnchor.title = 'Connectez-vous pour voir sur Google Maps';
            locationAnchor.style.cursor = 'help';
            locationAnchor.style.pointerEvents = 'auto';
        }
    }
  }

  // 2. Données communes
  logo.src = data.logoPath || 'assets/img/default-logo.png';
  
  const dateText = data.date || '?';
  const durationText = data.duration || '?';
  
  let badgeBg = '#f1f5f9';
  let badgeColor = '#475569';
  
  if (itemType === 'experience') {
    badgeBg = '#fff7ed'; // Soft orange/amber background
    badgeColor = '#d97706'; // Amber 600
  } else {
    badgeBg = '#f0fdf4'; // Soft green background
    badgeColor = '#16a34a'; // Green 600
  }

  // Calcul du badge de statut (j-XX / j+XX / en cours)
  let statusHtml = '';
  const dateStrLower = dateText.toLowerCase();
  
  if (dateStrLower.includes('venir')) {
    statusHtml = `<span style="color: #cbd5e1; margin: 0 4px;">-</span><span class="status-badge" style="display: inline-flex; align-items: center; background-color: #e8f8f0; color: #15803d; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(0,0,0,0.03); vertical-align: middle;">À venir</span>`;
  } else {
    const parsedStartDate = typeof window.parseFrenchDate === 'function' ? window.parseFrenchDate(dateText) : new Date(dateText);
    
    if (parsedStartDate && !isNaN(parsedStartDate.getTime())) {
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      
      const startMidnight = new Date(parsedStartDate);
      startMidnight.setHours(0, 0, 0, 0);
      
      // Calcul de la date de fin
      let endMidnight = new Date(startMidnight);
      
      // Vérifier si c'est une année périodique (ex: "septembre 2023 - juin 2024")
      const academicYearMatch = dateStrLower.match(/septembre\s+(\d{4})\s*[-–]\s*juin\s+(\d{4})/i);
      if (academicYearMatch) {
        endMidnight = new Date(parseInt(academicYearMatch[2], 10), 5, 30); // 30 Juin
      } else {
        let days = 0;
        if (typeof window.extractDays === 'function') {
          days = window.extractDays(durationText);
        } else {
          const durationStrLower = durationText.toLowerCase();
          const dayMatch = durationStrLower.match(/(\d+)/);
          days = dayMatch ? parseInt(dayMatch[1], 10) : 0;
        }
        
        if (days > 1) {
          endMidnight.setDate(endMidnight.getDate() + days - 1);
        } else if (days === 0) {
          // Par défaut, fin du mois
          endMidnight.setMonth(endMidnight.getMonth() + 1);
          endMidnight.setDate(0);
        }
      }
      endMidnight.setHours(0, 0, 0, 0);
      
      let statusBg = '';
      let statusColor = '';
      let statusText = '';
      
      if (todayMidnight < startMidnight) {
        // Futur : J-XX (Vert)
        const diffTime = startMidnight - todayMidnight;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        statusBg = '#e8f8f0'; // Soft green background
        statusColor = '#15803d'; // Green 700
        statusText = `J-${diffDays}`;
      } else if (todayMidnight > endMidnight) {
        // Passé : J+XX (Rouge)
        const diffTime = todayMidnight - endMidnight;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        statusBg = '#fee2e2'; // Soft red background
        statusColor = '#b91c1c'; // Red 700
        statusText = `J+${diffDays}`;
      } else {
        // En cours : En cours (Indigo/Bleu)
        statusBg = '#e0e7ff'; // Soft indigo background
        statusColor = '#4338ca'; // Indigo 700
        statusText = 'En cours';
      }
      
      statusHtml = `<span style="color: #cbd5e1; margin: 0 4px;">-</span><span class="status-badge" style="display: inline-flex; align-items: center; background-color: ${statusBg}; color: ${statusColor}; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(0,0,0,0.03); vertical-align: middle;">${statusText}</span>`;
    }
  }
  
  dateDuration.innerHTML = `<span>${dateText}</span><span style="color: #cbd5e1; margin: 0 4px;">-</span><span class="duration-badge" style="display: inline-flex; align-items: center; background-color: ${badgeBg}; color: ${badgeColor}; padding: 2px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600; border: 1px solid rgba(0,0,0,0.03); vertical-align: middle;">${durationText}</span>${statusHtml}`;

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
