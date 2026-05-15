"use client";

import { useAuthStore } from "@/store/auth.store";
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// A single in-flight refresh promise shared across all concurrent 401 failures.
// This prevents multiple simultaneous refresh calls when several requests expire at once.
let refreshPromise: Promise<string> | null = null;

let isRedirecting = false;

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    isRedirecting = false;

    if (
      response.status >= 200 &&
      response.status < 300 &&
      response.data?.success === false
    ) {
      return Promise.reject({
        response: {
          status: 400,
          data: { message: response.data.message || "অপারেশন ব্যর্থ হয়েছে" },
        },
      });
    }
    return response;
  },
  async (error) => {
    const original = error.config;

    // Only attempt refresh on 401, and only once per request (_retry flag).
    if (error.response?.status !== 401 || original?._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = axios
        .post<{ accessToken: string }>(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true },
        )
        .then((r) => r.data.accessToken)
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const newToken = await refreshPromise;
      useAuthStore.getState().setToken(newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      if (!isRedirecting) {
        isRedirecting = true;
        useAuthStore.getState().logout();

        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/register") {
          sessionStorage.setItem("redirectAfterLogin", currentPath);
        }

        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  },
);

export default api;
