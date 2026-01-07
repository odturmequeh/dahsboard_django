// components/DetalleCanal.jsx
import React from "react";

export default function DetalleCanal({ data }) {
  const styles = {
    container: {
      backgroundColor: "#fff",
      borderRadius: "16px",
      padding: "28px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      marginBottom: "20px",
    },
    title: {
      fontSize: "19px",
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: "28px",
      letterSpacing: "-0.3px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "15px",
      marginBottom: "32px",
    },
    th: {
      textAlign: "left",
      padding: "16px 16px",
      borderBottom: "2px solid #F3F4F6",
      fontWeight: "600",
      color: "#6B7280",
      fontSize: "13px",
      backgroundColor: "#FAFAFA",
    },
    td: {
      padding: "18px 16px",
      borderBottom: "1px solid #F9FAFB",
    },
    tag: {
      padding: "6px 16px",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: "800",
      display: "inline-block",
      letterSpacing: "0.3px",
    },
    totalsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "20px",
    },
    totalBox: {
      padding: "24px",
      borderRadius: "12px",
      borderLeft: "5px solid",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    totalLabel: {
      fontSize: "13px",
      fontWeight: "700",
      letterSpacing: "0.3px",
    },
    totalValue: {
      fontSize: "40px",
      fontWeight: "900",
      letterSpacing: "-1px",
      lineHeight: "1",
    },
  };

  const getTagStyle = (tipo) => {
    const baseStyle = { ...styles.tag };
    if (tipo === "IBM") {
      return { ...baseStyle, backgroundColor: "#EDE9FE", color: "#6B21A8" };
    }
    return { ...baseStyle, backgroundColor: "#FEE2E2", color: "#991B1B" };
  };

  const getEffectivenessColor = (efectividad) => {
    const value = parseFloat(efectividad);
    if (value >= 2.5) return "#10B981";
    if (value >= 1.5) return "#F59E0B";
    return "#F97316";
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Detalle por Canal</h2>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Canal</th>
            <th style={styles.th}>Tipo</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Sesiones</th>
            <th style={{ ...styles.th, textAlign: "right" }}>V9</th>
            <th style={{ ...styles.th, textAlign: "right" }}>R5</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Efec.</th>
          </tr>
        </thead>
        <tbody>
          {data.detalleCanales.canales.map((canal, index) => (
            <tr key={index}>
              <td
                style={{
                  ...styles.td,
                  fontWeight: "600",
                  color: "#1F2937",
                  fontSize: "14px",
                }}
              >
                {canal.nombre}
              </td>
              <td style={styles.td}>
                <span style={getTagStyle(canal.tipo)}>{canal.tipo}</span>
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  fontWeight: "500",
                  color: "#4B5563",
                }}
              >
                {canal.sesiones.toLocaleString()}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  fontWeight: "700",
                  color: "#1F2937",
                  fontSize: "15px",
                }}
              >
                {canal.v9}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  fontWeight: "700",
                  color: "#1F2937",
                  fontSize: "15px",
                }}
              >
                {canal.r5}
              </td>
              <td
                style={{
                  ...styles.td,
                  textAlign: "right",
                  color: getEffectivenessColor(canal.efectividad),
                  fontWeight: "800",
                  fontSize: "16px",
                }}
              >
                {canal.efectividad}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.totalsContainer}>
        <div
          style={{
            ...styles.totalBox,
            borderLeftColor: "#DC2626",
            backgroundColor: "#FEF2F2",
          }}
        >
          <div style={{ ...styles.totalLabel, color: "#DC2626" }}>
            Total GROWTH
          </div>
          <div style={{ ...styles.totalValue, color: "#DC2626" }}>
            {data.detalleCanales.totals.growth}
          </div>
        </div>

        <div
          style={{
            ...styles.totalBox,
            borderLeftColor: "#7C3AED",
            backgroundColor: "#F5F3FF",
          }}
        >
          <div style={{ ...styles.totalLabel, color: "#7C3AED" }}>
            Total IBM
          </div>
          <div style={{ ...styles.totalValue, color: "#7C3AED" }}>
            {data.detalleCanales.totals.ibm}
          </div>
        </div>
      </div>
    </div>
  );
}