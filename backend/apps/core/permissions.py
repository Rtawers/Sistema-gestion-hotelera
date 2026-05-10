"""
Permission classes para el sistema hotelero.

Cada clase verifica si el usuario tiene el rol necesario
para acceder a un endpoint especifico.

Uso en un ViewSet:
    class ReservaViewSet(ModelViewSet):
        permission_classes = [IsRecepcionistaOrAdmin]
"""
from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.users.models import User


class IsAdmin(BasePermission):
    """Solo administradores."""
    message = "Solo el administrador puede realizar esta accion."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.es_admin
        )


class IsRecepcionista(BasePermission):
    """Solo recepcionistas."""
    message = "Solo el recepcionista puede realizar esta accion."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.es_recepcionista
        )


class IsHousekeeping(BasePermission):
    """Solo personal de housekeeping."""
    message = "Solo housekeeping puede realizar esta accion."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.es_housekeeping
        )


class IsRecepcionistaOrAdmin(BasePermission):
    """Recepcionistas y admins (los que gestionan reservas)."""
    message = "Se requiere rol Recepcionista o Admin."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.es_recepcionista or request.user.es_admin


class IsHousekeepingOrAdmin(BasePermission):
    """Personal de housekeeping y admins."""
    message = "Se requiere rol Housekeeping o Admin."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.es_housekeeping or request.user.es_admin


class IsAdminOrReadOnly(BasePermission):
    """
    Lectura para todos los autenticados, escritura solo para admins.
    Util para endpoints de catalogo (hoteles, tipos de habitacion).
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.es_admin