import { useState } from "react";

const STEPS = [
  {
    id: "init",
    title: "Два узла, три пода, один сервис",
    subtitle: "nginx-service получил ClusterIP 10.43.234.158. Поды живут на двух нодах.",
    activeFlow: null,
  },
  {
    id: "kubeproxy",
    title: "kube-proxy следит за сервисами через API",
    subtitle: "На каждой ноде работает kube-proxy. Он подписан на изменения Service и Endpoints через kube-apiserver.",
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
    subtitle: "Знает только ClusterIP 10.43.234.158:80. Пакет попадает в iptables на Node 1.",
    activeFlow: "request",
  },
  {
    id: "nat",
    title: "iptables делает DNAT → выбирает под на Node 2",
    subtitle: "Случайный выбор: трафик уходит к pod 10.42.0.97 на Node 2. Destination IP меняется с 10.43.234.158 → 10.42.0.97.",
    activeFlow: "nat",
  },
  {
    id: "overlay",
    title: "Пакет идёт через overlay network",
    subtitle: "Overlay (flannel/calico/cilium) знает что 10.42.0.97 живёт на Node 2 и доставляет пакет туда.",
    activeFlow: "overlay",
  },
  {
    id: "deliver",
    title: "iptables Node 2 доставляет пакет в под",
    subtitle: "На Node 2 iptables видит уже NATed трафик и отправляет его напрямую в pod 10.42.0.97.",
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

const IPTablesBox = ({ highlight, dim, node }) => (
  <div style={{
    background: highlight ? "linear-gradient(135deg,#2d1515,#4a1515)" : "linear-gradient(135deg,#1a0f0f,#2d1515)",
    border: `2px solid ${highlight ? "#f87171" : "#7f1d1d"}`,
    borderRadius: 10, padding: "10px 14px",
    display: "flex", flexDirection: "column", gap: 4,
    boxShadow: highlight ? "0 0 20px #f8717140" : "none",
    transition: "all 0.4s", opacity: dim ? 0.3 : 1, minWidth: 170,
  }}>
    <span style={{ fontSize: 9, color: "#f87171", fontFamily: "monospace", letterSpacing: 1 }}>iptables · {node}</span>
    {highlight && (
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
        {["DNAT → 10.42.0.97:80 (33%)", "DNAT → 10.42.0.98:80 (33%)", "DNAT → 10.42.0.99:80 (33%)"].map((r, i) => (
          <div key={i} style={{ fontSize: 8, color: "#fca5a5", fontFamily: "monospace", background: "#3f0f0f", borderRadius: 4, padding: "2px 6px" }}>{r}</div>
        ))}
      </div>
    )}
    {!highlight && (
      <span style={{ fontSize: 9, color: "#7f1d1d", fontFamily: "monospace" }}>NAT rules</span>
    )}
  </div>
);

// Горизонтальная стрелка
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

// Вертикальная стрелка
const VArrow = ({ active, color, label, reverse, height = 24 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {label && !reverse && <span style={{ fontSize: 8, color: active ? color : "#334155", fontFamily: "monospace", transition: "color 0.3s" }}>{label}</span>}
    {!reverse && <div style={{ width: 2, height, background: active ? color : "#1e293b", transition: "background 0.4s" }} />}
    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", [reverse ? "borderBottom" : "borderTop"]: `7px solid ${active ? color : "#1e293b"}`, transition: "all 0.3s" }} />
    {reverse && <div style={{ width: 2, height, background: active ? color : "#1e293b", transition: "background 0.4s" }} />}
    {label && reverse && <span style={{ fontSize: 8, color: active ? color : "#334155", fontFamily: "monospace", transition: "color 0.3s" }}>{label}</span>}
  </div>
);

// ── Annotations ────────────────────────────────────────────────────────────────

const annotations = {
  kubeproxy: {
    color: "#818cf8",
    text: "kube-proxy на каждой ноде — агент который следит за сервисами и эндпоинтами через kube-apiserver. Как только появляется новый Service или меняются Endpoints — kube-proxy обновляет правила.",
  },
  iptables: {
    color: "#f87171",
    text: "kube-proxy записывает в iptables правила DNAT для каждого пода. Балансировка реализована вероятностно: 1/3 → pod-97, затем 1/2 от остатка → pod-98, остаток → pod-99. Математически это равномерное распределение.",
  },
  request: {
    color: "#fbbf24",
    text: "client-pod знает только DNS-имя nginx-service. После резолвинга получает ClusterIP 10.43.234.158. Пакет с этим destination попадает в iptables на Node 1.",
  },
  nat: {
    color: "#f87171",
    text: "iptables перехватывает пакет к 10.43.234.158:80 и делает DNAT — подменяет destination IP на реальный IP пода (например 10.42.0.97). ClusterIP нигде физически не существует, это виртуальный адрес.",
  },
  overlay: {
    color: "#38bdf8",
    text: "Overlay network (flannel, calico, cilium) знает где живёт каждый под. Пакет инкапсулируется и доставляется на Node 2, где живёт pod 10.42.0.97.",
  },
  deliver: {
    color: "#22c55e",
    text: "На Node 2 iptables видит трафик уже к реальному IP пода и доставляет его. Ответный трафик идёт обратно через тот же механизм — SNAT восстанавливает оригинальный ClusterIP в ответе.",
  },
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function IPTables() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const flow = cur.activeFlow;

  const ann = flow ? annotations[flow] : null;

  // Флаги активности для разных элементов
  const proxyActive  = flow === "kubeproxy";
  const ipt1Active   = flow === "iptables" || flow === "nat" || flow === "request";
  const ipt2Active   = flow === "deliver";
  const overlayActive = flow === "overlay";
  const clientActive = flow === "request" || flow === "nat";
  const pod97Active  = flow === "deliver";
  const pod98Active  = false;
  const pod99Active  = false;
  const proxyDim     = flow === "request" || flow === "nat" || flow === "overlay" || flow === "deliver";

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
      <div style={{
        background: "#0f2027", border: "1px solid #0ea5e9",
        borderRadius: 8, padding: "6px 20px",
        fontSize: 11, color: "#38bdf8", fontFamily: "monospace",
      }}>
        nginx-service · ClusterIP: <span style={{ color: "#7dd3fc", fontWeight: 700 }}>10.43.234.158</span> · port 80
      </div>

      {/* Main diagram */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* ── NODE 1 ── */}
        <div style={{
          background: "#0d1520", border: "1px solid #1e3a5f",
          borderRadius: 16, padding: "20px 20px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <span style={{ fontSize: 10, color: "#38bdf8", letterSpacing: 2, textAlign: "center" }}>NODE 1 · nl-vmv3-medium</span>

          {/* kube-apiserver → kube-proxy arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              background: proxyActive ? "#1a1f4a" : "#0d1117",
              border: `1px solid ${proxyActive ? "#818cf8" : "#1e293b"}`,
              borderRadius: 6, padding: "3px 10px",
              fontSize: 9, color: proxyActive ? "#a5b4fc" : "#334155",
              fontFamily: "monospace", transition: "all 0.3s",
            }}>kube-apiserver</div>
            <VArrow active={proxyActive} color="#818cf8" height={16} />
            <KubeProxy highlight={proxyActive} dim={proxyDim} />
            <VArrow active={flow === "iptables"} color="#f87171" label="rules" height={16} />
          </div>

          <IPTablesBox highlight={ipt1Active} dim={false} node="Node 1" />

          {/* client pod row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <Pod name="client-pod" ip="10.42.0.99" highlight={clientActive} />
            </div>
            <HArrow active={flow === "request"} color="#fbbf24" label="→ 10.43.234.158:80" width={70} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              {flow === "nat" && (
                <div style={{ fontSize: 8, color: "#f87171", fontFamily: "monospace", background: "#2d1515", borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap", animation: "fadeIn 0.3s ease" }}>
                  DNAT: dst → 10.42.0.97
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── OVERLAY NETWORK ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <HArrow active={overlayActive} color="#38bdf8" width={50} />
          <div style={{
            background: overlayActive ? "#0a1f2a" : "#0d1117",
            border: `1px solid ${overlayActive ? "#0ea5e9" : "#1e293b"}`,
            borderRadius: 10, padding: "10px 14px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            transition: "all 0.4s", minWidth: 100,
            boxShadow: overlayActive ? "0 0 20px #0ea5e940" : "none",
          }}>
            <span style={{ fontSize: 18 }}>🌐</span>
            <span style={{ fontSize: 9, color: overlayActive ? "#38bdf8" : "#475569", fontFamily: "monospace" }}>overlay</span>
            <span style={{ fontSize: 9, color: overlayActive ? "#7dd3fc" : "#334155", fontFamily: "monospace" }}>network</span>
          </div>
          <HArrow active={overlayActive} color="#38bdf8" width={50} />
        </div>

        {/* ── NODE 2 ── */}
        <div style={{
          background: "#0d1520", border: "1px solid #1e3a5f",
          borderRadius: 16, padding: "20px 20px",
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <span style={{ fontSize: 10, color: "#38bdf8", letterSpacing: 2, textAlign: "center" }}>NODE 2 · nl-vmv3-medium</span>

          {/* kube-apiserver → kube-proxy arrow */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              background: proxyActive ? "#1a1f4a" : "#0d1117",
              border: `1px solid ${proxyActive ? "#818cf8" : "#1e293b"}`,
              borderRadius: 6, padding: "3px 10px",
              fontSize: 9, color: proxyActive ? "#a5b4fc" : "#334155",
              fontFamily: "monospace", transition: "all 0.3s",
            }}>kube-apiserver</div>
            <VArrow active={proxyActive} color="#818cf8" height={16} />
            <KubeProxy highlight={proxyActive} dim={proxyDim} />
            <VArrow active={flow === "iptables"} color="#f87171" label="rules" height={16} />
          </div>

          <IPTablesBox highlight={ipt2Active} dim={false} node="Node 2" />

          {/* pods row */}
          <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
            <Pod name="pod-97" ip="10.42.0.97" highlight={pod97Active} dim={flow === "request"} />
            <Pod name="pod-98" ip="10.42.0.98" highlight={pod98Active} dim={flow === "request" || flow === "deliver"} />
          </div>
        </div>

      </div>

      {/* Annotation box */}
      {ann && (
        <div style={{
          background: "#0d1117", border: `1px solid ${ann.color}`,
          borderRadius: 12, padding: "12px 20px",
          maxWidth: 680, fontSize: 11, color: "#cbd5e1",
          fontFamily: "monospace", lineHeight: 1.7,
          animation: "fadeIn 0.4s ease",
          boxShadow: `0 0 20px ${ann.color}20`,
        }}>
          <span style={{ color: ann.color, marginRight: 8 }}>ℹ</span>
          {cur.id === "iptables" ? (
            <span>
              kube-proxy записывает в iptables правила DNAT для каждого пода.<br />
              <span style={{ color: "#f87171" }}>Балансировка вероятностная:</span><br />
              <span style={{ color: "#fca5a5" }}>• 1/3 (~33%) → pod-97 · если нет → 1/2 от остатка (~33%) → pod-98 · остаток (~33%) → pod-99</span><br />
              <span style={{ color: "#94a3b8" }}>Это не round-robin, а случайный выбор с математически выровненными вероятностями.</span>
            </span>
          ) : ann.text}
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
