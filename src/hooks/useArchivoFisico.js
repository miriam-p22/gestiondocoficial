import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "../api/api";

export const useArchivoFisico = () => {
  const [documentos, setDocumentos] = useState([]);
  const [clasificaciones, setClasificaciones] = useState([]);
  const [permisos, setPermisos] = useState({
    gestionar: false,
    consultar_global: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      /*
        Primero consultamos los permisos.

        Esto evita solicitar documentos/clasificaciones
        cuando el usuario no debe entrar al módulo.
      */
      const dataPermisos =
        await apiFetch(
          "/archivo-fisico/permisos"
        );

      const permisosActuales = {
        gestionar:
          Boolean(
            dataPermisos?.gestionar
          ),

        consultar_global:
          Boolean(
            dataPermisos
              ?.consultar_global
          ),
      };

      setPermisos(
        permisosActuales
      );

      const puedeConsultar =
        permisosActuales.gestionar ||
        permisosActuales
          .consultar_global;

      if (!puedeConsultar) {
        setDocumentos([]);
        setClasificaciones([]);
        return;
      }

      const [
        dataDocumentos,
        dataClasificaciones,
      ] = await Promise.all([
        apiFetch(
          "/archivo-fisico"
        ),

        apiFetch(
          "/clasificaciones"
        ),
      ]);

      setDocumentos(
        Array.isArray(
          dataDocumentos
        )
          ? dataDocumentos
          : []
      );

      setClasificaciones(
        Array.isArray(
          dataClasificaciones
        )
          ? dataClasificaciones
          : []
      );
    } catch (err) {
      setDocumentos([]);
      setClasificaciones([]);

      setError(
        err?.message ||
          "No fue posible cargar la información del Archivo Físico."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarResguardo = async (
    idDestino,
    datos
  ) => {
    setSaving(true);
    setError("");

    try {
      const guardado = await apiFetch(
        `/archivo-fisico/destino/${idDestino}`,
        {
          method: "PUT",
          body: JSON.stringify(datos),
        }
      );

      setDocumentos((actuales) =>
        actuales.map((item) =>
          item.id === idDestino
            ? {
                ...item,
                archivoFisico: guardado,
              }
            : item
        )
      );

      return guardado;
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible guardar el resguardo físico."
      );
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const crearClasificacion = async (datos) => {
    setSaving(true);
    setError("");

    try {
      const nueva = await apiFetch(
        "/clasificaciones",
        {
          method: "POST",
          body: JSON.stringify(datos),
        }
      );

      setClasificaciones((actuales) => [
        ...actuales,
        nueva,
      ]);

      return nueva;
    } catch (err) {
      setError(
        err?.message ||
          "No fue posible crear la clasificación."
      );
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    documentos,
    clasificaciones,
    permisos,
    loading,
    saving,
    error,
    cargar,
    refresh: cargar,
    guardarResguardo,
    crearClasificacion,
  };
};

export default useArchivoFisico;