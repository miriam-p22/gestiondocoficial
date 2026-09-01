import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "../api/api";

export const useIps = (
  puedeGestionar = false,
  permisosCargados = false
) => {
  const [ips, setIps] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const limpiarError = () => {
    setError("");
  };

  const cargar = useCallback(async () => {
    if (!permisosCargados) {
      return {
        ips: [],
        areas: [],
      };
    }

    if (!puedeGestionar) {
      setIps([]);
      setAreas([]);
      setError("");
      setLoading(false);

      return {
        ips: [],
        areas: [],
      };
    }

    setLoading(true);
    setError("");

    try {
      const [dataIps, dataAreas] =
        await Promise.all([
          apiFetch("/ips"),
          apiFetch("/areas"),
        ]);

      const listaIps =
        Array.isArray(dataIps)
          ? dataIps
          : [];

      const listaAreas =
        Array.isArray(dataAreas)
          ? dataAreas
          : [];

      setIps(listaIps);
      setAreas(listaAreas);

      return {
        ips: listaIps,
        areas: listaAreas,
      };
    } catch (err) {
      const mensaje =
        err?.message ||
        "No fue posible cargar las direcciones IP.";

      setError(mensaje);
      setIps([]);
      setAreas([]);

      throw err;
    } finally {
      setLoading(false);
    }
  }, [
    puedeGestionar,
    permisosCargados,
  ]);

  useEffect(() => {
    cargar().catch(() => {});
  }, [cargar]);

  const validarGestion = () => {
    if (!puedeGestionar) {
      throw new Error(
        "No tiene permiso para gestionar direcciones IP."
      );
    }
  };

  const crearIp = async (datos) => {
    validarGestion();

    setSaving(true);
    setError("");

    try {
      const nueva = await apiFetch(
        "/ips",
        {
          method: "POST",
          body: JSON.stringify(datos),
        }
      );

      setIps((actuales) =>
        [...actuales, nueva].sort(
          (a, b) =>
            String(
              a.area?.nombre_area || ""
            ).localeCompare(
              String(
                b.area?.nombre_area || ""
              ),
              "es"
            )
        )
      );

      return nueva;
    } catch (err) {
      const mensaje =
        err?.message ||
        "No fue posible registrar la dirección IP.";

      setError(mensaje);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const actualizarIp = async (
    id,
    datos
  ) => {
    validarGestion();

    setSaving(true);
    setError("");

    try {
      const actualizada =
        await apiFetch(
          `/ips/${id}`,
          {
            method: "PUT",
            body: JSON.stringify(
              datos
            ),
          }
        );

      setIps((actuales) =>
        actuales.map((item) =>
          item.id === actualizada.id
            ? actualizada
            : item
        )
      );

      return actualizada;
    } catch (err) {
      const mensaje =
        err?.message ||
        "No fue posible actualizar la dirección IP.";

      setError(mensaje);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const eliminarIp = async (id) => {
    validarGestion();

    setSaving(true);
    setError("");

    try {
      const respuesta =
        await apiFetch(
          `/ips/${id}`,
          {
            method: "DELETE",
          }
        );

      setIps((actuales) =>
        actuales.filter(
          (item) =>
            item.id !== id
        )
      );

      return respuesta;
    } catch (err) {
      const mensaje =
        err?.message ||
        "No fue posible eliminar la dirección IP.";

      setError(mensaje);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    ips,
    areas,
    loading,
    saving,
    error,
    cargar,
    refresh: cargar,
    crearIp,
    actualizarIp,
    eliminarIp,
    limpiarError,
  };
};

export default useIps;