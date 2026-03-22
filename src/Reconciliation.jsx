import { useState, useEffect } from "react";

const STEPS = [
  {
    id: "problem",
    title: "Проблема: как держать состояние актуальным?",
    subtitle: "Pod упал. Нода умерла. Конфиг изменился. Кто следит за тем, что всё работает как надо?",
    annotation: "Kubernetes не использует модель push — никто не говорит компонентам 'иди исправь это'. Вместо этого каждый контроллер непрерывно сам спрашивает: 'мир такой, каким я хочу его видеть?'",
    annotationColor: "#ef4444",
    phase: "problem",
  },
  {
    id: "desired",
    title: "Desired State vs Actual State",
    subtitle: "Desired State — то, что записано в etcd. Actual State — то, что реально происходит в кластере прямо сейчас.",
    annotation: "replicas: 3 в манифесте — это желаемое состояние. Два реально работающих пода — это актуальное состояние. Разница между ними называется drift. Работа контроллера — устранять этот drift.",
    annotationColor: "#6366f1",
    phase: "states",
  },
  {
    id: "loop",
    title: "Reconciliation Loop — бесконечный цикл выравнивания",
    subtitle: "Observe → Diff → Act. Контроллер бесконечно сравнивает желаемое с реальным и предпринимает действия.",
    annotation: "Это не polling каждую секунду — контроллер реагирует на события через Watch API. Но логика всегда одна: смотрю на текущее состояние → сравниваю с желаемым → делаю минимальный шаг чтобы приблизиться к цели.",
    annotationColor: "#22c55e",
    phase: "loop",
  },
  {
    id: "idempotent",
    title: "Идемпотентность — ключевое свойство",
    subtitle: "Запустить reconcile 1 раз и 100 раз — результат одинаковый. Контроллер не 'создаёт', он 'приводит к состоянию'.",
    annotation: "Это критически важно для надёжности. Если контроллер упал на полпути — при рестарте он просто запустит reconcile снова. Никаких дублей, никаких конфликтов. Ваш оператор ОБЯЗАН быть идемпотентным.",
    annotationColor: "#f59e0b",
    phase: "idempotent",
  },
  {
    id: "example",
    title: "Пример: ReplicaSet Controller",
    subtitle: "Desired: 3 пода. Actual: 2 пода. Действие: создать 1 под. Следующий цикл: Actual: 3 пода. Ничего не делать.",
    annotation: "Контроллер не помнит что он делал в прошлый раз. Каждый reconcile — чистый лист. Смотрим на мир, решаем что делать, действуем. Это делает систему устойчивой к сбоям и перезапускам.",
    annotationColor: "#38bdf8",
    phase: "example",
  },
];

function LoopDiagram({ animating }) {
  const nodes = [
    { label: "OBSERVE", sublabel: "Watch API\nчитаем состояние", angle: -90, color: "#38bdf8" },
    { label: "DIFF", sublabel: "desired vs actual\nнаходим разницу", angle: 30, color: "#6366f1" },
    { label: "ACT", sublabel: "API Server\nприводим к цели", angle: 150, color: "#22c55e" },
  ];

  const cx = 140, cy = 140, r = 90;

  return (
    <svg width="280" height="280" viewBox="0 0 280 280">
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />

      {/* Animated arc */}
      {animating && (
        <circle
          cx={cx} cy={cy} r={r + 8}
          fill="none" stroke="#22c55e" strokeWidth="2"
          strokeDasharray="40 200"
          style={{ animation: "spin 3s linear infinite", transformOrigin: `${cx}px ${cy}px` }}
        />
      )}

      {/* Center */}
      <circle cx={cx} cy={cy} r={32} fill="#0d1117" stroke="#1e293b" strokeWidth="1" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">reconcile</text>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace">loop</text>
      <text x={cx} y={cy + 18} textAnchor="middle" fill="#22c55e" fontSize="11">∞</text>

      {/* Nodes */}
      {nodes.map((n, i) => {
        const rad = (n.angle * Math.PI) / 180;
        const nx = cx + r * Math.cos(rad);
        const ny = cy + r * Math.sin(rad);
        const lines = n.sublabel.split("\n");
        return (
          <g key={i}>
            <circle cx={nx} cy={ny} r={28} fill="#080c14" stroke={n.color} strokeWidth="2" />
            <circle cx={nx} cy={ny} r={28} fill={n.color + "10"} />
            <text x={nx} y={ny - 4} textAnchor="middle" fill={n.color} fontSize="9" fontWeight="bold" fontFamily="monospace">{n.label}</text>
            {lines.map((l, j) => (
              <text key={j} x={nx} y={ny + 8 + j * 10} textAnchor="middle" fill="#475569" fontSize="6.5" fontFamily="monospace">{l}</text>
            ))}
          </g>
        );
      })}

      <style>{`@keyframes spin { from { stroke-dashoffset: 0 } to { stroke-dashoffset: -240 } }`}</style>
    </svg>
  );
}

function StateBar({ label, value, max, color, sublabel }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
      <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>{label}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div key={i} style={{
            width: 28, height: 28, borderRadius: 6,
            background: i < value ? color + "30" : "#0d1117",
            border: `2px solid ${i < value ? color : "#1e293b"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, transition: "all 0.4s",
          }}>
            {i < value ? "▶" : ""}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 8, color, fontFamily: "monospace" }}>{sublabel}</div>
    </div>
  );
}

export default function Reconciliation() {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);

  const cur = STEPS[step];

  useEffect(() => {
    if (cur.phase === "loop") setAnimating(true);
    else setAnimating(false);
  }, [cur.phase]);

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 20,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • RECONCILIATION LOOP
        </div>
        <div style={{ fontSize: 20, color: "#f1f5f9", fontWeight: 700, minHeight: 30 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, minHeight: 18, maxWidth: 560, textAlign: "center" }}>{cur.subtitle}</div>
      </div>

      {/* Diagram */}
      <div style={{
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "28px 36px",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 40,
        minWidth: 500,
      }}>

        {cur.phase === "problem" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
            {[
              { icon: "💥", text: "Pod упал", color: "#ef4444" },
              { icon: "💀", text: "Нода умерла", color: "#ef4444" },
              { icon: "📝", text: "Конфиг изменился", color: "#f59e0b" },
              { icon: "🔄", text: "Rollout запущен", color: "#0ea5e9" },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "center",
                background: "#080c14", border: `1px solid ${item.color}30`,
                borderRadius: 8, padding: "8px 20px", minWidth: 240,
              }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: item.color, fontFamily: "monospace" }}>{item.text}</span>
                <span style={{ fontSize: 11, color: "#334155", marginLeft: "auto" }}>кто реагирует?</span>
              </div>
            ))}
          </div>
        )}

        {cur.phase === "states" && (
          <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 9, color: "#6366f1", letterSpacing: 2 }}>DESIRED STATE</div>
              <div style={{ background: "#0f0f2a", border: "2px solid #6366f1", borderRadius: 12, padding: "12px 20px", minWidth: 140 }}>
                <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>deployment.yaml</div>
                <div style={{ fontSize: 10, color: "#a5b4fc", fontFamily: "monospace", marginTop: 6 }}>replicas: 3</div>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>image: nginx:1.25</div>
              </div>
              <div style={{ fontSize: 9, color: "#475569" }}>хранится в etcd</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 18 }}>≠</div>
              <div style={{ fontSize: 9, color: "#ef4444", fontFamily: "monospace" }}>drift!</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 9, color: "#22c55e", letterSpacing: 2 }}>ACTUAL STATE</div>
              <div style={{ background: "#0a1f0a", border: "2px solid #22c55e", borderRadius: 12, padding: "12px 20px", minWidth: 140 }}>
                <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>в кластере</div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  {[1, 2].map(i => <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: "#22c55e30", border: "1px solid #22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>▶</div>)}
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "#ef444430", border: "1px dashed #ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✕</div>
                </div>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "monospace", marginTop: 4 }}>running: 2/3</div>
              </div>
              <div style={{ fontSize: 9, color: "#475569" }}>реальность</div>
            </div>
          </div>
        )}

        {(cur.phase === "loop" || cur.phase === "idempotent") && (
          <LoopDiagram animating={animating} />
        )}

        {cur.phase === "example" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 420 }}>
            {[
              { step: "Observe", desc: "смотрим на поды ReplicaSet", desired: 3, actual: 2, color: "#38bdf8" },
              { step: "Diff", desc: "desired(3) - actual(2) = +1", desired: 3, actual: 2, color: "#6366f1", diff: true },
              { step: "Act", desc: "создаём 1 новый Pod", desired: 3, actual: 3, color: "#22c55e", act: true },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex", gap: 12, alignItems: "center",
                background: "#080c14", border: `1px solid ${row.color}30`,
                borderRadius: 10, padding: "10px 16px",
              }}>
                <div style={{
                  minWidth: 60, padding: "3px 8px", borderRadius: 6,
                  background: row.color + "20", border: `1px solid ${row.color}`,
                  fontSize: 9, color: row.color, fontFamily: "monospace", textAlign: "center", fontWeight: 700,
                }}>{row.step}</div>
                <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", flex: 1 }}>{row.desc}</span>
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} style={{
                      width: 20, height: 20, borderRadius: 4,
                      background: j < row.actual ? row.color + "30" : row.act && j === 2 ? "#22c55e20" : "#0d1117",
                      border: `1px solid ${j < row.actual ? row.color : row.act && j === 2 ? "#22c55e" : "#1e293b"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, transition: "all 0.4s",
                    }}>
                      {j < row.actual ? "▶" : row.act && j === 2 ? "+" : ""}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div style={{
              display: "flex", justifyContent: "center", gap: 8,
              background: "#0a2a0a", border: "1px solid #22c55e", borderRadius: 8, padding: "8px 16px",
            }}>
              <span style={{ fontSize: 9, color: "#86efac", fontFamily: "monospace" }}>✓ Следующий reconcile: actual(3) == desired(3) → ничего не делать</span>
            </div>
          </div>
        )}
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
        <span style={{ marginRight: 8, color: cur.annotationColor }}>ℹ</span>{cur.annotation}
      </div>

      <div style={{ fontSize: 10, color: "#334155" }}>{step + 1} / {STEPS.length}</div>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
          style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #334155", background: step === 0 ? "#0d1117" : "#1e293b", color: step === 0 ? "#475569" : "#e2e8f0", cursor: step === 0 ? "default" : "pointer", fontSize: 12 }}>
          ← Назад
        </button>
        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? "#0ea5e9" : "#1e293b",
              transition: "all 0.3s", cursor: "pointer",
            }} />
          ))}
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
