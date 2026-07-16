/* Despina — carte du ciel vectorielle (façon Stellarium)
   Vue tout-le-ciel : zénith au centre, horizon = cercle, Nord en haut.
   Base stable : le repère horizon/cardinaux ne bascule jamais ; le zoom et le
   déplacement agissent comme une loupe sur cette carte (aucune rotation).
   Alt/az calculés localement ; astronomy-engine fournit temps sidéral + planètes.
   API : const sm = Despina.SkyMap(canvas, opts);
   opts : {data, location:{lat,lon,name}, date, layers, onSelect, onView, interactive:true} */
(function () {
  const D = window.Despina = window.Despina || {};
  const A = () => window.Astronomy;
  const DEG = Math.PI / 180, R2D = 180 / Math.PI;
  const MAXZ = 10, MINZ = 1;

  function css(v, fb){ try{ const c=getComputedStyle(document.documentElement).getPropertyValue(v).trim(); return c||fb; }catch(e){ return fb; } }
  const norm360 = a => ((a % 360) + 360) % 360;
  const clamp = (v,a,b) => Math.max(a, Math.min(b, v));

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

  D.SkyMap = function (canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext("2d");
    const data = opts.data;
    const interactive = opts.interactive !== false;
    const state = {
      lat: opts.location?.lat ?? 48.8566,
      lon: opts.location?.lon ?? 2.3522,
      name: opts.location?.name ?? "Paris",
      date: opts.date ? new Date(opts.date) : new Date(),
      layers: Object.assign({ stars:true, constellations:true, labels:true, messier:true, dso:false, planets:true, grid:true }, opts.layers||{}),
      selected: null,
      zoom: 1, panX: 0, panY: 0
    };
    const lang = () => (D.getLang ? D.getLang() : "fr");
    const onSelect = opts.onSelect || function(){};
    const onView = opts.onView || function(){};

    const S = data.stars.map(s => ({ ra:s[0], dec:s[1], mag:s[2], bv:s[3] }));
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
    let hitMessier = [], hitConst = [], hitPlanet = [], hitDso = [];

    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H) return;
      canvas.width = Math.round(W*dpr); canvas.height = Math.round(H*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
      R = Math.min(W,H)/2 - 22;
      cx = W/2; cy = H/2;
      draw();
    }

    // équatorial (deg) -> horizontal ; N=0, E=90
    function altaz(raDeg, decDeg, lstDeg, latRad){
      const H0 = (lstDeg - raDeg) * DEG, dec = decDeg * DEG;
      const sinAlt = Math.sin(dec)*Math.sin(latRad) + Math.cos(dec)*Math.cos(latRad)*Math.cos(H0);
      const alt = Math.asin(clamp(sinAlt,-1,1));
      const cosAlt = Math.cos(alt);
      let az;
      if (cosAlt < 1e-6) az = 0;
      else {
        const cosA = clamp((Math.sin(dec) - Math.sin(alt)*Math.sin(latRad)) / (cosAlt*Math.cos(latRad)), -1, 1);
        az = Math.acos(cosA);
        if (Math.sin(H0) > 0) az = 2*Math.PI - az;
      }
      return { alt: alt*R2D, az: az*R2D };
    }
    // horizontal -> carte de base (zénith centre, N haut, E gauche)
    function base(alt, az){
      const r = R * (90 - alt) / 90, a = az * DEG;
      return { x: cx - r*Math.sin(a), y: cy - r*Math.cos(a) };
    }
    // loupe : zoom + déplacement (aucune rotation -> le Nord reste en haut)
    function view(p){ return { x:(p.x-cx)*state.zoom + cx + state.panX, y:(p.y-cy)*state.zoom + cy + state.panY }; }
    function project(alt, az){ return alt < 0 ? null : view(base(alt, az)); }
    function onScreen(p){ return !!p && p.x>-60 && p.x<W+60 && p.y>-40 && p.y<H+40; }

    function clampPan(){
      const lim = R*state.zoom;   // le disque du ciel reste accroché au cadre
      state.panX = clamp(state.panX, -lim, lim);
      state.panY = clamp(state.panY, -lim, lim);
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
            acc2 = css("--accent-2","#6ea8ff");
      const { lstDeg, latRad } = frame();
      const Z = state.zoom;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle = css("--bg-2","#0d1324"); ctx.fillRect(0,0,W,H);

      const hc = view({x:cx,y:cy}), hr = R*Z;   // horizon transformé
      ctx.save();
      ctx.beginPath(); ctx.arc(hc.x,hc.y,hr,0,7.0); ctx.clip();
      const g = ctx.createRadialGradient(hc.x,hc.y-hr*0.2,hr*0.1,hc.x,hc.y,hr);
      g.addColorStop(0, night?"#180000":"#0b1330"); g.addColorStop(1, night?"#0a0000":"#05070f");
      ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

      if (state.layers.grid){
        ctx.strokeStyle = lineC; ctx.lineWidth = 1; ctx.globalAlpha = .6;
        [30,60].forEach(a=>{ ctx.beginPath(); ctx.arc(hc.x,hc.y,R*(90-a)/90*Z,0,7.0); ctx.stroke(); });
        for (let az=0; az<360; az+=30){ const p=project(0.01,az); ctx.beginPath(); ctx.moveTo(hc.x,hc.y); ctx.lineTo(p.x,p.y); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }

      if (state.layers.stars){
        const boost = Z>1 ? 0.6 : 0;
        for (let i=0;i<S.length;i++){
          const s=S[i];
          const aa=altaz(s.ra, s.dec, lstDeg, latRad);
          if (aa.alt<0) continue;
          const p=project(aa.alt, aa.az); if(!onScreen(p)) continue;
          const size = Math.max(0.5, (6.6 - s.mag) * 0.42 + boost);
          ctx.beginPath(); ctx.fillStyle = starColor(s.bv, night);
          ctx.globalAlpha = Math.min(1, .35 + (6.5 - s.mag)/6.5);
          ctx.arc(p.x,p.y,size,0,7.0); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

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
          const aa=altaz(c.pt[0], c.pt[1], lstDeg, latRad);
          let lp=null;
          if (aa.alt>=0){
            lp=project(aa.alt,aa.az);
            if (state.layers.labels && onScreen(lp)){
              ctx.globalAlpha=.9; ctx.fillStyle = sel?accentC:faintC;
              ctx.font = "600 11px 'Space Mono', monospace"; ctx.textAlign="center";
              ctx.fillText(lang()==="en"?c.en:c.fr, lp.x, lp.y);
            }
          }
          if (segsScreen.length) hitConst.push({c, segs:segsScreen, label:lp});
        });
        ctx.globalAlpha=1;
      }

      // NGC / IC — le seuil de magnitude s'ouvre avec le zoom pour éviter la bouillie
      hitDso = [];
      if (state.layers.dso && data.dso){
        const magLim = Z<1.5 ? 8 : Z<2.5 ? 9.5 : Z<4 ? 11 : 12;
        data.dso.forEach(o=>{
          if (o[4]!=null && o[4]>magLim) return;
          const aa=altaz(o[1], o[2], lstDeg, latRad);
          if (aa.alt<0) return;
          const p=project(aa.alt,aa.az); if(!onScreen(p)) return;
          const sel = state.selected && state.selected.kind==="dso" && state.selected.name===o[0];
          ctx.strokeStyle = night ? "#b43a2e" : (DSO_COLOR[o[3]]||"#9aa4bd");
          ctx.lineWidth = sel?2:1; ctx.globalAlpha = sel?1:.8;
          const rr = sel?6:2.6;
          ctx.beginPath();
          if (o[3]==="GX") ctx.ellipse(p.x,p.y,rr*1.5,rr*0.8,0,0,7.0); else ctx.arc(p.x,p.y,rr,0,7.0);
          ctx.stroke();
          hitDso.push({o, p});
          if ((sel || (Z>=3 && o[6])) && state.layers.labels){
            ctx.fillStyle = sel?accentC:faintC; ctx.font="500 10px 'Space Mono',monospace"; ctx.textAlign="left";
            ctx.fillText(o[0], p.x+7, p.y-5);
          }
          ctx.globalAlpha=1;
        });
      }

      hitMessier = [];
      if (state.layers.messier){
        data.messier.forEach(m=>{
          const aa=altaz(m[1], m[2], lstDeg, latRad);
          if (aa.alt<0) return;
          const p=project(aa.alt,aa.az); if(!onScreen(p)) return;
          const sel = state.selected && state.selected.kind==="messier" && state.selected.name===m[0];
          ctx.strokeStyle = sel?accentC:"#f4c15d"; ctx.fillStyle="rgba(244,193,93,.18)"; ctx.lineWidth=sel?2:1.2;
          ctx.beginPath(); ctx.arc(p.x,p.y, sel?7:4.5, 0, 7.0); ctx.fill(); ctx.stroke();
          hitMessier.push({m, p});
          if (sel || (Z>=2.2 && state.layers.labels)){
            ctx.fillStyle=sel?accentC:"#f4c15d"; ctx.font="600 11px 'Space Mono',monospace"; ctx.textAlign="left";
            ctx.fillText(m[0], p.x+8, p.y-6);
          }
        });
      }

      hitPlanet = [];
      if (state.layers.planets){
        const Ast=A();
        const obs = (()=>{ try{ return new Ast.Observer(state.lat,state.lon,0);}catch(e){return null;} })();
        if (obs) PLANETS.forEach(pl=>{
          let eq; try{ eq = Ast.Equator(pl[0], state.date, obs, true, true); }catch(e){ return; }
          const aa=altaz(eq.ra*15, eq.dec, lstDeg, latRad);
          if (aa.alt<0) return;
          const p=project(aa.alt,aa.az); if(!onScreen(p)) return;
          ctx.beginPath(); ctx.fillStyle=pl[2]; ctx.globalAlpha=1;
          ctx.arc(p.x,p.y, pl[3], 0, 7.0); ctx.fill();
          if (pl[0]==="Sun"||pl[0]==="Moon"){ ctx.strokeStyle=pl[2]; ctx.globalAlpha=.5; ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(p.x,p.y,pl[3]+3,0,7.0); ctx.stroke(); ctx.globalAlpha=1; }
          ctx.fillStyle=inkC; ctx.font="600 11px 'Space Mono',monospace"; ctx.textAlign="left";
          ctx.fillText(pl[1][lang()], p.x+pl[3]+3, p.y+3);
          hitPlanet.push({pl, p});
        });
      }
      ctx.restore();

      // repère fixe : horizon, méridien, zénith, cardinaux
      ctx.strokeStyle = night?"#ff5a49":inkC; ctx.globalAlpha=.85; ctx.lineWidth=1.6;
      ctx.beginPath(); ctx.arc(hc.x,hc.y,hr,0,7.0); ctx.stroke();
      ctx.globalAlpha=.3; ctx.setLineDash([4,5]);
      ctx.beginPath(); ctx.moveTo(hc.x,hc.y-hr); ctx.lineTo(hc.x,hc.y+hr); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha=1;
      ctx.fillStyle=faintC; ctx.beginPath(); ctx.arc(hc.x,hc.y,2,0,7.0); ctx.fill();
      ctx.font="500 10px 'Space Mono',monospace"; ctx.textAlign="center";
      ctx.fillText(lang()==="en"?"zenith":"zénith", hc.x, hc.y-8);
      const card = lang()==="en"
        ? [["N",0],["E",90],["S",180],["W",270],["NE",45],["SE",135],["SW",225],["NW",315]]
        : [["N",0],["E",90],["S",180],["O",270],["NE",45],["SE",135],["SO",225],["NO",315]];
      ctx.font="700 13px 'Space Mono',monospace";
      card.forEach(([lbl,az])=>{
        const a=az*DEG, rr=hr+13, x=hc.x-rr*Math.sin(a), y=hc.y-rr*Math.cos(a);
        if (x<-20||x>W+20||y<-20||y>H+20) return;
        ctx.fillStyle = (az%90===0)? (az===0?accentC:inkC) : faintC;
        ctx.fillText(lbl, x, y+4);
      });
      if (Z>1.01){
        ctx.fillStyle=faintC; ctx.font="500 10px 'Space Mono',monospace"; ctx.textAlign="left";
        ctx.fillText("×"+Z.toFixed(1), 8, H-8);
      }
      onView({zoom:Z});
    }

    // ---- sélection ----
    function pick(mx,my){
      let best=null, bd=16;
      hitMessier.forEach(h=>{ const d=Math.hypot(h.p.x-mx,h.p.y-my); if(d<bd){bd=d;best={kind:"messier",m:h.m};} });
      hitPlanet.forEach(h=>{ const d=Math.hypot(h.p.x-mx,h.p.y-my); if(d<bd){bd=d;best={kind:"planet",pl:h.pl};} });
      hitDso.forEach(h=>{ const d=Math.hypot(h.p.x-mx,h.p.y-my); if(d<bd){bd=d;best={kind:"dso",o:h.o};} });
      if (best) return best;
      let bc=null, bcd=12;
      hitConst.forEach(h=>{
        let md=1e9;
        h.segs.forEach(([a,b])=>{ md=Math.min(md, segDist(mx,my,a.x,a.y,b.x,b.y)); });
        if (h.label) md=Math.min(md, Math.hypot(h.label.x-mx,h.label.y-my));
        if (md<bcd){ bcd=md; bc=h.c; }
      });
      return bc ? {kind:"const", c:bc} : null;
    }
    function segDist(px,py,x1,y1,x2,y2){
      const dx=x2-x1, dy=y2-y1, l2=dx*dx+dy*dy;
      let t = l2? ((px-x1)*dx+(py-y1)*dy)/l2 : 0; t=clamp(t,0,1);
      return Math.hypot(px-(x1+t*dx), py-(y1+t*dy));
    }
    function emit(hit){
      if (!hit){ state.selected=null; draw(); onSelect(null); return; }
      if (hit.kind==="messier"){ const m=hit.m; state.selected={kind:"messier",name:m[0]};
        onSelect({kind:"messier",name:m[0],ra:m[1],dec:m[2],type:m[3],mag:m[4],alt:m[5],dim:m[6],morph:m[7],ngc:m[8]}); }
      else if (hit.kind==="dso"){ const o=hit.o; state.selected={kind:"dso",name:o[0]};
        onSelect({kind:"dso",name:o[0],ra:o[1],dec:o[2],type:o[3],mag:o[4],dim:o[5],fr:o[6]||"",en:o[7]||""}); }
      else if (hit.kind==="const"){ const c=hit.c; state.selected={kind:"const",d:c.d};
        onSelect({kind:"const",d:c.d,en:c.en,fr:c.fr,gen:c.gen}); }
      else if (hit.kind==="planet"){ state.selected=null; onSelect({kind:"planet",key:hit.pl[0],name:hit.pl[1]}); }
      draw();
    }

    // ---- navigation ----
    const rel = ev => { const r=canvas.getBoundingClientRect(); return { x:(ev.clientX??0)-r.left, y:(ev.clientY??0)-r.top }; };
    function zoomAt(factor, mx, my){
      const z0 = state.zoom, z1 = clamp(z0*factor, MINZ, MAXZ);
      if (z1===z0) return;
      state.panX = mx - (mx - state.panX - cx)*(z1/z0) - cx;   // point sous le curseur immobile
      state.panY = my - (my - state.panY - cy)*(z1/z0) - cy;
      state.zoom = z1;
      if (z1===MINZ){ state.panX=0; state.panY=0; }
      clampPan(); draw();
    }
    let drag=null, moved=0, pinch=null;
    function touchDist(ev){ const a=ev.touches[0],b=ev.touches[1]; return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY); }
    function touchMid(ev){ const a=ev.touches[0],b=ev.touches[1],r=canvas.getBoundingClientRect();
      return { x:(a.clientX+b.clientX)/2-r.left, y:(a.clientY+b.clientY)/2-r.top }; }
    function down(ev){
      if (ev.touches && ev.touches.length===2){ pinch={ d:touchDist(ev), z:state.zoom }; drag=null; return; }
      const t = ev.touches ? ev.touches[0] : ev;
      drag = { x:t.clientX, y:t.clientY, px:state.panX, py:state.panY }; moved=0;
    }
    function move(ev){
      if (pinch && ev.touches && ev.touches.length===2){
        ev.preventDefault();
        const d=touchDist(ev), c=touchMid(ev);
        const z1 = clamp(pinch.z*(d/pinch.d), MINZ, MAXZ), f = z1/state.zoom;
        if (Math.abs(f-1)>0.001) zoomAt(f, c.x, c.y);
        return;
      }
      if (!drag) return;
      const t = ev.touches ? ev.touches[0] : ev;
      const dx=t.clientX-drag.x, dy=t.clientY-drag.y;
      moved = Math.max(moved, Math.hypot(dx,dy));
      if (state.zoom<=MINZ && moved<3) return;   // au zoom 1 : pas de glissement parasite
      if (ev.touches) ev.preventDefault();
      state.panX = drag.px+dx; state.panY = drag.py+dy;
      clampPan(); draw();
    }
    function up(ev){
      pinch=null;
      if (drag && moved<5){   // clic net = sélection, glissement = déplacement
        const t = (ev.changedTouches && ev.changedTouches[0]) || ev;
        const r = canvas.getBoundingClientRect();
        emit(pick(t.clientX-r.left, t.clientY-r.top));
      }
      drag=null;
    }
    function wheel(ev){ ev.preventDefault(); const p=rel(ev); zoomAt(ev.deltaY<0?1.15:1/1.15, p.x, p.y); }

    if (interactive){
      canvas.style.cursor="grab"; canvas.style.touchAction="none";
      canvas.addEventListener("mousedown", e=>{ canvas.style.cursor="grabbing"; down(e); });
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", e=>{ canvas.style.cursor="grab"; up(e); });
      canvas.addEventListener("wheel", wheel, {passive:false});
      canvas.addEventListener("touchstart", down, {passive:false});
      canvas.addEventListener("touchmove", move, {passive:false});
      canvas.addEventListener("touchend", up);
    } else {
      canvas.addEventListener("click", e=>{ const p=rel(e); emit(pick(p.x,p.y)); });
    }

    let liveTimer=null;
    const api = {
      redraw: draw, resize,
      setDate(d){ state.date=new Date(d); draw(); },
      setNow(){ state.date=new Date(); draw(); },
      setLocation(lat,lon,name){ state.lat=lat; state.lon=lon; if(name)state.name=name; draw(); },
      setLayer(k,v){ state.layers[k]=v; draw(); },
      getState(){ return { lat:state.lat, lon:state.lon, name:state.name, date:state.date, zoom:state.zoom }; },
      select(sel){ state.selected=sel; draw(); },
      zoomIn(){ zoomAt(1.4, W/2, H/2); },
      zoomOut(){ zoomAt(1/1.4, W/2, H/2); },
      resetView(){ state.zoom=1; state.panX=0; state.panY=0; draw(); },
      /* centre la vue sur un objet levé (recherche) ; false s'il est sous l'horizon */
      centerOn(raDeg, decDeg, zoom){
        const { lstDeg, latRad } = frame();
        const aa = altaz(raDeg, decDeg, lstDeg, latRad);
        if (aa.alt < 0) return false;
        if (zoom) state.zoom = clamp(zoom, MINZ, MAXZ);
        const b = base(aa.alt, aa.az);
        state.panX = cx - ((b.x-cx)*state.zoom + cx);
        state.panY = cy - ((b.y-cy)*state.zoom + cy);
        clampPan(); draw(); return true;
      },
      live(on){ if(liveTimer){clearInterval(liveTimer);liveTimer=null;} if(on){ liveTimer=setInterval(()=>{ state.date=new Date(); draw(); },30000);} },
      destroy(){ if(liveTimer)clearInterval(liveTimer);
        window.removeEventListener("resize",resize); window.removeEventListener("mousemove",move); window.removeEventListener("mouseup",up);
        document.removeEventListener("despina:lang",draw); }
    };
    window.addEventListener("resize", resize);
    document.addEventListener("despina:lang", draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(()=>draw());
    resize();
    return api;
  };
})();
