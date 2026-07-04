# Despina

**Demonstrative Exploration Sky Platform for Interactive Navigation and Astronomy** — un site statique pour apprendre et enseigner l'astronomie (grand public, amateurs, pros). Nommé d'après *Despina*, lune-berger de l'anneau Le Verrier de Neptune.

Sans inscription, sans base de données : tous les calculs se font dans le navigateur.

## Fonctions (v0.2)
- **Système solaire** : positions et données réelles du jour (astronomy-engine), fiches, diamètres apparents, **toutes les lunes nommées**, **planètes naines** (bascule + explication), **années de découverte**, et un bouton **« i »** partout qui explique chaque champ, sa méthode de calcul et ses sources.
- **Accueil** illustré (Despina, sources citées), 3 thèmes mémorisés (sombre / clair / **nuit rouge**), **bascule FR / EN**, PWA installable.
- **Ciel profond**, **Quiz**, **Ce soir** : pages présentées (feuille de route dans `info.html`).

## Déploiement sur GitHub Pages
1. Créer un dépôt public nommé **`despina-aapp`**.
2. Y déposer tout le contenu de ce dossier (pas de build : `index.html` doit être à la racine).
   ```bash
   git init && git add . && git commit -m "Despina v0.2"
   git branch -M main
   git remote add origin https://github.com/<utilisateur>/despina-aapp.git
   git push -u origin main
   ```
3. Dépôt → **Settings → Pages** → *Source : Deploy from a branch* → **main / (root)** → *Save*.
4. Le site est publié sous `https://<utilisateur>.github.io/despina-aapp/`.

> Tous les liens sont **relatifs** (`./…`), donc le site fonctionne sous ce sous-chemin sans configuration.

## Référencement & statistiques (prochaine étape)
- `<title>` et `<meta description>` déjà présents ; à compléter : `sitemap.xml`, Open Graph, `robots.txt`.
- Statistiques respectueuses : GitHub ne fournit pas d'analytics ; option légère et sans cookie à ajouter (ex. GoatCounter / Plausible) — à voir ensemble.

## Structure
```
despina-aapp/
├── index.html  solar.html  deepsky.html  quiz.html  observe.html  info.html
├── manifest.json
└── assets/
    ├── css/base.css
    ├── js/  i18n.js  theme.js  solar.js
    └── img/icon.svg
```

## Sources & licences
Éphémérides : [astronomy-engine](https://github.com/cosinekitty/astronomy) (MIT). Données physiques : [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/). Lunes : [JPL SSD](https://ssd.jpl.nasa.gov/) & [UAI](https://www.iau.org/). Définition de planète : UAI, résolution B5 (2006). Ciel profond (à venir) : [Aladin Lite](https://aladin.cds.unistra.fr/AladinLite/) (CDS Strasbourg). Détails et liens dans `info.html`.
