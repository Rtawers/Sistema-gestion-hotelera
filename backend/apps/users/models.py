from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Usuario del sistema de gestión hotelera.
    En HITO 3 añadiremos el campo 'rol' (Admin / Recepcionista / Housekeeping).
    Por ahora, hereda todo de AbstractUser de Django.
    """

    class Meta:
        db_table = "users"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return self.username