export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function request(path, options) {
  const response = await fetch(`${API_URL}${path}`, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) throw new Error(body.error || body.message || "Request failed");
  return body;
}