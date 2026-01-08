import { useEffect, useState } from "react";

export default function GeniaComponent({ startDate, endDate }) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!startDate || !endDate) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          
          `/api/dashboard/genia-summary/?start_date=${startDate}&end_date=${endDate}`
        );
        if (!res.ok) throw new Error("Error consultando el backend");

        const data = await res.json();

        // Adaptar datos a tu formato de tarjetas (sin usuarios)
        const mapped = [
          { label: "Clicks", value: data.clicks ?? 0 },
          { label: "Sesiones", value: data.sesiones ?? 0 },
          { label: "Ventas", value: data.ventas ?? 0 },
          { 
            label: "Ingresos", 
            value: data.ingresos ? `$${data.ingresos.toLocaleString()}` : "$0" 
          },
        ];

        setStats(mapped);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la información");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [startDate, endDate]); // 🔹 Re-fetch cuando cambian las fechas

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg text-center">
      <h1 className="text-2xl font-bold mb-2">👋 Bienvenido al Dashboard de Genia</h1>
      <p className="text-gray-600 mb-6">
        Aquí podrás visualizar tus métricas y paneles personalizados.
      </p>

      {/* Loading */}
      {loading && <p className="text-gray-500 animate-pulse">Cargando datos...</p>}

      {/* Error */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Tarjetas */}
      {!loading && !error && (
        <div className="flex justify-center gap-4 mt-4 flex-nowrap overflow-x-auto py-2">
          {stats.map((item) => (
            <div
              key={item.label}
              className="min-w-[160px] p-5 bg-gray-50 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold mt-1">{item.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
