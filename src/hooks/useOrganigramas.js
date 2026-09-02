import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../api/api";

export const useOrganigramas = (opciones = {}) => {
  const { idUsuario = null, modo = "todos", autoLoad = true } = opciones;
  const [organigramas, setOrganigramas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const limpiarError = () => {
    setError("");
  };

  const reemplazarLocal = (actualizado) => {
    setOrganigramas((actuales) =>
      actuales.map((item) =>
        Number(item.id) === Number(actualizado.id) ? actualizado : item,
      ),
    );
  };

  //GET
  const cargarOrganigramas = useCallback(async () => {
    if (!autoLoad) {
      setOrganigramas([]);
      setError("");
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");

    try {
      let endpoint = "/organigramas";

      if (modo === "vigente") {
        endpoint = "/organigramas/vigente";
      } else if (modo === "revision") {
        endpoint = "/organigramas/revision";
      } else {
        const params = [];

        if (idUsuario) {
          params.push(`id_usuario=${encodeURIComponent(idUsuario)}`);
        }

        if (params.length > 0) {
          endpoint += `?${params.join("&")}`;
        }
      }

      const data = await apiFetch(endpoint);

      const lista =
        modo === "vigente"
          ? data
            ? [data]
            : []
          : Array.isArray(data)
            ? data
            : [];

      setOrganigramas(lista);

      return lista;
    } catch (err) {

      const mensaje = err?.message || "No fue posible cargar los organigramas.";

      setOrganigramas([]);
      setError(mensaje);

      return [];
    } finally {
      setLoading(false);
    }
  }, [idUsuario, modo, autoLoad]);

  //CARGA AUTOMÁTICA
  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    cargarOrganigramas();
  }, [autoLoad, cargarOrganigramas]);

  const obtenerOrganigrama = async (id) => {
    return apiFetch(`/organigramas/${id}`);
  };

  const crearOrganigrama = async (datos) => {
    setSaving(true);
    setError("");

    try {
      const nuevo = await apiFetch("/organigramas", {
        method: "POST",
        body: JSON.stringify(datos),
      });

      setOrganigramas((actuales) => [nuevo, ...actuales]);

      return nuevo;
    } catch (err) {
      setError(err?.message || "No fue posible crear el organigrama.");

      throw err;
    } finally {
      setSaving(false);
    }
  };

  const actualizarOrganigrama = async (id, datos) => {
    setSaving(true);
    setError("");

    try {
      const actualizado = await apiFetch(`/organigramas/${id}`, {
        method: "PUT",
        body: JSON.stringify(datos),
      });

      reemplazarLocal(actualizado);

      return actualizado;
    } catch (err) {
      setError(err?.message || "No fue posible actualizar el organigrama.");

      throw err;
    } finally {
      setSaving(false);
    }
  };

  //SOLICITAR AUTORIZACIÓN
  const solicitarAutorizacion = async (id) => {
    setSaving(true);
    setError("");

    try {
      const actualizado = await apiFetch(`/organigramas/${id}/solicitar`, {
        method: "PUT",
      });

      reemplazarLocal(actualizado);

      return actualizado;
    } catch (err) {
      setError(err?.message || "No fue posible solicitar la autorización.");

      throw err;
    } finally {
      setSaving(false);
    }
  };

  //AUTORIZAR
  const autorizarOrganigrama = async (id) => {
    setSaving(true);
    setError("");

    try {
      const actualizado = await apiFetch(`/organigramas/${id}/autorizar`, {
        method: "PUT",
      });

      if (modo === "revision") {
        setOrganigramas((actuales) =>
          actuales.filter((item) => Number(item.id) !== Number(id)),
        );
      } else {
        reemplazarLocal(actualizado);
      }

      return actualizado;
    } catch (err) {
      setError(err?.message || "No fue posible autorizar el organigrama.");

      throw err;
    } finally {
      setSaving(false);
    }
  };

  //RECHAZAR
  const rechazarOrganigrama = async (id, observaciones) => {
    setSaving(true);
    setError("");

    try {
      const actualizado = await apiFetch(`/organigramas/${id}/rechazar`, {
        method: "PUT",
        body: JSON.stringify({
          observaciones,
        }),
      });

      if (modo === "revision") {
        setOrganigramas((actuales) =>
          actuales.filter((item) => Number(item.id) !== Number(id)),
        );
      } else {
        reemplazarLocal(actualizado);
      }

      return actualizado;
    } catch (err) {
      setError(err?.message || "No fue posible rechazar el organigrama.");

      throw err;
    } finally {
      setSaving(false);
    }
  };

  //DELETE
  const eliminarOrganigrama = async (id) => {
    setSaving(true);
    setError("");

    try {
      const resultado = await apiFetch(`/organigramas/${id}`, {
        method: "DELETE",
      });

      setOrganigramas((actuales) =>
        actuales.filter((item) => Number(item.id) !== Number(id)),
      );

      return resultado;
    } catch (err) {
      setError(err?.message || "No fue posible eliminar el organigrama.");

      throw err;
    } finally {
      setSaving(false);
    }
  };

  return {
    organigramas,

    loading,
    saving,
    error,

    cargarOrganigramas,

    obtenerOrganigrama,

    crearOrganigrama,

    actualizarOrganigrama,

    solicitarAutorizacion,

    autorizarOrganigrama,

    rechazarOrganigrama,

    eliminarOrganigrama,

    refresh: cargarOrganigramas,

    limpiarError,
  };
};
