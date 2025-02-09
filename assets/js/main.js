function filterTable(type) {
  let tabs = document.querySelectorAll(".tab");
  let rows = document.querySelectorAll("tbody tr");

  tabs.forEach(tab => {
    tab.classList.remove("active");

    // Ajoute "active" uniquement si le texte de la tab correspond à "type"
    if ((type === "all" && tab.textContent.trim() === "Tous") || tab.getAttribute("data-filter") === type) {
      tab.classList.add("active");
    }
  });

  rows.forEach(row => {
    let types = row.getAttribute("data-type").split(" ");
    if (type === "all" || types.includes(type)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });

  // Réappliquer les classes pour l'alternance des couleurs
  let visibleRows = Array.from(rows).filter(row => row.style.display !== "none");
  visibleRows.forEach((row, index) => {
    row.classList.remove("even", "odd");
    if (index % 2 === 0) {
      row.classList.add("even");
    } else {
      row.classList.add("odd");
    }
  });
}

// Ajouter un attribut data-filter pour chaque tab
document.querySelectorAll('.tab').forEach((tab, index) => {
  const types = ['all', 'alsh', 'colo', 'autre'];
  tab.setAttribute('data-filter', types[index]);
});







// Fonction pour remplir les cellules de la colonne avec la classe "num" en partant du bas
function remplirNum() {
  const cells = document.querySelectorAll('.num'); // Sélectionne toutes les cellules avec la classe "num"

  // Remplir chaque cellule en partant du bas (en inversant l'ordre des numéros)
  const totalRows = cells.length;
  cells.forEach((cell, index) => {
    // L'index commence à 0 en haut, donc on inverse en calculant : totalRows - index
    cell.textContent = totalRows - index;
  });
}

// Appeler la fonction pour remplir les numéros après le chargement de la page
window.onload = remplirNum;

