import { useState, useCallback, useRef } from "react";

/* ── palette ── */
const Y    = "#F5C518";
const BG   = "#0D0D0D";
const SUR  = "#1A1A1A";
const SUR2 = "#242424";
const BDR  = "#2E2E2E";
const TXT  = "#F0F0F0";
const TXM  = "#A0A0A0";

const INIT_TURNOS = ["Turno 1", "Turno 2", "Turno 3"];
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

function makeEmptyTurno() {
  return {};
}

function initialData() {
  const data = {};
  INIT_TURNOS.forEach((turno, i) => {
    data[turno] = {};
    const names = [
      ["Ana Lima", "Bruno Souza", "Carla Dias"],
      ["Diego Alves", "Elaine Faria", "Fábio Costa"],
      ["Gabi Nunes", "Henrique Teles", "Ingrid Melo"],
    ][i] || [];
    names.forEach(rep => {
      data[turno][rep] = { admissao: "", ...Object.fromEntries(TAREFAS.map(t => [t, Math.floor(Math.random() * 60 + 30)])) };
    });
  });
  return data;
}

function avg(vals) {
  if (!vals.length) return 0;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
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
  return <span style={{ fontSize: 11, background: "#1A1A3A", color: "#7A9CF0", borderRadius: 20, padding: "2px 8px", fontWeight: 500 }}>Em aprendizado</span>;
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: SUR2, borderRadius: 16, padding: "28px 32px", width, maxWidth: "100%", boxSizing: "border-box", border: `1px solid ${BDR}` }}>
        {children}
      </div>
    </div>
  );
}

/* ── EDIT REP MODAL — kept for inline use via RepCard ── */

/* ── ADD REP MODAL ── */
function AddRepModal({ turno, onAdd, onClose }) {
  const [name, setName] = useState("");
  const [admissao, setAdmissao] = useState("");
  return (
    <ModalWrap onClose={onClose} width={360}>
      <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 18, color: TXT }}>Adicionar rep — {turno}</div>
      <label style={{ fontSize: 12, color: TXM, display: "block", marginBottom: 5 }}>Nome</label>
      <input type="text" placeholder="Nome do rep" value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && name.trim()) { onAdd(name.trim(), admissao); onClose(); }}}
        style={{ width: "100%", boxSizing: "border-box", marginBottom: 14, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "9px 12px", fontSize: 14 }}
        autoFocus />
      <label style={{ fontSize: 12, color: TXM, display: "block", marginBottom: 5 }}>Data de admissão <span style={{ color: TXM, fontWeight: 400 }}>(opcional)</span></label>
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

/* ── MANAGE TURNOS MODAL ── */
function ManageTurnosModal({ turnos, onRename, onAdd, onRemove, onClose }) {
  const [editingIdx, setEditingIdx] = useState(null);
  const [editVal, setEditVal]       = useState("");
  const [newName, setNewName]       = useState("");
  const [error, setError]           = useState("");

  function startEdit(i) {
    setEditingIdx(i);
    setEditVal(turnos[i]);
    setError("");
  }

  function saveEdit(i) {
    const name = editVal.trim();
    if (!name) { setError("O nome não pode ser vazio."); return; }
    if (turnos.includes(name) && name !== turnos[i]) { setError("Já existe um turno com esse nome."); return; }
    onRename(i, name);
    setEditingIdx(null);
    setError("");
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    if (turnos.includes(name)) { setError("Já existe um turno com esse nome."); return; }
    onAdd(name);
    setNewName("");
    setError("");
  }

  return (
    <ModalWrap onClose={onClose} width={440}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: TXT }}>Gerenciar Turnos</div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: TXM }}>×</button>
      </div>

      {error && (
        <div style={{ background: "#3A0D1A", color: "#E05C7A", borderRadius: 8, padding: "9px 13px", fontSize: 13, marginBottom: 14 }}>{error}</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
        {turnos.map((t, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: SUR, borderRadius: 10, padding: "10px 14px", border: `1px solid ${editingIdx === i ? Y : BDR}` }}>
            {/* drag handle visual */}
            <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0, opacity: 0.35 }}>
              {[0,1,2].map(k => <div key={k} style={{ width: 16, height: 2, background: TXM, borderRadius: 2 }} />)}
            </div>

            {editingIdx === i ? (
              <>
                <input
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveEdit(i); if (e.key === "Escape") setEditingIdx(null); }}
                  style={{ flex: 1, background: SUR2, border: `1px solid ${Y}`, color: TXT, borderRadius: 7, padding: "5px 10px", fontSize: 14, outline: "none" }}
                  autoFocus
                />
                <button onClick={() => saveEdit(i)}
                  style={{ padding: "5px 14px", borderRadius: 7, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>OK</button>
                <button onClick={() => setEditingIdx(null)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 13, color: TXM }}>✕</button>
              </>
            ) : (
              <>
                <span style={{ flex: 1, fontSize: 14, color: TXT }}>{t}</span>
                <button onClick={() => startEdit(i)}
                  style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 12, color: TXM }}>
                  Renomear
                </button>
                <button
                  onClick={() => { if (turnos.length <= 1) { setError("É necessário ter ao menos 1 turno."); return; } onRemove(i); }}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid #3A0D1A", background: "none", cursor: "pointer", fontSize: 12, color: "#E05C7A" }}>
                  ✕
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* add new */}
      <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 16 }}>
        <div style={{ fontSize: 13, color: TXM, marginBottom: 10 }}>Adicionar novo turno</div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Ex: Turno 4, Turno Noturno..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
            style={{ flex: 1, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }}
          />
          <button onClick={handleAdd}
            style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
            + Adicionar
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <button onClick={onClose}
          style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Fechar</button>
      </div>
    </ModalWrap>
  );
}

/* ── SPREADSHEET IMPORT MODAL ── */
function ImportModal({ turno, onImport, onClose }) {
  const [step, setStep] = useState("upload");
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState({ rep: "", ...Object.fromEntries(TAREFAS.map(t => [t, ""])) });
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState("");
  const fileRef = useRef();

  function parseCSV(text) {
    const lines = text.trim().split("\n").map(l => l.split(/[,;|\t]/));
    const heads = lines[0].map(h => h.trim().replace(/^"|"$/g, ""));
    const data = lines.slice(1).map(row => row.map(c => c.trim().replace(/^"|"$/g, "")));
    return { heads, data };
  }

  function handleFile(file) {
    setError("");
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext)) { setError("Formato não suportado. Use .csv"); return; }
    if (ext === "csv") {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const { heads, data } = parseCSV(e.target.result);
          setHeaders(heads); setRows(data);
          setMapping({ rep: heads[0] || "", ...Object.fromEntries(TAREFAS.map(t => [t, ""])) });
          setStep("map");
        } catch { setError("Erro ao ler o arquivo CSV."); }
      };
      reader.readAsText(file);
    } else {
      setError("Para .xlsx, exporte como CSV primeiro.");
    }
  }

  function buildPreview() {
    if (!mapping.rep) { setError("Selecione a coluna de nomes."); return; }
    const result = [];
    rows.forEach(row => {
      const name = row[headers.indexOf(mapping.rep)]?.trim();
      if (!name) return;
      const vals = {};
      TAREFAS.forEach(t => {
        const col = mapping[t];
        const raw = col ? row[headers.indexOf(col)] : "";
        const num = parseFloat(raw);
        vals[t] = isNaN(num) ? 0 : Math.min(100, Math.max(0, Math.round(num)));
      });
      result.push({ name, vals });
    });
    if (!result.length) { setError("Nenhum dado encontrado."); return; }
    setPreview(result); setError(""); setStep("preview");
  }

  return (
    <ModalWrap onClose={onClose} width={520}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 500, color: TXT }}>Vincular planilha — {turno}</div>
          <div style={{ fontSize: 13, color: TXM }}>Importe dados de um arquivo CSV</div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: TXM }}>×</button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 24 }}>
        {["upload","map","preview"].map((s, i) => (
          <div key={s} style={{ display: "flex", alignItems: "center" }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 500,
              background: step === s ? Y : (["upload","map","preview"].indexOf(step) > i ? Y : BDR),
              color: step === s || ["upload","map","preview"].indexOf(step) > i ? "#000" : TXM,
            }}>{i+1}</div>
            <span style={{ fontSize: 12, color: step === s ? Y : TXM, marginLeft: 6, marginRight: 12 }}>
              {s === "upload" ? "Arquivo" : s === "map" ? "Mapeamento" : "Confirmar"}
            </span>
            {i < 2 && <div style={{ width: 20, height: 1, background: BDR, marginRight: 12 }} />}
          </div>
        ))}
      </div>

      {error && <div style={{ background: "#3A0D1A", color: "#E05C7A", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {step === "upload" && (
        <div>
          <div onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => e.preventDefault()}
            style={{ border: `2px dashed ${BDR}`, borderRadius: 12, padding: "36px 20px", textAlign: "center", cursor: "pointer" }}
            onClick={() => fileRef.current?.click()}
            onMouseEnter={e => e.currentTarget.style.borderColor = Y}
            onMouseLeave={e => e.currentTarget.style.borderColor = BDR}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📂</div>
            <div style={{ fontSize: 14, color: TXT, marginBottom: 4 }}>Arraste ou clique para selecionar</div>
            <div style={{ fontSize: 12, color: TXM }}>Suporta .csv</div>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
              onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); }} />
          </div>
          <div style={{ marginTop: 16, padding: "12px 14px", background: SUR, borderRadius: 10, border: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 12, color: Y, fontWeight: 500, marginBottom: 6 }}>Formato esperado</div>
            <div style={{ fontFamily: "monospace", fontSize: 12, color: TXM }}>
              Nome,Contagem,Inbound Audit,Stock Audit,Lost,Transfer,Lost/Sobra<br/>
              Ana Lima,85,72,90,65,78,88
            </div>
          </div>
        </div>
      )}

      {step === "map" && (
        <div>
          <div style={{ fontSize: 13, color: TXM, marginBottom: 14 }}>{rows.length} linhas detectadas. Mapeie as colunas.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: SUR, borderRadius: 8, border: `1px solid ${Y}` }}>
              <span style={{ fontSize: 13, color: Y, fontWeight: 500, width: 110, flexShrink: 0 }}>Nome do rep *</span>
              <select value={mapping.rep} onChange={e => setMapping(m => ({ ...m, rep: e.target.value }))}
                style={{ flex: 1, background: SUR2, border: `1px solid ${BDR}`, color: TXT, borderRadius: 6, padding: "6px 10px", fontSize: 13 }}>
                <option value="">— selecionar —</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {TAREFAS.map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 14px", background: SUR, borderRadius: 8 }}>
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
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={() => setStep("upload")} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 14, color: TXM }}>Voltar</button>
            <button onClick={buildPreview} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>Pré-visualizar</button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          <div style={{ fontSize: 13, color: TXM, marginBottom: 12 }}>{preview.length} reps encontrados.</div>
          <div style={{ maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
            {preview.map(({ name, vals }) => (
              <div key={name} style={{ background: SUR, borderRadius: 10, padding: "11px 14px", border: `1px solid ${BDR}` }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: TXT, marginBottom: 7 }}>{name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {TAREFAS.map(t => (
                    <span key={t} style={{ fontSize: 11, background: TASK_DIM[t], color: TASK_COLORS[t], borderRadius: 20, padding: "2px 8px", fontWeight: 500 }}>
                      {t}: {vals[t]}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 18, justifyContent: "flex-end" }}>
            <button onClick={() => setStep("map")} style={{ padding: "8px 20px", borderRadius: 8, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 14, color: TXM }}>Voltar</button>
            <button onClick={() => { onImport(preview); onClose(); }}
              style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
              Importar {preview.length} reps
            </button>
          </div>
        </div>
      )}
    </ModalWrap>
  );
}

/* ── REP CARD — inline live edit ── */
function RepCard({ rep, values, onUpdate, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const a = avg(TAREFAS.map(t => values[t]));
  const initials = rep.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const hue = (rep.charCodeAt(0) * 37 + rep.charCodeAt(rep.length - 1) * 17) % 360;

  function liveUpdate(field, value) {
    onUpdate(rep, { ...values, [field]: value });
  }

  return (
    <div style={{
      background: SUR,
      border: `1px solid ${expanded ? Y + "55" : BDR}`,
      borderRadius: 16, padding: 20,
      display: "flex", flexDirection: "column", gap: 14,
      transition: "border-color 0.25s",
    }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: "50%",
          background: `hsla(${hue},60%,18%,1)`,
          border: `1.5px solid hsla(${hue},60%,45%,0.6)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 500, color: `hsl(${hue},80%,75%)`, flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: TXT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: 3 }}>{rep}</div>
          {tempoDeCasa(values.admissao) && (
            <div style={{ fontSize: 11, color: TXM, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10 }}>🕐</span>
              {tempoDeCasa(values.admissao)} de casa
            </div>
          )}
          <StatusBadge pct={a} />
        </div>
        <RadialProgress pct={a} color={Y} size={48} />
      </div>

      {/* progress bars — always visible */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {TAREFAS.map(t => {
          const v = values[t];
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: 2, background: TASK_COLORS[t], flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: TXM, width: 96, flexShrink: 0 }}>{t}</span>
              <div style={{ flex: 1, height: 5, background: TASK_DIM[t], borderRadius: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${v}%`, background: TASK_COLORS[t], borderRadius: 10, transition: "width 0.35s ease" }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: TASK_COLORS[t], width: 32, textAlign: "right" }}>{v}%</span>
            </div>
          );
        })}
      </div>

      {/* inline edit panel — shown when expanded */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${BDR}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* admissao */}
          <div>
            <label style={{ fontSize: 11, color: TXM, display: "block", marginBottom: 5 }}>Data de admissão</label>
            <input type="date" value={values.admissao || ""}
              onChange={e => liveUpdate("admissao", e.target.value)}
              style={{ background: SUR2, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "7px 10px", fontSize: 13, colorScheme: "dark", width: "100%", boxSizing: "border-box" }} />
          </div>
          {/* sliders */}
          {TAREFAS.map(t => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: TASK_COLORS[t], flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: TXT, width: 96, flexShrink: 0 }}>{t}</span>
              <button
                onClick={() => liveUpdate(t, Math.max(0, values[t] - 25))}
                style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${BDR}`, background: SUR2, color: TXM, cursor: "pointer", fontSize: 15, lineHeight: 1, flexShrink: 0 }}>−</button>
              <input type="range" min={0} max={100} step={25} value={values[t]}
                onChange={e => liveUpdate(t, Number(e.target.value))}
                style={{ flex: 1, accentColor: Y }} />
              <button
                onClick={() => liveUpdate(t, Math.min(100, values[t] + 25))}
                style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${BDR}`, background: SUR2, color: TXM, cursor: "pointer", fontSize: 15, lineHeight: 1, flexShrink: 0 }}>+</button>
              <span style={{ fontSize: 12, fontWeight: 500, color: Y, width: 34, textAlign: "right" }}>{values[t]}%</span>
            </div>
          ))}
        </div>
      )}

      {/* action bar */}
      <div style={{ display: "flex", gap: 8, borderTop: `1px solid ${BDR}`, paddingTop: 12 }}>
        <button onClick={() => setExpanded(e => !e)}
          style={{
            flex: 1, padding: "7px 0", borderRadius: 8,
            border: `1px solid ${expanded ? Y + "66" : BDR}`,
            background: expanded ? "#1A1400" : "none",
            cursor: "pointer", fontSize: 12,
            color: expanded ? Y : TXM,
            transition: "all 0.2s",
          }}>
          {expanded ? "✓ Concluir edição" : "Editar"}
        </button>
        <button onClick={() => onRemove(rep)}
          style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #3A0D1A", background: "none", cursor: "pointer", fontSize: 12, color: "#E05C7A" }}>
          Remover
        </button>
      </div>
    </div>
  );
}

/* ── TURNO SUMMARY ── */
function TurnoSummary({ turnoData }) {
  const reps = Object.keys(turnoData);
  const taskAvgs = TAREFAS.map(t => ({ task: t, a: reps.length > 0 ? avg(reps.map(r => turnoData[r][t])) : 0 }));
  const overall = avg(taskAvgs.map(x => x.a));
  return (
    <div style={{ background: SUR, border: `1px solid ${BDR}`, borderRadius: 16, padding: 20, marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
      <div style={{ minWidth: 110, textAlign: "center", paddingRight: 16, borderRight: `1px solid ${BDR}` }}>
        <div style={{ fontSize: 36, fontWeight: 500, color: Y, lineHeight: 1 }}>{overall}%</div>
        <div style={{ fontSize: 12, color: TXM, marginTop: 6 }}>média geral</div>
        <div style={{ fontSize: 12, color: TXM, marginTop: 2 }}>{reps.length} rep{reps.length !== 1 ? "s" : ""}</div>
      </div>
      <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 10 }}>
        {taskAvgs.map(({ task, a }) => (
          <div key={task} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 58 }}>
            <RadialProgress pct={a} color={TASK_COLORS[task]} size={44} />
            <span style={{ fontSize: 10, color: TXM, textAlign: "center", maxWidth: 68, lineHeight: 1.3 }}>{task}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── APP ── */
export default function App() {
  const [loaded, setLoaded]   = useState(false);
  const [turnos, setTurnos]   = useState(INIT_TURNOS);
  const [data, setData]       = useState({});
  const [activeTab, setActiveTab]       = useState(INIT_TURNOS[0]);
  const [showAdd, setShowAdd]           = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [showManage, setShowManage]     = useState(false);
  const [search, setSearch]             = useState("");

  /* ── load from Grid state on mount ── */
  useEffect(() => {
    async function loadState() {
      try {
        if (window.GRID?.state?.get) {
          const { state } = await window.GRID.state.get();
          if (state?.turnos?.length && state?.data) {
            setTurnos(state.turnos);
            setData(state.data);
            setActiveTab(state.turnos[0]);
          } else {
            const initData = initialData();
            setData(initData);
            await window.GRID.state.patch({ turnos: INIT_TURNOS, data: initData });
          }
        } else {
          setData(initialData());
        }
      } catch {
        setData(initialData());
      }
      setLoaded(true);
    }
    loadState();
  }, []);

  /* ── persist to Grid state on every change ── */
  useEffect(() => {
    if (!loaded) return;
    if (!window.GRID?.state?.patch) return;
    window.GRID.state.patch({ turnos, data });
  }, [turnos, data, loaded]);

  const turnoData = data[activeTab] || {};
  const repList = Object.keys(turnoData).filter(r => r.toLowerCase().includes(search.toLowerCase()));

  /* turno management */
  const handleRenameTurno = useCallback((idx, newName) => {
    const oldName = turnos[idx];
    setTurnos(ts => ts.map((t, i) => i === idx ? newName : t));
    setData(d => {
      const updated = { ...d };
      updated[newName] = updated[oldName];
      delete updated[oldName];
      return updated;
    });
    setActiveTab(prev => prev === oldName ? newName : prev);
  }, [turnos]);

  const handleAddTurno = useCallback((name) => {
    setTurnos(ts => [...ts, name]);
    setData(d => ({ ...d, [name]: makeEmptyTurno() }));
  }, []);

  const handleRemoveTurno = useCallback((idx) => {
    const name = turnos[idx];
    const newTurnos = turnos.filter((_, i) => i !== idx);
    setTurnos(newTurnos);
    setData(d => { const u = { ...d }; delete u[name]; return u; });
    setActiveTab(prev => prev === name ? newTurnos[0] : prev);
  }, [turnos]);

  /* rep management */
  const handleUpdate = useCallback((turno, rep, vals) => {
    setData(d => ({ ...d, [turno]: { ...d[turno], [rep]: vals } }));
  }, []);

  const handleRemove = useCallback((rep, turno) => {
    setData(d => { const u = { ...d[turno] }; delete u[rep]; return { ...d, [turno]: u }; });
  }, []);

  const handleAdd = useCallback((name, turno, admissao = "") => {
    setData(d => {
      if (d[turno]?.[name]) return d;
      const vals = { admissao, ...Object.fromEntries(TAREFAS.map(t => [t, 0])) };
      return { ...d, [turno]: { ...(d[turno] || {}), [name]: vals } };
    });
  }, []);

  const handleImport = useCallback((records) => {
    setData(d => {
      const updated = { ...(d[activeTab] || {}) };
      records.forEach(({ name, vals }) => { updated[name] = vals; });
      return { ...d, [activeTab]: updated };
    });
  }, [activeTab]);

  if (!loaded) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 28, height: 28, background: Y, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>IQ</span>
        </div>
        <div style={{ fontSize: 14, color: TXM }}>Carregando...</div>
      </div>
    </div>
  );

  return (
    <div style={{ background: BG, minHeight: "100vh", padding: "0 0 60px", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
      <div style={{ borderBottom: `1px solid ${BDR}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ padding: "18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 28, background: Y, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#000" }}>IQ</span>
            </div>
            <span style={{ fontSize: 18, fontWeight: 500, color: TXT }}>Desenvolvimento ICQA</span>
          </div>
          <div style={{ fontSize: 13, color: TXM, marginTop: 2, marginLeft: 38 }}>Acompanhe o desempenho por turno e tarefa</div>
        </div>
        <button onClick={() => setShowImport(true)}
          style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${Y}`, background: "transparent", color: Y, cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
          ↑ Importar planilha
        </button>
      </div>

      <div style={{ padding: "0 24px" }}>
        {/* ── TABS ── */}
        <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${BDR}`, marginTop: 8, marginBottom: 20 }}>
          <div style={{ display: "flex", flex: 1, overflowX: "auto" }}>
            {turnos.map(t => (
              <button key={t} onClick={() => { setActiveTab(t); setSearch(""); }}
                style={{
                  padding: "12px 22px", border: "none", whiteSpace: "nowrap",
                  borderBottom: activeTab === t ? `2px solid ${Y}` : "2px solid transparent",
                  background: "none", cursor: "pointer", fontSize: 14,
                  fontWeight: activeTab === t ? 500 : 400,
                  color: activeTab === t ? Y : TXM,
                  transition: "color 0.2s",
                }}>
                {t}
                <span style={{
                  marginLeft: 7, fontSize: 11, borderRadius: 20, padding: "2px 7px", fontWeight: 500,
                  background: activeTab === t ? "#3A2E00" : SUR,
                  color: activeTab === t ? Y : TXM,
                }}>
                  {Object.keys(data[t] || {}).length}
                </span>
              </button>
            ))}
          </div>

          {/* manage turnos button */}
          <button
            onClick={() => setShowManage(true)}
            title="Gerenciar turnos"
            style={{
              flexShrink: 0, marginLeft: 8, padding: "7px 13px",
              borderRadius: 8, border: `1px solid ${BDR}`,
              background: "none", cursor: "pointer", fontSize: 12,
              color: TXM, display: "flex", alignItems: "center", gap: 6,
              transition: "border-color 0.2s, color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = Y; e.currentTarget.style.color = Y; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BDR; e.currentTarget.style.color = TXM; }}>
            ⚙ Gerenciar turnos
          </button>
        </div>

        <TurnoSummary turnoData={turnoData} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
          <input type="text" placeholder="Buscar rep..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ maxWidth: 240, background: SUR, border: `1px solid ${BDR}`, color: TXT, borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowImport(true)}
              style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${BDR}`, background: "none", cursor: "pointer", fontSize: 12, color: TXM }}>
              Vincular planilha
            </button>
            <button onClick={() => setShowAdd(true)}
              style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: Y, color: "#000", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              + Adicionar rep
            </button>
          </div>
        </div>

        {repList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: TXM, fontSize: 14 }}>
            {search ? "Nenhum rep encontrado." : "Nenhum rep neste turno. Adicione manualmente ou importe uma planilha."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))", gap: 14 }}>
            {repList.map(rep => (
              <RepCard key={rep} rep={rep} values={turnoData[rep]}
                onUpdate={(r, vals) => handleUpdate(activeTab, r, vals)}
                onRemove={r => handleRemove(r, activeTab)} />
            ))}
          </div>
        )}
      </div>


      {showAdd && (
        <AddRepModal turno={activeTab} onAdd={(name, admissao) => handleAdd(name, activeTab, admissao)} onClose={() => setShowAdd(false)} />
      )}
      {showImport && (
        <ImportModal turno={activeTab} onImport={handleImport} onClose={() => setShowImport(false)} />
      )}
      {showManage && (
        <ManageTurnosModal
          turnos={turnos}
          onRename={handleRenameTurno}
          onAdd={handleAddTurno}
          onRemove={handleRemoveTurno}
          onClose={() => setShowManage(false)}
        />
      )}
    </div>
  );
}
