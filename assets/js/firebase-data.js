// Script pour charger les données depuis Firebase
// Avec fallback vers les données statiques du HTML

/**
 * Structure des données d'expérience
 */

// Map des genres pour l'affichage (synchronisé avec admin-forms.js)
const GENDER_MAP = [
  { m: 'Animateur Stagiaire', f: 'Animatrice Stagiaire' },
  { m: 'Animateur (diplômé)', f: 'Animatrice (diplômée)', displayM: 'Animateur', displayF: 'Animatrice' },
  { m: 'Animateur Ski', f: 'Animatrice Ski' },
  { m: 'Animateur Snow', f: 'Animatrice Snow' },
  { m: 'Animateur SB', f: 'Animatrice SB' },
  { m: 'Animateur AS', f: 'Animatrice AS' },
  { m: 'Animateur Référent Handicap', f: 'Animatrice Référente Handicap' },
  { m: 'Responsable de Groupe', f: 'Responsable de Groupe' },
  { m: 'Surveillant de Baignade (non animateur)', f: 'Surveillante de Baignade (non animatrice)', displayM: 'Surveillant de Baignade', displayF: 'Surveillante de Baignade' },
  { m: 'Assistant Sanitaire (non animateur)', f: 'Assistante Sanitaire (non animatrice)', displayM: 'Assistant Sanitaire', displayF: 'Assistante Sanitaire' },
  { m: 'Tuteur de Maisonnée (SNU)', f: 'Tutrice de Maisonnée (SNU)', displayM: 'Tuteur de Maisonnée', displayF: 'Tutrice de Maisonnée' },
  { m: 'Cuisinier', f: 'Cuisinière' },
  { m: 'Directeur', f: 'Directrice' },
  { m: 'Directeur Stagiaire', f: 'Directrice Stagiaire' },
  { m: 'Directeur AS', f: 'Directrice AS' },
  { m: 'Directeur SB', f: 'Directrice SB' },
  { m: 'Directeur de Formation', f: 'Directrice de Formation' },
  { m: 'Directeur de Structure', f: 'Directrice de Structure' },
  { m: 'Directeur Adjoint', f: 'Directrice Adjointe' },
  { m: 'Directeur Adjoint & SB', f: 'Directrice Adjointe & SB' },
  { m: 'Directeur Adjoint & AS', f: 'Directrice Adjointe & AS' },
  { m: 'Formateur BAFA', f: 'Formatrice BAFA' },
  { m: 'Formateur BAFD', f: 'Formatrice BAFD' },
  { m: 'Respons Scout', f: 'Respons Scout' },
  { m: 'Chef Scout', f: 'Cheffe Scout' },
  { m: 'Autre (préciser)', f: 'Autre (préciser)' }
];

/**
 * Détermine si un badge doit être affiché pour une expérience ou formation
 */
function getStatusBadge(item) {
  const dateStr = item.date;
  const durationStr = item.duration;
  const type = item.type;

  // Ne gère pas le cas du periscolaire, tous les samedis et tous les mercredis
  const isPeriodic = (type === 'alsh' || type === 'scout' || type === 'periscolaire') &&
    typeof durationStr === 'string' &&
    (durationStr.includes('mercredis') || durationStr.includes('samedis') || durationStr.includes('périscolaire'));

  if (isPeriodic || type === 'periscolaire') {
    return null;
  }

  const parseFn = typeof parseFrenchDate === 'function' ? parseFrenchDate : (d) => new Date(d);
  const extractFn = typeof extractDays === 'function' ? extractDays : (t) => 0;

  const startDate = parseFn(dateStr);
  const now = new Date();

  // Durée en jours
  const days = extractFn(durationStr);

  // Calculer la date de fin
  const endDate = new Date(startDate);
  if (days > 1) {
    endDate.setDate(endDate.getDate() + days - 1);
  } else if (days === 0) {
    // Si pas de durée, on considère par défaut que ça dure le mois entier pour le badge "en cours"
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0); // Dernier jour du mois
  }

  // Nouveau : 5 jours après la date de fin
  const newUntilDate = new Date(endDate);
  newUntilDate.setDate(newUntilDate.getDate() + 5);

  // Futur
  if (startDate > now) {
    const span = document.createElement('span');
    span.className = 'badge-status badge-futur';
    span.textContent = 'À venir';
    return span;
  }

  // En cours
  if (now >= startDate && now <= endDate) {
    const span = document.createElement('span');
    span.className = 'badge-status badge-ongoing';
    span.textContent = days > 0 ? `En cours (${durationStr})` : 'En cours';
    return span;
  }

  // Nouveau
  if (now > endDate && now <= newUntilDate) {
    const span = document.createElement('span');
    span.className = 'badge-status badge-new';
    span.textContent = 'Nouveau';
    return span;
  }

  return null;
}

/**
 * Formate une date d'expérience pour l'affichage dans le tableau principal.
 * - "15 Juillet 2024"                        → "15 Juillet 2024"
 * - "15 Juillet 2024 - 31 Juillet 2024"      → "du 15 au 31 Juillet 2024"
 * - "15 Juillet 2024 - 3 Août 2024"          → "du 15 juil. au 3 août 2024"
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return dateStr;

  const MONTH_ABBR = {
    'janvier': 'janv.', 'février': 'févr.', 'mars': 'mars',
    'avril': 'avr.', 'mai': 'mai', 'juin': 'juin',
    'juillet': 'juil.', 'août': 'août', 'septembre': 'sept.',
    'octobre': 'oct.', 'novembre': 'nov.', 'décembre': 'déc.'
  };

  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

  // Essayer de parser "Jour Mois Année - Jour Mois Année"
  const rangeMatch = dateStr.match(
    /^(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})\s*[-–]\s*(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})$/
  );

  if (rangeMatch) {
    const [, d1, m1Raw, y1, d2, m2Raw, y2] = rangeMatch;
    const m1 = m1Raw.toLowerCase();
    const m2 = m2Raw.toLowerCase();

    if (m1 === m2 && y1 === y2) {
      // Même mois, même année → "Du 15 au 31 Juillet 2024"
      return `Du ${parseInt(d1)} au ${parseInt(d2)} ${capitalize(m1Raw)} ${y1}`;
    } else {
      // Mois ou années différents → abréviations
      const abbr1 = MONTH_ABBR[m1] || m1Raw;
      const abbr2 = MONTH_ABBR[m2] || m2Raw;
      const yearSuffix = y1 === y2 ? y1 : `${y1}-${y2}`;
      return `Du ${parseInt(d1)} ${abbr1} au ${parseInt(d2)} ${abbr2} ${yearSuffix}`;
    }
  }

  // Fallback : retourner tel quel (ex: "Juillet 2024", "Septembre 2023 - Juin 2024")
  return dateStr;
}

/**
 * Détermine la classe de couleur logique et cohérente selon la tranche d'âge réelle.
 * Les tranches d'âge sont réparties par groupe pédagogique :
 * - Petite enfance (3-6 ans) : Rose
 * - Enfance (6-12 ans / 8-12 ans) : Vert menthe
 * - Pré-ados (10-14 ans) : Ambre doré
 * - Adolescents (14-17 ans) : Bleu azur
 * - Adultes / 18+ : Violet
 */
function getAgeRangeTagClass(ageRange) {
  if (!ageRange) return '';
  const text = ageRange.trim().toLowerCase();
  if (text === '-' || text === '?') return '';

  if (text.includes('adulte') || text.includes('majeur') || text.includes('tous')) {
    return 'tag-age-adultes';
  }

  const matches = text.match(/\d+/g);
  if (matches && matches.length > 0) {
    const minAge = parseInt(matches[0], 10);
    const maxAge = matches.length > 1 ? parseInt(matches[1], 10) : minAge;

    // Petite enfance : max <= 6 (ex: 3-5 ans, 4-6 ans, 3-6 ans)
    if (maxAge <= 6) {
      return 'tag-age-petite-enfance';
    }
    // Enfance : 6-12 ans, 6-10 ans, 8-12 ans
    if (minAge <= 8 && maxAge <= 12) {
      return 'tag-age-enfance';
    }
    // Pré-adolescents : 10-14 ans, 11-14 ans, 10-13 ans
    if (minAge >= 9 && maxAge <= 14) {
      return 'tag-age-preado';
    }
    // Adolescents : 12-17 ans, 14-17 ans, 15-17 ans
    if (maxAge <= 17) {
      return 'tag-age-ados';
    }
    // 18+ / Adultes
    return 'tag-age-adultes';
  }

  return 'tag-age-enfance';
}

/**
 * Retourne l'icône vectorielle monochrome (noir et blanc / pro) riche en détails associée au type de séjour.
 */
function getStayTypeIconSvg(stayType, expType) {
  const st = (stayType || '').toLowerCase();
  const et = (expType || '').toLowerCase();

  // 1. Pension complète (Hébergement en fond + Couverts détaillés au premier plan)
  if (st.includes('pension complète') || st.includes('pension complete')) {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Pension complète">
      <path d="M12 24L32 8l20 16v32H12V24z" fill="#0f172a" fill-opacity="0.08" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M42 16v-6h5v10" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <rect x="18" y="24" width="7" height="7" rx="1" stroke="#0f172a" stroke-width="1.8" fill="#ffffff"/>
      <path d="M21.5 24v7M18 27.5h7" stroke="#0f172a" stroke-width="1.2"/>
      <rect x="39" y="24" width="7" height="7" rx="1" stroke="#0f172a" stroke-width="1.8" fill="#ffffff"/>
      <path d="M42.5 24v7M39 27.5h7" stroke="#0f172a" stroke-width="1.2"/>
      <circle cx="32" cy="44" r="15" fill="#ffffff" stroke="#0f172a" stroke-width="2.2"/>
      <circle cx="32" cy="44" r="12" fill="#0f172a" fill-opacity="0.06" stroke="#0f172a" stroke-width="1" stroke-dasharray="2 2"/>
      <path d="M27 35v5a2 2 0 0 0 2 2v10a1 1 0 0 0 2 0V42a2 2 0 0 0 2-2v-5" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M27 35v4M29 35v4M31 35v4M33 35v4" stroke="#0f172a" stroke-width="1.2"/>
      <path d="M37 35v17a1 1 0 0 0 2 0v-8c0-5-.5-9-2-9z" fill="#0f172a" stroke="#0f172a" stroke-width="1.2"/>
    </svg>`;
  }

  // 2. Camping (Gestion libre / Camping - Tente canadienne détaillée avec haubans, ouverture et sapin)
  if (st.includes('camping')) {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Camping">
      <path d="M54 28l-5-7h3l-6-8-6 8h3l-5 7h4l-4 7h12l-4-7h4z" fill="#0f172a" opacity="0.25"/>
      <rect x="44" y="35" width="2" height="6" fill="#0f172a" opacity="0.25"/>
      <path d="M32 10L6 48h52L32 10z" fill="#0f172a" fill-opacity="0.08" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M32 10v38" stroke="#0f172a" stroke-width="2.5"/>
      <path d="M32 10L16 48h16V10z" fill="#0f172a" fill-opacity="0.25"/>
      <path d="M32 10l-16 38" stroke="#0f172a" stroke-width="2" stroke-dasharray="2 2"/>
      <path d="M32 24l-9 24h18l-9-24z" fill="#0f172a"/>
      <path d="M6 48L2 54M58 48l4 6M32 10L48 54M32 10L16 54" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M2 54h60" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="2" cy="54" r="1.5" fill="#0f172a"/>
      <circle cx="62" cy="54" r="1.5" fill="#0f172a"/>
    </svg>`;
  }

  // 3. Itinérance / Itinérant (Sac à dos de trekking avec tapis de sol, sangles, poches et bâton)
  if (st.includes('itinéran') || st.includes('itineran') || et === 'itinerance') {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Itinérance">
      <rect x="18" y="6" width="28" height="7" rx="3.5" fill="#0f172a" fill-opacity="0.15" stroke="#0f172a" stroke-width="2"/>
      <path d="M24 6v7M40 6v7" stroke="#0f172a" stroke-width="1.5"/>
      <rect x="16" y="14" width="32" height="42" rx="6" fill="#0f172a" fill-opacity="0.08" stroke="#0f172a" stroke-width="2.5"/>
      <path d="M14 15c0-2 2-4 5-4h26c3 0 5 2 5 4v8H14v-8z" fill="#0f172a" fill-opacity="0.2" stroke="#0f172a" stroke-width="2"/>
      <path d="M26 19h12" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M23 23v28M41 23v28" stroke="#0f172a" stroke-width="1.8"/>
      <rect x="21.5" y="32" width="3" height="4" rx="0.5" fill="#0f172a"/>
      <rect x="39.5" y="32" width="3" height="4" rx="0.5" fill="#0f172a"/>
      <rect x="22" y="38" width="20" height="15" rx="3" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
      <path d="M27 42h10" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M16 36h-3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3M48 36h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <path d="M9 12l2 44" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="9" cy="12" r="1.5" fill="#0f172a"/>
    </svg>`;
  }

  // 4. Gestion libre (Maison avec cuisine autonome & faitout avec vapeur)
  if (st.includes('gestion libre')) {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Gestion libre">
      <path d="M8 26L32 8l24 18v30a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V26z" fill="#0f172a" fill-opacity="0.08" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M44 17v-8h5v12" stroke="#0f172a" stroke-width="2"/>
      <path d="M46 5c-1-2 1-3 0-4" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="32" cy="20" r="4" stroke="#0f172a" stroke-width="1.5" fill="#ffffff"/>
      <path d="M32 16v8M28 20h8" stroke="#0f172a" stroke-width="1"/>
      <circle cx="32" cy="43" r="13" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
      <path d="M23 41h18a1 1 0 0 1 1 1v6a3 3 0 0 1-3 3H25a3 3 0 0 1-3-3v-6a1 1 0 0 1 1-1z" fill="#0f172a" fill-opacity="0.2" stroke="#0f172a" stroke-width="1.8"/>
      <path d="M22 43h-2M42 43h2" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <path d="M21 41h22" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M30 39h4" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <path d="M28 35c0-2 2-2 2-4M34 35c0-2 2-2 2-4" stroke="#0f172a" stroke-width="1.3" stroke-linecap="round"/>
    </svg>`;
  }

  // 5. ALSH (Centre de loisirs - Soleil radieux & palette artistique avec pinceau)
  if (st.includes('alsh') || st.includes('loisir') || et === 'alsh') {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="ALSH">
      <circle cx="44" cy="20" r="9" fill="#0f172a" fill-opacity="0.15" stroke="#0f172a" stroke-width="2.2"/>
      <path d="M44 7v3M44 30v3M31 20h3M54 20h3M35 11l2 2M51 27l2 2M35 29l2-2M51 13l2-2" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 40c0-11 9-19 20-19 9 0 16 6 16 14 0 5-3 8-7 8h-3c-2 0-3 1.5-3 3.5 0 2 1.5 3.5 1.5 5.5 0 4-4 8-10 8-8 0-14-6-14-14z" fill="#ffffff" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
      <circle cx="21" cy="34" r="2.5" fill="#0f172a"/>
      <circle cx="29" cy="29" r="2.5" fill="#0f172a"/>
      <circle cx="38" cy="32" r="2.5" fill="#0f172a"/>
      <circle cx="23" cy="47" r="3.5" stroke="#0f172a" stroke-width="1.8" fill="#ffffff"/>
      <path d="M14 58l22-22" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M11 61l3-3" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  // 6. Périscolaire / Péri-scolaire (École avec tour clocher, horloge scolaire & doubles portes)
  if (st.includes('péri') || st.includes('peri') || st.includes('scolaire') || et === 'periscolaire') {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Périscolaire">
      <path d="M8 32L32 16l24 16v24a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V32z" fill="#0f172a" fill-opacity="0.08" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M26 18V6h12v12" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M23 6l9-5 9 5" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <path d="M32 9v5" stroke="#0f172a" stroke-width="2"/>
      <circle cx="32" cy="30" r="9" fill="#ffffff" stroke="#0f172a" stroke-width="2.2"/>
      <path d="M32 24v6l4 2.5" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="32" cy="30" r="1.5" fill="#0f172a"/>
      <rect x="27" y="44" width="10" height="14" rx="1" stroke="#0f172a" stroke-width="2" fill="#ffffff"/>
      <path d="M32 44v14" stroke="#0f172a" stroke-width="1.5"/>
      <path d="M23 58h18" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  // 7. Classe découverte (Boussole d'exploration avec rose des vents, aiguille & monts)
  if (st.includes('classe') || st.includes('découverte') || st.includes('decouverte')) {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Classe découverte">
      <path d="M4 42L22 18l14 18 10-12 14 18H4z" fill="#0f172a" fill-opacity="0.1" stroke="#0f172a" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="32" cy="36" r="19" fill="#ffffff" stroke="#0f172a" stroke-width="2.5"/>
      <circle cx="32" cy="36" r="15" fill="#0f172a" fill-opacity="0.05" stroke="#0f172a" stroke-width="1" stroke-dasharray="2 2"/>
      <circle cx="32" cy="13" r="4" stroke="#0f172a" stroke-width="2" fill="#ffffff"/>
      <path d="M32 23v3M32 46v3M19 36h3M42 36h3" stroke="#0f172a" stroke-width="1.8" stroke-linecap="round"/>
      <polygon points="32,23 35.5,36 32,33 28.5,36" fill="#0f172a"/>
      <polygon points="32,49 35.5,36 32,39 28.5,36" stroke="#0f172a" stroke-width="1.5" fill="#ffffff"/>
      <circle cx="32" cy="36" r="2.5" fill="#0f172a"/>
    </svg>`;
  }

  // 8. Scout (Feu de camp scout détaillé avec bûches croisées, cercle de pierres et étincelles)
  if (st.includes('scout') || et === 'scout') {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Scout">
      <path d="M8 52l48-16M56 52L8 36" stroke="#0f172a" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M8 52l48-16M56 52L8 36" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
      <ellipse cx="32" cy="54" rx="22" ry="5" stroke="#0f172a" stroke-width="2" fill="#0f172a" fill-opacity="0.1"/>
      <path d="M32 8c4 8 13 14 13 24 0 9-7 16-13 16s-13-7-13-16c0-7 6-13 8-18 1 3 2 5 5 5-2-4-2-7 0-11z" fill="#0f172a" fill-opacity="0.2" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M32 22c2 4 7 7 7 12 0 4-3 8-7 8s-7-4-7-8c0-4 4-7 5-9 0 2 1 3 2 3-1-2-1-4 0-6z" fill="#0f172a"/>
      <circle cx="24" cy="12" r="1.5" fill="#0f172a"/>
      <circle cx="42" cy="10" r="1.5" fill="#0f172a"/>
      <circle cx="38" cy="4" r="1.5" fill="#0f172a"/>
    </svg>`;
  }

  // 9. SNU (Insigne / Bouclier officiel avec couronne de laurier, étoile & chevron)
  if (st.includes('snu')) {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="SNU">
      <path d="M12 42c-4-8-3-18 2-24M52 42c4-8 3-18-2-24" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="10" cy="24" r="2" fill="#0f172a"/>
      <circle cx="8" cy="32" r="2" fill="#0f172a"/>
      <circle cx="10" cy="40" r="2" fill="#0f172a"/>
      <circle cx="54" cy="24" r="2" fill="#0f172a"/>
      <circle cx="56" cy="32" r="2" fill="#0f172a"/>
      <circle cx="54" cy="40" r="2" fill="#0f172a"/>
      <path d="M32 6L14 14v16c0 14 8 24 18 28 10-4 18-14 18-28V14L32 6z" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M32 10L18 16v14c0 11 6 19 14 23 8-4 14-12 14-23V16L32 10z" fill="#0f172a" fill-opacity="0.08" stroke="#0f172a" stroke-width="1.2"/>
      <polygon points="32,18 34.5,24 41,24.5 36,29 37.5,35 32,31.5 26.5,35 28,29 23,24.5 29.5,24" fill="#0f172a"/>
      <path d="M23 41l9 5 9-5" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  // 10. Formation BAFA / BAFD (Toque universitaire, pompon à frange & parchemin avec ruban)
  if (st.includes('formation') || st.includes('bafa') || st.includes('bafd')) {
    return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Formation">
      <polygon points="32,10 60,22 32,34 4,22" fill="#0f172a" fill-opacity="0.2" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M14 26.5v12c0 6 8 10 18 10s18-4 18-10v-12" stroke="#0f172a" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M32 22c7 0 16 3 17 8v16" stroke="#0f172a" stroke-width="2" stroke-linecap="round"/>
      <circle cx="32" cy="22" r="2.5" fill="#0f172a"/>
      <polygon points="46,46 52,46 50,56 48,56" fill="#0f172a"/>
      <rect x="18" y="44" width="28" height="9" rx="2" fill="#ffffff" stroke="#0f172a" stroke-width="2"/>
      <rect x="30" y="44" width="4" height="9" fill="#0f172a"/>
      <circle cx="32" cy="48.5" r="3" fill="#0f172a"/>
    </svg>`;
  }

  // 11. Défaut (Chalet de colonie avec drapeau, fenêtres à croisillons & porche)
  return `<svg class="stay-type-icon" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" title="Séjour">
    <circle cx="48" cy="18" r="7" stroke="#0f172a" stroke-width="1.8" fill="#0f172a" fill-opacity="0.1"/>
    <path d="M6 30L32 10l26 20v26a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V30z" fill="#0f172a" fill-opacity="0.08" stroke="#0f172a" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M4 29l28-21 28 21" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="16" y="32" width="10" height="9" rx="1" stroke="#0f172a" stroke-width="1.8" fill="#ffffff"/>
    <path d="M21 32v9M16 36.5h10" stroke="#0f172a" stroke-width="1.2"/>
    <rect x="38" y="32" width="10" height="9" rx="1" stroke="#0f172a" stroke-width="1.8" fill="#ffffff"/>
    <path d="M43 32v9M38 36.5h10" stroke="#0f172a" stroke-width="1.2"/>
    <rect x="26" y="45" width="12" height="13" stroke="#0f172a" stroke-width="2" fill="#ffffff"/>
    <path d="M24 45h16" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M32 10V2l10 4-10 4" stroke="#0f172a" stroke-width="1.8" fill="#0f172a" stroke-linejoin="round"/>
  </svg>`;
}

function createExperienceRow(experience) {

  const tr = document.createElement('tr');
  tr.setAttribute('data-type', experience.type);
  // Stocker l'objet complet pour une récupération facile lors de l'édition
  tr.dataset.experience = JSON.stringify(experience);
  tr.classList.add('experience-row');

  // Colonne N°
  const tdNum = document.createElement('td');
  tdNum.className = 'num';
  tr.appendChild(tdNum);

  // Colonne Date
  const tdDate = document.createElement('td');
  // Vérification pour format spécifique ALSH/Scout/Périscolaire "Tous les mercredis/samedis/Une année périscolaire"
  // On veut afficher seulement "AAAA-AAAA" mais garder le tri correct
  const isPeriodic = (experience.type === 'alsh' || experience.type === 'scout' || experience.type === 'periscolaire') &&
    typeof experience.duration === 'string' &&
    (experience.duration.includes('mercredis') || experience.duration.includes('samedis') || experience.duration.includes('périscolaire') || experience.duration.includes('jours scolaires'));

  if (isPeriodic) {
    const periodMatch = experience.date.match(/septembre\s+(\d{4})\s*-\s*juin\s+(\d{4})/i);
    if (periodMatch) {
      // Astuce : on inclut la date complète en masqué pour que le tri fonctionne toujours sur "Septembre..."
      // et on affiche visuellement la période "AAAA-AAAA"
      tdDate.innerHTML = `<span style="display:none;">${experience.date}</span>${periodMatch[1]}-${periodMatch[2]}`;
    } else {
      tdDate.textContent = experience.date;
    }
  } else {
    tdDate.textContent = formatDateForDisplay(experience.date);
  }

  // Ajouter le badge de statut
  const badge = getStatusBadge(experience);
  if (badge) {
    tdDate.appendChild(badge);
  }

  tr.appendChild(tdDate);


  // Colonne Durée — normaliser l'ancienne valeur 'Une année périscolaire' → 'Tous les jours scolaires'
  const tdDuration = document.createElement('td');
  let durationDisplay = experience.duration;
  if (experience.type === 'periscolaire' && typeof durationDisplay === 'string' && durationDisplay.includes('périscolaire')) {
    durationDisplay = 'Tous les jours scolaires';
  }
  tdDuration.textContent = durationDisplay || '';
  tr.appendChild(tdDuration);

  // Colonne Organisateur
  const tdOrganizer = document.createElement('td');
  const organizerLink = document.createElement('a');
  organizerLink.href = experience.organizerUrl;
  organizerLink.target = '_blank';
  organizerLink.textContent = experience.organizer;
  tdOrganizer.appendChild(organizerLink);
  tr.appendChild(tdOrganizer);

  // Colonne Logo
  const tdLogo = document.createElement('td');
  const logoLink = document.createElement('a');
  logoLink.href = experience.organizerUrl;
  logoLink.target = '_blank';
  const logoImg = document.createElement('img');
  logoImg.crossOrigin = 'anonymous';
  logoImg.src = experience.logoPath;
  logoImg.alt = 'Logo de ' + experience.organizer;
  logoImg.className = 'image-carrée';
  logoLink.appendChild(logoImg);
  tdLogo.appendChild(logoLink);
  tr.appendChild(tdLogo);

  // Colonne Lieu
  const tdLocation = document.createElement('td');
  if (Array.isArray(experience.locations)) {
    // Plusieurs lieux (itinérance)
    const isLoggedIn = window.currentUser !== null && window.userRole !== null;

    experience.locations.forEach((loc, index) => {
      const locLink = document.createElement('a');

      if (isLoggedIn && loc.url && loc.url !== '#') {
        locLink.href = loc.url;
        locLink.target = '_blank';
        locLink.className = 'location-link';
      } else {
        locLink.href = '#';
        locLink.className = 'location-link-disabled';
        if (loc.url && loc.url !== '#') {
          locLink.title = 'Connectez-vous pour voir sur Google Maps';
        }
      }

      locLink.textContent = loc.location || loc.name || 'Lieu inconnu';
      tdLocation.appendChild(locLink);

      if (index < experience.locations.length - 1) {
        tdLocation.appendChild(document.createTextNode(', '));
      }
    });
    if (experience.country) {
      const countrySpan = document.createElement('span');
      countrySpan.className = 'country-label';
      countrySpan.textContent = ' (' + experience.country + ')';
      tdLocation.appendChild(countrySpan);
    }
  } else {
    // Un seul lieu
    const locLink = document.createElement('a');
    // Vérifier si l'utilisateur est connecté avant d'activer le lien
    const isLoggedIn = window.currentUser !== null && window.userRole !== null;
    if (isLoggedIn && experience.locationUrl && experience.locationUrl !== '#') {
      locLink.href = experience.locationUrl;
      locLink.target = '_blank';
      locLink.className = 'location-link';
    } else {
      locLink.href = '#';
      locLink.className = 'location-link-disabled';
      locLink.title = 'Connectez-vous pour voir sur Google Maps';
      if (experience.locationUrl && experience.locationUrl !== '#') {
        locLink.setAttribute('data-original-href', experience.locationUrl);
      }
    }
    locLink.textContent = experience.location;
    tdLocation.appendChild(locLink);

    if (experience.country) {
      const countrySpan = document.createElement('span');
      countrySpan.className = 'country-label';
      countrySpan.textContent = ' (' + experience.country + ')';
      tdLocation.appendChild(countrySpan);
    }
  }
  tr.appendChild(tdLocation);

  // Colonne Type de séjour
  const tdStayType = document.createElement('td');
  if (experience.stayType && experience.stayType !== '-') {
    const iconSvg = getStayTypeIconSvg(experience.stayType, experience.type);
    tdStayType.innerHTML = `<span class="stay-type-wrapper">${iconSvg}<span class="stay-type-text">${experience.stayType}</span><span class="stay-type-spacer"></span></span>`;
  } else {
    tdStayType.textContent = experience.stayType || '';
  }
  tr.appendChild(tdStayType);

  // Colonne Intitulé du poste
  const tdPosition = document.createElement('td');
  let positionText = experience.position;

  // Utiliser le mapping pour l'affichage (féminisation et versions courtes)
  if (experience.position) {
    const rawPos = experience.position.trim();
    const mapped = GENDER_MAP.find(p => p.m === rawPos);

    if (mapped) {
      if (window.userGender === 'feminin') {
        // Mode féminin : utiliser displayF (court) ou f (complet)
        positionText = mapped.displayF || mapped.f;
      } else {
        // Mode masculin : utiliser displayM (court) si dispo, sinon garder la valeur originale (m)
        positionText = mapped.displayM || mapped.m;
      }
    }
  }

  tdPosition.textContent = positionText || '';
  tr.appendChild(tdPosition);

  // Colonne Tranche d'âge
  const tdAgeRange = document.createElement('td');
  if (experience.ageRange && experience.ageRange !== '-' && experience.ageRange !== '?') {
    const span = document.createElement('span');
    span.className = `cell-tag ${getAgeRangeTagClass(experience.ageRange)}`;
    span.textContent = experience.ageRange;
    tdAgeRange.appendChild(span);
  } else {
    tdAgeRange.textContent = experience.ageRange || '';
  }
  tr.appendChild(tdAgeRange);

  // Colonne Nb de jeunes
  const tdYouthCount = document.createElement('td');
  tdYouthCount.textContent = experience.youthCount;
  tr.appendChild(tdYouthCount);

  return tr;
}

/**
 * Structure des données de formation
 */
function createFormationRow(formation) {
  const tr = document.createElement('tr');
  tr.setAttribute('data-type', formation.type);
  // Stocker l'objet complet pour une récupération facile lors de l'édition
  tr.dataset.formation = JSON.stringify(formation);
  tr.classList.add('formation-row');

  // Colonne N°
  const tdNum = document.createElement('td');
  tdNum.className = 'num';
  tr.appendChild(tdNum);

  // Colonne Date
  const tdDate = document.createElement('td');
  tdDate.textContent = formatDateForDisplay(formation.date);

  // Ajouter le badge de statut
  const badge = getStatusBadge(formation);
  if (badge) {
    tdDate.appendChild(badge);
  }

  tr.appendChild(tdDate);


  // Colonne Durée
  const tdDuration = document.createElement('td');
  tdDuration.textContent = formation.duration || '';
  tr.appendChild(tdDuration);

  // Colonne Organisme
  const tdOrganism = document.createElement('td');
  const organismLink = document.createElement('a');
  organismLink.href = formation.organismUrl;
  organismLink.target = '_blank';
  organismLink.textContent = formation.organism;
  tdOrganism.appendChild(organismLink);
  tr.appendChild(tdOrganism);

  // Colonne Logo
  const tdLogo = document.createElement('td');
  const logoLink = document.createElement('a');
  logoLink.href = formation.organismUrl;
  logoLink.target = '_blank';
  const logoImg = document.createElement('img');
  logoImg.crossOrigin = 'anonymous';
  logoImg.src = formation.logoPath;
  logoImg.alt = 'Logo de ' + formation.organism;
  logoImg.className = 'image-carrée';
  logoImg.loading = 'lazy';
  logoLink.appendChild(logoImg);
  tdLogo.appendChild(logoLink);
  tr.appendChild(tdLogo);

  // Colonne Intitulé
  const tdTitle = document.createElement('td');
  tdTitle.textContent = formation.title || '';
  tr.appendChild(tdTitle);

  // Colonne Lieu
  const tdLocation = document.createElement('td');
  const locLink = document.createElement('a');
  // Vérifier si l'utilisateur est connecté avant d'activer le lien
  const isLoggedIn = window.currentUser !== null && window.userRole !== null;
  if (isLoggedIn && formation.locationUrl && formation.locationUrl !== '#') {
    locLink.href = formation.locationUrl;
    locLink.target = '_blank';
    locLink.className = 'location-link';
  } else {
    locLink.href = '#';
    locLink.className = 'location-link-disabled';
    locLink.title = 'Connectez-vous pour voir sur Google Maps';
    if (formation.locationUrl && formation.locationUrl !== '#') {
      locLink.setAttribute('data-original-href', formation.locationUrl);
    }
  }
  locLink.textContent = formation.location;
  tdLocation.appendChild(locLink);
  tr.appendChild(tdLocation);

  return tr;
}

/**
 * Charger les expériences depuis Firebase
 */
async function loadExperiencesFromFirebase() {
  const loadingSpinner = document.getElementById('loading-experiences');
  const table = document.getElementById('table-experiences');

  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.log("Firebase non disponible, utilisation des données statiques");
    // Cacher le spinner si pas de Firebase
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }
    return false;
  }

  // Afficher le spinner si pas déjà affiché
  if (loadingSpinner && loadingSpinner.classList.contains('hidden')) {
    loadingSpinner.classList.remove('hidden');
  }
  if (table && table.style.display !== 'none') {
    table.style.display = 'none';
  }

  try {
    // Déterminer la collection à utiliser (root ou sous-collection user)
    let experiencesRef;
    if (window.targetUid) {
      experiencesRef = window.firebaseDb.collection('users').doc(window.targetUid).collection('experiences');
      console.log(`Chargement des expériences pour l'utilisateur ${window.targetUid}`);
    } else {
      experiencesRef = window.firebaseDb.collection('experiences');
      console.log("Chargement des expériences depuis la collection racine (Legacy)");
    }

    // Récupérer toutes les expériences (le tri sera fait côté client)
    const snapshot = await experiencesRef.get();

    if (snapshot.empty) {
      console.log("Aucune expérience trouvée dans Firebase");
      // Cacher le spinner
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
      if (table) {
        table.style.display = '';
        // Vider le tableau sauf l'en-tête
        const rows = table.querySelectorAll('tr[data-type], tr.no-data-row');
        rows.forEach(row => {
          if (!row.classList.contains('always-visible')) row.remove();
        });
        // Ajouter le message "Aucune donnée"
        const tbody = table.querySelector('tbody') || table;
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'no-data-row';
        emptyRow.innerHTML = '<td colspan="10" style="text-align: center; padding: 20px; font-style: italic; color: #7f8c8d;">Aucune donnée à afficher</td>';
        tbody.appendChild(emptyRow);
      }
      return true; // Retourner true pour dire que le chargement est "fini" même si vide
    }

    if (!table) return false;

    // Supprimer toutes les lignes sauf l'en-tête
    const rows = table.querySelectorAll('tr[data-type], tr.no-data-row');
    rows.forEach(row => {
      if (!row.classList.contains('always-visible')) {
        row.remove();
      }
    });

    // Ajouter les expériences depuis Firebase
    const experiences = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      experiences.push({
        id: doc.id,
        type: data.type || 'colo',
        date: data.date || '',
        duration: data.duration || '',
        organizer: data.organizer || '',
        organizerUrl: data.organizerUrl || '',
        logoPath: data.logoPath || '',
        location: data.location || '',
        locationUrl: data.locationUrl || '',
        locations: data.locations || null,
        country: data.country || '',
        stayType: data.stayType || '',
        position: data.position || '',
        ageRange: data.ageRange || '',
        youthCount: data.youthCount || 0,
        ce: data.ce || ''
      });
    });

    // Trier par date (tri côté client car les dates sont des chaînes)
    // Utiliser la fonction parseFrenchDate de main.js si disponible, sinon créer une version locale
    const parseDate = typeof parseFrenchDate === 'function' ? parseFrenchDate : function (dateStr) {
      dateStr = dateStr.toLowerCase().trim();
      if (/^\d{4}-\d{4}$/.test(dateStr)) {
        return new Date(parseInt(dateStr.split('-')[0], 10), 0, 1);
      }
      const monthMap = {
        'janvier': 0, 'janv': 0, 'février': 1, 'févr': 1, 'mars': 2,
        'avril': 3, 'avr': 3, 'mai': 4, 'juin': 5,
        'juillet': 6, 'juil': 6, 'août': 7, 'septembre': 8, 'sept': 8,
        'octobre': 9, 'oct': 9, 'novembre': 10, 'nov': 10, 'décembre': 11, 'déc': 11
      };
      const yearMatch = dateStr.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
      let month = 0;
      for (const [monthName, monthValue] of Object.entries(monthMap)) {
        if (dateStr.includes(monthName)) {
          month = monthValue;
          break;
        }
      }
      // Extraire le jour s'il est au début (ex: "5 Juillet 2024")
      const dayMatch = dateStr.match(/^(\d{1,2})/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
      return new Date(year, month, day);
    };

    experiences.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA; // Tri décroissant (plus récent en premier)
    });

    // Ajouter les lignes triées au tableau
    experiences.forEach(experience => {
      const row = createExperienceRow(experience);
      table.appendChild(row);

      // Vérifier si une expérience concerne le BAFD pour le titre
      const pos = (experience.position || '').toLowerCase();
      if (pos.includes('dir-') || pos.includes('directeur') || pos.includes('bafd')) {
        window.userHasBafd = true;
      }
    });

    // Mettre à jour le titre si nécessaire
    if (window.userHasBafd && typeof updateDashboardTitle === 'function') {
      updateDashboardTitle();
    }

    // Cacher le spinner et afficher le tableau
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }

    console.log("Expériences chargées depuis Firebase");
    return true;
  } catch (error) {
    console.error("Erreur lors du chargement des expériences:", error);
    // Cacher le spinner en cas d'erreur
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }
    return false;
  }
}

/**
 * Charger les formations depuis Firebase
 */
async function loadFormationsFromFirebase() {
  const loadingSpinner = document.getElementById('loading-formations');
  const table = document.getElementById('table-formations');

  if (!window.firebaseInitialized || !window.firebaseDb) {
    console.log("Firebase non disponible, utilisation des données statiques");
    // Cacher le spinner si pas de Firebase
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }
    return false;
  }

  // Afficher le spinner si pas déjà affiché
  if (loadingSpinner && loadingSpinner.classList.contains('hidden')) {
    loadingSpinner.classList.remove('hidden');
  }
  if (table && table.style.display !== 'none') {
    table.style.display = 'none';
  }

  try {
    // Déterminer la collection à utiliser (root ou sous-collection user)
    let formationsRef;
    if (window.targetUid) {
      formationsRef = window.firebaseDb.collection('users').doc(window.targetUid).collection('formations');
      console.log(`Chargement des formations pour l'utilisateur ${window.targetUid}`);
    } else {
      formationsRef = window.firebaseDb.collection('formations');
      console.log("Chargement des formations depuis la collection racine (Legacy)");
    }

    // Récupérer toutes les formations (le tri sera fait côté client)
    const snapshot = await formationsRef.get();

    if (snapshot.empty) {
      console.log("Aucune formation trouvée dans Firebase");
      // Cacher le spinner
      if (loadingSpinner) loadingSpinner.classList.add('hidden');
      if (table) {
        table.style.display = '';
        // Vider le tableau sauf l'en-tête
        const rows = table.querySelectorAll('tr[data-type], tr.no-data-row');
        rows.forEach(row => {
          if (!row.classList.contains('always-visible')) row.remove();
        });
        // Ajouter le message "Aucune donnée"
        const tbody = table.querySelector('tbody') || table;
        const emptyRow = document.createElement('tr');
        emptyRow.className = 'no-data-row';
        emptyRow.innerHTML = '<td colspan="8" style="text-align: center; padding: 20px; font-style: italic; color: #7f8c8d;">Aucune donnée à afficher</td>';
        tbody.appendChild(emptyRow);
      }
      return true; // Retourner true pour dire que le chargement est "fini" même si vide
    }

    if (!table) return false;

    // Supprimer toutes les lignes sauf l'en-tête
    const rows = table.querySelectorAll('tr[data-type], tr.no-data-row');
    rows.forEach(row => {
      if (!row.classList.contains('always-visible')) {
        row.remove();
      }
    });

    // Ajouter les formations depuis Firebase
    const formations = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      const formation = {
        type: data.type || 'bafa',
        date: data.date || '',
        duration: data.duration || '',
        organism: data.organism || '',
        organismUrl: (data.organismUrl && data.organismUrl !== '#') ? data.organismUrl : '',
        logoPath: data.logoPath || '',
        title: data.title || '',
        location: data.location || '',
        locationUrl: (data.locationUrl && data.locationUrl !== '#') ? data.locationUrl : ''
      };
      formations.push(formation);

      // Vérifier si une formation concerne le BAFD pour le titre
      if (formation.type.toLowerCase() === 'bafd' || formation.title.toLowerCase().includes('bafd')) {
        window.userHasBafd = true;
      }
    });

    // Mettre à jour le titre si nécessaire
    if (window.userHasBafd && typeof updateDashboardTitle === 'function') {
      updateDashboardTitle();
    }

    // Trier par date (tri côté client car les dates sont des chaînes)
    // Utiliser la fonction parseFrenchDate de main.js si disponible, sinon créer une version locale
    const parseDate = typeof parseFrenchDate === 'function' ? parseFrenchDate : function (dateStr) {
      dateStr = dateStr.toLowerCase().trim();
      if (/^\d{4}-\d{4}$/.test(dateStr)) {
        return new Date(parseInt(dateStr.split('-')[0], 10), 0, 1);
      }
      const monthMap = {
        'janvier': 0, 'janv': 0, 'février': 1, 'févr': 1, 'mars': 2,
        'avril': 3, 'avr': 3, 'mai': 4, 'juin': 5,
        'juillet': 6, 'juil': 6, 'août': 7, 'septembre': 8, 'sept': 8,
        'octobre': 9, 'oct': 9, 'novembre': 10, 'nov': 10, 'décembre': 11, 'déc': 11
      };
      const yearMatch = dateStr.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : 0;
      let month = 0;
      for (const [monthName, monthValue] of Object.entries(monthMap)) {
        if (dateStr.includes(monthName)) {
          month = monthValue;
          break;
        }
      }
      // Extraire le jour s'il est au début (ex: "5 Juillet 2024")
      const dayMatch = dateStr.match(/^(\d{1,2})/);
      const day = dayMatch ? parseInt(dayMatch[1], 10) : 1;
      return new Date(year, month, day);
    };

    formations.sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB - dateA; // Tri décroissant (plus récent en premier)
    });

    // Ajouter les lignes triées au tableau
    formations.forEach(formation => {
      const row = createFormationRow(formation);
      table.appendChild(row);
    });

    // Cacher le spinner et afficher le tableau
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }

    console.log("Formations chargées depuis Firebase");
    return true;
  } catch (error) {
    console.error("Erreur lors du chargement des formations:", error);
    // Cacher le spinner en cas d'erreur
    if (loadingSpinner) {
      loadingSpinner.classList.add('hidden');
    }
    if (table) {
      table.style.display = '';
    }
    return false;
  }
}

/**
 * Charger toutes les données depuis Firebase
 */
async function loadDataFromFirebase() {
  // Afficher les spinners au début du chargement
  // Réinitialiser les drapeaux pour le titre
  window.userHasBafd = false;

  const loadingExperiences = document.getElementById('loading-experiences');
  const loadingFormations = document.getElementById('loading-formations');
  const tableExperiences = document.getElementById('table-experiences');
  const tableFormations = document.getElementById('table-formations');

  if (loadingExperiences) {
    loadingExperiences.classList.remove('hidden');
  }
  if (tableExperiences) {
    tableExperiences.style.display = 'none';
  }

  if (loadingFormations) {
    loadingFormations.classList.remove('hidden');
  }
  if (tableFormations) {
    tableFormations.style.display = 'none';
  }

  // 1. Charger les infos du profil et vérifier la confidentialité
  let accessGranted = true;
  if (window.targetUid) {
    accessGranted = await loadUserProfile();
  }

  if (!accessGranted) {
    // Cacher les spinners si accès refusé
    if (loadingExperiences) loadingExperiences.classList.add('hidden');
    if (loadingFormations) loadingFormations.classList.add('hidden');
    return;
  }

  // 2. Charger les données si accès autorisé
  const experiencesLoaded = await loadExperiencesFromFirebase();
  const formationsLoaded = await loadFormationsFromFirebase();


  if (experiencesLoaded || formationsLoaded) {
    // Numéroter les lignes immédiatement après le chargement
    if (typeof remplirNum === 'function') {
      const experiencesTable = document.getElementById('table-experiences');
      const formationsTable = document.getElementById('table-formations');
      if (experiencesTable) remplirNum(experiencesTable);
      if (formationsTable) remplirNum(formationsTable);
    }

    // Réinitialiser les fonctionnalités après le chargement
    setTimeout(() => {
      // Réinitialiser les filtres (cela appellera aussi remplirNum)
      if (typeof filterTable === 'function') {
        filterTable('all', 'table-experiences');
        filterTable('all', 'table-formations');
      }

      // S'assurer que les numéros sont bien remplis
      if (typeof remplirNum === 'function') {
        const experiencesTable = document.getElementById('table-experiences');
        const formationsTable = document.getElementById('table-formations');
        if (experiencesTable) remplirNum(experiencesTable);
        if (formationsTable) remplirNum(formationsTable);
      }

      // Recalculer les statistiques
      if (typeof calculateAllStatistics === 'function') {
        calculateAllStatistics();
      } else {
        // Si la fonction n'est pas encore disponible, attendre un peu plus
        setTimeout(() => {
          if (typeof calculateAllStatistics === 'function') {
            calculateAllStatistics();
          }
        }, 500);
      }

      // Réinitialiser la recherche
      if (typeof setupSearch === 'function') {
        setupSearch('search-experiences', 'table-experiences');
        setupSearch('search-formations', 'table-formations');
      }

      // Réinitialiser le tri (mais seulement si les en-têtes n'ont pas déjà été configurés)
      if (typeof setupSortableTables === 'function') {
        // Réinitialiser le flag pour permettre la réinitialisation après chargement Firebase
        if (typeof sortableTablesInitialized !== 'undefined') {
          window.sortableTablesInitialized = false;
        }
        setupSortableTables();
      }

      // Mettre à jour l'UI pour gérer les liens Google Maps et les colonnes d'édition
      // Appeler updateUI() dans tous les cas (connecté ou non) pour désactiver/activer les liens
      if (typeof updateUI === 'function') {
        setTimeout(() => {
          updateUI();
        }, 100);
      }

      // Mettre à jour l'en-tête sticky des tableaux
      if (typeof updateStickyHeaderState === 'function') {
        updateStickyHeaderState();
      }

      // Mettre à jour la visibilité des liens de la navbar après tout le chargement
      if (typeof window.updateNavbarLinksVisibility === 'function') {
        setTimeout(window.updateNavbarLinksVisibility, 300);
      }

      // Ouverture automatique de la modale de détail si les dates sont spécifiées dans l'URL
      setTimeout(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const filterStart = urlParams.get('startDate');
        const filterEnd = urlParams.get('endDate');

        if (filterStart && filterEnd) {
          console.log(`[AutoModal] Ouverture automatique demandée pour startDate=${filterStart} et endDate=${filterEnd}`);
          let matchedRow = null;

          // Helper interne robuste pour parser les dates de recap-bafa en YYYY-MM-DD
          function parseFrenchDateStringToYMD(dateStr) {
            if (!dateStr) return null;
            dateStr = dateStr.toLowerCase().trim();
            
            const monthMap = {
              'janvier': '01', 'janv': '01',
              'février': '02', 'févr': '02',
              'mars': '03',
              'avril': '04', 'avr': '04',
              'mai': '05',
              'juin': '06',
              'juillet': '07', 'juil': '07',
              'août': '08',
              'septembre': '09', 'sept': '09',
              'octobre': '10', 'oct': '10',
              'novembre': '11', 'nov': '11',
              'décembre': '12', 'déc': '12'
            };

            const pad = (n) => n.toString().padStart(2, '0');

            // 1. Tenter le format "DD Mois YYYY - DD Mois YYYY"
            const rangeMatch = dateStr.match(
              /^(\d{1,2})\s+([a-zà-ÿ\.]+)\s+(\d{4})\s*[-–]\s*(\d{1,2})\s+([a-zà-ÿ\.]+)\s+(\d{4})$/i
            );
            if (rangeMatch) {
              const [, d1, m1Raw, y1, d2, m2Raw, y2] = rangeMatch;
              const m1 = monthMap[m1Raw.toLowerCase().replace('.', '')];
              const m2 = monthMap[m2Raw.toLowerCase().replace('.', '')];
              if (m1 && m2) {
                return {
                  start: `${y1}-${m1}-${pad(d1)}`,
                  end: `${y2}-${m2}-${pad(d2)}`
                };
              }
            }

            // 2. Tenter le format "DD Mois YYYY" (journée unique)
            const singleMatch = dateStr.match(/^(\d{1,2})\s+([a-zà-ÿ\.]+)\s+(\d{4})$/i);
            if (singleMatch) {
              const [, d, mRaw, y] = singleMatch;
              const m = monthMap[mRaw.toLowerCase().replace('.', '')];
              if (m) {
                const ymd = `${y}-${m}-${pad(d)}`;
                return { start: ymd, end: ymd };
              }
            }

            // 3. Tenter le format périodique "Mois YYYY - Mois YYYY" (ex: "Septembre 2023 - Juin 2024")
            const periodicMatch = dateStr.match(/^([a-zà-ÿ\.]+)\s+(\d{4})\s*[-–]\s*([a-zà-ÿ\.]+)\s+(\d{4})$/i);
            if (periodicMatch) {
              const [, m1Raw, y1, m2Raw, y2] = periodicMatch;
              const m1 = monthMap[m1Raw.toLowerCase().replace('.', '')];
              const m2 = monthMap[m2Raw.toLowerCase().replace('.', '')];
              if (m1 && m2) {
                return {
                  start: `${y1}-${m1}-01`,
                  end: `${y2}-${m2}-30`
                };
              }
            }

            return null;
          }

          // Parcourir les lignes d'expériences
          const expRows = document.querySelectorAll('#table-experiences tr[data-experience]');
          for (const row of expRows) {
            try {
              const exp = JSON.parse(row.dataset.experience);
              const parsed = parseFrenchDateStringToYMD(exp.date);
              if (parsed && parsed.start === filterStart && parsed.end === filterEnd) {
                matchedRow = row;
                break;
              }
            } catch (e) {
              console.error("[AutoModal] Erreur parse ligne d'expérience:", e);
            }
          }

          // Parcourir les lignes de formations si pas trouvé dans les expériences
          if (!matchedRow) {
            const formRows = document.querySelectorAll('#table-formations tr[data-formation]');
            for (const row of formRows) {
              try {
                const form = JSON.parse(row.dataset.formation);
                const parsed = parseFrenchDateStringToYMD(form.date);
                if (parsed && parsed.start === filterStart && parsed.end === filterEnd) {
                  matchedRow = row;
                  break;
                }
              } catch (e) {
                console.error("[AutoModal] Erreur parse ligne de formation:", e);
              }
            }
          }

          if (matchedRow) {
            console.log("[AutoModal] Ligne correspondante trouvée et sélectionnée !", matchedRow);
            // Faire défiler jusqu'à la ligne et simuler un clic sur la cellule N° après stabilisation
            matchedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const numCell = matchedRow.querySelector('.num');
            if (numCell) {
              setTimeout(() => {
                numCell.click();
              }, 400);
            }
          } else {
            console.log("[AutoModal] Aucun séjour ou formation trouvé correspondant aux dates spécifiées.");
            window.openDateErrorModal(filterStart, filterEnd);
          }
        }
      }, 600);
    }, 200);
  }
}

// Fonctions pour la modale d'erreur de date introuvable
function formatYMDToFrench(ymdString) {
  if (!ymdString || !/^\d{4}-\d{2}-\d{2}$/.test(ymdString)) return ymdString;
  const [year, month, day] = ymdString.split('-');
  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  const monthName = months[parseInt(month, 10) - 1];
  return `${parseInt(day, 10)} ${monthName} ${year}`;
}

window.openDateErrorModal = function(start, end) {
  const modal = document.getElementById('date-error-modal');
  const startSpan = document.getElementById('date-error-start');
  const endSpan = document.getElementById('date-error-end');
  
  if (startSpan) {
    startSpan.textContent = formatYMDToFrench(start) || start;
  }
  if (endSpan) {
    endSpan.textContent = formatYMDToFrench(end) || end;
  }
  
  if (modal) {
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
  }
};

window.closeDateErrorModal = function() {
  const modal = document.getElementById('date-error-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
};

// Fermer la modale d'erreur lors d'un clic sur le fond (overlay)
window.addEventListener('click', function(event) {
  const modal = document.getElementById('date-error-modal');
  if (event.target === modal) {
    window.closeDateErrorModal();
  }
});

// Charger les données au chargement de la page
// Attendre que le DOM et Firebase soient chargés
function initializeFirebaseData() {
  if (typeof firebase !== 'undefined' && window.firebaseInitialized) {
    loadDataFromFirebase();
  } else {
    console.log("Firebase SDK non chargé ou non configuré, utilisation des données statiques");
  }
}

/**
 * Met à jour le titre du tableau de bord avec ou sans mention BAFD
 */
function updateDashboardTitle() {
  const title = document.getElementById('main-dashboard-title');
  if (!title || !window.currentUserFullName) return;

  const bafdText = window.userHasBafd ? ' & BAFD' : '';
  title.innerHTML = `Détails des expériences BAFA${bafdText} de <orange>${window.currentUserFullName}</orange>`;
}

// Charger le profil utilisateur (pour le titre, confidentialité et LinkedIn)
async function loadUserProfile() {
  if (!window.targetUid || !window.firebaseDb) return true;

  try {
    const doc = await window.firebaseDb.collection('users').doc(window.targetUid).get();
    const data = doc.exists ? doc.data() : { isPrivate: true };

    const linkedinLink = document.getElementById('linkedin-link');
    // Construire le nom complet
    let fullName = 'Animateur';
    if (data.firstname && data.lastname) {
      // Formater: Prénom (1ère lettre maj, reste min) NOM (tout maj)
      const formatName = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      fullName = `${formatName(data.firstname)} ${data.lastname.toUpperCase()}`;
    } else if (data.displayName) {
      fullName = data.displayName;
    } else if (data.email) {
      fullName = data.email.split('@')[0];
    }
    window.currentUserFullName = fullName;

    // Charger la préférence de l'en-tête collant
    window.stickyHeaderEnabled = data.stickyHeader !== false;
    localStorage.setItem('stickyHeaderEnabled', window.stickyHeaderEnabled ? 'true' : 'false');

    // Mettre à jour le titre initialement (uniquement BAFA par défaut)
    window.userHasBafd = false;
    updateDashboardTitle();

    // Gestion de la confidentialité (Compte privé)
    const isOwner = window.currentUser && window.currentUser.uid === window.targetUid;
    const ownerNotice = document.getElementById('privacy-notice-owner');
    const visitorNotice = document.getElementById('privacy-notice-visitor');
    const promoBanner = document.getElementById('promo-banner-visitor');
    const fictionalNotice = document.getElementById('fictional-profile-notice');
    const introSection = document.getElementById('intro-section');
    const sectionExperiences = document.getElementById('section-experiences');
    const sectionFormations = document.getElementById('section-formations');
    const sectionStats = document.getElementById('section-statistiques');
    const tableExperiences = document.getElementById('table-experiences');
    const tableFormations = document.getElementById('table-formations');
    const statsSection = document.getElementById('statistiques');
    const footer = document.getElementById('footer');
    const dashboardTitle = document.getElementById('main-dashboard-title');
    const settingsBtn = document.getElementById('settings-btn');
    const quickCopyBtn = document.getElementById('quick-copy-link-btn');

    // Reset notices
    if (ownerNotice) ownerNotice.style.display = 'none';
    if (visitorNotice) visitorNotice.style.display = 'none';

    if (data.isPrivate === true) {
      if (isOwner) {
        // Propriétaire : Afficher la page normalement + bandeau info privé
        if (ownerNotice) ownerNotice.style.display = 'block';
      } else {
        // Visiteur non autorisé : Masquer tout le contenu et afficher le message de profil privé
        if (visitorNotice) visitorNotice.style.display = 'block';
        if (promoBanner) promoBanner.style.display = 'none';
        if (fictionalNotice) fictionalNotice.style.display = 'none';
        if (quickCopyBtn) quickCopyBtn.style.display = 'none';
        if (settingsBtn) settingsBtn.style.display = 'none';
        if (linkedinLink) linkedinLink.style.display = 'none';

        // Masquer les sections de contenu
        const sectionsToHide = [
          introSection, sectionExperiences, sectionFormations, sectionStats,
          tableExperiences, tableFormations, statsSection, dashboardTitle, footer
        ];

        sectionsToHide.forEach(el => {
          if (el) el.style.setProperty('display', 'none', 'important');
        });

        // Masquer tous les conteneurs de recherche et la barre de sommaire
        document.querySelectorAll('.search-container').forEach(el => el.style.setProperty('display', 'none', 'important'));
        document.querySelectorAll('.nav-toc-link').forEach(item => item.style.setProperty('display', 'none', 'important'));

        if (typeof window.updateNavbarLinksVisibility === 'function') {
          window.updateNavbarLinksVisibility();
        }

        console.log("Accès refusé : Profil privé");
        return false; // Accès refusé
      }
    }

    // Si accès public OU autorisé (propriétaire d'un compte privé)
    if (data.isPrivate !== true || isOwner) {
      // Accès public ou autorisé : S'assurer que les sections sont visibles
      const sectionsToShow = [
        introSection, sectionExperiences, sectionFormations, sectionStats,
        tableExperiences, tableFormations, statsSection, dashboardTitle, footer
      ];

      sectionsToShow.forEach(el => {
        if (el) el.style.setProperty('display', '', ''); // Reset display
      });
      document.querySelectorAll('.search-container').forEach(el => el.style.setProperty('display', '', ''));
      document.querySelectorAll('.nav-toc-link').forEach(item => item.style.setProperty('display', '', ''));

      if (window.targetUid === '5DP6faC4Y8ce6K3x07aC2qHjflq2' && fictionalNotice) {
        fictionalNotice.style.display = 'block';
      }

      if (typeof window.updateNavbarLinksVisibility === 'function') {
        window.updateNavbarLinksVisibility();
      }
    }

    // Gérer l'icône LinkedIn et le positionnement du bouton paramètres
    if (linkedinLink) {
      if (data.linkedin && data.linkedin.trim() !== '') {
        linkedinLink.href = data.linkedin;
        linkedinLink.style.display = 'block';
        if (settingsBtn) {
          settingsBtn.style.left = '70px';
          settingsBtn.style.top = '26px';
        }
      } else {
        linkedinLink.style.display = 'none';
        if (settingsBtn) {
          settingsBtn.style.left = '20px';
          settingsBtn.style.top = '18px';
        }
      }
    }

    // Gérer l'affichage de l'email de contact
    const contactEmailParagraph = document.getElementById('contact-email-paragraph');
    const contactEmailLink = document.getElementById('contact-email-link');

    console.log('Affichage email:', { visible: data.emailVisible, email: data.email });

    if (contactEmailParagraph && contactEmailLink) {
      if (data.emailVisible && data.email) {
        contactEmailLink.href = `mailto:${data.email}`;
        contactEmailLink.textContent = data.email;
        contactEmailParagraph.style.display = 'block';
      } else {
        contactEmailParagraph.style.display = 'none';
      }
    }

    // Mettre à jour les statistiques manuelles
    if (data.stats) {
      const animators = data.stats.animators || 0;
      const directors = data.stats.directors || 0;
      const trainers = data.stats.trainers || 0;
      const gender = data.gender || '';

      const parts = [];
      if (animators > 0) {
        let label = animators > 1 ? 'animateurs' : 'animateur';
        if (gender === 'feminin') label = animators > 1 ? 'animatrices' : 'animatrice';
        parts.push(`<span class="stat-value">${animators}</span> ${label}`);
      }
      if (directors > 0) {
        let label = directors > 1 ? 'directeurs' : 'directeur';
        if (gender === 'feminin') label = directors > 1 ? 'directrices' : 'directrice';
        parts.push(`<span class="stat-value">${directors}</span> ${label}`);
      }
      if (trainers > 0) {
        let label = trainers > 1 ? 'formateurs' : 'formateur';
        if (gender === 'feminin') label = trainers > 1 ? 'formatrices' : 'formatrice';
        parts.push(`<span class="stat-value">${trainers}</span> ${label}`);
      }

      const sentenceEl = document.getElementById('stat-colleagues-sentence');
      if (sentenceEl && parts.length > 0) {
        let sentence = "J'ai travaillé avec ";
        if (parts.length === 1) {
          sentence += parts[0];
        } else if (parts.length > 0) {
          const last = parts.pop();
          sentence += parts.join(', ') + ' et ' + last;
        }
        sentenceEl.innerHTML = sentence;
        sentenceEl.style.display = 'block';
      } else if (sentenceEl) {
        sentenceEl.style.display = 'none';
      }
    }

    return true; // Accès autorisé
  } catch (e) {
    console.error("Erreur chargement profil", e);
    const visitorNotice = document.getElementById('privacy-notice-visitor');
    const ownerNotice = document.getElementById('privacy-notice-owner');
    const promoBanner = document.getElementById('promo-banner-visitor');
    const sectionsToHide = [
      document.getElementById('intro-section'),
      document.getElementById('section-experiences'),
      document.getElementById('section-formations'),
      document.getElementById('section-statistiques'),
      document.getElementById('main-dashboard-title'),
      document.getElementById('footer')
    ];

    if (ownerNotice) ownerNotice.style.display = 'none';
    if (visitorNotice) visitorNotice.style.display = 'block';
    if (promoBanner) promoBanner.style.display = 'none';
    sectionsToHide.forEach(el => {
      if (el) el.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('.search-container').forEach(el => el.style.setProperty('display', 'none', 'important'));
    document.querySelectorAll('.nav-toc-link').forEach(item => item.style.setProperty('display', 'none', 'important'));
    return false;
  }
}

// Essayer de charger immédiatement si le DOM est déjà chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFirebaseData);
} else {
  // Le DOM est déjà chargé
  setTimeout(initializeFirebaseData, 500); // Attendre un peu pour que Firebase soit initialisé
}

