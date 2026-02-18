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

        // 4. Initialiser la carte (non-bloquant)
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

    // Fonction locale pour extraire le nombre de jours si window.extractDays n'est pas dispo
    const getDays = (durationStr) => {
        if (typeof window.extractDays === 'function') return window.extractDays(durationStr);
        if (!durationStr) return 0;
        const match = durationStr.match(/(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    filteredExps.forEach(exp => {
        const d = exp.data;
        totalDays += getDays(d.duration);
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
            totalDays += getDays(d.duration);
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

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function geocodeLocation(locationName) {
    if (!locationName || locationName.length < 3) return null;

    // Cache local session
    if (!window._geoCache) window._geoCache = {};
    if (window._geoCache[locationName]) return window._geoCache[locationName];

    try {
        let query = locationName;
        // Détection d'un numéro de département : "Nice (06)" ou "Lyon 69"
        // Regex cherche 2 ou 3 chiffres entre parenthèses OU à la fin du string
        const deptRegex = /\(\d{2,3}\)|\s\d{2,3}$/;

        if (deptRegex.test(locationName)) {
            // Si département présent, on force France pour éviter les homonymes (Nice USA vs Nice 06)
            if (!query.toLowerCase().includes('france')) {
                query += ", France";
            }
        }
        // Sinon, on laisse tel quel pour permettre les lieux étrangers (ex: "Londres", "New York")

        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const results = await resp.json();

        if (results && results.length > 0) {
            const coords = { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
            window._geoCache[locationName] = coords;
            return coords;
        }
    } catch (e) {
        console.warn("Échec géo-codage:", locationName, e);
    }
    return null;
}

async function initAdminMap() {
    const mapContainer = document.getElementById('adminRacesMap');
    if (!mapContainer) return;

    // Toujours détruire la carte existante pour éviter les doublons/vieux marqueurs
    if (adminMap) {
        adminMap.remove();
        adminMap = null;
    }

    const statusEl = document.getElementById('mapLoadingStatus');

    try {
        // Centrer sur la France par défaut
        adminMap = L.map('adminRacesMap').setView([46.603354, 1.888334], 5);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri'
        }).addTo(adminMap);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}').addTo(adminMap);

        // Ajouter les marqueurs
        let markerCount = 0;
        adminMarkers = [];

        // Pour accélérer : On se base UNIQUEMENT sur le nom du lieu (Nominatim avec cache)
        // On lance les requêtes en parallèle par petits lots pour ne pas bloquer mais aller plus vite que séquentiel

        // Dédoublonnage des lieux pour éviter de géo-coder 50 fois "Paris"
        const uniqueLocations = {}; // { "Paris": [exp1, exp2], "Lyon": [exp3] }

        adminDataCache.experiences.forEach(exp => {
            const locName = exp.data.location ? exp.data.location.trim() : null;
            if (locName && locName.length > 2) {
                if (!uniqueLocations[locName]) uniqueLocations[locName] = [];
                uniqueLocations[locName].push(exp);
            }
        });

        const locationNames = Object.keys(uniqueLocations);
        if (statusEl) statusEl.textContent = `Traitement de ${locationNames.length} lieux uniques...`;

        // Traitement par lots de 5 pour respecter rate limits (1 req/s pour Nominatim officiellement, mais on peut tenter un peu plus agressif ou cache)
        for (let i = 0; i < locationNames.length; i++) {
            const locName = locationNames[i];
            let coords = null;

            // Vérif cache session
            if (window._geoCache && window._geoCache[locName]) {
                coords = window._geoCache[locName];
            } else {
                // Appel API
                coords = await geocodeLocation(locName);
                if (coords) await sleep(600); // 600ms pause min entre appels API
            }

            if (coords) {
                // Ajouter un marqueur pour chaque expérience à ce lieu (légèrement décalé si besoin ou popup groupé)
                // Ici on groupe tout dans une seule popup liste si plusieurs
                const expsAtLoc = uniqueLocations[locName];

                let popupContent = `<div style="font-family: Arial, sans-serif; font-size: 13px; max-height:200px; overflow-y:auto;">
                    <strong style="font-size: 1.1em; color: #1f2937; display:block; margin-bottom:5px;">${locName}</strong>`;

                expsAtLoc.forEach(exp => {
                    popupContent += `
                    <div style="border-top: 1px solid #eee; padding: 6px 0;">
                        <div style="display: flex; align-items: center;">
                            <i class="bi bi-person-fill" style="color: #dc2626; margin-right: 5px;"></i>
                            <strong>${exp.userName}</strong>
                        </div>
                        <div style="color: #666; font-size: 0.9em; margin-left: 18px;">
                            ${exp.data.date}
                        </div>
                    </div>`;
                });
                popupContent += `</div>`;

                const marker = L.marker([coords.lat, coords.lng]).bindPopup(popupContent);
                adminMarkers.push(marker);
                marker.addTo(adminMap);
                markerCount += expsAtLoc.length;
            }

            if (statusEl && i % 2 === 0) {
                statusEl.textContent = `Chargement carte... (${Math.round((i / locationNames.length) * 100)}%)`;
            }
        }

        if (statusEl) {
            statusEl.textContent = `${markerCount} expériences affichées sur ${adminMarkers.length} lieux.`;
        }

        // Ajuster la vue
        if (adminMarkers.length > 0) {
            const group = new L.featureGroup(adminMarkers);
            setTimeout(() => {
                adminMap.invalidateSize();
                adminMap.fitBounds(group.getBounds().pad(0.1));
            }, 500);
        } else {
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
