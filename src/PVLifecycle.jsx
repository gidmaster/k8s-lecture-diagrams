import { useState } from "react";

// ── Шаги ────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "init",
    title: "Статический провижининг: администратор создаёт PV",
    subtitle: "kubectl apply -f pv.yaml. PV появляется в кластере — физический диск описан, ресурс готов к использованию.",
    pvState: "Available",
    pvcState: null,
    podState: null,
    activeFlow: null,
    showStorageClass: false,
    showDynamic: false,
    annotation: "PV существует независимо от подов и PVC. Администратор описывает реальное хранилище: тип, размер, accessModes, reclaimPolicy.",
    annotationColor: "#38bdf8",
  },
  {
    id: "dynamic",
    title: "Или динамический провижининг через StorageClass",
    subtitle: "Администратор создаёт StorageClass. PV будет создан автоматически когда появится подходящий PVC.",
    pvState: null,
    pvcState: null,
    podState: null,
    activeFlow: "storageclass",
    showStorageClass: true,
    showDynamic: true,
    annotation: "StorageClass описывает как создавать PV: через какой CSI-драйвер, с какими параметрами. Сам PV пока не существует — он будет создан под конкретный запрос.",
    annotationColor: "#a78bfa",
  },
  {
    id: "pvc",
    title: "Разработчик создаёт PVC",
    subtitle: "kubectl apply -f pvc.yaml. PVC — это запрос на хранилище: storageClassName, accessModes, размер.",
    pvState: "Available",
    pvcState: "Pending",
    podState: null,
    activeFlow: "pvc_created",
    showStorageClass: false,
    showDynamic: false,
    annotation: "PVC создан, но ещё не привязан. controller-manager ищет подходящий PV: совпадение storageClassName + accessModes + capacity >= запрошенного.",
    annotationColor: "#fbbf24",
  },
  {
    id: "binding",
    title: "Binding: controller-manager связывает PV и PVC",
    subtitle: "Найден подходящий PV. Оба объекта связаны — PV теперь принадлежит этому PVC и больше никому.",
    pvState: "Bound",
    pvcState: "Bound",
    podState: null,
    activeFlow: "binding",
    showStorageClass: false,
    showDynamic: false,
    annotation: "После binding PV недоступен для других PVC — даже если у него осталось свободное место. Связь 1:1.",
    annotationColor: "#34d399",
  },
  {
    id: "using",
    title: "Using: Pod монтирует том через PVC",
    subtitle: "Pod ссылается на PVC в spec.volumes. kubelet монтирует том. Данные доступны контейнеру.",
    pvState: "Bound",
    pvcState: "Bound",
    podState: "Running",
    activeFlow: "using",
    showStorageClass: false,
    showDynamic: false,
    annotation: "Пока Pod работает — PV принадлежит ему. Даже если создать новый Pod с тем же PVC на другой ноде (при поддержке RWX) — том будет доступен.",
    annotationColor: "#3b82f6",
  },
  {
    id: "pvc_deleted",
    title: "Reclaiming: PVC удалена",
    subtitle: "kubectl delete pvc example-pv-claim. Что происходит с PV — зависит от reclaimPolicy.",
    pvState: "Released",
    pvcState: null,
    podState: null,
    activeFlow: "reclaim",
    showStorageClass: false,
    showDynamic: false,
    annotation: "PV переходит в Released. Данные на диске живы. Но PV заблокирован — новый PVC его не получит. Нужно вмешательство администратора (Retain) или автоудаление (Delete).",
    annotationColor: "#f87171",
  },
  {
    id: "retain",
    title: "reclaimPolicy: Retain — администратор решает судьбу данных",
    subtitle: "PV остаётся в Released. Данные живы. Администратор вручную удаляет PV и разбирается с хранилищем.",
    pvState: "Released",
    pvcState: null,
    podState: null,
    activeFlow: "retain",
    showStorageClass: false,
    showDynamic: false,
    annotation: "Retain — самый безопасный вариант для продакшн данных. Администратор сам решает: удалить данные, сделать бэкап, или пересоздать PV для нового использования.",
    annotationColor: "#f59e0b",
  },
  {
    id: "delete",
    title: "reclaimPolicy: Delete — PV и данные удаляются автоматически",
    subtitle: "PV и данные во внешнем хранилище удаляются вместе с PVC. Типично для динамического провижининга в облаке.",
    pvState: null,
    pvcState: null,
    podState: null,
    activeFlow: "delete",
    showStorageClass: false,
    showDynamic: false,
    annotation: "Delete удобен для облачных дисков создаваемых динамически — создался автоматически, удалился автоматически. Но плагин должен поддерживать эту политику.",
    annotationColor: "#ef4444",
  },
];

// ── Цвета состояний ──────────────────────────────────────────────────────────
const STATE_COLORS = {
  Available: { border: "#34d399", bg: "linear-gradient(135deg,#0a1f17,#0d2a1e)", text: "#6ee7b7", glow: "#34d39940" },
  Bound:     { border: "#3b82f6", bg: "linear-gradient(135deg,#0f2040,#1a3a6a)", text: "#93c5fd", glow: "#3b82f640" },
  Released:  { border: "#f59e0b", bg: "linear-gradient(135deg,#1a1200,#2a1e00)", text: "#fcd34d", glow: "#f59e0b40" },
  Failed:    { border: "#ef4444", bg: "linear-gradient(135deg,#1a0808,#2d1515)", text: "#fca5a5", glow: "#ef444440" },
  Pending:   { border: "#a78bfa", bg: "linear-gradient(135deg,#1a0f2e,#2d1f4e)", text: "#c4b5fd", glow: "#a78bfa40" },
  Running:   { border: "#22c55e", bg: "linear-gradient(135deg,#0a2a0a,#0d3a14)", text: "#86efac", glow: "#22c55e40" },
};

// ── Примитивы ────────────────────────────────────────────────────────────────

const ObjectBox = ({ kind, name, state, dim, deleted }) => {
  const colors = state ? STATE_COLORS[state] : null;

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
      opacity: dim ? 0.2 : deleted ? 0.15 : 1,
      transition: "all 0.45s ease",
    }}>
      <div style={{
        border: `2px solid ${deleted ? "#1e293b" : colors ? colors.border : "#1e293b"}`,
        borderRadius: 12,
        background: deleted ? "#080c14" : colors ? colors.bg : "linear-gradient(135deg,#0d1117,#1a2332)",
        boxShadow: colors && !deleted ? `0 0 20px ${colors.glow}` : "none",
        padding: "10px 18px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
        minWidth: 120, transition: "all 0.45s ease",
      }}>
        <span style={{ fontSize: 8, color: deleted ? "#334155" : colors ? colors.border : "#334155", fontFamily: "monospace", letterSpacing: 1, transition: "color 0.4s" }}>
          {kind}
        </span>
        <span style={{ fontSize: 11, color: deleted ? "#334155" : "#e2e8f0", fontWeight: 700, fontFamily: "monospace", transition: "color 0.4s" }}>
          {deleted ? "✕ deleted" : name}
        </span>
        {state && !deleted && (
          <div style={{
            background: colors?.bg, border: `1px solid ${colors?.border}`,
            borderRadius: 6, padding: "2px 10px",
            fontSize: 9, color: colors?.text, fontFamily: "monospace",
            transition: "all 0.4s",
          }}>
            {state}
          </div>
        )}
      </div>
    </div>
  );
};

const StorageClassBox = ({ highlight }) => (
  <div style={{
    border: `2px solid ${highlight ? "#a78bfa" : "#1e293b"}`,
    borderRadius: 12,
    background: highlight ? "linear-gradient(135deg,#1a0f2e,#2d1f4e)" : "linear-gradient(135deg,#0d1117,#1a2332)",
    boxShadow: highlight ? "0 0 20px #a78bfa40" : "none",
    padding: "10px 18px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    minWidth: 130, transition: "all 0.45s ease",
  }}>
    <span style={{ fontSize: 8, color: highlight ? "#a78bfa" : "#334155", fontFamily: "monospace", letterSpacing: 1 }}>StorageClass</span>
    <span style={{ fontSize: 11, color: "#e2e8f0", fontWeight: 700, fontFamily: "monospace" }}>local-storage</span>
    <span style={{ fontSize: 8, color: highlight ? "#c4b5fd" : "#475569", fontFamily: "monospace" }}>provisioner: CSI</span>
  </div>
);

const DiskBox = ({ highlight, deleted, label = "DISK" }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    opacity: deleted ? 0.15 : 1, transition: "all 0.45s ease",
  }}>
    <div style={{ position: "relative", width: 64 }}>
      <div style={{
        width: 64, height: 14, borderRadius: "50%",
        background: highlight ? "linear-gradient(135deg,#1e3a5f,#1a4a7f)" : "linear-gradient(135deg,#1e293b,#334155)",
        border: `2px solid ${highlight ? "#3b82f6" : "#475569"}`,
        boxShadow: highlight ? "0 0 12px #3b82f640" : "none",
        transition: "all 0.4s", position: "relative", zIndex: 2,
      }} />
      <div style={{
        width: 64, height: 36, marginTop: -2,
        background: highlight ? "linear-gradient(180deg,#1e3a5f,#0f2040)" : "linear-gradient(180deg,#1e293b,#0f172a)",
        borderLeft: `2px solid ${highlight ? "#3b82f6" : "#475569"}`,
        borderRight: `2px solid ${highlight ? "#3b82f6" : "#475569"}`,
        boxShadow: highlight ? "0 0 12px #3b82f630" : "none",
        transition: "all 0.4s",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 9, color: highlight ? "#93c5fd" : "#475569", fontFamily: "monospace", fontWeight: 700 }}>{label}</span>
      </div>
      <div style={{
        width: 64, height: 14, borderRadius: "50%", marginTop: -2,
        background: highlight ? "linear-gradient(135deg,#0f2040,#1e3a5f)" : "linear-gradient(135deg,#0f172a,#1e293b)",
        border: `2px solid ${highlight ? "#3b82f6" : "#475569"}`,
        transition: "all 0.4s",
      }} />
    </div>
    <span style={{ fontSize: 8, color: highlight ? "#3b82f6" : "#334155", fontFamily: "monospace", letterSpacing: 1 }}>STORAGE</span>
  </div>
);

const HArrow = ({ active, color = "#3b82f6", width = 40, reverse, label, dim }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, opacity: dim ? 0.15 : 1, transition: "opacity 0.4s" }}>
    {label && <span style={{ fontSize: 8, color: active ? color : "#334155", fontFamily: "monospace", whiteSpace: "nowrap", transition: "color 0.3s" }}>{label}</span>}
    <div style={{ display: "flex", alignItems: "center" }}>
      {reverse && <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderRight: `6px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
      <div style={{ width, height: 2, background: active ? color : "#1e293b", position: "relative", overflow: "hidden", transition: "background 0.4s" }}>
        {active && <div style={{ position: "absolute", top: -2, width: "35%", height: 6, background: `linear-gradient(${reverse ? "270deg" : "90deg"}, transparent, ${color}, transparent)`, animation: reverse ? "slideLeft 0.8s linear infinite" : "slideRight 0.8s linear infinite" }} />}
      </div>
      {!reverse && <div style={{ width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: `6px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />}
    </div>
    <style>{`
      @keyframes slideRight { from{left:-35%} to{left:110%} }
      @keyframes slideLeft  { from{left:110%} to{left:-35%} }
    `}</style>
  </div>
);

const VArrow = ({ active, color = "#3b82f6", height = 20, dim }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: dim ? 0.15 : 1, transition: "opacity 0.4s" }}>
    <div style={{ width: 2, height, background: active ? color : "#1e293b", position: "relative", overflow: "hidden", transition: "background 0.4s" }}>
      {active && <div style={{ position: "absolute", left: -2, width: 6, height: "40%", background: `linear-gradient(180deg, transparent, ${color}, transparent)`, animation: "slideDown 0.8s linear infinite" }} />}
    </div>
    <div style={{ width: 0, height: 0, borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: `6px solid ${active ? color : "#1e293b"}`, transition: "border-color 0.3s" }} />
    <style>{`@keyframes slideDown { from{top:-40%} to{top:110%} }`}</style>
  </div>
);

// ── Основной компонент ───────────────────────────────────────────────────────

export default function PVLifecycle() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];
  const flow = cur.activeFlow;

  const pvDeleted = cur.id === "delete";
  const pvBound = cur.pvState === "Bound";
  const pvcBound = cur.pvcState === "Bound";
  const podRunning = cur.podState === "Running";

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 20,
    }}>

      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • PERSISTENT VOLUMES • ЖИЗНЕННЫЙ ЦИКЛ
        </div>
        <div style={{ fontSize: 20, color: "#f1f5f9", fontWeight: 700, minHeight: 30 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6, minHeight: 18 }}>{cur.subtitle}</div>
      </div>

      {/* Diagram */}
      <div style={{
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "28px 36px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>

        {/* Dynamic provisioning row */}
        {cur.showDynamic && (
          <div style={{ display: "flex", alignItems: "center", gap: 0, animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 9, color: "#a78bfa", fontFamily: "monospace", marginRight: 8 }}>dynamic</div>
            <StorageClassBox highlight={flow === "storageclass"} />
            <HArrow active={flow === "storageclass"} color="#a78bfa" label="creates PV" />
            <ObjectBox kind="PersistentVolume" name="auto-pv" state="Available" />
          </div>
        )}

        {/* Main row: PV ↔ PVC ↔ Pod */}
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>

          {/* PV + Disk */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            {cur.pvState || pvDeleted ? (
              <ObjectBox
                kind="PersistentVolume"
                name="example-pv"
                state={cur.pvState}
                deleted={pvDeleted}
              />
            ) : (
              <div style={{ minWidth: 120, opacity: 0.1 }}>
                <ObjectBox kind="PersistentVolume" name="example-pv" state={null} />
              </div>
            )}
            <VArrow active={pvBound || cur.id === "init"} color="#3b82f6" height={16} dim={!cur.pvState && !pvDeleted} />
            <DiskBox highlight={pvBound || cur.id === "init"} deleted={pvDeleted} label="100Gi" />
          </div>

          {/* PV ↔ PVC binding arrow */}
          <div style={{ margin: "0 4px", marginBottom: 40 }}>
            <HArrow
              active={flow === "binding" || flow === "using"}
              color="#34d399"
              label={flow === "binding" ? "binding" : flow === "using" ? "bound" : ""}
              dim={!cur.pvcState}
              width={44}
            />
          </div>

          {/* PVC */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
            {cur.pvcState ? (
              <ObjectBox
                kind="PersistentVolumeClaim"
                name="example-pv-claim"
                state={cur.pvcState}
              />
            ) : (
              <div style={{ minWidth: 130, opacity: cur.id === "init" || cur.id === "dynamic" ? 0.12 : 0.12 }}>
                <ObjectBox kind="PersistentVolumeClaim" name="example-pv-claim" state={null} />
              </div>
            )}
          </div>

          {/* PVC ↔ Pod arrow */}
          <div style={{ margin: "0 4px" }}>
            <HArrow
              active={flow === "using"}
              color="#3b82f6"
              label="mounts"
              dim={!podRunning}
              width={44}
            />
          </div>

          {/* Pod */}
          <div style={{ opacity: podRunning ? 1 : 0.12, transition: "opacity 0.4s" }}>
            <ObjectBox
              kind="Pod"
              name="app-pod"
              state={cur.podState}
            />
          </div>
        </div>

        {/* Reclaim section */}
        {(flow === "reclaim" || flow === "retain" || flow === "delete") && (
          <div style={{ display: "flex", gap: 20, animation: "fadeIn 0.4s ease" }}>
            <div style={{
              background: flow === "retain" ? "#1a1200" : "#0d1117",
              border: `1px solid ${flow === "retain" ? "#f59e0b" : "#1e293b"}`,
              borderRadius: 10, padding: "10px 18px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              transition: "all 0.4s",
            }}>
              <span style={{ fontSize: 9, color: flow === "retain" ? "#f59e0b" : "#334155", fontFamily: "monospace", letterSpacing: 1 }}>reclaimPolicy</span>
              <span style={{ fontSize: 12, color: flow === "retain" ? "#fcd34d" : "#475569", fontWeight: 700, fontFamily: "monospace" }}>Retain</span>
              <span style={{ fontSize: 8, color: flow === "retain" ? "#fbbf24" : "#334155", fontFamily: "monospace", textAlign: "center" }}>PV → Released{"\n"}данные живы</span>
            </div>
            <div style={{
              background: flow === "delete" ? "#1a0808" : "#0d1117",
              border: `1px solid ${flow === "delete" ? "#ef4444" : "#1e293b"}`,
              borderRadius: 10, padding: "10px 18px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              transition: "all 0.4s",
            }}>
              <span style={{ fontSize: 9, color: flow === "delete" ? "#ef4444" : "#334155", fontFamily: "monospace", letterSpacing: 1 }}>reclaimPolicy</span>
              <span style={{ fontSize: 12, color: flow === "delete" ? "#fca5a5" : "#475569", fontWeight: 700, fontFamily: "monospace" }}>Delete</span>
              <span style={{ fontSize: 8, color: flow === "delete" ? "#f87171" : "#334155", fontFamily: "monospace", textAlign: "center" }}>PV удалён{"\n"}данные удалены</span>
            </div>
          </div>
        )}

        {/* Static vs Dynamic note on init */}
        {cur.id === "init" && (
          <div style={{ display: "flex", gap: 16, animation: "fadeIn 0.4s ease" }}>
            <div style={{ background: "#0a1f17", border: "1px solid #34d399", borderRadius: 8, padding: "6px 14px", fontSize: 9, color: "#6ee7b7", fontFamily: "monospace" }}>
              ✓ static: PV создан администратором
            </div>
            <div style={{ background: "#0d1117", border: "1px dashed #a78bfa", borderRadius: 8, padding: "6px 14px", fontSize: 9, color: "#7c3aed", fontFamily: "monospace" }}>
              → dynamic: следующий слайд
            </div>
          </div>
        )}
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

      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}
