import { useCallback, useEffect, useMemo, useState } from "react";

import { apiFetch } from "../api/api";

export const usePermisosUsuario = () => {
  const [privilegios, setPrivilegios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargarPermisos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch("/permisos-usuario");

      const titulos = Array.isArray(data?.titulos) ? data.titulos : [];

      setPrivilegios(titulos);

      return titulos;
    } catch (err) {
      setError(
        err?.message || "No fue posible consultar los permisos del usuario.",
      );

      setPrivilegios([]);

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPermisos().catch(() => {});
  }, [cargarPermisos]);

  const conjunto = useMemo(() => new Set(privilegios), [privilegios]);

  const tienePrivilegio = useCallback(
    (titulo) => conjunto.has(titulo),
    [conjunto],
  );

  return {
    privilegios,
    loading,
    error,
    tienePrivilegio,
    cargarPermisos,
    refresh: cargarPermisos,
  };
};

export default usePermisosUsuario;
