import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Navigation, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

export default function Planner() {
  const navigate = useNavigate();
  const { trips } = useAppContext();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto no-scrollbar bg-slate-50 pb-32"
    >
      <div className="px-6 pt-12 pb-6">
        <header className="mb-8">
          <h1 className="text-[32px] font-black text-slate-900 tracking-tight">Kế hoạch</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Quản lý chuyến đi của bạn</p>
        </header>
        
        {/* Empty State / Create New */}
        <div 
          onClick={() => navigate('/plan/new')}
          className="relative bg-white p-8 rounded-[32px] shadow-soft border border-indigo-50 flex flex-col items-center justify-center text-center overflow-hidden mb-8 group cursor-pointer hover:border-indigo-100 transition-colors"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl group-hover:bg-indigo-100 transition-colors duration-500"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-50 rounded-full blur-3xl group-hover:bg-blue-100 transition-colors duration-500"></div>
          
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 relative z-10 text-indigo-600 shadow-sm border border-indigo-100 group-hover:scale-110 transition-transform duration-500">
            <Sparkles size={32} />
          </div>
          
          <h3 className="font-bold text-slate-900 text-xl mb-3 relative z-10">Tạo hành trình mới</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-[220px] leading-relaxed relative z-10 font-medium">
            AI sẽ tự động sinh lịch trình cá nhân hóa từng giờ dựa trên sở thích của bạn.
          </p>
          
          <button className="relative z-10 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm w-full transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 active:scale-95 duration-200">
            <Sparkles size={16} /> 
            Lập kế hoạch với AI
          </button>
        </div>

        {/* Existing Trips */}
        <div>
          <h3 className="font-bold text-slate-900 text-xl mb-5 tracking-tight">Chuyến đi của tôi</h3>
          <div className="space-y-4">
            {trips.length === 0 && <p className="text-slate-500 text-sm">Chưa có chuyến đi nào.</p>}
            {trips.map((trip, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={trip.id} 
                onClick={() => navigate(`/plan/detail/${trip.id}`)}
                className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer hover:border-indigo-200 transition-all hover:shadow-md"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-[16px] flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <Navigation size={20} className="group-hover:rotate-45 transition-transform duration-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1 truncate max-w-[150px]">{trip.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{trip.date}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ArrowRight size={14} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
