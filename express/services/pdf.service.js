const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const ANCHO_CARTA = 612;
const ALTO_CARTA = 792;
const MARGEN = 18;

const calcularDimensiones = (anchoImagen, altoImagen) => {
  const anchoDisponible = ANCHO_CARTA - MARGEN * 2;

  const altoDisponible = ALTO_CARTA - MARGEN * 2;

  const escala = Math.min(
    anchoDisponible / anchoImagen,
    altoDisponible / altoImagen,
  );

  return {
    ancho: anchoImagen * escala,
    alto: altoImagen * escala,
  };
};

const incrustarImagen = async (pdf, archivo) => {
  const buffer = await fs.promises.readFile(archivo.path);

  const tipo = String(archivo.mimetype || "").toLowerCase();

  if (tipo === "image/jpeg") {
    return pdf.embedJpg(buffer);
  }

  if (tipo === "image/png") {
    return pdf.embedPng(buffer);
  }

  throw new Error("INVALID_SCANNED_IMAGE");
};

const generarPdfDesdeImagenes = async ({ archivos, carpetaDestino }) => {
  if (!Array.isArray(archivos) || archivos.length === 0) {
    throw new Error("SCANNED_PAGES_REQUIRED");
  }

  const pdf = await PDFDocument.create();

  for (const archivo of archivos) {
    const imagen = await incrustarImagen(pdf, archivo);

    const pagina = pdf.addPage([ANCHO_CARTA, ALTO_CARTA]);

    const dimensiones = calcularDimensiones(imagen.width, imagen.height);

    const x = (ANCHO_CARTA - dimensiones.ancho) / 2;

    const y = (ALTO_CARTA - dimensiones.alto) / 2;

    pagina.drawImage(imagen, {
      x,
      y,
      width: dimensiones.ancho,
      height: dimensiones.alto,
    });
  }

  const bytes = await pdf.save();

  const fecha = new Date().toISOString().replace(/[:.]/g, "-");

  const nombreArchivo = `${fecha}_documento_escaneado.pdf`;

  const rutaArchivo = path.join(carpetaDestino, nombreArchivo);

  await fs.promises.writeFile(rutaArchivo, bytes);

  const estadisticas = await fs.promises.stat(rutaArchivo);

  return {
    nombreArchivo,
    rutaArchivo,
    tamano: estadisticas.size,
  };
};

module.exports = {
  generarPdfDesdeImagenes,
};
