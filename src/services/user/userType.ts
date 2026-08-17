/**
 * Khớp với Find_And_Bind_BE.src.Module.User.UserDto (backend)
 */

export interface UserProfileDto {
  id: number;
  fullName: string;
  avatar: string;
  email: string;
}

/** Body cho PUT /api/User/me */
export interface UpdateUserDto {
  fullName: string;
  avatar: string;
}