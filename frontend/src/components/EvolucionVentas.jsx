// components/EvolucionVentas.jsx
import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function EvolucionVentas({ data }) {
  const styles = {
    container: {
      backgroundColor: "#fff",
      borderRadius: "0.5rem", // rounded-lg
      padding: "1.5rem", // p-6
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      borderTop: "2px solid #DA291C",
      marginBottom: "20px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
    },
    title: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
    },
    chartContainer: {
      height: "250px",
      marginBottom: "20px",
    },
    legend: {
      display: "flex",
      justifyContent: "center",
      gap: "24px",
      fontSize: "12px",
      marginBottom: "20px",
    },
    legendItem: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    dot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
    },
    metricsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
    },
    metricCard: {
      padding: "12px",
      borderRadius: "6px",
      borderLeft: "3px solid",
    },
    metricLabel: {
      fontSize: "11px",
      color: "#666",
      marginBottom: "4px",
    },
    metricValue: {
      fontSize: "24px",
      fontWeight: "700",
    },
    noDataMessage: {
      textAlign: "center",
      padding: "40px",
      color: "#6B7280",
      fontSize: "14px"
    }
  };

  // Validar que data existe
  if (!data || !data.evolucionVentas) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Evolución Diaria de Ventas</h2>
        </div>
        <div style={styles.noDataMessage}>No hay datos de evolución disponibles</div>
      </div>
    );
  }

  const { chartData, promedioV9, promedioR5, metaPromedio } = data.evolucionVentas;

  // Validar que hay datos para el gráfico
  if (!chartData || chartData.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Evolución Diaria de Ventas</h2>
        </div>
        <div style={styles.noDataMessage}>No hay datos para mostrar en el gráfico</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Evolución Diaria de Ventas</h2>
      </div>

      <div style={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="v9"
              stroke="#DC2626"
              strokeWidth={2}
              dot={false}
              name="V9"
            />
            <Line
              type="monotone"
              dataKey="r5"
              stroke="#16A34A"
              strokeWidth={2}
              dot={false}
              name="R5"
            />
            <Line
              type="monotone"
              dataKey="metaDiaria"
              stroke="#FFA500"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Meta"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={styles.legend}>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: "#DC2626" }}></span>
          <span>V9 (Cantadas)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: "#16A34A" }}></span>
          <span>R5 (Redes)</span>
        </div>
        <div style={styles.legendItem}>
          <span style={{ ...styles.dot, backgroundColor: "#FFA500" }}></span>
          <span>Meta Diaria</span>
        </div>
      </div>

      <div style={styles.metricsContainer}>
        <div
          style={{
            borderLeftColor: "#DC2626",
            backgroundColor: "#FEF2F2",
            ...styles.metricCard,
          }}
        >
          <div style={styles.metricLabel}>Promedio V9</div>
          <div style={{ ...styles.metricValue, color: "#DC2626" }}>
            {promedioV9 || "0"}
          </div>
        </div>
        <div
          style={{
            borderLeftColor: "#16A34A",
            backgroundColor: "#F0FDF4",
            ...styles.metricCard,
          }}
        >
          <div style={styles.metricLabel}>Promedio R5</div>
          <div style={{ ...styles.metricValue, color: "#16A34A" }}>
            {promedioR5 || "0"}
          </div>
        </div>
        <div
          style={{
            borderLeftColor: "#FFA500",
            backgroundColor: "#FFF7ED",
            ...styles.metricCard,
          }}
        >
          <div style={styles.metricLabel}>Meta Promedio</div>
          <div style={{ ...styles.metricValue, color: "#FFA500" }}>
            {metaPromedio || "0"}
          </div>
        </div>
      </div>
    </div>
  );
}