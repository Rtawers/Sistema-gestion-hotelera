"""Configuración de desarrollo."""
from .base import *  # noqa

DEBUG = True
ALLOWED_HOSTS = ["*"]

# CORS abierto en dev
CORS_ALLOW_ALL_ORIGINS = True

# Email a consola en dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Debug toolbar (opcional pero útil para detectar N+1)
INSTALLED_APPS += ["debug_toolbar", "django_extensions"]
MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware"] + MIDDLEWARE
INTERNAL_IPS = ["127.0.0.1"]