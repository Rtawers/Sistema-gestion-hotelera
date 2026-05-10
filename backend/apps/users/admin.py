from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "rol", "is_active", "is_staff")
    list_filter = ("rol", "is_active", "is_staff")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Rol y contacto", {"fields": ("rol", "telefono")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("Rol y contacto", {"fields": ("rol", "telefono")}),
    )