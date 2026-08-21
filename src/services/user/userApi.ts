import * as api from "@/helper/callApi";
import controllerName from "@/helper/controllerName";
import * as DTO from "@/services/user/userType";

// Route backend: UserController -> "api/User"
// GET me / PUT me: [Authorize] -> requiresAuth: true
// GET {userId}: public
export const userService = {
  /** GET /api/User/me (cần đăng nhập) */
  getMyProfile: () =>
    api.getApi<DTO.UserProfileDto>(`${controllerName.UserProfile}/me`, {
      requiresAuth: true,
    }) as Promise<api.ApiResult<DTO.UserProfileDto>>,

  /** PUT /api/User/me (cần đăng nhập) */
  updateMyProfile: (data: DTO.UpdateUserDto) =>
    api.putApi<DTO.UserProfileDto>(`${controllerName.UserProfile}/me`, {
      data,
      requiresAuth: true,
    }),

  /** GET /api/User/{userId} (public) */
  getPublicProfile: (userId: number) =>
    api.getApi<DTO.UserProfileDto>(`${controllerName.UserProfile}/${userId}`) as Promise<
      api.ApiResult<DTO.UserProfileDto>
    >,
};