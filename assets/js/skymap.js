/* Despina — carte du ciel vectorielle (façon Stellarium)
   Vue tout-le-ciel : zénith au centre, horizon = cercle, Nord en haut.
   Alt/az calculés localement ; astronomy-engine fournit temps sidéral + planètes.
   API : const sm = Despina.SkyMap(canvas, opts); sm.setDate(), setLocation(), setLayer()... */
(function () {
  const D = window.Despina = window.Despina || {};
  const A = () => window.Astronomy;
  const DEG = Math.PI / 180, R2D = 180 / Math.PI;

  function css(v, fb){ try{ const c=getComputedStyle(document.documentElement).getPropertyValue(v).trim(); return c||fb; }catch(e){ return fb; } }
  const norm360 = a => ((a % 360) + 360) % 360;

  // couleur d'étoile depuis l'indice B–V
  function starColor(bv, night){
    if (night) return "#ff5a49";
    if (bv < 0.0) return "#a9c7ff";
    if (bv < 0.3) return "#cfe0ff";
    if (bv < 0.6) return "#ffffff";
    if (bv < 0.9) return "#fff2cc";
    if (bv < 1.3) return "#ffd9a0";
    return "#ff9b6b";
  }

  D.SkyMap = function (canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const data = opts.data;
    const state = {
      lat: opts.location?.lat ?? 48.8566,
      lon: opts.location?.lon ?? 2.3522,
      name: opts.location?.name ?? "Paris",
      date: opts.date ? new Date(opts.date) : new Date(),
      layers: Object.assign({ stars:true, constellations:true, labels:true, messier:true, planets:true, grid:true }, opts.layers||{}),
      selected: null
    };
    const lang = () => (D.getLang ? D.getLang() : "fr");
    const onSelect = opts.onSelect || function(){};

    // pré-calcul étoiles (rad)
    const S = data.stars.map(s => ({ ra:s[0]*DEG, dec:s[1]*DEG, mag:s[2], bv:s[3] }));
    const PLANETS = [
      ["Sun",{fr:"Soleil",en:"Sun"},"#ffcf5e",5],
      ["Moon",{fr:"Lune",en:"Moon"},"#dfe4ee",5],
      ["Mercury",{fr:"Mercure",en:"Mercury"},"#a9a29b",3],
      ["Venus",{fr:"Vénus",en:"Venus"},"#f0d9a0",4],
      ["Mars",{fr:"Mars",en:"Mars"},"#e0653f",3.5],
      ["Jupiter",{fr:"Jupiter",en:"Jupiter"},"#e6c79a",4],
      ["Saturn",{fr:"Saturne",en:"Saturn"},"#e6d29a",3.6]
    ];

    let W, H, cx, cy, R, dpr;
    let hitMessier = [], hitConst = [], hitPlanet = [];

    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W*dpr; canvas.height = H*dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
      R = Math.min(W,H)/2 - 22;
      cx = W/2; cy = H/2;
      draw();
    }

    // équatorial (deg) -> horizontal (deg) ; N=0 E=90
    function altaz(raDeg, decDeg, lstDeg, latRad){
      const H0 = (lstDeg - raDeg) * DEG;
      const dec = decDeg * DEG;
      const sinAlt = Math.sin(dec)*Math.sin(latRad) + Math.cos(dec)*Math.cos(latRad)*Math.cos(H0);
      const alt = Math.asin(Math.max(-1,Math.min(1,sinAlt)));
      const cosAlt = Math.cos(alt);
      let az;
      if (cosAlt < 1e-6) az = 0;
      else {
        let cosA = (Math.sin(dec) - Math.sin(alt)*Math.sin(latRad)) / (cosAlt*Math.cos(latRad));
        cosA = Math.max(-1,Math.min(1,cosA));
        az = Math.acos(cosA);
        if (Math.sin(H0) > 0) az = 2*Math.PI - az;
      }
      return { alt: alt*R2D, az: az*R2D };
    }
    // horizontal -> écran (N haut, E gauche, zénith centre)
    function project(alt, az){
      if (alt < 0) return null;
      const r = R * (90 - alt) / 90;
      const a = az * DEG;
      return { x: cx - r*Math.sin(a), y: cy - r*Math.cos(a) };
    }

    function frame(){
      const Ast = A();
      let lstDeg;
      try { lstDeg = norm360(Ast.SiderealTime(state.date)*15 + state.lon); }
      catch(e){ lstDeg = norm360((state.date.getUTCHours()+state.date.getUTCMinutes()/60)*15 + state.lon); }
      return { lstDeg, latRad: state.lat*DEG };
    }

    function draw(){
      if (!W) { resize(); return; }
      const night = document.documentElement.getAttribute("data-theme")==="night";
      const inkC = css("--ink","#e8ecf5"), lineC = css("--line","#26314f"),
            faintC = css("--faint","#566079"), accentC = css("--accent","#f4c15d"),
            acc2 = css("--accent-2","#6ea8ff"), bgC = css("--surface","#131a2e");
      const { lstDeg, latRad } = frame();
      ctx.clearRect(0,0,W,H);

      // sol (hors horizon)
      ctx.fillStyle = css("--bg-2","#0d1324");
      ctx.fillRect(0,0,W,H);
      // disque ciel
      ctx.save();
      ctx.beginPath(); ctx.arc(cx,cy,R,0,7.0); ctx.clip();
      const g = ctx.createRadialGradient(cx,cy-R*0.2,R*0.1,cx,cy,R);
      g.addColorStop(0, night?"#180000":"#0b1330"); g.addColorStop(1, night?"#0a0000":"#05070f");
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

      // grille
      if (state.layers.grid){
        ctx.strokeStyle = lineC; ctx.lineWidth = 1; ctx.globalAlpha = .6;
        [30,60].forEach(a=>{ const rr=R*(90-a)/90; ctx.beginPath(); ctx.arc(cx,cy,rr,0,7.0); ctx.stroke(); });
        for (let az=0; az<360; az+=30){ const p=project(0.01,az); ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(p.x,p.y); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }

      // étoiles
      if (state.layers.stars){
        for (let i=0;i<S.length;i++){
          const s=S[i];
          const aa=altaz(s.ra*R2D, s.dec*R2D, lstDeg, latRad);
          if (aa.alt<0) continue;
          const p=project(aa.alt, aa.az); if(!p) continue;
          const size = Math.max(0.5, (6.6 - s.mag) * 0.42);
          ctx.beginPath(); ctx.fillStyle = starColor(s.bv, night);
          ctx.globalAlpha = Math.min(1, .35 + (6.5 - s.mag)/6.5);
          ctx.arc(p.x,p.y,size,0,7.0); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // constellations
      hitConst = [];
      if (state.layers.constellations){
        ctx.lineWidth = 1.1;
        data.consts.forEach(c=>{
          const sel = state.selected && state.selected.kind==="const" && state.selected.d===c.d;
          ctx.strokeStyle = sel ? accentC : (night? "#8a1f16" : acc2);
          ctx.globalAlpha = sel ? .95 : .38;
          const segsScreen=[];
          c.lines.forEach(seg=>{
            let prev=null;
            for (let k=0;k<seg.length;k++){
              const aa=altaz(seg[k][0], seg[k][1], lstDeg, latRad);
              const p = aa.alt>=0 ? project(aa.alt,aa.az) : null;
              if (prev && p){ ctx.beginPath(); ctx.moveTo(prev.x,prev.y); ctx.lineTo(p.x,p.y); ctx.stroke(); segsScreen.push([prev,p]); }
              prev = p;
            }
          });
          // label + hit
          const aa=altaz(c.pt[0], c.pt[1], lstDeg, latRad);
          if (aa.alt>=0){
            const lp=project(aa.alt,aa.az);
            if (state.layers.labels){
              ctx.globalAlpha=.9; ctx.fillStyle = sel?accentC:faintC;
              ctx.font = "600 11px 'Space Mono', monospace"; ctx.textAlign="center";
              ctx.fillText(lang()==="en"?c.en:c.fr, lp.x, lp.y);
            }
            if (segsScreen.length) hitConst.push({c, segs:segsScreen, label:lp});
          } else if (segsScreen.length) hitConst.push({c, segs:segsScreen, label:null});
        });
        ctx.globalAlpha=1;
      }

      // Messier
      hitMessier = [];
      if (state.layers.messier){
        data.messier.forEach(m=>{
          const aa=altaz(m[1], m[2], lstDeg, latRad);
          if (aa.alt<0) return;
          const p=project(aa.alt,aa.az); if(!p) return;
          const sel = state.selected && state.selected.kind==="messier" && state.selected.name===m[0];
          ctx.strokeStyle = sel?accentC:"#f4c15d"; ctx.fillStyle="rgba(244,193,93,.18)"; ctx.lineWidth=sel?2:1.2;
          ctx.beginPath(); ctx.arc(p.x,p.y, sel?7:4.5, 0, 7.0); ctx.fill(); ctx.stroke();
          hitMessier.push({m, p});
          if (sel && state.layers.labels){ ctx.fillStyle=accentC; ctx.font="600 11px 'Space Mono',monospace"; ctx.textAlign="left"; ctx.fillText(m[0], p.x+8, p.y-6); }
        });
      }

      // planètes / Soleil / Lune
      hitPlanet = [];
      if (state.layers.planets){
        const Ast=A();
        const obs = (()=>{ try{ return new Ast.Observer(state.lat,state.lon,0);}catch(e){return null;} })();
        if (obs) PLANETS.forEach(pl=>{
          let eq; try{ eq = Ast.Equator(pl[0], state.date, obs, true, true); }catch(e){ return; }
          const aa=altaz(eq.ra*15, eq.dec, lstDeg, latRad);
          if (aa.alt<0) return;
          const p=project(aa.alt,aa.az); if(!p) return;
          ctx.beginPath(); ctx.fillStyle=pl[2]; ctx.globalAlpha=1;
          ctx.arc(p.x,p.y, pl[3], 0, 7.0); ctx.fill();
          if (pl[0]==="Sun"||pl[0]==="Moon"){ ctx.strokeStyle=pl[2]; ctx.globalAlpha=.5; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(p.x,p.y,pl[3]+3,0,7.0); ctx.stroke(); ctx.globalAlpha=1; }
          ctx.fillStyle=inkC; ctx.font="600 11px 'Space Mono',monospace"; ctx.textAlign="left";
          ctx.fillText(pl[1][lang()], p.x+pl[3]+3, p.y+3);
          hitPlanet.push({pl, p});
        });
      }
      ctx.restore();

      // horizon + cardinaux
      ctx.strokeStyle = night?"#ff5a49":inkC; ctx.globalAlpha=.85; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(cx,cy,R,0,7.0); ctx.stroke();
      // méridien N-S
      ctx.globalAlpha=.3; ctx.setLineDash([4,5]); ctx.beginPath(); ctx.moveTo(cx,cy-R); ctx.lineTo(cx,cy+R); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha=1;
      // zénith
      ctx.fillStyle=faintC; ctx.beginPath(); ctx.arc(cx,cy,2,0,7.0); ctx.fill();
      ctx.font="500 10px 'Space Mono',monospace"; ctx.textAlign="center"; ctx.fillStyle=faintC;
      ctx.fillText(lang()==="en"?"zenith":"zénith", cx, cy-8);
      // points cardinaux (N haut, E gauche, S bas, O droite)
      const card = lang()==="en"
        ? [["N",0],["E",90],["S",180],["W",270],["NE",45],["SE",135],["SW",225],["NW",315]]
        : [["N",0],["E",90],["S",180],["O",270],["NE",45],["SE",135],["SO",225],["NO",315]];
      ctx.font="700 13px 'Space Mono',monospace";
      card.forEach(([lbl,az],i)=>{
        const a=az*DEG, rr=R+13, x=cx-rr*Math.sin(a), y=cy-rr*Math.cos(a);
        ctx.fillStyle = (az%90===0)? (az===0?accentC:inkC) : faintC;
        ctx.fillText(lbl, x, y+4);
      });
    }

    // ---- interactions ----
    function pick(mx,my){
      // Messier
      let best=null, bd=16;
      hitMessier.forEach(h=>{ const d=Math.hypot(h.p.x-mx,h.p.y-my); if(d<bd){bd=d;best={kind:"messier",m:h.m};} });
      hitPlanet.forEach(h=>{ const d=Math.hypot(h.p.x-mx,h.p.y-my); if(d<bd){bd=d;best={kind:"planet",pl:h.pl};} });
      if (best) return best;
      // constellation : distance min à un segment
      let bc=null, bcd=12;
      hitConst.forEach(h=>{
        let md=1e9;
        h.segs.forEach(([a,b])=>{ md=Math.min(md, segDist(mx,my,a.x,a.y,b.x,b.y)); });
        if (md<bcd){ bcd=md; bc=h.c; }
      });
      if (bc) return {kind:"const", c:bc};
      return null;
    }
    function segDist(px,py,x1,y1,x2,y2){
      const dx=x2-x1, dy=y2-y1, l2=dx*dx+dy*dy;
      let t = l2? ((px-x1)*dx+(py-y1)*dy)/l2 : 0; t=Math.max(0,Math.min(1,t));
      return Math.hypot(px-(x1+t*dx), py-(y1+t*dy));
    }
    function onClick(ev){
      const rect=canvas.getBoundingClientRect();
      const mx=(ev.touches?ev.touches[0].clientX:ev.clientX)-rect.left;
      const my=(ev.touches?ev.touches[0].clientY:ev.clientY)-rect.top;
      const hit=pick(mx,my);
      if (!hit){ state.selected=null; draw(); onSelect(null); return; }
      if (hit.kind==="messier"){ const m=hit.m; state.selected={kind:"messier",name:m[0]}; onSelect({kind:"messier",name:m[0],ra:m[1],dec:m[2],type:m[3],mag:m[4],alt:m[5]}); }
      else if (hit.kind==="const"){ const c=hit.c; state.selected={kind:"const",d:c.d}; onSelect({kind:"const",d:c.d,en:c.en,fr:c.fr,gen:c.gen}); }
      else if (hit.kind==="planet"){ state.selected=null; onSelect({kind:"planet",key:hit.pl[0],name:hit.pl[1]}); }
      draw();
    }
    canvas.addEventListener("click", onClick);

    let liveTimer=null;
    const api = {
      redraw: draw, resize,
      setDate(d){ state.date=new Date(d); draw(); },
      setNow(){ state.date=new Date(); draw(); },
      setLocation(lat,lon,name){ state.lat=lat; state.lon=lon; if(name)state.name=name; draw(); },
      setLayer(k,v){ state.layers[k]=v; draw(); },
      getState(){ return { lat:state.lat, lon:state.lon, name:state.name, date:state.date }; },
      select(sel){ state.selected=sel; draw(); },
      live(on){ if(liveTimer){clearInterval(liveTimer);liveTimer=null;} if(on){ liveTimer=setInterval(()=>{ state.date=new Date(); draw(); },30000);} },
      destroy(){ if(liveTimer)clearInterval(liveTimer); canvas.removeEventListener("click",onClick); window.removeEventListener("resize",resize); document.removeEventListener("despina:lang",draw); }
    };
    window.addEventListener("resize", resize);
    document.addEventListener("despina:lang", draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
    resize();
    return api;
  };
})();
