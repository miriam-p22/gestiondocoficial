import React, { useMemo, useState } from "react";

import {
  FiArchive,
  FiCheckCircle,
  FiEdit3,
  FiEye,
  FiFolder,
  FiMapPin,
  FiPlus,
  FiShield,
} from "react-icons/fi";

import Card from "../components/Card";
import TablaReutilizable from "../components/TablaReutilizable";
import FiltroBusqueda from "../components/FiltroBusqueda";
import BotonReutilizable from "../components/BotonReutilizable";
import ModalReutilizable from "../components/ModalReutilizable";
import CampoFormulario from "../components/CampoFormulario";
import EtiquetaEstado from "../components/EtiquetaEstado";

import useArchivoFisico from "../hooks/useArchivoFisico";

import "../styles/LeyArchivo.css";

const normalizar = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const formatearFecha = (valor) => {
  if (!valor) return "—";

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleDateString("es-MX");
};

const obtenerTextoEstado = (item) =>
  item.archivoFisico?.estado === "resguardado" ? "Resguardado" : "Pendiente";

const LeyArchivo = () => {
  const {
    documentos,
    clasificaciones,
    permisos,
    loading,
    saving,
    error,
    guardarResguardo,
    crearClasificacion,
  } = useArchivoFisico();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const [isModalVerOpen, setIsModalVerOpen] = useState(false);

  const [isModalGestionOpen, setIsModalGestionOpen] = useState(false);

  const [isModalClasificacionOpen, setIsModalClasificacionOpen] =
    useState(false);

  const [mensaje, setMensaje] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");

  const [formulario, setFormulario] = useState({
    id_clasificacion: "",
    expediente: "",
    carpeta: "",
    caja: "",
    estante: "",
    ubicacion_fisica: "",
    observaciones: "",
  });

  const [nuevaClasificacion, setNuevaClasificacion] = useState({
    area_administrativa: "",
    codigo_asignado: "",
    ubicacion: "",
    funcion: "",
  });

  const puedeGestionar = permisos.gestionar;

  const puedeConsultar = permisos.gestionar || permisos.consultar_global;

  const metricas = useMemo(() => {
    const resguardados = documentos.filter(
      (item) => item.archivoFisico?.estado === "resguardado",
    ).length;

    return {
      total: documentos.length,
      resguardados,
      pendientes: documentos.length - resguardados,
      sinClasificacion: documentos.filter(
        (item) => !item.archivoFisico?.id_clasificacion,
      ).length,
    };
  }, [documentos]);

  const sugerirClasificacion = (documento) => {
    const area = normalizar(documento.area?.nombre_area);

    if (!area) return null;

    return (
      clasificaciones.find((clasificacion) => {
        const areaClasificacion = normalizar(clasificacion.area_administrativa);

        return (
          areaClasificacion &&
          (area.includes(areaClasificacion) || areaClasificacion.includes(area))
        );
      }) || null
    );
  };

  const documentosFiltrados = useMemo(() => {
    const termino = normalizar(searchQuery);

    if (!termino) return documentos;

    return documentos.filter((item) => {
      const texto = [
        item.dispersion?.nombre_archivo,
        item.area?.nombre_area,
        item.archivoFisico?.clasificacion?.codigo_asignado,
        item.archivoFisico?.expediente,
        item.archivoFisico?.carpeta,
        item.archivoFisico?.caja,
        item.archivoFisico?.estante,
        item.archivoFisico?.ubicacion_fisica,
      ]
        .map(normalizar)
        .join(" ");

      return texto.includes(termino);
    });
  }, [documentos, searchQuery]);

  const abrirVer = (documento) => {
    setSelectedDoc(documento);
    setMensaje("");
    setIsModalVerOpen(true);
  };

  const abrirGestionar = (documento) => {
    if (!puedeGestionar) return;

    const actual = documento.archivoFisico;
    const sugerida = sugerirClasificacion(documento);

    const idClasificacion = actual?.id_clasificacion || sugerida?.id || "";

    const seleccionada = clasificaciones.find(
      (item) => Number(item.id) === Number(idClasificacion),
    );

    setSelectedDoc(documento);

    setFormulario({
      id_clasificacion: String(idClasificacion || ""),
      expediente: actual?.expediente || "",
      carpeta: actual?.carpeta || "",
      caja: actual?.caja || "",
      estante: actual?.estante || "",
      ubicacion_fisica:
        actual?.ubicacion_fisica || seleccionada?.ubicacion || "",
      observaciones: actual?.observaciones || "",
    });

    setErrorFormulario("");
    setMensaje("");
    setIsModalGestionOpen(true);
  };

  const cambiarClasificacion = (event) => {
    const valor = event.target.value;

    const clasificacion = clasificaciones.find(
      (item) => String(item.id) === String(valor),
    );

    setFormulario((actual) => ({
      ...actual,
      id_clasificacion: valor,
      ubicacion_fisica:
        actual.ubicacion_fisica || clasificacion?.ubicacion || "",
    }));
  };

  const guardar = async () => {
    if (!selectedDoc || saving) return;

    setErrorFormulario("");

    try {
      if (!formulario.id_clasificacion) {
        throw new Error("Seleccione una clasificación documental.");
      }

      if (!formulario.ubicacion_fisica.trim()) {
        throw new Error("Capture la ubicación física general.");
      }

      await guardarResguardo(selectedDoc.id, {
        ...formulario,
        id_clasificacion: Number(formulario.id_clasificacion),
        estado: "resguardado",
      });

      setIsModalGestionOpen(false);
      setSelectedDoc(null);

      setMensaje("La ubicación física del documento se guardó correctamente.");
    } catch (err) {
      setErrorFormulario(
        err?.message || "No fue posible guardar el resguardo.",
      );
    }
  };

  const guardarClasificacion = async () => {
    if (saving) return;

    setErrorFormulario("");

    try {
      if (
        !nuevaClasificacion.area_administrativa.trim() ||
        !nuevaClasificacion.codigo_asignado.trim()
      ) {
        throw new Error(
          "El área administrativa y el código asignado son obligatorios.",
        );
      }

      await crearClasificacion(nuevaClasificacion);

      setNuevaClasificacion({
        area_administrativa: "",
        codigo_asignado: "",
        ubicacion: "",
        funcion: "",
      });

      setIsModalClasificacionOpen(false);

      setMensaje("La clasificación se agregó correctamente.");
    } catch (err) {
      setErrorFormulario(
        err?.message || "No fue posible crear la clasificación.",
      );
    }
  };

  const obtenerUbicacion = (item) => {
    const archivo = item.archivoFisico;

    if (!archivo || archivo.estado !== "resguardado") {
      const sugerida = sugerirClasificacion(item);

      return sugerida?.ubicacion
        ? `Sugerencia: ${sugerida.ubicacion}`
        : "Pendiente de ubicación";
    }

    return [
      archivo.ubicacion_fisica,
      archivo.estante && `Estante ${archivo.estante}`,
      archivo.caja && `Caja ${archivo.caja}`,
      archivo.carpeta && `Carpeta ${archivo.carpeta}`,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const columnas = [
    "Documento",
    "Área",
    "Clasificación",
    "Ubicación física",
    "Estado",
    "Acciones",
  ];

  const renderRow = (item) => {
    const clasificacion =
      item.archivoFisico?.clasificacion || sugerirClasificacion(item);

    return (
      <tr key={item.id}>
        <td>
          <div className="archivo-documento-cell">
            <strong>{item.dispersion?.nombre_archivo || "Documento"}</strong>
            <span>Atendido: {formatearFecha(item.fecha_atencion)}</span>
          </div>
        </td>

        <td>{item.area?.nombre_area || "—"}</td>

        <td>
          {clasificacion ? (
            <div className="archivo-clasificacion-cell">
              <strong>{clasificacion.codigo_asignado || "Sin código"}</strong>
              <span>
                {clasificacion.funcion ||
                  clasificacion.area_administrativa ||
                  ""}
              </span>
            </div>
          ) : (
            <span className="archivo-sin-dato">Sin clasificación</span>
          )}
        </td>

        <td>
          <div className="archivo-ubicacion-cell">
            <FiMapPin />
            <span>{obtenerUbicacion(item)}</span>
          </div>
        </td>

        <td>
          <EtiquetaEstado estatus={obtenerTextoEstado(item)} />
        </td>

        <td>
          <div className="actions-cell">
            <BotonReutilizable
              className="btn-action btn-icon view"
              onClick={() => abrirVer(item)}
              title="Ver ficha"
            >
              <FiEye />
            </BotonReutilizable>

            {puedeGestionar && (
              <BotonReutilizable
                className="btn-action btn-icon edit"
                onClick={() => abrirGestionar(item)}
                title={
                  item.archivoFisico
                    ? "Actualizar ubicación"
                    : "Registrar resguardo"
                }
              >
                <FiEdit3 />
              </BotonReutilizable>
            )}
          </div>
        </td>
      </tr>
    );
  };

  if (!loading && !puedeConsultar) {
    return (
      <main className="content-area">
        <section className="content-section ley-archivo-page">
          <Card>
            <div className="archivo-permission-banner">
              <FiShield />

              <div>
                <strong>Acceso restringido</strong>

                <span>
                  Su usuario no cuenta con los privilegios necesarios para
                  consultar el Archivo Físico.
                </span>
              </div>
            </div>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="content-area">
      <section className="content-section ley-archivo-page">
        <div className="ley-archivo-header">
          <div>
            <h2 className="card-title">Control de Archivo Físico</h2>
            <p className="ley-archivo-subtitle">
              Consulta y registro de la localización física de documentos
              atendidos. Este módulo almacena únicamente metadatos y no duplica
              archivos digitales.
            </p>
          </div>

          {puedeGestionar && (
            <BotonReutilizable
              onClick={() => {
                setErrorFormulario("");
                setIsModalClasificacionOpen(true);
              }}
              className="btn-add-user"
            >
              <FiPlus />
              Agregar clasificación
            </BotonReutilizable>
          )}
        </div>

        <div className="archivo-permission-banner">
          <FiShield />
          <div>
            <strong>
              {puedeGestionar
                ? "Gestión de Archivo Físico habilitada"
                : permisos.consultar_global
                  ? "Consulta global habilitada"
                  : "Acceso restringido"}
            </strong>

            <span>
              {puedeGestionar
                ? "Su rol puede consultar, clasificar y registrar la ubicación física de los documentos atendidos."
                : permisos.consultar_global
                  ? "Su rol puede consultar todos los registros, pero no modificar la ubicación física."
                  : "Su usuario no cuenta con privilegios para consultar el Archivo Físico."}
            </span>
          </div>
        </div>

        <div className="archivo-kpi-grid">
          <Card>
            <div className="archivo-kpi">
              <FiFolder />
              <div>
                <span>Documentos atendidos</span>
                <strong>{metricas.total}</strong>
              </div>
            </div>
          </Card>

          <Card>
            <div className="archivo-kpi archivo-kpi-warning">
              <FiArchive />
              <div>
                <span>Pendientes de resguardo</span>
                <strong>{metricas.pendientes}</strong>
              </div>
            </div>
          </Card>

          <Card>
            <div className="archivo-kpi archivo-kpi-success">
              <FiCheckCircle />
              <div>
                <span>Resguardados</span>
                <strong>{metricas.resguardados}</strong>
              </div>
            </div>
          </Card>

          <Card>
            <div className="archivo-kpi">
              <FiMapPin />
              <div>
                <span>Sin clasificación</span>
                <strong>{metricas.sinClasificacion}</strong>
              </div>
            </div>
          </Card>
        </div>

        {mensaje && (
          <div className="page-message page-message-success">{mensaje}</div>
        )}

        {error && (
          <div className="page-message page-message-error">{error}</div>
        )}

        <FiltroBusqueda
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar documento, área, clasificación, expediente, caja, carpeta o estante..."
        />

        <Card>
          {loading ? (
            <div className="archivo-loading">
              Cargando registros de archivo...
            </div>
          ) : (
            <TablaReutilizable
              columns={columnas}
              data={documentosFiltrados}
              renderRow={renderRow}
            />
          )}
        </Card>
      </section>

      <ModalReutilizable
        title="Ficha de localización"
        isOpen={isModalVerOpen}
        onClose={() => {
          setIsModalVerOpen(false);
          setSelectedDoc(null);
        }}
        onAccept={() => {
          setIsModalVerOpen(false);
          setSelectedDoc(null);
        }}
        acceptButtonText="Cerrar"
      >
        {selectedDoc && (
          <div className="archivo-ficha">
            <div className="archivo-ficha-title">
              <FiArchive />
              <div>
                <strong>
                  {selectedDoc.dispersion?.nombre_archivo || "Documento"}
                </strong>
                <span>{selectedDoc.area?.nombre_area || "—"}</span>
              </div>
            </div>

            <div className="archivo-ficha-grid">
              <div>
                <strong>Estado archivístico</strong>
                <span>{obtenerTextoEstado(selectedDoc)}</span>
              </div>

              <div>
                <strong>Fecha de atención</strong>
                <span>{formatearFecha(selectedDoc.fecha_atencion)}</span>
              </div>

              <div>
                <strong>Clasificación</strong>
                <span>
                  {selectedDoc.archivoFisico?.clasificacion?.codigo_asignado ||
                    sugerirClasificacion(selectedDoc)?.codigo_asignado ||
                    "Pendiente"}
                </span>
              </div>

              <div>
                <strong>Expediente</strong>
                <span>{selectedDoc.archivoFisico?.expediente || "—"}</span>
              </div>

              <div>
                <strong>Carpeta</strong>
                <span>{selectedDoc.archivoFisico?.carpeta || "—"}</span>
              </div>

              <div>
                <strong>Caja</strong>
                <span>{selectedDoc.archivoFisico?.caja || "—"}</span>
              </div>

              <div>
                <strong>Estante / Anaquel</strong>
                <span>{selectedDoc.archivoFisico?.estante || "—"}</span>
              </div>

              <div>
                <strong>Ubicación general</strong>
                <span>
                  {selectedDoc.archivoFisico?.ubicacion_fisica ||
                    sugerirClasificacion(selectedDoc)?.ubicacion ||
                    "Pendiente"}
                </span>
              </div>

              <div>
                <strong>Fecha de resguardo</strong>
                <span>
                  {formatearFecha(selectedDoc.archivoFisico?.fecha_resguardo)}
                </span>
              </div>

              <div>
                <strong>Responsable</strong>
                <span>
                  {selectedDoc.archivoFisico?.usuarioResguardo
                    ?.nombre_completo || "—"}
                </span>
              </div>
            </div>

            {selectedDoc.archivoFisico?.observaciones && (
              <div className="archivo-observaciones">
                <strong>Observaciones</strong>
                <p>{selectedDoc.archivoFisico.observaciones}</p>
              </div>
            )}

            <div className="archivo-no-duplicacion">
              <strong>Sin duplicación de archivos</strong>
              <span>
                Esta ficha solo contiene información de localización. El archivo
                digital original no se ha copiado a este módulo.
              </span>
            </div>
          </div>
        )}
      </ModalReutilizable>

      <ModalReutilizable
        title={
          selectedDoc?.archivoFisico
            ? "Actualizar ubicación física"
            : "Registrar resguardo físico"
        }
        isOpen={isModalGestionOpen}
        onClose={() => {
          setIsModalGestionOpen(false);
          setSelectedDoc(null);
          setErrorFormulario("");
        }}
        onAccept={guardar}
        acceptButtonText={saving ? "Guardando..." : "Guardar resguardo"}
      >
        {selectedDoc && (
          <div className="archivo-formulario">
            {errorFormulario && (
              <div className="page-message page-message-error">
                {errorFormulario}
              </div>
            )}

            <div className="archivo-formulario-documento">
              <FiFolder />
              <div>
                <strong>{selectedDoc.dispersion?.nombre_archivo}</strong>
                <span>{selectedDoc.area?.nombre_area}</span>
              </div>
            </div>

            <CampoFormulario
              label="Clasificación documental"
              isSelect
              value={formulario.id_clasificacion}
              onChange={cambiarClasificacion}
            >
              <option value="">Seleccione una clasificación</option>

              {clasificaciones.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.codigo_asignado} — {item.area_administrativa}
                </option>
              ))}
            </CampoFormulario>

            <div className="archivo-form-grid">
              <CampoFormulario
                label="Expediente"
                value={formulario.expediente}
                onChange={(event) =>
                  setFormulario((actual) => ({
                    ...actual,
                    expediente: event.target.value,
                  }))
                }
                placeholder="Ej. EXP-2026-018"
              />

              <CampoFormulario
                label="Carpeta"
                value={formulario.carpeta}
                onChange={(event) =>
                  setFormulario((actual) => ({
                    ...actual,
                    carpeta: event.target.value,
                  }))
                }
                placeholder="Ej. 04"
              />

              <CampoFormulario
                label="Caja"
                value={formulario.caja}
                onChange={(event) =>
                  setFormulario((actual) => ({
                    ...actual,
                    caja: event.target.value,
                  }))
                }
                placeholder="Ej. 08"
              />

              <CampoFormulario
                label="Estante / Anaquel"
                value={formulario.estante}
                onChange={(event) =>
                  setFormulario((actual) => ({
                    ...actual,
                    estante: event.target.value,
                  }))
                }
                placeholder="Ej. B-03"
              />
            </div>

            <CampoFormulario
              label="Ubicación física general"
              value={formulario.ubicacion_fisica}
              onChange={(event) =>
                setFormulario((actual) => ({
                  ...actual,
                  ubicacion_fisica: event.target.value,
                }))
              }
              placeholder="Ej. Archivo Municipal / Sección Administrativa"
            />

            <div className="archivo-observaciones-input">
              <label>Observaciones</label>
              <textarea
                value={formulario.observaciones}
                onChange={(event) =>
                  setFormulario((actual) => ({
                    ...actual,
                    observaciones: event.target.value,
                  }))
                }
                rows="4"
                placeholder="Notas adicionales sobre el resguardo físico..."
              />
            </div>

            <div className="archivo-no-duplicacion">
              <strong>Almacenamiento optimizado</strong>
              <span>
                Solo se guardan clasificación y ubicación física. El documento
                digital no se vuelve a almacenar.
              </span>
            </div>
          </div>
        )}
      </ModalReutilizable>

      <ModalReutilizable
        title="Nueva clasificación documental"
        isOpen={isModalClasificacionOpen}
        onClose={() => {
          setIsModalClasificacionOpen(false);
          setErrorFormulario("");
        }}
        onAccept={guardarClasificacion}
        acceptButtonText={saving ? "Guardando..." : "Guardar clasificación"}
      >
        <div className="archivo-formulario">
          {errorFormulario && (
            <div className="page-message page-message-error">
              {errorFormulario}
            </div>
          )}

          <CampoFormulario
            label="Área administrativa"
            value={nuevaClasificacion.area_administrativa}
            onChange={(event) =>
              setNuevaClasificacion((actual) => ({
                ...actual,
                area_administrativa: event.target.value,
              }))
            }
            placeholder="Ej. Secretaría Particular"
          />

          <CampoFormulario
            label="Código asignado"
            value={nuevaClasificacion.codigo_asignado}
            onChange={(event) =>
              setNuevaClasificacion((actual) => ({
                ...actual,
                codigo_asignado: event.target.value,
              }))
            }
            placeholder="Ej. SP-2026-001"
          />

          <CampoFormulario
            label="Ubicación base sugerida"
            value={nuevaClasificacion.ubicacion}
            onChange={(event) =>
              setNuevaClasificacion((actual) => ({
                ...actual,
                ubicacion: event.target.value,
              }))
            }
            placeholder="Ej. Archivo Municipal"
          />

          <CampoFormulario
            label="Función / descripción"
            value={nuevaClasificacion.funcion}
            onChange={(event) =>
              setNuevaClasificacion((actual) => ({
                ...actual,
                funcion: event.target.value,
              }))
            }
            placeholder="Ej. Correspondencia administrativa"
          />
        </div>
      </ModalReutilizable>
    </main>
  );
};

export default LeyArchivo;
