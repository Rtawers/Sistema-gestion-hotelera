"""
Views de autenticacion: login, refresh, perfil del usuario, registro.
"""
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.generics import RetrieveUpdateAPIView



from apps.core.permissions import IsAdmin

from .models import User
from .serializers import (
    PerfilSerializer,
    PerfilUpdateSerializer,
    CustomTokenObtainPairSerializer,
    RegistroUsuarioSerializer,
    UserSerializer,
    UsuarioListSerializer,
    UsuarioCreateSerializer,
    CambiarPasswordSerializer,

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

class PerfilDetailView(RetrieveUpdateAPIView):
    """
    GET /api/v1/auth/perfil/    -> ver perfil del usuario logueado
    PATCH /api/v1/auth/perfil/  -> actualizar campos limitados
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ["PATCH", "PUT"]:
            return PerfilUpdateSerializer
        return PerfilSerializer

class UsuarioViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/auth/usuarios/        -> listar (solo ADMIN)
    POST   /api/v1/auth/usuarios/        -> crear empleado (solo ADMIN)
    PATCH  /api/v1/auth/usuarios/{id}/   -> actualizar (solo ADMIN)
    DELETE /api/v1/auth/usuarios/{id}/   -> desactivar (solo ADMIN)
    POST   /api/v1/auth/usuarios/{id}/cambiar-password/ -> reset password
    """
    queryset = User.objects.all().order_by("-date_joined")
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return UsuarioCreateSerializer
        return UsuarioListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Solo ADMIN puede gestionar usuarios
        if self.request.user.rol != "ADMIN":
            return qs.none()
        return qs

    def create(self, request, *args, **kwargs):
        # Solo ADMIN puede crear usuarios
        if request.user.rol != "ADMIN":
            return Response(
                {"detail": "No tienes permisos para crear usuarios."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Log de auditoria
        from apps.hoteleria.services import registrar_log
        registrar_log(
            usuario=request.user,
            accion="USUARIO_CREADO",
            detalles={
                "usuario_id": user.id,
                "username": user.username,
                "rol": user.rol,
            },
            ip=request.META.get("REMOTE_ADDR"),
        )

        # Devolver con el serializer de lectura
        out = UsuarioListSerializer(user)
        return Response(out.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="cambiar-password")
    def cambiar_password(self, request, pk=None):
        """Admin resetea la password de un empleado."""
        if request.user.rol != "ADMIN":
            return Response(
                {"detail": "No tienes permisos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        usuario = self.get_object()
        serializer = CambiarPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario.set_password(serializer.validated_data["nueva_password"])
        usuario.save()

        return Response({"detail": f"Password de {usuario.username} actualizada"})

    @action(detail=True, methods=["post"], url_path="activar")
    def activar(self, request, pk=None):
        """Admin activa/desactiva un usuario."""
        if request.user.rol != "ADMIN":
            return Response(
                {"detail": "No tienes permisos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        usuario = self.get_object()
        usuario.is_active = not usuario.is_active
        usuario.save()

        return Response({
            "detail": f"Usuario {usuario.username} {'activado' if usuario.is_active else 'desactivado'}",
            "is_active": usuario.is_active,
        })