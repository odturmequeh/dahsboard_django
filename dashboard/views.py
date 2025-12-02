
from datetime import datetime, timedelta
import os
from django.http import JsonResponse
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Metric, Dimension, RunReportRequest, FilterExpression, Filter
from urllib.parse import urlparse
from django.views.decorators.csrf import csrf_exempt
from collections import defaultdict



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
    Obtiene recursos de una página con 3 consultas optimizadas:
    A: Datos generales por recurso
    B: Agregado por hora
    C: Agregado por día
    """
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        property_id = os.getenv("GA4_PROPERTY_ID")

        if not credentials_path or not property_id:
            return JsonResponse({"error": "Credenciales o Property ID faltantes"}, status=500)

        # Parámetros
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

        # Normalizar URL
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

        # =====================================================================================
        # 1) CONSULTA A → Datos generales
        # =====================================================================================
        query_general = RunReportRequest(
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
            dimension_filter=FilterExpression(
                filter=Filter(
                    field_name="eventName",
                    string_filter=Filter.StringFilter(
                        match_type=Filter.StringFilter.MatchType.EXACT,
                        value="resource_performance"
                    )
                )
            ),
            limit=5000
        )

        res_general = client.run_report(query_general)

        # Estructura base
        resources = {}

        for row in res_general.rows:
            page_loc = row.dimension_values[0].value
            resource_name = row.dimension_values[1].value
            resource_type = row.dimension_values[2].value

            # Filtrar solo la URL solicitada
            if normalize(page_loc.lower()) != normalized_search:
                continue

            event_count = float(row.metric_values[0].value or 0)
            total_duration = float(row.metric_values[1].value or 0)
            total_size = float(row.metric_values[2].value or 0)
            total_repeat = float(row.metric_values[3].value or 0)

            if resource_name not in resources:
                resources[resource_name] = {
                    "type": resource_type,
                    "event_count": 0,
                    "duration_total": 0,
                    "size_total": 0,
                    "repeat_total": 0,
                    "hourly": {},
                    "daily": {},
                }

            r = resources[resource_name]
            r["event_count"] += event_count
            r["duration_total"] += total_duration
            r["size_total"] += total_size
            r["repeat_total"] += total_repeat

        # =====================================================================================
        # 2) CONSULTA B → Promedio por HORA
        # =====================================================================================
        query_hour = RunReportRequest(
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
            dimension_filter=query_general.dimension_filter,  # Misma condición del eventName
            limit=5000
        )

        res_hour = client.run_report(query_hour)

        for row in res_hour.rows:
            page_loc = row.dimension_values[0].value
            resource_name = row.dimension_values[1].value
            hour = row.dimension_values[2].value

            if normalize(page_loc.lower()) != normalized_search:
                continue

            if resource_name not in resources:
                continue  # Si no existe en general, lo ignoramos

            event_count = float(row.metric_values[0].value or 0)
            duration_total = float(row.metric_values[1].value or 0)

            if event_count > 0:
                avg = duration_total / event_count
                resources[resource_name]["hourly"][hour] = round(avg, 3)

        # =====================================================================================
        # 3) CONSULTA C → Promedio por DÍA
        # =====================================================================================
        query_day = RunReportRequest(
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
            dimension_filter=query_general.dimension_filter,
            limit=5000
        )

        res_day = client.run_report(query_day)

        for row in res_day.rows:
            page_loc = row.dimension_values[0].value
            resource_name = row.dimension_values[1].value
            day = row.dimension_values[2].value

            if normalize(page_loc.lower()) != normalized_search:
                continue

            if resource_name not in resources:
                continue

            event_count = float(row.metric_values[0].value or 0)
            duration_total = float(row.metric_values[1].value or 0)

            if event_count > 0:
                avg = duration_total / event_count
                resources[resource_name]["daily"][day] = round(avg, 3)

        # =====================================================================================
        # Construir salida final
        # =====================================================================================
        output = []

        for name, r in resources.items():
            if r["event_count"] > 0:
                avg_duration = r["duration_total"] / r["event_count"]
                avg_repeat = r["repeat_total"] / r["event_count"]
                avg_size = r["size_total"] / r["event_count"]
            else:
                avg_duration = avg_repeat = avg_size = 0

            output.append({
                "name": name,
                "type": r["type"],
                "duration_avg": round(avg_duration, 3),
                "repeat_avg": round(avg_repeat, 3),
                "size_avg": round(avg_size / 1024, 2),
                "hourly": r["hourly"],
                "daily": r["daily"],
            })

        output.sort(key=lambda x: x["duration_avg"], reverse=True)

        return JsonResponse({
            "url": search_url,
            "resources": output,
            "total_resources": len(output),
        })

    except Exception as e:
        import traceback
        print("ERROR GA4:", traceback.format_exc())
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


