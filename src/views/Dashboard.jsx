import React, {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiGitBranch,
  FiUsers,
  FiArchive,
  FiSettings,
  FiWifi,
  FiSearch,
  FiX,
} from "react-icons/fi";

import DashboardWelcome from "../components/DashboardWelcome";
import DashboardCard from "../components/DashboardCard";
import DashboardProgress from "../components/DashboardProgress";
import DashboardAlert from "../components/DashboardAlert";
import DashboardActivity from "../components/DashboardActivity";
import DashboardQuickAccess from "../components/DashboardQuickAccess";
import DashboardTable from "../components/DashboardTable";
import DashboardChart from "../components/DashboardChart";

import useDashboardData from "../hooks/useDashboardData";

import "../styles/Dashboard.css";

const formatearFecha = (
  valor
) => {
  if (!valor) {
    return "—";
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
    return "—";
  }

  return fecha.toLocaleDateString(
    "es-MX"
  );
};

const fechaParaComparar = (valor) => {
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const obtenerEstadoVisual = (documento) => {
  if (["atendido", "devuelto"].includes(documento.estado)) {
    return documento.estado;
  }

  const limite = fechaParaComparar(documento.fecha_limite);

  if (limite) {
    limite.setHours(23, 59, 59, 999);
    if (new Date().getTime() > limite.getTime()) return "vencido";
  }

  return documento.estado;
};

const etiquetaEstado = (estado) => {
  const etiquetas = {
    turnado: "Turnado",
    recibido: "Recibido",
    "en proceso": "En proceso",
    atendido: "Atendido",
    devuelto: "Devuelto",
    vencido: "Vencido",
  };
  return etiquetas[estado] || estado || "—";
};

const Dashboard = () => {
  const navigate =
    useNavigate();

  const [filtroArea, setFiltroArea] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const idRol =
    Number(
      localStorage.getItem(
        "id_rol"
      )
    );

  const idArea =
    Number(
      localStorage.getItem(
        "id_area"
      )
    );

  const nombre =
    localStorage.getItem(
      "nombre_completo"
    ) || "";

  const nombreArea =
    localStorage.getItem(
      "nombre_area"
    ) || "";

  const nombreRol =
    localStorage.getItem(
      "nombre_rol"
    ) || "";

  const esAdministrador =
    String(nombreRol).trim() ===
    "Administrador";

  const esRecursosHumanos =
    String(nombreRol).trim() ===
    "Recursos Humanos";

  // El Dashboard global depende del ÁREA, no del rol.
  // Cualquier usuario perteneciente a Presidencia Municipal
  // debe poder consultar el seguimiento general municipal.
  const esPresidencia =
    String(nombreArea).trim() ===
    "Presidencia Municipal";

  const {
    loading,
    error,
    metricas,
    metricasUsuarios,
    resumenAreas,
    documentosRecientes,
    documentosSeguimiento,
    areasSeguimiento,
    organigramaVigente,
    organigramasRevision,
  } =
    useDashboardData({
      esAdministrador,
      esPresidencia,
      esRecursosHumanos,
      idArea,
    });

  // ====================================================
  // NAVEGACIÓN
  // ====================================================

  const irADocumentos = (
    filtro = ""
  ) => {
    if (filtro) {
      navigate(
        `/Documentos?filtro=${encodeURIComponent(
          filtro
        )}`
      );

      return;
    }

    navigate(
      "/Documentos"
    );
  };

  const irAModulo = (
    ruta
  ) => {
    navigate(
      ruta
    );
  };

  // ====================================================
  // TARJETAS
  // ====================================================

  const cards =
    useMemo(
      () => {
        if (
          esPresidencia
        ) {
          return [
            {
              title:
                "Documentos",
              value:
                metricas.total,
              subtitle:
                "Total registrado",
              icon:
                <FiFileText />,
              tone:
                "neutral",
              onClick:
                () => irADocumentos(),
            },
            {
              title:
                "Atendidos a tiempo",
              value:
                metricas.atendidosATiempo,
              subtitle:
                "Dentro del plazo",
              icon:
                <FiCheckCircle />,
              tone:
                "success",
              onClick:
                () => irADocumentos("atendidos"),
            },
            {
              title:
                "Próximos a vencer",
              value:
                metricas.porVencer,
              subtitle:
                "En los próximos 3 días",
              icon:
                <FiClock />,
              tone:
                "warning",
              onClick:
                () => irADocumentos("por-vencer"),
            },
            {
              title:
                "Vencidos",
              value:
                metricas.vencidos,
              subtitle:
                "Aún sin atención",
              icon:
                <FiAlertTriangle />,
              tone:
                "danger",
              onClick:
                () => irADocumentos("vencidos"),
            },
          ];
        }

        if (
          esAdministrador
        ) {
          return [
            {
              title:
                "Documentos",
              value:
                metricas.total,
              subtitle:
                "Total registrado",
              icon:
                <FiFileText />,
              tone:
                "neutral",
              onClick:
                () => irADocumentos(),
            },
            {
              title:
                "Usuarios activos",
              value:
                metricasUsuarios.activos,
              subtitle:
                `${metricasUsuarios.total} usuarios registrados`,
              icon:
                <FiUsers />,
              tone:
                "neutral",
              onClick:
                () => irADocumentos("en-proceso"),
            },
            {
              title:
                "Vencidos",
              value:
                metricas.vencidos,
              subtitle:
                "Aún sin atención",
              icon:
                <FiAlertTriangle />,
              tone:
                "danger",
              onClick:
                () => irADocumentos("vencidos"),
            },
            {
              title:
                "Cumplimiento",
              value:
                `${metricas.cumplimiento}%`,
              subtitle:
                "Atención dentro de plazo",
              icon:
                <FiCheckCircle />,
              tone:
                "success",
              onClick:
                () => irADocumentos(),
            },
          ];
        }

        if (
          esRecursosHumanos
        ) {
          return [
            {
              title:
                "Mis documentos",
              value:
                metricas.total,
              subtitle:
                "Asignados a RH",
              icon:
                <FiFileText />,
              tone:
                "neutral",
              onClick:
                () => irADocumentos(),
            },
            {
              title:
                "Por vencer",
              value:
                metricas.porVencer,
              subtitle:
                "En los próximos 3 días",
              icon:
                <FiClock />,
              tone:
                "warning",
              onClick:
                () => irADocumentos("por-vencer"),
            },
            {
              title:
                "Atendidos",
              value:
                metricas.atendidos,
              subtitle:
                "Documentos atendidos",
              icon:
                <FiCheckCircle />,
              tone:
                "success",
              onClick:
                () => irADocumentos("atendidos"),
            },
            {
              title:
                "Usuarios",
              value:
                metricasUsuarios.total,
              subtitle:
                `${metricasUsuarios.activos} activos`,
              icon:
                <FiUsers />,
              tone:
                "neutral",
              onClick:
                () => irADocumentos("recibidos"),
            },
          ];
        }

        return [
          {
            title:
              "Pendientes",
            value:
              metricas.pendientes,
            subtitle:
              "Documentos activos",
            icon:
              <FiFileText />,
            tone:
              "neutral",
              onClick:
                () => irADocumentos("pendientes"),
          },
          {
            title:
              "Por vencer",
            value:
              metricas.porVencer,
            subtitle:
              "En los próximos 3 días",
            icon:
              <FiClock />,
            tone:
              "warning",
              onClick:
                () => irADocumentos("por-vencer"),
          },
          {
            title:
              "Vencidos",
            value:
              metricas.vencidos,
            subtitle:
              "Fuera del plazo",
            icon:
              <FiAlertTriangle />,
            tone:
              "danger",
              onClick:
                () => irADocumentos("vencidos"),
          },
          {
            title:
              "Atendidos",
            value:
              metricas.atendidos,
            subtitle:
              "Documentos atendidos",
            icon:
              <FiCheckCircle />,
            tone:
              "success",
              onClick:
                () => irADocumentos("atendidos"),
          },
        ];
      },
      [
        esAdministrador,
        esPresidencia,
        esRecursosHumanos,
        metricas,
        metricasUsuarios,
      ]
    );

  // ====================================================
  // ALERTAS
  // ====================================================

  const alertas =
    useMemo(
      () => {
        const lista = [];

        if (
          metricas.vencidos >
          0
        ) {
          lista.push({
            type:
              "warning",
            title:
              "Documentos vencidos",
            text:
              `${metricas.vencidos} documento(s) requieren atención inmediata.`,
          });
        }

        if (
          metricas.porVencer >
          0
        ) {
          lista.push({
            type:
              "warning",
            title:
              "Próximos a vencer",
            text:
              `${metricas.porVencer} documento(s) vencen dentro de los próximos 3 días.`,
          });
        }

        if (
          esPresidencia &&
          organigramasRevision.length >
            0
        ) {
          lista.push({
            type:
              "info",
            title:
              "Organigramas pendientes",
            text:
              `${organigramasRevision.length} versión(es) requieren revisión de Presidencia.`,
          });
        }

        if (
          lista.length ===
          0
        ) {
          lista.push({
            type:
              "success",
            title:
              "Sin alertas críticas",
            text:
              "No hay incidencias urgentes en este momento.",
          });
        }

        return lista;
      },
      [
        metricas,
        esPresidencia,
        organigramasRevision,
      ]
    );

  // ====================================================
  // TABLA
  // ====================================================

  const tabla =
    useMemo(
      () => {
        if (
          esAdministrador ||
          esPresidencia
        ) {
          return {
            title:
              "Cumplimiento por área",

            subtitle:
              "Comparativa de atención documental.",

            columns: [
              {
                key:
                  "area",
                label:
                  "Área",
              },
              {
                key:
                  "total",
                label:
                  "Documentos",
              },
              {
                key:
                  "aTiempo",
                label:
                  "A tiempo",
              },
              {
                key:
                  "vencidos",
                label:
                  "Vencidos",
              },
              {
                key:
                  "cumplimientoTexto",
                label:
                  "Cumplimiento",
              },
            ],

            rows:
              resumenAreas.map(
                (
                  item
                ) => ({
                  ...item,

                  cumplimientoTexto: (
                    <span
                      className={`dashboard-cumplimiento-badge ${
                        item.cumplimiento >= 90
                          ? "alto"
                          : item.cumplimiento >= 70
                            ? "medio"
                            : "bajo"
                      }`}
                    >
                      {item.cumplimiento}%
                    </span>
                  ),
                })
              ),
          };
        }

        return {
          title:
            "Documentos recientes",

          subtitle:
            "Últimos documentos asignados al área.",

          columns: [
            {
              key:
                "nombre_archivo",
              label:
                "Documento",
            },
            {
              key:
                "estadoTexto",
              label:
                "Estado",
            },
            {
              key:
                "fechaTexto",
              label:
                "Fecha límite",
            },
          ],

          rows:
            documentosRecientes.map(
              (
                item
              ) => ({
                ...item,

                estadoTexto:
                  item.estado
                    .charAt(
                      0
                    )
                    .toUpperCase() +
                  item.estado.slice(
                    1
                  ),

                fechaTexto:
                  formatearFecha(
                    item.fecha_limite
                  ),
              })
            ),
        };
      },
      [
        esAdministrador,
        esPresidencia,
        resumenAreas,
        documentosRecientes,
      ]
    );

  // ====================================================
  // SEGUIMIENTO DETALLADO - PRESIDENCIA
  // ====================================================

  const documentosFiltrados =
    useMemo(
      () => {
        if (!esPresidencia) return [];

        return documentosSeguimiento
          .filter((documento) => {
            if (
              filtroArea &&
              Number(documento.id_area) !== Number(filtroArea)
            ) return false;

            const estadoVisual = obtenerEstadoVisual(documento);
            if (filtroEstado && estadoVisual !== filtroEstado) return false;

            const fecha = fechaParaComparar(
              documento.fecha_recepcion_area ||
              documento.fecha_inicio_proceso ||
              documento.fecha_atencion ||
              documento.fecha_limite
            );

            if (fechaDesde) {
              const desde = new Date(`${fechaDesde}T00:00:00`);
              if (!fecha || fecha.getTime() < desde.getTime()) return false;
            }

            if (fechaHasta) {
              const hasta = new Date(`${fechaHasta}T23:59:59`);
              if (!fecha || fecha.getTime() > hasta.getTime()) return false;
            }

            return true;
          })
          .sort((a, b) => {
            const prioridad = {
              vencido: 0,
              "en proceso": 1,
              recibido: 2,
              turnado: 3,
              devuelto: 4,
              atendido: 5,
            };
            return (prioridad[obtenerEstadoVisual(a)] ?? 99) -
              (prioridad[obtenerEstadoVisual(b)] ?? 99);
          });
      },
      [
        esPresidencia,
        documentosSeguimiento,
        filtroArea,
        filtroEstado,
        fechaDesde,
        fechaHasta,
      ]
    );

  const resumenSeguimiento =
    useMemo(
      () => {
        const resumen = {
          total: documentosFiltrados.length,
          pendientes: 0,
          enProceso: 0,
          vencidos: 0,
          atendidos: 0,
        };

        documentosFiltrados.forEach((documento) => {
          const estado = obtenerEstadoVisual(documento);
          if (!["atendido", "devuelto"].includes(estado)) resumen.pendientes += 1;
          if (estado === "en proceso") resumen.enProceso += 1;
          if (estado === "vencido") resumen.vencidos += 1;
          if (estado === "atendido") resumen.atendidos += 1;
        });

        return resumen;
      },
      [documentosFiltrados]
    );

  const limpiarFiltros = () => {
    setFiltroArea("");
    setFiltroEstado("");
    setFechaDesde("");
    setFechaHasta("");
  };

  // ====================================================
  // ACTIVIDAD
  // ====================================================

  const actividad =
    documentosRecientes
      .slice(
        0,
        4
      )
      .map(
        (
          item,
          index
        ) => ({
          id:
            `${item.id}-${index}`,

          title:
            item.nombre_archivo,

          text:
            `${item.nombre_area} — ${item.estado}`,

          date:
            formatearFecha(
              item.fecha_atencion ||
              item.fecha_inicio_proceso ||
              item.fecha_recepcion_area
            ),
        })
      );

  // ====================================================
  // ACCESOS RÁPIDOS
  // ====================================================

  const accesos = [];

  if (
    esAdministrador ||
    esRecursosHumanos
  ) {
    accesos.push({
      id:
        "usuarios",
      title:
        "Usuarios",
      icon:
        <FiUsers />,
      onClick:
        () =>
          irAModulo(
            "/Usuarios"
          ),
    });
  }

  accesos.push({
    id:
      "documentos",
    title:
      "Documentos",
    icon:
      <FiFileText />,
    onClick:
      () =>
        irADocumentos(),
  });

  accesos.push({
    id:
      "organigrama",
    title:
      organigramaVigente
        ? `Organigrama V${organigramaVigente.version}`
        : "Organigrama",
    icon:
      <FiGitBranch />,
    onClick:
      () =>
        irAModulo(
          "/organigrama"
        ),
  });

  if (
    esAdministrador
  ) {
    accesos.push({
      id:
        "ley-archivo",
      title:
        "Ley de Archivo",
      icon:
        <FiArchive />,
      onClick:
        () =>
          irAModulo(
            "/LeyArchivo"
          ),
    });

    accesos.push({
      id:
        "configuracion",
      title:
        "Configuración",
      icon:
        <FiSettings />,
      onClick:
        () =>
          irAModulo(
            "/config/notificacion-conexion"
          ),
    });
  }

  if (
    esRecursosHumanos
  ) {
    accesos.push({
      id:
        "direcciones-ip",
      title:
        "Direcciones IP",
      icon:
        <FiWifi />,
      onClick:
        () =>
          irAModulo(
            "/config/direcciones-ip"
          ),
    });
  }


  return (
    <main className="content-area">
      <section className="content-section dashboard-page">

        <DashboardWelcome
          nombre={
            nombre
          }
          area={
            nombreArea
          }
          rol={
            nombreRol
          }
          mensaje={
            esPresidencia
              ? "Supervisión general del cumplimiento documental de las áreas municipales."
              : esAdministrador
                ? "Supervisión general del sistema y sus principales indicadores."
                : esRecursosHumanos
                  ? "Resumen de Recursos Humanos, usuarios, organigrama y carga documental."
                  : "Consulta el estado de los documentos asignados a tu área."
          }
        />

        {error && (
          <div className="page-message page-message-error">
            {
              error
            }
          </div>
        )}

        {loading ? (
          <div className="dashboard-panel">
            Cargando indicadores...
          </div>
        ) : (
          <>
            <div className="dashboard-cards-grid">
              {cards.map(
                (
                  card
                ) => (
                  <DashboardCard
                    key={
                      card.title
                    }
                    {...card}
                  />
                )
              )}
            </div>

            {esPresidencia && (
              <section className="dashboard-panel dashboard-followup-panel">
                <div className="dashboard-panel-header dashboard-followup-header">
                  <div>
                    <h3>Seguimiento documental por área</h3>
                    <p>Consulta detallada del avance y documentos que requieren atención en las áreas municipales.</p>
                  </div>
                  <span className="dashboard-followup-count">
                    <FiSearch /> {documentosFiltrados.length} resultado(s)
                  </span>
                </div>

                <div className="dashboard-followup-filters">
                  <label className="dashboard-filter-field">
                    <span>Área</span>
                    <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
                      <option value="">Todas las áreas</option>
                      {areasSeguimiento.map((area) => (
                        <option key={area.id} value={area.id}>{area.nombre}</option>
                      ))}
                    </select>
                  </label>

                  <label className="dashboard-filter-field">
                    <span>Estado</span>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                      <option value="">Todos los estados</option>
                      <option value="turnado">Turnado</option>
                      <option value="recibido">Recibido</option>
                      <option value="en proceso">En proceso</option>
                      <option value="atendido">Atendido</option>
                      <option value="devuelto">Devuelto</option>
                      <option value="vencido">Vencido</option>
                    </select>
                  </label>

                  <label className="dashboard-filter-field">
                    <span>Desde</span>
                    <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                  </label>

                  <label className="dashboard-filter-field">
                    <span>Hasta</span>
                    <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                  </label>

                  <button type="button" className="dashboard-filter-clear" onClick={limpiarFiltros}>
                    <FiX /> Limpiar
                  </button>
                </div>

                <div className="dashboard-followup-summary">
                  <div><span>Total</span><strong>{resumenSeguimiento.total}</strong></div>
                  <div><span>Pendientes</span><strong>{resumenSeguimiento.pendientes}</strong></div>
                  <div><span>En proceso</span><strong>{resumenSeguimiento.enProceso}</strong></div>
                  <div className="dashboard-followup-summary-danger"><span>Vencidos</span><strong>{resumenSeguimiento.vencidos}</strong></div>
                  <div className="dashboard-followup-summary-success"><span>Atendidos</span><strong>{resumenSeguimiento.atendidos}</strong></div>
                </div>

                <div className="dashboard-followup-table-wrapper">
                  <table className="dashboard-followup-table">
                    <thead>
                      <tr>
                        <th>Área</th><th>Documento</th><th>Estado</th><th>Fecha límite</th>
                        <th>Recepción</th><th>Inicio</th><th>Atención</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documentosFiltrados.length > 0 ? (
                        documentosFiltrados.map((documento) => {
                          const estado = obtenerEstadoVisual(documento);
                          return (
                            <tr key={documento.id}>
                              <td><strong className="dashboard-followup-area">{documento.nombre_area}</strong></td>
                              <td><span
                                  className="dashboard-followup-document"
                                  title={documento.nombre_archivo}
                                >
                                  {documento.nombre_archivo}
                                </span></td>
                              <td>
                                <span className={`dashboard-status-badge dashboard-status-${estado.replace(/\s+/g, "-")}`}>
                                  {etiquetaEstado(estado)}
                                </span>
                              </td>
                              <td>{formatearFecha(documento.fecha_limite)}</td>
                              <td>{formatearFecha(documento.fecha_recepcion_area)}</td>
                              <td>{formatearFecha(documento.fecha_inicio_proceso)}</td>
                              <td>{formatearFecha(documento.fecha_atencion)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="7" className="dashboard-followup-empty">No hay documentos que coincidan con los filtros seleccionados.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <div className="dashboard-main-grid">

              <div className="dashboard-main-column">
                <DashboardProgress
                  title={
                    esPresidencia ||
                    esAdministrador
                      ? "Cumplimiento municipal"
                      : `Cumplimiento${nombreArea ? ` — ${nombreArea}` : ""}`
                  }
                  subtitle="Porcentaje de documentos atendidos dentro del plazo."
                  value={
                    metricas.cumplimiento
                  }
                />

                <DashboardChart
                  title={
                    esPresidencia ||
                    esAdministrador
                      ? "Distribución de estados"
                      : "Estado de mi carga documental"
                  }
                  subtitle="Resumen visual de la situación documental."
                >
                  <div className="dashboard-bars">
                    {[
                      {
                        label:
                          "Atendidos",
                        value:
                          metricas.atendidos,
                        tone:
                          "atendido",
              onClick:
                () => irADocumentos(),
                      },
                      {
                        label:
                          "En proceso",
                        value:
                          metricas.enProceso,
                        tone:
                          "proceso",
              onClick:
                () => irADocumentos("en-proceso"),
                      },
                      {
                        label:
                          "Recibidos",
                        value:
                          metricas.recibidos,
                        tone:
                          "recibido",
              onClick:
                () => irADocumentos("recibidos"),
                      },
                      {
                        label:
                          "Vencidos",
                        value:
                          metricas.vencidos,
                        tone:
                          "vencido",
              onClick:
                () => irADocumentos(),
                      },
                    ].map(
                      (
                        item
                      ) => {
                        const maximo =
                          Math.max(
                            metricas.total,
                            1
                          );

                        const porcentaje =
                          Math.round(
                            (
                              item.value /
                              maximo
                            ) *
                              100
                          );

                        return (
                          <div
                            key={
                              item.label
                            }
                            className="dashboard-bar-item"
                          >
                            <div className="dashboard-bar-label">
                              <span>
                                <i
                                  className={`dashboard-bar-dot dashboard-bar-dot-${item.tone}`}
                                />

                                {
                                  item.label
                                }
                              </span>

                              <strong>
                                {
                                  item.value
                                }
                              </strong>
                            </div>

                            <div className="dashboard-bar-track">
                              <div
                                className={`dashboard-bar-fill dashboard-bar-fill-${item.tone}`}
                                style={{
                                  width:
                                    `${porcentaje}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </DashboardChart>

                <DashboardTable
                  title={
                    tabla.title
                  }
                  subtitle={
                    tabla.subtitle
                  }
                  columns={
                    tabla.columns
                  }
                  rows={
                    tabla.rows
                  }
                />
              </div>

              <aside className="dashboard-side-column">
                <section className="dashboard-panel">
                  <div className="dashboard-panel-header">
                    <div>
                      <h3>
                        Alertas
                      </h3>

                      <p>
                        Información que requiere atención.
                      </p>
                    </div>
                  </div>

                  <div className="dashboard-alert-list">
                    {alertas.map(
                      (
                        alerta,
                        index
                      ) => (
                        <DashboardAlert
                          key={
                            `${alerta.title}-${index}`
                          }
                          {...alerta}
                        />
                      )
                    )}
                  </div>
                </section>

                {organigramaVigente && (
                  <section className="dashboard-panel">
                    <div className="dashboard-panel-header">
                      <div>
                        <h3>
                          Organigrama vigente
                        </h3>

                        <p>
                          Última versión autorizada.
                        </p>
                      </div>
                    </div>

                    <div className="dashboard-organigrama-summary">
                      <strong>
                        {
                          organigramaVigente.titulo
                        }
                      </strong>

                      <span>
                        Versión{" "}
                        {
                          organigramaVigente.version
                        }
                      </span>

                      <small>
                        Autorizado:{" "}
                        {
                          formatearFecha(
                            organigramaVigente.fecha_autorizacion
                          )
                        }
                      </small>

                      <button
                        type="button"
                        className="dashboard-organigrama-button"
                        onClick={() =>
                          irAModulo(
                            "/organigrama"
                          )
                        }
                      >
                        Ver organigrama
                      </button>
                    </div>
                  </section>
                )}

                <DashboardQuickAccess
                  items={
                    accesos
                  }
                />

                <DashboardActivity
                  items={
                    actividad
                  }
                />
              </aside>

            </div>

          </>
        )}
      </section>
    </main>
  );
};

export default Dashboard;