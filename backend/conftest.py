"""
Fixtures globales de pytest accesibles en cualquier test.
"""
import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


# ═══════════════════════════════════════════════════════════════
# USUARIOS POR ROL
# ═══════════════════════════════════════════════════════════════
@pytest.fixture
def admin_user(db):
    """Usuario con rol ADMIN."""
    return User.objects.create_superuser(
        username="admin_test",
        email="admin@test.local",
        password="testpass123",
        rol=User.Rol.ADMIN,
    )


@pytest.fixture
def recepcionista_user(db):
    """Usuario con rol RECEPCIONISTA."""
    return User.objects.create_user(
        username="recep_test",
        email="recep@test.local",
        password="testpass123",
        rol=User.Rol.RECEPCIONISTA,
    )


@pytest.fixture
def housekeeping_user(db):
    """Usuario con rol HOUSEKEEPING."""
    return User.objects.create_user(
        username="hk_test",
        email="hk@test.local",
        password="testpass123",
        rol=User.Rol.HOUSEKEEPING,
    )


# Alias para mantener compatibilidad con tests anteriores
@pytest.fixture
def staff_user(recepcionista_user):
    return recepcionista_user


# ═══════════════════════════════════════════════════════════════
# CLIENTES API AUTENTICADOS
# ═══════════════════════════════════════════════════════════════
@pytest.fixture
def api_client():
    """APIClient sin autenticar (para probar 401)."""
    return APIClient()


@pytest.fixture
def admin_client(admin_user):
    """APIClient autenticado como ADMIN."""
    client = APIClient()
    client.force_authenticate(user=admin_user)
    return client


@pytest.fixture
def recepcionista_client(recepcionista_user):
    """APIClient autenticado como RECEPCIONISTA."""
    client = APIClient()
    client.force_authenticate(user=recepcionista_user)
    return client


@pytest.fixture
def housekeeping_client(housekeeping_user):
    """APIClient autenticado como HOUSEKEEPING."""
    client = APIClient()
    client.force_authenticate(user=housekeeping_user)
    return client