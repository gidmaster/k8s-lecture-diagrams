import { useState } from "react";

const STEPS = [
  {
    id: "overview",
    title: "Компоненты Control Plane",
    subtitle: "Мозг кластера — набор процессов, управляющих всем что происходит в Kubernetes.",
    annotation: "Control Plane не запускает твои приложения — он управляет состоянием кластера. Воркер-ноды запускают реальные контейнеры. Здесь сосредоточена вся логика принятия решений.",
    annotationColor: "#38bdf8",
    focus: "all",
  },
  {
    id: "etcd",
    title: "etcd — единственный источник истины",
    subtitle: "Распределённое key-value хранилище. Здесь лежит всё состояние кластера — манифесты, секреты, конфиги.",
    annotation: "etcd — это не база данных приложений. Это база данных самого Kubernetes. Если etcd умер — кластер жив, но новых изменений принять не может. Никогда не пишите в etcd напрямую — только через API Server.",
    annotationColor: "#f59e0b",
    focus: "etcd",
  },
  {
    id: "apiserver",
    title: "API Server — единственная точка входа",
    subtitle: "Все взаимодействия с кластером идут через API Server. kubectl, операторы, контроллеры — все говорят только с ним.",
    annotation: "API Server — это REST API + валидация + аутентификация + авторизация + admission webhooks. Он не принимает решений — только принимает запросы, валидирует их и сохраняет в etcd. Ключевой механизм для операторов: Watch API — подписка на изменения ресурсов в реальном времени.",
    annotationColor: "#6366f1",
    focus: "apiserver",
  },
  {
    id: "scheduler",
    title: "Scheduler — где запустить Pod?",
    subtitle: "Следит за Pod-ами без ноды. Принимает решение на какую ноду поместить Pod, основываясь на ресурсах, affinity, taints.",
    annotation: "Scheduler не запускает Pod — он только записывает в поле spec.nodeName имя ноды. Kubelet на этой ноде увидит изменение и запустит контейнер. Scheduler подписан на API Server через Watch — получает события о новых Pod-ах мгновенно.",
    annotationColor: "#0ea5e9",
    focus: "scheduler",
  },
  {
    id: "controllermanager",
    title: "Controller Manager — движок желаемого состояния",
    subtitle: "Запускает десятки встроенных контроллеров: Deployment, ReplicaSet, Node, Job и другие. Каждый — отдельный reconciliation loop.",
    annotation: "Controller Manager — это процесс, внутри которого живут ~30 встроенных контроллеров. Deployment Controller смотрит на Deployment → создаёт ReplicaSet. ReplicaSet Controller смотрит на ReplicaSet → создаёт Pod-ы. Это тот же паттерн, который мы используем для написания своих операторов.",
    annotationColor: "#22c55e",
    focus: "controllermanager",
  },
  {
    id: "kubelet",
    title: "kubelet + kube-proxy — агенты на воркер-нодах",
    subtitle: "kubelet запускает контейнеры согласно spec. kube-proxy управляет сетевыми правилами для Service-ов.",
    annotation: "kubelet — это единственный компонент который реально запускает контейнеры. Он смотрит через Watch API на Pod-ы привязанные к его ноде и приводит их к нужному состоянию. kube-proxy следит за Service/Endpoints и обновляет iptables/ipvs правила.",
    annotationColor: "#a78bfa",
    focus: "worker",
  },
  {
    id: "flow",
    title: "Как это работает вместе: kubectl apply",
    subtitle: "Проследим путь команды kubectl apply -f deployment.yaml через все компоненты.",
    annotation: "1 → kubectl отправляет манифест в API Server. 2 → API Server валидирует и сохраняет в etcd. 3 → Controller Manager видит новый Deployment, создаёт ReplicaSet и Pod-ы. 4 → Scheduler видит Pod без ноды, выбирает ноду, записывает nodeName. 5 → kubelet на ноде видит Pod, запускает контейнер.",
    annotationColor: "#38bdf8",
    focus: "flow",
  },
];

const COLORS = {
  etcd:              { border: "#f59e0b", bg: "#1a1200", text: "#fcd34d", glow: "#f59e0b40" },
  apiserver:         { border: "#6366f1", bg: "#0f0f2a", text: "#a5b4fc", glow: "#6366f140" },
  scheduler:         { border: "#0ea5e9", bg: "#0a1628", text: "#7dd3fc", glow: "#0ea5e940" },
  controllermanager: { border: "#22c55e", bg: "#0a1f0a", text: "#86efac", glow: "#22c55e40" },
  kubelet:           { border: "#a78bfa", bg: "#12102a", text: "#c4b5fd", glow: "#a78bfa40" },
  kubeproxy:         { border: "#7c3aed", bg: "#0f0a20", text: "#a78bfa", glow: "#7c3aed40" },
};

function ComponentBox({ id, label, sublabel, focus, icon, wide }) {
  const c = COLORS[id] || COLORS.apiserver;
  const isActive = focus === "all" || focus === id ||
    (focus === "worker" && (id === "kubelet" || id === "kubeproxy")) ||
    (focus === "flow");

  const isHighlighted = focus === id ||
    (focus === "worker" && (id === "kubelet" || id === "kubeproxy"));

  return (
    <div style={{
      border: `2px solid ${isHighlighted ? c.border : isActive ? c.border + "80" : "#1e293b"}`,
      borderRadius: 12,
      background: isHighlighted
        ? `linear-gradient(135deg, ${c.bg}, #080c14)`
        : isActive ? "#0d1117" : "#080c14",
      boxShadow: isHighlighted ? `0 0 24px ${c.glow}` : "none",
      padding: "10px 16px",
      minWidth: wide ? 180 : 140,
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      opacity: focus === "all" || focus === "flow" || isHighlighted || isActive ? 1 : 0.2,
      transition: "all 0.45s ease",
      cursor: "default",
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 10, color: isActive ? c.text : "#334155", fontWeight: 700, fontFamily: "monospace", textAlign: "center" }}>{label}</span>
      {sublabel && <span style={{ fontSize: 8, color: "#475569", fontFamily: "monospace", textAlign: "center" }}>{sublabel}</span>}
    </div>
  );
}

function FlowArrow({ label, color, vertical }) {
  if (vertical) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div style={{ width: 2, height: 24, background: color }} />
      <div style={{ width: 0, height: 0, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: `7px solid ${color}` }} />
      {label && <span style={{ fontSize: 8, color, fontFamily: "monospace" }}>{label}</span>}
    </div>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {label && <span style={{ fontSize: 8, color, fontFamily: "monospace" }}>{label}</span>}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: 32, height: 2, background: color }} />
        <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: `7px solid ${color}` }} />
      </div>
    </div>
  );
}

function FlowStep({ num, text, color }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
      <div style={{
        minWidth: 20, height: 20, borderRadius: "50%",
        background: color + "30", border: `1px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, color, fontWeight: 700, fontFamily: "monospace",
      }}>{num}</div>
      <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

export default function ControlPlane() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 20,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • КОМПОНЕНТЫ КЛАСТЕРА
        </div>
        <div style={{ fontSize: 20, color: "#f1f5f9", fontWeight: 700, minHeight: 30 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, minHeight: 18, maxWidth: 560, textAlign: "center" }}>{cur.subtitle}</div>
      </div>

      {/* Diagram */}
      <div style={{
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "28px 36px",
        display: "flex", flexDirection: "column", gap: 16, alignItems: "center",
      }}>

        {/* Flow mode */}
        {cur.focus === "flow" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 500 }}>
            <FlowStep num={1} text="kubectl → API Server: POST /apis/apps/v1/deployments" color="#6366f1" />
            <FlowStep num={2} text="API Server: валидация → запись в etcd → ответ 201 Created" color="#f59e0b" />
            <FlowStep num={3} text="Deployment Controller: Watch → создаёт ReplicaSet → создаёт Pod-ы" color="#22c55e" />
            <FlowStep num={4} text="Scheduler: Watch → Pod без nodeName → выбирает ноду → patch nodeName" color="#0ea5e9" />
            <FlowStep num={5} text="kubelet: Watch → Pod с моей нодой → docker/containerd run → Running" color="#a78bfa" />
          </div>
        ) : (
          <>
            {/* Control Plane label */}
            <div style={{
              border: "1px dashed #334155", borderRadius: 14,
              padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, textAlign: "center" }}>CONTROL PLANE</div>

              {/* Top row: etcd + apiserver */}
              <div style={{ display: "flex", gap: 16, alignItems: "center", justifyContent: "center" }}>
                <ComponentBox id="etcd" label="etcd" sublabel="key-value store" focus={cur.focus} icon="🗄️" />
                <FlowArrow label="read/write" color={cur.focus === "etcd" || cur.focus === "apiserver" || cur.focus === "flow" || cur.focus === "all" ? "#f59e0b" : "#1e293b"} />
                <ComponentBox id="apiserver" label="API Server" sublabel="REST · Watch · Admission" focus={cur.focus} icon="🌐" wide />
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "#1e293b" }} />

              {/* Bottom row: scheduler + cm */}
              <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <FlowArrow label="Watch" color={cur.focus === "scheduler" || cur.focus === "all" || cur.focus === "flow" ? "#0ea5e9" : "#1e293b"} vertical />
                  <ComponentBox id="scheduler" label="Scheduler" sublabel="Pod → Node" focus={cur.focus} icon="📐" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <FlowArrow label="Watch" color={cur.focus === "controllermanager" || cur.focus === "all" || cur.focus === "flow" ? "#22c55e" : "#1e293b"} vertical />
                  <ComponentBox id="controllermanager" label="Controller Manager" sublabel="~30 controllers" focus={cur.focus} icon="⚙️" wide />
                </div>
              </div>
            </div>

            {/* Worker Node */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <FlowArrow
                label="Watch + patch nodeName"
                color={cur.focus === "worker" || cur.focus === "all" || cur.focus === "flow" ? "#a78bfa" : "#1e293b"}
                vertical
              />
              <div style={{
                border: "1px dashed #334155", borderRadius: 14,
                padding: "12px 20px", display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2, textAlign: "center" }}>WORKER NODE</div>
                <div style={{ display: "flex", gap: 16 }}>
                  <ComponentBox id="kubelet" label="kubelet" sublabel="запускает контейнеры" focus={cur.focus} icon="🐋" />
                  <ComponentBox id="kubeproxy" label="kube-proxy" sublabel="iptables / ipvs" focus={cur.focus} icon="🔀" />
                </div>
              </div>
            </div>
          </>
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

      {/* Step counter */}
      <div style={{ fontSize: 10, color: "#334155" }}>{step + 1} / {STEPS.length}</div>

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
