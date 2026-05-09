"""
Validadores reutilizables del dominio hotelero.

Estos validadores se usan en modelos (validators=[...]), serializers de DRF
y forms del admin. Definirlos aqui evita duplicacion.
"""
import re

from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

from .constants import (
    LONGITUD_DNI,
    LONGITUD_RUC,
    LONGITUD_CE_MIN,
    LONGITUD_CE_MAX,
    MAX_HUESPEDES_POR_HABITACION,
)


def validar_dni(value: str) -> None:
    """
    Valida que el DNI peruano tenga 8 digitos numericos.

    Raises:
        ValidationError si el DNI no cumple el formato.
    """
    if not value.isdigit():
        raise ValidationError(_("El DNI debe contener solo digitos."))
    if len(value) != LONGITUD_DNI:
        raise ValidationError(
            _("El DNI debe tener exactamente %(longitud)d digitos."),
            params={"longitud": LONGITUD_DNI},
        )


def validar_ruc(value: str) -> None:
    """
    Valida RUC peruano: 11 digitos numericos.
    Inicia con 10 (persona natural), 15 (no domiciliado) o 20 (persona juridica).
    """
    if not value.isdigit():
        raise ValidationError(_("El RUC debe contener solo digitos."))
    if len(value) != LONGITUD_RUC:
        raise ValidationError(
            _("El RUC debe tener exactamente %(longitud)d digitos."),
            params={"longitud": LONGITUD_RUC},
        )
    if value[:2] not in ("10", "15", "17", "20"):
        raise ValidationError(
            _("RUC invalido: debe iniciar con 10, 15, 17 o 20.")
        )


def validar_carne_extranjeria(value: str) -> None:
    """Valida CE: entre 9 y 12 caracteres alfanumericos."""
    if not value.isalnum():
        raise ValidationError(
            _("El carne de extranjeria solo acepta letras y numeros.")
        )
    if not (LONGITUD_CE_MIN <= len(value) <= LONGITUD_CE_MAX):
        raise ValidationError(
            _("El carne de extranjeria debe tener entre %(min)d y %(max)d caracteres."),
            params={"min": LONGITUD_CE_MIN, "max": LONGITUD_CE_MAX},
        )


def validar_telefono_peruano(value: str) -> None:
    """
    Valida telefono peruano: 9 digitos (movil) o 7 (fijo Lima).
    Acepta formatos: 999888777, 999-888-777, +51 999888777
    """
    cleaned = re.sub(r"[\s\-\+]", "", value)
    if not cleaned.isdigit():
        raise ValidationError(_("El telefono solo acepta digitos."))
    # Permitir prefijo 51 (Peru)
    if cleaned.startswith("51") and len(cleaned) == 11:
        cleaned = cleaned[2:]
    if len(cleaned) not in (7, 9):
        raise ValidationError(
            _("El telefono debe tener 9 digitos (movil) o 7 (fijo).")
        )


def validar_total_huespedes(num_adultos: int, num_ninos: int) -> None:
    """Valida que el total no exceda el limite del sistema."""
    total = num_adultos + num_ninos
    if total < 1:
        raise ValidationError(_("Debe haber al menos un huesped."))
    if total > MAX_HUESPEDES_POR_HABITACION:
        raise ValidationError(
            _("Maximo %(max)d huespedes por habitacion. Solicitado: %(total)d."),
            params={"max": MAX_HUESPEDES_POR_HABITACION, "total": total},
        )


def intervalos_se_solapan(
    inicio_a, fin_a, inicio_b, fin_b
) -> bool:
    """
    Determina si dos intervalos semi-abiertos [inicio, fin) se solapan.

    Formula matematica formal:
        solapan(A, B)  <=>  inicio_A < fin_B  AND  inicio_B < fin_A

    Esta funcion encapsula la logica para que pueda reutilizarse en
    multiples modelos (Reserva, Tarifa, Estancia, etc.).

    Args:
        inicio_a, fin_a: limites del primer intervalo
        inicio_b, fin_b: limites del segundo intervalo

    Returns:
        True si los intervalos se solapan, False si no.

    Examples:
        >>> from datetime import date
        >>> intervalos_se_solapan(
        ...     date(2026, 6, 28), date(2026, 6, 30),
        ...     date(2026, 6, 29), date(2026, 7, 1),
        ... )
        True
        >>> intervalos_se_solapan(
        ...     date(2026, 6, 28), date(2026, 6, 30),
        ...     date(2026, 6, 30), date(2026, 7, 2),
        ... )
        False
    """
    return inicio_a < fin_b and inicio_b < fin_a