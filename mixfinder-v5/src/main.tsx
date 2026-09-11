import React from "react";
import ReactDOM from "react-dom/client";
import { listen } from "@tauri-apps/api/event";
import App from "./App";
import "./styles.css";

type SyncProgress={current:number;total:number;percent:number;current_mix:string;total_uses:number};

function ensureProgress(){
  let el=document.getElementById("sync-live-progress");
  if(!el){
    el=document.createElement("div");
    el.id="sync-live-progress";
    el.innerHTML=`<div class="sync-live-head"><div><b>Synchronisation de la bibliothèque</b><span id="sync-live-count">Préparation…</span></div><strong id="sync-live-percent">0%</strong></div><div class="sync-live-track"><div id="sync-live-bar"></div></div><div class="sync-live-bottom"><span id="sync-live-file">Analyse des mixes…</span><span id="sync-live-uses">0 morceaux trouvés</span></div>`;
    document.body.appendChild(el);
  }
  return el;
}

listen<SyncProgress>("sync-progress",({payload:p})=>{
  const el=ensureProgress();
  el.classList.add("visible");
  const count=document.getElementById("sync-live-count");
  const percent=document.getElementById("sync-live-percent");
  const bar=document.getElementById("sync-live-bar") as HTMLElement|null;
  const file=document.getElementById("sync-live-file");
  const uses=document.getElementById("sync-live-uses");
  if(count)count.textContent=`${p.current.toLocaleString("fr-BE")} / ${p.total.toLocaleString("fr-BE")} mixes analysés`;
  if(percent)percent.textContent=`${p.percent}%`;
  if(bar)bar.style.width=`${p.percent}%`;
  if(file)file.textContent=p.current_mix||"Analyse des mixes…";
  if(uses)uses.textContent=`${p.total_uses.toLocaleString("fr-BE")} morceaux trouvés`;
  if(p.total>0&&p.current>=p.total){
    if(file)file.textContent="✓ Synchronisation terminée";
    window.setTimeout(()=>el.classList.remove("visible"),5000);
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode><App /></React.StrictMode>
);
