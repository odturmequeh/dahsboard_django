// components/DesgloseSemanal.jsx
import React from "react";

export default function DesgloseSemanal({ data }) {
  const styles = {
    container: {
      backgroundColor: "#fff",
      borderRadius: "0.5rem", // rounded-lg
      padding: "1.5rem", // p-6
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      borderTop: "4px solid #DA291C",
      marginBottom: "20px",
    },
    title: {
      fontSize: "17px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "24px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "14px",
    },
    th: {
      textAlign: "left",
      padding: "14px 16px",
      borderBottom: "3px solid #000000ff",
      fontWeight: "600",
      color: "#374151",
      fontSize: "14px",
      // backgroundColor: "#FEF2F2",
    },
    td: {
      padding: "16px",
      borderBottom: "1px solid #f3f4f6",
    },
    weekIndicator: {
      width: "10px",
      height: "10px",
      borderRadius: "50%",
      display: "inline-block",
      marginRight: "10px",
    },
    weekCell: {
      display: "flex",
      alignItems: "center",
      fontWeight: "500",
    },
    totalRow: {
      backgroundColor: "#FEF2F2",
      fontWeight: "700",
      fontSize: "15px",
    },
    noDataMessage: {
      textAlign: "center",
      padding: "40px",
      color: "#6B7280",
      fontSize: "14px"
    }
  };

  const getStatusColor = (cumplimiento) => {
    if (!cumplimiento) return "#9CA3AF";
    const value = parseInt(cumplimiento);
    if (value >= 80) return "#10B981";
    if (value > 50) return "#F59E0B";
    return "#DC2626";
  };

  const getVariationStyle = (variation) => {
    if (!variation || variation === "-") return { color: "#9CA3AF" };
    const value = parseFloat(variation.replace(/[+%]/g, ''));
    if (value > 0) return { color: "#10B981", fontWeight: "600" };
    if (value < 0) return { color: "#DC2626", fontWeight: "600" };
    return { color: "#9CA3AF" };
  };

  // Validar que data existe
  if (!data || !data.desgloseSemanal || !data.desgloseSemanal.semanas) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Desglose Semanal</h2>
        <div style={styles.noDataMessage}>No hay datos de desglose semanal disponibles</div>
      </div>
    );
  }

  const { semanas, total } = data.desgloseSemanal;

  if (semanas.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Desglose Semanal</h2>
        <div style={styles.noDataMessage}>No hay semanas registradas</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Desglose Semanal</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Semana</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Ejecución</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Meta</th>
            <th style={{ ...styles.th, textAlign: "right" }}>% Cump.</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Productividad</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Sesiones</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Var %</th>
          </tr>
        </thead>
        <tbody>
          {semanas.map((semana, index) => (
            <tr key={index}>
              <td style={styles.td}>
                <div style={styles.weekCell}>
                  <span
                    style={{
                      ...styles.weekIndicator,
                      backgroundColor: getStatusColor(semana.cumplimiento),
                    }}
                  ></span>
                  {semana.nombre || `Semana ${index + 1}`}
                </div>
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  fontWeight: "600",
                  color: "#1F2937",
                }}
              >
                {semana.ejecucion || 0}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: "#6B7280",
                }}
              >
                {(semana.meta || 0).toLocaleString()}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: getStatusColor(semana.cumplimiento),
                  fontWeight: "700",
                  fontSize: "15px",
                }}
              >
                {semana.cumplimiento || "0%"}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: "#1F2937",
                }}
              >
                {semana.productividad || "0"}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: "#1F2937",
                }}
              >
                {(semana.sesiones || 0).toLocaleString()}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  ...getVariationStyle(semana.variacion),
                }}
              >
                {semana.variacion || "+0%"}
              </td>
            </tr>
          ))}
          {total && (
            <tr style={styles.totalRow}>
              <td style={{ ...styles.td, color: "#1F2937" }}>Total</td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: "#DC2626",
                }}
              >
                {total.ejecucion || 0}
              </td>
              <td style={{ ...styles.td, textAlign: "right" }}>
                {(total.meta || 0).toLocaleString()}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: "#DC2626",
                  fontSize: "16px",
                }}
              >
                {total.cumplimiento || "0%"}
              </td>
              <td style={{ ...styles.td, textAlign: "right" }}>
                {total.productividad || "0"}
              </td>
              <td style={{ ...styles.td, textAlign: "right" }}>
                {(total.sesiones || 0).toLocaleString()}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: "#10B981",
                }}
              >
                {total.variacion || "+0%"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}