#!/usr/bin/env python3
"""Despina — construction du catalogue sky.json depuis les données ouvertes d3-celestial.
Sources : stars.6 (HYG), constellations(.lines) (Stellarium), messier.json, dsos.14.json (OpenNGC).
Sortie   : assets/data/sky.json
"""
import json, os

SRC = os.path.dirname(os.path.abspath(__file__))
OUT = "/home/claude/despina-aapp/assets/data/sky.json"

FR = {"And":"Andromède","Ant":"Machine pneumatique","Aps":"Oiseau de paradis","Aql":"Aigle","Aqr":"Verseau","Ara":"Autel","Ari":"Bélier","Aur":"Cocher","Boo":"Bouvier","CMa":"Grand Chien","CMi":"Petit Chien","CVn":"Chiens de chasse","Cae":"Burin","Cam":"Girafe","Cap":"Capricorne","Car":"Carène","Cas":"Cassiopée","Cen":"Centaure","Cep":"Céphée","Cet":"Baleine","Cha":"Caméléon","Cir":"Compas","Cnc":"Cancer","Col":"Colombe","Com":"Chevelure de Bérénice","CrA":"Couronne australe","CrB":"Couronne boréale","Crt":"Coupe","Cru":"Croix du Sud","Crv":"Corbeau","Cyg":"Cygne","Del":"Dauphin","Dor":"Dorade","Dra":"Dragon","Equ":"Petit Cheval","Eri":"Éridan","For":"Fourneau","Gem":"Gémeaux","Gru":"Grue","Her":"Hercule","Hor":"Horloge","Hya":"Hydre","Hyi":"Hydre mâle","Ind":"Indien","LMi":"Petit Lion","Lac":"Lézard","Leo":"Lion","Lep":"Lièvre","Lib":"Balance","Lup":"Loup","Lyn":"Lynx","Lyr":"Lyre","Men":"Table","Mic":"Microscope","Mon":"Licorne","Mus":"Mouche","Nor":"Règle","Oct":"Octant","Oph":"Ophiuchus","Ori":"Orion","Pav":"Paon","Peg":"Pégase","Per":"Persée","Phe":"Phénix","Pic":"Peintre","PsA":"Poisson austral","Psc":"Poissons","Pup":"Poupe","Pyx":"Boussole","Ret":"Réticule","Scl":"Sculpteur","Sco":"Scorpion","Sct":"Écu de Sobieski","Ser":"Serpent","Sex":"Sextant","Sge":"Flèche","Sgr":"Sagittaire","Tau":"Taureau","Tel":"Télescope","TrA":"Triangle austral","Tri":"Triangle","Tuc":"Toucan","UMa":"Grande Ourse","UMi":"Petite Ourse","Vel":"Voiles","Vir":"Vierge","Vol":"Poisson volant","Vul":"Petit Renard"}

# types d3-celestial -> codes Despina
TMAP = {"s":"GX","s0":"GX","e":"GX","i":"GX","g":"GX","sd":"GX","gg":"GG",
        "oc":"OC","gc":"GC","pn":"PN","bn":"NE","en":"NE","rn":"NE","sfr":"NE",
        "dn":"DN","snr":"SR","pos":"OT","s?":"GX"}
# corrections manuelles (le jeu de données classe les Pléiades en « région de formation d'étoiles »)
FIX_TYPE = {"M45":"OC"}

NAMES = {
 "NGC 7000":("Nébuleuse North America","North America Nebula"),
 "IC 434":("Nébuleuse de la Tête de Cheval","Horsehead Nebula"),
 "NGC 869":("Double amas de Persée (h)","Double Cluster (h Per)"),
 "NGC 884":("Double amas de Persée (χ)","Double Cluster (χ Per)"),
 "NGC 2237":("Nébuleuse de la Rosette","Rosette Nebula"),
 "NGC 6960":("Dentelles du Cygne (Balai de Sorcière)","Veil Nebula (Witch's Broom)"),
 "NGC 6992":("Dentelles du Cygne (Est)","Veil Nebula (East)"),
 "NGC 7293":("Nébuleuse de l'Hélice","Helix Nebula"),
 "NGC 253":("Galaxie du Sculpteur","Sculptor Galaxy"),
 "NGC 5128":("Centaurus A","Centaurus A"),
 "NGC 5139":("Oméga du Centaure","Omega Centauri"),
 "NGC 4565":("Galaxie de l'Aiguille","Needle Galaxy"),
 "NGC 6543":("Nébuleuse de l'Œil de Chat","Cat's Eye Nebula"),
 "NGC 2392":("Nébuleuse de l'Esquimau","Eskimo Nebula"),
 "NGC 3372":("Nébuleuse de la Carène","Carina Nebula"),
 "NGC 2070":("Nébuleuse de la Tarentule","Tarantula Nebula"),
 "NGC 6826":("Nébuleuse Clignotante","Blinking Planetary"),
 "NGC 457":("Amas de la Chouette (ET)","Owl Cluster (ET)"),
 "NGC 2264":("Amas de l'Arbre de Noël","Christmas Tree Cluster"),
 "NGC 1499":("Nébuleuse California","California Nebula"),
 "NGC 6888":("Nébuleuse du Croissant","Crescent Nebula"),
 "NGC 6822":("Galaxie de Barnard","Barnard's Galaxy"),
 "NGC 6946":("Galaxie du Feu d'Artifice","Fireworks Galaxy"),
 "NGC 4631":("Galaxie de la Baleine","Whale Galaxy"),
 "NGC 4656":("Galaxie de la Crosse de Hockey","Hockey Stick Galaxy"),
 "NGC 5907":("Galaxie de l'Écharde","Splinter Galaxy"),
 "NGC 7635":("Nébuleuse de la Bulle","Bubble Nebula"),
 "NGC 281":("Nébuleuse Pacman","Pacman Nebula"),
 "NGC 3628":("Galaxie du Hamburger","Hamburger Galaxy"),
 "NGC 4038":("Galaxies des Antennes","Antennae Galaxies"),
 "NGC 2244":("Amas de la Rosette","Rosette Cluster"),
 "IC 1396":("Nébuleuse de la Trompe d'Éléphant","Elephant's Trunk Nebula"),
 "IC 5146":("Nébuleuse du Cocon","Cocoon Nebula"),
 "IC 405":("Nébuleuse de l'Étoile Flamboyante","Flaming Star Nebula"),
 "IC 2602":("Pléiades du Sud","Southern Pleiades"),
 "NGC 104":("47 Tucanae","47 Tucanae"),
 "NGC 4755":("Boîte à Bijoux","Jewel Box"),
 "NGC 3242":("Fantôme de Jupiter","Ghost of Jupiter"),
 "NGC 246":("Nébuleuse du Crâne","Skull Nebula"),
 "NGC 7009":("Nébuleuse Saturne","Saturn Nebula"),
 "NGC 6302":("Nébuleuse du Papillon","Butterfly Nebula"),
 "NGC 3132":("Nébuleuse aux Huit Éclats","Eight-Burst Nebula"),
 "NGC 891":("Galaxie NGC 891","NGC 891"),
 "NGC 7331":("Galaxie NGC 7331","NGC 7331"),
 "NGC 2903":("Galaxie NGC 2903","NGC 2903"),
 "NGC 1365":("Galaxie NGC 1365","NGC 1365"),
}

j = lambda f: json.load(open(os.path.join(SRC, f), encoding="utf-8"))
r3 = lambda x: round(float(x), 3)
def ra360(x):
    x = float(x)
    return round(x + 360.0 if x < 0 else x, 3)
def fmag(v):
    try:
        f = float(v)
        return None if f > 90 else round(f, 1)
    except Exception:
        return None
def dim2am(s):
    if not s: return None
    try:
        return round(max(float(p) for p in str(s).replace("×", "x").split("x")), 2)
    except Exception:
        return None

# ---- étoiles ----
stars = []
for f in j("stars.6.json")["features"]:
    lon, dec = f["geometry"]["coordinates"]; p = f["properties"]
    try: bv = round(float(p.get("bv") or 0), 2)
    except Exception: bv = 0.0
    stars.append([ra360(lon), r3(dec), round(float(p["mag"]), 2), bv])

# ---- constellations (lignes + noms, alignés par index) ----
names = j("constellations.json")["features"]
lines = j("constellations.lines.json")["features"]
# Attention : dans d3-celestial, "name" est le nom UAI officiel (Ursa Major, Bootes)
# tandis que "en" est le nom vernaculaire (Big Dipper, Herdsman) et "la" une graphie
# latine médiévale (Ursa Maior). L'étiquette anglaise d'une constellation est le nom
# UAI ; le vernaculaire n'est gardé que pour la recherche.
NBSP = "\u2005"
clean = lambda x: (x or "").replace(NBSP, " ").strip()
IAU_FIX = {"Ser": "Serpens"}          # les deux moitiés (Caput/Cauda) sont fusionnées
lbd = {}
for i in range(len(lines)):
    p = names[i]["properties"]; d = p["desig"]
    pt = names[i]["geometry"]["coordinates"]
    iau = IAU_FIX.get(d, clean(p.get("name")))
    e = lbd.setdefault(d, {"d": d, "la": iau, "en": clean(p.get("en")) or iau,
                           "fr": FR.get(d, iau), "gen": clean(p.get("gen")),
                           "pt": [ra360(pt[0]), r3(pt[1])], "lines": []})
    e["lines"].extend([[[ra360(a), r3(b)] for a, b in seg] for seg in lines[i]["geometry"]["coordinates"]])
consts = list(lbd.values())

# ---- Messier ----
d14 = {x["properties"]["desig"]: x["properties"] for x in j("dsos.14.json")["features"]}
messier = []
for f in j("messier.json")["features"]:
    lon, dec = f["geometry"]["coordinates"]; p = f["properties"]
    name = p["name"]
    t = FIX_TYPE.get(name) or TMAP.get((p.get("type") or "").lower(), "OT")
    extra = d14.get("M " + name[1:], {})
    messier.append([name, ra360(lon), r3(dec), t, fmag(p.get("mag")),
                    p.get("alt", "") or "", dim2am(p.get("dim") or extra.get("dim")),
                    extra.get("morph", "") or "", p.get("desig", "") or ""])
messier.sort(key=lambda m: int(m[0][1:]))

# ---- NGC / IC (mag <= 12) ----
dso, seen = [], set()
for x in j("dsos.14.json")["features"]:
    p = x["properties"]; dg = p["desig"]
    if not dg.startswith(("NGC ", "IC ")) or dg in seen: continue
    mag = fmag(p.get("mag"))
    t = TMAP.get(p.get("type"))
    if mag is None or mag > 12 or not t or t in ("DN", "OT"): continue
    seen.add(dg)
    lon, dec = x["geometry"]["coordinates"]
    fr, en = NAMES.get(dg, ("", ""))
    e = [dg, ra360(lon), r3(dec), t, mag, dim2am(p.get("dim")), fr, en]
    while e and e[-1] in ("", None): e.pop()
    dso.append(e)
dso.sort(key=lambda e: (e[0].split()[0], int(e[0].split()[1])))

out = {"stars": stars, "consts": consts, "messier": messier, "dso": dso,
       "meta": {"stars": "HYG / d3-celestial (mag<=6)", "lines": "Stellarium / d3-celestial",
                "messier": "d3-celestial", "dso": "OpenNGC / d3-celestial (NGC+IC, mag<=12)"}}
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(out, open(OUT, "w", encoding="utf-8"), separators=(",", ":"), ensure_ascii=False)

from collections import Counter
print("étoiles", len(stars), "| constellations", len(consts), "| messier", len(messier), "| NGC/IC", len(dso))
print("types Messier:", Counter(m[3] for m in messier).most_common())
print("types NGC/IC :", Counter(e[3] for e in dso).most_common())
print("taille", round(os.path.getsize(OUT) / 1024, 1), "Ko")
