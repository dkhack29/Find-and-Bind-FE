import React, { useState } from 'react';
import { Settings, User, Bell, Bookmark, ShieldCheck, MapPin, Plus, Store, Navigation, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../App';
import AddPlaceModal from '../components/AddPlaceModal';

export default function Profile() {
  const { role, setRole, places, savedPlaceIds, reviews } = useAppContext();
  const navigate = useNavigate();
  const [showAddPlace, setShowAddPlace] = useState(false);

  const ownedPlaces = places.filter(p => p.ownerId === 'merchant_1');
  const savedPlaces = places.filter(p => savedPlaceIds.includes(p.id));

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full overflow-y-auto no-scrollbar bg-slate-50 pb-32"
    >
      <div className="pt-16 px-6 pb-6 text-center relative bg-white border-b border-slate-100 shadow-sm rounded-b-[40px] z-10">
        <button className="absolute top-12 right-6 text-slate-400 hover:text-slate-900 transition-colors"><Settings size={24}/></button>
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-100 to-purple-100 rounded-[32px] mx-auto mb-4 p-1 shadow-sm rotate-3">
          <div className="w-full h-full bg-white rounded-[28px] -rotate-3 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="avatar" className="w-full h-full object-cover p-2"/>
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hùng Nguyễn</h2>
        <p className="text-slate-500 font-medium text-sm mt-1 mb-6">Explorer Level 12</p>

        {/* Role Switcher */}
        <div className="flex items-center justify-between bg-slate-100 p-1 rounded-2xl mb-6 mx-auto max-w-[300px]">
          <button 
            onClick={() => setRole('user')} 
            className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all", role === 'user' ? "bg-white shadow-sm text-indigo-600" : "text-slate-500 hover:text-slate-700")}
          >
            Người dùng
          </button>
          <button 
            onClick={() => setRole('merchant')} 
            className={cn("flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5", role === 'merchant' ? "bg-white shadow-sm text-rose-600" : "text-slate-500 hover:text-slate-700")}
          >
            <Store size={14} /> Đối tác
          </button>
        </div>

        {role === 'user' && (
          <div className="flex justify-center gap-8 mb-2">
             <div className="flex flex-col items-center">
               <span className="font-black text-xl text-slate-900">{savedPlaces.length}</span>
               <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Đã lưu</span>
             </div>
             <div className="w-[1px] h-10 bg-slate-100"></div>
             <div className="flex flex-col items-center">
               <span className="font-black text-xl text-slate-900">{reviews.length}</span>
               <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Đánh giá</span>
             </div>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        
        {role === 'merchant' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-lg text-slate-900">Quản lý địa điểm</h3>
               <button 
                  onClick={() => setShowAddPlace(true)}
                  className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1"
               >
                 <Plus size={14} /> Thêm mới
               </button>
            </div>
            
            {ownedPlaces.length === 0 ? (
               <div className="bg-white p-6 rounded-3xl border border-dashed border-slate-300 text-center text-slate-500 text-sm font-medium">
                 Bạn chưa có địa điểm nào. Bạn có thể thêm nhà hàng, khách sạn hoặc dịch vụ của mình.
               </div>
            ) : (
               <div className="space-y-4">
                 {ownedPlaces.map(p => (
                   <div key={p.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-slate-100 cursor-pointer hover:border-rose-100 transition-colors" onClick={() => navigate(`/place/${p.id}`)}>
                     <div className={cn("w-16 h-16 rounded-xl", p.imageClass)}></div>
                     <div className="flex-1 overflow-hidden">
                       <h4 className="font-bold text-slate-900 text-sm truncate">{p.title}</h4>
                       <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                         <Star size={12} className="text-yellow-500 fill-yellow-500" /> {p.rating} ({p.reviewsCount} rev)
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {role === 'user' && savedPlaces.length > 0 && (
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-4">Đã lưu gần đây</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
              {savedPlaces.map(p => (
                <div key={p.id} onClick={() => navigate(`/place/${p.id}`)} className="min-w-[140px] bg-white p-2 rounded-[20px] shadow-sm border border-slate-100 cursor-pointer">
                  <div className={cn("w-full h-24 rounded-2xl mb-2", p.imageClass)}></div>
                  <h4 className="font-bold text-slate-900 text-xs px-1 truncate">{p.title}</h4>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="font-bold text-lg text-slate-900 mb-4">Tài khoản</h3>
          <div className="space-y-3">
            {[
              { icon: <User size={18}/>, label: "Chỉnh sửa hồ sơ", action: () => alert("Chức năng đang phát triển") },
              { icon: <Bell size={18}/>, label: "Thông báo", badge: "2", action: () => alert("Bạn có 2 thông báo mới!") },
              { icon: <ShieldCheck size={18}/>, label: "Quyền riêng tư", action: () => alert("Cài đặt quyền riêng tư") },
            ].map((item, i) => (
              <div key={i} onClick={item.action} className="bg-white px-5 py-4 rounded-[20px] flex justify-between items-center shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-100 transition-colors active:scale-95 duration-200">
                <div className="flex items-center gap-3 text-slate-700 font-medium text-sm">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">{item.icon}</div>
                  {item.label}
                </div>
                {item.badge ? (
                   <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">{item.badge}</div>
                ) : (
                   <div className="text-slate-300 font-black px-2">&rsaquo;</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <button 
          onClick={() => {
            alert("Đã đăng xuất thành công!");
            navigate('/');
          }}
          className="w-full mt-6 py-4 rounded-2xl text-rose-500 font-bold bg-white border border-rose-100 shadow-sm active:bg-rose-50 transition-colors text-sm"
        >
          Đăng xuất
        </button>
      </div>

      {showAddPlace && <AddPlaceModal onClose={() => setShowAddPlace(false)} />}
    </motion.div>
  );
}
