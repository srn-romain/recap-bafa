/**
 * Script dédié aux statistiques de l'administrateur
 * Gère le calcul et l'affichage du tableau de bord global avec carte et filtres
 */

let adminDataCache = {
    users: [],
    experiences: [], // Tableau d'objets { data, userId, userName }
    formations: []
};

let adminMap = null;
let adminMarkers = [];

async function loadAdminStats() {
    // Sécurité : n'exécuter que si l'utilisateur est admin
    if (!window.firebaseDb || window.userRole !== 'admin') return;

    try {
        console.log("Chargement des données globales (mode Admin)...");

        const usersSnapshot = await window.firebaseDb.collection('users').get();
        adminDataCache.users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 1. Stats de base (Utilisateurs)
        updateUserStats();

        // 2. Charger toutes les sous-collections
        await fetchAllSubCollections();

        // 3. Afficher les statistiques par défaut (Filtre "Tout")
        updateAdminStatsDisplay('all');

        // 4. Initialiser la carte
        initAdminMap();

    } catch (error) {
        console.error("Erreur critique lors du chargement des stats admin:", error);
    }
}

/**
 * Met à jour les statistiques relatives aux comptes utilisateurs
 */
function updateUserStats() {
    const totalUsers = adminDataCache.users.length;
    const unlistedProfiles = adminDataCache.users.filter(u => u.publiclyVisible === false).length;

    setText('adminStatTotalUsers', totalUsers);
    setText('adminStatUnlistedProfiles', unlistedProfiles);

    // Dernière connexion globale
    const sortedByLogin = [...adminDataCache.users].sort((a, b) => {
        const dateA = a.lastLogin ? (a.lastLogin.seconds || 0) : 0;
        const dateB = b.lastLogin ? (b.lastLogin.seconds || 0) : 0;
        return dateB - dateA;
    });

    if (sortedByLogin.length > 0 && sortedByLogin[0].lastLogin) {
        const u = sortedByLogin[0];
        const date = u.lastLogin.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin.seconds * 1000);
        const name = u.displayName || `${u.firstname || ''} ${u.lastname || ''}`.trim() || u.email;
        setText('adminStatLastLogin', `${name} - ${date.toLocaleString('fr-FR')}`);
    }
}

/**
 * Récupère toutes les expériences et formations de tous les utilisateurs
 */
async function fetchAllSubCollections() {
    adminDataCache.experiences = [];
    adminDataCache.formations = [];

    const promises = adminDataCache.users.map(async (user) => {
        try {
            const [expSnap, formSnap] = await Promise.all([
                window.firebaseDb.collection('users').doc(user.id).collection('experiences').get(),
                window.firebaseDb.collection('users').doc(user.id).collection('formations').get()
            ]);

            const userName = user.displayName || `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Anonyme';

            expSnap.docs.forEach(doc => {
                adminDataCache.experiences.push({
                    id: doc.id,
                    data: doc.data(),
                    userId: user.id,
                    userName: userName
                });
            });

            formSnap.docs.forEach(doc => {
                adminDataCache.formations.push({
                    id: doc.id,
                    data: doc.data(),
                    userId: user.id,
                    userName: userName
                });
            });
        } catch (err) {
            console.warn(`Erreur pour l'user ${user.id}:`, err);
        }
    });

    await Promise.all(promises);
}

/**
 * Filtre et affiche les statistiques selon le mode (all ou past)
 * @param {string} filterMode 'all' | 'past'
 */
function updateAdminStatsDisplay(filterMode) {
    const now = new Date();
    const currentSortable = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

    let filteredExps = adminDataCache.experiences;

    if (filterMode === 'past') {
        filteredExps = adminDataCache.experiences.filter(exp => {
            const date = exp.data.date;
            if (!date) return true;
            const sortable = typeof window.frenchTextToMonth === 'function' ? window.frenchTextToMonth(date) : '';
            return sortable && sortable <= currentSortable;
        });
    }

    // Calculs
    const totalExps = filteredExps.length;
    const totalForms = adminDataCache.formations.length;

    // Utilisateurs actifs (ayant au moins une donnée dans le filtre actuel)
    const activeUserIds = new Set();
    filteredExps.forEach(e => activeUserIds.add(e.userId));
    if (filterMode === 'all') {
        adminDataCache.formations.forEach(f => activeUserIds.add(f.userId));
    }

    let totalDays = 0;
    let upcomingExpsCount = 0;
    let pastExpsCount = 0;
    let upcomingFormsCount = 0;
    let pastFormsCount = 0;
    const orgs = new Set();

    // Nettoyage des noms pour éviter les doublons (ex: L'UFCV vs UFCV)
    const cleanOrg = (n) => {
        if (!n) return "";
        return n.trim().toLowerCase()
            .replace(/^(le|la|les|l'|d')\s*/i, "")
            .replace(/\s+/g, " ");
    };

    filteredExps.forEach(exp => {
        const d = exp.data;
        totalDays += (typeof window.extractDays === 'function') ? window.extractDays(d.duration) : 0;
        if (d.organizer) orgs.add(cleanOrg(d.organizer));

        const sortable = (typeof window.frenchTextToMonth === 'function') ? window.frenchTextToMonth(d.date) : '';
        if (sortable) {
            if (sortable > currentSortable) upcomingExpsCount++;
            else pastExpsCount++;
        }
    });

    adminDataCache.formations.forEach(f => {
        const d = f.data;
        const sortable = (typeof window.frenchTextToMonth === 'function') ? window.frenchTextToMonth(d.date) : '';
        const isPast = sortable && sortable <= currentSortable;

        if (filterMode === 'all' || isPast) {
            totalDays += (typeof window.extractDays === 'function') ? window.extractDays(d.duration) : 0;
            if (d.organism) orgs.add(cleanOrg(d.organism));
        }

        if (sortable) {
            if (sortable > currentSortable) upcomingFormsCount++;
            else pastFormsCount++;
        }
    });

    // Update UI
    setText('adminStatActiveUsers', activeUserIds.size);
    setText('adminStatTotalExps', totalExps);
    setText('adminStatTotalForms', totalForms);
    setText('adminStatUpcomingExps', upcomingExpsCount);
    setText('adminStatPastExps', pastExpsCount);
    setText('adminStatUpcomingForms', upcomingFormsCount);
    setText('adminStatPastForms', pastFormsCount);
    setText('adminStatTotalDays', totalDays);
    setText('adminStatTotalOrgs', orgs.size);

    // Mettre à jour les boutons de filtre
    updateFilterButtons(filterMode);
}

/**
 * Gère le changement de filtre depuis l'UI
 */
window.updateAdminStatsFilter = function (mode) {
    updateAdminStatsDisplay(mode);
    // Optionnel : filtrer la carte aussi ? 
    // Pour l'instant on garde tous les points sur la carte pour une vision globale
};

function updateFilterButtons(activeMode) {
    const btnAll = document.getElementById('btnAdminFilterAll');
    const btnPast = document.getElementById('btnAdminFilterPast');

    if (!btnAll || !btnPast) return;

    if (activeMode === 'all') {
        btnAll.style.backgroundColor = '#dc2626';
        btnAll.style.color = 'white';
        btnPast.style.backgroundColor = 'white';
        btnPast.style.color = '#dc2626';
    } else {
        btnPast.style.backgroundColor = '#dc2626';
        btnPast.style.color = 'white';
        btnAll.style.backgroundColor = 'white';
        btnAll.style.color = '#dc2626';
    }
}

/**
 * Initialise la carte Leaflet
 */
function initAdminMap() {
    const mapContainer = document.getElementById('adminRacesMap');
    if (!mapContainer || adminMap) return;

    const statusEl = document.getElementById('mapLoadingStatus');

    try {
        // Centrer sur la France par défaut
        adminMap = L.map('adminRacesMap').setView([46.603354, 1.888334], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(adminMap);

        // Ajouter les marqueurs
        let markerCount = 0;
        adminMarkers = [];

        adminDataCache.experiences.forEach(exp => {
            const d = exp.data;
            let coords = null;

            // 1. Tenter d'extraire de locationUrl (Google Maps)
            if (d.locationUrl) {
                coords = extractCoordsFromUrl(d.locationUrl);
            }

            // 2. Tenter d'extraire des lieux d'itinérance
            if (!coords && d.itineraryLocations && d.itineraryLocations.length > 0) {
                for (const loc of d.itineraryLocations) {
                    if (loc.url) {
                        coords = extractCoordsFromUrl(loc.url);
                        if (coords) break;
                    }
                }
            }

            if (coords) {
                const marker = L.marker([coords.lat, coords.lng])
                    .bindPopup(`
                        <div style="font-family: Arial; font-size: 13px;">
                            <strong style="color: #991b1b;">${exp.userName}</strong><br>
                            <b>${d.organizer || 'Organisme inconnu'}</b><br>
                            <span style="color: #666;">${d.date} - ${d.location}</span><br>
                            <i>${d.position || ''}</i>
                        </div>
                    `)
                    .addTo(adminMap);
                adminMarkers.push(marker);
                markerCount++;
            }
        });

        if (statusEl) {
            statusEl.textContent = `${markerCount} lieu(x) affiché(s) sur la carte.`;

            // Notification si des liens courts sont présents (on ne peut pas extraire les coords sans API)
            const hasShortLinks = adminDataCache.experiences.some(e => e.data.locationUrl && e.data.locationUrl.includes('maps.app.goo.gl'));
            if (hasShortLinks) {
                statusEl.innerHTML += "<br><span style='color: #d97706; font-size: 0.7rem;'><i class='bi bi-exclamation-triangle'></i> Certains liens 'maps.app.goo.gl' ne peuvent pas être affichés (utilisez l'URL complète).</span>";
            }
        }

        // Si on a des marqueurs, ajuster la vue
        if (adminMarkers.length > 0) {
            const group = new L.featureGroup(adminMarkers);
            // Attendre un peu que le DOM soit stable pour le calcul des domaines (bounds)
            setTimeout(() => {
                adminMap.invalidateSize();
                adminMap.fitBounds(group.getBounds().pad(0.1));
            }, 500);
        } else {
            // Forcer le redimensionnement même sans marqueurs
            setTimeout(() => adminMap.invalidateSize(), 500);
        }

    } catch (err) {
        console.error("Erreur Leaflet:", err);
        if (statusEl) statusEl.textContent = "Erreur lors du chargement de la carte.";
    }
}

/**
 * Tente d'extraire latitude et longitude d'une URL Google Maps
 * @param {string} url 
 * @returns { {lat: number, lng: number} | null }
 */
function extractCoordsFromUrl(url) {
    if (!url) return null;

    // Pattern 1: @lat,lng,z (URLs classiques Google Maps)
    const pattern1 = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match1 = url.match(pattern1);
    if (match1) {
        return { lat: parseFloat(match1[1]), lng: parseFloat(match1[2]) };
    }

    // Pattern 2: query=lat,lng ou q=lat,lng
    const pattern2 = /[?&](query|q)=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match2 = url.match(pattern2);
    if (match2) {
        return { lat: parseFloat(match2[2]), lng: parseFloat(match2[3]) };
    }

    // Pattern 3: !3d (lat) et !4d (lng) (URLs de partage Bureau)
    const pattern3_lat = /!3d(-?\d+\.\d+)/;
    const pattern3_lng = /!4d(-?\d+\.\d+)/;
    const matchSum_lat = url.match(pattern3_lat);
    const matchSum_lng = url.match(pattern3_lng);
    if (matchSum_lat && matchSum_lng) {
        return { lat: parseFloat(matchSum_lat[1]), lng: parseFloat(matchSum_lng[1]) };
    }

    // Pattern 4: ll=lat,lng
    const pattern4 = /ll=(-?\d+\.\d+),(-?\d+\.\d+)/;
    const match4 = url.match(pattern4);
    if (match4) {
        return { lat: parseFloat(match4[1]), lng: parseFloat(match4[2]) };
    }

    return null;
}

// Helpers
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
