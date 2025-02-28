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