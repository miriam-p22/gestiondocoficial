import { useCallback, useState } from "react";

import { apiFetch } from "../api/api";

export const usePrivilegios = () => {
  const [privilegios, setPrivilegios] = useState([]);
  const [permisosRol, setPermisosRol] = useState([]);

  const [loadingPrivilegios, setLoadingPrivilegios] =
    useState(false);

  const [savingPrivilegios, setSavingPrivilegios] =
    useState(false);

  const [errorPrivilegios, setErrorPrivilegios] =
    useState("");

  const limpiarErrorPrivilegios = () => {
    setErrorPrivilegios("");
  };

  const cargarPrivilegios = useCallback(async () => {
    try {
      const data = await apiFetch("/privilegios");

      const lista = Array.isArray(data) ? data : [];

      setPrivilegios(lista);

      return lista;
    } catch (error) {
      const mensaje =
        error?.message ||
        "No fue posible cargar los privilegios.";

      setErrorPrivilegios(mensaje);

      throw error;
    }
  }, []);

  const cargarPermisosRol = useCallback(
    async (idRol) => {
      if (!idRol) {
        setPermisosRol([]);
        return [];
      }

      try {
        const data = await apiFetch(
          `/rolespermiso/rol/${idRol}`
        );

        const lista = Array.isArray(data) ? data : [];

        setPermisosRol(lista);

        return lista;
      } catch (error) {
        const mensaje =
          error?.message ||
          "No fue posible cargar los permisos del rol.";

        setErrorPrivilegios(mensaje);

        throw error;
      }
    },
    []
  );

  const cargarPrivilegiosDelRol = useCallback(
    async (idRol) => {
      if (!idRol) {
        throw new Error(
          "El usuario seleccionado no tiene un rol válido."
        );
      }

      setLoadingPrivilegios(true);
      setErrorPrivilegios("");

      try {
        const [listaPrivilegios, listaPermisos] =
          await Promise.all([
            apiFetch("/privilegios"),

            apiFetch(
              `/rolespermiso/rol/${idRol}`
            ),
          ]);

        const privilegiosNormalizados =
          Array.isArray(listaPrivilegios)
            ? listaPrivilegios
            : [];

        const permisosNormalizados =
          Array.isArray(listaPermisos)
            ? listaPermisos
            : [];

        setPrivilegios(privilegiosNormalizados);
        setPermisosRol(permisosNormalizados);

        return {
          privilegios: privilegiosNormalizados,
          permisos: permisosNormalizados,
        };
      } catch (error) {
        const mensaje =
          error?.message ||
          "No fue posible cargar los privilegios del rol.";

        setErrorPrivilegios(mensaje);

        throw error;
      } finally {
        setLoadingPrivilegios(false);
      }
    },
    []
  );

  const guardarPermisosRol = async (
    idRol,
    idsPrivilegios
  ) => {
    if (!idRol) {
      throw new Error(
        "El rol seleccionado no es válido."
      );
    }

    if (!Array.isArray(idsPrivilegios)) {
      throw new Error(
        "La lista de privilegios no es válida."
      );
    }

    setSavingPrivilegios(true);
    setErrorPrivilegios("");

    try {
      const data = await apiFetch(
        `/rolespermiso/rol/${idRol}`,
        {
          method: "PUT",

          body: JSON.stringify({
            privilegios: idsPrivilegios,
          }),
        }
      );

      const lista = Array.isArray(data) ? data : [];

      setPermisosRol(lista);

      return lista;
    } catch (error) {
      const mensaje =
        error?.message ||
        "No fue posible guardar los privilegios.";

      setErrorPrivilegios(mensaje);

      throw error;
    } finally {
      setSavingPrivilegios(false);
    }
  };

  return {
    privilegios,
    permisosRol,

    loadingPrivilegios,
    savingPrivilegios,

    errorPrivilegios,

    cargarPrivilegios,
    cargarPermisosRol,
    cargarPrivilegiosDelRol,
    guardarPermisosRol,

    limpiarErrorPrivilegios,
  };
};