"""
Serializers de la app users.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer base para representar un usuario."""

    rol_display = serializers.CharField(source="get_rol_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "rol",
            "rol_display",
            "telefono",
            "is_active",
        ]
        read_only_fields = ["id", "is_active"]


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer custom de login JWT.
    Incluye el rol del usuario en el payload del token y en la respuesta,
    para que el frontend pueda ajustar la UI sin queries extra.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Claims custom
        token["username"] = user.username
        token["rol"] = user.rol
        token["es_admin"] = user.es_admin
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Datos adicionales en la respuesta del login
        data["user"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "rol": self.user.rol,
            "rol_display": self.user.get_rol_display(),
            "es_admin": self.user.es_admin,
        }
        return data


class RegistroUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para crear nuevos usuarios (solo admin)."""

    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "first_name",
            "last_name",
            "rol",
            "telefono",
            "password",
            "password_confirm",
        ]

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Las contrasenas no coinciden."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    
class PerfilSerializer(serializers.ModelSerializer):
    """Serializer del perfil del usuario logueado."""
    rol_display = serializers.CharField(source="get_rol_display", read_only=True)
    es_admin = serializers.BooleanField(read_only=True)
    es_recepcionista = serializers.BooleanField(read_only=True)
    es_housekeeping = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "rol",
            "rol_display",
            "telefono",
            "es_admin",
            "es_recepcionista",
            "es_housekeeping",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "username", "rol", "date_joined", "last_login"]


class PerfilUpdateSerializer(serializers.ModelSerializer):
    """Serializer para actualizar el perfil propio (campos limitados)."""
    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "telefono"]

class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer para listar usuarios (sin password)."""
    rol_display = serializers.CharField(source="get_rol_display", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "rol",
            "rol_display",
            "telefono",
            "is_active",
            "date_joined",
            "last_login",
        ]


class UsuarioCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear usuarios (con password)."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            "username",
            "password",
            "first_name",
            "last_name",
            "email",
            "rol",
            "telefono",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        return user


class CambiarPasswordSerializer(serializers.Serializer):
    """Serializer para que admin cambie password de un empleado."""
    nueva_password = serializers.CharField(min_length=8, write_only=True)