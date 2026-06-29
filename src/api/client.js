import axios from "axios";
import { clearAuthSession } from "../utils/auth";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Unwrap `{ success, data }` from API spec while keeping legacy flat responses working */
api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body.success === "boolean" && body.success === true && "data" in body) {
      response.data = body.data;
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = String(error.response?.data?.message || "").toLowerCase();
    if (
      status === 401 &&
      (message.includes("user not found") ||
        message.includes("invalid or expired token") ||
        message.includes("missing or invalid authorization header"))
    ) {
      clearAuthSession();
    }

    const data = error.response?.data;
    if (data && data.success === false && data.error) {
      error.response.data = {
        message: data.error.message || "Request failed",
        code: data.error.code,
        details: data.error.details,
      };
    }
    return Promise.reject(error);
  }
);
