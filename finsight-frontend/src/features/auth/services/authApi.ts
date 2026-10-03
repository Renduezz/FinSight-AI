import { apiFetch } from "@/shared/lib/apiClient";

interface AuthResponse {
  token: string;
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    auth: false,
  });
}

export function register(fullName: string, email: string, password: string) {
  return apiFetch<{ id: number }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: fullName, email, password }),
    auth: false,
  });
}