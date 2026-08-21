import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Clock, ShieldCheck, AlertCircle, RefreshCw, MessageSquare, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

export default function CaseTracking() {
  const navigate = useNavigate();
  const { cases, reloadCases } = useAppContext();
  const [filter, setFilter] = useState<'active' | 'resolved'>('active');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

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

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-slate-50 overflow-y-auto no-scrollbar pb-32"
    >
      <div className="pt-12 px-6 pb-4 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-left">
          <h2 className="text-lg font-black text-slate-900 leading-none">Báo cáo & Phản hồi (SLA)</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Cam kết xử lý nhanh chóng trong 4 giờ</p>
        </div>
        <button 
          onClick={reloadCases}
          className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 active:rotate-180 transition-transform"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="p-6">
        {/* Toggle Filters */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <button 
            onClick={() => setFilter('active')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
              filter === 'active' ? "bg-slate-900 text-white" : "text-slate-500"
            )}
          >
            Đang xử lý ({activeCases.length})
          </button>
          <button 
            onClick={() => setFilter('resolved')}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold transition-all",
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
              const isExpanded = expandedCaseId === c.id;
              return (
                <div 
                  key={c.id} 
                  className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden transition-all"
                >
                  <div 
                    onClick={() => setExpandedCaseId(isExpanded ? null : c.id)}
                    className="p-5 cursor-pointer flex flex-col gap-3 text-left"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block mb-1">#{c.id}</span>
                        <h4 className="font-black text-slate-900 text-sm leading-tight">{c.poiTitle}</h4>
                      </div>
                      <div className="shrink-0">{getStatusBadge(c.status)}</div>
                    </div>

                    <div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                      <span className="text-[11px] text-slate-500 font-bold">Vấn đề: <span className="text-slate-800 font-black">{c.reportType}</span></span>
                      {c.status !== 'resolved' && c.status !== 'rejected' && getSLATimer(c.createdAt)}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 bg-slate-50/20 border-t border-slate-50 text-left">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Lịch sử xử lý (Audit trail)</div>
                      <div className="relative pl-4 space-y-4 before:absolute before:left-1 before:top-1.5 before:bottom-1.5 before:w-0.5 before:bg-slate-200">
                        {c.logs && c.logs.map((log: any, idx: number) => (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[15px] top-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                            <div className="text-[11px] text-slate-400 font-medium">{log.time}</div>
                            <div className="text-xs text-slate-700 font-semibold mt-0.5">{log.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
