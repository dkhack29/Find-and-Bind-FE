import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, MapPin, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { locationService } from '@/services/location/locationApi';
import { getAccessToken } from '@/helper/callApi';

export default function AddPlaceModal({ onClose }: { onClose: () => void }) {
  const { addPlace, categories, refreshPlaces } = useAppContext();
  const [formData, setFormData] = useState({
    title: "", 
    categoryId: categories.length > 0 ? categories[0].id : 1,
    location: "", 
    description: "", 
    price: "Liên hệ"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const token = getAccessToken();
    const selectedCat = categories.find(c => c.id === Number(formData.categoryId));
    const catName = selectedCat?.name || "Địa điểm";

    let createdOnServer = false;

    if (token) {
      try {
        const res = await locationService.create({
          name: formData.title.trim(),
          description: formData.description.trim(),
          address: formData.location.trim(),
          categoryId: Number(formData.categoryId)
        });

        if (res && (res.success || res.data)) {
          createdOnServer = true;
          setSuccessMsg('Đã đăng ký địa điểm thành công lên hệ thống!');
          await refreshPlaces();
        }
      } catch (err: any) {
        console.warn('Create location API error, falling back to local store:', err);
      }
    }

    if (!createdOnServer) {
      // Local fallback in context
      addPlace({
        title: formData.title,
        tag: catName,
        location: formData.location,
        description: formData.description,
        price: formData.price,
        imageClass: "bg-gradient-mesh",
        reasons: ["Địa điểm mới từ đối tác", "Ưu đãi ra mắt"],
        categoryId: Number(formData.categoryId),
        categoryName: catName,
        ownerId: 'merchant_1'
      });
      setSuccessMsg('Địa điểm đã được thêm vào danh sách quản lý!');
    }

    setIsSubmitting(false);
    setTimeout(() => {
      onClose();
    }, 1200);
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
        className="bg-white w-full sm:w-[420px] rounded-t-[32px] sm:rounded-[32px] p-6 relative z-10 shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900 leading-tight">Thêm Cơ Sở Mới</h3>
              <p className="text-[11px] text-slate-400 font-medium">Đăng ký địa điểm vào hệ thống du lịch</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={18}/>
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Tên địa điểm / Cơ sở <span className="text-rose-500">*</span>
            </label>
            <input 
              required 
              type="text" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-semibold text-sm transition-all text-slate-800" 
              placeholder="VD: Nhà hàng Cơm Niêu Hội An" 
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Phân loại danh mục <span className="text-rose-500">*</span>
            </label>
            <select 
              value={formData.categoryId} 
              onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-semibold text-sm cursor-pointer transition-all text-slate-800"
            >
              {categories.length > 0 ? (
                categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))
              ) : (
                <>
                  <option value={1}>Nhà hàng & Ẩm thực</option>
                  <option value={2}>Khách sạn & Resort</option>
                  <option value={3}>Quán Cafe & Trà</option>
                  <option value={4}>Danh lam & Danh thắng</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Địa chỉ cụ thể <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input 
                required 
                type="text" 
                value={formData.location} 
                onChange={e => setFormData({...formData, location: e.target.value})} 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-semibold text-sm transition-all text-slate-800" 
                placeholder="VD: 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. HCM" 
              />
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Hệ thống sẽ tự động định vị GPS (kinh độ / vĩ độ) dựa trên địa chỉ này</p>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Mô tả chi tiết
            </label>
            <textarea 
              required 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium text-sm h-22 resize-none transition-all text-slate-800" 
              placeholder="Mô tả không gian, dịch vụ nổi bật, thực đơn hoặc tiện ích của cơ sở..."
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting || !!successMsg}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-2xl py-3.5 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Đang đăng ký lên máy chủ...</span>
                </>
              ) : (
                <span>Đăng lên hệ thống</span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
