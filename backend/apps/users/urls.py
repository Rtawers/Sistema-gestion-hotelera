"""URLs de autenticacion y gestion de usuarios."""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    PerfilView,
    RegistroView,
    PerfilDetailView,
    UsuarioViewSet,
)

app_name = "users"

# Router DRF para el CRUD completo de usuarios
router = DefaultRouter()
router.register("usuarios", UsuarioViewSet, basename="usuarios")

urlpatterns = [
    # ── JWT auth ──────────────────────────────────────
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ── Perfil del usuario logueado ───────────────────
    path("me/", PerfilView.as_view(), name="me"),
    path("perfil/", PerfilDetailView.as_view(), name="perfil-detalle"),

    # ── Registro publico de usuario (legacy) ──────────
    path("registro/", RegistroView.as_view(), name="registro"),

    # ── CRUD de usuarios (admin) ──────────────────────
    # El router proporciona:
    # GET    /usuarios/             (listar)
    # POST   /usuarios/             (crear empleado)
    # GET    /usuarios/{id}/        (detalle)
    # PATCH  /usuarios/{id}/        (actualizar)
    # DELETE /usuarios/{id}/        (eliminar)
    # POST   /usuarios/{id}/cambiar-password/
    # POST   /usuarios/{id}/activar/
    path("", include(router.urls)),
]