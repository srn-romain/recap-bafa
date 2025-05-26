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

function filterTable(type, tableId) {
  let table = document.getElementById(tableId);
  let rows = table.querySelectorAll("tbody tr");

  rows.forEach(row => {
    let types = row.getAttribute("data-type") ? row.getAttribute("data-type").split(" ") : [];
    row.style.display = (type === "all" || types.includes(type)) ? "" : "none";
  });

  let visibleRows = Array.from(rows).filter(row => row.style.display !== "none");
  visibleRows.forEach((row, index) => {
    row.classList.remove("even", "odd");
    row.classList.add(index % 2 === 0 ? "even" : "odd");
  });

  remplirNum(table);
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
document.addEventListener("DOMContentLoaded", function() {
  // Attendre que le DOM soit chargé pour calculer les statistiques
  setTimeout(calculateAllStatistics, 500);
});

// Fonction principale pour calculer toutes les statistiques
function calculateAllStatistics() {
  // Calculer les statistiques des expériences
  calculateExperienceStatistics();

  // Calculer les statistiques des tranches d'âges
  calculateAgeGroupStatistics();

  // Calculer les statistiques des formations
  calculateFormationStatistics();
}

// Fonction pour calculer les statistiques des expériences
function calculateExperienceStatistics() {
  const experienceTable = document.getElementById('table-experiences');
  if (!experienceTable) return;

  const rows = experienceTable.querySelectorAll('tr[data-type]');
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

  // Mettre à jour les valeurs dans le DOM
  document.getElementById('total-days-colo').textContent = totalDaysColo;
  document.getElementById('total-days-alsh').textContent = totalDaysAlsh;
  document.getElementById('total-youth').textContent = totalYouth;
  document.getElementById('total-experiences').textContent = rows.length - 1; // -1 pour l'en-tête

  // Créer le graphique pour les jours par organisme
  createChart('organizationChart', organizationDays, 'Nombre de jours par organisme');
}

// Fonction pour calculer les statistiques des formations
function calculateFormationStatistics() {
  const formationTable = document.getElementById('table-formations');
  if (!formationTable) return;

  const rows = formationTable.querySelectorAll('tr[data-type]');
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

  // Mettre à jour les valeurs dans le DOM
  document.getElementById('total-days-formation').textContent = totalDaysFormation;
  document.getElementById('total-bafa-formations').textContent = totalBafaFormations;
  document.getElementById('total-bafd-formations').textContent = totalBafdFormations;

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
  return match ? parseInt(match[1], 10) : 0;
}

// Fonction utilitaire pour extraire un nombre
function extractNumber(text) {
  if (!text) return 0;
  if (text === '?') return 0;

  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// Fonction générique pour créer un graphique
function createChart(canvasId, data, titleText) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  // Trier les données par nombre de jours (décroissant)
  const sortedData = Object.entries(data)
      .sort((a, b) => b[1] - a[1]);

  const labels = sortedData.map(entry => entry[0]);
  const values = sortedData.map(entry => entry[1]);

  // Générer des couleurs
  const colors = generateColors(labels.length);

  new Chart(canvas, {
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
  const ageGroups = {};
  let totalLowerAge = 0;
  let totalHigherAge = 0;
  let totalExperiences = 0;

  // Pour calculer l'âge moyen
  let sumOfAges = 0;
  let countOfAges = 0;

  // Pour identifier la tranche d'âge la plus fréquente
  const ageFrequency = {};

  rows.forEach(row => {
    // Ignorer la ligne d'en-tête
    if (row.classList.contains('always-visible')) return;

    // Extraire la tranche d'âge
    const ageCell = row.cells[8];
    if (!ageCell) return;

    const ageText = ageCell.textContent.trim();
    if (!ageText) return;

    // Analyser la tranche d'âge (format "X-Y ans")
    const ageMatch = ageText.match(/(\d+)-(\d+)/);
    if (ageMatch) {
      const lowerAge = parseInt(ageMatch[1], 10);
      const higherAge = parseInt(ageMatch[2], 10);

      // Créer une clé pour cette tranche d'âge
      const ageRange = `${lowerAge}-${higherAge} ans`;
      ageGroups[ageRange] = (ageGroups[ageRange] || 0) + 1;

      // Pour l'âge le plus fréquent
      for (let age = lowerAge; age <= higherAge; age++) {
        ageFrequency[age] = (ageFrequency[age] || 0) + 1;
      }

      // Pour l'âge moyen
      sumOfAges += (lowerAge + higherAge) / 2;
      countOfAges++;

      totalLowerAge += lowerAge;
      totalHigherAge += higherAge;
      totalExperiences++;
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

  // Mettre à jour les valeurs dans le DOM
  document.getElementById('average-age').textContent = averageAge;
  document.getElementById('most-common-age').textContent = mostCommonAge;

  // Créer le graphique pour les tranches d'âges
  createAgeGroupChart(ageGroups);
}

// Fonction pour créer le graphique des tranches d'âges
function createAgeGroupChart(data) {
  const canvas = document.getElementById('ageGroupChart');
  if (!canvas) return;

  // Trier les données par tranche d'âge (du plus jeune au plus âgé)
  const sortedData = Object.entries(data)
      .sort((a, b) => {
        const ageA = parseInt(a[0].split('-')[0], 10);
        const ageB = parseInt(b[0].split('-')[0], 10);
        return ageA - ageB;
      });

  const labels = sortedData.map(entry => entry[0]);
  const values = sortedData.map(entry => entry[1]);

  // Générer les couleurs
  const colors = generateColorGradient('#3498db', '#f39c12', labels.length);

  new Chart(canvas, {
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
          text: 'Nombre d\'expériences par tranche d\'âge'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.raw;
              return value + (value > 1 ? ' expériences' : ' expérience');
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

  searchInput.addEventListener('keyup', function() {
    const searchTerm = this.value.toLowerCase();

    // Si la barre de recherche contient du texte, réinitialisons d'abord le filtre par onglet
    if (searchTerm.length > 0) {
      // Réinitialiser visuellement l'onglet actif
      const tabContainer = table.closest('.tabs').previousElementSibling;
      const tabs = tabContainer.querySelectorAll('.tab');
      tabs.forEach(tab => tab.classList.remove('active'));
      tabs[0].classList.add('active'); // Activer "Toutes les expériences/formations"
    }

    const rows = table.getElementsByTagName('tr');

    // Commencer à 1 pour sauter l'en-tête
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const text = row.textContent.toLowerCase();

      // Si l'utilisateur recherche quelque chose
      if (searchTerm.length > 0) {
        // Réinitialiser d'abord tous les filtres d'onglets
        row.style.display = '';

        // Puis appliquer le filtre de recherche
        if (text.includes(searchTerm)) {
          row.style.display = '';
        } else {
          if (!row.classList.contains('always-visible')) {
            row.style.display = 'none';
          }
        }
      } else {
        // Si la barre de recherche est vide, on revient au filtre par onglet actif
        const activeTab = table.closest('.tabs').previousElementSibling.querySelector('.tab.active');
        const activeFilter = activeTab.textContent.toLowerCase();

        if (activeFilter.includes('toutes') || row.classList.contains('always-visible')) {
          row.style.display = '';
        } else {
          const rowType = row.getAttribute('data-type').toLowerCase();
          const filterType = activeTab.getAttribute('onclick').split("'")[1].toLowerCase();

          if (rowType.includes(filterType)) {
            row.style.display = '';
          } else {
            row.style.display = 'none';
          }
        }
      }
    }

    // Ajouter cette ligne pour mettre à jour la numérotation
    remplirNum(table);

    // Mettre à jour les classes alternées
    const visibleRows = Array.from(rows).filter(row => row.style.display !== "none" && !row.classList.contains('always-visible'));
    visibleRows.forEach((row, index) => {
      row.classList.remove("even", "odd");
      row.classList.add(index % 2 === 0 ? "even" : "odd");
    });
  });
}

// Fonction de filtrage par onglets améliorée
function filterTable(type, tableId) {
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName('tr');
  const searchInput = document.getElementById(tableId === 'table-experiences' ? 'search-experiences' : 'search-formations');

  // Réinitialiser la barre de recherche
  searchInput.value = '';

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (type === 'all' || row.classList.contains('always-visible')) {
      row.style.display = '';
    } else {
      const rowType = row.getAttribute('data-type');
      if (rowType && rowType.includes(type)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  }

  // Mettre à jour la numérotation
  remplirNum(table);

  // Mettre à jour les classes alternées
  const visibleRows = Array.from(rows).filter(row => row.style.display !== "none" && !row.classList.contains('always-visible'));
  visibleRows.forEach((row, index) => {
    row.classList.remove("even", "odd");
    row.classList.add(index % 2 === 0 ? "even" : "odd");
  });

  // Mettre à jour l'onglet actif
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
document.addEventListener('DOMContentLoaded', function() {
  setupSearch('search-experiences', 'table-experiences');
  setupSearch('search-formations', 'table-formations');
});