import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Share2, Heart, MapPin, Star, User, Sparkles, ShieldCheck, X, 
  ShieldAlert, Clock, Wallet, Info, Flag, Landmark, Hotel, Utensils,
  TrendingDown, TrendingUp, CheckSquare, Square, Smartphone, ClipboardList, QrCode, FileText, Download, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    places, savedPlaceIds, toggleSavedPlace, reviews, addReview, user, 
    addCaseWithCoords, featureFlags, apiQuota, incrementQuota, savePlaceToCollection, tasteCollections,
    rescuePicks
  } = useAppContext();
  
  const placeId = Number(id);
  const place = places.find(p => p.id === placeId) || rescuePicks.find(p => p.id === placeId);
  const placeReviews = reviews.filter(r => r.placeId === placeId);
  
  const isSaved = savedPlaceIds.includes(placeId);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reportType, setReportType] = useState("");

  // Feature Flags
  const isGlobalKillSwitch = featureFlags.globalKillSwitch;
  const isPriceForecastEnabled = featureFlags.priceForecast && !isGlobalKillSwitch;
  const isGuidebookEnabled = featureFlags.guidebook && !isGlobalKillSwitch;
  const isQuickReportEnabled = featureFlags.quickReport && !isGlobalKillSwitch;
  const isVerifiedStayEnabled = featureFlags.verifiedStay && !isGlobalKillSwitch;

  // States for Visit Verification (FR-25)
  const [isVisited, setIsVisited] = useState<boolean>(() => {
    return localStorage.getItem(`visited_place_${placeId}`) === 'true';
  });
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyingStep, setVerifyingStep] = useState(0); // 0=idle, 1=gps, 2=wifi, 3=success

  // Phase 1: 2-Tap Quick Report (FR-19)
  const [showQuickReportSheet, setShowQuickReportSheet] = useState(false);
  const [quickReportStep, setQuickReportStep] = useState(1); // 1=select, 2=evidence/done
  const [generatedCaseId, setGeneratedCaseId] = useState("");

  // Phase 1: Travel Guidebook Modal (FR-12)
  const [showGuidebook, setShowGuidebook] = useState(false);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [simStatus, setSimStatus] = useState<'idle' | 'purchasing' | 'success'>('idle');

  // Phase 1: Verified Stay QR check-in & PDF (FR-22)
  const [showQrCheckinModal, setShowQrCheckinModal] = useState(false);
  const [qrStep, setQrStep] = useState(0); // 0=scanner, 1=generating, 2=active
  const [stayPassToken, setStayPassToken] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // Phase 1: Taste Collection saving dropdown
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  useEffect(() => {
    if (place) {
      // Initialize personalized guidebook checklist based on POI category/tag
      let items = ["Giấy tờ tùy thân (CCCD/Hộ chiếu)", "Tiền mặt nhỏ & thẻ ngân hàng", "Bình nước cá nhân"];
      if (place.tag.includes("Thiên nhiên") || place.tag.includes("Bảo tồn") || place.title.includes("Hạ Long")) {
        items = ["Đồ bơi & khăn tắm", "Kem chống nắng", "Kính râm", "Túi chống nước điện thoại", "Dép đi biển", "Thuốc chống côn trùng"];
      } else if (place.tag.includes("Thành phố") || place.title.includes("Đà Lạt")) {
        items = ["Áo khoác giữ ấm", "Khăn quàng cổ", "Ô/dù che mưa nhẹ", "Giày đi bộ thoải mái", "Son dưỡng ẩm", "Máy ảnh du lịch"];
      } else if (place.tag.includes("Chợ") || place.title.includes("Bến Thành") || place.tag.includes("Văn hóa")) {
        items = ["Giày thể thao êm chân", "Mũ rộng vành", "Túi đeo chéo trước ngực", "Quạt tay cầm", "Danh sách món ngon địa phương"];
      }
      setChecklist(items);
    }
  }, [place]);

  // StayPass countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (qrStep === 2 && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setStayPassToken("");
      setQrStep(0);
      setTimeLeft(60);
    }
    return () => clearTimeout(timer);
  }, [qrStep, timeLeft]);

  if (!place) return <div className="p-8 text-center">Place not found</div>;

  const handleStartVerification = () => {
    if (!user || !user.loggedIn) {
      alert("Vui lòng đăng nhập tại trang Cá nhân trước khi xác thực ghé thăm!");
      navigate('/profile');
      return;
    }
    setVerifyingStep(1);
    setTimeout(() => {
      setVerifyingStep(2);
      setTimeout(() => {
        setVerifyingStep(3);
        setIsVisited(true);
        localStorage.setItem(`visited_place_${placeId}`, 'true');
      }, 1000);
    }, 1000);
  };

  const handleAddReview = () => {
    if (!user || !user.loggedIn) {
      alert("Vui lòng đăng nhập tại trang Cá nhân trước khi viết đánh giá!");
      navigate('/profile');
      return;
    }
    if (!newComment.trim()) return;
    addReview({
      placeId,
      userId: user.email || 'u1',
      userName: `${user.email?.split('@')[0]}${user.isVerifiedL3 ? ' (Đã định danh L3)' : ' (Bạn)'}`,
      rating: newRating,
      comment: newComment,
      // @ts-ignore
      verifiedVisit: isVisited
    });
    setNewComment("");
    setNewRating(5);
    setShowReviewModal(false);
  };

  // Phase 1: 2-Tap Quick Report Handler
  const handleQuickReport = (type: string) => {
    const mockCaseId = `RP-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedCaseId(mockCaseId);
    
    // Auto-attach current place coordinates as actual GPS
    addCaseWithCoords(place.title, type, place.lat ?? 10.7719, place.lon ?? 106.6983);
    setQuickReportStep(2);
  };

  // Phase 1: Local eSIM Register
  const handleRegisterEsim = () => {
    setSimStatus('purchasing');
    setTimeout(() => {
      setSimStatus('success');
    }, 1200);
  };

  // Phase 1: QR stay verify simulation
  const handleQrCheckin = () => {
    setQrStep(1);
    setTimeout(() => {
      const token = `STAYPASS-VN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setStayPassToken(token);
      setQrStep(2);
      setTimeLeft(60);
      setIsVisited(true);
      localStorage.setItem(`visited_place_${placeId}`, 'true');
    }, 1500);
  };

  const toggleChecklistItem = (item: string) => {
    setCheckedItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-white overflow-y-auto no-scrollbar"
    >
      <div className={cn("w-full h-[45vh] relative", place.imageClass)}>
        <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 frosted-glass-dark rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Đã sao chép link địa điểm!");
              }}
              className="w-12 h-12 frosted-glass-dark rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <Share2 size={20} />
            </button>
            <div className="relative">
              <button 
                onClick={() => {
                  if (!user || !user.loggedIn) {
                    alert("Vui lòng đăng nhập tại trang Cá nhân trước!");
                    navigate('/profile');
                    return;
                  }
                  setShowSaveDropdown(!showSaveDropdown);
                }}
                className="w-12 h-12 frosted-glass-dark rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
              >
                <Heart size={20} className={cn("transition-colors", isSaved && "fill-rose-500 text-rose-500")} />
              </button>
              
              {/* Save with Taste Collection Dropdown */}
              <AnimatePresence>
                {showSaveDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-left"
                  >
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 py-1 border-b border-slate-100 mb-1">Lưu vào bộ sưu tập</h5>
                    {tasteCollections.map(col => (
                      <button
                        key={col}
                        onClick={() => {
                          savePlaceToCollection(placeId, col);
                          setShowSaveDropdown(false);
                          alert(`Đã lưu "${place.title}" vào bộ sưu tập "${col}"`);
                        }}
                        className="w-full px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-left transition-colors"
                      >
                        {col}
                      </button>
                    ))}
                    <div className="h-[1px] bg-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        // Add to avoid list
                        savePlaceToCollection(placeId, "Địa điểm tránh xa");
                        // We will also use context's avoid list directly
                        // @ts-ignore
                        if (user) {
                          // addToAvoidList is added in context
                          navigate('/profile');
                        }
                        setShowSaveDropdown(false);
                        alert(`Đã thêm "${place.title}" vào Danh sách tránh xa (Avoid List). Địa điểm này sẽ được làm mờ trên bản đồ.`);
                      }}
                      className="w-full px-3 py-2 text-xs font-extrabold text-red-600 hover:bg-red-50 rounded-xl text-left transition-colors"
                    >
                      Thêm vào Tránh xa
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-t-[40px] -mt-12 relative z-20 px-8 pt-10 pb-32 min-h-[60vh] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{place.tag}</div>
              {place.trustScore && place.trustScore >= 75 && (
                <div 
                  onClick={() => setShowTrustModal(true)}
                  className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg cursor-pointer hover:bg-green-100 transition-colors animate-none"
                >
                  <ShieldCheck size={14} /> Trust {place.trustScore}
                </div>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 leading-tight mb-2">{place.title}</h1>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
              <MapPin size={16} />
              {place.location}
            </div>
          </div>
          <div className="bg-yellow-50 text-yellow-700 px-3 py-2 rounded-2xl flex flex-col items-center border border-yellow-100 min-w-[70px]">
            <div className="flex items-center gap-1 font-black text-lg">
              {place.rating} <Star size={16} className="fill-yellow-500 text-yellow-500" />
            </div>
            <div className="text-[10px] font-semibold opacity-70 border-t border-yellow-200 pt-1 mt-1">{place.reviewsCount} Rev</div>
          </div>
        </div>

        {/* Fact Sheet */}
        <div className="flex gap-4 mb-8 overflow-x-auto no-scrollbar -mx-8 px-8 pb-2">
          {place.openingHours && (
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-[24px] min-w-[140px] shrink-0">
              <Clock className="text-indigo-600 mb-2" size={20} />
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Giờ mở cửa</div>
              <div className="font-bold text-slate-900">{place.openingHours}</div>
              {place.openingHoursConfidence && place.openingHoursConfidence < 0.8 && (
                <div className="text-[10px] text-orange-500 font-medium mt-1 flex items-center gap-1"><Info size={10}/> Cần xác minh</div>
              )}
            </div>
          )}
          
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-[24px] min-w-[140px] shrink-0">
            <Wallet className="text-indigo-600 mb-2" size={20} />
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mức giá</div>
            <div className="font-bold text-slate-900 line-clamp-1">{place.price}</div>
            {place.priceConfidence && place.priceConfidence < 0.8 && (
              <div className="text-[10px] text-orange-500 font-medium mt-1 flex items-center gap-1"><Info size={10}/> Ước tính</div>
            )}
          </div>

          {/* Phase 1: Travel Guidebook Trigger (FR-12) */}
          {isGuidebookEnabled && (
            <button 
              onClick={() => setShowGuidebook(true)}
              className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 p-4 rounded-[24px] min-w-[140px] shrink-0 text-left transition-colors cursor-pointer"
            >
              <ClipboardList className="text-indigo-600 mb-2 font-bold animate-pulse" size={20} />
              <div className="text-xs font-black text-indigo-700 uppercase tracking-wider mb-1">Sổ tay du lịch</div>
              <div className="font-black text-slate-900 text-xs flex items-center gap-1">Checklist hành lý & SIM &rsaquo;</div>
            </button>
          )}
        </div>

        {/* Phase 1: Price Forecast (FR-04) */}
        {isPriceForecastEnabled && (
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-[28px] mb-8 border border-indigo-700 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl"></div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingDown className="text-emerald-400" size={20} />
                <h4 className="font-display font-black text-xs uppercase tracking-wider text-indigo-200">Dự báo biến động giá vé (AI)</h4>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                92% Tự tin
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1.5 items-end h-16 px-2 mb-3">
              {[
                { label: 'T.4', val: 32, labelVal: '1.2tr' },
                { label: 'T.5', val: 28, labelVal: '1.1tr' },
                { label: 'T.6', val: 38, labelVal: '1.3tr' },
                { label: 'T.7 (Nay)', val: 30, labelVal: '1.2tr', active: true },
                { label: 'Tuần tới', val: 22, labelVal: '1.0tr', forecast: true }
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className={cn("text-[9px] font-bold leading-none", bar.active ? "text-indigo-400 font-extrabold" : "text-slate-400")}>
                    {bar.labelVal}
                  </span>
                  <div 
                    style={{ height: `${bar.val * 1.2}px` }}
                    className={cn(
                      "w-full rounded-t-md transition-all duration-500",
                      bar.active ? "bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]" :
                      bar.forecast ? "bg-emerald-400 border border-dashed border-emerald-300 animate-pulse" : "bg-slate-700"
                    )}
                  ></div>
                  <span className="text-[8px] font-semibold text-slate-500 leading-none truncate mt-0.5">{bar.label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-3.5 mb-3 text-left">
              <Sparkles className="text-amber-400 shrink-0" size={16} />
              <p className="text-[11px] font-medium text-slate-200 leading-normal">
                Khuyên dùng: **Xu hướng giá vé sẽ giảm khoảng 15%** trong tuần tới do kết thúc mùa cao điểm. Hãy chờ để đặt vé rẻ nhất.
              </p>
            </div>

            <p className="text-[8px] text-slate-400 font-medium text-left leading-relaxed">
              *Tuyên bố miễn trừ pháp lý: Dự báo này chỉ mang tính tham khảo, dựa trên dữ liệu lịch sử và mô hình AI. Chúng tôi không cam kết hoặc chịu trách nhiệm pháp lý cho các tổn thất liên quan.*
            </p>
          </div>
        )}

        {/* Visit Verification Widget (FR-25) & Stay Pass QR check-in (FR-22) */}
        <div className="bg-slate-50 border border-slate-200/80 p-5 rounded-[24px] mb-8 text-left">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                isVisited ? "bg-green-50 text-green-600 border border-green-200" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
              )}>
                <MapPin size={20} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 text-xs leading-none mb-1">
                  {place.tag.includes("Khách sạn") || place.tag.includes("Homestay") ? "Check-in khách sạn (StayPass)" : "Xác thực ghé thăm (Geofence)"}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  {isVisited 
                    ? "Đã xác minh vị trí và nhận huy hiệu Verified Stay" 
                    : (place.tag.includes("Khách sạn") || place.tag.includes("Homestay"))
                      ? "Quét QR lễ tân để lấy mã lưu trú StayPass tự hủy bảo mật"
                      : "Quét vị trí GPS để kiểm chứng và tăng uy tín đánh giá"
                  }
                </p>
              </div>
            </div>
            {isVisited ? (
              <span className="bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0">
                <ShieldCheck size={12} /> Đã xác thực
              </span>
            ) : (
              <button 
                onClick={() => {
                  if (place.tag.includes("Khách sạn") || place.tag.includes("Homestay")) {
                    if (isVerifiedStayEnabled) {
                      setShowQrCheckinModal(true);
                    } else {
                      setShowVerifyModal(true);
                    }
                  } else {
                    setShowVerifyModal(true);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold uppercase px-3 py-2 rounded-xl transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                Xác thực
              </button>
            )}
          </div>

          {/* Export PDF receipt when checked-in to hotel */}
          {isVisited && (place.tag.includes("Khách sạn") || place.tag.includes("Homestay")) && isVerifiedStayEnabled && (
            <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">StayPass: active</span>
              <button 
                onClick={() => setShowPdfModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <FileText size={12} /> Báo cáo lưu trú (PDF)
              </button>
            </div>
          )}
        </div>

        {/* Risk Warning (FR-07) */}
        {place.riskLevel && place.riskLevel !== 'Bình thường' && (
          <div className={cn(
             "p-5 rounded-[24px] mb-8 border text-left",
             place.riskLevel === 'Cao' ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
          )}>
             <div className="flex items-start gap-3 mb-3">
               <div className={cn("mt-0.5 p-1.5 rounded-full shadow-sm", place.riskLevel === 'Cao' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600")}>
                 <ShieldAlert size={16} />
               </div>
               <div>
                  <h4 className={cn("font-bold text-base leading-tight mb-1", place.riskLevel === 'Cao' ? "text-red-900" : "text-orange-900")}>
                    Lưu ý: Rủi ro mức {place.riskLevel}
                  </h4>
                  <p className={cn("text-xs font-medium", place.riskLevel === 'Cao' ? "text-red-700" : "text-orange-700")}>Hệ thống ghi nhận dấu hiệu rủi ro, vui lòng xem kỹ trước khi đi.</p>
               </div>
             </div>
             {place.riskReasons && (
               <ul className="space-y-2 ml-10 mt-3 relative before:absolute before:left-[-15px] before:-z-0 before:w-[2px] before:bg-white/50">
                 {place.riskReasons.map((reason, i) => (
                    <li key={i} className="text-sm font-medium text-slate-700 flex items-center gap-2 relative z-10">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                      {reason}
                    </li>
                 ))}
               </ul>
             )}
          </div>
        )}

        <h3 className="font-bold text-xl text-slate-900 mb-3 text-left">Tổng quan</h3>
        <p className="text-slate-600 leading-relaxed text-sm mb-8 font-medium text-left">
          {place.description}
        </p>

        <h3 className="font-bold text-xl text-slate-900 mb-4 text-left">Tại sao phù hợp với bạn</h3>
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[24px] mb-8 text-left">
          <div className="flex items-start gap-3 mb-3">
            <div className="mt-1 bg-white p-1 rounded-full shadow-sm text-indigo-600">
              <Sparkles size={16} />
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-1">AI Phân tích độ phù hợp: <span className="text-indigo-600 font-black">98%</span></p>
          </div>
          <ul className="space-y-2.5 ml-11">
            {place.reasons.map((r, i) => (
              <li key={i} className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <ShieldCheck size={16} className="text-green-500" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Reviews Section */}
        <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-xl text-slate-900">Đánh giá từ cộng đồng</h3>
        </div>
        <div className="space-y-4 mb-6">
          {placeReviews.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-left">Chưa có đánh giá nào.</p>
          ) : (
            placeReviews.map(r => (
              <div key={r.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                    <span>{r.userName.split(' (')[0]}</span>
                    
                    {/* Verified L3 Checkmark (FR-21) */}
                    {(user?.isVerifiedL3 || r.userName.includes("L3") || r.userId.includes("Verified")) && (
                      <span className="inline-flex items-center gap-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                        <ShieldCheck size={9} className="text-indigo-600" /> Đã định danh L3
                      </span>
                    )}

                    {/* Verified Visit Badge (FR-25) */}
                    {(r.verifiedVisit || (r.userName.includes("Bạn") && isVisited)) && (
                      <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 border border-green-200 text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">
                        <ShieldCheck size={9} /> Verified Visit
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 ml-2 font-normal">{r.date}</span>
                  </div>
                  <div className="flex items-center text-yellow-500 text-xs font-bold gap-1">
                    {r.rating} <Star size={12} className="fill-yellow-500" />
                  </div>
                </div>
                <p className="text-slate-600 font-medium text-[13px] leading-relaxed">{r.comment}</p>

                {/* Merchant public reply block */}
                {r.merchantReply && (
                  <div className="mt-3 bg-purple-50/70 border-l-2 border-purple-500 p-3 rounded-r-xl">
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase tracking-wider text-purple-700">
                      <Shield size={10} /> Phản hồi từ Chủ địa điểm:
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {r.merchantReply}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => {
              if (!user || !user.loggedIn) {
                alert("Vui lòng đăng nhập tại trang Cá nhân trước khi viết đánh giá!");
                navigate('/profile');
                return;
              }
              setShowReviewModal(true);
            }}
            className="flex-1 p-4 rounded-xl border border-indigo-200 text-indigo-600 font-bold bg-indigo-50 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <Star size={18} /> Viết đánh giá
          </button>
          <button 
            onClick={() => {
              if (!user || !user.loggedIn) {
                alert("Vui lòng đăng nhập tại trang Cá nhân trước khi gửi báo cáo!");
                navigate('/profile');
                return;
              }
              setShowReportModal(true);
            }}
            className="w-14 h-auto rounded-xl border border-slate-200 text-slate-500 font-bold bg-white active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
          >
            <Flag size={18} />
          </button>
        </div>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 left-0 w-full sm:w-[414px] bg-white border-t border-slate-100 p-6 flex items-center gap-4 z-30 pb-8">
          <div className="flex flex-col min-w-[100px] text-left">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mức giá</span>
            <span className="font-black text-lg text-slate-900 leading-tight">{place.price}</span>
          </div>
          <button 
            onClick={() => {
              if (!user || !user.loggedIn) {
                alert("Vui lòng đăng nhập tại trang Cá nhân trước khi thêm vào kế hoạch!");
                navigate('/profile');
                return;
              }
              navigate('/plan/new');
            }}
            className="flex-1 bg-slate-900 text-white font-bold rounded-2xl py-4 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform cursor-pointer"
          >
            Thêm vào Kế hoạch
          </button>
        </div>
      </div>

      {/* Floating 2-Tap Quick Report button (FR-19) */}
      {isQuickReportEnabled && (
        <div className="fixed bottom-28 right-6 z-50 pointer-events-auto">
          <button 
            onClick={() => {
              if (!user || !user.loggedIn) {
                alert("Vui lòng đăng nhập trước!");
                navigate('/profile');
                return;
              }
              setQuickReportStep(1);
              setShowQuickReportSheet(true);
            }}
            className="w-14 h-14 bg-red-600 hover:bg-red-700 active:scale-95 shadow-2xl rounded-full flex items-center justify-center text-white border-4 border-white transition-all cursor-pointer group"
          >
            <Flag size={22} className="animate-pulse" />
          </button>
        </div>
      )}

      {/* 2-Tap Quick Report Bottom Sheet */}
      <AnimatePresence>
        {showQuickReportSheet && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowQuickReportSheet(false)}
            />
            
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl text-left"
            >
              {quickReportStep === 1 ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-black text-xl text-slate-900">Báo cáo Nhanh 2 chạm</h3>
                    <button onClick={() => setShowQuickReportSheet(false)} className="p-1 bg-slate-100 rounded-full text-slate-500"><X size={16}/></button>
                  </div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Chọn loại sai phạm để gửi ngay lập tức:</p>
                  
                  <div className="space-y-3 mb-6">
                    <button 
                      onClick={() => handleQuickReport("Báo giá khống")}
                      className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-red-500 hover:bg-red-50/50 flex items-center justify-between font-bold text-slate-800 transition-all cursor-pointer"
                    >
                      <span>Giá vé khống / Sai niêm yết</span>
                      <ChevronLeft size={16} className="rotate-180 text-red-500" />
                    </button>
                    
                    <button 
                      onClick={() => handleQuickReport("Đóng cửa không báo trước")}
                      className="w-full text-left p-4 rounded-2xl border-2 border-slate-100 hover:border-red-500 hover:bg-red-50/50 flex items-center justify-between font-bold text-slate-800 transition-all cursor-pointer"
                    >
                      <span>Sai giờ hoạt động / Đóng cửa ảo</span>
                      <ChevronLeft size={16} className="rotate-180 text-red-500" />
                    </button>
                  </div>

                  <span className="text-[10px] text-slate-400 font-semibold block text-center">
                    *Tự động đính kèm tọa độ định vị hiện thời của thiết bị.
                  </span>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg mb-1">Gửi báo cáo thành công!</h4>
                  <p className="text-xs text-indigo-600 font-black mb-4">Case ID: {generatedCaseId}</p>
                  
                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-left mb-6 text-[11px] font-medium text-slate-600 space-y-1.5">
                    <div>POI: <span className="font-extrabold text-slate-800">{place.title}</span></div>
                    <div>GPS Coords: <span className="font-extrabold text-slate-800">[{place.lat?.toFixed(4)}, {place.lon?.toFixed(4)}]</span></div>
                    <div>Thời hạn SLA xử lý: <span className="font-extrabold text-amber-600">4 Giờ</span></div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide text-left mb-2">Chụp hóa đơn / bằng chứng nhanh (Tùy chọn)</label>
                    <div className="w-full h-24 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 font-bold text-xs cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <Camera size={20} className="mb-1 text-slate-300" />
                      <span>+ Tải ảnh hóa đơn thanh toán</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowQuickReportSheet(false)}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-95 transition-all cursor-pointer"
                  >
                    Hoàn tất
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Travel Guidebook Modal */}
      <AnimatePresence>
        {showGuidebook && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowGuidebook(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl h-[80vh] flex flex-col text-left"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-indigo-600" size={22} />
                  <h3 className="font-black text-xl text-slate-900">Sổ tay Chuẩn bị hành lý</h3>
                </div>
                <button onClick={() => setShowGuidebook(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar pr-1 pb-6 space-y-6">
                <div>
                  <h4 className="font-extrabold text-[11px] text-slate-400 uppercase tracking-wider mb-3">Checklist cá nhân hóa cho bạn:</h4>
                  <div className="space-y-2">
                    {checklist.map(item => {
                      const isChecked = checkedItems.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleChecklistItem(item)}
                          className={cn(
                            "w-full p-3 rounded-xl border flex items-center gap-3 text-left text-xs font-semibold transition-colors",
                            isChecked ? "bg-green-50/50 border-green-200 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-700"
                          )}
                        >
                          {isChecked ? (
                            <CheckSquare size={16} className="text-green-600 fill-green-50 shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-300 shrink-0" />
                          )}
                          <span className={cn(isChecked && "line-through")}>{item}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="text-indigo-600" size={18} />
                    <h4 className="font-extrabold text-xs text-indigo-950">Gói SIM & eSIM địa phương</h4>
                  </div>
                  <p className="text-[11px] text-indigo-900 leading-normal mb-4 font-semibold">
                    Kết nối 4G/5G mượt mà tại điểm đến với dịch vụ eSIM kích hoạt online tức thì.
                  </p>

                  <div className="bg-white p-3.5 border border-indigo-100 rounded-2xl mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[8px] font-black uppercase bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">Bán chạy nhất</span>
                        <h5 className="text-xs font-extrabold text-slate-800 mt-1">Vinaphone Tourist eSIM 7 Ngày</h5>
                      </div>
                      <span className="text-xs font-black text-indigo-600">99,000đ</span>
                    </div>
                    <ul className="text-[9.5px] text-slate-500 font-semibold space-y-1 mb-3">
                      <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-indigo-600"></div> 3GB Data tốc độ cao/ngày</li>
                      <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-indigo-600"></div> 20 phút gọi nội địa Việt Nam</li>
                    </ul>

                    {simStatus === 'idle' && (
                      <button 
                        onClick={handleStartVerification}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase active:scale-95 transition-all cursor-pointer"
                      >
                        Đăng ký eSIM
                      </button>
                    )}
                    {simStatus === 'purchasing' && (
                      <div className="flex items-center justify-center gap-2 py-2 text-indigo-600 text-[10px] font-black uppercase">
                        <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang xử lý thanh toán...</span>
                      </div>
                    )}
                    {simStatus === 'success' && (
                      <div className="bg-green-50 border border-green-200 text-green-700 p-2.5 rounded-xl text-[10.5px] font-bold text-center leading-relaxed">
                        Đăng ký thành công! Mã QR kích hoạt eSIM đã được gửi tới email của bạn.
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-indigo-700/80 font-medium leading-relaxed">
                    *Hỗ trợ các dòng điện thoại thông minh tương thích eSIM. Kích hoạt trực tuyến không cần đổi SIM vật lý.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verified Stay QR Checkin Modal */}
      <AnimatePresence>
        {showQrCheckinModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => qrStep !== 1 && setShowQrCheckinModal(false)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl text-center text-slate-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl text-slate-900 text-left">StayPass Check-in</h3>
                {qrStep !== 1 && (
                  <button onClick={() => setShowQrCheckinModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
                )}
              </div>

              {qrStep === 0 && (
                <div>
                  <div className="w-48 h-48 border-4 border-slate-100 bg-slate-50 rounded-3xl mx-auto mb-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <QrCode size={100} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                    <div className="absolute w-full h-1 bg-indigo-500 top-1/2 left-0 animate-bounce"></div>
                  </div>
                  
                  <h4 className="font-bold text-slate-800 text-sm mb-2">Quét mã QR tại Quầy lễ tân</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 px-4">
                    Quét mã QR lễ tân được cung cấp tại sảnh để nhận diện vị trí và lấy token StayPass chứng minh thời gian cư trú.
                  </p>
                  
                  <button 
                    onClick={handleQrCheckin}
                    className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer"
                  >
                    Bắt đầu quét mã QR
                  </button>
                </div>
              )}

              {qrStep === 1 && (
                <div className="py-8">
                  <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2">Đang liên kết với StayPass Server...</h4>
                  <p className="text-xs text-slate-400 font-medium">Khởi tạo token bảo mật tự hủy</p>
                </div>
              )}

              {qrStep === 2 && (
                <div>
                  <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                    <ShieldCheck size={28} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-2 text-green-600">Đã Check-in thành công!</h4>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
                    Đã ghi nhận lưu trú tại <span className="font-bold">{place.title}</span>. Bạn có thể gửi đánh giá xác thực.
                  </p>

                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl mb-6 text-left relative overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">StayPassToken:</span>
                      <span className="text-[10px] text-rose-500 font-bold">Hủy sau: {timeLeft}s</span>
                    </div>
                    <div className="font-mono font-black text-sm text-slate-700 tracking-wider">
                      {stayPassToken}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setShowQrCheckinModal(false);
                      setQrStep(0);
                    }}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer"
                  >
                    Hoàn tất
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Stay Report Modal (FR-22) */}
      <AnimatePresence>
        {showPdfModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowPdfModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] overflow-hidden relative z-10 shadow-2xl flex flex-col text-slate-800"
            >
              {/* PDF Preview Page */}
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                <span className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <FileText size={14} className="text-indigo-600" /> Báo cáo lưu trú mẫu
                </span>
                <button onClick={() => setShowPdfModal(false)} className="p-1 bg-white hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={14}/></button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] text-left text-xs bg-white font-mono space-y-4">
                <div className="text-center border-b border-dashed border-slate-300 pb-4">
                  <h4 className="font-extrabold text-sm uppercase leading-tight text-slate-900">Báo cáo Xác thực Lưu trú</h4>
                  <span className="text-[9px] text-slate-400">HỆ THỐNG TRUST ENGINE - PLATFORM FIND & BIND</span>
                </div>

                <div className="space-y-2 text-slate-600">
                  <div className="flex justify-between"><span>Mã tài liệu:</span><span className="font-extrabold text-slate-800">PDF-STAY-9381</span></div>
                  <div className="flex justify-between"><span>Thời gian check-in:</span><span className="font-extrabold text-slate-800">{new Date().toLocaleString('vi-VN')}</span></div>
                  <div className="flex justify-between"><span>Địa điểm Homestay/Hotel:</span><span className="font-extrabold text-slate-800">{place.title}</span></div>
                  <div className="flex justify-between"><span>Địa chỉ:</span><span className="font-extrabold text-slate-800 truncate max-w-[200px]">{place.location}</span></div>
                  <div className="flex justify-between"><span>Tài khoản lưu trú:</span><span className="font-extrabold text-slate-800">{user?.email}</span></div>
                  <div className="flex justify-between"><span>StayPass Token:</span><span className="font-extrabold text-slate-800">STAYPASS-VN-2026</span></div>
                </div>

                <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-1">
                  <div className="font-extrabold text-slate-800">Trạng thái xác thực:</div>
                  <div className="text-green-600 font-extrabold flex items-center gap-1"><ShieldCheck size={12} /> ĐÃ GHÉ THĂM (VERIFIED VISIT)</div>
                  <p className="text-[9px] text-slate-400 leading-normal">Được định vị đối chiếu bởi Geofence GPS kết hợp kiểm tra SSID Wi-Fi tại quầy.</p>
                </div>

                <div className="text-center pt-2 text-[9px] text-slate-400 leading-relaxed">
                  Tài liệu tự động kết xuất được mã hóa bảo mật. Dùng để lưu trữ hoặc nộp khai báo lưu trú khi được yêu cầu.
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
                <button 
                  onClick={() => {
                    alert("Đã kết xuất và tải xuống file PDF báo cáo lưu trú!");
                    setShowPdfModal(false);
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download size={14} /> Tải xuống PDF
                </button>
                <button 
                  onClick={() => setShowPdfModal(false)}
                  className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Write Review Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => setShowReviewModal(false)}
             />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl text-slate-800"
             >
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-xl text-slate-900">Viết đánh giá</h3>
                 <button onClick={() => setShowReviewModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
               </div>
               
               <div className="mb-6 flex justify-center gap-2">
                 {[1,2,3,4,5].map(star => (
                   <button key={star} onClick={() => setNewRating(star)} className="p-2">
                     <Star size={32} className={cn("transition-colors", newRating >= star ? "fill-yellow-400 text-yellow-400" : "text-slate-200 fill-slate-100")} />
                   </button>
                 ))}
               </div>

               <textarea 
                 value={newComment}
                 onChange={e => setNewComment(e.target.value)}
                 className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-medium mb-6 placeholder-slate-400 resize-none"
                 placeholder="Chia sẻ trải nghiệm của bạn về địa điểm này..."
               ></textarea>

               <button 
                 onClick={handleAddReview}
                 className="w-full bg-indigo-600 text-white font-bold rounded-2xl py-4 shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform cursor-pointer"
               >
                 Gửi đánh giá
               </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trust Modal */}
      <AnimatePresence>
        {showTrustModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => setShowTrustModal(false)}
             />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl text-slate-800 text-left"
             >
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-xl text-slate-900">Chi tiết Độ tin cậy</h3>
                 <button onClick={() => setShowTrustModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
               </div>
               
               <div className="flex flex-col items-center justify-center mb-6 py-6 bg-slate-50 rounded-[24px]">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex flex-col items-center justify-center text-green-600 mb-2 border-4 border-white shadow-soft">
                    <ShieldCheck size={28} className="mb-0.5" />
                    <span className="font-black text-xl leading-none">{place.trustScore}</span>
                  </div>
                  <div className="font-bold text-slate-900">Độ tin cậy Cao</div>
               </div>

               <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                     <span className="text-sm font-medium text-slate-600">Đánh giá thực tế (Verified)</span>
                     <span className="font-bold text-slate-900">1,248</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                     <span className="text-sm font-medium text-slate-600">Báo cáo vi phạm (30 ngày)</span>
                     <span className="font-bold text-green-600">0</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                     <span className="text-sm font-medium text-slate-600">Cập nhật gần nhất</span>
                     <span className="font-bold text-slate-900">2 ngày trước</span>
                  </div>
               </div>

               <button 
                 onClick={() => setShowTrustModal(false)}
                 className="w-full bg-slate-900 text-white font-bold rounded-2xl py-4 active:scale-95 transition-transform cursor-pointer"
               >
                 Đóng
               </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => setShowReportModal(false)}
             />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl h-[85vh] overflow-y-auto no-scrollbar text-slate-800 text-left"
             >
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-xl text-slate-900">Báo cáo Vấn đề</h3>
                 <button onClick={() => setShowReportModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
               </div>
               
               <p className="text-sm font-medium text-slate-600 mb-6">
                 Hệ thống sẽ xử lý báo cáo của bạn trong 4h làm việc. Xin cung cấp thông tin chính xác.
               </p>

               <div className="space-y-3 mb-6">
                  {['Giá không đúng', 'Chặt chém / Ép giá', 'Đóng cửa / Sai giờ', 'PR rác / Bịp bợm', 'Khác'].map((type) => (
                    <button 
                      key={type}
                      onClick={() => setReportType(type)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 font-bold transition-colors active:scale-95 cursor-pointer",
                        reportType === type ? "border-rose-500 text-rose-600 bg-rose-50" : "border-slate-100 text-slate-600 bg-white"
                      )}
                    >
                      {type}
                    </button>
                  ))}
               </div>

               {reportType && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Bằng chứng (Bắt buộc với rủi ro cao)</label>
                    <div className="w-full h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-500 font-medium text-sm cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                       + Tải ảnh/video/hóa đơn lên
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">Hệ thống sẽ che tự động thông tin nhạy cảm. Không tải ảnh chứa thẻ CCCD/hộ chiếu đầy đủ.</p>
                 </motion.div>
               )}

               <button 
                 onClick={() => {
                    if (!user || !user.loggedIn) {
                      alert("Vui lòng đăng nhập tại trang Cá nhân trước khi gửi báo cáo!");
                      navigate('/profile');
                      return;
                    }
                    addCaseWithCoords(place.title, reportType, place.lat ?? 10.7719, place.lon ?? 106.6983);
                    alert('Đã gửi báo cáo thành công! Mã Case ID đã được tạo để bạn theo dõi trong hồ sơ.');
                    setShowReportModal(false);
                 }}
                 disabled={!reportType}
                 className="w-full bg-rose-600 text-white font-bold rounded-2xl py-4 shadow-lg shadow-rose-600/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
               >
                 Gửi báo cáo
               </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Visit Verification Geofence Modal (FR-25) */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
               onClick={() => verifyingStep !== 1 && verifyingStep !== 2 && setShowVerifyModal(false)}
             />
             <motion.div 
               initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
               className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl text-center text-slate-800"
             >
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-xl text-slate-900 text-left">Xác thực ghé thăm</h3>
                 {verifyingStep !== 1 && verifyingStep !== 2 && (
                   <button onClick={() => setShowVerifyModal(false)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
                 )}
               </div>

               {verifyingStep === 0 && (
                 <div>
                   <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
                     <MapPin size={28} />
                   </div>
                   <h4 className="font-bold text-slate-800 text-sm mb-2">Định vị Geofence & Wi-Fi SSID</h4>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 px-4">
                     Để nhận nhãn <span className="text-green-600 font-bold">Verified Visit</span>, hệ thống cần đối chiếu tọa độ GPS thực tế của bạn (phạm vi &lt; 100m) và kiểm tra tín hiệu mạng Wi-Fi phát ra từ địa điểm.
                   </p>
                   <button 
                     onClick={handleStartVerification}
                     className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer"
                   >
                     Bắt đầu xác thực vị trí
                   </button>
                 </div>
               )}

               {(verifyingStep === 1 || verifyingStep === 2) && (
                 <div className="py-8">
                   <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                   <h4 className="font-bold text-slate-800 text-sm mb-2">
                     {verifyingStep === 1 ? "Đang xác thực tọa độ GPS..." : "Đang kiểm tra Wi-Fi SSID..."}
                   </h4>
                   <p className="text-xs text-slate-400 font-medium">Vui lòng chờ trong giây lát</p>
                 </div>
               )}

               {verifyingStep === 3 && (
                 <div>
                   <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                     <ShieldCheck size={28} />
                   </div>
                   <h4 className="font-bold text-slate-800 text-sm mb-2 text-green-600">Xác minh thành công!</h4>
                   <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 px-4">
                     Tọa độ trùng khớp. Tên Wi-Fi khớp. Đã ghi nhận bạn đã ghé thăm <span className="font-bold">{place.title}</span>. Bạn sẽ nhận được huy hiệu chứng thực cho các đánh giá tại đây.
                   </p>
                   <button 
                     onClick={() => {
                       setShowVerifyModal(false);
                       setVerifyingStep(0);
                     }}
                     className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl active:scale-95 transition-transform cursor-pointer"
                   >
                     Hoàn tất
                   </button>
                 </div>
               )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Simple Camera Icon component since we need it for Quick Report evidence upload
function Camera({ className, size }: { className?: string, size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
      <circle cx="12" cy="13" r="3"/>
    </svg>
  );
}
