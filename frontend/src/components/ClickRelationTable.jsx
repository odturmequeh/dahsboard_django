import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ClickRelationTable() {
  const [allData, setAllData] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState([]);
  const [modalTitle, setModalTitle] = useState("");
  const [modalVisibleRows, setModalVisibleRows] = useState(10);

  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [period1Data, setPeriod1Data] = useState([]);
  const [period2Data, setPeriod2Data] = useState([]);
  const [startDate1, setStartDate1] = useState(new Date("2025-10-01"));
  const [endDate1, setEndDate1] = useState(new Date("2025-10-15"));
  const [startDate2, setStartDate2] = useState(new Date("2025-10-16"));
  const [endDate2, setEndDate2] = useState(new Date("2025-10-31"));
  const [loadingCompare, setLoadingCompare] = useState(false);

  const [visibleRows, setVisibleRows] = useState(10);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [compareSearchText, setCompareSearchText] = useState("");

  const [clickFlowModalOpen, setClickFlowModalOpen] = useState(false);
  const [clickFlowData, setClickFlowData] = useState([]);
  const [clickFlowSession, setClickFlowSession] = useState("");

  const [loadingModal, setLoadingModal] = useState(false);
  const [loadingClickFlow, setLoadingClickFlow] = useState(false);


  const API_URL = "https://dahsboard-django.onrender.com/api/dashboard/click_relation/";

  // --- FETCH DATA PRINCIPAL ---
  const fetchData = async (unit = null, start = null, end = null) => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(API_URL);
      if (unit) url.searchParams.append("unit", unit);
      if (start) url.searchParams.append("start", start);
      if (end) url.searchParams.append("end", end);
      const res = await fetch(url.toString());
      const json = await res.json();
      if (res.ok) {
        setAllData(json.data || []);
        setData(json.data || []);
        setSelectedUnit(unit);
        setVisibleRows(10);
      } else {
        setError(json.error || "Error cargando datos");
      }
    } catch (err) {
      console.error("Error conectando con el servidor:", err);
      setError("Error conectando con el servidor");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ACTUALIZAR DATOS DE COMPARACIÓN AL CAMBIAR FECHAS O UNIDAD ---
useEffect(() => {
  if (compareModalOpen) {
    fetchCompareData();
  }
}, [startDate1, endDate1, startDate2, endDate2, selectedUnit, compareModalOpen]);


  // --- FILTRO DE BÚSQUEDA PRINCIPAL ---
  useEffect(() => {
    if (!searchText) setData(allData);
    else {
      const lower = searchText.toLowerCase();
      setData(allData.filter((row) => row.elemento.toLowerCase().includes(lower)));
    }
    setVisibleRows(10);
  }, [searchText, allData]);

  // --- MODAL DETALLE ---
  const handleRowClick = async (elemento) => {
    setModalTitle(elemento);
    setModalVisibleRows(10);
    setModalOpen(true);
    setLoadingModal(true);

    try {
      const url = new URL(
        `https://dahsboard-django.onrender.com/api/dashboard/click_detail/${encodeURIComponent(elemento)}/`
      );
      if (selectedUnit) url.searchParams.append("unit", selectedUnit);
      if (startDate) url.searchParams.append("start_date", startDate);
      if (endDate) url.searchParams.append("end_date", endDate);

      const res = await fetch(url.toString());
      const json = await res.json();
      if (res.ok) setModalData(json.data || []);
      else setModalData([]);
    } catch (err) {
      console.error("Error fetch modal:", err);
      setModalData([]);
    }
    setLoadingModal(false); 
  };

  const handleLoadMore = () => setVisibleRows((prev) => prev + 10);
  const handleModalLoadMore = () => setModalVisibleRows((prev) => prev + 10);


const handleSessionClick = async (session_id) => {
  setClickFlowSession(session_id);
  setClickFlowModalOpen(true);
  setLoadingClickFlow(true);
  try {
    const url = new URL(`https://dahsboard-django.onrender.com/api/dashboard/user_click_flow/`);
    url.searchParams.append("session_id", session_id);

    const res = await fetch(url.toString());
    const json = await res.json();
    if (res.ok) {
      const sortedData = (json.data || []).sort((a, b) => a.timestamp - b.timestamp);
      setClickFlowData(sortedData);
    } else setClickFlowData([]);
  } catch (err) {
    console.error("Error fetch click flow:", err);
    setClickFlowData([]);
  }
  setLoadingClickFlow(false);
};



  // --- FETCH DATOS PARA COMPARAR PERIODOS ---
  const fetchCompareData = async () => {
    setLoadingCompare(true);
    try {
      const formatDate = (d) => d.toISOString().slice(0, 10);
      const [res1, res2] = await Promise.all([
        fetch(`${API_URL}?start=${formatDate(startDate1)}&end=${formatDate(endDate1)}${selectedUnit ? `&unit=${selectedUnit}` : ""}`),
        fetch(`${API_URL}?start=${formatDate(startDate2)}&end=${formatDate(endDate2)}${selectedUnit ? `&unit=${selectedUnit}` : ""}`),
      ]);
      const json1 = await res1.json();
      const json2 = await res2.json();
      setPeriod1Data(json1.data || []);
      setPeriod2Data(json2.data || []);
    } catch (err) {
      console.error("Error comparando periodos:", err);
    }
    setLoadingCompare(false);
  };

  // --- FUNCION PARA CALCULAR DIFERENCIA PORCENTUAL ---
  const calcDiff = (val1, val2) => {
    if (val1 === 0) return val2 === 0 ? 0 : 100;
    return ((val2 - val1) / val1) * 100;
  };
const [startDate, setStartDate] = useState("2025-10-12");
const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); // hoy
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Dashboard Relacion Click Compras</h2>

      
<div className="mb-4 flex gap-2 items-end">
  <div>
    <label className="block text-sm font-medium mb-1">Fecha inicio:</label>
    <input
      type="date"
      className="border p-2 rounded"
      value={startDate}
      min="2025-10-12"
      max={endDate} // no puede pasar de la fecha final
      onChange={(e) => {
        setStartDate(e.target.value);
        fetchData(selectedUnit, e.target.value, endDate); // llamamos con rango
      }}
    />
  </div>
  <div>
    <label className="block text-sm font-medium mb-1">Fecha fin:</label>
    <input
      type="date"
      className="border p-2 rounded"
      value={endDate}
      min={startDate} // no puede ser menor que fecha inicio
      max={new Date().toISOString().slice(0, 10)}
      onChange={(e) => {
        setEndDate(e.target.value);
        fetchData(selectedUnit, startDate, e.target.value); // llamamos con rango
      }}
    />
  </div>
</div>

      {/* BOTONES FILTRO */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {["Terminales", "Tecnologia", "Migracion", "Portabilidad"].map((unit) => (
          <button
            key={unit}
            className={`px-4 py-2 rounded ${
              selectedUnit === unit ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => fetchData(unit)}
          >
            {unit}
          </button>
        ))}
        <button
          className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
          onClick={() => fetchData(null)}
        >
          Todos
        </button>
        <button
          className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
          onClick={() => { setCompareModalOpen(true); fetchCompareData(); }}
        >
          Comparar periodos
        </button>
      </div>

      {/* INPUT BÚSQUEDA */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre de elemento..."
          className="w-full p-2 border rounded"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>

      {loading && <p className="text-gray-600">⏳ Cargando datos...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* TABLA PRINCIPAL */}
      {!loading && !error && (
        <>
          <div className="mb-2 text-sm text-gray-600">Total en tabla: {data.length} elemento(s)</div>
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 font-bold">
              <tr>
                <th className="p-2 text-left">Nombre elemento</th>
                <th className="p-2">Imagen</th>
                <th className="p-2 text-center">Sesiones</th>
                <th className="p-2 text-center">Carritos</th>
                <th className="p-2 text-center">Compras</th>
                <th className="p-2 text-right">Ingresos</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, visibleRows).map((row, i) => (
                <tr
                  key={`${row.elemento}-${i}`}
                  className="border-t cursor-pointer hover:bg-gray-100"
                  onClick={() => handleRowClick(row.elemento)}
                >
                  <td className="p-2">{row.elemento}</td>
                  <td className="p-2 text-center">
                    {row.img_click_home && <img src={row.img_click_home} alt="" className="w-12 h-12 object-cover mx-auto" />}
                  </td>
                  <td className="p-2 text-center">{row.sesiones}</td>
                  <td className="p-2 text-center">{row.carritos}</td>
                  <td className="p-2 text-center">{row.compras}</td>
                  <td className="p-2 text-right">
                    {row.ingresos.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows < data.length && (
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleLoadMore}>
              Ver más ({data.length - visibleRows} restantes)
            </button>
          )}
        </>
      )}

{/* ================= MODAL DETALLE ================= */}
{modalOpen &&
  createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white p-6 rounded-lg w-2/3 max-h-[80vh] overflow-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button
            className="text-red-500 font-bold text-2xl"
            onClick={() => setModalOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar en detalle por transaction ID..."
            className="w-full p-2 border rounded"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        {loadingModal ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-b-4 border-gray-200"></div>
            <span className="ml-2 text-gray-600">Cargando detalle...</span>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Transaction ID</th>
                <th className="p-2 text-left">Items Purchased</th>
                <th className="p-2 text-left">Session ID</th>
                <th className="p-2 text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {modalData
                .filter((row) =>
                  row.transaction_id.toLowerCase().includes(searchText.toLowerCase())
                )
                .slice(0, modalVisibleRows)
                .map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{row.transaction_id}</td>
                    <td className="p-2">{row.items_purchased}</td>
                    <td
                      className={`p-2 cursor-pointer text-blue-600 hover:underline ${!row.has_click_flow ? "text-gray-400 cursor-not-allowed hover:underline-none" : ""}`}
                      onClick={() => row.has_click_flow ? handleSessionClick(row.session_id_final) : null}
                    >
                      {row.session_id_final}
                    </td>
                    <td className="p-2 text-right">
                      {row.valor.toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}

        {modalVisibleRows < modalData.length && !loadingModal && (
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleModalLoadMore}
          >
            Ver más ({modalData.length - modalVisibleRows} restantes)
          </button>
        )}
      </div>
    </div>,
    document.body
  )}

{/* ================= MODAL FLUJO DE CLICKS ================= */}
{clickFlowModalOpen &&
  createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[11000]">
      <div className="bg-white p-6 rounded-lg w-2/3 max-h-[80vh] overflow-auto relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Flujo de clicks - Sesión {clickFlowSession} ({clickFlowData.length} clicks)
          </h2>
          <button
            className="text-red-500 font-bold text-2xl"
            onClick={() => setClickFlowModalOpen(false)}
          >
            ×
          </button>
        </div>

        {loadingClickFlow ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-b-4 border-gray-200"></div>
            <span className="ml-2 text-gray-600">Cargando flujo de clicks...</span>
          </div>
        ) : clickFlowData.length === 0 ? (
          <p className="text-gray-600">No hay flujo de clicks disponible para esta sesión.</p>
        ) : (
          <div className="overflow-y-auto max-h-[60vh]">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Timestamp</th>
                  <th className="p-2 text-left">Evento</th>
                  <th className="p-2 text-left">Elemento clickeado</th>
                  <th className="p-2 text-right">% Scroll</th> {/* nueva columna */}
                </tr>
              </thead>
              <tbody>
                {clickFlowData
                .filter(click => click.detail !== "sin_valor")
                .map((click, i) => {
                  let formattedTimestamp = "-";
                  if (click.timestamp?.length === 12) {
                    const ts = click.timestamp;
                    const year = ts.slice(0, 4);
                    const month = ts.slice(4, 6);
                    const day = ts.slice(6, 8);
                    const hour = ts.slice(8, 10);
                    const minute = ts.slice(10, 12);
                    formattedTimestamp = `${day}/${month}/${year} ${hour}:${minute}`;
                  } else formattedTimestamp = click.timestamp || "-";
                  const scrollValue =
                    click.scrolls && click.scrolls.length > 0
                      ? click.scrolls
                          .map(s => parseInt(s))
                          .sort((a, b) => a - b)
                          .map(s => s + "%")
                          .join(" | ")
                      : "-"; 
                  return (
                    <tr key={i} className="border-t">
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2">{formattedTimestamp}</td>
                      <td className="p-2">{click.type}</td>
                      <td className="p-2 relative group">
                        <div className="truncate max-w-md">
                          {click.detail}
                        </div>
                        <div className="hidden group-hover:block absolute left-0 top-full mt-1 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50 max-w-lg break-all">
                          {click.detail}
                        </div>
                      </td>
                      <td className="p-2 text-right">{scrollValue}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>,
    document.body
  )}




{/* MODAL COMPARAR PERIODOS */}
{compareModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white w-full max-w-7xl p-6 rounded-lg max-h-[95vh]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Comparar Periodos</h2>
        <button className="text-red-500 font-bold text-3xl" onClick={() => setCompareModalOpen(false)}>×</button>
      </div>

      {/* LEYENDA */}
      <div className="mb-4 flex gap-4 items-center">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-300 border border-green-700"></div>
          <span className="text-sm">Elemento presente en ambos periodos</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-300 border border-red-700"></div>
          <span className="text-sm">Elemento presente solo en un periodo</span>
        </div>
      </div>

      {/* FILTRO DINÁMICO */}
      <div className="mb-4">
        <input
          type="text"
          className="border p-2 w-full rounded"
          placeholder="Filtrar por nombre de elemento..."
          value={compareSearchText}
          onChange={(e) => setCompareSearchText(e.target.value)}
        />
      </div>

      {/* INPUTS DE FECHA PARA AMBOS PERIODOS */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="flex gap-2">
          <input type="date" className="border p-2 rounded w-full" value={startDate1.toISOString().slice(0,10)} onChange={e => setStartDate1(new Date(e.target.value))}/>
          <input type="date" className="border p-2 rounded w-full" value={endDate1.toISOString().slice(0,10)} onChange={e => setEndDate1(new Date(e.target.value))}/>
        </div>
        <div className="flex gap-2">
          <input type="date" className="border p-2 rounded w-full" value={startDate2.toISOString().slice(0,10)} onChange={e => setStartDate2(new Date(e.target.value))}/>
          <input type="date" className="border p-2 rounded w-full" value={endDate2.toISOString().slice(0,10)} onChange={e => setEndDate2(new Date(e.target.value))}/>
        </div>
      </div>

      {loadingCompare ? (
        <p className="text-gray-600">⏳ Cargando datos...</p>
      ) : (
        (() => {
          const p1 = period1Data.filter(r => r.elemento && !["none", "(not set)"].includes(r.elemento.toLowerCase()));
          const p2 = period2Data.filter(r => r.elemento && !["none", "(not set)"].includes(r.elemento.toLowerCase()));

          const map1 = Object.fromEntries(p1.map(r => [r.elemento.toLowerCase().trim(), r]));
          const map2 = Object.fromEntries(p2.map(r => [r.elemento.toLowerCase().trim(), r]));

          const allKeys = Array.from(new Set([...Object.keys(map1), ...Object.keys(map2)]));
          const filteredKeys = allKeys.filter(key => key.includes(compareSearchText.toLowerCase()));

          // ---- ORDENAR POR INGRESOS DEL PERIODO 1 (DESCENDENTE) ----
          filteredKeys.sort((a, b) => {
            const ingresoA = map1[a] ? map1[a].ingresos : 0;
            const ingresoB = map1[b] ? map1[b].ingresos : 0;
            return ingresoB - ingresoA; // mayor a menor
          });

          const rowsPeriod1 = filteredKeys.map(key => {
  const row = map1[key] || { elemento: key, sesiones: 0, carritos: 0, compras: 0, ingresos: 0 };
  const match = map1[key] && map2[key];
  return (
    <tr
      key={key}
      className={`border-t h-12 ${match ? "bg-green-300" : "bg-red-300"} cursor-pointer hover:bg-gray-200`}
      onClick={() => handleRowClick(row.elemento)} // <-- Aquí reutilizamos handleRowClick
    >
      <td className="px-1 py-2 w-1/4">{row.elemento}</td>
      <td className="px-1 py-2 text-center w-1/6">{row.sesiones}</td>
      <td className="px-1 py-2 text-center w-1/6">{row.carritos}</td>
      <td className="px-1 py-2 text-center w-1/6">{row.compras}</td>
      <td className="px-1 py-2 text-right w-1/6">{row.ingresos.toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td>
    </tr>
  );
});

const rowsPeriod2 = filteredKeys.map(key => {
  const row = map2[key] || { elemento: key, sesiones: 0, carritos: 0, compras: 0, ingresos: 0 };
  const prev = map1[key] || null;
  const match = map1[key] && map2[key];

  let diffText = "N/A";
  let diffClass = "text-gray-500 font-bold";

  if (prev) {
    const diff = prev.ingresos === 0 ? (row.ingresos === 0 ? 0 : null) : ((row.ingresos - prev.ingresos)/prev.ingresos)*100;
    if (diff !== null) {
      diffText = diff.toFixed(0) + "%";
      diffClass = diff >= 0 ? "text-green-700 font-bold" : "text-red-700 font-bold";
    }
  }

  return (
    <tr
      key={key}
      className={`border-t h-12 ${match ? "bg-green-300" : "bg-red-300"} cursor-pointer hover:bg-gray-200`}
      onClick={() => handleRowClick(row.elemento)} // <-- Aquí también
    >
      <td className="px-1 py-2 w-1/4">{row.elemento}</td>
      <td className="px-1 py-2 text-center w-1/6">{row.sesiones}</td>
      <td className="px-1 py-2 text-center w-1/6">{row.carritos}</td>
      <td className="px-1 py-2 text-center w-1/6">{row.compras}</td>
      <td className="px-1 py-2 text-right w-1/6">{row.ingresos.toLocaleString("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0})}</td>
      <td className={`px-1 py-2 text-right w-1/6 ${diffClass}`}>{diffText}</td>
    </tr>
  );
});


          return (
            <div className="flex gap-4 overflow-y-auto max-h-[55vh]">
              <div className="w-1/2">
                <h3 className="text-lg font-semibold mb-2">Periodo 1</h3>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="px-1 py-2 text-left w-1/4">Elemento</th>
                      <th className="px-1 py-2 text-center w-1/6">Sesiones</th>
                      <th className="px-1 py-2 text-center w-1/6">Carritos</th>
                      <th className="px-1 py-2 text-center w-1/6">Compras</th>
                      <th className="px-1 py-2 text-right w-1/6">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>{rowsPeriod1}</tbody>
                </table>
              </div>

              <div className="w-1/2">
                <h3 className="text-lg font-semibold mb-2">Periodo 2</h3>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="px-1 py-2 text-left w-1/4">Elemento</th>
                      <th className="px-1 py-2 text-center w-1/6">Sesiones</th>
                      <th className="px-1 py-2 text-center w-1/6">Carritos</th>
                      <th className="px-1 py-2 text-center w-1/6">Compras</th>
                      <th className="px-1 py-2 text-right w-1/6">Ingresos</th>
                      <th className="px-1 py-2 text-right w-1/6">Δ%</th>
                    </tr>
                  </thead>
                  <tbody>{rowsPeriod2}</tbody>
                </table>
              </div>
            </div>
          );
        })()
      )}
    </div>
  </div>
)}





    </div>
  );
}
