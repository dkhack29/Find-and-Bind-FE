import * as api from "../../../../shared/helper/call-api.js";
import controller from "../../../../shared/helper/controller-name.js";

/**
 * Lấy thông tin cá nhân hiện tại của User
 */
export const getMe = async () => {
  try {
    return await api.getApi(`${controller.user}/me`, {
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.user);
  }
};

/**
 * Cập nhật thông tin cá nhân (fullName, avatar)
 * @param {Object|FormData} bodyData - { fullName, avatar }
 */
export const updateMe = async (bodyData) => {
  try {
    return await api.putApi(`${controller.user}/me`, {
      data: bodyData,
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.user);
  }
};

/**
 * Lấy thông tin chi tiết User theo ID
 * @param {string|number} userId
 */
export const getUserById = async (userId) => {
  try {
    return await api.getApi(`${controller.user}/${userId}`, {
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.user);
  }
};
