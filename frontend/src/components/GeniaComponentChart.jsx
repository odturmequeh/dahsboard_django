import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow-md text-sm">
        <p className="font-semibold">{label}</p>
        <p>Ingresos: ${payload[0].value.toLocaleString()}</p>
        <p className="text-gray-500 mt-1 italic">Da click para más detalle</p>
      </div>
    );
  }
  return null;
};

// Gráfico
function IngresosPorDiaChart({ data, onBarClick }) {
  return (
    <div className="w-full h-64 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            angle={-30}
            textAnchor="end"
            height={50}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="ingresos"
            fill="#E60000"
            cursor="pointer"
            onClick={(data) => onBarClick(data)}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Componente principal con modal y tabla de detalle
export default function GeniaIngresosChart() {
  const [ingresosDia, setIngresosDia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDia, setSelectedDia] = useState(null);

  // Estados para rango de fechas
  const [startDate, setStartDate] = useState("2025-11-22");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Carga de datos según rango de fechas
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/dashboard/genia-daily-chart/?start_date=${startDate}&end_date=${endDate}`
        );
        if (!res.ok) throw new Error("Error consultando el backend");

        const data = await res.json();
        if (data.ingresos_por_dia) {
          setIngresosDia(data.ingresos_por_dia);
        }
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la información");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [startDate, endDate]); // recarga al cambiar fechas

  const handleBarClick = (data) => {
    setSelectedDia(data);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-center">📈 Ingresos por día</h2>

      {/* Selector de fechas */}
      <div className="flex justify-center gap-4 mb-4">
        <div>
          <label className="text-sm font-medium mr-2">Desde:</label>
          <input
            type="date"
            min="2025-11-22"
            max={new Date().toISOString().slice(0, 10)}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium mr-2">Hasta:</label>
          <input
            type="date"
            min="2025-11-22"
            max={new Date().toISOString().slice(0, 10)}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
      </div>

      {loading && <p className="text-gray-500 animate-pulse text-center">Cargando datos...</p>}
      {error && <p className="text-red-500 text-center">{error}</p>}

      {!loading && !error && ingresosDia.length > 0 && (
        <IngresosPorDiaChart data={ingresosDia} onBarClick={handleBarClick} />
      )}

      {/* Modal */}
      {selectedDia && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 overflow-auto p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl animate-fadeIn">
            <h3 className="text-xl font-bold mb-4">
              Detalle del {selectedDia.date}
            </h3>
            <p className="text-gray-700 mb-4">
              <strong>Ingresos totales:</strong> ${selectedDia.ingresos.toLocaleString()}
            </p>

            {/* Tabla de detalle */}
            {selectedDia.detalle_ventas && selectedDia.detalle_ventas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">Session ID</th>
                      <th className="p-2 border">Producto</th>
                      <th className="p-2 border">Transaction ID</th>
                      <th className="p-2 border">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDia.detalle_ventas.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.session_id}</td>
                        <td className="p-2">{item.producto}</td>
                        <td className="p-2">{item.transaction_id}</td>
                        <td className="p-2">${item.valor.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay ventas para este día.</p>
            )}

            <button
              onClick={() => setSelectedDia(null)}
              className="mt-6 w-full bg-[#E60000] text-white py-2 rounded-lg hover:bg-red-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
