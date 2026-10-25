// Rendu des vues Maintenant, Programme et Infos, à partir de VOYAGE.
import { heure, heureEtape, jourLong, lienMaps, lienTel, echapper as e, PASTILLES } from "./outils.js";
import { etapesTriees, estPassee, estEnCours, jourCourant } from "./temps.js";

let V;
const lieuDe = id => V.lieux.find(l => l.id === id);
const trajetDe = id => V.trajets.find(t => t.id === id);

export function initVues(voyage) { V = voyage; }

// ---------- Briques communes ----------

function boutonYAller(lieuId) {
  const lieu = lieuDe(lieuId);
  if (!lieu) return "";
  return `<a class="btn btn-action" href="${lienMaps(lieu)}" target="_blank" rel="noopener">Y aller</a>`;
}

function boutonVoir(etapeId) {
  return `<a class="btn btn-secondaire" href="#programme/${etapeId}">Voir l'étape</a>`;
}

function lienOfficiel(url) {
  return url ? `<a class="btn btn-secondaire" href="${e(url)}" target="_blank" rel="noopener">Site officiel</a>` : "";
}

function htmlAdresse(lieuId) {
  const lieu = lieuDe(lieuId);
  if (!lieu) return "";
  const approx = lieu.approx ? ` <span class="approx">(position approximative, rue)</span>` : "";
  return `<p class="adresse">${e(lieu.adresse)}${approx}</p>`;
}

function htmlPastilles(liste) {
  if (!liste || !liste.length) return "";
  return `<ul class="pastilles">${liste.map(p => `<li class="pastille">${e(PASTILLES[p] || p)}</li>`).join("")}</ul>`;
}

const arrets = n => n === 0 ? "Aucun arrêt entre" : `${n} arrêt${n > 1 ? "s" : ""} entre`;

export function htmlTrajet(trajetId, departConseille) {
  const t = trajetDe(trajetId);
  if (!t) return "";
  const depart = departConseille ? `<p class="depart">Départ conseillé : <strong>${heure(departConseille)}</strong>, de ${e(t.montee)}</p>` : "";
  if (t.ligne === "pied") {
    return `<div class="trajet">${depart}
      <p class="trajet-ligne"><span class="ligne ligne-pied">À pied</span> ${e(t.montee)} → ${e(t.descente)}</p>
      ${t.aPied ? `<p class="trajet-pied">${e(t.aPied)}</p>` : ""}</div>`;
  }
  const details = [
    t.direction && `Direction <strong>${e(t.direction)}</strong>`,
    t.arretsEntre != null && arrets(t.arretsEntre),
    t.arretAvant && `Arrêt précédent : ${e(t.arretAvant)}`
  ].filter(Boolean);
  const badge = t.ligne === "train" ? "Train" : t.ligne;
  return `<div class="trajet">${depart}
    <p class="trajet-ligne"><span class="ligne ligne-${t.ligne.toLowerCase()}" aria-label="${t.ligne === "train" ? "Train" : `Ligne ${t.ligne}`}">${badge}</span>
      <span>${e(t.montee)} → <strong>${e(t.descente)}</strong></span></p>
    <ul class="trajet-details">${details.map(d => `<li>${d}</li>`).join("")}</ul>
    ${t.aPied ? `<p class="trajet-pied">À pied : ${e(t.aPied)}</p>` : ""}</div>`;
}

const reserve = etape => etape.reserve ? `<span class="jeton-reserve">Réservé</span>` : "";

// ---------- Maintenant / Ensuite ----------

function plage(etape) {
  return etape.approx ? heureEtape(etape) : `${heure(etape.debut)} à ${heure(etape.fin)}`;
}

// Carte d'une branche, compacte, pour être posée côte à côte avec sa voisine
function carteBranche(b, etapeId) {
  return `<article class="branche">
    <p class="branche-condition">${e(b.condition)}</p>
    <h4 class="branche-titre">${e(b.titre)}</h4>
    <p class="cle">${e(b.ligneCle)}</p>
    <div class="actions">${boutonYAller(b.lieu)}${boutonVoir(etapeId)}</div>
  </article>`;
}

function corpsEtape(etape, { avecDepart }) {
  if (etape.branches) {
    return `<p class="bloc-heure">${plage(etape)}</p>
      <div class="branches branches-cote">${etape.branches.map(b => carteBranche(b, etape.id)).join("")}</div>`;
  }
  return `<p class="bloc-heure">${plage(etape)} ${reserve(etape)}</p>
    <h3 class="bloc-etape ${etape.reserve ? "ferme" : ""}">${e(etape.titre)}</h3>
    <p class="cle">${e(etape.ligneCle)}</p>
    ${htmlTrajet(etape.trajet, avecDepart ? etape.departConseille : null)}
    <div class="actions">${boutonYAller(etape.lieu)}${boutonVoir(etape.id)}</div>`;
}

function libelleJour(suivante, t) {
  const aujourdhui = t.slice(0, 10);
  if (suivante.jour === aujourdhui) return "Aujourd'hui";
  const d = new Date(`${aujourdhui}T12:00`); d.setDate(d.getDate() + 1);
  const demain = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return suivante.jour === demain ? "Demain" : jourLong(suivante.jour);
}

function dureeAvant(t, cible) {
  const ms = new Date(cible) - new Date(t);
  const h = Math.round(ms / 3600000);
  if (h >= 48) return `${Math.round(h / 24)} jours`;
  if (h >= 1) return `${h} h`;
  return `${Math.max(1, Math.round(ms / 60000))} min`;
}

export function rendreMaintenant(conteneur, s, simulee) {
  const horloge = `<p class="horloge">${jourLong(s.maintenant.slice(0, 10))}, ${heure(s.maintenant.slice(11))}${simulee ? ` <span class="simulee">heure simulée</span>` : ""}</p>`;
  let html;
  if (s.etat === "avant") {
    html = `<section class="bloc bloc-annonce">
        <h2 class="bloc-titre">Atterrissage dans ${dureeAvant(s.maintenant, V.debut)}</h2>
        <p class="cle">Lundi 26, 11h15, Fiumicino</p>
      </section>
      <section class="bloc bloc-ensuite">
        <h2 class="bloc-titre">Première étape</h2>${corpsEtape(s.suivante, { avecDepart: true })}
      </section>`;
  } else if (s.etat === "apres") {
    html = `<section class="bloc bloc-annonce">
        <h2 class="bloc-titre">Bon retour</h2>
        <p class="cle">Arrivederci Roma.</p>
        <div class="actions"><a class="btn btn-secondaire" href="#programme">Revoir le programme</a></div>
      </section>`;
  } else if (s.etat === "nuit") {
    html = `<section class="bloc bloc-annonce">
        <h2 class="bloc-titre">${libelleJour(s.suivante, s.maintenant)}</h2>
        <p class="cle">Premier rendez-vous et départ de l'hôtel</p>
      </section>
      <section class="bloc bloc-ensuite">
        <h2 class="bloc-titre">${jourLong(s.suivante.jour)}</h2>${corpsEtape(s.suivante, { avecDepart: true })}
      </section>`;
  } else {
    const maintenant = s.enCours
      ? corpsEtape(s.enCours, { avecDepart: false })
      : `<p class="cle">Rien de prévu en ce moment.</p>`;
    const ensuite = s.suivante
      ? `${s.suivante.jour !== s.maintenant.slice(0, 10) ? `<p class="bloc-jour">${jourLong(s.suivante.jour)}</p>` : ""}${corpsEtape(s.suivante, { avecDepart: true })}`
      : `<p class="cle">Plus rien de prévu.</p>`;
    html = `<section class="bloc bloc-maintenant"><h2 class="bloc-titre">Maintenant</h2>${maintenant}</section>
      <section class="bloc bloc-ensuite"><h2 class="bloc-titre">Ensuite</h2>${ensuite}</section>`;
  }
  conteneur.innerHTML = horloge + html;
}

// ---------- Programme ----------

function ficheEtape(etape) {
  if (etape.branches) {
    const cle = etape.branches.map(b => `${b.condition} : ${b.titre}`).join(" · ");
    return `<details class="etape" id="etape-${etape.id}" data-id="${etape.id}">
      <summary><span class="etape-heure">${heureEtape(etape)}</span>
        <span class="etape-corps"><span class="etape-titre">Deux possibilités</span><span class="etape-cle">${e(cle)}</span></span></summary>
      <div class="etape-detail branches">
        ${etape.branches.map(b => `<article class="branche">
          <p class="branche-condition">${e(b.condition)}</p>
          <h4 class="branche-titre">${e(b.titre)}</h4>
          <p class="cle">${e(b.ligneCle)}</p>
          ${b.texte ? `<p>${e(b.texte)}</p>` : ""}
          ${htmlAdresse(b.lieu)}
          ${htmlTrajet(b.trajet)}
          <div class="actions">${boutonYAller(b.lieu)}${b.lien ? lienOfficiel(b.lien) : ""}</div>
        </article>`).join("")}
      </div></details>`;
  }
  return `<details class="etape ${etape.reserve ? "ferme" : ""}" id="etape-${etape.id}" data-id="${etape.id}">
    <summary><span class="etape-heure">${heureEtape(etape)}</span>
      <span class="etape-corps"><span class="etape-titre">${e(etape.titre)}</span>${reserve(etape)}
      <span class="etape-cle">${e(etape.ligneCle)}</span></span></summary>
    <div class="etape-detail">
      <p>${e(etape.texte)}</p>
      ${htmlPastilles(etape.pastilles)}
      ${htmlAdresse(etape.lieu)}
      ${htmlTrajet(etape.trajet, etape.departConseille)}
      <div class="actions">${boutonYAller(etape.lieu)}${lienOfficiel(etape.lien)}</div>
    </div></details>`;
}

export function rendreProgramme(conteneur, t) {
  const etapes = etapesTriees(V);
  const jours = [...new Set(etapes.map(x => x.jour))];
  const ouvert = jourCourant(V, t);
  conteneur.innerHTML = `<h2 class="vue-titre">Programme</h2>` + jours.map(j => `
    <details class="jour" id="jour-${j}" ${j === ouvert ? "open" : ""}>
      <summary class="jour-titre">${jourLong(j)}</summary>
      <div class="jour-etapes">${etapes.filter(x => x.jour === j).map(ficheEtape).join("")}</div>
    </details>`).join("");
  majProgramme(conteneur, t);
}

// Grise le passé et lisère l'étape en cours, sans refermer ce que l'utilisateur a ouvert
export function majProgramme(conteneur, t) {
  for (const el of conteneur.querySelectorAll("details.etape")) {
    const etape = V.etapes.find(x => x.id === el.dataset.id);
    el.classList.toggle("passee", estPassee(etape, t));
    el.classList.toggle("en-cours", estEnCours(etape, t));
  }
}

// ---------- Infos ----------

export function rendreInfos(conteneur) {
  conteneur.innerHTML = `<h2 class="vue-titre">Infos</h2>` + V.infos.map(info => `
    <details class="info" id="info-${info.id}">
      <summary class="info-titre">${e(info.titre)}</summary>
      <div class="info-detail">
        <ul class="points">${info.points.map(p => `<li>${e(p)}</li>`).join("")}</ul>
        ${info.lieu ? htmlAdresse(info.lieu) : ""}
        <div class="actions">
          ${(info.tel || []).map(n => `<a class="btn btn-action" href="${lienTel(n.numero)}">${e(n.libelle)} : ${e(n.numero)}</a>`).join("")}
          ${(info.liens || []).map(l => `<a class="btn btn-secondaire" href="${e(l.url)}" target="_blank" rel="noopener">${e(l.libelle)}</a>`).join("")}
          ${info.lieu ? boutonYAller(info.lieu) : ""}
        </div>
      </div>
    </details>`).join("") + `
    <footer class="pied">
      <p class="pied-ornement" aria-hidden="true">❧</p>
      <p>Made by <a href="https://www.linkedin.com/in/antonin-bareau/" target="_blank" rel="noopener">Antonin Bareau</a> avec l'aide essentielle d'un ou plusieurs LLM</p>
      <p><a href="https://creativecommons.org/licenses/by-nc-sa/4.0/" target="_blank" rel="noopener">Licence Creative Commons CC BY-NC-SA</a></p>
      <p>Carte © contributeurs OpenStreetMap</p>
    </footer>`;
}
