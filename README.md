# Despina

**Demonstrative Exploration Sky Platform for Interactive Navigation and Astronomy** — un site statique pour apprendre et enseigner l'astronomie (grand public, amateurs, pros). Nommé d'après *Despina*, lune-berger de l'anneau Le Verrier de Neptune.

Sans inscription, sans base de données : tous les calculs se font dans le navigateur.

## Fonctions (v0.7)
- **Ciel profond — la carte fonctionne comme Stellarium** :
  - **Vue à la première personne** (défaut) : on regarde vers l'horizon, le **sol** est sous nos pieds, les **points cardinaux** sont posés sur la ligne d'horizon. On **tourne la tête** en glissant, la **molette / le pincement change le champ de vue** (180° → 0,5°). Aucun roulis : l'horizon reste horizontal, impossible d'avoir la tête à l'envers.
  - **Atmosphère** : la couleur du ciel suit la hauteur du Soleil (jour bleu, teinte chaude au couchant, nuit noire), halo solaire, et les étoiles s'effacent au lever du jour.
  - **Écoulement du temps** : lecture/pause, vitesses ×1 → 1 jour/s en avant comme en arrière, ⏮/⏭ à l'heure, retour à « maintenant ».
  - **Barre d'état** : champ de vue, direction du regard, date, hauteur du Soleil, lieu.
  - **Lune dessinée avec sa phase**, limbe éclairé tourné vers le Soleil.
  - **Clavier** : `←↑→↓` regarder, `+` / `−` zoomer, `Espace` centrer la sélection.
  - Vue **tout-le-ciel** disponible d'un bouton. Contenu : **88 constellations**, **110 Messier**, **1312 NGC/IC** (seuil de magnitude progressif selon le champ), étoiles jusqu'à mag 6, planètes / Lune / Soleil. Tout est cliquable : fiche avec type, magnitude, taille, constellation, **hauteur, azimut, RA/Dec, culmination**, et une **photo réelle**. **Recherche** par sigle, nom UAI, nom usuel ou français.
  - **Atlas Aladin** (CDS Strasbourg) toujours disponible en second mode.
- **Messier** : les **110 objets en fiches d'apprentissage** avec de **vraies photos du ciel** (DSS2 / 2MASS / WISE via hips2fits). Grille cliquable, parcours un par un (flèches), filtres, recherche, suivi des fiches vues.
- **Quiz** : **un** mode à la fois parmi 5 (Constellations, **Photos Messier**, Types, Noms, Objet → constellation), 3 difficultés, score / série / record.
- **Ce soir** : coucher du Soleil, nuit noire (−18°), Lune, planètes visibles, Messier bien placés, mini-carte tout-le-ciel.
- **Système solaire** : positions et données réelles du jour, toutes les lunes nommées, planètes naines, méthodes de calcul expliquées.
- **Hors-ligne** (service worker + moteur d'éphémérides embarqué), 3 thèmes dont **nuit rouge**, **FR / EN**, menu mobile refermable, PWA installable.


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
├── index.html  solar.html  deepsky.html  messier.html  quiz.html  observe.html  info.html
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
