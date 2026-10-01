import * as api from "../../../../shared/helper/call-api.js";
import controller from "../../../../shared/helper/controller-name.js";

/**
 * Lấy danh sách đánh giá của địa điểm theo locationId
 * @param {string|number} locationId
 * @param {Object} params - { PageIndex, PageSize }
 */
export const getReviewsByLocation = async (locationId, params = {}) => {
  try {
    return await api.getApi(`${controller.review}/location/${locationId}`, {
      params: { PageIndex: 1, PageSize: 10, ...params },
      requiresAuth: false,
    });
  } catch (error) {
    return api.throwErr(error, controller.review);
  }
};

/**
 * Lấy danh sách đánh giá cá nhân của người dùng hiện tại
 * @param {Object} params - { PageIndex, PageSize }
 */
export const getMyReviews = async (params = {}) => {
  try {
    return await api.getApi(`${controller.review}/my`, {
      params: { PageIndex: 1, PageSize: 10, ...params },
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.review);
  }
};

/**
 * Tạo đánh giá mới cho địa điểm
 * @param {Object} bodyData - { locationId, ratingValue, comment }
 */
export const createReview = async (bodyData) => {
  try {
    return await api.postApi(controller.review, {
      data: bodyData,
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.review);
  }
};

/**
 * Lấy chi tiết 1 bài đánh giá theo ID
 * @param {string|number} id
 */
export const getReviewById = async (id) => {
  try {
    return await api.getApi(`${controller.review}/${id}`, {
      requiresAuth: false,
    });
  } catch (error) {
    return api.throwErr(error, controller.review);
  }
};

/**
 * Cập nhật bài đánh giá theo ID
 * @param {string|number} id
 * @param {Object} bodyData - { ratingValue, comment }
 */
export const updateReview = async (id, bodyData) => {
  try {
    return await api.putApi(`${controller.review}/${id}`, {
      data: bodyData,
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.review);
  }
};

/**
 * Xóa bài đánh giá theo ID
 * @param {string|number} id
 */
export const deleteReview = async (id) => {
  try {
    return await api.deleteApi(`${controller.review}/${id}`, {
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.review);
  }
};
