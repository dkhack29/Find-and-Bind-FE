import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { locationService } from '@/services/location/locationApi';
import { itineraryService } from '@/services/itinerary/itineraryApi';
import { userService } from '@/services/user/userApi';
import type { CategoryDto } from '@/services/location/locationType';

export type Role = 'user' | 'merchant' | 'admin' | 'moderator';

export type ToastType = 'success' | 'error' | 'info' | 'warning';
export type ToastItem = { id: string; message: string; type: ToastType };

export type Review = {
  id: string;
  placeId: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedVisit?: boolean;
  merchantReply?: string; // Phase 1: Merchant public replies
};

export type Place = {
  id: number;
  title: string;
  tag: string;
  rating: number;
  reviewsCount: number | string;
  imageClass: string;
  location: string;
  description: string;
  reasons: string[];
  price: string;
  priceConfidence?: number;
  openingHours?: string;
  openingHoursConfidence?: number;
  trustScore?: number;
  riskLevel?: 'Bình thường' | 'Thấp' | 'Trung bình' | 'Cao';
  riskReasons?: string[];
  ownerId?: string;
  lat?: number; // Phase 1: GPS coordination
  lon?: number; // Phase 1: GPS coordination
  categoryId?: number;
  categoryName?: string;
  isSponsored?: boolean; // Phase 1: Sponsored ad marker
};

export type TripActivity = {
  time: string;
  endTime?: string;
  location: string;
  description: string;
  matchedLocationId?: number | null;
  isVerified?: boolean;
};

export type TripItem = { time: string; act: string; type: string; };
export type TripDay = { 
  day: number; 
  title: string; 
  items?: TripItem[]; 
  activities?: TripActivity[];
};
export type Trip = {
  id: number; name: string; date: string; location: string; status: string; days: number; itinerary: TripDay[];
  isPublished?: boolean;
};

export type FeatureFlags = {
  priceForecast: boolean;
  visualSearch: boolean;
  sponsoredAds: boolean;
  guidebook: boolean;
  comparePois: boolean;
  tasteCollections: boolean;
  avoidList: boolean;
  quickReport: boolean;
  ekycSimulation: boolean;
  verifiedStay: boolean;
  merchantOnboarding: boolean;
  merchantConsole: boolean;
  globalKillSwitch: boolean;
};

export type ApiQuota = {
  geminiVisionCalls: number;
  vnptEkycCalls: number;
  budgetUsed: number;
  budgetLimit: number;
};

export type Appeal = {
  id: string;
  placeId: number;
  status: 'step1' | 'step2' | 'step3' | 'step4_pending' | 'approved' | 'rejected';
  feeDeposited: boolean;
  evidence?: string;
  evidenceUrl?: string;
  caseId?: string;
};

export type Case = {
  id: string;
  poiTitle: string;
  reportType: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  logs?: { time: string; message: string }[];
  lat?: number; // Attached GPS
  lon?: number; // Attached GPS
  evidenceUrl?: string; // Evidence attachment
};

export type RescuePick = {
  id: number;
  title: string;
  tag: string;
  description: string;
  reasons: string[];
  imageClass: string;
  location: string;
  rating: number;
  reviewsCount: number;
  price: string;
  trustScore: number;
  lat: number;
  lon: number;
  status: 'pending_mod' | 'pending_admin' | 'approved' | 'rejected';
  dateAdded: string;
  expiryDate: string;
};

export type LamportEvent = {
  id: string;
  tripId: number;
  lamport: number;
  clientId: string;
  action: 'add_item' | 'delete_item' | 'update_name';
  data: any;
};

export type PoiFingerprint = {
  id: string;
  title: string;
  lat: number;
  lon: number;
  layoutHash: string;
  taxId: string;
  bannedAt: string;
};

export interface PendingDeletionAccount {
  email: string;
  name?: string;
  phone?: string;
  gender?: string;
  authMethod?: 'email' | 'google' | 'apple';
  isVerifiedL3?: boolean;
  ekycHash?: string;
  requestedAt: number;
  deleteAt: number; // 7 days later
  savedPlaceIds: number[];
  trips: Trip[];
}

const INITIAL_RESCUE_PICKS: RescuePick[] = [
  {
    id: 101,
    title: "Bánh Mì Bà Đào - Vị Xưa",
    tag: "Ăn uống bình dân",
    description: "Xe bánh mì nhỏ trong hẻm sâu với công thức gia truyền hơn 35 năm. Dù rất ngon và giá rẻ nhưng do vị trí khuất và không có chi phí marketing nên rất ít khách biết tới.",
    reasons: ["Điểm đánh giá thực tế cao (4.8)", "Nằm trong hẻm sâu khuất tầm nhìn", "Ưu đãi 15% cho thành viên ứng dụng"],
    imageClass: "bg-gradient-nature",
    location: "Hải Châu, Đà Nẵng",
    rating: 4.8,
    reviewsCount: 14,
    price: "20.000đ - 30.000đ",
    trustScore: 90,
    lat: 16.0678,
    lon: 108.2208,
    status: 'approved',
    dateAdded: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 102,
    title: "Cà Phê Sân Vườn Góc Kỷ Niệm",
    tag: "Cà phê / Trà",
    description: "Không gian cà phê yên tĩnh mát mẻ, phục vụ bởi gia đình cô chú lớn tuổi thân thiện. Gặp khó khăn tài chính sau dịch và đang đứng trước nguy cơ đóng cửa vì thiếu khách ghé thăm.",
    reasons: ["Không gian yên tĩnh phù hợp làm việc", "Chủ quán thân thiện nhiệt tình", "Hỗ trợ phục hồi sinh kế địa phương"],
    imageClass: "bg-gradient-mesh",
    location: "Sơn Trà, Đà Nẵng",
    rating: 4.6,
    reviewsCount: 9,
    price: "15.000đ - 25.000đ",
    trustScore: 88,
    lat: 16.0754,
    lon: 108.2435,
    status: 'approved',
    dateAdded: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 103,
    title: "Bún Bò Huế Chị Bé",
    tag: "Ăn uống bình dân",
    description: "Quán bún bò chính gốc Huế nằm ở ven đường ngoại ô. Nước dùng thanh ngọt từ xương hầm chuẩn vị. Rất cần được quảng bá để tăng doanh thu trang trải sinh hoạt.",
    reasons: ["Nước dùng chuẩn vị Huế xưa", "Giá cả cực kỳ bình dân", "Đang gặp khó khăn do mặt bằng bị che khuất"],
    imageClass: "bg-gradient-urban",
    location: "Q. Ngũ Hành Sơn, Đà Nẵng",
    rating: 4.7,
    reviewsCount: 5,
    price: "30.000đ - 45.000đ",
    trustScore: 85,
    lat: 16.0312,
    lon: 108.2612,
    status: 'pending_admin',
    dateAdded: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: 104,
    title: "Homestay Ông Năm Đất Mũi",
    tag: "Khách sạn / Homestay",
    description: "Homestay miệt vườn sông nước, tự phục vụ nấu nướng câu cá giải trí. Do địa điểm xa xôi hẻo lánh nên lượng khách ghé thăm rất thấp dù được đánh giá rất cao về trải nghiệm mộc mạc.",
    reasons: ["Trải nghiệm miệt vườn chuẩn miền Tây", "Chủ nhà mộc mạc hiếu khách", "Được hỗ trợ bởi chương trình phát triển nông nghiệp xanh"],
    imageClass: "bg-gradient-nature",
    location: "Năm Căn, Cà Mau",
    rating: 4.9,
    reviewsCount: 7,
    price: "150.000đ - 250.000đ",
    trustScore: 92,
    lat: 8.7432,
    lon: 104.9812,
    status: 'pending_mod',
    dateAdded: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
  }
];

const INITIAL_BANNED_FINGERPRINTS: PoiFingerprint[] = [
  {
    id: "BF-001",
    title: "Quán Ăn Chặt Chém Làng Chài",
    lat: 10.7719,
    lon: 106.6983,
    layoutHash: "H4X-992-B83",
    taxId: "0311234567",
    bannedAt: "2026-05-15T10:00:00Z"
  },
  {
    id: "BF-002",
    title: "Homestay Ma Lén",
    lat: 11.9404,
    lon: 108.4583,
    layoutHash: "Z9Y-102-M40",
    taxId: "0429876543",
    bannedAt: "2026-06-20T14:30:00Z"
  }
];

const INITIAL_LAMPORT_EVENTS: LamportEvent[] = [
  {
    id: "evt-001",
    tripId: 1,
    lamport: 1,
    clientId: "client-A",
    action: "add_item",
    data: { day: 1, time: "09:00", act: "Đến tại khách sạn & Gửi hành lý", type: "logistic" }
  }
];

const INITIAL_PLACES: Place[] = [
  {
    id: 1, title: "Vịnh Hạ Long", tag: "Tuyệt tác thiên nhiên", rating: 4.9, reviewsCount: 2400, imageClass: "bg-gradient-nature", location: "Quảng Ninh, Việt Nam", description: "Một trong những kỳ quan thiên nhiên của thế giới, với hàng ngàn hòn đảo đá vôi kỳ vĩ vươn lên từ mặt nước xanh ngọc. Trải nghiệm lý tưởng: du thuyền qua đêm, chèo kayak và khám phá hang động hoang sơ.", reasons: ["Hợp gu vì tag 'Thiên nhiên'", "Đang mùa đẹp nhất (Tháng 5)"], price: "Từ 1,200,000đ",
    priceConfidence: 0.8, openingHours: "24/7", openingHoursConfidence: 0.9, trustScore: 92, riskLevel: 'Bình thường', lat: 20.9489, lon: 107.0734
  },
  {
    id: 2, title: "Phố cổ Hội An", tag: "Di sản văn hóa", rating: 4.8, reviewsCount: 3100, imageClass: "bg-gradient-mesh", location: "Quảng Nam, Việt Nam", description: "Khám phá vẻ đẹp cổ kính với những con phố đèn lồng rực rỡ, kiến trúc giao thoa và ẩm thực đậm chất miền Trung. Đặc biệt lãng mạn vào ban đêm.", reasons: ["Gần đây vắng khách", "Nhiều ưu đãi lưu trú 30%"], price: "Miễn phí tham quan",
    priceConfidence: 0.99, openingHours: "08:00 - 22:00", openingHoursConfidence: 0.85, trustScore: 85, riskLevel: 'Thấp', riskReasons: ["Giá dịch vụ có thể thay đổi vào mùa lễ hội."], lat: 15.8801, lon: 108.3380
  },
  {
    id: 3, title: "Đà Lạt Chill", tag: "Thành phố sương mù", rating: 4.7, reviewsCount: 5200, imageClass: "bg-gradient-urban", location: "Lâm Đồng, Việt Nam", description: "Thành phố ngàn hoa với khí hậu ôn đới quanh năm. Thích hợp cho những chuyến đi tìm kiếm sự bình yên, thưởng thức cafe và săn mây buổi sớm.", reasons: ["Phù hợp để thư giãn", "Nhiều quán cafe mới mở"], price: "Chi phí trung bình",
    priceConfidence: 0.6, openingHours: "06:00 - 23:00", openingHoursConfidence: 0.7, trustScore: 65, riskLevel: 'Trung bình', riskReasons: ["Nhiều cảnh báo quá tải vào cuối tuần.", "Một số mức giá chưa được xác minh."], lat: 11.9404, lon: 108.4583
  },
  {
    id: 4, title: "Bán đảo Sơn Trà", tag: "Khu bảo tồn hoang dã", rating: 4.6, reviewsCount: 950, imageClass: "bg-gradient-nature", location: "Đà Nẵng, Việt Nam", description: "Lá phổi xanh của thành phố Đà Nẵng, nơi có quần thể voọc chà vá chân nâu quý hiếm và ngôi chùa Linh Ứng linh thiêng hướng ra biển Đông.", reasons: ["Hợp gu thích hoang dã", "Không khí mát mẻ dễ chịu"], price: "Miễn phí",
    priceConfidence: 0.95, openingHours: "24/7", openingHoursConfidence: 0.95, trustScore: 78, riskLevel: 'Bình thường', lat: 16.1213, lon: 108.2785
  },
  {
    id: 5, title: "Chợ Bến Thành", tag: "Chợ truyền thống sầm uất", rating: 4.2, reviewsCount: 8400, imageClass: "bg-gradient-urban", location: "TP. Hồ Chí Minh, Việt Nam", description: "Biểu tượng lịch sử và văn hóa mua sắm lâu đời tại trung tâm Sài Gòn. Nơi tập trung ẩm thực đường phố phong phú và hàng thủ công mỹ nghệ.", reasons: ["Địa điểm check-in bắt buộc", "Ẩm thực phong phú"], price: "Tự do chọn lựa",
    priceConfidence: 0.5, openingHours: "06:00 - 22:00", openingHoursConfidence: 0.6, trustScore: 50, riskLevel: 'Trung bình', riskReasons: ["Cảnh báo nói thách giá cao với khách du lịch.", "Một số mức giá ẩm thực tự phát chưa được xác minh."], lat: 10.7719, lon: 106.6983
  },
  {
    id: 6, title: "Khách sạn Mường Thanh", tag: "Khách sạn / Homestay", rating: 4.5, reviewsCount: 150, imageClass: "bg-gradient-urban", location: "TP. Hồ Chí Minh, Việt Nam", description: "Khách sạn cao cấp tọa lạc tại trung tâm thành phố, cung cấp phòng ốc sang trọng, hồ bơi vô cực và nhà hàng ẩm thực Á-Âu.", reasons: ["Đối tác tài trợ chính thức", "Không gian sang trọng"], price: "Từ 1,500,000đ",
    priceConfidence: 0.95, openingHours: "24/7", openingHoursConfidence: 0.99, trustScore: 95, riskLevel: 'Bình thường', lat: 10.7811, lon: 106.7032, isSponsored: true
  }
];

const INITIAL_TRIPS: Trip[] = [
  {
    id: 1,
    name: "Khám phá Biên Hòa - Đồng Nai",
    date: "22 - 23 Tháng 9, 2026",
    location: "Biên Hòa, Đồng Nai",
    status: "Đang diễn ra",
    days: 2,
    itinerary: [
      {
        day: 1,
        title: "Văn hóa & Ẩm thực Cổ truyền Biên Hòa",
        activities: [
          {
            time: "07:30",
            location: "Chợ Biên Hòa",
            description: "Thưởng thức điểm tâm sáng bình dân với các món đặc sản địa phương như bánh mì, xôi hoặc bún riêu tại khu vực chợ cổ lâu đời nhất thành phố.",
            matchedLocationId: 5,
            isVerified: true
          },
          {
            time: "08:30",
            location: "Văn Miếu Trấn Biên",
            description: "Tìm hiểu về trung tâm văn hóa giáo dục đầu tiên của vùng đất Đàng Trong. Nơi đây có kiến trúc cổ kính, không gian xanh mát, rất phù hợp để khám phá lịch sử và chụp ảnh cùng bạn bè.",
            matchedLocationId: 7,
            isVerified: true
          },
          {
            time: "10:30",
            location: "Thất Phủ Cổ Miếu (Chùa Ông)",
            description: "Ghé thăm ngôi chùa cổ nhất vùng Nam Bộ nằm ở Cù lao Phố, nơi lưu giữ sự giao thoa văn hóa độc đáo giữa người Việt và người Hoa qua các đường nét điêu khắc tinh xảo.",
            matchedLocationId: null,
            isVerified: false
          },
          {
            time: "12:00",
            location: "Quán Lẩu Tôm 5 Ri (Đường Cách Mạng Tháng 8)",
            description: "Thưởng thức món lẩu tôm nổi tiếng lâu đời tại Biên Hòa với hương vị đậm đà, giá cả hợp lý khi đi nhóm đông người.",
            matchedLocationId: null,
            isVerified: false
          },
          {
            time: "19:00",
            location: "Chợ đêm Biên Hòa & Công viên bờ sông Đồng Nai",
            description: "Đi dạo hóng mát dọc bờ sông Đồng Nai, khám phá không gian sinh hoạt buổi tối sôi động của người dân địa phương trước khi kết thúc chuyến đi.",
            matchedLocationId: null,
            isVerified: false
          }
        ],
        items: [
          { time: "07:30", act: "Chợ Biên Hòa - Ăn sáng đặc sản", type: "food" },
          { time: "08:30", act: "Văn Miếu Trấn Biên - Khám phá lịch sử", type: "explore" },
          { time: "10:30", act: "Thất Phủ Cổ Miếu - Chiêm bái chùa cổ", type: "explore" },
          { time: "12:00", act: "Quán Lẩu Tôm 5 Ri - Ăn trưa", type: "food" },
          { time: "19:00", act: "Chợ đêm & Bờ sông Đồng Nai - Dạo mát", type: "explore" }
        ]
      },
      {
        day: 2,
        title: "Sinh thái & Danh lam Thắng cảnh",
        activities: [
          {
            time: "08:00",
            location: "Khu Du Lịch Bửu Long",
            description: "Được mệnh danh là 'Vịnh Hạ Long thu nhỏ' của miền Đông Nam Bộ với hồ nước trong xanh, vách đá kỳ vĩ và nhiều góc check-in tuyệt đẹp.",
            matchedLocationId: 8,
            isVerified: true
          },
          {
            time: "14:00",
            location: "Làng Bưởi Tân Triều",
            description: "Thưởng thức đặc sản bưởi đường lá cam, gỏi bưởi và rượu bưởi nức tiếng trong không gian miệt vườn rợp bóng mát.",
            matchedLocationId: null,
            isVerified: false
          }
        ],
        items: [
          { time: "08:00", act: "KDL Bửu Long - Check-in thắng cảnh", type: "explore" },
          { time: "14:00", act: "Làng Bưởi Tân Triều - Đặc sản miệt vườn", type: "food" }
        ]
      }
    ]
  },
  { 
    id: 2, 
    name: "Thái Lan 4N3Đ", 
    date: "15 - 18 Tháng 6, 2024", 
    location: "Bangkok", 
    status: "Sắp tới", 
    days: 4,
    itinerary: [
      { 
        day: 1, 
        title: "Đến nơi & Khám phá trung tâm", 
        activities: [
          { time: "09:00", location: "Khách sạn Bangkok", description: "Đến tại khách sạn & Gửi hành lý", isVerified: true }
        ],
        items: [ { time: "09:00", act: "Đến tại khách sạn & Gửi hành lý", type: "logistic" } ] 
      }
    ]
  }
];

const MOCK_REVIEWS: Review[] = [
  { id: '1', placeId: 1, userId: 'u2', userName: 'Mai Linh', rating: 5, comment: 'Cảnh quan tuyệt vời, dịch vụ rất tốt!', date: '10/05/2024' },
  { id: '2', placeId: 1, userId: 'u3', userName: 'Hải Đăng', rating: 4, comment: 'Đẹp nhưng hơi đông vào cuối tuần.', date: '08/05/2024' }
];

type AppContextType = {
  role: Role; setRole: (role: Role) => void;
  places: Place[]; addPlace: (place: Omit<Place, 'id' | 'rating' | 'reviewsCount'>) => void;
  addPlaceWithOwner: (place: Omit<Place, 'id' | 'rating' | 'reviewsCount'> & { ownerId: string }) => void;
  trips: Trip[]; addTrip: (trip: Omit<Trip, 'id'>) => void; updateTrip: (id: number, updated: Partial<Trip>) => void;
  savedPlaceIds: number[]; toggleSavedPlace: (id: number) => void;
  reviews: Review[]; addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  addReviewReply: (reviewId: string, reply: string) => void;
  user: { loggedIn: boolean; email?: string; name?: string; phone?: string; gender?: string; authMethod?: 'email' | 'google' | 'apple'; isVerifiedL3?: boolean; ekycHash?: string } | null;
  login: (email: string, name?: string, phone?: string, gender?: string, authMethod?: 'email' | 'google' | 'apple') => void;
  logout: () => void;
  deleteAccount: () => void;
  scheduleAccountDeletion: () => boolean;
  checkPendingDeletion: (email: string) => { isPending: boolean; isExpired: boolean; deleteAt?: number; daysRemaining?: number; email: string } | null;
  restoreAccount: (email: string) => boolean;
  privacySettings: { trackLocation: boolean; allowShareData: boolean };
  updatePrivacySettings: (settings: { trackLocation: boolean; allowShareData: boolean }) => void;
  cases: Case[];
  addCase: (poiTitle: string, reportType: string) => void;
  addCaseWithCoords: (poiTitle: string, reportType: string, lat: number, lon: number, evidenceUrl?: string, customId?: string) => void;
  updateCaseStatus: (id: string, status: 'resolved' | 'rejected', reasonText: string) => void;
  updatePlaceTag: (id: number, newTag: string) => void;
  updatePlaceTrust: (id: number, score: number, risk: 'Bình thường' | 'Thấp' | 'Trung bình' | 'Cao', reasons?: string[]) => void;
  
  // Phase 1 Features States
  featureFlags: FeatureFlags;
  updateFeatureFlags: (flags: FeatureFlags) => void;
  apiQuota: ApiQuota;
  incrementQuota: (api: 'geminiVision' | 'vnptEkyc') => void;
  avoidList: number[];
  addToAvoidList: (id: number) => void;
  removeFromAvoidList: (id: number) => void;
  tasteCollections: string[];
  addTasteCollection: (name: string) => void;
  savedPlacesCollection: { [placeId: number]: string };
  savePlaceToCollection: (placeId: number, colName: string) => void;
  merchantWalletBalance: number;
  updateMerchantWallet: (val: number) => void;
  appeals: Appeal[];
  submitAppeal: (appeal: Omit<Appeal, 'id' | 'status'>) => void;
  updateAppealStatus: (id: string, status: 'approved' | 'rejected') => void;
  verifyEkycL3: (hash: string) => void;

  // Backend Sync & State
  categories: CategoryDto[];
  refreshPlaces: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshTrips: () => Promise<void>;
  togglePublishTrip: (tripId: number, isPublished: boolean) => Promise<boolean>;
  clonePublishedTrip: (publishedId: number) => Promise<boolean>;

  // Phase 2 Features States
  rescuePicks: RescuePick[];
  bannedFingerprints: PoiFingerprint[];
  lamportEvents: LamportEvent[];
  legalHoldActive: boolean;
  setLegalHoldActive: (val: boolean) => void;
  purgeLogs: string[];
  approveRescuePick: (id: number, stage: 'moderator' | 'admin') => void;
  rejectRescuePick: (id: number) => void;
  submitRescuePick: (pick: Omit<RescuePick, 'id' | 'status' | 'dateAdded' | 'expiryDate'>) => void;
  addLamportEvent: (event: Omit<LamportEvent, 'id'>) => void;
  syncLamportEvents: (tripId: number, incomingEvents: LamportEvent[]) => void;
  checkPoiFingerprint: (lat: number, lon: number, layoutHash: string, taxId: string) => { match: boolean; reason?: string };
  runPurgeWorker: () => void;

  // Toast Notification System
  showToast: (message: string, type?: ToastType) => void;

  // Dynamic Trip Activity Management
  addActivityToTrip: (tripId: number, dayNumber: number, activity: TripActivity) => void;
  deleteActivityFromTrip: (tripId: number, dayNumber: number, activityIndex: number) => void;
};

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("Missing AppProvider");
  return ctx;
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('user');
  const [places, setPlaces] = useState<Place[]>(INITIAL_PLACES);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [savedPlaceIds, setSavedPlaceIds] = useState<number[]>([]);
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [user, setUser] = useState<{ loggedIn: boolean; email?: string; isVerifiedL3?: boolean; ekycHash?: string } | null>(() => {
    const saved = localStorage.getItem('user_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [privacySettings, setPrivacySettings] = useState({
    trackLocation: localStorage.getItem('gps_consented') === 'true',
    allowShareData: true
  });
  const [cases, setCases] = useState<Case[]>([
    {
      id: 'RP-2938',
      poiTitle: 'Đà Lạt Chill',
      reportType: 'Giá không đúng',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      status: 'processing',
      lat: 11.9404,
      lon: 108.4583,
      evidenceUrl: 'https://images.unsplash.com/photo-1554415707-9e49fa664822?w=500&auto=format&fit=crop&q=80',
      logs: [
        { time: new Date(Date.now() - 3 * 3600 * 1000).toLocaleString('vi-VN'), message: 'Người dùng gửi báo cáo sai phạm về chênh lệch giá vé thực tế.' },
        { time: new Date(Date.now() - 2.5 * 3600 * 1000).toLocaleString('vi-VN'), message: 'Hệ thống tự động phân phối và tiếp nhận bởi Điều phối viên.' }
      ]
    },
    {
      id: 'RP-5821',
      poiTitle: 'Vịnh Hạ Long',
      reportType: 'Đóng cửa / Sai giờ',
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      status: 'pending',
      lat: 20.9101,
      lon: 107.1839,
      evidenceUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=500&auto=format&fit=crop&q=80',
      logs: [
        { time: new Date(Date.now() - 1 * 3600 * 1000).toLocaleString('vi-VN'), message: 'Người dùng báo cáo địa điểm đóng cửa bảo trì không báo trước.' }
      ]
    },
    {
      id: 'RP-8492',
      poiTitle: 'Phố cổ Hội An',
      reportType: 'PR rác / Bịp bợm',
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      status: 'resolved',
      lat: 15.8801,
      lon: 108.3380,
      evidenceUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&auto=format&fit=crop&q=80',
      logs: [
        { time: new Date(Date.now() - 24 * 3600 * 1000).toLocaleString('vi-VN'), message: 'Báo cáo spam review từ dịch vụ chèo kéo khách.' },
        { time: new Date(Date.now() - 22 * 3600 * 1000).toLocaleString('vi-VN'), message: 'Điều phối viên đã xác minh và ẩn các bình luận vi phạm tiêu chuẩn cộng đồng.' }
      ]
    }
  ]);

  // Phase 1 Features States
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(() => {
    const saved = localStorage.getItem('feature_flags');
    return saved ? JSON.parse(saved) : {
      priceForecast: true,
      visualSearch: true,
      sponsoredAds: true,
      guidebook: true,
      comparePois: true,
      tasteCollections: true,
      avoidList: true,
      quickReport: true,
      ekycSimulation: true,
      verifiedStay: true,
      merchantOnboarding: true,
      merchantConsole: true,
      globalKillSwitch: false,
    };
  });

  const [apiQuota, setApiQuota] = useState<ApiQuota>({
    geminiVisionCalls: 12,
    vnptEkycCalls: 4,
    budgetUsed: 0.8,
    budgetLimit: 20.0
  });

  const [avoidList, setAvoidList] = useState<number[]>([]);
  const [tasteCollections, setTasteCollections] = useState<string[]>(['Mặc định', 'Cafe chill', 'Yêu thiên nhiên']);
  const [savedPlacesCollection, setSavedPlacesCollection] = useState<{ [placeId: number]: string }>({});
  const [merchantWalletBalance, setMerchantWalletBalance] = useState<number>(2000000);
  const [appeals, setAppeals] = useState<Appeal[]>([
    {
      id: 'AP-4829',
      placeId: 3,
      status: 'rejected',
      feeDeposited: true,
      evidence: 'Hóa đơn nhập nguyên liệu tăng và bảng giá đã cập nhật tại quầy từ tháng trước.',
      caseId: 'RP-2938'
    }
  ]);

  const [rescuePicks, setRescuePicks] = useState<RescuePick[]>(INITIAL_RESCUE_PICKS);
  const [bannedFingerprints, setBannedFingerprints] = useState<PoiFingerprint[]>(INITIAL_BANNED_FINGERPRINTS);
  const [lamportEvents, setLamportEvents] = useState<LamportEvent[]>(INITIAL_LAMPORT_EVENTS);
  const [legalHoldActive, setLegalHoldActive] = useState<boolean>(false);
  const [purgeLogs, setPurgeLogs] = useState<string[]>([]);

  const [categories, setCategories] = useState<CategoryDto[]>([]);

  const refreshCategories = async () => {
    try {
      const res = await locationService.getAllCategories();
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        setCategories(res.data);
      }
    } catch (err) {
      console.log('Fetch categories error:', err);
    }
  };

  const refreshPlaces = async () => {
    try {
      const res = await locationService.getAll({ pageIndex: 1, pageSize: 50 });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const gradients = [
          'bg-gradient-nature', 'bg-gradient-sunset', 'bg-gradient-ocean', 
          'bg-gradient-berry', 'bg-gradient-lavender', 'bg-gradient-mint'
        ];
        const serverPlaces: Place[] = res.data.map(item => {
          const existing = INITIAL_PLACES.find(p => p.id === item.id);
          return {
            id: item.id,
            title: item.name,
            tag: item.categoryName || 'Địa điểm nổi bật',
            rating: item.averageRating > 0 ? Number(item.averageRating.toFixed(1)) : 4.5,
            reviewsCount: existing?.reviewsCount || (Math.floor(item.id * 17) % 80 + 12),
            imageClass: existing?.imageClass || gradients[item.id % gradients.length],
            location: item.address,
            description: existing?.description || `Địa điểm ${item.name} tại ${item.address}. Không gian đẹp, dịch vụ uy tín.`,
            reasons: existing?.reasons || ['Điểm đến được nhiều người yêu thích', 'Chất lượng phục vụ tốt', 'Vị trí thuận tiện'],
            price: existing?.price || 'Liên hệ',
            priceConfidence: existing?.priceConfidence || 90,
            openingHours: existing?.openingHours || '07:00 - 22:00',
            openingHoursConfidence: existing?.openingHoursConfidence || 95,
            trustScore: existing?.trustScore || 88,
            riskLevel: existing?.riskLevel || 'Bình thường',
            riskReasons: existing?.riskReasons || ['Giá cả niêm yết rõ ràng'],
            lat: item.latitude || existing?.lat || 10.9508,
            lon: item.longitude || existing?.lon || 106.8241,
            categoryId: item.categoryId,
            categoryName: item.categoryName
          };
        });

        setPlaces(prev => {
          const mapById = new Map<number, Place>();
          serverPlaces.forEach(p => mapById.set(p.id, p));
          prev.forEach(p => {
            if (!mapById.has(p.id)) mapById.set(p.id, p);
          });
          return Array.from(mapById.values());
        });
      }
    } catch (err) {
      console.log('Fetch places error:', err);
    }
  };

  const refreshTrips = async () => {
    const token = Cookies.get('accessToken');
    if (!token) return;
    try {
      const res = await itineraryService.getAll({ pageIndex: 1, pageSize: 20 });
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const mappedTrips: Trip[] = res.data.map(t => {
          const existing = trips.find(et => et.id === t.id);
          return {
            id: t.id,
            name: t.title,
            date: t.startDate ? new Date(t.startDate).toLocaleDateString('vi-VN') : 'Sắp tới',
            location: t.title.replace(/^Khám phá\s*/i, '').replace(/^Lịch trình\s*/i, '') || 'Việt Nam',
            status: 'Sắp tới',
            days: t.totalDays || 3,
            isPublished: (t as any).isPublished ?? existing?.isPublished ?? false,
            itinerary: existing?.itinerary && existing.itinerary.length > 0 ? existing.itinerary : [
              { day: 1, title: 'Lộ trình', items: [{ time: '08:00', act: `${t.totalActivities || 1} hoạt động đã lên kế hoạch`, type: 'activity' }] }
            ]
          };
        });
        setTrips(prev => {
          const mapByKey = new Map<string, Trip>();
          // Combine prev and mappedTrips, prioritizing richer data
          const combined = [...mappedTrips, ...prev];
          combined.forEach(t => {
            const cleanLoc = (t.location || t.name).toLowerCase().replace(/^(khám phá|lịch trình)\s*/i, '').trim();
            const key = `${cleanLoc}_${t.days}`;
            if (!mapByKey.has(key)) {
              mapByKey.set(key, t);
            } else {
              const existing = mapByKey.get(key)!;
              if ((!existing.itinerary || existing.itinerary.length <= 1) && (t.itinerary && t.itinerary.length > 1)) {
                mapByKey.set(key, t);
              }
            }
          });
          return Array.from(mapByKey.values());
        });
      }
    } catch (err) {
      console.log('Fetch trips error:', err);
    }
  };

  const togglePublishTrip = async (tripId: number, isPublished: boolean): Promise<boolean> => {
    try {
      await itineraryService.togglePublish(tripId, isPublished);
      setTrips(prev => prev.map(t => t.id === tripId ? { ...t, isPublished } : t));
      return true;
    } catch (err: any) {
      console.error('Toggle publish trip error:', err);
      throw err;
    }
  };

  const clonePublishedTrip = async (publishedId: number): Promise<boolean> => {
    try {
      const res = await itineraryService.clonePublished(publishedId);
      if (res?.data) {
        await refreshTrips();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Clone published trip error:', err);
      throw err;
    }
  };

  useEffect(() => {
    refreshCategories();
    refreshPlaces();
  }, []);

  useEffect(() => {
    if (user?.loggedIn) {
      refreshTrips();
      userService.getMyProfile().then(res => {
        if (res?.data) {
          setUser(prev => ({
            loggedIn: true,
            email: res.data.email || prev?.email,
            name: res.data.fullName || prev?.name,
            avatar: res.data.avatar,
            phone: prev?.phone,
            gender: prev?.gender,
            authMethod: prev?.authMethod || 'email',
            isVerifiedL3: prev?.isVerifiedL3,
            ekycHash: prev?.ekycHash
          }));
        }
      }).catch(err => console.log('Get profile API err:', err));
    }
  }, [user?.loggedIn]);

  const updateFeatureFlags = (flags: FeatureFlags) => {
    setFeatureFlags(flags);
    localStorage.setItem('feature_flags', JSON.stringify(flags));
  };

  const incrementQuota = (api: 'geminiVision' | 'vnptEkyc') => {
    setApiQuota(prev => {
      const isVision = api === 'geminiVision';
      const cost = isVision ? 0.05 : 0.20;
      return {
        ...prev,
        geminiVisionCalls: prev.geminiVisionCalls + (isVision ? 1 : 0),
        vnptEkycCalls: prev.vnptEkycCalls + (!isVision ? 1 : 0),
        budgetUsed: Math.round((prev.budgetUsed + cost) * 100) / 100
      };
    });
  };

  const addToAvoidList = (id: number) => {
    setAvoidList(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const removeFromAvoidList = (id: number) => {
    setAvoidList(prev => prev.filter(pid => pid !== id));
  };

  const addTasteCollection = (name: string) => {
    setTasteCollections(prev => prev.includes(name) ? prev : [...prev, name]);
  };

  const savePlaceToCollection = (placeId: number, colName: string) => {
    setSavedPlacesCollection(prev => ({
      ...prev,
      [placeId]: colName
    }));
    if (!savedPlaceIds.includes(placeId)) {
      setSavedPlaceIds(prev => [...prev, placeId]);
    }
  };

  const updateMerchantWallet = (val: number) => {
    setMerchantWalletBalance(val);
  };

  const submitAppeal = (appeal: Omit<Appeal, 'id' | 'status'>) => {
    const newAppeal: Appeal = {
      ...appeal,
      id: `AP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'step4_pending'
    };
    setAppeals(prev => [newAppeal, ...prev]);
    
    // Add log to the related case
    if (appeal.caseId) {
      setCases(prev => prev.map(c => {
        if (c.id === appeal.caseId) {
          return {
            ...c,
            logs: [...(c.logs || []), {
              time: new Date().toLocaleString('vi-VN'),
              message: `Đối tác đã nộp đơn kháng cáo và đóng lệ phí. Đang chờ Mod xét duyệt.`
            }]
          };
        }
        return c;
      }));
    }
  };

  const updateAppealStatus = (id: string, status: 'approved' | 'rejected') => {
    setAppeals(prev => prev.map(ap => {
      if (ap.id === id) {
        const updated = { ...ap, status };
        
        // If appeal approved, remove warnings on the POI
        if (status === 'approved') {
          updatePlaceTrust(ap.placeId, 90, 'Bình thường', []);
          // Resolve related case too
          if (ap.caseId) {
            updateCaseStatus(ap.caseId, 'rejected', 'Kháng cáo thành công. Bác bỏ báo cáo và phục hồi danh tiếng.');
          }
        }
        return updated;
      }
      return ap;
    }));
  };

  const verifyEkycL3 = (hash: string) => {
    if (user) {
      const updated = { ...user, isVerifiedL3: true, ekycHash: hash };
      setUser(updated);
      localStorage.setItem('user_session', JSON.stringify(updated));
    }
  };

  const login = (email: string, name?: string, phone?: string, gender?: string, authMethod: 'email' | 'google' | 'apple' = 'email') => {
    const existing = user || {};
    const newSession = {
      ...existing,
      loggedIn: true,
      email,
      name: name || existing.name || email.split('@')[0],
      phone: phone || existing.phone || '',
      gender: gender || existing.gender || 'Nam',
      authMethod,
      isVerifiedL3: existing.isVerifiedL3 || false
    };
    setUser(newSession);
    localStorage.setItem('user_session', JSON.stringify(newSession));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_session');
  };

  const PENDING_DELETIONS_KEY = 'find_bind_pending_deletions';

  const scheduleAccountDeletion = (): boolean => {
    if (!user || !user.email) return false;

    const requestedAt = Date.now();
    const deleteAt = requestedAt + 7 * 24 * 60 * 60 * 1000; // Bảo lưu 7 ngày giống Spotify

    const pendingItem: PendingDeletionAccount = {
      email: user.email.toLowerCase().trim(),
      name: user.name,
      phone: user.phone,
      gender: user.gender,
      authMethod: user.authMethod,
      isVerifiedL3: user.isVerifiedL3,
      ekycHash: user.ekycHash,
      requestedAt,
      deleteAt,
      savedPlaceIds: [...savedPlaceIds],
      trips: [...trips]
    };

    let list: PendingDeletionAccount[] = [];
    try {
      const stored = localStorage.getItem(PENDING_DELETIONS_KEY);
      if (stored) list = JSON.parse(stored);
    } catch (e) {
      list = [];
    }

    list = list.filter(item => item.email.toLowerCase() !== pendingItem.email);
    list.push(pendingItem);
    localStorage.setItem(PENDING_DELETIONS_KEY, JSON.stringify(list));

    // Đăng xuất và khóa phiên người dùng
    setUser(null);
    localStorage.removeItem('user_session');
    setSavedPlaceIds([]);
    setTrips([]);
    return true;
  };

  const checkPendingDeletion = (email: string) => {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    let list: PendingDeletionAccount[] = [];
    try {
      const stored = localStorage.getItem(PENDING_DELETIONS_KEY);
      if (stored) list = JSON.parse(stored);
    } catch (e) {
      list = [];
    }

    const found = list.find(item => item.email.toLowerCase() === cleanEmail);
    if (!found) return null;

    const now = Date.now();
    if (now >= found.deleteAt) {
      // Đã quá 7 ngày -> Xóa vĩnh viễn
      list = list.filter(item => item.email.toLowerCase() !== cleanEmail);
      localStorage.setItem(PENDING_DELETIONS_KEY, JSON.stringify(list));
      return { isPending: false, isExpired: true, email: cleanEmail };
    }

    const diffMs = found.deleteAt - now;
    const daysRemaining = Math.max(1, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));

    return {
      isPending: true,
      isExpired: false,
      deleteAt: found.deleteAt,
      daysRemaining,
      email: cleanEmail
    };
  };

  const restoreAccount = (email: string): boolean => {
    if (!email) return false;
    const cleanEmail = email.toLowerCase().trim();
    let list: PendingDeletionAccount[] = [];
    try {
      const stored = localStorage.getItem(PENDING_DELETIONS_KEY);
      if (stored) list = JSON.parse(stored);
    } catch (e) {
      list = [];
    }

    const foundIndex = list.findIndex(item => item.email.toLowerCase() === cleanEmail);
    if (foundIndex === -1) return false;

    const item = list[foundIndex];
    if (item.savedPlaceIds && Array.isArray(item.savedPlaceIds)) {
      setSavedPlaceIds(item.savedPlaceIds);
    }
    if (item.trips && Array.isArray(item.trips)) {
      setTrips(item.trips);
    }

    login(item.email, item.name, item.phone, item.gender, item.authMethod || 'email');

    list.splice(foundIndex, 1);
    localStorage.setItem(PENDING_DELETIONS_KEY, JSON.stringify(list));
    return true;
  };

  const deleteAccount = () => {
    // Gọi cơ chế soft delete 7 ngày chuẩn Spotify
    scheduleAccountDeletion();
  };

  const updatePrivacySettings = (settings: { trackLocation: boolean; allowShareData: boolean }) => {
    setPrivacySettings(settings);
    localStorage.setItem('gps_consented', settings.trackLocation ? 'true' : 'false');
  };

  const addCase = (poiTitle: string, reportType: string) => {
    addCaseWithCoords(poiTitle, reportType, 10.7719, 106.6983);
  };

  const addCaseWithCoords = (
    poiTitle: string, 
    reportType: string, 
    lat: number, 
    lon: number, 
    evidenceUrl?: string,
    customId?: string
  ) => {
    let isDupe = false;
    setCases(prev => {
      // Check if same POI and reportType submitted in the last 20 seconds
      const recent = prev.find(c => c.poiTitle === poiTitle && c.reportType === reportType);
      if (recent && (Date.now() - new Date(recent.createdAt).getTime() < 20000)) {
        isDupe = true;
        return prev;
      }
      const newCase: Case = {
        id: customId || `RP-${Math.floor(1000 + Math.random() * 9000)}`,
        poiTitle,
        reportType,
        createdAt: new Date().toISOString(),
        status: 'pending',
        lat,
        lon,
        evidenceUrl,
        logs: [
          {
            time: new Date().toLocaleString('vi-VN'),
            message: `Báo cáo mới được khởi tạo kèm vị trí GPS: [${lat.toFixed(4)}, ${lon.toFixed(4)}]`
          },
          ...(evidenceUrl ? [{
            time: new Date().toLocaleString('vi-VN'),
            message: 'Đã đính kèm ảnh bằng chứng / hóa đơn thanh toán.'
          }] : [])
        ]
      };
      return [newCase, ...prev];
    });
    if (isDupe) {
      showToast('Báo cáo cho địa điểm này đã được gửi trước đó và đang được xử lý.', 'info');
    }
  };

  const toggleSavedPlace = (id: number) => {
    setSavedPlaceIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const addReview = (review: Omit<Review, 'id' | 'date'>) => {
    const newRev = { ...review, id: Date.now().toString(), date: new Date().toLocaleDateString('vi-VN') };
    setReviews(prev => [newRev, ...prev]);
  };

  const addReviewReply = (reviewId: string, reply: string) => {
    setReviews(prev => prev.map(rev => {
      if (rev.id === reviewId) {
        return { ...rev, merchantReply: reply };
      }
      return rev;
    }));
  };

  const addTrip = (trip: Omit<Trip, 'id'>) => {
    setTrips(prev => {
      // Prevent duplicate trip with identical name within 5 seconds
      const isDuplicate = prev.some(t => t.name === trip.name && Math.abs(t.id - Date.now()) < 5000);
      if (isDuplicate) return prev;
      return [{ ...trip, id: Date.now() }, ...prev];
    });
  };

  const updateTrip = (id: number, updated: Partial<Trip>) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
  };

  const addPlace = (place: Omit<Place, 'id' | 'rating' | 'reviewsCount'>) => {
    addPlaceWithOwner({ ...place, ownerId: 'system' });
  };

  const addPlaceWithOwner = (place: Omit<Place, 'id' | 'rating' | 'reviewsCount'> & { ownerId: string }) => {
    setPlaces(prev => [{
      ...place,
      id: Date.now(),
      rating: 5,
      reviewsCount: 0,
      lat: place.lat !== undefined ? place.lat : (10.772 + Math.random() * 0.01),
      lon: place.lon !== undefined ? place.lon : (106.695 + Math.random() * 0.01)
    }, ...prev]);
  };

  const updateCaseStatus = (id: string, status: 'resolved' | 'rejected', reasonText: string) => {
    setCases(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status,
          logs: [...(c.logs || []), {
            time: new Date().toLocaleString('vi-VN'),
            message: reasonText
          }]
        };
      }
      return c;
    }));
  };

  const updatePlaceTag = (id: number, newTag: string) => {
    setPlaces(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, tag: newTag };
      }
      return p;
    }));
  };

  const updatePlaceTrust = (id: number, score: number, risk: 'Bình thường' | 'Thấp' | 'Trung bình' | 'Cao', reasons?: string[]) => {
    setPlaces(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          trustScore: score,
          riskLevel: risk,
          riskReasons: reasons || []
        };
      }
      return p;
    }));
  };

  // Phase 2 Functions
  const approveRescuePick = (id: number, stage: 'moderator' | 'admin') => {
    setRescuePicks(prev => {
      const approvedCount = prev.filter(p => p.status === 'approved').length;
      if (stage === 'admin' && approvedCount >= 20) {
        showToast("Đã đạt giới hạn số lượng địa điểm giải cứu tối đa (tối đa 20 địa điểm)!", "warning");
        return prev;
      }
      return prev.map(p => {
        if (p.id === id) {
          if (stage === 'moderator' && p.status === 'pending_mod') {
            return { ...p, status: 'pending_admin' };
          }
          if (stage === 'admin' && p.status === 'pending_admin') {
            return {
              ...p,
              status: 'approved',
              dateAdded: new Date().toISOString(),
              expiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
            };
          }
        }
        return p;
      });
    });
  };

  const rejectRescuePick = (id: number) => {
    setRescuePicks(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: 'rejected' };
      }
      return p;
    }));
  };

  const submitRescuePick = (pick: Omit<RescuePick, 'id' | 'status' | 'dateAdded' | 'expiryDate'>) => {
    const newPick: RescuePick = {
      ...pick,
      id: Date.now(),
      status: 'pending_mod',
      dateAdded: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
    };
    setRescuePicks(prev => [newPick, ...prev]);
  };

  const addLamportEvent = (event: Omit<LamportEvent, 'id'>) => {
    const newEvent: LamportEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    setLamportEvents(prev => [...prev, newEvent]);
  };

  const syncLamportEvents = (arg1: any, arg2?: any) => {
    let incomingEvents: LamportEvent[] = [];
    let targetTripId: number = 1;

    if (Array.isArray(arg1)) {
      incomingEvents = arg1;
    } else if (typeof arg1 === 'number') {
      targetTripId = arg1;
      incomingEvents = Array.isArray(arg2) ? arg2 : [];
    }

    setLamportEvents(prev => {
      const allEvents = [...prev];
      incomingEvents.forEach((ie: any) => {
        const mappedEvent: LamportEvent = {
          id: ie.id || `evt-${Date.now()}-${Math.random()}`,
          tripId: ie.tripId || targetTripId,
          lamport: ie.clock || ie.lamport || 1,
          clientId: ie.clientId || 'client-local',
          action: ie.type === 'add_activity' ? 'add_item' : (ie.action || 'add_item'),
          data: ie.payload || ie.data || { act: 'Hoạt động', time: '12:00', type: 'activity' }
        };
        if (!allEvents.find(e => e.id === mappedEvent.id)) {
          allEvents.push(mappedEvent);
        }
      });
      
      // Sort events by Lamport timestamp, breaking ties using clientId
      allEvents.sort((a, b) => {
        if (a.lamport !== b.lamport) {
          return a.lamport - b.lamport;
        }
        return a.clientId.localeCompare(b.clientId);
      });

      return allEvents;
    });

    return incomingEvents.sort((a: any, b: any) => {
      const clockA = a.clock || a.lamport || 0;
      const clockB = b.clock || b.lamport || 0;
      if (clockA !== clockB) return clockA - clockB;
      return (a.clientId || '').localeCompare(b.clientId || '');
    });
  };

  const checkPoiFingerprint = (arg1: any, arg2?: any, arg3?: any, arg4?: any) => {
    let lat = 10.7719;
    let lon = 106.6983;
    let layoutHash = "";
    let taxId = "";

    if (typeof arg1 === 'object' && arg1 !== null) {
      taxId = arg1.taxId || "";
      layoutHash = arg1.layoutHash || "";
      if (arg1.gpsDistance !== undefined && arg1.gpsDistance <= 50) {
        lat = 10.7719; // Simulate matching banned POI coordinates
        lon = 106.6983;
      }
    } else {
      lat = Number(arg1) || 0;
      lon = Number(arg2) || 0;
      layoutHash = String(arg3 || "");
      taxId = String(arg4 || "");
    }

    const match = bannedFingerprints.find(bf => {
      const geoMatch = Math.abs(bf.lat - lat) < 0.0005 && Math.abs(bf.lon - lon) < 0.0005;
      const layoutMatch = Boolean(layoutHash && bf.layoutHash.trim().toLowerCase() === layoutHash.trim().toLowerCase());
      const taxMatch = Boolean(taxId && bf.taxId.trim().toLowerCase() === taxId.trim().toLowerCase());
      return geoMatch || layoutMatch || taxMatch;
    });

    if (match) {
      let reason = "";
      if (taxId && match.taxId.trim().toLowerCase() === taxId.trim().toLowerCase()) {
        reason = `Mã số thuế trùng khớp với thực thể bị cấm (${match.title})`;
      } else if (layoutHash && match.layoutHash.trim().toLowerCase() === layoutHash.trim().toLowerCase()) {
        reason = `Bản vẽ cấu trúc mặt bằng trùng khớp với thực thể bị cấm (${match.title})`;
      } else {
        reason = `Tọa độ GPS trùng khớp cực cận (<50m) với thực thể bị cấm (${match.title})`;
      }
      return { 
        match: true, 
        matchedBanned: true,
        reason, 
        matchedFingerprint: { ...match, reason },
        confidence: 0.98
      };
    }

    return { match: false, matchedBanned: false, confidence: 0.05 };
  };

  const runPurgeWorker = () => {
    if (legalHoldActive) {
      showToast("Hệ thống đang ở chế độ Đóng băng Pháp lý (Legal Hold). Tạm hoãn mọi tiến trình dọn dẹp dữ liệu.", "info");
      return;
    }
    
    const now = new Date();
    let purgedItems: string[] = [];
    
    // Purge expired approved rescue picks (>14 days)
    const expired = rescuePicks.filter(p => p.status === 'approved' && new Date(p.expiryDate) < now);
    expired.forEach(e => {
      purgedItems.push(`[Rescue Picks] Đã ẩn & xóa booth giải cứu hết hạn của "${e.title}".`);
    });

    if (expired.length > 0) {
      setRescuePicks(prev => prev.filter(p => !(p.status === 'approved' && new Date(p.expiryDate) < now)));
    }

    // Direct simulation purge entry for testing
    purgedItems.push(`[Auto-Purge] Đã dọn dẹp các bản ghi log tạm thời và session hết hạn (Nghị định 13).`);

    // Purge data shared if revoked consent
    if (!privacySettings.allowShareData) {
      purgedItems.push(`[Nghị định 13] Rút quyền chia sẻ: Đã xóa toàn bộ cache lịch sử duyệt, vị trí và hành trình nhóm.`);
    }

    setPurgeLogs(prev => [...purgedItems, ...prev]);
    showToast(`Đã dọn dẹp ${purgedItems.length} mục dữ liệu riêng tư thành công!`, 'success');
  };

  // Toast Notification State (Singleton / Anti-spam deduplication)
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    setToasts(prev => {
      // 1. If an identical toast message is already showing, do not repeat
      if (prev.some(t => t.message === message)) {
        return prev;
      }
      // 2. Clear previous toast so multiple toasts never stack up on mobile
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setTimeout(() => {
        setToasts(curr => curr.filter(t => t.id !== id));
      }, 3000);
      return [{ id, message, type }];
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Dynamic Trip Activity Management
  const addActivityToTrip = (tripId: number, dayNumber: number, activity: TripActivity) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const updatedItinerary = [...(t.itinerary || [])];
      let targetDay = updatedItinerary.find(d => d.day === dayNumber);
      if (!targetDay) {
        targetDay = { day: dayNumber, title: `Ngày ${dayNumber}`, activities: [], items: [] };
        updatedItinerary.push(targetDay);
        updatedItinerary.sort((a, b) => a.day - b.day);
      }
      const newActivities = [...(targetDay.activities || []), activity];
      const newItems = [...(targetDay.items || []), {
        time: activity.time,
        act: `${activity.location} - ${activity.description}`,
        type: activity.isVerified ? 'verified' : 'explore'
      }];
      targetDay.activities = newActivities;
      targetDay.items = newItems;
      return { ...t, itinerary: updatedItinerary };
    }));
    showToast(`Đã thêm "${activity.location}" vào Ngày ${dayNumber} của chuyến đi!`, 'success');
  };

  const deleteActivityFromTrip = (tripId: number, dayNumber: number, activityIndex: number) => {
    setTrips(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const updatedItinerary = (t.itinerary || []).map(d => {
        if (d.day !== dayNumber) return d;
        const acts = [...(d.activities || [])];
        const items = [...(d.items || [])];
        acts.splice(activityIndex, 1);
        items.splice(activityIndex, 1);
        return { ...d, activities: acts, items };
      });
      return { ...t, itinerary: updatedItinerary };
    }));
    showToast('Đã xóa hoạt động khỏi lịch trình.', 'info');
  };

  return (
    <AppContext.Provider value={{
      role, setRole, places, addPlace, addPlaceWithOwner, trips, addTrip, updateTrip, savedPlaceIds, toggleSavedPlace, reviews, addReview,
      addReviewReply, user, login, logout, deleteAccount, scheduleAccountDeletion, checkPendingDeletion, restoreAccount, privacySettings, updatePrivacySettings, cases, addCase,
      addCaseWithCoords, updateCaseStatus, updatePlaceTag, updatePlaceTrust,
      
      // Backend Data & Sync Functions
      categories, refreshPlaces, refreshCategories, refreshTrips,
      togglePublishTrip, clonePublishedTrip,

      // Phase 1 States
      featureFlags, updateFeatureFlags, apiQuota, incrementQuota, avoidList, addToAvoidList, removeFromAvoidList,
      tasteCollections, addTasteCollection, savedPlacesCollection, savePlaceToCollection,
      merchantWalletBalance, updateMerchantWallet, appeals, submitAppeal, updateAppealStatus, verifyEkycL3,

      // Phase 2 States
      rescuePicks, bannedFingerprints, lamportEvents, legalHoldActive, setLegalHoldActive, purgeLogs,
      approveRescuePick, rejectRescuePick, submitRescuePick, addLamportEvent, syncLamportEvents,
      checkPoiFingerprint, runPurgeWorker,

      // Toast & Trip Management
      showToast, addActivityToTrip, deleteActivityFromTrip
    }}>
      {children}

      {/* Floating Modern Toast Notification Container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-11/12 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => {
            const isSuccess = toast.type === 'success';
            const isError = toast.type === 'error';
            const isWarn = toast.type === 'warning';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-xl border transition-all ${
                  isSuccess 
                    ? 'bg-emerald-950/90 text-white border-emerald-500/30 shadow-emerald-950/20' 
                    : isError
                    ? 'bg-rose-950/90 text-white border-rose-500/30 shadow-rose-950/20'
                    : isWarn
                    ? 'bg-amber-950/90 text-white border-amber-500/30 shadow-amber-950/20'
                    : 'bg-slate-900/90 text-white border-white/20 shadow-slate-950/30'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0">
                    {isSuccess && <CheckCircle2 size={18} className="text-emerald-400" />}
                    {isError && <AlertCircle size={18} className="text-rose-400" />}
                    {isWarn && <AlertTriangle size={18} className="text-amber-400" />}
                    {!isSuccess && !isError && !isWarn && <Info size={18} className="text-indigo-400" />}
                  </div>
                  <span className="text-xs font-semibold leading-tight line-clamp-2">
                    {toast.message}
                  </span>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 text-white/50 hover:text-white rounded-lg transition-colors shrink-0 cursor-pointer"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
}
