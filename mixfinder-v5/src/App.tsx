import { useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Search, Music2, BarChart3, RefreshCw, Settings, FolderOpen, Play, Database, CheckCircle2, X } from "lucide-react";

type Track = { position:number; file_path:string; filename:string; display_name:string };
type Mix = { mix_name:string; mix_path:string; modified_at:string; track_count:number; tracks:Track[] };
type IndexData = { root_folder:string; scanned_at:string; mix_count:number; total_uses:number; mixes:Mix[] };
type Occurrence = { display_name:string; filename:string; track_path:string; position:number; mix_name:string; mix_path:string; modified_at:string };
type Group = { name:string; count:number; mixCount:number; lastUsed:string; occurrences:Occurrence[] };

const fmtDate=(v?:string)=>{ if(!v) return "—"; const d=new Date(v); return Number.isNaN(d.getTime())?"—":new Intl.DateTimeFormat("fr-BE").format(d); };

export default function App(){
  const [index,setIndex]=useState<IndexData|null>(null);
  const [query,setQuery]=useState("");
  const [activeQuery,setActiveQuery]=useState("");
  const [selected,setSelected]=useState<Group|null>(null);
  const [folder,setFolder]=useState("");
  const [syncing,setSyncing]=useState(false);
  const [status,setStatus]=useState("Chargement…");
  const [view,setView]=useState<"search"|"library"|"stats"|"sync"|"settings">("search");

  useEffect(()=>{ invoke<IndexData|null>("load_index").then(data=>{ setIndex(data); if(data){ setFolder(data.root_folder||""); setStatus("À jour"); } else setStatus("Aucun index"); }).catch(()=>setStatus("Erreur")); },[]);

  const flat=useMemo<Occurrence[]>(()=>{
    const out:Occurrence[]=[];
    index?.mixes.forEach(m=>m.tracks.forEach(t=>out.push({display_name:t.display_name,filename:t.filename,track_path:t.file_path,position:t.position,mix_name:m.mix_name,mix_path:m.mix_path,modified_at:m.modified_at})));
    return out;
  },[index]);

  const uniqueCount=useMemo(()=>new Set(flat.map(x=>x.display_name.toLowerCase())).size,[flat]);

  const groups=useMemo<Group[]>(()=>{
    const q=activeQuery.trim().toLowerCase(); if(!q) return [];
    const tokens=q.split(/\s+/).filter(Boolean);
    const map=new Map<string,Occurrence[]>();
    flat.filter(r=>tokens.every(t=>(`${r.display_name} ${r.filename}`).toLowerCase().includes(t))).forEach(r=>{
      const arr=map.get(r.display_name)||[]; arr.push(r); map.set(r.display_name,arr);
    });
    return [...map.entries()].map(([name,occurrences])=>({
      name,
      count:occurrences.length,
      mixCount:new Set(occurrences.map(o=>o.mix_path)).size,
      lastUsed:[...occurrences].map(o=>o.modified_at).sort().reverse()[0]||"",
      occurrences:[...occurrences].sort((a,b)=>b.modified_at.localeCompare(a.modified_at))
    })).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  },[activeQuery,flat]);

  useEffect(()=>{ setSelected(groups[0]||null); },[groups]);

  const chooseFolder=async()=>{ const picked=await open({directory:true,multiple:false,title:"Choisir le dossier MixMeister"}); if(typeof picked==="string") setFolder(picked); };
  const syncFolder=async()=>{ if(!folder)return; setSyncing(true); setStatus("Synchronisation…"); try{ const data=await invoke<IndexData>("scan_folder",{folder}); setIndex(data); setStatus("À jour"); }catch{ setStatus("Erreur de synchronisation"); }finally{ setSyncing(false); } };
  const openMix=(path:string)=>invoke("open_mix",{path});
  const revealMix=(path:string)=>invoke("reveal_mix",{path});
  const doSearch=()=>{ setActiveQuery(query); setView("search"); };

  const topTracks=useMemo(()=>{
    const m=new Map<string,number>(); flat.forEach(x=>m.set(x.display_name,(m.get(x.display_name)||0)+1));
    return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,20);
  },[flat]);

  const allTracks=useMemo(()=>{
    const m=new Map<string,number>(); flat.forEach(x=>m.set(x.display_name,(m.get(x.display_name)||0)+1));
    return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  },[flat]);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="record"><div/></div><div><b>MixFinder</b><span>FOR YOUR MIXES</span></div></div>
      <nav>
        <Nav active={view==="search"} onClick={()=>setView("search")} icon={<Search size={20}/>} label="Recherche"/>
        <Nav active={view==="library"} onClick={()=>setView("library")} icon={<Music2 size={20}/>} label="Bibliothèque"/>
        <Nav active={view==="stats"} onClick={()=>setView("stats")} icon={<BarChart3 size={20}/>} label="Statistiques"/>
        <Nav active={view==="sync"} onClick={()=>setView("sync")} icon={<RefreshCw size={20}/>} label="Synchronisation"/>
        <Nav active={view==="settings"} onClick={()=>setView("settings")} icon={<Settings size={20}/>} label="Paramètres"/>
      </nav>
      <div className="motto">GOOD<br/>MIXES.<br/>BETTER<br/>SESSIONS.</div>
      <div className="index-card"><div className="index-title"><Database size={18}/>Bibliothèque indexée</div><strong>{index?.mix_count?.toLocaleString("fr-BE")||0} mixes</strong><span>{flat.length.toLocaleString("fr-BE")} utilisations</span><span>{uniqueCount.toLocaleString("fr-BE")} morceaux uniques</span><hr/><div className="ok"><CheckCircle2 size={16}/>{status}</div><small>Dernière synchro : {fmtDate(index?.scanned_at)}</small></div>
    </aside>

    <main className="main">
      <header className="topbar">TROUVEZ. MIXEZ. INSPIREZ.</header>

      {view==="search"&&<>
        <section className="search-zone"><div className="searchbox"><Search size={23}/><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Rechercher un titre, artiste ou remix…"/>{query&&<button onClick={()=>{setQuery("");setActiveQuery("")}}><X size={20}/></button>}</div><button className="primary" onClick={doSearch}>Rechercher</button></section>
        <section className="filters"><span>Tous les morceaux</span><span>Tous les artistes</span><span>Tous les types de mixes</span><span>Toutes les dates</span></section>
        <section className="content-grid">
          <div className="panel results-panel"><div className="panel-head"><div><h2>{groups.length?`${groups.length} résultats pour “${activeQuery}”`:"Recherche dans ta bibliothèque"}</h2><p>{groups.length?"Résultats regroupés par morceau.":"Tape un titre, un artiste ou un remix."}</p></div><span className="pill">Pertinence</span></div><div className="track-head"><span>#</span><span>MORCEAU</span><span>UTILISATIONS</span></div><div className="track-list">{groups.map((g,i)=><button key={g.name} className={`track-row ${selected?.name===g.name?"selected":""}`} onClick={()=>setSelected(g)}><span>{i+1}</span><span className="track-name"><i><Music2 size={17}/></i><span><b>{g.name}</b><small>{g.mixCount} mix{g.mixCount>1?"es":""}</small></span></span><strong>{g.count}</strong></button>)}{!groups.length&&<Empty/>}</div></div>
          <div className="panel detail-panel">{selected?<><div className="detail-top"><div className="cover"><Music2 size={48}/><span>▁▃▆█▇▄▂▃▅▇</span></div><div><h1>{selected.name}</h1><div className="chips"><span>Track</span><span>MixMeister</span></div><div className="stats"><div><b>{selected.count}</b><small>utilisations</small></div><div><b>{selected.mixCount}</b><small>mixes différents</small></div><div><b>{fmtDate(selected.lastUsed)}</b><small>dernière utilisation</small></div></div></div></div><h3>Utilisé dans les mixes suivants</h3><div className="use-head"><span>#</span><span>MIX</span><span>POSITION</span><span>DATE</span><span/></div><div className="use-list">{selected.occurrences.map((o,i)=><div className="use-row" key={`${o.mix_path}-${o.position}-${i}`}><span>{i+1}</span><span>{o.mix_name}</span><span>#{o.position}</span><span>{fmtDate(o.modified_at)}</span><span className="row-buttons"><button onClick={()=>openMix(o.mix_path)}><Play size={15}/></button><button onClick={()=>revealMix(o.mix_path)}><FolderOpen size={15}/></button></span></div>)}</div><div className="actions"><button className="primary" onClick={()=>selected.occurrences[0]&&openMix(selected.occurrences[0].mix_path)}><Play size={18}/>Ouvrir le mix</button><button className="secondary" onClick={()=>selected.occurrences[0]&&revealMix(selected.occurrences[0].mix_path)}><FolderOpen size={18}/>Ouvrir le dossier</button></div></>:<div className="empty big"><Music2 size={48}/><h3>Sélectionne un morceau</h3><p>Les mixes correspondants apparaîtront ici.</p></div>}</div>
        </section>
      </>}

      {view==="library"&&<Page title="Bibliothèque" subtitle={`${allTracks.length.toLocaleString("fr-BE")} morceaux uniques indexés.`}><div className="simple-list">{allTracks.slice(0,1000).map(([n,c])=><div key={n}><span>{n}</span><b>{c}</b></div>)}</div></Page>}
      {view==="stats"&&<Page title="Statistiques" subtitle="Vue d’ensemble de ta bibliothèque."><div className="metric-grid"><Metric value={index?.mix_count||0} label="mixes"/><Metric value={flat.length} label="utilisations"/><Metric value={uniqueCount} label="morceaux uniques"/></div><h2>Les plus utilisés</h2><div className="simple-list">{topTracks.map(([n,c],i)=><div key={n}><span><b>{i+1}.</b> {n}</span><b>{c}</b></div>)}</div></Page>}
      {view==="sync"&&<Page title="Synchronisation" subtitle="Choisis ton dossier racine MixMeister puis lance l’indexation."><div className="folder-line"><input value={folder} readOnly placeholder="Dossier MixMeister…"/><button className="secondary" onClick={chooseFolder}><FolderOpen size={18}/>Choisir</button><button className="primary" disabled={syncing||!folder} onClick={syncFolder}><RefreshCw size={18}/>{syncing?"Synchronisation…":"Synchroniser"}</button></div><div className="metric-grid"><Metric value={index?.mix_count||0} label="mixes"/><Metric value={flat.length} label="utilisations"/><Metric value={uniqueCount} label="morceaux uniques"/></div></Page>}
      {view==="settings"&&<Page title="Paramètres" subtitle="MixFinder fonctionne entièrement en local."><div className="settings-row"><span>Dossier actuel</span><b>{folder||"Non défini"}</b></div><div className="settings-row"><span>État</span><b>{status}</b></div></Page>}
    </main>
  </div>;
}

function Nav({active,onClick,icon,label}:{active:boolean;onClick:()=>void;icon:React.ReactNode;label:string}){return <button className={`nav-item ${active?"active":""}`} onClick={onClick}>{icon}{label}</button>}
function Metric({value,label}:{value:number;label:string}){return <div className="metric"><b>{value.toLocaleString("fr-BE")}</b><span>{label}</span></div>}
function Page({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){return <section className="page-card"><h1>{title}</h1><p>{subtitle}</p>{children}</section>}
function Empty(){return <div className="empty"><Search size={40}/><h3>Prêt à chercher</h3><p>Exemple : canon, stromae, opus, afro house…</p></div>}
