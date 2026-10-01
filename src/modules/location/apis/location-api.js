import * as api from "../../../../shared/helper/call-api.js";
import controller from "../../../../shared/helper/controller-name.js";

/**
 * Lấy danh sách địa điểm (có phân trang & lọc)
 * @param {Object} params - { Keyword, CategoryId, MinRating, SortBy, SortDescending, PageIndex, PageSize }
 */
export const getLocations = async (params = {}) => {
  try {
    return await api.getApi(controller.location, {
      params: { PageIndex: 1, PageSize: 10, ...params },
      requiresAuth: false,
    });
  } catch (error) {
    return api.throwErr(error, controller.location);
  }
};

/**
 * Tạo địa điểm mới
 * @param {Object|FormData} bodyData - { name, description, address, categoryId }
 */
export const createLocation = async (bodyData) => {
  try {
    return await api.postApi(controller.location, {
      data: bodyData,
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.location);
  }
};

/**
 * Lấy danh sách danh mục địa điểm
 */
export const getLocationCategories = async () => {
  try {
    return await api.getApi(`${controller.location}/categories`, {
      requiresAuth: false,
    });
  } catch (error) {
    return api.throwErr(error, controller.location);
  }
};

/**
 * Lấy thông tin chi tiết địa điểm theo ID
 * @param {string|number} id
 */
export const getLocationById = async (id) => {
  try {
    return await api.getApi(`${controller.location}/${id}`, {
      requiresAuth: false,
    });
  } catch (error) {
    return api.throwErr(error, controller.location);
  }
};

/**
 * Cập nhật thông tin địa điểm theo ID
 * @param {string|number} id
 * @param {Object|FormData} bodyData
 */
export const updateLocation = async (id, bodyData) => {
  try {
    return await api.putApi(`${controller.location}/${id}`, {
      data: bodyData,
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.location);
  }
};

/**
 * Xóa địa điểm theo ID
 * @param {string|number} id
 */
export const deleteLocation = async (id) => {
  try {
    return await api.deleteApi(`${controller.location}/${id}`, {
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.location);
  }
};
