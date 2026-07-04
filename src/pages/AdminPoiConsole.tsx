import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Database, AlertCircle, CheckCircle, Tag, Settings, Plus, Trash } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

export default function AdminPoiConsole() {
  const navigate = useNavigate();
  const { places, role, updatePlaceTag } = useAppContext();
  const [editingPlaceId, setEditingPlaceId] = useState<number | null>(null);
  const [newTagVal, setNewTagVal] = useState('');

  // Safe Guard check for Role
  if (role !== 'admin') {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 z-40 bg-slate-50 flex items-center justify-center p-6 text-center"
      >
        <div className="bg-white p-8 rounded-[32px] shadow-soft border border-slate-100 max-w-sm">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 mb-2">Quyền truy cập bị từ chối</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
            Trang này chỉ dành cho Admin quản trị hệ thống dữ liệu POI. Vui lòng chuyển vai trò sang "Admin" bằng công cụ Role Switcher.
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

  // A helper function to check if POI last verification exceeds 30 days (FR-26)
  // Let's assume some mock dates for the places.
  const isStale = (placeId: number) => {
    // Mocking: Place 1 & 3 are verified recently, Place 2, 4 & 5 are stale (> 30 days)
    return placeId === 2 || placeId === 4 || placeId === 5; 
  };

  const handleSaveTag = (placeId: number) => {
    if (newTagVal.trim()) {
      updatePlaceTag(placeId, newTagVal.trim());
      setEditingPlaceId(null);
      setNewTagVal('');
      alert("Đã cập nhật danh mục phân loại POI thành công!");
    }
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
          <h2 className="text-lg font-black text-slate-900 leading-none">Quản trị POI & Data</h2>
          <p className="text-[10px] text-slate-400 font-semibold mt-1">Dành cho Admin - Quản lý phân loại & Cập nhật dữ liệu</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center"><Database size={16}/></div>
      </div>

      <div className="p-6 space-y-6">
        {/* Statistics or Status */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm text-left">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-3">Tình trạng cơ sở dữ liệu</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold">Tổng số POIs</span>
              <span className="text-xl font-black text-slate-800">{places.length}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-bold">POI bị lỗi thời (&gt;30d)</span>
              <span className="text-xl font-black text-rose-500">1</span>
            </div>
          </div>
        </div>

        {/* POI List */}
        <div>
          <h3 className="font-bold text-base text-slate-900 mb-3 text-left">Danh sách Điểm dữ liệu (POI)</h3>
          <div className="space-y-4">
            {places.map(p => {
              const stale = isStale(p.id);
              const isEditing = editingPlaceId === p.id;
              
              return (
                <div key={p.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm space-y-4 text-left">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm leading-snug">{p.title}</h4>
                      <p className="text-xs text-slate-500 font-medium">{p.location}</p>
                    </div>
                    {stale ? (
                      <span className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        <AlertCircle size={10} /> Quá hạn cập nhật
                      </span>
                    ) : (
                      <span className="bg-green-50 text-green-700 border border-green-100 text-[9px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shrink-0">
                        <CheckCircle size={10} /> Đã kiểm chứng
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl">
                    <Tag size={12} className="text-slate-400" />
                    <span className="text-[11px] font-bold text-slate-500">
                      Phân loại: <span className="text-indigo-600 font-black">{p.tag}</span>
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2 pt-2 border-t border-slate-50">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Danh mục phân loại mới</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="e.g. Bãi biển, Mua sắm..." 
                          value={newTagVal} 
                          onChange={e => setNewTagVal(e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button 
                          onClick={() => handleSaveTag(p.id)}
                          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs active:scale-95"
                        >
                          Lưu
                        </button>
                        <button 
                          onClick={() => {
                            setEditingPlaceId(null);
                            setNewTagVal('');
                          }}
                          className="px-3 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      <button 
                        onClick={() => {
                          setEditingPlaceId(p.id);
                          setNewTagVal(p.tag);
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        <Settings size={12} /> Sửa Phân loại
                      </button>
                      <button 
                        onClick={() => {
                          alert(`Đã gửi yêu cầu khảo sát hiện trạng thực tế đối với địa điểm: ${p.title}. Đang kích hoạt điều động cộng tác viên.`);
                        }}
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 active:scale-95 transition-all"
                      >
                        Kích hoạt Xác minh
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
