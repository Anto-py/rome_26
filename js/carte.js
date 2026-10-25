// Carte Leaflet, créée à la première ouverture de l'onglet (un conteneur caché mesure 0 × 0).
import { jourCourt, heureEtape, lienMaps, echapper as e } from "./outils.js";
import { jourCourant } from "./temps.js";

/* global L */
const COULEURS = { "2026-10-26": "#E3A535", "2026-10-27": "#E4632E", "2026-10-28": "#127676", "2026-10-29": "#0D1617" };

let V, carte, marqueurs = [], filtre = "tous", pointMoi = null;

function etapesDuLieu(lieu) {
  return V.etapes
    .filter(x => x.lieu === lieu.id || x.id === lieu.etape || (x.branches || []).some(b => b.lieu === lieu.id))
    .sort((a, b) => (a.jour + a.debut).localeCompare(b.jour + b.debut));
}

function contenuBulle(lieu, etapes) {
  const lignes = etapes.map(x => {
    const titre = x.branches ? x.branches.map(b => b.titre).join(" ou ") : x.titre;
    return `<li><span class="bulle-quand">${jourCourt(x.jour)}, ${heureEtape(x)}</span> ${e(titre)}
      <a class="bulle-lien" href="#programme/${x.id}">Voir l'étape</a></li>`;
  }).join("");
  return `<div class="bulle">
    <p class="bulle-nom">${e(lieu.nom)}</p>
    ${lieu.approx ? `<p class="bulle-approx">Position approximative (rue)</p>` : ""}
    <p class="bulle-adresse">${e(lieu.adresse)}</p>
    ${lignes ? `<ul class="bulle-etapes">${lignes}</ul>` : ""}
    <a class="btn btn-action" href="${lienMaps(lieu)}" target="_blank" rel="noopener">Y aller</a>
  </div>`;
}

function icone(lieu, couleur) {
  if (lieu.type === "hotel") {
    return L.divIcon({ className: "marqueur", iconSize: [44, 44], html: `<span class="pin pin-hotel" aria-hidden="true">H</span>` });
  }
  const taille = lieu.type === "boutique" ? "pin-petit" : "";
  return L.divIcon({ className: "marqueur", iconSize: [44, 44], html: `<span class="pin ${taille}" style="--c:${couleur}" aria-hidden="true"></span>` });
}

function creer(conteneur) {
  carte = L.map(conteneur, { zoomControl: false, attributionControl: true }).setView([41.899, 12.48], 13);
  L.control.zoom({ position: "bottomleft", zoomInTitle: "Zoomer", zoomOutTitle: "Dézoomer" }).addTo(carte);
  carte.attributionControl.setPrefix(false);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, attribution: "© OpenStreetMap"
  }).on("tileerror", () => bandeau(true)).addTo(carte);

  for (const lieu of V.lieux) {
    const etapes = etapesDuLieu(lieu);
    const jours = [...new Set(etapes.map(x => x.jour))];
    const couleur = COULEURS[jours[0]] || "#0B4E4E";
    const m = L.marker([lieu.lat, lieu.lon], { icon: icone(lieu, couleur), title: lieu.nom, alt: lieu.nom, keyboard: true })
      .bindPopup(contenuBulle(lieu, etapes), { maxWidth: 280, autoPanPadding: [20, 20] });
    marqueurs.push({ lieu, jours, m });
  }
}

function appliquerFiltre(ajuster = true) {
  const visibles = [];
  for (const { lieu, jours, m } of marqueurs) {
    const montrer = filtre === "tous" || jours.includes(filtre) || lieu.type === "hotel";
    if (montrer) {
      // Un lieu de plusieurs jours prend la couleur du jour filtré
      const jour = jours.includes(filtre) ? filtre : jours[0];
      m.setIcon(icone(lieu, COULEURS[jour] || "#0B4E4E"));
      m.addTo(carte); visibles.push([lieu.lat, lieu.lon]);
    } else m.remove();
  }
  for (const b of document.querySelectorAll(".filtre")) b.setAttribute("aria-pressed", String(b.dataset.jour === filtre));
  if (ajuster && visibles.length) carte.fitBounds(visibles, { padding: [36, 36], maxZoom: 16 });
}

function bandeau(horsLigne) {
  document.getElementById("carte-hors-ligne").hidden = !horsLigne;
}

function message(texte) {
  const el = document.getElementById("carte-message");
  el.textContent = texte;
  el.hidden = !texte;
}

function ouSuisJe() {
  if (!("geolocation" in navigator)) { message("Position indisponible sur cet appareil."); return; }
  message("Recherche de la position…");
  navigator.geolocation.getCurrentPosition(pos => {
    message("");
    const ici = [pos.coords.latitude, pos.coords.longitude];
    if (pointMoi) pointMoi.setLatLng(ici);
    else pointMoi = L.circleMarker(ici, { radius: 9, color: "#fff", weight: 3, fillColor: "#1A73E8", fillOpacity: 1 }).addTo(carte);
    carte.setView(ici, Math.max(carte.getZoom(), 15));
  }, err => {
    message(err.code === 1 ? "Position non autorisée : la carte reste utilisable." : "Position indisponible pour l'instant.");
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
}

export function initCarte(voyage) {
  V = voyage;
  const filtres = document.getElementById("carte-filtres");
  const jours = [...new Set(V.etapes.map(x => x.jour))].sort();
  filtres.innerHTML = `<button type="button" class="filtre" data-jour="tous" aria-pressed="false">Tous</button>` +
    jours.map(j => `<button type="button" class="filtre" data-jour="${j}" aria-pressed="false"><span class="filtre-point" style="--c:${COULEURS[j]}" aria-hidden="true"></span>${jourCourt(j).split(" ")[0]}</button>`).join("");
  filtres.addEventListener("click", ev => {
    const b = ev.target.closest(".filtre");
    if (b) { filtre = b.dataset.jour; appliquerFiltre(); }
  });
  document.getElementById("bouton-ou").addEventListener("click", ouSuisJe);
  window.addEventListener("online", () => bandeau(false));
  window.addEventListener("offline", () => bandeau(true));
  bandeau(!navigator.onLine);
}

// Appelée à chaque affichage de l'onglet ; cible = id d'un lieu à ouvrir
export function afficherCarte(t, cible) {
  if (!carte) {
    const jour = t.slice(0, 10);
    filtre = V.etapes.some(x => x.jour === jour) ? jourCourant(V, t) : "tous";
    creer(document.getElementById("carte"));
    appliquerFiltre();
  }
  carte.invalidateSize();
  const vise = cible && marqueurs.find(x => x.lieu.id === cible);
  if (vise) {
    if (!carte.hasLayer(vise.m)) { filtre = "tous"; appliquerFiltre(false); }
    carte.setView([vise.lieu.lat, vise.lieu.lon], 16);
    vise.m.openPopup();
  }
}
