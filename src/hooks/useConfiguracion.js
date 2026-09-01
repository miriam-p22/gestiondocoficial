import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/api";

export const useConfiguracion = ({
  puedeNotificaciones = false,
  puedeEstadoSistema = false,
  permisosCargados = false,
} = {}) => {
  const [configuracion, setConfiguracion] = useState(null);
  const [estadoSistema, setEstadoSistema] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const limpiarError = useCallback(() => {
    setError("");
  }, []);

  const cargarConfiguracion = useCallback(async () => {
    if (!permisosCargados || !puedeNotificaciones) {
      setConfiguracion(null);
      return null;
    }

    try {
      const data = await apiFetch("/configuraciones/actual");
      setConfiguracion(data || null);
      return data;
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible cargar la configuración SMTP."
      );
      throw err;
    }
  }, [permisosCargados, puedeNotificaciones]);

  const cargarEstadoSistema = useCallback(async () => {
    if (!permisosCargados || !puedeEstadoSistema) {
      setEstadoSistema(null);
      return null;
    }

    setChecking(true);

    try {
      const data = await apiFetch("/configuraciones/estado-sistema");
      setEstadoSistema(data || null);
      return data;
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible comprobar el estado del sistema."
      );
      throw err;
    } finally {
      setChecking(false);
    }
  }, [permisosCargados, puedeEstadoSistema]);

  useEffect(() => {
    if (!permisosCargados) {
      setLoading(true);
      return;
    }

    let activo = true;

    const cargar = async () => {
      setLoading(true);
      setError("");

      if (!puedeNotificaciones) {
        setConfiguracion(null);
      }

      if (!puedeEstadoSistema) {
        setEstadoSistema(null);
      }

      const tareas = [];

      if (puedeNotificaciones) {
        tareas.push(cargarConfiguracion());
      }

      if (puedeEstadoSistema) {
        tareas.push(cargarEstadoSistema());
      }

      if (tareas.length === 0) {
        if (activo) {
          setLoading(false);
        }
        return;
      }

      try {
        await Promise.all(tareas);
      } catch {
        // El error ya queda almacenado en el hook.
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    cargar();

    return () => {
      activo = false;
    };
  }, [
    permisosCargados,
    puedeNotificaciones,
    puedeEstadoSistema,
    cargarConfiguracion,
    cargarEstadoSistema,
  ]);

  const guardarConfiguracion = async (datos) => {
    if (!permisosCargados || !puedeNotificaciones) {
      throw new Error(
        "No tiene permiso para gestionar las notificaciones."
      );
    }

    setSaving(true);
    setError("");

    try {
      const data = await apiFetch("/configuraciones/actual", {
        method: "PUT",
        body: JSON.stringify(datos),
      });

      setConfiguracion(data);
      return data;
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible guardar la configuración SMTP."
      );
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const probarSmtp = async () => {
    if (!permisosCargados || !puedeNotificaciones) {
      throw new Error(
        "No tiene permiso para gestionar las notificaciones."
      );
    }

    setChecking(true);
    setError("");

    try {
      return await apiFetch("/configuraciones/probar-smtp", {
        method: "POST",
      });
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible probar el servidor SMTP."
      );
      throw err;
    } finally {
      setChecking(false);
    }
  };

  return {
    configuracion,
    estadoSistema,
    loading,
    saving,
    checking,
    error,
    cargarConfiguracion,
    cargarEstadoSistema,
    guardarConfiguracion,
    probarSmtp,
    limpiarError,
    refreshEstado: cargarEstadoSistema,
  };
};

export default useConfiguracion;
