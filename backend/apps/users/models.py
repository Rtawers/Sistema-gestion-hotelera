"""
Modelo Usuario del sistema hotelero.

Decisiones arquitectonicas:
- Heredamos de AbstractUser para mantener todas las features de Django.
- Agregamos un campo `rol` con TextChoices para los 3 perfiles que exige
  la guia USS: Admin, Recepcionista, Housekeeping.
- Properties para saber el rol facilmente sin importar TextChoices fuera.
"""
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Usuario del sistema con rol asignado.

    Los roles determinan a que endpoints puede acceder:
    - ADMIN:         Acceso completo (CRUD hoteles, reportes globales)
    - RECEPCIONISTA: Reservas, check-in/out, folios
    - HOUSEKEEPING:  Solo cambio de estado de habitaciones
    """

    class Rol(models.TextChoices):
        ADMIN = "ADMIN", "Administrador"
        RECEPCIONISTA = "RECEPCIONISTA", "Recepcionista"
        HOUSEKEEPING = "HOUSEKEEPING", "Housekeeping"

    rol = models.CharField(
        max_length=15,
        choices=Rol.choices,
        default=Rol.RECEPCIONISTA,
        help_text="Rol del usuario en el sistema",
    )
    telefono = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = "users"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ["username"]

    # ──────────────────────────────────────────────
    # Properties helpers (sintaxis limpia en views)
    # ──────────────────────────────────────────────
    @property
    def es_admin(self) -> bool:
        return self.rol == self.Rol.ADMIN or self.is_superuser

    @property
    def es_recepcionista(self) -> bool:
        return self.rol == self.Rol.RECEPCIONISTA

    @property
    def es_housekeeping(self) -> bool:
        return self.rol == self.Rol.HOUSEKEEPING

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"