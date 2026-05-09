"""
Fixtures globales de pytest accesibles en cualquier test.
"""
import pytest
from django.contrib.auth import get_user_model

User = get_user_model()


@pytest.fixture
def admin_user(db):
    """Usuario administrador para tests que requieren permisos."""
    return User.objects.create_superuser(
        username="admin_test",
        email="admin@test.local",
        password="testpass123",
    )


@pytest.fixture
def staff_user(db):
    """Usuario staff (recepcionista) para tests."""
    return User.objects.create_user(
        username="recepcionista_test",
        email="recep@test.local",
        password="testpass123",
        is_staff=True,
    )