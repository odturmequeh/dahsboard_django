# backend/database_router.py
"""
Database Router para manejar múltiples bases de datos en Django

Este router dirige automáticamente las consultas a las bases de datos correctas
según el modelo que se esté utilizando.
"""

class DatabaseRouter:
    """
    Router para dirigir operaciones de base de datos a las DBs correctas:
    - Modelos de Django (User, Session, etc.) → 'default' (SQLite)
    - Modelos de ventas → 'ventas_db' (SQL Server)
    - Modelos de whatsapp → 'whatsapp_db' (SQL Server)
    """

    def db_for_read(self, model, **hints):
        """
        Determina qué base de datos usar para operaciones de lectura
        """
        # Modelos relacionados con ventas
        if model._meta.app_label == 'ventas':
            return 'ventas_db'
        
        # Modelos relacionados con whatsapp
        if model._meta.app_label == 'whatsapp':
            return 'whatsapp_db'
        
        # Por defecto, usar SQLite
        return 'default'

    def db_for_write(self, model, **hints):
        """
        Determina qué base de datos usar para operaciones de escritura
        """
        # Modelos relacionados con ventas
        if model._meta.app_label == 'ventas':
            return 'ventas_db'
        
        # Modelos relacionados con whatsapp
        if model._meta.app_label == 'whatsapp':
            return 'whatsapp_db'
        
        # Por defecto, usar SQLite
        return 'default'

    def allow_relation(self, obj1, obj2, **hints):
        """
        Determina si se permiten relaciones entre objetos de diferentes DBs
        """
        # Permitir relaciones entre objetos de la misma app
        if obj1._meta.app_label == obj2._meta.app_label:
            return True
        
        # No permitir relaciones entre apps diferentes (diferentes DBs)
        return False

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Determina si se permiten migraciones en una base de datos específica
        """
        # Solo permitir migraciones de Django en la DB por defecto
        if app_label in ['auth', 'contenttypes', 'sessions', 'admin']:
            return db == 'default'
        
        # No hacer migraciones en las DBs de SQL Server (son legacy)
        if db in ['ventas_db', 'whatsapp_db']:
            return False
        
        # Por defecto, permitir migraciones en 'default'
        return db == 'default'