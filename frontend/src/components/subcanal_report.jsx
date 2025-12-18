import { useEffect, useState, Fragment } from "react";
import * as XLSX from "xlsx";

export default function Ga4SubcanalOwnedTable() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getDefaultDates = () => {
  const today = new Date();

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = today;

  const format = (date) => date.toISOString().slice(0, 10);

  return {
    startDate: format(start),
    endDate: format(end),
  };
};
const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDates();

const [startDate, setStartDate] = useState(defaultStart);
const [endDate, setEndDate] = useState(defaultEnd);
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/dashboard/subcanal-owned/?start_date=${startDate}&end_date=${endDate}`
      );

      if (!res.ok) throw new Error("Error consultando GA4");

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <p>Cargando reporte...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return null;

  const { fechas } = data.encabezados;

  /* =============================
     CÁLCULO DE TOTALES POR FECHA
  ============================= */
  const totalesPorFecha = {};

  fechas.forEach((fecha) => {
    totalesPorFecha[fecha] = { sesiones: 0, ventas: 0 };
  });

  data.datos.forEach((fila) => {
    fechas.forEach((fecha) => {
      totalesPorFecha[fecha].sesiones +=
        fila.valores[fecha]?.sesiones ?? 0;
      totalesPorFecha[fecha].ventas +=
        fila.valores[fecha]?.ventas ?? 0;
    });
  });

  /* =============================
     EXPORTAR A EXCEL
  ============================= */
  const exportToExcel = () => {
    const sheetData = [];

    // Encabezado
    const headerRow = ["Subcanal"];
    fechas.forEach((fecha) => {
      headerRow.push(`${fecha} - Sesiones`);
      headerRow.push(`${fecha} - Ventas`);
    });
    sheetData.push(headerRow);

    // Filas de datos
    data.datos.forEach((fila) => {
      const row = [fila.grupo];
      fechas.forEach((fecha) => {
        row.push(fila.valores[fecha]?.sesiones ?? 0);
        row.push(fila.valores[fecha]?.ventas ?? 0);
      });
      sheetData.push(row);
    });

    // Fila de totales
    const totalRow = ["TOTAL"];
    fechas.forEach((fecha) => {
      totalRow.push(totalesPorFecha[fecha].sesiones);
      totalRow.push(totalesPorFecha[fecha].ventas);
    });
    sheetData.push(totalRow);

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Subcanales Owned"
    );

    XLSX.writeFile(
      workbook,
      `ga4_subcanales_owned_${startDate}_${endDate}.xlsx`
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">
          Reporte Sub Canal
        </h2>
      {/* FILTROS */}
      <div className="flex gap-3 items-end flex-wrap">
        <div>
          <label className="block text-sm">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <div>
          <label className="block text-sm">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>

        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Consultar
        </button>

        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Descargar Excel
        </button>
      </div>

      {/* TABLA */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th
                rowSpan={2}
                className="border px-3 py-2 text-left sticky left-0 bg-gray-100 z-10"
              >
                Subcanal
              </th>

              {fechas.map((fecha) => (
                <th
                  key={fecha}
                  colSpan={2}
                  className="border px-3 py-2 text-center"
                >
                  {fecha}
                </th>
              ))}
            </tr>

            <tr>
              {fechas.map((fecha) => (
                <Fragment key={`${fecha}-metrics`}>
                  <th className="border px-2 py-1">Sesiones</th>
                  <th className="border px-2 py-1">Ventas</th>
                </Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.datos.map((fila) => (
              <tr key={fila.grupo} className="hover:bg-gray-50">
                <td className="border px-3 py-2 font-medium sticky left-0 bg-white">
                  {fila.grupo}
                </td>

                {fechas.map((fecha) => (
                  <Fragment key={`${fila.grupo}-${fecha}`}>
                    <td className="border px-2 py-1 text-right">
                      {fila.valores[fecha]?.sesiones ?? 0}
                    </td>
                    <td className="border px-2 py-1 text-right">
                      {fila.valores[fecha]?.ventas ?? 0}
                    </td>
                  </Fragment>
                ))}
              </tr>
            ))}

            {/* FILA TOTAL */}
            <tr className="bg-gray-200 font-semibold">
              <td className="border px-3 py-2 sticky left-0 bg-gray-200">
                TOTAL
              </td>

              {fechas.map((fecha) => (
                <Fragment key={`total-${fecha}`}>
                  <td className="border px-2 py-1 text-right">
                    {totalesPorFecha[fecha].sesiones}
                  </td>
                  <td className="border px-2 py-1 text-right">
                    {totalesPorFecha[fecha].ventas}
                  </td>
                </Fragment>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
