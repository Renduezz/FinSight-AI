import { apiFetch } from "@/shared/lib/apiClient";

export function updateName(newName: string) {
  return apiFetch<{ message: string }>("/users/settings/name", {
    method: "PATCH",
    body: JSON.stringify({ newName }),
  });
}

export function updateEmail(newEmail: string, currentPassword: string) {
  return apiFetch<{ message: string }>("/users/settings/email", {
    method: "PATCH",
    body: JSON.stringify({ newEmail, currentPassword }),
  });
}

export function updatePassword(currentPassword: string, newPassword: string) {
  return apiFetch<{ message: string }>("/users/settings/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}