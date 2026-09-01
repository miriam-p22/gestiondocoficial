import React, {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Tree,
  TreeNode,
} from "react-organizational-chart";

import "../styles/ArbolOrganigrama.css";

// ======================================================
// COMPONENTE
// ======================================================

const ArbolOrganigrama = forwardRef(
  (
    {
      niveles = [],
    },
    exportRef
  ) => {
    // ==================================================
    // REFERENCIAS / ESTADOS
    // ==================================================

    const contenedorRef =
      useRef(null);

    const [zoom, setZoom] =
      useState(1);

    // ==================================================
    // CONSTRUIR ESTRUCTURA
    // ==================================================

    const estructura =
      useMemo(() => {
        const nodos =
          new Map();

        const hijosPorPadre =
          new Map();

        // Registrar todos los nodos
        niveles.forEach(
          (item) => {
            const id =
              Number(
                item.id
              );

            nodos.set(
              id,
              item
            );

            hijosPorPadre.set(
              id,
              []
            );
          }
        );

        // Relacionar hijos con padres
        niveles.forEach(
          (item) => {
            if (
              item.id_nivel_superior ===
                null ||
              item.id_nivel_superior ===
                undefined
            ) {
              return;
            }

            const idPadre =
              Number(
                item.id_nivel_superior
              );

            if (
              hijosPorPadre.has(
                idPadre
              )
            ) {
              hijosPorPadre
                .get(idPadre)
                .push(item);
            }
          }
        );

        // Buscar raíces
        const raices =
          niveles.filter(
            (item) =>
              item.id_nivel_superior ===
                null ||
              item.id_nivel_superior ===
                undefined
          );

        // Orden alfabético dentro
        // de cada rama
        hijosPorPadre.forEach(
          (lista) => {
            lista.sort(
              (a, b) => {
                const nombreA =
                  String(
                    a.area
                      ?.nombre_area ||
                      ""
                  );

                const nombreB =
                  String(
                    b.area
                      ?.nombre_area ||
                      ""
                  );

                return nombreA.localeCompare(
                  nombreB,
                  "es"
                );
              }
            );
          }
        );

        return {
          nodos,
          hijosPorPadre,
          raices,
        };
      }, [niveles]);

    // ==================================================
    // ZOOM
    // ==================================================

    const acercar = () => {
      setZoom(
        (actual) =>
          Math.min(
            Number(
              (
                actual +
                0.1
              ).toFixed(1)
            ),
            1.8
          )
      );
    };

    const alejar = () => {
      setZoom(
        (actual) =>
          Math.max(
            Number(
              (
                actual -
                0.1
              ).toFixed(1)
            ),
            0.5
          )
      );
    };

    const restaurarZoom =
      () => {
        setZoom(1);
      };

    // ==================================================
    // CENTRAR
    // ==================================================

    const centrar = (
      suave = true
    ) => {
      const contenedor =
        contenedorRef.current;

      if (!contenedor) {
        return;
      }

      const izquierda =
        Math.max(
          (
            contenedor.scrollWidth -
            contenedor.clientWidth
          ) / 2,
          0
        );

      contenedor.scrollTo({
        left:
          izquierda,

        top:
          0,

        behavior:
          suave
            ? "smooth"
            : "auto",
      });
    };

    // ==================================================
    // CENTRAR AL CARGAR / CAMBIAR
    // ==================================================

    useEffect(() => {
      if (
        !niveles.length
      ) {
        return;
      }

      const temporizador =
        window.setTimeout(
          () => {
            centrar(
              false
            );
          },
          80
        );

      return () =>
        window.clearTimeout(
          temporizador
        );
    }, [niveles]);

    // ==================================================
    // ETIQUETA DEL NODO
    // ==================================================

    const crearEtiqueta = (
      nodo,
      esRaiz = false
    ) => {
      const nombre =
        nodo.area
          ?.nombre_area ||
        "Sin área";

      const numeroNivel =
        nodo.nivel ??
        "—";

      return (
        <div
          className={
            esRaiz
              ? "org-node org-node-root"
              : "org-node"
          }
          title={nombre}
        >
          <div className="org-node-header">
            {!esRaiz && (
              <span className="org-node-indicator" />
            )}

            <span className="org-node-name">
              {nombre}
            </span>
          </div>

          <div className="org-node-footer">
            <span className="org-node-level">
              Nivel{" "}
              {numeroNivel}
            </span>
          </div>
        </div>
      );
    };

    // ==================================================
    // RENDER RECURSIVO
    // ==================================================

    const renderNodo = (
      nodo,
      visitados = new Set()
    ) => {
      const id =
        Number(
          nodo.id
        );

      // Protección extra
      // contra ciclos
      if (
        visitados.has(
          id
        )
      ) {
        return null;
      }

      const nuevosVisitados =
        new Set(
          visitados
        );

      nuevosVisitados.add(
        id
      );

      const hijos =
        estructura
          .hijosPorPadre
          .get(id) ||
        [];

      return (
        <TreeNode
          key={id}
          label={
            crearEtiqueta(
              nodo
            )
          }
        >
          {hijos.map(
            (hijo) =>
              renderNodo(
                hijo,
                nuevosVisitados
              )
          )}
        </TreeNode>
      );
    };

    // ==================================================
    // SIN DATOS
    // ==================================================

    if (
      niveles.length ===
      0
    ) {
      return (
        <div className="org-empty">
          <strong>
            Organigrama sin áreas
          </strong>

          <span>
            Agregue áreas para comenzar
            a construir la estructura.
          </span>
        </div>
      );
    }

    // ==================================================
    // VALIDAR RAÍZ
    // ==================================================

    if (
      estructura.raices
        .length === 0
    ) {
      return (
        <div className="org-tree-error">
          No existe una raíz válida
          en el organigrama.
        </div>
      );
    }

    if (
      estructura.raices
        .length > 1
    ) {
      return (
        <div className="org-tree-error">
          El organigrama contiene
          más de una raíz.
        </div>
      );
    }

    // ==================================================
    // RAÍZ
    // ==================================================

    const raiz =
      estructura.raices[0];

    const hijosRaiz =
      estructura
        .hijosPorPadre
        .get(
          Number(
            raiz.id
          )
        ) || [];

    // ==================================================
    // RENDER
    // ==================================================

    return (
      <div className="org-tree-wrapper">

        {/* ============================================= */}
        {/* HERRAMIENTAS */}
        {/* ============================================= */}

        <div className="org-tree-toolbar">

          <div className="org-tree-toolbar-group">
            <button
              type="button"
              onClick={
                alejar
              }
              className="org-tree-control"
              title="Alejar"
              disabled={
                zoom <= 0.5
              }
            >
              −
            </button>

            <span className="org-tree-zoom-value">
              {Math.round(
                zoom *
                  100
              )}
              %
            </span>

            <button
              type="button"
              onClick={
                acercar
              }
              className="org-tree-control"
              title="Acercar"
              disabled={
                zoom >= 1.8
              }
            >
              +
            </button>
          </div>

          <div className="org-tree-toolbar-separator" />

          <div className="org-tree-toolbar-group">
            <button
              type="button"
              onClick={
                restaurarZoom
              }
              className="org-tree-control org-tree-control-text"
              title="Restaurar tamaño"
            >
              100%
            </button>

            <button
              type="button"
              onClick={() =>
                centrar(
                  true
                )
              }
              className="org-tree-control org-tree-control-text"
              title="Centrar organigrama"
            >
              Centrar
            </button>
          </div>
        </div>

        {/* ============================================= */}
        {/* VISOR */}
        {/* ============================================= */}

        <div
          ref={
            contenedorRef
          }
          className="org-tree-viewport"
        >
          <div
            ref={
              exportRef
            }
            className="org-tree-export-area"
          >
            <div
              className="org-tree-zoom-content"
              style={{
                zoom,
              }}
            >
              <div className="org-tree-content">
                <Tree
                  lineWidth="2px"
                  lineColor="#8ca8b5"
                  lineBorderRadius="8px"
                  lineHeight="36px"
                  nodePadding="18px"
                  label={
                    crearEtiqueta(
                      raiz,
                      true
                    )
                  }
                >
                  {hijosRaiz.map(
                    (hijo) =>
                      renderNodo(
                        hijo,
                        new Set([
                          Number(
                            raiz.id
                          ),
                        ])
                      )
                  )}
                </Tree>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// ======================================================
// NOMBRE DEL COMPONENTE
// ======================================================

ArbolOrganigrama.displayName =
  "ArbolOrganigrama";

export default ArbolOrganigrama;