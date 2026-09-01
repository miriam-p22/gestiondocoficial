import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "../api/api";

export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const cargarCatalogos = useCallback(async () => {
    try {
      const [rolesData, areasData] =
        await Promise.all([
          apiFetch("/roles"),
          apiFetch("/areas"),
        ]);

      setRoles(
        Array.isArray(rolesData) ? rolesData : []
      );

      setAreas(
        Array.isArray(areasData) ? areasData : []
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetch("/usuarios");

      setUsuarios(
        Array.isArray(data) ? data : []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarTodo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        usuariosData,
        rolesData,
        areasData,
      ] = await Promise.all([
        apiFetch("/usuarios"),
        apiFetch("/roles"),
        apiFetch("/areas"),
      ]);

      setUsuarios(
        Array.isArray(usuariosData)
          ? usuariosData
          : []
      );

      setRoles(
        Array.isArray(rolesData) ? rolesData : []
      );

      setAreas(
        Array.isArray(areasData) ? areasData : []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const crearUsuario = async (datos) => {
    setSaving(true);
    setError(null);

    try {
      const nuevoUsuario = await apiFetch(
        "/usuarios",
        {
          method: "POST",
          body: JSON.stringify(datos),
        }
      );

      setUsuarios((actuales) => [
        ...actuales,
        nuevoUsuario,
      ]);

      return nuevoUsuario;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const actualizarUsuario = async (
    id,
    datos
  ) => {
    setSaving(true);
    setError(null);

    try {
      const usuarioActualizado = await apiFetch(
        `/usuarios/${id}`,
        {
          method: "PUT",
          body: JSON.stringify(datos),
        }
      );

      setUsuarios((actuales) =>
        actuales.map((usuario) =>
          usuario.id === id
            ? usuarioActualizado
            : usuario
        )
      );

      return usuarioActualizado;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstadoUsuario = async (
    id,
    status
  ) => {
    return actualizarUsuario(id, {
      status,
    });
  };

  const eliminarUsuario = async (id) => {
    setSaving(true);
    setError(null);

    try {
      await apiFetch(`/usuarios/${id}`, {
        method: "DELETE",
      });

      setUsuarios((actuales) =>
        actuales.filter(
          (usuario) => usuario.id !== id
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const limpiarError = () => {
    setError(null);
  };

  return {
    usuarios,
    roles,
    areas,
    loading,
    saving,
    error,

    crearUsuario,
    actualizarUsuario,
    cambiarEstadoUsuario,
    eliminarUsuario,

    cargarUsuarios,
    cargarCatalogos,
    refresh: cargarTodo,
    limpiarError,
  };
};