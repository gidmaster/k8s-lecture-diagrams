import { useState } from "react";

// ── Шаги диаграммы ──────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "problem",
    title: "Контейнер пишет данные в свою файловую систему",
    subtitle: "Логи в /var/logs, конфиг читается из /var/data. Всё выглядит нормально... пока под жив.",
    showVolumes: false,
    showSidecar: false,
    showInit: false,
    podAlive: true,
    dataLost: false,
    highlightMain: true,
    highlightLogs: false,
    highlightData: false,
    annotation: "Файловая система контейнера существует только пока жив контейнер. Это overlay-слой поверх образа — он эфемерен по природе.",
    annotationColor: "#fbbf24",
  },
  {
    id: "crash",
    title: "Под упал и пересоздался",
    subtitle: "Новый контейнер — чистая файловая система. Все данные что были внутри — исчезли.",
    showVolumes: false,
    showSidecar: false,
    showInit: false,
    podAlive: false,
    dataLost: true,
    highlightMain: false,
    highlightLogs: false,
    highlightData: false,
    annotation: "kubectl exec в контейнер и посмотреть логи — можно. Но это не решение для продакшена. И после рестарта — уже некуда смотреть.",
    annotationColor: "#f87171",
  },
  {
    id: "volume",
    title: "Добавляем Volume — директория выходит наружу",
    subtitle: "/var/logs теперь не внутри контейнера, а смонтированный Volume. Данные живут отдельно от контейнера.",
    showVolumes: true,
    showSidecar: false,
    showInit: false,
    podAlive: true,
    dataLost: false,
    highlightMain: true,
    highlightLogs: true,
    highlightData: false,
    annotation: "Volume — это абстракция над реальным хранилищем. Директория монтируется внутрь контейнера, но физически существует за его пределами.",
    annotationColor: "#34d399",
  },
  {
    id: "shared",
    title: "Тот же Volume — другой контейнер",
    subtitle: "Sidecar-контейнер видит тот же /var/logs. Читает файлы и отправляет их в централизованное хранилище.",
    showVolumes: true,
    showSidecar: true,
    showInit: false,
    podAlive: true,
    dataLost: false,
    highlightMain: false,
    highlightLogs: true,
    highlightData: false,
    annotation: "Один Volume — несколько контейнеров одновременно. Это основа паттерна sidecar: основной контейнер пишет логи, sidecar их забирает и отправляет.",
    annotationColor: "#34d399",
  },
  {
    id: "init",
    title: "Init-контейнер кладёт конфиг до старта приложения",
    subtitle: "Init-контейнер записывает конфиг в /var/data. Основное приложение стартует и уже находит нужные файлы.",
    showVolumes: true,
    showSidecar: true,
    showInit: true,
    podAlive: true,
    dataLost: false,
    highlightMain: true,
    highlightLogs: false,
    highlightData: true,
    annotation: "Init-контейнеры стартуют и завершаются до запуска основного контейнера. Через Volume они могут передать конфиги, секреты, предварительно обработанные данные.",
    annotationColor: "#a78bfa",
  },
  {
    id: "survive",
    title: "Под упал — что стало с данными?",
    subtitle: "Volume пережил перезапуск контейнера. Но переживёт ли он удаление пода — зависит от типа Volume.",
    showVolumes: true,
    showSidecar: false,
    showInit: false,
    podAlive: false,
    dataLost: false,
    highlightMain: false,
    highlightLogs: true,
    highlightData: false,
    annotation: "Эфемерные тома (emptyDir) — исчезают вместе с подом. Persistent Volumes — живут независимо. Об этом поговорим дальше.",
    annotationColor: "#38bdf8",
  },
];

// ── Примитивы ────────────────────────────────────────────────────────────────

const ContainerBox = ({ label, paths, highlight, dim, dead, isInit, isSidecar }) => {
  let borderColor = "#475569";
  let bgGrad = "linear-gradient(135deg,#1e293b,#2d3f55)";
  let glowColor = "none";
  let labelColor = "#64748b";
  let typeTag = null;

  if (dead) {
    borderColor = "#7f1d1d";
    bgGrad = "linear-gradient(135deg,#1a0f0f,#2d1515)";
    labelColor = "#7f1d1d";
  } else if (isInit) {
    borderColor = highlight ? "#a78bfa" : "#4c1d95";
    bgGrad = highlight
      ? "linear-gradient(135deg,#1e1b4b,#2d2060)"
      : "linear-gradient(135deg,#170f2e,#1e1a3a)";
    glowColor = highlight ? "0 0 16px #a78bfa40" : "none";
    labelColor = highlight ? "#c4b5fd" : "#4c1d95";
    typeTag = "init";
  } else if (isSidecar) {
    borderColor = highlight ? "#34d399" : "#065f46";
    bgGrad = highlight
      ? "linear-gradient(135deg,#0d2a1e,#0f3a28)"
      : "linear-gradient(135deg,#0a1f17,#0d2a1e)";
    glowColor = highlight ? "0 0 16px #34d39940" : "none";
    labelColor = highlight ? "#6ee7b7" : "#065f46";
    typeTag = "sidecar";
  } else {
    borderColor = highlight ? "#3b82f6" : "#1e3a5f";
    bgGrad = highlight
      ? "linear-gradient(135deg,#1e3a5f,#1e4a7f)"
      : "linear-gradient(135deg,#0f1f35,#1a2f4a)";
    glowColor = highlight ? "0 0 20px #3b82f640" : "none";
    labelColor = highlight ? "#93c5fd" : "#334155";
  }

  return (
    <div style={{
      border: `2px solid ${borderColor}`,
      borderRadius: 12,
      background: bgGrad,
      boxShadow: glowColor,
      padding: "10px 14px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      minWidth: 120,
      opacity: dim ? 0.25 : 1,
      transition: "all 0.45s ease",
      position: "relative",
    }}>
      {typeTag && (
        <div style={{
          position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
          background: isInit ? "#4c1d95" : "#065f46",
          border: `1px solid ${isInit ? "#7c3aed" : "#059669"}`,
          borderRadius: 4, padding: "1px 8px",
          fontSize: 8, color: isInit ? "#c4b5fd" : "#6ee7b7",
          fontFamily: "monospace", letterSpacing: 1, whiteSpace: "nowrap",
        }}>{typeTag}</div>
      )}

      {/* Container icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 8,
        background: dead
          ? "linear-gradient(135deg,#2d1515,#3f1515)"
          : highlight
            ? (isInit ? "linear-gradient(135deg,#4c1d95,#6d28d9)" : isSidecar ? "linear-gradient(135deg,#065f46,#047857)" : "linear-gradient(135deg,#1d4ed8,#2563eb)")
            : "linear-gradient(135deg,#1e293b,#334155)",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: `1px solid ${dead ? "#7f1d1d" : highlight ? borderColor : "#475569"}`,
        transition: "all 0.4s",
      }}>
        {dead
          ? <span style={{ color: "#ef4444", fontSize: 18, fontWeight: 700 }}>✕</span>
          : <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="16" rx="4" fill={highlight ? "#bfdbfe" : "#94a3b8"} />
              <rect x="8" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
              <rect x="18" y="12" width="6" height="4" rx="1" fill={highlight ? "#3b82f6" : "#475569"} />
              <circle cx="16" cy="24" r="2" fill={highlight ? "#6366f1" : "#64748b"} />
            </svg>
        }
      </div>

      <span style={{ fontSize: 9, color: labelColor, fontFamily: "monospace", fontWeight: 700, transition: "color 0.4s" }}>{label}</span>

      {/* Mount paths */}
      {paths.map((p, i) => (
        <div key={i} style={{
          background: dead ? "#2d1515" : p.highlight ? "#0f2a1a" : "#0d1117",
          border: `1px solid ${dead ? "#7f1d1d" : p.highlight ? "#34d399" : "#1e293b"}`,
          borderRadius: 4, padding: "2px 8px",
          fontSize: 8, color: dead ? "#7f1d1d" : p.highlight ? "#6ee7b7" : "#64748b",
          fontFamily: "monospace", transition: "all 0.4s",
        }}>{p.path}</div>
      ))}
    </div>
  );
};

const VolumeBox = ({ name, highlight, dim, survived }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    opacity: dim ? 0.15 : 1,
    transition: "all 0.45s ease",
  }}>
    {/* Cylinder shape */}
    <div style={{ position: "relative", width: 72 }}>
      {/* top ellipse */}
      <div style={{
        width: 72, height: 16, borderRadius: "50%",
        background: highlight
          ? "linear-gradient(135deg,#065f46,#047857)"
          : "linear-gradient(135deg,#1e293b,#334155)",
        border: `2px solid ${highlight ? "#34d399" : "#475569"}`,
        boxShadow: highlight ? "0 0 16px #34d39950" : "none",
        transition: "all 0.4s",
        position: "relative", zIndex: 2,
      }} />
      {/* body */}
      <div style={{
        width: 72, height: 40, marginTop: -2,
        background: highlight
          ? "linear-gradient(180deg,#065f46,#047857)"
          : "linear-gradient(180deg,#1e293b,#0f172a)",
        borderLeft: `2px solid ${highlight ? "#34d399" : "#475569"}`,
        borderRight: `2px solid ${highlight ? "#34d399" : "#475569"}`,
        boxShadow: highlight ? "0 0 16px #34d39930" : "none",
        transition: "all 0.4s",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 10, color: highlight ? "#6ee7b7" : "#475569", fontFamily: "monospace", fontWeight: 700, transition: "color 0.4s" }}>{name}</span>
      </div>
      {/* bottom ellipse */}
      <div style={{
        width: 72, height: 16, borderRadius: "50%", marginTop: -2,
        background: highlight
          ? "linear-gradient(135deg,#047857,#065f46)"
          : "linear-gradient(135deg,#0f172a,#1e293b)",
        border: `2px solid ${highlight ? "#34d399" : "#475569"}`,
        boxShadow: highlight ? "0 0 16px #34d39950" : "none",
        transition: "all 0.4s",
      }} />
    </div>

    <span style={{ fontSize: 8, color: highlight ? "#34d399" : "#334155", fontFamily: "monospace", letterSpacing: 1, transition: "color 0.4s" }}>VOLUME</span>

    {survived && (
      <div style={{
        background: "#0a1f2a", border: "1px solid #38bdf8",
        borderRadius: 6, padding: "2px 8px",
        fontSize: 8, color: "#7dd3fc", fontFamily: "monospace",
        animation: "fadeIn 0.4s ease",
      }}>✓ данные живы</div>
    )}
  </div>
);

// Вертикальная стрелка с анимацией
const VArrow = ({ active, color, reverse, dim, label }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
    opacity: dim ? 0.15 : 1, transition: "opacity 0.4s",
  }}>
    {label && <span style={{ fontSize: 8, color: active ? color : "#334155", fontFamily: "monospace", transition: "color 0.3s" }}>{label}</span>}
    {!reverse && <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `6px solid ${active ? color : "#1e293b"}`, transition: "all 0.3s" }} />}
    <div style={{
      width: 2, height: 28,
      background: active ? color : "#1e293b",
      position: "relative", overflow: "hidden", transition: "background 0.4s",
    }}>
      {active && (
        <div style={{
          position: "absolute", left: -2, width: 6, height: "35%",
          background: `linear-gradient(${reverse ? "0deg" : "180deg"}, transparent, ${color}, transparent)`,
          animation: reverse ? "slideUp 0.9s linear infinite" : "slideDown 0.9s linear infinite",
        }} />
      )}
    </div>
    {reverse && <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderBottom: `6px solid ${active ? color : "#1e293b"}`, transition: "all 0.3s" }} />}
    <style>{`
      @keyframes slideDown { from{top:-35%} to{top:110%} }
      @keyframes slideUp   { from{top:110%} to{top:-35%} }
    `}</style>
  </div>
);

// Горизонтальная стрелка
const HArrow = ({ active, color, dim, reverse, width = 36 }) => (
  <div style={{ display: "flex", alignItems: "center", opacity: dim ? 0.15 : 1, transition: "opacity 0.4s" }}>
    {reverse && <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderRight: `6px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
    <div style={{
      width, height: 2,
      background: active ? color : "#1e293b",
      position: "relative", overflow: "hidden", transition: "background 0.4s",
    }}>
      {active && (
        <div style={{
          position: "absolute", top: -2, width: "35%", height: 6,
          background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent, ${color}, transparent)`,
          animation: reverse ? "slideLeft 0.9s linear infinite" : "slideRight 0.9s linear infinite",
        }} />
      )}
    </div>
    {!reverse && <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `6px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
    <style>{`
      @keyframes slideRight { from{left:-35%} to{left:110%} }
      @keyframes slideLeft  { from{left:110%} to{left:-35%} }
    `}</style>
  </div>
);

// ── Основной компонент ───────────────────────────────────────────────────────

export default function Volumes() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  const logsVolumeHighlight = cur.highlightLogs && cur.showVolumes;
  const dataVolumeHighlight = cur.highlightData && cur.showVolumes;

  const mainPaths = [
    { path: "/var/logs", highlight: cur.highlightLogs && cur.showVolumes },
    { path: "/var/data", highlight: cur.highlightData && cur.showVolumes },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 20,
    }}>

      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • ХРАНЕНИЕ ДАННЫХ • VOLUMES
        </div>
        <div style={{ fontSize: 22, color: "#f1f5f9", fontWeight: 700, minHeight: 32 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, minHeight: 20 }}>{cur.subtitle}</div>
      </div>

      {/* Diagram */}
      <div style={{
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "28px 36px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>

        {/* Pod boundary */}
        <div style={{
          border: `2px dashed ${cur.podAlive ? "#1e3a5f" : "#7f1d1d"}`,
          borderRadius: 16, padding: "20px 24px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
          background: cur.podAlive ? "#080c14" : "#0f0808",
          transition: "all 0.45s ease",
          position: "relative",
        }}>
          {/* Pod label */}
          <div style={{
            position: "absolute", top: -11, left: 20,
            background: cur.podAlive ? "#0d1117" : "#1a0f0f",
            padding: "0 10px",
            fontSize: 10, color: cur.podAlive ? "#38bdf8" : "#f87171",
            letterSpacing: 2, fontFamily: "monospace",
            transition: "color 0.4s",
          }}>
            {cur.podAlive ? "POD" : "POD ✕ terminated"}
          </div>

          {/* Init container (top, appears late) */}
          {cur.showInit && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "fadeIn 0.4s ease" }}>
              <ContainerBox
                label="init-container"
                paths={[{ path: "/var/data", highlight: cur.highlightData }]}
                highlight={cur.highlightData}
                isInit
              />
              <VArrow active={cur.highlightData} color="#a78bfa" label="пишет конфиг" />
            </div>
          )}

          {/* Containers row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

            {/* Sidecar */}
            {cur.showSidecar && (
              <>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, animation: "fadeIn 0.4s ease" }}>
                  <ContainerBox
                    label="log-shipper"
                    paths={[{ path: "/var/logs", highlight: cur.highlightLogs }]}
                    highlight={cur.highlightLogs}
                    isSidecar
                  />
                  <VArrow active={cur.highlightLogs} color="#34d399" reverse label="читает логи" />
                </div>
                <HArrow active={cur.highlightLogs} color="#34d399" dim={!cur.highlightLogs} />
              </>
            )}

            {/* Main container */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <ContainerBox
                label="app-container"
                paths={mainPaths}
                highlight={cur.highlightMain}
                dead={!cur.podAlive}
              />

              {/* Arrows down to volumes (only when volumes shown) */}
              {cur.showVolumes && (
                <div style={{ display: "flex", gap: 24, marginTop: 2 }}>
                  <VArrow active={cur.highlightLogs} color="#34d399" dim={!cur.showVolumes} />
                  <VArrow active={cur.highlightData} color="#a78bfa" dim={!cur.showVolumes} />
                </div>
              )}

              {/* No volume — arrow into void */}
              {!cur.showVolumes && !cur.podAlive && (
                <div style={{ fontSize: 9, color: "#7f1d1d", fontFamily: "monospace", animation: "fadeIn 0.4s ease" }}>
                  данные исчезли ✕
                </div>
              )}

              {!cur.showVolumes && cur.podAlive && (
                <div style={{ display: "flex", gap: 24 }}>
                  <VArrow active={false} color="#fbbf24" dim />
                  <VArrow active={false} color="#fbbf24" dim />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Volumes row (outside pod) */}
        {cur.showVolumes && (
          <div style={{ display: "flex", gap: 36, animation: "fadeIn 0.5s ease" }}>
            <VolumeBox
              name="logs"
              highlight={logsVolumeHighlight}
              dim={!cur.showVolumes}
              survived={!cur.podAlive && cur.id === "survive"}
            />
            <VolumeBox
              name="data"
              highlight={dataVolumeHighlight}
              dim={!cur.showVolumes}
            />
          </div>
        )}

        {/* Data lost indicator (no volumes, pod dead) */}
        {cur.dataLost && (
          <div style={{
            background: "#1a0808", border: "1px solid #7f1d1d",
            borderRadius: 8, padding: "8px 20px",
            fontSize: 10, color: "#f87171", fontFamily: "monospace",
            animation: "fadeIn 0.4s ease",
          }}>
            ✕ файловая система контейнера уничтожена вместе с подом
          </div>
        )}
      </div>

      {/* Annotation */}
      <div style={{
        background: "#0d1117",
        border: `1px solid ${cur.annotationColor}`,
        borderRadius: 12, padding: "12px 20px",
        maxWidth: 640, fontSize: 11, color: "#cbd5e1",
        fontFamily: "monospace", lineHeight: 1.8,
        animation: "fadeIn 0.4s ease",
      }}>
        <span style={{ marginRight: 8 }}>ℹ</span>{cur.annotation}
        {cur.id === "survive" && (
          <div style={{ marginTop: 8, borderTop: "1px solid #1e293b", paddingTop: 8, color: "#38bdf8" }}>
            → Об этом: типы томов и Persistent Volumes — дальше
          </div>
        )}
      </div>

      {/* Step counter */}
      <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>
        {step + 1} / {STEPS.length}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <button
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            padding: "8px 20px", borderRadius: 8,
            border: "1px solid #334155",
            background: step === 0 ? "#0d1117" : "#1e293b",
            color: step === 0 ? "#475569" : "#e2e8f0",
            cursor: step === 0 ? "default" : "pointer", fontSize: 12,
          }}>← Назад</button>

        <div style={{ display: "flex", gap: 6 }}>
          {STEPS.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? "#0ea5e9" : "#1e293b",
              transition: "all 0.3s", cursor: "pointer",
            }} />
          ))}
        </div>

        <button
          onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
          disabled={step === STEPS.length - 1}
          style={{
            padding: "8px 20px", borderRadius: 8,
            border: "1px solid #334155",
            background: step === STEPS.length - 1 ? "#0d1117" : "#1e293b",
            color: step === STEPS.length - 1 ? "#475569" : "#e2e8f0",
            cursor: step === STEPS.length - 1 ? "default" : "pointer", fontSize: 12,
          }}>Вперёд →</button>
      </div>

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
