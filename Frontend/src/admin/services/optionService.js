import { normalizeEntity, requestJson } from "./http";

function normalizeOption(option) {
  return normalizeEntity({
    ...option,
    enabled: option.enabled !== false
  });
}

function createOptionService(path) {
  return {
    async list(params = {}) {
      const searchParams = new URLSearchParams();

      if (params.q) {
        searchParams.set("q", params.q);
      }

      if (params.enabled !== undefined) {
        searchParams.set("enabled", String(params.enabled));
      }

      const query = searchParams.toString();
      const options = await requestJson(`${path}${query ? `?${query}` : ""}`);
      return Array.isArray(options) ? options.map(normalizeOption) : [];
    },

    async create(option) {
      const created = await requestJson(path, {
        method: "POST",
        body: JSON.stringify(option)
      });
      return normalizeOption(created);
    },

    async update(id, option) {
      const updated = await requestJson(`${path}/${id}`, {
        method: "PUT",
        body: JSON.stringify(option)
      });
      return normalizeOption(updated);
    },

    async remove(id) {
      await requestJson(`${path}/${id}`, {
        method: "DELETE"
      });
      return true;
    }
  };
}

export const candleColorService = createOptionService("/candle-colors");
export const fragranceService = createOptionService("/fragrances");
