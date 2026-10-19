const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

// IaController vive en /api/ia (sin /v1), a diferencia del resto de la API.
const API_ROOT_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

export async function preguntarIA(pregunta: string): Promise<string> {
  const url = `${API_ROOT_URL}/api/ia/preguntar?pregunta=${encodeURIComponent(pregunta)}`;

  const token = typeof window !== "undefined" ? localStorage.getItem("finsight_token") : null;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener respuesta del asistente.");
  }

  return response.text();
}