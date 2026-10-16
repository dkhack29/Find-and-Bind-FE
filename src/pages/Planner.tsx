import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Navigation, ArrowRight, Eye, Calendar, MapPin, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, Trip } from '../context/AppContext';
import { itineraryService } from '@/services/itinerary/itineraryApi';
import ItineraryDetailModal from '../components/planner/ItineraryDetailModal';

export default function Planner() {
  const navigate = useNavigate();
  const { trips, user, refreshTrips } = useAppContext();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  useEffect(() => {
    if (user?.loggedIn) {
      refreshTrips();
    }
  }, [user?.loggedIn]);

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
          <p className="text-sm text-slate-500 font-medium mt-1">Quản lý và theo dõi lịch trình chuyến đi</p>
        </header>

        {!user?.loggedIn && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-xs text-indigo-900">Chưa đăng nhập</h4>
              <p className="text-[11px] text-indigo-600 font-medium">Đăng nhập để tự động đồng bộ lịch trình lên đám mây.</p>
            </div>
            <button 
              onClick={() => navigate('/profile')} 
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shrink-0 active:scale-95 shadow-sm cursor-pointer"
            >
              Đăng nhập
            </button>
          </div>
        )}
        
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
          
          <button className="relative z-10 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-sm w-full transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20 active:scale-95 duration-200 cursor-pointer">
            <Sparkles size={16} /> 
            Lập kế hoạch với AI
          </button>
        </div>

        {/* Existing Trips */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-slate-900 text-xl tracking-tight">Chuyến đi của tôi</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {trips.length} chuyến đi
            </span>
          </div>

          <div className="space-y-4">
            {trips.length === 0 && (
              <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                Chưa có chuyến đi nào. Hãy tạo lịch trình mới với AI ngay!
              </div>
            )}

            {trips.map((trip, idx) => {
              const totalActs = (trip.itinerary || []).reduce((acc, d) => {
                return acc + (d.activities?.length || d.items?.length || 0);
              }, 0);

              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  key={trip.id} 
                  className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-indigo-200 transition-all hover:shadow-md text-left"
                >
                  <div className="flex gap-4 items-center justify-between">
                    <div 
                      onClick={() => setSelectedTrip(trip)}
                      className="flex gap-3.5 items-center flex-1 cursor-pointer min-w-0"
                    >
                      <div className="w-12 h-12 bg-slate-50 rounded-[16px] flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                        <Navigation size={20} className="group-hover:rotate-45 transition-transform duration-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-900 text-base mb-0.5 truncate group-hover:text-indigo-600 transition-colors">
                          {trip.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" /> {trip.date}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" /> {trip.location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar on Card */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-400">
                      {trip.days} ngày • {totalActs} hoạt động
                    </span>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTrip(trip)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:scale-95 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Xem chi tiết (Popup)</span>
                      </button>

                      <button
                        onClick={() => navigate(`/plan/detail/${trip.id}`)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl transition-colors cursor-pointer"
                        title="Trang quản lý chi tiết"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Itinerary Detail Popup Modal */}
      <AnimatePresence>
        {selectedTrip && (
          <ItineraryDetailModal
            isOpen={!!selectedTrip}
            onClose={() => setSelectedTrip(null)}
            trip={selectedTrip}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

