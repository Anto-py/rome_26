// Point d'entrée : routage par ancre (#programme/mar-colisee…), rafraîchissement chaque minute.
import { VOYAGE } from "./data.js";
import { situation } from "./temps.js";
import { horodatage } from "./outils.js";
import { initVues, rendreMaintenant, rendreProgramme, majProgramme, rendreInfos } from "./vues.js";
import { initRecherche } from "./recherche.js";
import { initCarte, afficherCarte } from "./carte.js";

const VUES = ["maintenant", "programme", "carte", "infos"];

// ?t=2026-10-28T14:30 remplace l'heure du téléphone (tests)
const forcee = new URLSearchParams(location.search).get("t");
const maintenant = () => (forcee ? new Date(forcee) : new Date());

const vue = nom => document.getElementById(`vue-${nom}`);

function rafraichir() {
  const d = maintenant();
  rendreMaintenant(vue("maintenant"), situation(d, VOYAGE), Boolean(forcee));
  majProgramme(vue("programme"), horodatage(d));
}

function ouvrirFiche(prefixe, id) {
  const el = document.getElementById(`${prefixe}-${id}`);
  if (!el) return;
  const jour = el.closest("details.jour");
  if (jour) jour.open = true;
  el.open = true;
  el.classList.remove("ciblee");
  void el.offsetWidth; // relance l'animation de repérage
  el.classList.add("ciblee");
  el.scrollIntoView({ block: "start" });
}

function router() {
  const [demande, cible] = location.hash.slice(1).split("/");
  const nom = VUES.includes(demande) ? demande : "maintenant";
  for (const v of VUES) vue(v).hidden = v !== nom;
  for (const a of document.querySelectorAll(".onglet")) {
    if (a.dataset.vue === nom) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
  document.body.dataset.vue = nom;
  if (nom === "carte") afficherCarte(horodatage(maintenant()), cible);
  if (cible && nom === "programme") ouvrirFiche("etape", cible);
  else if (cible && nom === "infos") ouvrirFiche("info", cible);
  else window.scrollTo(0, 0);
}

function etatReseau() {
  document.getElementById("pastille-reseau").hidden = navigator.onLine;
}

function demarrer() {
  initVues(VOYAGE);
  rendreProgramme(vue("programme"), horodatage(maintenant()));
  rendreInfos(vue("infos"));
  initCarte(VOYAGE);
  initRecherche(VOYAGE);
  rafraichir();
  router();

  window.addEventListener("hashchange", router);
  // Un lien vers l'ancre déjà affichée ne déclenche pas hashchange : on relance le routage
  document.addEventListener("click", ev => {
    const a = ev.target.closest('a[href^="#"]');
    if (a && a.getAttribute("href") === location.hash) router();
  });
  setInterval(rafraichir, 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) rafraichir(); });
  window.addEventListener("online", etatReseau);
  window.addEventListener("offline", etatReseau);
  etatReseau();
}

demarrer();

// Hors ligne. Quand une nouvelle version prend la main, on recharge une fois pour l'afficher.
if ("serviceWorker" in navigator) {
  const avaitControleur = Boolean(navigator.serviceWorker.controller);
  let recharge = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (avaitControleur && !recharge) { recharge = true; location.reload(); }
  });
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
