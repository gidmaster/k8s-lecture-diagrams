import { useState } from "react";

// ── Шаги ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "manifest",
    title: "Манифест: два типа volumes",
    subtitle: "Пользователь описывает под с emptyDir и hostPath. Пока это просто YAML — никаких директорий не существует.",
    activeFlow: null,
    highlightComponents: [],
    showFilesystem: false,
    annotation: "volumes и volumeMounts — это декларация намерений. Реальные директории создаёт kubelet позже, на конкретной ноде.",
    annotationColor: "#64748b",
  },
  {
    id: "kubectl",
    title: "kubectl apply → API Server",
    subtitle: "kubectl отправляет манифест в API Server. API Server валидирует спецификацию и сохраняет Pod spec в etcd.",
    activeFlow: "kubectl",
    highlightComponents: ["user", "kubectl", "apiserver"],
    showFilesystem: false,
    annotation: "На этом этапе Pod существует только как запись в etcd со статусом Pending. Никаких директорий на нодах ещё нет.",
    annotationColor: "#3b82f6",
  },
  {
    id: "scheduler",
    title: "Scheduler выбирает ноду",
    subtitle: "Scheduler видит Pod в статусе Pending. Для emptyDir с medium: Memory и sizeLimit: 1Gi — ищет ноду с достаточным объёмом RAM.",
    activeFlow: "scheduler",
    highlightComponents: ["apiserver", "scheduler"],
    showFilesystem: false,
    annotation: "Scheduler учитывает sizeLimit при выборе ноды: medium: Memory → свободная RAM, medium не задан → свободный ephemeral-storage на диске.",
    annotationColor: "#a78bfa",
  },
  {
    id: "kubelet",
    title: "kubelet получает задание",
    subtitle: "kubelet на выбранной ноде видит что ему назначен под. Начинает подготовку volumes — до запуска контейнеров.",
    activeFlow: "kubelet",
    highlightComponents: ["scheduler", "kubelet"],
    showFilesystem: false,
    annotation: "kubelet смотрит на spec.volumes и для каждого тома вызывает соответствующий volume plugin. Сначала volumes — потом контейнеры.",
    annotationColor: "#0ea5e9",
  },
  {
    id: "hostpath",
    title: "kubelet создаёт hostPath директорию",
    subtitle: "Тип DirectoryOrCreate: kubelet проверяет /var/log/app на ноде. Директории нет — создаёт с owner root:root и правами 0755.",
    activeFlow: "hostpath",
    highlightComponents: ["kubelet", "node"],
    showFilesystem: true,
    highlightFs: "hostpath",
    annotation: "hostPath монтирует реальный путь с ноды. Данные переживут удаление пода — но только на этой конкретной ноде.",
    annotationColor: "#f59e0b",
  },
  {
    id: "emptydir",
    title: "kubelet создаёт emptyDir директорию",
    subtitle: "kubelet создаёт директорию по пути /var/lib/kubelet/pods/{pod-id}/volumes/kubernetes.io~emptyDir/temp-storage",
    activeFlow: "emptydir",
    highlightComponents: ["kubelet", "node"],
    showFilesystem: true,
    highlightFs: "emptydir",
    annotation: "Путь содержит UUID пода — каждый под получает изолированную директорию. medium: Memory означает что реально используется tmpfs.",
    annotationColor: "#34d399",
  },
  {
    id: "mount",
    title: "kubelet запускает контейнер с mount",
    subtitle: "kubelet передаёт CRI (containerd) команду запустить контейнер, смонтировав подготовленные директории внутрь.",
    activeFlow: "mount",
    highlightComponents: ["kubelet", "container", "node"],
    showFilesystem: true,
    highlightFs: "both",
    annotation: "Контейнер видит /tmp/data и /var/log/host как обычные директории. Он не знает — tmpfs это или реальный диск. Абстракция работает.",
    annotationColor: "#22c55e",
  },
];

// ── Примитивы ────────────────────────────────────────────────────────────────

const ComponentBox = ({ label, sublabel, highlight, dim, icon }) => {
  let border = "#1e293b";
  let bg = "linear-gradient(135deg,#0d1117,#1a2332)";
  let glow = "none";
  let labelColor = "#475569";
  let subColor = "#334155";

  if (highlight) {
    border = "#3b82f6";
    bg = "linear-gradient(135deg,#0f2040,#1a3a6a)";
    glow = "0 0 20px #3b82f640";
    labelColor = "#93c5fd";
    subColor = "#60a5fa";
  }

  return (
    <div style={{
      border: `2px solid ${border}`,
      borderRadius: 12,
      background: bg,
      boxShadow: glow,
      padding: "10px 16px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      minWidth: 90, opacity: dim ? 0.2 : 1,
      transition: "all 0.4s ease",
    }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span style={{ fontSize: 10, color: labelColor, fontFamily: "monospace", fontWeight: 700, transition: "color 0.4s", textAlign: "center" }}>{label}</span>
      {sublabel && <span style={{ fontSize: 8, color: subColor, fontFamily: "monospace", textAlign: "center", transition: "color 0.4s" }}>{sublabel}</span>}
    </div>
  );
};

const HArrow = ({ active, color = "#3b82f6", width = 44, dim }) => (
  <div style={{ display: "flex", alignItems: "center", opacity: dim ? 0.15 : 1, transition: "opacity 0.4s" }}>
    <div style={{
      width, height: 2,
      background: active ? color : "#1e293b",
      position: "relative", overflow: "hidden", transition: "background 0.4s",
    }}>
      {active && <div style={{
        position: "absolute", top: -2, width: "35%", height: 6,
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        animation: "slideRight 0.8s linear infinite",
      }} />}
    </div>
    <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />
    <style>{`@keyframes slideRight { from{left:-35%} to{left:110%} }`}</style>
  </div>
);

const VArrow = ({ active, color = "#3b82f6", height = 24, dim }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: dim ? 0.15 : 1, transition: "opacity 0.4s" }}>
    <div style={{ width: 2, height, background: active ? color : "#1e293b", position: "relative", overflow: "hidden", transition: "background 0.4s" }}>
      {active && <div style={{
        position: "absolute", left: -2, width: 6, height: "40%",
        background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
        animation: "slideDown 0.8s linear infinite",
      }} />}
    </div>
    <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />
    <style>{`@keyframes slideDown { from{top:-40%} to{top:110%} }`}</style>
  </div>
);

// Терминальный блок с путями на файловой системе
const FilesystemBlock = ({ show, highlightFs }) => {
  if (!show) return null;

  const hostActive = highlightFs === "hostpath" || highlightFs === "both";
  const emptyActive = highlightFs === "emptydir" || highlightFs === "both";
  const mountActive = highlightFs === "both";

  return (
    <div style={{
      background: "#0d1117", border: "1px solid #1e293b",
      borderRadius: 12, padding: "14px 18px",
      fontFamily: "monospace", fontSize: 10, lineHeight: 1.9,
      minWidth: 520, animation: "fadeIn 0.4s ease",
    }}>
      <div style={{ fontSize: 9, color: "#38bdf8", letterSpacing: 2, marginBottom: 8 }}>NODE FILESYSTEM</div>

      {/* hostPath */}
      <div style={{
        background: hostActive ? "#1a1200" : "#080c14",
        border: `1px solid ${hostActive ? "#f59e0b" : "#1e293b"}`,
        borderRadius: 8, padding: "6px 12px", marginBottom: 6,
        transition: "all 0.4s",
      }}>
        <div style={{ color: "#475569", fontSize: 8, marginBottom: 2 }}>hostPath · DirectoryOrCreate</div>
        <div style={{ color: hostActive ? "#fcd34d" : "#334155", transition: "color 0.4s" }}>
          <span style={{ color: hostActive ? "#f59e0b" : "#334155" }}>$ </span>
          mkdir -p <span style={{ color: hostActive ? "#fde68a" : "#475569" }}>/var/log/app</span>
          <span style={{ color: hostActive ? "#f59e0b" : "#334155" }}> # owner: root:root, mode: 0755</span>
        </div>
        {mountActive && (
          <div style={{ color: "#6ee7b7", fontSize: 8, marginTop: 2, animation: "fadeIn 0.3s ease" }}>
            → смонтировано в контейнер как <span style={{ color: "#34d399" }}>/var/log/host</span>
          </div>
        )}
      </div>

      {/* emptyDir */}
      <div style={{
        background: emptyActive ? "#0a1f17" : "#080c14",
        border: `1px solid ${emptyActive ? "#34d399" : "#1e293b"}`,
        borderRadius: 8, padding: "6px 12px", marginBottom: 6,
        transition: "all 0.4s",
      }}>
        <div style={{ color: "#475569", fontSize: 8, marginBottom: 2 }}>emptyDir · medium: Memory (tmpfs)</div>
        <div style={{ color: emptyActive ? "#6ee7b7" : "#334155", transition: "color 0.4s", wordBreak: "break-all" }}>
          <span style={{ color: emptyActive ? "#34d399" : "#334155" }}>$ </span>
          mkdir -p <span style={{ color: emptyActive ? "#a7f3d0" : "#475569" }}>/var/lib/kubelet/pods/<span style={{ color: emptyActive ? "#fcd34d" : "#475569" }}>{"{pod-uuid}"}</span>/volumes/kubernetes.io~emptyDir/temp-storage</span>
        </div>
        {mountActive && (
          <div style={{ color: "#6ee7b7", fontSize: 8, marginTop: 2, animation: "fadeIn 0.3s ease" }}>
            → смонтировано в контейнер как <span style={{ color: "#34d399" }}>/tmp/data</span>
          </div>
        )}
      </div>

      {/* CRI mount command */}
      {mountActive && (
        <div style={{
          background: "#0d1f0d", border: "1px solid #22c55e",
          borderRadius: 8, padding: "6px 12px",
          animation: "fadeIn 0.4s ease",
        }}>
          <div style={{ color: "#475569", fontSize: 8, marginBottom: 2 }}>CRI (containerd) · запуск контейнера</div>
          <div style={{ color: "#86efac" }}>
            <div><span style={{ color: "#22c55e" }}>-v</span> /var/lib/kubelet/pods/<span style={{ color: "#fcd34d" }}>{"{pod-uuid}"}</span>/volumes/kubernetes.io~emptyDir/temp-storage<span style={{ color: "#22c55e" }}>:/tmp/data</span></div>
            <div><span style={{ color: "#22c55e" }}>-v</span> /var/log/app<span style={{ color: "#22c55e" }}>:/var/log/host</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Манифест
const ManifestBlock = ({ highlight }) => (
  <div style={{
    background: "#0d1117", border: `1px solid ${highlight ? "#3b82f6" : "#1e293b"}`,
    borderRadius: 12, padding: "12px 16px",
    fontFamily: "monospace", fontSize: 9, lineHeight: 1.8,
    minWidth: 260, boxShadow: highlight ? "0 0 16px #3b82f630" : "none",
    transition: "all 0.4s",
  }}>
    <div style={{ color: "#64748b", marginBottom: 4, fontSize: 8, letterSpacing: 1 }}>ephemeral-pod.yaml</div>
    <div><span style={{ color: "#7dd3fc" }}>volumes</span><span style={{ color: "#94a3b8" }}>:</span></div>
    <div style={{ paddingLeft: 12 }}>
      <div><span style={{ color: "#94a3b8" }}>- name: </span><span style={{ color: "#34d399" }}>temp-storage</span></div>
      <div style={{ paddingLeft: 12 }}>
        <div><span style={{ color: "#7dd3fc" }}>emptyDir</span><span style={{ color: "#94a3b8" }}>:</span></div>
        <div style={{ paddingLeft: 12 }}>
          <div><span style={{ color: "#94a3b8" }}>medium: </span><span style={{ color: "#fcd34d" }}>Memory</span></div>
          <div><span style={{ color: "#94a3b8" }}>sizeLimit: </span><span style={{ color: "#f87171" }}>1Gi</span></div>
        </div>
      </div>
      <div style={{ marginTop: 4 }}><span style={{ color: "#94a3b8" }}>- name: </span><span style={{ color: "#fcd34d" }}>host-logs</span></div>
      <div style={{ paddingLeft: 12 }}>
        <div><span style={{ color: "#7dd3fc" }}>hostPath</span><span style={{ color: "#94a3b8" }}>:</span></div>
        <div style={{ paddingLeft: 12 }}>
          <div><span style={{ color: "#94a3b8" }}>path: </span><span style={{ color: "#fcd34d" }}>/var/log/app</span></div>
          <div><span style={{ color: "#94a3b8" }}>type: </span><span style={{ color: "#fcd34d" }}>DirectoryOrCreate</span></div>
        </div>
      </div>
    </div>
  </div>
);

// ── Основной компонент ───────────────────────────────────────────────────────

export default function VolumeInternals() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const hl = cur.highlightComponents;
  const flow = cur.activeFlow;

  const isH = (id) => hl.includes(id);
  const isDim = (id) => hl.length > 0 && !hl.includes(id);

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 20,
    }}>

      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • ПОД КАПОТОМ • EPHEMERAL VOLUMES
        </div>
        <div style={{ fontSize: 20, color: "#f1f5f9", fontWeight: 700, minHeight: 30 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, minHeight: 18 }}>{cur.subtitle}</div>
      </div>

      {/* Main diagram */}
      <div style={{
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "24px 32px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>

        {/* Top row: User → kubectl → API Server */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <ComponentBox label="User" icon="👤" highlight={isH("user")} dim={isDim("user")} />
          <HArrow active={flow === "kubectl"} color="#3b82f6" dim={isDim("user") && isDim("kubectl")} />
          <ComponentBox label="kubectl" sublabel="apply -f" highlight={isH("kubectl")} dim={isDim("kubectl")} />
          <HArrow active={flow === "kubectl"} color="#3b82f6" dim={isDim("kubectl") && isDim("apiserver")} />
          <ComponentBox label="API Server" sublabel="validates + etcd" highlight={isH("apiserver")} dim={isDim("apiserver")} />
        </div>

        {/* Vertical arrow down from API Server to Scheduler */}
        <div style={{ display: "flex", width: "100%", justifyContent: "flex-end", paddingRight: 0 }}>
          <div style={{ marginRight: 4 }}>
            <VArrow active={flow === "scheduler"} color="#a78bfa" height={20} dim={isDim("scheduler")} />
          </div>
        </div>

        {/* Bottom row: Scheduler → kubelet → Node */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <ComponentBox
            label="Scheduler"
            sublabel="выбирает ноду"
            highlight={isH("scheduler")}
            dim={isDim("scheduler")}
          />
          <HArrow active={flow === "kubelet"} color="#0ea5e9" dim={isDim("scheduler") && isDim("kubelet")} />
          <ComponentBox
            label="kubelet"
            sublabel="создаёт volumes"
            highlight={isH("kubelet")}
            dim={isDim("kubelet")}
          />
          <HArrow active={flow === "hostpath" || flow === "emptydir" || flow === "mount"} color="#22c55e" dim={isDim("kubelet") && isDim("node")} />

          {/* Node box with container inside */}
          <div style={{
            border: `2px solid ${isH("node") ? "#22c55e" : "#1e293b"}`,
            borderRadius: 14, padding: "12px 16px",
            background: isH("node") ? "linear-gradient(135deg,#0a1f0a,#0d2a14)" : "linear-gradient(135deg,#0d1117,#0f1a24)",
            boxShadow: isH("node") ? "0 0 20px #22c55e30" : "none",
            transition: "all 0.4s",
            opacity: isDim("node") && isDim("container") ? 0.2 : 1,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 9, color: isH("node") ? "#34d399" : "#334155", letterSpacing: 2, transition: "color 0.4s" }}>WORKER NODE</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {/* emptyDir volume */}
              <div style={{
                background: (flow === "emptydir" || flow === "mount") ? "#0a1f17" : "#080c14",
                border: `1px solid ${(flow === "emptydir" || flow === "mount") ? "#34d399" : "#1e293b"}`,
                borderRadius: 8, padding: "4px 10px",
                fontSize: 8, color: (flow === "emptydir" || flow === "mount") ? "#6ee7b7" : "#334155",
                fontFamily: "monospace", transition: "all 0.4s", textAlign: "center",
              }}>
                <div>tmpfs</div>
                <div style={{ color: (flow === "emptydir" || flow === "mount") ? "#34d399" : "#334155" }}>emptyDir</div>
              </div>

              {/* hostPath volume */}
              <div style={{
                background: (flow === "hostpath" || flow === "mount") ? "#1a1200" : "#080c14",
                border: `1px solid ${(flow === "hostpath" || flow === "mount") ? "#f59e0b" : "#1e293b"}`,
                borderRadius: 8, padding: "4px 10px",
                fontSize: 8, color: (flow === "hostpath" || flow === "mount") ? "#fcd34d" : "#334155",
                fontFamily: "monospace", transition: "all 0.4s", textAlign: "center",
              }}>
                <div>/var/log</div>
                <div style={{ color: (flow === "hostpath" || flow === "mount") ? "#f59e0b" : "#334155" }}>/app</div>
              </div>

              {/* Container */}
              {flow === "mount" && (
                <div style={{
                  background: "linear-gradient(135deg,#1e3a5f,#1e4a7f)",
                  border: "2px solid #3b82f6",
                  borderRadius: 8, padding: "6px 12px",
                  fontSize: 8, color: "#93c5fd", fontFamily: "monospace",
                  textAlign: "center", animation: "fadeIn 0.4s ease",
                  boxShadow: "0 0 12px #3b82f640",
                }}>
                  <div style={{ fontSize: 9, fontWeight: 700, marginBottom: 2 }}>nginx</div>
                  <div style={{ color: "#34d399" }}>/tmp/data ✓</div>
                  <div style={{ color: "#fcd34d" }}>/var/log/host ✓</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manifest + Filesystem */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        <ManifestBlock highlight={flow === "kubectl"} />
        <FilesystemBlock show={cur.showFilesystem} highlightFs={cur.highlightFs} />
      </div>

      {/* Annotation */}
      <div style={{
        background: "#0d1117",
        border: `1px solid ${cur.annotationColor}`,
        borderRadius: 12, padding: "12px 20px",
        maxWidth: 680, fontSize: 11, color: "#cbd5e1",
        fontFamily: "monospace", lineHeight: 1.8,
        animation: "fadeIn 0.4s ease",
      }}>
        <span style={{ marginRight: 8 }}>ℹ</span>{cur.annotation}
      </div>

      {/* Step counter */}
      <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>
        {step + 1} / {STEPS.length}
      </div>

      {/* Navigation */}
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

      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight { from{left:-35%} to{left:110%} }
        @keyframes slideDown { from{top:-40%} to{top:110%} }
      `}</style>
    </div>
  );
}
