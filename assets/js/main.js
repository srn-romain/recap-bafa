/*--------------------------------------------------------------
# Numéroter les lignes d'un tableau
--------------------------------------------------------------*/
function setActiveTab(clickedTab, tableId) {
  let tabs = document.querySelectorAll(`.tabs .tab`);

  tabs.forEach(tab => {
    if (tab.parentElement.nextElementSibling?.querySelector(`#${tableId}`)) {
      tab.classList.remove("active"); // Retire la classe active des onglets liés au tableau
    }
  });

  clickedTab.classList.add("active"); // Ajoute la classe active à l'onglet cliqué
}

// Associer les onglets avec leur tableau respectif
document.querySelectorAll(".tab").forEach(tab => {
  tab.addEventListener("click", function () {
    let type = this.getAttribute("onclick").match(/'([^']+)'/)[1];
    let tableId = this.getAttribute("onclick").match(/'([^']+)'/g)[1].replace(/'/g, "");

    filterTable(type, tableId);
    setActiveTab(this, tableId);
  });
});

// Initialisation
window.onload = function () {
  filterTable('all', 'table-experiences');
  filterTable('all', 'table-formations');
};

// Fonction pour remplir les numéros dans un tableau spécifique
function remplirNum(table) {
  const cells = table.querySelectorAll('.num'); // Sélectionne les cellules "num" du tableau concerné
  const visibleRows = Array.from(cells).filter(cell => cell.closest('tr').style.display !== 'none');

  // Remplir chaque cellule avec un numéro en partant du bas
  const totalRows = visibleRows.length;
  visibleRows.forEach((cell, index) => {
    cell.textContent = totalRows - index;
  });
}

/*--------------------------------------------------------------
# Back to top button
--------------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", function () {
  let backToTopButton = document.querySelector(".back-to-top");

  window.addEventListener("scroll", function () {
    if (window.scrollY > 200) { // Afficher après 200px de défilement
      backToTopButton.classList.add("active");
    } else {
      backToTopButton.classList.remove("active");
    }
  });

  // Ajoute un effet de retour en haut
  backToTopButton.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/*--------------------------------------------------------------
# Statistiques
--------------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", function () {
  // Attendre que le DOM soit chargé pour calculer les statistiques
  setTimeout(calculateAllStatistics, 500);
});

// Fonction principale pour calculer toutes les statistiques
function calculateAllStatistics() {
  // Calculer les statistiques des expériences
  calculateExperienceStatistics();

  // Calculer les statistiques des tranches d'âges (qui font partie des expériences)
  calculateAgeGroupStatistics();

  // Calculer les statistiques des formations
  calculateFormationStatistics();

  // Masquer la rubrique principale si aucune sous-section n'est visible
  const expSection = document.getElementById('stats-section-experiences');
  const formSection = document.getElementById('stats-section-formations');
  const mainTitle = document.getElementById('statistiques');
  const container = document.querySelector('.stats-container')?.parentElement;

  const hasExperiences = expSection && expSection.style.display !== 'none';
  const hasFormations = formSection && formSection.style.display !== 'none';

  if (!hasExperiences && !hasFormations) {
    if (mainTitle) mainTitle.style.display = 'none';
    if (container) container.style.display = 'none';
  } else {
    if (mainTitle) mainTitle.style.display = 'block';
    if (container) container.style.display = 'block';
  }

  // Mettre à jour la visibilité des liens de la navbar
  if (typeof window.updateNavbarLinksVisibility === 'function') {
    window.updateNavbarLinksVisibility();
  }
}

// Fonction utilitaire pour mettre à jour une statistique et masquer sa phrase si la valeur est 0
function updateStatWithVisibility(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value;
  const sentence = element.closest('.stat-sentence');
  if (sentence) {
    // Si la valeur est 0 (nombre ou chaîne), on masque le paragraphe parent
    if (value === 0 || value === '0' || value === '0.0' || value === 0.0) {
      sentence.style.display = 'none';
    } else {
      sentence.style.display = 'block';
    }
  }
}

// Fonction pour calculer les statistiques des expériences
function calculateExperienceStatistics() {
  const experienceTable = document.getElementById('table-experiences');
  if (!experienceTable) return;

  const rows = experienceTable.querySelectorAll('tr[data-type]');
  const totalExps = Math.max(0, rows.length - 1);

  // Gérer la visibilité de la section entière
  const section = document.getElementById('stats-section-experiences');
  if (section) {
    section.style.display = totalExps === 0 ? 'none' : 'block';
  }

  if (totalExps === 0) return;

  let totalDaysColo = 0;
  let totalDaysAlsh = 0;
  let totalYouth = 0;
  const organizationDays = {};

  rows.forEach(row => {
    // Ignorer la ligne d'en-tête
    if (row.classList.contains('always-visible')) return;

    const typeData = row.getAttribute('data-type');
    const types = typeData ? typeData.split(' ') : [];

    // Extraire la durée
    const durationCell = row.cells[2];
    const durationText = durationCell ? durationCell.textContent : '';
    let days = extractDays(durationText);

    // Extraire le nombre de jeunes
    const youthCell = row.cells[9];
    const youthText = youthCell ? youthCell.textContent : '';
    let youthCount = extractNumber(youthText);

    // Extraire l'organisateur
    const organizerCell = row.cells[3];
    const organizerText = organizerCell ? organizerCell.querySelector('a')?.textContent : '';

    // Ajouter aux statistiques
    if (types.includes('colo')) {
      totalDaysColo += days;

      // Ajouter au compteur par organisme
      if (organizerText) {
        organizationDays[organizerText] = (organizationDays[organizerText] || 0) + days;
      }
    }

    if (types.includes('alsh')) {
      totalDaysAlsh += days;

      // Ajouter au compteur par organisme
      if (organizerText) {
        organizationDays[organizerText] = (organizationDays[organizerText] || 0) + days;
      }
    }

    totalYouth += youthCount;
  });

  // Mettre à jour les valeurs dans le DOM avec gestion de la visibilité
  updateStatWithVisibility('total-days-colo', totalDaysColo);
  updateStatWithVisibility('total-days-alsh', totalDaysAlsh);
  updateStatWithVisibility('total-youth', totalYouth);
  updateStatWithVisibility('total-experiences', totalExps);

  // Créer le graphique pour les jours par organisme
  createChart('organizationChart', organizationDays, 'Nombre de jours par organisme');
}

// Fonction pour calculer les statistiques des formations
function calculateFormationStatistics() {
  const formationTable = document.getElementById('table-formations');
  if (!formationTable) return;

  const rows = formationTable.querySelectorAll('tr[data-type]');
  const totalFormations = Math.max(0, rows.length - 1);

  // Gérer la visibilité de la section entière
  const section = document.getElementById('stats-section-formations');
  if (section) {
    section.style.display = totalFormations === 0 ? 'none' : 'block';
  }

  if (totalFormations === 0) return;

  let totalDaysFormation = 0;
  let totalBafaFormations = 0;
  let totalBafdFormations = 0;
  const formationOrganizationDays = {};

  rows.forEach(row => {
    // Ignorer la ligne d'en-tête
    if (row.classList.contains('always-visible')) return;

    const typeData = row.getAttribute('data-type');
    const types = typeData ? typeData.split(' ') : [];

    // Extraire la durée
    const durationCell = row.cells[2];
    const durationText = durationCell ? durationCell.textContent : '';
    let days = extractDays(durationText);

    // Extraire l'organisateur
    const organizerCell = row.cells[3];
    const organizerText = organizerCell ? organizerCell.querySelector('a')?.textContent : '';

    // Ajouter aux statistiques
    totalDaysFormation += days;

    // Compter les formations par type
    if (types.includes('bafa')) {
      totalBafaFormations++;
    }
    if (types.includes('bafd')) {
      totalBafdFormations++;
    }

    // Ajouter au compteur par organisme
    if (organizerText) {
      formationOrganizationDays[organizerText] = (formationOrganizationDays[organizerText] || 0) + days;
    }
  });

  // Mettre à jour les valeurs dans le DOM avec gestion de la visibilité
  updateStatWithVisibility('total-days-formation', totalDaysFormation);
  updateStatWithVisibility('total-bafa-formations', totalBafaFormations);
  updateStatWithVisibility('total-bafd-formations', totalBafdFormations);

  // Créer le graphique pour les jours par organisme de formation
  createChart('formationOrganizationChart', formationOrganizationDays, 'Nombre de jours par organisme de formation');
}

// Fonction utilitaire pour extraire le nombre de jours
function extractDays(text) {
  if (!text) return 0;

  // Cas spécial "Tous les mercredis"
  if (text.includes('mercredis')) {
    // Estimation: environ 36 mercredis dans une année scolaire
    return 36;
  }

  const match = text.match(/(\d+)\s*jour/i);
  if (match) return parseInt(match[1], 10);

  // Fallback pour les nombres seuls (si "jour" est absent)
  const simpleMatch = text.match(/(\d+)/);
  return simpleMatch ? parseInt(simpleMatch[1], 10) : 0;
}

// Fonction utilitaire pour extraire un nombre
function extractNumber(text) {
  if (!text) return 0;
  if (text === '?') return 0;

  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Stocker les instances de graphiques pour pouvoir les détruire
const chartInstances = {};

// Fonction générique pour créer un graphique
function createChart(canvasId, data, titleText) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Détruire le graphique existant s'il existe
  if (chartInstances[canvasId]) {
    chartInstances[canvasId].destroy();
    chartInstances[canvasId] = null;
  }

  // Trier les données par nombre de jours (décroissant)
  const sortedData = Object.entries(data)
    .sort((a, b) => b[1] - a[1]);

  const labels = sortedData.map(entry => entry[0]);
  const values = sortedData.map(entry => entry[1]);

  // Générer des couleurs
  const colors = generateColors(labels.length);

  // Créer et stocker le nouveau graphique
  chartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => darkenColor(color, 0.2)),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: titleText
        }
      }
    }
  });
}

// Fonction pour générer des couleurs
function generateColors(count) {
  const baseColors = [
    '#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6',
    '#1abc9c', '#d35400', '#34495e', '#16a085', '#27ae60'
  ];

  return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
}

// Fonction pour assombrir une couleur
function darkenColor(color, amount) {
  const r = parseInt(color.substring(1, 3), 16);
  const g = parseInt(color.substring(3, 5), 16);
  const b = parseInt(color.substring(5, 7), 16);

  const newR = Math.max(0, Math.floor(r * (1 - amount))).toString(16).padStart(2, '0');
  const newG = Math.max(0, Math.floor(g * (1 - amount))).toString(16).padStart(2, '0');
  const newB = Math.max(0, Math.floor(b * (1 - amount))).toString(16).padStart(2, '0');

  return `#${newR}${newG}${newB}`;
}

// Fonction pour calculer les statistiques des tranches d'âges
function calculateAgeGroupStatistics() {
  const experienceTable = document.getElementById('table-experiences');
  if (!experienceTable) return;

  const rows = experienceTable.querySelectorAll('tr[data-type]');
  // Nouveau : tableau pour compter chaque âge de 3 à 17 ans
  const ageCounts = {};
  for (let age = 3; age <= 17; age++) {
    ageCounts[age] = 0;
  }

  let sumOfAges = 0;
  let countOfAges = 0;
  const ageFrequency = {};

  rows.forEach(row => {
    if (row.classList.contains('always-visible')) return;
    const ageCell = row.cells[8];
    if (!ageCell) return;
    const ageText = ageCell.textContent.trim();
    if (!ageText) return;
    // Cherche les tranches d'âge du type "X-Y ans"
    const ageMatch = ageText.match(/(\d+)-(\d+)/);
    if (ageMatch) {
      const lowerAge = parseInt(ageMatch[1], 10);
      const higherAge = parseInt(ageMatch[2], 10);
      // Pour chaque âge de la tranche, on incrémente le compteur
      for (let age = lowerAge; age <= higherAge; age++) {
        if (ageCounts[age] !== undefined) {
          ageCounts[age]++;
        }
        ageFrequency[age] = (ageFrequency[age] || 0) + 1;
      }
      // Pour l'âge moyen
      sumOfAges += (lowerAge + higherAge) / 2;
      countOfAges++;
    }
  });

  // Calculer l'âge moyen
  const averageAge = countOfAges > 0 ? (sumOfAges / countOfAges).toFixed(1) : 0;
  // Trouver l'âge le plus fréquent
  let mostCommonAge = 0;
  let highestFrequency = 0;
  for (const [age, frequency] of Object.entries(ageFrequency)) {
    if (frequency > highestFrequency) {
      highestFrequency = frequency;
      mostCommonAge = age;
    }
  }
  updateStatWithVisibility('average-age', averageAge);
  updateStatWithVisibility('most-common-age', mostCommonAge);
  // Créer le graphique pour les âges individuels
  createAgeGroupChart(ageCounts);
}

// Fonction pour créer le graphique des âges individuels
function createAgeGroupChart(data) {
  const canvas = document.getElementById('ageGroupChart');
  if (!canvas) return;

  // Détruire le graphique existant s'il existe
  if (chartInstances['ageGroupChart']) {
    chartInstances['ageGroupChart'].destroy();
    chartInstances['ageGroupChart'] = null;
  }

  // Labels de 3 à 17 ans avec "ans"
  const labels = Object.keys(data).map(age => age + ' ans');
  const values = Object.values(data);
  // Générer les couleurs
  const colors = generateColorGradient('#3498db', '#f39c12', labels.length);

  // Créer et stocker le nouveau graphique
  chartInstances['ageGroupChart'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      },
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Nombre d'expériences par âge" },
        tooltip: {
          callbacks: {
            label: function (context) {
              // Récupère l'âge sans le " ans" pour l'affichage
              const age = context.label.replace(' ans', '');
              const nb = context.parsed.y;
              return `Âge : ${age} ans — Nombre d'expériences : ${nb}`;
            }
          }
        }
      }
    }
  });
}

// Fonction pour générer un dégradé de couleurs
function generateColorGradient(startColor, endColor, steps) {
  const start = {
    r: parseInt(startColor.slice(1, 3), 16),
    g: parseInt(startColor.slice(3, 5), 16),
    b: parseInt(startColor.slice(5, 7), 16)
  };

  const end = {
    r: parseInt(endColor.slice(1, 3), 16),
    g: parseInt(endColor.slice(3, 5), 16),
    b: parseInt(endColor.slice(5, 7), 16)
  };

  const colors = [];

  for (let i = 0; i < steps; i++) {
    const r = Math.round(start.r + (end.r - start.r) * i / (steps - 1));
    const g = Math.round(start.g + (end.g - start.g) * i / (steps - 1));
    const b = Math.round(start.b + (end.b - start.b) * i / (steps - 1));

    colors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
  }

  return colors;
}

/*--------------------------------------------------------------
# Barre de rechecherche dans les tableaux
--------------------------------------------------------------*/

// Fonction de recherche dans les tableaux améliorée
function setupSearch(searchInputId, tableId) {
  const searchInput = document.getElementById(searchInputId);
  const table = document.getElementById(tableId);

  // Vérifier si un message "Aucun résultat" existe déjà, sinon le créer
  let noResultsRow = table.querySelector('.no-results-row');
  if (!noResultsRow) {
    noResultsRow = document.createElement('tr');
    noResultsRow.className = 'no-results-row';
    noResultsRow.style.display = 'none';

    const cell = document.createElement('td');
    cell.colSpan = table.rows[0].cells.length; // Couvre toutes les colonnes
    cell.textContent = 'Aucun résultat trouvé';
    cell.style.textAlign = 'center';
    cell.style.padding = '20px';
    cell.style.fontStyle = 'italic';
    cell.style.color = '#888';

    noResultsRow.appendChild(cell);
    table.querySelector('tbody').appendChild(noResultsRow);
  }

  searchInput.addEventListener('keyup', function () {
    const searchTerm = this.value.toLowerCase();

    if (searchTerm.length > 0) {
      const tabContainer = table.closest('.tabs').previousElementSibling;
      const tabs = tabContainer.querySelectorAll('.tab');
      tabs.forEach(tab => tab.classList.remove('active'));
      tabs[0].classList.add('active');
    }

    const rows = table.getElementsByTagName('tr');
    let visibleCount = 0;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.classList.contains('no-results-row')) continue;

      const text = row.textContent.toLowerCase();

      if (searchTerm.length > 0) {
        row.style.display = '';

        if (text.includes(searchTerm)) {
          row.style.display = '';
          visibleCount++;
        } else {
          if (!row.classList.contains('always-visible')) {
            row.style.display = 'none';
          } else {
            visibleCount++;
          }
        }
      } else {
        const activeTab = table.closest('.tabs').previousElementSibling.querySelector('.tab.active');
        const activeFilter = activeTab.textContent.toLowerCase();

        if (activeFilter.includes('toutes') || row.classList.contains('always-visible')) {
          row.style.display = '';
          visibleCount++;
        } else {
          const rowType = row.getAttribute('data-type')?.toLowerCase() || '';
          const filterType = activeTab.getAttribute('onclick').split("'")[1].toLowerCase();

          if (rowType.includes(filterType)) {
            row.style.display = '';
            visibleCount++;
          } else {
            row.style.display = 'none';
          }
        }
      }
    }

    // Afficher ou masquer le message "Aucun résultat"
    const hasVisibleRows = visibleCount > 0;
    noResultsRow.style.display = hasVisibleRows ? 'none' : 'table-row';

    if (hasVisibleRows) {
      remplirNum(table);

      const visibleRows = Array.from(rows).filter(row =>
        row.style.display !== "none" &&
        !row.classList.contains('always-visible') &&
        !row.classList.contains('no-results-row')
      );

      visibleRows.forEach((row, index) => {
        row.classList.remove("even", "odd");
        row.classList.add(index % 2 === 0 ? "even" : "odd");
      });
    }
  });
}

// Fonction de filtrage par onglets améliorée
function filterTable(type, tableId) {
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName('tr');
  const searchInput = document.getElementById(tableId === 'table-experiences' ? 'search-experiences' : 'search-formations');
  const noResultsRow = table.querySelector('.no-results-row');

  searchInput.value = '';
  let visibleCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.classList.contains('no-results-row')) continue;

    if (type === 'all' || row.classList.contains('always-visible')) {
      row.style.display = '';
      visibleCount++;
    } else {
      const rowType = row.getAttribute('data-type');
      if (rowType && rowType.includes(type)) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    }
  }

  // Afficher ou masquer le message "Aucun résultat"
  if (noResultsRow) {
    noResultsRow.style.display = visibleCount > 0 ? 'none' : 'table-row';
  }

  if (visibleCount > 0) {
    remplirNum(table);

    const visibleRows = Array.from(rows).filter(row =>
      row.style.display !== "none" &&
      !row.classList.contains('always-visible') &&
      !row.classList.contains('no-results-row')
    );

    visibleRows.forEach((row, index) => {
      row.classList.remove("even", "odd");
      row.classList.add(index % 2 === 0 ? "even" : "odd");
    });
  }

  const tabContainer = table.closest('.tabs').previousElementSibling;
  const tabs = tabContainer.querySelectorAll('.tab');
  tabs.forEach(tab => {
    if (tab.getAttribute('onclick').includes(type)) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
}

// Initialiser la recherche pour les deux tableaux quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function () {
  setupSearch('search-experiences', 'table-experiences');
  setupSearch('search-formations', 'table-formations');

  // Ajouter la fonctionnalité de tri aux tableaux
  setupSortableTables();
});

/*--------------------------------------------------------------
# Tri des tableaux
--------------------------------------------------------------*/
// Variable pour éviter d'initialiser plusieurs fois
window.sortableTablesInitialized = false;

function setupSortableTables() {
  // Éviter d'initialiser plusieurs fois
  if (window.sortableTablesInitialized) return;

  // Configurer les en-têtes triables pour les deux tableaux
  setupSortableHeaders('table-experiences');
  setupSortableHeaders('table-formations');

  // Appliquer le tri initial par date (descendant) pour les deux tableaux
  const experiencesTable = document.getElementById('table-experiences');
  const formationsTable = document.getElementById('table-formations');

  if (experiencesTable && typeof sortTable === 'function') {
    // La colonne Date est à l'index 1
    sortTable(experiencesTable, 1);
    // Force l'inversion pour avoir un tri descendant (plus récent en premier)
    sortTable(experiencesTable, 1);
  }

  if (formationsTable && typeof sortTable === 'function') {
    // La colonne Date est à l'index 1
    sortTable(formationsTable, 1);
    // Force l'inversion pour avoir un tri descendant (plus récent en premier)
    sortTable(formationsTable, 1);
  }

  window.sortableTablesInitialized = true;
}

function setupSortableHeaders(tableId) {
  const table = document.getElementById(tableId);
  if (!table || !table.querySelectorAll) return;

  // Obtenir toutes les cellules d'en-tête sauf celle des logos
  const headers = table.querySelectorAll('tr:first-child th');

  headers.forEach((header, index) => {
    // Ignorer:
    // - la colonne de numérotation (index 0)
    // - la colonne des logos (index 4)
    // - la colonne des tranches d'âge (index 8) pour le tableau des expériences
    // - la colonne "Modifier" (colonne d'édition)
    // - la colonne "Supprimer" (colonne de suppression)
    const headerText = header.textContent.trim();
    if (index === 0 || index === 4 || (tableId === 'table-experiences' && index === 8) ||
      headerText === 'Modifier' || headerText === 'Supprimer' ||
      header.classList.contains('edit-column') || header.classList.contains('delete-column')) return;

    // Vérifier si l'indicateur de tri existe déjà pour éviter les doublons
    if (header.querySelector('.sort-indicator')) return;

    // Ajouter un indicateur de tri et un style de curseur
    header.classList.add('sortable');
    header.style.cursor = 'pointer';

    // Ajouter le triangle de tri (initialement neutre)
    const originalText = header.textContent.trim();
    header.innerHTML = `${originalText} <span class="sort-indicator">▼</span>`;

    // Ajouter la classe pour le style initial du triangle
    const indicator = header.querySelector('.sort-indicator');
    if (indicator) {
      indicator.classList.add('sort-neutral');
    }

    // Supprimer les anciens écouteurs d'événement s'ils existent
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);

    // Ajouter un écouteur d'événement pour le clic
    newHeader.addEventListener('click', function () {
      sortTable(table, index);
    });
  });
}

function updateSortIndicators(table, activeColumnIndex, direction) {
  // Réinitialiser tous les indicateurs
  const headers = table.querySelectorAll('th.sortable');

  headers.forEach((header, index) => {
    const indicator = header.querySelector('.sort-indicator');
    if (indicator) {
      // Réinitialiser l'indicateur
      indicator.classList.remove('sort-asc', 'sort-desc');
      indicator.classList.add('sort-neutral');

      // Mettre à jour l'indicateur pour la colonne active
      if (index === activeColumnIndex) {
        indicator.classList.remove('sort-neutral');
        indicator.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
      }
    }
  });
}

function sortTable(table, columnIndex) {
  // Vérifier que table est un élément DOM valide
  if (!table || typeof table.querySelectorAll !== 'function') {
    console.error('Table invalide pour le tri');
    return;
  }

  let rows, switching, i, x, y, shouldSwitch, direction, switchcount = 0;
  switching = true;
  // Définir la direction de tri à "ascending"
  direction = "asc";

  // Mettre à jour les indicateurs visuels
  updateSortIndicators(table, columnIndex, direction);

  // Boucle jusqu'à ce que le tri soit terminé
  while (switching) {
    switching = false;
    rows = table.getElementsByTagName("tr");

    // Parcourir toutes les lignes sauf la première (en-tête)
    for (i = 1; i < (rows.length - 1); i++) {
      shouldSwitch = false;

      // Obtenir les deux éléments à comparer
      x = rows[i].getElementsByTagName("td")[columnIndex];
      y = rows[i + 1].getElementsByTagName("td")[columnIndex];

      if (!x || !y) continue;

      let compareResult;

      // Traitement spécial pour la colonne Durée (index 2)
      if (columnIndex === 2) {
        // Extraire le nombre de jours des textes comme "5 jours" ou "Tous les mercredis"
        let xDays = extractDays(x.textContent);
        let yDays = extractDays(y.textContent);

        compareResult = direction === "asc" ? xDays - yDays : yDays - xDays;
      }
      // Traitement pour les dates
      else if (isDate(x.textContent) || isDate(y.textContent)) {
        const xDate = parseFrenchDate(x.textContent);
        const yDate = parseFrenchDate(y.textContent);

        compareResult = direction === "asc" ? xDate - yDate : yDate - xDate;
      }
      // Traitement pour les valeurs numériques
      else if (isNumeric(x.textContent) && isNumeric(y.textContent)) {
        const xNum = parseFloat(x.textContent);
        const yNum = parseFloat(y.textContent);

        compareResult = direction === "asc" ? xNum - yNum : yNum - xNum;
      }
      // Traitement par défaut pour les chaînes de texte
      else {
        const xText = x.textContent.toLowerCase();
        const yText = y.textContent.toLowerCase();

        compareResult = direction === "asc" ?
          xText.localeCompare(yText, 'fr') :
          yText.localeCompare(xText, 'fr');
      }

      if (compareResult > 0) {
        shouldSwitch = true;
        break;
      }
    }

    if (shouldSwitch) {
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
      switchcount++;
    } else if (switchcount === 0 && direction === "asc") {
      direction = "desc";
      updateSortIndicators(table, columnIndex, direction);
      switching = true;
      switchcount = 0;
    }
  }

  // Renuméroter les lignes après le tri
  remplirNum(table);

  // Appliquer les styles alternés
  const visibleRows = Array.from(table.getElementsByTagName('tr')).filter(row =>
    row.style.display !== "none" &&
    !row.classList.contains('always-visible') &&
    !row.classList.contains('no-results-row')
  );

  visibleRows.forEach((row, index) => {
    row.classList.remove("even", "odd");
    row.classList.add(index % 2 === 0 ? "even" : "odd");
  });
}

// Fonction utilitaire pour vérifier si une chaîne est numérique
function isNumeric(str) {
  return /^-?\d+(\.\d+)?$/.test(str.trim());
}

// Fonction utilitaire pour vérifier si une chaîne est une date
function isDate(str) {
  // Vérifie si la chaîne contient des motifs de date en français
  return /\d{1,2}\s*(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|janv|févr|avr|juil|sept|oct|nov|déc)\s*\d{4}|\d{4}(-\d{4})?/.test(str);
}

// Fonction pour analyser les dates françaises
function parseFrenchDate(dateStr) {
  // Traitement des dates comme "Juillet 2023" ou "2023-2024"
  dateStr = dateStr.toLowerCase().trim();

  // Gérer le cas spécial "à venir"
  if (dateStr.includes('venir')) {
    return new Date(3000, 0, 1); // Date future très éloignée
  }

  // Gérer le cas spécial "Septembre YYYY - Juin YYYY"
  const mercredisMatch = dateStr.match(/septembre\s+(\d{4})\s*-\s*juin\s+(\d{4})/i);
  if (mercredisMatch) {
    return new Date(parseInt(mercredisMatch[1], 10), 8, 1); // 1er Septembre de l'année de début
  }

  // Gérer les périodes comme "2023-2024"
  if (/^\d{4}-\d{4}$/.test(dateStr)) {
    return new Date(parseInt(dateStr.split('-')[0], 10), 0, 1);
  }

  // Mappez les noms de mois français aux numéros de mois (0-11)
  const monthMap = {
    'janvier': 0, 'janv': 0,
    'février': 1, 'févr': 1,
    'mars': 2,
    'avril': 3, 'avr': 3,
    'mai': 4,
    'juin': 5,
    'juillet': 6, 'juil': 6,
    'août': 7,
    'septembre': 8, 'sept': 8,
    'octobre': 9, 'oct': 9,
    'novembre': 10, 'nov': 10,
    'décembre': 11, 'déc': 11
  };

  // Extraire l'année et le mois
  let year = 0;
  let month = 0;

  // Rechercher l'année dans la chaîne
  const yearMatch = dateStr.match(/\d{4}/);
  if (yearMatch) {
    year = parseInt(yearMatch[0], 10);
  }

  // Rechercher le mois dans la chaîne
  for (const [monthName, monthValue] of Object.entries(monthMap)) {
    if (dateStr.includes(monthName)) {
      month = monthValue;
      break;
    }
  }

  return new Date(year, month, 1);
}

/*--------------------------------------------------------------
# Génération de PDF
--------------------------------------------------------------*/
function generatePDF(tableId, title) {
  const originalTable = document.getElementById(tableId);
  if (!originalTable) {
    console.error("Tableau non trouvé:", tableId);
    return;
  }

  // Cloner le tableau
  const element = originalTable.cloneNode(true);

  // S'assurer que le tableau cloné est visible (cas où original est display:none)
  element.style.display = 'table';

  // Supprimer les colonnes d'action (édition/suppression) pour le propre PDF
  const headers = element.querySelectorAll('th');
  const rows = element.querySelectorAll('tr');

  let indicesToRemove = [];
  headers.forEach((th, index) => {
    if (th.classList.contains('edit-column') || th.classList.contains('delete-column')) {
      indicesToRemove.push(index);
    }
  });

  // Trier par ordre décroissant pour ne pas décaler les index lors de la suppression
  indicesToRemove.sort((a, b) => b - a).forEach(index => {
    rows.forEach(row => {
      if (row.cells[index]) {
        row.deleteCell(index);
      }
    });
  });

  // Pour un meilleur rendu PDF : forcer les styles sur la copie
  element.style.width = '100%';
  element.style.borderCollapse = 'collapse';
  element.style.fontSize = '10px';
  element.style.fontFamily = 'Arial, sans-serif';
  element.style.backgroundColor = '#ffffff';
  element.style.color = '#333333';
  element.style.marginBottom = '20px';

  element.querySelectorAll('td, th').forEach(cell => {
    cell.style.border = '1px solid #ddd';
    cell.style.padding = '8px';
    cell.style.textAlign = 'left';
    // S'assurer que les images ne débordent pas
    const img = cell.querySelector('img');
    if (img) {
      img.style.maxWidth = '35px';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '0 auto';
    }
    // Nettoyer les liens pour qu'ils ne soient pas bleus soulignés si on veut un look propre
    const links = cell.querySelectorAll('a');
    links.forEach(link => {
      link.style.color = '#333';
      link.style.textDecoration = 'none';
    });
  });

  // Gérer la visibilité des lignes pour le PDF
  // Pour les formations, s'assurer que toutes les lignes pertinentes sont affichées
  // Si le tableau original était filtré, on pourrait vouloir tout afficher ou garder le filtre.
  // Ici, on garde le comportement visuel actuel (ce qui est visible à l'écran)
  // MAIS on force l'affichage si c'est une ligne de données valide qui était masquée par "display:none" du parent
  Array.from(rows).forEach(row => {
    // Si la ligne contient "Aucune donnée" et qu'elle n'est pas la seule (donc il y a des données), on la cache
    if (row.textContent.includes("Aucune donnée") && rows.length > 2) {
      row.style.display = 'none';
      return;
    }

    // Pour toutes les autres lignes, on s'assure qu'elles sont visibles si elles ont du contenu
    // On vérifie si la ligne était visible dans le tableau d'origine
    // Cependant, pour résoudre le problème de "pages blanches", on va forcer l'affichage
    // des lignes qui ne sont pas explicitement cachées par une classe utilitaire de masquage

    // Force l'affichage en table-row pour le PDF
    if (row.style.display === 'none') {
      // Si elle était cachée, on la laisse cachée (respect du filtre)
      // Sauf si c'est une bizarrerie du clonage, mais on suppose que le filtre est voulu.
      // ATTENTION : L'utilisateur dit "page blanche". Si le filtre est actif, c'est normal.
      // Si le filtre n'est pas actif, display n'est pas none.

      // HYPOTHÈSE : Le clonage ne récupère pas correctement la visibilité si elle dépend de classes CSS complexes.
      // On va forcer le display à 'table-row' pour réinitialiser
    }

    // RESET pour le PDF : on affiche tout ce qui est dans le DOM du tableau
    // Si l'utilisateur a filtré, il vaut mieux voir tout le tableau que rien du tout ?
    // Ou alors le problème vient du fait que html2canvas ne rend pas les <tr> si le table a css border-collapse

    row.style.display = 'table-row';
    row.style.pageBreakInside = 'avoid'; // Éviter de couper une ligne
  });


  // Récupérer le nom de l'utilisateur pour le nom de fichier et l'en-tête
  let userName = "Animateur";
  const titleH2 = document.querySelector('h2');
  if (titleH2) {
    const orangeSpan = titleH2.querySelector('orange');
    if (orangeSpan) {
      userName = orangeSpan.textContent.trim();
    }
  }

  // Générer un nom de fichier propre
  // Format: type_nom_prenom_numero
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  // Création du timestamp pour le fichier (YYYYMMDD_HHMM)
  const pad = (num) => num.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;

  // Nettoyage du nom (accents, espaces -> underscores, minuscules)
  const cleanName = userName
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_") // Remplacer tout ce qui n'est pas alphanum par underscore
    .replace(/_+/g, "_"); // Éviter les doubles underscores

  // Déterminer le type (experience ou formation)
  let typePrefix = "document";
  if (tableId.includes("experience")) {
    typePrefix = "experience";
  } else if (tableId.includes("formation")) {
    typePrefix = "formation";
  }

  const filename = `${typePrefix}_${cleanName}_${timestamp}.pdf`;

  const opt = {
    margin: [1, 10, 10, 10], // top, left, bottom, right (Marge haute réduite)
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      letterRendering: true,
      scrollY: 0 // Important pour éviter les décalages si la fenêtre est scrollée
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
  };

  // Création d'un wrapper pour le rendu PDF
  const container = document.createElement('div');
  container.style.padding = '10px'; // Padding réduit
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.width = '100%'; // Forcer la largeur


  // En-tête personnalisé (Nom de l'utilisateur) - TOUT EN HAUT
  const header = document.createElement('div');
  header.style.marginBottom = '10px';
  header.style.borderBottom = '2px solid #e74c3c'; // Ligne plus visible
  header.style.paddingBottom = '5px';
  header.style.fontSize = '16px';
  header.style.color = '#2c3e50';
  header.style.fontWeight = 'bold';
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between'; // Espacer si on ajoute d'autres infos
  header.innerHTML = `<div>Document appartenant à : <span style="color: #e67e22; font-size: 18px; text-transform: uppercase;">${userName}</span></div>`;

  // Titre du document
  const h1 = document.createElement('h1');
  h1.textContent = title;
  h1.style.textAlign = 'center';
  h1.style.marginBottom = '20px';
  h1.style.marginTop = '10px';
  h1.style.color = '#2c3e50';
  h1.style.fontSize = '22px';
  // h1.style.borderBottom = '2px solid #e74c3c'; // Déjà dans le header
  // h1.style.paddingBottom = '10px';

  // Pied de page personnalisé (Signature + Date + Pagination)
  const footer = document.createElement('div');
  footer.style.marginTop = '20px';
  footer.style.borderTop = '1px solid #ddd';
  footer.style.paddingTop = '10px';
  footer.style.fontSize = '12px'; // Plus visible
  footer.style.color = '#555';
  footer.style.display = 'flex';
  footer.style.justifyContent = 'space-between';
  footer.style.alignItems = 'flex-end'; // Aligner en bas
  footer.style.pageBreakBefore = 'avoid'; // Essayer de garder le footer avec le contenu

  const leftPart = document.createElement('div');
  leftPart.innerHTML = `Généré le <strong>${dateStr}</strong> à ${timeStr}`;

  const rightPart = document.createElement('div');
  rightPart.innerHTML = `<strong>Récapitulatif BAFA/BAFD - Plateforme collaborative</strong><br>
                         Généré via <a href="https://srn-romain.github.io/recap-bafa/" style="color: #e67e22; text-decoration: none;">https://srn-romain.github.io/recap-bafa/</a>`;
  rightPart.style.textAlign = 'right';

  footer.appendChild(leftPart);
  footer.appendChild(rightPart);

  container.appendChild(header);
  container.appendChild(h1);
  container.appendChild(element);
  container.appendChild(footer);

  // Exécution de html2pdf
  if (typeof html2pdf === 'undefined') {
    alert("Le module de génération PDF n'est pas encore chargé. Veuillez réessayer dans quelques secondes.");
    return;
  }

  // Afficher un indicateur de chargement
  const originalBtn = document.querySelector(`button[onclick*="${tableId}"]`);
  let originalText = "";
  if (originalBtn) {
    originalText = originalBtn.innerHTML;
    originalBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Génération...';
    originalBtn.disabled = true;
  }

  html2pdf().set(opt).from(container).save().then(() => {
    if (originalBtn) {
      originalBtn.innerHTML = originalText;
      originalBtn.disabled = false;
    }
  }).catch(err => {
    console.error("Erreur génération PDF:", err);
    alert("Erreur lors de la génération du PDF.");
    if (originalBtn) {
      originalBtn.innerHTML = originalText;
      originalBtn.disabled = false;
    }
  });
}