import { useState, useCallback, useRef, useEffect } from "react";

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
const SECAO_ICONS = {
  "Desenvolvimento": "⚡",
  "Fichas PS":       "👥",
  "Treinamentos":    "📋",
  "QA":              "🔍",
};
const REP_TIPOS = ["IC", "QA"];

const TAREFAS = ["Contagem", "Inbound Audit", "Stock Audit", "Lost", "Transfer", "Lost/Sobra"];
const TASK_COLORS = {
  "Contagem":      "#F5C518",
  "Inbound Audit": "#3EC9C4",
  "Stock Audit":   "#E8833A",
  "Lost":          "#E05C7A",
  "Transfer":      "#A47CF0",
  "Lost/Sobra":    "#3EC97A",
};
const TASK_DIM = {
  "Contagem":      "#3A2E00",
  "Inbound Audit": "#003A38",
  "Stock Audit":   "#3A1C00",
  "Lost":          "#3A0D1A",
  "Transfer":      "#20103A",
  "Lost/Sobra":    "#003A1E",
};

/* ── helpers ── */
function avg(vals) {
  if (!vals.length) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function loadState(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function saveState(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function makeEmptySecoes() {
  const obj = {};
  SECOES.forEach(s => {
    obj[s] = {};
    REP_TIPOS.forEach(t => { obj[s][t] = {}; });
  });
  return obj;
}

function makeRep(scores) {
  return { admissao: "", ...Object.fromEntries(TAREFAS.map((t, i) => [t, scores[i] ?? Math.floor(Math.random() * 60 + 30)])) };
}

function initialVersions() {
  return {
    T1: makeEmptySecoes(),
    T2: {
      "Desenvolvimento": {
        IC: {
          "Ana Lima":    makeRep([85, 72, 90, 65, 78, 88]),
          "Bruno Souza": makeRep([70, 68, 75, 80, 60, 72]),
          "Carla Dias":  makeRep([95, 88, 92, 75, 85, 90]),
          "Diego Alves": makeRep([55, 60, 50, 45, 70, 58]),
          "Elaine Faria":makeRep([80, 75, 85, 70, 78, 82]),
        },
        QA: {
          "Fábio Costa": makeRep([75, 80, 70, 65, 72, 78]),
          "Gabi Nunes":  makeRep([90, 85, 88, 80, 82, 86]),
        },
      },
      "Fichas PS": {
        IC: {
          "Henrique Teles": makeRep([65, 70, 60, 55, 68, 62]),
          "Ingrid Melo":    makeRep([88, 82, 85, 78, 80, 84]),
          "João Ferreira":  makeRep([72, 75, 70, 68, 74, 76]),
        },
        QA: {
          "Karen Lima":  makeRep([80, 78, 82, 75, 77, 79]),
          "Lucas Matos": makeRep([60, 65, 58, 55, 62, 64]),
        },
      },
      "Treinamentos": {
        IC: {
          "Marina Costa": makeRep([92, 90, 88, 85, 87, 89]),
          "Neto Ribeiro":  makeRep([68, 72, 65, 60, 70, 66]),
        },
        QA: {
          "Olívia Pires": makeRep([78, 80, 76, 72, 74, 77]),
        },
      },
      "QA": {
        IC: {
          "Paulo Saraiva": makeRep([83, 85, 80, 78, 81, 84]),
          "Raquel Torres": makeRep([70, 73, 68, 65, 71, 72]),
        },
        QA: {
          "Sandro Vaz": makeRep([88, 90, 86, 82, 85, 87]),
        },
      },
    },
  };
}

function tempoDeCasa(admissao) {
  if (!admissao) return null;
  const adm = new Date(admissao + "T00:00:00");
  const hoje = new Date();
  const meses = (hoje.getFullYear() - adm.getFullYear()) * 12 + (hoje.getMonth() - adm.getMonth());
  if (meses < 0) return null;
  if (meses === 0) return "< 1 mês";
  if (meses < 12) return `${meses} mês${meses > 1 ? "es" : ""}`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  return resto > 0 ? `${anos} ano${anos > 1 ? "s" : ""} e ${resto} mês${resto > 1 ? "es" : ""}` : `${anos} ano${anos > 1 ? "s" : ""}`;
}

/* ── MODAL BASE ── */
function ModalWrap({ children, onClose, width = 460 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: SUR2, borderRadius: 16, padding: "28px 32px", width, maxWidth: "100%", boxSizing: "border-box", border: `1px solid ${BDR}`, maxHeight: "90vh", overflowY: "auto" }}>
        {children}
      </div>
    </div>
  );
}

/* ── LOGIN MODAL ── */
function LoginModal({ onLogin, onClose }) {
  const [name, setName]   = useState("");
  const [pass, setPass]   = useState("");
  const [mode, setMode]   = useState("user");
  const [error, setError] = useState("");

  function handleUser() {
    const n = name.trim();
    if (!n) { setError("Digite seu nome."); return; }
    onLogin({ name: n, isCreator: false });
    onClose();
  }
  function handleCreator() {
    if (pass !== CREATOR_PASS) { setError("Senha incorreta."); return; }
    onLogin({ name: CREATOR_NAME, isCreator: true });
    onClose();
  }

  return (
    <ModalWrap onClose={onClose} width={380}>
      <div style={{ fontSize: 16, fontWeight: 500, color: TXT, marginBottom: 6 }}>Identificação</div>
      <div style={{ fontSize: 13, color: TXM, marginBottom: 18 }}>Entre para ter acesso de edição.</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {["user","creator"].map(m => (
          <button key={m} onClick={() => { setMode(m); setError(""); }}
            style={{ flex: 1, padding: "8px 0", borderRadius: 8, cursor: "pointer", fontSize: 13,
              border: mode === m ? `1px solid ${Y}` : `1px solid ${BDR}`,
              background: mode === m ? "#1A1400" : "none",
              color: mode === m ? Y : TXM, fontWeight: mode === m ? 500 : 400 }}>
            {m === "user" ? "Colaborador" : "Criadora"}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#3A0D1A", color: "#E05C7A", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {mode === "user" ? (
        <>
          <label style={{ fontSize: 12, color: TXM, display: "block", marginBottom: 5 }}>Seu nome</label>
          <input autoFocus type="text" placeholder="Ex: João Silva" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleUser(); }}
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 16, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" }} />
          <button onClick={handleUser} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Entrar</button>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: TXM, marginBottom: 8 }}>
            Acesso de <span style={{ color: Y }}>{CREATOR_NAME}</span>
          </div>
          <label style={{ fontSize: 12, color: TXM, display: "block", marginBottom: 5 }}>Senha</label>
          <input autoFocus type="password" placeholder="Senha da criadora" value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleCreator(); }}
            style={{ width: "100%", boxSizing: "border-box", marginBottom: 16, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" }} />
          <button onClick={handleCreator} style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Entrar como Criadora</button>
        </>
      )}
    </ModalWrap>
  );
}

/* ── ADMIN MODAL ── */
function AdminModal({ versoes, editors, onSetEditors, onAddVersao, onRemoveVersao, onClose }) {
  const [tab, setTab]           = useState("editors");
  const [selVer, setSelVer]     = useState(versoes[0] || "");
  const [newEditor, setNewEditor] = useState("");
  const [newVer, setNewVer]     = useState("");
  const [error, setError]       = useState("");

  const curEditors = editors[selVer] || [];

  function addEditor() {
    const n = newEditor.trim();
    if (!n) return;
    if (curEditors.includes(n)) { setError("Já tem acesso."); return; }
    onSetEditors(selVer, [...curEditors, n]);
    setNewEditor(""); setError("");
  }
  function removeEditor(n) {
    onSetEditors(selVer, curEditors.filter(e => e !== n));
  }
  function addVersao() {
    const v = newVer.trim().toUpperCase();
    if (!v) return;
    if (versoes.includes(v)) { setError("Versão já existe."); return; }
    onAddVersao(v); setNewVer(""); setError("");
  }

  return (
    <ModalWrap onClose={onClose} width={500}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: TXT }}>Painel da Criadora</div>
          <div style={{ fontSize: 12, color: TXM, marginTop: 2 }}>Gerencie versões e editores</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: TXM }}>×</button>
      </div>

      <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BDR}`, marginBottom: 18 }}>
        {["editors","versoes"].map(t => (
          <button key={t} onClick={() => { setTab(t); setError(""); }}
            style={{ padding: "8px 20px", border: "none", cursor: "pointer", fontSize: 13,
              borderBottom: tab === t ? `2px solid ${Y}` : "2px solid transparent",
              background: "none", color: tab === t ? Y : TXM, fontWeight: tab === t ? 500 : 400 }}>
            {t === "editors" ? "Editores por Versão" : "Gerenciar Versões"}
          </button>
        ))}
      </div>

      {error && <div style={{ background: "#3A0D1A", color: "#E05C7A", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {tab === "editors" && (
        <div>
          <label style={{ fontSize: 12, color: TXM, display: "block", marginBottom: 8 }}>Selecione a versão/turno</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {versoes.map(v => (
              <button key={v} onClick={() => { setSelVer(v); setError(""); }}
                style={{ padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13,
                  border: selVer === v ? `1px solid ${Y}` : `1px solid ${BDR}`,
                  background: selVer === v ? "#1A1400" : "none",
                  color: selVer === v ? Y : TXM }}>
                {v}
              </button>
            ))}
          </div>

          {curEditors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "14px", color: TXM, fontSize: 13, background: SUR, borderRadius: 10, marginBottom: 12 }}>
              Nenhum editor. Apenas a criadora pode editar esta versão.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {curEditors.map(e => (
                <div key={e} style={{ display: "flex", alignItems: "center", gap: 10, background: SUR, borderRadius: 10, padding: "10px 14px", border: `1px solid ${BDR}` }}>
                  <div style={{ flex: 1, fontSize: 14, color: TXT }}>{e}</div>
                  <span style={{ fontSize: 11, background: "#20103A", color: "#A47CF0", borderRadius: 20, padding: "2px 8px" }}>Editor</span>
                  <button onClick={() => removeEditor(e)}
                    style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #3A0D1A", background: "none", cursor: "pointer", fontSize: 12, color: "#E05C7A" }}>Revogar</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 14 }}>
            <div style={{ fontSize: 13, color: TXM, marginBottom: 8 }}>Conceder acesso a <span style={{ color: Y }}>{selVer}</span></div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" placeholder="Nome exato do colaborador" value={newEditor}
                onChange={e => setNewEditor(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addEditor(); }}
                style={{ flex: 1, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
              <button onClick={addEditor}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap" }}>+ Conceder</button>
            </div>
          </div>
        </div>
      )}

      {tab === "versoes" && (
        <div>
          <div style={{ fontSize: 13, color: TXM, marginBottom: 12 }}>Versões/Turnos existentes:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {versoes.map(v => (
              <div key={v} style={{ display: "flex", alignItems: "center", gap: 10, background: SUR, borderRadius: 10, padding: "10px 14px", border: `1px solid ${BDR}` }}>
                <span style={{ flex: 1, fontSize: 14, color: TXT, fontWeight: 500 }}>{v}</span>
                {versoes.length > 1 && (
                  <button onClick={() => onRemoveVersao(v)}
                    style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #3A0D1A", background: "none", cursor: "pointer", fontSize: 12, color: "#E05C7A" }}>Remover</button>
                )}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 14 }}>
            <div style={{ fontSize: 13, color: TXM, marginBottom: 8 }}>Adicionar nova versão/turno</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="text" placeholder="Ex: T3, T4..." value={newVer}
                onChange={e => setNewVer(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addVersao(); }}
                style={{ flex: 1, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
              <button onClick={addVersao}
                style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>+ Adicionar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
        <button onClick={onClose}
          style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Fechar</button>
      </div>
    </ModalWrap>
  );
}

/* ── ADD REP MODAL ── */
function AddRepModal({ versao, secao, tipo, onAdd, onClose }) {
  const [name, setName]       = useState("");
  const [admissao, setAdmissao] = useState("");
  return (
    <ModalWrap onClose={onClose} width={360}>
      <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, color: TXT }}>
        Adicionar rep · {versao} / {secao} / {tipo}
      </div>
      <label style={{ fontSize: 12, color: TXM, display: "block", marginBottom: 5 }}>Nome</label>
      <input autoFocus type="text" placeholder="Nome do rep" value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && name.trim()) { onAdd(name.trim(), admissao); onClose(); }}}
        style={{ width: "100%", boxSizing: "border-box", marginBottom: 14, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none" }} />
      <label style={{ fontSize: 12, color: TXM, display: "block", marginBottom: 5 }}>
        Data de admissão <span style={{ fontWeight: 400 }}>(opcional)</span>
      </label>
      <input type="date" value={admissao} onChange={e => setAdmissao(e.target.value)}
        style={{ width: "100%", boxSizing: "border-box", marginBottom: 20, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "9px 12px", fontSize: 14, colorScheme: "dark" }} />
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 14, color: TXM }}>Cancelar</button>
        <button onClick={() => { if (name.trim()) { onAdd(name.trim(), admissao); onClose(); }}}
          style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Adicionar</button>
      </div>
    </ModalWrap>
  );
}

/* ── IMPORT MODAL ── */
function ImportModal({ versao, secao, tipo, onImport, onClose }) {
  const [step, setStep]       = useState("upload");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows]       = useState([]);
  const [mapping, setMapping] = useState({ rep: "", ...Object.fromEntries(TAREFAS.map(t => [t, ""])) });
  const [preview, setPreview] = useState([]);
  const [error, setError]     = useState("");
  const fileRef = useRef();

  function parseCSV(text) {
    const lines = text.trim().split("\n").map(l => l.split(/[,;|\t]/));
    const heads = lines[0].map(h => h.trim().replace(/^"|"$/g, ""));
    const data = lines.slice(1).map(r => r.map(c => c.trim().replace(/^"|"$/g, "")));
    return { heads, data };
  }
  function handleFile(file) {
    setError("");
    if (!file.name.endsWith(".csv")) { setError("Use .csv"); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const { heads, data } = parseCSV(e.target.result);
        setHeaders(heads); setRows(data);
        setMapping({ rep: heads[0] || "", ...Object.fromEntries(TAREFAS.map(t => [t, ""])) });
        setStep("map");
      } catch { setError("Erro ao ler CSV."); }
    };
    reader.readAsText(file);
  }
  function buildPreview() {
    if (!mapping.rep) { setError("Selecione coluna de nomes."); return; }
    const result = [];
    rows.forEach(row => {
      const name = row[headers.indexOf(mapping.rep)]?.trim();
      if (!name) return;
      const vals = {};
      TAREFAS.forEach(t => {
        const raw = mapping[t] ? row[headers.indexOf(mapping[t])] : "";
        const n = parseFloat(raw);
        vals[t] = isNaN(n) ? 0 : Math.min(100, Math.max(0, Math.round(n)));
      });
      result.push({ name, vals });
    });
    if (!result.length) { setError("Nenhum dado."); return; }
    setPreview(result); setError(""); setStep("preview");
  }

  return (
    <ModalWrap onClose={onClose} width={520}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: TXT }}>Importar CSV · {versao} / {secao} / {tipo}</div>
          <div style={{ fontSize: 12, color: TXM }}>Importe reps de um arquivo .csv</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: TXM }}>×</button>
      </div>

      {error && <div style={{ background: "#3A0D1A", color: "#E05C7A", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>{error}</div>}

      {step === "upload" && (
        <div>
          <div onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => e.preventDefault()}
            style={{ border: `2px dashed ${BDR}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => e.currentTarget.style.borderColor = Y}
            onMouseLeave={e => e.currentTarget.style.borderColor = BDR}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 14, color: TXT, marginBottom: 4 }}>Arraste ou clique</div>
            <div style={{ fontSize: 12, color: TXM }}>Suporta .csv</div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
          </div>
        </div>
      )}
      {step === "map" && (
        <div>
          <div style={{ fontSize: 13, color: TXM, marginBottom: 12 }}>{rows.length} linhas. Mapeie as colunas.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: SUR, borderRadius: 8, border: `1px solid ${Y}` }}>
              <span style={{ fontSize: 13, color: Y, fontWeight: 500, width: 110, flexShrink: 0 }}>Nome *</span>
              <select value={mapping.rep} onChange={e => setMapping(m => ({ ...m, rep: e.target.value }))}
                style={{ flex: 1, background: SUR2, border: `1px solid ${BDR}`, color: TXT, borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
                <option value="">— selecionar —</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {TAREFAS.map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: SUR, borderRadius: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: TASK_COLORS[t], flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: TXT, width: 110, flexShrink: 0 }}>{t}</span>
                <select value={mapping[t]} onChange={e => setMapping(m => ({ ...m, [t]: e.target.value }))}
                  style={{ flex: 1, background: SUR2, border: `1px solid ${BDR}`, color: TXT, borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
                  <option value="">— ignorar —</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setStep("upload")} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 14, color: TXM }}>Voltar</button>
            <button onClick={buildPreview} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Pré-visualizar</button>
          </div>
        </div>
      )}
      {step === "preview" && (
        <div>
          <div style={{ fontSize: 13, color: TXM, marginBottom: 12 }}>{preview.length} reps.</div>
          <div style={{ maxHeight: 240, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {preview.map(({ name, vals }) => (
              <div key={name} style={{ background: SUR, borderRadius: 10, padding: "10px 12px", border: `1px solid ${BDR}` }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: TXT, marginBottom: 6 }}>{name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {TAREFAS.map(t => (
                    <span key={t} style={{ fontSize: 11, background: TASK_DIM[t], color: TASK_COLORS[t], borderRadius: 20, padding: "2px 7px" }}>
                      {t}: {vals[t]}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
            <button onClick={() => setStep("map")} style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 14, color: TXM }}>Voltar</button>
            <button onClick={() => { onImport(preview); onClose(); }}
              style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
              Importar {preview.length}
            </button>
          </div>
        </div>
      )}
    </ModalWrap>
  );
}

/* ── RadialProgress ── */
function RadialProgress({ pct, color = Y, size = 48 }) {
  const r = size / 2 - 5;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={BDR} strokeWidth={4} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: "stroke-dasharray 0.5s ease" }} />
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={size < 44 ? 10 : 11}
        fontWeight={500} fill={TXT}>{pct}%</text>
    </svg>
  );
}

function StatusBadge({ pct }) {
  if (pct === 100) return <span style={{ fontSize: 11, background: "#003A1E", color: "#3EC97A", borderRadius: 20, padding: "2px 8px", fontWeight: 500 }}>Ótimo</span>;
  if (pct > 50)    return <span style={{ fontSize: 11, background: "#1A2E00", color: "#8ED64A", borderRadius: 20, padding: "2px 8px", fontWeight: 500 }}>Bom</span>;
  if (pct === 50)  return <span style={{ fontSize: 11, background: "#3A1C00", color: "#E8833A", borderRadius: 20, padding: "2px 8px", fontWeight: 500 }}>Regular</span>;
  return <span style={{ fontSize: 11, background: "#1A1A3A", color: "#7A9CF0", borderRadius: 20, padding: "2px 8px", fontWeight: 500 }}>Aprendendo</span>;
}

/* ── REP CARD ── */
function RepCard({ rep, values, onUpdate, onRemove, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  const a = avg(TAREFAS.map(t => values[t]));
  const initials = rep.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = (rep.charCodeAt(0) * 37 + rep.charCodeAt(rep.length - 1) * 17) % 360;

  function liveUpdate(field, val) {
    onUpdate(rep, { ...values, [field]: val });
  }

  return (
    <div style={{ background: SUR, border: `1px solid ${expanded ? Y + "55" : BDR}`, borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 12, transition: "border-color 0.2s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `hsla(${hue},60%,18%,1)`, border: `1.5px solid hsla(${hue},60%,45%,0.6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, color: `hsl(${hue},80%,75%)`, flexShrink: 0 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: TXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 2 }}>{rep}</div>
          {tempoDeCasa(values.admissao) && (
            <div style={{ fontSize: 11, color: TXM, marginBottom: 3 }}>🕐 {tempoDeCasa(values.admissao)} de casa</div>
          )}
          <StatusBadge pct={a} />
        </div>
        <RadialProgress pct={a} color={Y} size={46} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {TAREFAS.map(t => {
          const v = values[t];
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: TASK_COLORS[t], flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: TXM, width: 96, flexShrink: 0 }}>{t}</span>
              <div style={{ flex: 1, height: 5, background: TASK_DIM[t], borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${v}%`, background: TASK_COLORS[t], borderRadius: 10, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: TASK_COLORS[t], width: 32, textAlign: "right" }}>{v}%</span>
            </div>
          );
        })}
      </div>

      {canEdit && expanded && (
        <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <label style={{ fontSize: 11, color: TXM, display: "block", marginBottom: 4 }}>Data de admissão</label>
            <input type="date" value={values.admissao || ""} onChange={e => liveUpdate("admissao", e.target.value)}
              style={{ background: SUR2, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "6px 10px", fontSize: 13, colorScheme: "dark", width: "100%", boxSizing: "border-box" }} />
          </div>
          {TAREFAS.map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: TASK_COLORS[t], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: TXT, width: 96, flexShrink: 0 }}>{t}</span>
              <button onClick={() => liveUpdate(t, Math.max(0, values[t] - 25))}
                style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${BDR}`, background: SUR2, color: TXM, cursor: "pointer", fontSize: 15, lineHeight: 1, flexShrink: 0 }}>−</button>
              <input type="range" min={0} max={100} step={25} value={values[t]}
                onChange={e => liveUpdate(t, Number(e.target.value))}
                style={{ flex: 1, accentColor: Y }} />
              <button onClick={() => liveUpdate(t, Math.min(100, values[t] + 25))}
                style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${BDR}`, background: SUR2, color: TXM, cursor: "pointer", fontSize: 15, lineHeight: 1, flexShrink: 0 }}>+</button>
              <span style={{ fontSize: 12, fontWeight: 500, color: Y, width: 34, textAlign: "right" }}>{values[t]}%</span>
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${BDR}`, paddingTop: 10 }}>
          <button onClick={() => setExpanded(e => !e)}
            style={{ flex: 1, padding: "7px 0", borderRadius: 8, border: `1px solid ${expanded ? Y + "66" : BDR}`, background: expanded ? "#1A1400" : "none", cursor: "pointer", fontSize: 12, color: expanded ? Y : TXM, transition: "all 0.2s" }}>
            {expanded ? "✓ Concluir" : "Editar"}
          </button>
          <button onClick={() => onRemove(rep)}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #3A0D1A", background: "none", cursor: "pointer", fontSize: 12, color: "#E05C7A" }}>Remover</button>
        </div>
      )}
    </div>
  );
}

/* ── SUMMARY BAR ── */
function SummaryBar({ repsData }) {
  const allVals = Object.values(repsData);
  const taskAvgs = TAREFAS.map(t => ({ task: t, a: allVals.length > 0 ? avg(allVals.map(r => r[t])) : 0 }));
  const overall = avg(taskAvgs.map(x => x.a));
  return (
    <div style={{ background: SUR, border: `1px solid ${BDR}`, borderRadius: 16, padding: 18, marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center" }}>
      <div style={{ minWidth: 100, textAlign: "center", paddingRight: 14, borderRight: `1px solid ${BDR}` }}>
        <div style={{ fontSize: 34, fontWeight: 500, color: Y, lineHeight: 1 }}>{overall}%</div>
        <div style={{ fontSize: 12, color: TXM, marginTop: 4 }}>média</div>
        <div style={{ fontSize: 12, color: TXM }}>{allVals.length} rep{allVals.length !== 1 ? "s" : ""}</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {taskAvgs.map(({ task, a }) => (
          <div key={task} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 52 }}>
            <RadialProgress pct={a} color={TASK_COLORS[task]} size={42} />
            <span style={{ fontSize: 10, color: TXM, textAlign: "center", maxWidth: 64, lineHeight: 1.3 }}>{task}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── APP ── */
export default function App() {
  const [versoes, setVersoes]       = useState(() => loadState("icqa2_versoes", ["T1", "T2"]));
  const [data, setData]             = useState(() => loadState("icqa2_data", null) || initialVersions());
  const [editors, setEditors]       = useState(() => loadState("icqa2_editors", {}));
  const [currentUser, setCurrentUser] = useState(() => loadState("icqa2_user", null));

  const [activeVer, setActiveVer]   = useState(() => {
    const saved = loadState("icqa2_versoes", ["T1", "T2"]);
    return saved.includes("T2") ? "T2" : saved[0];
  });
  const [activeSec, setActiveSec]   = useState(SECOES[0]);
  const [activeTipo, setActiveTipo] = useState(REP_TIPOS[0]);
  const [search, setSearch]         = useState("");
  const [showLogin, setShowLogin]   = useState(false);
  const [showAdmin, setShowAdmin]   = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { saveState("icqa2_versoes", versoes); }, [versoes]);
  useEffect(() => { saveState("icqa2_data", data); }, [data]);
  useEffect(() => { saveState("icqa2_editors", editors); }, [editors]);
  useEffect(() => { saveState("icqa2_user", currentUser); }, [currentUser]);

  const isCreator  = currentUser?.isCreator === true;
  const canEdit    = isCreator || (currentUser && (editors[activeVer] || []).includes(currentUser.name));

  const repsData = data?.[activeVer]?.[activeSec]?.[activeTipo] || {};
  const repList  = Object.keys(repsData).filter(r => r.toLowerCase().includes(search.toLowerCase()));

  /* counts for sub-tab badges */
  function countTipo(ver, sec, tipo) {
    return Object.keys(data?.[ver]?.[sec]?.[tipo] || {}).length;
  }
  function countSec(ver, sec) {
    return REP_TIPOS.reduce((s, t) => s + countTipo(ver, sec, t), 0);
  }

  /* data mutations */
  const handleUpdate = useCallback((ver, sec, tipo, rep, vals) => {
    setData(d => ({
      ...d,
      [ver]: { ...d[ver], [sec]: { ...d[ver][sec], [tipo]: { ...d[ver][sec][tipo], [rep]: vals } } }
    }));
  }, []);

  const handleRemove = useCallback((ver, sec, tipo, rep) => {
    setData(d => {
      const u = { ...d[ver][sec][tipo] };
      delete u[rep];
      return { ...d, [ver]: { ...d[ver], [sec]: { ...d[ver][sec], [tipo]: u } } };
    });
  }, []);

  const handleAdd = useCallback((ver, sec, tipo, name, admissao) => {
    setData(d => {
      if (d?.[ver]?.[sec]?.[tipo]?.[name]) return d;
      const vals = { admissao, ...Object.fromEntries(TAREFAS.map(t => [t, 0])) };
      return { ...d, [ver]: { ...d[ver], [sec]: { ...d[ver][sec], [tipo]: { ...(d[ver][sec][tipo] || {}), [name]: vals } } } };
    });
  }, []);

  const handleImport = useCallback((ver, sec, tipo, records) => {
    setData(d => {
      const updated = { ...(d?.[ver]?.[sec]?.[tipo] || {}) };
      records.forEach(({ name, vals }) => { updated[name] = { admissao: "", ...vals }; });
      return { ...d, [ver]: { ...d[ver], [sec]: { ...d[ver][sec], [tipo]: updated } } };
    });
  }, []);

  const handleAddVersao = useCallback((name) => {
    setVersoes(v => [...v, name]);
    setData(d => ({ ...d, [name]: makeEmptySecoes() }));
  }, []);

  const handleRemoveVersao = useCallback((name) => {
    const newVers = versoes.filter(v => v !== name);
    setVersoes(newVers);
    setData(d => { const u = { ...d }; delete u[name]; return u; });
    setEditors(e => { const u = { ...e }; delete u[name]; return u; });
    if (activeVer === name) setActiveVer(newVers[0]);
  }, [versoes, activeVer]);

  const handleSetEditors = useCallback((ver, list) => {
    setEditors(e => ({ ...e, [ver]: list }));
  }, []);

  /* tab style */
  const tabStyle = (active) => ({
    padding: "10px 20px", border: "none", whiteSpace: "nowrap", cursor: "pointer", fontSize: 14,
    borderBottom: active ? `2px solid ${Y}` : "2px solid transparent",
    background: "none", fontWeight: active ? 500 : 400,
    color: active ? Y : TXM, transition: "color 0.2s",
  });

  return (
    <div style={{ background: BG, minHeight: "100vh", paddingBottom: 44, fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${BDR}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ padding: "16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: Y, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>IQ</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 500, color: TXT }}>ICQA Tracker</span>
          </div>
          <div style={{ fontSize: 12, color: TXM, marginTop: 2, marginLeft: 38 }}>Acompanhe o desempenho por turno, seção e tipo</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isCreator && (
            <button onClick={() => setShowAdmin(true)}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #20103A", background: "#20103A", color: "#A47CF0", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
              ⚙ Admin
            </button>
          )}
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: TXT, fontWeight: 500 }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: isCreator ? Y : canEdit ? "#3EC97A" : TXM }}>
                  {isCreator ? "Criadora" : canEdit ? `Editor · ${activeVer}` : "Visualizador"}
                </div>
              </div>
              <button onClick={() => setCurrentUser(null)} title="Sair"
                style={{ width: 30, height: 30, borderRadius: "50%", border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 13, color: TXM }}>↩</button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)}
              style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${BDR}`, background: "none", color: TXM, cursor: "pointer", fontSize: 13 }}>Entrar</button>
          )}
        </div>
      </div>

      {/* ── VERSÕES (Turnos) TABS ── */}
      <div style={{ borderBottom: `1px solid ${BDR}`, padding: "0 24px", display: "flex", alignItems: "center", background: "#111" }}>
        <div style={{ fontSize: 11, color: TXM, marginRight: 14, letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>Turno</div>
        <div style={{ display: "flex", flex: 1, overflowX: "auto" }}>
          {versoes.map(v => (
            <button key={v} onClick={() => { setActiveVer(v); setSearch(""); }}
              style={{
                ...tabStyle(activeVer === v),
                display: "flex", alignItems: "center", gap: 6,
              }}>
              {v}
              <span style={{ fontSize: 10, borderRadius: 4, padding: "1px 5px", fontWeight: 600, letterSpacing: "0.3px",
                background: activeVer === v ? "#1A1400" : SUR,
                color: activeVer === v ? Y : TXM,
                border: `1px solid ${activeVer === v ? Y + "44" : BDR}` }}>
                {SECOES.reduce((s, sec) => s + countSec(v, sec), 0)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── SEÇÕES TABS ── */}
      <div style={{ borderBottom: `1px solid ${BDR}`, padding: "0 24px", display: "flex", overflowX: "auto" }}>
        {SECOES.map(s => (
          <button key={s} onClick={() => { setActiveSec(s); setSearch(""); }}
            style={{ ...tabStyle(activeSec === s), display: "flex", alignItems: "center", gap: 6 }}>
            <span>{SECAO_ICONS[s]}</span>
            {s}
            <span style={{ fontSize: 11, borderRadius: 20, padding: "1px 7px", fontWeight: 500,
              background: activeSec === s ? "#3A2E00" : SUR,
              color: activeSec === s ? Y : TXM }}>
              {countSec(activeVer, s)}
            </span>
          </button>
        ))}
      </div>

      <div style={{ padding: "0 24px", paddingTop: 16 }}>
        {/* ── IC / QA SUB-TABS ── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {REP_TIPOS.map(t => (
            <button key={t} onClick={() => { setActiveTipo(t); setSearch(""); }}
              style={{
                padding: "6px 18px", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 500,
                border: activeTipo === t ? `1px solid ${Y}` : `1px solid ${BDR}`,
                background: activeTipo === t ? "#1A1400" : "none",
                color: activeTipo === t ? Y : TXM,
                transition: "all 0.2s",
              }}>
              {t}
              <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>{countTipo(activeVer, activeSec, t)}</span>
            </button>
          ))}
        </div>

        <SummaryBar repsData={repsData} />

        {/* ── SEARCH + ACTIONS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="text" placeholder="Buscar rep..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ maxWidth: 220, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
            {!canEdit && currentUser && (
              <span style={{ fontSize: 12, color: TXM, background: SUR, borderRadius: 8, padding: "5px 12px", border: `1px solid ${BDR}` }}>👁 Visualização</span>
            )}
            {!currentUser && (
              <button onClick={() => setShowLogin(true)}
                style={{ fontSize: 12, color: TXM, background: SUR, borderRadius: 8, padding: "5px 12px", border: `1px solid ${BDR}`, cursor: "pointer" }}>
                Entre para editar
              </button>
            )}
          </div>
          {canEdit && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowImport(true)}
                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 12, color: TXM }}>
                Importar CSV
              </button>
              <button onClick={() => setShowAdd(true)}
                style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                + Adicionar rep
              </button>
            </div>
          )}
        </div>

        {/* ── REP GRID ── */}
        {repList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: TXM, fontSize: 14 }}>
            {search ? "Nenhum rep encontrado." : `Nenhum rep em ${activeVer} / ${activeSec} / ${activeTipo}.${canEdit ? " Adicione manualmente ou importe CSV." : ""}`}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
            {repList.map(rep => (
              <RepCard key={rep} rep={rep} values={repsData[rep]}
                onUpdate={(r, vals) => handleUpdate(activeVer, activeSec, activeTipo, r, vals)}
                onRemove={r => handleRemove(activeVer, activeSec, activeTipo, r)}
                canEdit={canEdit} />
            ))}
          </div>
        )}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height: 36, background: SUR, borderTop: `1px solid ${BDR}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", zIndex: 100 }}>
        <div style={{ fontSize: 11, color: TXM, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: Y, fontWeight: 600, letterSpacing: "0.5px" }}>{activeVer}</span>
          <span>·</span>
          <span>{activeSec}</span>
          <span>·</span>
          <span>{activeTipo}</span>
          {canEdit && <span style={{ color: "#3EC97A", marginLeft: 4 }}>✓ editando</span>}
        </div>
        <div style={{ fontSize: 10, color: "#555", fontStyle: "italic", letterSpacing: "0.3px" }}>
          Criado por Melyssa Rangel de Figueiredo
        </div>
      </div>

      {/* ── MODALS ── */}
      {showLogin  && <LoginModal onLogin={setCurrentUser} onClose={() => setShowLogin(false)} />}
      {showAdmin  && isCreator && (
        <AdminModal versoes={versoes} editors={editors}
          onSetEditors={handleSetEditors}
          onAddVersao={handleAddVersao}
          onRemoveVersao={handleRemoveVersao}
          onClose={() => setShowAdmin(false)} />
      )}
      {showAdd && canEdit && (
        <AddRepModal versao={activeVer} secao={activeSec} tipo={activeTipo}
          onAdd={(name, adm) => handleAdd(activeVer, activeSec, activeTipo, name, adm)}
          onClose={() => setShowAdd(false)} />
      )}
      {showImport && canEdit && (
        <ImportModal versao={activeVer} secao={activeSec} tipo={activeTipo}
          onImport={(records) => handleImport(activeVer, activeSec, activeTipo, records)}
          onClose={() => setShowImport(false)} />
      )}
    </div>
  );
}
