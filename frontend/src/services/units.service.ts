import api from "@/lib/axios";
import { validateArray, validateUnit } from "@/lib/response-parser";
import type { Unit } from "@/types";

export const unitsService = {
  list: async (): Promise<Unit[]> => {
    const response = await api.get<{ units: Unit[] }>("/api/units");
    if (
      !Array.isArray(response.data.units) ||
      !validateArray(response.data.units, validateUnit)
    ) {
      throw new Error("অবৈধ একক ডেটা");
    }
    return response.data.units;
  },

  create: async (data: {
    name: string;
    groupKey?: string | null;
    baseRatio?: number | null;
  }): Promise<Unit> => {
    const response = await api.post<{ unit: Unit }>("/api/units", data);
    if (!response.data.unit || !validateUnit(response.data.unit)) {
      throw new Error("অবৈধ একক ডেটা");
    }
    return response.data.unit;
  },

  update: async (
    id: number,
    data: {
      name?: string;
      groupKey?: string | null;
      baseRatio?: number | null;
    },
  ): Promise<Unit> => {
    const response = await api.patch<{ unit: Unit }>(`/api/units/${id}`, data);
    if (!response.data.unit || !validateUnit(response.data.unit)) {
      throw new Error("অবৈধ একক ডেটা");
    }
    return response.data.unit;
  },

  delete: (id: number) => api.delete<{ message: string }>(`/api/units/${id}`),

  convert: async (from: number, to: number, value: number) => {
    const response = await api.get<{ from: string; to: string; value: number; result: number }>(
      "/api/units/convert",
      { params: { from, to, value } },
    );
    return response.data;
  },
};
