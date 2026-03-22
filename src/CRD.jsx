import { useState } from "react";

const STEPS = [
  {
    id: "builtin",
    title: "Встроенные ресурсы Kubernetes",
    subtitle: "Pod, Deployment, Service, ConfigMap — это встроенные типы ресурсов. Они описаны внутри самого Kubernetes.",
    annotation: "Каждый ресурс в Kubernetes имеет свой тип (Kind) и API группу. kubectl get pods — это запрос к API /api/v1/pods. kubectl get deployments — к /apis/apps/v1/deployments. API Server знает обо всех этих типах заранее.",
    annotationColor: "#38bdf8",
    phase: "builtin",
  },
  {
    id: "crd_concept",
    title: "CRD — научить Kubernetes новому типу ресурса",
    subtitle: "CustomResourceDefinition позволяет добавить собственный тип ресурса в API Server. Kubernetes будет хранить, валидировать и отдавать его как нативный ресурс.",
    annotation: "CRD — это не код и не контейнер. Это просто YAML-манифест, который говорит API Server: 'теперь существует новый тип ресурса DatabaseCluster в группе db.example.com'. После этого kubectl get databaseclusters будет работать.",
    annotationColor: "#6366f1",
    phase: "crd",
  },
  {
    id: "crd_yaml",
    title: "Структура CRD",
    subtitle: "CRD описывает group, version, kind, scope и schema (OpenAPI v3) для нового ресурса.",
    annotation: "schema.openAPIV3Schema — это валидация. Если создать CR без обязательного поля replicas — API Server вернёт ошибку. Это происходит на уровне платформы, без единой строки кода оператора.",
    annotationColor: "#f59e0b",
    phase: "crd_yaml",
  },
  {
    id: "cr",
    title: "CR — экземпляр вашего нового типа",
    subtitle: "После регистрации CRD можно создавать Custom Resources — конкретные объекты вашего типа, точно так же как Pod или Deployment.",
    annotation: "CR хранится в etcd как любой другой ресурс. Его можно получить через kubectl, смотреть через Watch API, добавлять labels и annotations. Kubernetes ничего не делает с CR сам — это задача оператора.",
    annotationColor: "#22c55e",
    phase: "cr",
  },
  {
    id: "operator_concept",
    title: "Оператор = CRD + Controller",
    subtitle: "Сам по себе CR — просто данные в etcd. Оператор — это контроллер, который следит за CR и реализует желаемое состояние.",
    annotation: "Оператор инкапсулирует операционные знания: как развернуть, масштабировать, обновить, сделать backup базы данных. Это то, что раньше делал опытный DBA — теперь это код, запущенный в кластере.",
    annotationColor: "#a78bfa",
    phase: "operator",
  },
  {
    id: "real_operators",
    title: "Реальные примеры операторов",
    subtitle: "Operators Hub содержит сотни операторов для популярных продуктов. Postgres, Redis, Kafka, Prometheus — у всех есть операторы.",
    annotation: "PostgreSQL Operator (CloudNativePG): создаёте DatabaseCluster с replicas: 3 → оператор поднимает primary + standbы, настраивает репликацию, управляет failover. Всё через один CR.",
    annotationColor: "#34d399",
    phase: "examples",
  },
];

function BuiltinResources() {
  const resources = [
    { kind: "Pod", group: "core/v1", color: "#38bdf8", icon: "📦" },
    { kind: "Deployment", group: "apps/v1", color: "#6366f1", icon: "🚀" },
    { kind: "Service", group: "core/v1", color: "#0ea5e9", icon: "🔀" },
    { kind: "ConfigMap", group: "core/v1", color: "#f59e0b", icon: "⚙️" },
    { kind: "PersistentVolume", group: "core/v1", color: "#22c55e", icon: "💾" },
    { kind: "...", group: "", color: "#334155", icon: "+" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      <div style={{ fontSize: 9, color: "#475569", letterSpacing: 2 }}>KUBERNETES API SERVER</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", maxWidth: 440 }}>
        {resources.map((r, i) => (
          <div key={i} style={{
            background: "#080c14", border: `1px solid ${r.color}60`,
            borderRadius: 8, padding: "8px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 16 }}>{r.icon}</span>
            <span style={{ fontSize: 10, color: r.color, fontFamily: "monospace", fontWeight: 700 }}>{r.kind}</span>
            <span style={{ fontSize: 7, color: "#334155", fontFamily: "monospace" }}>{r.group}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CRDYaml() {
  const lines = [
    { t: "apiVersion: apiextensions.k8s.io/v1", c: "#94a3b8" },
    { t: "kind: CustomResourceDefinition", c: "#6366f1", bold: true },
    { t: "metadata:", c: "#94a3b8" },
    { t: "  name: databaseclusters.db.example.com", c: "#fcd34d" },
    { t: "spec:", c: "#94a3b8" },
    { t: "  group: db.example.com", c: "#7dd3fc" },
    { t: "  names:", c: "#94a3b8" },
    { t: "    kind: DatabaseCluster", c: "#a5b4fc", bold: true },
    { t: "    plural: databaseclusters", c: "#94a3b8" },
    { t: "    shortNames: [dbc]", c: "#94a3b8" },
    { t: "  scope: Namespaced", c: "#86efac" },
    { t: "  versions:", c: "#94a3b8" },
    { t: "    - name: v1alpha1", c: "#94a3b8" },
    { t: "      schema:", c: "#94a3b8" },
    { t: "        openAPIV3Schema:", c: "#f59e0b" },
    { t: "          # валидация полей CR", c: "#475569" },
  ];
  return (
    <div style={{ background: "#080c14", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 18px" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 10, color: l.c, fontFamily: "monospace", fontWeight: l.bold ? 700 : 400, lineHeight: 1.7 }}>{l.t}</div>
      ))}
    </div>
  );
}

function CRYaml() {
  const lines = [
    { t: "apiVersion: db.example.com/v1alpha1", c: "#7dd3fc" },
    { t: "kind: DatabaseCluster", c: "#a5b4fc", bold: true },
    { t: "metadata:", c: "#94a3b8" },
    { t: "  name: my-postgres", c: "#fcd34d" },
    { t: "  namespace: production", c: "#94a3b8" },
    { t: "spec:", c: "#94a3b8" },
    { t: "  engine: postgresql", c: "#86efac" },
    { t: "  version: \"15.4\"", c: "#86efac" },
    { t: "  replicas: 3", c: "#86efac" },
    { t: "  storage:", c: "#94a3b8" },
    { t: "    size: 100Gi", c: "#86efac" },
    { t: "    class: fast-ssd", c: "#86efac" },
    { t: "status:", c: "#94a3b8" },
    { t: "  phase: Running", c: "#22c55e" },
    { t: "  readyReplicas: 3/3", c: "#22c55e" },
  ];
  return (
    <div style={{ background: "#080c14", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 18px" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ fontSize: 10, color: l.c, fontFamily: "monospace", fontWeight: l.bold ? 700 : 400, lineHeight: 1.7 }}>{l.t}</div>
      ))}
    </div>
  );
}

function OperatorDiagram() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", minWidth: 420 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {/* CRD */}
        <div style={{ background: "#0f0f2a", border: "2px solid #6366f1", borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#6366f1", letterSpacing: 1 }}>CRD</div>
          <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700, fontFamily: "monospace" }}>DatabaseCluster</div>
          <div style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>schema + validation</div>
        </div>
        <div style={{ fontSize: 18, color: "#334155" }}>+</div>
        {/* Controller */}
        <div style={{ background: "#0a1f0a", border: "2px solid #22c55e", borderRadius: 12, padding: "10px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 9, color: "#22c55e", letterSpacing: 1 }}>CONTROLLER</div>
          <div style={{ fontSize: 11, color: "#86efac", fontWeight: 700, fontFamily: "monospace" }}>DatabaseOperator</div>
          <div style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>reconcile loop</div>
        </div>
        <div style={{ fontSize: 18, color: "#a78bfa" }}>=</div>
        {/* Operator */}
        <div style={{ background: "#12102a", border: "2px solid #a78bfa", borderRadius: 12, padding: "10px 16px", textAlign: "center", boxShadow: "0 0 20px #a78bfa30" }}>
          <div style={{ fontSize: 9, color: "#a78bfa", letterSpacing: 1 }}>OPERATOR</div>
          <div style={{ fontSize: 11, color: "#c4b5fd", fontWeight: 700, fontFamily: "monospace" }}>🤖 Operator</div>
          <div style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>operational knowledge</div>
        </div>
      </div>

      {/* What it does */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {["Deploy", "Scale", "Backup", "Failover", "Update"].map((action, i) => (
          <div key={i} style={{
            background: "#080c14", border: "1px solid #a78bfa40",
            borderRadius: 6, padding: "4px 10px",
            fontSize: 9, color: "#a78bfa", fontFamily: "monospace",
          }}>{action}</div>
        ))}
      </div>
    </div>
  );
}

function RealOperators() {
  const ops = [
    { name: "CloudNativePG", kind: "PostgreSQL", cr: "Cluster", color: "#38bdf8", icon: "🐘" },
    { name: "Strimzi", kind: "Apache Kafka", cr: "Kafka", color: "#f59e0b", icon: "📨" },
    { name: "Prometheus Operator", kind: "Prometheus", cr: "Prometheus", color: "#ef4444", icon: "📊" },
    { name: "Redis Operator", kind: "Redis", cr: "RedisCluster", color: "#22c55e", icon: "🔴" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {ops.map((op, i) => (
        <div key={i} style={{
          display: "flex", gap: 12, alignItems: "center",
          background: "#080c14", border: `1px solid ${op.color}30`,
          borderRadius: 10, padding: "10px 16px", minWidth: 380,
        }}>
          <span style={{ fontSize: 20 }}>{op.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: op.color, fontFamily: "monospace", fontWeight: 700 }}>{op.name}</div>
            <div style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>{op.kind}</div>
          </div>
          <div style={{ background: op.color + "15", border: `1px solid ${op.color}40`, borderRadius: 6, padding: "3px 10px" }}>
            <span style={{ fontSize: 9, color: op.color, fontFamily: "monospace" }}>kind: {op.cr}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CRD() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  const renderDiagram = () => {
    switch (cur.phase) {
      case "builtin": return <BuiltinResources />;
      case "crd": return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ background: "#0d1117", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: 1 }}>БЫЛО</div>
              <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace", marginTop: 4 }}>Pod, Deployment</div>
              <div style={{ fontSize: 10, color: "#334155", fontFamily: "monospace" }}>Service, ...</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ fontSize: 9, color: "#6366f1", fontFamily: "monospace" }}>+ CRD</div>
              <div style={{ width: 40, height: 2, background: "#6366f1" }} />
              <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid #6366f1" }} />
            </div>
            <div style={{ background: "#0f0f2a", border: "2px solid #6366f1", borderRadius: 10, padding: "10px 16px", textAlign: "center", boxShadow: "0 0 20px #6366f130" }}>
              <div style={{ fontSize: 9, color: "#6366f1", letterSpacing: 1 }}>СТАЛО</div>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontFamily: "monospace", marginTop: 4 }}>Pod, Deployment</div>
              <div style={{ fontSize: 10, color: "#a5b4fc", fontFamily: "monospace" }}>Service, ...</div>
              <div style={{ fontSize: 10, color: "#c7d2fe", fontFamily: "monospace", fontWeight: 700 }}>DatabaseCluster ✨</div>
            </div>
          </div>
          <div style={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>kubectl get databaseclusters → работает!</div>
        </div>
      );
      case "crd_yaml": return <CRDYaml />;
      case "cr": return <CRYaml />;
      case "operator": return <OperatorDiagram />;
      case "examples": return <RealOperators />;
      default: return null;
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080c14",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "monospace", padding: 24, gap: 20,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#38bdf8", letterSpacing: 3, marginBottom: 6 }}>
          KUBERNETES • CRD · CR · OPERATORS
        </div>
        <div style={{ fontSize: 20, color: "#f1f5f9", fontWeight: 700, minHeight: 30 }}>{cur.title}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 4, minHeight: 18, maxWidth: 560, textAlign: "center" }}>{cur.subtitle}</div>
      </div>

      <div style={{
        background: "#0d1117", border: "1px solid #1e293b",
        borderRadius: 20, padding: "28px 36px",
        display: "flex", alignItems: "center", justifyContent: "center",
        minWidth: 480, minHeight: 200,
      }}>
        {renderDiagram()}
      </div>

      <div style={{
        background: "#0d1117", border: `1px solid ${cur.annotationColor}`,
        borderRadius: 12, padding: "12px 20px",
        maxWidth: 660, fontSize: 11, color: "#cbd5e1",
        fontFamily: "monospace", lineHeight: 1.8, animation: "fadeIn 0.4s ease",
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
