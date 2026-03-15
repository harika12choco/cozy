import { normalizeEntity, requestJson } from "./http";

export const orderService = {
  async list() {
    const orders = await requestJson("/orders");
    return Array.isArray(orders) ? orders.map(normalizeEntity) : [];
  },

  async create(order) {
    const created = await requestJson("/orders", {
      method: "POST",
      body: JSON.stringify(order)
    });
    return normalizeEntity(created);
  },

  async updateStatus(id, status) {
    const updated = await requestJson(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status })
    });
    return normalizeEntity(updated);
  },

  async remove(id) {
    await requestJson(`/orders/${id}`, {
      method: "DELETE"
    });
    return true;
  }
};
