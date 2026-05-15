import api from "@/lib/axios";
import { validateArray, validateUnit } from "@/lib/response-parser";
import type { Unit } from "@/types";

/**
 * Units service with response validation
 */
export const unitsService = {
  list: async () => {
    const response = await api.get<{ units: Unit[] }>("/api/units");

    // Validate response structure
    if (
      !Array.isArray(response.data.units) ||
      !validateArray(response.data.units, validateUnit)
    ) {
      throw new Error("অবৈধ একক ডেটা");
    }

    return response;
  },

  create: async (data: {
    name: string;
    type: string;
    groupKey?: string | null;
    baseRatio?: number | null;
  }) => {
    const response = await api.post<{ unit: Unit }>("/api/units", data);

    // Validate response structure
    if (!response.data.unit || !validateUnit(response.data.unit)) {
      throw new Error("অবৈধ একক ডেটা");
    }

    return response;
  },

  update: async (
    id: number,
    data: {
      name?: string;
      groupKey?: string | null;
      baseRatio?: number | null;
    },
  ) => {
    const response = await api.patch<{ unit: Unit }>(`/api/units/${id}`, data);

    // Validate response structure
    if (!response.data.unit || !validateUnit(response.data.unit)) {
      throw new Error("অবৈধ একক ডেটা");
    }

    return response;
  },

  delete: (id: number) => api.delete<{ message: string }>(`/api/units/${id}`),

  convert: (from: number, to: number, value: number) =>
    api.get<{ from: string; to: string; value: number; result: number }>(
      "/api/units/convert",
      {
        params: { from, to, value },
      },
    ),
};
