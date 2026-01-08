// components/CorteDiario.jsx
import React, { useState } from "react";

export default function CorteDiario({ data }) {
  const [selectedHour, setSelectedHour] = useState(null);

  const styles = {
    container: {
      backgroundColor: "#fff",
      borderRadius: "0.5rem", // rounded-lg
      padding: "1.5rem", // p-6
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      borderTop: "4px solid #DA291C",
      marginBottom: "20px",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "28px",
    },
    title: {
      fontSize: "19px",
      fontWeight: "700",
      color: "#1F2937",
      letterSpacing: "-0.3px",
    },
    timeSelector: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },
    timeIcon: {
      fontSize: "20px",
      color: "#DC2626",
    },
    select: {
      padding: "10px 40px 10px 16px",
      borderRadius: "10px",
      border: "2px solid #FEE2E2",
      fontSize: "15px",
      fontWeight: "600",
      cursor: "pointer",
      backgroundColor: "#fff",
      outline: "none",
      color: "#1F2937",
    },
    selectedBox: {
      padding: "20px",
      borderRadius: "8px",
      // border: "2px solid",
      textAlign: "center",
      border: "1px solid #d9caca",
      borderBottom: "4px solid #DA291C",
      backgroundColor: "#e7fbff3b",
      boxShadow: "0px 3px 10px #a5a7a9b0",
    },
    selectedHeader: {
      fontSize: "13px",
      color: "#6B7280",
      marginBottom: "20px",
      fontWeight: "500",
    },
    selectedHourText: {
      color: "#DC2626",
      fontWeight: "700",
    },
    selectedMetrics: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "24px",
    },
    metricColumn: {
      textAlign: "center",
    },
    metricLabel: {
      fontSize: "12px",
      color: "#6B7280",
      marginBottom: "10px",
      fontWeight: "600",
    },
    metricValue: {
      fontSize: "32px",
      fontWeight: "800",
      letterSpacing: "-0.5px",
      color: "#333131"
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "15px",
    },
    th: {
      textAlign: "left",
      padding: "16px 20px",
      borderBottom: "2px solid #F3F4F6",
      fontWeight: "600",
      color: "#6B7280",
      fontSize: "13px",
      backgroundColor: "#FAFAFA",
    },
    td: {
      padding: "18px 20px",
      borderBottom: "1px solid #F9FAFB",
    },
    selectedRow: {
      backgroundColor: "#FEF2F2",
    },
    noDataMessage: {
      textAlign: "center",
      padding: "40px",
      color: "#6B7280",
      fontSize: "14px"
    }
  };

  // Validar que data existe y tiene cortes
  if (!data || !data.cortes || data.cortes.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>Cortes del Día</h2>
        </div>
        <div style={styles.noDataMessage}>No hay datos de cortes disponibles para hoy</div>
      </div>
    );
  }

  // Inicializar selectedHour si es null
  if (selectedHour === null && data.cortes.length > 0) {
    setSelectedHour(data.cortes[data.cortes.length - 1].hora);
  }

  const selectedData = data.cortes.find((c) => c.hora === selectedHour);

  const getConversionColor = (conversion) => {
    if (!conversion) return "#f94b16ff";
    const value = parseFloat(conversion);
    if (value >= 2.3) return "#10B981";
    if (value >= 1.9) return "#F59E0B";
    return "#f94b16ff";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Cortes del Día</h2>
        <div style={styles.timeSelector}>
          <span style={styles.timeIcon}>🕐</span>
          <select
            style={styles.select}
            value={selectedHour || ""}
            onChange={(e) => setSelectedHour(e.target.value)}
          >
            {data.cortes.map((corte) => (
              <option key={corte.hora} value={corte.hora}>
                {corte.hora}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedData && (
        <div style={styles.selectedBox}>
          <div style={styles.selectedHeader}>
            Corte seleccionado:{" "}
            <span style={styles.selectedHourText}>{selectedHour}</span>
          </div>

          <div style={styles.selectedMetrics}>
            <div style={styles.metricColumn}>
              <div style={styles.metricLabel}>Sesiones</div>
              <div style={styles.metricValue}>
                {(selectedData.sesiones || 0).toLocaleString()}
              </div>
            </div>

            <div style={styles.metricColumn}>
              <div style={styles.metricLabel}>Cantadas</div>
              <div style={styles.metricValue}>
                {selectedData.cantadas || 0}
              </div>
            </div>

            <div style={styles.metricColumn}>
              <div style={styles.metricLabel}>% Conv.</div>
              <div style={styles.metricValue}>
                {selectedData.conversion || "0%"}
              </div>
            </div>
          </div>
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Hora</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Sesiones</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Cantadas</th>
            <th style={{ ...styles.th, textAlign: "right" }}>% Conv.</th>
          </tr>
        </thead>
        <tbody>
          {data.cortes.map((corte, index) => (
            <tr
              key={index}
              style={corte.hora === selectedHour ? styles.selectedRow : {}}
            >
              <td
                style={{
                  ...styles.td,
                  fontWeight: corte.hora === selectedHour ? "700" : "500",
                  color: "#1F2937",
                }}
              >
                {corte.hora}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#1F2937",
                }}
              >
                {(corte.sesiones || 0).toLocaleString()}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  fontWeight: "700",
                  color: "#92b9f7ff",
                }}
              >
                {corte.cantadas || 0}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: getConversionColor(corte.conversion),
                  fontWeight: "700",
                  fontSize: "16px",
                }}
              >
                {corte.conversion || "0%"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}