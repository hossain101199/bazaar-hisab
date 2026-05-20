import api from "@/lib/axios";
import { validateArray, validatePurchase } from "@/lib/response-parser";
import type { Purchase, PurchaseListResponse, PriceTrend, SummaryReport, TopProduct, ShopSummary, ProductByShop } from "@/types";

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

  create: async (data: { date: string; note?: string; shopId?: number; items: ItemInput[] }): Promise<Purchase> => {
    const response = await api.post<{ purchase: Purchase }>("/api/purchases", data);
    if (!response.data.purchase || !validatePurchase(response.data.purchase)) {
      throw new Error("অবৈধ ক্রয় ডেটা");
    }
    return response.data.purchase;
  },

  update: async (
    id: number,
    data: { date?: string; note?: string | null; shopId?: number | null; items?: ItemInput[] },
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

  topProducts: async (params?: { year?: number; month?: string; limit?: number }): Promise<TopProduct[]> => {
    const response = await api.get<{ products: TopProduct[] }>("/api/purchases/report/top-products", { params });
    return response.data.products;
  },

  priceTrend: async (productId: number): Promise<PriceTrend> => {
    const response = await api.get<{ product: PriceTrend['product']; trend: PriceTrend['trend'] }>(
      `/api/purchases/trend/${productId}`,
    );
    return { product: response.data.product, trend: response.data.trend };
  },

  shopReport: async (params?: { year?: number; month?: string }): Promise<ShopSummary[]> => {
    const response = await api.get<{ shops: ShopSummary[] }>("/api/purchases/report/by-shop", { params });
    return response.data.shops;
  },

  productByShop: async (productId: number): Promise<ProductByShop> => {
    const response = await api.get<{ product: ProductByShop['product']; shops: ProductByShop['shops'] }>(
      `/api/purchases/report/product-by-shop/${productId}`,
    );
    return { product: response.data.product, shops: response.data.shops };
  },
};
