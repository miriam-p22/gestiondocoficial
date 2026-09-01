import {
  useCallback,
  useEffect,
  useState,
} from "react";

// ======================================================
// CONFIGURACIÓN
// ======================================================

const API_BASE =
  "http://localhost:3001/api";

const DISPERSION_URL =
  `${API_BASE}/dispersion`;

// ======================================================
// OBTENER TOKEN DE SESIÓN
// ======================================================

const obtenerToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

// ======================================================
// FETCH AUTENTICADO
// ======================================================

const apiFetch = (
  url,
  options = {}
) => {
  const token =
    obtenerToken();

  const headers =
    new Headers(
      options.headers ||
        {}
    );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return fetch(
    url,
    {
      ...options,
      headers,
    }
  );
};

// ======================================================
// OBTENER MENSAJE DE ERROR
// ======================================================

const obtenerMensajeError = async (
  response
) => {
  try {
    const data =
      await response.json();

    return (
      data?.error ||
      data?.message ||
      `Error HTTP ${response.status}`
    );
  } catch {
    return `Error HTTP ${response.status}`;
  }
};

// ======================================================
// HOOK
// ======================================================

export const useDispersion = () => {
  // ====================================================
  // ESTADOS
  // ====================================================

  const [
    dispersiones,
    setDispersiones,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  // ====================================================
  // LIMPIAR ERROR
  // ====================================================

  const limpiarError =
    useCallback(() => {
      setError("");
    }, []);

  // ====================================================
  // ACTUALIZAR DESTINO EN ESTADO LOCAL
  // ====================================================

  const actualizarDestinoLocal =
    useCallback(
      (
        idDispersion,
        idArea,
        nuevoDestino
      ) => {
        setDispersiones(
          (actuales) =>
            actuales.map(
              (dispersion) => {
                if (
                  Number(
                    dispersion.id
                  ) !==
                  Number(
                    idDispersion
                  )
                ) {
                  return dispersion;
                }

                return {
                  ...dispersion,

                  destinos:
                    (
                      dispersion.destinos ||
                      []
                    ).map(
                      (destino) =>
                        Number(
                          destino.id_area
                        ) ===
                        Number(
                          idArea
                        )
                          ? nuevoDestino
                          : destino
                    ),
                };
              }
            )
        );
      },
      []
    );

  // ====================================================
  // CARGAR DISPERSIONES
  // ====================================================

  const cargarDispersiones =
    useCallback(
      async (
        filtros = {}
      ) => {
        setLoading(true);
        setError("");

        try {
          const params =
            new URLSearchParams();

          if (
            filtros.origen
          ) {
            params.set(
              "origen",
              filtros.origen
            );
          }

          if (
            filtros.id_area
          ) {
            params.set(
              "id_area",
              filtros.id_area
            );
          }

          if (
            filtros.estado_envio
          ) {
            params.set(
              "estado_envio",
              filtros.estado_envio
            );
          }

          if (
            filtros.estado_documento
          ) {
            params.set(
              "estado_documento",
              filtros.estado_documento
            );
          }

          const query =
            params.toString();

          const url =
            query
              ? `${DISPERSION_URL}?${query}`
              : DISPERSION_URL;

          const response =
            await apiFetch(url);

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const data =
            await response.json();

          setDispersiones(
            Array.isArray(data)
              ? data
              : []
          );

          return data;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible cargar las dispersiones.";

          setError(mensaje);

          throw err;
        } finally {
          setLoading(false);
        }
      },
      []
    );

  // ====================================================
  // CARGA INICIAL
  // ====================================================

  useEffect(() => {
    cargarDispersiones().catch(
      () => {}
    );
  }, [
    cargarDispersiones,
  ]);

  // ====================================================
  // OBTENER DISPERSIÓN POR ID
  // ====================================================

  const obtenerDispersion =
    useCallback(
      async (id) => {
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${id}`
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          return await response.json();
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible obtener la dispersión.";

          setError(mensaje);

          throw err;
        }
      },
      []
    );

  // ====================================================
  // SUBIR ARCHIVO DESDE LAPTOP
  // ====================================================

  const subirArchivo =
    useCallback(
      async ({
        archivo,
        destinos,
        fecha_limite,
      }) => {
        if (!archivo) {
          throw new Error(
            "Debe seleccionar un archivo."
          );
        }

        if (
          !Array.isArray(
            destinos
          ) ||
          destinos.length ===
            0
        ) {
          throw new Error(
            "Debe seleccionar al menos un área destino."
          );
        }

        if (!fecha_limite) {
          throw new Error(
            "Debe indicar la fecha límite de atención."
          );
        }

        setSaving(true);
        setError("");

        try {
          const formData =
            new FormData();

          // ==================================================
          // ARCHIVO
          // ==================================================

          formData.append(
            "archivo",
            archivo
          );

          // ==================================================
          // DESTINOS
          // ==================================================

          formData.append(
            "destinos",
            JSON.stringify(
              destinos.map(
                Number
              )
            )
          );

          // ==================================================
          // FECHA LÍMITE
          // ==================================================

          formData.append(
            "fecha_limite",
            fecha_limite
          );

          // ==================================================
          // PETICIÓN
          // ==================================================

          const response =
            await apiFetch(
              `${DISPERSION_URL}/subir`,
              {
                method:
                  "POST",

                body:
                  formData,
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const nueva =
            await response.json();

          // ==================================================
          // ACTUALIZACIÓN LOCAL
          // ==================================================

          setDispersiones(
            (actuales) => [
              nueva,
              ...actuales,
            ]
          );

          return nueva;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible subir el archivo.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      []
    );

  // ====================================================
  // CREAR DISPERSIÓN DESDE JSON
  // ====================================================
  //
  // Sirve para pruebas y posteriormente para la app móvil.
  //
  // ====================================================

  const crearDispersion =
    useCallback(
      async (data) => {
        setSaving(true);
        setError("");

        try {
          const response =
            await apiFetch(
              DISPERSION_URL,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    data
                  ),
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const nueva =
            await response.json();

          setDispersiones(
            (actuales) => [
              nueva,
              ...actuales,
            ]
          );

          return nueva;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible crear la dispersión.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      []
    );

  // ====================================================
  // ACTUALIZAR DISPERSIÓN
  // ====================================================

  const actualizarDispersion =
    useCallback(
      async (
        id,
        data
      ) => {
        setSaving(true);
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${id}`,
              {
                method:
                  "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify(
                    data
                  ),
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const actualizado =
            await response.json();

          setDispersiones(
            (actuales) =>
              actuales.map(
                (item) =>
                  Number(
                    item.id
                  ) ===
                  Number(id)
                    ? actualizado
                    : item
              )
          );

          return actualizado;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible actualizar la dispersión.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      []
    );

  // ====================================================
  // OBTENER DESTINOS
  // ====================================================

  const obtenerDestinos =
    useCallback(
      async (
        idDispersion
      ) => {
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${idDispersion}/destinos`
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          return await response.json();
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible consultar los destinos.";

          setError(mensaje);

          throw err;
        }
      },
      []
    );

  // ====================================================
  // AGREGAR DESTINO
  // ====================================================

  const agregarDestino =
    useCallback(
      async (
        idDispersion,
        idArea,
        fechaLimite =
          null
      ) => {
        setSaving(true);
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${idDispersion}/destinos`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    id_area:
                      Number(
                        idArea
                      ),

                    fecha_limite:
                      fechaLimite,
                  }),
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const destino =
            await response.json();

          setDispersiones(
            (actuales) =>
              actuales.map(
                (dispersion) => {
                  if (
                    Number(
                      dispersion.id
                    ) !==
                    Number(
                      idDispersion
                    )
                  ) {
                    return dispersion;
                  }

                  return {
                    ...dispersion,

                    destinos: [
                      ...(
                        dispersion.destinos ||
                        []
                      ),

                      destino,
                    ],
                  };
                }
              )
          );

          return destino;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible agregar el destino.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      []
    );

  // ====================================================
  // ELIMINAR DESTINO
  // ====================================================

  const eliminarDestino =
    useCallback(
      async (
        idDispersion,
        idArea
      ) => {
        setSaving(true);
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${idDispersion}/destinos/${idArea}`,
              {
                method:
                  "DELETE",
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          setDispersiones(
            (actuales) =>
              actuales.map(
                (dispersion) => {
                  if (
                    Number(
                      dispersion.id
                    ) !==
                    Number(
                      idDispersion
                    )
                  ) {
                    return dispersion;
                  }

                  return {
                    ...dispersion,

                    destinos:
                      (
                        dispersion.destinos ||
                        []
                      ).filter(
                        (destino) =>
                          Number(
                            destino.id_area
                          ) !==
                          Number(
                            idArea
                          )
                      ),
                  };
                }
              )
          );

          return true;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible eliminar el destino.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      []
    );

  // ====================================================
  // ACTUALIZAR ESTADO DE TRANSFERENCIA
  // ====================================================
  //
  // pendiente | enviado | error
  //
  // ====================================================

  const actualizarEstadoDestino =
    useCallback(
      async (
        idDispersion,
        idArea,
        {
          estado_envio,
          error_envio =
            null,
        }
      ) => {
        setSaving(true);
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${idDispersion}/destinos/${idArea}/estado`,
              {
                method:
                  "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    estado_envio,
                    error_envio,
                  }),
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const destino =
            await response.json();

          actualizarDestinoLocal(
            idDispersion,
            idArea,
            destino
          );

          return destino;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible actualizar el estado de transferencia.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      [
        actualizarDestinoLocal,
      ]
    );

  // ====================================================
  // ACTUALIZAR ESTADO ADMINISTRATIVO DEL OFICIO
  // ====================================================
  //
  // turnado
  // recibido
  // en proceso
  // respondido
  // devuelto
  //
  // ====================================================

  const actualizarEstadoDocumento =
    useCallback(
      async (
        idDispersion,
        idArea,
        data
      ) => {
        setSaving(true);
        setError("");

        try {
          const token =
            obtenerToken();

          const response =
            await apiFetch(
              `${DISPERSION_URL}/${idDispersion}/destinos/${idArea}/documento`,
              {
                method:
                  "PUT",

                headers: {
                  "Content-Type":
                    "application/json",

                  ...(token
                    ? {
                        Authorization:
                          `Bearer ${token}`,
                      }
                    : {}),
                },

                body:
                  JSON.stringify(
                    data
                  ),
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const destino =
            await response.json();

          actualizarDestinoLocal(
            idDispersion,
            idArea,
            destino
          );

          return destino;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible actualizar el estado del documento.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      [
        actualizarDestinoLocal,
      ]
    );

  // ====================================================
  // ACTUALIZAR FECHA LÍMITE
  // ====================================================

  const actualizarFechaLimite =
    useCallback(
      async (
        idDispersion,
        idArea,
        fechaLimite
      ) => {
        setSaving(true);
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${idDispersion}/destinos/${idArea}/fecha-limite`,
              {
                method:
                  "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    fecha_limite:
                      fechaLimite,
                  }),
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const destino =
            await response.json();

          actualizarDestinoLocal(
            idDispersion,
            idArea,
            destino
          );

          return destino;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible actualizar la fecha límite.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      [
        actualizarDestinoLocal,
      ]
    );

  // ====================================================
  // REINTENTAR TRANSFERENCIA
  // ====================================================

  const reintentarDestino =
    useCallback(
      async (
        idDispersion,
        idArea
      ) => {
        setSaving(true);
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${idDispersion}/destinos/${idArea}/reintentar`,
              {
                method:
                  "PUT",
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          const destino =
            await response.json();

          actualizarDestinoLocal(
            idDispersion,
            idArea,
            destino
          );

          return destino;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible preparar el reintento.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      [
        actualizarDestinoLocal,
      ]
    );

  // ====================================================
  // ELIMINAR DISPERSIÓN
  // ====================================================

  const eliminarDispersion =
    useCallback(
      async (id) => {
        setSaving(true);
        setError("");

        try {
          const response =
            await apiFetch(
              `${DISPERSION_URL}/${id}`,
              {
                method:
                  "DELETE",
              }
            );

          if (
            !response.ok
          ) {
            throw new Error(
              await obtenerMensajeError(
                response
              )
            );
          }

          setDispersiones(
            (actuales) =>
              actuales.filter(
                (item) =>
                  Number(
                    item.id
                  ) !==
                  Number(id)
              )
          );

          return true;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible eliminar la dispersión.";

          setError(mensaje);

          throw err;
        } finally {
          setSaving(false);
        }
      },
      []
    );

  // ====================================================
  // RETURN
  // ====================================================

  return {
    // Datos
    dispersiones,

    // Estados
    loading,
    saving,
    error,

    // Consulta
    cargarDispersiones,
    obtenerDispersion,

    // Dispersión
    subirArchivo,
    crearDispersion,
    actualizarDispersion,
    eliminarDispersion,

    // Destinos
    obtenerDestinos,
    agregarDestino,
    eliminarDestino,

    // Transferencia P2P
    actualizarEstadoDestino,
    reintentarDestino,

    // Seguimiento administrativo
    actualizarEstadoDocumento,
    actualizarFechaLimite,

    // Utilidades
    limpiarError,
  };
};

export default useDispersion;