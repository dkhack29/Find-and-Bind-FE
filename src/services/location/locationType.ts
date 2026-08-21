/**
 * Khớp với Find_And_Bind_BE.src.Module.Location.LocationDtos (backend)
 */

export interface CategoryDto {
  id: number;
  name: string;
}

/** Body cho POST /api/Location */
export interface CreateLocationDto {
  name: string;
  description?: string;
  address: string;
  categoryId: number;
}

/** Body cho PUT /api/Location/{id} */
export interface UpdateLocationDto {
  name: string;
  description?: string;
  address: string;
  categoryId: number;
}

/** Item trong danh sách — GET /api/Location */
export interface LocationListDto {
  id: number;
  name: string;
  address: string;
  averageRating: number;
  categoryId: number;
  categoryName: string;
}

/** Chi tiết — GET /api/Location/{id} */
export interface LocationDetailDto {
  id: number;
  name: string;
  description: string;
  address: string;
  averageRating: number;
  reviewCount: number;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  updatedAt?: string | null;
}

/** Query params cho GET /api/Location */
export interface LocationFilterDto {
  keyword?: string;
  categoryId?: number;
  minRating?: number;
  sortBy?: "name" | "rating" | string;
  sortDescending?: boolean; // default true
  pageIndex?: number; // default 1
  pageSize?: number; // default 10
}