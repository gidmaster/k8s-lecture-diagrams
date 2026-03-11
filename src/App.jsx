import { useState } from "react";
import DNS from "./DNS.jsx";
import ClusterIP from "./ClusterIP.jsx";
import IPTables from "./IPTables.jsx";

const NAV = [
  { id: "services", label: "01 · Services" },
  { id: "dns",      label: "02 · DNS" },
  { id: "clusterip",label: "03 · ClusterIP" },
  { id: "iptables", label: "04 · iptables" },
];

const PodIcon = ({ ip, highlight, dead }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: dead ? 0.35 : 1, transition: "opacity 0.4s" }}>
    <div style={{
      width: 52, height: 52, borderRadius: 10,
      background: dead ? "#2a2a3a" : highlight ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "linear-gradient(135deg,#1e293b,#334155)",
      border: `2px solid ${dead ? "#3f3f5a" : highlight ? "#6366f1" : "#475569"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: highlight && !dead ? "0 0 16px #6366f180" : "none", transition: "all 0.4s",
    }}>
      {dead ? <span style={{ color: "#ef4444", fontSize: 22, fontWeight: 700 }}>✕</span>
        : <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#bfdbfe" : "#94a3b8"} />
            <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
            <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
            <circle cx="16" cy="24" r="2" fill={highlight ? "#6366f1" : "#64748b"} />
          </svg>}
    </div>
    <span style={{ fontSize: 9, color: dead ? "#4b5563" : "#94a3b8", fontFamily: "monospace" }}>{dead ? "☠ crashed" : ip}</span>
  </div>
);

const SvcBox = ({ label, ip, highlight }) => (
  <div style={{
    background: highlight ? "linear-gradient(135deg,#0f2a3a,#1a4a5a)" : "linear-gradient(135deg,#0f2027,#1a3a4a)",
    border: `2px solid ${highlight ? "#38bdf8" : "#0ea5e9"}`,
    borderRadius: 14, padding: "12px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    boxShadow: highlight ? "0 0 24px #0ea5e960" : "0 0 12px #0ea5e920",
    transition: "all 0.4s", minWidth: 140,
  }}>
    <span style={{ fontSize: 9, color: "#38bdf8", fontFamily: "monospace", letterSpacing: 1 }}>Service</span>
    <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>{label}</span>
    <span style={{ fontSize: 9, color: "#7dd3fc", fontFamily: "monospace" }}>{ip}</span>
  </div>
);

const Arrow = ({ label, color = "#0ea5e9", dashed = false }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {label && <span style={{ fontSize: 9, color, fontFamily: "monospace" }}>{label}</span>}
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{ width: 52, height: 2, background: dashed ? `repeating-linear-gradient(90deg,${color} 0,${color} 6px,transparent 6px,transparent 12px)` : color }} />
      <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${color}` }} />
    </div>
  </div>
);

const svcSteps = [
  { title: "Проблема 1: нестабильные IP", subtitle: "Бекенд-под упал → перезапустился → получил новый IP. Фронтенд не знает куда идти.", deadBackendPod: "be-1", showService: false, arrowColor: "#ef4444", arrowLabel: "hard-coded IP?", badgeColor: "#ef4444", badgeBg: "#2d1515", badgeText: "⚠ IP бекенда изменился после рестарта" },
  { title: "Проблема 2: балансировка нагрузки", subtitle: "Несколько бекенд-подов — на какой из них слать запросы?", deadBackendPod: null, showService: false, arrowColor: "#eab308", arrowLabel: "load balance?", badgeColor: "#eab308", badgeBg: "#1a1a00", badgeText: "? на какой бекенд-под слать запрос?" },
  { title: "Решение: Kubernetes Service", subtitle: "frontend-pod обращается к backend-svc — стабильный IP и балансировка.", deadBackendPod: null, showService: true },
];

function ServicesPage() {
  const [step, setStep] = useState(0);
  const cur = svcSteps[step];
  const fePods = [{ id: "fe-1", ip: "10.0.1.11" }, { id: "fe-2", ip: "10.0.1.12" }, { id: "fe-3", ip: "10.0.1.13" }];
  const bePods = [{ id: "be-1", ip: "10.0.2.21" }, { id: "be-2", ip: "10.0.2.22" }];

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace", padding: 32, gap: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>KUBERNETES • СЕТЕВАЯ ПОДСИСТЕМА</div>
        <div style={{ fontSize: 24, color: "#f1f5f9", fontWeight: 700 }}>{cur.title}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>{cur.subtitle}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", background: "#0d1117", border: "1px solid #1e293b", borderRadius: 20, padding: "32px 40px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>FRONTEND</span>
          <div style={{ display: "flex", gap: 14 }}>{fePods.map(p => <PodIcon key={p.id} ip={p.ip} highlight={cur.showService} />)}</div>
        </div>
        {cur.showService ? (
          <><div style={{ margin: "0 10px" }}><Arrow color="#0ea5e9" label="запрос" /></div><SvcBox label="backend-svc" ip="10.96.20.20 (stable)" highlight /><div style={{ margin: "0 10px" }}><Arrow color="#0ea5e9" label="балансировка" /></div></>
        ) : (
          <div style={{ margin: "0 18px" }}><Arrow color={cur.arrowColor} dashed label={cur.arrowLabel} /></div>
        )}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>BACKEND</span>
          <div style={{ display: "flex", gap: 14 }}>{bePods.map(p => <PodIcon key={p.id} ip={p.ip} highlight={cur.showService} dead={cur.deadBackendPod === p.id} />)}</div>
          {!cur.showService && <div style={{ marginTop: 4, background: cur.badgeBg, border: `1px solid ${cur.badgeColor}`, borderRadius: 8, padding: "4px 12px", fontSize: 9, color: cur.badgeColor }}>{cur.badgeText}</div>}
        </div>
      </div>
      {cur.showService && (
        <div style={{ background: "#0a1628", border: "1px dashed #6366f1", borderRadius: 12, padding: "10px 24px", display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <span style={{ fontSize: 11, color: "#a5b4fc" }}>Обращаться по имени: <span style={{ color: "#818cf8", fontWeight: 700 }}>backend-svc.default.svc.cluster.local</span> → это задача <span style={{ color: "#c7d2fe" }}>CoreDNS</span></span>
        </div>
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #334155", background: step === 0 ? "#0d1117" : "#1e293b", color: step === 0 ? "#475569" : "#e2e8f0", cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}>← Назад</button>
        <div style={{ display: "flex", gap: 6 }}>{svcSteps.map((_, i) => <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? "#0ea5e9" : "#1e293b", transition: "all 0.3s", cursor: "pointer" }} />)}</div>
        <button onClick={() => setStep(s => Math.min(svcSteps.length - 1, s + 1))} disabled={step === svcSteps.length - 1} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #334155", background: step === svcSteps.length - 1 ? "#0d1117" : "#1e293b", color: step === svcSteps.length - 1 ? "#475569" : "#e2e8f0", cursor: step === svcSteps.length - 1 ? "default" : "pointer", fontSize: 12 }}>Вперёд →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("services");
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", fontFamily: "monospace" }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "#0d1117ee", backdropFilter: "blur(12px)", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", padding: "0 24px", height: 48 }}>
        <span style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 2, marginRight: 24 }}>K8S LECTURES</span>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)} style={{ padding: "0 18px", height: 48, border: "none", borderBottom: page === n.id ? "2px solid #0ea5e9" : "2px solid transparent", background: "transparent", color: page === n.id ? "#e2e8f0" : "#64748b", cursor: "pointer", fontSize: 11, fontFamily: "monospace", transition: "all 0.2s" }}>{n.label}</button>
        ))}
      </nav>
      <div style={{ paddingTop: 48 }}>
        {page === "services"  && <ServicesPage />}
        {page === "dns"       && <DNS />}
        {page === "clusterip" && <ClusterIP />}
        {page === "iptables"  && <IPTables />}
      </div>
    </div>
  );
}
