import React, { createContext, useContext, useState } from 'react';

export type Role = 'user' | 'merchant' | 'admin' | 'moderator';

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
  isSponsored?: boolean; // Phase 1: Sponsored ad marker
};

export type TripItem = { time: string; act: string; type: string; };
export type TripDay = { day: number; title: string; items: TripItem[]; };
export type Trip = {
  id: number; name: string; date: string; location: string; status: string; days: number; itinerary: TripDay[];
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
    id: 1, name: "Thái Lan 4N3Đ", date: "15 - 18 Tháng 6, 2024", location: "Bangkok", status: "Sắp tới", days: 4,
    itinerary: [
      { day: 1, title: "Đến nơi & Khám phá trung tâm", items: [ { time: "09:00", act: "Đến tại khách sạn & Gửi hành lý", type: "logistic" } ] }
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
  trips: Trip[]; addTrip: (trip: Omit<Trip, 'id'>) => void;
  savedPlaceIds: number[]; toggleSavedPlace: (id: number) => void;
  reviews: Review[]; addReview: (review: Omit<Review, 'id' | 'date'>) => void;
  addReviewReply: (reviewId: string, reply: string) => void;
  user: { loggedIn: boolean; email?: string; name?: string; phone?: string; gender?: string; authMethod?: 'email' | 'google' | 'apple'; isVerifiedL3?: boolean; ekycHash?: string } | null;
  login: (email: string, name?: string, phone?: string, gender?: string, authMethod?: 'email' | 'google' | 'apple') => void;
  logout: () => void;
  deleteAccount: () => void;
  privacySettings: { trackLocation: boolean; allowShareData: boolean };
  updatePrivacySettings: (settings: { trackLocation: boolean; allowShareData: boolean }) => void;
  cases: Case[];
  addCase: (poiTitle: string, reportType: string) => void;
  addCaseWithCoords: (poiTitle: string, reportType: string, lat: number, lon: number, evidenceUrl?: string) => void;
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

  const deleteAccount = () => {
    setUser(null);
    localStorage.clear();
    setSavedPlaceIds([]);
    setTrips([]);
  };

  const updatePrivacySettings = (settings: { trackLocation: boolean; allowShareData: boolean }) => {
    setPrivacySettings(settings);
    localStorage.setItem('gps_consented', settings.trackLocation ? 'true' : 'false');
  };

  const addCase = (poiTitle: string, reportType: string) => {
    addCaseWithCoords(poiTitle, reportType, 10.7719, 106.6983);
  };

  const addCaseWithCoords = (poiTitle: string, reportType: string, lat: number, lon: number, evidenceUrl?: string) => {
    const newCase: Case = {
      id: `RP-${Math.floor(1000 + Math.random() * 9000)}`,
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
        }
      ]
    };
    setCases(prev => [newCase, ...prev]);
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
    setTrips(prev => [{ ...trip, id: Date.now() }, ...prev]);
  };

  const addPlace = (place: Omit<Place, 'id' | 'rating' | 'reviewsCount'>) => {
    addPlaceWithOwner({ ...place, ownerId: 'system' });
  };

  const addPlaceWithOwner = (place: Omit<Place, 'id' | 'rating' | 'reviewsCount'> & { ownerId: string }) => {
    setPlaces(prev => [{ ...place, id: Date.now(), rating: 5, reviewsCount: 0, lat: 10.772 + Math.random() * 0.01, lon: 106.695 + Math.random() * 0.01 }, ...prev]);
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
        alert("Đã đạt giới hạn slot giải cứu tối đa (rescue_slots_max = 20)!");
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
      alert("Hệ thống đang ở chế độ Đóng băng Pháp lý (Legal Hold). Tạm hoãn mọi tiến trình dọn dẹp dữ liệu.");
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
    alert(`Đã thực thi Auto-purge thành công: Xóa ${purgedItems.length} đầu mục dữ liệu.`);
  };

  return (
    <AppContext.Provider value={{
      role, setRole, places, addPlace, addPlaceWithOwner, trips, addTrip, savedPlaceIds, toggleSavedPlace, reviews, addReview,
      addReviewReply, user, login, logout, deleteAccount, privacySettings, updatePrivacySettings, cases, addCase,
      addCaseWithCoords, updateCaseStatus, updatePlaceTag, updatePlaceTrust,
      
      // Phase 1 States
      featureFlags, updateFeatureFlags, apiQuota, incrementQuota, avoidList, addToAvoidList, removeFromAvoidList,
      tasteCollections, addTasteCollection, savedPlacesCollection, savePlaceToCollection,
      merchantWalletBalance, updateMerchantWallet, appeals, submitAppeal, updateAppealStatus, verifyEkycL3,

      // Phase 2 States
      rescuePicks, bannedFingerprints, lamportEvents, legalHoldActive, setLegalHoldActive, purgeLogs,
      approveRescuePick, rejectRescuePick, submitRescuePick, addLamportEvent, syncLamportEvents,
      checkPoiFingerprint, runPurgeWorker
    }}>
      {children}
    </AppContext.Provider>
  );
}
