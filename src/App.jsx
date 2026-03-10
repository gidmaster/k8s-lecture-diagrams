import { useState } from "react";

const pods = {
  frontend: [
    { id: "fe-1", label: "frontend-pod-1", ip: "10.0.1.11" },
    { id: "fe-2", label: "frontend-pod-2", ip: "10.0.1.12" },
    { id: "fe-3", label: "frontend-pod-3", ip: "10.0.1.13" },
  ],
  backend: [
    { id: "be-1", label: "backend-pod-1", ip: "10.0.2.21" },
    { id: "be-2", label: "backend-pod-2", ip: "10.0.2.22" },
  ],
};

const PodIcon = ({ ip, highlight, dead }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: dead ? 0.35 : 1, transition: "opacity 0.4s" }}>
    <div style={{
      width: 52, height: 52, borderRadius: 10,
      background: dead ? "#2a2a3a" : highlight ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "linear-gradient(135deg,#1e293b,#334155)",
      border: `2px solid ${dead ? "#3f3f5a" : highlight ? "#6366f1" : "#475569"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: highlight && !dead ? "0 0 16px #6366f180" : "none",
      transition: "all 0.4s",
    }}>
      {dead
        ? <span style={{ color: "#ef4444", fontSize: 22, fontWeight: 700 }}>✕</span>
        : <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#bfdbfe" : "#94a3b8"} />
            <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
            <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
            <circle cx="16" cy="24" r="2" fill={highlight ? "#6366f1" : "#64748b"} />
          </svg>
      }
    </div>
    <span style={{ fontSize: 9, color: dead ? "#4b5563" : "#94a3b8", fontFamily: "monospace" }}>
      {dead ? "☠ crashed" : ip}
    </span>
  </div>
);

const ServiceBox = ({ label, ip }) => (
  <div style={{
    background: "linear-gradient(135deg,#0f2027,#1a3a4a)",
    border: "2px solid #0ea5e9", borderRadius: 14,
    padding: "14px 22px", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4,
    boxShadow: "0 0 24px #0ea5e940", minWidth: 150,
  }}>
    <span style={{ fontSize: 10, color: "#38bdf8", fontFamily: "monospace", letterSpacing: 1 }}>Service</span>
    <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>{label}</span>
    <span style={{ fontSize: 10, color: "#7dd3fc", fontFamily: "monospace" }}>{ip}</span>
  </div>
);

const Arrow = ({ label, color = "#0ea5e9", dashed = false }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {label && <span style={{ fontSize: 9, color, fontFamily: "monospace", letterSpacing: 0.5 }}>{label}</span>}
    <div style={{ display: "flex", alignItems: "center" }}>
      <div style={{
        width: 48, height: 2,
        background: dashed
          ? `repeating-linear-gradient(90deg,${color} 0,${color} 6px,transparent 6px,transparent 12px)`
          : color,
      }} />
      <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${color}` }} />
    </div>
  </div>
);

const steps = [
  {
    title: "Проблема 1: нестабильные IP",
    subtitle: "Под упал → перезапустился → получил новый IP. Конфиг сломан.",
    deadPod: "fe-2",
    showServices: false,
    arrowColor: "#ef4444",
    arrowLabel: "hard-coded IP?",
  },
  {
    title: "Проблема 2: балансировка нагрузки",
    subtitle: "Три пода фронтенда — на какой из них слать запросы?",
    deadPod: null,
    showServices: false,
    arrowColor: "#eab308",
    arrowLabel: "load balance?",
  },
  {
    title: "Решение: Kubernetes Service",
    subtitle: "Стабильный виртуальный IP + балансировка трафика по всем подам.",
    deadPod: null,
    showServices: true,
    arrowColor: "#0ea5e9",
    arrowLabel: null,
  },
];

export default function App() {
  const [step, setStep] = useState(0);
  const current = steps[step];

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: 32, gap: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • СЕТЕВАЯ ПОДСИСТЕМА
        </div>
        <div style={{ fontSize: 24, color: "#f1f5f9", fontWeight: 700 }}>{current.title}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>{current.subtitle}</div>
      </div>

      {/* Diagram */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "32px 40px",
      }}>
        {/* Frontend pods */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, color: "#64748b", letterSpacing: 2 }}>FRONTEND</span>
          <div style={{ display: "flex", gap: 16 }}>
            {pods.frontend.map((p) => (
              <PodIcon key={p.id} ip={p.ip} highlight={current.showServices} dead={current.deadPod === p.id} />
            ))}
          </div>
          {step === 0 && (
            <div style={{ marginTop: 6, background: "#2d1515", border: "1px solid #ef4444", borderRadius: 8, padding: "4px 12px", fontSize: 9, color: "#ef4444" }}>
              ⚠ IP изменился после рестарта
            </div>
          )}
          {step === 1 && (
            <div style={{ marginTop: 6, background: "#1a1a00", border: "1px solid #eab308", borderRadius: 8, padding: "4px 12px", fontSize: 9, color: "#eab308" }}>
              ? на какой под слать запрос?
            </div>
          )}
        </div>

        {/* Middle section */}
        {current.showServices ? (
          <>
            <div style={{ margin: "0 8px" }}><Arrow color="#0ea5e9" /></div>
            <ServiceBox label="frontend-svc" ip="10.96.10.10 (stable)" />
            <div style={{ margin: "0 8px" }}><Arrow color="#0ea5e9" label="балансировка" /></div>
          </>
        ) : (
          <div style={{ margin: "0 16px" }}>
            <Arrow color={current.arrowColor} dashed label={current.arrowLabel} />
          </div>
        )}

        {/* Backend pods */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 10, color: "#64748b", letterSpacing: 2 }}>BACKEND</span>
          <div style={{ display: "flex", gap: 16 }}>
            {pods.backend.map((p) => (
              <PodIcon key={p.id} ip={p.ip} highlight={current.showServices} dead={false} />
            ))}
          </div>
        </div>

        {/* Backend service */}
        {current.showServices && (
          <>
            <div style={{ margin: "0 8px" }}><Arrow color="#0ea5e9" /></div>
            <ServiceBox label="backend-svc" ip="10.96.20.20 (stable)" />
            <div style={{ margin: "0 8px" }}><Arrow color="#0ea5e9" label="балансировка" /></div>
          </>
        )}
      </div>

      {/* DNS hint */}
      {current.showServices && (
        <div style={{
          background: "#0a1628", border: "1px dashed #6366f1", borderRadius: 12,
          padding: "10px 24px", display: "flex", gap: 12, alignItems: "center",
          animation: "fadeIn 0.5s ease",
        }}>
          <span style={{ fontSize: 18 }}>🔍</span>
          <span style={{ fontSize: 11, color: "#a5b4fc" }}>
            А ещё хорошо бы обращаться по имени:{" "}
            <span style={{ color: "#818cf8", fontWeight: 700 }}>backend-svc.default.svc.cluster.local</span>
            {" "}→ это задача <span style={{ color: "#c7d2fe" }}>CoreDNS</span>
          </span>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 8 }}>
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} style={{
          padding: "8px 20px", borderRadius: 8, border: "1px solid #334155",
          background: step === 0 ? "#0d1117" : "#1e293b",
          color: step === 0 ? "#475569" : "#e2e8f0",
          cursor: step === 0 ? "default" : "pointer", fontSize: 12,
        }}>← Назад</button>

        <div style={{ display: "flex", gap: 6 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? "#0ea5e9" : "#1e293b",
              transition: "all 0.3s", cursor: "pointer",
            }} />
          ))}
        </div>

        <button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1} style={{
          padding: "8px 20px", borderRadius: 8, border: "1px solid #334155",
          background: step === steps.length - 1 ? "#0d1117" : "#1e293b",
          color: step === steps.length - 1 ? "#475569" : "#e2e8f0",
          cursor: step === steps.length - 1 ? "default" : "pointer", fontSize: 12,
        }}>Вперёд →</button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}
