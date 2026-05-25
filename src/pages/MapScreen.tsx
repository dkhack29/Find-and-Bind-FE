import React from 'react';
import { motion } from 'motion/react';
import { Star, Heart, Search, SlidersHorizontal, MapPin } from 'lucide-react';

export default function MapScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="h-full relative bg-slate-200 overflow-hidden"
    >
      {/* Fake Map Background using CSS pattern */}
      <div 
        className="absolute inset-0 z-0 bg-[#e5e7eb]"
        style={{
          backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      >
        {/* Fake roads */}
        <div className="absolute top-1/2 left-0 w-full h-4 bg-white/60 -rotate-12 transform origin-left"></div>
        <div className="absolute top-0 left-1/3 w-6 h-full bg-white/60 rotate-12 transform origin-top"></div>
        
        {/* Fake Pins */}
        <div className="absolute top-1/4 left-1/4 animate-bounce hover:scale-110 transition-transform cursor-pointer">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-600/40 relative">
             <Star size={18} className="fill-white"/>
             <div className="absolute -bottom-1 w-2 h-2 bg-indigo-600 rotate-45"></div>
          </div>
        </div>

        <div className="absolute top-[40%] right-1/4 hover:scale-110 transition-transform cursor-pointer">
          <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-rose-500/40 relative">
             <Heart size={16} className="fill-white"/>
             <div className="absolute -bottom-1 w-2 h-2 bg-rose-500 rotate-45"></div>
          </div>
        </div>
      </div>

      {/* Top Search Bar Overlay */}
      <div className="absolute top-12 left-6 right-6 z-10">
        <div className="bg-white h-14 rounded-full shadow-lg shadow-black/5 flex items-center px-4 gap-3 border border-slate-100">
           <Search size={20} className="text-slate-400" />
           <input type="text" placeholder="Tìm kiếm trên bản đồ..." className="flex-1 bg-transparent outline-none text-slate-800 font-medium placeholder-slate-400" />
           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer">
             <SlidersHorizontal size={14} />
           </div>
        </div>
        
        {/* Filters */}
        <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pointer-events-auto pb-2">
          {["Nhà hàng", "Khách sạn", "Vui chơi", "Cảnh đẹp"].map((filter, i) => (
             <button key={i} className="px-4 py-2 bg-white rounded-full text-xs font-bold text-slate-700 shadow-sm border border-slate-100 whitespace-nowrap active:bg-slate-50 transition-colors">
               {filter}
             </button>
          ))}
        </div>
      </div>

      {/* Bottom Drawer Peek */}
      <div className="absolute bottom-28 left-6 right-6 z-10">
        <div className="bg-white p-4 rounded-3xl shadow-xl shadow-black/10 border border-slate-100 flex gap-4 cursor-pointer hover:border-indigo-100 transition-colors">
           <div className="w-20 h-20 rounded-2xl bg-gradient-nature bg-cover bg-center"></div>
           <div className="flex-1 py-1">
             <div className="text-[10px] font-bold uppercase text-indigo-600 mb-1">Thiên nhiên</div>
             <h4 className="font-bold text-slate-900 leading-tight mb-1">Vịnh Hạ Long</h4>
             <div className="flex items-center gap-1 text-xs font-medium text-slate-500"><MapPin size={12}/> Cách đây 2.4km</div>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
