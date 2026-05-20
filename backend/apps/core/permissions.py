"""
Permission classes para el sistema hotelero.

Cada clase verifica si el usuario tiene el rol necesario para acceder a un endpoint especifico.

"""
from rest_framework.permissions import BasePermission, SAFE_METHODS
from apps.users.models import User


#Solo administradores.
class IsAdmin(BasePermission):
    
    message = "Solo el administrador puede realizar esta accion."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.es_admin
        )


#Solo recepcionistas.
class IsRecepcionista(BasePermission):
    
    message = "Solo el recepcionista puede realizar esta accion."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.es_recepcionista
        )

#Solo personal de housekeeping.
class IsHousekeeping(BasePermission):
    
    message = "Solo housekeeping puede realizar esta accion."

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.es_housekeeping
        )


#Recepcionistas y admins (los que gestionan reservas).
class IsRecepcionistaOrAdmin(BasePermission):
    
    message = "Se requiere rol Recepcionista o Admin."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.es_recepcionista or request.user.es_admin


#Personal de housekeeping y admins.
class IsHousekeepingOrAdmin(BasePermission):
    
    message = "Se requiere rol Housekeeping o Admin."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.es_housekeeping or request.user.es_admin


#Lectura para todos los autenticados, escritura solo para admins.
#Util para endpoints de catalogo (hoteles, tipos de habitacion).
class IsAdminOrReadOnly(BasePermission):
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.es_admin