/* Despina — moteur de carte du ciel, dans l'esprit de Stellarium.
   ------------------------------------------------------------------
   Deux projections :
   - "stereo"  : vue à la première personne (défaut). On regarde dans une
                 direction (azimut/hauteur) avec un champ de vue ; le sol est
                 en bas, le ciel au-dessus. Glisser = tourner la tête,
                 molette = changer le champ de vue. Projection stéréographique,
                 comme le réglage par défaut de Stellarium.
   - "fisheye" : carte tout-le-ciel, zénith au centre, N en haut, E à gauche
                 (vue d'ensemble ; utilisée par la page « Ce soir »).

   Base toujours stable : aucun roulis. L'horizon reste horizontal, le zénith
   en haut — impossible d'avoir la tête à l'envers.

   Repère horizontal : [nord, est, haut].
   Les positions fixes (étoiles, constellations, objets) sont converties une
   fois en vecteurs équatoriaux ; chaque image n'est plus qu'un produit
   matriciel — aucune trigonométrie par étoile.
*/
(function () {
  const D = window.Despina = window.Despina || {};
  const A = () => window.Astronomy;
  const DEG = Math.PI / 180, R2D = 180 / Math.PI;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const norm360 = a => ((a % 360) + 360) % 360;

  const FOV_MIN = 0.5, FOV_MAX = 180;

  function css(v, fb){ try{ const c=getComputedStyle(document.documentElement).getPropertyValue(v).trim(); return c||fb; }catch(e){ return fb; } }
  const mix = (a,b,t) => a.map((v,i)=>Math.round(v + (b[i]-v)*t));
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;

  function starColor(bv, night){
    if (night) return "#ff5a49";
    if (bv < 0.0) return "#a9c7ff";
    if (bv < 0.3) return "#cfe0ff";
    if (bv < 0.6) return "#ffffff";
    if (bv < 0.9) return "#fff2cc";
    if (bv < 1.3) return "#ffd9a0";
    return "#ff9b6b";
  }
  const DSO_COLOR = { GX:"#c58cf0", OC:"#8fd3ff", GC:"#ffd166", NE:"#6ee7a8", PN:"#5ee0d0", SR:"#ff8fa3", GG:"#c58cf0", OT:"#9aa4bd" };

  // (RA°, Dec°) -> vecteur équatorial unitaire, calculé une seule fois
  const eqv = (ra, dec) => { const r=ra*DEG, d=dec*DEG, cd=Math.cos(d);
    return [cd*Math.cos(r), cd*Math.sin(r), Math.sin(d)]; };

  D.SkyMap = function (canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const data = opts.data;
    const interactive = opts.interactive !== false;
    const lang = () => (D.getLang ? D.getLang() : "fr");
    const onSelect = opts.onSelect || function(){};
    const onView = opts.onView || function(){};

    const st = {
      lat: opts.location?.lat ?? 48.8566,
      lon: opts.location?.lon ?? 2.3522,
      name: opts.location?.name ?? "Paris",
      date: opts.date ? new Date(opts.date) : new Date(),
      rate: 1, playing: false,          // écoulement du temps (× temps réel)
      proj: opts.projection === "allsky" ? "fisheye" : "stereo",
      az: opts.az != null ? opts.az : 180,   // regard : plein sud par défaut
      alt: opts.alt != null ? opts.alt : 20,
      fov: opts.fov || (opts.projection === "allsky" ? 180 : 90),
      zoomS: 1, panX: 0, panY: 0,       // loupe, uniquement en mode tout-le-ciel
      layers: Object.assign({ stars:true, constellations:true, labels:true, messier:true,
        dso:false, planets:true, grid:false, ground:true, atmosphere:true, cardinals:true }, opts.layers||{}),
      selected: null
    };
    if (st.proj === "fisheye") { st.az = 180; st.alt = 90; st.fov = 180; }

    /* ---------- préparation des données (une seule fois) ---------- */
    const STARS = data.stars.map(s => ({ v:eqv(s[0],s[1]), mag:s[2], bv:s[3] }));
    const CONSTS = data.consts.map(c => ({
      d:c.d, la:c.la, en:c.en, fr:c.fr, gen:c.gen,
      segs: c.lines.map(seg => seg.map(p => eqv(p[0],p[1]))),
      lab: eqv(c.pt[0], c.pt[1])
    }));
    const MESSIER = data.messier.map(m => ({ v:eqv(m[1],m[2]), m }));
    const DSO = (data.dso||[]).map(o => ({ v:eqv(o[1],o[2]), o }));
    const PLANETS = [
      ["Sun",{fr:"Soleil",en:"Sun"},"#ffcf5e"],
      ["Moon",{fr:"Lune",en:"Moon"},"#dfe4ee"],
      ["Mercury",{fr:"Mercure",en:"Mercury"},"#a9a29b"],
      ["Venus",{fr:"Vénus",en:"Venus"},"#f0d9a0"],
      ["Mars",{fr:"Mars",en:"Mars"},"#e0653f"],
      ["Jupiter",{fr:"Jupiter",en:"Jupiter"},"#e6c79a"],
      ["Saturn",{fr:"Saturne",en:"Saturn"},"#e6d29a"]
    ];

    let W, H, cx, cy, half, dpr, scale;
    let cosL, sinL, cosF, sinF;          // matrice équatorial -> horizontal
    let Rv, Uv, Fv;                      // repère de la vue
    let hits = [];                       // objets cliquables de l'image courante
    let sunHor = null;                   // position du Soleil (atmosphère)

    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      cx = W/2; cy = H/2; half = Math.min(W,H)/2;
      draw();
    }

    /* ---------- projection ---------- */
    function setScale(){
      scale = st.proj === "stereo"
        ? half / (2*Math.tan(st.fov/4*DEG))     // r = 2·tan(θ/2), θ = fov/2
        : half / (st.fov/2*DEG);                // azimutale équidistante
    }
    function setBasis(){
      const a=st.az*DEG, h=st.alt*DEG;
      const ca=Math.cos(a), sa=Math.sin(a), ch=Math.cos(h), sh=Math.sin(h);
      Fv=[ch*ca, ch*sa, sh];
      Rv=[-sa, ca, 0];                 // toujours horizontal => aucun roulis
      Uv=[-sh*ca, -sh*sa, ch];         // = F × R
    }
    // vecteur équatorial -> [nord, est, haut]
    function toHor(v){
      const a=v[0]*cosL+v[1]*sinL, b=v[0]*sinL-v[1]*cosL, c=v[2];
      return [c*cosF-a*sinF, -b, c*sinF+a*cosF];
    }
    const altOf = h => Math.asin(clamp(h[2],-1,1))*R2D;
    const azOf  = h => norm360(Math.atan2(h[1],h[0])*R2D);
    // [nord,est,haut] -> écran (null si hors de la projection)
    function projHor(h){
      const x=h[0]*Rv[0]+h[1]*Rv[1]+h[2]*Rv[2];
      const y=h[0]*Uv[0]+h[1]*Uv[1]+h[2]*Uv[2];
      const z=h[0]*Fv[0]+h[1]*Fv[1]+h[2]*Fv[2];
      if (st.proj === "stereo"){
        if (z <= -0.9) return null;                 // trop loin derrière
        const k = 2/(1+z);
        return { x: cx + k*x*scale, y: cy - k*y*scale };
      }
      const th = Math.acos(clamp(z,-1,1));
      const s = Math.hypot(x,y);
      let px, py;
      if (s < 1e-9){ px=cx; py=cy; }
      else { const r = th*scale; px = cx + (x/s)*r; py = cy - (y/s)*r; }
      return { x:(px-cx)*st.zoomS+cx+st.panX, y:(py-cy)*st.zoomS+cy+st.panY };  // loupe
    }
    const projAltAz = (alt,az) => { const h=alt*DEG, a=az*DEG, ch=Math.cos(h);
      return projHor([ch*Math.cos(a), ch*Math.sin(a), Math.sin(h)]); };
    // écran -> [alt, az] (pour l'interaction et le sol)
    function unproj(sx, sy){
      let X, Y;
      if (st.proj === "stereo"){ X=(sx-cx)/scale; Y=-(sy-cy)/scale; }
      else { X=((sx-st.panX-cx)/st.zoomS)/scale; Y=-((sy-st.panY-cy)/st.zoomS)/scale; }
      let x,y,z;
      if (st.proj === "stereo"){
        const R2=X*X+Y*Y; z=(4-R2)/(4+R2); const f=(1+z)/2; x=X*f; y=Y*f;
      } else {
        const r=Math.hypot(X,Y), th=r;
        if (th>Math.PI) return null;
        if (r<1e-9){ x=0;y=0;z=1; } else { const s=Math.sin(th); z=Math.cos(th); x=X/r*s; y=Y/r*s; }
      }
      const n=x*Rv[0]+y*Uv[0]+z*Fv[0], e=x*Rv[1]+y*Uv[1]+z*Fv[1], u=x*Rv[2]+y*Uv[2]+z*Fv[2];
      return { alt: Math.asin(clamp(u,-1,1))*R2D, az: norm360(Math.atan2(e,n)*R2D) };
    }
    const onScreen = p => !!p && p.x>-80 && p.x<W+80 && p.y>-60 && p.y<H+60;

    /* ---------- atmosphère ---------- */
    // 0 = nuit noire (Soleil < -18°), 1 = Soleil à l'horizon, >1 = plein jour
    function dayFactor(){
      if (!sunHor) return 0;
      const a = altOf(sunHor);
      return { twilight: clamp((a+18)/18, 0, 1), bright: clamp(a/6, 0, 1), alt:a };
    }

    /* ---------- rendu ---------- */
    function draw(){
      if (!W){ resize(); return; }
      setScale(); setBasis();
      const night = document.documentElement.getAttribute("data-theme")==="night";
      const inkC=css("--ink","#e8ecf5"), lineC=css("--line","#26314f"),
            faintC=css("--faint","#566079"), accentC=css("--accent","#f4c15d"),
            acc2=css("--accent-2","#6ea8ff");
      const Ast=A();
      let lstDeg;
      try { lstDeg = norm360(Ast.SiderealTime(st.date)*15 + st.lon); }
      catch(e){ lstDeg = norm360((st.date.getUTCHours()+st.date.getUTCMinutes()/60)*15 + st.lon); }
      cosL=Math.cos(lstDeg*DEG); sinL=Math.sin(lstDeg*DEG);
      cosF=Math.cos(st.lat*DEG); sinF=Math.sin(st.lat*DEG);

      // Soleil d'abord : il commande la couleur du ciel
      let obs=null;
      try { obs = new Ast.Observer(st.lat, st.lon, 0); } catch(e){}
      sunHor = null;
      if (obs){ try { const eq=Ast.Equator("Sun",st.date,obs,true,true); sunHor=toHor(eqv(eq.ra*15,eq.dec)); } catch(e){} }
      const day = dayFactor();
      const atmo = st.layers.atmosphere && !night;
      const t = atmo ? day.twilight : 0, br = atmo ? day.bright : 0;

      // fond du ciel
      const zen = mix(mix([5,7,15],[26,54,105],t), [47,116,200], br);
      const hor = mix(mix([11,19,48],[150,86,54],t*0.9), [200,222,245], br);
      ctx.clearRect(0,0,W,H);
      if (night){ ctx.fillStyle="#0a0000"; ctx.fillRect(0,0,W,H); }
      else {
        const g=ctx.createLinearGradient(0,0,0,H);
        g.addColorStop(0, rgb(zen)); g.addColorStop(1, rgb(hor));
        ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
      }
      // halo du Soleil
      if (atmo && sunHor && day.alt > -10){
        const sp = projHor(sunHor);
        if (onScreen(sp)){
          const rad = half*(0.9+br);
          const g2 = ctx.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,rad);
          const a0 = clamp((day.alt+10)/16,0,1);
          g2.addColorStop(0, `rgba(255,232,180,${0.55*a0})`);
          g2.addColorStop(.4, `rgba(255,190,110,${0.20*a0})`);
          g2.addColorStop(1, "rgba(255,180,90,0)");
          ctx.fillStyle=g2; ctx.fillRect(0,0,W,H);
        }
      }

      const starFade = 1 - t*0.97;   // les étoiles s'effacent au lever du jour
      hits = [];

      // étoiles
      if (st.layers.stars && starFade > 0.02){
        for (let i=0;i<STARS.length;i++){
          const s=STARS[i], h=toHor(s.v);
          if (h[2] <= 0) continue;
          const p=projHor(h); if(!onScreen(p)) continue;
          const size = Math.max(0.5, (6.6-s.mag)*0.42 * (st.proj==="stereo" ? clamp(90/st.fov,1,2.6) : 1));
          ctx.beginPath(); ctx.fillStyle = starColor(s.bv, night);
          ctx.globalAlpha = Math.min(1, .35 + (6.5-s.mag)/6.5) * starFade;
          ctx.arc(p.x,p.y,size,0,7.0); ctx.fill();
        }
        ctx.globalAlpha=1;
      }

      // grille alt/az
      if (st.layers.grid){
        ctx.strokeStyle=lineC; ctx.globalAlpha=.55; ctx.lineWidth=1;
        for (let a=0;a<360;a+=30) curve(alt=>projAltAz(alt,a), 0, 88, 30);
        for (let alt=0;alt<=60;alt+=30) curve(az=>projAltAz(alt,az), 0, 360, 120);
        ctx.globalAlpha=1;
      }

      // constellations
      if (st.layers.constellations){
        ctx.lineWidth=1.1;
        CONSTS.forEach(c=>{
          const sel = st.selected && st.selected.kind==="const" && st.selected.d===c.d;
          ctx.strokeStyle = sel ? accentC : (night?"#8a1f16":acc2);
          ctx.globalAlpha = (sel?.95:.38) * (1 - t*0.85);
          const segs=[];
          c.segs.forEach(seg=>{
            let prev=null;
            for (let k=0;k<seg.length;k++){
              const h=toHor(seg[k]);
              const p = h[2]>=0 ? projHor(h) : null;
              if (prev && p){ ctx.beginPath(); ctx.moveTo(prev.x,prev.y); ctx.lineTo(p.x,p.y); ctx.stroke(); segs.push([prev,p]); }
              prev=p;
            }
          });
          const lh=toHor(c.lab);
          let lp=null;
          if (lh[2]>=0){
            lp=projHor(lh);
            if (st.layers.labels && onScreen(lp) && starFade>0.2){
              ctx.globalAlpha=.85*starFade; ctx.fillStyle= sel?accentC:faintC;
              ctx.font="600 11px 'Space Mono',monospace"; ctx.textAlign="center";
              ctx.fillText(lang()==="en"?c.la:c.fr, lp.x, lp.y);
            }
          }
          if (segs.length) hits.push({kind:"const", c, segs, label:lp});
        });
        ctx.globalAlpha=1;
      }

      // NGC / IC — seuil de magnitude selon le champ de vue
      if (st.layers.dso && DSO.length){
        const magLim = st.proj==="stereo"
          ? (st.fov>120?8 : st.fov>60?9.5 : st.fov>25?11 : 12)
          : (st.zoomS<1.5?8 : st.zoomS<2.5?9.5 : st.zoomS<4?11 : 12);
        DSO.forEach(d0=>{
          const o=d0.o;
          if (o[4]!=null && o[4]>magLim) return;
          const h=toHor(d0.v); if(h[2]<0) return;
          const p=projHor(h); if(!onScreen(p)) return;
          const sel = st.selected && st.selected.kind==="dso" && st.selected.name===o[0];
          ctx.strokeStyle = night?"#b43a2e":(DSO_COLOR[o[3]]||"#9aa4bd");
          ctx.lineWidth=sel?2:1; ctx.globalAlpha=(sel?1:.8)*starFade;
          const rr=sel?6:2.6;
          ctx.beginPath();
          if (o[3]==="GX") ctx.ellipse(p.x,p.y,rr*1.5,rr*0.8,0,0,7.0); else ctx.arc(p.x,p.y,rr,0,7.0);
          ctx.stroke();
          hits.push({kind:"dso", o, p});
          if ((sel || (o[6] && zoomedIn())) && st.layers.labels){
            ctx.fillStyle=sel?accentC:faintC; ctx.font="500 10px 'Space Mono',monospace"; ctx.textAlign="left";
            ctx.fillText(o[0], p.x+7, p.y-5);
          }
          ctx.globalAlpha=1;
        });
      }

      // Messier
      if (st.layers.messier){
        MESSIER.forEach(d0=>{
          const m=d0.m, h=toHor(d0.v); if(h[2]<0) return;
          const p=projHor(h); if(!onScreen(p)) return;
          const sel = st.selected && st.selected.kind==="messier" && st.selected.name===m[0];
          ctx.strokeStyle=sel?accentC:"#f4c15d"; ctx.fillStyle="rgba(244,193,93,.18)";
          ctx.lineWidth=sel?2:1.2; ctx.globalAlpha=starFade;
          ctx.beginPath(); ctx.arc(p.x,p.y,sel?7:4.5,0,7.0); ctx.fill(); ctx.stroke();
          hits.push({kind:"messier", m, p});
          if ((sel || zoomedIn()) && st.layers.labels){
            ctx.fillStyle=sel?accentC:"#f4c15d"; ctx.font="600 11px 'Space Mono',monospace"; ctx.textAlign="left";
            ctx.fillText(m[0], p.x+8, p.y-6);
          }
          ctx.globalAlpha=1;
        });
      }

      // planètes, Soleil, Lune
      if (st.layers.planets && obs){
        let sunP=null;
        if (sunHor) sunP = projHor(sunHor);
        PLANETS.forEach(pl=>{
          let eq; try{ eq=Ast.Equator(pl[0], st.date, obs, true, true); }catch(e){ return; }
          const h=toHor(eqv(eq.ra*15, eq.dec)); if(h[2]<0) return;
          const p=projHor(h); if(!onScreen(p)) return;
          const key=pl[0];
          const rr = key==="Sun"||key==="Moon" ? Math.max(5, half*0.012*clamp(60/st.fov,1,4)) : 3.4;
          if (key==="Moon") drawMoon(p, rr, sunP, night);
          else {
            ctx.beginPath(); ctx.fillStyle=night?"#ff5a49":pl[2]; ctx.globalAlpha=1;
            ctx.arc(p.x,p.y,rr,0,7.0); ctx.fill();
            if (key==="Sun"){ ctx.strokeStyle=pl[2]; ctx.globalAlpha=.5; ctx.lineWidth=1.5;
              ctx.beginPath(); ctx.arc(p.x,p.y,rr+4,0,7.0); ctx.stroke(); ctx.globalAlpha=1; }
          }
          if (st.layers.labels){
            ctx.fillStyle=night?"#ff5a49":inkC; ctx.font="600 11px 'Space Mono',monospace"; ctx.textAlign="left";
            ctx.globalAlpha=.9; ctx.fillText(pl[1][lang()], p.x+rr+4, p.y+3); ctx.globalAlpha=1;
          }
          hits.push({kind:"planet", pl, p, eq});
        });
      }

      if (st.layers.ground) drawGround(night, t, br);
      drawHorizon(night, inkC, accentC, faintC);
      if (st.selected) drawReticle(accentC);

      onView({ fov:st.fov, az:st.az, alt:st.alt, date:new Date(st.date), proj:st.proj,
               playing:st.playing, rate:st.rate, sunAlt: sunHor?altOf(sunHor):null });
    }
    const zoomedIn = () => st.proj==="stereo" ? st.fov<45 : st.zoomS>=2.2;

    // trace une courbe en échantillonnant (les droites deviennent des arcs en projection)
    function curve(fn, a, b, steps){
      let prev=null; ctx.beginPath();
      for (let i=0;i<=steps;i++){
        const p=fn(a+(b-a)*i/steps);
        if (p && prev){ ctx.moveTo(prev.x,prev.y); ctx.lineTo(p.x,p.y); }
        prev=p;
      }
      ctx.stroke();
    }

    /* Sol : l'horizon est un grand cercle. En projection stéréographique il
       devient exactement un cercle de centre (0, 2·cot(alt)) et de rayon
       2/|sin(alt)| (unités projetées) — et une droite quand on vise l'horizon.
       Le centre de l'écran est toujours à l'intérieur de ce cercle : si l'on
       regarde vers le haut, le sol est donc l'extérieur. */
    function drawGround(night, t, br){
      const soil = night ? "#140000" : rgb(mix([9,11,18],[38,32,28],clamp(t+br,0,1)));
      ctx.save();
      ctx.beginPath();
      if (st.proj === "stereo"){
        const s=Math.sin(st.alt*DEG);
        if (Math.abs(s) < 1e-4){                       // regard dans l'axe de l'horizon
          ctx.rect(-10, cy, W+20, H-cy+10);
          ctx.fillStyle=soil; ctx.fill();
          ctx.restore(); return;
        }
        const yc = cy - (2*Math.cos(st.alt*DEG)/s)*scale;
        const r  = (2/Math.abs(s))*scale;
        if (st.alt > 0){                               // sol = extérieur du cercle
          ctx.rect(0,0,W,H);
          ctx.arc(cx,yc,r,0,7.0,true);                 // trou, sens inverse
          ctx.fillStyle=soil; ctx.fill("evenodd");
        } else {                                       // on regarde vers le bas
          ctx.arc(cx,yc,r,0,7.0);
          ctx.fillStyle=soil; ctx.fill();
        }
      } else {
        const c={x:cx+st.panX, y:cy+st.panY}, r=(90*DEG)*scale*st.zoomS;
        ctx.rect(0,0,W,H); ctx.arc(c.x,c.y,r,0,7.0,true);
        ctx.fillStyle=soil; ctx.fill("evenodd");
      }
      ctx.restore();
    }

    function drawHorizon(night, inkC, accentC, faintC){
      // ligne d'horizon
      ctx.strokeStyle = night?"#ff5a49":inkC; ctx.globalAlpha=.8; ctx.lineWidth=1.5;
      curve(az=>projAltAz(0,az), 0, 360, 180);
      ctx.globalAlpha=1;
      if (!st.layers.cardinals) return;
      const card = lang()==="en"
        ? [["N",0],["NE",45],["E",90],["SE",135],["S",180],["SW",225],["W",270],["NW",315]]
        : [["N",0],["NE",45],["E",90],["SE",135],["S",180],["SO",225],["O",270],["NO",315]];
      ctx.font="700 13px 'Space Mono',monospace"; ctx.textAlign="center";
      card.forEach(([lbl,az])=>{
        const p=projAltAz(st.proj==="stereo"?0:0, az);
        if(!p) return;
        let x=p.x, y=p.y;
        if (st.proj==="fisheye"){ const q=projAltAz(-6,az); if(q){ x=q.x; y=q.y; } }
        if (x<-20||x>W+20||y<-20||y>H+20) return;
        ctx.fillStyle = az===0 ? accentC : (az%90===0 ? (night?"#ff5a49":inkC) : faintC);
        ctx.fillText(lbl, x, y + (st.proj==="stereo"?16:4));
      });
    }

    // Lune avec sa phase : le limbe éclairé est tourné vers le Soleil
    function drawMoon(p, r, sunP, night){
      let k=0.5, ang=0;
      try { k = A().Illumination("Moon", st.date).phase_fraction; } catch(e){}
      if (sunP) ang = Math.atan2(sunP.y-p.y, sunP.x-p.x);
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(ang);
      ctx.fillStyle = night ? "#5a0f0a" : "#2b3346";           // partie sombre
      ctx.beginPath(); ctx.arc(0,0,r,0,7.0); ctx.fill();
      ctx.fillStyle = night ? "#ff5a49" : "#dfe4ee";           // partie éclairée
      ctx.beginPath();
      ctx.arc(0,0,r,-Math.PI/2,Math.PI/2);                     // demi-disque côté Soleil
      const rx = r*(2*k-1);                                    // terminateur : demi-ellipse
      ctx.ellipse(0,0,Math.abs(rx),r,0, Math.PI/2, -Math.PI/2, rx>=0);
      ctx.fill();
      ctx.strokeStyle = night?"#ff5a49":"#7d879e"; ctx.globalAlpha=.6; ctx.lineWidth=.8;
      ctx.beginPath(); ctx.arc(0,0,r,0,7.0); ctx.stroke(); ctx.globalAlpha=1;
      ctx.restore();
    }

    function drawReticle(accentC){
      const p = selScreen();
      if (!onScreen(p)) return;
      ctx.strokeStyle=accentC; ctx.lineWidth=1.4; ctx.globalAlpha=.9;
      const r=13, g=5;
      [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{
        ctx.beginPath();
        ctx.moveTo(p.x+sx*r, p.y+sy*g); ctx.lineTo(p.x+sx*r, p.y+sy*r); ctx.lineTo(p.x+sx*g, p.y+sy*r);
        ctx.stroke();
      });
      ctx.globalAlpha=1;
    }
    function selScreen(){
      const s=st.selected; if(!s) return null;
      let v=null;
      if (s.kind==="messier"){ const e=MESSIER.find(x=>x.m[0]===s.name); v=e&&e.v; }
      else if (s.kind==="dso"){ const e=DSO.find(x=>x.o[0]===s.name); v=e&&e.v; }
      else if (s.kind==="const"){ const e=CONSTS.find(x=>x.d===s.d); v=e&&e.lab; }
      else if (s.kind==="planet"){ const h0=hits.find(x=>x.kind==="planet"&&x.pl[0]===s.key); return h0?h0.p:null; }
      if (!v) return null;
      const h=toHor(v); if(h[2]<0) return null;
      return projHor(h);
    }

    /* ---------- sélection ---------- */
    function segDist(px,py,x1,y1,x2,y2){
      const dx=x2-x1, dy=y2-y1, l2=dx*dx+dy*dy;
      let t=l2?((px-x1)*dx+(py-y1)*dy)/l2:0; t=clamp(t,0,1);
      return Math.hypot(px-(x1+t*dx), py-(y1+t*dy));
    }
    function pick(mx,my){
      let best=null, bd=18;
      hits.forEach(h=>{
        if (h.kind==="const") return;
        const d=Math.hypot(h.p.x-mx,h.p.y-my);
        if (d<bd){ bd=d; best=h; }
      });
      if (best) return best;
      let bc=null, bcd=12;
      hits.filter(h=>h.kind==="const").forEach(h=>{
        let md=1e9;
        h.segs.forEach(([a,b])=>{ md=Math.min(md, segDist(mx,my,a.x,a.y,b.x,b.y)); });
        if (h.label) md=Math.min(md, Math.hypot(h.label.x-mx,h.label.y-my));
        if (md<bcd){ bcd=md; bc=h; }
      });
      return bc;
    }
    // infos de position, comme le panneau de Stellarium
    function posInfo(v){
      const h=toHor(v);
      const alt=altOf(h), az=azOf(h);
      const dec=Math.asin(clamp(v[2],-1,1))*R2D;
      const ra=norm360(Math.atan2(v[1],v[0])*R2D);
      const culm = 90 - Math.abs(st.lat - dec);
      const circumpolar = (st.lat>=0 ? dec > 90-st.lat : dec < -90-st.lat);
      const never = (st.lat>=0 ? dec < st.lat-90 : dec > st.lat+90);
      let cons=null; try{ cons=A().Constellation(ra/15, dec).symbol; }catch(e){}
      return { alt, az, ra, dec, culm: Math.min(culm,90), circumpolar, never, cons };
    }
    // Construit la charge utile transmise à onSelect pour une sélection donnée.
    // NB : « alt » = hauteur au-dessus de l'horizon ; le nom usuel est « alt2 »
    // (le catalogue Messier appelle ce champ « alt », d'où la précaution).
    function payloadFor(sel){
      if (!sel) return null;
      if (sel.kind==="messier"){
        const e=MESSIER.find(x=>x.m[0]===sel.name); if(!e) return null; const m=e.m;
        return Object.assign({kind:"messier",name:m[0],type:m[3],mag:m[4],alt2:m[5],dim:m[6],morph:m[7],ngc:m[8]}, posInfo(e.v));
      }
      if (sel.kind==="dso"){
        const e=DSO.find(x=>x.o[0]===sel.name); if(!e) return null; const o=e.o;
        return Object.assign({kind:"dso",name:o[0],type:o[3],mag:o[4],dim:o[5],fr:o[6]||"",en:o[7]||""}, posInfo(e.v));
      }
      if (sel.kind==="const"){
        const c=CONSTS.find(x=>x.d===sel.d); if(!c) return null;
        return {kind:"const",d:c.d,la:c.la,en:c.en,fr:c.fr,gen:c.gen};
      }
      if (sel.kind==="planet"){
        const h0=hits.find(x=>x.kind==="planet"&&x.pl[0]===sel.key);
        if (!h0) return {kind:"planet",key:sel.key};
        return Object.assign({kind:"planet",key:h0.pl[0],name:h0.pl[1]}, posInfo(eqv(h0.eq.ra*15,h0.eq.dec)));
      }
      return null;
    }
    function emit(h){
      if (!h){ st.selected=null; draw(); onSelect(null); return; }
      const sel = h.kind==="messier" ? {kind:"messier",name:h.m[0]}
                : h.kind==="dso"     ? {kind:"dso",name:h.o[0]}
                : h.kind==="const"   ? {kind:"const",d:h.c.d}
                :                      {kind:"planet",key:h.pl[0]};
      st.selected=sel;
      const p=payloadFor(sel);
      draw();
      onSelect(p);
    }

    /* ---------- interaction ---------- */
    function lookBy(daz, dalt){
      st.az = norm360(st.az + daz);
      st.alt = clamp(st.alt + dalt, -85, 85);
      draw();
    }
    function setFov(f, mx, my){
      const f2 = clamp(f, FOV_MIN, FOV_MAX);
      if (st.proj !== "stereo"){                 // tout-le-ciel : loupe à l'écran
        const z0=st.zoomS, z1=clamp(180/f2, 1, 10);
        if (z1===z0) return;
        const px = mx!=null?mx:cx, py = my!=null?my:cy;
        st.panX = px - (px - st.panX - cx)*(z1/z0) - cx;
        st.panY = py - (py - st.panY - cy)*(z1/z0) - cy;
        st.zoomS = z1;
        if (z1===1){ st.panX=0; st.panY=0; }
        const lim=half*st.zoomS; st.panX=clamp(st.panX,-lim,lim); st.panY=clamp(st.panY,-lim,lim);
        draw(); return;
      }
      // vue horizon : on garde le point sous le curseur immobile
      let keep=null;
      if (mx!=null && my!=null) keep = unproj(mx,my);
      st.fov = f2; setScale(); setBasis();
      if (keep){
        const now = unproj(mx,my);
        if (now){
          st.az = norm360(st.az + (keep.az - now.az));
          st.alt = clamp(st.alt + (keep.alt - now.alt), -85, 85);
        }
      }
      draw();
    }

    const rel = ev => { const r=canvas.getBoundingClientRect();
      return { x:(ev.clientX??0)-r.left, y:(ev.clientY??0)-r.top }; };
    let drag=null, moved=0, pinch=null;
    const tDist = ev => { const a=ev.touches[0],b=ev.touches[1]; return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); };
    const tMid = ev => { const a=ev.touches[0],b=ev.touches[1],r=canvas.getBoundingClientRect();
      return { x:(a.clientX+b.clientX)/2-r.left, y:(a.clientY+b.clientY)/2-r.top }; };

    function down(ev){
      if (ev.touches && ev.touches.length===2){ pinch={d:tDist(ev), f:st.fov, z:st.zoomS}; drag=null; return; }
      const t = ev.touches ? ev.touches[0] : ev;
      drag = { x:t.clientX, y:t.clientY, az:st.az, alt:st.alt, px:st.panX, py:st.panY }; moved=0;
    }
    function move(ev){
      if (pinch && ev.touches && ev.touches.length===2){
        ev.preventDefault();
        const c=tMid(ev), ratio=tDist(ev)/pinch.d;
        setFov(st.proj==="stereo" ? pinch.f/ratio : 180/clamp(pinch.z*ratio,1,10), c.x, c.y);
        return;
      }
      if (!drag) return;
      const t = ev.touches ? ev.touches[0] : ev;
      const dx=t.clientX-drag.x, dy=t.clientY-drag.y;
      moved = Math.max(moved, Math.hypot(dx,dy));
      if (moved<3) return;
      if (ev.touches) ev.preventDefault();
      if (st.proj==="stereo"){
        // le ciel suit le doigt : ~1 px = fov/largeur degrés
        const k = st.fov/W;
        st.az = norm360(drag.az - dx*k/Math.max(Math.cos(st.alt*DEG),0.25));
        st.alt = clamp(drag.alt + dy*k, -85, 85);
      } else {
        st.panX = drag.px+dx; st.panY = drag.py+dy;
        const lim=half*st.zoomS; st.panX=clamp(st.panX,-lim,lim); st.panY=clamp(st.panY,-lim,lim);
      }
      draw();
    }
    function up(ev){
      pinch=null;
      if (drag && moved<5){
        const t=(ev.changedTouches&&ev.changedTouches[0])||ev;
        const r=canvas.getBoundingClientRect();
        emit(pick(t.clientX-r.left, t.clientY-r.top));
      }
      drag=null;
    }
    function wheel(ev){ ev.preventDefault(); const p=rel(ev);
      setFov(st.proj==="stereo" ? st.fov*(ev.deltaY<0?1/1.2:1.2) : 180/(st.zoomS*(ev.deltaY<0?1.2:1/1.2)), p.x, p.y); }
    function key(ev){
      if (ev.target && /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName)) return;
      const step = st.fov/12;
      const k=ev.key;
      if (k==="ArrowLeft")  { lookBy(-step,0); ev.preventDefault(); }
      else if (k==="ArrowRight"){ lookBy(step,0); ev.preventDefault(); }
      else if (k==="ArrowUp")   { lookBy(0,step); ev.preventDefault(); }
      else if (k==="ArrowDown") { lookBy(0,-step); ev.preventDefault(); }
      else if (k==="+"||k==="="){ setFov(st.fov/1.3); }
      else if (k==="-"||k==="_"){ setFov(st.fov*1.3); }
      else if (k===" ")         { const p=selScreen(); if(p){ api.centerSelected(); ev.preventDefault(); } }
    }

    if (interactive){
      canvas.style.cursor="grab"; canvas.style.touchAction="none"; canvas.tabIndex=0;
      canvas.addEventListener("mousedown", e=>{ canvas.style.cursor="grabbing"; down(e); });
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", e=>{ canvas.style.cursor="grab"; up(e); });
      canvas.addEventListener("wheel", wheel, {passive:false});
      canvas.addEventListener("touchstart", down, {passive:false});
      canvas.addEventListener("touchmove", move, {passive:false});
      canvas.addEventListener("touchend", up);
      window.addEventListener("keydown", key);
    } else {
      canvas.addEventListener("click", e=>{ const p=rel(e); emit(pick(p.x,p.y)); });
    }

    /* ---------- écoulement du temps ---------- */
    let raf=null, last=0;
    function tick(ts){
      if (!st.playing){ raf=null; return; }
      if (!last) last=ts;
      const dt=(ts-last)/1000; last=ts;
      st.date = new Date(st.date.getTime() + dt*1000*st.rate);
      draw();
      raf=requestAnimationFrame(tick);
    }
    function play(on){
      st.playing=on; last=0;
      if (on && !raf) raf=requestAnimationFrame(tick);
      if (!on && raf){ cancelAnimationFrame(raf); raf=null; }
      draw();
    }

    const api = {
      redraw: draw, resize,
      setDate(d){ st.date=new Date(d); draw(); },
      setNow(){ st.date=new Date(); draw(); },
      setLocation(lat,lon,name){ st.lat=lat; st.lon=lon; if(name)st.name=name; draw(); },
      setLayer(k,v){ st.layers[k]=v; draw(); },
      getState(){ return { lat:st.lat, lon:st.lon, name:st.name, date:new Date(st.date),
        fov:st.fov, az:st.az, alt:st.alt, proj:st.proj, playing:st.playing, rate:st.rate, zoom:st.zoomS }; },
      /* select(sel) surligne l'objet ; select(sel, true) prévient aussi onSelect
         (c'est ce dont la recherche a besoin pour afficher la fiche). */
      select(sel, report){ st.selected=sel; const p=report?payloadFor(sel):null; draw(); if(report) onSelect(p); return p; },
      lookAt(az,alt,fov){ st.az=norm360(az); st.alt=clamp(alt,-85,85); if(fov) st.fov=clamp(fov,FOV_MIN,FOV_MAX); draw(); },
      setFov(f){ setFov(f); },
      zoomIn(){ setFov(st.proj==="stereo"? st.fov/1.5 : 180/clamp(st.zoomS*1.5,1,10)); },
      zoomOut(){ setFov(st.proj==="stereo"? st.fov*1.5 : 180/clamp(st.zoomS/1.5,1,10)); },
      resetView(){ if(st.proj==="stereo"){ st.az=180; st.alt=20; st.fov=90; } else { st.zoomS=1; st.panX=0; st.panY=0; } draw(); },
      setProjection(p){
        st.proj = p==="allsky"||p==="fisheye" ? "fisheye" : "stereo";
        if (st.proj==="fisheye"){ st.az=180; st.alt=90; st.fov=180; st.zoomS=1; st.panX=0; st.panY=0; }
        else { st.az=180; st.alt=20; st.fov=90; }
        draw();
      },
      /* pointe un objet (RA/Dec en degrés) ; false s'il est sous l'horizon */
      centerOn(raDeg, decDeg, fov){
        const h=toHor(eqv(raDeg,decDeg));
        if (h[2] < 0) return false;
        if (st.proj==="stereo"){
          st.az=azOf(h); st.alt=clamp(altOf(h),-85,85);
          if (fov) st.fov=clamp(fov,FOV_MIN,FOV_MAX);
        } else {
          const p0=(()=>{ const th=Math.acos(clamp(h[0]*Fv[0]+h[1]*Fv[1]+h[2]*Fv[2],-1,1)); return th; })();
          st.zoomS = fov ? clamp(180/fov,1,10) : st.zoomS;
          const x=h[0]*Rv[0]+h[1]*Rv[1]+h[2]*Rv[2], y=h[0]*Uv[0]+h[1]*Uv[1]+h[2]*Uv[2];
          const s=Math.hypot(x,y), r=p0*scale;
          const bx = s<1e-9?cx:cx+(x/s)*r, by = s<1e-9?cy:cy-(y/s)*r;
          st.panX = cx-((bx-cx)*st.zoomS+cx); st.panY = cy-((by-cy)*st.zoomS+cy);
        }
        draw(); return true;
      },
      centerSelected(){ const s=st.selected; if(!s) return false;
        let v=null;
        if (s.kind==="messier"){ const e=MESSIER.find(x=>x.m[0]===s.name); v=e&&e.v; }
        else if (s.kind==="dso"){ const e=DSO.find(x=>x.o[0]===s.name); v=e&&e.v; }
        else if (s.kind==="const"){ const e=CONSTS.find(x=>x.d===s.d); v=e&&e.lab; }
        if (!v) return false;
        const h=toHor(v); if(h[2]<0) return false;
        if (st.proj==="stereo"){ st.az=azOf(h); st.alt=clamp(altOf(h),-85,85); draw(); return true; }
        return false;
      },
      play, pause(){ play(false); },
      setRate(r){ st.rate=r; draw(); },
      live(on){ st.rate=1; play(!!on); },
      destroy(){ if(raf)cancelAnimationFrame(raf);
        window.removeEventListener("resize",resize); window.removeEventListener("mousemove",move);
        window.removeEventListener("mouseup",up); window.removeEventListener("keydown",key);
        document.removeEventListener("despina:lang",draw); }
    };
    window.addEventListener("resize", resize);
    document.addEventListener("despina:lang", draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(()=>draw());
    resize();
    return api;
  };
})();
