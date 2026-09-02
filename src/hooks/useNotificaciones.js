import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "../api/api";

export const useNotificaciones = (opciones = {}) => {
  const { autoLoad = true } = opciones;
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const limpiarError = () => {
    setError("");
  };

  //CANTIDAD DE NO LEÍDAS
  const cantidadNoLeidas = useMemo(
    () =>
      notificaciones.filter((notificacion) => notificacion.leida !== true)
        .length,
    [notificaciones],
  );

  //CARGAR TODAS LAS NOTIFICACIONES
  const cargarNotificaciones = useCallback(async (opcionesCarga = {}) => {
    const { silencioso = false } = opcionesCarga;

    if (!silencioso) {
      setLoading(true);
      setError("");
    }

    try {
      const data = await apiFetch("/notificaciones");
      const lista = Array.isArray(data) ? data : [];

      setNotificaciones(lista);

      return lista;
    } catch (err) {
      const mensaje =
        err?.message || "No fue posible cargar las notificaciones.";

      if (!silencioso) {
        setError(mensaje);

        setNotificaciones([]);
      }

      return [];
    } finally {
      if (!silencioso) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      return undefined;
    }
    cargarNotificaciones();
    
    const intervalo = setInterval(() => {
      cargarNotificaciones({
        silencioso: true,
      });
    }, 15000);

    const manejarFoco = () => {
      cargarNotificaciones({
        silencioso: true,
      });
    };

    window.addEventListener("focus", manejarFoco);

    return () => {
      clearInterval(intervalo);

      window.removeEventListener("focus", manejarFoco);
    };
  }, [autoLoad, cargarNotificaciones]);

  //MARCAR COMO LEÍDA
  const marcarComoLeida = async (id) => {
    const notificacionId = Number(id);

    if (!Number.isInteger(notificacionId) || notificacionId <= 0) {
      throw new Error("El identificador de la notificación no es válido.");
    }

    setSaving(true);
    setError("");

    try {
      const actualizada = await apiFetch(
        `/notificaciones/${notificacionId}/leer`,
        {
          method: "PUT",
        },
      );

      setNotificaciones((actuales) =>
        actuales.map((notificacion) =>
          Number(notificacion.id) === Number(actualizada.id)
            ? actualizada
            : notificacion,
        ),
      );

      return actualizada;
    } catch (err) {
      const mensaje =
        err?.message || "No fue posible marcar la notificación como leída.";

      setError(mensaje);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  //MARCAR TODAS COMO LEÍDAS
  const marcarTodasComoLeidas = async () => {
    setSaving(true);
    setError("");

    try {
      const resultado = await apiFetch("/notificaciones/leer-todas", {
        method: "PUT",
      });

      const fechaLectura = new Date().toISOString();

      setNotificaciones((actuales) =>
        actuales.map((notificacion) =>
          notificacion.leida
            ? notificacion
            : {
                ...notificacion,
                leida: true,
                fecha_lectura: fechaLectura,
              },
        ),
      );

      return resultado;
    } catch (err) {
      const mensaje =
        err?.message ||
        "No fue posible marcar todas las notificaciones como leídas.";

      setError(mensaje);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  //ELIMINAR NOTIFICACIÓN
  const eliminarNotificacion = async (id) => {
    const notificacionId = Number(id);

    if (!Number.isInteger(notificacionId) || notificacionId <= 0) {
      throw new Error("El identificador de la notificación no es válido.");
    }

    setSaving(true);
    setError("");

    try {
      const resultado = await apiFetch(`/notificaciones/${notificacionId}`, {
        method: "DELETE",
      });

      setNotificaciones((actuales) =>
        actuales.filter(
          (notificacion) => Number(notificacion.id) !== notificacionId,
        ),
      );

      return resultado;
    } catch (err) {
      const mensaje =
        err?.message || "No fue posible eliminar la notificación.";

      setError(mensaje);

      throw err;
    } finally {
      setSaving(false);
    }
  };

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

    refresh: cargarNotificaciones,

    limpiarError,
  };
};
