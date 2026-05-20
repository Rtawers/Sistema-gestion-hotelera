"""
Constantes del dominio hotelero.

Centralizar estos valores facilita el mantenimiento:
- Si SUNAT cambia el IGV, se modifica en un solo lugar.
- Si se ajusta una regla de negocio, no hay que buscar valores hardcodeados.
"""
from decimal import Decimal
from django.db import models

# ──────────────────────────────────────────────────────────
# IMPUESTOS PERU
# ──────────────────────────────────────────────────────────
IGV_RATE = Decimal("0.18")  # 18% IGV Peru
IGV_PERCENTAGE = 18

# ──────────────────────────────────────────────────────────
# REGLAS DE NEGOCIO HOTELERAS
# ──────────────────────────────────────────────────────────
MIN_NOCHES_RESERVA = 1
MAX_NOCHES_RESERVA = 365  # un ano maximo
MIN_ANTICIPACION_RESERVA_DIAS = 0  # se permite walk-in (mismo dia)
MAX_ANTICIPACION_RESERVA_DIAS = 365  # un ano maximo de adelanto

# Capacidad maxima absoluta (defensa contra inputs maliciosos)
MAX_HUESPEDES_POR_HABITACION = 10

# ──────────────────────────────────────────────────────────
# REDONDEO CONTABLE (banker's rounding por defecto)
# ──────────────────────────────────────────────────────────
DECIMAL_PRECISION = Decimal("0.01")  # 2 decimales

# ──────────────────────────────────────────────────────────
# MENSAJES DE ERROR ESTANDARIZADOS
# ──────────────────────────────────────────────────────────
ERROR_FECHAS_INVALIDAS = "La fecha de salida debe ser posterior a la de entrada."
ERROR_SOLAPAMIENTO = (
    "Conflicto de fechas: la habitacion {numero} ya tiene una reserva "
    "({entrada} a {salida}) que se solapa con el rango solicitado."
)
ERROR_CAPACIDAD_EXCEDIDA = (
    "La habitacion soporta maximo {capacidad} personas. Solicitado: {total}."
)
ERROR_HABITACION_NO_DISPONIBLE = (
    "No se puede hacer check-in en una habitacion con estado {estado}."
)
ERROR_FOLIO_CON_DEUDA = (
    "No se puede cerrar el folio: existen cargos sin pagar."
)

# ──────────────────────────────────────────────────────────
# DOCUMENTOS DE IDENTIDAD (Peru)
# ──────────────────────────────────────────────────────────
LONGITUD_DNI = 8
LONGITUD_RUC = 11
LONGITUD_CE_MIN = 9   # Carne de extranjeria
LONGITUD_CE_MAX = 12

class MetodoPago(models.TextChoices):
    
    EFECTIVO = "EFECTIVO", "Efectivo"
    TARJETA = "TARJETA", "Tarjeta de crédito/débito"
    TRANSFERENCIA = "TRANSFERENCIA", "Transferencia bancaria"
    YAPE = "YAPE", "Yape"
    PLIN = "PLIN", "Plin"