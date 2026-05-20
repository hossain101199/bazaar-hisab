import api from "@/lib/axios";
import { validateArray, validateProduct } from "@/lib/response-parser";
import type { Product } from "@/types";

export const productsService = {
  list: async (): Promise<Product[]> => {
    const response = await api.get<{ products: Product[] }>("/api/products");
    if (
      !Array.isArray(response.data.products) ||
      !validateArray(response.data.products, validateProduct)
    ) {
      throw new Error("অবৈধ পণ্য ডেটা");
    }
    return response.data.products;
  },

  create: async (data: { name: string; unitId: number }): Promise<Product> => {
    const response = await api.post<{ product: Product }>("/api/products", data);
    if (!response.data.product || !validateProduct(response.data.product)) {
      throw new Error("অবৈধ পণ্য ডেটা");
    }
    return response.data.product;
  },

  update: async (id: number, data: { name?: string; unitId?: number }): Promise<Product> => {
    const response = await api.patch<{ product: Product }>(`/api/products/${id}`, data);
    if (!response.data.product || !validateProduct(response.data.product)) {
      throw new Error("অবৈধ পণ্য ডেটা");
    }
    return response.data.product;
  },

  delete: (id: number) => api.delete<{ message: string }>(`/api/products/${id}`),
};
