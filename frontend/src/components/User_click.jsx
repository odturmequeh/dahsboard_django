import { useEffect, useState } from "react";

export default function UserClickAnalysis() {
  const ANALYSIS_TOKEN = "123456789";

  const [url, setUrl] = useState("https://tienda.claro.com.co");
  const [analysisUrl, setAnalysisUrl] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastEventTs, setLastEventTs] = useState(null);


  const openInAnalysisMode = () => {
    const finalUrl =
      url.replace(/\/$/, "") + "?__analyze=" + ANALYSIS_TOKEN;
    window.open(finalUrl, "_blank");
    setAnalysisUrl(finalUrl);
  };

  const loadMetrics = async () => {
    setLoading(true);
    setMetrics(null);

    try {
      const res = await fetch(
        "/api/dashboard/conversion-metrics/"
      );
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error("Error cargando métricas", e);
    } finally {
      setLoading(false);
    }
  };

const runAnalysis = async () => {
  setLoading(true);

  try {
    const res = await fetch(
      "/api/dashboard/conversion-metrics/"
    );
    const data = await res.json();
    setMetrics(data);
  } catch (e) {
    console.error("Error cargando métricas", e);
  } finally {
    setLoading(false);
  }
};


  /* 🔄 Polling simple para refrescar cuando hay nuevo click */
  useEffect(() => {
  const interval = setInterval(async () => {
    try {
      const res = await fetch("/api/dashboard/analysis-status/");
      const status = await res.json();

      if (
        status.ready &&
        status.event_ts !== lastEventTs
      ) {
        setLastEventTs(status.event_ts);
        runAnalysis(); // 🚀 AHORA SÍ
      }
    } catch (e) {
      console.error("Error status", e);
    }
  }, 2000);

  return () => clearInterval(interval);
}, [lastEventTs]);



  return (
    <div style={styles.container}>
      {/* 🔗 ABRIR URL */}
      <div style={styles.card}>
        <h3>🔍 Abrir página en modo análisis</h3>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={styles.input}
        />

        <button onClick={openInAnalysisMode} style={styles.button}>
          Abrir en modo análisis
        </button>

        {analysisUrl && (
          <p style={styles.small}>
            URL abierta:
            <br />
            <code>{analysisUrl}</code>
          </p>
        )}
      </div>

      {/* 🎯 ELEMENTO SELECCIONADO */}
      <div style={styles.card}>
        <h3>🎯 Último elemento seleccionado</h3>

        {!metrics && (
          <p style={styles.small}>
            Esperando selección en la página analizada…
          </p>
        )}

        {metrics?.user_click && (
          <code style={styles.code}>
            {metrics.user_click}
          </code>
        )}
      </div>

      {/* 📊 MÉTRICAS */}
      <div style={styles.card}>
        <h3>📊 Métricas de conversión</h3>

        {loading && <p>Cargando métricas…</p>}

        {!loading && metrics && (
          <div style={styles.grid}>
            <Metric label="Sesiones" value={metrics.sessions} />
            <Metric label="Eventos" value={metrics.events} />
            <Metric
              label="Sesiones con compra"
              value={metrics.sessions_with_purchase}
            />
            <Metric
              label="Conversión"
              value={`${metrics.conversion_rate}%`}
              highlight
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* 🔹 Métrica */
function Metric({ label, value, highlight }) {
  return (
    <div
      style={{
        ...styles.metric,
        background: highlight ? "#2563eb" : "#f8fafc",
        color: highlight ? "#fff" : "#111",
      }}
    >
      <span style={styles.metricLabel}>{label}</span>
      <strong style={styles.metricValue}>{value}</strong>
    </div>
  );
}

/* 🎨 Estilos */
const styles = {
  container: {
    maxWidth: "1100px",
    margin: "40px auto",
    display: "grid",
    gap: "24px",
    fontFamily: "system-ui, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,.08)",
  },
  input: {
    width: "100%",
    padding: "12px",
    fontSize: "14px",
    marginBottom: "12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
  },
  button: {
    padding: "10px 18px",
    borderRadius: "8px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: 500,
  },
  small: {
    fontSize: "12px",
    color: "#6b7280",
  },
  code: {
    display: "block",
    background: "#111827",
    color: "#22c55e",
    padding: "10px",
    borderRadius: "8px",
    fontSize: "12px",
    wordBreak: "break-all",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginTop: "12px",
  },
  metric: {
    padding: "20px",
    borderRadius: "12px",
    textAlign: "center",
  },
  metricLabel: {
    fontSize: "13px",
    opacity: 0.8,
  },
  metricValue: {
    display: "block",
    fontSize: "26px",
    marginTop: "6px",
  },
};
