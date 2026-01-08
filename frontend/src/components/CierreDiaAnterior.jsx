// components/CierreDiaAnterior.jsx
import React from "react";

export default function CierreDiaAnterior({ data }) {
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
      fontWeight: "700",
      color: "#333",
      // marginBottom: "24px",
    },
    dateBox: {
      backgroundColor: "#FEF2F2",
      borderRadius: "8px",
      padding: "16px 20px",
      marginBottom: "24px",
      border: "1px solid #FEE2E2",
    },
    dateLabel: {
      fontSize: "12px",
      color: "#666",
      fontWeight: "500",
    },
    dateValue: {
      fontSize: "17px",
      fontWeight: "600",
      color: "#1f2937",
      marginBottom: "24px",
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "16px",
      marginBottom: "24px",
    },
    metricBox: {
      padding: "20px",
      borderRadius: "8px",
      // border: "2px solid",
      textAlign: "center",
      borderLeft: "4px solid #DA291C",
      backgroundColor: "#e7fbff3b",
      boxShadow: "0px 3px 10px #a5a7a9b0",
    },
    metricLabel: {
      fontSize: "13px",
      fontWeight: "600",
      marginBottom: "12px",
      color: "#515151"
    },
    metricValue: {
      fontSize: "36px",
      fontWeight: "700",
      lineHeight: "1",
      color: "#333131"
    },
    variationsBox: {
      backgroundColor: "#FFFBEB",
      borderRadius: "8px",
      padding: "20px",
      border: "1px solid #FEF3C7",
    },
    variationItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 0",
    },
    variationLabel: {
      fontSize: "14px",
      color: "#374151",
      fontWeight: "700",
    },
    variationValue: {
      fontSize: "18px",
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
  if (!data) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Cierre Día Anterior</h2>
        <div style={styles.noDataMessage}>No hay datos disponibles</div>
      </div>
    );
  }

  // Valores con defaults
  const fecha = data.fecha || "-";
  const sesiones = data.sesiones || 0;
  const cantadas = data.cantadas || 0;
  const r5Finalizadas = data.r5Finalizadas || 0;
  const conversionPorcentaje = data.conversionPorcentaje || "0%";
  const variacionSemanaAnterior = data.variacionSemanaAnterior || "+0%";
  const variacionMesAnterior = data.variacionMesAnterior || "+0%";

  // Función para determinar el color de la variación
  const getVariationColor = (variation) => {
    if (!variation || variation === "-" || variation === "+0%") {
      return "#9CA3AF"; // Gris
    }
    
    const numericValue = parseFloat(variation.replace(/[+%]/g, ''));
    
    if (numericValue > 0) {
      return "#10B981"; // Verde (positivo)
    } else if (numericValue < 0) {
      return "#DC2626"; // Rojo (negativo)
    }
    
    return "#9CA3AF"; // Gris (neutral)
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Cierre Día Anterior</h2>
      <div style={styles.dateValue}>{fecha}</div>

      {/* <div style={styles.dateBox}>
            <div style={styles.dateLabel}>Fecha</div> 
      </div> */}

      <div style={styles.metricsGrid}>
        <div style={styles.metricBox}>
          <div style={styles.metricLabel}>
            Sesiones
          </div>
          <div style={styles.metricValue}>
            {sesiones.toLocaleString()}
          </div>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.metricLabel}>
            Cantadas
          </div>
          <div style={styles.metricValue}>
            {cantadas}
          </div>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.metricLabel}>
            R5 (Finalizadas)
          </div>
          <div style={styles.metricValue}>
            {r5Finalizadas}
          </div>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.metricLabel}>
            % Conversión
          </div>
          <div style={styles.metricValue}>
            {conversionPorcentaje}
          </div>
        </div>
      </div>

      <div style={styles.variationsBox}>
        <div style={styles.variationItem}>
          <span style={styles.variationLabel}>Variación Semana Anterior</span>
          <span style={{ 
            ...styles.variationValue, 
            color: getVariationColor(variacionSemanaAnterior) 
          }}>
            {variacionSemanaAnterior}
          </span>
        </div>
        <div style={styles.variationItem}>
          <span style={styles.variationLabel}>Variación Mes Anterior</span>
          <span style={{ 
            ...styles.variationValue, 
            color: getVariationColor(variacionMesAnterior) 
          }}>
            {variacionMesAnterior}
          </span>
        </div>
      </div>
    </div>
  );
}