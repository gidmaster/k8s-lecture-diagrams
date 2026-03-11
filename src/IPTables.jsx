import { useState } from "react";

// Топология:
// Node 1 (worker-node-01): client-pod (10.42.0.5), nginx-pod-99 (10.42.0.99), nginx-pod-98 (10.42.0.98)
// Node 2 (worker-node-02): nginx-pod-97 (10.42.1.97)
// client-pod живёт в другом namespace/деплойменте — IP из другого диапазона ноды

const STEPS = [
  {
    id: "init",
    title: "Два узла, четыре пода, один сервис",
    subtitle: "nginx-service получил ClusterIP 10.43.234.158. Поды nginx живут на обеих нодах.",
    activeFlow: null,
  },
  {
    id: "kubeproxy",
    title: "kube-proxy следит за сервисами через API",
    subtitle: "На каждой ноде работает kube-proxy. При изменении количества подов сервиса — он обновляет правила iptables.",
    activeFlow: "kubeproxy",
  },
  {
    id: "iptables",
    title: "kube-proxy пишет правила в iptables",
    subtitle: "Для каждого пода — правила DNAT и MARK-MASQ. Балансировка: 33% → pod-97, 50% от остатка → pod-98, остаток → pod-99.",
    activeFlow: "iptables",
  },
  {
    id: "request",
    title: "client-pod шлёт запрос к nginx-service",
    subtitle: "Знает только ClusterIP 10.43.234.158:80. Пакет попадает в iptables на worker-node-01.",
    activeFlow: "request",
  },
  {
    id: "nat",
    title: "iptables делает DNAT → выбирает под на worker-node-02",
    subtitle: "Случайный выбор: трафик уходит к pod 10.42.1.97 на worker-node-02. Destination IP меняется с 10.43.234.158 → 10.42.1.97.",
    activeFlow: "nat",
  },
  {
    id: "overlay",
    title: "Пакет идёт через overlay network",
    subtitle: "Overlay network знает что 10.42.1.97 живёт на worker-node-02 и доставляет пакет туда.",
    activeFlow: "overlay",
  },
  {
    id: "deliver",
    title: "iptables worker-node-02 доставляет пакет в под",
    subtitle: "На worker-node-02 iptables видит уже NATed трафик и отправляет его напрямую в pod 10.42.1.97.",
    activeFlow: "deliver",
  },
];

// ── Primitives ─────────────────────────────────────────────────────────────────

const Pod = ({ name, ip, highlight, dim }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    opacity: dim ? 0.3 : 1, transition: "all 0.4s",
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 10,
      background: highlight ? "linear-gradient(135deg,#14532d,#166534)" : "linear-gradient(135deg,#1e293b,#334155)",
      border: `2px solid ${highlight ? "#22c55e" : "#475569"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: highlight ? "0 0 16px #22c55e50" : "none",
      transition: "all 0.4s",
    }}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#86efac" : "#94a3b8"} />
        <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#22c55e" : "#475569"} />
        <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#22c55e" : "#475569"} />
        <circle cx="16" cy="24" r="2" fill={highlight ? "#16a34a" : "#64748b"} />
      </svg>
    </div>
    <span style={{ fontSize: 9, color: highlight ? "#86efac" : "#94a3b8", fontFamily: "monospace" }}>{name}</span>
    <span style={{ fontSize: 8, color: highlight ? "#4ade80" : "#64748b", fontFamily: "monospace" }}>{ip}</span>
  </div>
);

const ClientPod = ({ highlight, dim }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    opacity: dim ? 0.3 : 1, transition: "all 0.4s",
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 10,
      background: highlight ? "linear-gradient(135deg,#1e3a5f,#1e4a7f)" : "linear-gradient(135deg,#1e293b,#334155)",
      border: `2px solid ${highlight ? "#60a5fa" : "#475569"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: highlight ? "0 0 16px #60a5fa50" : "none",
      transition: "all 0.4s",
    }}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#93c5fd" : "#94a3b8"} />
        <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
        <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
        <circle cx="16" cy="24" r="2" fill={highlight ? "#1d4ed8" : "#64748b"} />
      </svg>
    </div>
    <span style={{ fontSize: 9, color: highlight ? "#93c5fd" : "#94a3b8", fontFamily: "monospace" }}>client-pod</span>
    <span style={{ fontSize: 8, color: highlight ? "#60a5fa" : "#64748b", fontFamily: "monospace" }}>10.42.0.5</span>
  </div>
);

const KubeProxy = ({ highlight, dim }) => (
  <div style={{
    background: highlight ? "linear-gradient(135deg,#1e1b4b,#312e81)" : "linear-gradient(135deg,#1e293b,#334155)",
    border: `2px solid ${highlight ? "#818cf8" : "#475569"}`,
    borderRadius: 10, padding: "8px 12px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    boxShadow: highlight ? "0 0 16px #818cf850" : "none",
    transition: "all 0.4s", opacity: dim ? 0.3 : 1, minWidth: 90,
  }}>
    <span style={{ fontSize: 9, color: highlight ? "#a5b4fc" : "#64748b", fontFamily: "monospace" }}>agent</span>
    <span style={{ fontSize: 10, color: highlight ? "#e0e7ff" : "#94a3b8", fontWeight: 700, fontFamily: "monospace" }}>kube-proxy</span>
  </div>
);

const IPTablesBox = ({ highlight, node, isNode2 }) => {
  const node1Rules = ["DNAT → 10.42.0.98:80 (33%)", "DNAT → 10.42.0.99:80 (33%)", "DNAT → 10.42.1.97:80 (33%)"];
  const node2Rules = ["принять пакет dst: 10.42.1.97:80", "SNAT: src → ClusterIP на обратном пути"];
  const rules = isNode2 ? node2Rules : node1Rules;
  const ruleColor = isNode2 ? "#86efac" : "#fca5a5";
  const ruleBg    = isNode2 ? "#0a2a0a" : "#3f0f0f";

  return (
    <div style={{
      background: highlight ? (isNode2 ? "linear-gradient(135deg,#0d2a0d,#143a14)" : "linear-gradient(135deg,#2d1515,#4a1515)") : "linear-gradient(135deg,#1a0f0f,#2d1515)",
      border: `2px solid ${highlight ? (isNode2 ? "#22c55e" : "#f87171") : "#7f1d1d"}`,
      borderRadius: 10, padding: "10px 14px",
      display: "flex", flexDirection: "column", gap: 4,
      boxShadow: highlight ? `0 0 20px ${isNode2 ? "#22c55e40" : "#f8717140"}` : "none",
      transition: "all 0.4s", minWidth: 180,
    }}>
      <span style={{ fontSize: 9, color: highlight ? (isNode2 ? "#22c55e" : "#f87171") : "#7f1d1d", fontFamily: "monospace", letterSpacing: 1 }}>iptables · {node}</span>
      {highlight && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
          {rules.map((r, i) => (
            <div key={i} style={{ fontSize: 8, color: ruleColor, fontFamily: "monospace", background: ruleBg, borderRadius: 4, padding: "2px 6px" }}>{r}</div>
          ))}
        </div>
      )}
      {!highlight && <span style={{ fontSize: 9, color: "#7f1d1d", fontFamily: "monospace" }}>NAT rules</span>}
    </div>
  );
};

const HArrow = ({ active, color, label, reverse, width = 60 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {label && <span style={{ fontSize: 8, color: active ? color : "#334155", fontFamily: "monospace", whiteSpace: "nowrap", transition: "color 0.3s" }}>{label}</span>}
    <div style={{ display: "flex", alignItems: "center" }}>
      {reverse && <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `7px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
      <div style={{ width, height: 2, background: active ? color : "#1e293b", transition: "background 0.4s", position: "relative", overflow: "hidden" }}>
        {active && <div style={{ position: "absolute", top: -2, left: 0, width: "35%", height: 6, background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent, ${color}, transparent)`, animation: reverse ? "slideLeft 0.8s linear infinite" : "slideRight 0.8s linear infinite" }} />}
      </div>
      {!reverse && <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
    </div>
    <style>{`
      @keyframes slideRight { from{left:-35%} to{left:110%} }
      @keyframes slideLeft  { from{left:110%} to{left:-35%} }
    `}</style>
  </div>
);

const VArrow = ({ active, color, label, height = 24 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {label && <span style={{ fontSize: 8, color: active ? color : "#334155", fontFamily: "monospace", transition: "color 0.3s" }}>{label}</span>}
    <div style={{ width: 2, height, background: active ? color : "#1e293b", transition: "background 0.4s" }} />
    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${active ? color : "#1e293b"}`, transition: "all 0.3s" }} />
  </div>
);

const annotations = {
  kubeproxy: "kube-proxy — агент на каждой ноде. Следит за изменениями сервисов через kube-apiserver: добавился под → обновил правила, удалился под → убрал правила. Реагирует на любые изменения количества подов сервиса.",
  iptables: null, // рендерится отдельно
  request: "client-pod знает только DNS-имя nginx-service. После резолвинга получает ClusterIP 10.43.234.158. Пакет с этим destination попадает в iptables на worker-node-01.",
  nat: "iptables перехватывает пакет к 10.43.234.158:80 и делает DNAT — подменяет destination IP на реальный IP пода 10.42.1.97. ClusterIP нигде физически не существует, это виртуальный адрес.",
  overlay: "Overlay network знает где живёт каждый под. Пакет инкапсулируется и доставляется на worker-node-02, где живёт pod 10.42.1.97.",
  deliver: "Пакет пришёл с dst: 10.42.1.97:80 — iptables на worker-node-02 просто пропускает его к поду. На обратном пути под отвечает с src: 10.42.1.97, но клиент ожидает ответ от ClusterIP 10.43.234.158. SNAT подменяет обратный адрес — клиент видит ответ от сервиса, а не от конкретного пода.",
};

export default function IPTables() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const flow = cur.activeFlow;

  const proxyActive   = flow === "kubeproxy";
  const ipt1Active    = flow === "iptables" || flow === "nat" || flow === "request";
  const ipt2Active    = flow === "deliver";
  const overlayActive = flow === "overlay";
  const clientActive  = flow === "request" || flow === "nat";
  const pod97Active   = flow === "deliver";
  const proxyDim      = flow === "request" || flow === "nat" || flow === "overlay" || flow === "deliver";

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 18,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>KUBERNETES • ПОД КАПОТОМ • IPTABLES</div>
        <div style={{ fontSize: 20, color: "#f1f5f9", fontWeight: 700 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>{cur.subtitle}</div>
      </div>

      {/* Service badge */}
      <div style={{ background: "#0f2027", border: "1px solid #0ea5e9", borderRadius: 8, padding: "6px 20px", fontSize: 11, color: "#38bdf8", fontFamily: "monospace" }}>
        nginx-service · ClusterIP: <span style={{ color: "#7dd3fc", fontWeight: 700 }}>10.43.234.158</span> · port 80
      </div>

      {/* Main diagram */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* ── NODE 1: worker-node-01 ── */}
        <div style={{ background: "#0d1520", border: "1px solid #1e3a5f", borderRadius: 16, padding: "20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 10, color: "#38bdf8", letterSpacing: 2, textAlign: "center" }}>worker-node-01</span>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ background: proxyActive ? "#1a1f4a" : "#0d1117", border: `1px solid ${proxyActive ? "#818cf8" : "#1e293b"}`, borderRadius: 6, padding: "3px 10px", fontSize: 9, color: proxyActive ? "#a5b4fc" : "#334155", fontFamily: "monospace", transition: "all 0.3s" }}>
              kube-apiserver
            </div>
            <VArrow active={proxyActive} color="#818cf8" height={16} />
            <KubeProxy highlight={proxyActive} dim={proxyDim} />
            <VArrow active={flow === "iptables"} color="#f87171" label="rules" height={16} />
          </div>

          <IPTablesBox highlight={ipt1Active} node="worker-node-01" isNode2={false} />

          {/* client pod + nginx pods on node1 */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <ClientPod highlight={clientActive} dim={false} />
              {flow === "request" && (
                <div style={{ fontSize: 8, color: "#fbbf24", fontFamily: "monospace", background: "#1a1500", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", animation: "fadeIn 0.3s ease" }}>
                  → 10.43.234.158:80
                </div>
              )}
              {flow === "nat" && (
                <div style={{ fontSize: 8, color: "#f87171", fontFamily: "monospace", background: "#2d1515", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", animation: "fadeIn 0.3s ease" }}>
                  DNAT → 10.42.1.97
                </div>
              )}
            </div>
            <Pod name="nginx-pod" ip="10.42.0.98" highlight={false} dim={flow === "request" || flow === "nat" || flow === "overlay" || flow === "deliver"} />
            <Pod name="nginx-pod" ip="10.42.0.99" highlight={false} dim={flow === "request" || flow === "nat" || flow === "overlay" || flow === "deliver"} />
          </div>
        </div>

        {/* ── OVERLAY ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <HArrow active={overlayActive} color="#38bdf8" width={50} />
          <div style={{
            background: overlayActive ? "#0a1f2a" : "#0d1117",
            border: `1px solid ${overlayActive ? "#0ea5e9" : "#1e293b"}`,
            borderRadius: 10, padding: "10px 14px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "all 0.4s", minWidth: 90,
            boxShadow: overlayActive ? "0 0 20px #0ea5e940" : "none",
          }}>
            <span style={{ fontSize: 18 }}>🌐</span>
            <span style={{ fontSize: 9, color: overlayActive ? "#38bdf8" : "#475569", fontFamily: "monospace" }}>overlay</span>
            <span style={{ fontSize: 9, color: overlayActive ? "#7dd3fc" : "#334155", fontFamily: "monospace" }}>network</span>
          </div>
          <HArrow active={overlayActive} color="#38bdf8" width={50} />
        </div>

        {/* ── NODE 2: worker-node-02 ── */}
        <div style={{ background: "#0d1520", border: "1px solid #1e3a5f", borderRadius: 16, padding: "20px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
          <span style={{ fontSize: 10, color: "#38bdf8", letterSpacing: 2, textAlign: "center" }}>worker-node-02</span>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ background: proxyActive ? "#1a1f4a" : "#0d1117", border: `1px solid ${proxyActive ? "#818cf8" : "#1e293b"}`, borderRadius: 6, padding: "3px 10px", fontSize: 9, color: proxyActive ? "#a5b4fc" : "#334155", fontFamily: "monospace", transition: "all 0.3s" }}>
              kube-apiserver
            </div>
            <VArrow active={proxyActive} color="#818cf8" height={16} />
            <KubeProxy highlight={proxyActive} dim={proxyDim} />
            <VArrow active={flow === "iptables"} color="#f87171" label="rules" height={16} />
          </div>

          <IPTablesBox highlight={ipt2Active} node="worker-node-02" isNode2={true} />

          <div style={{ display: "flex", justifyContent: "center" }}>
            <Pod name="nginx-pod" ip="10.42.1.97" highlight={pod97Active} dim={flow === "request"} />
          </div>
        </div>
      </div>

      {/* Annotation */}
      {flow && (
        <div style={{
          background: "#0d1117",
          border: `1px solid ${flow === "kubeproxy" ? "#818cf8" : flow === "iptables" ? "#f87171" : flow === "request" ? "#fbbf24" : flow === "nat" ? "#f87171" : flow === "overlay" ? "#38bdf8" : "#22c55e"}`,
          borderRadius: 12, padding: "12px 20px",
          maxWidth: 680, fontSize: 11, color: "#cbd5e1",
          fontFamily: "monospace", lineHeight: 1.7,
          animation: "fadeIn 0.4s ease",
        }}>
          {flow === "iptables" ? (
            <span>
              kube-proxy записывает в iptables правила DNAT для каждого пода.<br />
              <span style={{ color: "#f87171" }}>Балансировка вероятностная:</span><br />
              <span style={{ color: "#fca5a5" }}>• 1/3 (~33%) → pod-98 · если нет → 1/2 от остатка (~33%) → pod-99 · остаток (~33%) → pod-97</span><br />
              <span style={{ color: "#94a3b8" }}>Это не round-robin, а случайный выбор с математически выровненными вероятностями.</span>
            </span>
          ) : (
            <span><span style={{ marginRight: 8 }}>ℹ</span>{annotations[flow]}</span>
          )}
        </div>
      )}

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

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
