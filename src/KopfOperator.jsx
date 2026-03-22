import { useState } from "react";

const STEPS = [
  {
    id: "structure",
    title: "Структура оператора на Kopf",
    subtitle: "Kopf — Python-фреймворк для написания операторов. Декораторы заменяют boilerplate код Watch + reconcile loop.",
    annotation: "Kopf берёт на себя: подписку на Watch API, очередь событий, retry логику, обновление status, управление finalizers. Вы пишете только бизнес-логику в декорированных функциях.",
    annotationColor: "#38bdf8",
    phase: "structure",
  },
  {
    id: "handlers",
    title: "Handlers: @kopf.on.create / update / delete",
    subtitle: "Каждый декоратор — это подписка на определённое событие жизненного цикла CR. Kopf вызывает вашу функцию при наступлении события.",
    annotation: "@kopf.on.create вызывается один раз при создании CR. @kopf.on.update — при изменении spec. @kopf.on.delete — при удалении, до того как ресурс реально удалён (именно здесь нужны finalizers).",
    annotationColor: "#6366f1",
    phase: "handlers",
  },
  {
    id: "status",
    title: "Status: отражаем состояние оператора",
    subtitle: "Оператор обновляет status CR чтобы пользователь видел что происходит. kubectl get dbc my-postgres показывает актуальное состояние.",
    annotation: "status — это не spec. spec — желаемое состояние (пишет пользователь). status — актуальное (пишет оператор). Конвенция: status.phase содержит одно из: Pending, Provisioning, Running, Failed. Условия описываются в status.conditions.",
    annotationColor: "#22c55e",
    phase: "status",
  },
  {
    id: "retry",
    title: "Retry: временные ошибки — это норма",
    subtitle: "PVC ещё не готов, база не поднялась, сеть моргнула. Kopf автоматически повторяет handler при исключениях.",
    annotation: "TemporaryError(message, delay=30) говорит Kopf: попробуй снова через 30 секунд. PermanentError — не повторяй, запиши в status.error. Это критически важно для production-grade операторов: transient failures не должны ломать весь reconcile.",
    annotationColor: "#f59e0b",
    phase: "retry",
  },
  {
    id: "finalizers",
    title: "Finalizers: контролируем удаление",
    subtitle: "Finalizer — это метка на ресурсе, которая блокирует его удаление. Kubernetes ждёт пока оператор не снимет финалайзер.",
    annotation: "kubectl delete dbc my-postgres → API Server видит finalizer → ставит deletionTimestamp → НЕ удаляет ресурс → вызывает @kopf.on.delete → оператор делает cleanup (удаляет S3 backup, освобождает IP) → снимает finalizer → ресурс удаляется. Без финалайзера — потеря данных.",
    annotationColor: "#ef4444",
    phase: "finalizers",
  },
  {
    id: "code",
    title: "Полный код оператора",
    subtitle: "DatabaseCluster оператор: создаём StatefulSet + Service, обновляем status, обрабатываем ошибки, cleanup при удалении.",
    annotation: "Этот код — основа для live demo. ~80 строк Python vs ~1000 строк если писать на Go с client-go напрямую. Kopf скрывает всю сложность Watch loop, leader election и retry механизма.",
    annotationColor: "#a78bfa",
    phase: "code",
  },
];

function StructureDiagram() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", minWidth: 460 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
        {/* Kopf */}
        <div style={{ background: "#0f0f2a", border: "2px solid #6366f1", borderRadius: 12, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
          <div style={{ fontSize: 9, color: "#6366f1", letterSpacing: 2, textAlign: "center" }}>KOPF FRAMEWORK</div>
          {["Watch API", "Event queue", "Retry logic", "Status updates", "Finalizers"].map((f, i) => (
            <div key={i} style={{ fontSize: 9, color: "#475569", fontFamily: "monospace", display: "flex", gap: 6 }}>
              <span style={{ color: "#6366f1" }}>✓</span>{f}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 8, color: "#475569", fontFamily: "monospace" }}>вы пишете</span>
            <div style={{ display: "flex", alignItems: "center" }}>
              <div style={{ width: 24, height: 2, background: "#22c55e" }} />
              <div style={{ width: 0, height: 0, borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "7px solid #22c55e" }} />
            </div>
          </div>
        </div>

        {/* Your code */}
        <div style={{ background: "#0a1f0a", border: "2px solid #22c55e", borderRadius: 12, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, minWidth: 180 }}>
          <div style={{ fontSize: 9, color: "#22c55e", letterSpacing: 2, textAlign: "center" }}>ВАША ЛОГИКА</div>
          {[
            "@kopf.on.create",
            "@kopf.on.update",
            "@kopf.on.delete",
            "create_statefulset()",
            "update_status()",
          ].map((f, i) => (
            <div key={i} style={{ fontSize: 9, color: "#86efac", fontFamily: "monospace" }}>{f}</div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ background: "#080c14", border: "1px solid #1e293b", borderRadius: 8, padding: "6px 14px", fontSize: 9, color: "#475569", fontFamily: "monospace" }}>
          pip install kopf kubernetes
        </div>
        <div style={{ background: "#080c14", border: "1px solid #1e293b", borderRadius: 8, padding: "6px 14px", fontSize: 9, color: "#475569", fontFamily: "monospace" }}>
          kopf run operator.py
        </div>
      </div>
    </div>
  );
}

function HandlersCode() {
  const code = `import kopf
import kubernetes

@kopf.on.create('db.example.com', 'v1alpha1', 'databaseclusters')
def create_fn(spec, name, namespace, **kwargs):
    replicas = spec.get('replicas', 1)
    engine = spec.get('engine', 'postgresql')
    
    # Создаём StatefulSet для базы данных
    create_statefulset(name, namespace, replicas, engine)
    create_service(name, namespace)
    
    return {'phase': 'Running', 'message': 'Deployed'}

@kopf.on.update('db.example.com', 'v1alpha1', 'databaseclusters')
def update_fn(spec, old, new, **kwargs):
    if old['spec']['replicas'] != new['spec']['replicas']:
        scale_statefulset(name, new['spec']['replicas'])

@kopf.on.delete('db.example.com', 'v1alpha1', 'databaseclusters')
def delete_fn(name, namespace, **kwargs):
    cleanup_resources(name, namespace)`;

  return (
    <div style={{ background: "#080c14", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 18px", maxWidth: 500 }}>
      {code.split('\n').map((line, i) => {
        let color = "#94a3b8";
        if (line.startsWith("@kopf")) color = "#a5b4fc";
        else if (line.includes("def ")) color = "#7dd3fc";
        else if (line.startsWith("import")) color = "#86efac";
        else if (line.trim().startsWith("#")) color = "#475569";
        else if (line.includes("=")) color = "#fcd34d";
        return <div key={i} style={{ fontSize: 10, color, fontFamily: "monospace", lineHeight: 1.7, whiteSpace: "pre" }}>{line || " "}</div>;
      })}
    </div>
  );
}

function StatusDiagram() {
  const phases = [
    { phase: "Pending", color: "#f59e0b", desc: "CR создан, оператор ещё не обработал" },
    { phase: "Provisioning", color: "#0ea5e9", desc: "Создаём StatefulSet, PVC, Service..." },
    { phase: "Running", color: "#22c55e", desc: "Все реплики Ready, база принимает коннекты" },
    { phase: "Failed", color: "#ef4444", desc: "Ошибка, требуется вмешательство" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 420 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
        {phases.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ background: p.color + "20", border: `2px solid ${p.color}`, borderRadius: 8, padding: "6px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 10, color: p.color, fontFamily: "monospace", fontWeight: 700 }}>{p.phase}</div>
            </div>
            {i < phases.length - 1 && <div style={{ width: 16, height: 2, background: "#1e293b" }} />}
          </div>
        ))}
      </div>

      <div style={{ background: "#080c14", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px" }}>
        {["status:", "  phase: Running", "  readyReplicas: 3", "  conditions:", "    - type: Ready", "      status: 'True'", "  message: 'All replicas healthy'"].map((l, i) => (
          <div key={i} style={{ fontSize: 10, fontFamily: "monospace", color: l.includes("Running") || l.includes("True") || l.includes("healthy") ? "#22c55e" : l.startsWith("  ") ? "#94a3b8" : "#7dd3fc", lineHeight: 1.7 }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

function RetryDiagram() {
  const attempts = [
    { n: 1, result: "fail", delay: "30s", msg: "TemporaryError: PVC not ready yet" },
    { n: 2, result: "fail", delay: "30s", msg: "TemporaryError: Pod not scheduled" },
    { n: 3, result: "success", delay: null, msg: "StatefulSet created successfully" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 420 }}>
      <div style={{ background: "#080c14", border: "1px solid #f59e0b30", borderRadius: 10, padding: "10px 14px", marginBottom: 4 }}>
        {["raise kopf.TemporaryError(", "    'PVC not ready yet',", "    delay=30", ")"].map((l, i) => (
          <div key={i} style={{ fontSize: 10, fontFamily: "monospace", color: i === 0 || i === 3 ? "#fcd34d" : "#94a3b8", lineHeight: 1.7 }}>{l}</div>
        ))}
      </div>

      {attempts.map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{
            minWidth: 24, height: 24, borderRadius: "50%",
            background: a.result === "success" ? "#22c55e20" : "#f59e0b20",
            border: `1px solid ${a.result === "success" ? "#22c55e" : "#f59e0b"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, color: a.result === "success" ? "#22c55e" : "#fcd34d", fontWeight: 700,
          }}>{a.n}</div>
          <div style={{ flex: 1, background: "#080c14", border: `1px solid ${a.result === "success" ? "#22c55e30" : "#f59e0b30"}`, borderRadius: 8, padding: "6px 12px" }}>
            <span style={{ fontSize: 9, color: a.result === "success" ? "#22c55e" : "#fcd34d", fontFamily: "monospace" }}>{a.msg}</span>
          </div>
          {a.delay && <div style={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>→ retry {a.delay}</div>}
          {!a.delay && <div style={{ fontSize: 9, color: "#22c55e", fontFamily: "monospace" }}>✓ OK</div>}
        </div>
      ))}
    </div>
  );
}

function FinalizersDiagram() {
  const [phase, setPhase] = useState(0);

  const phases = [
    { label: "kubectl delete dbc my-postgres", color: "#ef4444", icon: "🗑️" },
    { label: "API Server: ставит deletionTimestamp", color: "#f59e0b", icon: "⏰" },
    { label: "Kopf: вызывает @kopf.on.delete handler", color: "#6366f1", icon: "⚙️" },
    { label: "Оператор: cleanup (S3, сеть, PVC...)", color: "#0ea5e9", icon: "🧹" },
    { label: "Kopf: снимает finalizer", color: "#22c55e", icon: "✓" },
    { label: "Kubernetes: ресурс удалён", color: "#86efac", icon: "✅" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 420 }}>
      {phases.map((p, i) => (
        <div
          key={i}
          onClick={() => setPhase(i)}
          style={{
            display: "flex", gap: 10, alignItems: "center",
            background: i === phase ? p.color + "15" : "#080c14",
            border: `1px solid ${i <= phase ? p.color + "80" : "#1e293b"}`,
            borderRadius: 8, padding: "8px 14px", cursor: "pointer",
            transition: "all 0.3s", opacity: i > phase ? 0.3 : 1,
          }}
        >
          <span style={{ fontSize: 16 }}>{p.icon}</span>
          <span style={{ fontSize: 10, color: i <= phase ? p.color : "#334155", fontFamily: "monospace" }}>{p.label}</span>
          {i < phase && <span style={{ marginLeft: "auto", color: "#22c55e", fontSize: 12 }}>✓</span>}
          {i === phase && <span style={{ marginLeft: "auto", color: p.color, fontSize: 8, fontFamily: "monospace", animation: "fadeIn 0.4s ease" }}>← сейчас</span>}
        </div>
      ))}
      <div style={{ fontSize: 9, color: "#475569", fontFamily: "monospace", textAlign: "center" }}>нажмите на шаг чтобы проследить процесс</div>
    </div>
  );
}

function FullCode() {
  const code = `import kopf
import kubernetes.client as k8s_client
from kubernetes import config

config.load_incluster_config()
apps_v1 = k8s_client.AppsV1Api()
core_v1 = k8s_client.CoreV1Api()

@kopf.on.create('db.example.com', 'v1alpha1', 'databaseclusters')
def create_database(spec, name, namespace, logger, **kwargs):
    replicas = spec.get('replicas', 1)
    storage  = spec.get('storage', {}).get('size', '10Gi')

    try:
        _create_statefulset(name, namespace, replicas, storage)
        _create_headless_service(name, namespace)
        logger.info(f"DatabaseCluster {name} provisioned")
        return {'phase': 'Running', 'readyReplicas': replicas}
    except k8s_client.exceptions.ApiException as e:
        if e.status == 409:      # уже существует — идемпотентность
            return {'phase': 'Running'}
        raise kopf.TemporaryError(str(e), delay=30)

@kopf.on.update('db.example.com', 'v1alpha1', 'databaseclusters',
                field='spec.replicas')
def scale_database(spec, name, namespace, **kwargs):
    replicas = spec['replicas']
    apps_v1.patch_namespaced_stateful_set_scale(
        name=f"db-{name}", namespace=namespace,
        body={'spec': {'replicas': replicas}}
    )
    return {'readyReplicas': replicas}

@kopf.on.delete('db.example.com', 'v1alpha1', 'databaseclusters')
def delete_database(name, namespace, logger, **kwargs):
    logger.info(f"Cleaning up DatabaseCluster {name}")
    try:
        apps_v1.delete_namespaced_stateful_set(f"db-{name}", namespace)
        core_v1.delete_namespaced_service(f"db-{name}-svc", namespace)
    except k8s_client.exceptions.ApiException:
        pass   # уже удалено`;

  return (
    <div style={{ background: "#080c14", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 18px", maxWidth: 540, maxHeight: 360, overflowY: "auto" }}>
      {code.split('\n').map((line, i) => {
        let color = "#94a3b8";
        if (line.startsWith("@kopf")) color = "#a5b4fc";
        else if (line.includes("def ")) color = "#7dd3fc";
        else if (line.startsWith("import") || line.startsWith("from")) color = "#86efac";
        else if (line.trim().startsWith("#")) color = "#475569";
        else if (line.includes("kopf.TemporaryError")) color = "#fcd34d";
        else if (line.includes("return")) color = "#c4b5fd";
        else if (line.includes(": 'Running'") || line.includes("'Running'")) color = "#22c55e";
        return <div key={i} style={{ fontSize: 9.5, color, fontFamily: "monospace", lineHeight: 1.65, whiteSpace: "pre" }}>{line || " "}</div>;
      })}
    </div>
  );
}

export default function KopfOperator() {
  const [step, setStep] = useState(0);
  const cur = STEPS[step];

  const renderDiagram = () => {
    switch (cur.phase) {
      case "structure": return <StructureDiagram />;
      case "handlers": return <HandlersCode />;
      case "status": return <StatusDiagram />;
      case "retry": return <RetryDiagram />;
      case "finalizers": return <FinalizersDiagram />;
      case "code": return <FullCode />;
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
          KUBERNETES • OPERATORS · KOPF · PYTHON
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
