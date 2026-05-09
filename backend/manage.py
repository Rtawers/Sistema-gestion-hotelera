#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path

# Cargar .env automaticamente para que DJANGO_SETTINGS_MODULE
# y otras variables esten disponibles sin setearlas manualmente.
try:
    from decouple import config
    settings_module = config(
        "DJANGO_SETTINGS_MODULE",
        default="config.settings.development",
    )
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", settings_module)
except ImportError:
    # Fallback si decouple no esta instalado por algun motivo
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")


def main():
    """Run administrative tasks."""
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()