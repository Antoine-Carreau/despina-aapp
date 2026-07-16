/* Despina — vignettes photo du ciel réel.
   Service hips2fits du CDS (Strasbourg) : découpe une image dans un relevé HiPS
   à partir de coordonnées. Sans clé, sans compte.
   Doc : https://alasky.cds.unistra.fr/hips-image-services/hips2fits */
(function () {
  const D = window.Despina = window.Despina || {};
  const EP = "https://alasky.cds.unistra.fr/hips-image-services/hips2fits";

  D.SURVEYS = [
    { id:"CDS/P/DSS2/color", fr:"DSS2 couleur (visible)", en:"DSS2 colour (visible)" },
    { id:"CDS/P/DSS2/red",   fr:"DSS2 rouge (contrasté)", en:"DSS2 red (contrast)" },
    { id:"CDS/P/2MASS/color",fr:"2MASS (infrarouge proche)", en:"2MASS (near-infrared)" },
    { id:"CDS/P/AllWISE/color", fr:"WISE (infrarouge moyen)", en:"WISE (mid-infrared)" }
  ];

  /* Champ de vue conseillé (degrés) : ~2,2× la taille de l'objet, borné pour rester lisible.
     dimArcmin peut être nul (objet sans taille connue) -> valeur par défaut. */
  D.photoFov = function (dimArcmin) {
    const d = Number(dimArcmin);
    if (!isFinite(d) || d <= 0) return 0.5;
    return Math.min(5, Math.max(0.15, (d * 2.2) / 60));
  };

  /* URL d'une vignette JPEG centrée sur ra/dec (degrés). */
  D.photoUrl = function (ra, dec, opts) {
    opts = opts || {};
    const size = opts.size || 420;
    const fov = opts.fov || D.photoFov(opts.dim);
    const hips = opts.survey || "CDS/P/DSS2/color";
    const q = new URLSearchParams({
      hips, width: size, height: size, fov: fov.toFixed(4),
      projection: "TAN", coordsys: "icrs",
      ra: Number(ra).toFixed(5), dec: Number(dec).toFixed(5), format: "jpg"
    });
    return EP + "?" + q.toString();
  };

  /* <img> paresseuse avec repli si le CDS est injoignable.
     onFail : appelé si l'image ne charge pas (le service est distant). */
  D.photoImg = function (ra, dec, opts) {
    opts = opts || {};
    const img = document.createElement("img");
    img.loading = opts.eager ? "eager" : "lazy";
    img.decoding = "async";
    img.alt = opts.alt || "";
    img.referrerPolicy = "no-referrer";
    img.src = D.photoUrl(ra, dec, opts);
    img.addEventListener("error", () => {
      img.classList.add("photo-fail");
      if (opts.onFail) opts.onFail(img);
    });
    return img;
  };
})();
