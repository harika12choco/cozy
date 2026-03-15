import { normalizeEntity, requestJson } from "./http";

export const userService = {
  async list() {
    const users = await requestJson("/users");
    return Array.isArray(users) ? users.map(normalizeEntity) : [];
  },

  async updateRole(id, role) {
    const updated = await requestJson(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ role })
    });
    return normalizeEntity(updated);
  },

  async updateStatus(id, status) {
    const updated = await requestJson(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    return normalizeEntity(updated);
  },

  async remove(id) {
    await requestJson(`/users/${id}`, {
      method: "DELETE"
    });
    return true;
  }
};
