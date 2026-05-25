import React, { createContext, useContext, useState } from 'react';

export type Role = 'user' | 'merchant';

export type Review = {
  id: string;
  placeId: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
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
};

export type TripItem = { time: string; act: string; type: string; };
export type TripDay = { day: number; title: string; items: TripItem[]; };
export type Trip = {
  id: number; name: string; date: string; location: string; status: string; days: number; itinerary: TripDay[];
};

const INITIAL_PLACES: Place[] = [
  {
    id: 1, title: "Vịnh Hạ Long", tag: "Tuyệt tác thiên nhiên", rating: 4.9, reviewsCount: 2400, imageClass: "bg-gradient-nature", location: "Quảng Ninh, Việt Nam", description: "Một trong những kỳ quan thiên nhiên của thế giới, với hàng ngàn hòn đảo đá vôi kỳ vĩ vươn lên từ mặt nước xanh ngọc. Trải nghiệm lý tưởng: du thuyền qua đêm, chèo kayak và khám phá hang động hoang sơ.", reasons: ["Hợp gu vì tag 'Thiên nhiên'", "Đang mùa đẹp nhất (Tháng 5)"], price: "Từ 1,200,000đ",
    priceConfidence: 0.8, openingHours: "24/7", openingHoursConfidence: 0.9, trustScore: 92, riskLevel: 'Bình thường'
  },
  {
    id: 2, title: "Phố cổ Hội An", tag: "Di sản văn hóa", rating: 4.8, reviewsCount: 3100, imageClass: "bg-gradient-mesh", location: "Quảng Nam, Việt Nam", description: "Khám phá vẻ đẹp cổ kính với những con phố đèn lồng rực rỡ, kiến trúc giao thoa và ẩm thực đậm chất miền Trung. Đặc biệt lãng mạn vào ban đêm.", reasons: ["Gần đây vắng khách", "Nhiều ưu đãi lưu trú 30%"], price: "Miễn phí tham quan",
    priceConfidence: 0.99, openingHours: "08:00 - 22:00", openingHoursConfidence: 0.85, trustScore: 85, riskLevel: 'Thấp', riskReasons: ["Giá dịch vụ có thể thay đổi vào mùa lễ hội."]
  },
  {
    id: 3, title: "Đà Lạt Chill", tag: "Thành phố sương mù", rating: 4.7, reviewsCount: 5200, imageClass: "bg-gradient-urban", location: "Lâm Đồng, Việt Nam", description: "Thành phố ngàn hoa với khí hậu ôn đới quanh năm. Thích hợp cho những chuyến đi tìm kiếm sự bình yên, thưởng thức cafe và săn mây buổi sớm.", reasons: ["Phù hợp để thư giãn", "Nhiều quán cafe mới mở"], price: "Chi phí trung bình",
    priceConfidence: 0.6, openingHours: "06:00 - 23:00", openingHoursConfidence: 0.7, trustScore: 65, riskLevel: 'Trung bình', riskReasons: ["Nhiều cảnh báo quá tải vào cuối tuần.", "Một số mức giá chưa được xác minh."]
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
  trips: Trip[]; addTrip: (trip: Omit<Trip, 'id'>) => void;
  savedPlaceIds: number[]; toggleSavedPlace: (id: number) => void;
  reviews: Review[]; addReview: (review: Omit<Review, 'id' | 'date'>) => void;
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

  const toggleSavedPlace = (id: number) => {
    setSavedPlaceIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const addReview = (review: Omit<Review, 'id' | 'date'>) => {
    const newRev = { ...review, id: Date.now().toString(), date: new Date().toLocaleDateString('vi-VN') };
    setReviews(prev => [newRev, ...prev]);
  };

  const addTrip = (trip: Omit<Trip, 'id'>) => {
    setTrips(prev => [{ ...trip, id: Date.now() }, ...prev]);
  };

  const addPlace = (place: Omit<Place, 'id' | 'rating' | 'reviewsCount'>) => {
    setPlaces(prev => [{ ...place, id: Date.now(), rating: 5, reviewsCount: 0 }, ...prev]);
  };

  return (
    <AppContext.Provider value={{ role, setRole, places, addPlace, trips, addTrip, savedPlaceIds, toggleSavedPlace, reviews, addReview }}>
      {children}
    </AppContext.Provider>
  );
}
