/**
 * Generador de PDF para Folios de Hotel.
 *
 * Requiere:
 * npm install jspdf jspdf-autotable
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Estancia, Folio, CargoEstancia } from "../types/api.types";
import { formatearFecha, formatearMoneda } from "./format";

export function generarPDFFolio(
  estancia: Estancia,
  folio: Folio,
): void {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();

  // ─── HEADER ──────────────────────────────────────────
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("HOTEL USS", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Sistema de Gestion Hotelera", 14, 25);

  // Folio ID (derecha)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`FOLIO #${estancia.id}`, pageWidth - 14, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Generado: ${new Date().toLocaleDateString("es-PE")}`,
    pageWidth - 14,
    25,
    { align: "right" },
  );

  // ─── DATOS DEL HUESPED ───────────────────────────────
  let y = 45;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("DATOS DEL HUESPED", 14, y);

  doc.setDrawColor(220);
  doc.line(14, y + 2, pageWidth - 14, y + 2);

  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(40);

  doc.text(`Nombre: ${estancia.huesped.nombre_completo}`, 14, y);
  y += 7;

  doc.text(
    `Documento: ${estancia.huesped.tipo_doc} ${estancia.huesped.num_doc}`,
    14,
    y,
  );
  y += 7;

  doc.text(
    `Habitacion: ${estancia.habitacion.numero} - ${estancia.habitacion.tipo_nombre}`,
    14,
    y,
  );
  y += 7;

  doc.text(
    `Check-in: ${formatearFecha(estancia.fecha_checkin.split("T")[0])}`,
    14,
    y,
  );
  y += 7;

  if (estancia.fecha_checkout) {
    doc.text(
      `Check-out: ${formatearFecha(estancia.fecha_checkout.split("T")[0])}`,
      14,
      y,
    );
    y += 7;
  }

  // ─── DETALLE DE CARGOS ───────────────────────────────
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("DETALLE DE CARGOS", 14, y);

  const rows = folio.cargos.map((cargo: CargoEstancia) => [
    cargo.concepto,
    cargo.tipo_display,
    cargo.pagado ? "Pagado" : "Pendiente",
    formatearMoneda(cargo.monto),
  ]);

  autoTable(doc, {
    startY: y + 5,
    head: [["Concepto", "Tipo", "Estado", "Monto"]],
    body: rows,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      3: { halign: "right" },
    },
  });

  // Posicion final de la tabla
  const finalY =
    (
      doc as jsPDF & {
        lastAutoTable?: { finalY: number };
      }
    ).lastAutoTable?.finalY || 150;

  // ─── TOTALES ─────────────────────────────────────────
  let totalY = finalY + 15;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(30);

  doc.text("Subtotal:", pageWidth - 60, totalY);
  doc.text(
    formatearMoneda(folio.subtotal),
    pageWidth - 14,
    totalY,
    { align: "right" },
  );

  totalY += 8;

  doc.text("IGV (18%):", pageWidth - 60, totalY);
  doc.text(
    formatearMoneda(folio.igv),
    pageWidth - 14,
    totalY,
    { align: "right" },
  );

  totalY += 10;

  doc.setDrawColor(200);
  doc.line(pageWidth - 60, totalY - 4, pageWidth - 14, totalY - 4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(20, 83, 45);
  doc.text("TOTAL:", pageWidth - 60, totalY);
  doc.text(
    formatearMoneda(folio.total),
    pageWidth - 14,
    totalY,
    { align: "right" },
  );

  // ─── ESTADO DEL FOLIO ────────────────────────────────
  totalY += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  if (folio.tiene_deuda) {
    doc.setTextColor(180, 83, 9);
    doc.text("Estado: Existen cargos pendientes de pago", 14, totalY);
  } else {
    doc.setTextColor(22, 101, 52);
    doc.text("Estado: Todos los cargos fueron pagados", 14, totalY);
  }

  // ─── FOOTER ──────────────────────────────────────────
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(120);

  doc.text(
    `Generado el ${new Date().toLocaleString("es-PE")}`,
    14,
    285,
  );

  doc.text(
    "Hotel USS - Sistema de Gestion Hotelera",
    pageWidth - 14,
    285,
    { align: "right" },
  );

  // ─── DESCARGAR ───────────────────────────────────────
  doc.save(`folio-${estancia.id}.pdf`);
}