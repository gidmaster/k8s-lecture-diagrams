import { useState } from "react";

// ── Режимы ───────────────────────────────────────────────────────────────────
const MODES = ["static", "dynamic"];

// ── Шаги: статический провижининг ────────────────────────────────────────────
const STATIC_STEPS = [
  {
    id: "s0",
    title: "Статический провижининг",
    subtitle: "Администратор вручную создаёт всё необходимое. Разработчик только запрашивает.",
    activeFlow: null,
    highlightAdmin: false,
    highlightDev: false,
    highlightStorage: false,
    highlightPV: false,
    highlightPVC: false,
    highlightPod: false,
    annotation: "Статический провижининг — классический подход. Администратор заранее знает какое хранилище есть и создаёт PV руками. Подходит для предсказуемых нагрузок.",
    annotationColor: "#38bdf8",
  },
  {
    id: "s1",
    title: "Шаг 1: Администратор настраивает внешнее хранилище",
    subtitle: "NFS-сервер, облачный диск, физический диск на ноде — всё это вне Kubernetes.",
    activeFlow: "admin_storage",
    highlightAdmin: true,
    highlightStorage: true,
    annotation: "Это происходит вне кластера. Kubernetes пока ничего не знает о хранилище — это просто диск где-то в сети или на ноде.",
    annotationColor: "#f59e0b",
  },
  {
    id: "s2",
    title: "Шаг 2: Администратор создаёт PV",
    subtitle: "kubectl apply -f pv.yaml. PV описывает способ доступа к хранилищу: тип, размер, accessModes, reclaimPolicy.",
    activeFlow: "admin_pv",
    highlightAdmin: true,
    highlightPV: true,
    highlightStorage: true,
    annotation: "PV появляется в кластере со статусом Available. Он описывает реальное хранилище — но сам хранилищем не является. Это объект-ссылка.",
    annotationColor: "#34d399",
  },
  {
    id: "s3",
    title: "Шаг 3: Разработчик создаёт PVC",
    subtitle: "Разработчик описывает что ему нужно: storageClassName, accessModes, размер. Не зная деталей реального хранилища.",
    activeFlow: "dev_pvc",
    highlightDev: true,
    highlightPVC: true,
    highlightPV: true,
    annotation: "PVC — это запрос, не привязанный к конкретному диску. Разработчик говорит 'мне нужно 3Gi с RWO' — и не знает это NFS или облачный диск.",
    annotationColor: "#a78bfa",
  },
  {
    id: "s4",
    title: "Шаг 4: controller-manager биндит PV к PVC",
    subtitle: "Находит PV с совпадающим storageClassName + accessModes + capacity ≥ запрошенного. Связывает их.",
    activeFlow: "binding",
    highlightPV: true,
    highlightPVC: true,
    annotation: "После binding оба объекта в статусе Bound. PV принадлежит ровно одному PVC. Другие PVC его не получат даже если у него осталось место.",
    annotationColor: "#34d399",
  },
  {
    id: "s5",
    title: "Шаг 5: Pod использует PVC как volume",
    subtitle: "В spec.volumes разработчик указывает имя PVC. kubelet монтирует том. Приложение читает и пишет данные.",
    activeFlow: "pod_uses",
    highlightDev: true,
    highlightPVC: true,
    highlightPV: true,
    highlightStorage: true,
    highlightPod: true,
    annotation: "Pod не знает что такое PV и где физически данные. Он просто видит директорию. Абстракция работает — разработчик изолирован от деталей хранилища.",
    annotationColor: "#3b82f6",
  },
];

// ── Шаги: динамический провижининг ──────────────────────────────────────────
const DYNAMIC_STEPS = [
  {
    id: "d0",
    title: "Динамический провижининг",
    subtitle: "PV создаётся автоматически по запросу. Администратор настраивает правила один раз через StorageClass.",
    activeFlow: null,
    highlightAdmin: false,
    highlightDev: false,
    highlightSC: false,
    highlightProvisioner: false,
    highlightPV: false,
    highlightPVC: false,
    highlightPod: false,
    highlightStorage: false,
    annotation: "Динамический провижининг — стандарт для облачных кластеров. Администратор настраивает StorageClass один раз, разработчики получают хранилище автоматически.",
    annotationColor: "#38bdf8",
  },
  {
    id: "d1",
    title: "Шаг 1: Администратор деплоит CSI-драйвер и создаёт StorageClass",
    subtitle: "StorageClass описывает provisioner (CSI-драйвер), reclaimPolicy, volumeBindingMode и параметры хранилища.",
    activeFlow: "admin_sc",
    highlightAdmin: true,
    highlightSC: true,
    highlightProvisioner: true,
    annotation: "StorageClass — это шаблон для создания PV. Один StorageClass может обслуживать тысячи PVC. Аннотация is-default-class: true делает его классом по умолчанию.",
    annotationColor: "#a78bfa",
  },
  {
    id: "d2",
    title: "Шаг 2: Разработчик создаёт PVC со ссылкой на StorageClass",
    subtitle: "storageClassName: local-path. Если не указать — используется StorageClass по умолчанию.",
    activeFlow: "dev_pvc_dynamic",
    highlightDev: true,
    highlightPVC: true,
    highlightSC: true,
    annotation: "WaitForFirstConsumer: PVC создан, но PV ещё нет. Kubernetes ждёт пока появится Pod который использует этот PVC — чтобы создать PV на правильной ноде.",
    annotationColor: "#fbbf24",
  },
  {
    id: "d3",
    title: "Шаг 3: controller-manager видит PVC и вызывает provisioner",
    subtitle: "controller-manager находит нужный StorageClass и даёт команду CSI-драйверу создать PV под этот запрос.",
    activeFlow: "cm_calls_provisioner",
    highlightSC: true,
    highlightProvisioner: true,
    highlightPVC: true,
    annotation: "Это ключевое отличие от статики: PV не существовал до этого момента. controller-manager создаёт его по требованию через provisioner.",
    annotationColor: "#0ea5e9",
  },
  {
    id: "d4",
    title: "Шаг 4: Provisioner резервирует место и создаёт PV",
    subtitle: "CSI-драйвер обращается к внешнему хранилищу, резервирует место, создаёт объект PV в кластере.",
    activeFlow: "provisioner_creates",
    highlightProvisioner: true,
    highlightPV: true,
    highlightStorage: true,
    annotation: "Provisioner — это CSI-драйвер задеплоенный в кластер. Он знает как общаться с конкретным хранилищем: AWS EBS, GCE PD, NFS, Ceph и т.д.",
    annotationColor: "#34d399",
  },
  {
    id: "d5",
    title: "Шаг 5: controller-manager биндит PV к PVC",
    subtitle: "Только что созданный PV автоматически связывается с ожидающим PVC. Оба переходят в статус Bound.",
    activeFlow: "dynamic_binding",
    highlightPV: true,
    highlightPVC: true,
    annotation: "В отличие от статики — binding здесь происходит автоматически сразу после создания PV. Никакого ручного поиска подходящего PV.",
    annotationColor: "#34d399",
  },
  {
    id: "d6",
    title: "Шаг 6: Pod использует PVC как volume",
    subtitle: "Всё то же самое что при статическом провижининге. Pod не знает как был создан PV.",
    activeFlow: "pod_uses_dynamic",
    highlightDev: true,
    highlightPVC: true,
    highlightPV: true,
    highlightStorage: true,
    highlightPod: true,
    annotation: "С точки зрения Pod — разницы нет. Статический или динамический провижининг — Pod просто монтирует PVC. Абстракция полная.",
    annotationColor: "#3b82f6",
  },
];

// ── Примитивы ────────────────────────────────────────────────────────────────

const Box = ({ label, sublabel, highlight, dim, color = "#3b82f6", icon }) => {
  const borderColor = highlight ? color : "#1e293b";
  const bgColor = highlight
    ? `linear-gradient(135deg, ${color}18, ${color}28)`
    : "linear-gradient(135deg,#0d1117,#1a2332)";
  const glowColor = highlight ? `${color}40` : "none";

  return (
    <div style={{
      border: `2px solid ${borderColor}`,
      borderRadius: 12,
      background: bgColor,
      boxShadow: highlight ? `0 0 18px ${glowColor}` : "none",
      padding: "10px 16px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      minWidth: 100, opacity: dim ? 0.15 : 1,
      transition: "all 0.45s ease",
    }}>
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span style={{ fontSize: 9, color: highlight ? color : "#334155", fontFamily: "monospace", letterSpacing: 1, transition: "color 0.4s" }}>
        {label}
      </span>
      {sublabel && (
        <span style={{ fontSize: 10, color: highlight ? "#e2e8f0" : "#475569", fontWeight: 700, fontFamily: "monospace", textAlign: "center", transition: "color 0.4s" }}>
          {sublabel}
        </span>
      )}
    </div>
  );
};

const PersonBox = ({ label, highlight, color = "#38bdf8", role }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    opacity: highlight ? 1 : 0.3, transition: "opacity 0.45s ease",
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: "50%",
      background: highlight ? `linear-gradient(135deg, ${color}30, ${color}50)` : "linear-gradient(135deg,#1e293b,#334155)",
      border: `2px solid ${highlight ? color : "#1e293b"}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      boxShadow: highlight ? `0 0 16px ${color}40` : "none",
      transition: "all 0.4s", fontSize: 20,
    }}>
      {role === "admin" ? "👤" : "💻"}
    </div>
    <span style={{ fontSize: 8, color: highlight ? color : "#334155", fontFamily: "monospace", letterSpacing: 1, transition: "color 0.4s" }}>{label}</span>
  </div>
);

const StorageDisk = ({ highlight, dim }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    opacity: dim ? 0.15 : 1, transition: "all 0.45s ease",
  }}>
    <div style={{ position: "relative", width: 60 }}>
      <div style={{
        width: 60, height: 13, borderRadius: "50%",
        background: highlight ? "linear-gradient(135deg,#1e3a5f,#1a4a7f)" : "linear-gradient(135deg,#1e293b,#334155)",
        border: `2px solid ${highlight ? "#3b82f6" : "#475569"}`,
        boxShadow: highlight ? "0 0 12px #3b82f640" : "none",
        transition: "all 0.4s", position: "relative", zIndex: 2,
      }} />
      <div style={{
        width: 60, height: 34, marginTop: -2,
        background: highlight ? "linear-gradient(180deg,#1e3a5f,#0f2040)" : "linear-gradient(180deg,#1e293b,#0f172a)",
        borderLeft: `2px solid ${highlight ? "#3b82f6" : "#475569"}`,
        borderRight: `2px solid ${highlight ? "#3b82f6" : "#475569"}`,
        transition: "all 0.4s",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 8, color: highlight ? "#93c5fd" : "#475569", fontFamily: "monospace", fontWeight: 700 }}>NFS</span>
      </div>
      <div style={{
        width: 60, height: 13, borderRadius: "50%", marginTop: -2,
        background: highlight ? "linear-gradient(135deg,#0f2040,#1e3a5f)" : "linear-gradient(135deg,#0f172a,#1e293b)",
        border: `2px solid ${highlight ? "#3b82f6" : "#475569"}`,
        transition: "all 0.4s",
      }} />
    </div>
    <span style={{ fontSize: 7, color: highlight ? "#3b82f6" : "#334155", fontFamily: "monospace", letterSpacing: 1 }}>STORAGE</span>
  </div>
);

const Arrow = ({ active, color = "#3b82f6", width = 36, reverse, label, vertical, height = 24, dim, dashed }) => {
  if (vertical) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, opacity: dim ? 0.12 : 1, transition: "opacity 0.4s" }}>
      {label && <span style={{ fontSize: 7, color: active ? color : "#334155", fontFamily: "monospace", transition: "color 0.3s" }}>{label}</span>}
      <div style={{ width: 2, height, background: active ? color : "#1e293b", position: "relative", overflow: "hidden", transition: "background 0.4s" }}>
        {active && <div style={{ position: "absolute", left: -2, width: 6, height: "40%", background: `linear-gradient(180deg, transparent, ${color}, transparent)`, animation: "slideDown 0.8s linear infinite" }} />}
      </div>
      <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `6px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: dim ? 0.12 : 1, transition: "opacity 0.4s" }}>
      {label && <span style={{ fontSize: 7, color: active ? color : "#334155", fontFamily: "monospace", whiteSpace: "nowrap", transition: "color 0.3s" }}>{label}</span>}
      <div style={{ display: "flex", alignItems: "center" }}>
        {reverse && <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderRight: `6px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
        <div style={{
          width, height: 2,
          background: dashed
            ? active ? `repeating-linear-gradient(90deg,${color} 0,${color} 5px,transparent 5px,transparent 10px)` : `repeating-linear-gradient(90deg,#1e293b 0,#1e293b 5px,transparent 5px,transparent 10px)`
            : active ? color : "#1e293b",
          position: "relative", overflow: dashed ? "visible" : "hidden", transition: "background 0.4s",
        }}>
          {active && !dashed && <div style={{ position: "absolute", top: -2, width: "35%", height: 6, background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent, ${color}, transparent)`, animation: reverse ? "slideLeft 0.8s linear infinite" : "slideRight 0.8s linear infinite" }} />}
        </div>
        {!reverse && <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `6px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
      </div>
      <style>{`
        @keyframes slideRight { from{left:-35%} to{left:110%} }
        @keyframes slideLeft  { from{left:110%} to{left:-35%} }
        @keyframes slideDown  { from{top:-40%}  to{top:110%}  }
        @keyframes fadeIn     { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
};

// ── Статическая диаграмма ────────────────────────────────────────────────────
function StaticDiagram({ cur }) {
  const f = cur.activeFlow;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

      {/* Row 1: Admin → Storage + PV */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PersonBox label="Администратор" highlight={cur.highlightAdmin} color="#f59e0b" role="admin" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Arrow active={f === "admin_storage"} color="#f59e0b" label="1. создаёт хранилище" width={120} dim={!cur.highlightAdmin} />
            <StorageDisk highlight={cur.highlightStorage} dim={!cur.highlightStorage && f !== null} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Arrow active={f === "admin_pv"} color="#34d399" label="2. создаёт PV" width={120} dim={!cur.highlightAdmin} />
            <Box label="PersistentVolume" sublabel="Available" highlight={cur.highlightPV} color="#34d399" dim={!cur.highlightPV && f !== null && !["s0"].includes(cur.id)} />
          </div>
        </div>
      </div>

      {/* Binding arrow vertical */}
      <div style={{ display: "flex", justifyContent: "flex-end", width: "100%", paddingRight: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Arrow active={f === "binding"} color="#34d399" label="4. binding" vertical height={22} dim={!cur.highlightPVC && !cur.highlightPV} />
        </div>
      </div>

      {/* Row 2: Dev → PVC → Pod */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PersonBox label="Разработчик" highlight={cur.highlightDev} color="#a78bfa" role="dev" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Arrow active={f === "dev_pvc"} color="#a78bfa" label="3. создаёт PVC" width={120} dim={!cur.highlightDev} />
            <Box label="PersistentVolumeClaim" sublabel={cur.highlightPVC ? (f === "binding" || f === "pod_uses" ? "Bound" : "Pending") : "—"} highlight={cur.highlightPVC} color="#a78bfa" dim={!cur.highlightPVC && f !== null && !["s0"].includes(cur.id)} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Arrow active={f === "pod_uses"} color="#3b82f6" label="5. Pod → PVC" width={120} dim={!cur.highlightDev} />
            <Box label="Pod" sublabel={cur.highlightPod ? "Running" : "—"} highlight={cur.highlightPod} color="#3b82f6" icon="📦" dim={!cur.highlightPod && f !== null && !["s0"].includes(cur.id)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Динамическая диаграмма ───────────────────────────────────────────────────
function DynamicDiagram({ cur }) {
  const f = cur.activeFlow;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

      {/* Row 1: Admin → SC + Provisioner */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PersonBox label="Администратор" highlight={cur.highlightAdmin} color="#f59e0b" role="admin" />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Arrow active={f === "admin_sc"} color="#a78bfa" label="1. создаёт" width={80} dim={!cur.highlightAdmin} />
          <Box label="StorageClass" sublabel="local-path" highlight={cur.highlightSC} color="#a78bfa" dim={!cur.highlightSC && f !== null && !["d0"].includes(cur.id)} />
          <Arrow active={f === "admin_sc"} color="#a78bfa" label="деплоит" width={60} dim={!cur.highlightAdmin} />
          <Box label="CSI Provisioner" sublabel="rancher.io/local-path" highlight={cur.highlightProvisioner} color="#0ea5e9" dim={!cur.highlightProvisioner && f !== null && !["d0"].includes(cur.id)} />
        </div>
      </div>

      {/* SC → Provisioner call */}
      <div style={{ display: "flex", alignSelf: "flex-end", paddingRight: 24, gap: 60 }}>
        <Arrow active={f === "cm_calls_provisioner" || f === "provisioner_creates"} color="#0ea5e9" label="3-4. вызывает provisioner" width={80} dim={!cur.highlightSC && !cur.highlightProvisioner} />
      </div>

      {/* Row 2: Provisioner → PV → Storage */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-end" }}>
        <Arrow active={f === "provisioner_creates"} color="#34d399" label="4. создаёт PV" width={60} dim={!cur.highlightProvisioner} />
        <Box label="PersistentVolume" sublabel={cur.highlightPV ? (f === "dynamic_binding" || f === "pod_uses_dynamic" ? "Bound" : "Available") : "—"} highlight={cur.highlightPV} color="#34d399" dim={!cur.highlightPV && f !== null && !["d0"].includes(cur.id)} />
        <Arrow active={f === "provisioner_creates" || f === "pod_uses_dynamic"} color="#3b82f6" label="резервирует" width={50} dim={!cur.highlightStorage} />
        <StorageDisk highlight={cur.highlightStorage} dim={!cur.highlightStorage && f !== null && !["d0"].includes(cur.id)} />
      </div>

      {/* Binding arrow */}
      <div style={{ display: "flex", alignSelf: "flex-end", paddingRight: 90 }}>
        <Arrow active={f === "dynamic_binding"} color="#34d399" label="5. auto-binding" vertical height={20} dim={!cur.highlightPV} />
      </div>

      {/* Row 3: Dev → PVC → Pod */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <PersonBox label="Разработчик" highlight={cur.highlightDev} color="#a78bfa" role="dev" />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Arrow active={f === "dev_pvc_dynamic"} color="#a78bfa" label="2. создаёт PVC" width={80} dim={!cur.highlightDev} />
          <Box label="PersistentVolumeClaim" sublabel={cur.highlightPVC ? (f === "dynamic_binding" || f === "pod_uses_dynamic" ? "Bound" : "Pending") : "—"} highlight={cur.highlightPVC} color="#a78bfa" dim={!cur.highlightPVC && f !== null && !["d0"].includes(cur.id)} />
          <Arrow active={f === "pod_uses_dynamic"} color="#3b82f6" label="6. Pod → PVC" width={60} dim={!cur.highlightPod} />
          <Box label="Pod" sublabel={cur.highlightPod ? "Running" : "—"} highlight={cur.highlightPod} color="#3b82f6" icon="📦" dim={!cur.highlightPod && f !== null && !["d0"].includes(cur.id)} />
        </div>
      </div>
    </div>
  );
}

// ── Основной компонент ───────────────────────────────────────────────────────
export default function PVProvisioning() {
  const [mode, setMode] = useState("static");
  const [step, setStep] = useState(0);

  const steps = mode === "static" ? STATIC_STEPS : DYNAMIC_STEPS;
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
          KUBERNETES • PERSISTENT VOLUMES • ПРОВИЖИНИНГ
        </div>
        <div style={{ fontSize: 20, color: "#f1f5f9", fontWeight: 700, minHeight: 30 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, minHeight: 18 }}>{cur.subtitle}</div>
      </div>

      {/* Mode switcher */}
      <div style={{ display: "flex", gap: 0, background: "#0d1117", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden" }}>
        {[["static", "Статический"], ["dynamic", "Динамический"]].map(([m, label]) => (
          <button key={m} onClick={() => switchMode(m)} style={{
            padding: "8px 24px", border: "none",
            background: mode === m ? (m === "static" ? "#0f2a1a" : "#1a0f2e") : "transparent",
            color: mode === m ? (m === "static" ? "#34d399" : "#a78bfa") : "#475569",
            borderRight: m === "static" ? "1px solid #1e293b" : "none",
            cursor: "pointer", fontSize: 11, fontFamily: "monospace",
            fontWeight: mode === m ? 700 : 400, transition: "all 0.2s",
          }}>{label}</button>
        ))}
      </div>

      {/* Diagram */}
      <div style={{
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "24px 32px",
        minWidth: 560,
      }}>
        {mode === "static"
          ? <StaticDiagram cur={cur} />
          : <DynamicDiagram cur={cur} />
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
