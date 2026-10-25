# Roma 26

Petit site mobile pour un séjour de quatre jours à Rome : ce qui compte maintenant, le programme jour par jour avec les trajets en métro, une carte, des infos pratiques et une recherche. Il s'installe sur l'écran d'accueil et reste lisible en mode avion.

HTML, CSS et JavaScript natifs, sans compilation. Carte : [Leaflet](https://leafletjs.com) 1.9.4 et tuiles © contributeurs [OpenStreetMap](https://www.openstreetmap.org/copyright). Polices Anton, Oswald et Inter (SIL Open Font License).

## Lancer en local

```sh
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. Le paramètre `?t=2026-10-28T14:30` remplace l'heure du téléphone, pour voir le site à un autre moment du séjour.

## Modifier le contenu

Tout le contenu vit dans `js/data.js`. Après chaque modification, incrémenter `VERSION` dans `sw.js`, sans quoi les téléphones garderont l'ancienne version en cache.

## Licence

Code sous licence [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Réalisé par Antonin Bareau avec l'aide d'un ou plusieurs LLM.
