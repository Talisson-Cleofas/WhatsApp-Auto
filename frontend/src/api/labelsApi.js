// src/api/labelsApi.js
const API_BASE_URL = "http://localhost:3000"; // ou sua URL real do backend

export async function getLabels() {
  const response = await fetch(`${API_BASE_URL}/labels`);
  if (!response.ok) {
    throw new Error("Erro ao buscar etiquetas");
  }
  const data = await response.json();
  return data; // Esperamos algo como { success: true, labels: [...] }
}

export async function createLabel(name) {
  const response = await fetch(`${API_BASE_URL}/labels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) {
    throw new Error("Erro ao criar etiqueta");
  }
  const data = await response.json();
  return data;
}

export async function deleteLabel(id) {
  const response = await fetch(`${API_BASE_URL}/labels/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Erro ao excluir etiqueta");
  }
  const data = await response.json();
  return data;
}
