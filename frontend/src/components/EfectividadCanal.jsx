// components/EfectividadCanal.jsx
import React from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";

export default function EfectividadCanal({ data }) {
  const styles = {
    container: {
      backgroundColor: "#fff",
      borderRadius: "8px",
      padding: "24px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      marginBottom: "20px",
      maxWidth: "auto",
    },
    title: {
      fontSize: "16px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "24px",
    },
  };

  const colors = {
    "IBM - Migración": "#DC2626",
    "IBM - Portabilidad": "#16A34A",
    "GROWTH - Migración": "#FFA500",
    "GROWTH - Portabilidad": "#8B5CF6",
    Organics: "#EF4444",
    "Papo (SEM)": "#DC2626",
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Efectividad por Canal / Campaña</h2>

      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={data.efectividadCanal.canales}
          layout="vertical"
          margin={{ left: 80, right: 20 }}
        >
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="canal"
            tick={{ fontSize: 11 }}
            width={75}
          />
          <Bar dataKey="efectividad" radius={[0, 4, 4, 0]}>
            {data.efectividadCanal.canales.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[entry.canal] || "#999"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}