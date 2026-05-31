import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Heart, MapPin, Star, User, Sparkles, ShieldCheck, X, ShieldAlert, Clock, Wallet, Info, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

export default function PlaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { places, savedPlaceIds, toggleSavedPlace, reviews, addReview } = useAppContext();
  
  const placeId = Number(id);
  const place = places.find(p => p.id === placeId);
  const placeReviews = reviews.filter(r => r.placeId === placeId);
  
  const isSaved = savedPlaceIds.includes(placeId);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [reportType, setReportType] = useState("");

  if (!place) return <div className="p-8 text-center">Place not found</div>;

  const handleAddReview = () => {
    if (!newComment.trim()) return;
    addReview({
      placeId,
      userId: 'u1',
      userName: 'Hùng Nguyễn (Bạn)',
      rating: newRating,
      comment: newComment
    });
    setNewComment("");
    setNewRating(5);
    setShowReviewModal(false);
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
            <button 
              onClick={() => toggleSavedPlace(placeId)}
              className="w-12 h-12 frosted-glass-dark rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <Heart size={20} className={cn("transition-colors", isSaved && "fill-rose-500 text-rose-500")} />
            </button>
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
                  className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 text-[10px] font-black uppercase tracking-wide px-2 py-1 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
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

        <div className="flex items-center gap-4 py-6 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-20"><User size={20} className="text-slate-500"/></div>
            <div className="w-12 h-12 bg-slate-200 rounded-full -ml-6 border-2 border-white shadow-sm z-10"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="avatar" className="rounded-full"/></div>
            <div className="w-12 h-12 bg-indigo-100 rounded-full -ml-6 border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-indigo-600 z-0">+99</div>
          </div>
          <p className="text-xs text-slate-500 font-medium">Bạn bè đã lưu địa điểm này</p>
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
        </div>

        {/* Risk Warning (FR-07) */}
        {place.riskLevel && place.riskLevel !== 'Bình thường' && (
          <div className={cn(
             "p-5 rounded-[24px] mb-8 border",
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
               <ul className="space-y-2 ml-10 mt-3 relative before:absolute before:inset-0 before:left-[-15px] before:-z-0 before:w-[2px] before:bg-white/50">
                 {place.riskReasons.map((reason, i) => (
                   <li key={i} className="text-sm font-medium text-slate-700 flex items-center gap-2 relative z-10">
                     <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40 shrink-0" />
                     {reason}
                   </li>
                 ))}
               </ul>
             )}
             <div className="mt-4 pt-3 border-t border-black/5 ml-10">
               <h5 className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">Hành động khuyến nghị</h5>
               <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-white/60 px-2.5 py-1 rounded-md font-semibold">Hỏi giá trước</span>
                  <span className="text-xs bg-white/60 px-2.5 py-1 rounded-md font-semibold">Báo cáo nếu sai phạm</span>
               </div>
             </div>
          </div>
        )}

        <h3 className="font-bold text-xl text-slate-900 mb-3">Tổng quan</h3>
        <p className="text-slate-600 leading-relaxed text-sm mb-8 font-medium">
          {place.description}
        </p>

        <h3 className="font-bold text-xl text-slate-900 mb-4">Tại sao phù hợp với bạn</h3>
        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-[24px] mb-8">
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
            <p className="text-sm text-slate-500 italic">Chưa có đánh giá nào.</p>
          ) : (
            placeReviews.map(r => (
              <div key={r.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-bold text-sm text-slate-900">{r.userName} <span className="text-[10px] text-slate-400 ml-2 font-normal">{r.date}</span></div>
                  <div className="flex items-center text-yellow-500 text-xs font-bold gap-1">
                    {r.rating} <Star size={12} className="fill-yellow-500" />
                  </div>
                </div>
                <p className="text-slate-600 font-medium text-[13px] leading-relaxed">{r.comment}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex gap-3 mb-8">
          <button 
            onClick={() => setShowReviewModal(true)}
            className="flex-1 p-4 rounded-xl border border-indigo-200 text-indigo-600 font-bold bg-indigo-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            <Star size={18} /> Viết đánh giá
          </button>
          <button 
            onClick={() => setShowReportModal(true)}
            className="w-14 h-auto rounded-xl border border-slate-200 text-slate-500 font-bold bg-white active:scale-95 transition-transform flex items-center justify-center"
          >
            <Flag size={18} />
          </button>
        </div>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-0 left-0 w-full sm:w-[414px] bg-white border-t border-slate-100 p-6 flex items-center gap-4 z-50 pb-8">
          <div className="flex flex-col min-w-[100px]">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mức giá</span>
            <span className="font-black text-lg text-slate-900 leading-tight">{place.price}</span>
          </div>
          <button 
            onClick={() => navigate('/plan/new')}
            className="flex-1 bg-slate-900 text-white font-bold rounded-2xl py-4 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform"
          >
            Thêm vào Kế hoạch
          </button>
        </div>
      </div>

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
               className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl"
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
                 className="w-full bg-indigo-600 text-white font-bold rounded-2xl py-4 shadow-lg shadow-indigo-600/20 active:scale-95 transition-transform"
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
               className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl"
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
                 className="w-full bg-slate-900 text-white font-bold rounded-2xl py-4 active:scale-95 transition-transform"
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
               className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl h-[85vh] overflow-y-auto no-scrollbar"
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
                        "w-full text-left p-4 rounded-xl border-2 font-bold transition-colors active:scale-95",
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
                   alert('Đã gửi báo cáo! Mã tra cứu: #RP-2938');
                   setShowReportModal(false);
                 }}
                 disabled={!reportType}
                 className="w-full bg-rose-600 text-white font-bold rounded-2xl py-4 shadow-lg shadow-rose-600/20 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
               >
                 Gửi báo cáo
               </button>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
