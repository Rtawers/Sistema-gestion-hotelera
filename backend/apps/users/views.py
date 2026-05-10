"""
Views de autenticacion: login, refresh, perfil del usuario, registro.
"""
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.core.permissions import IsAdmin

from .models import User
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegistroUsuarioSerializer,
    UserSerializer,
)


class LoginView(TokenObtainPairView):
    """
    Inicia sesion en el sistema y obtiene tokens JWT.

    Recibe credenciales (usuario y contrasena) y devuelve un par de tokens:
    - access: token de corta duracion (60 min) para autenticar requests.
    - refresh: token de larga duracion (7 dias) para renovar el access.

    Adicionalmente, devuelve los datos basicos del usuario incluyendo su rol,
    para que el cliente (frontend) pueda ajustar la UI sin queries extra.

    Body esperado:
        {
            "username": "<su_usuario>",
            "password": "<su_contrasena>"
        }

    Response 200:
        {
            "access": "<jwt_access_token>",
            "refresh": "<jwt_refresh_token>",
            "user": {
                "id": <int>,
                "username": "<string>",
                "email": "<string>",
                "rol": "ADMIN" | "RECEPCIONISTA" | "HOUSEKEEPING",
                "rol_display": "<string>",
                "es_admin": <boolean>
            }
        }

    Response 401: Credenciales invalidas.
    """
    serializer_class = CustomTokenObtainPairSerializer


class PerfilView(APIView):
    """
    Devuelve los datos del usuario autenticado.

    Requiere header Authorization: Bearer <access_token>.

    Response 200: Datos completos del usuario actual.
    Response 401: Token invalido o expirado.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class RegistroView(generics.CreateAPIView):
    """
    Crea un nuevo usuario en el sistema. Solo accesible por administradores.

    Permite crear cuentas con cualquiera de los 3 roles disponibles:
    - ADMIN
    - RECEPCIONISTA
    - HOUSEKEEPING

    Requiere autenticacion como ADMIN (Bearer token).

    Body esperado:
        {
            "username": "<string>",
            "email": "<string>",
            "password": "<string, min 8 chars>",
            "password_confirm": "<string, debe coincidir>",
            "rol": "ADMIN" | "RECEPCIONISTA" | "HOUSEKEEPING",
            "first_name": "<string, opcional>",
            "last_name": "<string, opcional>",
            "telefono": "<string, opcional>"
        }

    Response 201: Usuario creado exitosamente.
    Response 400: Datos invalidos (passwords no coinciden, username duplicado, etc.).
    Response 403: Solo administradores pueden crear usuarios.
    """
    serializer_class = RegistroUsuarioSerializer
    permission_classes = [IsAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class ListaUsuariosView(generics.ListAPIView):
    """
    Lista todos los usuarios del sistema. Solo accesible por administradores.

    Util para administracion: gestion de cuentas y asignacion de roles.

    Response 200: Array de usuarios.
    Response 403: Solo administradores pueden ver la lista.
    """
    queryset = User.objects.all().order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdmin]