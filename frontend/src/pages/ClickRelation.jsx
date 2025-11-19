import { useEffect, useState } from "react";
import ClickRelationTable from "../components/ClickRelationTable";
import { useNavigate } from "react-router-dom";

export default function ClickRelation() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Llamada a backend que trae los datos de GA4
    const fetchData = async () => {
      setLoading(true);
      // Ejemplo de datos de prueba
      const json = [
        {
          elemento: "Botón Comprar",
          img_click_home: 120,
          sesiones: 500,
          carritos: 80,
          compras: 40,
          ingresos: 3200,
        },
      ];
      setData(json);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg">
      {/* Botón Home */}
      <button
        onClick={() => navigate("/")}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
      >
        ← Home
      </button>
      <h2 className="text-xl font-semibold mb-4">📊 Click Relation Dashboard</h2>
      {loading ? <p>Cargando datos...</p> : <ClickRelationTable data={data} />}
    </div>
  );
}
