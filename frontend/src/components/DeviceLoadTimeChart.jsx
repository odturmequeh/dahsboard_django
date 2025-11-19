import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function DeviceLoadTimeChart({ rawData }) {

  // Función para transformar los datos de "largo" a "ancho" (pivote)
  const chartData = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return [];
    }

    const hourlyMap = rawData.reduce((acc, item) => {
      // Aseguramos que la hora sea una clave de dos dígitos
      const hourKey = item.hour.toString().padStart(2, '0');
      
      if (!acc[hourKey]) {
        acc[hourKey] = { hour: hourKey };
      }

      // Creamos una clave limpia para el dispositivo (ej: 'desktop', 'mobile')
      const key = item.deviceCategory.toLowerCase().replace(/\s/g, ''); 
      acc[hourKey][key] = item.avg_load_time;

      return acc;
    }, {});
    
    // Convertimos el mapa a un array y lo ordenamos por hora
    const finalData = Object.values(hourlyMap).sort((a, b) => 
        parseInt(a.hour) - parseInt(b.hour)
    );

    return finalData;
  }, [rawData]);

  if (chartData.length === 0) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow mt-6 h-[380px] flex items-center justify-center">
            <p className="text-gray-500">No hay datos de latencia horaria para mostrar.</p>
        </div>
    );
  }

  // Definición de colores y nombres para los dispositivos
  const colors = {
    mobile: "#dc2626", // Rojo
    desktop: "#10b981", // Verde
    tablet: "#3b82f6",  // Azul
    unassigned: "#a1a1aa", // Gris
  }

  const deviceNameMap = {
    mobile: "Móvil",
    desktop: "Escritorio",
    tablet: "Tableta",
    unassigned: "Sin Asignar",
  };

  // Determinamos qué líneas dibujar basándonos en los datos existentes
  const deviceCategories = ['mobile', 'desktop', 'tablet', 'unassigned'].filter(
    category => chartData.some(d => d.hasOwnProperty(category))
  );

  const formatHour = (tick) => `${tick}:00`;

  return (
    <div className="bg-white p-6 rounded-2xl shadow mt-6">
      <h2 className="text-xl font-bold mb-4">Latencia por Hora y Dispositivo</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="hour" 
            tickFormatter={formatHour} 
            label={{ value: 'Hora del Día', position: 'bottom', dy: 4 }}
          />
          <YAxis 
            label={{ value: 'Tiempo de Carga (s)', angle: -90, position: 'left' }}
          />
          <Tooltip 
            formatter={(value) => [`${value.toFixed(2)} seg`, 'Carga Promedio']}
            labelFormatter={(label) => `Hora: ${label}:00`}
          />
          <Legend verticalAlign="top" height={36} />
          
          {/* Renderiza una línea por cada dispositivo encontrado en los datos */}
          {deviceCategories.map((category) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[category]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
              name={deviceNameMap[category] || category} 
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}