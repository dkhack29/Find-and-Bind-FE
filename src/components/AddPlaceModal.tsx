import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MapPin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function AddPlaceModal({ onClose }: { onClose: () => void }) {
  const { addPlace } = useAppContext();
  const [formData, setFormData] = useState({
    title: "", tag: "Nhà hàng", location: "", description: "", price: "Liên hệ"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPlace({
      ...formData,
      imageClass: "bg-gradient-mesh", // Default mockup
      reasons: ["Địa điểm mới từ đối tác", "Ưu đãi ra mắt"],
      ownerId: 'merchant_1'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        className="bg-white w-full sm:w-[380px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl h-[85vh] sm:h-auto overflow-y-auto no-scrollbar"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-xl text-slate-900">Thêm Cơ Sở Mới</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-500"><X size={18}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Tên địa điểm / Cơ sở</label>
            <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-sm" placeholder="VD: The Local Coffee" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Phân loại</label>
            <select value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-sm appearance-none cursor-pointer">
              <option>Nhà hàng</option><option>Khách sạn</option><option>Quán Cafe</option><option>Dịch vụ giải trí</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Vị trí</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-9 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-sm" placeholder="Hà Nội, Việt Nam" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Giới thiệu ngắn</label>
            <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-rose-500 outline-none font-medium text-sm h-24 resize-none" placeholder="Mô tả điểm nổi bật của cơ sở..."></textarea>
          </div>
          <div className="pt-4">
            <button type="submit" className="w-full bg-rose-600 text-white font-bold rounded-2xl py-4 shadow-lg shadow-rose-600/20 active:scale-95 transition-transform">
              Đăng lên hệ thống
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
