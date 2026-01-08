// components/MapaCalor.jsx
import React from "react";

export default function MapaCalor({ data }) {
  const styles = {
    container: {
      backgroundColor: "#fff",
      borderRadius: "0.5rem",
      padding: "1.5rem",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
      borderTop: "2px solid #DA291C",
      marginBottom: "20px",
    },
    title: {
      fontSize: "17px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "28px",
    },
    heatmapContainer: {
      overflowX: "auto",
      marginBottom: "24px",
    },
    heatmapGrid: {
      display: "grid",
      gridTemplateColumns: "80px repeat(7, 1fr)",
      gap: "8px",
      maxWidth: "800px",
      margin: "0 auto",
    },
    headerCell: {
      padding: "12px",
      textAlign: "center",
      fontSize: "13px",
      fontWeight: "700",
      color: "#374151",
    },
    weekLabel: {
      padding: "12px",
      textAlign: "center",
      fontSize: "13px",
      fontWeight: "700",
      color: "#374151",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    cell: {
      padding: "16px",
      textAlign: "center",
      fontSize: "15px",
      fontWeight: "700",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "all 0.2s",
      minHeight: "60px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    emptyCell: {
      backgroundColor: "#F3F4F6",
      color: "#9CA3AF",
    },
    legend: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      marginBottom: "28px",
    },
    legendLabel: {
      fontSize: "13px",
      color: "#6B7280",
      fontWeight: "600",
    },
    legendGradient: {
      display: "flex",
      gap: "4px",
    },
    legendColor: {
      width: "40px",
      height: "28px",
      borderRadius: "4px",
    },
    statsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
      marginTop: "28px",
    },
    statBox: {
      padding: "20px",
      borderRadius: "10px",
      textAlign: "center",
      border: "2px solid #DC2626",
      boxShadow: "0 2px 8px rgba(100, 180, 243, 0.4)",
      backgroundColor: "#FAFCFF"
    },
    statLabel: {
      fontSize: "12px",
      color: "#6B7280",
      marginBottom: "8px",
      fontWeight: "600",
    },
    statValue: {
      fontSize: "24px",
      fontWeight: "800",
      color: "#1F2937"
    },
    noDataMessage: {
      textAlign: "center",
      padding: "40px",
      color: "#6B7280",
      fontSize: "14px"
    }
  };

  // Función para determinar color según valor
  const getColorByValue = (value, maxValue) => {
    if (!value || value === 0) return "#F3F4F6";
    
    const percentage = (value / maxValue) * 100;
    
    if (percentage >= 80) return "#DC2626";      // Rojo intenso
    if (percentage >= 60) return "#EF4444";      // Rojo
    if (percentage >= 40) return "#F97316";      // Naranja
    if (percentage >= 20) return "#FCD34D";      // Amarillo
    return "#FDE68A";                             // Amarillo claro
  };

  const diasSemana = ["D", "L", "M", "X", "J", "V", "S"];

  // Validar que data existe
  if (!data || !data.mapaCalor) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Mapa de Calor - Ventas (R5)</h2>
        <div style={styles.noDataMessage}>No hay datos del mapa de calor disponibles</div>
      </div>
    );
  }

  const { heatmapData, mejorSemana, mejorDia, totalVentasR5 } = data.mapaCalor;

  // Validar que heatmapData existe y es un array
  if (!heatmapData || !Array.isArray(heatmapData) || heatmapData.length === 0) {
    return (
      <div style={styles.container}>
        <h2 style={styles.title}>Mapa de Calor - Ventas (R5)</h2>
        <div style={styles.noDataMessage}>No hay datos suficientes para generar el mapa de calor</div>
      </div>
    );
  }

  // Encontrar valor máximo para escala de colores
  const maxValue = Math.max(
    ...heatmapData.flat().map(cell => cell?.cantidad || 0)
  );

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Mapa de Calor - Ventas (R5)</h2>

      <div style={styles.legend}>
        <span style={styles.legendLabel}>Menos ventas</span>
        <div style={styles.legendGradient}>
          <div style={{ ...styles.legendColor, backgroundColor: "#FDE68A" }}></div>
          <div style={{ ...styles.legendColor, backgroundColor: "#FCD34D" }}></div>
          <div style={{ ...styles.legendColor, backgroundColor: "#F97316" }}></div>
          <div style={{ ...styles.legendColor, backgroundColor: "#EF4444" }}></div>
          <div style={{ ...styles.legendColor, backgroundColor: "#DC2626" }}></div>
        </div>
        <span style={styles.legendLabel}>Más ventas</span>
      </div>

      <div style={styles.heatmapContainer}>
        <div style={styles.heatmapGrid}>
          {/* Header vacío */}
          <div style={styles.headerCell}></div>

          {/* Headers de días de la semana */}
          {diasSemana.map((dia, index) => (
            <div key={index} style={styles.headerCell}>
              {dia}
            </div>
          ))}

          {/* Filas de semanas */}
          {heatmapData.map((semana, semanaIndex) => (
            <React.Fragment key={semanaIndex}>
              {/* Label de semana */}
              <div style={styles.weekLabel}>
                Semana {semanaIndex + 1}
              </div>

              {/* Celdas de días */}
              {semana.map((cell, diaIndex) => {
                const value = cell?.cantidad || 0;
                const backgroundColor = getColorByValue(value, maxValue);
                const isEmpty = !value || value === 0;
                const textColor = isEmpty ? "#9CA3AF" : value > maxValue * 0.4 ? "#fff" : "#1F2937";

                return (
                  <div
                    key={diaIndex}
                    style={{
                      ...styles.cell,
                      backgroundColor,
                      color: textColor,
                      ...(isEmpty && styles.emptyCell),
                    }}
                    onMouseEnter={(e) => {
                      if (!isEmpty) {
                        e.currentTarget.style.transform = "scale(1.05)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                    title={isEmpty ? "Sin datos" : `${value} ventas`}
                  >
                    {isEmpty ? "-" : value}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div style={styles.statsContainer}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Mejor Semana</div>
          <div style={styles.statValue}>
            {mejorSemana || "-"}
          </div>
        </div>

        <div style={styles.statBox}>
          <div style={styles.statLabel}>Mejor Día</div>
          <div style={styles.statValue}>
            {mejorDia || "-"}
          </div>
        </div>

        <div style={styles.statBox}>
          <div style={styles.statLabel}>Total Ventas R5</div>
          <div style={styles.statValue}>
            {(totalVentasR5 || 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}