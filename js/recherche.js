// Recherche plein texte, insensible aux accents et à la casse. L'index est dérivé au chargement.
import { normaliser, heureEtape, jourCourt, echapper as e } from "./outils.js";

const RACCOURCIS = [
  { libelle: "Métro", href: "#infos/metro-billets" },
  { libelle: "Billets", href: "#infos/reservations" },
  { libelle: "Hôtel", href: "#infos/hotel" }
];
const GROUPES = { etape: "Étapes", info: "Infos", lieu: "Lieux" };

function construireIndex(V) {
  const lieu = id => V.lieux.find(l => l.id === id);
  const trajet = id => V.trajets.find(t => t.id === id);
  const morceauxLieu = id => { const l = lieu(id); return l ? [l.nom, l.adresse] : []; };
  const morceauxTrajet = id => { const t = trajet(id); return t ? [t.montee, t.descente, t.direction, t.aPied] : []; };
  const index = [];

  for (const x of V.etapes) {
    const parties = x.branches
      ? x.branches.flatMap(b => [b.condition, b.titre, b.ligneCle, b.texte, ...morceauxLieu(b.lieu), ...morceauxTrajet(b.trajet)])
      : [x.titre, x.ligneCle, x.texte, ...morceauxLieu(x.lieu), ...morceauxTrajet(x.trajet)];
    index.push({
      type: "etape", id: x.id,
      titre: x.branches ? x.branches.map(b => b.titre).join(" ou ") : x.titre,
      contexte: `${jourCourt(x.jour)}, ${heureEtape(x)}`,
      href: `#programme/${x.id}`,
      texteNormalise: normaliser(parties.filter(Boolean).join(" "))
    });
  }
  for (const i of V.infos) {
    index.push({
      type: "info", id: i.id, titre: i.titre, contexte: "Infos pratiques", href: `#infos/${i.id}`,
      texteNormalise: normaliser([i.titre, ...i.points, ...(i.tel || []).map(t => t.libelle)].join(" "))
    });
  }
  for (const l of V.lieux) {
    index.push({
      type: "lieu", id: l.id, titre: l.nom, contexte: l.adresse, href: `#carte/${l.id}`,
      texteNormalise: normaliser(`${l.nom} ${l.adresse}`)
    });
  }
  return index;
}

// Tous les mots de la requête doivent apparaître ; un seul résultat par fiche.
// Rang : titre qui commence par la requête, puis titre qui la contient, puis le reste (tri stable).
export function chercher(index, requete) {
  const q = normaliser(requete).trim();
  const mots = q.split(/\s+/).filter(Boolean);
  const rang = x => {
    const titre = normaliser(x.titre);
    if (titre.startsWith(q)) return 0;
    return mots.every(m => titre.includes(m)) ? 1 : 2;
  };
  return index
    .filter(x => mots.every(m => x.texteNormalise.includes(m)))
    .sort((a, b) => rang(a) - rang(b));
}

const htmlRaccourcis = () => `<p class="recherche-aide">Raccourcis</p>
  <div class="raccourcis">${RACCOURCIS.map(r => `<a class="jeton" href="${r.href}">${r.libelle}</a>`).join("")}</div>`;

export function initRecherche(V) {
  const index = construireIndex(V);
  const panneau = document.getElementById("recherche");
  const champ = document.getElementById("recherche-champ");
  const resultats = document.getElementById("recherche-resultats");
  const ouvrir = document.getElementById("bouton-recherche");
  const fermer = document.getElementById("recherche-fermer");

  function afficher() {
    const q = champ.value.trim();
    if (q.length < 2) { resultats.innerHTML = htmlRaccourcis(); return; }
    const trouves = chercher(index, q);
    if (!trouves.length) {
      resultats.innerHTML = `<p class="recherche-vide">Rien pour « ${e(q)} »</p>${htmlRaccourcis()}`;
      return;
    }
    resultats.innerHTML = Object.entries(GROUPES).map(([type, titre]) => {
      const liste = trouves.filter(x => x.type === type);
      if (!liste.length) return "";
      return `<h3 class="recherche-groupe">${titre}</h3><ul class="recherche-liste">${liste.map(x =>
        `<li><a class="resultat" href="${x.href}"><span class="resultat-titre">${e(x.titre)}</span><span class="resultat-contexte">${e(x.contexte)}</span></a></li>`
      ).join("")}</ul>`;
    }).join("");
  }

  function montrer() {
    panneau.hidden = false;
    document.body.classList.add("recherche-ouverte");
    champ.value = "";
    afficher();
    champ.focus(); // dans le geste de l'utilisateur, pour sortir le clavier sur iPhone
  }
  function cacher() {
    panneau.hidden = true;
    document.body.classList.remove("recherche-ouverte");
    ouvrir.focus({ preventScroll: true });
  }

  ouvrir.addEventListener("click", montrer);
  fermer.addEventListener("click", cacher);
  champ.addEventListener("input", afficher);
  panneau.addEventListener("keydown", ev => { if (ev.key === "Escape") cacher(); });
  // Un résultat ou un raccourci : la navigation suit l'ancre, on referme seulement le panneau
  resultats.addEventListener("click", ev => { if (ev.target.closest("a")) cacher(); });
}
