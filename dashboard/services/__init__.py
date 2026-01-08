# dashboard/services/__init__.py
"""
Servicios del dashboard
"""

# ⚠️ COMENTAR TEMPORALMENTE - integration_service tiene dependencia rota
# from .integration_service import integration_service, IntegrationService

# ✅ Este sí funciona
from .pospago_service import pospago_service, PospagoService

__all__ = [
    'pospago_service',
    'PospagoService',
    # 'integration_service',
    # 'IntegrationService',
]