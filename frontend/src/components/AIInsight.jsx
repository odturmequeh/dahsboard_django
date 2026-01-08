import React, { useState } from "react";

export default function AIInsight({ results }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");

  const API_URL = "/api/dashboard/ai-resources-analysis/";

 const generateInsight = async () => {
  if (!results) return;

  setLoading(true);
  setAnalysis("");

  try {

    const safeResources = JSON.parse(JSON.stringify(results?.resources || []));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resources: safeResources,
        url: results?.url || "",
      }),
    });

    if (!response.ok) throw new Error("Error generando análisis");

    const data = await response.json();
    setAnalysis(data.analysis);

  } catch (error) {
    setAnalysis("❌ Error conectando con la IA.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="bg-white p-6 rounded-2xl shadow mt-8">
      <h3 className="text-xl font-bold mb-4">🤖 Análisis Automático con IA</h3>

      <button
        onClick={generateInsight}
        disabled={loading}
        className="mt-2 bg-[#E60000] text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold disabled:bg-gray-300"
      >
        {loading ? "Generando análisis..." : "Generar análisis con IA"}
      </button>

      {analysis && (
        <div className="mt-4 bg-gray-50 border p-4 rounded-lg">
          <h4 className="font-bold mb-2">Resultado:</h4>
          <p className="whitespace-pre-line text-gray-800">{analysis}</p>
        </div>
      )}
    </div>
  );
}
