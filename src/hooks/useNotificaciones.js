import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { apiFetch } from "../api/api";

export const useNotificaciones = (
  opciones = {}
) => {
  const {
    autoLoad = true,
  } = opciones;

  const [
    notificaciones,
    setNotificaciones,
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

  // ======================================================
  // LIMPIAR ERROR
  // ======================================================

  const limpiarError = () => {
    setError("");
  };

  // ======================================================
  // CANTIDAD DE NO LEÍDAS
  // ======================================================

  const cantidadNoLeidas =
    useMemo(
      () =>
        notificaciones.filter(
          (notificacion) =>
            notificacion.leida !== true
        ).length,
      [notificaciones]
    );

  // ======================================================
  // CARGAR TODAS LAS NOTIFICACIONES
  // ======================================================

  const cargarNotificaciones =
    useCallback(
      async (
        opcionesCarga = {}
      ) => {
        const {
          silencioso = false,
        } = opcionesCarga;

        if (!silencioso) {
          setLoading(true);
          setError("");
        }

        try {
          const data =
            await apiFetch(
              "/notificaciones"
            );

          const lista =
            Array.isArray(data)
              ? data
              : [];

          setNotificaciones(
            lista
          );

          return lista;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible cargar las notificaciones.";

          /*
            En una actualización automática silenciosa
            conservamos las notificaciones que ya están
            visibles. Un fallo temporal de conexión no
            debe vaciar la campana.
          */
          if (!silencioso) {
            setError(
              mensaje
            );

            setNotificaciones(
              []
            );
          }

          return [];
        } finally {
          if (!silencioso) {
            setLoading(
              false
            );
          }
        }
      },
      []
    );

  // ======================================================
  // CARGA AUTOMÁTICA Y ACTUALIZACIÓN PERIÓDICA
  // ======================================================

  useEffect(() => {
    if (!autoLoad) {
      return undefined;
    }

    /*
      Primera carga:
      muestra el estado de carga normalmente.
    */
    cargarNotificaciones();

    /*
      Polling silencioso cada 15 segundos.
      Permite que las nuevas notificaciones
      aparezcan sin recargar la aplicación.
    */
    const intervalo =
      setInterval(
        () => {
          cargarNotificaciones({
            silencioso: true,
          });
        },
        15000
      );

    /*
      Si el usuario cambia de ventana y después
      regresa a la aplicación, actualizamos
      inmediatamente la campana.
    */
    const manejarFoco =
      () => {
        cargarNotificaciones({
          silencioso: true,
        });
      };

    window.addEventListener(
      "focus",
      manejarFoco
    );

    /*
      Limpieza al desmontar el hook para evitar
      intervalos o listeners duplicados.
    */
    return () => {
      clearInterval(
        intervalo
      );

      window.removeEventListener(
        "focus",
        manejarFoco
      );
    };
  }, [
    autoLoad,
    cargarNotificaciones,
  ]);

  // ======================================================
  // MARCAR UNA COMO LEÍDA
  // ======================================================

  const marcarComoLeida =
    async (id) => {
      const notificacionId =
        Number(id);

      if (
        !Number.isInteger(
          notificacionId
        ) ||
        notificacionId <= 0
      ) {
        throw new Error(
          "El identificador de la notificación no es válido."
        );
      }

      setSaving(true);
      setError("");

      try {
        const actualizada =
          await apiFetch(
            `/notificaciones/${notificacionId}/leer`,
            {
              method: "PUT",
            }
          );

        setNotificaciones(
          (actuales) =>
            actuales.map(
              (notificacion) =>
                Number(
                  notificacion.id
                ) ===
                Number(
                  actualizada.id
                )
                  ? actualizada
                  : notificacion
            )
        );

        return actualizada;
      } catch (err) {
        const mensaje =
          err?.message ||
          "No fue posible marcar la notificación como leída.";

        setError(
          mensaje
        );

        throw err;
      } finally {
        setSaving(
          false
        );
      }
    };

  // ======================================================
  // MARCAR TODAS COMO LEÍDAS
  // ======================================================

  const marcarTodasComoLeidas =
    async () => {
      setSaving(true);
      setError("");

      try {
        const resultado =
          await apiFetch(
            "/notificaciones/leer-todas",
            {
              method: "PUT",
            }
          );

        const fechaLectura =
          new Date().toISOString();

        setNotificaciones(
          (actuales) =>
            actuales.map(
              (notificacion) =>
                notificacion.leida
                  ? notificacion
                  : {
                      ...notificacion,
                      leida: true,
                      fecha_lectura:
                        fechaLectura,
                    }
            )
        );

        return resultado;
      } catch (err) {
        const mensaje =
          err?.message ||
          "No fue posible marcar todas las notificaciones como leídas.";

        setError(
          mensaje
        );

        throw err;
      } finally {
        setSaving(
          false
        );
      }
    };

  // ======================================================
  // ELIMINAR NOTIFICACIÓN
  // ======================================================

  const eliminarNotificacion =
    async (id) => {
      const notificacionId =
        Number(id);

      if (
        !Number.isInteger(
          notificacionId
        ) ||
        notificacionId <= 0
      ) {
        throw new Error(
          "El identificador de la notificación no es válido."
        );
      }

      setSaving(true);
      setError("");

      try {
        const resultado =
          await apiFetch(
            `/notificaciones/${notificacionId}`,
            {
              method:
                "DELETE",
            }
          );

        setNotificaciones(
          (actuales) =>
            actuales.filter(
              (notificacion) =>
                Number(
                  notificacion.id
                ) !==
                notificacionId
            )
        );

        return resultado;
      } catch (err) {
        const mensaje =
          err?.message ||
          "No fue posible eliminar la notificación.";

        setError(
          mensaje
        );

        throw err;
      } finally {
        setSaving(
          false
        );
      }
    };

  // ======================================================
  // RETORNO
  // ======================================================

  return {
    notificaciones,

    cantidadNoLeidas,

    loading,
    saving,
    error,

    cargarNotificaciones,

    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,

    refresh:
      cargarNotificaciones,

    limpiarError,
  };
};