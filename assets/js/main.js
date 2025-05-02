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
  setTimeout(calculateStatistics, 500);
});

function calculateStatistics() {
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
  createOrganizationChart(organizationDays);
}

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

function extractNumber(text) {
  if (!text) return 0;
  if (text === '?') return 0;

  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

function createOrganizationChart(organizationDays) {
  // S'assurer que Chart.js est disponible
  if (typeof Chart === 'undefined') {
    // Charger Chart.js si nécessaire
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = function() {
      renderChart(organizationDays);
    };
    document.head.appendChild(script);
  } else {
    renderChart(organizationDays);
  }
}

function renderChart(organizationDays) {
  const canvas = document.getElementById('organizationChart');
  if (!canvas) return;

  // Trier les organismes par nombre de jours (décroissant)
  const sortedData = Object.entries(organizationDays)
      .sort((a, b) => b[1] - a[1]);

  const labels = sortedData.map(entry => entry[0]);
  const data = sortedData.map(entry => entry[1]);

  // Générer des couleurs
  const colors = generateColors(labels.length);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Nombre de jours',
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => darkenColor(color, 0.1)),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de jours'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Organismes'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Nombre de jours par organisme'
        }
      }
    }
  });
}

function generateColors(count) {
  const baseColors = [
    '#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6',
    '#1abc9c', '#d35400', '#34495e', '#16a085', '#27ae60'
  ];

  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
}

function darkenColor(color, amount) {
  // Convertir la couleur hex en RGB
  let r = parseInt(color.substring(1, 3), 16);
  let g = parseInt(color.substring(3, 5), 16);
  let b = parseInt(color.substring(5, 7), 16);

  // Assombrir chaque composante
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));

  // Reconvertir en hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/*--------------------------------------------------------------
# Statistiques supplémentaires
--------------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", function() {
  // Attendre que le DOM soit chargé pour calculer les statistiques
  setTimeout(calculateAdditionalStatistics, 500);
});

function calculateAdditionalStatistics() {
  calculateAnimatorsCount();
  calculateFormationStatistics();
}

function calculateAnimatorsCount() {
  // Ajouter une nouvelle carte statistique pour le nombre d'animateurs
  const statsGrid = document.querySelector('.stats-section .stats-grid');
  if (!statsGrid) return;

  const animatorCard = document.createElement('div');
  animatorCard.className = 'stat-card';
  animatorCard.innerHTML = `
    <div class="stat-value" id="total-animators">0</div>
    <div class="stat-label">Animateurs rencontrés</div>
  `;
  statsGrid.appendChild(animatorCard);

  // Estimation du nombre d'animateurs (en moyenne 1 animateur pour 8 jeunes + l'équipe de direction)
  const totalYouth = parseInt(document.getElementById('total-youth').textContent) || 0;
  const totalExperiences = parseInt(document.getElementById('total-experiences').textContent) || 0;

  // Formule approximative: 1 animateur pour 8 jeunes + 2 membres de direction par expérience
  const estimatedAnimators = Math.round(totalYouth / 8 + totalExperiences * 2);

  document.getElementById('total-animators').textContent = estimatedAnimators;
}

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
  createFormationOrganizationChart(formationOrganizationDays);
}

function createFormationOrganizationChart(formationOrganizationDays) {
  const canvas = document.getElementById('formationOrganizationChart');
  if (!canvas) return;

  // Trier les organismes par nombre de jours (décroissant)
  const sortedData = Object.entries(formationOrganizationDays)
      .sort((a, b) => b[1] - a[1]);

  const labels = sortedData.map(entry => entry[0]);
  const data = sortedData.map(entry => entry[1]);

  // Générer des couleurs
  const colors = generateColors(labels.length);

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Nombre de jours',
        data: data,
        backgroundColor: colors,
        borderColor: colors.map(color => darkenColor(color, 0.1)),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Nombre de jours'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Organismes'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Nombre de jours par organisme de formation'
        }
      }
    }
  });
}