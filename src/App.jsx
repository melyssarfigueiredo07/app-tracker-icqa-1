import { useState, useCallback, useRef, useEffect } from "react";
import { sb } from "./lib/supabase";
import { STATIC_TRACKER, STATIC_PS_LIST, STATIC_TR_DATA } from "./staticData";

/* ── palette ── */
const Y    = "#F5C518";
const BG   = "#0D0D0D";
const SUR  = "#1A1A1A";
const SUR2 = "#242424";
const BDR  = "#2E2E2E";
const TXT  = "#F0F0F0";
const TXM  = "#A0A0A0";

const CREATOR_NAME = "Melyssa Rangel de Figueiredo";
const CREATOR_PASS = "Mel@ICQA07";

const SECOES = ["Desenvolvimento", "Fichas PS", "Treinamentos", "QA"];
const SECAO_ICONS = { "Desenvolvimento":"⚡","Fichas PS":"👥","Treinamentos":"📋","QA":"🔍" };

/* Performance sections use IC/QA pills; others have their own layout */
const SECAO_TIPO = {
  "Desenvolvimento": "performance",
  "Fichas PS":       "fichas",
  "Treinamentos":    "treinamentos",
  "QA":              "performance",
};

const REP_TIPOS = ["IC", "QA"];
const TAREFAS = {
  IC: ["CONTAGEM", "INBOUND AUDIT", "STOCK AUDIT", "LOST", "TRANSFER", "LOST/SOBRA"],
  QA: ["INTERNA", "INBOUND", "AUDITORIAS", "PDD", "PD", "CUBING", "VENCIDO"],
};
const TASK_COLORS = {
  "CONTAGEM":"#F5C518","INBOUND AUDIT":"#3EC9C4","STOCK AUDIT":"#E8833A",
  "LOST":"#E05C7A","TRANSFER":"#A47CF0","LOST/SOBRA":"#3EC97A",
  "INTERNA":"#F5C518","INBOUND":"#3EC9C4","AUDITORIAS":"#E8833A",
  "PDD":"#E05C7A","PD":"#A47CF0","CUBING":"#3EC97A","VENCIDO":"#FF8C42",
};
const TASK_DIM = {
  "CONTAGEM":"#3A2E00","INBOUND AUDIT":"#003A38","STOCK AUDIT":"#3A1C00",
  "LOST":"#3A0D1A","TRANSFER":"#20103A","LOST/SOBRA":"#003A1E",
  "INTERNA":"#3A2E00","INBOUND":"#003A38","AUDITORIAS":"#3A1C00",
  "PDD":"#3A0D1A","PD":"#20103A","CUBING":"#003A1E","VENCIDO":"#3A1A00",
};

/* ── helpers ── */
function avg(vals) {
  if (!vals.length) return 0;
  return Math.round(vals.reduce((s,v)=>s+v,0)/vals.length);
}
function repAvg(rep, tipo) {
  return avg(TAREFAS[tipo].map(t => rep[t] ?? 0));
}
function loadState(key, fb) {
  try { const r=localStorage.getItem(key); return r?JSON.parse(r):fb; } catch { return fb; }
}
function saveState(key,val) {
  try { localStorage.setItem(key,JSON.stringify(val)); } catch {}
}
function makeEmptySecoes() {
  const o={};
  SECOES.forEach(s=>{
    if(SECAO_TIPO[s]==="performance") o[s]={IC:{},QA:{}};
    else if(SECAO_TIPO[s]==="fichas") o[s]={list:[]};
    else o[s]={data:{}};
  });
  return o;
}
function makeT2WithStaticData() {
  return {
    "Desenvolvimento": fromTracker(STATIC_TRACKER),
    "Fichas PS": {list: STATIC_PS_LIST},
    "Treinamentos": {data: STATIC_TR_DATA},
    "QA": {IC:{}, QA:{}},
  };
}

/* Convert Supabase tracker row → Desenvolvimento section */
function fromTracker(raw) {
  const out={IC:{},QA:{}};
  Object.entries(raw?.IC||{}).forEach(([n,v])=>{
    out.IC[n]={
      re:v.re||"",cpf:v.cpf||"",ldap:v.ldap||"",cargo:v.cargo||"",
      escala:v.escala||"",admissao:v.admissao||"",contEmer:v.contEmer||"",
      endereco:v.endereco||"",telefone:v.telefone||"",
      feriasFim:v.feriasFim||"",feriasIni:v.feriasIni||"",feriasDias:v.feriasDias||0,
      "CONTAGEM":v.CONTAGEM??0,"INBOUND AUDIT":v["INBOUND AUDIT"]??0,
      "STOCK AUDIT":v["STOCK AUDIT"]??0,"LOST":v.LOST??0,
      "TRANSFER":v.TRANSFER??0,"LOST/SOBRA":v["LOST/SOBRA"]??0,
    };
  });
  Object.entries(raw?.QA||{}).forEach(([n,v])=>{
    out.QA[n]={
      re:v.re||"",cpf:v.cpf||"",ldap:v.ldap||"",cargo:v.cargo||"",
      escala:v.escala||"",admissao:v.admissao||"",contEmer:v.contEmer||"",
      endereco:v.endereco||"",telefone:v.telefone||"",
      feriasFim:v.feriasFim||"",feriasIni:v.feriasIni||"",feriasDias:v.feriasDias||0,
      "INTERNA":v.INTERNA??0,"INBOUND":v.INBOUND??0,"AUDITORIAS":v.AUDITORIAS??0,
      "PDD":v.PDD??0,"PD":v.PD??0,"CUBING":v.CUBING??0,"VENCIDO":v.VENCIDO??0,
    };
  });
  return out;
}

/* Convert app perf section → Supabase tracker format */
function toTracker(secData) {
  return { IC: secData.IC||{}, QA: secData.QA||{} };
}

function tempoDeCasa(adm) {
  if(!adm) return null;
  const d=new Date(adm+"T00:00:00"), h=new Date();
  const m=(h.getFullYear()-d.getFullYear())*12+(h.getMonth()-d.getMonth());
  if(m<0) return null;
  if(m===0) return "< 1 mês";
  if(m<12) return `${m} mês${m>1?"es":""}`;
  const a=Math.floor(m/12),r=m%12;
  return r>0?`${a} ano${a>1?"s":""} e ${r} mês${r>1?"es":""}`:`${a} ano${a>1?"s":""}`;
}

/* ── MODAL BASE ── */
function ModalWrap({children,onClose,width=460}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:16}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:SUR2,borderRadius:16,padding:"28px 32px",width,maxWidth:"100%",boxSizing:"border-box",border:`1px solid ${BDR}`,maxHeight:"90vh",overflowY:"auto"}}>
        {children}
      </div>
    </div>
  );
}

/* ── LOGIN ── */
function LoginModal({onLogin,onClose}){
  const [name,setName]=useState("");
  const [pass,setPass]=useState("");
  const [mode,setMode]=useState("user");
  const [err,setErr]=useState("");
  function doUser(){const n=name.trim();if(!n){setErr("Digite seu nome.");return;}onLogin({name:n,isCreator:false});onClose();}
  function doCreator(){if(pass!==CREATOR_PASS){setErr("Senha incorreta.");return;}onLogin({name:CREATOR_NAME,isCreator:true});onClose();}
  return(
    <ModalWrap onClose={onClose} width={380}>
      <div style={{fontSize:16,fontWeight:500,color:TXT,marginBottom:6}}>Identificação</div>
      <div style={{fontSize:13,color:TXM,marginBottom:18}}>Entre para ter acesso de edição.</div>
      <div style={{display:"flex",gap:8,marginBottom:18}}>
        {["user","creator"].map(m=>(
          <button key={m} onClick={()=>{setMode(m);setErr("");}}
            style={{flex:1,padding:"8px 0",borderRadius:8,cursor:"pointer",fontSize:13,
              border:mode===m?`1px solid ${Y}`:`1px solid ${BDR}`,
              background:mode===m?"#1A1400":"none",color:mode===m?Y:TXM,fontWeight:mode===m?500:400}}>
            {m==="user"?"Colaborador":"Criadora"}
          </button>
        ))}
      </div>
      {err&&<div style={{background:"#3A0D1A",color:"#E05C7A",borderRadius:8,padding:"9px 13px",fontSize:13,marginBottom:14}}>{err}</div>}
      {mode==="user"?(
        <>
          <label style={{fontSize:12,color:TXM,display:"block",marginBottom:5}}>Seu nome</label>
          <input autoFocus type="text" placeholder="Ex: João Silva" value={name} onChange={e=>setName(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")doUser();}}
            style={{width:"100%",boxSizing:"border-box",marginBottom:16,background:SUR,border:`1px solid ${BDR}`,color:TXT,borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none"}}/>
          <button onClick={doUser} style={{width:"100%",padding:"10px 0",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:14,fontWeight:500}}>Entrar</button>
        </>
      ):(
        <>
          <div style={{fontSize:13,color:TXM,marginBottom:8}}>Acesso de <span style={{color:Y}}>{CREATOR_NAME}</span></div>
          <label style={{fontSize:12,color:TXM,display:"block",marginBottom:5}}>Senha</label>
          <input autoFocus type="password" placeholder="Senha da criadora" value={pass} onChange={e=>setPass(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter")doCreator();}}
            style={{width:"100%",boxSizing:"border-box",marginBottom:16,background:SUR,border:`1px solid ${BDR}`,color:TXT,borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none"}}/>
          <button onClick={doCreator} style={{width:"100%",padding:"10px 0",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:14,fontWeight:500}}>Entrar como Criadora</button>
        </>
      )}
    </ModalWrap>
  );
}

/* ── ADMIN MODAL ── */
function AdminModal({versoes,editors,onSetEditors,onAddVersao,onRemoveVersao,onClose}){
  const [tab,setTab]=useState("editors");
  const [selVer,setSelVer]=useState(versoes[0]||"");
  const [newEd,setNewEd]=useState("");
  const [newVer,setNewVer]=useState("");
  const [err,setErr]=useState("");
  const cur=editors[selVer]||[];
  function addEd(){const n=newEd.trim();if(!n)return;if(cur.includes(n)){setErr("Já tem acesso.");return;}onSetEditors(selVer,[...cur,n]);setNewEd("");setErr("");}
  function addVer(){const v=newVer.trim().toUpperCase();if(!v)return;if(versoes.includes(v)){setErr("Já existe.");return;}onAddVersao(v);setNewVer("");setErr("");}
  return(
    <ModalWrap onClose={onClose} width={500}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <div style={{fontSize:16,fontWeight:500,color:TXT}}>Painel da Criadora</div>
          <div style={{fontSize:12,color:TXM,marginTop:2}}>Gerencie versões e editores</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:TXM}}>×</button>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${BDR}`,marginBottom:18}}>
        {["editors","versoes"].map(t=>(
          <button key={t} onClick={()=>{setTab(t);setErr("");}}
            style={{padding:"8px 20px",border:"none",cursor:"pointer",fontSize:13,
              borderBottom:tab===t?`2px solid ${Y}`:"2px solid transparent",
              background:"none",color:tab===t?Y:TXM,fontWeight:tab===t?500:400}}>
            {t==="editors"?"Editores por Versão":"Gerenciar Versões"}
          </button>
        ))}
      </div>
      {err&&<div style={{background:"#3A0D1A",color:"#E05C7A",borderRadius:8,padding:"9px 13px",fontSize:13,marginBottom:14}}>{err}</div>}
      {tab==="editors"&&(
        <div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
            {versoes.map(v=>(
              <button key={v} onClick={()=>{setSelVer(v);setErr("");}}
                style={{padding:"6px 16px",borderRadius:8,cursor:"pointer",fontSize:13,
                  border:selVer===v?`1px solid ${Y}`:`1px solid ${BDR}`,
                  background:selVer===v?"#1A1400":"none",color:selVer===v?Y:TXM}}>{v}</button>
            ))}
          </div>
          {cur.length===0?(
            <div style={{textAlign:"center",padding:14,color:TXM,fontSize:13,background:SUR,borderRadius:10,marginBottom:12}}>
              Nenhum editor. Apenas a criadora pode editar esta versão.
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
              {cur.map(e=>(
                <div key={e} style={{display:"flex",alignItems:"center",gap:10,background:SUR,borderRadius:10,padding:"10px 14px",border:`1px solid ${BDR}`}}>
                  <div style={{flex:1,fontSize:14,color:TXT}}>{e}</div>
                  <span style={{fontSize:11,background:"#20103A",color:"#A47CF0",borderRadius:20,padding:"2px 8px"}}>Editor</span>
                  <button onClick={()=>onSetEditors(selVer,cur.filter(x=>x!==e))}
                    style={{padding:"4px 10px",borderRadius:7,border:"1px solid #3A0D1A",background:"none",cursor:"pointer",fontSize:12,color:"#E05C7A"}}>Revogar</button>
                </div>
              ))}
            </div>
          )}
          <div style={{borderTop:`1px solid ${BDR}`,paddingTop:14}}>
            <div style={{fontSize:13,color:TXM,marginBottom:8}}>Conceder acesso a <span style={{color:Y}}>{selVer}</span></div>
            <div style={{display:"flex",gap:8}}>
              <input type="text" placeholder="Nome exato do colaborador" value={newEd} onChange={e=>setNewEd(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")addEd();}}
                style={{flex:1,background:SUR,border:`1px solid ${BDR}`,color:TXT,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}/>
              <button onClick={addEd}
                style={{padding:"8px 16px",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:13,fontWeight:500,whiteSpace:"nowrap"}}>+ Conceder</button>
            </div>
          </div>
        </div>
      )}
      {tab==="versoes"&&(
        <div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {versoes.map(v=>(
              <div key={v} style={{display:"flex",alignItems:"center",gap:10,background:SUR,borderRadius:10,padding:"10px 14px",border:`1px solid ${BDR}`}}>
                <span style={{flex:1,fontSize:14,color:TXT,fontWeight:500}}>{v}</span>
                {versoes.length>1&&(
                  <button onClick={()=>onRemoveVersao(v)}
                    style={{padding:"4px 10px",borderRadius:7,border:"1px solid #3A0D1A",background:"none",cursor:"pointer",fontSize:12,color:"#E05C7A"}}>Remover</button>
                )}
              </div>
            ))}
          </div>
          <div style={{borderTop:`1px solid ${BDR}`,paddingTop:14}}>
            <div style={{fontSize:13,color:TXM,marginBottom:8}}>Adicionar nova versão/turno</div>
            <div style={{display:"flex",gap:8}}>
              <input type="text" placeholder="Ex: T3, T4..." value={newVer} onChange={e=>setNewVer(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter")addVer();}}
                style={{flex:1,background:SUR,border:`1px solid ${BDR}`,color:TXT,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}/>
              <button onClick={addVer}
                style={{padding:"8px 16px",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:13,fontWeight:500}}>+ Adicionar</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end",marginTop:22}}>
        <button onClick={onClose} style={{padding:"8px 22px",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:14,fontWeight:500}}>Fechar</button>
      </div>
    </ModalWrap>
  );
}

/* ── ADD REP MODAL ── */
function AddRepModal({versao,secao,tipo,onAdd,onClose}){
  const [name,setName]=useState("");
  const [re,setRe]=useState("");
  const [admissao,setAdmissao]=useState("");
  const [cargo,setCargo]=useState("");
  const [escala,setEscala]=useState("");
  return(
    <ModalWrap onClose={onClose} width={400}>
      <div style={{fontSize:15,fontWeight:500,marginBottom:16,color:TXT}}>Adicionar rep · {versao}/{secao}/{tipo}</div>
      {[["Nome *","text",name,setName,"Ex: JOÃO SILVA"],["Matrícula (RE)","text",re,setRe,"RE"],["Cargo","text",cargo,setCargo,"Rep 1"]].map(([lbl,tp,val,set,ph])=>(
        <div key={lbl} style={{marginBottom:12}}>
          <label style={{fontSize:12,color:TXM,display:"block",marginBottom:4}}>{lbl}</label>
          <input type={tp} placeholder={ph} value={val} onChange={e=>set(e.target.value)}
            style={{width:"100%",boxSizing:"border-box",background:SUR,border:`1px solid ${BDR}`,color:TXT,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}/>
        </div>
      ))}
      <div style={{display:"flex",gap:12,marginBottom:12}}>
        <div style={{flex:1}}>
          <label style={{fontSize:12,color:TXM,display:"block",marginBottom:4}}>Escala</label>
          <select value={escala} onChange={e=>setEscala(e.target.value)}
            style={{width:"100%",background:SUR,border:`1px solid ${BDR}`,color:TXT,borderRadius:8,padding:"8px 12px",fontSize:13}}>
            <option value="">—</option>
            {["A","B","C","D"].map(x=><option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div style={{flex:1}}>
          <label style={{fontSize:12,color:TXM,display:"block",marginBottom:4}}>Admissão</label>
          <input type="date" value={admissao} onChange={e=>setAdmissao(e.target.value)}
            style={{width:"100%",boxSizing:"border-box",background:SUR,border:`1px solid ${BDR}`,color:TXT,borderRadius:8,padding:"8px 12px",fontSize:13,colorScheme:"dark"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}>
        <button onClick={onClose} style={{padding:"8px 20px",borderRadius:8,border:`1px solid ${BDR}`,background:"none",cursor:"pointer",fontSize:14,color:TXM}}>Cancelar</button>
        <button onClick={()=>{if(name.trim()){onAdd(name.trim().toUpperCase(),{re,admissao,cargo,escala});onClose();}}}
          style={{padding:"8px 20px",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:14,fontWeight:500}}>Adicionar</button>
      </div>
    </ModalWrap>
  );
}

/* ── IMPORT CSV MODAL ── */
function ImportModal({versao,secao,tipo,onImport,onClose}){
  const [step,setStep]=useState("upload");
  const [headers,setHeaders]=useState([]);
  const [rows,setRows]=useState([]);
  const [map,setMap]=useState({rep:"",...Object.fromEntries(TAREFAS[tipo].map(t=>[t,""]))});
  const [preview,setPreview]=useState([]);
  const [err,setErr]=useState("");
  const fileRef=useRef();
  function parseCSV(txt){
    const lines=txt.trim().split("\n").map(l=>l.split(/[,;|\t]/));
    return{heads:lines[0].map(h=>h.trim().replace(/^"|"$/g,"")),data:lines.slice(1).map(r=>r.map(c=>c.trim().replace(/^"|"$/g,"")))};
  }
  function handleFile(f){
    setErr("");
    if(!f.name.endsWith(".csv")){setErr("Use .csv");return;}
    const r=new FileReader();
    r.onload=e=>{try{const{heads,data}=parseCSV(e.target.result);setHeaders(heads);setRows(data);setMap({rep:heads[0]||"",...Object.fromEntries(TAREFAS[tipo].map(t=>[t,""]))});setStep("map");}catch{setErr("Erro ao ler CSV.");}};
    r.readAsText(f);
  }
  function buildPreview(){
    if(!map.rep){setErr("Selecione coluna de nomes.");return;}
    const result=[];
    rows.forEach(row=>{
      const name=row[headers.indexOf(map.rep)]?.trim();
      if(!name)return;
      const vals={};
      TAREFAS[tipo].forEach(t=>{const raw=map[t]?row[headers.indexOf(map[t])]:"";const n=parseFloat(raw);vals[t]=isNaN(n)?0:Math.min(100,Math.max(0,Math.round(n)));});
      result.push({name,vals});
    });
    if(!result.length){setErr("Nenhum dado.");return;}
    setPreview(result);setErr("");setStep("preview");
  }
  return(
    <ModalWrap onClose={onClose} width={520}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <div>
          <div style={{fontSize:15,fontWeight:500,color:TXT}}>Importar CSV · {versao}/{secao}/{tipo}</div>
          <div style={{fontSize:12,color:TXM}}>Importe reps de um arquivo .csv</div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:TXM}}>×</button>
      </div>
      {err&&<div style={{background:"#3A0D1A",color:"#E05C7A",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:14}}>{err}</div>}
      {step==="upload"&&(
        <div onDrop={e=>{e.preventDefault();if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);}} onDragOver={e=>e.preventDefault()}
          style={{border:`2px dashed ${BDR}`,borderRadius:12,padding:"36px 20px",textAlign:"center",cursor:"pointer"}}
          onClick={()=>fileRef.current?.click()}
          onMouseEnter={e=>e.currentTarget.style.borderColor=Y} onMouseLeave={e=>e.currentTarget.style.borderColor=BDR}>
          <div style={{fontSize:32,marginBottom:8}}>📂</div>
          <div style={{fontSize:14,color:TXT,marginBottom:4}}>Arraste ou clique</div>
          <div style={{fontSize:12,color:TXM}}>Suporta .csv</div>
          <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>{if(e.target.files[0])handleFile(e.target.files[0]);}}/>
        </div>
      )}
      {step==="map"&&(
        <div>
          <div style={{fontSize:13,color:TXM,marginBottom:12}}>{rows.length} linhas. Mapeie as colunas.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:SUR,borderRadius:8,border:`1px solid ${Y}`}}>
              <span style={{fontSize:13,color:Y,fontWeight:500,width:110,flexShrink:0}}>Nome *</span>
              <select value={map.rep} onChange={e=>setMap(m=>({...m,rep:e.target.value}))}
                style={{flex:1,background:SUR2,border:`1px solid ${BDR}`,color:TXT,borderRadius:6,padding:"6px 10px",fontSize:13}}>
                <option value="">— selecionar —</option>
                {headers.map(h=><option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {TAREFAS[tipo].map(t=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:SUR,borderRadius:8}}>
                <div style={{width:8,height:8,borderRadius:2,background:TASK_COLORS[t],flexShrink:0}}/>
                <span style={{fontSize:13,color:TXT,width:110,flexShrink:0}}>{t}</span>
                <select value={map[t]} onChange={e=>setMap(m=>({...m,[t]:e.target.value}))}
                  style={{flex:1,background:SUR2,border:`1px solid ${BDR}`,color:TXT,borderRadius:6,padding:"6px 10px",fontSize:13}}>
                  <option value="">— ignorar —</option>
                  {headers.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
            <button onClick={()=>setStep("upload")} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${BDR}`,background:"none",cursor:"pointer",fontSize:14,color:TXM}}>Voltar</button>
            <button onClick={buildPreview} style={{padding:"8px 18px",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:14,fontWeight:500}}>Pré-visualizar</button>
          </div>
        </div>
      )}
      {step==="preview"&&(
        <div>
          <div style={{fontSize:13,color:TXM,marginBottom:12}}>{preview.length} reps.</div>
          <div style={{maxHeight:240,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
            {preview.map(({name,vals})=>(
              <div key={name} style={{background:SUR,borderRadius:10,padding:"10px 12px",border:`1px solid ${BDR}`}}>
                <div style={{fontSize:13,fontWeight:500,color:TXT,marginBottom:6}}>{name}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {TAREFAS[tipo].map(t=>(
                    <span key={t} style={{fontSize:11,background:TASK_DIM[t],color:TASK_COLORS[t],borderRadius:20,padding:"2px 7px"}}>{t}: {vals[t]}%</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",gap:10,marginTop:16,justifyContent:"flex-end"}}>
            <button onClick={()=>setStep("map")} style={{padding:"8px 18px",borderRadius:8,border:`1px solid ${BDR}`,background:"none",cursor:"pointer",fontSize:14,color:TXM}}>Voltar</button>
            <button onClick={()=>{onImport(preview);onClose();}}
              style={{padding:"8px 18px",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:14,fontWeight:500}}>Importar {preview.length}</button>
          </div>
        </div>
      )}
    </ModalWrap>
  );
}

/* ── RadialProgress ── */
function RadialProgress({pct,color=Y,size=48}){
  const r=size/2-5,circ=2*Math.PI*r,dash=(pct/100)*circ;
  return(
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BDR} strokeWidth={4}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{transition:"stroke-dasharray 0.5s ease"}}/>
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={size<44?10:11} fontWeight={500} fill={TXT}>{pct}%</text>
    </svg>
  );
}

function StatusBadge({pct}){
  if(pct===100) return <span style={{fontSize:11,background:"#003A1E",color:"#3EC97A",borderRadius:20,padding:"2px 8px",fontWeight:500}}>Ótimo</span>;
  if(pct>=75)   return <span style={{fontSize:11,background:"#1A2E00",color:"#8ED64A",borderRadius:20,padding:"2px 8px",fontWeight:500}}>Bom</span>;
  if(pct>=50)   return <span style={{fontSize:11,background:"#3A1C00",color:"#E8833A",borderRadius:20,padding:"2px 8px",fontWeight:500}}>Regular</span>;
  return <span style={{fontSize:11,background:"#1A1A3A",color:"#7A9CF0",borderRadius:20,padding:"2px 8px",fontWeight:500}}>Aprendendo</span>;
}

/* ── REP CARD (performance) ── */
function RepCard({rep,values,tipo,onUpdate,onRemove,canEdit}){
  const [expanded,setExpanded]=useState(false);
  const a=repAvg(values,tipo);
  const tarefas=TAREFAS[tipo];
  const initials=rep.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const hue=(rep.charCodeAt(0)*37+(rep.charCodeAt(rep.length-1)||0)*17)%360;

  function liveUpdate(field,val){onUpdate(rep,{...values,[field]:val});}

  const ferias = values.feriasIni && values.feriasFim
    ? `${values.feriasIni} → ${values.feriasFim} (${values.feriasDias||0}d)`
    : null;

  return(
    <div style={{background:SUR,border:`1px solid ${expanded?Y+"55":BDR}`,borderRadius:16,padding:18,display:"flex",flexDirection:"column",gap:12,transition:"border-color 0.2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:`hsla(${hue},60%,18%,1)`,border:`1.5px solid hsla(${hue},60%,45%,0.6)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:`hsl(${hue},80%,75%)`,flexShrink:0}}>{initials}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:500,color:TXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:2}}>{rep}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:2}}>
            {values.re&&<span style={{fontSize:10,color:TXM}}>RE {values.re}</span>}
            {values.cargo&&<span style={{fontSize:10,background:SUR2,color:TXM,borderRadius:4,padding:"1px 5px"}}>{values.cargo}</span>}
            {values.escala&&<span style={{fontSize:10,background:"#1A2000",color:"#8ED64A",borderRadius:4,padding:"1px 5px"}}>Esc {values.escala}</span>}
          </div>
          {tempoDeCasa(values.admissao)&&<div style={{fontSize:10,color:TXM}}>🕐 {tempoDeCasa(values.admissao)}</div>}
          {ferias&&<div style={{fontSize:10,color:"#3EC9C4",marginTop:2}}>🏖 Férias: {ferias}</div>}
          <StatusBadge pct={a}/>
        </div>
        <RadialProgress pct={a} color={Y} size={46}/>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {tarefas.map(t=>{
          const v=values[t]??0;
          return(
            <div key={t} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:7,height:7,borderRadius:2,background:TASK_COLORS[t],flexShrink:0}}/>
              <span style={{fontSize:11,color:TXM,width:100,flexShrink:0}}>{t}</span>
              <div style={{flex:1,height:5,background:TASK_DIM[t],borderRadius:10,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${v}%`,background:TASK_COLORS[t],borderRadius:10,transition:"width 0.3s"}}/>
              </div>
              <span style={{fontSize:11,fontWeight:500,color:TASK_COLORS[t],width:32,textAlign:"right"}}>{v}%</span>
            </div>
          );
        })}
      </div>

      {canEdit&&expanded&&(
        <div style={{borderTop:`1px solid ${BDR}`,paddingTop:12,display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["Admissão","date","admissao"],["RE","text","re"],["Cargo","text","cargo"],["Escala","text","escala"],["Telefone","tel","telefone"],["CPF","text","cpf"]].map(([lbl,tp,fld])=>(
              <div key={fld}>
                <label style={{fontSize:10,color:TXM,display:"block",marginBottom:3}}>{lbl}</label>
                <input type={tp} value={values[fld]||""} onChange={e=>liveUpdate(fld,e.target.value)}
                  style={{width:"100%",boxSizing:"border-box",background:SUR2,border:`1px solid ${BDR}`,color:TXT,borderRadius:6,padding:"5px 8px",fontSize:12,colorScheme:"dark"}}/>
              </div>
            ))}
          </div>
          <div>
            <label style={{fontSize:10,color:TXM,display:"block",marginBottom:3}}>Contato de emergência</label>
            <input type="text" value={values.contEmer||""} onChange={e=>liveUpdate("contEmer",e.target.value)}
              style={{width:"100%",boxSizing:"border-box",background:SUR2,border:`1px solid ${BDR}`,color:TXT,borderRadius:6,padding:"5px 8px",fontSize:12}}/>
          </div>
          <div>
            <label style={{fontSize:10,color:TXM,display:"block",marginBottom:3}}>Endereço</label>
            <input type="text" value={values.endereco||""} onChange={e=>liveUpdate("endereco",e.target.value)}
              style={{width:"100%",boxSizing:"border-box",background:SUR2,border:`1px solid ${BDR}`,color:TXT,borderRadius:6,padding:"5px 8px",fontSize:12}}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px",gap:8}}>
            {[["Início Férias","feriasIni"],["Fim Férias","feriasFim"]].map(([lbl,fld])=>(
              <div key={fld}>
                <label style={{fontSize:10,color:TXM,display:"block",marginBottom:3}}>{lbl}</label>
                <input type="date" value={values[fld]||""} onChange={e=>liveUpdate(fld,e.target.value)}
                  style={{width:"100%",boxSizing:"border-box",background:SUR2,border:`1px solid ${BDR}`,color:TXT,borderRadius:6,padding:"5px 8px",fontSize:12,colorScheme:"dark"}}/>
              </div>
            ))}
            <div>
              <label style={{fontSize:10,color:TXM,display:"block",marginBottom:3}}>Dias</label>
              <input type="number" value={values.feriasDias||0} onChange={e=>liveUpdate("feriasDias",Number(e.target.value))}
                style={{width:"100%",boxSizing:"border-box",background:SUR2,border:`1px solid ${BDR}`,color:TXT,borderRadius:6,padding:"5px 8px",fontSize:12}}/>
            </div>
          </div>
          <div style={{borderTop:`1px solid ${BDR}`,paddingTop:10}}>
            {tarefas.map(t=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <div style={{width:8,height:8,borderRadius:2,background:TASK_COLORS[t],flexShrink:0}}/>
                <span style={{fontSize:12,color:TXT,width:100,flexShrink:0}}>{t}</span>
                <button onClick={()=>liveUpdate(t,Math.max(0,(values[t]??0)-25))}
                  style={{width:26,height:26,borderRadius:6,border:`1px solid ${BDR}`,background:SUR2,color:TXM,cursor:"pointer",fontSize:15,lineHeight:1,flexShrink:0}}>−</button>
                <input type="range" min={0} max={100} step={25} value={values[t]??0} onChange={e=>liveUpdate(t,Number(e.target.value))}
                  style={{flex:1,accentColor:Y}}/>
                <button onClick={()=>liveUpdate(t,Math.min(100,(values[t]??0)+25))}
                  style={{width:26,height:26,borderRadius:6,border:`1px solid ${BDR}`,background:SUR2,color:TXM,cursor:"pointer",fontSize:15,lineHeight:1,flexShrink:0}}>+</button>
                <span style={{fontSize:12,fontWeight:500,color:Y,width:34,textAlign:"right"}}>{values[t]??0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {canEdit&&(
        <div style={{display:"flex",gap:8,borderTop:`1px solid ${BDR}`,paddingTop:10}}>
          <button onClick={()=>setExpanded(e=>!e)}
            style={{flex:1,padding:"7px 0",borderRadius:8,border:`1px solid ${expanded?Y+"66":BDR}`,background:expanded?"#1A1400":"none",cursor:"pointer",fontSize:12,color:expanded?Y:TXM,transition:"all 0.2s"}}>
            {expanded?"✓ Concluir":"Editar"}
          </button>
          <button onClick={()=>onRemove(rep)}
            style={{padding:"7px 14px",borderRadius:8,border:"1px solid #3A0D1A",background:"none",cursor:"pointer",fontSize:12,color:"#E05C7A"}}>Remover</button>
        </div>
      )}
    </div>
  );
}

/* ── FICHA CARD (Fichas PS) ── */
function FichaCard({item,canEdit,onRemove}){
  const [expanded,setExpanded]=useState(false);
  const hue=(item.name.charCodeAt(0)*37+(item.name.charCodeAt(item.name.length-1)||0)*17)%360;
  const initials=item.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const ferias=item.feriasIni&&item.feriasFim?`${item.feriasIni} → ${item.feriasFim} (${item.feriasDias||0}d)`:null;
  return(
    <div style={{background:SUR,border:`1px solid ${expanded?Y+"55":BDR}`,borderRadius:16,padding:18,display:"flex",flexDirection:"column",gap:10,transition:"border-color 0.2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:`hsla(${hue},50%,18%,1)`,border:`1.5px solid hsla(${hue},50%,45%,0.6)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:`hsl(${hue},70%,75%)`,flexShrink:0}}>{initials}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:500,color:TXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{item.name}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:3}}>
            {item.re&&<span style={{fontSize:10,color:TXM}}>RE {item.re}</span>}
            {item.area&&<span style={{fontSize:10,background:SUR2,color:TXM,borderRadius:4,padding:"1px 5px"}}>{item.area}</span>}
            {item.escala&&<span style={{fontSize:10,background:"#1A2000",color:"#8ED64A",borderRadius:4,padding:"1px 5px"}}>Esc {item.escala}</span>}
          </div>
          {tempoDeCasa(item.admissao)&&<div style={{fontSize:10,color:TXM,marginTop:2}}>🕐 {tempoDeCasa(item.admissao)}</div>}
          {ferias&&<div style={{fontSize:10,color:"#3EC9C4",marginTop:2}}>🏖 Férias: {ferias}</div>}
        </div>
      </div>
      {expanded&&(
        <div style={{borderTop:`1px solid ${BDR}`,paddingTop:10,display:"flex",flexDirection:"column",gap:6}}>
          {[["LDAP",item.ldap],["CPF",item.cpf],["Telefone",item.telefone],["Emergência",item.contEmer],["Endereço",item.endereco]].map(([lbl,val])=>val?(
            <div key={lbl} style={{display:"flex",gap:8}}>
              <span style={{fontSize:11,color:TXM,width:80,flexShrink:0}}>{lbl}</span>
              <span style={{fontSize:11,color:TXT}}>{val}</span>
            </div>
          ):null)}
        </div>
      )}
      <div style={{display:"flex",gap:8,borderTop:`1px solid ${BDR}`,paddingTop:8}}>
        <button onClick={()=>setExpanded(e=>!e)}
          style={{flex:1,padding:"6px 0",borderRadius:8,border:`1px solid ${expanded?Y+"66":BDR}`,background:expanded?"#1A1400":"none",cursor:"pointer",fontSize:12,color:expanded?Y:TXM}}>
          {expanded?"✕ Fechar":"Ver detalhes"}
        </button>
        {canEdit&&<button onClick={()=>onRemove(item.id)}
          style={{padding:"6px 12px",borderRadius:8,border:"1px solid #3A0D1A",background:"none",cursor:"pointer",fontSize:12,color:"#E05C7A"}}>Remover</button>}
      </div>
    </div>
  );
}

/* ── TREINAMENTO CARD ── */
function TrCard({person,canEdit,onToggle}){
  const [expanded,setExpanded]=useState(false);
  const trainings=person.trainings||[];
  const done=trainings.filter(t=>t.done).length;
  const pct=trainings.length?Math.round((done/trainings.length)*100):0;
  const hue=(person.name.charCodeAt(0)*37+(person.name.charCodeAt(person.name.length-1)||0)*17)%360;
  const initials=person.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  return(
    <div style={{background:SUR,border:`1px solid ${expanded?Y+"55":BDR}`,borderRadius:16,padding:18,display:"flex",flexDirection:"column",gap:10,transition:"border-color 0.2s"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:40,height:40,borderRadius:"50%",background:`hsla(${hue},50%,18%,1)`,border:`1.5px solid hsla(${hue},50%,45%,0.6)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:500,color:`hsl(${hue},70%,75%)`,flexShrink:0}}>{initials}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:13,fontWeight:500,color:TXT,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{person.name}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:3}}>
            {person.role&&<span style={{fontSize:10,background:SUR2,color:TXM,borderRadius:4,padding:"1px 5px"}}>{person.role}</span>}
            {tempoDeCasa(person.admission)&&<span style={{fontSize:10,color:TXM}}>🕐 {tempoDeCasa(person.admission)}</span>}
          </div>
          <div style={{marginTop:4}}>
            <div style={{height:4,background:TASK_DIM["CONTAGEM"],borderRadius:10,overflow:"hidden",width:"100%"}}>
              <div style={{height:"100%",width:`${pct}%`,background:"#3EC97A",borderRadius:10,transition:"width 0.3s"}}/>
            </div>
            <span style={{fontSize:10,color:"#3EC97A",marginTop:2,display:"block"}}>{done}/{trainings.length} treinamentos · {pct}%</span>
          </div>
        </div>
        <RadialProgress pct={pct} color="#3EC97A" size={46}/>
      </div>
      {expanded&&trainings.length>0&&(
        <div style={{borderTop:`1px solid ${BDR}`,paddingTop:10,display:"flex",flexDirection:"column",gap:6}}>
          {trainings.map(tr=>(
            <div key={tr.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",background:SUR2,borderRadius:8}}>
              <div style={{width:16,height:16,borderRadius:4,border:`1.5px solid ${tr.done?"#3EC97A":BDR}`,background:tr.done?"#003A1E":"none",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,cursor:canEdit?"pointer":"default"}}
                onClick={()=>canEdit&&onToggle(person.id,tr.id,!tr.done)}>
                {tr.done&&<span style={{fontSize:10,color:"#3EC97A"}}>✓</span>}
              </div>
              <span style={{flex:1,fontSize:12,color:tr.done?TXM:TXT,textDecoration:tr.done?"line-through":"none"}}>{tr.name}</span>
              {tr.doneDate&&<span style={{fontSize:10,color:TXM}}>{tr.doneDate}</span>}
            </div>
          ))}
        </div>
      )}
      <button onClick={()=>setExpanded(e=>!e)}
        style={{padding:"6px 0",borderRadius:8,border:`1px solid ${expanded?Y+"66":BDR}`,background:expanded?"#1A1400":"none",cursor:"pointer",fontSize:12,color:expanded?Y:TXM}}>
        {expanded?"✕ Fechar":`Ver ${trainings.length} treinamentos`}
      </button>
    </div>
  );
}

/* ── SUMMARY BAR (performance) ── */
function SummaryBar({repsData,tipo}){
  const tarefas=TAREFAS[tipo];
  const all=Object.values(repsData);
  const taskAvgs=tarefas.map(t=>({task:t,a:all.length>0?avg(all.map(r=>r[t]??0)):0}));
  const overall=avg(taskAvgs.map(x=>x.a));
  return(
    <div style={{background:SUR,border:`1px solid ${BDR}`,borderRadius:16,padding:18,marginBottom:18,display:"flex",flexWrap:"wrap",gap:14,alignItems:"center"}}>
      <div style={{minWidth:100,textAlign:"center",paddingRight:14,borderRight:`1px solid ${BDR}`}}>
        <div style={{fontSize:34,fontWeight:500,color:Y,lineHeight:1}}>{overall}%</div>
        <div style={{fontSize:12,color:TXM,marginTop:4}}>média</div>
        <div style={{fontSize:12,color:TXM}}>{all.length} rep{all.length!==1?"s":""}</div>
      </div>
      <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:8}}>
        {taskAvgs.map(({task,a})=>(
          <div key={task} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,minWidth:52}}>
            <RadialProgress pct={a} color={TASK_COLORS[task]} size={42}/>
            <span style={{fontSize:10,color:TXM,textAlign:"center",maxWidth:64,lineHeight:1.3}}>{task}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── APP ── */
export default function App(){
  const [versoes,setVersoes]=useState(()=>loadState("icqa2_versoes",["T1","T2"]));
  const [data,setData]=useState(()=>loadState("icqa2_data",null)||{T1:makeEmptySecoes(),T2:makeT2WithStaticData()});
  const [editors,setEditors]=useState(()=>loadState("icqa2_editors",{}));
  const [currentUser,setCurrentUser]=useState(()=>loadState("icqa2_user",null));
  const [sbLoading,setSbLoading]=useState(true);
  const [sbErr,setSbErr]=useState(null);

  const [activeVer,setActiveVer]=useState(()=>{
    const s=loadState("icqa2_versoes",["T1","T2"]);
    return s.includes("T2")?"T2":s[0];
  });
  const [activeSec,setActiveSec]=useState(SECOES[0]);
  const [activeTipo,setActiveTipo]=useState("IC");
  const [search,setSearch]=useState("");
  const [showLogin,setShowLogin]=useState(false);
  const [showAdmin,setShowAdmin]=useState(false);
  const [showAdd,setShowAdd]=useState(false);
  const [showImport,setShowImport]=useState(false);

  /* Load from Supabase on mount */
  useEffect(()=>{
    async function load(){
      try{
        const [rTr,rPs,rTrs]=await Promise.all([
          sb.from("tracker").select("*").eq("id","main").single(),
          sb.from("ps_data").select("*").eq("id","main").single(),
          sb.from("tr_state").select("*").eq("id","main").single(),
        ]);
        if(rTr.error||rPs.error||rTrs.error) throw new Error("query error");
        const tr=rTr.data; const ps=rPs.data; const trs=rTrs.data;
        const trackerRaw=tr?.data?.data?.IC ? tr.data.data : (tr?.data?.IC ? tr.data : tr);
        const psList=ps?.data?.list ?? ps?.list ?? null;
        const trsData=trs?.data?.data ?? trs?.data ?? trs;
        setData(d=>{
          const t2={...d["T2"]};
          if(trackerRaw?.IC) t2["Desenvolvimento"]=fromTracker(trackerRaw);
          if(psList) t2["Fichas PS"]={list:psList};
          if(trsData) t2["Treinamentos"]={data:trsData};
          return{...d,T2:t2};
        });
      }catch(e){
        /* Supabase unreachable (e.g. network policy) — static data already loaded */
      }finally{
        setSbLoading(false);
      }
    }
    load();
  },[]);

  /* Persist to localStorage */
  useEffect(()=>{saveState("icqa2_versoes",versoes);},[versoes]);
  useEffect(()=>{saveState("icqa2_data",data);},[data]);
  useEffect(()=>{saveState("icqa2_editors",editors);},[editors]);
  useEffect(()=>{saveState("icqa2_user",currentUser);},[currentUser]);

  const isCreator=currentUser?.isCreator===true;
  const canEdit=isCreator||(currentUser&&(editors[activeVer]||[]).includes(currentUser.name));

  const secTipo=SECAO_TIPO[activeSec];
  const secData=data?.[activeVer]?.[activeSec]||{};
  const repsData=secTipo==="performance"?(secData[activeTipo]||{}):{};
  const repList=Object.keys(repsData).filter(r=>r.toLowerCase().includes(search.toLowerCase()));

  /* Save Desenvolvimento to Supabase */
  const saveTrackerToSb=useCallback(async(newData)=>{
    if(activeVer!=="T2") return;
    try{
      const payload={IC:newData["IC"]||{},QA:newData["QA"]||{},
        tarefasStd:TAREFAS.IC,tarefasQA:TAREFAS.QA,
        tarefasPorTurno:{IC:TAREFAS.IC,QA:TAREFAS.QA},
        turnos:["IC","QA"],qaSheets:["QA"],updated_at:Date.now()};
      await sb.from("tracker").update({data:payload}).eq("id","main");
    }catch{}
  },[activeVer]);

  /* counts */
  function countTipo(ver,sec,tipo){return Object.keys(data?.[ver]?.[sec]?.[tipo]||{}).length;}
  function countSec(ver,sec){
    const sd=data?.[ver]?.[sec]||{};
    const t=SECAO_TIPO[sec];
    if(t==="performance") return REP_TIPOS.reduce((s,tp)=>s+countTipo(ver,sec,tp),0);
    if(t==="fichas") return (sd.list||[]).length;
    if(t==="treinamentos") return Object.keys(sd.data||{}).length;
    return 0;
  }

  /* mutations */
  const handleUpdate=useCallback((ver,sec,tipo,rep,vals)=>{
    setData(d=>{
      const updated={...d,[ver]:{...d[ver],[sec]:{...d[ver][sec],[tipo]:{...d[ver][sec][tipo],[rep]:vals}}}};
      if(ver==="T2"&&sec==="Desenvolvimento") saveTrackerToSb(updated["T2"]["Desenvolvimento"]);
      return updated;
    });
  },[saveTrackerToSb]);

  const handleRemove=useCallback((ver,sec,tipo,rep)=>{
    setData(d=>{
      const u={...d[ver][sec][tipo]};delete u[rep];
      const updated={...d,[ver]:{...d[ver],[sec]:{...d[ver][sec],[tipo]:u}}};
      if(ver==="T2"&&sec==="Desenvolvimento") saveTrackerToSb(updated["T2"]["Desenvolvimento"]);
      return updated;
    });
  },[saveTrackerToSb]);

  const handleAdd=useCallback((ver,sec,tipo,name,extra={})=>{
    setData(d=>{
      if(d?.[ver]?.[sec]?.[tipo]?.[name]) return d;
      const tasks=Object.fromEntries(TAREFAS[tipo].map(t=>[t,0]));
      const vals={re:"",cpf:"",ldap:"",cargo:"",escala:"",admissao:"",contEmer:"",endereco:"",telefone:"",feriasFim:"",feriasIni:"",feriasDias:0,...extra,...tasks};
      const updated={...d,[ver]:{...d[ver],[sec]:{...d[ver][sec],[tipo]:{...d[ver][sec][tipo],[name]:vals}}}};
      if(ver==="T2"&&sec==="Desenvolvimento") saveTrackerToSb(updated["T2"]["Desenvolvimento"]);
      return updated;
    });
  },[saveTrackerToSb]);

  const handleImport=useCallback((ver,sec,tipo,records)=>{
    setData(d=>{
      const updated2={...(d?.[ver]?.[sec]?.[tipo]||{})};
      records.forEach(({name,vals})=>{
        const base={re:"",cpf:"",ldap:"",cargo:"",escala:"",admissao:"",contEmer:"",endereco:"",telefone:"",feriasFim:"",feriasIni:"",feriasDias:0};
        updated2[name]={...base,...vals};
      });
      const updated={...d,[ver]:{...d[ver],[sec]:{...d[ver][sec],[tipo]:updated2}}};
      if(ver==="T2"&&sec==="Desenvolvimento") saveTrackerToSb(updated["T2"]["Desenvolvimento"]);
      return updated;
    });
  },[saveTrackerToSb]);

  const handleAddVersao=useCallback((name)=>{
    setVersoes(v=>[...v,name]);
    setData(d=>({...d,[name]:makeEmptySecoes()}));
  },[]);

  const handleRemoveVersao=useCallback((name)=>{
    const nv=versoes.filter(v=>v!==name);
    setVersoes(nv);
    setData(d=>{const u={...d};delete u[name];return u;});
    setEditors(e=>{const u={...e};delete u[name];return u;});
    if(activeVer===name) setActiveVer(nv[0]);
  },[versoes,activeVer]);

  const handleSetEditors=useCallback((ver,list)=>{setEditors(e=>({...e,[ver]:list}));},[]);

  /* Treinamentos toggle */
  const handleTrToggle=useCallback((personId,trainId,done)=>{
    setData(d=>{
      const trData={...d[activeVer]["Treinamentos"].data};
      const person={...trData[personId]};
      person.trainings=person.trainings.map(t=>t.id===trainId?{...t,done,doneDate:done?new Date().toISOString().slice(0,10):""}:t);
      trData[personId]=person;
      return{...d,[activeVer]:{...d[activeVer],"Treinamentos":{data:trData}}};
    });
  },[activeVer]);

  /* Fichas remove */
  const handleFichaRemove=useCallback((id)=>{
    setData(d=>{
      const list=(d[activeVer]["Fichas PS"].list||[]).filter(x=>x.id!==id);
      return{...d,[activeVer]:{...d[activeVer],"Fichas PS":{list}}};
    });
  },[activeVer]);

  const tabStyle=(active)=>({
    padding:"10px 20px",border:"none",whiteSpace:"nowrap",cursor:"pointer",fontSize:14,
    borderBottom:active?`2px solid ${Y}`:"2px solid transparent",
    background:"none",fontWeight:active?500:400,color:active?Y:TXM,transition:"color 0.2s",
  });

  const fichaList=(secData.list||[]).filter(x=>x.name?.toLowerCase().includes(search.toLowerCase()));
  const trList=Object.entries(secData.data||{}).filter(([,p])=>p.name?.toLowerCase().includes(search.toLowerCase()));

  return(
    <div style={{background:BG,minHeight:"100vh",paddingBottom:44,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* HEADER */}
      <div style={{borderBottom:`1px solid ${BDR}`,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{padding:"16px 0"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,background:Y,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:14,fontWeight:700,color:"#000"}}>IQ</span>
            </div>
            <span style={{fontSize:18,fontWeight:500,color:TXT}}>ICQA Tracker</span>
            {sbLoading&&<span style={{fontSize:11,color:TXM,background:SUR,borderRadius:20,padding:"2px 8px"}}>⟳ carregando</span>}
            {sbErr&&<span style={{fontSize:11,color:"#E05C7A",background:"#3A0D1A",borderRadius:20,padding:"2px 8px"}}>{sbErr}</span>}
          </div>
          <div style={{fontSize:12,color:TXM,marginTop:2,marginLeft:38}}>Acompanhe o desempenho por turno, seção e tipo</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isCreator&&(
            <button onClick={()=>setShowAdmin(true)}
              style={{padding:"7px 14px",borderRadius:8,border:"1px solid #20103A",background:"#20103A",color:"#A47CF0",cursor:"pointer",fontSize:12,fontWeight:500}}>
              ⚙ Admin
            </button>
          )}
          {currentUser?(
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:12,color:TXT,fontWeight:500}}>{currentUser.name}</div>
                <div style={{fontSize:11,color:isCreator?Y:canEdit?"#3EC97A":TXM}}>
                  {isCreator?"Criadora":canEdit?`Editor · ${activeVer}`:"Visualizador"}
                </div>
              </div>
              <button onClick={()=>setCurrentUser(null)} title="Sair"
                style={{width:30,height:30,borderRadius:"50%",border:`1px solid ${BDR}`,background:"none",cursor:"pointer",fontSize:13,color:TXM}}>↩</button>
            </div>
          ):(
            <button onClick={()=>setShowLogin(true)}
              style={{padding:"8px 16px",borderRadius:8,border:`1px solid ${BDR}`,background:"none",color:TXM,cursor:"pointer",fontSize:13}}>Entrar</button>
          )}
        </div>
      </div>

      {/* TURNOS */}
      <div style={{borderBottom:`1px solid ${BDR}`,padding:"0 24px",display:"flex",alignItems:"center",background:"#111"}}>
        <div style={{fontSize:11,color:TXM,marginRight:14,letterSpacing:"0.5px",textTransform:"uppercase",flexShrink:0}}>Turno</div>
        <div style={{display:"flex",flex:1,overflowX:"auto"}}>
          {versoes.map(v=>(
            <button key={v} onClick={()=>{setActiveVer(v);setSearch("");}}
              style={{...tabStyle(activeVer===v),display:"flex",alignItems:"center",gap:6}}>
              {v}
              <span style={{fontSize:10,borderRadius:4,padding:"1px 5px",fontWeight:600,
                background:activeVer===v?"#1A1400":SUR,color:activeVer===v?Y:TXM,
                border:`1px solid ${activeVer===v?Y+"44":BDR}`}}>
                {SECOES.reduce((s,sec)=>s+countSec(v,sec),0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* SEÇÕES */}
      <div style={{borderBottom:`1px solid ${BDR}`,padding:"0 24px",display:"flex",overflowX:"auto"}}>
        {SECOES.map(s=>(
          <button key={s} onClick={()=>{setActiveSec(s);setSearch("");}}
            style={{...tabStyle(activeSec===s),display:"flex",alignItems:"center",gap:6}}>
            <span>{SECAO_ICONS[s]}</span>{s}
            <span style={{fontSize:11,borderRadius:20,padding:"1px 7px",fontWeight:500,
              background:activeSec===s?"#3A2E00":SUR,color:activeSec===s?Y:TXM}}>
              {countSec(activeVer,s)}
            </span>
          </button>
        ))}
      </div>

      <div style={{padding:"16px 24px 0"}}>

        {/* IC/QA PILLS — only for performance sections */}
        {secTipo==="performance"&&(
          <div style={{display:"flex",gap:6,marginBottom:16}}>
            {REP_TIPOS.map(t=>(
              <button key={t} onClick={()=>{setActiveTipo(t);setSearch("");}}
                style={{padding:"6px 18px",borderRadius:20,cursor:"pointer",fontSize:13,fontWeight:500,
                  border:activeTipo===t?`1px solid ${Y}`:`1px solid ${BDR}`,
                  background:activeTipo===t?"#1A1400":"none",color:activeTipo===t?Y:TXM,transition:"all 0.2s"}}>
                {t}
                <span style={{marginLeft:6,fontSize:11,opacity:0.8}}>{countTipo(activeVer,activeSec,t)}</span>
              </button>
            ))}
          </div>
        )}

        {/* SEARCH + ACTIONS */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input type="text" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{maxWidth:220,background:SUR,border:`1px solid ${BDR}`,color:TXT,borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}/>
            {!currentUser&&(
              <button onClick={()=>setShowLogin(true)}
                style={{fontSize:12,color:TXM,background:SUR,borderRadius:8,padding:"5px 12px",border:`1px solid ${BDR}`,cursor:"pointer"}}>
                Entre para editar
              </button>
            )}
            {currentUser&&!canEdit&&(
              <span style={{fontSize:12,color:TXM,background:SUR,borderRadius:8,padding:"5px 12px",border:`1px solid ${BDR}`}}>👁 Visualização</span>
            )}
          </div>
          {canEdit&&secTipo==="performance"&&(
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setShowImport(true)}
                style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${BDR}`,background:"none",cursor:"pointer",fontSize:12,color:TXM}}>
                Importar CSV
              </button>
              <button onClick={()=>setShowAdd(true)}
                style={{padding:"7px 16px",borderRadius:8,border:"none",background:Y,color:"#000",cursor:"pointer",fontSize:13,fontWeight:500}}>
                + Adicionar rep
              </button>
            </div>
          )}
        </div>

        {/* ── PERFORMANCE SECTION ── */}
        {secTipo==="performance"&&(
          <>
            <SummaryBar repsData={repsData} tipo={activeTipo}/>
            {repList.length===0?(
              <div style={{textAlign:"center",padding:"48px 0",color:TXM,fontSize:14}}>
                {search?"Nenhum rep encontrado.":`Nenhum rep em ${activeVer}/${activeSec}/${activeTipo}.${canEdit?" Adicione ou importe CSV.":""}`}
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
                {repList.map(rep=>(
                  <RepCard key={rep} rep={rep} values={repsData[rep]} tipo={activeTipo}
                    onUpdate={(r,vals)=>handleUpdate(activeVer,activeSec,activeTipo,r,vals)}
                    onRemove={r=>handleRemove(activeVer,activeSec,activeTipo,r)}
                    canEdit={canEdit}/>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── FICHAS PS SECTION ── */}
        {secTipo==="fichas"&&(
          <>
            <div style={{background:SUR,border:`1px solid ${BDR}`,borderRadius:12,padding:"12px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28,fontWeight:500,color:Y}}>{fichaList.length}</div>
              <div style={{fontSize:13,color:TXM}}>fichas cadastradas</div>
            </div>
            {fichaList.length===0?(
              <div style={{textAlign:"center",padding:"48px 0",color:TXM,fontSize:14}}>
                {search?"Nenhuma ficha encontrada.":"Nenhuma ficha cadastrada."}
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
                {fichaList.map(item=>(
                  <FichaCard key={item.id} item={item} canEdit={canEdit} onRemove={handleFichaRemove}/>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TREINAMENTOS SECTION ── */}
        {secTipo==="treinamentos"&&(
          <>
            <div style={{background:SUR,border:`1px solid ${BDR}`,borderRadius:12,padding:"12px 18px",marginBottom:18,display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:28,fontWeight:500,color:"#3EC97A"}}>{trList.length}</div>
              <div style={{fontSize:13,color:TXM}}>colaboradores em treinamento</div>
            </div>
            {trList.length===0?(
              <div style={{textAlign:"center",padding:"48px 0",color:TXM,fontSize:14}}>
                {search?"Nenhum encontrado.":"Nenhum treinamento cadastrado."}
              </div>
            ):(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
                {trList.map(([id,person])=>(
                  <TrCard key={id} person={{...person,id}} canEdit={canEdit} onToggle={handleTrToggle}/>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      {/* BOTTOM BAR */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,height:36,background:SUR,borderTop:`1px solid ${BDR}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",zIndex:100}}>
        <div style={{fontSize:11,color:TXM,display:"flex",alignItems:"center",gap:6}}>
          <span style={{color:Y,fontWeight:600,letterSpacing:"0.5px"}}>{activeVer}</span>
          <span>·</span><span>{activeSec}</span>
          {secTipo==="performance"&&<><span>·</span><span>{activeTipo}</span></>}
          {canEdit&&<span style={{color:"#3EC97A",marginLeft:4}}>✓ editando</span>}
        </div>
        <div style={{fontSize:10,color:"#555",fontStyle:"italic",letterSpacing:"0.3px"}}>
          Criado por Melyssa Rangel de Figueiredo
        </div>
      </div>

      {/* MODALS */}
      {showLogin&&<LoginModal onLogin={setCurrentUser} onClose={()=>setShowLogin(false)}/>}
      {showAdmin&&isCreator&&(
        <AdminModal versoes={versoes} editors={editors}
          onSetEditors={handleSetEditors} onAddVersao={handleAddVersao}
          onRemoveVersao={handleRemoveVersao} onClose={()=>setShowAdmin(false)}/>
      )}
      {showAdd&&canEdit&&secTipo==="performance"&&(
        <AddRepModal versao={activeVer} secao={activeSec} tipo={activeTipo}
          onAdd={(name,extra)=>handleAdd(activeVer,activeSec,activeTipo,name,extra)}
          onClose={()=>setShowAdd(false)}/>
      )}
      {showImport&&canEdit&&secTipo==="performance"&&(
        <ImportModal versao={activeVer} secao={activeSec} tipo={activeTipo}
          onImport={records=>handleImport(activeVer,activeSec,activeTipo,records)}
          onClose={()=>setShowImport(false)}/>
      )}
    </div>
  );
}
