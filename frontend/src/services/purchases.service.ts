import api from "@/lib/axios";
import { validateArray, validatePurchase } from "@/lib/response-parser";
import type { Purchase, PurchaseListResponse, SummaryReport } from "@/types";

type ItemInput = { productId: number; quantity: number; totalPrice: number };

export const purchasesService = {
  list: async (params?: {
    month?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PurchaseListResponse> => {
    const response = await api.get<PurchaseListResponse>("/api/purchases", { params });
    if (
      !Array.isArray(response.data.purchases) ||
      !validateArray(response.data.purchases, validatePurchase)
    ) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }
    return response.data;
  },

  getById: async (id: number): Promise<Purchase> => {
    const response = await api.get<{ purchase: Purchase }>(`/api/purchases/${id}`);
    if (!response.data.purchase || !validatePurchase(response.data.purchase)) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }
    return response.data.purchase;
  },

  create: async (data: { date: string; note?: string; items: ItemInput[] }): Promise<Purchase> => {
    const response = await api.post<{ purchase: Purchase }>("/api/purchases", data);
    if (!response.data.purchase || !validatePurchase(response.data.purchase)) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }
    return response.data.purchase;
  },

  update: async (
    id: number,
    data: { date?: string; note?: string; items?: ItemInput[] },
  ): Promise<Purchase> => {
    const response = await api.patch<{ purchase: Purchase }>(`/api/purchases/${id}`, data);
    if (!response.data.purchase || !validatePurchase(response.data.purchase)) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }
    return response.data.purchase;
  },

  delete: (id: number) => api.delete<{ message: string }>(`/api/purchases/${id}`),

  summary: async (year?: number): Promise<SummaryReport> => {
    const response = await api.get<{ summary: SummaryReport }>(
      "/api/purchases/report/summary",
      { params: { year } },
    );
    return response.data.summary;
  },
};
