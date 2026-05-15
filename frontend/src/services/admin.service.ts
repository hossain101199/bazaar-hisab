import api from "@/lib/axios";
import { validateArray, validateUser } from "@/lib/response-parser";
import type { User } from "@/types";

/**
 * Admin service with response validation
 */
export const adminService = {
  listUsers: async () => {
    const response = await api.get<{ users: User[] }>("/api/admin/users");

    // Validate response structure
    if (
      !Array.isArray(response.data.users) ||
      !validateArray(response.data.users, validateUser)
    ) {
      throw new Error("অবৈধ ব্যবহারকারী ডেটা");
    }

    return response;
  },
};
