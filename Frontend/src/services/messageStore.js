import { normalizeEntity, requestJson } from "../admin/services/http";

export const messageStore = {
  async list() {
    const messages = await requestJson("/messages");
    return Array.isArray(messages) ? messages.map(normalizeEntity) : [];
  },

  async create(input) {
    const created = await requestJson("/messages", {
      method: "POST",
      body: JSON.stringify({
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        message: input.message.trim()
      })
    });
    return normalizeEntity(created);
  },

  async updateStatus(id, status) {
    const updated = await requestJson(`/messages/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    return normalizeEntity(updated);
  },

  async remove(id) {
    await requestJson(`/messages/${id}`, {
      method: "DELETE"
    });
    return true;
  }
};
