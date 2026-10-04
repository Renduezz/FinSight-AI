const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

interface ApiOptions extends RequestInit {
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...rest } = options;

  // Si el body es un archivo (FormData), dejamos que el navegador fije su
  // propio Content-Type con el "boundary" correcto. Si nosotros forzamos
  // "application/json" (o cualquier otro valor) encima, el backend no puede
  // interpretar el archivo como multipart.
  const isFormData = body instanceof FormData;

  const finalHeaders: Record<string, string> = {};
  if (!isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }
  Object.assign(finalHeaders, headers as Record<string, string>);

  if (auth) {
    const token = typeof window !== "undefined" ? localStorage.getItem("finsight_token") : null;
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...rest, body, headers: finalHeaders });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.message ?? `Request failed (${response.status})`);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}