# backend/settings_updated.py
"""
CONFIGURACIÓN ACTUALIZADA DE DJANGO CON SQL SERVER

"""

from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-#85q)i84n2%oj3wf13xua@zi8rv+yv_j()nud_*e+rh!(k3a%g'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ["*"]

RENDER_EXTERNAL_HOSTNAME = os.getenv("RENDER_EXTERNAL_HOSTNAME")
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Apps internas
    'dashboard',
    "corsheaders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'backend' / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

### NUEVO ### ========================================
# Database Configuration - Múltiples bases de datos
# ===================================================

DATABASES = {
    # SQLite para datos de Django (sesiones, autenticación, etc.)
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    },
    
    # SQL Server - DB_Ventas
    'ventas_db': {
        'ENGINE': 'mssql',
        'NAME': os.getenv('SQLSERVER_VENTAS_DB', 'DB_Ventas'),
        'USER': os.getenv('SQLSERVER_USER', 'usr_admin'),
        'PASSWORD': os.getenv('SQLSERVER_PASSWORD', 'An4l1t1c$_01'),
        'HOST': os.getenv('SQLSERVER_HOST', '100.126.28.123'),
        'PORT': os.getenv('SQLSERVER_PORT', '9500'),
        'OPTIONS': {
            'driver':  'ODBC Driver 17 for SQL Server', 
            'extra_params': 'TrustServerCertificate=yes;Encrypt=yes;',
        },
    },
    
    # SQL Server - DB_Whatsapp
    'whatsapp_db': {
        'ENGINE': 'mssql',
        'NAME': os.getenv('SQLSERVER_WHATSAPP_DB', 'DB_Whatsapp'),
        'USER': os.getenv('SQLSERVER_USER', 'usr_admin'),
        'PASSWORD': os.getenv('SQLSERVER_PASSWORD', 'An4l1t1c$_01'),
        'HOST': os.getenv('SQLSERVER_HOST', '100.126.28.123'),
        'PORT': os.getenv('SQLSERVER_PORT', '9500'),
        'OPTIONS': {
            'driver':  'ODBC Driver 17 for SQL Server', 
            'extra_params': 'TrustServerCertificate=yes;Encrypt=yes;',
        },
    },
}

# Database Router (Opcional - para dirigir automáticamente las consultas)
DATABASE_ROUTERS = ['backend.database_router.DatabaseRouter']

### FIN NUEVO ### ====================================

# Google Analytics 4
GA4_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "/etc/secrets/ga4-service.json")
GA4_PROPERTY_ID = os.getenv("GA4_PROPERTY_ID")

print("USANDO CREDENCIALES GA4:", GA4_CREDENTIALS)

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'es-co'
TIME_ZONE = 'America/Bogota'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / "backend" / "static",
]
STATIC_ROOT = BASE_DIR / "staticfiles"

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Logging configuration para SQL Server
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG' if DEBUG else 'INFO',
        },
    },
}
