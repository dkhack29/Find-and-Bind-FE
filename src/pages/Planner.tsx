import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Navigation, ArrowRight, Eye, Calendar, MapPin, Layers, 
  Globe, Lock, Copy, Compass, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext, Trip } from '../context/AppContext';
import { itineraryService } from '@/services/itinerary/itineraryApi';
import type { ItineraryListDto } from '@/services/itinerary/itineraryType';
import { cn } from '../App';
import ItineraryDetailModal from '../components/planner/ItineraryDetailModal';

export default function Planner() {
  const navigate = useNavigate();
  const { trips, user, refreshTrips, clonePublishedTrip, showToast } = useAppContext();
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'my' | 'public'>('my');
  const [publishedList, setPublishedList] = useState<ItineraryListDto[]>([]);
  const [isLoadingPublished, setIsLoadingPublished] = useState(false);
  const [cloningId, setCloningId] = useState<number | null>(null);

  // Deduplicate trips to guarantee no duplicate cards ever appear
  const uniqueTrips = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Trip[] = [];
    for (const t of trips) {
      const cleanLoc = (t.location || t.name).toLowerCase().replace(/^(khám phá|lịch trình)\s*/i, '').trim();
      const key = `${cleanLoc}_${t.days}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(t);
      }
    }
    return result;
  }, [trips]);

  useEffect(() => {
    if (user?.loggedIn) {
      refreshTrips();
    }
  }, [user?.loggedIn]);

  const loadPublished = async () => {
    setIsLoadingPublished(true);
    try {
      const res = await itineraryService.getPublishedList({ pageIndex: 1, pageSize: 20 });
      if (res?.data && Array.isArray(res.data)) {
        setPublishedList(res.data);
      }
    } catch (err) {
      console.warn('Load published itineraries error:', err);
    } finally {
      setIsLoadingPublished(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'public') {
      loadPublished();
    }
  }, [activeTab]);

  const handleOpenPublishedDetail = async (tpl: ItineraryListDto) => {
    try {
      const res = await itineraryService.getPublishedDetail(tpl.id);
      if (res?.data) {
        const detail = res.data;
        const mappedTrip: Trip = {
          id: detail.id,
          name: detail.title,
          date: detail.startDate ? new Date(detail.startDate).toLocaleDateString('vi-VN') : 'Sắp tới',
          location: detail.title.replace(/^Khám phá\s*/i, '').replace(/^Lịch trình\s*/i, '') || 'Việt Nam',
          status: 'Công khai',
          days: tpl.totalDays || 3,
          isPublished: true,
          itinerary: detail.itinerary && detail.itinerary.length > 0 ? detail.itinerary.map(d => ({
            day: d.day,
            title: `Ngày ${d.day}`,
            activities: d.activities.map(act => ({
              time: act.time,
              location: act.location,
              description: act.description,
              matchedLocationId: act.matchedLocationId,
              isVerified: act.isVerified
            }))
          })) : [
            {
              day: 1,
              title: 'Lộ trình mẫu',
              activities: (detail.details || []).map(dt => ({
                time: dt.plannedTime || '08:00',
                location: dt.locationName || dt.unverifiedLocationName || 'Điểm tham quan',
                description: dt.notes || 'Tham quan và khám phá',
                matchedLocationId: dt.locationId,
                isVerified: dt.isVerified ?? !!dt.locationId
              }))
            }
          ]
        };
        setSelectedTrip(mappedTrip);
        return;
      }
    } catch (err) {
      console.warn('Fetch published detail error, using summary fallback:', err);
    }

    // Fallback if detail fetch fails
    setSelectedTrip({
      id: tpl.id,
      name: tpl.title,
      date: tpl.startDate ? new Date(tpl.startDate).toLocaleDateString('vi-VN') : 'Mẫu có sẵn',
      location: tpl.title.replace(/^Khám phá\s*/i, '') || 'Việt Nam',
      status: 'Công khai',
      days: tpl.totalDays || 3,
      isPublished: true,
      itinerary: [
        {
          day: 1,
          title: 'Ngày 1: Khám phá',
          activities: [
            { time: '08:30', location: tpl.title, description: 'Bắt đầu lịch trình mẫu', isVerified: true }
          ]
        }
      ]
    });
  };

  const handleDirectClone = async (e: React.MouseEvent, tplId: number) => {
    e.stopPropagation();
    if (!user?.loggedIn) {
      showToast("Vui lòng đăng nhập tại trang Cá nhân trước khi sao chép lịch trình mẫu!", "warning");
      navigate('/profile');
      return;
    }
    setCloningId(tplId);
    try {
      await clonePublishedTrip(tplId);
      showToast("Đã sao chép lịch trình mẫu vào danh sách Chuyến đi của bạn!", "success");
      setActiveTab('my');
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Sao chép lịch trình thất bại!", "error");
    } finally {
      setCloningId(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-full overflow-y-auto no-scrollbar bg-slate-50 pb-32"
    >
      <div className="px-6 pt-12 pb-6">
        <header className="mb-6">
          <h1 className="text-[32px] font-black text-slate-900 tracking-tight">Kế hoạch</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Quản lý và khám phá lịch trình du lịch thông minh</p>
        </header>

        {/* Tab Switcher: Chuyến đi của tôi vs Kho mẫu cộng đồng */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('my')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === 'my'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <span>Chuyến đi của tôi</span>
            <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[10px] rounded-full font-black">
              {trips.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('public')}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
              activeTab === 'public'
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Globe size={13} className="text-emerald-600" />
            <span>Kho mẫu cộng đồng</span>
            <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[10px] rounded-full font-black">
              Phổ biến
            </span>
          </button>
        </div>

        {!user?.loggedIn && activeTab === 'my' && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6 flex justify-between items-center">
            <div>
              <h4 className="font-bold text-xs text-indigo-900">Chưa đăng nhập</h4>
              <p className="text-[11px] text-indigo-600 font-medium">Đăng nhập để tự động đồng bộ lịch trình lên đám mây.</p>
            </div>
            <button 
              onClick={() => navigate('/profile?redirect=/plan')} 
              className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shrink-0 active:scale-95 shadow-sm cursor-pointer"
            >
              Đăng nhập
            </button>
          </div>
        )}
        
        {/* Empty State / Create New with AI */}
        {activeTab === 'my' && (
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
        )}

        {/* Tab 1: Chuyến đi của tôi */}
        {activeTab === 'my' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight">Chuyến đi của bạn</h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {uniqueTrips.length} chuyến đi
              </span>
            </div>

            <div className="space-y-4">
              {uniqueTrips.length === 0 && (
                <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 text-sm">
                  Chưa có chuyến đi nào. Hãy tạo lịch trình mới với AI ngay!
                </div>
              )}

              {uniqueTrips.map((trip, idx) => {
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
                          <div className="flex items-center gap-1.5 mb-1">
                            <h4 className="font-bold text-slate-900 text-base truncate group-hover:text-indigo-600 transition-colors">
                              {trip.name}
                            </h4>
                            {trip.isPublished ? (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                <Globe size={9} /> Công khai
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-black uppercase px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                <Lock size={9} /> Riêng tư
                              </span>
                            )}
                          </div>
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
                          <span>Xem chi tiết</span>
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
        )}

        {/* Tab 2: Kho lịch trình mẫu cộng đồng (Redis Cached) */}
        {activeTab === 'public' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                  <Globe size={18} className="text-emerald-600" />
                  Kho mẫu công khai
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Được cộng đồng chia sẻ, lưu đệm Redis phản hồi siêu tốc</p>
              </div>

              <button
                onClick={loadPublished}
                disabled={isLoadingPublished}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Làm mới kho mẫu"
              >
                <RefreshCw size={14} className={cn(isLoadingPublished && "animate-spin")} />
              </button>
            </div>

            {isLoadingPublished && (
              <div className="py-12 text-center text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                <RefreshCw size={20} className="animate-spin text-indigo-600" />
                <span>Đang tải các lịch trình mẫu từ Redis Cache...</span>
              </div>
            )}

            {!isLoadingPublished && publishedList.length === 0 && (
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Globe size={24} />
                </div>
                <h4 className="font-black text-slate-900 text-base mb-1">Chưa có lịch trình công khai nào</h4>
                <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-xs mx-auto mb-4">
                  Bạn có thể tạo lịch trình bằng AI và bấm "Công khai" để trở thành người đầu tiên chia sẻ cho cộng đồng!
                </p>
                <button
                  onClick={() => setActiveTab('my')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  Xem chuyến đi của tôi
                </button>
              </div>
            )}

            {!isLoadingPublished && publishedList.length > 0 && (
              <div className="space-y-4">
                {publishedList.map((tpl, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    key={tpl.id}
                    className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-emerald-200 transition-all hover:shadow-md text-left"
                  >
                    <div 
                      onClick={() => handleOpenPublishedDetail(tpl)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9.5px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Globe size={10} /> Mẫu công khai
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {tpl.createdAt ? new Date(tpl.createdAt).toLocaleDateString('vi-VN') : ''}
                        </span>
                      </div>

                      <h4 className="font-black text-slate-900 text-base leading-snug group-hover:text-emerald-700 transition-colors">
                        {tpl.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {tpl.totalDays} ngày
                        </span>
                        <span>•</span>
                        <span>{tpl.totalActivities} hoạt động</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-emerald-600">
                        ✓ Bản mẫu đã tối ưu
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenPublishedDetail(tpl)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>Xem chi tiết</span>
                        </button>

                        <button
                          disabled={cloningId === tpl.id}
                          onClick={(e) => handleDirectClone(e, tpl.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs shadow-emerald-700/20"
                        >
                          <Copy size={12} />
                          <span>{cloningId === tpl.id ? 'Đang chép...' : 'Sao chép'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
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

