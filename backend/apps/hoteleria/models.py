"""
Modelos del dominio hotelero.

Decisiones arquitectonicas (sustentables en la rubrica AG-C08):

1. Decimal en lugar de float para todos los montos (precision contable, SUNAT-ready).
2. TextChoices para enumerar estados (integridad a nivel de aplicacion).
3. CheckConstraint a nivel de BD (defensa en profundidad: ni con SQL puro
   se puede insertar data invalida).
4. Validacion de solapamiento de fechas en clean() del modelo (formula matematica
   formal: e1 < s2 AND e2 < s1).
5. Indices estrategicos en campos de busqueda frecuente.
6. db_table explicito (mejor mantenimiento que el nombre auto-generado).
"""
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import F, Q, Sum, CheckConstraint, UniqueConstraint
from django.utils import timezone


# ============================================================
# MIXIN: Auditoria (created_at / updated_at)
# ============================================================
class TimeStampedModel(models.Model):
    """
    Mixin abstracto que agrega timestamps a cualquier modelo.
    No crea tabla propia (abstract = True).
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Creado en")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Actualizado en")

    class Meta:
        abstract = True


# ============================================================
# 1. HOTEL
# ============================================================
class Hotel(TimeStampedModel):
    """Establecimiento hotelero. El sistema soporta multi-hotel."""

    nombre = models.CharField(max_length=150)
    ruc = models.CharField(
        max_length=11,
        unique=True,
        help_text="RUC peruano de 11 digitos",
    )
    direccion = models.CharField(max_length=255)
    estrellas = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
    )
    telefono = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        db_table = "hotel"
        verbose_name = "Hotel"
        verbose_name_plural = "Hoteles"
        ordering = ["nombre"]

    def __str__(self):
        return f"{self.nombre} ({self.estrellas} estrellas)"


# ============================================================
# 2. TIPO DE HABITACION
# ============================================================
class TipoHabitacion(TimeStampedModel):
    """
    Catalogo de tipos: Single, Doble, Suite, etc.
    Las amenidades se guardan como JSON para flexibilidad
    (ej. {"wifi": true, "minibar": true, "tv_cable": false}).
    """

    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name="tipos_habitacion",
    )
    nombre = models.CharField(max_length=80)
    capacidad = models.PositiveSmallIntegerField(
        help_text="Numero maximo de huespedes",
    )
    precio_base = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
        help_text="Precio base por noche en S/. Se sobrescribe con Tarifa por temporada.",
    )
    amenidades = models.JSONField(
        default=dict,
        blank=True,
        help_text='Ej: {"wifi": true, "minibar": false, "tv": true}',
    )
    descripcion = models.TextField(blank=True)

    class Meta:
        db_table = "tipo_habitacion"
        verbose_name = "Tipo de habitacion"
        verbose_name_plural = "Tipos de habitacion"
        constraints = [
            UniqueConstraint(
                fields=["hotel", "nombre"],
                name="uq_tipo_habitacion_por_hotel",
            ),
            CheckConstraint(
                check=Q(precio_base__gt=0),
                name="ck_tipo_precio_base_positivo",
            ),
            CheckConstraint(
                check=Q(capacidad__gte=1),
                name="ck_tipo_capacidad_minima",
            ),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.hotel.nombre})"


# ============================================================
# 3. HABITACION
# ============================================================
class Habitacion(TimeStampedModel):
    """
    Habitacion fisica del hotel con su estado actual.
    Los 4 estados son los que la guia exige para el "Plano del Hotel".
    """

    class Estado(models.TextChoices):
        DISPONIBLE = "DISPONIBLE", "Disponible"
        OCUPADA = "OCUPADA", "Ocupada"
        LIMPIEZA = "LIMPIEZA", "En limpieza"
        MANTENIMIENTO = "MANTENIMIENTO", "Mantenimiento"

    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name="habitaciones",
    )
    tipo = models.ForeignKey(
        TipoHabitacion,
        on_delete=models.PROTECT,
        related_name="habitaciones",
    )
    numero = models.CharField(max_length=10, help_text='Ej: "101", "PH-1"')
    piso = models.PositiveSmallIntegerField()
    estado = models.CharField(
        max_length=15,
        choices=Estado.choices,
        default=Estado.DISPONIBLE,
    )
    activa = models.BooleanField(
        default=True,
        help_text="Si esta en False, no aparece en busquedas de disponibilidad",
    )

    class Meta:
        db_table = "habitacion"
        verbose_name = "Habitacion"
        verbose_name_plural = "Habitaciones"
        ordering = ["hotel", "piso", "numero"]
        constraints = [
            UniqueConstraint(
                fields=["hotel", "numero"],
                name="uq_habitacion_numero_por_hotel",
            ),
        ]
        indexes = [
            models.Index(fields=["estado"], name="idx_habitacion_estado"),
            models.Index(fields=["hotel", "estado"], name="idx_habitacion_hotel_estado"),
        ]

    def __str__(self):
        return f"Hab. {self.numero} - Piso {self.piso} ({self.get_estado_display()})"


# ============================================================
# 4. HUESPED
# ============================================================
class Huesped(TimeStampedModel):
    """
    Cliente del hotel. Se identifica por documento (DNI / CE / Pasaporte)
    para soportar huespedes nacionales y extranjeros.
    """

    class TipoDoc(models.TextChoices):
        DNI = "DNI", "DNI"
        CE = "CE", "Carne de extranjeria"
        PAS = "PAS", "Pasaporte"

    tipo_doc = models.CharField(max_length=4, choices=TipoDoc.choices)
    num_doc = models.CharField(max_length=20)
    nombres = models.CharField(max_length=120)
    apellidos = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    nacionalidad = models.CharField(max_length=60, default="Peruana")
    fecha_nacimiento = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "huesped"
        verbose_name = "Huesped"
        verbose_name_plural = "Huespedes"
        ordering = ["apellidos", "nombres"]
        constraints = [
            UniqueConstraint(
                fields=["tipo_doc", "num_doc"],
                name="uq_huesped_documento",
            ),
        ]
        indexes = [
            models.Index(fields=["num_doc"], name="idx_huesped_num_doc"),
            models.Index(fields=["apellidos"], name="idx_huesped_apellidos"),
        ]

    @property
    def nombre_completo(self) -> str:
        return f"{self.apellidos}, {self.nombres}"

    def __str__(self):
        return f"{self.nombre_completo} ({self.tipo_doc}: {self.num_doc})"


# ============================================================
# 5. TARIFA (precios dinamicos por temporada)
# ============================================================
class Tarifa(TimeStampedModel):
    """
    Tarifa vigente para un TipoHabitacion en un rango de fechas.

    El servicio TarifaService (HITO 3) buscara la tarifa aplicable DIA POR DIA,
    permitiendo que una reserva atraviese multiples temporadas.

    Ejemplo:
        Tarifa "Fin de ano":     2026-12-26 -> 2026-12-31  S/ 250
        Tarifa "Ano nuevo":      2027-01-01 -> 2027-01-05  S/ 320

        Reserva del 30-dic al 3-ene:
            - 30, 31 dic -> S/ 250 x 2 = 500
            - 1, 2 ene   -> S/ 320 x 2 = 640
            TOTAL = S/ 1140
    """

    tipo_habitacion = models.ForeignKey(
        TipoHabitacion,
        on_delete=models.CASCADE,
        related_name="tarifas",
    )
    nombre = models.CharField(
        max_length=100,
        help_text='Ej: "Temporada Alta Verano 2026"',
    )
    precio_noche = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activa = models.BooleanField(default=True)

    class Meta:
        db_table = "tarifa"
        verbose_name = "Tarifa"
        verbose_name_plural = "Tarifas"
        ordering = ["-fecha_inicio"]
        constraints = [
            CheckConstraint(
                check=Q(fecha_fin__gte=F("fecha_inicio")),
                name="ck_tarifa_rango_valido",
            ),
            CheckConstraint(
                check=Q(precio_noche__gt=0),
                name="ck_tarifa_precio_positivo",
            ),
        ]
        indexes = [
            models.Index(
                fields=["tipo_habitacion", "fecha_inicio", "fecha_fin"],
                name="idx_tarifa_busqueda",
            ),
        ]

    def __str__(self):
        return f"{self.nombre}: S/ {self.precio_noche} ({self.fecha_inicio} a {self.fecha_fin})"


# ============================================================
# 6. RESERVA  *** NUCLEO DEL SISTEMA ***
# ============================================================
class Reserva(TimeStampedModel):
    """
    Reserva de habitacion. Punto critico del sistema.

    REGLAS DE NEGOCIO (segun guia USS Proyecto 7):
    - Una habitacion no puede tener 2 reservas activas con fechas solapadas.
    - fecha_salida > fecha_entrada (no se permite reserva de 0 noches).
    - Al menos 1 adulto.
    - El precio_total se calcula automaticamente via TarifaService (HITO 3).
    """

    class Estado(models.TextChoices):
        PENDIENTE = "PENDIENTE", "Pendiente"
        CONFIRMADA = "CONFIRMADA", "Confirmada"
        CHECKIN = "CHECKIN", "Check-in realizado"
        CHECKOUT = "CHECKOUT", "Check-out realizado"
        CANCELADA = "CANCELADA", "Cancelada"
        NO_SHOW = "NO_SHOW", "No show"

    class Origen(models.TextChoices):
        WEB = "WEB", "Web directa"
        TELEFONO = "TELEFONO", "Telefono"
        WALKIN = "WALKIN", "Walk-in"
        OTA = "OTA", "OTA (Booking, Expedia)"

    # Estados que SI bloquean la habitacion (cuentan para solapamiento)
    ESTADOS_BLOQUEAN_HABITACION = [
        Estado.PENDIENTE,
        Estado.CONFIRMADA,
        Estado.CHECKIN,
    ]

    hotel = models.ForeignKey(
        Hotel,
        on_delete=models.PROTECT,
        related_name="reservas",
    )
    huesped = models.ForeignKey(
        Huesped,
        on_delete=models.PROTECT,
        related_name="reservas",
    )
    habitacion = models.ForeignKey(
        Habitacion,
        on_delete=models.PROTECT,
        related_name="reservas",
    )
    fecha_entrada = models.DateField()
    fecha_salida = models.DateField()
    num_adultos = models.PositiveSmallIntegerField(default=1)
    num_ninos = models.PositiveSmallIntegerField(default=0)
    estado = models.CharField(
        max_length=15,
        choices=Estado.choices,
        default=Estado.PENDIENTE,
    )
    origen = models.CharField(
        max_length=10,
        choices=Origen.choices,
        default=Origen.WEB,
    )
    precio_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Calculado automaticamente sumando tarifas dia a dia",
    )
    observaciones = models.TextField(blank=True)
    creada_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservas_creadas",
    )

    class Meta:
        db_table = "reserva"
        verbose_name = "Reserva"
        verbose_name_plural = "Reservas"
        ordering = ["-fecha_entrada"]
        constraints = [
            CheckConstraint(
                check=Q(fecha_salida__gt=F("fecha_entrada")),
                name="ck_reserva_salida_mayor_entrada",
            ),
            CheckConstraint(
                check=Q(num_adultos__gte=1),
                name="ck_reserva_min_un_adulto",
            ),
            CheckConstraint(
                check=Q(precio_total__gte=0),
                name="ck_reserva_precio_no_negativo",
            ),
        ]
        indexes = [
            models.Index(
                fields=["habitacion", "fecha_entrada", "fecha_salida"],
                name="idx_reserva_solapamiento",
            ),
            models.Index(fields=["estado"], name="idx_reserva_estado"),
            models.Index(fields=["fecha_entrada"], name="idx_reserva_fecha_entrada"),
        ]

    # ------------------------------------------------------
    # VALIDACION MATEMATICA DE SOLAPAMIENTO
    # ------------------------------------------------------
    def clean(self):
        """
        Valida la regla mas critica: no permitir reservas solapadas
        en la misma habitacion.

        FORMULA FORMAL (intervalos semi-abiertos [in, out)):
            existe_solapamiento  <=>  e1 < s2  AND  e2 < s1

        DEMOSTRACION:
            Sea R1 = [e1, s1) y R2 = [e2, s2).
            Si e1 >= s2  ->  R1 empieza despues de que R2 termina  -> NO solape
            Si e2 >= s1  ->  R2 empieza despues de que R1 termina  -> NO solape
            La conjuncion de las negaciones es la condicion de solape.

        EXCLUYE reservas en estado CANCELADA o NO_SHOW (liberan la habitacion).
        """
        super().clean()

        # 1. Validacion temporal basica
        if self.fecha_salida <= self.fecha_entrada:
            raise ValidationError({
                "fecha_salida": "La fecha de salida debe ser posterior a la de entrada.",
            })

        # 2. Validacion de capacidad (solo si ya hay habitacion asignada)
        if self.habitacion_id:
            capacidad = self.habitacion.tipo.capacidad
            total_huespedes = self.num_adultos + self.num_ninos
            if total_huespedes > capacidad:
                raise ValidationError({
                    "num_adultos": (
                        f"La habitacion soporta maximo {capacidad} personas. "
                        f"Solicitado: {total_huespedes}."
                    ),
                })

        # 3. Validacion de solapamiento (la fundamental)
        if self.habitacion_id:
            solapamiento_qs = Reserva.objects.filter(
                habitacion=self.habitacion,
                estado__in=self.ESTADOS_BLOQUEAN_HABITACION,
                fecha_entrada__lt=self.fecha_salida,   # e_otra < s_self
                fecha_salida__gt=self.fecha_entrada,   # s_otra > e_self
            )

            # Si la reserva ya existe (update), excluirse a si misma
            if self.pk:
                solapamiento_qs = solapamiento_qs.exclude(pk=self.pk)

            if solapamiento_qs.exists():
                conflicto = solapamiento_qs.first()
                raise ValidationError(
                    f"Conflicto de fechas: la habitacion {self.habitacion.numero} "
                    f"ya tiene una reserva ({conflicto.fecha_entrada} a {conflicto.fecha_salida}) "
                    f"que se solapa con el rango solicitado "
                    f"({self.fecha_entrada} a {self.fecha_salida})."
                )

    @property
    def num_noches(self) -> int:
        """Cantidad de noches de la reserva (delta entre fechas)."""
        return (self.fecha_salida - self.fecha_entrada).days

    @property
    def total_huespedes(self) -> int:
        return self.num_adultos + self.num_ninos

    def save(self, *args, **kwargs):
        """Garantiza que clean() siempre se ejecute, incluso desde el shell."""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"Reserva #{self.pk or 'nueva'} - {self.huesped.nombre_completo} "
            f"({self.fecha_entrada} a {self.fecha_salida})"
        )


# ============================================================
# 7. ESTANCIA (se crea al hacer check-in)
# ============================================================
class Estancia(TimeStampedModel):
    """
    Representa la estancia real del huesped (post check-in).
    Una reserva genera UNA estancia (relacion 1-1).
    """

    class Estado(models.TextChoices):
        EN_CURSO = "EN_CURSO", "En curso"
        FINALIZADA = "FINALIZADA", "Finalizada"

    reserva = models.OneToOneField(
        Reserva,
        on_delete=models.PROTECT,
        related_name="estancia",
    )
    habitacion = models.ForeignKey(
        Habitacion,
        on_delete=models.PROTECT,
        related_name="estancias",
    )
    fecha_checkin = models.DateTimeField(default=timezone.now)
    fecha_checkout = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(
        max_length=12,
        choices=Estado.choices,
        default=Estado.EN_CURSO,
    )
    observaciones = models.TextField(blank=True)

    class Meta:
        db_table = "estancia"
        verbose_name = "Estancia"
        verbose_name_plural = "Estancias"
        ordering = ["-fecha_checkin"]

    def __str__(self):
        return f"Estancia #{self.pk} - {self.get_estado_display()}"


# ============================================================
# 8. CARGOS DE LA ESTANCIA
# ============================================================
class CargoEstancia(TimeStampedModel):
    """
    Cargos extras durante la estancia: restaurante, lavanderia, minibar, etc.
    Se acumulan en el Folio del huesped.
    """

    class Tipo(models.TextChoices):
        HABITACION = "HABITACION", "Habitacion"
        RESTAURANTE = "RESTAURANTE", "Restaurante"
        LAVANDERIA = "LAVANDERIA", "Lavanderia"
        MINIBAR = "MINIBAR", "Minibar"
        SPA = "SPA", "Spa"
        OTRO = "OTRO", "Otro"

    class MetodoPago(models.TextChoices):
        EFECTIVO = "EFECTIVO", "Efectivo"
        TARJETA = "TARJETA", "Tarjeta"
        TRANSFERENCIA = "TRANSFERENCIA", "Transferencia"
        YAPE = "YAPE", "Yape"
        PLIN = "PLIN", "Plin"

    estancia = models.ForeignKey(
        Estancia,
        on_delete=models.CASCADE,
        related_name="cargos",
    )
    concepto = models.CharField(max_length=200)
    monto = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    tipo = models.CharField(
        max_length=15,
        choices=Tipo.choices,
        default=Tipo.OTRO,
    )
    fecha = models.DateTimeField(default=timezone.now)
    pagado = models.BooleanField(default=False)
    metodo_pago = models.CharField(
        max_length=20,
        choices=MetodoPago.choices,
        null=True,
        blank=True,
        verbose_name="Método de pago",
    )
    fecha_pago = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Fecha de pago",
    )
    registrado_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "cargo_estancia"
        verbose_name = "Cargo de estancia"
        verbose_name_plural = "Cargos de estancia"
        ordering = ["-fecha"]
        constraints = [
            CheckConstraint(
                check=Q(monto__gt=0),
                name="ck_cargo_monto_positivo",
            ),
        ]
        indexes = [
            models.Index(fields=["estancia", "tipo"], name="idx_cargo_estancia_tipo"),
        ]

    def __str__(self):
        return f"{self.concepto}: S/ {self.monto}"


# ============================================================
# 9. FOLIO (cuenta consolidada del huesped)
# ============================================================
class Folio(TimeStampedModel):
    """
    Cuenta consolidada de la estancia (subtotal + IGV + total).

    REGLA TRIBUTARIA (Peru):
        IGV = 18% sobre la base imponible
        total = subtotal + IGV
    """

    class Estado(models.TextChoices):
        ABIERTO = "ABIERTO", "Abierto"
        CERRADO = "CERRADO", "Cerrado"

    # Constante centralizada (si SUNAT cambia el IGV, se modifica aqui)
    IGV_RATE = Decimal("0.18")

    estancia = models.OneToOneField(
        Estancia,
        on_delete=models.PROTECT,
        related_name="folio",
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    igv = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal("0.00"),
    )
    estado = models.CharField(
        max_length=10,
        choices=Estado.choices,
        default=Estado.ABIERTO,
    )
    fecha_cierre = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "folio"
        verbose_name = "Folio"
        verbose_name_plural = "Folios"

    def recalcular(self) -> None:
        """
        Recalcula los montos sumando todos los cargos de la estancia.

            subtotal = sum(cargos.monto)
            igv      = subtotal * 0.18  (redondeado a 2 decimales)
            total    = subtotal + igv

        El uso de quantize(Decimal("0.01")) garantiza redondeo
        contable estandar (banker's rounding).
        """
        cargos_total = self.estancia.cargos.aggregate(
            total=Sum("monto"),
        )["total"] or Decimal("0.00")

        self.subtotal = cargos_total
        self.igv = (cargos_total * self.IGV_RATE).quantize(Decimal("0.01"))
        self.total = (self.subtotal + self.igv).quantize(Decimal("0.01"))
        self.save(update_fields=["subtotal", "igv", "total", "updated_at"])

    @property
    def tiene_deuda(self) -> bool:
        """True si hay al menos un cargo no pagado en la estancia."""
        return self.estancia.cargos.filter(pagado=False).exists()

    def __str__(self):
        return f"Folio #{self.pk} - Total S/ {self.total} ({self.get_estado_display()})"