import api from "@/lib/axios";
import { validateArray, validateUser } from "@/lib/response-parser";
import type { User } from "@/types";

export const adminService = {
  listUsers: async (): Promise<User[]> => {
    const response = await api.get<{ users: User[] }>("/api/admin/users");
    if (
      !Array.isArray(response.data.users) ||
      !validateArray(response.data.users, validateUser)
    ) {
      throw new Error("অবৈধ ব্যবহারকারী ডেটা");
    }
    return response.data.users;
  },
};
