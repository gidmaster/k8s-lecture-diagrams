import { useState } from "react";

const STEPS = [
  {
    id: "overview",
    title: "Ingress — единая точка входа",
    subtitle: "Один контроллер принимает весь HTTP/HTTPS трафик снаружи и маршрутизирует его по правилам.",
    activeFlow: null,
  },
  {
    id: "resource",
    title: "Ingress Controller читает правила через API",
    subtitle: "Ingress Resource — это YAML с правилами. Ingress Controller — под который эти правила применяет.",
    activeFlow: "resource",
  },
  {
    id: "blog",
    title: "blog.my-domain.com → blog-service",
    subtitle: "Запрос на blog.my-domain.com: Controller смотрит в правила → находит совпадение по хосту → отправляет в blog-service.",
    activeFlow: "blog",
  },
  {
    id: "api",
    title: "api.my-domain.com → api-service",
    subtitle: "Запрос на api.my-domain.com: тот же Controller, то же правило — другой хост → другой сервис.",
    activeFlow: "api",
  },
];

// ── Primitives ─────────────────────────────────────────────────────────────────

const Pod = ({ label, ip, highlight, dim }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, opacity: dim ? 0.2 : 1, transition:"all 0.4s" }}>
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
    {label && <span style={{ fontSize:8, color: highlight ? "#86efac" : "#64748b", fontFamily:"monospace" }}>{label}</span>}
    {ip && <span style={{ fontSize:7, color: highlight ? "#4ade80" : "#475569", fontFamily:"monospace" }}>{ip}</span>}
  </div>
);

const SvcBox = ({ label, highlight, dim }) => (
  <div style={{
    background: highlight ? "linear-gradient(135deg,#0f2a3a,#1a4a5a)" : "linear-gradient(135deg,#0f2027,#1a3a4a)",
    border:`2px solid ${highlight ? "#38bdf8" : "#1e3a4a"}`,
    borderRadius:10, padding:"8px 14px",
    display:"flex", flexDirection:"column", alignItems:"center", gap:3,
    boxShadow: highlight ? "0 0 16px #0ea5e950" : "none",
    transition:"all 0.4s", minWidth:110, opacity: dim ? 0.2 : 1,
  }}>
    <span style={{ fontSize:8, color:"#38bdf8", fontFamily:"monospace" }}>Service</span>
    <span style={{ fontSize:11, color: highlight ? "#e2e8f0" : "#64748b", fontWeight:700, fontFamily:"monospace" }}>{label}</span>
    <span style={{ fontSize:8, color: highlight ? "#7dd3fc" : "#334155", fontFamily:"monospace" }}>port: 80</span>
  </div>
);

const HArrow = ({ active, color="#0ea5e9", label, width=44, dim, dashed }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, opacity: dim ? 0.15 : 1, transition:"opacity 0.4s" }}>
    {label && <span style={{ fontSize:8, color: active ? color : "#334155", fontFamily:"monospace", whiteSpace:"nowrap", transition:"color 0.3s" }}>{label}</span>}
    <div style={{ display:"flex", alignItems:"center" }}>
      <div style={{
        width, height:2,
        background: dashed
          ? `repeating-linear-gradient(90deg,${active ? color : "#1e293b"} 0,${active ? color : "#1e293b"} 5px,transparent 5px,transparent 10px)`
          : (active ? color : "#1e293b"),
        transition:"background 0.4s", position:"relative", overflow:"hidden",
      }}>
        {active && !dashed && <div style={{ position:"absolute", top:-2, left:0, width:"35%", height:6, background:`linear-gradient(90deg, transparent, ${color}, transparent)`, animation:"slideRight 0.8s linear infinite" }} />}
      </div>
      <div style={{ width:0, height:0, borderTop:"4px solid transparent", borderBottom:"4px solid transparent", borderLeft:`6px solid ${active ? color : "#1e293b"}`, transition:"border-color 0.3s" }} />
    </div>
    <style>{`@keyframes slideRight{from{left:-35%}to{left:110%}}`}</style>
  </div>
);

const VArrow = ({ active, color, height=20, label }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
    {label && <span style={{ fontSize:8, color: active ? color : "#334155", fontFamily:"monospace", transition:"color 0.3s", whiteSpace:"nowrap" }}>{label}</span>}
    <div style={{ width:2, height, background: active ? color : "#1e293b", transition:"background 0.4s" }} />
    <div style={{ width:0, height:0, borderLeft:"4px solid transparent", borderRight:"4px solid transparent", borderTop:`6px solid ${active ? color : "#1e293b"}`, transition:"all 0.3s" }} />
  </div>
);

// ── Ingress Resource панель ────────────────────────────────────────────────────

const IngressResource = ({ highlight, blogActive, apiActive }) => (
  <div style={{
    background: highlight ? "#0d1f2a" : "#0d1117",
    border:`2px solid ${highlight ? "#f59e0b" : "#1e293b"}`,
    borderRadius:12, padding:"12px 14px",
    display:"flex", flexDirection:"column", gap:6,
    boxShadow: highlight ? "0 0 20px #f59e0b30" : "none",
    transition:"all 0.4s", minWidth:200,
  }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <span style={{ fontSize:9, color:"#f59e0b", fontFamily:"monospace", letterSpacing:1 }}>Ingress Resource</span>
      <span style={{ fontSize:8, color:"#64748b", fontFamily:"monospace" }}>YAML</span>
    </div>
    {/* rule 1 */}
    <div style={{
      background: blogActive ? "#0a2a0a" : "#0d1117",
      border:`1px solid ${blogActive ? "#22c55e" : "#1e293b"}`,
      borderRadius:6, padding:"5px 8px", transition:"all 0.3s",
    }}>
      <div style={{ fontSize:8, color: blogActive ? "#4ade80" : "#475569", fontFamily:"monospace" }}>host: blog.my-domain.com</div>
      <div style={{ fontSize:8, color: blogActive ? "#86efac" : "#334155", fontFamily:"monospace" }}>  → blog-service:80</div>
    </div>
    {/* rule 2 */}
    <div style={{
      background: apiActive ? "#0a1f2a" : "#0d1117",
      border:`1px solid ${apiActive ? "#38bdf8" : "#1e293b"}`,
      borderRadius:6, padding:"5px 8px", transition:"all 0.3s",
    }}>
      <div style={{ fontSize:8, color: apiActive ? "#7dd3fc" : "#475569", fontFamily:"monospace" }}>host: api.my-domain.com</div>
      <div style={{ fontSize:8, color: apiActive ? "#bae6fd" : "#334155", fontFamily:"monospace" }}>  → api-service:80</div>
    </div>
    <div style={{ fontSize:8, color:"#475569", fontFamily:"monospace", fontStyle:"italic" }}>
      ingressClassName: nginx
    </div>
  </div>
);

// ── Ingress Controller блок ────────────────────────────────────────────────────

const IngressController = ({ highlight, watchActive }) => (
  <div style={{
    background: highlight ? "linear-gradient(135deg,#1a0a2e,#2d1a4a)" : "linear-gradient(135deg,#1a1a2e,#1e1e3a)",
    border:`2px solid ${highlight ? "#a78bfa" : "#2d2d5a"}`,
    borderRadius:14, padding:"14px 18px",
    display:"flex", flexDirection:"column", gap:8,
    boxShadow: highlight ? "0 0 24px #a78bfa40" : "none",
    transition:"all 0.4s", minWidth:170,
  }}>
    <span style={{ fontSize:9, color:"#a78bfa", fontFamily:"monospace", letterSpacing:1 }}>Ingress Controller</span>
    <span style={{ fontSize:12, color: highlight ? "#e2e8f0" : "#94a3b8", fontWeight:700, fontFamily:"monospace" }}>nginx-pod</span>
    <div style={{
      background:"#0d1117", border:`1px solid ${highlight ? "#6d28d9" : "#1e293b"}`,
      borderRadius:6, padding:"4px 8px",
      fontSize:8, color: highlight ? "#c4b5fd" : "#475569", fontFamily:"monospace",
      transition:"all 0.3s",
    }}>
      nginx (внутри пода)
    </div>
    {watchActive && (
      <div style={{ fontSize:8, color:"#f59e0b", fontFamily:"monospace", background:"#1a1000", border:"1px solid #f59e0b", borderRadius:4, padding:"2px 6px", animation:"fadeIn 0.3s ease" }}>
        ⟳ следит за API
      </div>
    )}
  </div>
);

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Ingress() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const flow = cur.activeFlow;

  const blogActive = flow === "blog";
  const apiActive  = flow === "api";
  const trafficActive = blogActive || apiActive;
  const resourceHighlight = flow === "resource" || blogActive || apiActive;
  const controllerHighlight = trafficActive || flow === "resource";
  const watchActive = flow === "resource";

  const internetColor = blogActive ? "#22c55e" : apiActive ? "#38bdf8" : "#64748b";

  return (
    <div style={{
      minHeight:"100vh", background:"#080c14",
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      fontFamily:"monospace", padding:24, gap:20,
    }}>
      {/* Header */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:11, color:"#38bdf8", letterSpacing:3, marginBottom:6 }}>KUBERNETES • INGRESS</div>
        <div style={{ fontSize:20, color:"#f1f5f9", fontWeight:700 }}>{cur.title}</div>
        <div style={{ fontSize:11, color:"#64748b", marginTop:6 }}>{cur.subtitle}</div>
      </div>

      {/* Main diagram */}
      <div style={{ display:"flex", alignItems:"center", gap:0 }}>

        {/* Интернет */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{
            background:"#0d1117", border:`2px solid ${trafficActive ? internetColor : "#1e293b"}`,
            borderRadius:12, padding:"12px 16px", textAlign:"center",
            boxShadow: trafficActive ? `0 0 20px ${internetColor}40` : "none",
            transition:"all 0.4s",
          }}>
            <div style={{ fontSize:22 }}>🌐</div>
            <div style={{ fontSize:9, color: trafficActive ? internetColor : "#475569", fontFamily:"monospace", marginTop:4 }}>интернет</div>
            {blogActive && <div style={{ fontSize:8, color:"#4ade80", fontFamily:"monospace", marginTop:4, animation:"fadeIn 0.3s ease" }}>blog.my-domain.com</div>}
            {apiActive  && <div style={{ fontSize:8, color:"#7dd3fc", fontFamily:"monospace", marginTop:4, animation:"fadeIn 0.3s ease" }}>api.my-domain.com</div>}
          </div>
        </div>

        {/* → Controller */}
        <div style={{ margin:"0 8px" }}>
          <HArrow active={trafficActive} color={internetColor} label=":443 HTTPS" width={52} />
        </div>

        {/* Ingress Controller */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <IngressController highlight={controllerHighlight} watchActive={watchActive} />
        </div>

        {/* Controller → Services (два пути) */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, margin:"0 8px" }}>
          {/* blog path */}
          <HArrow active={blogActive} color="#22c55e" label="blog.my-domain.com" width={80} dim={apiActive} />
          {/* api path */}
          <HArrow active={apiActive} color="#38bdf8" label="api.my-domain.com" width={80} dim={blogActive} />
        </div>

        {/* Services + Pods */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* blog */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <SvcBox label="blog-service" highlight={blogActive} dim={apiActive} />
            <HArrow active={blogActive} color="#22c55e" width={28} dim={apiActive} />
            <div style={{ display:"flex", gap:6 }}>
              <Pod label="blog-1" ip="10.42.0.10" highlight={blogActive} dim={apiActive} />
              <Pod label="blog-2" ip="10.42.0.11" highlight={blogActive} dim={apiActive} />
            </div>
          </div>
          {/* api */}
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <SvcBox label="api-service" highlight={apiActive} dim={blogActive} />
            <HArrow active={apiActive} color="#38bdf8" width={28} dim={blogActive} />
            <div style={{ display:"flex", gap:6 }}>
              <Pod label="api-1" ip="10.42.1.20" highlight={apiActive} dim={blogActive} />
              <Pod label="api-2" ip="10.42.1.21" highlight={apiActive} dim={blogActive} />
            </div>
          </div>
        </div>

      </div>

      {/* Ingress Resource + watch arrow — показываем на шаге resource и далее */}
      {(flow === "resource" || trafficActive) && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, animation:"fadeIn 0.4s ease" }}>
          <div style={{ fontSize:8, color:"#f59e0b", fontFamily:"monospace" }}>
            {flow === "resource" ? "⟳ Controller следит за изменениями через kube-apiserver" : "правила применены"}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <IngressResource
              highlight={resourceHighlight}
              blogActive={blogActive}
              apiActive={apiActive}
            />
            <HArrow active={flow === "resource"} color="#f59e0b" dashed width={40} />
            <div style={{ fontSize:9, color: flow === "resource" ? "#c4b5fd" : "#334155", fontFamily:"monospace", transition:"color 0.3s" }}>
              nginx-pod
            </div>
          </div>
        </div>
      )}

      {/* Annotation */}
      {flow === "overview" || !flow ? (
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center", maxWidth:700 }}>
          {[
            { icon:"🔀", title:"L7 маршрутизация", text:"по хосту и пути URL" },
            { icon:"🔒", title:"SSL termination", text:"один сертификат для всех сервисов" },
            { icon:"⚖️", title:"Балансировка", text:"между подами сервиса" },
            { icon:"🔌", title:"Не часть k8s core", text:"устанавливается отдельно" },
          ].map(item => (
            <div key={item.title} style={{ background:"#0d1117", border:"1px solid #1e293b", borderRadius:10, padding:"10px 14px", textAlign:"center", minWidth:130 }}>
              <div style={{ fontSize:20 }}>{item.icon}</div>
              <div style={{ fontSize:10, color:"#e2e8f0", fontFamily:"monospace", marginTop:4, fontWeight:700 }}>{item.title}</div>
              <div style={{ fontSize:8, color:"#64748b", fontFamily:"monospace", marginTop:2 }}>{item.text}</div>
            </div>
          ))}
        </div>
      ) : null}

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
