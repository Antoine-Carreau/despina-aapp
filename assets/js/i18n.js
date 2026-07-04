/* Despina — internationalisation FR / EN (léger).
   Traduit les éléments [data-i18n] (texte) et [data-i18n-html] (HTML).
   Chaînes dynamiques : window.Despina.t("clef"). */
(function () {
  const KEY = "despina-lang";
  const D = window.Despina = window.Despina || {};

  const T = {
    fr: {
      "nav.home":"Accueil","nav.solar":"Système solaire","nav.deepsky":"Ciel profond",
      "nav.quiz":"Quiz","nav.observe":"Ce soir","nav.info":"Infos","nav.back":"← Retour à l'accueil",
      "home.eyebrow":"Plateforme d'exploration du ciel · sans inscription",
      "home.lede":"Explore le système solaire, promène-toi dans le ciel profond, teste-toi et découvre quoi observer ce soir depuis chez toi.",
      "home.solar.d":"Positions réelles du jour, planètes, lunes et diamètres apparents.",
      "home.deepsky.d":"Constellations, Messier, NGC/IC. Zoome, clique, recherche un objet.",
      "home.quiz.d":"Retrouve un astre dans le ciel ou réponds en QCM. Tu choisis le thème.",
      "home.observe.d":"Coucher du Soleil, nuit noire, lever de Lune et cibles du moment.",
      "home.despina.h":"Despina, la lune qui donne son nom au projet",
      "home.despina.sources":"Sources & crédits",
      "home.acronym":"<b>D</b>emonstrative <b>E</b>xploration <b>S</b>ky <b>P</b>latform for <b>I</b>nteractive <b>N</b>avigation and <b>A</b>stronomy",
      "foot.solar":"Éphémérides : astronomy-engine (calcul local, aucune donnée envoyée).",
      "solar.overview.eyebrow":"Vue d'ensemble · héliocentrique","solar.overview.title":"Système solaire",
      "solar.overview.note":"Positions réelles du jour. Échelle des rayons compressée ; clique un astre.",
      "solar.strip":"Diamètres apparents comparés (réels, ce soir)",
      "solar.dwarfs":"Afficher planètes naines & petits corps",
      "solar.empty.h":"Choisis un astre","solar.empty.p":"Clique le Soleil ou une planète sur la carte pour explorer ses données du jour, ses lunes et son diamètre apparent.",
      "solar.back":"← Vue d'ensemble","solar.ang":"diamètre apparent ce soir",
      "solar.moons.major":"Lunes principales","solar.moons.real":"positions réelles","solar.moons.schema":"schéma",
      "solar.moons.touch":"Touche une lune pour la découvrir.","solar.moons.none":"Aucun satellite naturel.",
      "solar.moons.all":"toutes les lunes","solar.fields":"Comment lire ces valeurs ?",
      "f.distSun":"Distance au Soleil","f.distEarth":"Distance à la Terre","f.lighttime":"Temps-lumière",
      "f.mag":"Magnitude apparente","f.illum":"Fraction éclairée","f.period":"Période orbitale",
      "f.rot":"Rotation","f.radius":"Rayon équatorial","f.temp":"Température","f.discovery":"Découverte",
      "f.moonsN":"Lunes connues","f.type":"Type",
      "type.star":"Étoile","type.terr":"Planète tellurique","type.gas":"Géante gazeuse","type.ice":"Géante de glaces","type.dwarf":"Planète naine",
      "solar.dwarf.why":"Pourquoi « naine » et pas planète ?",
      "soon":"À venir","stub.next":"Prochaine étape · la plus importante",
      "ds.h":"Ciel profond « DD »","ds.p":"Planétarium plein-ciel : point fixe (la Terre), on tourne autour de soi, on zoome, on clique un astre pour une fiche (noms Messier / NGC / IC, distance, liens vers des photos existantes). Recherche par nom et calques activables : constellations, Messier, NGC, IC, points cardinaux.","ds.tech":"Base technique : Aladin Lite v3 (CDS/Strasbourg) — imagerie réelle du ciel (HiPS) et catalogues, sans clé ni identifiant.",
      "qz.h":"Quiz & repérage","qz.p":"Deux modes : repérage visuel (où est tel astre ? tu zoomes/cliques et valides) et QCM. Tu choisis le domaine : système solaire, Messier, constellations, distances, localisation, visibilité annuelle. Questions esquivables, bouton « ? » pour en apprendre plus.","qz.tech":"Réutilise les moteurs Système solaire et Ciel profond. Score en mémoire de session uniquement.",
      "ob.h":"Ce soir","ob.p":"Avec ta position (GPS approximatif autorisé, ou une ville saisie) et la date du jour : coucher du Soleil, nuit noire (crépuscule astronomique), lever/coucher et phase de Lune, et une sélection de cibles du moment (planètes et ciel profond bien placés).","ob.tech":"Calculs locaux via astronomy-engine ; géocodage de ville sans clé. Position jamais stockée ni transmise."
    },
    en: {
      "nav.home":"Home","nav.solar":"Solar System","nav.deepsky":"Deep Sky",
      "nav.quiz":"Quiz","nav.observe":"Tonight","nav.info":"About","nav.back":"← Back to home",
      "home.eyebrow":"Sky exploration platform · no sign-up",
      "home.lede":"Explore the Solar System, wander the deep sky, test yourself and find out what to observe tonight from where you are.",
      "home.solar.d":"Today's real positions, planets, moons and apparent sizes.",
      "home.deepsky.d":"Constellations, Messier, NGC/IC. Zoom, click, search an object.",
      "home.quiz.d":"Locate an object in the sky or answer a quiz. You pick the topic.",
      "home.observe.d":"Sunset, astronomical night, moonrise and tonight's targets.",
      "home.despina.h":"Despina, the moon that names the project",
      "home.despina.sources":"Sources & credits",
      "home.acronym":"<b>D</b>emonstrative <b>E</b>xploration <b>S</b>ky <b>P</b>latform for <b>I</b>nteractive <b>N</b>avigation and <b>A</b>stronomy",
      "foot.solar":"Ephemerides: astronomy-engine (computed locally, nothing sent).",
      "solar.overview.eyebrow":"Overview · heliocentric","solar.overview.title":"Solar System",
      "solar.overview.note":"Real positions for today. Radii scale compressed; click a body.",
      "solar.strip":"Apparent diameters compared (real, tonight)",
      "solar.dwarfs":"Show dwarf planets & small bodies",
      "solar.empty.h":"Pick a body","solar.empty.p":"Click the Sun or a planet on the map to explore today's data, its moons and its apparent size.",
      "solar.back":"← Overview","solar.ang":"apparent diameter tonight",
      "solar.moons.major":"Main moons","solar.moons.real":"real positions","solar.moons.schema":"schematic",
      "solar.moons.touch":"Tap a moon to learn about it.","solar.moons.none":"No natural satellite.",
      "solar.moons.all":"all moons","solar.fields":"How to read these values?",
      "f.distSun":"Distance to the Sun","f.distEarth":"Distance to Earth","f.lighttime":"Light-time",
      "f.mag":"Apparent magnitude","f.illum":"Illuminated fraction","f.period":"Orbital period",
      "f.rot":"Rotation","f.radius":"Equatorial radius","f.temp":"Temperature","f.discovery":"Discovery",
      "f.moonsN":"Known moons","f.type":"Type",
      "type.star":"Star","type.terr":"Terrestrial planet","type.gas":"Gas giant","type.ice":"Ice giant","type.dwarf":"Dwarf planet",
      "solar.dwarf.why":"Why \"dwarf\" and not a planet?",
      "soon":"Coming soon","stub.next":"Next step · the big one",
      "ds.h":"Deep sky \"DD\"","ds.p":"Full-sky planetarium: fixed point (Earth), turn around yourself, zoom, click an object for a card (Messier / NGC / IC names, distance, links to existing photos). Search by name and toggleable layers: constellations, Messier, NGC, IC, cardinal points.","ds.tech":"Tech base: Aladin Lite v3 (CDS/Strasbourg) — real sky imagery (HiPS) and catalogues, no key or ID.",
      "qz.h":"Quiz & spotting","qz.p":"Two modes: visual spotting (where is this object? zoom/click and confirm) and multiple-choice. You pick the topic: Solar System, Messier, constellations, distances, location, yearly visibility. Skippable questions, a \"?\" button to learn more.","qz.tech":"Reuses the Solar System and Deep Sky engines. Score kept in session memory only.",
      "ob.h":"Tonight","ob.p":"With your location (approximate GPS if allowed, or a typed city) and today's date: sunset, astronomical night, moonrise/set and phase, plus a selection of well-placed targets (planets and deep sky).","ob.tech":"Local computation via astronomy-engine; keyless city geocoding. Location never stored or transmitted."
    }
  };

  function get(){ try{ const v=localStorage.getItem(KEY); if(v==="fr"||v==="en") return v; }catch(e){}
    return (navigator.language||"fr").toLowerCase().startsWith("en") ? "en":"fr"; }
  function t(k){ const l=get(); return (T[l]&&T[l][k]) || (T.fr[k]) || k; }
  D.getLang=get; D.t=t;

  function apply(){
    const l=get();
    document.documentElement.setAttribute("lang",l);
    document.querySelectorAll("[data-i18n]").forEach(el=>{ el.textContent=t(el.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-html]").forEach(el=>{ el.innerHTML=t(el.getAttribute("data-i18n-html")); });
    document.querySelectorAll(".lang-switch button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.lang===l)));
    if(D._mountTheme) D._mountTheme();
  }
  function set(l){ try{localStorage.setItem(KEY,l);}catch(e){} apply(); document.dispatchEvent(new CustomEvent("despina:lang",{detail:l})); }
  D.setLang=set;

  function mount(){
    document.querySelectorAll("[data-lang-switch]").forEach(host=>{
      host.classList.add("lang-switch");
      host.innerHTML=["fr","en"].map(l=>`<button data-lang="${l}" aria-label="${l.toUpperCase()}">${l.toUpperCase()}</button>`).join("");
      host.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>set(b.dataset.lang)));
    });
    apply();
  }
  D._applyI18n=apply;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mount);
  else mount();
})();
