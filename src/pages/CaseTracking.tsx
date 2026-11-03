import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Clock, ShieldCheck, AlertCircle, RefreshCw, 
  MessageSquare, CheckCircle, XCircle, Camera, Eye, X, 
  ChevronRight, MapPin, Calendar, FileText, CheckSquare, ZoomIn 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext, Case } from '../context/AppContext';
import { cn } from '../App';

export default function CaseTracking() {
  const navigate = useNavigate();
  const { cases } = useAppContext();
  const [filter, setFilter] = useState<'active' | 'resolved'>('active');
  const [selectedDetailCase, setSelectedDetailCase] = useState<Case | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Swipe-to-back gesture
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 75) {
      if (selectedDetailCase) {
        setSelectedDetailCase(null);
      } else {
        navigate('/profile');
      }
    }
    setTouchStartX(null);
  };

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCases = cases.filter(c => c.status === 'pending' || c.status === 'processing');
  const resolvedCases = cases.filter(c => c.status === 'resolved' || c.status === 'rejected');
  const displayedCases = filter === 'active' ? activeCases : resolvedCases;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
            Đang chờ tiếp nhận
          </span>
        );
      case 'processing':
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
            Đang xử lý
          </span>
        );
      case 'resolved':
        return (
          <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1">
            <CheckCircle size={10} /> Đã giải quyết
          </span>
        );
      case 'rejected':
        return (
          <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1">
            <XCircle size={10} /> Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const getSLATimer = (createdAtStr: string) => {
    const created = new Date(createdAtStr);
    const limit = new Date(created.getTime() + 4 * 60 * 60 * 1000); // 4 hours SLA
    const diff = limit.getTime() - now.getTime();

    if (diff <= 0) {
      return (
        <span className="text-red-600 font-extrabold text-[11px] flex items-center gap-1">
          <AlertCircle size={12} /> Quá hạn xử lý (SLA)
        </span>
      );
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    return (
      <span className="text-indigo-600 font-extrabold text-[11px] flex items-center gap-1">
        <Clock size={12} /> SLA còn lại: {hours}h {mins}m {secs}s
      </span>
    );
  };

  const FALLBACK_RECEIPT_IMG = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f1f5f9"/><rect x="40" y="30" width="320" height="240" rx="16" fill="white" stroke="%23cbd5e1" stroke-width="2"/><circle cx="80" cy="70" r="16" fill="%23e0e7ff"/><path d="M72 70l6 6 12-12" stroke="%234f46e5" stroke-width="3" fill="none"/><text x="110" y="75" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b">HÓA ĐƠN ĐỐI SOÁT SLA</text><line x1="60" y1="105" x2="340" y2="105" stroke="%23e2e8f0" stroke-width="2" stroke-dasharray="4"/><text x="60" y="140" font-family="sans-serif" font-size="12" fill="%2364748b">Mã chứng từ: %23RP-EVIDENCE</text><text x="60" y="170" font-family="sans-serif" font-size="12" fill="%2364748b">Định vị GPS: [10.7719, 106.6983]</text><rect x="60" y="195" width="280" height="40" rx="8" fill="%23f8fafc" stroke="%23e2e8f0"/><text x="80" y="220" font-family="sans-serif" font-size="12" font-weight="bold" fill="%234f46e5">Bằng chứng đã đối soát tự động</text></svg>';

  // Safe fallback evidence image
  const getEvidenceSrc = (c: Case) => {
    if (c.evidenceUrl) return c.evidenceUrl;
    if (c.reportType.includes('Giá')) {
      return 'https://images.unsplash.com/photo-1554415707-9e49fa664822?w=500&auto=format&fit=crop&q=80';
    }
    if (c.reportType.includes('Đóng cửa') || c.reportType.includes('giờ')) {
      return 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=500&auto=format&fit=crop&q=80';
    }
    return 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=500&auto=format&fit=crop&q=80';
  };

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} 
      className="absolute inset-0 z-40 bg-slate-50 overflow-y-auto no-scrollbar pb-32"
    >
      {/* Header */}
      <div className="pt-12 px-6 pb-4 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/profile')}
          className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 active:scale-95 transition-transform cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-left">
          <h2 className="text-lg font-black text-slate-900 leading-none">Báo cáo & Phản hồi (SLA)</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Cam kết xử lý nhanh chóng trong 4 giờ</p>
        </div>
      </div>

      <div className="p-6">
        {/* Toggle Filters */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <button 
            onClick={() => setFilter('active')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              filter === 'active' ? "bg-slate-900 text-white" : "text-slate-500"
            )}
          >
            Đang xử lý ({activeCases.length})
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              filter === 'resolved' ? "bg-slate-900 text-white" : "text-slate-500"
            )}
          >
            Đã giải quyết ({resolvedCases.length})
          </button>
        </div>

        {/* Cases List */}
        {displayedCases.length === 0 ? (
          <div className="bg-white rounded-[32px] p-8 text-center border border-slate-100 shadow-sm mt-8">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4 border border-slate-100">
              <MessageSquare size={28} />
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-1">Chưa có báo cáo nào</h4>
            <p className="text-xs text-slate-400 font-medium">Báo cáo lỗi thông tin hoặc chặt chém tại trang Chi tiết địa điểm.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedCases.map(c => {
              const evidenceSrc = getEvidenceSrc(c);
              return (
                <div 
                  key={c.id} 
                  onClick={() => setSelectedDetailCase(c)}
                  className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden hover:border-indigo-300 transition-all cursor-pointer p-4 flex gap-3.5 items-center text-left group"
                >
                  {/* Left Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-wider">
                        #{c.id}
                      </span>
                      <div className="shrink-0">{getStatusBadge(c.status)}</div>
                    </div>

                    <h4 className="font-black text-slate-900 text-sm leading-tight truncate mb-2 group-hover:text-indigo-600 transition-colors">
                      {c.poiTitle}
                    </h4>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex flex-col gap-1 text-[11px]">
                      <span className="text-slate-500 font-semibold truncate">
                        Vấn đề: <span className="text-slate-800 font-extrabold">{c.reportType}</span>
                      </span>
                      {c.status !== 'resolved' && c.status !== 'rejected' && (
                        <div className="mt-0.5">
                          {getSLATimer(c.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Thumbnail */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-100">
                      <img 
                        src={evidenceSrc} 
                        alt="Bằng chứng" 
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_RECEIPT_IMG; }}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye size={16} className="text-white drop-shadow" />
                      </div>
                      <div className="absolute bottom-1 right-1 bg-black/60 text-[8px] font-bold text-white px-1 py-0.5 rounded">
                        Ảnh
                      </div>
                    </div>
                    <span className="text-[9px] text-indigo-600 font-bold flex items-center gap-0.5">
                      Xem chi tiết <ChevronRight size={10} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Case & Evidence Modal */}
      <AnimatePresence>
        {selectedDetailCase && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDetailCase(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl max-h-[88vh] flex flex-col text-left"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base leading-none">
                      Chi tiết Báo cáo & Bằng chứng
                    </h3>
                    <span className="text-[10px] text-indigo-600 font-extrabold uppercase mt-1 block">
                      Case #{selectedDetailCase.id}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDetailCase(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-4">
                {/* Status and SLA card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Trạng thái xử lý</span>
                    {getStatusBadge(selectedDetailCase.status)}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cam kết SLA (4 Giờ)</span>
                    {getSLATimer(selectedDetailCase.createdAt)}
                  </div>
                </div>

                {/* Case Info */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-bold">Địa điểm:</span>
                    <span className="font-extrabold text-slate-900 text-sm">{selectedDetailCase.poiTitle}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-bold">Vấn đề phản ánh:</span>
                    <span className="font-black text-red-600">{selectedDetailCase.reportType}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-50">
                    <span className="text-slate-400 font-bold">Thời gian gửi:</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(selectedDetailCase.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 font-bold">Tọa độ GPS ghi nhận:</span>
                    <span className="font-mono text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      [{selectedDetailCase.lat?.toFixed(4) ?? '10.7719'}, {selectedDetailCase.lon?.toFixed(4) ?? '106.6983'}]
                    </span>
                  </div>
                </div>

                {/* Evidence Image Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera size={14} className="text-indigo-600" />
                      Hình ảnh bằng chứng / Hóa đơn
                    </h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckSquare size={10} /> Đã xác thực
                    </span>
                  </div>

                  <div 
                    onClick={() => setFullscreenImage(getEvidenceSrc(selectedDetailCase))}
                    className="relative w-full h-48 rounded-2xl overflow-hidden border-2 border-indigo-100 bg-slate-100 cursor-pointer group shadow-sm"
                  >
                    <img 
                      src={getEvidenceSrc(selectedDetailCase)} 
                      alt="Bằng chứng chi tiết" 
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_RECEIPT_IMG; }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-xs">
                      <ZoomIn size={18} /> Bấm để phóng to ảnh
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
                      Bằng chứng đính kèm vụ việc
                    </div>
                  </div>
                </div>

                {/* Audit Trail */}
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Clock size={14} className="text-indigo-600" />
                    Lịch sử xử lý vụ việc
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="relative pl-4 space-y-3.5 before:absolute before:left-1 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-indigo-200">
                      {(selectedDetailCase.logs && selectedDetailCase.logs.length > 0) ? (
                        selectedDetailCase.logs.map((log: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[15px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                            <div className="text-[10px] text-slate-400 font-bold">{log.time}</div>
                            <div className="text-xs text-slate-700 font-semibold mt-0.5">{log.message}</div>
                          </div>
                        ))
                      ) : (
                        <div className="relative">
                          <div className="absolute -left-[15px] top-1.5 w-2 h-2 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                          <div className="text-[10px] text-slate-400 font-bold">
                            {new Date(selectedDetailCase.createdAt).toLocaleString('vi-VN')}
                          </div>
                          <div className="text-xs text-slate-700 font-semibold mt-0.5">
                            Báo cáo đã được tiếp nhận và đưa vào hàng chờ thẩm tra SLA.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 shrink-0">
                <button 
                  onClick={() => setSelectedDetailCase(null)}
                  className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-2xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-slate-900/10"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fullscreen Image Preview Lightbox */}
      <AnimatePresence>
        {fullscreenImage && (
          <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
            <button 
              onClick={() => setFullscreenImage(null)}
              className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <img 
              src={fullscreenImage} 
              alt="Bằng chứng đầy đủ" 
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" 
            />
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
