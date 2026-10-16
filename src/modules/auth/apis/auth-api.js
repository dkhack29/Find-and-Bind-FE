import * as api from "../../../../shared/helper/call-api.js";
import controller from "../../../../shared/helper/controller-name.js";

/**
 * Đăng ký tài khoản mới
 * @param {Object} bodyData - { email, password }
 */
export const register = async (bodyData) => {
  try {
    return await api.postApi(`${controller.authentication}/register`, {
      data: bodyData,
      requiresAuth: false,
    });
  } catch (error) {
    return api.throwErr(error, controller.authentication);
  }
};

/**
 * Đăng nhập hệ thống
 * @param {Object} bodyData - { email, password }
 */
export const login = async (bodyData) => {
  try {
    const response = await api.postApi(`${controller.authentication}/login`, {
      data: bodyData,
      requiresAuth: false,
    });

    if (response?.success && response?.data) {
      const { accessToken, refreshToken } = response.data;
      if (accessToken && refreshToken) {
        api.setTokens(accessToken, refreshToken);
      }
    }

    return response;
  } catch (error) {
    return api.throwErr(error, controller.authentication);
  }
};

/**
 * Làm mới Token (Refresh Token)
 * @param {Object} bodyData - { refreshToken }
 */
export const refreshToken = async (bodyData) => {
  try {
    return await api.postApi(`${controller.authentication}/refresh-token`, {
      data: bodyData,
      requiresAuth: false,
    });
  } catch (error) {
    return api.throwErr(error, controller.authentication);
  }
};

/**
 * Đăng xuất tài khoản
 */
export const logout = async () => {
  try {
    const response = await api.postApi(`${controller.authentication}/logout`, {
      requiresAuth: true,
    });
    api.clearTokens();
    return response;
  } catch (error) {
    api.clearTokens();
    return api.throwErr(error, controller.authentication);
  }
};

/**
 * Quên mật khẩu
 * @param {Object} bodyData - { email }
 */
export const forgotPassword = async (bodyData) => {
  try {
    return await api.postApi(`${controller.authentication}/forgot-password`, {
      data: bodyData,
      requiresAuth: false,
    });
  } catch (error) {
    return api.throwErr(error, controller.authentication);
  }
};
