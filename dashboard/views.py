
from datetime import datetime, timedelta
import os
from django.http import JsonResponse
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Metric, Dimension, RunReportRequest, FilterExpression, Filter, FilterExpressionList
from urllib.parse import urlparse
from django.views.decorators.csrf import csrf_exempt
from collections import defaultdict
import json
from django.views.decorators.http import require_GET
import re


def ga4_dashboard_metrics(request):

    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path:
            return JsonResponse({"error": "GA4_CREDENTIALS_JSON no está definido"}, status=500)

        if not property_id:
            return JsonResponse({"error": "GA4_PROPERTY_ID no está definido"}, status=500)

        # Leer fechas del query string: ?start=YYYY-MM-DD&end=YYYY-MM-DD
        start_date = request.GET.get("start", "7daysAgo")
        end_date = request.GET.get("end", "today")

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                metrics=[
                    Metric(name="sessions"),
                    Metric(name="itemsPurchased"),
                    Metric(name="purchaseRevenue"),
                    
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
            )
        )

        row = response.rows[0]

        return JsonResponse({
            "sessions": int(row.metric_values[0].value),
            "items": int(row.metric_values[1].value),
            "revenue": float(row.metric_values[2].value),
        })

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    


def ga4_dashboard_daily_metrics(request):
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales o property ID no definidas"}, status=500)

        # Fechas
        start_date = request.GET.get("start")
        end_date = request.GET.get("end")
        if not start_date or not end_date:
            end_date_obj = datetime.today()
            start_date_obj = end_date_obj - timedelta(days=6)
            start_date = start_date_obj.strftime("%Y-%m-%d")
            end_date = end_date_obj.strftime("%Y-%m-%d")

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[Dimension(name="date")],
                metrics=[
                    Metric(name="customEvent:loading_time_sec"),  # TOTAL del tiempo
                    Metric(name="countCustomEvent:loading_time_sec"),                   # CANTIDAD de eventos
                    Metric(name="keyEvents:purchase"),           # Items comprados
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
            )
        )

        data = []
        for row in response.rows:
            total_loading_time = float(row.metric_values[0].value)
            total_events = int(row.metric_values[1].value)
            items = int(row.metric_values[2].value)

            avg_load_time = total_loading_time / total_events if total_events > 0 else 0

            data.append({
                "date": row.dimension_values[0].value,
                "avg_load_time": round(avg_load_time, 2),
                "items": items,
            })

        return JsonResponse(data, safe=False)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
   


def ga4_load_time_by_device_and_hour(request):

    """
    Obtiene el tiempo promedio de carga agrupado por hora del día
    y por categoría de dispositivo (mobile, desktop, tablet).
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales o property ID no definidas"}, status=500)

        # 1. Definir fechas
        start_date = request.GET.get("start")
        end_date = request.GET.get("end")
        if not start_date or not end_date:
            end_date_obj = datetime.today()
            start_date_obj = end_date_obj - timedelta(days=6)
            start_date = start_date_obj.strftime("%Y-%m-%d")
            end_date = end_date_obj.strftime("%Y-%m-%d")

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # 2. Definir las dimensiones y métricas
        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="hour"),
                    Dimension(name="deviceCategory"),
                ],
                metrics=[
                    Metric(name="customEvent:loading_time_sec"),
                    Metric(name="countCustomEvent:loading_time_sec"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
            )
        )

        # 3. Procesar la respuesta
        processed_data = []
        for row in response.rows:
            hour = row.dimension_values[0].value
            device_category = row.dimension_values[1].value

            # ✅ FILTRAR valores no numéricos en 'hour'
            if hour == "(other)" or not hour.isdigit():
                continue
            
            # ✅ FILTRAR categorías de dispositivo no deseadas (opcional)
            valid_devices = ["mobile", "desktop"]
            if device_category.lower() not in valid_devices:
                continue

            try:
                total_loading_time = float(row.metric_values[0].value)
                total_events = int(row.metric_values[1].value)
            except (ValueError, IndexError):
                continue

            # Calcular el tiempo promedio de carga
            avg_load_time = total_loading_time / total_events if total_events > 0 else 0

            processed_data.append({
                "hour": int(hour),
                "deviceCategory": device_category,
                "avg_load_time": round(avg_load_time, 2),
            })

        return JsonResponse(processed_data, safe=False)

    except Exception as e:
        print(f"Error en GA4: {e}")
        return JsonResponse({"error": str(e)}, status=500)
    


def ga4_funnel_data(request):
    """
    Obtiene datos del embudo de marketing agrupados por etapa del funnel.
    Calcula tiempos promedio por dispositivo y URLs más visitadas por etapa.
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales o property ID no definidas"}, status=500)

        # 1. Definir fechas
        start_date = request.GET.get("start")
        end_date = request.GET.get("end")
        if not start_date or not end_date:
            end_date_obj = datetime.today()
            start_date_obj = end_date_obj - timedelta(days=28)
            start_date = start_date_obj.strftime("%Y-%m-%d")
            end_date = end_date_obj.strftime("%Y-%m-%d")

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # 2. Definir las dimensiones y métricas
        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="deviceCategory"),
                    Dimension(name="pagePath"),
                ],
                metrics=[
                    Metric(name="screenPageViews"),
                    Metric(name="eventCount"),
                    Metric(name="userEngagementDuration"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                limit=10000,  # Aumentar límite para obtener más datos
            )
        )

        # 3. Definir patrones de etapas del funnel
        interes = ["detalle-producto/", "claro/", "results", "login", "resetpassword"]
        consideracion = ["cart", "delivery", "payments", "pago-a-cuotas", "validacion-otp", 
                        "datos-personales-prepost", "postpago/cambiate-con-tu-mismo-numero/",
                        "prepago/cambiate-con-tu-mismo-numero/datos-personales"]
        conversion = ["thankyou", "resumen-pedido-prepost", "resumen-pedido"]

        def get_stage(page_path):
            """Determina la etapa del funnel basándose en la URL"""
            path_lower = page_path.lower()
            
            if path_lower in ["/", "", "tienda.claro.com.co"]:
                return "Atracción"
            elif any(pattern in path_lower for pattern in conversion):
                return "Conversión"
            elif any(pattern in path_lower for pattern in consideracion):
                return "Consideración"
            elif any(pattern in path_lower for pattern in interes):
                return "Interés"
            else:
                return "Interés"  # Por defecto

        # 4. Procesar la respuesta
        funnel_data = {
            "Atracción": {"vistas": 0, "eventos": 0, "total_time": 0, "count": 0, 
                         "desktop_time": 0, "mobile_time": 0, "desktop_count": 0, "mobile_count": 0,
                         "urls": {}},
            "Interés": {"vistas": 0, "eventos": 0, "total_time": 0, "count": 0,
                       "desktop_time": 0, "mobile_time": 0, "desktop_count": 0, "mobile_count": 0,
                       "urls": {}},
            "Consideración": {"vistas": 0, "eventos": 0, "total_time": 0, "count": 0,
                             "desktop_time": 0, "mobile_time": 0, "desktop_count": 0, "mobile_count": 0,
                             "urls": {}},
            "Conversión": {"vistas": 0, "eventos": 0, "total_time": 0, "count": 0,
                          "desktop_time": 0, "mobile_time": 0, "desktop_count": 0, "mobile_count": 0,
                          "urls": {}},
        }

        for row in response.rows:
            device_category = row.dimension_values[0].value.lower()
            page_path = row.dimension_values[1].value

            # Filtrar solo desktop y mobile
            if device_category not in ["desktop", "mobile"]:
                continue

            try:
                vistas = int(row.metric_values[0].value)
                eventos = int(row.metric_values[1].value)
                tiempo_total = float(row.metric_values[2].value)
            except (ValueError, IndexError):
                continue

            # Calcular tiempo promedio por vista
            tiempo_promedio = tiempo_total / vistas if vistas > 0 else 0

            # Determinar etapa del funnel
            stage = get_stage(page_path)
            stage_data = funnel_data[stage]

            # Agregar datos a la etapa
            stage_data["vistas"] += vistas
            stage_data["eventos"] += eventos
            stage_data["total_time"] += tiempo_promedio
            stage_data["count"] += 1

            # Agregar datos por dispositivo
            if device_category == "desktop":
                stage_data["desktop_time"] += tiempo_promedio
                stage_data["desktop_count"] += 1
            elif device_category == "mobile":
                stage_data["mobile_time"] += tiempo_promedio
                stage_data["mobile_count"] += 1

            # Agregar datos de URL
            if page_path not in stage_data["urls"]:
                stage_data["urls"][page_path] = {
                    "vistas": 0,
                    "total_time": 0,
                    "count": 0,
                    "desktop_time": 0,
                    "mobile_time": 0,
                    "desktop_count": 0,
                    "mobile_count": 0,
                }

            url_data = stage_data["urls"][page_path]
            url_data["vistas"] += vistas
            url_data["total_time"] += tiempo_promedio
            url_data["count"] += 1

            if device_category == "desktop":
                url_data["desktop_time"] += tiempo_promedio
                url_data["desktop_count"] += 1
            elif device_category == "mobile":
                url_data["mobile_time"] += tiempo_promedio
                url_data["mobile_count"] += 1

        # 5. Formatear respuesta
        result = []
        for stage, data in funnel_data.items():
            # Calcular promedios
            avg_time = data["total_time"] / data["count"] if data["count"] > 0 else 0
            avg_desktop = data["desktop_time"] / data["desktop_count"] if data["desktop_count"] > 0 else 0
            avg_mobile = data["mobile_time"] / data["mobile_count"] if data["mobile_count"] > 0 else 0

            # Calcular top URLs
            total_vistas_stage = data["vistas"]
            top_urls = []
            for url, url_data in data["urls"].items():
                percentage = (url_data["vistas"] / total_vistas_stage * 100) if total_vistas_stage > 0 else 0
                avg_url_time = url_data["total_time"] / url_data["count"] if url_data["count"] > 0 else 0
                avg_url_desktop = url_data["desktop_time"] / url_data["desktop_count"] if url_data["desktop_count"] > 0 else 0
                avg_url_mobile = url_data["mobile_time"] / url_data["mobile_count"] if url_data["mobile_count"] > 0 else 0

                top_urls.append({
                    "url": url,
                    "percentage": round(percentage, 2),
                    "avg_time": round(avg_url_time, 2),
                    "desktop_time": round(avg_url_desktop, 2),
                    "mobile_time": round(avg_url_mobile, 2),
                })

            # Ordenar URLs por porcentaje descendente
            top_urls.sort(key=lambda x: x["percentage"], reverse=True)

            result.append({
                "stage": stage,
                "vistas": data["vistas"],
                "eventos": data["eventos"],
                "avg_time": round(avg_time, 2),
                "desktop_time": round(avg_desktop, 2),
                "mobile_time": round(avg_mobile, 2),
                "top_urls": top_urls,
            })

        return JsonResponse(result, safe=False)

    except Exception as e:
        print(f"Error en GA4 Funnel: {e}")
        return JsonResponse({"error": str(e)}, status=500)



#----------------------------------

'''def ga4_page_resources(request):
    """
    Optimizado para entornos de muy baja RAM como Render:
    - No usa diccionarios anidados
    - No acumula estructuras de gran tamaño
    - 3 consultas separadas
    - Solo guarda lo estrictamente necesario
    - LIMITA LA RESPUESTA A LOS 100 RECURSOS MAS LENTOS
    """
    try:

        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales o Property ID faltantes"}, status=500)

        # -------------------------
        # Parámetros
        # -------------------------
        search_url = request.GET.get("url")
        if not search_url:
            return JsonResponse({"error": "Parámetro ?url requerido"}, status=400)

        start_date = request.GET.get("start")
        end_date = request.GET.get("end")

        if not start_date or not end_date:
            end_date_obj = datetime.today()
            start_date_obj = end_date_obj - timedelta(days=28)
            start_date = start_date_obj.strftime("%Y-%m-%d")
            end_date = end_date_obj.strftime("%Y-%m-%d")

        # -------------------------
        # Normalizar URL
        # -------------------------
        def normalize(url):
            try:
                if not url.startswith("http"):
                    url = "https://" + url
                p = urlparse(url)
                return f"{p.scheme}://{p.netloc}{p.path.rstrip('/')}"
            except:
                return url.split("?")[0]

        normalized_search = normalize(search_url.lower())

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # Filtro común
        event_filter = FilterExpression(
            filter=Filter(
                field_name="eventName",
                string_filter=Filter.StringFilter(
                    match_type=Filter.StringFilter.MatchType.EXACT,
                    value="resource_performance"
                )
            )
        )

        # ==============================================================
        # 1) CONSULTA A → Datos generales
        # ==============================================================
        res_general = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:page_location_loadPage"),
                    Dimension(name="customEvent:resource_name_loadPage"),
                    Dimension(name="customEvent:resource_type_loadPage"),
                ],
                metrics=[
                    Metric(name="eventCount"),
                    Metric(name="customEvent:total_duration_loadPage"),
                    Metric(name="customEvent:resource_total_size_loadPage"),
                    Metric(name="customEvent:resource_repeat_count_loadPage"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter=event_filter,
                limit=5000
            )
        )

        summary = {}

        # Procesar consulta A
        for row in res_general.rows:
            page = row.dimension_values[0].value
            if normalize(page.lower()) != normalized_search:
                continue

            name = row.dimension_values[1].value
            type_ = row.dimension_values[2].value

            evt = float(row.metric_values[0].value or 0)
            dur = float(row.metric_values[1].value or 0)
            size = float(row.metric_values[2].value or 0)
            rep = float(row.metric_values[3].value or 0)

            if name not in summary:
                summary[name] = {
                    "type": type_,
                    "event_count": 0,
                    "duration_total": 0,
                    "size_total": 0,
                    "repeat_total": 0,
                    "hourly": {},
                    "daily": {}
                }

            r = summary[name]
            r["event_count"] += evt
            r["duration_total"] += dur
            r["size_total"] += size
            r["repeat_total"] += rep

        # ==============================================================
        # 2) CONSULTA B → Promedio por hora
        # ==============================================================
        res_hour = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:page_location_loadPage"),
                    Dimension(name="customEvent:resource_name_loadPage"),
                    Dimension(name="hour"),
                ],
                metrics=[
                    Metric(name="eventCount"),
                    Metric(name="customEvent:resource_total_duration_loadPage"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter=event_filter,
                limit=5000
            )
        )

        for row in res_hour.rows:
            page = row.dimension_values[0].value
            if normalize(page.lower()) != normalized_search:
                continue

            name = row.dimension_values[1].value
            hour = row.dimension_values[2].value

            if name not in summary:
                continue

            evt = float(row.metric_values[0].value or 0)
            dur = float(row.metric_values[1].value or 0)

            if evt > 0:
                summary[name]["hourly"][hour] = round(dur / evt, 3)

        # ==============================================================
        # 3) CONSULTA C → Promedio por día
        # ==============================================================
        res_day = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:page_location_loadPage"),
                    Dimension(name="customEvent:resource_name_loadPage"),
                    Dimension(name="date"),
                ],
                metrics=[
                    Metric(name="eventCount"),
                    Metric(name="customEvent:resource_total_duration_loadPage"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter=event_filter,
                limit=5000
            )
        )

        for row in res_day.rows:
            page = row.dimension_values[0].value
            if normalize(page.lower()) != normalized_search:
                continue

            name = row.dimension_values[1].value
            date = row.dimension_values[2].value

            if name not in summary:
                continue

            evt = float(row.metric_values[0].value or 0)
            dur = float(row.metric_values[1].value or 0)

            if evt > 0:
                summary[name]["daily"][date] = round(dur / evt, 3)

        # ==============================================================
        # SALIDA → SOLO LOS 100 MÁS LENTOS
        # ==============================================================
        resources = []

        for name, r in summary.items():
            if r["event_count"] > 0:
                duration_avg = r["duration_total"] / r["event_count"]
                repeat_avg = r["repeat_total"] / r["event_count"]
                size_avg = r["size_total"] / r["event_count"]
            else:
                duration_avg = repeat_avg = size_avg = 0

            resources.append({
                "name": name,
                "type": r["type"],
                "duration_avg": round(duration_avg, 3),
                "repeat_avg": round(repeat_avg, 3),
                "size_avg": round(size_avg / 1024, 2),
                "hourly": r["hourly"],
                "daily": r["daily"],
            })

        # Ordenar por duración
        resources.sort(key=lambda x: x["duration_avg"], reverse=True)

        # <<< SOLO 100 REGISTROS >>>
        resources = resources[:100]

        return JsonResponse({
            "url": search_url,
            "total_resources": len(resources),
            "resources": resources
        })

    except Exception as e:
        import traceback
        print("ERROR:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)
'''

#-----------------------------------



# ============================================================
# FUNCIONES AUXILIARES COMPARTIDAS
# ============================================================

def _get_ga4_client():
    """Retorna cliente de GA4"""
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not credentials_path:
        raise ValueError("GOOGLE_APPLICATION_CREDENTIALS no configurado")
    return BetaAnalyticsDataClient.from_service_account_file(credentials_path)


def _get_property_id():
    """Retorna property ID"""
    property_id = os.getenv("GA4_PROPERTY_ID")
    if not property_id:
        raise ValueError("GA4_PROPERTY_ID no configurado")
    return property_id


def _normalize_url(url):
    """Normaliza URL para comparación"""
    try:
        if not url.startswith("http"):
            url = "https://" + url
        p = urlparse(url)
        return f"{p.scheme}://{p.netloc}{p.path.rstrip('/')}"
    except:
        return url.split("?")[0]


def _get_date_range(start_date, end_date):
    """Retorna rango de fechas"""
    if not start_date or not end_date:
        end_date_obj = datetime.today()
        start_date_obj = end_date_obj - timedelta(days=28)
        start_date = start_date_obj.strftime("%Y-%m-%d")
        end_date = end_date_obj.strftime("%Y-%m-%d")
    return start_date, end_date


def _get_event_filter():
    """Retorna filtro común para resource_performance"""
    return FilterExpression(
        filter=Filter(
            field_name="eventName",
            string_filter=Filter.StringFilter(
                match_type=Filter.StringFilter.MatchType.EXACT,
                value="resource_performance"
            )
        )
    )

def _get_resource_key(resource_name, page_path, resource_type):
    """Determina la clave de agrupación (host externo o nombre completo)"""
    try:
        parsed_resource = urlparse(resource_name)
        resource_host = parsed_resource.netloc if parsed_resource.netloc else resource_name
    except:
        resource_host = resource_name

    # Determinar si es externo
    try:
        parsed_page = urlparse(page_path)
        page_host = parsed_page.netloc
        is_external = resource_host and page_host not in resource_host and resource_host != page_host
    except:
        is_external = False

    # Retornar host si es externo, nombre completo si es interno
    return resource_host if is_external else resource_name

# ============================================================
# ENDPOINT 1: DATOS GENERALES (TOP 50 RECURSOS)
# ============================================================

'''def ga4_resources_general(request):
    """
    Retorna datos generales de los 50 recursos más lentos
    Parámetros: ?url=... &start=YYYY-MM-DD &end=YYYY-MM-DD
    """
    import gc
    
    try:
        # Validar parámetros
        search_url = request.GET.get("url")
        if not search_url:
            return JsonResponse({"error": "Parámetro ?url requerido"}, status=400)

        start_date = request.GET.get("start")
        end_date = request.GET.get("end")
        start_date, end_date = _get_date_range(start_date, end_date)

        # Configurar cliente
        client = _get_ga4_client()
        property_id = _get_property_id()
        normalized_search = _normalize_url(search_url.lower())

        # Consulta GA4
        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:page_location_loadPage"),
                    Dimension(name="customEvent:resource_name_loadPage"),
                    Dimension(name="customEvent:resource_type_loadPage"),
                ],
                metrics=[
                    Metric(name="eventCount"),
                    Metric(name="customEvent:total_duration_loadPage"),
                    Metric(name="customEvent:resource_total_size_loadPage"),
                    Metric(name="customEvent:resource_repeat_count_loadPage"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter=_get_event_filter(),
                limit=1000
            )
        )

        # DEBUG: Imprimir primeros 5 registros
        print("\n" + "="*80)
        print("DEBUG: PRIMEROS 5 REGISTROS DE GA4")
        print("="*80)
        
        count = 0
        for row in response.rows:
            if count >= 10:
                break
                
            page = row.dimension_values[0].value
            name = row.dimension_values[1].value
            type_ = row.dimension_values[2].value
            
            evt = row.metric_values[0].value
            dur = row.metric_values[1].value
            size = row.metric_values[2].value
            rep = row.metric_values[3].value
            
            print(f"\n--- Registro {count + 1} ---")
            print(f"Page: {page}")
            print(f"Resource Name: {name}")
            print(f"Resource Type: {type_}")
            print(f"Event Count (raw): {evt}")
            print(f"Total Duration (raw): {dur}")
            print(f"Total Size (raw): {size}")
            print(f"Repeat Count (raw): {rep}")
            
            count += 1
        
        print("\n" + "="*80 + "\n")

        # Procesar datos
        summary = {}

        for row in response.rows:
            page = row.dimension_values[0].value
            if _normalize_url(page.lower()) != normalized_search:
                continue

            name = row.dimension_values[1].value
            type_ = row.dimension_values[2].value

            evt = float(row.metric_values[0].value or 0)
            dur = float(row.metric_values[1].value or 0)
            size = float(row.metric_values[2].value or 0)
            rep = float(row.metric_values[3].value or 0)

            if name not in summary:
                summary[name] = {
                    "type": type_,
                    "event_count": 0,
                    "duration_sum": 0,
                    "size_sum": 0,
                    "repeat_sum": 0,
                    "observations": 0,
                }

            r = summary[name]
            r["event_count"] += evt
            r["duration_sum"] += dur
            r["size_sum"] += size
            r["repeat_sum"] += rep
            r["observations"] += 1

        # DEBUG: Imprimir primeros 5 recursos agregados
        print("\n" + "="*80)
        print("DEBUG: PRIMEROS 5 RECURSOS AGREGADOS")
        print("="*80)
        
        count = 0
        for name, r in list(summary.items())[:10]:
            print(f"\n--- Recurso {count + 1} ---")
            print(f"Name: {name}")
            print(f"Type: {r['type']}")
            print(f"Event Count (suma): {r['event_count']}")
            print(f"Duration Sum: {r['duration_sum']}")
            print(f"Size Sum: {r['size_sum']}")
            print(f"Repeat Sum: {r['repeat_sum']}")
            print(f"Observations: {r['observations']}")
            
            if r['event_count'] > 0 and r['observations'] > 0:
                print(f"\nCálculo actual:")
                print(f"  duration_sum / event_count / observations = {r['duration_sum']} / {r['event_count']} / {r['observations']} = {r['duration_sum']/r['event_count']/r['observations']}")
                print(f"  duration_sum / observations = {r['duration_sum']} / {r['observations']} = {r['duration_sum']/r['observations']}")
                print(f"  duration_sum / event_count = {r['duration_sum']} / {r['event_count']} = {r['duration_sum']/r['event_count']}")
                print(f"  duration_sum / repeat_sum = {r['duration_sum']} / {r['repeat_sum']} = {r['duration_sum']/r['repeat_sum']}")
            
            count += 1
        
        print("\n" + "="*80 + "\n")



        if "9949-6cf1cee076fb3739.js" in name:
            print("\n" + "="*80)
            print(f"DEBUG RECURSO 9949:")
            print(f"Name: {name}")
            print(f"event_count: {r['event_count']}")
            print(f"duration_sum: {r['duration_sum']}")
            print(f"repeat_sum: {r['repeat_sum']}")
            print(f"observations: {r['observations']}")
            print(f"Cálculo: {r['duration_sum']} / {r['repeat_sum']} = {r['duration_sum'] / r['repeat_sum']}")
            print("="*80 + "\n")
        # Calcular promedios y ordenar
        resources = []
        for name, r in summary.items():
            event_count = r["event_count"]
            obs = r["observations"]
            repeat_sum = r["repeat_sum"]
            
            if event_count > 0 and obs > 0 and repeat_sum > 0:
                # FÓRMULA CORRECTA: dividir por repeat_sum
                duration_avg = r["duration_sum"] / repeat_sum
                size_avg = r["size_sum"] / repeat_sum
                repeat_avg = repeat_sum / event_count

                resources.append({
                    "name": name,
                    "type": r["type"],
                    "duration_avg": round(duration_avg, 3),
                    "repeat_avg": round(repeat_avg, 3),
                    "size_avg": round(size_avg / 1024, 2),
                    "event_count": int(event_count),
                    "observations": obs,
                })

        # TOP 50 más lentos
        resources.sort(key=lambda x: x["duration_avg"], reverse=True)
        resources = resources[:50]

        # ========================================
        # DEBUG: DATOS ENVIADOS AL FRONTEND
        # ========================================
        print("\n" + "="*80)
        print("DEBUG: PRIMEROS 5 RECURSOS ENVIADOS AL FRONTEND")
        print("="*80)
        
        for i, resource in enumerate(resources[:5]):
            print(f"\n--- Recurso {i+1} enviado al front ---")
            print(f"Name: {resource['name']}")
            print(f"Type: {resource['type']}")
            print(f"duration_avg: {resource['duration_avg']} ms")
            print(f"repeat_avg: {resource['repeat_avg']}")
            print(f"size_avg: {resource['size_avg']} KB")
            print(f"event_count: {resource['event_count']}")
            print(f"observations: {resource['observations']}")
        
        print("\n" + "="*80 + "\n")

        del response, summary
        gc.collect()

        json_response = {
            "url": search_url,
            "start_date": start_date,
            "end_date": end_date,
            "total_resources": len(resources),
            "resources": resources
        }

        return JsonResponse(json_response)

    except Exception as e:
        import traceback
        print("ERROR:", traceback.format_exc())
        gc.collect()
        return JsonResponse({"error": str(e)}, status=500)
'''


def ga4_resources_general(request):
    """
    Obtiene recursos cargados para una página específica.
    Agrupa por dominio externo o nombre de recurso.
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales o property ID no definidas"}, status=500)

        # 1. Obtener parámetros
        search_url = request.GET.get("url")
        if not search_url:
            return JsonResponse({"error": "Parámetro 'url' requerido"}, status=400)

        start_date = request.GET.get("start")
        end_date = request.GET.get("end")
        if not start_date or not end_date:
            end_date_obj = datetime.today()
            start_date_obj = end_date_obj - timedelta(days=28)
            start_date = start_date_obj.strftime("%Y-%m-%d")
            end_date = end_date_obj.strftime("%Y-%m-%d")

        # 2. Normalizar URL de búsqueda
        def normalize_url(url):
            """Normaliza una URL para comparación"""
            try:
                if not url.startswith("http"):
                    url = "https://" + url
                parsed = urlparse(url)
                normalized = f"{parsed.scheme}://{parsed.netloc}{parsed.path.rstrip('/')}"
                return normalized
            except:
                return url.split("?")[0].split("#")[0]

        normalized_search = normalize_url(search_url.lower())

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # 3. Consultar GA4 con filtro por evento
        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="eventName"),  # ← AGREGAR: Para filtrar por evento
                    Dimension(name="customEvent:page_location_loadPage"),
                    Dimension(name="customEvent:resource_name_loadPage"),
                    Dimension(name="customEvent:resource_type_loadPage"),
                ],
                metrics=[
                    Metric(name="eventCount"),  # ← CRÍTICO: Necesario para promediar
                    Metric(name="customEvent:total_duration_loadPage"),
                    Metric(name="customEvent:resource_total_duration_loadPage"),
                    Metric(name="customEvent:resource_total_size_loadPage"),
                    Metric(name="customEvent:resource_repeat_count_loadPage"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                limit=10000,
            )
        )

        # 4. Procesar datos - Filtrar por evento resource_performance
        grouped = {}
        filtered_count = 0

        for row in response.rows:
            try:
                event_name = row.dimension_values[0].value
                page_path = row.dimension_values[1].value
                resource_name = row.dimension_values[2].value
                resource_type = row.dimension_values[3].value
                
                event_count = float(row.metric_values[0].value or 0)
                page_duration = float(row.metric_values[1].value or 0)
                resource_duration = float(row.metric_values[2].value or 0)
                transfer_size = float(row.metric_values[3].value or 0)
                resource_repeat = float(row.metric_values[4].value or 0)

                # DEBUG: Imprimir primeras 3 filas para ver qué valores llegan
                if filtered_count < 3:
                    print(f"🔍 DEBUG Row {filtered_count}:")
                    print(f"  Resource: {resource_name}")
                    print(f"  Event Count: {event_count}")
                    print(f"  Resource Duration: {resource_duration}")
                    print(f"  Type: {resource_type}")

            except (ValueError, IndexError) as e:
                print(f"❌ Error parsing row: {e}")
                continue

            # FILTRO CRÍTICO: Solo eventos resource_performance
            if event_name != "resource_performance":
                continue

            # Normalizar y filtrar por URL
            normalized_page = normalize_url(page_path.lower())
            if normalized_page != normalized_search:
                continue

            filtered_count += 1

            # Extraer hostname del recurso
            try:
                parsed_resource = urlparse(resource_name)
                resource_host = parsed_resource.netloc if parsed_resource.netloc else resource_name
            except:
                resource_host = resource_name

            # Determinar si es externo o interno
            try:
                parsed_page = urlparse(page_path)
                page_host = parsed_page.netloc
                is_external = resource_host and page_host not in resource_host and resource_host != page_host
            except:
                is_external = False

            # Clave de agrupación
            key = resource_host if is_external else resource_name

            if key not in grouped:
                grouped[key] = {
                    "host": resource_host,
                    "type": resource_type,
                    "event_count": 0,
                    "total_duration": 0,
                    "total_repeat": 0,
                    "total_size": 0,
                }

            grouped[key]["event_count"] += event_count
            grouped[key]["total_duration"] += resource_duration
            grouped[key]["total_repeat"] += resource_repeat
            grouped[key]["total_size"] += transfer_size

        # 5. Calcular promedios usando event_count
        if filtered_count == 0:
            return JsonResponse({
                "url": search_url,
                "total_resources": 0,
                "resources": []
            })

        resources = []
        for name, data in grouped.items():
            # CLAVE: Dividir entre event_count (cantidad real de eventos disparados)
            # NO entre "count" (cantidad de filas de GA4)
            if data["event_count"] > 0:
                avg_duration = data["total_duration"] / data["event_count"]
                avg_repeat = data["total_repeat"] / data["event_count"]
                avg_size = data["total_size"] / data["event_count"]
            else:
                avg_duration = avg_repeat = avg_size = 0

            resources.append({
                "name": name,
                "type": data["type"],
                "duration_avg": round(avg_duration, 3),  # 3 decimales para valores como 0.324
                "repeat_avg": round(avg_repeat, 2),
                "size_avg": round(avg_size / 1024, 2) if avg_size > 0 else 0,  # Convertir a KB
            })

        # Ordenar por duración descendente
        resources.sort(key=lambda x: x["duration_avg"], reverse=True)
        # 🔎 IMPRIMIR LAS FILAS CON avg_duration > 10
        print("\n=== RECURSOS CON avg_duration > 10s ===")
        for r in resources:
            if r["duration_avg"] > 10:
                print(f"⚠️ {r['name']} | {r['type']} | avg_duration: {r['duration_avg']} sec | repeat_avg: {r['repeat_avg']}")
        print("=== FIN ===\n")
        return JsonResponse({
            "url": search_url,
            "total_resources": len(resources),
            "filtered_rows": filtered_count,
            "resources": resources,
        })

    except Exception as e:
        import traceback
        print(f"Error en GA4 Page Resources: {traceback.format_exc()}")
        return JsonResponse({"error": str(e)}, status=500)




# ============================================================
# ENDPOINT 2: DATOS POR HORA
# ============================================================


def ga4_resources_hourly(request):
    """
    Versión con DEBUG: imprime todo lo necesario para entender la data recibida.
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        print("\n======= GA4 HOURLY DEBUG START =======")
        print("URL PARAM:", request.GET.get("url"))
        print("RESOURCES PARAM:", request.GET.get("resources"))
        print("START/END:", request.GET.get("start"), request.GET.get("end"))

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales o property ID no definidas"}, status=500)

        search_url = request.GET.get("url")
        resources_param = request.GET.get("resources")

        if not search_url:
            return JsonResponse({"error": "Parámetro 'url' requerido"}, status=400)

        if not resources_param:
            return JsonResponse({"error": "Parámetro 'resources' requerido"}, status=400)

        resource_names_raw = [r.strip() for r in resources_param.split(",") if r.strip()]
        if not resource_names_raw:
            return JsonResponse({"error": "Lista de recursos vacía"}, status=400)

        print("RESOURCES RAW:", resource_names_raw)

        start_date = request.GET.get("start")
        end_date = request.GET.get("end")
        start_date, end_date = _get_date_range(start_date, end_date)

        normalized_search = _normalize_url(search_url.lower())
        print("NORMALIZED SEARCH:", normalized_search)

        # Normalización usada en resources_general
        def normalize_resource_key(resource):
            try:
                parsed = urlparse(resource)
                host = parsed.netloc
                path = parsed.path
                if host:
                    return host + path
                return resource
            except:
                return resource

        requested_resources = {normalize_resource_key(r) for r in resource_names_raw}
        print("REQUESTED NORMALIZED RESOURCES:", requested_resources)

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="eventName"),
                    Dimension(name="customEvent:page_location_loadPage"),
                    Dimension(name="customEvent:resource_name_loadPage"),
                    Dimension(name="hour"),
                ],
                metrics=[
                    Metric(name="eventCount"),
                    Metric(name="customEvent:resource_total_duration_loadPage"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                limit=5000,
            )
        )

        hourly_data = {}

        print("\n--- COMENZANDO LECTURA DE FILAS GA4 ---")

        for row in response.rows:
            try:
                event_name = row.dimension_values[0].value
                page_path = row.dimension_values[1].value
                resource_name = row.dimension_values[2].value
                hour = row.dimension_values[3].value

                event_count = float(row.metric_values[0].value or 0)
                resource_duration = float(row.metric_values[1].value or 0)
            except:
                print("❌ ERROR LEYENDO FILA")
                continue

            # === PRINT RAW ROW BEFORE FILTERING ===
            print("\nROW RAW →", {
                "event": event_name,
                "page_path": page_path,
                "resource_name": resource_name,
                "hour": hour,
                "event_count": event_count,
                "resource_duration": resource_duration
            })

            if event_name != "resource_performance":
                print("⛔ DESCARTADO: event != resource_performance")
                continue

            normalized_page = _normalize_url(page_path.lower())
            print("NORMALIZED PAGE:", normalized_page)

            if normalized_page != normalized_search:
                print("⛔ DESCARTADO: página no coincide con búsqueda")
                continue

            # Parse recursos y página
            try:
                parsed_res = urlparse(resource_name)
                res_host = parsed_res.netloc if parsed_res.netloc else resource_name
            except:
                res_host = resource_name

            parsed_page = urlparse(page_path)
            page_host = parsed_page.netloc

            is_external = res_host and page_host not in res_host and res_host != page_host
            key = res_host if is_external else resource_name

            print("RESOURCE HOST:", res_host)
            print("PAGE HOST:", page_host)
            print("EXTERNAL?:", is_external)
            print("KEY:", key)

            if resource_name not in resource_names_raw:
                print("⛔ DESCARTADO: recurso no coincide EXACTAMENTE")
                continue
            # Si pasó todos los filtros → Es válido
            print("✔ ACEPTADO →", key)

            # Agregar hora
            if key not in hourly_data:
                hourly_data[key] = {}

            if event_count > 0:
                hourly_data[key][hour] = round(resource_duration / event_count, 3)

        print("\n======= GA4 HOURLY DEBUG END =======\n")

        return JsonResponse({
            "url": search_url,
            "start_date": start_date,
            "end_date": end_date,
            "resources": hourly_data
        })

    except Exception as e:
        import traceback
        print("Error en GA4 Hourly:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)

# ============================================================
# ENDPOINT 3: DATOS POR DÍA
# ============================================================

def ga4_resources_daily(request):
    """
    Retorna promedios de duración por día para recursos específicos.
    Parámetros: ?url=... &resources=name1,name2 &start=... &end=...
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales o property ID no definidas"}, status=500)

        # Validar parámetros
        search_url = request.GET.get("url")
        resources_param = request.GET.get("resources")
        
        if not search_url:
            return JsonResponse({"error": "Parámetro 'url' requerido"}, status=400)
        
        if not resources_param:
            return JsonResponse({"error": "Parámetro 'resources' requerido"}, status=400)

        resource_names = [r.strip() for r in resources_param.split(",") if r.strip()]
        
        if not resource_names:
            return JsonResponse({"error": "Lista de recursos vacía"}, status=400)

        start_date = request.GET.get("start")
        end_date = request.GET.get("end")
        start_date, end_date = _get_date_range(start_date, end_date)

        normalized_search = _normalize_url(search_url.lower())

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # Consulta GA4 por día
        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="eventName"),
                    Dimension(name="customEvent:page_location_loadPage"),
                    Dimension(name="customEvent:resource_name_loadPage"),
                    Dimension(name="date"),
                ],
                metrics=[
                    Metric(name="eventCount"),
                    Metric(name="customEvent:resource_total_duration_loadPage"),
                ],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                limit=5000,
            )
        )

        # Procesar datos
        daily_data = {}

        for row in response.rows:
            try:
                event_name = row.dimension_values[0].value
                page_path = row.dimension_values[1].value
                resource_name = row.dimension_values[2].value
                date = row.dimension_values[3].value
                
                event_count = float(row.metric_values[0].value or 0)
                resource_duration = float(row.metric_values[1].value or 0)

            except (ValueError, IndexError):
                continue

            if event_name != "resource_performance":
                continue

            normalized_page = _normalize_url(page_path.lower())
            if normalized_page != normalized_search:
                continue

            key = _get_resource_key(resource_name, page_path, "")
            
            if key not in resource_names:
                continue

            if key not in daily_data:
                daily_data[key] = {}

            if event_count > 0:
                daily_data[key][date] = round(resource_duration / event_count, 3)

        return JsonResponse({
            "url": search_url,
            "start_date": start_date,
            "end_date": end_date,
            "resources": daily_data
        })

    except Exception as e:
        import traceback
        print(f"Error en GA4 Daily: {traceback.format_exc()}")
        return JsonResponse({"error": str(e)}, status=500)






from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import datetime, timedelta
import os
from google.analytics.data_v1beta import BetaAnalyticsDataClient, RunReportRequest, Dimension, Metric, DateRange

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
from datetime import datetime, timedelta
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, Dimension, Metric, DateRange

def ga4_click_relation(request):
    """
    Obtiene métricas de clicks y conversiones para el dashboard ClickRelation.
    Filtra por unidad de negocio en compras si se indica ?unit=Terminales|Tecnologia|Migracion|Portabilidad
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales no configuradas"}, status=500)

        unit = request.GET.get("unit", None)
        start_date = request.GET.get("start", "2025-10-15")
        end_date = request.GET.get("end", (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d"))

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # 1️⃣ Obtener sesiones y carritos por elemento (sin filtrar)
        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:elemento_click_home"),
                    Dimension(name="customEvent:img_click_home"),
                ],
                metrics=[Metric(name="sessions"), Metric(name="addToCarts")],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                limit=10000,
            )
        )

        grouped = {}
        for row in response.rows:
            elemento = row.dimension_values[0].value
            img_click_home = row.dimension_values[1].value

            if not elemento or elemento.lower() in ["(not set)", "none"]:
                continue

            sesiones = int(float(row.metric_values[0].value or 0))
            carritos = int(float(row.metric_values[1].value or 0))

            if elemento not in grouped:
                grouped[elemento] = {
                    "elemento": elemento,
                    "img_click_home": img_click_home,
                    "sesiones": 0,
                    "carritos": 0,
                    "compras": 0,
                    "ingresos": 0.0,
                }

            grouped[elemento]["sesiones"] += sesiones
            grouped[elemento]["carritos"] += carritos

        # 2️⃣ Obtener compras e ingresos por elemento, aplicando filtro si hay unit
        filters = []
        if unit:
            unit_lower = unit.lower()
            if unit_lower in ["terminales", "tecnologia"]:
                filters.append({
                    "field_name": "customEvent:business_unit",
                    "string_filter": {"value": unit_lower, "match_type": "EXACT"}
                })
            elif unit_lower == "migracion":
                filters.append({
                    "field_name": "customEvent:business_unit2",
                    "string_filter": {"value": "migracion", "match_type": "EXACT"}
                })
            elif unit_lower == "portabilidad":
                filters.append({
                    "field_name": "customEvent:business_unit2",
                    "string_filter": {"value": "portabilidad postpago", "match_type": "EXACT"}
                })

        response_purchases = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[Dimension(name="customEvent:elemento_click_home"), Dimension(name="transactionId")],
                metrics=[Metric(name="purchaseRevenue")],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter={"and_group": {"expressions": [{"filter": f} for f in filters]}} if filters else None,
                limit=10000,
            )
        )

        purchases_by_elemento = {}
        for row in response_purchases.rows:
            elemento = row.dimension_values[0].value
            revenue = float(row.metric_values[0].value or 0)
            if not elemento or elemento.lower() == "(not set)":
                continue

            if elemento not in purchases_by_elemento:
                purchases_by_elemento[elemento] = {"count": 0, "revenue": 0.0}

            purchases_by_elemento[elemento]["count"] += 1
            purchases_by_elemento[elemento]["revenue"] += revenue

        # 3️⃣ Asignar compras e ingresos a cada elemento
        for key, value in grouped.items():
            if key in purchases_by_elemento:
                value["compras"] = purchases_by_elemento[key]["count"]
                value["ingresos"] = purchases_by_elemento[key]["revenue"]

        data = list(grouped.values())
        data.sort(key=lambda x: x["ingresos"], reverse=True)
        return JsonResponse({"data": data})

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def ga4_click_detail(request, elemento):
    """
    Detalle de compras por elemento, con flag que indica si hay flujo de clicks disponible
    para cada session_id.
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")
        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales no configuradas"}, status=500)

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)
        # --- 1️⃣ FECHAS INGRESADAS POR EL USUARIO ---
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        if not start_date:
            start_date = "2025-10-15"

        if not end_date:
            end_date = (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d")

        unit = request.GET.get("unit", None)

        # --- 1️⃣ Traer detalle de compras por elemento ---
        filters = [
            {
                "field_name": "customEvent:elemento_click_home",
                "string_filter": {"value": elemento, "match_type": "EXACT"},
            }
        ]

        if unit:
            unit_lower = unit.lower()
            if unit_lower in ["terminales", "tecnologia"]:
                filters.append({
                    "field_name": "customEvent:business_unit",
                    "string_filter": {"value": unit_lower, "match_type": "EXACT"}
                })
            elif unit_lower == "migracion":
                filters.append({
                    "field_name": "customEvent:business_unit2",
                    "string_filter": {"value": "migracion", "match_type": "EXACT"}
                })
            elif unit_lower == "portabilidad":
                filters.append({
                    "field_name": "customEvent:business_unit2",
                    "string_filter": {"value": "portabilidad postpago", "match_type": "EXACT"}
                })

        # ============================
        # REVENUE REAL POR DÍA
        # ============================
        daily_rev_response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[Dimension(name="date")],
                metrics=[Metric(name="purchaseRevenue")],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter={"and_group": {"expressions": [{"filter": f} for f in filters]}},
                limit=1000,
            )
        )

        # Diccionario: {'20250101': 12345.67}
        real_revenue_by_day = {
            row.dimension_values[0].value: float(row.metric_values[0].value or 0)
            for row in daily_rev_response.rows
        }


        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="transactionId"),
                    Dimension(name="customEvent:elemento_click_home"),
                    Dimension(name="customEvent:items_purchased"),
                    Dimension(name="customEvent:session_id_final"),
                    Dimension(name="date"),
                ],
                metrics=[Metric(name="purchaseRevenue")],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter={"and_group": {"expressions": [{"filter": f} for f in filters]}} if filters else None,
                limit=1000,
            )
        )

        # ============================
        # CONSULTA ÚNICA DE PURCHASES → SUPER RÁPIDO
        # ============================

        purchase_response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="transactionId"),
                    Dimension(name="date"),
                    Dimension(name="eventName"),
                ],
                metrics=[Metric(name="purchaseRevenue")],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter={
                    "and_group": {
                        "expressions": [
                            {
                                "filter": {
                                    "field_name": "eventName",
                                    "string_filter": {"value": "purchase", "match_type": "EXACT"}
                                }
                            }
                        ]
                    }
                },
                limit=10000,
            )
        )

        # Diccionario rápido: { (transactionId, fecha) : revenue }
        purchase_map = {}
        for r in purchase_response.rows:
            tid = r.dimension_values[0].value
            fecha_purchase = r.dimension_values[1].value  # YYYYMMDD
            revenue = float(r.metric_values[0].value or 0)
            purchase_map[(tid, fecha_purchase)] = revenue

        # ============================
        # PROCESAR EL DETALLE PRINCIPAL
        # ============================

        modal_data = []

        for row in response.rows:

            transaction_id = row.dimension_values[0].value
            elemento_val = row.dimension_values[1].value
            items_purchased_val = row.dimension_values[2].value
            session_id_final_val = row.dimension_values[3].value
            fecha_raw = row.dimension_values[4].value

            # buscar revenue en O(1)
            valor_real = purchase_map.get((transaction_id, fecha_raw), 0)

            modal_data.append({
                "transaction_id": transaction_id,
                "elemento": elemento_val,
                "items_purchased": items_purchased_val,
                "session_id_final": session_id_final_val,
                "fecha": fecha_raw,
                "valor": valor_real,
            })

        # --- 2️⃣ Traer todos los session_id que tengan flujo de clicks ---
        session_ids = list({row["session_id_final"] for row in modal_data if row["session_id_final"]})
        sessions_with_flow = set()
        if session_ids:
            flow_response = client.run_report(
                RunReportRequest(
                    property=f"properties/{property_id}",
                    dimensions=[
                        Dimension(name="customEvent:session_id_final"),
                    ],
                    metrics=[],
                    date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                    dimension_filter={
                        "and_group": {
                            "expressions": [
                                {
                                    "filter": {
                                        "field_name": "eventName",
                                        "string_filter": {"value": "user_click_event", "match_type": "EXACT"}
                                    }
                                },
                                {
                                    "filter": {
                                        "field_name": "customEvent:session_id_final",
                                        "in_list_filter": {"values": session_ids}
                                    }
                                }
                            ]
                        }
                    },
                    limit=1000,
                )
            )
            sessions_with_flow = {row.dimension_values[0].value for row in flow_response.rows}

        # --- 3️⃣ Marcar has_click_flow ---
        for row in modal_data:
            row["has_click_flow"] = row["session_id_final"] in sessions_with_flow

        return JsonResponse({"data": modal_data})

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)



@csrf_exempt
def ga4_click_flow(request):
    """
    Retorna flujo de un usuario por session_id, incluyendo:
    - pageviews
    - clicks
    - scroll events (scroll-20, scroll-40, scroll-60, etc)
    y los une por URL dentro del mismo flujo.
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")
        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales no configuradas"}, status=500)

        session_id = request.GET.get("session_id")
        if not session_id:
            return JsonResponse({"error": "Se requiere session_id"}, status=400)

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        start_date = "2025-10-15"
        end_date = (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d")

        # --- 🔥 AHORA PEDIMOS eventName para capturar los scroll ---
        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:session_id_final"),
                    Dimension(name="eventName"),              # 👈 scroll-20, scroll-40, etc
                    Dimension(name="customEvent:user_click"), # sigue igual
                    Dimension(name="pageLocation"),
                    Dimension(name="dateHourMinute"),
                ],
                metrics=[],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter={
                    "filter": {
                        "field_name": "customEvent:session_id_final",
                        "string_filter": {"value": session_id, "match_type": "EXACT"}
                    }
                },
                limit=2000,
            )
        )

        scroll_prefix = "scroll-"
        rows = []
        url_scrolls = {}  # Agrupar scrolls por URL

        print("RAW ROWS:")
        for row in response.rows:
            sess = row.dimension_values[0].value
            event_name = row.dimension_values[1].value
            user_click = row.dimension_values[2].value
            page_url = row.dimension_values[3].value
            timestamp = row.dimension_values[4].value

            print("EVENT:", event_name, "CLICK:", user_click, "URL:", page_url)

            # --- 🔥 Scroll event real (NO VIENE EN user_click) ---
            if event_name.startswith(scroll_prefix):
                perc = event_name.replace("scroll-", "")
                url_scrolls.setdefault(page_url, []).append(f"{perc}%")

            rows.append({
                "session_id": sess,
                "event_name": event_name,
                "user_click": user_click,
                "page_url": page_url,
                "timestamp": timestamp
            })

        # ------------------------------
        # Construir la salida final
        # ------------------------------
        result = []

        for item in rows:

            # CLICK MANUAL NORMAL
            if item["user_click"] not in [None, "", "(not set)"]:
                result.append({
                    "session_id": item["session_id"],
                    "type": "click",
                    "detail": item["user_click"],
                    "timestamp": item["timestamp"],
                    "scrolls": []
                })

            # PAGEVIEW (aquí se insertan scrolls asociados a esa URL)
            if item["page_url"] not in [None, "", "(not set)"]:
                result.append({
                    "session_id": item["session_id"],
                    "type": "pageview",
                    "detail": item["page_url"],
                    "timestamp": item["timestamp"],
                    "scrolls": url_scrolls.get(item["page_url"], [])
                })

        # Ordenar por timestamp ascendente
        result.sort(key=lambda x: x["timestamp"])

        print("FINAL DATA:", result)

        return JsonResponse({"data": result})

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)



@csrf_exempt
def ga4_genia_summary(request):
    """
    Resumen de métricas principales del evento GENIA:
    - Clicks (eventCount)
    - Sesiones únicas (session_id_final)
    - Ventas por coincidencia con purchase
    - Ingresos totales
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")
        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales no configuradas"}, status=500)

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # ============================
        # FECHAS
        # ============================
        start_date = request.GET.get("start_date")
        end_date = request.GET.get("end_date")

        if not start_date:
            start_date = "2025-11-22"

        if not end_date:
            end_date = (datetime.today() - timedelta(days=1)).strftime("%Y-%m-%d")

        # ============================
        # 1️⃣ EVENTOS GENIA
        # ============================

        genia_request = RunReportRequest(
            property=f"properties/{property_id}",
            date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
            dimensions=[
                Dimension(name="eventName"),
                Dimension(name="customEvent:session_id_final"),
            ],
            metrics=[Metric(name="eventCount")],
            dimension_filter={
                "filter": {
                    "field_name": "eventName",
                    "string_filter": {"value": "Genia", "match_type": "EXACT"}
                }
            },
            limit=100000
        )

        genia_response = client.run_report(genia_request)

        clicks = 0
        sesiones = set()

        print("========== RAW GA4 ROWS (first 5) ==========")
        for i, row in enumerate(genia_response.rows[:5]):
            print(
                f"Row {i+1}: ",
                [d.value for d in row.dimension_values],
                [m.value for m in row.metric_values]
            )

        for row in genia_response.rows:
            session_id = row.dimension_values[1].value
            count = int(row.metric_values[0].value or 0)

            clicks += count

            if session_id and session_id != "(not set)":
                sesiones.add(session_id)

        # ============================
        # 2️⃣ PURCHASES (consulta única)
        # ============================

        purchase_request = RunReportRequest(
            property=f"properties/{property_id}",
            date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
            dimensions=[
                Dimension(name="customEvent:session_id_final"),
            ],
            metrics=[Metric(name="purchaseRevenue")],
            dimension_filter={
                "filter": {
                    "field_name": "eventName",
                    "string_filter": {"value": "purchase", "match_type": "EXACT"}
                }
            },
            limit=100000
        )

        purchase_response = client.run_report(purchase_request)

        purchase_map = {}
        for row in purchase_response.rows:
            sid = row.dimension_values[0].value
            revenue = float(row.metric_values[0].value or 0)

            if sid and sid != "(not set)":
                purchase_map[sid] = purchase_map.get(sid, 0) + revenue

        # ============================
        # 3️⃣ VENTAS + INGRESOS
        # ============================

        ventas = 0
        ingresos_totales = 0.0

        for sid in sesiones:
            if sid in purchase_map:
                ventas += 1
                ingresos_totales += purchase_map[sid]

        # ============================
        # 4️⃣ JSON FINAL
        # ============================

        return JsonResponse({
            "clicks": clicks,
            "sesiones": len(sesiones),
            "ventas": ventas,
            "ingresos": ingresos_totales
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)





@csrf_exempt
def ga4_genia_ingresos_por_dia(request):
    """
    Obtiene ingresos totales por día asociados únicamente a sesiones del evento Genia.
    Devuelve un listado de {date, ingresos, detalle_ventas} para el rango indicado.
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")
        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales no configuradas"}, status=500)

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # -------------------
        # Fechas
        # -------------------
        start_date = request.GET.get("start_date") or (datetime.today() - timedelta(days=28)).strftime("%Y-%m-%d")
        end_date = request.GET.get("end_date") or datetime.today().strftime("%Y-%m-%d")

        # -------------------
        # 1️⃣ Extraer session_ids de Genia
        # -------------------
        genia_sessions = {}
        offset = 0
        limit = 100000
        while True:
            genia_request = RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[Dimension(name="eventName"), Dimension(name="customEvent:session_id_final")],
                metrics=[Metric(name="eventCount")],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter=FilterExpression(
                    filter=Filter(
                        field_name="eventName",
                        string_filter={"value": "Genia", "match_type": Filter.StringFilter.MatchType.EXACT}
                    )
                ),
                limit=limit,
                offset=offset
            )
            response = client.run_report(genia_request)
            if not response.rows:
                break

            for row in response.rows:
                sid = row.dimension_values[1].value
                if sid and sid != "(not set)":
                    genia_sessions[sid] = True

            if len(response.rows) < limit:
                break
            offset += limit

        # -------------------
        # 2️⃣ Extraer purchases de Genia
        # -------------------
        ingresos_por_dia = defaultdict(lambda: {"ingresos": 0, "detalle_ventas": []})
        offset = 0
        while True:
            purchase_request = RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:session_id_final"),
                    Dimension(name="date"),
                    Dimension(name="transactionId"),
                    Dimension(name="customEvent:items_purchased")  # si GA4 tiene productos comprados
                ],
                metrics=[Metric(name="purchaseRevenue")],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter=FilterExpression(
                    filter=Filter(
                        field_name="eventName",
                        string_filter={"value": "purchase", "match_type": Filter.StringFilter.MatchType.EXACT}
                    )
                ),
                limit=limit,
                offset=offset
            )
            purchase_response = client.run_report(purchase_request)
            if not purchase_response.rows:
                break

            for row in purchase_response.rows:
                sid = row.dimension_values[0].value
                date_raw = row.dimension_values[1].value
                trx_id = row.dimension_values[2].value if len(row.dimension_values) > 2 else "N/A"
                items_raw = row.dimension_values[3].value if len(row.dimension_values) > 3 else "(sin_producto)"
                revenue = float(row.metric_values[0].value or 0)

                # Solo sumar si la session_id pertenece a Genia
                if sid in genia_sessions:
                    try:
                        date_fmt = datetime.strptime(date_raw, "%Y%m%d").strftime("%Y-%m-%d")
                    except:
                        date_fmt = date_raw

                    ingresos_por_dia[date_fmt]["ingresos"] += revenue
                    ingresos_por_dia[date_fmt]["detalle_ventas"].append({
                        "session_id": sid,
                        "transaction_id": trx_id,
                        "producto": items_raw.split(",")[0].strip() if items_raw else "(sin_producto)",
                        "valor": round(revenue, 2)
                    })

            if len(purchase_response.rows) < limit:
                break
            offset += limit

        # -------------------
        # Formatear resultado final
        # -------------------
        resultados = [
            {"date": d, "ingresos": round(v["ingresos"], 2), "detalle_ventas": v["detalle_ventas"]}
            for d, v in sorted(ingresos_por_dia.items())
        ]

        return JsonResponse({"ingresos_por_dia": resultados})

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)





@csrf_exempt
def element_select(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    data = json.loads(request.body)

    # 🔐 Validar token
    if data.get("analysis_token") != "123456789":
        return JsonResponse({"error": "Invalid token"}, status=403)

    # 🧠 Guardar en DB / logs
    print("Elemento seleccionado:", data)

    return JsonResponse({"status": "ok"})



@csrf_exempt
def ga4_migracion_view_item_list(request):

    """
    Embudo Migración – eCommerce móviles

    Retorna:
    {
      "series": [
        {
          "date": "YYYY-MM-DD",
          "Visualización de planes": int,
          "Clic en comprar": int,
          "Datos personales": int,
          "Aceptación T&C": int,
          "Botón continuar": int,
          "Resumen de compra": int
        }
      ]
    }
    """

    try:
        # -------------------
        # Credenciales
        # -------------------
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse(
                {"error": "Credenciales GA4 no configuradas"},
                status=500
            )

        client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

        # -------------------
        # Fechas (querystring)
        # -------------------
        start_date = request.GET.get("start_date") or (
            datetime.today() - timedelta(days=28)
        ).strftime("%Y-%m-%d")

        end_date = request.GET.get("end_date") or datetime.today().strftime("%Y-%m-%d")

        # -------------------
        # Configuración embudo
        # ⚠️ Labels alineados con el FRONT
        # -------------------
        FUNNEL_EVENTS = {
            "view_item_list": "Visualización de planes",
            "select_item": "Clic en comprar",
            "begin_checkout": "Datos personales",
            "select_tyc": "Aceptación T&C",
            "select_next_step": "Botón continuar",
            "purchase": "Resumen de compra",
        }

        resultados_por_dia = defaultdict(lambda: {
            "Visualización de planes": 0,
            "Clic en comprar": 0,
            "Datos personales": 0,
            "Aceptación T&C": 0,
            "Botón continuar": 0,
            "Resumen de compra": 0,
        })

        # -------------------
        # Query GA4 por evento
        # -------------------
        for event_name, label in FUNNEL_EVENTS.items():
            offset = 0
            limit = 100000

            while True:
                ga_request = RunReportRequest(
                    property=f"properties/{property_id}",
                    dimensions=[
                        Dimension(name="date"),
                        Dimension(name="customEvent:business_unit2"),
                    ],
                    metrics=[
                        Metric(name="sessions"),
                    ],
                    date_ranges=[
                        DateRange(start_date=start_date, end_date=end_date)
                    ],
                    dimension_filter=FilterExpression(
                        filter=Filter(
                            field_name="eventName",
                            string_filter={
                                "value": event_name,
                                "match_type": Filter.StringFilter.MatchType.EXACT,
                            },
                        )
                    ),
                    limit=limit,
                    offset=offset,
                )

                response = client.run_report(ga_request)

                if not response.rows:
                    break

                for row in response.rows:
                    date_raw = row.dimension_values[0].value
                    business_unit2 = row.dimension_values[1].value
                    count = int(row.metric_values[0].value or 0)

                    # 🔎 Filtro clave del embudo
                    if business_unit2 != "migracion":
                        continue

                    try:
                        date_fmt = datetime.strptime(
                            date_raw, "%Y%m%d"
                        ).strftime("%Y-%m-%d")
                    except Exception:
                        date_fmt = date_raw

                    resultados_por_dia[date_fmt][label] += count

                if len(response.rows) < limit:
                    break

                offset += limit

        # -------------------
        # Formato final frontend
        # -------------------
        series = [
            {
                "date": d,
                "Visualización de planes": resultados_por_dia[d]["Visualización de planes"],
                "Clic en comprar": resultados_por_dia[d]["Clic en comprar"],
                "Datos personales": resultados_por_dia[d]["Datos personales"],
                "Aceptación T&C": resultados_por_dia[d]["Aceptación T&C"],
                "Botón continuar": resultados_por_dia[d]["Botón continuar"],
                "Resumen de compra": resultados_por_dia[d]["Resumen de compra"],
            }
            for d in sorted(resultados_por_dia.keys())
        ]

        return JsonResponse({"series": series})

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)
    


@csrf_exempt
def ga4_migracion_view_alert(request):
    """
    Alertas vistas – Migración

    Retorna:
    {
      "alerts": [
        {
          "alert_name": str,
          "cantidad": int,
          "porcentaje": float
        }
      ],
      "total": int
    }
    """

    try:
        # -------------------
        # Credenciales
        # -------------------
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse(
                {"error": "Credenciales GA4 no configuradas"}, status=500
            )

        client = BetaAnalyticsDataClient.from_service_account_file(
            credentials_path
        )

        # -------------------
        # Fechas
        # -------------------
        start_date = request.GET.get("start_date") or (
            datetime.today() - timedelta(days=28)
        ).strftime("%Y-%m-%d")

        end_date = request.GET.get("end_date") or datetime.today().strftime(
            "%Y-%m-%d"
        )

        # -------------------
        # Filtros
        # -------------------
        filter_event_name = FilterExpression(
            filter=Filter(
                field_name="eventName",
                string_filter={
                    "value": "view_alert",
                    "match_type": Filter.StringFilter.MatchType.EXACT,
                },
            )
        )

        filter_business_unit = FilterExpression(
            filter=Filter(
                field_name="customEvent:business_unit2",
                string_filter={
                    "value": "migracion",
                    "match_type": Filter.StringFilter.MatchType.EXACT,
                },
            )
        )

        dimension_filter = FilterExpression(
            and_group={
                "expressions": [
                    filter_event_name,
                    filter_business_unit,
                ]
            }
        )

        # -------------------
        # Query GA4
        # -------------------
        offset = 0
        limit = 100000
        alerts_acumuladas = {}
        total_event_count = 0

        while True:
            ga_request = RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:alert_name"),
                ],
                metrics=[
                    Metric(name="eventCount"),
                ],
                date_ranges=[
                    DateRange(
                        start_date=start_date,
                        end_date=end_date
                    )
                ],
                dimension_filter=dimension_filter,
                limit=limit,
                offset=offset,
            )

            response = client.run_report(ga_request)

            if not response.rows:
                break

            for row in response.rows:
                alert_name = (
                    row.dimension_values[0].value
                    if row.dimension_values
                    else "(sin nombre)"
                )
                count = int(row.metric_values[0].value or 0)

                total_event_count += count

                alerts_acumuladas[alert_name] = (
                    alerts_acumuladas.get(alert_name, 0) + count
                )

            if len(response.rows) < limit:
                break

            offset += limit

        # -------------------
        # Formato final
        # -------------------
        results = []
        for alert_name, cantidad in alerts_acumuladas.items():
            porcentaje = (
                (cantidad / total_event_count) * 100
                if total_event_count > 0
                else 0
            )

            results.append({
                "alert_name": alert_name,
                "cantidad": cantidad,
                "porcentaje": round(porcentaje, 2),
            })

        results.sort(key=lambda x: x["cantidad"], reverse=True)

        return JsonResponse({
            "total": total_event_count,
            "alerts": results,
        })

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse(
            {"error": str(e)},
            status=500
        )



# ==========================================================
# 🔹 Consulta GA4 para un rango de fechas
# ==========================================================
def _run_Sesiones_Vs_Compras_comparacion(
    client,
    property_id,
    start_date,
    end_date,
):
    offset = 0
    limit = 100000
    daily_summary = []

    dimensions = [Dimension(name="date")]
    metrics = [
        Metric(name="sessions"),
        Metric(name="ecommercePurchases"),
    ]

    # 🔹 Filtro: SOLO migración
    dimension_filter = FilterExpression(
        filter=Filter(
            field_name="customEvent:business_unit2",
            string_filter=Filter.StringFilter(
                value="migracion",
                match_type=Filter.StringFilter.MatchType.EXACT,
            ),
        )
    )

    while True:
        request = RunReportRequest(
            property=f"properties/{property_id}",
            dimensions=dimensions,
            metrics=metrics,
            date_ranges=[
                DateRange(
                    start_date=start_date,
                    end_date=end_date,
                )
            ],
            dimension_filter=dimension_filter,
            limit=limit,
            offset=offset,
        )

        response = client.run_report(request)

        if not response.rows:
            break

        for row in response.rows:
            date_raw = row.dimension_values[0].value
            sessions = int(row.metric_values[0].value or 0)
            purchases = int(row.metric_values[1].value or 0)

            try:
                date_fmt = datetime.strptime(
                    date_raw, "%Y%m%d"
                ).strftime("%Y-%m-%d")
            except Exception:
                date_fmt = date_raw

            conversion_rate = (
                round((purchases / sessions) * 100, 2)
                if sessions
                else 0
            )

            daily_summary.append({
                "date": date_fmt,
                "sessions": sessions,
                "purchases": purchases,
                "conversion_rate": conversion_rate,
            })

        if len(response.rows) < limit:
            break

        offset += limit

    daily_summary.sort(key=lambda x: x["date"])
    return daily_summary


# ==========================================================
# 🔹 Comparación entre dos periodos
# ==========================================================
def ga4_Sesiones_Vs_Compras_comparacion(
    period_1_start_date,
    period_1_end_date,
    period_2_start_date,
    period_2_end_date,
):
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    property_id = os.getenv("GA4_PROPERTY_ID")

    client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

    return {
        "periodo_1": _run_Sesiones_Vs_Compras_comparacion(
            client,
            property_id,
            period_1_start_date,
            period_1_end_date,
        ),
        "periodo_2": _run_Sesiones_Vs_Compras_comparacion(
            client,
            property_id,
            period_2_start_date,
            period_2_end_date,
        ),
    }


# ==========================================================
# 🔹 View Django (API)
# ==========================================================
@require_GET
def sesiones_vs_compras_comparacion_view(request):
    p1_start = request.GET.get("p1_start")
    p1_end = request.GET.get("p1_end")
    p2_start = request.GET.get("p2_start")
    p2_end = request.GET.get("p2_end")

    if not all([p1_start, p1_end, p2_start, p2_end]):
        return JsonResponse(
            {
                "error": (
                    "Parámetros requeridos: "
                    "p1_start, p1_end, p2_start, p2_end"
                )
            },
            status=400,
        )

    try:
        data = ga4_Sesiones_Vs_Compras_comparacion(
            p1_start,
            p1_end,
            p2_start,
            p2_end,
        )
        return JsonResponse(data, safe=False)

    except Exception as e:
        # 🔥 Log explícito (NO ocultar)
        print("ERROR GA4:", str(e))
        return JsonResponse(
            {"error": str(e)},
            status=500,
        )





# ==========================================================
# 🔹 Reporte por canal (L1 o L2)
# ==========================================================
def _run_channel_report(
    client,
    property_id,
    start_date,
    end_date,
    channel_dimension_name,
):
    offset = 0
    limit = 100000
    report_data = []

    dimensions = [
        Dimension(name=channel_dimension_name),
    ]

    metrics = [
        Metric(name="sessions"),
        Metric(name="ecommercePurchases"),
    ]

    # 🔹 business_unit2 == migracion
    filter_bu = FilterExpression(
        filter=Filter(
            field_name="customEvent:business_unit2",
            string_filter=Filter.StringFilter(
                value="migracion",
                match_type=Filter.StringFilter.MatchType.EXACT,
            ),
        )
    )

    # 🔹 Excluir "(not set)" y "(other)"
    filter_exclusion = FilterExpression(
        not_expression=FilterExpression(
            or_group=FilterExpressionList(
                expressions=[
                    FilterExpression(
                        filter=Filter(
                            field_name=channel_dimension_name,
                            string_filter=Filter.StringFilter(
                                value="(not set)",
                                match_type=Filter.StringFilter.MatchType.EXACT,
                            ),
                        )
                    ),
                    FilterExpression(
                        filter=Filter(
                            field_name=channel_dimension_name,
                            string_filter=Filter.StringFilter(
                                value="(other)",
                                match_type=Filter.StringFilter.MatchType.EXACT,
                            ),
                        )
                    ),
                ]
            )
        )
    )

    # 🔹 AND entre filtros
    dimension_filter = FilterExpression(
        and_group=FilterExpressionList(
            expressions=[filter_bu, filter_exclusion]
        )
    )

    while True:
        request = RunReportRequest(
            property=f"properties/{property_id}",
            dimensions=dimensions,
            metrics=metrics,
            date_ranges=[
                DateRange(
                    start_date=start_date,
                    end_date=end_date,
                )
            ],
            dimension_filter=dimension_filter,
            limit=limit,
            offset=offset,
        )

        response = client.run_report(request)

        if not response.rows:
            break

        for row in response.rows:
            report_data.append({
                "Canal": row.dimension_values[0].value,
                "Sesiones Mig": int(row.metric_values[0].value or 0),
                "Artículos comprados": int(row.metric_values[1].value or 0),
            })

        if len(response.rows) < limit:
            break

        offset += limit

    return report_data


# ==========================================================
# 🔹 Resumen de Canales (L1 + L2)
# ==========================================================
def ga4_traffic_channel_summary(start_date, end_date):
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    property_id = os.getenv("GA4_PROPERTY_ID")

    if not credentials_path or not property_id:
        raise RuntimeError("Credenciales GA4 no configuradas")

    client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

    # 🔹 Canales principales (L1)
    l1_results = _run_channel_report(
        client,
        property_id,
        start_date,
        end_date,
        "sessionCustomChannelGroup:7566460458",
    )

    for row in l1_results:
        row["Tipo de Canal"] = "principal"

    # 🔹 Canales secundarios (L2)
    l2_results = _run_channel_report(
        client,
        property_id,
        start_date,
        end_date,
        "sessionCustomChannelGroup:8278048377",
    )

    for row in l2_results:
        row["Tipo de Canal"] = "secundario"

    combined = l1_results + l2_results

    # 🔹 Calcular Tasa de Conversión
    for row in combined:
        s = row["Sesiones Mig"]
        p = row["Artículos comprados"]
        row["Tasa de Conversión"] = round((p / s) * 100, 2) if s else 0

    return {
        "canales": combined
    }


# ==========================================================
# 🔹 View Django (API)
# ==========================================================
@require_GET
def traffic_channel_summary_view(request):
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if not start_date or not end_date:
        return JsonResponse(
            {"error": "Parámetros requeridos: start_date, end_date"},
            status=400,
        )

    try:
        data = ga4_traffic_channel_summary(start_date, end_date)
        return JsonResponse(data, safe=False)

    except Exception as e:
        print("ERROR GA4 CHANNELS:", str(e))
        return JsonResponse({"error": str(e)}, status=500)



@require_GET
def ga4_traffic_detail_summary_view(request):
    """
    Endpoint Django:
    Retorna detalle de tráfico GA4 (Canal L1, Fuente/Medio, Campaña)
    filtrado por migración.

    Query params requeridos:
    - start_date (YYYY-MM-DD)
    - end_date   (YYYY-MM-DD)
    """

    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if not start_date or not end_date:
        return JsonResponse(
            {"error": "start_date y end_date son obligatorios"},
            status=400
        )

    # -------------------
    # Credenciales GA4
    # -------------------
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    property_id = os.getenv("GA4_PROPERTY_ID")

    if not credentials_path or not property_id:
        return JsonResponse(
            {"error": "Credenciales GA4 no configuradas"},
            status=500
        )

    client = BetaAnalyticsDataClient.from_service_account_file(
        credentials_path
    )

    # -------------------
    # Configuración consulta
    # -------------------
    offset = 0
    limit = 100000
    results = []

    dimensions = [
        Dimension(name="sessionCustomChannelGroup:7566460458"),  # Canal L1
        Dimension(name="sessionSourceMedium"),                   # Fuente/Medio
        Dimension(name="sessionCampaignName"),                   # Campaña
    ]

    metrics = [
        Metric(name="sessions"),
        Metric(name="ecommercePurchases"),
    ]

    dimension_filter = FilterExpression(
        filter=Filter(
            field_name="customEvent:business_unit2",
            string_filter=Filter.StringFilter(
                value="migracion",
                match_type=Filter.StringFilter.MatchType.EXACT,
            ),
        )
    )

    # -------------------
    # Paginación GA4
    # -------------------
    while True:
        ga_request = RunReportRequest(
            property=f"properties/{property_id}",
            dimensions=dimensions,
            metrics=metrics,
            date_ranges=[
                DateRange(start_date=start_date, end_date=end_date)
            ],
            dimension_filter=dimension_filter,
            limit=limit,
            offset=offset,
        )

        response = client.run_report(ga_request)

        if not response.rows:
            break

        for row in response.rows:
            channel_l1 = row.dimension_values[0].value
            source_medium = row.dimension_values[1].value
            campaign = row.dimension_values[2].value

            sessions = int(row.metric_values[0].value or 0)
            purchases = int(row.metric_values[1].value or 0)

            conversion_rate = (
                round((purchases / sessions) * 100, 2)
                if sessions > 0 else 0.0
            )

            results.append({
                "Canal L1": channel_l1,
                "Fuente/Medio": source_medium,
                "Campaña": campaign,
                "Sesiones Mig": sessions,
                "Artículos comprados": purchases,
                "Tasa de Conversión": conversion_rate,
            })

        if len(response.rows) < limit:
            break

        offset += limit

    return JsonResponse(
        {
            "start_date": start_date,
            "end_date": end_date,
            "total_filas": len(results),
            "data": results,
        },
        safe=False
    )

def categorizar_subcanal(source_medium, channel_group):
    sm = (source_medium or "").lower()
    cg = (channel_group or "").lower()

    # 1. Claro Colombia
    if sm == "clarocolombia / referral":
        return "Claro Colombia"

    # 2. IBM
    if "ibm" in sm.split(" / ")[0]:
        return "IBM"

    # 3. SuperApp
    superapp_regex = (
        r"superapp / app|app / superapp|mi-claro / app|"
        r"app / appmiclaro|app / notification_push"
    )
    if re.search(superapp_regex, sm):
        return "SuperApp"

    # 4. Growth
    growth_patterns = [
        "growth", "sms", "claro / sms", "rcs", "boton", "notification-push",
        "owned_rcs", "email", "salesforce", "appcotaimox", "claro-pay",
        "sfmc", "marketing-cloud", "owned_inapp", "propio",
        "campaign", "inapp"
    ]
    if any(p in sm for p in growth_patterns) or "(not set)" in sm or "banner" in sm:
        return "Growth"

    # 5. Insider
    if "insiders / web_push" in sm or "insider / web_push" in sm:
        return "Insider"

    # 6. Directo
    if "direct" in sm:
        return "Directo"

    # 7. Orgánico
    if cg == "organic":
        return "Orgánico"

    # 8. Pauta
    if cg == "paid":
        return "Pauta"

    # 9. Unassigned
    if cg == "unassigned":
        return "Unassigned"

    return "Otros"



def ga4_subcanal_owned_report(start_date, end_date):
    credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    property_id = os.getenv("GA4_PROPERTY_ID")

    if not credentials_path or not property_id:
        raise RuntimeError("Credenciales GA4 no configuradas")

    client = BetaAnalyticsDataClient.from_service_account_file(credentials_path)

    dimensions = [
        Dimension(name="date"),
        Dimension(name="sessionSourceMedium"),
        Dimension(name="sessionCustomChannelGroup:7566460458"),
        Dimension(name="hostName"),
        Dimension(name="customEvent:business_unit2"),
    ]

    metrics = [
        Metric(name="sessions"),
        Metric(name="ecommercePurchases"),
    ]

    dimension_filter = FilterExpression(
        and_group=FilterExpressionList(
            expressions=[
                FilterExpression(
                    filter=Filter(
                        field_name="hostName",
                        string_filter={"value": "tienda.claro.com.co"},
                    )
                ),
                FilterExpression(
                    filter=Filter(
                        field_name="customEvent:business_unit2",
                        string_filter={"value": "migracion"},
                    )
                ),
            ]
        )
    )

    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=dimensions,
        metrics=metrics,
        date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
        dimension_filter=dimension_filter,
        limit=100000,
    )

    response = client.run_report(request)

    # -------- PROCESAMIENTO PARA FRONTEND --------

    tree_data = defaultdict(
        lambda: defaultdict(lambda: {"sesiones": 0, "ventas": 0})
    )
    fechas_presentes = set()

    for row in response.rows:
        fecha_raw = row.dimension_values[0].value
        fecha = f"{fecha_raw[:4]}-{fecha_raw[4:6]}-{fecha_raw[6:]}"
        subcanal = categorizar_subcanal(
            row.dimension_values[1].value,
            row.dimension_values[2].value,
        )

        sesiones = int(row.metric_values[0].value)
        ventas = int(row.metric_values[1].value)

        fechas_presentes.add(fecha)
        tree_data[subcanal][fecha]["sesiones"] += sesiones
        tree_data[subcanal][fecha]["ventas"] += ventas

    lista_fechas = sorted(fechas_presentes)

    datos_front = []
    for subcanal in sorted(tree_data.keys()):
        fila = {"grupo": subcanal, "valores": {}}
        for fecha in lista_fechas:
            fila["valores"][fecha] = tree_data[subcanal].get(
                fecha, {"sesiones": 0, "ventas": 0}
            )
        datos_front.append(fila)

    return {
        "encabezados": {
            "fechas": lista_fechas,
            "metricas": ["Sesiones", "Ventas"],
        },
        "datos": datos_front,
    }


@require_GET
def ga4_subcanal_owned_view(request):
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    if not start_date or not end_date:
        return JsonResponse(
            {"error": "Debe enviar start_date y end_date"},
            status=400,
        )

    data = ga4_subcanal_owned_report(start_date, end_date)
    return JsonResponse(data, safe=False)
