import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

/**
 * ============================================================
 *  AXIOS CONFIG AUGMENTATION
 *  Thêm các field tuỳ biến vào AxiosRequestConfig để dùng nội bộ
 * ============================================================
 */
declare module "axios" {
  export interface AxiosRequestConfig {
    /** Đánh dấu request cần Bearer token */
    requiresAuth?: boolean;
    /** Cho phép tự động điều hướng khi gặp 401 / 403 */
    isRedirect?: boolean;
    /** Cờ nội bộ, đánh dấu request đã được retry sau refresh token */
    _retry?: boolean;
  }
}

const BASE_URL = import.meta.env.VITE_BASE_URL as string;

/**
 * ============================================================
 *  KIỂU DỮ LIỆU KHỚP VỚI BACKEND (ApiResponse<T> / PageResult<T>)
 * ============================================================
 */

// Envelope thô server trả về (không phân trang)
interface RawApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// Envelope thô server trả về (có phân trang - MyStatusCode<TItem> overload)
interface RawPageEnvelope<T> {
  success: boolean;
  message: string;
  data: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

/** Kết quả đã chuẩn hoá cho request bình thường */
export interface ApiResult<T> {
  data: T;
  success: boolean;
  message: string;
  statusCode: number;
}

/** Kết quả đã chuẩn hoá cho request phân trang */
export interface ApiPageResult<T> {
  data: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  success: boolean;
  message: string;
  statusCode: number;
}

/** Lỗi đã chuẩn hoá trả về từ throwErr() */
export interface ApiError {
  success: false;
  message: string;
  status?: number;
  statusCode?: number;
  [key: string]: unknown;
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {},
  timeout: 30000,
  paramsSerializer: (params) => convertParams(params),
});

/**
 * ============================================================
 *  ĐIỀU HƯỚNG (thay cho vue-router)
 *  Gọi setNavigator(navigate) một lần ở App.tsx bằng hook useNavigate()
 *  của react-router-dom để callApi có thể điều hướng đúng chuẩn SPA.
 *  Nếu chưa set, sẽ fallback về window.location.href.
 * ============================================================
 */
type NavigateFn = (path: string, options?: { replace?: boolean; state?: unknown }) => void;
let navigateFn: NavigateFn | null = null;

export function setNavigator(fn: NavigateFn) {
  navigateFn = fn;
}

function goTo(path: string, options?: { replace?: boolean; state?: unknown }) {
  if (navigateFn) {
    navigateFn(path, options);
  } else {
    window.location.href = path;
  }
}

/** Chặn open-redirect: chỉ cho phép redirect nội bộ dạng "/abc", không cho "//abc" hay có scheme */
function getSafeRedirectPath(path: string): string | null {
  if (!path) return null;
  if (!path.startsWith("/") || path.startsWith("//")) return null;
  if (/^\/\s*\\/.test(path)) return null;
  return path;
}

/**
 * ============================================================
 *  TOKEN UTIL
 * ============================================================
 */
function getAccessToken(): string | undefined {
  return Cookies.get("accessToken");
}
function setTokens(accessToken?: string, refreshToken?: string) {
  if (accessToken) Cookies.set("accessToken", accessToken, { expires: 1 / 144 }); // ~10 phút
  if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
}
function clearTokens() {
  Cookies.remove("accessToken");
  localStorage.removeItem("refreshToken");
}

/**
 * Gọi hàm này ở service layer ngay sau khi login/register/refresh thành công
 * (BE không tự set cookie, phải set thủ công ở FE sau khi nhận response).
 */
export function setTokensAfterLogin(accessToken: string, refreshToken: string) {
  setTokens(accessToken, refreshToken);
}

/** Gọi khi logout thủ công (ngoài luồng lỗi refresh tự động) */
export function clearAuthTokens() {
  clearTokens();
}

/** Kiểm tra nhanh user đã đăng nhập chưa (có accessToken hợp lệ trong cookie) */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * ============================================================
 *  REFRESH TOKEN
 *  Endpoint đúng theo backend: POST api/Autethication/refresh-token
 *  (chú ý: route controller là "Autethication", không phải "Authentication")
 * ============================================================
 */
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) {
    console.warn("No refresh token found");
    return null;
  }

  try {
    // Dùng axios gốc (không phải instance "api") để tránh lặp interceptor 401 vô tận
    const res = await axios.post<RawApiEnvelope<{ accessToken: string; refreshToken: string }>>(
      `${BASE_URL.endsWith("/") ? BASE_URL : BASE_URL + "/"}Autethication/refresh-token`,
      { refreshToken },
    );

    if (res.status === 200 || res.status === 201) {
      const payload = res.data?.data;
      if (!payload?.accessToken) return null;
      setTokens(payload.accessToken, payload.refreshToken);
      return payload.accessToken;
    }
    return null;
  } catch (err) {
    console.error("Refresh token failed:", err);
    return null;
  }
}

/**
 * ============================================================
 *  REQUEST INTERCEPTOR
 * ============================================================
 */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.signal) {
    const controller = new AbortController();
    config.signal = controller.signal;
  }

  const isFormData = Object.prototype.toString.call(config.data) === "[object FormData]";

  if (!config.headers["Content-Type"]) {
    if (isFormData) {
      delete config.headers["Content-Type"]; // để axios tự set boundary
    } else {
      config.headers["Content-Type"] = "application/json";
    }
  }

  if (config.requiresAuth) {
    const token = getAccessToken();
    if (!token) {
      console.warn("Missing access token");
      return config;
    }
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * ============================================================
 *  RESPONSE INTERCEPTOR
 *  - Chuẩn hoá ApiResponse<T> / paginated response từ BaseResponse.cs
 *  - Auto refresh token khi 401
 *  - Điều hướng khi 401 (hết hạn) / 403 (không đủ quyền)
 * ============================================================
 */
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token as string)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res: AxiosResponse): any => {
    const d = res?.data;

    // Response chuẩn từ MyStatusCode: { success, message, data, ...(totalCount nếu phân trang) }
    if (d && typeof d === "object" && ("success" in d || "message" in d)) {
      if ("totalCount" in d) {
        const paged = d as RawPageEnvelope<unknown>;
        const result: ApiPageResult<unknown> = {
          data: paged.data ?? [],
          totalCount: paged.totalCount ?? 0,
          pageIndex: paged.pageIndex ?? 0,
          pageSize: paged.pageSize ?? 0,
          totalPages: paged.totalPages ?? 0,
          success: paged.success,
          message: paged.message,
          statusCode: res.status,
        };
        return result;
      }

      const normal = d as RawApiEnvelope<unknown>;
      const result: ApiResult<unknown> = {
        data: normal.data,
        success: normal.success,
        message: normal.message,
        statusCode: res.status,
      };
      return result;
    }

    // Response không theo chuẩn ApiResponse (vd: file, blob,...) -> trả nguyên res
    return { ...res, statusCode: res.status };
  },
  async (err: AxiosError) => {
    if (axios.isCancel(err)) {
      console.log("Request đã bị hủy (Aborted):", err.message);
      return new Promise(() => {});
    }

    const originalRequest = err.config as AxiosRequestConfig & { _retry?: boolean };

    if (
      err.response?.status === 401 &&
      originalRequest?.requiresAuth &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers = {
            ...(originalRequest.headers ?? {}),
            Authorization: `Bearer ${token}`,
          };
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        if (!newToken) throw new Error("Refresh token failed");

        processQueue(null, newToken);
        isRefreshing = false;

        originalRequest.headers = {
          ...(originalRequest.headers ?? {}),
          Authorization: `Bearer ${newToken}`,
        };
        return api(originalRequest);
      } catch (e) {
        processQueue(e, null);
        isRefreshing = false;

        clearTokens();

        if (!window.location.pathname.startsWith("/auth")) {
          const candidate = window.location.pathname + (window.location.search || "");
          const safe = getSafeRedirectPath(candidate);
          goTo(safe ? `/auth/login?redirect=${encodeURIComponent(safe)}` : "/auth/login");
        }

        return Promise.reject(e);
      }
    }

    if (err.response?.status === 403 && originalRequest?.isRedirect === true) {
      goTo("/403");
    }

    return Promise.reject(err);
  },
);

/**
 * ============================================================
 *  QUERY PARAM SERIALIZER + OBJECT QUERY MẶC ĐỊNH (giữ nguyên từ bản mẫu)
 * ============================================================
 */
export interface QueryParams {
  query?: string;
  page?: number;
  pageSize?: number;
  FieldName?: string;
  Isdesc?: boolean;
  FilterName?: string;
  FilterValue?: string;
  [key: string]: unknown;
}

export const objQuery: QueryParams = {
  query: "",
  page: 1,
  pageSize: 10,
  FieldName: "",
  Isdesc: false,
  FilterName: "",
  FilterValue: "",
};

export const convertParams = (params: Record<string, unknown> = {}) => {
  const searchParams = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (Array.isArray(value)) {
      value.forEach((val) => searchParams.append(key, String(val)));
    } else if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  }
  return searchParams.toString();
};

/**
 * ============================================================
 *  API WRAPPERS (typed)
 *  requiresAuth: có gắn Bearer token hay không
 *  isRedirect:   có tự động redirect /403 khi bị 403 hay không
 * ============================================================
 */
export interface CallApiOptions extends AxiosRequestConfig {
  data?: unknown;
  params?: Record<string, unknown>;
}

// Overload cho dữ liệu phân trang: dùng khi bạn biết chắc endpoint trả PageResult
export const getApi = <T = unknown>(
  url: string,
  opts: CallApiOptions = {},
): Promise<ApiResult<T> | ApiPageResult<T>> =>
  api.get(url, {
    params: opts.params ?? objQuery,
    isRedirect: true,
    ...opts,
  }) as unknown as Promise<ApiResult<T> | ApiPageResult<T>>;

export const postApi = <T = unknown>(
  url: string,
  opts: CallApiOptions = {},
): Promise<ApiResult<T>> =>
  api.post(url, opts.data ?? {}, { isRedirect: true, ...opts }) as unknown as Promise<
    ApiResult<T>
  >;

export const putApi = <T = unknown>(
  url: string,
  opts: CallApiOptions = {},
): Promise<ApiResult<T>> =>
  api.put(url, opts.data ?? {}, { isRedirect: true, ...opts }) as unknown as Promise<
    ApiResult<T>
  >;

export const patchApi = <T = unknown>(
  url: string,
  opts: CallApiOptions = {},
): Promise<ApiResult<T>> =>
  api.patch(url, opts.data ?? {}, { isRedirect: true, ...opts }) as unknown as Promise<
    ApiResult<T>
  >;

export const deleteApi = <T = unknown>(
  url: string,
  opts: CallApiOptions = {},
): Promise<ApiResult<T>> =>
  api.delete(url, { isRedirect: true, ...opts }) as unknown as Promise<ApiResult<T>>;

/**
 * ============================================================
 *  XỬ LÝ LỖI CHUẨN HOÁ
 * ============================================================
 */
export function throwErr(error: AxiosError<any>, context = ""): ApiError {
  const res = error.response;
  const status = res?.status;

  let msg: string | null = null;

  if (res?.data?.message) {
    msg = res.data.message;
  } else if (res?.data?.errors) {
    msg = extractValidationMessage(res.data.errors);
  } else if (res?.data?.title) {
    msg = res.data.title;
  } else {
    msg = error.message || "Lỗi không xác định từ máy chủ";
  }

  console.error(
    `%c[API ERROR] ${context ? context + " → " : ""}${status || "??"}: ${msg}`,
    "color: red; font-weight: bold;",
  );

  return {
    ...(res?.data || {}),
    success: false,
    status,
    statusCode: status,
    message: msg ?? "Lỗi không xác định",
  };
}

function extractValidationMessage(errors: Record<string, unknown>): string | null {
  if (!errors || typeof errors !== "object") return null;
  const firstKey = Object.keys(errors)[0];
  const firstVal = errors[firstKey];
  return Array.isArray(firstVal) ? String(firstVal[0]) : String(firstVal);
}

export default api;