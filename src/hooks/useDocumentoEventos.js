import {
  useCallback,
  useState,
} from "react";

const API_URL =
  "http://localhost:3001/api/documentos-eventos";

// ======================================================
// TOKEN
// ======================================================

const obtenerToken = () => {
  try {
    return localStorage.getItem(
      "token"
    );
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
// MENSAJE DE ERROR
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

export const useDocumentoEventos =
  () => {
    const [
      eventos,
      setEventos,
    ] = useState([]);

    const [
      respuestas,
      setRespuestas,
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

    const limpiarError =
      useCallback(
        () =>
          setError(""),
        []
      );

    // ==================================================
    // CARGAR HISTORIAL
    // ==================================================

    const cargarEventos =
      useCallback(
        async (
          idDispersion
        ) => {
          setLoading(true);
          setError("");

          try {
            const response =
              await apiFetch(
                `${API_URL}/dispersion/${idDispersion}`
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

            const data =
              await response.json();

            setEventos(
              Array.isArray(
                data
              )
                ? data
                : []
            );

            return data;
          } catch (err) {
            const mensaje =
              err?.message ||
              "No fue posible cargar el historial.";

            setError(
              mensaje
            );

            throw err;
          } finally {
            setLoading(
              false
            );
          }
        },
        []
      );

    // ==================================================
    // CARGAR RESPUESTAS PARA OFICIALÍA
    // ==================================================

    const cargarRespuestas =
      useCallback(
        async () => {
          setLoading(true);
          setError("");

          try {
            const response =
              await apiFetch(
                `${API_URL}/respuestas`
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

            const data =
              await response.json();

            setRespuestas(
              Array.isArray(
                data
              )
                ? data
                : []
            );

            return data;
          } catch (err) {
            const mensaje =
              err?.message ||
              "No fue posible cargar las respuestas.";

            setError(
              mensaje
            );

            throw err;
          } finally {
            setLoading(
              false
            );
          }
        },
        []
      );

    // ==================================================
    // CREAR EVENTO DE OFICIALÍA
    // ==================================================

    const crearEvento =
      useCallback(
        async (data) => {
          setSaving(true);
          setError("");

          try {
            const response =
              await apiFetch(
                API_URL,
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

            const nuevo =
              await response.json();

            setEventos(
              (
                actuales
              ) => [
                nuevo,
                ...actuales,
              ]
            );

            return nuevo;
          } catch (err) {
            const mensaje =
              err?.message ||
              "No fue posible registrar el evento.";

            setError(
              mensaje
            );

            throw err;
          } finally {
            setSaving(
              false
            );
          }
        },
        []
      );

    // ==================================================
    // RETURN
    // ==================================================

    return {
      eventos,
      respuestas,

      loading,
      saving,
      error,

      cargarEventos,
      cargarRespuestas,
      crearEvento,

      limpiarError,
    };
  };

export default
  useDocumentoEventos;