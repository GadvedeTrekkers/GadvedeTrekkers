import { apiRequest } from "./backendClient";

export const catalogApi = {
  hubs: () => apiRequest("/api/catalog/hubs"),

  trips: ({ hub, type } = {}) => {
    const params = new URLSearchParams();
    if (hub) params.set("hub", hub);
    if (type) params.set("type", type);
    const query = params.toString();
    return apiRequest(`/api/catalog/trips${query ? `?${query}` : ""}`);
  },
};
