import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Calendar, MapPin, PlusSquare, Camera, SlidersHorizontal, Navigation, AlertTriangle, ArrowRight, WifiOff, RefreshCw, Layers, Check, Users, Edit3 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trips } = useAppContext();
  
  const [isGuideMode, setIsGuideMode] = useState(false);
  const [showIncident, setShowIncident] = useState(false);

  // States for Offline Mode & Conflict Resolution (FR-15, FR-16)
  const [isOffline, setIsOffline] = useState(false);
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [tripNameInput, setTripNameInput] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);

  // Filter View mode (Collaborative vs Personal) (FR-15)
  const [viewMode, setViewMode] = useState<'all' | 'personal'>('all');

  const trip = trips.find(t => t.id === Number(id)) || trips[0];

  // Sync effect when going online
  const handleToggleOffline = () => {
    if (isOffline) {
      // Transitioning to online: simulate sync check
      setIsOffline(false);
      if (hasUnsyncedChanges) {
        // Trigger conflict resolution modal
        setTimeout(() => {
          setShowConflictModal(true);
        }, 600);
      }
    } else {
      setIsOffline(true);
    }
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-slate-50 overflow-y-auto no-scrollbar"
    >
      {/* Header Image */}
      <div className="h-64 bg-gradient-urban relative">
        <div className="absolute top-12 left-6 right-6 flex justify-between items-center z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
            <ChevronLeft size={20} />
          </button>
          
          {/* Offline Mode Controller (FR-15) */}
          <div className="flex gap-2">
            <button 
              onClick={handleToggleOffline}
              className={cn(
                "px-3 py-1.5 rounded-full flex items-center gap-1 text-xs font-bold transition-all border",
                isOffline 
                  ? "bg-amber-500 text-white border-amber-600 shadow-md"
                  : "bg-white/20 backdrop-blur-md text-white border-white/20 hover:bg-white/30"
              )}
            >
              {isOffline ? <WifiOff size={12}/> : <RefreshCw size={12}/>}
              {isOffline ? "Ngoại tuyến" : "Trực tuyến"}
            </button>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white">
              <Sparkles size={14} className="text-yellow-300" />
              <span className="text-xs font-bold">AI Tạo</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 text-left">
          {/* Edit Trip Name inline */}
          {isEditingName ? (
            <div className="flex gap-2 items-center mb-2">
              <input 
                type="text" 
                value={tripNameInput}
                onChange={e => setTripNameInput(e.target.value)}
                className="bg-white text-slate-800 font-bold text-lg px-3 py-1 rounded-xl outline-none"
              />
              <button 
                onClick={() => {
                  setIsEditingName(false);
                  if (tripNameInput.trim()) {
                    trip.name = tripNameInput.trim();
                    if (isOffline) {
                      setHasUnsyncedChanges(true);
                    }
                  }
                }}
                className="bg-indigo-600 text-white p-2 rounded-xl"
              >
                <Check size={16}/>
              </button>
            </div>
          ) : (
            <h1 className="text-3xl font-black text-white leading-tight mb-2 tracking-tight truncate flex items-center gap-2">
              {trip.name} 
              <button 
                onClick={() => {
                  setTripNameInput(trip.name);
                  setIsEditingName(true);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <Edit3 size={16}/>
              </button>
            </h1>
          )}
          <div className="flex gap-3 text-white/90 text-sm font-medium">
            <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm"><Calendar size={14} /> {trip.days} ngày</span>
            <span className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg backdrop-blur-sm"><MapPin size={14} /> {trip.location}</span>
          </div>
        </div>
      </div>

      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-amber-800 text-[10px] font-bold text-left">
          <WifiOff size={14}/> Thiết bị đang ngoại tuyến. Mọi chỉnh sửa của bạn sẽ được lưu tạm thời.
        </div>
      )}

      <div className="p-6 pb-24">
        {/* Collaboration info */}
        <div className="bg-white rounded-2xl p-4 mb-8 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex -space-x-3">
             <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=A" className="rounded-full" alt="user"/></div>
             <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white"><img src="https://api.dicebear.com/7.x/notionists/svg?seed=B" className="rounded-full" alt="user"/></div>
             <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white flex items-center justify-center border-dashed border-slate-300 text-slate-400"><PlusSquare size={16}/></div>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert("Đã sao chép link mời bạn bè!");
            }}
            className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl active:scale-95 transition-transform"
          >
            Mời bạn bè
          </button>
        </div>

        {/* View Mode Selector (FR-15) */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setViewMode('all')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              viewMode === 'all' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Users size={14}/> Chế độ Nhóm
          </button>
          <button 
            onClick={() => setViewMode('personal')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
              viewMode === 'personal' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Layers size={14}/> Ý kiến Cá nhân
          </button>
        </div>

        {/* Itinerary */}
        <div className="space-y-8">
          {trip.itinerary?.length === 0 && <p className="text-slate-500 text-sm text-center">Chưa có lịch trình.</p>}
          {trip.itinerary?.map((day, idx) => {
            const displayedItems = viewMode === 'personal'
              ? day.items.filter((_, i) => i % 2 === 0) // Mock: show subset of edits for personal view
              : day.items;

            return (
              <div key={idx}>
                <div className="flex items-end justify-between mb-4">
                  <div className="text-left">
                    <h3 className="font-black text-slate-900 text-xl tracking-tight">Ngày {day.day}</h3>
                    <p className="text-sm font-medium text-slate-500">{day.title}</p>
                  </div>
                </div>

                <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:left-[11px] before:-z-10 before:w-[2px] before:bg-slate-200">
                  {displayedItems.map((item, i) => (
                    <div key={i} className="relative flex gap-4 items-start">
                      <div className="absolute -left-[29px] top-1 w-[14px] h-[14px] rounded-full bg-white border-[3px] border-indigo-600" />
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1 text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{item.time}</span>
                          {item.type === 'food' && <Camera size={14} className="text-slate-400" />}
                          {item.type === 'activity' && <MapPin size={14} className="text-slate-400" />}
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{item.act}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 w-full sm:w-[414px] bg-white/80 backdrop-blur-xl border-t border-slate-100 p-4 px-6 flex items-center gap-3 z-50">
        <button onClick={() => setIsGuideMode(true)} className="flex-1 bg-slate-900 text-white font-bold rounded-2xl py-4 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform">
          Bắt đầu chuyến đi
        </button>
        <button className="w-14 h-[56px] flex items-center justify-center bg-slate-100 text-slate-600 rounded-2xl font-bold active:scale-95 transition-transform"><SlidersHorizontal size={20}/></button>
      </div>

      <AnimatePresence>
        {isGuideMode && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 sm:w-[414px] mx-auto z-[60] bg-white flex flex-col"
          >
            <div className="bg-slate-900 text-white p-6 pt-12 pb-8 rounded-b-[40px] shadow-lg relative shrink-0">
               <button onClick={() => setIsGuideMode(false)} className="absolute top-12 left-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
                 <ChevronLeft size={20} />
               </button>
               <div className="text-center mt-2 mb-6">
                 <span className="bg-indigo-500/30 text-indigo-100 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-400/30">
                   Đang dẫn đường
                 </span>
               </div>
               <div className="text-center">
                 <h2 className="text-2xl font-black mb-1">Tham quan Hoàng Cung</h2>
                 <p className="text-white/60 text-sm font-medium">Bắt đầu lúc 10:30 (Còn 15 phút nữa)</p>
               </div>
               
               <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center border-4 border-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all text-white" onClick={() => setShowIncident(true)}>
                  <Navigation size={18} className="ml-0.5" />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pt-10 px-6 pb-24 bg-slate-50 relative">
               <h3 className="font-bold text-slate-900 text-lg mb-4">Các điểm tiếp theo</h3>
               <div className="space-y-4">
                 <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm opacity-60">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-xs font-bold text-slate-500">12:30</span>
                   </div>
                   <h4 className="font-bold text-slate-600 text-sm">Ăn trưa tại nhà hàng địa phương</h4>
                 </div>
                 <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm opacity-60">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-xs font-bold text-slate-500">15:00</span>
                   </div>
                   <h4 className="font-bold text-slate-600 text-sm">Thư giãn tại spa</h4>
                 </div>
               </div>

               {/* Simulated Map */}
               <div className="mt-8 relative h-48 bg-slate-200 rounded-[24px] overflow-hidden border border-slate-100 mix-blend-multiply">
                 <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />
                 <div className="absolute top-1/2 left-1/4 w-1/2 h-1 bg-indigo-600/40 rotate-12 origin-left" />
                 <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-indigo-600 rounded-full border-2 border-white shadow-sm -translate-y-1.5 -translate-x-2" />
                 <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm" />
               </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Incident Modal (FR-03: Thay thế thông minh khi sự cố) */}
      <AnimatePresence>
        {showIncident && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center p-0 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={() => setShowIncident(false)}
             />
             <motion.div 
               initial={{ y: '100%', scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.9 }}
               className="bg-white w-full sm:w-[380px] rounded-t-[40px] sm:rounded-[40px] p-6 relative z-10 shadow-2xl overflow-hidden"
             >
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-rose-500" />
               
               <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mb-6 border-4 border-orange-100">
                 <AlertTriangle size={32} />
               </div>
               
               <h3 className="font-black text-2xl text-slate-900 mb-2 leading-tight">Hoàng Cung hiện đang quá tải</h3>
               <p className="text-slate-600 text-sm font-medium mb-8 leading-relaxed">
                 Thời gian xếp hàng dự kiến hơn 45 phút. Điều này sẽ làm lỡ bữa trưa của bạn vào 12:30.
               </p>

               <div className="bg-slate-50 border border-slate-100 rounded-3xl p-5 mb-8">
                 <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-200 pb-3">Đề xuất thay thế</h4>
                 <div className="flex gap-4 items-center">
                   <div className="w-16 h-16 rounded-2xl bg-gradient-nature shrink-0" />
                   <div>
                     <h5 className="font-bold text-slate-900 leading-tight">Bảo tàng Lịch sử (Cách 500m)</h5>
                     <p className="text-xs text-slate-500 mt-1.5 font-medium flex items-center gap-1"><Sparkles size={10} className="text-yellow-500"/>Đang khá rảnh, hợp với gu của bạn</p>
                   </div>
                 </div>
               </div>

               <div className="flex gap-3">
                 <button onClick={() => setShowIncident(false)} className="flex-1 bg-slate-100 text-slate-600 font-bold rounded-2xl py-4 active:scale-95 transition-transform tracking-wide text-sm">
                   Bỏ qua
                 </button>
                 <button onClick={() => {
                   setShowIncident(false);
                   setIsGuideMode(false);
                   alert('Đã cập nhật lịch trình sang Bảo tàng Lịch sử. Version mới: Plan_v1.1');
                 }} className="flex-[2] bg-slate-900 text-white font-bold rounded-2xl py-4 shadow-lg shadow-slate-900/20 active:scale-95 transition-transform tracking-wide text-sm flex items-center justify-center gap-2">
                   Cập nhật lịch trình <ArrowRight size={16}/>
                 </button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Conflict Resolution Modal (FR-15, FR-16) */}
      <AnimatePresence>
        {showConflictModal && (
          <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center p-0 sm:p-4">
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               onClick={() => setShowConflictModal(false)}
             />
             <motion.div 
               initial={{ y: '100%', scale: 0.9 }} animate={{ y: 0, scale: 1 }} exit={{ y: '100%', scale: 0.9 }}
               className="bg-white w-full sm:w-[380px] rounded-t-[40px] sm:rounded-[40px] p-6 relative z-10 shadow-2xl text-left"
             >
               <div className="flex items-center gap-3 mb-4 text-orange-600">
                 <AlertTriangle size={24} />
                 <h3 className="font-black text-xl text-slate-900 leading-none">Xung đột đồng bộ</h3>
               </div>
               <p className="text-slate-600 text-xs font-semibold leading-relaxed mb-6">
                 Dữ liệu trên máy chủ đã được thay đổi bởi một thành viên khác trong khi bạn đang ngoại tuyến. Vui lòng chọn phiên bản muốn giữ lại.
               </p>

               <div className="space-y-3 mb-6">
                 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bản sửa của bạn (Local)</div>
                   <div className="font-bold text-slate-800 text-sm">{trip.name}</div>
                   <p className="text-[10px] text-slate-400 font-medium mt-1">Được lưu trên trình duyệt của bạn</p>
                 </div>

                 <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                   <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Bản trên Máy chủ (Server)</div>
                   <div className="font-bold text-slate-800 text-sm">Chuyến đi Huế & Đà Nẵng (Shared)</div>
                   <p className="text-[10px] text-indigo-400 font-medium mt-1">Người dùng khác đã lưu 2 phút trước</p>
                 </div>
               </div>

               <div className="flex gap-3">
                 <button 
                   onClick={() => {
                     setHasUnsyncedChanges(false);
                     setShowConflictModal(false);
                     alert("Đã đồng bộ thành công! Giữ nguyên bản sửa của bạn.");
                   }}
                   className="flex-1 bg-slate-900 text-white text-xs font-bold rounded-xl py-3 active:scale-95 transition-all"
                 >
                   Giữ bản của Tôi
                 </button>
                 <button 
                   onClick={() => {
                     trip.name = "Chuyến đi Huế & Đà Nẵng (Shared)";
                     setHasUnsyncedChanges(false);
                     setShowConflictModal(false);
                     alert("Đã đồng bộ thành công! Ghi đè bằng bản trên Máy chủ.");
                   }}
                   className="flex-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl py-3 active:scale-95 transition-all"
                 >
                   Lấy bản Máy chủ
                 </button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
