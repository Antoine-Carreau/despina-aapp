# Despina

**Demonstrative Exploration Sky Platform for Interactive Navigation and Astronomy** — un site statique pour apprendre et enseigner l'astronomie (grand public, amateurs, pros). Nommé d'après *Despina*, lune-berger de l'anneau Le Verrier de Neptune.

Sans inscription, sans base de données : tous les calculs se font dans le navigateur.

## Fonctions (v0.8)
- **Ciel profond — trois onglets, tous conservés** :
  - **Carte** *(par défaut)* : la vue **tout-le-ciel** d'origine — zénith au centre, Nord en haut, Est à gauche ; on déplace à la souris et on agrandit à la molette (loupe). C'est la carte telle qu'elle était jusqu'à la v0.6.
  - **Horizon** : la vue **depuis le sol, façon Stellarium** — on regarde vers l'horizon, le **sol** est sous nos pieds, les cardinaux sur la ligne d'horizon. Glisser = tourner la tête, molette = champ de vue (180° → 0,5°). **Atmosphère** (le ciel suit la hauteur du Soleil), **Lune avec sa phase**, **écoulement du temps** (×1 → 1 jour/s, avant/arrière), **barre d'état**. Aucun roulis : l'horizon reste horizontal.
  - **Atlas** : imagerie réelle Aladin Lite v3 (CDS Strasbourg).
  - Communs : **88 constellations**, **110 Messier**, **1312 NGC/IC**, étoiles jusqu'à mag 6, planètes/Lune/Soleil. Tout cliquable (fiche : type, magnitude, taille, constellation, hauteur, azimut, RA/Dec, culmination, **photo réelle**). **Recherche** par sigle, nom UAI, nom usuel ou français.
- **Messier** : les **110 objets en fiches** avec de vraies photos (DSS2 / 2MASS / WISE via hips2fits).
- **NGC / IC** : les **1312 objets** jusqu'à la magnitude 12, mêmes fiches photo, filtres par type, tris (plus brillants, numéro, plus grands, nommés d'abord), recherche, pages de 60.
- **Quiz** : **un** mode à la fois parmi 5 (Constellations, **Photos Messier**, Types, Noms, Objet → constellation), 3 difficultés, score / série / record.
- **Ce soir** : coucher du Soleil, nuit noire (−18°), Lune, planètes visibles, Messier bien placés, mini-carte tout-le-ciel.
- **Système solaire** : positions et données réelles du jour, toutes les lunes nommées, planètes naines, méthodes expliquées.
- **Hors-ligne** (service worker + moteur embarqué), 3 thèmes dont **nuit rouge**, **FR / EN**, menu mobile refermable, PWA.


## Déploiement sur GitHub Pages
1. Créer un dépôt public nommé **`despina-aapp`**.
2. **Renseigner ton adresse de publication** (une seule commande — remplace `moncompte`) :
   ```bash
   # remplace le placeholder dans les balises OpenGraph, le sitemap et robots.txt
   grep -rl "VOTRE-COMPTE" . | xargs sed -i "s|VOTRE-COMPTE|moncompte|g"
   ```
   > À faire une fois. Sans ça, le site fonctionne quand même, mais les aperçus
   > de lien (réseaux sociaux, messageries) et le sitemap pointeront dans le vide.
3. Déposer tout le contenu de ce dossier (pas de build : `index.html` à la racine) :
   ```bash
   git init && git add . && git commit -m "Despina v0.6"
   git branch -M main
   git remote add origin https://github.com/moncompte/despina-aapp.git
   git push -u origin main
   ```
4. Dépôt → **Settings → Pages** → *Source : Deploy from a branch* → **main / (root)** → *Save*.
5. Le site est publié sous `https://moncompte.github.io/despina-aapp/`.

> Tous les liens sont **relatifs** (`./…`) : le site fonctionne sous ce sous-chemin sans configuration.

### Hors-ligne
Le service worker (`sw.js`) met en cache tout le nécessaire au premier chargement :
pages, styles, scripts, moteur d'éphémérides et catalogue (≈ 400 Ko). Ensuite
l'appli s'ouvre et calcule **sans réseau** — utile sur un site d'observation.
Restent en ligne (et se dégradent proprement) : les **photos** du CDS, l'**atlas
Aladin**, la **recherche de ville** et les polices Google.

> Le service worker exige `https://` (ou `localhost`) : en ouvrant les fichiers
> en `file://`, il ne s'active pas — c'est normal.

### Mettre à jour le catalogue
`assets/data/sky.json` est généré depuis les données ouvertes :
```bash
python3 assets/data/build_sky.py   # nécessite les sources d3-celestial
```


## Référencement & statistiques
- **Fait** : `<title>` et `<meta description>` propres à chaque page, **Open Graph** + Twitter Card
  avec une image sociale (`assets/img/og.png`, 1200×630), `<link rel="canonical">`,
  `sitemap.xml` et `robots.txt`. Pense juste à l'étape 2 du déploiement (remplacer `VOTRE-COMPTE`).
- **À voir ensemble** : statistiques de visite légères et sans cookie (GoatCounter, Plausible)
  — GitHub Pages n'en fournit aucune. Rien n'est ajouté pour l'instant : l'appli reste sans traceur.


## Structure
```
despina-aapp/
├── index.html  solar.html  deepsky.html  messier.html  ngc.html
├── quiz.html  observe.html  info.html
├── manifest.json  sw.js  sitemap.xml  robots.txt
└── assets/
    ├── css/base.css
    ├── js/     i18n.js  theme.js  solar.js  skymap.js  skyphoto.js
    ├── vendor/ astronomy.browser.min.js        (MIT, embarqué -> calculs hors-ligne)
    ├── data/   sky.json  build_sky.py          (5044 étoiles, 88 constellations,
    │                                            110 Messier, 1312 NGC/IC)
    └── img/    icon.svg  og.png
```

## Sources & licences
Éphémérides : [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT). Données physiques : [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/). Lunes : [JPL SSD](https://ssd.jpl.nasa.gov/) & [UAI](https://www.iau.org/). Définition de planète : UAI, résolution B5 (2006). Ciel profond (à venir) : [Aladin Lite](https://aladin.cds.unistra.fr/AladinLite/) (CDS Strasbourg). Détails et liens dans `info.html`.
