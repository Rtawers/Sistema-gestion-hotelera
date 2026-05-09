"""
Selectors: funciones puras de LECTURA del dominio hotelero.

Patron Selectors (HackSoftware): separa el codigo de lectura del codigo
de escritura para mejorar testeabilidad, reusabilidad y claridad.

Las funciones aqui NO modifican estado. Solo consultan la BD y
devuelven querysets u objetos.
"""
from datetime import date
from typing import Optional

from django.db.models import QuerySet, Q

from .models import (
    Habitacion,
    Reserva,
    Tarifa,
    TipoHabitacion,
)


# ============================================================
# HABITACIONES
# ============================================================
def habitaciones_disponibles_en_rango(
    fecha_entrada: date,
    fecha_salida: date,
    *,
    hotel_id: Optional[int] = None,
    tipo_id: Optional[int] = None,
) -> QuerySet[Habitacion]:
    """
    Devuelve las habitaciones disponibles para reservar en el rango dado.

    Una habitacion esta disponible si:
    1. Esta activa (activa=True)
    2. NO esta en MANTENIMIENTO
    3. NO tiene reservas activas que se solapen con el rango

    Aplicacion de la formula matematica de solapamiento:
        solapan(R1, R2)  <=>  e1 < s2  AND  e2 < s1

    Esta query usa los indices definidos en el modelo Reserva
    (idx_reserva_solapamiento) para ser eficiente incluso con miles
    de reservas.

    Args:
        fecha_entrada: fecha de check-in deseada
        fecha_salida: fecha de check-out deseada
        hotel_id: filtrar por hotel especifico (opcional)
        tipo_id: filtrar por tipo de habitacion (opcional)

    Returns:
        QuerySet de Habitacion ordenado por numero.

    Raises:
        ValueError si fecha_salida <= fecha_entrada
    """
    if fecha_salida <= fecha_entrada:
        raise ValueError("fecha_salida debe ser posterior a fecha_entrada")

    # Obtenemos los IDs de habitaciones OCUPADAS en el rango
    # (con reservas activas que se solapan)
    habitaciones_ocupadas_ids = Reserva.objects.filter(
        estado__in=Reserva.ESTADOS_BLOQUEAN_HABITACION,
        fecha_entrada__lt=fecha_salida,   # e_otra < s_buscada
        fecha_salida__gt=fecha_entrada,   # s_otra > e_buscada
    ).values_list("habitacion_id", flat=True)

    # Habitaciones disponibles = activas, no en mantenimiento, no ocupadas
    qs = (
        Habitacion.objects
        .filter(activa=True)
        .exclude(estado=Habitacion.Estado.MANTENIMIENTO)
        .exclude(id__in=habitaciones_ocupadas_ids)
        .select_related("hotel", "tipo")  # evita N+1
    )

    if hotel_id is not None:
        qs = qs.filter(hotel_id=hotel_id)
    if tipo_id is not None:
        qs = qs.filter(tipo_id=tipo_id)

    return qs.order_by("piso", "numero")


def habitaciones_por_estado(
    hotel_id: int,
    estado: Optional[str] = None,
) -> QuerySet[Habitacion]:
    """
    Devuelve habitaciones de un hotel filtradas por estado.
    Si estado es None, devuelve todas. Util para el "Plano del Hotel" en HITO 4.
    """
    qs = (
        Habitacion.objects
        .filter(hotel_id=hotel_id, activa=True)
        .select_related("tipo")
        .order_by("piso", "numero")
    )
    if estado:
        qs = qs.filter(estado=estado)
    return qs


# ============================================================
# RESERVAS
# ============================================================
def reservas_activas_de_habitacion(
    habitacion_id: int,
    *,
    desde: Optional[date] = None,
    hasta: Optional[date] = None,
) -> QuerySet[Reserva]:
    """
    Devuelve las reservas activas (no canceladas/no_show) de una habitacion.
    Util para mostrar el calendario del HITO 4.
    """
    qs = (
        Reserva.objects
        .filter(
            habitacion_id=habitacion_id,
            estado__in=Reserva.ESTADOS_BLOQUEAN_HABITACION,
        )
        .select_related("huesped")
        .order_by("fecha_entrada")
    )
    if desde:
        qs = qs.filter(fecha_salida__gt=desde)
    if hasta:
        qs = qs.filter(fecha_entrada__lt=hasta)
    return qs


def reservas_del_dia(fecha: date, hotel_id: Optional[int] = None) -> dict:
    """
    Devuelve un resumen de reservas del dia agrupado en 3 categorias:
    - llegadas: huespedes que entran hoy
    - en_casa: huespedes que ya estan
    - salidas:  huespedes que salen hoy

    Util para el "Panel de Reservas" de la guia.
    """
    base_qs = Reserva.objects.select_related("huesped", "habitacion")
    if hotel_id:
        base_qs = base_qs.filter(hotel_id=hotel_id)

    return {
        "llegadas": base_qs.filter(
            fecha_entrada=fecha,
            estado__in=[Reserva.Estado.PENDIENTE, Reserva.Estado.CONFIRMADA],
        ),
        "en_casa": base_qs.filter(
            fecha_entrada__lte=fecha,
            fecha_salida__gt=fecha,
            estado=Reserva.Estado.CHECKIN,
        ),
        "salidas": base_qs.filter(
            fecha_salida=fecha,
            estado=Reserva.Estado.CHECKIN,
        ),
    }


# ============================================================
# TARIFAS
# ============================================================
def tarifa_aplicable_en_fecha(
    tipo_habitacion: TipoHabitacion,
    fecha: date,
) -> Optional[Tarifa]:
    """
    Encuentra la tarifa vigente para un tipo de habitacion en una fecha dada.

    Si hay multiples tarifas vigentes para esa fecha, devuelve la mas reciente
    (la creada al ultimo). Esto permite "campanias" que sobrescriben temporadas.

    Returns:
        Tarifa o None si no hay tarifa configurada (se usaria precio_base).
    """
    return (
        Tarifa.objects
        .filter(
            tipo_habitacion=tipo_habitacion,
            fecha_inicio__lte=fecha,
            fecha_fin__gte=fecha,
            activa=True,
        )
        .order_by("-created_at")
        .first()
    )


def calcular_precio_estadia(
    tipo_habitacion: TipoHabitacion,
    fecha_entrada: date,
    fecha_salida: date,
) -> dict:
    """
    Calcula el precio total de una estadia sumando dia por dia.

    FORMULA MATEMATICA (sumatoria):
        precio_total = sum(i = entrada -> salida-1) tarifa(i).precio_noche

    Para cada dia, busca la tarifa aplicable. Si no hay tarifa configurada,
    usa el precio_base del tipo de habitacion (fallback seguro).

    Returns:
        dict con:
            - total: Decimal del precio total
            - desglose: lista de dias con su tarifa aplicada
            - num_noches: cantidad de noches

    Esta funcion NO crea reservas (es read-only). El service crear_reserva
    de HITO 3 la usara para calcular el precio_total automaticamente.
    """
    from datetime import timedelta
    from decimal import Decimal

    if fecha_salida <= fecha_entrada:
        raise ValueError("fecha_salida debe ser posterior a fecha_entrada")

    total = Decimal("0.00")
    desglose = []
    fecha_actual = fecha_entrada

    while fecha_actual < fecha_salida:
        tarifa = tarifa_aplicable_en_fecha(tipo_habitacion, fecha_actual)
        precio_dia = tarifa.precio_noche if tarifa else tipo_habitacion.precio_base

        total += precio_dia
        desglose.append({
            "fecha": fecha_actual,
            "tarifa_nombre": tarifa.nombre if tarifa else "Tarifa base",
            "precio_noche": precio_dia,
        })

        fecha_actual += timedelta(days=1)

    return {
        "total": total,
        "desglose": desglose,
        "num_noches": (fecha_salida - fecha_entrada).days,
    }


# ============================================================
# OCUPACION (KPIs)
# ============================================================
def tasa_ocupacion(hotel_id: int, fecha: date) -> dict:
    """
    Calcula la tasa de ocupacion del hotel para una fecha.

    Tasa = (habitaciones_ocupadas / habitaciones_activas_totales) * 100

    Usado en el endpoint GET /api/reportes/ocupacion/?fecha= del HITO 3.
    """
    total_habitaciones = Habitacion.objects.filter(
        hotel_id=hotel_id, activa=True,
    ).count()

    if total_habitaciones == 0:
        return {"total": 0, "ocupadas": 0, "tasa_pct": 0.0}

    ocupadas = Reserva.objects.filter(
        hotel_id=hotel_id,
        estado=Reserva.Estado.CHECKIN,
        fecha_entrada__lte=fecha,
        fecha_salida__gt=fecha,
    ).count()

    tasa = (ocupadas / total_habitaciones) * 100

    return {
        "total": total_habitaciones,
        "ocupadas": ocupadas,
        "tasa_pct": round(tasa, 2),
    }