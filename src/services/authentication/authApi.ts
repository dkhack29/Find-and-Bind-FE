import * as api from "@/helper/callApi";
import * as contentType from "@/helper/base-header-content-type";
import controllerName from "@/helper/controllerName";
import * as DTO from "@/services/authentication/authType";

export const authService = {
  login: async (data: DTO.LoginDto) => {
    const res = await api.postApi<DTO.TokenResponseDto>(`${controllerName.Authentication}/login`, {
      data,
      headers: { "Content-Type": contentType.appJson },
    });
    api.setTokensAfterLogin(res.data.accessToken, res.data.refreshToken);
    return res;
  },

  register: async (data: DTO.RegisterRequestDto) => {
    const res = await api.postApi<DTO.TokenResponseDto>(`${controllerName.Authentication}/register`, {
      data,
      headers: { "Content-Type": contentType.appJson },
    });
    api.setTokensAfterLogin(res.data.accessToken, res.data.refreshToken);
    return res;
  },

  logout: async () => {
    const res = await api.postApi<boolean>(`${controllerName.Authentication}/logout`, { requiresAuth: true });
    api.clearAuthTokens();
    return res;
  },

  forgotPassword: (email: string) =>
    api.postApi<boolean>(`${controllerName.Authentication}/forgot-password`, { data: { email } }),
};