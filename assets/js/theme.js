/* Despina — thème + modale partagée.
   Stockage local : "despina-theme" et "despina-lang" (préférences d'affichage,
   jamais transmises). Aucune autre donnée n'est conservée. */
(function () {
  const KEY = "despina-theme";
  const VALID = ["dark", "light", "night"];
  const ICON = { dark:"☾", light:"☀", night:"◉" };
  const LABEL = { dark:{fr:"Sombre",en:"Dark"}, light:{fr:"Clair",en:"Light"}, night:{fr:"Nuit (rouge)",en:"Night (red)"} };
  const D = window.Despina = window.Despina || {};

  function get(){ try{ const v=localStorage.getItem(KEY); if(VALID.includes(v)) return v; }catch(e){}
    try{ return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light":"dark"; }
    catch(e){ return "dark"; } }
  function apply(t){
    document.documentElement.setAttribute("data-theme", t);
    document.querySelectorAll(".theme-switch button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.theme===t)));
    const m=document.querySelector('meta[name="theme-color"]');
    if(m){ try{ m.content=getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()||"#0a0e1a"; }catch(e){} }
  }
  function set(t){ try{localStorage.setItem(KEY,t);}catch(e){} apply(t); }
  D.setTheme=set; D.getTheme=get; apply(get());

  function mountTheme(){
    document.querySelectorAll("[data-theme-switch]").forEach(host=>{
      const lang=(D.getLang&&D.getLang())||"fr";
      host.classList.add("theme-switch");
      host.innerHTML=VALID.map(t=>`<button data-theme="${t}" title="${LABEL[t][lang]}" aria-label="${LABEL[t][lang]}">${ICON[t]}</button>`).join("");
      host.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>set(b.dataset.theme)));
    });
    apply(get());
  }
  D._mountTheme = mountTheme;

  /* Modale réutilisable : Despina.modal(htmlString) */
  D.modal = function(html){
    const back=document.createElement("div"); back.className="modal-back";
    back.innerHTML=`<div class="modal" role="dialog" aria-modal="true">
      <button class="btn info-close modal-close" aria-label="Fermer">✕</button>${html}</div>`;
    function close(){ back.remove(); document.removeEventListener("keydown",esc); }
    function esc(e){ if(e.key==="Escape") close(); }
    back.addEventListener("click",e=>{ if(e.target===back||e.target.closest(".info-close")) close(); });
    document.addEventListener("keydown",esc);
    document.body.appendChild(back);
    back.querySelector(".modal").focus?.();
    return close;
  };

  /* Menu mobile : bouton hamburger injecté dans la barre de nav.
     Corrige le menu qui occupait tout l'écran sur téléphone (nav sticky à 6 liens). */
  function mountNav(){
    const bar = document.querySelector(".topbar");
    const nav = bar && bar.querySelector(".nav");
    if(!bar || !nav || bar.querySelector(".nav-toggle")) return;
    const btn = document.createElement("button");
    btn.className = "nav-toggle"; btn.type = "button";
    btn.setAttribute("aria-expanded","false");
    btn.setAttribute("aria-controls","main-nav");
    btn.innerHTML = "☰";
    if(!nav.id) nav.id = "main-nav";
    const label = () => (D.getLang && D.getLang()==="en") ? "Menu" : "Menu";
    btn.setAttribute("aria-label", label());
    function setOpen(on){
      bar.classList.toggle("nav-open", on);
      btn.setAttribute("aria-expanded", String(on));
      btn.innerHTML = on ? "✕" : "☰";
    }
    btn.addEventListener("click", e => { e.stopPropagation(); setOpen(!bar.classList.contains("nav-open")); });
    // se referme : clic sur un lien, clic ailleurs, Échap, ou passage en grand écran
    nav.addEventListener("click", e => { if(e.target.closest("a")) setOpen(false); });
    document.addEventListener("click", e => { if(!bar.contains(e.target)) setOpen(false); });
    document.addEventListener("keydown", e => { if(e.key==="Escape") setOpen(false); });
    window.addEventListener("resize", () => { if(window.innerWidth>860) setOpen(false); });
    bar.appendChild(btn);
  }
  D._mountNav = mountNav;

  /* Enregistrement du service worker (mode hors-ligne).
     Uniquement sur http(s) : en file:// l'API n'existe pas et lèverait une erreur. */
  function mountSW(){
    if (!("serviceWorker" in navigator)) return;
    if (location.protocol !== "http:" && location.protocol !== "https:") return;
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(err => console.warn("[despina] sw:", err));
    });
  }

  /* Petit témoin « hors-ligne » : utile en observation, on sait ce qui marche encore. */
  function mountOffline(){
    const bar = document.querySelector(".topbar");
    if (!bar) return;
    const tag = document.createElement("span");
    tag.className = "offline-tag"; tag.hidden = navigator.onLine !== false;
    const sync = () => {
      const off = navigator.onLine === false;
      tag.hidden = !off;
      tag.textContent = (D.getLang && D.getLang()==="en") ? "offline" : "hors-ligne";
    };
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    document.addEventListener("despina:lang", sync);
    bar.appendChild(tag);
  }

  /* Chaque étape est isolée : une panne (ex. thème) ne doit jamais empêcher
     le montage du menu — c'est lui qui rend le site utilisable sur téléphone. */
  function boot(){
    [mountTheme, mountNav, mountOffline, mountSW].forEach(fn => {
      try { fn(); } catch (e) { console.warn("[despina]", fn.name, e); }
    });
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
