import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { apiFetch } from "../api/api";

export const useOrganigramas = (
  opciones = {}
) => {
  const {
    idUsuario = null,
    modo = "todos",
    autoLoad = true,
  } = opciones;

  const [organigramas, setOrganigramas] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  // ======================================================
  // LIMPIAR ERROR
  // ======================================================

  const limpiarError = () => {
    setError("");
  };

  // ======================================================
  // REEMPLAZAR EN MEMORIA
  // ======================================================

  const reemplazarLocal = (
    actualizado
  ) => {
    setOrganigramas(
      (actuales) =>
        actuales.map(
          (item) =>
            Number(item.id) ===
            Number(actualizado.id)
              ? actualizado
              : item
        )
    );
  };

  // ======================================================
  // GET
  // ======================================================
  //
  // IMPORTANTE:
  //
  // "vigente" NO debe ir como:
  //   /organigramas?modo=vigente
  //
  // porque el backend ya tiene la ruta:
  //   GET /api/organigramas/vigente
  //
  // Lo mismo aplica para:
  //   GET /api/organigramas/revision
  //
  // ======================================================

  const cargarOrganigramas =
    useCallback(
      async () => {
        if (!autoLoad) {
          setOrganigramas([]);
          setError("");
          setLoading(false);
          return [];
        }

        setLoading(true);
        setError("");

        try {
          let endpoint =
            "/organigramas";

          if (modo === "vigente") {
            endpoint =
              "/organigramas/vigente";
          } else if (
            modo === "revision"
          ) {
            endpoint =
              "/organigramas/revision";
          } else {
            const params = [];

            if (idUsuario) {
              params.push(
                `id_usuario=${encodeURIComponent(
                  idUsuario
                )}`
              );
            }

            if (
              params.length > 0
            ) {
              endpoint +=
                `?${params.join("&")}`;
            }
          }

          const data =
            await apiFetch(
              endpoint
            );

          /*
            /organigramas/vigente
            devuelve UN objeto.

            /organigramas
            y /organigramas/revision
            devuelven listas.

            El hook mantiene siempre
            organigramas como arreglo
            para no romper Organigrama.jsx.
          */
          const lista =
            modo === "vigente"
              ? data
                ? [data]
                : []
              : Array.isArray(data)
                ? data
                : [];

          setOrganigramas(
            lista
          );

          return lista;
        } catch (err) {
          /*
            Para vigente:
            un 404 significa que todavía
            no existe una versión autorizada.
          */
          const mensaje =
            err?.message ||
            "No fue posible cargar los organigramas.";

          setOrganigramas(
            []
          );

          setError(
            mensaje
          );

          return [];
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        idUsuario,
        modo,
        autoLoad,
      ]
    );

  // ======================================================
  // CARGA AUTOMÁTICA
  // ======================================================

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    cargarOrganigramas();
  }, [
    autoLoad,
    cargarOrganigramas,
  ]);

  // ======================================================
  // GET BY ID
  // ======================================================

  const obtenerOrganigrama =
    async (id) => {
      return apiFetch(
        `/organigramas/${id}`
      );
    };

  // ======================================================
  // CREATE
  // ======================================================

  const crearOrganigrama =
    async (datos) => {
      setSaving(true);
      setError("");

      try {
        const nuevo =
          await apiFetch(
            "/organigramas",
            {
              method:
                "POST",
              body:
                JSON.stringify(
                  datos
                ),
            }
          );

        setOrganigramas(
          (actuales) => [
            nuevo,
            ...actuales,
          ]
        );

        return nuevo;
      } catch (err) {
        setError(
          err?.message ||
            "No fue posible crear el organigrama."
        );

        throw err;
      } finally {
        setSaving(
          false
        );
      }
    };

  // ======================================================
  // UPDATE
  // ======================================================

  const actualizarOrganigrama =
    async (
      id,
      datos
    ) => {
      setSaving(true);
      setError("");

      try {
        const actualizado =
          await apiFetch(
            `/organigramas/${id}`,
            {
              method:
                "PUT",
              body:
                JSON.stringify(
                  datos
                ),
            }
          );

        reemplazarLocal(
          actualizado
        );

        return actualizado;
      } catch (err) {
        setError(
          err?.message ||
            "No fue posible actualizar el organigrama."
        );

        throw err;
      } finally {
        setSaving(
          false
        );
      }
    };

  // ======================================================
  // SOLICITAR AUTORIZACIÓN
  // ======================================================

  const solicitarAutorizacion =
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const actualizado =
          await apiFetch(
            `/organigramas/${id}/solicitar`,
            {
              method:
                "PUT",
            }
          );

        reemplazarLocal(
          actualizado
        );

        return actualizado;
      } catch (err) {
        setError(
          err?.message ||
            "No fue posible solicitar la autorización."
        );

        throw err;
      } finally {
        setSaving(
          false
        );
      }
    };

  // ======================================================
  // AUTORIZAR
  // ======================================================

  const autorizarOrganigrama =
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const actualizado =
          await apiFetch(
            `/organigramas/${id}/autorizar`,
            {
              method:
                "PUT",
            }
          );

        /*
          En modo revisión,
          al autorizar ya no debe
          permanecer en pendientes.
        */
        if (
          modo === "revision"
        ) {
          setOrganigramas(
            (actuales) =>
              actuales.filter(
                (item) =>
                  Number(
                    item.id
                  ) !==
                  Number(id)
              )
          );
        } else {
          reemplazarLocal(
            actualizado
          );
        }

        return actualizado;
      } catch (err) {
        setError(
          err?.message ||
            "No fue posible autorizar el organigrama."
        );

        throw err;
      } finally {
        setSaving(
          false
        );
      }
    };

  // ======================================================
  // RECHAZAR
  // ======================================================

  const rechazarOrganigrama =
    async (
      id,
      observaciones
    ) => {
      setSaving(true);
      setError("");

      try {
        const actualizado =
          await apiFetch(
            `/organigramas/${id}/rechazar`,
            {
              method:
                "PUT",
              body:
                JSON.stringify({
                  observaciones,
                }),
            }
          );

        if (
          modo === "revision"
        ) {
          setOrganigramas(
            (actuales) =>
              actuales.filter(
                (item) =>
                  Number(
                    item.id
                  ) !==
                  Number(id)
              )
          );
        } else {
          reemplazarLocal(
            actualizado
          );
        }

        return actualizado;
      } catch (err) {
        setError(
          err?.message ||
            "No fue posible rechazar el organigrama."
        );

        throw err;
      } finally {
        setSaving(
          false
        );
      }
    };

  // ======================================================
  // DELETE
  // ======================================================

  const eliminarOrganigrama =
    async (id) => {
      setSaving(true);
      setError("");

      try {
        const resultado =
          await apiFetch(
            `/organigramas/${id}`,
            {
              method:
                "DELETE",
            }
          );

        setOrganigramas(
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
        setError(
          err?.message ||
            "No fue posible eliminar el organigrama."
        );

        throw err;
      } finally {
        setSaving(
          false
        );
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

    refresh:
      cargarOrganigramas,

    limpiarError,
  };
};