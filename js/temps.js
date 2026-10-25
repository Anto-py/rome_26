// Où en est-on du voyage ? Fonction pure, testable en lui passant n'importe quelle date.
import { horodatage } from "./outils.js";

export function etapesTriees(voyage) {
  return [...voyage.etapes].sort((a, b) => (a.jour + a.debut).localeCompare(b.jour + b.debut));
}

const debutDe = e => `${e.jour}T${e.debut}`;
const finDe = e => `${e.jour}T${e.fin}`;

// → { etat: "avant" | "pendant" | "nuit" | "apres", enCours, suivante, maintenant }
// « nuit » : aucune étape en cours et la suivante tombe un autre jour (ou plus tard ce matin).
export function situation(maintenant, voyage) {
  const t = horodatage(maintenant);
  const etapes = etapesTriees(voyage);

  if (t < voyage.debut) return { etat: "avant", enCours: null, suivante: etapes[0], maintenant: t };
  if (t >= voyage.fin) return { etat: "apres", enCours: null, suivante: null, maintenant: t };

  // Si deux étapes se chevauchent, la plus récemment commencée l'emporte.
  const enCours = etapes.filter(e => debutDe(e) <= t && t < finDe(e)).pop() || null;
  const suivante = etapes.find(e => debutDe(e) > t) || null;

  if (enCours) return { etat: "pendant", enCours, suivante, maintenant: t };

  // Trou dans la journée : la suivante est aujourd'hui, après une étape déjà passée aujourd'hui.
  const jour = t.slice(0, 10);
  const dejaCommence = etapes.some(e => e.jour === jour && finDe(e) <= t);
  if (suivante && suivante.jour === jour && dejaCommence) return { etat: "pendant", enCours: null, suivante, maintenant: t };

  return { etat: "nuit", enCours: null, suivante, maintenant: t };
}

// Étape passée : sa fin est derrière nous
export function estPassee(etape, t) {
  return finDe(etape) <= t;
}

export function estEnCours(etape, t) {
  return debutDe(etape) <= t && t < finDe(etape);
}

// Jour à ouvrir par défaut : celui du moment, le lundi avant le voyage, le jeudi après
export function jourCourant(voyage, t) {
  const jours = [...new Set(voyage.etapes.map(e => e.jour))].sort();
  const aujourdhui = t.slice(0, 10);
  if (jours.includes(aujourdhui)) return aujourdhui;
  return aujourdhui < jours[0] ? jours[0] : jours[jours.length - 1];
}
