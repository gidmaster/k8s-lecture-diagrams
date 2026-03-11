import { useState } from "react";

// ── Primitives ─────────────────────────────────────────────────────────────────

const Pod = ({ ip, highlight, dim }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, opacity: dim ? 0.25 : 1, transition:"all 0.4s" }}>
    <div style={{
      width:38, height:38, borderRadius:8,
      background: highlight ? "linear-gradient(135deg,#14532d,#166534)" : "linear-gradient(135deg,#1e293b,#334155)",
      border:`2px solid ${highlight ? "#22c55e" : "#475569"}`,
      display:"flex", alignItems:"center", justifyContent:"center",
      boxShadow: highlight ? "0 0 12px #22c55e50" : "none", transition:"all 0.4s",
    }}>
      <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#86efac" : "#94a3b8"} />
        <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#22c55e" : "#475569"} />
        <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#22c55e" : "#475569"} />
        <circle cx="16" cy="24" r="2" fill={highlight ? "#16a34a" : "#64748b"} />
      </svg>
    </div>
    <span style={{ fontSize:8, color: highlight ? "#4ade80" : "#64748b", fontFamily:"monospace" }}>{ip}</span>
  </div>
);

const HArrow = ({ active, color="#0ea5e9", label, reverse, width=44, dim }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, opacity: dim ? 0.2 : 1, transition:"opacity 0.4s" }}>
    {label && <span style={{ fontSize:8, color: active ? color : "#334155", fontFamily:"monospace", whiteSpace:"nowrap", transition:"color 0.3s" }}>{label}</span>}
    <div style={{ display:"flex", alignItems:"center" }}>
      {reverse && <div style={{ width:0, height:0, borderTop:"4px solid transparent", borderBottom:"4px solid transparent", borderRight:`6px solid ${active ? color : "#1e293b"}`, transition:"border-color 0.3s" }} />}
      <div style={{ width, height:2, background: active ? color : "#1e293b", transition:"background 0.4s", position:"relative", overflow:"hidden" }}>
        {active && <div style={{ position:"absolute", top:-2, left:0, width:"35%", height:6, background:`linear-gradient(${reverse?"270deg":"90deg"}, transparent, ${color}, transparent)`, animation: reverse ? "slideLeft 0.8s linear infinite" : "slideRight 0.8s linear infinite" }} />}
      </div>
      {!reverse && <div style={{ width:0, height:0, borderTop:"4px solid transparent", borderBottom:"4px solid transparent", borderLeft:`6px solid ${active ? color : "#1e293b"}`, transition:"border-color 0.3s" }} />}
    </div>
    <style>{`@keyframes slideRight{from{left:-35%}to{left:110%}} @keyframes slideLeft{from{left:110%}to{left:-35%}}`}</style>
  </div>
);

const Badge = ({ text, color, bg }) => (
  <div style={{ fontSize:8, color, background:bg, border:`1px solid ${color}`, borderRadius:4, padding:"2px 7px", fontFamily:"monospace", whiteSpace:"nowrap" }}>{text}</div>
);

// ── TYPE CARDS ─────────────────────────────────────────────────────────────────

function ClusterIPCard({ active }) {
  return (
    <div style={{
      background: active ? "linear-gradient(135deg,#0f2027,#1a3a4a)" : "#0d1117",
      border:`2px solid ${active ? "#0ea5e9" : "#1e293b"}`,
      borderRadius:14, padding:"16px 18px",
      display:"flex", flexDirection:"column", gap:10,
      boxShadow: active ? "0 0 24px #0ea5e930" : "none",
      transition:"all 0.4s", minWidth:220,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, color: active ? "#38bdf8" : "#475569", fontWeight:700, fontFamily:"monospace" }}>ClusterIP</span>
        <Badge text="только внутри" color="#38bdf8" bg="#0a1f2a" />
      </div>
      <div style={{ fontSize:9, color:"#64748b", fontFamily:"monospace" }}>
        ClusterIP: <span style={{ color: active ? "#7dd3fc" : "#475569" }}>10.43.234.158</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ fontSize:9, color: active ? "#e2e8f0" : "#475569", fontFamily:"monospace", background:"#0d1117", border:`1px solid ${active ? "#334155" : "#1e293b"}`, borderRadius:6, padding:"4px 8px" }}>
          pod-A · pod-B · pod-C
        </div>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <div style={{ fontSize:9, color:"#64748b", fontFamily:"monospace", background:"#0a1628", border:"1px dashed #1e3a5f", borderRadius:6, padding:"4px 8px" }}>
          внутри кластера
        </div>
        <HArrow active={active} color="#0ea5e9" width={32} />
        <div style={{ fontSize:9, color: active ? "#38bdf8" : "#334155", fontFamily:"monospace", transition:"color 0.3s" }}>svc:80</div>
      </div>
    </div>
  );
}

function NodePortCard({ active }) {
  return (
    <div style={{
      background: active ? "linear-gradient(135deg,#1a1f0a,#2a3014)" : "#0d1117",
      border:`2px solid ${active ? "#84cc16" : "#1e293b"}`,
      borderRadius:14, padding:"16px 18px",
      display:"flex", flexDirection:"column", gap:10,
      boxShadow: active ? "0 0 24px #84cc1630" : "none",
      transition:"all 0.4s", minWidth:220,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, color: active ? "#a3e635" : "#475569", fontWeight:700, fontFamily:"monospace" }}>NodePort</span>
        <Badge text="внешний доступ" color="#84cc16" bg="#1a2a0a" />
      </div>
      <div style={{ fontSize:9, color:"#64748b", fontFamily:"monospace" }}>
        ClusterIP: <span style={{ color: active ? "#7dd3fc" : "#475569" }}>10.43.x.x</span>
        {"  "}nodePort: <span style={{ color: active ? "#a3e635" : "#475569" }}>30080</span>
      </div>

      {/* Node → iptables → pods */}
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        {["worker-node-01", "worker-node-02"].map(node => (
          <div key={node} style={{ display:"flex", alignItems:"center", gap:6 }}>
            <div style={{
              fontSize:8, color: active ? "#e2e8f0" : "#475569", fontFamily:"monospace",
              background:"#0d1117", border:`1px solid ${active ? "#84cc16" : "#1e293b"}`,
              borderRadius:5, padding:"3px 7px", whiteSpace:"nowrap", transition:"all 0.3s",
            }}>{node}:<span style={{ color: active ? "#a3e635" : "#475569" }}>30080</span></div>
            <HArrow active={active} color="#84cc16" width={24} />
            <div style={{ fontSize:8, color: active ? "#86efac" : "#334155", fontFamily:"monospace", transition:"color 0.3s" }}>pods</div>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ fontSize:8, color:"#64748b", fontFamily:"monospace", background:"#0a1628", border:"1px dashed #1e3a5f", borderRadius:5, padding:"3px 7px" }}>интернет / LB</div>
        <HArrow active={active} color="#84cc16" width={28} />
        <div style={{ fontSize:8, color: active ? "#a3e635" : "#334155", fontFamily:"monospace", transition:"color 0.3s" }}>node:30080</div>
      </div>
    </div>
  );
}

function LoadBalancerCard({ active }) {
  return (
    <div style={{
      background: active ? "linear-gradient(135deg,#1a0a2e,#2e1a4a)" : "#0d1117",
      border:`2px solid ${active ? "#a78bfa" : "#1e293b"}`,
      borderRadius:14, padding:"16px 18px",
      display:"flex", flexDirection:"column", gap:10,
      boxShadow: active ? "0 0 24px #a78bfa30" : "none",
      transition:"all 0.4s", minWidth:220,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, color: active ? "#c4b5fd" : "#475569", fontWeight:700, fontFamily:"monospace" }}>LoadBalancer</span>
        <Badge text="облако / MetalLB" color="#a78bfa" bg="#1a0a2e" />
      </div>
      <div style={{ fontSize:9, color:"#64748b", fontFamily:"monospace" }}>
        ExternalIP: <span style={{ color: active ? "#c4b5fd" : "#475569" }}>192.168.1.100</span>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ fontSize:8, color:"#64748b", fontFamily:"monospace", background:"#0a1628", border:"1px dashed #1e3a5f", borderRadius:5, padding:"3px 7px" }}>интернет</div>
          <HArrow active={active} color="#a78bfa" width={24} />
          <div style={{
            fontSize:8, color: active ? "#e2e8f0" : "#475569", fontFamily:"monospace",
            background: active ? "#2d1a4a" : "#0d1117",
            border:`1px solid ${active ? "#a78bfa" : "#1e293b"}`,
            borderRadius:5, padding:"3px 7px", transition:"all 0.3s",
          }}>Cloud LB</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, paddingLeft:8 }}>
          <HArrow active={active} color="#a78bfa" width={20} />
          <div style={{ fontSize:8, color: active ? "#a3e635" : "#334155", fontFamily:"monospace", transition:"color 0.3s" }}>NodePort</div>
          <HArrow active={active} color="#a78bfa" width={20} />
          <div style={{ fontSize:8, color: active ? "#86efac" : "#334155", fontFamily:"monospace", transition:"color 0.3s" }}>pods</div>
        </div>
      </div>
      <div style={{ fontSize:8, color:"#64748b", fontFamily:"monospace", fontStyle:"italic" }}>
        Bare Metal → MetalLB вместо Cloud LB
      </div>
    </div>
  );
}

function ExternalNameCard({ active }) {
  return (
    <div style={{
      background: active ? "linear-gradient(135deg,#1a100a,#2e1a0a)" : "#0d1117",
      border:`2px solid ${active ? "#f59e0b" : "#1e293b"}`,
      borderRadius:14, padding:"16px 18px",
      display:"flex", flexDirection:"column", gap:10,
      boxShadow: active ? "0 0 24px #f59e0b30" : "none",
      transition:"all 0.4s", minWidth:220,
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, color: active ? "#fbbf24" : "#475569", fontWeight:700, fontFamily:"monospace" }}>ExternalName</span>
        <Badge text="DNS CNAME" color="#f59e0b" bg="#1a1000" />
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ fontSize:8, color: active ? "#e2e8f0" : "#475569", fontFamily:"monospace", background:"#0d1117", border:`1px solid ${active ? "#334155" : "#1e293b"}`, borderRadius:5, padding:"3px 7px", whiteSpace:"nowrap", transition:"all 0.3s" }}>
            pod → ext-db-svc
          </div>
          <HArrow active={active} color="#f59e0b" width={24} />
          <div style={{ fontSize:8, color: active ? "#fbbf24" : "#334155", fontFamily:"monospace", transition:"color 0.3s" }}>CoreDNS</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:5, paddingLeft:8 }}>
          <span style={{ fontSize:8, color: active ? "#f59e0b" : "#334155", fontFamily:"monospace", transition:"color 0.3s" }}>CNAME →</span>
          <div style={{ fontSize:8, color: active ? "#fbbf24" : "#475569", fontFamily:"monospace", background: active ? "#2a1a00" : "#0d1117", border:`1px solid ${active ? "#f59e0b" : "#1e293b"}`, borderRadius:5, padding:"3px 7px", transition:"all 0.3s", maxWidth:130, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            db.postgres.azure.com
          </div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
        <div style={{ fontSize:8, color:"#ef4444", fontFamily:"monospace" }}>✗ нет healthcheck</div>
        <div style={{ fontSize:8, color:"#ef4444", fontFamily:"monospace" }}>✗ нет балансировки</div>
        <div style={{ fontSize:8, color:"#22c55e", fontFamily:"monospace" }}>✓ смена адреса без рестарта подов</div>
      </div>
    </div>
  );
}

// ── Hierarchy step ─────────────────────────────────────────────────────────────

function HierarchyView() {
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      <div style={{ fontSize:11, color:"#64748b", fontFamily:"monospace" }}>каждый следующий тип включает предыдущий</div>
      <div style={{ display:"flex", alignItems:"center", gap:0 }}>

        {/* ClusterIP */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{ background:"linear-gradient(135deg,#0f2027,#1a3a4a)", border:"2px solid #0ea5e9", borderRadius:10, padding:"10px 16px", textAlign:"center" }}>
            <div style={{ fontSize:11, color:"#38bdf8", fontWeight:700, fontFamily:"monospace" }}>ClusterIP</div>
            <div style={{ fontSize:8, color:"#64748b", fontFamily:"monospace", marginTop:3 }}>только внутри</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, margin:"0 4px" }}>
          <span style={{ fontSize:8, color:"#475569", fontFamily:"monospace" }}>+nodePort</span>
          <div style={{ display:"flex", alignItems:"center" }}>
            <div style={{ width:28, height:2, background:"#84cc16" }} />
            <div style={{ width:0, height:0, borderTop:"4px solid transparent", borderBottom:"4px solid transparent", borderLeft:"6px solid #84cc16" }} />
          </div>
        </div>

        {/* NodePort */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{ background:"linear-gradient(135deg,#1a1f0a,#2a3014)", border:"2px solid #84cc16", borderRadius:10, padding:"10px 16px", textAlign:"center" }}>
            <div style={{ fontSize:11, color:"#a3e635", fontWeight:700, fontFamily:"monospace" }}>NodePort</div>
            <div style={{ fontSize:8, color:"#64748b", fontFamily:"monospace", marginTop:3 }}>node:30000-32767</div>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, margin:"0 4px" }}>
          <span style={{ fontSize:8, color:"#475569", fontFamily:"monospace" }}>+ExternalIP</span>
          <div style={{ display:"flex", alignItems:"center" }}>
            <div style={{ width:28, height:2, background:"#a78bfa" }} />
            <div style={{ width:0, height:0, borderTop:"4px solid transparent", borderBottom:"4px solid transparent", borderLeft:"6px solid #a78bfa" }} />
          </div>
        </div>

        {/* LoadBalancer */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{ background:"linear-gradient(135deg,#1a0a2e,#2e1a4a)", border:"2px solid #a78bfa", borderRadius:10, padding:"10px 16px", textAlign:"center" }}>
            <div style={{ fontSize:11, color:"#c4b5fd", fontWeight:700, fontFamily:"monospace" }}>LoadBalancer</div>
            <div style={{ fontSize:8, color:"#64748b", fontFamily:"monospace", marginTop:3 }}>облако / MetalLB</div>
          </div>
        </div>

      </div>

      {/* ExternalName — отдельно */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
        <div style={{ width:2, height:16, background:"#334155" }} />
        <div style={{ fontSize:8, color:"#475569", fontFamily:"monospace" }}>отдельный механизм (DNS CNAME, без iptables)</div>
        <div style={{ background:"linear-gradient(135deg,#1a100a,#2e1a0a)", border:"2px solid #f59e0b", borderRadius:10, padding:"10px 16px", textAlign:"center" }}>
          <div style={{ fontSize:11, color:"#fbbf24", fontWeight:700, fontFamily:"monospace" }}>ExternalName</div>
          <div style={{ fontSize:8, color:"#64748b", fontFamily:"monospace", marginTop:3 }}>CNAME → внешний хост</div>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────

const STEPS = [
  { id:"hierarchy", title:"Иерархия типов сервисов", subtitle:"Каждый следующий тип надстраивается над предыдущим. ExternalName — отдельный механизм." },
  { id:"clusterip",     title:"ClusterIP — доступ только внутри кластера", subtitle:"Стабильный виртуальный IP. Работает через iptables DNAT. Доступен только изнутри кластера." },
  { id:"nodeport",      title:"NodePort — внешний доступ через порт на каждой ноде", subtitle:"Включает ClusterIP. На каждой ноде открывается одинаковый порт из диапазона 30000–32767." },
  { id:"loadbalancer",  title:"LoadBalancer — внешний балансировщик", subtitle:"Включает NodePort. Облачный провайдер создаёт внешний LB. На Bare Metal — нужен MetalLB." },
  { id:"externalname",  title:"ExternalName — псевдоним для внешнего сервиса", subtitle:"Работает через DNS CNAME, а не iptables. Нет балансировки, нет healthcheck." },
];

export default function ServiceTypes() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  return (
    <div style={{
      minHeight:"100vh", background:"#080c14",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"monospace", padding:24, gap:20,
    }}>
      {/* Header */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:11, color:"#38bdf8", letterSpacing:3, marginBottom:6 }}>KUBERNETES • ТИПЫ СЕРВИСОВ</div>
        <div style={{ fontSize:20, color:"#f1f5f9", fontWeight:700 }}>{cur.title}</div>
        <div style={{ fontSize:11, color:"#64748b", marginTop:6 }}>{cur.subtitle}</div>
      </div>

      {/* Tab pills */}
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
        {STEPS.map((s, i) => {
          const colors = { hierarchy:"#64748b", clusterip:"#0ea5e9", nodeport:"#84cc16", loadbalancer:"#a78bfa", externalname:"#f59e0b" };
          const c = colors[s.id];
          return (
            <div key={s.id} onClick={() => setStep(i)} style={{
              padding:"4px 14px", borderRadius:20, cursor:"pointer",
              background: i === step ? `${c}20` : "#0d1117",
              border:`1px solid ${i === step ? c : "#1e293b"}`,
              color: i === step ? c : "#475569",
              fontSize:10, transition:"all 0.3s",
            }}>{s.id === "hierarchy" ? "обзор" : s.id}</div>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ animation:"fadeIn 0.3s ease" }}>
        {cur.id === "hierarchy" && <HierarchyView />}
        {cur.id !== "hierarchy" && (
          <div style={{ display:"flex", justifyContent:"center" }}>
            {cur.id === "clusterip"    && <ClusterIPCard active />}
            {cur.id === "nodeport"     && <NodePortCard active />}
            {cur.id === "loadbalancer" && <LoadBalancerCard active />}
            {cur.id === "externalname" && <ExternalNameCard active />}
          </div>
        )}
      </div>

      {/* All-4 overview at hierarchy step */}
      {cur.id === "hierarchy" && (
        <div style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center", marginTop:4 }}>
          <ClusterIPCard active={false} />
          <NodePortCard active={false} />
          <LoadBalancerCard active={false} />
          <ExternalNameCard active={false} />
        </div>
      )}

      {/* Nav */}
      <div style={{ display:"flex", gap:12, alignItems:"center" }}>
        <button onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0}
          style={{ padding:"8px 20px", borderRadius:8, border:"1px solid #334155", background: step===0 ? "#0d1117" : "#1e293b", color: step===0 ? "#475569" : "#e2e8f0", cursor: step===0 ? "default" : "pointer", fontSize:12 }}>
          ← Назад
        </button>
        <div style={{ display:"flex", gap:6 }}>
          {STEPS.map((_,i) => <div key={i} onClick={() => setStep(i)} style={{ width: i===step ? 20 : 8, height:8, borderRadius:4, background: i===step ? "#0ea5e9" : "#1e293b", transition:"all 0.3s", cursor:"pointer" }} />)}
        </div>
        <button onClick={() => setStep(s => Math.min(STEPS.length-1, s+1))} disabled={step===STEPS.length-1}
          style={{ padding:"8px 20px", borderRadius:8, border:"1px solid #334155", background: step===STEPS.length-1 ? "#0d1117" : "#1e293b", color: step===STEPS.length-1 ? "#475569" : "#e2e8f0", cursor: step===STEPS.length-1 ? "default" : "pointer", fontSize:12 }}>
          Вперёд →
        </button>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
