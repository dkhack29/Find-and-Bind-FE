import * as api from "@/helper/callApi";
import * as contentType from "@/helper/base-header-content-type";
import controllerName from "@/helper/controllerName";
import * as DTO from "@/services/itinerary/itineraryType";

export const itineraryService = {
  /** POST /api/Itinerary/ai-plan */
  generateTripPlan: (data: DTO.TripPlanRequestDto) =>
    api.postApi<DTO.AiItineraryResultDto>(`${controllerName.Itinerary}/ai-plan`, {
      data,
      requiresAuth: true,
    }),

  /** POST /api/Itinerary */
  create: (data: DTO.CreateItineraryDto) =>
    api.postApi<DTO.ItineraryDetailDto>(controllerName.Itinerary, { data, requiresAuth: true }),

  /** GET /api/Itinerary?pageIndex=&pageSize= */
  getAll: (filter: DTO.ItineraryFilterDto = {}) =>
    api.getApi<DTO.ItineraryListDto>(controllerName.Itinerary, {
      params: { pageIndex: 1, pageSize: 10, ...filter },
      requiresAuth: true,
    }) as Promise<api.ApiPageResult<DTO.ItineraryListDto>>,

  /** GET /api/Itinerary/{id} */
  getById: (id: number) =>
    api.getApi<DTO.ItineraryDetailDto>(`${controllerName.Itinerary}/${id}`, {
      requiresAuth: true,
    }) as Promise<api.ApiResult<DTO.ItineraryDetailDto>>,

  /** PUT /api/Itinerary/{id} - Cập nhật toàn bộ lịch trình riêng tư */
  update: (id: number, data: DTO.CreateItineraryDto) =>
    api.putApi<DTO.ItineraryDetailDto>(`${controllerName.Itinerary}/${id}`, {
      data,
      requiresAuth: true,
    }) as Promise<api.ApiResult<DTO.ItineraryDetailDto>>,

  /** PATCH /api/Itinerary/{id}/publish - Bật/tắt trạng thái công khai */
  togglePublish: (id: number, isPublished: boolean) =>
    api.patchApi<boolean>(`${controllerName.Itinerary}/${id}/publish`, {
      data: { isPublished } as DTO.SetPublishedDto,
      requiresAuth: true,
    }) as Promise<api.ApiResult<boolean>>,

  /** POST /api/Itinerary/published/{id}/clone - Tạo bản sao riêng tư từ lịch trình công khai */
  clonePublished: (id: number) =>
    api.postApi<DTO.ItineraryDetailDto>(`${controllerName.Itinerary}/published/${id}/clone`, {
      requiresAuth: true,
    }) as Promise<api.ApiResult<DTO.ItineraryDetailDto>>,

  /** GET /api/Itinerary/published?pageIndex=&pageSize= - Lấy danh sách lịch trình công khai (Redis cached) */
  getPublishedList: (filter: DTO.ItineraryFilterDto = {}) =>
    api.getApi<DTO.ItineraryListDto>(`${controllerName.Itinerary}/published`, {
      params: { pageIndex: 1, pageSize: 10, ...filter },
      requiresAuth: false,
    }) as Promise<api.ApiPageResult<DTO.ItineraryListDto>>,

  /** GET /api/Itinerary/published/{id} - Lấy chi tiết lịch trình công khai (Redis cached) */
  getPublishedDetail: (id: number) =>
    api.getApi<DTO.ItineraryDetailDto>(`${controllerName.Itinerary}/published/${id}`, {
      requiresAuth: false,
    }) as Promise<api.ApiResult<DTO.ItineraryDetailDto>>,

  /** DELETE /api/Itinerary/{id} */
  remove: (id: number) =>
    api.deleteApi<boolean>(`${controllerName.Itinerary}/${id}`, { requiresAuth: true }),
};