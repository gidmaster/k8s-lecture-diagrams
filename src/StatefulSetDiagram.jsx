import { useState } from "react";

// ── Режимы ───────────────────────────────────────────────────────────────────
// "compare"  — Deployment vs StatefulSet
// "startup"  — пошаговый запуск подов StatefulSet

// ── Шаги: сравнение ──────────────────────────────────────────────────────────
const COMPARE_STEPS = [
  {
    id: "c0",
    title: "Deployment vs StatefulSet",
    subtitle: "Два контроллера для разных задач. Выбор зависит от того нужна ли приложению идентичность.",
    annotation: "Deployment — для stateless. StatefulSet — для stateful. Один и тот же образ, принципиально разное поведение.",
    annotationColor: "#38bdf8",
    phase: "intro",
  },
  {
    id: "c1",
    title: "Deployment: поды взаимозаменяемы",
    subtitle: "Имена случайные, хранилище общее или отсутствует. Любой Pod идентичен любому другому.",
    annotation: "При рестарте Pod получает новое случайное имя и новый IP. Для stateless-приложений это не важно — любой Pod обрабатывает любой запрос.",
    annotationColor: "#3b82f6",
    phase: "deployment",
  },
  {
    id: "c2",
    title: "StatefulSet: каждый Pod уникален",
    subtitle: "Стабильные имена web-0, web-1, web-2. Свой PVC для каждого. При рестарте Pod возвращается к своим данным.",
    annotation: "web-0 всегда web-0. Даже если Pod пересоздаётся на другой ноде — он получает то же имя и монтирует тот же PVC. Идентичность сохраняется.",
    annotationColor: "#34d399",
    phase: "statefulset",
  },
  {
    id: "c3",
    title: "Ключевое отличие: DNS-имена",
    subtitle: "StatefulSet даёт каждому Pod стабильный DNS-адрес через Headless Service. Поды знают адреса друг друга.",
    annotation: "web-0.nginx.default.svc.cluster.local — это имя не изменится. PostgreSQL-реплика знает адрес мастера. Kafka-брокер знает адреса соседних брокеров.",
    annotationColor: "#a78bfa",
    phase: "dns",
  },
];

// ── Шаги: запуск StatefulSet ─────────────────────────────────────────────────
const STARTUP_STEPS = [
  {
    id: "s0",
    title: "StatefulSet создан: replicas: 3",
    subtitle: "kubectl apply -f statefulset.yaml. Kubernetes начинает создавать поды строго по порядку.",
    pods: [
      { name: "web-0", state: "Pending", pvc: "www-web-0", pvcState: "Pending" },
      { name: "web-1", state: null },
      { name: "web-2", state: null },
    ],
    annotation: "StatefulSet запускает поды строго по порядку: сначала web-0, только потом web-1, потом web-2. Параллельный запуск невозможен — это намеренное ограничение.",
    annotationColor: "#38bdf8",
  },
  {
    id: "s1",
    title: "web-0: создаётся PVC и Pod",
    subtitle: "StorageClass создаёт PV под PVC www-web-0. Pod web-0 стартует и монтирует том.",
    pods: [
      { name: "web-0", state: "Running", pvc: "www-web-0", pvcState: "Bound", highlight: true },
      { name: "web-1", state: null },
      { name: "web-2", state: null },
    ],
    annotation: "volumeClaimTemplates автоматически создаёт PVC www-web-0. StorageClass через CSI-драйвер создаёт PV и биндит его. Pod web-0 монтирует том и стартует.",
    annotationColor: "#34d399",
  },
  {
    id: "s2",
    title: "web-0: Readiness Probe пройдена",
    subtitle: "HTTP GET /health → 200 OK. Только теперь Kubernetes считает web-0 Ready и переходит к web-1.",
    pods: [
      { name: "web-0", state: "Ready", pvc: "www-web-0", pvcState: "Bound", ready: true },
      { name: "web-1", state: "Pending", pvc: "www-web-1", pvcState: "Pending", highlight: true },
      { name: "web-2", state: null },
    ],
    annotation: "Без Readiness Probe Kubernetes считает под готовым сразу после старта контейнера. Приложение может не успеть инициализироваться — и следующий под стартует преждевременно.",
    annotationColor: "#fbbf24",
  },
  {
    id: "s3",
    title: "web-1: Running, ожидаем Ready",
    subtitle: "PVC www-web-1 создан и забиндирован. Pod web-1 запустился, Readiness Probe ещё проверяется.",
    pods: [
      { name: "web-0", state: "Ready", pvc: "www-web-0", pvcState: "Bound", ready: true },
      { name: "web-1", state: "Running", pvc: "www-web-1", pvcState: "Bound", highlight: true },
      { name: "web-2", state: null },
    ],
    annotation: "web-0 уже принимает трафик. web-1 запущен но ещё не Ready — web-2 ждёт. Это гарантирует что в кластере всегда есть хотя бы один рабочий узел.",
    annotationColor: "#0ea5e9",
  },
  {
    id: "s4",
    title: "Все три пода Running и Ready",
    subtitle: "StatefulSet полностью развёрнут. Каждый Pod имеет стабильное имя, свой PVC и DNS-адрес.",
    pods: [
      { name: "web-0", state: "Ready", pvc: "www-web-0", pvcState: "Bound", ready: true },
      { name: "web-1", state: "Ready", pvc: "www-web-1", pvcState: "Bound", ready: true },
      { name: "web-2", state: "Ready", pvc: "www-web-2", pvcState: "Bound", ready: true },
    ],
    annotation: "Headless Service позволяет обратиться к любому поду напрямую: web-0.nginx.default.svc.cluster.local, web-1.nginx... — стабильные DNS-имена на всё время жизни StatefulSet.",
    annotationColor: "#22c55e",
  },
  {
    id: "s5",
    title: "Pod web-1 упал и пересоздался",
    subtitle: "Kubernetes пересоздаёт web-1 с тем же именем. Монтирует тот же PVC www-web-1. Данные не потеряны.",
    pods: [
      { name: "web-0", state: "Ready", pvc: "www-web-0", pvcState: "Bound", ready: true },
      { name: "web-1", state: "Running", pvc: "www-web-1", pvcState: "Bound", highlight: true, restarted: true },
      { name: "web-2", state: "Ready", pvc: "www-web-2", pvcState: "Bound", ready: true },
    ],
    annotation: "Это ключевое свойство StatefulSet: идентичность пережила рестарт. web-1 вернулся к своим данным. В Deployment — Pod получил бы новое имя и новый (пустой) том.",
    annotationColor: "#f59e0b",
  },
];

// ── Примитивы ────────────────────────────────────────────────────────────────

const StateColors = {
  Running: { border: "#3b82f6", bg: "#0f2040", text: "#93c5fd" },
  Ready:   { border: "#22c55e", bg: "#0a2a0a", text: "#86efac" },
  Pending: { border: "#f59e0b", bg: "#1a1200", text: "#fcd34d" },
  Bound:   { border: "#34d399", bg: "#0a1f17", text: "#6ee7b7" },
  dead:    { border: "#7f1d1d", bg: "#1a0808", text: "#fca5a5" },
};

const PodCard = ({ name, state, pvc, pvcState, highlight, ready, restarted, dim, isDeployment }) => {
  if (!state) return (
    <div style={{
      border: "2px dashed #1e293b", borderRadius: 12,
      padding: "10px 14px", minWidth: 130,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      opacity: 0.2,
    }}>
      <span style={{ fontSize: 9, color: "#334155", fontFamily: "monospace" }}>Pod</span>
      <span style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>{name}</span>
      <span style={{ fontSize: 8, color: "#334155", fontFamily: "monospace" }}>ожидает...</span>
    </div>
  );

  const sc = StateColors[state] || StateColors.Pending;

  return (
    <div style={{
      border: `2px solid ${highlight ? "#fff" : sc.border}`,
      borderRadius: 12,
      background: `linear-gradient(135deg, ${sc.bg}, #080c14)`,
      boxShadow: highlight ? `0 0 24px ${sc.border}80` : `0 0 12px ${sc.border}30`,
      padding: "10px 14px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
      minWidth: 130, opacity: dim ? 0.25 : 1,
      transition: "all 0.45s ease",
      position: "relative",
    }}>
      {restarted && (
        <div style={{
          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
          background: "#1a1200", border: "1px solid #f59e0b",
          borderRadius: 4, padding: "1px 8px",
          fontSize: 8, color: "#fcd34d", fontFamily: "monospace", whiteSpace: "nowrap",
        }}>↺ пересоздан</div>
      )}

      {/* Pod icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `linear-gradient(135deg, ${sc.border}30, ${sc.border}50)`,
        border: `1px solid ${sc.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 14,
      }}>
        {ready ? "✓" : state === "Pending" ? "⋯" : "▶"}
      </div>

      <span style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>Pod</span>
      <span style={{ fontSize: 11, color: sc.text, fontWeight: 700, fontFamily: "monospace" }}>{name}</span>

      {/* State badge */}
      <div style={{
        background: sc.bg, border: `1px solid ${sc.border}`,
        borderRadius: 6, padding: "2px 8px",
        fontSize: 8, color: sc.text, fontFamily: "monospace",
      }}>{state}</div>

      {/* DNS name for StatefulSet */}
      {!isDeployment && (
        <div style={{
          fontSize: 7, color: "#475569", fontFamily: "monospace",
          textAlign: "center", marginTop: 2,
        }}>
          {name}.nginx.default
        </div>
      )}

      {/* PVC */}
      {pvc && (
        <div style={{
          marginTop: 4,
          background: pvcState === "Bound" ? "#0a1f17" : "#1a1200",
          border: `1px solid ${pvcState === "Bound" ? "#34d399" : "#f59e0b"}`,
          borderRadius: 6, padding: "3px 8px",
          fontSize: 7, color: pvcState === "Bound" ? "#6ee7b7" : "#fcd34d",
          fontFamily: "monospace", textAlign: "center",
          transition: "all 0.4s",
        }}>
          PVC: {pvc}<br />{pvcState}
        </div>
      )}
    </div>
  );
};

// Deployment поды — случайные имена, без PVC
const DeploymentPods = ({ highlight }) => {
  const pods = [
    { name: "nginx-7d4b9-xk2f8", ip: "10.0.1.11" },
    { name: "nginx-7d4b9-p9mw3", ip: "10.0.1.12" },
    { name: "nginx-7d4b9-r8nt1", ip: "10.0.1.13" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {pods.map((p, i) => (
        <div key={i} style={{
          border: `2px solid ${highlight ? "#3b82f6" : "#1e293b"}`,
          borderRadius: 10,
          background: highlight ? "linear-gradient(135deg,#0f2040,#1a3a6a)" : "linear-gradient(135deg,#0d1117,#1a2332)",
          boxShadow: highlight ? "0 0 12px #3b82f630" : "none",
          padding: "6px 14px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, transition: "all 0.4s", minWidth: 240,
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>Pod</span>
            <span style={{ fontSize: 9, color: highlight ? "#93c5fd" : "#64748b", fontFamily: "monospace" }}>{p.name}</span>
          </div>
          <div style={{
            background: "#0a1f17", border: "1px solid #22c55e",
            borderRadius: 4, padding: "2px 8px",
            fontSize: 8, color: "#6ee7b7", fontFamily: "monospace",
          }}>Running</div>
        </div>
      ))}
      <div style={{ fontSize: 8, color: "#334155", fontFamily: "monospace", textAlign: "center", marginTop: 4 }}>
        ↺ рестарт → новое случайное имя
      </div>
    </div>
  );
};

// StatefulSet поды — стабильные имена
const StatefulSetPods = ({ highlight, showDns }) => {
  const pods = [
    { name: "web-0", dns: "web-0.nginx.default.svc.cluster.local" },
    { name: "web-1", dns: "web-1.nginx.default.svc.cluster.local" },
    { name: "web-2", dns: "web-2.nginx.default.svc.cluster.local" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {pods.map((p, i) => (
        <div key={i} style={{
          border: `2px solid ${highlight ? "#22c55e" : "#1e293b"}`,
          borderRadius: 10,
          background: highlight ? "linear-gradient(135deg,#0a2a0a,#0d3a14)" : "linear-gradient(135deg,#0d1117,#1a2332)",
          boxShadow: highlight ? "0 0 12px #22c55e30" : "none",
          padding: "6px 14px",
          display: "flex", flexDirection: "column", gap: 3,
          transition: "all 0.4s", minWidth: 260,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <span style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>Pod</span>
              <span style={{ fontSize: 10, color: highlight ? "#86efac" : "#64748b", fontFamily: "monospace", fontWeight: 700 }}>{p.name}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{
                background: "#0a1f17", border: "1px solid #22c55e",
                borderRadius: 4, padding: "2px 6px",
                fontSize: 8, color: "#6ee7b7", fontFamily: "monospace",
              }}>Running</div>
              <div style={{
                background: "#0a1f17", border: "1px solid #34d399",
                borderRadius: 4, padding: "2px 6px",
                fontSize: 7, color: "#34d399", fontFamily: "monospace",
              }}>PVC: www-{p.name}</div>
            </div>
          </div>
          {showDns && (
            <div style={{ fontSize: 7, color: "#a78bfa", fontFamily: "monospace", animation: "fadeIn 0.4s ease" }}>
              ↳ {p.dns}
            </div>
          )}
        </div>
      ))}
      <div style={{ fontSize: 8, color: "#334155", fontFamily: "monospace", textAlign: "center", marginTop: 4 }}>
        ↺ рестарт → то же имя, тот же PVC
      </div>
    </div>
  );
};

// ── Диаграмма сравнения ──────────────────────────────────────────────────────
function CompareDiagram({ cur }) {
  const phase = cur.phase;
  return (
    <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>

      {/* Deployment */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        opacity: phase === "statefulset" || phase === "dns" ? 0.3 : 1,
        transition: "opacity 0.4s",
      }}>
        <div style={{
          background: phase === "deployment" ? "linear-gradient(135deg,#0f2040,#1a3a6a)" : "#0d1117",
          border: `2px solid ${phase === "deployment" ? "#3b82f6" : "#1e293b"}`,
          borderRadius: 10, padding: "8px 16px", textAlign: "center",
          transition: "all 0.4s",
        }}>
          <span style={{ fontSize: 10, color: phase === "deployment" ? "#93c5fd" : "#475569", fontFamily: "monospace", fontWeight: 700 }}>Deployment</span>
          <div style={{ fontSize: 8, color: "#334155", fontFamily: "monospace" }}>stateless</div>
        </div>
        <DeploymentPods highlight={phase === "deployment"} />
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: "#1e293b", alignSelf: "stretch", margin: "0 4px" }} />

      {/* StatefulSet */}
      <div style={{
        display: "flex", flexDirection: "column", gap: 10,
        opacity: phase === "deployment" ? 0.3 : 1,
        transition: "opacity 0.4s",
      }}>
        <div style={{
          background: phase === "statefulset" || phase === "dns" ? "linear-gradient(135deg,#0a2a0a,#0d3a14)" : "#0d1117",
          border: `2px solid ${phase === "statefulset" || phase === "dns" ? "#22c55e" : "#1e293b"}`,
          borderRadius: 10, padding: "8px 16px", textAlign: "center",
          transition: "all 0.4s",
        }}>
          <span style={{ fontSize: 10, color: phase === "statefulset" || phase === "dns" ? "#86efac" : "#475569", fontFamily: "monospace", fontWeight: 700 }}>StatefulSet</span>
          <div style={{ fontSize: 8, color: "#334155", fontFamily: "monospace" }}>stateful</div>
        </div>
        <StatefulSetPods highlight={phase === "statefulset" || phase === "dns"} showDns={phase === "dns"} />
      </div>
    </div>
  );
}

// ── Диаграмма запуска ────────────────────────────────────────────────────────
function StartupDiagram({ cur }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* StorageClass badge */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#1a0f2e", border: "1px solid #a78bfa",
          borderRadius: 8, padding: "4px 16px",
          fontSize: 9, color: "#c4b5fd", fontFamily: "monospace",
        }}>
          StorageClass: fast-ssd · динамический провижининг
        </div>
      </div>

      {/* Pods row */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        {cur.pods.map((pod, i) => (
          <PodCard key={i} {...pod} />
        ))}
      </div>

      {/* Headless service */}
      {cur.pods.filter(p => p.state === "Ready").length > 0 && (
        <div style={{
          background: "#12101a", border: "1px dashed #7c3aed",
          borderRadius: 8, padding: "8px 16px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          animation: "fadeIn 0.4s ease",
        }}>
          <span style={{ fontSize: 8, color: "#7c3aed", fontFamily: "monospace", letterSpacing: 1 }}>Headless Service · nginx · clusterIP: None</span>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {cur.pods.filter(p => p.state === "Ready").map((pod, i) => (
              <span key={i} style={{ fontSize: 8, color: "#a78bfa", fontFamily: "monospace" }}>
                {pod.name}.nginx.default ✓
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Основной компонент ───────────────────────────────────────────────────────
export default function StatefulSetDiagram() {
  const [mode, setMode] = useState("compare");
  const [step, setStep] = useState(0);

  const steps = mode === "compare" ? COMPARE_STEPS : STARTUP_STEPS;
  const cur = steps[step];

  const switchMode = (m) => { setMode(m); setStep(0); };

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 18,
    }}>

      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • STATEFULSET
        </div>
        <div style={{ fontSize: 20, color: "#f1f5f9", fontWeight: 700, minHeight: 30 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, minHeight: 18 }}>{cur.subtitle}</div>
      </div>

      {/* Mode switcher */}
      <div style={{ display: "flex", gap: 0, background: "#0d1117", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
        {[["compare", "Deployment vs StatefulSet"], ["startup", "Запуск подов"]].map(([m, label]) => (
          <button key={m} onClick={() => switchMode(m)} style={{
            padding: "8px 24px", border: "none",
            background: mode === m
              ? m === "compare" ? "#0f2040" : "#0a2a0a"
              : "transparent",
            color: mode === m
              ? m === "compare" ? "#93c5fd" : "#86efac"
              : "#475569",
            borderRight: m === "compare" ? "1px solid #1e293b" : "none",
            cursor: "pointer", fontSize: 11, fontFamily: "monospace",
            fontWeight: mode === m ? 700 : 400, transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {/* Diagram */}
      <div style={{
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "24px 32px",
        display: "flex", justifyContent: "center",
      }}>
        {mode === "compare"
          ? <CompareDiagram cur={cur} />
          : <StartupDiagram cur={cur} />
        }
      </div>

      {/* Annotation */}
      <div style={{
        background: "#0d1117",
        border: `1px solid ${cur.annotationColor}`,
        borderRadius: 12, padding: "12px 20px",
        maxWidth: 660, fontSize: 11, color: "#cbd5e1",
        fontFamily: "monospace", lineHeight: 1.8,
        animation: "fadeIn 0.4s ease",
      }}>
        <span style={{ marginRight: 8 }}>ℹ</span>{cur.annotation}
      </div>

      {/* Step counter */}
      <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>
        {step + 1} / {steps.length}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #334155", background: step === 0 ? "#0d1117" : "#1e293b", color: step === 0 ? "#475569" : "#e2e8f0", cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}>
          ← Назад
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? "#0ea5e9" : "#1e293b",
              transition: "all 0.3s", cursor: "pointer",
            }} />
          ))}
        </div>
        <button onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={step === steps.length - 1}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #334155", background: step === steps.length - 1 ? "#0d1117" : "#1e293b", color: step === steps.length - 1 ? "#475569" : "#e2e8f0", cursor: step === steps.length - 1 ? "default" : "pointer", fontSize: 12 }}>
          Вперёд →
        </button>
      </div>

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
