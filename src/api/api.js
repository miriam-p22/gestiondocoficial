const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const leerRespuesta = async (response) => {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
};

// ======================================================
// TOKEN
// ======================================================

const obtenerToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

// ======================================================
// API FETCH
// ======================================================

export const apiFetch = async (endpoint, options = {}) => {
  const tieneBody = options.body !== undefined && options.body !== null;

  const esFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const token = obtenerToken();

  const headers = {
    ...(tieneBody && !esFormData
      ? {
          "Content-Type": "application/json",
        }
      : {}),

    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),

    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  } catch {
    throw new Error(
      "No fue posible conectarse con la API. Verifique que Express esté ejecutándose en el puerto 3001.",
    );
  }

  const data = await leerRespuesta(response);

  if (!response.ok) {
    const mensaje =
      data?.error ||
      data?.message ||
      (typeof data === "string" && data) ||
      `Error HTTP ${response.status}`;

    const error = new Error(mensaje);

    error.status = response.status;

    error.data = data;

    if (response.status === 401) {
      try {
        localStorage.removeItem("token");
      } catch {}
    }

    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return data;
};

export { API_BASE_URL };
