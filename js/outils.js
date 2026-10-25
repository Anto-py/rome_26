// Petites fonctions partagées : format des heures et des jours, liens, normalisation.

const JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const JOURS_COURTS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// "14:00" → "14h", "16:30" → "16h30", "07:50" → "7h50"
export function heure(hhmm) {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":");
  return `${Number(h)}h${m === "00" ? "" : m}`;
}

// Heure d'une étape telle qu'affichée : « vers 14h » si approximative, « 13h30 » sinon
export function heureEtape(etape) {
  return etape.approx ? `vers ${heure(etape.debut)}` : heure(etape.debut);
}

function dateDuJour(jour) {
  const [a, m, j] = jour.split("-").map(Number);
  return new Date(a, m - 1, j);
}

// "2026-10-27" → "Mardi 27"
export function jourLong(jour) {
  const d = dateDuJour(jour);
  return `${JOURS[d.getDay()]} ${d.getDate()}`;
}

// "2026-10-27" → "Mar 27"
export function jourCourt(jour) {
  const d = dateDuJour(jour);
  return `${JOURS_COURTS[d.getDay()]} ${d.getDate()}`;
}

// Date locale → "AAAA-MM-JJTHH:MM", comparable comme chaîne aux heures de data.js
export function horodatage(date) {
  const p = n => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export function lienMaps(lieu) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lieu.lat},${lieu.lon}&travelmode=transit`;
}

export function lienTel(numero) {
  return `tel:${numero.replace(/\s/g, "")}`;
}

// Minuscules, sans accents : « Colisée » → « colisee »
export function normaliser(texte) {
  return (texte || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function echapper(texte) {
  return String(texte ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export const PASTILLES = {
  identite: "Pièce d'identité",
  tenue: "Épaules couvertes, pantalon long",
  ecouteurs: "Écouteurs",
  sac: "Petit sac"
};
