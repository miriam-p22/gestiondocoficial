const ESTADOS_PERMITIDOS = [
  "pendiente",
  "recibido",
  "devuelto",
  "atendido",
];

const normalizarEstado = (valor) => {
  const estado = String(valor ?? "")
    .trim()
    .toLowerCase();

  if (!ESTADOS_PERMITIDOS.includes(estado)) {
    throw new Error("INVALID_STATE");
  }

  return estado;
};