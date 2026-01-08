// components/MetasObjetivos.jsx
import React from "react";

export default function MetasObjetivos({ data }) {
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
      fontSize: "18px",
      fontWeight: "700",
      color: "#333",
      marginBottom: "24px",
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: "16px",
      marginBottom: "32px",
    },
    metricCard: {
      padding: "20px",
      borderRadius: "8px",
      // border: "2px solid",
      textAlign: "center",
      borderBottom: "4px solid #DA291C",
      backgroundColor: "#e7fbff3b",
      boxShadow: "0px 3px 10px #a5a7a9b0",
    },
    metricLabel: {
      fontSize: "13px",
      fontWeight: "700",
      marginBottom: "12px",
      lineHeight: "1.4",
      color: "#DA291C"
    },
    metricValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: "#1a1818ff"
    },
    smallValue: {
      fontSize: "13px",
      marginTop: "4px",
      opacity: 0.8,
      color: "#881a12ff"
    },
    progressSection: {
      marginTop: "32px",
    },
    progressHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "8px",
    },
    progressLabel: {
      fontSize: "16px",
      color: "#666",
      fontWeight: "600",
    },
    progressPercentage: {
      fontSize: "24px",
      fontWeight: "700",
      color: "#9810fa",
    },
    progressBarContainer: {
      width: "100%",
      height: "1,3rem", // h-4
      borderRadius: "8px",
      overflow: "hidden",
      position: "relative",
      marginBottom: "12px",
      backgroundColor: "#E5E7EB", // gray-200
      // borderRadius: "9999px",
    },
    progressBar: {
      color: "#fff",
      fontWeight: "700",
      fontSize: "14px",
      background: "linear-gradient(to right, #DA291C, #F97316)", // to-orange-500
      height: "1rem", // h-4
      borderRadius: "9999px", // rounded-full
      transition: "all 0.5s ease", // transition-all duration-500
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingLeft: "0.5rem", // px-2
      paddingRight: "0.5rem"
    },
    progressInfo: {
      display: "flex",
      justifyContent: "space-between",
      fontSize: "14px",
      fontWeight: "700",
      color: "#000000ff",
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
        <h2 style={styles.title}>Metas y Objetivos del Periodo</h2>
        <div style={styles.noDataMessage}>No hay datos disponibles</div>
      </div>
    );
  }

  // Valores con defaults
  const ejecucionTotal = data.ejecucionTotal || 0;
  const metaTotal = data.metaTotal || 0;
  const cumplimiento = data.cumplimiento || "0%";
  const proyeccionCierre = data.proyeccionCierre || 0;
  const productividadDiaria = data.productividadDiaria || 0;
  const sesionesGA4 = data.sesionesGA4 || 0;
  const variacionSesiones = data.variacionSesiones || "+0%";
  const diasHabiles = data.diasHabiles || "0 de 0";

  // Calcular porcentaje para la barra de progreso
  const progressPercentage = Math.min(parseInt(cumplimiento.replace("%", "")) || 0, 100);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Metas y Objetivos del Periodo</h2>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>
            Ejecución Total
            <br />
            (R5)
          </div>
          <div style={styles.metricValue}>
            {ejecucionTotal.toLocaleString()}
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>
            Meta Total
          </div>
          <div style={styles.metricValue}>
            {metaTotal.toLocaleString()}
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>
            % Cumplimiento
          </div>
          <div style={styles.metricValue}>
            {cumplimiento}
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>
            Proyección
            <br />
            Cierre
          </div>
          <div style={styles.metricValue}>
            {proyeccionCierre.toLocaleString()}
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>
            Productividad
            <br />
            Diaria
          </div>
          <div style={styles.metricValue}>
            {productividadDiaria}
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>
            Sesiones GA4
          </div>
          <div style={styles.metricValue}>
            {sesionesGA4.toLocaleString()}
          </div>
          <div style={styles.smallValue}>
            {variacionSesiones}
          </div>
        </div>
      </div>

      <div style={styles.progressSection}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>Progreso hacia la meta</span>
          <span style={styles.progressPercentage}>{cumplimiento}</span>
        </div>

        <div style={styles.progressBarContainer}>
          <div
            style={{ ...styles.progressBar, width: `${progressPercentage}%` }}
          >
            {progressPercentage > 10 ? `${progressPercentage}%` : ''}
          </div>
        </div>

        <div style={styles.progressInfo}>
          <span>Días hábiles: {diasHabiles}</span>
          <span>
            {ejecucionTotal.toLocaleString()} / {metaTotal.toLocaleString()} ejecutados
          </span>
        </div>
      </div>
    </div>
  );
}