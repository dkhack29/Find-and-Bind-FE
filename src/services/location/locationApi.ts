import * as api from "@/helper/callApi";
import controllerName from "@/helper/controllerName";
import * as DTO from "@/services/location/locationType";

// Route backend: LocationController -> "api/Location"
// GET categories / GET list / GET by id: [AllowAnonymous]
// POST / PUT / DELETE: [Authorize] -> requiresAuth: true
export const locationService = {
  /** GET /api/Location/categories (public) */
  getAllCategories: () =>
    api.getApi<DTO.CategoryDto[]>(`${controllerName.Location}/categories`) as Promise<
      api.ApiResult<DTO.CategoryDto[]>
    >,

  /** GET /api/Location?... (public, phân trang) */
  getAll: (filter: DTO.LocationFilterDto = {}) =>
    api.getApi<DTO.LocationListDto>(controllerName.Location, {
      params: { pageIndex: 1, pageSize: 10, sortDescending: true, ...filter },
    }) as Promise<api.ApiPageResult<DTO.LocationListDto>>,

  /** GET /api/Location/{id} (public) */
  getById: (id: number) =>
    api.getApi<DTO.LocationDetailDto>(`${controllerName.Location}/${id}`) as Promise<
      api.ApiResult<DTO.LocationDetailDto>
    >,

  /** POST /api/Location (cần đăng nhập) */
  create: (data: DTO.CreateLocationDto) =>
    api.postApi<DTO.LocationDetailDto>(controllerName.Location, { data, requiresAuth: true }),

  /** PUT /api/Location/{id} (cần đăng nhập) */
  update: (id: number, data: DTO.UpdateLocationDto) =>
    api.putApi<DTO.LocationDetailDto>(`${controllerName.Location}/${id}`, {
      data,
      requiresAuth: true,
    }),

  /** DELETE /api/Location/{id} (cần đăng nhập) */
  remove: (id: number) =>
    api.deleteApi<boolean>(`${controllerName.Location}/${id}`, { requiresAuth: true }),
};