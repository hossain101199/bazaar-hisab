import api from "@/lib/axios";
import type { Shop } from "@/types";

export const shopsService = {
  list: async (): Promise<Shop[]> => {
    const response = await api.get<{ shops: Shop[] }>("/api/shops");
    return response.data.shops;
  },

  create: async (data: { name: string; address?: string }): Promise<Shop> => {
    const response = await api.post<{ shop: Shop }>("/api/shops", data);
    return response.data.shop;
  },

  update: async (id: number, data: { name?: string; address?: string | null }): Promise<Shop> => {
    const response = await api.patch<{ shop: Shop }>(`/api/shops/${id}`, data);
    return response.data.shop;
  },

  delete: (id: number) => api.delete<{ message: string }>(`/api/shops/${id}`),
};
