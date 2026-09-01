export const validarOrganigrama = (niveles = []) => {
  const resultados = [];

  if (!Array.isArray(niveles)) {
    return {
      valido: false,
      resultados: [
        {
          codigo: "INVALID_DATA",
          tipo: "error",
          mensaje: "La estructura del organigrama no es válida.",
        },
      ],
    };
  }

  // ======================================================
  // SIN ÁREAS
  // ====================================================
  if (niveles.length === 0) {
    return {
      valido: false,
      resultados: [
        {
          codigo: "EMPTY",
          tipo: "error",
          mensaje: "El organigrama todavía no tiene áreas.",
        },
      ],
    };
  }

  // ======================================================
  // MAPAS AUXILIARES
  // ======================================================
  const porId = new Map();

  niveles.forEach((item) => {
    porId.set(Number(item.id), item);
  });

  // ======================================================
  // RAÍCES
  // ======================================================
  const raices = niveles.filter(
    (item) =>
      item.id_nivel_superior === null || item.id_nivel_superior === undefined,
  );

  if (raices.length === 1) {
    resultados.push({
      codigo: "ROOT_OK",
      tipo: "correcto",
      mensaje: `Raíz encontrada: ${
        raices[0].area?.nombre_area || "Sin nombre"
      }.`,
    });
  } else if (raices.length === 0) {
    resultados.push({
      codigo: "NO_ROOT",
      tipo: "error",
      mensaje: "El organigrama no tiene una raíz.",
    });
  } else {
    resultados.push({
      codigo: "MULTIPLE_ROOTS",
      tipo: "error",
      mensaje: `El organigrama tiene ${raices.length} raíces. Debe existir solamente una.`,
    });
  }

  // ======================================================
  // PADRES INEXISTENTES
  // ======================================================
  const huerfanos = niveles.filter((item) => {
    if (
      item.id_nivel_superior === null ||
      item.id_nivel_superior === undefined
    ) {
      return false;
    }

    return !porId.has(Number(item.id_nivel_superior));
  });

  if (huerfanos.length === 0) {
    resultados.push({
      codigo: "NO_ORPHANS",
      tipo: "correcto",
      mensaje: "No existen áreas con una relación superior inexistente.",
    });
  } else {
    resultados.push({
      codigo: "ORPHANS",
      tipo: "error",
      mensaje: `${huerfanos.length} área(s) tienen una relación superior inválida.`,
      detalles: huerfanos.map(
        (item) => item.area?.nombre_area || `Nivel ${item.id}`,
      ),
    });
  }

  // ======================================================
  // ÁREAS REPETIDAS
  // ======================================================
  const conteoAreas = new Map();

  niveles.forEach((item) => {
    const idArea = Number(item.id_area);
    conteoAreas.set(idArea, (conteoAreas.get(idArea) || 0) + 1);
  });

  const repetidos = niveles.filter(
    (item) => conteoAreas.get(Number(item.id_area)) > 1,
  );

  const nombresRepetidos = [
    ...new Set(
      repetidos.map((item) => item.area?.nombre_area || `Área ${item.id_area}`),
    ),
  ];

  if (nombresRepetidos.length === 0) {
    resultados.push({
      codigo: "NO_DUPLICATES",
      tipo: "correcto",
      mensaje: "No existen áreas repetidas.",
    });
  } else {
    resultados.push({
      codigo: "DUPLICATES",
      tipo: "error",
      mensaje: "Existen áreas repetidas dentro del organigrama.",
      detalles: nombresRepetidos,
    });
  }

  // ======================================================
  // DETECCIÓN DE CICLOS
  // ======================================================
  let tieneCiclo = false;

  const visitar = (idInicial) => {
    const visitados = new Set();
    let actual = porId.get(Number(idInicial));

    while (actual && actual.id_nivel_superior) {
      const idActual = Number(actual.id);

      if (visitados.has(idActual)) {
        return true;
      }

      visitados.add(idActual);
      actual = porId.get(Number(actual.id_nivel_superior));
    }

    return false;
  };

  niveles.forEach((item) => {
    if (visitar(item.id)) {
      tieneCiclo = true;
    }
  });

  if (!tieneCiclo) {
    resultados.push({
      codigo: "NO_CYCLES",
      tipo: "correcto",
      mensaje: "No existen relaciones circulares.",
    });
  } else {
    resultados.push({
      codigo: "CYCLE",
      tipo: "error",
      mensaje: "Se detectó una relación circular en el organigrama.",
    });
  }

  // ======================================================
  // PRESIDENCIA MUNICIPAL
  // ======================================================
  const presidencia = niveles.find(
    (item) =>
      String(item.area?.nombre_area || "")
        .trim()
        .toLowerCase() === "presidencia municipal",
  );

  if (presidencia) {
    resultados.push({
      codigo: "PRESIDENCIA_OK",
      tipo: "correcto",
      mensaje: "Presidencia Municipal está incluida.",
    });
  } else {
    resultados.push({
      codigo: "PRESIDENCIA_MISSING",
      tipo: "advertencia",
      mensaje: "No se encontró Presidencia Municipal.",
    });
  }

  // ======================================================
  // H. CABILDO
  // ======================================================
  const cabildo = niveles.find(
    (item) =>
      String(item.area?.nombre_area || "")
        .trim()
        .toLowerCase() === "h. cabildo",
  );

  if (cabildo) {
    resultados.push({
      codigo: "CABILDO_OK",
      tipo: "correcto",
      mensaje: "H. Cabildo está incluido.",
    });
  } else {
    resultados.push({
      codigo: "CABILDO_MISSING",
      tipo: "advertencia",
      mensaje: "No se encontró H. Cabildo.",
    });
  }

  // ======================================================
  // NIVELES ADMINISTRATIVOS
  // ======================================================
  const nivelesInvalidos = niveles.filter(
    (item) => !Number.isInteger(Number(item.nivel)) || Number(item.nivel) <= 0,
  );

  if (nivelesInvalidos.length === 0) {
    resultados.push({
      codigo: "LEVELS_OK",
      tipo: "correcto",
      mensaje: "Todos los niveles administrativos son válidos.",
    });
  } else {
    resultados.push({
      codigo: "INVALID_LEVELS",
      tipo: "error",
      mensaje: "Existen áreas sin un nivel administrativo válido.",
    });
  }

  // ======================================================
  // RESULTADO GENERAL
  // ======================================================
  const errores = resultados.filter((item) => item.tipo === "error");

  return {
    valido: errores.length === 0,
    totalErrores: errores.length,
    totalAdvertencias: resultados.filter((item) => item.tipo === "advertencia")
      .length,
    resultados,
  };
};
