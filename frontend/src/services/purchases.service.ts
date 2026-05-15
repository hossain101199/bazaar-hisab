import api from "@/lib/axios";
import { validateArray, validatePurchase } from "@/lib/response-parser";
import type {
  Purchase,
  PurchaseListResponse,
  SummaryReport,
} from "@/types";

type ItemInput = { productId: number; quantity: number; totalPrice: number };

/**
 * Purchases service with response validation
 */
export const purchasesService = {
  list: async (params?: {
    month?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get<PurchaseListResponse>("/api/purchases", {
      params,
    });

    // Validate response structure
    if (
      !Array.isArray(response.data.purchases) ||
      !validateArray(response.data.purchases, validatePurchase)
    ) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }

    return response;
  },

  getById: async (id: number) => {
    const response = await api.get<{ purchase: Purchase }>(
      `/api/purchases/${id}`,
    );

    // Validate response structure
    if (!response.data.purchase || !validatePurchase(response.data.purchase)) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }

    return response;
  },

  create: async (data: { date: string; note?: string; items: ItemInput[] }) => {
    const response = await api.post<{ purchase: Purchase }>(
      "/api/purchases",
      data,
    );

    // Validate response structure
    if (!response.data.purchase || !validatePurchase(response.data.purchase)) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }

    return response;
  },

  update: async (
    id: number,
    data: { date?: string; note?: string; items?: ItemInput[] },
  ) => {
    const response = await api.patch<{ purchase: Purchase }>(
      `/api/purchases/${id}`,
      data,
    );

    // Validate response structure
    if (!response.data.purchase || !validatePurchase(response.data.purchase)) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }

    return response;
  },

  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/purchases/${id}`),

  summary: (year?: number) =>
    api.get<{ summary: SummaryReport }>("/api/purchases/report/summary", {
      params: { year },
    }),
};
