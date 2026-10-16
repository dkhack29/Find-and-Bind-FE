import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = import.meta.env.VITE_BASE_URL || "https://find-and-bind-be.onrender.com/api/";

// Token helper functions
export const getAccessToken = () => Cookies.get("accessToken");
export const getRefreshToken = () => localStorage.getItem("refreshToken");

export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) Cookies.set("accessToken", accessToken, { expires: 7, path: "/" });
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
};

export const clearTokens = () => {
  Cookies.remove("accessToken", { path: "/" });
  localStorage.removeItem("refreshToken");
};

export const isAuthenticated = () => !!getAccessToken();

// Create Axios Instance
const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Helper for param serialization
const serializeParams = (params = {}) => {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (value !== null && value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  }
  return searchParams.toString();
};

// Request Interceptor
client.interceptors.request.use(
  (config) => {
    const isFormData = Object.prototype.toString.call(config.data) === "[object FormData]";

    if (isFormData) {
      delete config.headers["Content-Type"];
    } else if (!config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }

    if (config.requiresAuth) {
      const token = getAccessToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Queue for retry requests on refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Redirect Helper
const redirectTo = (path) => {
  if (typeof window !== "undefined") {
    window.location.href = path;
  }
};

// Response Interceptor
client.interceptors.response.use(
  (response) => {
    const res = response.data;
    
    // Auto unwrap standard backend response
    if (res && typeof res === "object") {
      return {
        success: res.success ?? true,
        data: res.data !== undefined ? res.data : res,
        message: res.message || "",
        statusCode: response.status,
        ...(res.totalCount !== undefined ? {
          totalCount: res.totalCount,
          pageIndex: res.pageIndex,
          pageSize: res.pageSize,
          totalPages: res.totalPages,
        } : {}),
      };
    }

    return {
      success: true,
      data: res,
      message: "",
      statusCode: response.status,
    };
  },
  async (error) => {
    const originalRequest = error.config || {};

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return client(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const refreshUrl = `${BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/"}Authetication/refresh-token`;
          const refreshRes = await axios.post(refreshUrl, { refreshToken });

          const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
          const newRefreshToken = refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;

          if (newAccessToken) {
            setTokens(newAccessToken, newRefreshToken || refreshToken);
            processQueue(null, newAccessToken);
            isRefreshing = false;

            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return client(originalRequest);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          clearTokens();
          redirectTo("/auth/login");
          return Promise.reject(refreshErr);
        }
      }

      isRefreshing = false;
      clearTokens();
      redirectTo("/auth/login");
      return Promise.reject(error);
    }

    if (error.response?.status === 403) {
      redirectTo("/403");
    }

    return Promise.reject(error);
  }
);

// Standardized API Wrappers
export const getApi = (url, options = {}) => {
  const { params, ...restConfig } = options;
  const queryString = params ? serializeParams(params) : "";
  const finalUrl = queryString ? `${url}?${queryString}` : url;
  return client.get(finalUrl, restConfig);
};

export const postApi = (url, options = {}) => {
  const { data, ...restConfig } = options;
  return client.post(url, data || {}, restConfig);
};

export const putApi = (url, options = {}) => {
  const { data, ...restConfig } = options;
  return client.put(url, data || {}, restConfig);
};

export const patchApi = (url, options = {}) => {
  const { data, ...restConfig } = options;
  return client.patch(url, data || {}, restConfig);
};

export const deleteApi = (url, options = {}) => {
  const { data, ...restConfig } = options;
  return client.delete(url, { ...restConfig, data });
};

// Error Handler Wrapper
export const throwErr = (error, context = "") => {
  const response = error?.response;
  const status = response?.status || error?.statusCode || 500;
  let message = "Lỗi không xác định từ hệ thống";

  if (response?.data?.message) {
    message = response.data.message;
  } else if (response?.data?.errors) {
    const errors = response.data.errors;
    const firstKey = Object.keys(errors)[0];
    const firstVal = errors[firstKey];
    message = Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
  } else if (response?.data?.title) {
    message = response.data.title;
  } else if (error?.message) {
    message = error.message;
  }

  console.error(
    `%c[API ERROR] ${context ? context + " -> " : ""}${status}: ${message}`,
    "color: red; font-weight: bold;"
  );

  return {
    success: false,
    statusCode: status,
    message,
    error: response?.data || error,
  };
};

export default client;
