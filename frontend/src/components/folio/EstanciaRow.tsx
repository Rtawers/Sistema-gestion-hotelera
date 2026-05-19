/**
 * Fila de una estancia con info clave y boton para abrir el folio.
 */
import { useState } from "react";
import { FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { formatearMoneda, formatearFecha } from "../../utils/format";
import { FolioModal } from "./FolioModal";
import type { Estancia } from "../../types/api.types";

interface EstanciaRowProps {
  estancia: Estancia;
}

export function EstanciaRow({ estancia }: EstanciaRowProps) {
  const [folioOpen, setFolioOpen] = useState(false);
  const folio = estancia.folio;
return (
  <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
    <td className="py-3 px-4 text-sm text-gray-500 font-mono">
      #{estancia.id}
    </td>

    {/* Huesped */}
    <td className="py-3 px-4">
      <p className="font-medium text-gray-900">
        {estancia.huesped.nombre_completo}
      </p>
      <p className="text-xs text-gray-500">
        {estancia.huesped.tipo_doc}: {estancia.huesped.num_doc}
      </p>
    </td>

    {/* Habitacion */}
    <td className="py-3 px-4">
      <p className="font-medium text-gray-900">
        Hab. {estancia.habitacion.numero}
      </p>
      <p className="text-xs text-gray-500">
        {estancia.habitacion.tipo_nombre}
      </p>
    </td>

    {/* Check-in */}
    <td className="py-3 px-4">
      <p className="text-sm text-gray-900">
        {formatearFecha(estancia.fecha_checkin.split("T")[0])}
      </p>
    </td>

    {/* Estado */}
    <td className="py-3 px-4">
      <Badge
        color={estancia.estado === "EN_CURSO" ? "green" : "gray"}
      >
        {estancia.estado_display}
      </Badge>
    </td>

    {/* Total */}
    <td className="py-3 px-4 text-right">
      <p className="font-semibold text-gray-900">
        {formatearMoneda(folio.total)}
      </p>

      {folio.tiene_deuda ? (
        <span className="inline-flex items-center gap-1 text-xs text-amber-700">
          <AlertTriangle className="w-3 h-3" />
          Con deuda
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-green-700">
          <CheckCircle2 className="w-3 h-3" />
          Pagado
        </span>
      )}
    </td>

    {/* Acciones */}
    <td className="py-3 px-4 text-right">
      <Button
        variant="primary"
        size="sm"
        icon={<FileText className="w-3.5 h-3.5" />}
        onClick={() => setFolioOpen(true)}
      >
        Ver Folio
      </Button>

      <FolioModal
        isOpen={folioOpen}
        onClose={() => setFolioOpen(false)}
        estancia={estancia}
      />
    </td>
  </tr>
);

}