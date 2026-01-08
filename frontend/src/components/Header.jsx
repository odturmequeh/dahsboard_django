// components/Header.jsx
import React from "react";

export default function Header({ lastUpdate }) {
  const styles = {
    header: {
      background: "linear-gradient(to right, #DA291C, #B91C1C)",
      color: "#fff",
      padding: "20px 24px",
      marginBottom: "24px",
      borderRadius: "8px",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)"
    },
    titleSection: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
    },
    icon: {
      fontSize: "32px",
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: "24px",
      fontWeight: "700",
      marginBottom: "4px",
    },
    subtitle: {
      fontSize: "14px",
      opacity: 0.9,
    },
  };

  return (
    <div style={styles.header}>
      <div style={styles.titleSection}>
        <span style={styles.icon}>📊</span>
        <div style={styles.titleContainer}>
          <h1 style={styles.title}>Dashboard Postpago E-commerce</h1>
          {/* <p style={styles.subtitle}>
            Analítica de Ventas y Conversión • Actualizado: {lastUpdate}
          </p> */}
          <p style={styles.lastUpdate}>Analítica de Ventas y Conversión • Actualizado: {lastUpdate}</p>
        </div>
      </div>
    </div>
  );
}