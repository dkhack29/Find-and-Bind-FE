/**
 * Khớp với Find_And_Bind_BE.src.Module.Itinerary.ItineraryDtos (backend)
 * DateTime (C#)  -> string ISO 8601 ở FE
 * TimeSpan? (C#) -> string dạng "HH:mm:ss" ở FE (hoặc null)
 */

// TODO: thay bằng đúng giá trị enum thật của backend (BaseEnum.TravelCompanionEnum)
// Ví dụ tham khảo, cần đối chiếu lại file enum thật trước khi dùng:
export enum TravelCompanionEnum {
  Solo = 0,
  Couple = 1,
  Family = 2,
  Friends = 3,
}

// TODO: thay bằng đúng giá trị enum thật của backend (BaseEnum.TravalStyleEnum)
export enum TravalStyleEnum {
  Relax = 0,
  Adventure = 1,
  Culture = 2,
  Luxury = 3,
}

/** Input cho AI lập kế hoạch chuyến đi — POST /api/Itinerary/ai-plan */
export interface TripPlanRequestDto {
  destination: string;
  travelWith: TravelCompanionEnum;
  style: TravalStyleEnum;
  budget: string;
  days: number; // 1..30
  additionalNotes?: string | null;
}

export interface ActivityDto {
  time: string;
  location: string;
  description: string;
  matchedLocationId?: number | null;
  isVerified: boolean;
}

export interface ItineraryDayDto {
  day: number;
  activities: ActivityDto[];
}

/** Kết quả AI trả về — data của ApiResponse<AiItineraryResultDto> */
export interface AiItineraryResultDto {
  itinerary: ItineraryDayDto[];
}

export interface CreateItineraryActivityDto {
  locationId: number;
  dayIndex: number; // 1..30
  plannedTime?: string | null; // "HH:mm:ss"
  notes?: string | null;
}

/** Body cho POST /api/Itinerary */
export interface CreateItineraryDto {
  title: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  coverImageUrl?: string | null;
  details: CreateItineraryActivityDto[];
}

/** Item trong danh sách — GET /api/Itinerary */
export interface ItineraryListDto {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  coverImageUrl?: string | null;
  totalDays: number;
  totalActivities: number;
  createdAt: string;
}

export interface ItineraryActivityDto {
  id: number;
  locationId: number;
  locationName: string;
  locationAddress: string;
  dayIndex: number;
  plannedTime?: string | null;
  notes?: string | null;
}

/** Chi tiết — GET /api/Itinerary/{id} */
export interface ItineraryDetailDto {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  coverImageUrl?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  details: ItineraryActivityDto[];
}

/** Query params cho GET /api/Itinerary */
export interface ItineraryFilterDto {
  pageIndex?: number; // default 1
  pageSize?: number; // default 10
}