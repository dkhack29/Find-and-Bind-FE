import * as api from "../../../../shared/helper/call-api.js";
import controller from "../../../../shared/helper/controller-name.js";

/**
 * Lấy danh sách lịch trình cá nhân của người dùng
 * @param {Object} params - { PageIndex, PageSize }
 */
export const getItineraries = async (params = {}) => {
  try {
    return await api.getApi(controller.itinerary, {
      params: { PageIndex: 1, PageSize: 10, ...params },
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.itinerary);
  }
};

/**
 * Tạo lịch trình thủ công mới
 * @param {Object} bodyData - { title, startDate, endDate, coverImageUrl, details }
 */
export const createItinerary = async (bodyData) => {
  try {
    return await api.postApi(controller.itinerary, {
      data: bodyData,
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.itinerary);
  }
};

/**
 * Gợi ý lịch trình bằng AI (AI Plan generator)
 * @param {Object} bodyData - { destination, travelWith, style, budget, days, additionalNotes }
 */
export const generateAiPlan = async (bodyData) => {
  try {
    return await api.postApi(`${controller.itinerary}/ai-plan`, {
      data: bodyData,
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.itinerary);
  }
};

/**
 * Xem thông tin chi tiết của 1 lịch trình theo ID
 * @param {string|number} id
 */
export const getItineraryById = async (id) => {
  try {
    return await api.getApi(`${controller.itinerary}/${id}`, {
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.itinerary);
  }
};

/**
 * Xóa 1 lịch trình theo ID
 * @param {string|number} id
 */
export const deleteItinerary = async (id) => {
  try {
    return await api.deleteApi(`${controller.itinerary}/${id}`, {
      requiresAuth: true,
    });
  } catch (error) {
    return api.throwErr(error, controller.itinerary);
  }
};
