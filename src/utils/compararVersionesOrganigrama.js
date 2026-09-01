// ======================================================
// COMPARAR DOS VERSIONES DE ORGANIGRAMA
// ======================================================
const obtenerNombreArea = (nivel) => {
  return nivel?.area?.nombre_area || "Área sin nombre";
};

const obtenerIdArea = (nivel) => {
  return Number(nivel?.id_area);
};

const obtenerSuperior = (nivel, mapaPorId) => {
  if (
    nivel.id_nivel_superior === null ||
    nivel.id_nivel_superior === undefined
  ) {
    return null;
  }

  const superior = mapaPorId.get(Number(nivel.id_nivel_superior));

  return superior ? obtenerNombreArea(superior) : null;
};

// ======================================================
// FUNCIÓN PRINCIPAL
// ======================================================
export const compararVersionesOrganigrama = (
  nivelesAnterior = [],
  nivelesActual = [],
) => {
  const mapaAnteriorPorId = new Map();
  const mapaActualPorId = new Map();
  const mapaAnteriorPorArea = new Map();
  const mapaActualPorArea = new Map();

  // ======================================================
  // PREPARAR VERSIÓN ANTERIOR
  // ======================================================
  nivelesAnterior.forEach((nivel) => {
    mapaAnteriorPorId.set(Number(nivel.id), nivel);
    mapaAnteriorPorArea.set(obtenerIdArea(nivel), nivel);
  });

  // ======================================================
  // PREPARAR VERSIÓN ACTUAL
  // ======================================================
  nivelesActual.forEach((nivel) => {
    mapaActualPorId.set(Number(nivel.id), nivel);
    mapaActualPorArea.set(obtenerIdArea(nivel), nivel);
  });

  // ======================================================
  // RESULTADOS
  // ======================================================
  const agregadas = [];
  const eliminadas = [];
  const movidas = [];
  const nivelModificado = [];
  const sinCambios = [];

  // ======================================================
  // REVISAR VERSIÓN ACTUAL
  // ======================================================
  mapaActualPorArea.forEach((nivelActual, idArea) => {
    const nivelAnterior = mapaAnteriorPorArea.get(idArea);

    // Área nueva
    if (!nivelAnterior) {
      agregadas.push({
        id_area: idArea,
        nombre: obtenerNombreArea(nivelActual),
        nivel: nivelActual.nivel,
        superior: obtenerSuperior(nivelActual, mapaActualPorId),
      });

      return;
    }

    const superiorAnterior = obtenerSuperior(nivelAnterior, mapaAnteriorPorId);
    const superiorActual = obtenerSuperior(nivelActual, mapaActualPorId);
    const cambioSuperior = superiorAnterior !== superiorActual;
    const cambioNivel =
      Number(nivelAnterior.nivel) !== Number(nivelActual.nivel);

    // ================================================
    // CAMBIÓ DE SUPERIOR
    // ================================================
    if (cambioSuperior) {
      movidas.push({
        id_area: idArea,
        nombre: obtenerNombreArea(nivelActual),
        superiorAnterior,
        superiorActual,
      });
    }

    // ================================================
    // CAMBIÓ DE NIVEL
    // ================================================
    if (cambioNivel) {
      nivelModificado.push({
        id_area: idArea,
        nombre: obtenerNombreArea(nivelActual),
        nivelAnterior: nivelAnterior.nivel,
        nivelActual: nivelActual.nivel,
      });
    }

    // ================================================
    // SIN CAMBIOS
    // ================================================
    if (!cambioSuperior && !cambioNivel) {
      sinCambios.push({
        id_area: idArea,
        nombre: obtenerNombreArea(nivelActual),
      });
    }
  });

  // ======================================================
  // ÁREAS ELIMINADAS
  // ======================================================
  mapaAnteriorPorArea.forEach((nivelAnterior, idArea) => {
    if (!mapaActualPorArea.has(idArea)) {
      eliminadas.push({
        id_area: idArea,
        nombre: obtenerNombreArea(nivelAnterior),
        nivel: nivelAnterior.nivel,
        superior: obtenerSuperior(nivelAnterior, mapaAnteriorPorId),
      });
    }
  });

  // ======================================================
  // RESUMEN DE CAMBIOS ENTRE VERSIONES SELECCIONADAS
  // ======================================================
  const totalCambios =
    agregadas.length +
    eliminadas.length +
    movidas.length +
    nivelModificado.length;

  return {
    hayCambios: totalCambios > 0,
    totalCambios,
    agregadas,
    eliminadas,
    movidas,
    nivelModificado,
    sinCambios,

    resumen: {
      agregadas: agregadas.length,
      eliminadas: eliminadas.length,
      movidas: movidas.length,
      nivelModificado: nivelModificado.length,
      sinCambios: sinCambios.length,
    },
  };
};
