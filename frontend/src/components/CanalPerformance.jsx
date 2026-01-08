import React from 'react';

const data = [
  { canal: 'GROWTH - Portabilidad', tipo: 'GROWTH', sesiones: 2152, v9: 69, r5: 62, efe: '3.21%' },
  { canal: 'GROWTH - Migracion', tipo: 'GROWTH', sesiones: 687, v9: 4, r5: 4, efe: '0.58%' },
  { canal: 'Organico', tipo: 'GROWTH', sesiones: 3456, v9: 78, r5: 0, efe: '2.52%' },
  { canal: 'Pago (SEM)', tipo: 'GROWTH', sesiones: 8234, v9: 156, r5: 142, efe: '1.89%' },
  { canal: 'IBM - Migracion', tipo: 'IBM', sesiones: 4746, v9: 63, r5: 56, efe: '1.32%' },
  { canal: 'IBM - Portabilidad', tipo: 'IBM', sesiones: 1258, v9: 4, r5: 3, efe: '0.32%' },
];

const styles = {
  card: {
    background: '#fff',
    padding: '16px',
    borderRadius: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,.1)',
    marginBottom: '24px',
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#DA291C',
  },
  table: {
    width: '100%',
    fontSize: '13px',
    borderCollapse: 'collapse',
  },
  th: {
    background: '#f2f2f2',
    padding: '6px',
    textAlign: 'center',
    border: '1px solid #ccc',
  },
  td: {
    padding: '6px',
    textAlign: 'center',
    border: '1px solid #ccc',
  },
};

export default function CanalPerformance() {
  return (
    <div style={styles.card}>
      <div style={styles.title}>Efectividad por Canal / Campaña</div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Canal</th><th style={styles.th}>Tipo</th><th style={styles.th}>Sesiones</th>
            <th style={styles.th}>V9</th><th style={styles.th}>R5</th><th style={styles.th}>Efec.</th>
          </tr>
        </thead>
        <tbody>
          {data.map(r => (
            <tr key={r.canal}>
              <td style={styles.td}>{r.canal}</td><td style={styles.td}>{r.tipo}</td>
              <td style={styles.td}>{r.sesiones.toLocaleString()}</td><td style={styles.td}>{r.v9}</td>
              <td style={styles.td}>{r.r5}</td><td style={styles.td}>{r.efe}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}