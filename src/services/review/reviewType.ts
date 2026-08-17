/**
 * Khớp với Find_And_Bind_BE.src.Module.Review.ReviewDtos (backend)
 */

export interface ReviewDto {
  id: number;
  userProfileId: number;
  userFullName: string;
  userAvatarUrl?: string | null;
  locationId: number;
  locationName: string;
  ratingValue: number; // 1..5
  comment?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/** Body cho POST /api/Review */
export interface CreateReviewDto {
  locationId: number;
  ratingValue: number; // 1..5
  comment?: string | null;
}

/** Body cho PUT /api/Review/{id} */
export interface UpdateReviewDto {
  ratingValue: number; // 1..5
  comment?: string | null;
}

/** Query params cho GET /api/Review/location/{locationId} */
export interface ReviewFilterDto {
  pageIndex?: number; // default 1
  pageSize?: number; // default 10
}