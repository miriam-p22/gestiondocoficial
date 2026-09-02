import { useCallback, useEffect, useState } from "react";

import { apiFetch } from "../api/api";

export const useAreas = () => {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const limpiarError = () => {
    setError("");
  };

  const cargarAreas = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/areas");
      const lista = Array.isArray(data) ? data : [];

      setAreas(lista);

      return lista;
    } catch (err) {
      const mensaje = err?.message || "No fue posible cargar las áreas.";

      setError(mensaje);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarAreas().catch(() => {
      // El error ya queda guardado en el estado.
    });
  }, [cargarAreas]);

  //Obtener areas
  const obtenerArea = async (id) => {
    setError("");

    try {
      return await apiFetch(`/areas/${id}`);
    } catch (err) {
      const mensaje = err?.message || "No fue posible consultar el área.";

      setError(mensaje);

      throw err;
    }
  };

  // Obtener uso del area
  const obtenerUsoArea = async (id) => {
    setError("");

    try {
      return await apiFetch(`/areas/${id}/uso`);
    } catch (err) {
      const mensaje =
        err?.message || "No fue posible consultar el uso del área.";

      setError(mensaje);

      throw err;
    }
  };

  //CREAR UNA AREA
  const crearArea = async (nombreArea) => {
    const nombre = String(nombreArea ?? "").trim();

    if (!nombre) {
      throw new Error("El nombre del área es obligatorio.");
    }

    setSaving(true);
    setError("");

    try {
      const nuevaArea = await apiFetch("/areas", {
        method: "POST",

        body: JSON.stringify({
          nombre_area: nombre,
        }),
      });

      setAreas((actuales) =>
        [...actuales, nuevaArea].sort((a, b) =>
          a.nombre_area.localeCompare(b.nombre_area, "es"),
        ),
      );

      return nuevaArea;
    } catch (err) {
      const mensaje = err?.message || "No fue posible crear el área.";

      setError(mensaje);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  //ACTUALIZAR UN AREA
  const actualizarArea = async (id, nombreArea) => {
    const nombre = String(nombreArea ?? "").trim();

    if (!nombre) {
      throw new Error("El nombre del área es obligatorio.");
    }

    setSaving(true);
    setError("");

    try {
      const actualizada = await apiFetch(`/areas/${id}`, {
        method: "PUT",

        body: JSON.stringify({
          nombre_area: nombre,
        }),
      });

      setAreas((actuales) =>
        actuales
          .map((area) => (area.id === actualizada.id ? actualizada : area))
          .sort((a, b) => a.nombre_area.localeCompare(b.nombre_area, "es")),
      );

      return actualizada;
    } catch (err) {
      const mensaje = err?.message || "No fue posible actualizar el área.";

      setError(mensaje);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  // ELIMINAR EL AREA
  const eliminarArea = async (id) => {
    setSaving(true);
    setError("");

    try {
      const resultado = await apiFetch(`/areas/${id}`, {
        method: "DELETE",
      });

      setAreas((actuales) => actuales.filter((area) => area.id !== id));

      return resultado;
    } catch (err) {
      const mensaje = err?.message || "No fue posible eliminar el área.";

      setError(mensaje);

      throw err;
    } finally {
      setSaving(false);
    }
  };

  const createArea = crearArea;
  const updateArea = actualizarArea;
  const deleteArea = eliminarArea;

  return {
    areas,

    loading,
    saving,
    error,

    cargarAreas,
    obtenerArea,
    obtenerUsoArea,

    crearArea,
    actualizarArea,
    eliminarArea,

    createArea,
    updateArea,
    deleteArea,

    refresh: cargarAreas,
    limpiarError,
  };
};
