import { useState, useEffect, useRef } from "react";

const STEPS = [
  {
    id: 1,
    title: "Под хочет достучаться до backend-svc",
    subtitle: "Знает имя, но не знает IP. Нужен DNS-резолвинг.",
    activeArrow: null,
    showResolv: false,
    showCoreDNS: false,
    showAnswer: false,
    showTraffic: false,
    highlight: "pod",
  },
  {
    id: 2,
    title: "Смотрим в /etc/resolv.conf",
    subtitle: "Kubelet кладёт этот файл в каждый под при запуске.",
    activeArrow: null,
    showResolv: true,
    showCoreDNS: false,
    showAnswer: false,
    showTraffic: false,
    highlight: "resolv",
  },
  {
    id: 3,
    title: "DNS-запрос уходит в CoreDNS",
    subtitle: "nameserver 10.43.0.10 — это ClusterIP сервиса перед репликами CoreDNS.",
    activeArrow: "to-dns",
    showResolv: true,
    showCoreDNS: true,
    showAnswer: false,
    showTraffic: false,
    highlight: "coredns",
  },
  {
    id: 4,
    title: "CoreDNS возвращает IP сервиса",
    subtitle: "backend-svc.default.svc.cluster.local → 10.96.20.20",
    activeArrow: "from-dns",
    showResolv: true,
    showCoreDNS: true,
    showAnswer: true,
    showTraffic: false,
    highlight: "answer",
  },
  {
    id: 5,
    title: "Под идёт по IP к backend-svc",
    subtitle: "Service принимает трафик и балансирует его по backend-подам.",
    activeArrow: "to-svc",
    showResolv: true,
    showCoreDNS: true,
    showAnswer: true,
    showTraffic: true,
    highlight: "svc",
  },
];

const Terminal = ({ visible }) => (
  <div style={{
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(-8px)",
    transition: "all 0.4s ease",
    background: "#0d1117",
    border: "1px solid #30363d",
    borderRadius: 10,
    overflow: "hidden",
    minWidth: 340,
    boxShadow: "0 8px 32px #00000060",
  }}>
    <div style={{
      background: "#161b22", padding: "8px 14px",
      display: "flex", alignItems: "center", gap: 8,
      borderBottom: "1px solid #30363d",
    }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
      <span style={{ fontSize: 11, color: "#8b949e", marginLeft: 8, fontFamily: "monospace" }}>
        pod$ cat /etc/resolv.conf
      </span>
    </div>
    <div style={{ padding: "14px 18px", fontFamily: "monospace", fontSize: 11, lineHeight: 1.8 }}>
      <div style={{ color: "#8b949e" }}># Автоматически создан kubelet</div>
      <div>
        <span style={{ color: "#79c0ff" }}>search</span>
        <span style={{ color: "#e6edf3" }}> demo.svc.cluster.local</span>
        <span style={{ color: "#e6edf3" }}> svc.cluster.local</span>
        <span style={{ color: "#e6edf3" }}> cluster.local</span>
      </div>
      <div>
        <span style={{ color: "#79c0ff" }}>nameserver</span>
        <span style={{ color: "#ffa657" }}> 10.43.0.10</span>
        <span style={{ color: "#8b949e" }}>  # CoreDNS ClusterIP</span>
      </div>
      <div>
        <span style={{ color: "#79c0ff" }}>options</span>
        <span style={{ color: "#e6edf3" }}> ndots:5</span>
      </div>
      <div style={{ marginTop: 10, color: "#8b949e", fontSize: 10 }}>
        ┌─ clusterDomain: cluster.local  (параметр kubelet)
      </div>
      <div style={{ color: "#8b949e", fontSize: 10 }}>
        └─ clusterDNS: 10.43.0.10       (параметр kubelet)
      </div>
    </div>
  </div>
);

const PodBox = ({ label, ip, highlight, small }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  }}>
    <div style={{
      width: small ? 42 : 54, height: small ? 42 : 54,
      borderRadius: 10,
      background: highlight
        ? "linear-gradient(135deg,#3b82f6,#6366f1)"
        : "linear-gradient(135deg,#1e293b,#334155)",
      border: `2px solid ${highlight ? "#6366f1" : "#475569"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: highlight ? "0 0 18px #6366f180" : "none",
      transition: "all 0.4s",
    }}>
      <svg width={small ? 20 : 26} height={small ? 20 : 26} viewBox="0 0 32 32" fill="none">
        <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#bfdbfe" : "#94a3b8"} />
        <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
        <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
        <circle cx="16" cy="24" r="2" fill={highlight ? "#6366f1" : "#64748b"} />
      </svg>
    </div>
    <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>{label}</span>
    {ip && <span style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace" }}>{ip}</span>}
  </div>
);

const ServiceBox = ({ label, ip, highlight }) => (
  <div style={{
    background: highlight ? "linear-gradient(135deg,#0f2a3a,#1a4a5a)" : "linear-gradient(135deg,#0f2027,#1a3a4a)",
    border: `2px solid ${highlight ? "#38bdf8" : "#0ea5e9"}`,
    borderRadius: 12, padding: "10px 18px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    boxShadow: highlight ? "0 0 28px #0ea5e960" : "0 0 12px #0ea5e920",
    transition: "all 0.4s", minWidth: 130,
  }}>
    <span style={{ fontSize: 9, color: "#38bdf8", fontFamily: "monospace", letterSpacing: 1 }}>Service</span>
    <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>{label}</span>
    <span style={{ fontSize: 9, color: "#7dd3fc", fontFamily: "monospace" }}>{ip}</span>
  </div>
);

const AnimatedArrow = ({ active, color, label, dashed, reverse }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, position: "relative" }}>
      {label && (
        <span style={{
          fontSize: 9, color: active ? color : "#334155",
          fontFamily: "monospace", transition: "color 0.3s",
          whiteSpace: "nowrap",
        }}>{label}</span>
      )}
      <div style={{ display: "flex", alignItems: "center", position: "relative", overflow: "hidden" }}>
        {reverse && (
          <div style={{
            width: 0, height: 0,
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderRight: `7px solid ${active ? color : "#1e293b"}`,
            transition: "border-color 0.3s",
          }} />
        )}
        <div style={{
          width: 56, height: 2,
          background: dashed
            ? `repeating-linear-gradient(90deg,${active ? color : "#1e293b"} 0,${active ? color : "#1e293b"} 6px,transparent 6px,transparent 12px)`
            : (active ? color : "#1e293b"),
          transition: "background 0.3s",
          position: "relative",
          overflow: "hidden",
        }}>
          {active && !dashed && (
            <div style={{
              position: "absolute", top: -2, left: 0,
              width: "30%", height: 6,
              background: `linear-gradient(90deg, transparent, ${color}ff, transparent)`,
              animation: reverse ? "slideLeft 1s linear infinite" : "slideRight 1s linear infinite",
            }} />
          )}
        </div>
        {!reverse && (
          <div style={{
            width: 0, height: 0,
            borderTop: "5px solid transparent",
            borderBottom: "5px solid transparent",
            borderLeft: `7px solid ${active ? color : "#1e293b"}`,
            transition: "border-color 0.3s",
          }} />
        )}
      </div>
      <style>{`
        @keyframes slideRight { from { left: -30% } to { left: 110% } }
        @keyframes slideLeft { from { left: 110% } to { left: -30% } }
      `}</style>
    </div>
  );
};

const VArrow = ({ active, color, label, reverse }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    {label && <span style={{ fontSize: 9, color: active ? color : "#334155", fontFamily: "monospace", transition: "color 0.3s", whiteSpace: "nowrap" }}>{label}</span>}
    {!reverse && (
      <div style={{ width: 2, height: 32, background: active ? color : "#1e293b", transition: "background 0.3s", position: "relative", overflow: "hidden" }}>
        {active && <div style={{ position: "absolute", left: -2, top: 0, width: 6, height: "30%", background: `linear-gradient(180deg, transparent, ${color}ff, transparent)`, animation: "slideDown 1s linear infinite" }} />}
      </div>
    )}
    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", [reverse ? "borderBottom" : "borderTop"]: `7px solid ${active ? color : "#1e293b"}`, transition: "all 0.3s" }} />
    {reverse && (
      <div style={{ width: 2, height: 32, background: active ? color : "#1e293b", transition: "background 0.3s" }} />
    )}
    <style>{`@keyframes slideDown { from { top: -30% } to { top: 110% } }`}</style>
  </div>
);

export default function DNS() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef = useRef(null);
  const current = STEPS[step];

  useEffect(() => {
    if (autoPlay) {
      timerRef.current = setInterval(() => {
        setStep(s => {
          if (s >= STEPS.length - 1) { setAutoPlay(false); return s; }
          return s + 1;
        });
      }, 2200);
    }
    return () => clearInterval(timerRef.current);
  }, [autoPlay]);

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace", padding: 24, gap: 20,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • DNS & SERVICE DISCOVERY
        </div>
        <div style={{ fontSize: 22, color: "#f1f5f9", fontWeight: 700, minHeight: 32 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, minHeight: 20 }}>
          {current.subtitle}
        </div>
      </div>

      {/* Main diagram */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "28px 36px",
      }}>

        {/* Left: Frontend pod */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>POD</span>
          <PodBox label="frontend-pod" ip="10.0.1.11" highlight={current.highlight === "pod" || current.highlight === "resolv"} />
          <div style={{ fontSize: 9, color: current.highlight === "resolv" ? "#fbbf24" : "#334155", fontFamily: "monospace", transition: "color 0.3s" }}>
            /etc/resolv.conf
          </div>
        </div>

        {/* Arrow pod → CoreDNS */}
        <div style={{ margin: "0 8px", marginBottom: 20 }}>
          <AnimatedArrow
            active={current.activeArrow === "to-dns"}
            color="#a78bfa"
            label="DNS query"
          />
        </div>

        {/* Center: CoreDNS */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          opacity: current.showCoreDNS ? 1 : 0.2,
          transition: "opacity 0.4s",
        }}>
          <span style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>COREDNS</span>
          <div style={{
            background: current.highlight === "coredns" || current.highlight === "answer"
              ? "linear-gradient(135deg,#1a0f2e,#2d1f4e)"
              : "linear-gradient(135deg,#12101a,#1e1a2e)",
            border: `2px solid ${current.highlight === "coredns" || current.highlight === "answer" ? "#a78bfa" : "#3b3560"}`,
            borderRadius: 12, padding: "10px 16px",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            boxShadow: current.highlight === "coredns" ? "0 0 24px #a78bfa50" : "none",
            transition: "all 0.4s", minWidth: 120,
          }}>
            <span style={{ fontSize: 9, color: "#a78bfa", fontFamily: "monospace" }}>Service</span>
            <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>coredns</span>
            <span style={{ fontSize: 9, color: "#c4b5fd", fontFamily: "monospace" }}>10.43.0.10</span>
            <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
              {["core-1", "core-2"].map(id => (
                <PodBox key={id} label={id} small highlight={current.highlight === "coredns"} />
              ))}
            </div>
          </div>

          {/* DNS answer */}
          {current.showAnswer && (
            <div style={{
              background: "#0d1f0d", border: "1px solid #22c55e",
              borderRadius: 8, padding: "4px 12px",
              fontSize: 10, color: "#4ade80", fontFamily: "monospace",
              animation: "fadeIn 0.4s ease",
            }}>
              → 10.96.20.20
            </div>
          )}
        </div>

        {/* Arrow CoreDNS → pod (answer) */}
        <div style={{ margin: "0 8px", marginBottom: 20 }}>
          <AnimatedArrow
            active={current.activeArrow === "from-dns"}
            color="#22c55e"
            label="IP ответ"
            reverse
          />
        </div>

        {/* Arrow pod → Service */}
        <div style={{ margin: "0 8px", marginBottom: 20 }}>
          <AnimatedArrow
            active={current.activeArrow === "to-svc"}
            color="#0ea5e9"
            label="трафик"
          />
        </div>

        {/* Right: backend-svc + pods */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          opacity: current.showTraffic ? 1 : 0.4,
          transition: "opacity 0.4s",
        }}>
          <ServiceBox label="backend-svc" ip="10.96.20.20" highlight={current.highlight === "svc"} />
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            {["be-pod-1\n10.0.2.21", "be-pod-2\n10.0.2.22"].map((p, i) => (
              <PodBox key={i} label={p.split("\n")[0]} ip={p.split("\n")[1]} small highlight={current.highlight === "svc"} />
            ))}
          </div>
        </div>
      </div>

      {/* resolv.conf terminal */}
      <Terminal visible={current.showResolv} />

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => { setAutoPlay(false); setStep(s => Math.max(0, s - 1)); }}
          disabled={step === 0}
          style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #334155", background: step === 0 ? "#0d1117" : "#1e293b", color: step === 0 ? "#475569" : "#e2e8f0", cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}>
          ← Назад
        </button>

        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => { setAutoPlay(false); setStep(i); }} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? "#0ea5e9" : "#1e293b",
              transition: "all 0.3s", cursor: "pointer",
            }} />
          ))}
        </div>

        <button onClick={() => { setAutoPlay(false); setStep(s => Math.min(STEPS.length - 1, s + 1)); }}
          disabled={step === STEPS.length - 1}
          style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #334155", background: step === STEPS.length - 1 ? "#0d1117" : "#1e293b", color: step === STEPS.length - 1 ? "#475569" : "#e2e8f0", cursor: step === STEPS.length - 1 ? "default" : "pointer", fontSize: 12 }}>
          Вперёд →
        </button>

        <button onClick={() => { setStep(0); setAutoPlay(true); }}
          style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${autoPlay ? "#0ea5e9" : "#334155"}`, background: autoPlay ? "#0c2a3a" : "#1e293b", color: autoPlay ? "#38bdf8" : "#94a3b8", cursor: "pointer", fontSize: 12 }}>
          {autoPlay ? "⏸ пауза" : "▶ авто"}
        </button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}
