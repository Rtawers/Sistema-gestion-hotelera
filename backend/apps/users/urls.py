"""URLs de autenticacion."""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    ListaUsuariosView,
    LoginView,
    PerfilView,
    RegistroView,
    PerfilDetailView,
)

app_name = "users"

urlpatterns = [
    # JWT
    path("login/", LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Perfil
    path("me/", PerfilView.as_view(), name="me"),

    # Gestion de usuarios (solo admin)
    path("registro/", RegistroView.as_view(), name="registro"),
    path("usuarios/", ListaUsuariosView.as_view(), name="lista_usuarios"),
    path("perfil/", PerfilDetailView.as_view(), name="perfil-detalle"),
]