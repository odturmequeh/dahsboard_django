# dashboard/sql_queries/pospago_queries_optimized.py
"""
Queries optimizadas de Pospago basadas en las vistas de SQL Server
COMPLETO - Incluye endpoint de cortes del día
"""

# =============================================================================
# QUERY 1: METAS Y OBJETIVOS CON PROYECCIONES
# =============================================================================

QUERY_METAS_OBJETIVOS = """
WITH metas_consolidadas AS (
    SELECT
        YEAR(TRY_CAST(p.mes AS DATE)) as anio,
        MONTH(TRY_CAST(p.mes AS DATE)) as mes,
        SUM(COALESCE(p.migraciones, 0)) as meta_total_migra,
        SUM(COALESCE(p.portabilidad, 0)) as meta_total_porta,
        SUM(CASE WHEN p.descrip2 = 'ECOMMERCE CLARO MIGRACION' THEN COALESCE(p.portabilidad, 0) ELSE 0 END) as meta_porta_ecomm,
        SUM(CASE WHEN p.descrip2 = 'CLICK TO WSP PORTA' THEN COALESCE(p.portabilidad, 0) ELSE 0 END) as meta_ctw,
        SUM(CASE WHEN p.descrip2 = 'ECOMMERCE CLARO MIGRACION' THEN COALESCE(p.linea_nueva, 0) ELSE 0 END) as meta_linea_nueva,
        SUM(CASE WHEN p.descrip2 IN ('ECOMMERCE CLARO MIGRACION', 'CLICK TO WSP PORTA') 
            THEN COALESCE(p.migraciones, 0) + COALESCE(p.portabilidad, 0) + COALESCE(p.linea_nueva, 0) 
            ELSE 0 END) as meta_total
    FROM dbo.tb_presupuesto_fijo_movil p
    WHERE p.producto = 'MOVIL'
        AND p.jefe = 'RINCON CAVIELES LUISA FERNANDA'
        AND p.descrip2 IN ('ECOMMERCE CLARO MIGRACION', 'CLICK TO WSP PORTA')
    GROUP BY YEAR(TRY_CAST(p.mes AS DATE)), MONTH(TRY_CAST(p.mes AS DATE))
),
datos_base AS (
    SELECT
        m.anio,
        m.mes,
        m.meta_total,
        m.meta_total_migra,
        m.meta_total_porta,
        m.meta_porta_ecomm,
        m.meta_ctw,
        m.meta_linea_nueva,
        COALESCE(a.total_activadas, 0) as ejec_total,
        COALESCE(a.migraciones, 0) as ejec_total_migra,
        COALESCE(a.portabilidades, 0) as ejec_total_porta,
        COALESCE(a.portabilidades, 0) - COALESCE(a.ctw, 0) as ejec_porta_ecomm,
        COALESCE(a.ctw, 0) as ejec_ctw,
        COALESCE(a.linea_nueva, 0) as ejec_linea_nueva,
        -- Días Migra (normales)
        COALESCE(dh.dias_transcurridos, 0) as dias_transcurridos_migra,
        COALESCE(dh.dias_totales, 0) as dias_totales_migra,
        -- Días Porta/LN (totales -3, transcurridos igual)
        COALESCE(dh.dias_transcurridos, 0) as dias_transcurridos_porta,
        CASE WHEN COALESCE(dh.dias_totales, 0) - 3 < 0 THEN 0 
             ELSE COALESCE(dh.dias_totales, 0) - 3 END as dias_totales_porta
    FROM metas_consolidadas m
    LEFT JOIN dbo.vw_activadas_mes a ON m.anio = a.anio AND m.mes = a.mes
    LEFT JOIN dbo.vw_dias_habiles_mes dh ON m.anio = dh.anio AND m.mes = dh.mes
)
SELECT
    anio,
    mes,
    dias_transcurridos_migra,
    dias_totales_migra,
    dias_transcurridos_porta,
    dias_totales_porta,
    
    -- ========== TOTAL GENERAL ==========
    meta_total,
    ejec_total,
    CASE WHEN meta_total > 0 THEN ROUND(CAST(ejec_total AS FLOAT) / meta_total * 100, 1) ELSE 0 END as cumpl_total,
     CAST(
          (ejec_total_migra * (dias_totales_migra / NULLIF(dias_transcurridos_migra, 0)))
        + (ejec_total_porta * (dias_totales_porta / NULLIF(dias_transcurridos_porta, 0)))
        + (ejec_linea_nueva * (dias_totales_porta / NULLIF(dias_transcurridos_porta, 0)))
    AS DECIMAL(18,2)) AS proy_total,
    CASE WHEN meta_total > 0 AND dias_transcurridos_migra > 0 
        THEN ROUND((CAST(ejec_total AS FLOAT) * (CAST(dias_totales_migra AS FLOAT) / dias_transcurridos_migra)) / meta_total * 100, 1) 
        ELSE 0 END as cumpl_proy_total,
    CASE WHEN dias_transcurridos_migra > 0 THEN ROUND(CAST(ejec_total AS FLOAT) / dias_transcurridos_migra, 1) ELSE 0 END as prod_diaria_total,
    
    -- ========== MIGRACION TOTAL ==========
    meta_total_migra,
    ejec_total_migra,
    CASE WHEN meta_total_migra > 0 THEN ROUND(CAST(ejec_total_migra AS FLOAT) / meta_total_migra * 100, 1) ELSE 0 END as cumpl_total_migra,
    CASE WHEN dias_transcurridos_migra > 0 THEN ROUND(CAST(ejec_total_migra AS FLOAT) * (CAST(dias_totales_migra AS FLOAT) / dias_transcurridos_migra), 0) ELSE 0 END as proy_total_migra,
    CASE WHEN meta_total_migra > 0 AND dias_transcurridos_migra > 0 
        THEN ROUND((CAST(ejec_total_migra AS FLOAT) * (CAST(dias_totales_migra AS FLOAT) / dias_transcurridos_migra)) / meta_total_migra * 100, 1) 
        ELSE 0 END as cumpl_proy_total_migra,
    CASE WHEN dias_transcurridos_migra > 0 THEN ROUND(CAST(ejec_total_migra AS FLOAT) / dias_transcurridos_migra, 1) ELSE 0 END as prod_diaria_total_migra,
    
    -- ========== PORTABILIDAD TOTAL ==========
    meta_total_porta,
    ejec_total_porta,
    CASE WHEN meta_total_porta > 0 THEN ROUND(CAST(ejec_total_porta AS FLOAT) / meta_total_porta * 100, 1) ELSE 0 END as cumpl_total_porta,
    CASE WHEN dias_transcurridos_porta > 0 THEN ROUND(CAST(ejec_total_porta AS FLOAT) * (CAST(dias_totales_porta AS FLOAT) / dias_transcurridos_porta), 0) ELSE 0 END as proy_total_porta,
    CASE WHEN meta_total_porta > 0 AND dias_transcurridos_porta > 0 
        THEN ROUND((CAST(ejec_total_porta AS FLOAT) * (CAST(dias_totales_porta AS FLOAT) / dias_transcurridos_porta)) / meta_total_porta * 100, 1) 
        ELSE 0 END as cumpl_proy_total_porta,
    CASE WHEN dias_transcurridos_porta > 0 THEN ROUND(CAST(ejec_total_porta AS FLOAT) / dias_transcurridos_porta, 1) ELSE 0 END as prod_diaria_total_porta,
    
    -- ========== PORTABILIDAD ECOMMERCE ==========
    meta_porta_ecomm,
    ejec_porta_ecomm,
    CASE WHEN meta_porta_ecomm > 0 THEN ROUND(CAST(ejec_porta_ecomm AS FLOAT) / meta_porta_ecomm * 100, 1) ELSE 0 END as cumpl_porta_ecomm,
    CASE WHEN dias_transcurridos_porta > 0 THEN ROUND(CAST(ejec_porta_ecomm AS FLOAT) * (CAST(dias_totales_porta AS FLOAT) / dias_transcurridos_porta), 0) ELSE 0 END as proy_porta_ecomm,
    CASE WHEN meta_porta_ecomm > 0 AND dias_transcurridos_porta > 0 
        THEN ROUND((CAST(ejec_porta_ecomm AS FLOAT) * (CAST(dias_totales_porta AS FLOAT) / dias_transcurridos_porta)) / meta_porta_ecomm * 100, 1) 
        ELSE 0 END as cumpl_proy_porta_ecomm,
    CASE WHEN dias_transcurridos_porta > 0 THEN ROUND(CAST(ejec_porta_ecomm AS FLOAT) / dias_transcurridos_porta, 1) ELSE 0 END as prod_diaria_porta_ecomm,
    
    -- ========== CTW ==========
    meta_ctw,
    ejec_ctw,
    CASE WHEN meta_ctw > 0 THEN ROUND(CAST(ejec_ctw AS FLOAT) / meta_ctw * 100, 1) ELSE 0 END as cumpl_ctw,
    CASE WHEN dias_transcurridos_porta > 0 THEN ROUND(CAST(ejec_ctw AS FLOAT) * (CAST(dias_totales_porta AS FLOAT) / dias_transcurridos_porta), 0) ELSE 0 END as proy_ctw,
    CASE WHEN meta_ctw > 0 AND dias_transcurridos_porta > 0 
        THEN ROUND((CAST(ejec_ctw AS FLOAT) * (CAST(dias_totales_porta AS FLOAT) / dias_transcurridos_porta)) / meta_ctw * 100, 1) 
        ELSE 0 END as cumpl_proy_ctw,
    CASE WHEN dias_transcurridos_porta > 0 THEN ROUND(CAST(ejec_ctw AS FLOAT) / dias_transcurridos_porta, 1) ELSE 0 END as prod_diaria_ctw,
    
    -- ========== LINEA NUEVA ==========
    meta_linea_nueva as meta_ln,
    ejec_linea_nueva as ejec_ln,
    CASE WHEN meta_linea_nueva > 0 THEN ROUND(CAST(ejec_linea_nueva AS FLOAT) / meta_linea_nueva * 100, 1) ELSE 0 END as cumpl_ln,
    CASE WHEN dias_transcurridos_porta > 0 THEN ROUND(CAST(ejec_linea_nueva AS FLOAT) * (CAST(dias_totales_porta AS FLOAT) / dias_transcurridos_porta), 0) ELSE 0 END as proy_ln,
    CASE WHEN meta_linea_nueva > 0 AND dias_transcurridos_porta > 0 
        THEN ROUND((CAST(ejec_linea_nueva AS FLOAT) * (CAST(dias_totales_porta AS FLOAT) / dias_transcurridos_porta)) / meta_linea_nueva * 100, 1) 
        ELSE 0 END as cumpl_proy_ln,
    CASE WHEN dias_transcurridos_porta > 0 THEN ROUND(CAST(ejec_linea_nueva AS FLOAT) / dias_transcurridos_porta, 1) ELSE 0 END as prod_diaria_ln

FROM datos_base
WHERE anio = ? AND mes = ?
"""

# =============================================================================
# QUERY 2: CIERRE DEL DÍA ANTERIOR
# =============================================================================

QUERY_CIERRE_DIA_ANTERIOR = """
WITH datos_ayer AS (
    SELECT
        a.fecha as fecha,
        COALESCE(c.total_cantadas, 0) as cantadas_total,
        COALESCE(c.migraciones, 0) as migra_cantadas,
        COALESCE(c.portabilidades, 0) as porta_cantadas,
        COALESCE(c.linea_nueva, 0) as ln_cantadas,
        COALESCE(a.total_activadas, 0) as activadas_total,
        COALESCE(a.migraciones, 0) as migra_activadas,
        COALESCE(a.portabilidades, 0) as porta_activadas,
        COALESCE(a.portabilidades, 0) - COALESCE(a.ctw, 0) as porta_ecomm_activadas,
        COALESCE(a.linea_nueva, 0) as ln_activadas,
        COALESCE(a.ctw, 0) as ctw_activadas
    FROM dbo.vw_activadas_diario a
    LEFT JOIN dbo.vw_cantadas_diario c 
        ON CONVERT(VARCHAR(10), a.fecha, 120) = CONVERT(VARCHAR(10), c.fecha, 120)
    WHERE a.fecha = CAST(DATEADD(DAY, -1, GETDATE()) AS DATE)
),
datos_semana_ant AS (
    SELECT
        COALESCE(a.total_activadas, 0) as activadas_total,
        COALESCE(a.migraciones, 0) as migra_activadas,
        COALESCE(a.portabilidades, 0) as porta_activadas,
        COALESCE(a.ctw, 0) as ctw_activadas,
        COALESCE(a.linea_nueva, 0) as ln_activadas
    FROM dbo.vw_activadas_diario a
    WHERE a.fecha = CAST(DATEADD(DAY, -8, GETDATE()) AS DATE)
),
datos_mes_ant AS (
    SELECT
        COALESCE(a.total_activadas, 0) as activadas_total,
        COALESCE(a.migraciones, 0) as migra_activadas,
        COALESCE(a.portabilidades, 0) as porta_activadas,
        COALESCE(a.ctw, 0) as ctw_activadas,
        COALESCE(a.linea_nueva, 0) as ln_activadas
    FROM dbo.vw_activadas_diario a
    WHERE a.fecha = DATEADD(MONTH, -1, CAST(DATEADD(DAY, -1, GETDATE()) AS DATE))
)
SELECT
    d.fecha,
    d.cantadas_total,
    d.migra_cantadas,
    d.porta_cantadas,
    d.ln_cantadas,
    d.activadas_total,
    d.migra_activadas,
    d.porta_activadas,
    d.porta_ecomm_activadas,
    d.ctw_activadas,
    d.ln_activadas,
    CASE WHEN d.cantadas_total > 0 
         THEN ROUND(CAST(d.activadas_total AS FLOAT) / d.cantadas_total * 100, 1)
         ELSE 0 END as tasa_activacion,
    sa.activadas_total as activadas_semana_ant,
    CASE WHEN sa.activadas_total > 0
         THEN ROUND((CAST(d.activadas_total AS FLOAT) - sa.activadas_total) / sa.activadas_total * 100, 1)
         ELSE 0 END as var_semana_ant,
    ma.activadas_total as activadas_mes_ant,
    CASE WHEN ma.activadas_total > 0
         THEN ROUND((CAST(d.activadas_total AS FLOAT) - ma.activadas_total) / ma.activadas_total * 100, 1)
         ELSE 0 END as var_mes_ant
FROM datos_ayer d
CROSS JOIN datos_semana_ant sa
CROSS JOIN datos_mes_ant ma
"""

# =============================================================================
# QUERY 2B: CORTES DEL DÍA ACTUAL
# =============================================================================

QUERY_CORTES_DIA_HOY = """
SELECT
    CASE
        WHEN hora BETWEEN 0 AND 9 THEN '00-10'
        WHEN hora BETWEEN 10 AND 11 THEN '10-12'
        WHEN hora BETWEEN 12 AND 13 THEN '12-14'
        WHEN hora BETWEEN 14 AND 15 THEN '14-16'
        WHEN hora >= 16 THEN '16-24'
    END as corte,
    SUM(ventas_hora) as cantadas_franja,
    SUM(migraciones) as migra_franja,
    SUM(portabilidades) as porta_franja,
    SUM(linea_nueva) as ln_franja
FROM dbo.vw_cortes_dia_actual
GROUP BY
    CASE
        WHEN hora BETWEEN 0 AND 9 THEN '00-10'
        WHEN hora BETWEEN 10 AND 11 THEN '10-12'
        WHEN hora BETWEEN 12 AND 13 THEN '12-14'
        WHEN hora BETWEEN 14 AND 15 THEN '14-16'
        WHEN hora >= 16 THEN '16-24'
    END
ORDER BY corte
"""

# =============================================================================
# QUERY 3: EVOLUCIÓN DIARIA - CON META DIARIA DINÁMICA
# =============================================================================

QUERY_EVOLUCION_VENTAS = """
WITH metas AS (
    SELECT
        YEAR(TRY_CAST(p.mes AS DATE)) as anio,
        MONTH(TRY_CAST(p.mes AS DATE)) as mes,
        SUM(CASE WHEN p.descrip2 IN ('ECOMMERCE CLARO MIGRACION', 'CLICK TO WSP PORTA') 
            THEN COALESCE(p.migraciones, 0) + COALESCE(p.portabilidad, 0) + COALESCE(p.linea_nueva, 0) 
            ELSE 0 END) as meta_total,
        SUM(COALESCE(p.migraciones, 0)) as meta_migra,
        SUM(COALESCE(p.portabilidad, 0)) as meta_porta,
        SUM(CASE WHEN p.descrip2 = 'ECOMMERCE CLARO MIGRACION' 
            THEN COALESCE(p.linea_nueva, 0) ELSE 0 END) as meta_ln
    FROM dbo.tb_presupuesto_fijo_movil p
    WHERE p.producto = 'MOVIL'
        AND p.jefe = 'RINCON CAVIELES LUISA FERNANDA'
        AND p.descrip2 IN ('ECOMMERCE CLARO MIGRACION', 'CLICK TO WSP PORTA')
    GROUP BY YEAR(TRY_CAST(p.mes AS DATE)), MONTH(TRY_CAST(p.mes AS DATE))
),
dias_habiles AS (
    SELECT 
        anio, 
        mes, 
        dias_totales,
        dias_transcurridos
    FROM dbo.vw_dias_habiles_mes
),
ejecucion_acumulada AS (
    SELECT
        YEAR(fecha) as anio,
        MONTH(fecha) as mes,
        SUM(total_activadas) as ejec_acumulada
    FROM dbo.vw_activadas_diario
    WHERE YEAR(fecha) = ?
      AND MONTH(fecha) = ?
    GROUP BY YEAR(fecha), MONTH(fecha)
),
evolucion AS (
    SELECT
        a.fecha,
        COALESCE(c.total_cantadas, 0) as V9_total,
        COALESCE(c.migraciones, 0) as V9_migra,
        COALESCE(c.portabilidades, 0) as V9_porta,
        COALESCE(a.total_activadas, 0) as R5_total,
        COALESCE(a.migraciones, 0) as R5_migra,
        COALESCE(a.portabilidades, 0) as R5_porta,
        COALESCE(a.ctw, 0) as R5_ctw,
        COALESCE(a.linea_nueva, 0) as R5_ln,
        m.meta_total,
        dh.dias_totales,
        dh.dias_transcurridos,
        ea.ejec_acumulada,
        -- Meta diaria = (meta - ejecucion_acumulada) / dias_restantes
        CASE 
            WHEN (dh.dias_totales - dh.dias_transcurridos) > 0 
            THEN ROUND(CAST((m.meta_total - COALESCE(ea.ejec_acumulada, 0)) AS FLOAT) / (dh.dias_totales - dh.dias_transcurridos), 1)
            ELSE ROUND(CAST(m.meta_total AS FLOAT) / dh.dias_totales, 1)
        END as meta_diaria_total,
        ROUND(CAST(m.meta_migra AS FLOAT) / dh.dias_totales, 1) as meta_diaria_migra,
        ROUND(CAST(m.meta_porta AS FLOAT) / (dh.dias_totales - 3), 1) as meta_diaria_porta,
        ROUND(CAST(m.meta_ln AS FLOAT) / (dh.dias_totales - 3), 1) as meta_diaria_ln
    FROM dbo.vw_activadas_diario a
    LEFT JOIN dbo.vw_cantadas_diario c 
        ON CONVERT(VARCHAR(10), a.fecha, 120) = CONVERT(VARCHAR(10), c.fecha, 120)
    CROSS JOIN metas m
    CROSS JOIN dias_habiles dh
    LEFT JOIN ejecucion_acumulada ea ON m.anio = ea.anio AND m.mes = ea.mes
    WHERE YEAR(a.fecha) = ? 
      AND MONTH(a.fecha) = ?
      AND m.anio = ?
      AND m.mes = ?
      AND dh.anio = ?
      AND dh.mes = ?
)
SELECT
    fecha,
    R5_total,
    R5_migra,
    R5_porta,
    R5_ctw,
    R5_ln,
    V9_total,
    V9_migra,
    V9_porta,
    meta_diaria_total,
    meta_diaria_migra,
    meta_diaria_porta,
    meta_diaria_ln,
    ROUND(AVG(CAST(R5_total AS FLOAT)) OVER (), 1) as promedio_r5,
    ROUND(AVG(CAST(V9_total AS FLOAT)) OVER (), 1) as promedio_v9,
    ROUND(AVG(CAST(meta_diaria_total AS FLOAT)) OVER (), 1) as promedio_meta
FROM evolucion
ORDER BY fecha
"""

# =============================================================================
# QUERY 4: DESGLOSE SEMANAL - CON CUMPLIMIENTO
# =============================================================================

QUERY_DESGLOSE_SEMANAL = """
WITH metas AS (
    SELECT
        YEAR(TRY_CAST(p.mes AS DATE)) as anio,
        MONTH(TRY_CAST(p.mes AS DATE)) as mes,
        SUM(CASE WHEN p.descrip2 IN ('ECOMMERCE CLARO MIGRACION', 'CLICK TO WSP PORTA') 
            THEN COALESCE(p.migraciones, 0) + COALESCE(p.portabilidad, 0) + COALESCE(p.linea_nueva, 0) 
            ELSE 0 END) as meta_total
    FROM dbo.tb_presupuesto_fijo_movil p
    WHERE p.producto = 'MOVIL'
        AND p.jefe = 'RINCON CAVIELES LUISA FERNANDA'
        AND p.descrip2 IN ('ECOMMERCE CLARO MIGRACION', 'CLICK TO WSP PORTA')
    GROUP BY YEAR(TRY_CAST(p.mes AS DATE)), MONTH(TRY_CAST(p.mes AS DATE))
),
dias_habiles AS (
    SELECT anio, mes, dias_totales
    FROM dbo.vw_dias_habiles_mes
),
ventas_semanales AS (
    SELECT
        DATEPART(WEEK, fecha) as semana,
        MIN(fecha) as fecha_inicio,
        MAX(fecha) as fecha_fin,
        COUNT(DISTINCT fecha) as dias_semana,
        SUM(migraciones) as migraciones,
        SUM(portabilidades) as portabilidades_total,
        SUM(portabilidades) - SUM(ctw) as porta_ecommerce,
        SUM(ctw) as ctw,
        SUM(linea_nueva) as linea_nueva,
        SUM(total_activadas) as total
    FROM dbo.vw_activadas_diario
    WHERE YEAR(fecha) = ?
      AND MONTH(fecha) = ?
    GROUP BY DATEPART(WEEK, fecha)
)
SELECT
    vs.semana,
    vs.fecha_inicio,
    vs.fecha_fin,
    vs.migraciones,
    vs.portabilidades_total,
    vs.porta_ecommerce,
    vs.ctw,
    vs.linea_nueva,
    vs.total,
    vs.dias_semana,
    -- Meta semanal proporcional
    ROUND(CAST(m.meta_total AS FLOAT) / dh.dias_totales * vs.dias_semana, 1) as meta_semana,
    -- Cumplimiento
    CASE 
        WHEN (ROUND(CAST(m.meta_total AS FLOAT) / dh.dias_totales * vs.dias_semana, 1)) > 0
        THEN ROUND(CAST(vs.total AS FLOAT) / (CAST(m.meta_total AS FLOAT) / dh.dias_totales * vs.dias_semana) * 100, 1)
        ELSE 0
    END as cumplimiento
FROM ventas_semanales vs
CROSS JOIN metas m
CROSS JOIN dias_habiles dh
WHERE m.anio = ?
  AND m.mes = ?
  AND dh.anio = ?
  AND dh.mes = ?
ORDER BY vs.semana
"""

# =============================================================================
# QUERY 5: MAPA DE CALOR
# =============================================================================

QUERY_MAPA_CALOR = """
SELECT
    DATEDIFF(WEEK, DATEFROMPARTS(YEAR(fecha), MONTH(fecha), 1), fecha) + 1 as semana_mes,
    DATEPART(WEEKDAY, fecha) as dia_semana_num,
    CASE DATEPART(WEEKDAY, fecha)
        WHEN 1 THEN 'D'
        WHEN 2 THEN 'L'
        WHEN 3 THEN 'M'
        WHEN 4 THEN 'X'
        WHEN 5 THEN 'J'
        WHEN 6 THEN 'V'
        WHEN 7 THEN 'S'
    END as dia_semana,
    total_activadas as cantidad
FROM dbo.vw_activadas_diario
WHERE YEAR(fecha) = ?
  AND MONTH(fecha) = ?
  AND fecha < CAST(GETDATE() AS DATE)
ORDER BY semana_mes, dia_semana_num
"""

# =============================================================================
# QUERY 6: RESUMEN MAPA DE CALOR
# =============================================================================

QUERY_MAPA_CALOR_RESUMEN = """
WITH datos AS (
    SELECT
        DATEDIFF(WEEK, DATEFROMPARTS(YEAR(fecha), MONTH(fecha), 1), fecha) + 1 as semana_mes,
        CASE DATEPART(WEEKDAY, fecha)
            WHEN 1 THEN 'Domingo'
            WHEN 2 THEN 'Lunes'
            WHEN 3 THEN 'Martes'
            WHEN 4 THEN 'Miércoles'
            WHEN 5 THEN 'Jueves'
            WHEN 6 THEN 'Viernes'
            WHEN 7 THEN 'Sábado'
        END as dia_semana,
        total_activadas
    FROM dbo.vw_activadas_diario
    WHERE YEAR(fecha) = ?
      AND MONTH(fecha) = ?
      AND fecha < CAST(GETDATE() AS DATE)
)
SELECT
    (SELECT TOP 1 'Semana ' + CAST(semana_mes AS VARCHAR) 
     FROM datos GROUP BY semana_mes ORDER BY SUM(total_activadas) DESC) as mejor_semana,
    (SELECT TOP 1 dia_semana 
     FROM datos GROUP BY dia_semana ORDER BY SUM(total_activadas) DESC) as mejor_dia,
    SUM(total_activadas) as total_R5
FROM datos
"""

# =============================================================================
# QUERY 7: COMPARATIVO CANTADAS VS ACTIVADAS
# =============================================================================

QUERY_COMPARATIVO_CANTADAS_ACTIVADAS = """
SELECT
    'Total Pospago' as tipo,
    COALESCE(c.total_cantadas, 0) as cantadas,
    COALESCE(a.total_activadas, 0) as activadas,
    CASE WHEN COALESCE(c.total_cantadas, 0) > 0 
         THEN ROUND(CAST(COALESCE(a.total_activadas, 0) AS FLOAT) / c.total_cantadas * 100, 1)
         ELSE 0 END as tasa_activacion
FROM dbo.vw_cantadas_mes c
FULL OUTER JOIN dbo.vw_activadas_mes a ON c.anio = a.anio AND c.mes = a.mes
WHERE COALESCE(c.anio, a.anio) = ?
  AND COALESCE(c.mes, a.mes) = ?

UNION ALL

SELECT
    'Migraciones',
    COALESCE(c.migraciones, 0),
    COALESCE(a.migraciones, 0),
    CASE WHEN COALESCE(c.migraciones, 0) > 0 
         THEN ROUND(CAST(COALESCE(a.migraciones, 0) AS FLOAT) / c.migraciones * 100, 1)
         ELSE 0 END
FROM dbo.vw_cantadas_mes c
FULL OUTER JOIN dbo.vw_activadas_mes a ON c.anio = a.anio AND c.mes = a.mes
WHERE COALESCE(c.anio, a.anio) = ?
  AND COALESCE(c.mes, a.mes) = ?

UNION ALL

SELECT
    'Portabilidad Total',
    COALESCE(c.portabilidades, 0),
    COALESCE(a.portabilidades, 0),
    CASE WHEN COALESCE(c.portabilidades, 0) > 0 
         THEN ROUND(CAST(COALESCE(a.portabilidades, 0) AS FLOAT) / c.portabilidades * 100, 1)
         ELSE 0 END
FROM dbo.vw_cantadas_mes c
FULL OUTER JOIN dbo.vw_activadas_mes a ON c.anio = a.anio AND c.mes = a.mes
WHERE COALESCE(c.anio, a.anio) = ?
  AND COALESCE(c.mes, a.mes) = ?

UNION ALL

SELECT
    'Porta Ecommerce',
    COALESCE(c.portabilidades, 0),
    COALESCE(a.portabilidades, 0) - COALESCE(a.ctw, 0),
    CASE WHEN COALESCE(c.portabilidades, 0) > 0 
         THEN ROUND(CAST(COALESCE(a.portabilidades, 0) - COALESCE(a.ctw, 0) AS FLOAT) / c.portabilidades * 100, 1)
         ELSE 0 END
FROM dbo.vw_cantadas_mes c
FULL OUTER JOIN dbo.vw_activadas_mes a ON c.anio = a.anio AND c.mes = a.mes
WHERE COALESCE(c.anio, a.anio) = ?
  AND COALESCE(c.mes, a.mes) = ?

UNION ALL

SELECT
    'CTW',
    0,
    COALESCE(a.ctw, 0),
    0
FROM dbo.vw_activadas_mes a
WHERE a.anio = ?
  AND a.mes = ?

UNION ALL

SELECT
    'Linea Nueva',
    COALESCE(c.linea_nueva, 0),
    COALESCE(a.linea_nueva, 0),
    CASE WHEN COALESCE(c.linea_nueva, 0) > 0 
         THEN ROUND(CAST(COALESCE(a.linea_nueva, 0) AS FLOAT) / c.linea_nueva * 100, 1)
         ELSE 0 END
FROM dbo.vw_cantadas_mes c
FULL OUTER JOIN dbo.vw_activadas_mes a ON c.anio = a.anio AND c.mes = a.mes
WHERE COALESCE(c.anio, a.anio) = ?
  AND COALESCE(c.mes, a.mes) = ?
"""