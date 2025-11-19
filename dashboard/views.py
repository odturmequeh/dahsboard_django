
from datetime import datetime, timedelta
import os
from django.http import JsonResponse
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Metric, Dimension, RunReportRequest
from urllib.parse import urlparse
from django.views.decorators.csrf import csrf_exempt
from google.generativeai import GenerativeModel, configure
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import json
import google.generativeai as genai


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


def ga4_page_resources(request):
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
        start_date = "2025-10-15"
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

        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="transactionId"),
                    Dimension(name="customEvent:elemento_click_home"),
                    Dimension(name="customEvent:items_purchased"),
                    Dimension(name="customEvent:session_id_final"),
                ],
                metrics=[Metric(name="purchaseRevenue")],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter={"and_group": {"expressions": [{"filter": f} for f in filters]}} if filters else None,
                limit=1000,
            )
        )

        modal_data = [
            {
                "transaction_id": row.dimension_values[0].value,
                "elemento": row.dimension_values[1].value,
                "items_purchased": row.dimension_values[2].value,
                "session_id_final": row.dimension_values[3].value,
                "valor": float(row.metric_values[0].value or 0),
            }
            for row in response.rows
        ]

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
    Retorna flujo de un usuario por session_id, incluyendo clicks y URLs visitadas
    con timestamp válido.
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

        # --- Traer session_id, user_click, page_location y eventTimestamp ---
        response = client.run_report(
            RunReportRequest(
                property=f"properties/{property_id}",
                dimensions=[
                    Dimension(name="customEvent:session_id_final"),
                    Dimension(name="customEvent:user_click"),
                    Dimension(name="pageLocation"),
                    Dimension(name="dateHourMinute"),  # timestamp real de GA4
                ],
                metrics=[],
                date_ranges=[DateRange(start_date=start_date, end_date=end_date)],
                dimension_filter={
                    "filter": {
                        "field_name": "customEvent:session_id_final",
                        "string_filter": {"value": session_id, "match_type": "EXACT"}
                    }
                },
                limit=1000,
            )
        )

        data = []
        for row in response.rows:
            dhm_value = row.dimension_values[3].value
            user_click = row.dimension_values[1].value
            page_url = row.dimension_values[2].value

            # Agregar click si existe
            if user_click not in [None, "", "(not set)"]:
                data.append({
                    "session_id": row.dimension_values[0].value,
                    "type": "click",
                    "detail": user_click,
                    "timestamp": dhm_value
                })

            # Agregar pageview si existe
            if page_url not in [None, "", "(not set)"]:
                data.append({
                    "session_id": row.dimension_values[0].value,
                    "type": "pageview",
                    "detail": page_url,
                    "timestamp": dhm_value
                })

        # Ordenar por timestamp ascendente
        data.sort(key=lambda x: x["timestamp"] if x["timestamp"] is not None else float('inf'))

        # Debug: ver qué se envía al frontend
        print("DEBUG ga4_click_flow data:", data)

        return JsonResponse({"data": data})

    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)
    

@csrf_exempt
def ai_resources_analysis(request):
    try:
        print("📥 RAW BODY:", request.body)

        data = json.loads(request.body.decode("utf-8"))
        print("📥 DATA PARSED:", data)

        resources = data.get("resources", [])
        url = data.get("url", "")

        print("📦 RESOURCES COUNT:", len(resources))
        print("🔗 URL:", url)

        api_key = os.getenv("GEMINI_API_KEY")
        print("🔑 API KEY:", api_key[:5] + "...")

        genai.configure(api_key=api_key)

        # 👇 MODELO CORRECTO
        MODEL_NAME = "models/gemini-2.5-flash"

        model = genai.GenerativeModel(MODEL_NAME)

        prompt = f"""

Actúa como un especialista senior en SEO técnico y rendimiento web. Recibirás esta URL: {url} desde mi dashboard en Django junto con estos recursos: {json.dumps(resources, indent=2)}.

Debes generar exactamente 6 recomendaciones de Core Web Vitals:
- 2 para LCP
- 2 para INP
- 2 para CLS

Cada recomendación debe incluir:
- Problema
- Solución
- Responsable sugerido (Frontend, Soporte, Infraestructura, Diseño o CMS/Contenido)

El análisis debe ser técnico, accionable, profesional y contextualizado. 
No generes introducciones, saludos ni explicaciones. 
Devuelve únicamente el siguiente formato EXACTO, sin JSON, sin tablas, sin corchetes:

LCP:
- PROBLEMA: ...
  SOLUCION: ...
  RESPONSABLE: ...

- PROBLEMA: ...
  SOLUCION: ...
  RESPONSABLE: ...

INP:
- PROBLEMA: ...
  SOLUCION: ...
  RESPONSABLE: ...

- PROBLEMA: ...
  SOLUCION: ...
  RESPONSABLE: ...

CLS:
- PROBLEMA: ...
  SOLUCION: ...
  RESPONSABLE: ...

- PROBLEMA: ...
  SOLUCION: ...
  RESPONSABLE: ...
"""




        print("📝 Enviando prompt a Gemini...")

        response = model.generate_content(prompt)

        print("📤 RESPUESTA GEMINI:", response)

        return JsonResponse({"analysis": response.text})

    except Exception as e:
        print("❌ ERROR:", e)
        return JsonResponse({"error": str(e)}, status=500)


