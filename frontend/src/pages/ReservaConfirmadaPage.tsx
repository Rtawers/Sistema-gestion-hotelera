/**
 * Pantalla mostrada despues de que el cliente externo crea una reserva
 * desde el portal publico. Le da el codigo de su reserva.
 */
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle2, Hotel, Calendar, Home } from "lucide-react";
import { Button } from "../components/ui/Button";

export function ReservaConfirmadaPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
        {/* Icono de exito */}
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Reserva creada exitosamente!
        </h1>

        <p className="text-gray-600 mb-6">
          Hemos recibido tu solicitud de reserva. Te contactaremos pronto para
          confirmar los detalles.
        </p>

        {/* Codigo de reserva */}
        <div className="bg-primary-50 border-2 border-dashed border-primary-300 rounded-xl p-4 mb-6">
          <p className="text-xs text-primary-700 font-medium mb-1">
            Tu código de reserva
          </p>
          <p className="text-3xl font-bold text-primary-700 font-mono">
            {codigo}
          </p>
        </div>

        {/* Info adicional */}
        <div className="text-left space-y-3 mb-6 text-sm">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Estado: PENDIENTE</p>
              <p className="text-gray-600">
                Nuestro equipo revisará tu reserva y te confirmará por correo o
                teléfono en las próximas horas.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Hotel className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Al llegar al hotel</p>
              <p className="text-gray-600">
                Presenta tu código de reserva y documento de identidad en
                recepción.
              </p>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            icon={<Home className="w-4 h-4" />}
            onClick={() => navigate("/reservar")}
            className="w-full"
          >
            Hacer otra reserva
          </Button>
        </div>

        {/* Pie */}
        <p className="text-xs text-gray-400 mt-6">
          Guarda este código en un lugar seguro. Te será solicitado al
          check-in.
        </p>
      </div>
    </div>
  );
}