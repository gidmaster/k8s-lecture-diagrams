import { useState, useEffect, useRef } from "react";

// ── Primitives ─────────────────────────────────────────────────────────────────

const PodIcon = ({ label, ip, highlight, small, dim }) => {
  const size = small ? 40 : 52;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, opacity: dim ? 0.25 : 1, transition: "opacity 0.4s" }}>
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: highlight ? "linear-gradient(135deg,#3b82f6,#6366f1)" : "linear-gradient(135deg,#1e293b,#334155)",
        border: `2px solid ${highlight ? "#6366f1" : "#475569"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: highlight ? "0 0 16px #6366f180" : "none",
        transition: "all 0.4s",
      }}>
        <svg width={small ? 20 : 26} height={small ? 20 : 26} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#bfdbfe" : "#94a3b8"} />
          <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
          <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
          <circle cx="16" cy="24" r="2" fill={highlight ? "#6366f1" : "#64748b"} />
        </svg>
      </div>
      {label && <span style={{ fontSize: 9, color: "#94a3b8", fontFamily: "monospace" }}>{label}</span>}
      {ip && <span style={{ fontSize: 8, color: "#64748b", fontFamily: "monospace" }}>{ip}</span>}
    </div>
  );
};

const SvcBox = ({ label, ip, highlight, dim }) => (
  <div style={{
    background: highlight ? "linear-gradient(135deg,#0f2a3a,#1a4a5a)" : "linear-gradient(135deg,#0f2027,#1a3a4a)",
    border: `2px solid ${highlight ? "#38bdf8" : "#0ea5e9"}`,
    borderRadius: 12, padding: "10px 16px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    boxShadow: highlight ? "0 0 24px #0ea5e960" : "0 0 8px #0ea5e920",
    transition: "all 0.4s", minWidth: 130,
    opacity: dim ? 0.25 : 1,
  }}>
    <span style={{ fontSize: 9, color: "#38bdf8", fontFamily: "monospace", letterSpacing: 1 }}>Service</span>
    <span style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>{label}</span>
    <span style={{ fontSize: 9, color: "#7dd3fc", fontFamily: "monospace" }}>{ip}</span>
  </div>
);

// Горизонтальная стрелка с анимированным бегущим огоньком
const Arrow = ({ active, color, label, reverse, dim }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, opacity: dim ? 0.2 : 1, transition: "opacity 0.4s" }}>
    {label && <span style={{ fontSize: 9, color: active ? color : "#475569", fontFamily: "monospace", whiteSpace: "nowrap", transition: "color 0.3s" }}>{label}</span>}
    <div style={{ display: "flex", alignItems: "center" }}>
      {reverse && <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderRight: `7px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
      <div style={{ width: 56, height: 2, background: active ? color : "#1e293b", transition: "background 0.3s", position: "relative", overflow: "hidden" }}>
        {active && <div style={{ position: "absolute", top: -2, left: 0, width: "35%", height: 6, background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent, ${color}, transparent)`, animation: reverse ? "slideLeft 0.9s linear infinite" : "slideRight 0.9s linear infinite" }} />}
      </div>
      {!reverse && <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
    </div>
    <style>{`
      @keyframes slideRight { from { left:-35% } to { left:110% } }
      @keyframes slideLeft  { from { left:110% } to { left:-35% } }
    `}</style>
  </div>
);

const Terminal = ({ visible }) => (
  <div style={{
    opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(-8px)",
    transition: "all 0.4s ease", background: "#0d1117",
    border: "1px solid #30363d", borderRadius: 10, overflow: "hidden",
    minWidth: 360, boxShadow: "0 8px 32px #00000060",
    pointerEvents: visible ? "auto" : "none",
  }}>
    <div style={{ background: "#161b22", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #30363d" }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
      <span style={{ fontSize: 11, color: "#8b949e", marginLeft: 8, fontFamily: "monospace" }}>pod$ cat /etc/resolv.conf</span>
    </div>
    <div style={{ padding: "14px 18px", fontFamily: "monospace", fontSize: 11, lineHeight: 1.9 }}>
      <div style={{ color: "#8b949e" }}># Автоматически создан kubelet</div>
      <div><span style={{ color: "#79c0ff" }}>search</span><span style={{ color: "#e6edf3" }}> demo.svc.cluster.local svc.cluster.local cluster.local</span></div>
      <div><span style={{ color: "#79c0ff" }}>nameserver</span><span style={{ color: "#ffa657" }}> 10.43.0.10</span><span style={{ color: "#8b949e" }}>  # CoreDNS ClusterIP</span></div>
      <div><span style={{ color: "#79c0ff" }}>options</span><span style={{ color: "#e6edf3" }}> ndots:5</span></div>
      <div style={{ marginTop: 10, color: "#8b949e", fontSize: 10 }}>┌─ clusterDomain: cluster.local  (параметр kubelet)</div>
      <div style={{ color: "#8b949e", fontSize: 10 }}>└─ clusterDNS: 10.43.0.10       (параметр kubelet)</div>
    </div>
  </div>
);

// ── Steps ──────────────────────────────────────────────────────────────────────
//
// Правильный поток:
//   DNS query:   frontend-pod  ──────────────►  CoreDNS
//   DNS ответ:   frontend-pod  ◄──────────────  CoreDNS
//   Трафик:      frontend-pod  ──►  backend-svc  ──►  backend-pods

const STEPS = [
  {
    title: "Под хочет достучаться до backend-svc",
    subtitle: "Знает имя сервиса, но не знает IP. Нужен DNS-резолвинг.",
    showResolv: false,
    queryActive: false,   // frontend-pod → CoreDNS
    answerActive: false,  // frontend-pod ← CoreDNS
    trafficActive: false, // frontend-pod → backend-svc → pods
    showAnswer: false,
    highlightFe: true,
    highlightDns: false,
    highlightSvc: false,
  },
  {
    title: "Смотрим в /etc/resolv.conf",
    subtitle: "Kubelet кладёт этот файл в каждый под при запуске.",
    showResolv: true,
    queryActive: false,
    answerActive: false,
    trafficActive: false,
    showAnswer: false,
    highlightFe: true,
    highlightDns: false,
    highlightSvc: false,
  },
  {
    title: "DNS-запрос уходит в CoreDNS",
    subtitle: "nameserver 10.43.0.10 — ClusterIP сервиса перед репликами CoreDNS.",
    showResolv: true,
    queryActive: true,    // ← анимация вправо
    answerActive: false,
    trafficActive: false,
    showAnswer: false,
    highlightFe: false,
    highlightDns: true,
    highlightSvc: false,
  },
  {
    title: "CoreDNS возвращает IP сервиса",
    subtitle: "backend-svc.default.svc.cluster.local → 10.96.20.20",
    showResolv: true,
    queryActive: false,
    answerActive: true,   // ← анимация влево, обратно к поду
    trafficActive: false,
    showAnswer: true,
    highlightFe: true,
    highlightDns: false,
    highlightSvc: false,
  },
  {
    title: "Под идёт по IP к backend-svc",
    subtitle: "Service принимает трафик и балансирует его по backend-подам.",
    showResolv: true,
    queryActive: false,
    answerActive: false,
    trafficActive: true,  // ← анимация вправо к сервису и подам
    showAnswer: true,
    highlightFe: false,
    highlightDns: false,
    highlightSvc: true,
  },
];

export default function DNS() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const timerRef = useRef(null);
  const cur = STEPS[step];

  useEffect(() => {
    if (autoPlay) {
      timerRef.current = setInterval(() => {
        setStep(s => {
          if (s >= STEPS.length - 1) { setAutoPlay(false); return s; }
          return s + 1;
        });
      }, 2400);
    }
    return () => clearInterval(timerRef.current);
  }, [autoPlay]);

  const goto = (i) => { setAutoPlay(false); setStep(i); };

  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace", padding: 24, gap: 20 }}>

      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>KUBERNETES • DNS & SERVICE DISCOVERY</div>
        <div style={{ fontSize: 22, color: "#f1f5f9", fontWeight: 700, minHeight: 32 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, minHeight: 20 }}>{cur.subtitle}</div>
      </div>

      {/* Diagram */}
      <div style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 20, padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>

          {/* 1. Frontend pod */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>POD</span>
            <PodIcon label="frontend-pod" ip="10.0.1.11" highlight={cur.highlightFe} />
            <div style={{ fontSize: 9, color: cur.showResolv ? "#fbbf24" : "#334155", fontFamily: "monospace", transition: "color 0.3s" }}>
              /etc/resolv.conf
            </div>
          </div>

          {/* 2. Двойная стрелка pod ↔ CoreDNS */}
          {/* query вправо, answer влево — стопкой */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "0 6px", marginBottom: 20 }}>
            <Arrow active={cur.queryActive}  color="#a78bfa" label="DNS query" />
            <Arrow active={cur.answerActive} color="#22c55e" label="IP ответ"  reverse />
          </div>

          {/* 3. CoreDNS */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, color: "#64748b", letterSpacing: 2 }}>COREDNS</span>
            <div style={{
              background: cur.highlightDns ? "linear-gradient(135deg,#1a0f2e,#2d1f4e)" : "linear-gradient(135deg,#12101a,#1e1a2e)",
              border: `2px solid ${cur.highlightDns ? "#a78bfa" : "#3b3560"}`,
              borderRadius: 12, padding: "10px 14px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              boxShadow: cur.highlightDns ? "0 0 24px #a78bfa50" : "none",
              transition: "all 0.4s", minWidth: 110,
            }}>
              <span style={{ fontSize: 9, color: "#a78bfa", fontFamily: "monospace" }}>Service</span>
              <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>coredns</span>
              <span style={{ fontSize: 9, color: "#c4b5fd", fontFamily: "monospace" }}>10.43.0.10</span>
              <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                <PodIcon label="core-1" highlight={cur.highlightDns} small />
                <PodIcon label="core-2" highlight={cur.highlightDns} small />
              </div>
            </div>
            {cur.showAnswer && (
              <div style={{ background: "#0d1f0d", border: "1px solid #22c55e", borderRadius: 8, padding: "3px 10px", fontSize: 10, color: "#4ade80", fontFamily: "monospace", animation: "fadeIn 0.4s ease" }}>
                → 10.96.20.20
              </div>
            )}
          </div>

          {/* 4. Стрелка трафика от пода к backend-svc */}
          {/* Эта стрелка выходит ИЗ пода, но для простоты идёт от CoreDNS вправо — */}
          {/* поэтому рисуем её отдельной секцией справа от CoreDNS с пояснением */}
          <div style={{ margin: "0 6px", marginBottom: 20 }}>
            <Arrow active={cur.trafficActive} color="#0ea5e9" label="трафик" dim={!cur.trafficActive && step < 4} />
          </div>

          {/* 5. backend-svc + поды */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <SvcBox label="backend-svc" ip="10.96.20.20" highlight={cur.highlightSvc} dim={!cur.trafficActive && step < 4} />
            <div style={{ display: "flex", gap: 10 }}>
              <PodIcon label="be-pod-1" ip="10.0.2.21" small highlight={cur.highlightSvc} dim={!cur.trafficActive && step < 4} />
              <PodIcon label="be-pod-2" ip="10.0.2.22" small highlight={cur.highlightSvc} dim={!cur.trafficActive && step < 4} />
            </div>
          </div>

        </div>

        {/* Пояснение о потоке трафика на последнем шаге */}
        {cur.trafficActive && (
          <div style={{ marginTop: 14, textAlign: "center", fontSize: 10, color: "#64748b", fontFamily: "monospace", animation: "fadeIn 0.4s ease" }}>
            frontend-pod знает IP (10.96.20.20) → идёт напрямую к backend-svc, минуя CoreDNS
          </div>
        )}
      </div>

      {/* resolv.conf terminal */}
      <Terminal visible={cur.showResolv} />

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => goto(Math.max(0, step - 1))} disabled={step === 0}
          style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #334155", background: step === 0 ? "#0d1117" : "#1e293b", color: step === 0 ? "#475569" : "#e2e8f0", cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}>
          ← Назад
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => goto(i)} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i === step ? "#0ea5e9" : "#1e293b", transition: "all 0.3s", cursor: "pointer" }} />
          ))}
        </div>
        <button onClick={() => goto(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1}
          style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #334155", background: step === STEPS.length - 1 ? "#0d1117" : "#1e293b", color: step === STEPS.length - 1 ? "#475569" : "#e2e8f0", cursor: step === STEPS.length - 1 ? "default" : "pointer", fontSize: 12 }}>
          Вперёд →
        </button>
        <button onClick={() => { setStep(0); setAutoPlay(a => !a); }}
          style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${autoPlay ? "#0ea5e9" : "#334155"}`, background: autoPlay ? "#0c2a3a" : "#1e293b", color: autoPlay ? "#38bdf8" : "#94a3b8", cursor: "pointer", fontSize: 12 }}>
          {autoPlay ? "⏸ пауза" : "▶ авто"}
        </button>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  );
}
