import React from "react";
import { useNavigate } from "react-router-dom";
export default function HomePage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white via-gray-100 to-gray-200 px-4">       
      <h1 className="text-5xl font-extrabold text-red-600 mb-4 text-center drop-shadow-md">
        Claro Data Analytics
      </h1>
      <p className="text-lg text-gray-700 mb-12 text-center max-w-xl">
        Bienvenido a la plataforma de análisis de datos de Claro. Aquí podrás explorar nuestros dashboards de comportamiento de usuarios y métricas clave.
      </p>
      <div className="flex gap-6 flex-col sm:flex-row flex-wrap justify-center">
        <button
          onClick={() => navigate("/click_relation")}
          className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl shadow-lg hover:from-red-700 hover:to-red-600 transition-all text-lg font-semibold"
        >
          Click Relation Dashboard
        </button>
        <button
          onClick={() => navigate("/timeLoad")}
          className="px-8 py-4 bg-gradient-to-r from-blue-700 to-blue-600 text-white rounded-xl shadow-lg hover:from-blue-800 hover:to-blue-700 transition-all text-lg font-semibold"
        >
          Load Time Dashboard
        </button>
        <button
          onClick={() => navigate("/genia")}
          className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-500 transition-all text-lg font-semibold"
        >
          Genia Dashboard
        </button>
        <button
          onClick={() => navigate("/PosPago")}
          className="px-8 py-4 bg-gradient-to-r from-red-600 to-orange-400 text-white rounded-xl shadow-lg hover:from-red-600 hover:to-orange-500 transition-all text-lg font-semibold"
        >
          PosPago Dashboard
        </button>
        <button
          onClick={() => navigate("/click_tracking")}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl shadow-lg hover:from-green-600 hover:to-green-500 transition-all text-lg font-semibold"
        >
          Migración Dashboard
        </button>
      </div>
      <footer className="mt-16 text-gray-500 text-sm">
         {new Date().getFullYear()} Claro | Todos los derechos reservados
      </footer>
    </div>
  );
}
