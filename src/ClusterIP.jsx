import { useState } from "react";

const STEPS = [
  {
    id: "deployment",
    title: "Deployment создаёт поды с лейблами",
    subtitle: "Каждый под получает лейбл app: nginx — по нему его найдёт Service.",
    highlight: "labels",
  },
  {
    id: "selector",
    title: "Service находит поды по selector",
    subtitle: "selector: app: nginx совпадает с лейблом подов — Service «видит» их.",
    highlight: "selector",
  },
  {
    id: "ports",
    title: "Port mapping: 80 → targetPort 80",
    subtitle: "Service принимает трафик на port 80 и перенаправляет на containerPort 80.",
    highlight: "ports",
  },
  {
    id: "clusterip",
    title: "type: ClusterIP — только внутри кластера",
    subtitle: "Сервис получает стабильный внутренний IP. Снаружи кластера недоступен.",
    highlight: "type",
  },
];

const CODE_LINES = [
  { id: 1,  text: "apiVersion: apps/v1",          indent: 0, tag: null },
  { id: 2,  text: "kind: Deployment",              indent: 0, tag: null },
  { id: 3,  text: "metadata:",                     indent: 0, tag: null },
  { id: 4,  text: "  name: nginx-deployment",      indent: 1, tag: null },
  { id: 5,  text: "spec:",                         indent: 0, tag: null },
  { id: 6,  text: "  replicas: 3",                 indent: 1, tag: null },
  { id: 7,  text: "  selector:",                   indent: 1, tag: null },
  { id: 8,  text: "    matchLabels:",              indent: 2, tag: "labels" },
  { id: 9,  text: "      app: nginx",              indent: 3, tag: "labels" },
  { id: 10, text: "  template:",                   indent: 1, tag: null },
  { id: 11, text: "    metadata:",                 indent: 2, tag: null },
  { id: 12, text: "      labels:",                 indent: 3, tag: "labels" },
  { id: 13, text: "        app: nginx",            indent: 4, tag: "labels" },
  { id: 14, text: "    spec:",                     indent: 2, tag: null },
  { id: 15, text: "      containers:",             indent: 3, tag: null },
  { id: 16, text: "      - name: nginx",           indent: 3, tag: null },
  { id: 17, text: "        image: nginx:1.25",     indent: 4, tag: null },
  { id: 18, text: "        ports:",                indent: 4, tag: null },
  { id: 19, text: "        - containerPort: 80",  indent: 4, tag: "ports" },
  { id: 20, text: "---",                           indent: 0, tag: null },
  { id: 21, text: "apiVersion: v1",               indent: 0, tag: null },
  { id: 22, text: "kind: Service",                indent: 0, tag: null },
  { id: 23, text: "metadata:",                    indent: 0, tag: null },
  { id: 24, text: "  name: nginx-service",        indent: 1, tag: null },
  { id: 25, text: "spec:",                        indent: 0, tag: null },
  { id: 26, text: "  selector:",                  indent: 1, tag: "selector" },
  { id: 27, text: "    app: nginx",               indent: 2, tag: "selector" },
  { id: 28, text: "  ports:",                     indent: 1, tag: null },
  { id: 29, text: "    - protocol: TCP",          indent: 2, tag: null },
  { id: 30, text: "      port: 80",               indent: 3, tag: "ports" },
  { id: 31, text: "      targetPort: 80",         indent: 3, tag: "ports" },
  { id: 32, text: "  type: ClusterIP",            indent: 1, tag: "type" },
];

const TAG_COLORS = {
  labels:   { bg: "#1a3a1a", border: "#22c55e", text: "#4ade80" },
  selector: { bg: "#1a2a3a", border: "#f59e0b", text: "#fbbf24" },
  ports:    { bg: "#1a1a3a", border: "#a78bfa", text: "#c4b5fd" },
  type:     { bg: "#2a1a1a", border: "#f87171", text: "#fca5a5" },
};

const TAG_LABELS = {
  labels:   "лейблы",
  selector: "selector",
  ports:    "порты",
  type:     "тип",
};

function CodePanel({ highlight }) {
  return (
    <div style={{
      background: "#0d1117", border: "1px solid #21262d",
      borderRadius: 12, overflow: "hidden", width: 340,
      boxShadow: "0 4px 24px #00000050",
    }}>
      <div style={{ background: "#161b22", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #21262d" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span style={{ fontSize: 10, color: "#8b949e", marginLeft: 8, fontFamily: "monospace" }}>nginx-deployment.yaml</span>
      </div>
      <div style={{ padding: "10px 0", fontFamily: "monospace", fontSize: 11, lineHeight: 1.9, maxHeight: 480, overflowY: "auto" }}>
        {CODE_LINES.map(line => {
          const isHighlighted = highlight && line.tag === highlight;
          const colors = isHighlighted ? TAG_COLORS[line.tag] : null;
          return (
            <div key={line.id} style={{
              display: "flex", alignItems: "center",
              background: isHighlighted ? colors.bg : "transparent",
              borderLeft: isHighlighted ? `3px solid ${colors.border}` : "3px solid transparent",
              transition: "all 0.3s",
              padding: "0 14px 0 11px",
            }}>
              <span style={{ color: "#3d444d", width: 20, flexShrink: 0, textAlign: "right", marginRight: 12, fontSize: 10 }}>{line.id}</span>
              <span style={{ color: isHighlighted ? colors.text : "#e6edf3", whiteSpace: "pre" }}>
                {line.text}
              </span>
              {isHighlighted && (
                <span style={{ marginLeft: 8, fontSize: 9, color: colors.border, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>
                  {TAG_LABELS[line.tag]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PodBox({ name, label, highlight, portHighlight }) {
  return (
    <div style={{
      background: highlight ? "linear-gradient(135deg,#0d2a0d,#143a14)" : "linear-gradient(135deg,#1e293b,#334155)",
      border: `2px solid ${highlight ? "#22c55e" : "#475569"}`,
      borderRadius: 10, padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 6,
      transition: "all 0.4s", minWidth: 150,
      boxShadow: highlight ? "0 0 16px #22c55e30" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#86efac" : "#94a3b8"} />
          <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#22c55e" : "#475569"} />
          <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#22c55e" : "#475569"} />
          <circle cx="16" cy="24" r="2" fill={highlight ? "#16a34a" : "#64748b"} />
        </svg>
        <span style={{ fontSize: 11, color: highlight ? "#86efac" : "#e2e8f0", fontFamily: "monospace", fontWeight: 700 }}>{name}</span>
      </div>
      <div style={{
        background: highlight ? "#0a1f0a" : "#0d1117",
        border: `1px solid ${highlight ? "#16a34a" : "#334155"}`,
        borderRadius: 6, padding: "4px 8px",
        fontSize: 10, color: highlight ? "#4ade80" : "#64748b",
        fontFamily: "monospace", transition: "all 0.3s",
      }}>
        app: nginx
      </div>
      <div style={{
        background: portHighlight ? "#1a1a3a" : "#0d1117",
        border: `1px solid ${portHighlight ? "#a78bfa" : "#334155"}`,
        borderRadius: 6, padding: "4px 8px",
        fontSize: 10, color: portHighlight ? "#c4b5fd" : "#64748b",
        fontFamily: "monospace", transition: "all 0.3s",
      }}>
        containerPort: 80
      </div>
    </div>
  );
}

function DiagramPanel({ highlight }) {
  const selectorActive = highlight === "selector" || highlight === "labels";
  const portsActive = highlight === "ports";
  const typeActive = highlight === "type";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>

      {/* Service box */}
      <div style={{
        background: typeActive ? "linear-gradient(135deg,#2a1010,#3a1515)" : "linear-gradient(135deg,#0f2027,#1a3a4a)",
        border: `2px solid ${typeActive ? "#f87171" : "#0ea5e9"}`,
        borderRadius: 14, padding: "14px 20px",
        display: "flex", flexDirection: "column", gap: 8,
        boxShadow: typeActive ? "0 0 24px #f8717140" : "0 0 16px #0ea5e930",
        transition: "all 0.4s", minWidth: 220,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 9, color: "#38bdf8", fontFamily: "monospace", letterSpacing: 1 }}>Service</span>
          <span style={{
            fontSize: 9, fontFamily: "monospace",
            color: typeActive ? "#f87171" : "#64748b",
            background: typeActive ? "#2a1010" : "#0d1117",
            border: `1px solid ${typeActive ? "#f87171" : "#334155"}`,
            borderRadius: 4, padding: "1px 6px",
            transition: "all 0.3s",
          }}>
            {typeActive ? "⚠ только внутри кластера" : "ClusterIP"}
          </span>
        </div>
        <span style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>nginx-service</span>

        {/* Selector row */}
        <div style={{
          background: selectorActive ? "#1a2a0a" : "#0d1117",
          border: `1px solid ${selectorActive ? "#f59e0b" : "#334155"}`,
          borderRadius: 6, padding: "5px 10px",
          fontSize: 10, fontFamily: "monospace",
          color: selectorActive ? "#fbbf24" : "#64748b",
          transition: "all 0.3s",
        }}>
          selector: app: nginx
        </div>

        {/* Port row */}
        <div style={{
          background: portsActive ? "#1a1a3a" : "#0d1117",
          border: `1px solid ${portsActive ? "#a78bfa" : "#334155"}`,
          borderRadius: 6, padding: "5px 10px",
          fontFamily: "monospace", transition: "all 0.3s",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 10, color: portsActive ? "#c4b5fd" : "#64748b" }}>port: 80</span>
          {portsActive && <span style={{ fontSize: 10, color: "#a78bfa" }}>──▶</span>}
          <span style={{ fontSize: 10, color: portsActive ? "#c4b5fd" : "#64748b" }}>targetPort: 80</span>
        </div>

        {/* Stable IP */}
        <div style={{ fontSize: 10, color: "#38bdf8", fontFamily: "monospace", textAlign: "center" }}>
          ClusterIP: 10.96.0.1 (стабильный)
        </div>
      </div>

      {/* Arrows down to pods */}
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        {["", "", ""].map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              width: 2, height: 28,
              background: selectorActive ? "#f59e0b" : "#1e293b",
              transition: "background 0.3s",
              position: "relative", overflow: "hidden",
            }}>
              {selectorActive && <div style={{ position: "absolute", top: 0, left: -2, width: 6, height: "35%", background: "linear-gradient(180deg, transparent, #f59e0b, transparent)", animation: "slideDown 0.8s linear infinite" }} />}
            </div>
            <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${selectorActive ? "#f59e0b" : "#1e293b"}`, transition: "border-color 0.3s" }} />
          </div>
        ))}
      </div>

      {/* Pods */}
      <div style={{ display: "flex", gap: 12 }}>
        {["nginx-pod-1", "nginx-pod-2", "nginx-pod-3"].map(name => (
          <PodBox
            key={name}
            name={name}
            highlight={selectorActive}
            portHighlight={portsActive}
          />
        ))}
      </div>

      {/* ClusterIP note */}
      {typeActive && (
        <div style={{
          background: "#2a1010", border: "1px solid #f87171",
          borderRadius: 10, padding: "10px 18px",
          fontSize: 11, color: "#fca5a5", fontFamily: "monospace",
          textAlign: "center", animation: "fadeIn 0.4s ease",
          maxWidth: 320,
        }}>
          🔒 Недоступен снаружи кластера<br />
          <span style={{ color: "#f87171", fontSize: 10 }}>Для внешнего доступа нужен NodePort, LoadBalancer или Ingress</span>
        </div>
      )}

      <style>{`
        @keyframes slideDown { from { top:-35% } to { top:110% } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  );
}

export default function ClusterIP() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 20,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>KUBERNETES • SERVICE • CLUSTERIP</div>
        <div style={{ fontSize: 22, color: "#f1f5f9", fontWeight: 700 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{cur.subtitle}</div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 10 }}>
        {STEPS.map((s, i) => {
          const colors = TAG_COLORS[s.highlight];
          const active = i === step;
          return (
            <div key={s.id} onClick={() => setStep(i)} style={{
              padding: "4px 12px", borderRadius: 20, cursor: "pointer",
              background: active ? colors.bg : "#0d1117",
              border: `1px solid ${active ? colors.border : "#1e293b"}`,
              color: active ? colors.text : "#475569",
              fontSize: 10, transition: "all 0.3s",
            }}>
              {TAG_LABELS[s.highlight]}
            </div>
          );
        })}
      </div>

      {/* Main: code + diagram */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        <CodePanel highlight={cur.highlight} />
        <DiagramPanel highlight={cur.highlight} />
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #334155", background: step === 0 ? "#0d1117" : "#1e293b", color: step === 0 ? "#475569" : "#e2e8f0", cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}>
          ← Назад
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((_, i) => <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? "#0ea5e9" : "#1e293b", transition: "all 0.3s", cursor: "pointer" }} />)}
        </div>
        <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #334155", background: step === STEPS.length - 1 ? "#0d1117" : "#1e293b", color: step === STEPS.length - 1 ? "#475569" : "#e2e8f0", cursor: step === STEPS.length - 1 ? "default" : "pointer", fontSize: 12 }}>
          Вперёд →
        </button>
      </div>
    </div>
  );
}
