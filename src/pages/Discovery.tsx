import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Sparkles, MapPin, Star, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { cn } from '../App';

const CATEGORIES = ["Tất cả", "Thiên nhiên", "Bãi biển", "Thành phố", "Nghỉ dưỡng", "Văn hóa"];

export default function Discovery() {
  const { places } = useAppContext();
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filteredPlaces = places.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.tag.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === "Tất cả" || p.tag.includes(activeCategory);
    return matchesSearch && matchesCat;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full overflow-y-auto no-scrollbar pb-32 bg-white"
    >
      <div className="relative pt-12 pb-6 px-6">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-[32px] font-black text-slate-900 tracking-tight">Khám phá</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Trải nghiệm thiết kế riêng cho bạn</p>
          </div>
          <div 
            onClick={() => navigate('/profile')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-100 shadow-sm relative cursor-pointer hover:shadow-md transition-all">
            <User className="text-slate-600" size={22} />
            <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full"></div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input 
            type="text" 
            placeholder="Tìm kiếm điểm đến, nhà hàng, khách sạn..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-[20px] shadow-soft focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm font-semibold transition-all placeholder:font-medium"
          />
        </div>

        {/* Hero Card */}
        {search === "" && places.length > 0 && (
          <div 
            onClick={() => navigate(`/place/${places[0].id}`)}
            className="relative w-full h-80 rounded-[32px] overflow-hidden mb-8 shadow-soft cursor-pointer group"
          >
            <div className={cn("absolute inset-0 opacity-90 transition-transform duration-700 group-hover:scale-105", places[0].imageClass)}></div>
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-500" />
            <div className="absolute top-4 left-4 frosted-glass-dark px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Sparkles className="text-yellow-400" size={14} />
              <span className="text-white text-xs font-bold tracking-wide">Lựa chọn hàng tuần</span>
            </div>
            <div className="absolute bottom-0 left-0 p-6 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <h2 className="text-3xl font-black text-white leading-tight mb-2">{places[0].title}</h2>
              <div className="flex items-center gap-3 text-white/90 text-sm font-medium">
                <span className="flex items-center gap-1.5"><MapPin size={16} className="text-indigo-300" /> {places[0].location.split(',')[0]}</span>
                <span className="flex items-center gap-1.5"><Star size={16} className="text-yellow-400 fill-yellow-400" /> {places[0].rating}</span>
              </div>
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 -mx-6 px-6">
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300",
                activeCategory === cat 
                  ? "bg-slate-900 text-white shadow-soft" 
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Recommendations */}
        <div>
          <div className="flex justify-between items-end mb-5">
            <h3 className="font-bold text-slate-900 text-xl tracking-tight">
              {search ? 'Kết quả tìm kiếm' : 'Gợi ý cho bạn'}
            </h3>
          </div>
          
          <div className="flex flex-col gap-5">
            {filteredPlaces.length === 0 && (
               <div className="text-center py-10 text-slate-500 font-medium text-sm">Không tìm thấy địa điểm nào.</div>
            )}
            {filteredPlaces.map((item, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={item.id} 
                onClick={() => navigate(`/place/${item.id}`)}
                className="bg-white rounded-[28px] p-2 pr-4 shadow-soft border border-slate-100 flex gap-4 group cursor-pointer hover:border-indigo-100 transition-all hover:shadow-md"
              >
                <div className={cn("w-28 h-36 rounded-[22px] flex-shrink-0 relative overflow-hidden", item.imageClass)}>
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star size={10} className="text-yellow-500 fill-yellow-500" />
                    <span className="text-[10px] font-bold">{item.rating}</span>
                  </div>
                </div>
                
                <div className="py-2 flex flex-col justify-center flex-1 overflow-hidden">
                  <div className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider mb-1 truncate">{item.tag}</div>
                  <h4 className="font-bold text-slate-900 text-base leading-tight mb-1 group-hover:text-indigo-600 transition-colors truncate">{item.title}</h4>
                  <div className="text-xs text-slate-500 font-medium mb-3">{item.reviewsCount} đánh giá</div>
                  
                  <div className="space-y-1.5">
                    {item.reasons.slice(0, 2).map((reason, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                        <span className="truncate">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
