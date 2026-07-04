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
    return window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light":"dark"; }
  function apply(t){
    document.documentElement.setAttribute("data-theme", t);
    document.querySelectorAll(".theme-switch button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.theme===t)));
    const m=document.querySelector('meta[name="theme-color"]');
    if(m) m.content=getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()||"#0a0e1a";
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

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",mountTheme);
  else mountTheme();
})();
