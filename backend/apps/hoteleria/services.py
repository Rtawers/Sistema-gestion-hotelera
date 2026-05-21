"""
Services del dominio hotelero (capa de ESCRITURA).

Patron Services (HackSoftware):
- Cada funcion ejecuta UN caso de uso del negocio.
- Operaciones transaccionales con @transaction.atomic.
- Validaciones de negocio antes de modificar la BD.
- Return del objeto modificado para el caller.

Estos services son llamados desde:
- ViewSets de DRF (HITO 3 Parte 5)
- Comandos de management
- Tareas de Celery (futuro)
- Tests directos (HITO 3 Parte 6)
"""
from datetime import date
from decimal import Decimal
from typing import Optional

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from . import selectors
from .constants import (
    ERROR_FOLIO_CON_DEUDA,
    ERROR_HABITACION_NO_DISPONIBLE,
)
from .models import (
    CargoEstancia,
    Estancia,
    Folio,
    Habitacion,
    Hotel,
    Huesped,
    Reserva,
)

User = get_user_model()


# ============================================================
# RESERVAS
# ============================================================
@transaction.atomic
def crear_reserva(
    *,
    hotel: Hotel,
    huesped: Huesped,
    habitacion: Habitacion,
    fecha_entrada: date,
    fecha_salida: date,
    num_adultos: int = 1,
    num_ninos: int = 0,
    origen: str = "WEB",
    observaciones: str = "",
    creada_por: Optional[User] = None,
) -> Reserva:
    """
    Crea una reserva con calculo automatico del precio.

    PROCESO:
    1. Calcula el precio_total sumando tarifa dia a dia (selector).
    2. Crea la Reserva (el modelo valida solapamiento via clean()).
    3. Devuelve la reserva ya con precio_total calculado.

    PRINCIPIOS APLICADOS:
    - @transaction.atomic: si algo falla, NADA se guarda (consistencia ACID).
    - Calculo de precio via selector calcular_precio_estadia (DRY).
    - El modelo valida solapamiento (single source of truth).

    Args:
        hotel: hotel donde se reserva
        huesped: cliente que reserva
        habitacion: habitacion solicitada
        fecha_entrada: check-in
        fecha_salida: check-out
        num_adultos: 1 minimo
        num_ninos: opcional
        origen: WEB / TELEFONO / WALKIN / OTA
        observaciones: notas opcionales
        creada_por: usuario del sistema que crea la reserva

    Returns:
        Reserva creada con precio_total calculado.

    Raises:
        ValidationError si hay solapamiento, capacidad excedida, etc.
    """
    # 1. Calcular precio dia por dia (formula sumatoria del HITO 2)
    calculo = selectors.calcular_precio_estadia(
        tipo_habitacion=habitacion.tipo,
        fecha_entrada=fecha_entrada,
        fecha_salida=fecha_salida,
    )

# 2. Crear la reserva (el modelo valida solapamiento via clean())
    reserva = Reserva(
        hotel=hotel,
        huesped=huesped,
        habitacion=habitacion,
        fecha_entrada=fecha_entrada,
        fecha_salida=fecha_salida,
        num_adultos=num_adultos,
        num_ninos=num_ninos,
        origen=origen,
        observaciones=observaciones,
        precio_total=calculo["total"],
        estado=Reserva.Estado.CONFIRMADA,
        creada_por=creada_por,
    )
    reserva.full_clean()   # ACTIVA validacion del modelo: overlap + capacidad + fechas
    reserva.save()

    return reserva


@transaction.atomic
def cancelar_reserva(*, reserva: Reserva, motivo: str = "") -> Reserva:
    """
    Cancela una reserva y libera la habitacion para nuevas reservas.

    REGLAS:
    - Solo se pueden cancelar reservas PENDIENTE o CONFIRMADA.
    - Las reservas en CHECKIN ya no se cancelan, se hace checkout normal.
    """
    if reserva.estado not in [
        Reserva.Estado.PENDIENTE,
        Reserva.Estado.CONFIRMADA,
    ]:
        raise ValidationError(
            f"No se puede cancelar una reserva en estado "
            f"{reserva.get_estado_display()}."
        )

    reserva.estado = Reserva.Estado.CANCELADA
    if motivo:
        reserva.observaciones = (
            (reserva.observaciones or "") + f"\n[CANCELADA] {motivo}"
        ).strip()
    reserva.save(update_fields=["estado", "observaciones", "updated_at"])

    return reserva

@transaction.atomic
def confirmar_reserva(*, reserva: Reserva, usuario):
    """
    Confirma una reserva pendiente.
    PENDIENTE -> CONFIRMADA
    """

    if reserva.estado != Reserva.Estado.PENDIENTE:
        raise ValidationError(
            f"Solo se pueden confirmar reservas PENDIENTES. Estado actual: {reserva.estado}"
        )

    reserva.estado = Reserva.Estado.CONFIRMADA
    reserva.save(update_fields=["estado", "updated_at"])

    return reserva


# ============================================================
# CHECK-IN
# ============================================================
@transaction.atomic
def hacer_checkin(
    *,
    reserva: Reserva,
    usuario: Optional[User] = None,
) -> Estancia:
    """
    Realiza el check-in de una reserva.

    PROCESO:
    1. Valida que la reserva este en estado CONFIRMADA.
    2. Valida que la habitacion este DISPONIBLE u OCUPADA (no en MANTENIMIENTO ni LIMPIEZA).
    3. Crea la Estancia.
    4. Crea el Folio asociado.
    5. Agrega cargo automatico de la habitacion al folio.
    6. Cambia estado de la habitacion a OCUPADA.
    7. Cambia estado de la reserva a CHECKIN.

    Todo dentro de @transaction.atomic: si algo falla, NADA se guarda.

    Returns:
        Estancia creada (con folio asociado).
    """
    # 1. Validar estado de la reserva
    if reserva.estado != Reserva.Estado.CONFIRMADA:
        raise ValidationError(
            f"Solo se puede hacer check-in de reservas CONFIRMADAS. "
            f"Estado actual: {reserva.get_estado_display()}."
        )

    # 2. Validar estado de la habitacion (REGLA CRITICA de la guia USS)
    if reserva.habitacion.estado in [
        Habitacion.Estado.MANTENIMIENTO,
        Habitacion.Estado.LIMPIEZA,
    ]:
        raise ValidationError(
            ERROR_HABITACION_NO_DISPONIBLE.format(
                estado=reserva.habitacion.get_estado_display()
            )
        )

    # 3. Crear Estancia
    estancia = Estancia.objects.create(
        reserva=reserva,
        habitacion=reserva.habitacion,
        fecha_checkin=timezone.now(),
        estado=Estancia.Estado.EN_CURSO,
    )

    # 4. Crear Folio asociado
    Folio.objects.create(estancia=estancia)

    # 5. Agregar cargo automatico de habitacion (precio total de la reserva)
    CargoEstancia.objects.create(
        estancia=estancia,
        concepto=(
            f"Habitacion {reserva.habitacion.numero} "
            f"({reserva.num_noches} noches)"
        ),
        monto=reserva.precio_total,
        tipo=CargoEstancia.Tipo.HABITACION,
        registrado_por=usuario,
    )

    # 6. Recalcular el folio para incluir el cargo de habitacion
    estancia.folio.recalcular()

    # 7. Cambiar estado de habitacion a OCUPADA
    reserva.habitacion.estado = Habitacion.Estado.OCUPADA
    reserva.habitacion.save(update_fields=["estado", "updated_at"])

    # 8. Cambiar estado de reserva a CHECKIN
    reserva.estado = Reserva.Estado.CHECKIN
    reserva.save(update_fields=["estado", "updated_at"])

    return estancia


# ============================================================
# CHECK-OUT  *** CON HOUSEKEEPING AUTOMATICO ***
# ============================================================
@transaction.atomic
def hacer_checkout(
    *,
    estancia: Estancia,
    usuario: Optional[User] = None,
) -> Folio:
    """
    Realiza el check-out: cierra el folio y libera la habitacion.

    REGLA DE NEGOCIO CRITICA (de la guia USS, pagina 20):
        "Al hacer checkout la habitacion pasa automaticamente a LIMPIEZA"

    PROCESO:
    1. Validar que la estancia este EN_CURSO.
    2. Recalcular el folio (incluir todos los cargos).
    3. Validar que NO haya cargos sin pagar (regla de la guia).
    4. Cerrar el folio.
    5. Cambiar habitacion a LIMPIEZA (housekeeping flow automatico).
    6. Cerrar la estancia.
    7. Cambiar reserva a CHECKOUT.

    Returns:
        Folio cerrado.
    """
    # 1. Validar estado de estancia
    if estancia.estado != Estancia.Estado.EN_CURSO:
        raise ValidationError(
            f"Solo se puede hacer check-out de estancias EN_CURSO. "
            f"Estado actual: {estancia.get_estado_display()}."
        )

    # 2. Recalcular folio (asegura que incluye cargos recientes)
    folio = estancia.folio
    folio.recalcular()

    # 3. Validar que no haya deuda (REGLA DE LA GUIA USS pag 20)
    if folio.tiene_deuda:
        raise ValidationError(ERROR_FOLIO_CON_DEUDA)

    # 4. Cerrar folio
    folio.estado = Folio.Estado.CERRADO
    folio.fecha_cierre = timezone.now()
    folio.save(update_fields=["estado", "fecha_cierre", "updated_at"])

    # 5. *** HOUSEKEEPING AUTOMATICO ***
    #    Habitacion -> LIMPIEZA al hacer checkout (regla pagina 20)
    habitacion = estancia.habitacion
    habitacion.estado = Habitacion.Estado.LIMPIEZA
    habitacion.save(update_fields=["estado", "updated_at"])

    # 6. Cerrar estancia
    estancia.fecha_checkout = timezone.now()
    estancia.estado = Estancia.Estado.FINALIZADA
    estancia.save(update_fields=["fecha_checkout", "estado", "updated_at"])

    # 7. Cambiar reserva a CHECKOUT
    reserva = estancia.reserva
    reserva.estado = Reserva.Estado.CHECKOUT
    reserva.save(update_fields=["estado", "updated_at"])

    return folio


# ============================================================
# CARGOS (restaurante, lavanderia, minibar...)
# ============================================================
@transaction.atomic
def agregar_cargo(
    *,
    estancia: Estancia,
    concepto: str,
    monto: Decimal,
    tipo: str = CargoEstancia.Tipo.OTRO,
    usuario: Optional[User] = None,
) -> CargoEstancia:
    """
    Agrega un cargo a la estancia y recalcula el folio.

    Validaciones:
    - La estancia debe estar EN_CURSO.
    - El monto debe ser positivo.
    """
    if estancia.estado != Estancia.Estado.EN_CURSO:
        raise ValidationError(
            "Solo se pueden agregar cargos a estancias EN_CURSO."
        )

    if monto <= Decimal("0.00"):
        raise ValidationError("El monto debe ser positivo.")

    cargo = CargoEstancia.objects.create(
        estancia=estancia,
        concepto=concepto,
        monto=monto,
        tipo=tipo,
        registrado_por=usuario,
    )

    # Recalcular folio (subtotal + IGV + total)
    estancia.folio.recalcular()

    return cargo


@transaction.atomic
def pagar_cargos_pendientes(*, estancia: Estancia, metodo_pago: str = "EFECTIVO") -> int:
    """
    Marca todos los cargos pendientes de una estancia como pagados.
    Necesario antes de hacer checkout.

    Args:
        estancia: La estancia cuyos cargos se van a pagar.
        metodo_pago: Método de pago (EFECTIVO, TARJETA, TRANSFERENCIA, YAPE, PLIN).

    Returns:
        Cantidad de cargos marcados como pagados.
    """
    actualizados = estancia.cargos.filter(pagado=False).update(
        pagado=True,
        metodo_pago=metodo_pago,
        fecha_pago=timezone.now(),
    )
    return actualizados


# ============================================================
# HOUSEKEEPING
# ============================================================
@transaction.atomic
def actualizar_estado_habitacion(
    *,
    habitacion: Habitacion,
    nuevo_estado: str,
    usuario: Optional[User] = None,
) -> Habitacion:
    """
    Cambia el estado de una habitacion (housekeeping flow).

    TRANSICIONES PERMITIDAS:
        DISPONIBLE    -> MANTENIMIENTO   (admin marca para reparar)
        DISPONIBLE    -> OCUPADA         (al hacer check-in)
        OCUPADA       -> LIMPIEZA        (al hacer checkout, automatico)
        LIMPIEZA      -> DISPONIBLE      (housekeeping marca como lista)
        LIMPIEZA      -> MANTENIMIENTO   (si se detecta dano)
        MANTENIMIENTO -> DISPONIBLE      (terminado el mantenimiento)

    NO PERMITIDAS:
        OCUPADA -> DISPONIBLE     (debe pasar por LIMPIEZA primero)
        OCUPADA -> MANTENIMIENTO  (debe completarse el checkout primero)
    """
    estado_actual = habitacion.estado
    transiciones_validas = {
        Habitacion.Estado.DISPONIBLE: [
            Habitacion.Estado.MANTENIMIENTO,
            Habitacion.Estado.OCUPADA,
        ],
        Habitacion.Estado.OCUPADA: [
            Habitacion.Estado.LIMPIEZA,
        ],
        Habitacion.Estado.LIMPIEZA: [
            Habitacion.Estado.DISPONIBLE,
            Habitacion.Estado.MANTENIMIENTO,
        ],
        Habitacion.Estado.MANTENIMIENTO: [
            Habitacion.Estado.DISPONIBLE,
        ],
    }

    if nuevo_estado not in transiciones_validas.get(estado_actual, []):
        raise ValidationError(
            f"Transicion invalida: no se puede ir de "
            f"{habitacion.get_estado_display()} a {nuevo_estado}."
        )

    habitacion.estado = nuevo_estado
    habitacion.save(update_fields=["estado", "updated_at"])

    return habitacion

# ============================================================
# AUDITORIA (HU15)
# ============================================================
def registrar_log(*, usuario, accion: str, detalles: dict = None, ip: str = None):
    """
    Registra una accion en la bitacora de auditoria.
    Importable desde views.py y signals.
    """
    from .models import LogAuditoria

    return LogAuditoria.objects.create(
        usuario=usuario,
        accion=accion,
        detalles=detalles or {},
        ip=ip,
    )


# ============================================================
# RESERVA PUBLICA (HU01 - cliente externo reserva)
# ============================================================
@transaction.atomic
def crear_reserva_publica(
    *,
    habitacion: Habitacion,
    check_in,
    check_out,
    tipo_doc: str,
    num_doc: str,
    nombres: str,
    apellidos: str,
    email: str,
    telefono: str,
    adultos: int = 1,
    ninos: int = 0,
) -> "Reserva":
    """
    Crea una reserva desde el portal publico (sin login).

    Estado inicial:
        PENDIENTE

    Flujo:
        WEB -> PENDIENTE -> CONFIRMADA -> CHECKIN -> ESTANCIA
    """
    from .models import Reserva
    from apps.hoteleria.models import Huesped

    # =========================================================
    # 1. Buscar o crear huesped
    # =========================================================
    huesped, creado = Huesped.objects.get_or_create(
        num_doc=num_doc,
        defaults={
            "tipo_doc": tipo_doc,
            "nombres": nombres,
            "apellidos": apellidos,
            "email": email,
            "telefono": telefono,
            "nacionalidad": "Peruana",
        },
    )

    # Actualizar contacto si ya existia
    if not creado:
        if email:
            huesped.email = email

        if telefono:
            huesped.telefono = telefono

        huesped.save()

    # =========================================================
    # 2. Validar disponibilidad
    # =========================================================
    overlap = Reserva.objects.filter(
        habitacion=habitacion,
        estado__in=[
            Reserva.Estado.PENDIENTE,
            Reserva.Estado.CONFIRMADA,
        ],
        fecha_entrada__lt=check_out,
        fecha_salida__gt=check_in,
    ).exists()

    if overlap:
        raise ValidationError(
            f"La habitacion {habitacion.numero} "
            f"no esta disponible en esas fechas."
        )

    # =========================================================
    # 3. Calcular precio total
    # =========================================================
    calculo = selectors.calcular_precio_estadia(
        tipo_habitacion=habitacion.tipo,
        fecha_entrada=check_in,
        fecha_salida=check_out,
    )

    # =========================================================
    # 4. Crear reserva 
    # =========================================================
    reserva = Reserva(
        hotel=habitacion.hotel,
        huesped=huesped,
        habitacion=habitacion,
        fecha_entrada=check_in,
        fecha_salida=check_out,
        num_adultos=adultos,
        num_ninos=ninos,
        precio_total=calculo["total"],
        estado=Reserva.Estado.PENDIENTE,
        origen="WEB",
    )
    reserva.full_clean()   # Doble seguridad: valida overlap + capacidad + fechas
    reserva.save()


    # =========================================================
    # 5. Auditoria
    # =========================================================
    registrar_log(
        usuario=None,
        accion="RESERVA_CREADA",
        detalles={
            "reserva_id": reserva.id,
            "habitacion": habitacion.numero,
            "huesped_doc": num_doc,
            "origen": "WEB_PUBLICO_PORTAL",
            "precio_total": str(reserva.precio_total),
        },
    )

    return reserva