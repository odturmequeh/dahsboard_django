// hooks/usePospagoData.js
import { useState, useEffect, useCallback } from 'react';

// URL de la API - Cambiar según entorno
const API_BASE_URL = 'http://localhost:8000/api/pospago';
// Para producción, cambia a: const API_BASE_URL = 'https://tu-dominio.com/api/pospago';

/**
 * Hook personalizado para consumir datos del dashboard de pospago
 */
export function usePospagoData(filtros = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Construir parámetros de la URL
      const params = new URLSearchParams();
      
      if (filtros.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
      if (filtros.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
      if (filtros.tipo_venta) params.append('tipo_venta', filtros.tipo_venta);

      // Llamar al endpoint de dashboard completo
      const url = `${API_BASE_URL}/dashboard-completo/?${params.toString()}`;
      console.log('📡 Llamando API:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
      }

      const jsonData = await response.json();
      console.log('✅ Datos recibidos:', jsonData);

      setData(jsonData);
      
    } catch (err) {
      console.error('❌ Error en API:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtros.fecha_inicio, filtros.fecha_fin, filtros.tipo_venta]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

/**
 * Hook para obtener solo las metas
 */
export function useMetasObjetivos(anio, mes, filtros = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetas = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams();
        params.append('anio', anio);
        params.append('mes', mes);
        if (filtros.tipo_venta) params.append('tipo_venta', filtros.tipo_venta);

        const response = await fetch(`${API_BASE_URL}/metas/?${params.toString()}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetas();
  }, [anio, mes, filtros.tipo_venta]);

  return { data, loading, error };
}