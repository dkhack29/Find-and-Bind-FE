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

  /** DELETE /api/Itinerary/{id} */
  remove: (id: number) =>
    api.deleteApi<boolean>(`${controllerName.Itinerary}/${id}`, { requiresAuth: true }),
};