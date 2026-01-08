// components/CTW.jsx
import React from "react";

export default function CTW({ data }) {
  const styles = {
    container: {
      backgroundColor: "#fff",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      marginBottom: "20px",
      border: "3px solid #DC2626",
    },
    header: {
      display: "flex",
      alignItems: "flex-start",
      gap: "16px",
      marginBottom: "40px",
    },
    iconBox: {
      width: "56px",
      height: "56px",
      backgroundColor: "#DC2626",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    icon: {
      fontSize: "28px",
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: "20px",
      fontWeight: "700",
      color: "#1F2937",
      marginBottom: "4px",
      letterSpacing: "-0.5px",
    },
    subtitle: {
      fontSize: "14px",
      color: "#6B7280",
      fontWeight: "400",
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)",
      gap: "20px",
      marginBottom: "32px",
    },
    metricBox: {
      padding: "24px 20px",
      borderRadius: "12px",
      border: "3px solid",
      backgroundColor: "#fff",
    },
    metricLabel: {
      fontSize: "13px",
      fontWeight: "700",
      marginBottom: "12px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    metricIcon: {
      fontSize: "16px",
    },
    metricValue: {
      fontSize: "40px",
      fontWeight: "800",
      lineHeight: "1",
      letterSpacing: "-1px",
    },
    conversionCards: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "16px",
      marginBottom: "40px",
    },
    conversionCard: {
      padding: "24px",
      borderRadius: "12px",
      border: "2px solid #E5E7EB",
      backgroundColor: "#fff",
    },
    conversionLabel: {
      fontSize: "13px",
      color: "#6B7280",
      marginBottom: "12px",
      fontWeight: "600",
    },
    conversionValue: {
      fontSize: "32px",
      fontWeight: "800",
      marginBottom: "8px",
      letterSpacing: "-0.5px",
    },
    conversionFraction: {
      fontSize: "14px",
      color: "#9CA3AF",
      fontWeight: "500",
    },
    funnelSection: {
      backgroundColor: "#FAFAFA",
      padding: "32px",
      borderRadius: "12px",
    },
    funnelTitle: {
      fontSize: "16px",
      fontWeight: "700",
      color: "#374151",
      marginBottom: "24px",
      textAlign: "center",
    },
    funnelSteps: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    funnelStep: {
      flex: 1,
      padding: "32px 20px",
      borderRadius: "12px",
      textAlign: "center",
      color: "#fff",
      position: "relative",
    },
    funnelLabel: {
      fontSize: "13px",
      marginBottom: "12px",
      opacity: 0.95,
      fontWeight: "700",
      letterSpacing: "0.5px",
    },
    funnelValue: {
      fontSize: "36px",
      fontWeight: "900",
      letterSpacing: "-1px",
    },
    arrow: {
      fontSize: "28px",
      color: "#D1D5DB",
      fontWeight: "bold",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.iconBox}>
          <span style={{ ...styles.icon, color: "#fff" }}>📈</span>
        </div>
        <div style={styles.titleContainer}>
          <h2 style={styles.title}>CTW - Portabilidad (Click To WhatsApp)</h2>
          <p style={styles.subtitle}>Embudo de conversión completo</p>
        </div>
      </div>

      <div style={styles.metricsGrid}>
        <div
          style={{
            ...styles.metricBox,
            borderColor: "#DC2626",
            backgroundColor: "#FEF2F2",
          }}
        >
          <div style={{ ...styles.metricLabel, color: "#DC2626" }}>
            <span style={styles.metricIcon}>👆</span>
            Clics GA4
          </div>
          <div style={{ ...styles.metricValue, color: "#DC2626" }}>
            {data.ctw.clicsGA4}
          </div>
        </div>

        <div
          style={{
            ...styles.metricBox,
            borderColor: "#A855F7",
            backgroundColor: "#FAF5FF",
          }}
        >
          <div style={{ ...styles.metricLabel, color: "#A855F7" }}>
            <span style={styles.metricIcon}>💬</span>
            Chats Iniciados
          </div>
          <div style={{ ...styles.metricValue, color: "#A855F7" }}>
            {data.ctw.chatsIniciados}
          </div>
        </div>

        <div
          style={{
            ...styles.metricBox,
            borderColor: "#F97316",
            backgroundColor: "#FFF7ED",
          }}
        >
          <div style={{ ...styles.metricLabel, color: "#F97316" }}>
            <span style={styles.metricIcon}>📄</span>
            V9 Creadas
          </div>
          <div style={{ ...styles.metricValue, color: "#F97316" }}>
            {data.ctw.v9Creadas}
          </div>
        </div>

        <div
          style={{
            ...styles.metricBox,
            borderColor: "#10B981",
            backgroundColor: "#ECFDF5",
          }}
        >
          <div style={{ ...styles.metricLabel, color: "#10B981" }}>
            <span style={styles.metricIcon}>✅</span>
            R5 Finalizadas
          </div>
          <div style={{ ...styles.metricValue, color: "#10B981" }}>
            {data.ctw.r5Finalizadas}
          </div>
        </div>

        <div
          style={{
            ...styles.metricBox,
            borderColor: "#06B6D4",
            backgroundColor: "#ECFEFF",
          }}
        >
          <div style={{ ...styles.metricLabel, color: "#06B6D4" }}>
            <span style={styles.metricIcon}>👍</span>
            Aprobadas ABD
          </div>
          <div style={{ ...styles.metricValue, color: "#06B6D4" }}>
            {data.ctw.aprobadasABD}
          </div>
        </div>
      </div>

      <div style={styles.conversionCards}>
        <div style={styles.conversionCard}>
          <div style={styles.conversionLabel}>Tasa Clic → Chat</div>
          <div style={{ ...styles.conversionValue, color: "#A855F7" }}>
            {data.ctw.tasaClicChat}
          </div>
          <div style={styles.conversionFraction}>
            {data.ctw.chatsIniciados} / {data.ctw.clicsGA4}
          </div>
        </div>

        <div style={styles.conversionCard}>
          <div style={styles.conversionLabel}>Tasa Conversión General</div>
          <div style={{ ...styles.conversionValue, color: "#10B981" }}>
            {data.ctw.tasaConversionGeneral}
          </div>
          <div style={styles.conversionFraction}>
            {data.ctw.v9Creadas} / {data.ctw.clicsGA4}
          </div>
        </div>

        <div style={styles.conversionCard}>
          <div style={styles.conversionLabel}>Tasa Aprobación ABD</div>
          <div style={{ ...styles.conversionValue, color: "#06B6D4" }}>
            {data.ctw.tasaAprobacionABD}
          </div>
          <div style={styles.conversionFraction}>
            {data.ctw.aprobadasABD} / {data.ctw.r5Finalizadas}
          </div>
        </div>
      </div>

      <div style={styles.funnelSection}>
        <h3 style={styles.funnelTitle}>Embudo de Conversión</h3>
        <div style={styles.funnelSteps}>
          <div style={{ ...styles.funnelStep, backgroundColor: "#DC2626" }}>
            <div style={styles.funnelLabel}>Clics</div>
            <div style={styles.funnelValue}>{data.ctw.clicsGA4}</div>
          </div>
          <div style={styles.arrow}>→</div>
          <div style={{ ...styles.funnelStep, backgroundColor: "#A855F7" }}>
            <div style={styles.funnelLabel}>Chats</div>
            <div style={styles.funnelValue}>{data.ctw.chatsIniciados}</div>
          </div>
          <div style={styles.arrow}>→</div>
          <div style={{ ...styles.funnelStep, backgroundColor: "#F97316" }}>
            <div style={styles.funnelLabel}>V9</div>
            <div style={styles.funnelValue}>{data.ctw.v9Creadas}</div>
          </div>
          <div style={styles.arrow}>→</div>
          <div style={{ ...styles.funnelStep, backgroundColor: "#10B981" }}>
            <div style={styles.funnelLabel}>R5</div>
            <div style={styles.funnelValue}>{data.ctw.r5Finalizadas}</div>
          </div>
          <div style={styles.arrow}>→</div>
          <div style={{ ...styles.funnelStep, backgroundColor: "#06B6D4" }}>
            <div style={styles.funnelLabel}>Aprobadas</div>
            <div style={styles.funnelValue}>{data.ctw.aprobadasABD}</div>
          </div>
        </div>
      </div>
    </div>
  );
}