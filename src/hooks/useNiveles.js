import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "../api/api";

export const useNiveles = (
  idOrganigrama = null,
  opciones = {}
) => {
  const {
    autoLoad = true,
  } = opciones;

  const [
    niveles,
    setNiveles,
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
  // ASIGNAR NIVELES LOCALMENTE
  // ======================================================
  //
  // Sirve para la consulta pública/institucional.
  // Si /organigramas/vigente ya devuelve niveles,
  // no necesitamos llamar /niveles.
  //
  // ======================================================

  const establecerNiveles = (
    lista = []
  ) => {
    setNiveles(
      Array.isArray(lista)
        ? lista
        : []
    );
  };

  // ======================================================
  // CARGAR
  // ======================================================

  const cargarNiveles =
    useCallback(
      async (
        id =
          idOrganigrama
      ) => {
        if (!id) {
          setNiveles([]);
          setError("");
          return [];
        }

        setLoading(true);
        setError("");

        try {
          const data =
            await apiFetch(
              `/niveles?id_organigrama=${encodeURIComponent(
                id
              )}`
            );

          const lista =
            Array.isArray(
              data
            )
              ? data
              : [];

          setNiveles(
            lista
          );

          return lista;
        } catch (err) {
          const mensaje =
            err?.message ||
            "No fue posible cargar la estructura del organigrama.";

          setError(
            mensaje
          );

          throw err;
        } finally {
          setLoading(
            false
          );
        }
      },
      [idOrganigrama]
    );

  // ======================================================
  // CARGA AUTOMÁTICA
  // ======================================================
  //
  // Puede deshabilitarse para usuarios que
  // únicamente consultan el organigrama vigente.
  //
  // ======================================================

  useEffect(() => {
    if (!autoLoad) {
      setNiveles([]);
      setError("");
      return;
    }

    if (!idOrganigrama) {
      setNiveles([]);
      return;
    }

    cargarNiveles(
      idOrganigrama
    ).catch(() => {});
  }, [
    idOrganigrama,
    autoLoad,
    cargarNiveles,
  ]);

  // ======================================================
  // CREAR
  // ======================================================

  const crearNivel =
    async (datos) => {
      setSaving(true);
      setError("");

      try {
        const nuevo =
          await apiFetch(
            "/niveles",
            {
              method:
                "POST",
              body:
                JSON.stringify(
                  datos
                ),
            }
          );

        setNiveles(
          (actuales) =>
            [
              ...actuales,
              nuevo,
            ].sort(
              (a, b) =>
                Number(
                  a.nivel
                ) -
                  Number(
                    b.nivel
                  ) ||
                Number(
                  a.id
                ) -
                  Number(
                    b.id
                  )
            )
        );

        return nuevo;
      } catch (err) {
        const mensaje =
          err?.message ||
          "No fue posible agregar el área al organigrama.";

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
  // ACTUALIZAR
  // ======================================================

  const actualizarNivel =
    async (
      id,
      datos
    ) => {
      setSaving(true);
      setError("");

      try {
        const actualizado =
          await apiFetch(
            `/niveles/${id}`,
            {
              method:
                "PUT",
              body:
                JSON.stringify(
                  datos
                ),
            }
          );

        setNiveles(
          (actuales) =>
            actuales
              .map(
                (item) =>
                  Number(
                    item.id
                  ) ===
                  Number(
                    actualizado.id
                  )
                    ? actualizado
                    : item
              )
              .sort(
                (a, b) =>
                  Number(
                    a.nivel
                  ) -
                    Number(
                      b.nivel
                    ) ||
                  Number(
                    a.id
                  ) -
                    Number(
                      b.id
                    )
              )
        );

        return actualizado;
      } catch (err) {
        const mensaje =
          err?.message ||
          "No fue posible actualizar el área del organigrama.";

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
  // ELIMINAR
  // ======================================================

  const eliminarNivel =
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const resultado =
          await apiFetch(
            `/niveles/${id}`,
            {
              method:
                "DELETE",
            }
          );

        setNiveles(
          (actuales) =>
            actuales.filter(
              (item) =>
                Number(
                  item.id
                ) !==
                Number(id)
            )
        );

        return resultado;
      } catch (err) {
        const mensaje =
          err?.message ||
          "No fue posible eliminar el área del organigrama.";

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

  return {
    niveles,

    loading,
    saving,
    error,

    cargarNiveles,

    establecerNiveles,

    crearNivel,
    actualizarNivel,
    eliminarNivel,

    createNivel:
      crearNivel,

    updateNivel:
      actualizarNivel,

    deleteNivel:
      eliminarNivel,

    refresh:
      cargarNiveles,

    limpiarError,
  };
};