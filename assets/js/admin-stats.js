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
        adminDataCache.users = usersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(u => u.id !== 'iaoZlSgBXUc6eYVHaZMy6hz4tVI3' && u.id !== '5DP6faC4Y8ce6K3x07aC2qHjflq2'); // Exclure les comptes de test/démo

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

    // 10 dernières connexions (hors admin actuel)
    const currentUid = window.currentUser ? window.currentUser.uid : null;

    // Filtrage et tri
    const lastLogins = adminDataCache.users
        .filter(u => u.id !== currentUid && u.lastLogin)
        .sort((a, b) => {
            const dateA = a.lastLogin.seconds || 0;
            const dateB = b.lastLogin.seconds || 0;
            return dateB - dateA;
        })
        .slice(0, 10);

    const listContainer = document.getElementById('adminStatLastLoginList');
    if (listContainer) {
        listContainer.innerHTML = '';

        if (lastLogins.length === 0) {
            listContainer.innerHTML = '<p style="margin: 0; color: #6b7280; font-style: italic; text-align: center; width: 100%;">Aucun historique récent.</p>';
        } else {
            lastLogins.forEach((u, index) => {
                const date = u.lastLogin.toDate ? u.lastLogin.toDate() : new Date(u.lastLogin.seconds * 1000);
                const baseName = u.displayName || `${u.firstname || ''} ${u.lastname || ''}`.trim();
                const email = u.email || '';
                const displayName = baseName && baseName !== email ? `${baseName} (${email})` : email;

                const item = document.createElement('div');
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                item.style.gap = '20px';
                item.style.padding = '6px 10px';
                item.style.background = '#f9fafb';
                item.style.borderRadius = '4px';
                item.style.border = '1px solid #f3f4f6';
                item.style.minWidth = 'max-content'; // Force la largeur pour le scroll horizontal
                item.innerHTML = `
                    <span style="font-weight: 600; color: #374151; font-size: 0.8rem; white-space: nowrap;">
                        <span style="color: #9ca3af; font-size: 0.7rem; margin-right: 8px;">#${index + 1}</span>${displayName}
                    </span>
                    <span style="color: #6b7280; font-size: 0.75rem; white-space: nowrap; font-family: monospace;">${date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                `;
                listContainer.appendChild(item);
            });
        }
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

    // 2. Récupérer aussi les collections à la racine (legacy ou standalone)
    try {
        const [rootExpSnap, rootFormSnap] = await Promise.all([
            window.firebaseDb.collection('experiences').get(),
            window.firebaseDb.collection('formations').get()
        ]);

        rootExpSnap.docs.forEach(doc => {
            // Éviter les doublons si déjà présents via les sous-collections
            if (!adminDataCache.experiences.some(e => e.id === doc.id)) {
                adminDataCache.experiences.push({
                    id: doc.id,
                    data: doc.data(),
                    userId: 'root',
                    userName: 'Système / Legacy'
                });
            }
        });

        rootFormSnap.docs.forEach(doc => {
            if (!adminDataCache.formations.some(f => f.id === doc.id)) {
                adminDataCache.formations.push({
                    id: doc.id,
                    data: doc.data(),
                    userId: 'root',
                    userName: 'Système / Legacy'
                });
            }
        });
    } catch (err) {
        console.warn("Erreur lors du chargement des collections racine:", err);
    }
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
        if (!durationStr) return 0;

        // Cas spécial "Tous les mercredis" - Identique à main.js
        if (durationStr.includes('mercredis') || durationStr.includes('samedis')) {
            return 36;
        }

        const match = durationStr.match(/(\d+)\s*jour/i);
        if (match) return parseInt(match[1], 10);

        // Fallback: chercher juste un nombre s'il n'y a pas "jour" (compatibilité)
        const simpleMatch = durationStr.match(/(\d+)/);
        return simpleMatch ? parseInt(simpleMatch[1], 10) : 0;
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
    
    // Mettre à jour les stats d'activité (7j, 30j, 1an)
    updateActivityStats();

    // Mettre à jour le top des organismes
    updateOrganismStats();
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

    // 1. Cache local session (RAM)
    if (!window._geoCache) window._geoCache = {};
    if (window._geoCache[locationName]) return window._geoCache[locationName];

    // Clé sécurisée pour Firestore (ID sans caractères interdits)
    // On utilise un hash simple ou un btoa nettoyé
    let safeId;
    try {
        safeId = btoa(unescape(encodeURIComponent(locationName))).replace(/[\/\+=]/g, '_').substring(0, 50);
    } catch(e) {
        safeId = locationName.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
    }

    // 2. Cache global Firestore (pour éviter les 429 répétitifs sur les lieux communs)
    try {
        if (window.firebaseDb) {
            const cacheDoc = await window.firebaseDb.collection('geocoding_cache').doc(safeId).get();
            if (cacheDoc.exists) {
                const coords = cacheDoc.data();
                window._geoCache[locationName] = coords;
                return coords;
            }
        }
    } catch (e) {
        console.warn("Erreur lecture cache géo Firestore:", e);
    }

    // 3. Appel API Nominatim (OpenStreetMap)
    try {
        let query = locationName;
        // Détection d'un numéro de département pour précision
        const deptRegex = /\(\d{2,3}\)|\s\d{2,3}$/;
        if (deptRegex.test(locationName) && !query.toLowerCase().includes('france')) {
            query += ", France";
        }

        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        
        if (resp.status === 429) {
            console.error("Rate limit Nominatim (429). Trop de requêtes.");
            return null;
        }

        const results = await resp.json();

        if (results && results.length > 0) {
            const coords = { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
            
            // Mise à jour cache RAM
            window._geoCache[locationName] = coords;

            // Mise à jour cache Firestore (non bloquant)
            if (window.firebaseDb) {
                window.firebaseDb.collection('geocoding_cache').doc(safeId).set({
                    ...coords,
                    name: locationName,
                    updatedAt: new Date()
                }).catch(() => {});
            }

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

        // Utiliser les tuiles OpenStreetMap en français
        L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(adminMap);

        // Ajouter les marqueurs
        let markerCount = 0;
        adminMarkers = [];

        // Pour accélérer : On se base UNIQUEMENT sur le nom du lieu (Nominatim avec cache)
        // On lance les requêtes en parallèle par petits lots pour ne pas bloquer mais aller plus vite que séquentiel

        // Dédoublonnage des lieux pour éviter de géo-coder 50 fois "Paris"
        const uniqueLocations = {}; // { "Paris": [exp1, exp2], "Lyon": [exp3] }

        adminDataCache.experiences.forEach(exp => {
            // Ignore le compte test pour l'affichage sur la carte
            if (exp.userId === '60KsVndcHsUYhxh6ErSWgHbjnz63') return;

            const locName = exp.data.location ? exp.data.location.trim() : null;
            if (locName && locName.length > 2) {
                if (!uniqueLocations[locName]) uniqueLocations[locName] = [];
                uniqueLocations[locName].push(exp);
            }
        });

        const locationNames = Object.keys(uniqueLocations);
        if (statusEl) statusEl.textContent = `Traitement de ${locationNames.length} lieux uniques...`;

        // Traitement par lots pour respecter rate limits
        for (let i = 0; i < locationNames.length; i++) {
            const locName = locationNames[i];
            let coords = null;
            const expsAtLoc = uniqueLocations[locName];

            // 1. Tenter d'extraire les coordonnées de l'URL Google Maps si elle existe
            const firstExpWithUrl = expsAtLoc.find(e => e.data && e.data.locationUrl);
            if (firstExpWithUrl) {
                coords = extractCoordsFromUrl(firstExpWithUrl.data.locationUrl);
            }

            // 2. Sinon, utiliser le géo-codage OSM Nominatim (avec cache session)
            if (!coords) {
                if (window._geoCache && window._geoCache[locName]) {
                    coords = window._geoCache[locName];
                } else {
                    coords = await geocodeLocation(locName);
                    if (coords) await sleep(1200); // 1.2s pause pour respecter Nominatim (1 req/s)
                }
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

                const markerIcon = L.divIcon({
                    html: `<div style="background-color: #dc2626; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
                    className: 'custom-marker-icon',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6],
                    popupAnchor: [0, -6]
                });

                const marker = L.marker([coords.lat, coords.lng], { icon: markerIcon }).bindPopup(popupContent);
                adminMarkers.push(marker);
                marker.addTo(adminMap);
                markerCount += expsAtLoc.length;
                console.log(`Marqueur ajouté : ${locName} (${coords.lat}, ${coords.lng})`);
            } else {
                console.warn(`Lieu non localisé : ${locName}`);
            }

            if (statusEl && (i % 2 === 0 || i === locationNames.length - 1)) {
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

/**
 * Calcule et affiche les statistiques d'activité (connexions et ajouts)
 */
function updateActivityStats() {
    const now = new Date();
    const ms7d = 7 * 24 * 60 * 60 * 1000;
    const ms30d = 30 * 24 * 60 * 60 * 1000;
    const ms1y = 365.25 * 24 * 60 * 60 * 1000; // Un an glissant

    const stats = {
        connexions: { '7d': 0, '30d': 0, '1y': 0 },
        ajouts: { '7d': 0, '30d': 0, '1y': 0 },
        connexionsPrev: { '7d': 0, '30d': 0, '1y': 0 },
        ajoutsPrev: { '7d': 0, '30d': 0, '1y': 0 }
    };

    const safeDate = (val) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val.toDate === 'function') return val.toDate();
        if (val.seconds !== undefined) return new Date(val.seconds * 1000);
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    // 1. Connexions (estimées par unique lastLogin dans la période)
    adminDataCache.users.forEach(u => {
        const lastLoginDate = safeDate(u.lastLogin);
        if (!lastLoginDate) return;
        const diff = now - lastLoginDate;

        // Actuel
        if (diff <= ms7d) stats.connexions['7d']++;
        if (diff <= ms30d) stats.connexions['30d']++;
        if (diff <= ms1y) stats.connexions['1y']++;

        // Précédent (pour la tendance)
        if (diff > ms7d && diff <= 2 * ms7d) stats.connexionsPrev['7d']++;
        if (diff > ms30d && diff <= 2 * ms30d) stats.connexionsPrev['30d']++;
        if (diff > ms1y && diff <= 2 * ms1y) stats.connexionsPrev['1y']++;
    });

    // 2. Ajouts de données (expériences et formations)
    const allData = [...adminDataCache.experiences, ...adminDataCache.formations];
    allData.forEach(item => {
        // createdAt peut être absent pour les anciennes données, on replie sur updatedAt
        const createdDate = safeDate(item.data.createdAt || item.data.updatedAt);
        if (!createdDate) return;
        
        const diff = now - createdDate;

        // Actuel
        if (diff <= ms7d) stats.ajouts['7d']++;
        if (diff <= ms30d) stats.ajouts['30d']++;
        if (diff <= ms1y) stats.ajouts['1y']++;

        // Précédent
        if (diff > ms7d && diff <= 2 * ms7d) stats.ajoutsPrev['7d']++;
        if (diff > ms30d && diff <= 2 * ms30d) stats.ajoutsPrev['30d']++;
        if (diff > ms1y && diff <= 2 * ms1y) stats.ajoutsPrev['1y']++;
    });

    const setTrend = (id, current, prev) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (current > prev) {
            el.innerHTML = '<i class="bi bi-arrow-up-short"></i>';
            el.style.color = '#16a34a';
        } else if (current < prev) {
            el.innerHTML = '<i class="bi bi-arrow-down-short"></i>';
            el.style.color = '#dc2626';
        } else {
            el.innerHTML = '<i class="bi bi-dash"></i>';
            el.style.color = '#9ca3af';
        }
    };

    // Mise à jour de l'UI Valeurs
    setText('statConnexions7d', stats.connexions['7d']);
    setText('statConnexions30d', stats.connexions['30d']);
    setText('statConnexions1y', stats.connexions['1y']);
    setText('statAjouts7d', stats.ajouts['7d']);
    setText('statAjouts30d', stats.ajouts['30d']);
    setText('statAjouts1y', stats.ajouts['1y']);

    // Mise à jour de l'UI Tendances
    setTrend('trendConnexions7d', stats.connexions['7d'], stats.connexionsPrev['7d']);
    setTrend('trendConnexions30d', stats.connexions['30d'], stats.connexionsPrev['30d']);
    setTrend('trendConnexions1y', stats.connexions['1y'], stats.connexionsPrev['1y']);
    setTrend('trendAjouts7d', stats.ajouts['7d'], stats.ajoutsPrev['7d']);
    setTrend('trendAjouts30d', stats.ajouts['30d'], stats.ajoutsPrev['30d']);
    setTrend('trendAjouts1y', stats.ajouts['1y'], stats.ajoutsPrev['1y']);
}

/**
 * Calcule et affiche le classement des organismes les plus utilisés
 */
function updateOrganismStats() {
    const container = document.getElementById('adminTopOrganisms');
    if (!container) return;

    const orgCounts = {};
    const allData = [...adminDataCache.experiences, ...adminDataCache.formations];
    let totalItems = 0;

    allData.forEach(item => {
        let name = item.data.organizer || item.data.organism;
        if (!name) return;

        // Normalisation simple : enlever le département "(75)"
        name = name.replace(/\s*\(\d{2,3}[AB]?\)\s*$/, '').trim();
        if (!name) return;

        orgCounts[name] = (orgCounts[name] || 0) + 1;
        totalItems++;
    });

    if (totalItems === 0) {
        container.innerHTML = '<p style="margin: 0; color: #6b7280; font-style: italic; text-align: center; width: 100%;">Aucune donnée disponible.</p>';
        return;
    }

    // Trier les organismes par occurrence décroissante
    const sortedOrgs = Object.entries(orgCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Prendre les 5 premiers

    const colors = ['#7c3aed', '#2563eb', '#16a34a', '#db2777', '#ea580c'];

    container.innerHTML = '';
    sortedOrgs.forEach(([name, count], index) => {
        const percentage = ((count / totalItems) * 100).toFixed(1);
        const color = colors[index % colors.length];

        const row = document.createElement('div');
        row.style.width = '100%';
        row.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 4px;">
                <span style="font-weight: 600; color: #374151;">${name}</span>
                <span style="color: #6b7280;">${count} (${percentage}%)</span>
            </div>
            <div style="width: 100%; height: 8px; background: #f3f4f6; border-radius: 4px; overflow: hidden;">
                <div style="width: ${percentage}%; height: 100%; background: ${color}; border-radius: 4px;"></div>
            </div>
        `;
        container.appendChild(row);
    });
}

// Helpers
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}
