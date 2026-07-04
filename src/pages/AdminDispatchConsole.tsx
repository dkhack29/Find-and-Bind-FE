import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Check, X, ShieldAlert, FileText, ClipboardList, Scale, DollarSign, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

const REASON_CODES = [
  { code: 'INF-01', label: 'Sai thông tin hoạt động (Giờ/Địa chỉ)' },
  { code: 'PRC-02', label: 'Chặt chém / Phụ thu bất thường' },
  { code: 'SCM-03', label: 'Địa điểm ảo / Không tồn tại' },
  { code: 'SPM-04', label: 'PR rác / Spam đánh giá ảo' },
  { code: 'OTH-99', label: 'Khác (Ghi chú chi tiết)' }
];

export default function AdminDispatchConsole() {
  const navigate = useNavigate();
  const { cases, updateCaseStatus, role, appeals, updateAppealStatus, places } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'reports' | 'appeals'>('reports');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showActionModal, setShowActionModal] = useState<'resolve' | 'reject' | null>(null);
  const [selectedReasonCode, setSelectedReasonCode] = useState('INF-01');
  const [customNote, setCustomNote] = useState('');

  // Phase 1 Appeal Detail State
  const [selectedAppealId, setSelectedAppealId] = useState<string | null>(null);
  const [appealChecklist, setAppealChecklist] = useState<boolean[]>([false, false, false, false]);

  const activeCases = cases.filter(c => c.status === 'pending' || c.status === 'processing');
  const resolvedCases = cases.filter(c => c.status === 'resolved' || c.status === 'rejected');
  
  const pendingAppeals = appeals.filter(ap => ap.status === 'step4_pending');
  const processedAppeals = appeals.filter(ap => ap.status === 'approved' || ap.status === 'rejected');

  const handleActionSubmit = () => {
    if (!selectedCaseId || !showActionModal) return;
    
    const finalStatus = showActionModal === 'resolve' ? 'resolved' : 'rejected';
    const reasonText = showActionModal === 'resolve' 
      ? `Chấp nhận báo cáo. Mã lỗi: ${selectedReasonCode}. Chi tiết: ${customNote || 'N/A'}`
      : `Từ chối báo cáo. Lý do: ${customNote || 'Không đủ bằng chứng hoặc sai lệch thực tế'}`;
    
    updateCaseStatus(selectedCaseId, finalStatus, reasonText);
    
    setShowActionModal(null);
    setSelectedCaseId(null);
    setCustomNote('');
    alert("Đã cập nhật trạng thái Case và lưu nhật ký điều phối thành công!");
  };

  const handleVerifyChecklist = (index: number) => {
    setAppealChecklist(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const handleProcessAppeal = (status: 'approved' | 'rejected') => {
    if (!selectedAppealId) return;
    
    // Call Context action
    updateAppealStatus(selectedAppealId, status);
    
    setSelectedAppealId(null);
    setAppealChecklist([false, false, false, false]);
    alert(status === 'approved' 
      ? "Đã phê duyệt Kháng cáo thành công! Danh tiếng POI đã được khôi phục." 
      : "Đã từ chối đơn kháng cáo của Đối tác."
    );
  };

  if (role !== 'moderator' && role !== 'admin') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 z-40 bg-slate-50 flex items-center justify-center p-6 text-center"
      >
        <div className="bg-white p-8 rounded-[32px] shadow-soft border border-slate-100 max-w-sm">
          <ShieldAlert size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">Quyền truy cập bị từ chối</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
            Trang này chỉ dành cho Quản trị viên (Moderator/Admin). Vui lòng chuyển vai trò sang "Mod" hoặc "Admin" trong trang Cá nhân.
          </p>
          <button 
            onClick={() => navigate('/profile')}
            className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl text-xs active:scale-95 transition-all"
          >
            Đến trang Cá nhân
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-slate-50 overflow-y-auto no-scrollbar pb-32 text-left"
    >
      <div className="pt-12 px-6 pb-4 bg-white border-b border-slate-100 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={() => navigate('/profile')}
          className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-600 active:scale-95 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900 leading-none">Console Điều phối</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Dành cho Moderator - Quản lý Báo cáo & Kháng cáo</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center"><Shield size={16}/></div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 px-6 py-2 flex gap-4 shrink-0">
        <button 
          onClick={() => { setActiveTab('reports'); setSelectedAppealId(null); }}
          className={cn(
            "pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all",
            activeTab === 'reports' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"
          )}
        >
          Báo cáo vi phạm ({activeCases.length})
        </button>
        <button 
          onClick={() => { setActiveTab('appeals'); setSelectedAppealId(null); }}
          className={cn(
            "pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all",
            activeTab === 'appeals' ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400"
          )}
        >
          Đơn Kháng cáo ({pendingAppeals.length})
        </button>
      </div>

      <div className="p-6 space-y-6">
        
        {activeTab === 'reports' && (
          <>
            {/* Queue Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chờ xử lý</span>
                <span className="text-2xl font-black text-amber-600">{activeCases.length} Cases</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Đã xử lý</span>
                <span className="text-2xl font-black text-green-600">{resolvedCases.length} Cases</span>
              </div>
            </div>

            {/* Case Queue */}
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-3">Danh sách báo cáo chờ duyệt</h3>
              {activeCases.length === 0 ? (
                <div className="bg-white p-8 rounded-[24px] border border-slate-100 text-center text-slate-500 text-sm font-medium shadow-sm">
                  Không có báo cáo nào đang chờ. Tất cả đều sạch!
                </div>
              ) : (
                <div className="space-y-3">
                  {activeCases.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div>
                          <span className="text-[9px] text-indigo-600 font-bold block">#{c.id}</span>
                          <h4 className="font-bold text-slate-800 text-xs leading-none mt-0.5">{c.poiTitle}</h4>
                        </div>
                        <span className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold mb-2">Vấn đề: <span className="text-rose-600 font-black">{c.reportType}</span></p>

                      {c.lat && c.lon && (
                        <div className="bg-slate-50 p-2 rounded-xl text-[10px] font-bold text-slate-500 mb-3 flex items-center gap-1.5">
                          <MapPin size={12} className="text-indigo-600" />
                          <span>Tọa độ GPS đính kèm: [{c.lat.toFixed(4)}, {c.lon.toFixed(4)}]</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setShowActionModal('resolve');
                          }}
                          className="flex-1 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm shadow-green-600/10 cursor-pointer"
                        >
                          <Check size={12} /> Chấp nhận
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCaseId(c.id);
                            setShowActionModal('reject');
                          }}
                          className="flex-1 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm shadow-red-600/10 cursor-pointer"
                        >
                          <X size={12} /> Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Logs (History of resolved) */}
            {resolvedCases.length > 0 && (
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-3">Lịch sử điều phối</h3>
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 space-y-3">
                  {resolvedCases.map(c => (
                    <div key={c.id} className="border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs text-slate-800">{c.poiTitle}</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                          c.status === 'resolved' ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"
                        )}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Báo cáo: {c.reportType}</p>
                      <div className="bg-slate-50 p-2 rounded-lg text-[10px] font-semibold text-slate-600 mt-2 leading-relaxed">
                        {c.logs?.[c.logs.length - 1]?.message || 'No action notes.'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Appeals Review (FR-32) */}
        {activeTab === 'appeals' && (
          <>
            <div>
              <h3 className="font-bold text-base text-slate-900 mb-3">Đơn Kháng cáo Đang Chờ</h3>
              {pendingAppeals.length === 0 ? (
                <div className="bg-white p-8 rounded-[24px] border border-slate-100 text-center text-slate-500 text-sm font-medium shadow-sm">
                  Không có đơn kháng cáo nào đang chờ duyệt.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAppeals.map(ap => {
                    const poi = places.find(p => p.id === ap.placeId);
                    return (
                      <div 
                        key={ap.id} 
                        onClick={() => setSelectedAppealId(ap.id)}
                        className={cn(
                          "bg-white rounded-2xl border p-4 shadow-sm cursor-pointer transition-all hover:border-indigo-300",
                          selectedAppealId === ap.id ? "border-indigo-500 ring-2 ring-indigo-50" : "border-slate-100"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="text-[9px] text-slate-400 font-bold">Mã Kháng cáo: {ap.id}</span>
                            <h4 className="font-black text-slate-800 text-sm leading-tight mt-0.5">{poi?.title}</h4>
                          </div>
                          <span className="bg-blue-50 text-blue-700 text-[8.5px] font-black uppercase px-2 py-0.5 rounded border border-blue-100">
                            Chờ Mod Phê Duyệt
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-bold mb-2">Liên quan Case ID: <span className="font-extrabold text-slate-700">{ap.caseId}</span></p>
                        
                        <div className="flex gap-4 text-[10px] text-slate-500 font-semibold mb-1">
                          <span className="flex items-center gap-0.5 text-green-600"><DollarSign size={10} /> Đã đóng lệ phí bảo lãnh</span>
                          <span className="flex items-center gap-0.5 text-slate-400"><FileText size={10} /> Có bằng chứng đối soát</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Appeal Detail Checklist Sheet (4-Step approval) */}
            {selectedAppealId && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-indigo-950 text-white p-5 rounded-[28px] border border-indigo-800 shadow-xl"
              >
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-indigo-900">
                  <h4 className="font-display font-black text-xs uppercase tracking-wider text-indigo-300">Quy trình thẩm định 4 bước (SLA)</h4>
                  <button onClick={() => setSelectedAppealId(null)} className="text-slate-400 hover:text-white"><X size={16} /></button>
                </div>

                {(() => {
                  const ap = appeals.find(a => a.id === selectedAppealId);
                  const poi = places.find(p => p.id === ap?.placeId);
                  return (
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-[11px] font-semibold space-y-1 text-indigo-200">
                        <div>POI Kháng nghị: <span className="font-black text-white">{poi?.title}</span></div>
                        <div>Lý do đối tác đưa ra: <span className="font-medium text-slate-200">"{ap?.evidence}"</span></div>
                      </div>

                      <div className="space-y-2.5">
                        {[
                          "Bước 1: Xác nhận nộp phí bảo lãnh (1,000,000đ đóng ký quỹ tại Wallet)",
                          "Bước 2: Xem xét hóa đơn/giấy phép đối chiếu và thông tin OCR CCCD",
                          "Bước 3: Xác minh chứng thư số định danh chữ ký điện tử VNPT",
                          "Bước 4: Đủ điều kiện bác bỏ báo cáo và khôi phục nhãn uy tín"
                        ].map((stepText, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleVerifyChecklist(idx)}
                            className={cn(
                              "w-full p-3 rounded-xl border text-left text-[11px] font-bold flex items-center gap-3 transition-colors cursor-pointer",
                              appealChecklist[idx] 
                                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300" 
                                : "bg-indigo-900/50 border-indigo-800 text-indigo-300"
                            )}
                          >
                            <div className={cn(
                              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
                              appealChecklist[idx] ? "bg-emerald-500 border-emerald-400 text-white" : "border-indigo-600"
                            )}>
                              {appealChecklist[idx] && <Check size={10} />}
                            </div>
                            <span>{stepText}</span>
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleProcessAppeal('approved')}
                          disabled={!appealChecklist.every(c => c)}
                          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Check size={14} /> Chấp nhận đơn
                        </button>
                        <button
                          onClick={() => handleProcessAppeal('rejected')}
                          className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <X size={14} /> Bác bỏ đơn
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* Appeal History */}
            {processedAppeals.length > 0 && (
              <div>
                <h3 className="font-bold text-base text-slate-900 mb-3">Lịch sử thẩm định kháng cáo</h3>
                <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 space-y-3">
                  {processedAppeals.map(ap => {
                    const poi = places.find(p => p.id === ap.placeId);
                    return (
                      <div key={ap.id} className="text-left border-b border-slate-50 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-slate-800">{poi?.title}</span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                            ap.status === 'approved' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          )}>
                            {ap.status === 'approved' ? 'Chấp nhận' : 'Bác bỏ'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">Case liên quan: {ap.caseId}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Decision Modal */}
      <AnimatePresence>
        {showActionModal && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowActionModal(null)}
            />
            <motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl text-left"
            >
              <h3 className="font-black text-lg text-slate-900 mb-4">
                {showActionModal === 'resolve' ? 'Quyết định Chấp nhận Báo cáo' : 'Quyết định Từ chối Báo cáo'}
              </h3>

              {showActionModal === 'resolve' && (
                <div className="mb-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Mã lỗi tiêu chuẩn (Reason Code)</label>
                  <select 
                    value={selectedReasonCode} 
                    onChange={e => setSelectedReasonCode(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {REASON_CODES.map(rc => (
                      <option key={rc.code} value={rc.code}>{rc.code} - {rc.label}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Ghi chú điều phối (Lưu vào nhật ký công khai)</label>
                <textarea 
                  rows={3}
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder={showActionModal === 'resolve' ? "Nhập chi tiết biện pháp xử lý hoặc cảnh báo..." : "Giải trình lý do từ chối..."}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={handleActionSubmit}
                  className="flex-1 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
                >
                  Xác nhận lưu
                </button>
                <button 
                  onClick={() => setShowActionModal(null)}
                  className="flex-1 py-3 bg-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-300 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Simple MapPin Icon component
function MapPin({ className, size }: { className?: string, size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
