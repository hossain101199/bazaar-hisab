import api from "@/lib/axios";
import { validateArray, validateProduct } from "@/lib/response-parser";
import type { Product } from "@/types";

/**
 * Products service with response validation
 */
export const productsService = {
  list: async () => {
    const response = await api.get<{ products: Product[] }>("/api/products");

    // Validate response structure
    if (
      !Array.isArray(response.data.products) ||
      !validateArray(response.data.products, validateProduct)
    ) {
      throw new Error("অবৈধ পণ্য ডেটা");
    }

    return response;
  },

  create: async (data: { name: string; unitId: number; type?: string }) => {
    const response = await api.post<{ product: Product }>(
      "/api/products",
      data,
    );

    // Validate response structure
    if (!response.data.product || !validateProduct(response.data.product)) {
      throw new Error("অবৈধ পণ্য ডেটা");
    }

    return response;
  },

  update: async (id: number, data: { name?: string; unitId?: number }) => {
    const response = await api.patch<{ product: Product }>(
      `/api/products/${id}`,
      data,
    );

    // Validate response structure
    if (!response.data.product || !validateProduct(response.data.product)) {
      throw new Error("অবৈধ পণ্য ডেটা");
    }

    return response;
  },

  delete: (id: number) =>
    api.delete<{ message: string }>(`/api/products/${id}`),
};
