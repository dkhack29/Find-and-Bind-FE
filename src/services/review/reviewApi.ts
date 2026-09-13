import * as api from "@/helper/callApi";
import controllerName from "@/helper/controllerName";
import * as DTO from "@/services/review/reviewType";

// Route backend: ReviewController -> "api/Review"
// GET theo location / GET by id: [AllowAnonymous]
// GET my / POST / PUT / DELETE: [Authorize] -> requiresAuth: true
export const reviewService = {
  /** GET /api/Review/location/{locationId}?pageIndex=&pageSize= (public) */
  getByLocation: (locationId: number, filter: DTO.ReviewFilterDto = {}) =>
    api.getApi<DTO.ReviewDto>(`${controllerName.Review}/location/${locationId}`, {
      params: { pageIndex: 1, pageSize: 10, ...filter },
    }) as Promise<api.ApiPageResult<DTO.ReviewDto>>,

  /** GET /api/Review/{id} (public) */
  getById: (id: number) =>
    api.getApi<DTO.ReviewDto>(`${controllerName.Review}/${id}`) as Promise<api.ApiResult<DTO.ReviewDto>>,

  /** GET /api/Review/my (cần đăng nhập) */
  getMyReviews: () =>
    api.getApi<DTO.ReviewDto[]>(`${controllerName.Review}/my`, {
      requiresAuth: true,
    }) as Promise<api.ApiResult<DTO.ReviewDto[]>>,

  /** POST /api/Review (cần đăng nhập) */
  create: (data: DTO.CreateReviewDto) =>
    api.postApi<DTO.ReviewDto>(controllerName.Review, { data, requiresAuth: true }),

  /** PUT /api/Review/{id} (cần đăng nhập) */
  update: (id: number, data: DTO.UpdateReviewDto) =>
    api.putApi<DTO.ReviewDto>(`${controllerName.Review}/${id}`, { data, requiresAuth: true }),

  /** DELETE /api/Review/{id} (cần đăng nhập) */
  remove: (id: number) =>
    api.deleteApi<boolean>(`${controllerName.Review}/${id}`, { requiresAuth: true }),
};