/* Despina — page Système solaire (v0.2)
   Positions & données réelles du jour via astronomy-engine (global `Astronomy`).
   Distances centre-à-centre ; échelle des rayons compressée dans la carte.
   Chaque valeur est explicable via le bouton « i » (méthode + sources). */
(function () {
  "use strict";
  const A = window.Astronomy;
  const D = window.Despina;
  const root = document.getElementById("solar");
  const lang = () => (D.getLang ? D.getLang() : "fr");
  const L = o => (o ? (o[lang()] ?? o.fr) : "");
  const t = k => (D.t ? D.t(k) : k);

  if (!A) { root.innerHTML = '<div class="stub"><p class="big">Éphémérides indisponibles / Ephemerides unavailable</p><p style="color:var(--muted)">astronomy-engine n\'a pas pu être chargé — vérifie la connexion puis recharge.</p></div>'; return; }

  const AU = 1.495978707e8, RAD = Math.PI/180, DEG = 180/Math.PI;
  const now = new Date();
  const state = { selected: null, showDwarfs: false };

  const anc = { fr:"Connue depuis l'Antiquité", en:"Known since antiquity" };

  const SUN = { key:"Sun", fr:"Soleil", en:"Sun", typeKey:"type.star", radius:696340, color:"#ffcf5e",
    rot:{fr:"25 j (équateur)",en:"25 d (equator)"}, temp:{fr:"5 500 °C (surface)",en:"5,500 °C (surface)"},
    disc:{fr:"Connu depuis toujours",en:"Known since forever"},
    fact:{fr:"99,86 % de la masse du système solaire. Sa lumière met 8 min 20 s à nous atteindre.",
          en:"99.86% of the Solar System's mass. Its light takes 8 min 20 s to reach us."} };

  const PLANETS = [
    { key:"Mercury", fr:"Mercure", en:"Mercury", typeKey:"type.terr", radius:2439.7, color:"#a9a29b",
      rot:{fr:"58,6 j",en:"58.6 d"}, period:{fr:"88 j",en:"88 d"}, temp:{fr:"−170 à +430 °C",en:"−170 to +430 °C"},
      disc:anc, fact:{fr:"La plus petite planète, la plus proche du Soleil ; quasi sans atmosphère.",en:"Smallest planet, closest to the Sun; virtually no atmosphere."},
      count:0, asOf:"", majorMoons:[], allMoons:[] },
    { key:"Venus", fr:"Vénus", en:"Venus", typeKey:"type.terr", radius:6051.8, color:"#d9b382",
      rot:{fr:"243 j (rétrograde)",en:"243 d (retrograde)"}, period:{fr:"225 j",en:"225 d"}, temp:{fr:"≈ 465 °C",en:"≈ 465 °C"},
      disc:anc, fact:{fr:"Objet le plus brillant du ciel après Soleil et Lune ; effet de serre extrême.",en:"Brightest object after Sun and Moon; extreme greenhouse effect."},
      count:0, asOf:"", majorMoons:[], allMoons:[] },
    { key:"Earth", fr:"Terre", en:"Earth", typeKey:"type.terr", radius:6371.0, color:"#4f8fd0",
      rot:{fr:"23 h 56 min",en:"23 h 56 min"}, period:{fr:"365,25 j",en:"365.25 d"}, temp:{fr:"≈ 15 °C (moy.)",en:"≈ 15 °C (avg.)"},
      disc:{fr:"—",en:"—"}, fact:{fr:"La seule planète connue abritant la vie.",en:"The only planet known to harbour life."},
      count:1, asOf:"", majorMoons:[{n:{fr:"Lune",en:"Moon"},r:1737,d:384400,f:{fr:"Seul satellite naturel ; responsable des marées.",en:"Only natural satellite; drives the tides."}}],
      allMoons:[{fr:"Lune",en:"Moon"}] },
    { key:"Mars", fr:"Mars", en:"Mars", typeKey:"type.terr", radius:3389.5, color:"#c1663f",
      rot:{fr:"24 h 37 min",en:"24 h 37 min"}, period:{fr:"687 j",en:"687 d"}, temp:{fr:"≈ −63 °C (moy.)",en:"≈ −63 °C (avg.)"},
      disc:anc, fact:{fr:"La « planète rouge » ; abrite Olympus Mons, plus haut volcan du système solaire.",en:"The \"red planet\"; home to Olympus Mons, the tallest known volcano."},
      count:2, asOf:"", majorMoons:[
        {n:{fr:"Phobos",en:"Phobos"},r:11,d:9376,f:{fr:"Petite lune irrégulière, orbite très basse.",en:"Small irregular moon on a very low orbit."}},
        {n:{fr:"Déimos",en:"Deimos"},r:6,d:23460,f:{fr:"La plus petite et la plus éloignée des deux.",en:"The smaller and farther of the two."}}],
      allMoons:[{fr:"Phobos",en:"Phobos"},{fr:"Déimos",en:"Deimos"}] },
    { key:"Jupiter", fr:"Jupiter", en:"Jupiter", typeKey:"type.gas", radius:69911, color:"#d8a97a",
      rot:{fr:"9 h 56 min",en:"9 h 56 min"}, period:{fr:"11,9 ans",en:"11.9 yr"}, temp:{fr:"≈ −110 °C (nuages)",en:"≈ −110 °C (clouds)"},
      disc:anc, fact:{fr:"Les 4 lunes galiléennes se voient aux jumelles ; positions réelles ci-dessous.",en:"The 4 Galilean moons are visible in binoculars; real positions below."},
      count:95, asOf:"JPL SSD, ~2024", majorMoons:[
        {n:{fr:"Io",en:"Io"},r:1822,d:421700,f:{fr:"Corps le plus volcanique du système solaire.",en:"Most volcanic body in the Solar System."}},
        {n:{fr:"Europe",en:"Europa"},r:1561,d:671000,f:{fr:"Océan liquide probable sous sa glace.",en:"Likely liquid ocean beneath its ice."}},
        {n:{fr:"Ganymède",en:"Ganymede"},r:2634,d:1070000,f:{fr:"Plus grande lune du système solaire.",en:"Largest moon in the Solar System."}},
        {n:{fr:"Callisto",en:"Callisto"},r:2410,d:1883000,f:{fr:"Surface la plus cratérisée connue.",en:"Most heavily cratered surface known."}}],
      allMoons:"Métis,Adrastée,Amalthée,Thébé,Io,Europe,Ganymède,Callisto,Themisto,Léda,Ersa,Pandia,Himalia,Lysithéa,Élara,Dia,Carpo,Valétudo,Euporie,Eupheme,Mnémé,Euanthé,Héliké,Orthosie,Ananké,Herse,Aitné,Kalé,Taygète,Chaldéné,Érinomé,Aœdé,Kallichore,Kalyké,Carmé,Callirrhoé,Eurydomé,Pasithée,Coré,Cyllène,Eukéladé,Isonoé,Praxidiké,Harpalyké,Iocaste,Hermippé,Thelxinoé,Arché,Autonoé,Thyoné,Pasiphaé,Sponde,Mégaclité,Sinopé,Philophrosyné,Éiréné".split(",") },
    { key:"Saturn", fr:"Saturne", en:"Saturn", typeKey:"type.gas", radius:58232, color:"#e0c391", ring:true,
      rot:{fr:"10 h 33 min",en:"10 h 33 min"}, period:{fr:"29,5 ans",en:"29.5 yr"}, temp:{fr:"≈ −140 °C",en:"≈ −140 °C"},
      disc:anc, fact:{fr:"Ses anneaux, larges de ~280 000 km, ne font que ~10 m d'épaisseur.",en:"Its rings span ~280,000 km but are only ~10 m thick."},
      count:274, asOf:"JPL SSD, ~2025", majorMoons:[
        {n:{fr:"Titan",en:"Titan"},r:2575,d:1221900,f:{fr:"Atmosphère dense ; lacs de méthane liquide.",en:"Dense atmosphere; liquid methane lakes."}},
        {n:{fr:"Encelade",en:"Enceladus"},r:252,d:238000,f:{fr:"Geysers d'eau ; océan souterrain.",en:"Water geysers; subsurface ocean."}},
        {n:{fr:"Rhéa",en:"Rhea"},r:764,d:527000,f:{fr:"Deuxième plus grande lune de Saturne.",en:"Saturn's second-largest moon."}}],
      allMoons:"Pan,Daphnis,Atlas,Prométhée,Pandore,Épiméthée,Janus,Aegaeon,Mimas,Méthone,Anthé,Pallène,Encelade,Téthys,Télesto,Calypso,Dioné,Hélène,Pollux,Rhéa,Titan,Hypérion,Japet,Kiviuq,Ijiraq,Phœbé,Paaliaq,Skathi,Albiorix,Bebhionn,Erriapus,Skoll,Siarnaq,Tarqeq,Tarvos,Greip,Hyrrokkin,Mundilfari,Jarnsaxa,Narvi,Bergelmir,Suttungr,Hati,Farbauti,Thrymr,Aegir,Bestla,Fenrir,Surtur,Kari,Ymir,Loge,Fornjot".split(",") },
    { key:"Uranus", fr:"Uranus", en:"Uranus", typeKey:"type.ice", radius:25362, color:"#a6d8de",
      rot:{fr:"17 h 14 min (rétrograde)",en:"17 h 14 min (retrograde)"}, period:{fr:"84 ans",en:"84 yr"}, temp:{fr:"≈ −195 °C",en:"≈ −195 °C"},
      disc:{fr:"1781, William Herschel",en:"1781, William Herschel"},
      fact:{fr:"Roule sur le côté : son axe est incliné de 98°. Lunes nommées d'après Shakespeare et Pope.",en:"Rolls on its side: 98° axial tilt. Moons named after Shakespeare and Pope."},
      count:28, asOf:"JPL SSD, ~2024", majorMoons:[
        {n:{fr:"Titania",en:"Titania"},r:788,d:436000,f:{fr:"Plus grande lune d'Uranus.",en:"Uranus's largest moon."}},
        {n:{fr:"Obéron",en:"Oberon"},r:761,d:584000,f:{fr:"La plus éloignée des grandes lunes.",en:"Outermost of the major moons."}},
        {n:{fr:"Miranda",en:"Miranda"},r:236,d:129000,f:{fr:"Relief chaotique spectaculaire.",en:"Spectacularly chaotic terrain."}}],
      allMoons:"Cordélia,Ophélie,Bianca,Cressida,Desdémone,Juliette,Portia,Rosalinde,Cupidon,Bélinda,Perdita,Puck,Mab,Miranda,Ariel,Umbriel,Titania,Obéron,Francisco,Caliban,Stéphano,Trinculo,Sycorax,Margaret,Prospéro,Sétébos,Ferdinand".split(",") },
    { key:"Neptune", fr:"Neptune", en:"Neptune", typeKey:"type.ice", radius:24622, color:"#5b7be0",
      rot:{fr:"16 h 06 min",en:"16 h 06 min"}, period:{fr:"165 ans",en:"165 yr"}, temp:{fr:"≈ −200 °C",en:"≈ −200 °C"},
      disc:{fr:"1846, Le Verrier / Galle / Adams",en:"1846, Le Verrier / Galle / Adams"},
      fact:{fr:"Vents les plus rapides du système solaire (> 2 000 km/h). Sa lune Despina donne son nom à cette appli.",en:"Fastest winds in the Solar System (> 2,000 km/h). Its moon Despina names this app."},
      count:16, asOf:"JPL SSD, ~2024", majorMoons:[
        {n:{fr:"Triton",en:"Triton"},r:1353,d:354800,f:{fr:"Orbite rétrograde ; geysers d'azote.",en:"Retrograde orbit; nitrogen geysers."}},
        {n:{fr:"Despina",en:"Despina"},r:78,d:52526,f:{fr:"Lune-berger de l'anneau Le Verrier, découverte par Voyager 2 (1989). Éponyme de l'appli.",en:"Shepherd of the Le Verrier ring, found by Voyager 2 (1989). App's namesake."}}],
      allMoons:"Naïade,Thalassa,Despina,Galatée,Larissa,Hippocampe,Protée,Triton,Néréide,Halimède,Sao,Laomédie,Psamathé,Néso".split(",") }
  ];

  const DWARFS = [
    { key:"Pluto", fr:"Pluton", en:"Pluto", typeKey:"type.dwarf", radius:1188.3, color:"#c9b7a0", live:true,
      rot:{fr:"6,4 j",en:"6.4 d"}, period:{fr:"248 ans",en:"248 yr"}, temp:{fr:"≈ −229 °C",en:"≈ −229 °C"},
      disc:{fr:"1930, Clyde Tombaugh",en:"1930, Clyde Tombaugh"},
      fact:{fr:"Planète de 1930 à 2006, reclassée planète naine par l'UAI. Cœur de glace « Tombaugh Regio ».",en:"A planet 1930–2006, reclassified as a dwarf planet by the IAU. Icy 'Tombaugh Regio' heart."},
      count:5, asOf:"JPL SSD", majorMoons:[
        {n:{fr:"Charon",en:"Charon"},r:606,d:19591,f:{fr:"Si grande que Pluton–Charon forme un système binaire.",en:"So large that Pluto–Charon is a binary system."}}],
      allMoons:[{fr:"Charon",en:"Charon"},{fr:"Styx",en:"Styx"},{fr:"Nix",en:"Nix"},{fr:"Kerbéros",en:"Kerberos"},{fr:"Hydre",en:"Hydra"}] },
    { key:"Ceres", fr:"Cérès", en:"Ceres", typeKey:"type.dwarf", radius:469.7, color:"#9a9188", live:false,
      rot:{fr:"9 h",en:"9 h"}, period:{fr:"4,6 ans",en:"4.6 yr"}, temp:{fr:"≈ −105 °C",en:"≈ −105 °C"},
      disc:{fr:"1801, Giuseppe Piazzi",en:"1801, Giuseppe Piazzi"},
      fact:{fr:"Plus gros objet de la ceinture d'astéroïdes ; seule planète naine du système solaire interne.",en:"Largest object in the asteroid belt; the only inner-system dwarf planet."},
      count:0, asOf:"", majorMoons:[], allMoons:[] },
    { key:"Eris", fr:"Éris", en:"Eris", typeKey:"type.dwarf", radius:1163, color:"#c8c8c8", live:false,
      rot:{fr:"~16 h",en:"~16 h"}, period:{fr:"559 ans",en:"559 yr"}, temp:{fr:"≈ −243 °C",en:"≈ −243 °C"},
      disc:{fr:"2005, M. Brown, C. Trujillo, D. Rabinowitz",en:"2005, Brown, Trujillo, Rabinowitz"},
      fact:{fr:"Sa découverte a déclenché la redéfinition de « planète » en 2006. Une lune : Dysnomie.",en:"Its discovery triggered the 2006 redefinition of 'planet'. One moon: Dysnomia."},
      count:1, asOf:"", majorMoons:[], allMoons:[{fr:"Dysnomie",en:"Dysnomia"}] },
    { key:"Haumea", fr:"Hauméa", en:"Haumea", typeKey:"type.dwarf", radius:816, color:"#ddd6c8", live:false,
      rot:{fr:"3,9 h",en:"3.9 h"}, period:{fr:"285 ans",en:"285 yr"}, temp:{fr:"≈ −241 °C",en:"≈ −241 °C"},
      disc:{fr:"2004–2005 (Sierra Nevada / Caltech)",en:"2004–2005 (Sierra Nevada / Caltech)"},
      fact:{fr:"Forme d'œuf par rotation ultra-rapide ; possède un anneau et deux lunes.",en:"Egg-shaped from ultra-fast spin; has a ring and two moons."},
      count:2, asOf:"", majorMoons:[], allMoons:[{fr:"Hiʻiaka",en:"Hiʻiaka"},{fr:"Namaka",en:"Namaka"}] },
    { key:"Makemake", fr:"Makémaké", en:"Makemake", typeKey:"type.dwarf", radius:715, color:"#c2a08a", live:false,
      rot:{fr:"22,5 h",en:"22.5 h"}, period:{fr:"306 ans",en:"306 yr"}, temp:{fr:"≈ −243 °C",en:"≈ −243 °C"},
      disc:{fr:"2005, M. Brown et al.",en:"2005, M. Brown et al."},
      fact:{fr:"Objet de la ceinture de Kuiper ; une petite lune connue (S/2015).",en:"Kuiper-belt object; one known small moon (S/2015)."},
      count:1, asOf:"", majorMoons:[], allMoons:[{fr:"S/2015 (136472) 1",en:"S/2015 (136472) 1"}] }
  ];

  // ---------- calculs ----------
  function safe(fn,d){ try{ return fn(); }catch(e){ return d; } }
  function compute(p){
    const h = safe(()=>A.HelioVector(p.key, now), null);
    const rSun = h ? Math.hypot(h.x,h.y,h.z) : null;
    const lon = h ? Math.atan2(h.y,h.x)*DEG : 0;
    let dEarth=null, ang=null, mag=null, illum=null;
    if (p.key!=="Earth"){
      const g = safe(()=>A.GeoVector(p.key, now, true), null);
      if (g){ dEarth=Math.hypot(g.x,g.y,g.z); ang=2*Math.atan(p.radius/(dEarth*AU))*206264.806; }
      const il = safe(()=>A.Illumination(p.key, now), null);
      if (il){ mag=il.mag; illum=il.phase_fraction; }
    }
    return { lon, rSun, dEarth, ang, mag, illum };
  }
  const data = PLANETS.map(p=>({p, c:compute(p)}));
  const dwarfData = DWARFS.map(p=>({p, c:compute(p)}));
  const maxAng = Math.max(...data.map(d=>d.c.ang||0));

  // ---------- helpers d'affichage ----------
  const fmt=(n,d=2)=> n==null?"—":n.toLocaleString(lang()==="en"?"en":"fr-FR",{maximumFractionDigits:d,minimumFractionDigits:d});
  function phaseName(f){ if(f==null) return "—";
    const P = lang()==="en"
      ? {full:"full",new:"new",cres:"crescent",quart:"quarter",gib:"gibbous"}
      : {full:"pleine",new:"nouvelle",cres:"croissant",quart:"quartier",gib:"gibbeuse"};
    if(f>0.98) return P.full; if(f<0.02) return P.new; if(f<0.48) return P.cres; if(f<0.52) return P.quart; return P.gib; }

  // ---------- carte d'ensemble ----------
  function overviewSVG(){
    const cx=500, cy=500, r0=74, step=42;
    const list = state.showDwarfs ? data.concat(dwarfData.filter(d=>d.p.live)) : data;
    let orbits="", dots="";
    list.forEach((d,i)=>{
      const R=r0+i*step;
      orbits+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="var(--line)" stroke-width="1"${d.p.typeKey==="type.dwarf"?' stroke-dasharray="3 4"':''}/>`;
      const a=d.c.lon*RAD, px=cx+R*Math.cos(a), py=cy-R*Math.sin(a);
      const dr=4+Math.log2(d.p.radius/2000+1)*1.6;
      const isE=d.p.key==="Earth";
      const gi = state.showDwarfs ? (i<data.length?i:"D"+i) : i;
      dots+=`<g class="pl" data-key="${d.p.key}" tabindex="0" role="button" aria-label="${L(d.p)}" style="cursor:pointer">
        ${isE?`<circle cx="${px}" cy="${py}" r="${dr+5}" fill="none" stroke="var(--accent-2)" stroke-width="1.4"/>`:""}
        <circle cx="${px}" cy="${py}" r="${dr}" fill="${d.p.color}"/>
        <text x="${px}" y="${py-dr-6}" text-anchor="middle" font-size="15" fill="var(--muted)" font-family="Space Mono, monospace">${L(d.p)}</text>
      </g>`;
    });
    return `<svg viewBox="0 0 1000 1000" role="img" aria-label="${t('solar.overview.title')}">
      <defs><radialGradient id="sun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff"/><stop offset="35%" stop-color="${SUN.color}"/><stop offset="100%" stop-color="#c8791e"/>
      </radialGradient></defs>
      ${orbits}
      <circle class="pl" data-key="Sun" tabindex="0" role="button" aria-label="${L(SUN)}" cx="${cx}" cy="${cy}" r="30" fill="url(#sun)" style="cursor:pointer"/>
      <circle cx="${cx}" cy="${cy}" r="46" fill="none" stroke="${SUN.color}" stroke-opacity=".25" stroke-width="10"/>
      ${dots}
    </svg>`;
  }

  function angStrip(activeKey){
    const scale = maxAng>0 ? 84/maxAng : 1;
    let s="";
    data.forEach(d=>{ if(d.c.ang==null) return;
      const dia=Math.max(3,d.c.ang*scale), on=d.p.key===activeKey;
      s+=`<div style="display:flex;flex-direction:column;align-items:center;gap:.3rem;min-width:56px">
        <div style="height:88px;display:flex;align-items:center"><span style="width:${dia}px;height:${dia}px;border-radius:50%;background:${d.p.color};box-shadow:${on?"0 0 0 2px var(--accent)":"none"}"></span></div>
        <span class="mono" style="font-size:.7rem;color:${on?"var(--ink)":"var(--muted)"}">${L(d.p)}</span>
        <span class="mono" style="font-size:.66rem;color:var(--faint)">${fmt(d.c.ang,1)}″</span></div>`;
    });
    return `<div style="overflow-x:auto"><div style="display:flex;gap:.6rem;padding:.4rem 0">${s}</div></div>`;
  }

  function disk(p, illum){
    const R=80, cx=100, cy=100;
    let shade="";
    if(illum!=null && illum<0.985){
      const term=R*(1-2*illum), sweep=term>=0?0:1;
      shade=`<path d="M ${cx},${cy-R} A ${R},${R} 0 0,0 ${cx},${cy+R} A ${Math.abs(term)},${R} 0 0,${sweep} ${cx},${cy-R} Z" fill="#000" opacity=".62"/>`;
    }
    const ring=p.ring?`<ellipse cx="${cx}" cy="${cy}" rx="${R*1.7}" ry="${R*0.5}" fill="none" stroke="${p.color}" stroke-width="7" opacity=".8" transform="rotate(-16 ${cx} ${cy})"/>`:"";
    return `<svg viewBox="0 0 200 200" width="170" height="170" class="planet-visual" aria-hidden="true">
      <defs><radialGradient id="pg" cx="38%" cy="35%" r="75%">
        <stop offset="0%" stop-color="#fff" stop-opacity=".35"/><stop offset="40%" stop-color="${p.color}"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
      ${p.ring?ring.replace('opacity=".8"','opacity=".3"'):""}
      <circle cx="${cx}" cy="${cy}" r="${R}" fill="url(#pg)"/>${shade}${ring}
    </svg>`;
  }

  // ---------- lunes ----------
  function moonRow(p){
    if(!p.count && !p.majorMoons.length)
      return `<p style="color:var(--muted)">${t('solar.moons.none')}</p>`;
    let real=null;
    if(p.key==="Jupiter"){ const jm=safe(()=>A.JupiterMoons(now),null);
      if(jm) real={Io:jm.io,Europe:jm.europa,Europa:jm.europa,Ganymède:jm.ganymede,Ganymede:jm.ganymede,Callisto:jm.callisto}; }
    const tagTxt = real ? t('solar.moons.real') : t('solar.moons.schema');
    let items="";
    p.majorMoons.forEach((m,idx)=>{
      const nm=L(m.n); let offset;
      if(real && real[nm]) offset=real[nm].x;
      else { const per=[7,12,18,25][idx]||15; offset=Math.cos((now/86400000/per)*2*Math.PI)*(0.2+idx*0.22); }
      const px=100+Math.max(-92,Math.min(92, offset*(real?260:110)));
      items+=`<button class="moon-dot" data-n="${nm}" data-info="${encodeURIComponent(L(m.f))}" data-dist="${m.d.toLocaleString('fr-FR')} km" title="${nm}" style="left:${px}px" aria-label="${nm}"></button>`;
    });
    const countLine = p.count ? `<button class="info-btn" data-modal="moons" title="${t('f.moonsN')}">+</button> <span class="mono" style="font-size:.78rem;color:var(--faint)">${p.count} ${lang()==='en'?'known':'connues'}${p.asOf?` · ${p.asOf}`:''}</span>` : "";
    const allBtn = (p.allMoons && p.allMoons.length) ? `<button class="btn" data-allmoons style="padding:.3rem .6rem;font-size:.82rem">+ ${t('solar.moons.all')} (${p.allMoons.length}${p.count>p.allMoons.length?'/'+p.count:''})</button>` : "";
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:.6rem;margin:.2rem 0 .5rem;flex-wrap:wrap">
        <span class="eyebrow">${t('solar.moons.major')} <span class="tag${real?'':' soon'}">${tagTxt}</span></span>${countLine}</div>
      <div class="moons"><span class="moons-planet" style="background:${p.color}"></span>${items||''}</div>
      <div id="moon-info" class="mono" style="min-height:2.4em;font-size:.82rem;color:var(--muted);margin-top:.4rem">${t('solar.moons.touch')}</div>
      <div style="margin-top:.5rem">${allBtn}</div>
      <div id="allmoons" hidden style="margin-top:.5rem"></div>`;
  }

  // ---------- modales sourcées ----------
  const SRC = {
    fr:`<h4>Sources</h4><ul>
      <li>Positions, magnitudes, phases : <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noopener">astronomy-engine</a> (D. Cross, licence MIT), calculé dans ton navigateur.</li>
      <li>Rayons, périodes, températures : <a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noopener">NASA Planetary Fact Sheet</a>.</li>
      <li>Nombre de lunes & noms : <a href="https://ssd.jpl.nasa.gov/" target="_blank" rel="noopener">JPL Solar System Dynamics</a> & <a href="https://www.iau.org/" target="_blank" rel="noopener">UAI</a> (évolutif).</li>
      <li>Définition d'une planète : <a href="https://www.iau.org/static/resolutions/Resolution_GA26-5-6.pdf" target="_blank" rel="noopener">UAI, résolution B5 (2006)</a>.</li></ul>`,
    en:`<h4>Sources</h4><ul>
      <li>Positions, magnitudes, phases: <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noopener">astronomy-engine</a> (D. Cross, MIT), computed in your browser.</li>
      <li>Radii, periods, temperatures: <a href="https://nssdc.gsfc.nasa.gov/planetary/factsheet/" target="_blank" rel="noopener">NASA Planetary Fact Sheet</a>.</li>
      <li>Moon counts & names: <a href="https://ssd.jpl.nasa.gov/" target="_blank" rel="noopener">JPL Solar System Dynamics</a> & <a href="https://www.iau.org/" target="_blank" rel="noopener">IAU</a> (evolving).</li>
      <li>Definition of a planet: <a href="https://www.iau.org/static/resolutions/Resolution_GA26-5-6.pdf" target="_blank" rel="noopener">IAU Resolution B5 (2006)</a>.</li></ul>`
  };
  function fieldsModal(){
    const fr=`<h3>${t('solar.fields')}</h3>
      <p>Toutes les valeurs marquées « du jour » sont recalculées à l'instant présent dans ton navigateur — reproductibles avec astronomy-engine et une date.</p>
      <h4>Distance au Soleil (héliocentrique)</h4><p>Distance <b>de centre à centre</b> entre le Soleil et l'astre, en unités astronomiques.</p>
      <span class="formula">r = ‖ HelioVector(astre, date) ‖   ·   1 UA = 149 597 870,7 km</span>
      <h4>Distance à la Terre (géocentrique)</h4><p>Distance <b>centre Terre → centre astre</b> à l'instant présent (aberration incluse).</p>
      <span class="formula">d = ‖ GeoVector(astre, date, corr) ‖</span>
      <h4>Temps-lumière</h4><p>Durée que met la lumière pour parcourir cette distance.</p>
      <span class="formula">t = d / c   ≈   d(UA) × 8,317 min</span>
      <h4>Diamètre apparent</h4><p>Taille angulaire du disque vu depuis la Terre, en secondes d'arc (″).</p>
      <span class="formula">θ = 2·arctan( R / d )   →   × 206 265 pour des ″   (R = rayon équatorial)</span>
      <h4>Magnitude apparente</h4><p>Éclat perçu (plus c'est petit/négatif, plus c'est brillant). Modèle photométrique d'astronomy-engine, dépend de la distance et de l'angle de phase.</p>
      <h4>Fraction éclairée / phase</h4><p>Part du disque éclairée vue depuis la Terre (0 = nouvelle, 1 = pleine).</p>
      <h4>Rayon, périodes, température, découverte</h4><p>Valeurs de référence (voir sources), pas des calculs du jour.</p>
      ${SRC.fr}`;
    const en=`<h3>${t('solar.fields')}</h3>
      <p>Every "today" value is recomputed for the present instant in your browser — reproducible with astronomy-engine and a date.</p>
      <h4>Distance to the Sun (heliocentric)</h4><p><b>Centre-to-centre</b> distance between the Sun and the body, in astronomical units.</p>
      <span class="formula">r = ‖ HelioVector(body, date) ‖   ·   1 AU = 149,597,870.7 km</span>
      <h4>Distance to Earth (geocentric)</h4><p><b>Earth centre → body centre</b> at the present instant (aberration included).</p>
      <span class="formula">d = ‖ GeoVector(body, date, corr) ‖</span>
      <h4>Light-time</h4><span class="formula">t = d / c   ≈   d(AU) × 8.317 min</span>
      <h4>Apparent diameter</h4><p>Angular size of the disk as seen from Earth, in arcseconds (″).</p>
      <span class="formula">θ = 2·arctan( R / d )   →   × 206,265 for ″   (R = equatorial radius)</span>
      <h4>Apparent magnitude</h4><p>Perceived brightness (smaller/negative = brighter). astronomy-engine photometric model; depends on distance and phase angle.</p>
      <h4>Illuminated fraction / phase</h4><p>Fraction of the disk lit as seen from Earth (0 = new, 1 = full).</p>
      <h4>Radius, periods, temperature, discovery</h4><p>Reference values (see sources), not today's computations.</p>
      ${SRC.en}`;
    D.modal(lang()==="en"?en:fr);
  }
  function moonsModal(p){
    const namesTxt = Array.isArray(p.allMoons) ? p.allMoons.map(m=>typeof m==="string"?m:L(m)).join(", ") : "";
    const fr=`<h3>${L(p)} — ${t('f.moonsN').toLowerCase()}</h3>
      <p>Nombre confirmé : <b>${p.count}</b>${p.asOf?` (${p.asOf})`:""}. Ce total évolue au fil des découvertes ; beaucoup de petites lunes portent une désignation provisoire (S/…) avant d'être nommées.</p>
      ${namesTxt?`<h4>Lunes nommées (${p.allMoons.length})</h4><p>${namesTxt}.</p>`:""}
      ${SRC.fr}`;
    const en=`<h3>${L(p)} — ${t('f.moonsN').toLowerCase()}</h3>
      <p>Confirmed count: <b>${p.count}</b>${p.asOf?` (${p.asOf})`:""}. This total evolves with new discoveries; many small moons keep a provisional designation (S/…) before being named.</p>
      ${namesTxt?`<h4>Named moons (${p.allMoons.length})</h4><p>${namesTxt}.</p>`:""}
      ${SRC.en}`;
    D.modal(lang()==="en"?en:fr);
  }
  function dwarfWhyModal(){
    const fr=`<h3>${t('solar.dwarf.why')}</h3>
      <p>Depuis la <b>résolution B5 de l'UAI (2006)</b>, une <i>planète</i> doit remplir trois conditions :</p>
      <ul><li>être en orbite autour du Soleil ;</li><li>être suffisamment massive pour être quasi ronde (équilibre hydrostatique) ;</li><li>avoir « nettoyé » le voisinage de son orbite.</li></ul>
      <p>Une <b>planète naine</b> remplit les deux premières mais <b>pas la troisième</b> (et n'est pas un satellite). Cinq sont reconnues : Pluton, Cérès, Éris, Hauméa, Makémaké — d'autres candidates existent.</p>${SRC.fr}`;
    const en=`<h3>${t('solar.dwarf.why')}</h3>
      <p>Under <b>IAU Resolution B5 (2006)</b>, a <i>planet</i> must meet three criteria:</p>
      <ul><li>orbit the Sun;</li><li>be massive enough to be nearly round (hydrostatic equilibrium);</li><li>have "cleared" the neighbourhood of its orbit.</li></ul>
      <p>A <b>dwarf planet</b> meets the first two but <b>not the third</b> (and is not a satellite). Five are recognised: Pluto, Ceres, Eris, Haumea, Makemake — with more candidates.</p>${SRC.en}`;
    D.modal(lang()==="en"?en:fr);
  }

  // ---------- détail ----------
  function findByKey(k){ return data.find(d=>d.p.key===k) || dwarfData.find(d=>d.p.key===k); }
  function detail(key){
    state.selected = key;
    if(key==="Sun"){
      root.querySelector("#detail").innerHTML=`
        <div class="d-head"><div><p class="eyebrow" data-static>${t('type.star')}</p><h2>${L(SUN)}</h2></div>
          <button class="btn" data-back>${t('solar.back')}</button></div>
        ${disk({color:SUN.color})}
        <table class="datatable">
          <tr><td>${t('f.radius')}</td><td>${SUN.radius.toLocaleString('fr-FR')} km</td></tr>
          <tr><td>${t('f.rot')}</td><td>${L(SUN.rot)}</td></tr>
          <tr><td>${t('f.temp')}</td><td>${L(SUN.temp)}</td></tr>
          <tr><td>${t('f.discovery')}</td><td>${L(SUN.disc)}</td></tr>
        </table>
        <p style="color:var(--muted)">${L(SUN.fact)} <button class="info-btn" data-modal="fields" title="${t('solar.fields')}">i</button></p>`;
      return;
    }
    const d=findByKey(key); if(!d) return;
    const {p,c}=d;
    const idx=data.findIndex(x=>x.p.key===key);
    const nav = idx>=0 ? (()=>{ const prev=(idx-1+data.length)%data.length, next=(idx+1)%data.length;
      return `<div class="d-nav"><button class="btn" data-go="${data[prev].p.key}">← ${L(data[prev].p)}</button>
        <button class="btn" data-go="${data[next].p.key}">${L(data[next].p)} →</button></div>`; })() : "";
    const angBlock = c.ang!=null ? `<div class="d-ang"><span class="mono big">${fmt(c.ang,1)}″</span>
        <span style="color:var(--muted);font-size:.8rem">${t('solar.ang')} <button class="info-btn" data-modal="fields" title="${t('solar.fields')}">i</button></span></div>` : "";
    root.querySelector("#detail").innerHTML=`
      <div class="d-head"><div><p class="eyebrow">${t(p.typeKey)}</p><h2>${L(p)}</h2></div>
        <button class="btn" data-back>${t('solar.back')}</button></div>
      <div class="d-visual">${disk(p,c.illum)}${angBlock}</div>
      ${p.typeKey==="type.dwarf" && !p.live ? `<p class="mono" style="font-size:.78rem;color:var(--faint)">${lang()==='en'?'Live position not computed for this body.':'Position en direct non calculée pour cet astre.'}</p>`:""}
      ${moonRow(p)}
      <div style="display:flex;justify-content:flex-end;margin:.2rem 0 -.2rem">
        <button class="info-btn" data-modal="fields" title="${t('solar.fields')}">i</button></div>
      <table class="datatable">
        <tr><td>${t('f.type')}</td><td>${t(p.typeKey)}</td></tr>
        <tr><td>${t('f.distSun')}</td><td>${c.rSun!=null?fmt(c.rSun,3)+" UA · "+fmt(c.rSun*AU/1e6,1)+" M km":"—"}</td></tr>
        <tr><td>${t('f.distEarth')}</td><td>${c.dEarth?fmt(c.dEarth,3)+" UA · "+fmt(c.dEarth*AU/1e6,1)+" M km":"—"}</td></tr>
        <tr><td>${t('f.lighttime')}</td><td>${c.dEarth?fmt(c.dEarth*8.317,1)+" min":"—"}</td></tr>
        <tr><td>${t('f.mag')}</td><td>${c.mag!=null?fmt(c.mag,1):"—"}</td></tr>
        <tr><td>${t('f.illum')}</td><td>${c.illum!=null?Math.round(c.illum*100)+" % · "+phaseName(c.illum):"—"}</td></tr>
        <tr><td>${t('f.period')}</td><td>${L(p.period||{fr:'—',en:'—'})}</td></tr>
        <tr><td>${t('f.rot')}</td><td>${L(p.rot)}</td></tr>
        <tr><td>${t('f.radius')}</td><td>${p.radius.toLocaleString('fr-FR')} km</td></tr>
        <tr><td>${t('f.temp')}</td><td>${L(p.temp)}</td></tr>
        <tr><td>${t('f.discovery')}</td><td>${L(p.disc)}</td></tr>
      </table>
      <p style="color:var(--muted)">${L(p.fact)}</p>
      ${nav}`;
    // interactions lunes
    root.querySelectorAll(".moon-dot").forEach(b=>b.addEventListener("click",()=>{
      root.querySelector("#moon-info").innerHTML=`<b style="color:var(--ink)">${b.dataset.n}</b> — ${lang()==='en'?'dist.':'dist.'} ${b.dataset.dist}. ${decodeURIComponent(b.dataset.info)}`; }));
    const allBtn=root.querySelector("[data-allmoons]"), allBox=root.querySelector("#allmoons");
    if(allBtn) allBtn.addEventListener("click",()=>{
      if(allBox.hidden){
        allBox.innerHTML=`<div class="chips">${p.allMoons.map(m=>{const nm=typeof m==="string"?m:L(m);
          return `<span class="chip${nm==="Despina"?" hl":""}">${nm}</span>`;}).join("")}</div>
          <p class="mono" style="font-size:.72rem;color:var(--faint);margin:.3rem 0 0">${lang()==='en'?'Named moons. Full/updated list':'Lunes nommées. Liste complète/à jour'} : <a href="https://ssd.jpl.nasa.gov/" target="_blank" rel="noopener">JPL SSD</a>. <button class="info-btn" data-modal="moons">i</button></p>`;
        allBox.hidden=false; allBtn.textContent="− "+t('solar.moons.all');
      } else { allBox.hidden=true; allBtn.textContent="+ "+t('solar.moons.all')+` (${p.allMoons.length}${p.count>p.allMoons.length?'/'+p.count:''})`; }
    });
  }

  // ---------- assemblage ----------
  function build(){
    root.innerHTML=`
      <div class="solar-grid">
        <section class="card map">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:1rem;flex-wrap:wrap">
            <div><p class="eyebrow">${t('solar.overview.eyebrow')}</p><h2 style="margin:.1rem 0">${t('solar.overview.title')}</h2></div>
            <span class="mono" style="color:var(--faint);font-size:.78rem">${now.toLocaleString(lang()==='en'?'en':'fr-FR',{dateStyle:'long',timeStyle:'short'})}</span>
          </div>
          <p style="color:var(--muted);font-size:.85rem;margin:.2rem 0 .6rem">${t('solar.overview.note')}</p>
          <div class="map-svg">${overviewSVG()}</div>
          <label style="display:flex;align-items:center;gap:.5rem;margin:.7rem 0 .2rem;font-size:.88rem;cursor:pointer">
            <input type="checkbox" id="dw" ${state.showDwarfs?"checked":""}> ${t('solar.dwarfs')}
            <button class="info-btn" data-modal="dwarf" title="${t('solar.dwarf.why')}">i</button></label>
          <div id="dwarf-chips" ${state.showDwarfs?"":"hidden"} style="margin:.3rem 0 .4rem"></div>
          <p class="eyebrow" style="margin-top:.8rem">${t('solar.strip')}</p>
          ${angStrip(state.selected)}
        </section>
        <aside class="card" id="detail-wrap"><div id="detail"></div></aside>
      </div>`;
    // chips planètes naines
    const chips=root.querySelector("#dwarf-chips");
    chips.innerHTML=`<div class="chips">${dwarfData.map(d=>`<button class="chip" data-go="${d.p.key}" style="cursor:pointer">${L(d.p)}</button>`).join("")}</div>`;
    // bind carte
    root.querySelectorAll(".pl").forEach(el=>{ const go=()=>detail(el.dataset.key);
      el.addEventListener("click",go); el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}}); });
    // toggle naines
    root.querySelector("#dw").addEventListener("change",e=>{ state.showDwarfs=e.target.checked; build(); if(state.selected) detail(state.selected); });
    // détail ou vide
    if(state.selected) detail(state.selected);
    else root.querySelector("#detail").innerHTML=`<div class="d-empty"><p class="big display">${t('solar.empty.h')}</p><p style="color:var(--muted)">${t('solar.empty.p')}</p></div>`;
  }
  // délégation modales + navigation
  root.addEventListener("click",e=>{
    const m=e.target.closest("[data-modal]");
    if(m){ const k=m.dataset.modal;
      if(k==="fields") fieldsModal();
      else if(k==="dwarf") dwarfWhyModal();
      else if(k==="moons"){ const d=findByKey(state.selected); if(d) moonsModal(d.p); }
      return; }
    const back=e.target.closest("[data-back]"); if(back){ state.selected=null; build(); return; }
    const g=e.target.closest("[data-go]"); if(g){ detail(g.dataset.go); }
  });

  build();
  document.addEventListener("despina:lang", ()=>{ build(); });
})();
