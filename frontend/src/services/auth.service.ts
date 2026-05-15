import api from "@/lib/axios";
import { validateUser } from "@/lib/response-parser";
import type { User } from "@/types";
import axios from "axios";

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<{ accessToken: string; user: User }>(
      "/api/auth/login",
      { email, password },
    );
    return response.data;
  },

  register: async (name: string, email: string, password: string) => {
    const response = await api.post<{ user: User }>("/api/auth/register", {
      name,
      email,
      password,
    });

    if (!response.data.user || !validateUser(response.data.user)) {
      throw new Error("অবৈধ ব্যবহারকারী ডেটা");
    }

    return response.data;
  },

  // Uses the httpOnly cookie — must bypass the api interceptor to avoid a loop.
  refresh: async () => {
    const response = await axios.post<{ accessToken: string; user: User }>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
      {},
      { withCredentials: true },
    );
    return response.data;
  },

  logout: async () => {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
      {},
      { withCredentials: true },
    );
  },

  me: async () => {
    const response = await api.get<{ user: User }>("/api/auth/me");

    if (!response.data.user || !validateUser(response.data.user)) {
      throw new Error("অবৈধ ব্যবহারকারী ডেটা");
    }

    return response.data;
  },
};
