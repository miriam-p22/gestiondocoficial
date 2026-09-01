const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

const prisma = require("../db/client");

// ======================================================
// VALIDACIONES
// ======================================================

const convertirId = (valor) => {
  const id = Number(valor);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    throw new Error("INVALID_ID");
  }

  return id;
};

const validarFechaTexto = (valor) => {
  if (!valor) {
    return null;
  }

  const texto =
    String(valor).trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      texto
    )
  ) {
    throw new Error(
      "INVALID_DATE"
    );
  }

  const [anio, mes, dia] =
    texto
      .split("-")
      .map(Number);

  const fecha =
    new Date(
      anio,
      mes - 1,
      dia
    );

  if (
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    throw new Error(
      "INVALID_DATE"
    );
  }

  return {
    texto,
    anio,
    mes,
    dia,
  };
};

const convertirFechaInicio = (
  valor
) => {
  const partes =
    validarFechaTexto(
      valor
    );

  if (!partes) {
    return null;
  }

  return new Date(
    partes.anio,
    partes.mes - 1,
    partes.dia,
    0,
    0,
    0,
    0
  );
};

const convertirFechaFin = (
  valor
) => {
  const partes =
    validarFechaTexto(
      valor
    );

  if (!partes) {
    return null;
  }

  return new Date(
    partes.anio,
    partes.mes - 1,
    partes.dia,
    23,
    59,
    59,
    999
  );
};

// ======================================================
// NOMBRE SEGURO PARA ZIP
// ======================================================

const nombreSeguro = (
  valor
) => {
  return String(
    valor || "archivo"
  )
    .replace(
      /[<>:"/\\|?*\x00-\x1F]/g,
      "_"
    )
    .replace(
      /\s+/g,
      "_"
    );
};

// ======================================================
// RESOLVER ARCHIVO
// ======================================================

const obtenerRutaArchivo = (
  rutaRelativa
) => {
  if (!rutaRelativa) {
    return null;
  }

  const raiz =
    path.resolve(
      process.cwd()
    );

  const absoluta =
    path.resolve(
      raiz,
      rutaRelativa
    );

  /*
    Evitamos rutas fuera
    del proyecto.
  */

  const relativa =
    path.relative(
      raiz,
      absoluta
    );

  if (
    relativa.startsWith(
      ".."
    ) ||
    path.isAbsolute(
      relativa
    )
  ) {
    return null;
  }

  if (
    !fs.existsSync(
      absoluta
    )
  ) {
    return null;
  }

  return absoluta;
};

// ======================================================
// CONSULTAR DOCUMENTOS
// ======================================================

const obtenerDocumentos =
  async ({
    idArea = null,
    desde = null,
    hasta = null,
  }) => {
    const where = {};

    const fechaInicio =
      convertirFechaInicio(
        desde
      );

    const fechaFin =
      convertirFechaFin(
        hasta
      );

    if (
      fechaInicio &&
      fechaFin &&
      fechaInicio.getTime() >
        fechaFin.getTime()
    ) {
      throw new Error(
        "INVALID_DATE"
      );
    }

    if (
      fechaInicio ||
      fechaFin
    ) {
      where.fecha_recepcion =
        {};

      if (fechaInicio) {
        where.fecha_recepcion.gte =
          fechaInicio;
      }

      if (fechaFin) {
        where.fecha_recepcion.lte =
          fechaFin;
      }
    }

    /*
      Si es respaldo de área,
      solamente obtenemos
      dispersiones destinadas
      a esa área.
    */

    if (idArea !== null) {
      where.destinos = {
        some: {
          id_area:
            idArea,
        },
      };
    }

    return prisma.dispersion.findMany({
      where,

      include: {
        destinos: {
          where:
            idArea !== null
              ? {
                  id_area:
                    idArea,
                }
              : undefined,

          include: {
            area: {
              select: {
                id: true,
                nombre_area: true,
              },
            },
          },
        },

        eventos: {
          where:
            idArea !== null
              ? {
                  OR: [
                    {
                      id_area:
                        idArea,
                    },
                    {
                      id_area:
                        null,
                    },
                  ],
                }
              : undefined,

          include: {
            area: {
              select: {
                id: true,
                nombre_area: true,
              },
            },
          },

          orderBy: {
            fecha:
              "asc",
          },
        },
      },

      orderBy: {
        fecha_recepcion:
          "asc",
      },
    });
  };

// ======================================================
// CREAR MANIFEST
// ======================================================

const construirManifest = (
  documentos,
  {
    tipo,
    idArea,
    desde,
    hasta,
  }
) => {
  return {
    generado_en:
      new Date()
        .toISOString(),

    tipo_respaldo:
      tipo,

    id_area:
      idArea,

    rango: {
      desde,
      hasta,
    },

    total_documentos:
      documentos.length,

    documentos:
      documentos.map(
        (documento) => ({
          id:
            documento.id,

          nombre_archivo:
            documento.nombre_archivo,

          archivo:
            documento.archivo,

          tipo_archivo:
            documento.tipo_archivo,

          tamano_archivo:
            documento.tamano_archivo,

          extension:
            documento.extension,

          origen:
            documento.origen,

          fecha_recepcion:
            documento.fecha_recepcion,

          destinos:
            documento.destinos.map(
              (destino) => ({
                id_area:
                  destino.id_area,

                area:
                  destino.area
                    ?.nombre_area ||
                  null,

                estado_envio:
                  destino.estado_envio,

                fecha_envio:
                  destino.fecha_envio,

                estado_documento:
                  destino.estado_documento,

                fecha_limite:
                  destino.fecha_limite,

                fecha_recepcion_area:
                  destino.fecha_recepcion_area,

                fecha_inicio_proceso:
                  destino.fecha_inicio_proceso,

                fecha_atencion:
                  destino.fecha_atencion,

                motivo_devolucion:
                  destino.motivo_devolucion,

                comentario_devolucion:
                  destino.comentario_devolucion,
              })
            ),

          eventos:
            documento.eventos.map(
              (evento) => ({
                id:
                  evento.id,

                id_area:
                  evento.id_area,

                area:
                  evento.area
                    ?.nombre_area ||
                  null,

                tipo_evento:
                  evento.tipo_evento,

                comentario:
                  evento.comentario,

                archivo:
                  evento.archivo,

                fecha:
                  evento.fecha,
              })
            ),
        })
      ),
  };
};

// ======================================================
// GENERAR ZIP
// ======================================================

const generarZip = async (
  res,
  {
    tipo,
    idArea = null,
    desde = null,
    hasta = null,
  }
) => {
  const documentos =
    await obtenerDocumentos({
      idArea,
      desde,
      hasta,
    });

  if (
    documentos.length ===
    0
  ) {
    throw new Error(
      "NO_DOCUMENTS"
    );
  }

  const fecha =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  const sufijo =
    idArea !== null
      ? `area_${idArea}`
      : "general";

  const sufijoRango =
    desde && hasta
      ? `${desde}_a_${hasta}`
      : desde
        ? `desde_${desde}`
        : hasta
          ? `hasta_${hasta}`
          : fecha;

  const nombreArchivo =
    `respaldo_${sufijo}_${sufijoRango}.zip`;

  res.status(200);

  res.setHeader(
    "Content-Type",
    "application/zip"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${nombreArchivo}"`
  );

  const zip =
    archiver(
      "zip",
      {
        zlib: {
          level: 6,
        },
      }
    );

  zip.on(
    "warning",
    (error) => {
      console.warn(
        "[Backup ZIP]",
        error.message
      );
    }
  );

  zip.on(
    "error",
    (error) => {
      res.destroy(
        error
      );
    }
  );

  zip.pipe(res);

  // ==================================================
  // DOCUMENTOS PRINCIPALES
  // ==================================================

  for (
    const documento of documentos
  ) {
    const ruta =
      obtenerRutaArchivo(
        documento.archivo
      );

    if (!ruta) {
      continue;
    }

    const nombre =
      nombreSeguro(
        documento.nombre_archivo
      );

    zip.file(
      ruta,
      {
        name:
          `documentos/${documento.id}_${nombre}`,
      }
    );
  }

  // ==================================================
  // ARCHIVOS DE RESPUESTAS
  // ==================================================

  for (
    const documento of documentos
  ) {
    for (
      const evento of documento.eventos
    ) {
      if (
        !evento.archivo
      ) {
        continue;
      }

      const ruta =
        obtenerRutaArchivo(
          evento.archivo
        );

      if (!ruta) {
        continue;
      }

      zip.file(
        ruta,
        {
          name:
            `respuestas/${documento.id}/${evento.id}_${nombreSeguro(
              path.basename(
                ruta
              )
            )}`,
        }
      );
    }
  }

  // ==================================================
  // INFORMACIÓN
  // ==================================================

  const manifest =
    construirManifest(
      documentos,
      {
        tipo,
        idArea,
        desde,
        hasta,
      }
    );

  zip.append(
    JSON.stringify(
      manifest,
      null,
      2
    ),
    {
      name:
        "informacion/manifest.json",
    }
  );

  await zip.finalize();
};

// ======================================================
// RESPALDO GENERAL
// ======================================================

const general = async (
  res,
  filtros = {}
) => {
  return generarZip(
    res,
    {
      tipo:
        "general",

      desde:
        filtros.desde ||
        null,

      hasta:
        filtros.hasta ||
        null,
    }
  );
};

// ======================================================
// RESPALDO POR ÁREA
// ======================================================

const porArea = async (
  res,
  idArea,
  filtros = {}
) => {
  const areaId =
    convertirId(
      idArea
    );

  const area =
    await prisma.area.findUnique({
      where: {
        id:
          areaId,
      },

      select: {
        id: true,
      },
    });

  if (!area) {
    throw new Error(
      "AREA_NOT_FOUND"
    );
  }

  return generarZip(
    res,
    {
      tipo:
        "area",

      idArea:
        areaId,

      desde:
        filtros.desde ||
        null,

      hasta:
        filtros.hasta ||
        null,
    }
  );
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  general,
  porArea,
};