import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiFetch,
} from "../api/api";

// ======================================================
// UTILIDADES
// ======================================================

const normalizarEstado = (
  valor
) =>
  String(
    valor ||
      "turnado"
  )
    .trim()
    .toLowerCase();

const fechaValida = (
  valor
) => {
  if (!valor) {
    return null;
  }

  const fecha =
    new Date(
      valor
    );

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return null;
  }

  return fecha;
};

const obtenerLimiteFinDia = (
  valor
) => {
  const fecha =
    fechaValida(
      valor
    );

  if (!fecha) {
    return null;
  }

  fecha.setHours(
    23,
    59,
    59,
    999
  );

  return fecha;
};

const diasHastaLimite = (
  fechaLimite
) => {
  const limite =
    obtenerLimiteFinDia(
      fechaLimite
    );

  if (!limite) {
    return null;
  }

  const ahora =
    new Date();

  const diferencia =
    limite.getTime() -
    ahora.getTime();

  return Math.ceil(
    diferencia /
      (
        1000 *
        60 *
        60 *
        24
      )
  );
};

// ======================================================
// HOOK
// ======================================================

export const useDashboardData = ({
  esAdministrador,
  esPresidencia,
  esRecursosHumanos,
  idArea,
}) => {
  const [
    dispersiones,
    setDispersiones,
  ] = useState([]);

  const [
    usuarios,
    setUsuarios,
  ] = useState([]);

  const [
    organigramaVigente,
    setOrganigramaVigente,
  ] = useState(null);

  const [
    organigramasRevision,
    setOrganigramasRevision,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // CARGA
  // ====================================================

  const cargarDashboard =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const promesas = [
            apiFetch(
              "/dispersion"
            ),
          ];

          if (
            esRecursosHumanos
          ) {
            promesas.push(
              apiFetch(
                "/usuarios"
              )
            );
          } else {
            promesas.push(
              Promise.resolve(
                []
              )
            );
          }

          promesas.push(
            apiFetch(
              "/organigramas/vigente"
            ).catch(
              () => null
            )
          );

          if (
            esPresidencia
          ) {
            promesas.push(
              apiFetch(
                "/organigramas/revision"
              ).catch(
                () => []
              )
            );
          } else {
            promesas.push(
              Promise.resolve(
                []
              )
            );
          }

          const [
            dataDispersiones,
            dataUsuarios,
            dataVigente,
            dataRevision,
          ] =
            await Promise.all(
              promesas
            );

          setDispersiones(
            Array.isArray(
              dataDispersiones
            )
              ? dataDispersiones
              : []
          );

          setUsuarios(
            Array.isArray(
              dataUsuarios
            )
              ? dataUsuarios
              : []
          );

          setOrganigramaVigente(
            dataVigente &&
            !Array.isArray(
              dataVigente
            )
              ? dataVigente
              : Array.isArray(
                    dataVigente
                  ) &&
                  dataVigente
                    .length >
                    0
                ? dataVigente[
                    0
                  ]
                : null
          );

          setOrganigramasRevision(
            Array.isArray(
              dataRevision
            )
              ? dataRevision
              : []
          );
        } catch (err) {
          setError(
            err?.message ||
              "No fue posible cargar la información del Dashboard."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        esAdministrador,
        esPresidencia,
        esRecursosHumanos,
      ]
    );

  useEffect(
    () => {
      cargarDashboard();
    },
    [
      cargarDashboard,
    ]
  );

  // ====================================================
  // DOCUMENTOS APLANADOS
  // ====================================================

  const documentos =
    useMemo(
      () => {
        const filas = [];

        dispersiones.forEach(
          (
            dispersion
          ) => {
            const destinos =
              Array.isArray(
                dispersion.destinos
              )
                ? dispersion.destinos
                : [];

            destinos.forEach(
              (
                destino
              ) => {
                filas.push({
                  id:
                    `${dispersion.id}-${destino.id_area}`,

                  id_dispersion:
                    dispersion.id,

                  id_area:
                    destino.id_area,

                  nombre_area:
                    destino.area
                      ?.nombre_area ||
                    "Sin área",

                  nombre_archivo:
                    dispersion.nombre_archivo ||
                    "Documento",

                  estado:
                    normalizarEstado(
                      destino.estado_documento
                    ),

                  fecha_limite:
                    destino.fecha_limite,

                  fecha_recepcion_area:
                    destino.fecha_recepcion_area,

                  fecha_inicio_proceso:
                    destino.fecha_inicio_proceso,

                  fecha_atencion:
                    destino.fecha_atencion,

                  respuesta:
                    destino.respuesta ||
                    destino.comentario_respuesta ||
                    "",
                });
              }
            );
          }
        );

        if (
          esAdministrador ||
          esPresidencia
        ) {
          return filas;
        }

        return filas.filter(
          (
            item
          ) =>
            Number(
              item.id_area
            ) ===
            Number(
              idArea
            )
        );
      },
      [
        dispersiones,
        esAdministrador,
        esPresidencia,
        idArea,
      ]
    );

  // ====================================================
  // MÉTRICAS
  // ====================================================

  const metricas =
    useMemo(
      () => {
        const ahora =
          new Date();

        let pendientes = 0;
        let porVencer = 0;
        let vencidos = 0;
        let atendidos = 0;
        let atendidosATiempo = 0;
        let atendidosFueraPlazo = 0;
        let enProceso = 0;
        let recibidos = 0;
        let devueltos = 0;

        documentos.forEach(
          (
            documento
          ) => {
            const estado =
              documento.estado;

            const limite =
              obtenerLimiteFinDia(
                documento.fecha_limite
              );

            const atencion =
              fechaValida(
                documento.fecha_atencion
              );

            const activo =
              ![
                "atendido",
                "devuelto",
              ].includes(
                estado
              );

            if (
              activo
            ) {
              pendientes +=
                1;
            }

            if (
              estado ===
              "recibido"
            ) {
              recibidos +=
                1;
            }

            if (
              estado ===
              "en proceso"
            ) {
              enProceso +=
                1;
            }

            if (
              estado ===
              "devuelto"
            ) {
              devueltos +=
                1;
            }

            if (
              estado ===
              "atendido"
            ) {
              atendidos +=
                1;

              if (
                limite &&
                atencion
              ) {
                if (
                  atencion.getTime() <=
                  limite.getTime()
                ) {
                  atendidosATiempo +=
                    1;
                } else {
                  atendidosFueraPlazo +=
                    1;
                }
              }

              return;
            }

            if (
              !activo ||
              !limite
            ) {
              return;
            }

            if (
              ahora.getTime() >
              limite.getTime()
            ) {
              vencidos +=
                1;

              return;
            }

            const dias =
              diasHastaLimite(
                documento.fecha_limite
              );

            if (
              dias !==
                null &&
              dias >= 0 &&
              dias <= 3
            ) {
              porVencer +=
                1;
            }
          }
        );

        const baseCumplimiento =
          atendidosATiempo +
          atendidosFueraPlazo;

        const cumplimiento =
          baseCumplimiento >
          0
            ? Math.round(
                (
                  atendidosATiempo /
                  baseCumplimiento
                ) *
                  100
              )
            : 0;

        return {
          total:
            documentos.length,

          pendientes,
          porVencer,
          vencidos,
          atendidos,
          atendidosATiempo,
          atendidosFueraPlazo,
          enProceso,
          recibidos,
          devueltos,
          cumplimiento,
        };
      },
      [
        documentos,
      ]
    );

  // ====================================================
  // RESUMEN POR ÁREA
  // ====================================================

  const resumenAreas =
    useMemo(
      () => {
        const mapa =
          new Map();

        documentos.forEach(
          (
            documento
          ) => {
            const id =
              Number(
                documento.id_area
              );

            if (
              !mapa.has(
                id
              )
            ) {
              mapa.set(
                id,
                {
                  id,
                  area:
                    documento.nombre_area,
                  total: 0,
                  atendidos: 0,
                  aTiempo: 0,
                  fueraPlazo: 0,
                  vencidos: 0,
                  enProceso: 0,
                }
              );
            }

            const fila =
              mapa.get(
                id
              );

            fila.total += 1;

            const limite =
              obtenerLimiteFinDia(
                documento.fecha_limite
              );

            const atencion =
              fechaValida(
                documento.fecha_atencion
              );

            if (
              documento.estado ===
              "atendido"
            ) {
              fila.atendidos +=
                1;

              if (
                limite &&
                atencion
              ) {
                if (
                  atencion.getTime() <=
                  limite.getTime()
                ) {
                  fila.aTiempo +=
                    1;
                } else {
                  fila.fueraPlazo +=
                    1;
                }
              }

              return;
            }

            if (
              documento.estado ===
              "en proceso"
            ) {
              fila.enProceso +=
                1;
            }

            if (
              limite &&
              new Date().getTime() >
                limite.getTime() &&
              ![
                "atendido",
                "devuelto",
              ].includes(
                documento.estado
              )
            ) {
              fila.vencidos +=
                1;
            }
          }
        );

        return Array.from(
          mapa.values()
        )
          .map(
            (
              item
            ) => {
              const base =
                item.aTiempo +
                item.fueraPlazo;

              return {
                ...item,

                cumplimiento:
                  base > 0
                    ? Math.round(
                        (
                          item.aTiempo /
                          base
                        ) *
                          100
                      )
                    : 0,
              };
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              b.cumplimiento -
              a.cumplimiento
          );
      },
      [
        documentos,
      ]
    );

  // ====================================================
  // DOCUMENTOS RECIENTES
  // ====================================================

  const documentosRecientes =
    useMemo(
      () =>
        [...documentos]
          .sort(
            (
              a,
              b
            ) => {
              const fechaA =
                fechaValida(
                  a.fecha_recepcion_area ||
                  a.fecha_inicio_proceso ||
                  a.fecha_atencion
                );

              const fechaB =
                fechaValida(
                  b.fecha_recepcion_area ||
                  b.fecha_inicio_proceso ||
                  b.fecha_atencion
                );

              return (
                (
                  fechaB
                    ?.getTime() ||
                  0
                ) -
                (
                  fechaA
                    ?.getTime() ||
                  0
                )
              );
            }
          )
          .slice(
            0,
            6
          ),
      [
        documentos,
      ]
    );

  // ====================================================
  // USUARIOS
  // ====================================================

  const metricasUsuarios =
    useMemo(
      () => {
        const activos =
          usuarios.filter(
            (
              usuario
            ) =>
              usuario.status ===
              true
          ).length;

        const inactivos =
          usuarios.length -
          activos;

        return {
          total:
            usuarios.length,
          activos,
          inactivos,
        };
      },
      [
        usuarios,
      ]
    );

  return {
    loading,
    error,

    metricas,
    metricasUsuarios,
    resumenAreas,
    documentosRecientes,

    // Datos completos para el seguimiento detallado de Presidencia.
    documentosSeguimiento: documentos,
    areasSeguimiento: resumenAreas.map((item) => ({
      id: item.id,
      nombre: item.area,
    })),

    organigramaVigente,
    organigramasRevision,

    refresh:
      cargarDashboard,
  };
};

export default useDashboardData;